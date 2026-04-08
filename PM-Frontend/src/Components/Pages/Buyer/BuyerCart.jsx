import React, { useState, useEffect } from "react";
import BuyerLayout from "./BuyerLayout";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "../../../api/apiConfig";
import { placeholderMedium } from "../../../utils/placeholders";
import { getImageUrl, fetchProtectedUrl } from "../../../utils/imageUrl";
import {
  getLocalCart,
  removeFromLocalCart,
  clearLocalCart,
  getLocalPurchases,
  addLocalPurchase,
  getLocalWalletBalance,
  isApiAvailable,
  disableApi,
  enableApi,
} from "../../../utils/localStore";

const API = API_BASE_URL;

const BuyerCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [mpesaProcessing, setMpesaProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [checkoutPreviewItems, setCheckoutPreviewItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [mpesaStatus, setMpesaStatus] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [pollingInterval, setPollingInterval] = useState(null);
  const [cartImageUrls, setCartImageUrls] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    enableApi("mpesa");
  }, []);

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^254\d{9}$/;
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(phone)) {
      setPhoneError('Please enter a valid Kenyan phone number (254XXXXXXXXX)');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.startsWith('0')) {
      value = '254' + value.substring(1);
    } else if (value.length > 0 && !value.startsWith('254')) {
      value = '254' + value;
    }
    setMpesaPhone(value);
    if (value.length >= 12) {
      validatePhoneNumber(value);
    } else {
      setPhoneError('');
    }
  };

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id || user._id;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Get media ID from cart item
  const getMediaIdFromItem = (item) => {
    if (!item) return null;
    if (item.media && typeof item.media === 'object' && item.media._id) return item.media._id;
    if (item.media && typeof item.media === 'string') return item.media;
    if (item.mediaId) return item.mediaId;
    if (item._id) return item._id;
    return null;
  };

  // Get image URL for cart item
  const getCartItemImage = (item) => {
    const mediaId = getMediaIdFromItem(item);
    
    // If we have a preloaded URL, use it
    if (mediaId && cartImageUrls[mediaId]) {
      return cartImageUrls[mediaId];
    }
    
    // Try to get image from the item directly
    const mediaObj = item.media || item;
    
    // Try different possible image fields
    if (mediaObj.thumbnail) return mediaObj.thumbnail;
    if (mediaObj.thumbnailUrl) return mediaObj.thumbnailUrl;
    if (mediaObj.image) return mediaObj.image;
    if (mediaObj.imageUrl) return mediaObj.imageUrl;
    if (mediaObj.fileUrl) return getImageUrl(mediaObj, null);
    
    return placeholderMedium;
  };

  // Preload images for cart items
  const preloadCartImages = async (items) => {
    const urlMap = {};
    
    for (const item of items) {
      const mediaId = getMediaIdFromItem(item);
      if (!mediaId) continue;
      
      try {
        // Try to get image from the item first
        const mediaObj = item.media || item;
        let imageUrl = null;
        
        // Check if item already has image URL
        if (mediaObj.thumbnail) imageUrl = mediaObj.thumbnail;
        else if (mediaObj.thumbnailUrl) imageUrl = mediaObj.thumbnailUrl;
        else if (mediaObj.image) imageUrl = mediaObj.image;
        else if (mediaObj.imageUrl) imageUrl = mediaObj.imageUrl;
        else if (mediaObj.fileUrl) imageUrl = getImageUrl(mediaObj, null);
        
        // If no valid URL, try to fetch protected URL
        if (!imageUrl || imageUrl === placeholderMedium || !imageUrl.startsWith('http')) {
          const protectedUrl = await fetchProtectedUrl(mediaId, { userId, token });
          if (protectedUrl && protectedUrl.startsWith('http')) {
            imageUrl = protectedUrl;
          }
        }
        
        urlMap[mediaId] = imageUrl || placeholderMedium;
        console.log(`Loaded image for media ${mediaId}:`, urlMap[mediaId]);
      } catch (err) {
        console.warn(`Failed to load image for ${mediaId}:`, err);
        urlMap[mediaId] = placeholderMedium;
      }
    }
    
    setCartImageUrls(urlMap);
  };

  const resolvePhotographerName = (photographer) => {
    if (!photographer) return "Unknown Photographer";
    if (typeof photographer === "string") return photographer;
    if (typeof photographer === "object") {
      return photographer.username || photographer.name || photographer.fullName || photographer.email || "Unknown Photographer";
    }
    return String(photographer);
  };

  const getMediaFromCartItem = (item) => {
    if (!item) return null;
    if (item.media && typeof item.media === 'object') return item.media;
    return item;
  };

  const downloadPurchasedItems = async (items = cartItems) => {
    if (!items || items.length === 0) return;
    try {
      for (const item of items) {
        const mediaId = getMediaIdFromItem(item);
        if (!mediaId) continue;
        const downloadUrl = await fetchProtectedUrl(mediaId);
        if (!downloadUrl) continue;
        const response = await fetch(downloadUrl);
        if (!response.ok) continue;
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const media = getMediaFromCartItem(item);
        const filename = media?.filename || media?.originalName || `download_${mediaId}.jpg`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error("Error during auto-download:", error);
    }
  };

  useEffect(() => {
    if (!token || !userId) {
      navigate("/login");
      return;
    }
    fetchCart();
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);

  const fetchCart = async () => {
    const cartFeature = "cart";
    const walletFeature = "wallet";

    try {
      setLoading(true);
      if (!isApiAvailable(cartFeature)) {
        const localCart = getLocalCart();
        setCartItems(localCart);
        await preloadCartImages(localCart);
      } else {
        try {
          const res = await axios.get(`${API}/payments/cart/${userId}`, { headers, timeout: 10000 });
          let cartData = [];
          if (Array.isArray(res.data)) cartData = res.data;
          else if (res.data?.items && Array.isArray(res.data.items)) cartData = res.data.items;
          else if (res.data?.cart && Array.isArray(res.data.cart)) cartData = res.data.cart;
          else if (res.data?.data && Array.isArray(res.data.data)) cartData = res.data.data;
          setCartItems(Array.isArray(cartData) ? cartData : []);
          await preloadCartImages(cartData);
        } catch (err) {
          if (err.response?.status === 404 || err.response?.status === 400) {
            disableApi(cartFeature);
            const localCart = getLocalCart();
            setCartItems(localCart);
            await preloadCartImages(localCart);
            setError("Using offline cart (backend API not available)");
          } else {
            throw err;
          }
        }
      }

      if (!isApiAvailable(walletFeature)) {
        setWalletBalance(getLocalWalletBalance());
      } else {
        try {
          const walletRes = await axios.get(`${API}/payments/wallet/${userId}`, { headers, timeout: 5000 });
          let balance = 0;
          if (typeof walletRes.data === 'number') balance = walletRes.data;
          else if (walletRes.data?.balance !== undefined) balance = walletRes.data.balance;
          else if (walletRes.data?.amount !== undefined) balance = walletRes.data.amount;
          else if (walletRes.data?.data && typeof walletRes.data.data === 'number') balance = walletRes.data.data;
          setWalletBalance(balance || 0);
        } catch (walletErr) {
          if (walletErr.response?.status === 404 || walletErr.response?.status === 400) {
            disableApi(walletFeature);
            setWalletBalance(getLocalWalletBalance());
          }
        }
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      } else {
        setError("Failed to load cart items");
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (mediaId) => {
    const feature = "cart";
    try {
      setUpdating(true);
      if (!isApiAvailable(feature)) {
        removeFromLocalCart(mediaId);
        const updatedCart = getLocalCart();
        setCartItems(updatedCart);
        await preloadCartImages(updatedCart);
        return;
      }
      await axios.post(`${API}/payments/cart/remove`, { userId, mediaId }, { headers });
      await fetchCart();
    } catch (err) {
      const status = err.response?.status;
      if (status === 404 || status === 400) {
        disableApi(feature);
        removeFromLocalCart(mediaId);
        const updatedCart = getLocalCart();
        setCartItems(updatedCart);
        await preloadCartImages(updatedCart);
      } else {
        setError("Failed to remove item");
      }
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    if (!window.confirm("Clear your cart?")) return;
    const feature = "cart";
    try {
      setUpdating(true);
      if (!isApiAvailable(feature)) {
        clearLocalCart();
        setCartItems([]);
        setCartImageUrls({});
        return;
      }
      await axios.delete(`${API}/payments/cart/${userId}`, { headers });
      setCartItems([]);
      setCartImageUrls({});
    } catch (err) {
      const status = err.response?.status;
      if (status === 404 || status === 400) {
        disableApi(feature);
        clearLocalCart();
        setCartItems([]);
        setCartImageUrls({});
      } else {
        setError("Failed to clear cart");
      }
    } finally {
      setUpdating(false);
    }
  };

  const pollPaymentStatus = async (paymentId, timeoutMs = 120000, intervalMs = 3000) => {
    if (!paymentId) throw new Error("Missing payment ID for polling");
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const statusRes = await axios.get(`${API}/payments/${paymentId}`, { headers, timeout: 30000 });
        const status = statusRes.data?.status;
        console.log(`Payment status: ${status} for payment ${paymentId}`);
        if (status === "completed") {
          return statusRes.data;
        }
        if (status === "failed") {
          throw new Error("Payment failed on the server");
        }
      } catch (statusErr) {
        if (statusErr.response?.status === 404) {
          console.log("Payment not found yet, continuing to poll...");
        } else {
          console.warn("Poll payment status error", statusErr);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error("Payment confirmation timed out. Please check your purchase history.");
  };

  const handleMpesaCheckout = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    const normalizePhone = (raw) => {
      let sanitized = String(raw || "").trim();
      sanitized = sanitized.replace(/\D/g, "");
      if (sanitized.startsWith("0")) sanitized = "254" + sanitized.slice(1);
      if (sanitized.startsWith("+")) sanitized = sanitized.replace(/^\+/, "");
      if (!sanitized.startsWith("254") && sanitized.length === 9) sanitized = "254" + sanitized;
      return sanitized;
    };

    const normalizedPhone = normalizePhone(mpesaPhone);
    if (!validatePhoneNumber(normalizedPhone)) {
      return;
    }

    const feature = "mpesa";
    if (!isApiAvailable(feature)) {
      alert("M-Pesa payment is not available on this backend.");
      return;
    }

    try {
      setMpesaProcessing(true);
      setMpesaStatus('sending');
      setCheckoutPreviewItems(cartItems);
      setCheckoutStep('processing');

      const cartPayload = cartItems
        .map((item) => {
          const mediaId = getMediaIdFromItem(item);
          if (!mediaId) return null;
          return {
            mediaId,
            price: item.price || 0,
            title: item.title || item.media?.title || 'Item'
          };
        })
        .filter(Boolean);

      if (cartPayload.length === 0) {
        throw new Error('No valid cart items to purchase');
      }

      const totalAmount = cartPayload.reduce((sum, item) => sum + Number(item.price || 0), 0);

      const mpesaResponse = await axios.post(`${API}/payments/mpesa`, {
        buyerId: userId,
        buyerPhone: normalizedPhone,
        amount: totalAmount,
        cart: cartPayload,
      }, { headers });

      const paymentId = mpesaResponse.data?.payment?._id;
      if (!paymentId) {
        throw new Error('No payment ID returned from M-Pesa initiation');
      }

      console.log(`Payment initiated. Payment ID: ${paymentId}`);
      setMpesaStatus('sent');
      setCheckoutStep('processing');

      const confirmedPayment = await pollPaymentStatus(paymentId);
      
      if (confirmedPayment?.status === 'completed') {
        console.log('Payment confirmed!');
        await clearCart();
        await downloadPurchasedItems(cartItems);
        setCheckoutStep('success');
        setMpesaStatus('completed');
        alert('Payment completed successfully! Your downloads are starting.');
        setMpesaPhone('');
        navigate('/buyer/downloads');
      } else {
        throw new Error('Payment not completed');
      }

    } catch (err) {
      console.error('MPesa checkout error:', err.response?.data || err.message || err);
      setMpesaStatus('failed');
      setCheckoutStep('payment');

      if (err.response?.status === 404 || err.response?.status === 400) {
        disableApi(feature);
        setError('M-Pesa payment is not available on this backend. Please use wallet or try again later.');
      } else if (err.message?.includes('timed out') || err.message?.includes('no payment id')) {
        setError('Payment is processing. Please check your purchase history in a few moments.');
      } else {
        setError(err.response?.data?.message || 'Failed to initiate M-Pesa payment. Please try again.');
      }
    } finally {
      setMpesaProcessing(false);
    }
  };

  const handleWalletCheckout = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    const total = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

    if (total > walletBalance) {
      alert("Insufficient wallet balance");
      navigate("/buyer/wallet");
      return;
    }

    const feature = "buy";
    const useApi = isApiAvailable(feature);

    setCheckoutPreviewItems(cartItems);
    setCheckoutStep('processing');

    try {
      setUpdating(true);

      if (useApi) {
        for (const item of cartItems) {
          try {
            await axios.post(API_ENDPOINTS.PAYMENTS.BUY, {
              buyerId: userId,
              mediaId: item.mediaId,
              price: item.price || 0,
            }, { headers });
          } catch (itemErr) {
            console.error("Error buying item:", item.mediaId);
            throw itemErr;
          }
        }
      } else {
        cartItems.forEach((item) => {
          addLocalPurchase({
            mediaId: item.mediaId,
            title: item.title,
            photographerName: item.photographerName,
            price: item.price,
            purchasedAt: new Date().toISOString(),
          });
        });
      }

      await clearCart();
      await downloadPurchasedItems(cartItems);
      setCheckoutStep('success');
      alert("Purchase successful! Your downloads are starting.");
      navigate("/buyer/downloads");
    } catch (err) {
      const status = err.response?.status;
      if (status === 404 || status === 400) {
        disableApi(feature);
        cartItems.forEach((item) => {
          addLocalPurchase({
            mediaId: item.mediaId,
            title: item.title,
            photographerName: item.photographerName,
            price: item.price,
            purchasedAt: new Date().toISOString(),
          });
        });
        await clearCart();
        await downloadPurchasedItems(cartItems);
        setCheckoutStep('success');
        alert("Purchase successful (local fallback)! Your downloads are starting.");
        navigate("/buyer/downloads");
      } else {
        setError(err.response?.data?.message || "Checkout failed");
      }
    } finally {
      setUpdating(false);
    }
  };

  if (!token || !userId) return null;

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const glassStyle = {
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
  };

  return (
    <BuyerLayout>
      <div className="container-fluid px-2 px-sm-3 px-md-4 py-3 py-md-4">
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 mb-md-4 gap-3">
          <div className="flex-grow-1">
            <h1 className="fw-bold text-white mb-1 fs-3 fs-md-2">
              <i className="fas fa-shopping-cart me-2 me-md-3 text-warning"></i>
              Shopping Cart
            </h1>
            <p className="text-white-50 mb-0 small">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          {cartItems.length > 0 && (
            <button
              className="btn btn-outline-danger btn-sm btn-md-lg flex-shrink-0"
              onClick={clearCart}
              disabled={updating}
              style={glassStyle}
            >
              <i className="fas fa-trash me-1 me-md-2"></i>
              <span className="d-none d-sm-inline">Clear Cart</span>
              <span className="d-inline d-sm-none">Clear</span>
            </button>
          )}
        </div>

        {/* Checkout Preview */}
        {(checkoutStep === 'processing' || checkoutStep === 'success') && checkoutPreviewItems.length > 0 && (
          <div className={`alert ${checkoutStep === 'success' ? 'alert-success' : 'alert-info'} d-flex flex-column mb-3 mb-md-4 p-3`} style={glassStyle}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div>
                <strong>{checkoutStep === 'success' ? 'Purchase Completed' : 'Processing Checkout'}</strong>
                <p className="mb-0 small text-white-50">
                  {checkoutStep === 'success'
                    ? 'Your cart purchase has been recorded and is being downloaded.'
                    : mpesaStatus === 'sending' ? 'Sending payment request...' : 'Waiting for payment confirmation...'}
                </p>
              </div>
              <span className={`badge ${checkoutStep === 'success' ? 'bg-success' : 'bg-primary'} text-white`}>
                {checkoutPreviewItems.length} item{checkoutPreviewItems.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="d-flex flex-wrap gap-2 mt-2">
              {checkoutPreviewItems.map((item, index) => {
                const media = getMediaFromCartItem(item);
                return (
                  <div key={item._id || media?._id || index} className="text-center" style={{ width: '72px' }}>
                    <img
                      src={getCartItemImage(item)}
                      alt={media?.title || item.title || `Item ${index + 1}`}
                      className="img-fluid rounded"
                      style={{ width: '100%', height: '56px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.18)' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderMedium;
                      }}
                    />
                    <p className="text-white-75 fs-7 mb-0 text-truncate" style={{ maxWidth: '72px' }}>
                      {media?.title || item.title || 'Untitled'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger d-flex align-items-start mb-3 mb-md-4 p-3" style={glassStyle}>
            <i className="fas fa-exclamation-circle me-2 me-md-3 fa-lg flex-shrink-0 mt-1"></i>
            <div className="flex-grow-1">
              <strong className="d-block d-md-none">Notice:</strong>
              <span className="small">{error}</span>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white ms-2 flex-shrink-0"
              onClick={() => setError(null)}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-4 py-md-5">
            <div className="spinner-border text-warning" style={{ width: '2.5rem', height: '2.5rem' }}></div>
            <p className="text-white-50 mt-3 small">Loading your cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-4 py-md-5 px-3 rounded-4 p-3 p-md-5" style={glassStyle}>
            <i className="fas fa-shopping-cart fa-4x fa-md-5x text-white-50 mb-3 mb-md-4"></i>
            <h3 className="text-white mb-3 fs-5 fs-md-3">Your cart is empty</h3>
            <p className="text-white-50 mb-4 small">Discover amazing photos and add them to your cart</p>
            <Link to="/buyer/explore" className="btn btn-warning btn-lg px-3 px-md-4">
              <i className="fas fa-search me-2"></i>
              Explore Photos
            </Link>
          </div>
        ) : (
          <div className="row g-3 g-md-4">
            {/* Cart Items */}
            <div className="col-12 col-lg-8">
              <div className="row g-2 g-md-3">
                {cartItems.map((item, index) => {
                  const mediaEntity = getMediaFromCartItem(item);
                  return (
                    <div key={item._id || index} className="col-12">
                      <div className="card bg-dark border-secondary h-100" style={glassStyle}>
                        <div className="card-body p-3 p-md-4">
                          <div className="row align-items-center g-3">
                            <div className="col-4 col-sm-3 col-md-3 col-lg-3">
                              <div className="position-relative">
                                <img
                                  src={getCartItemImage(item)}
                                  className="img-fluid rounded-3 shadow w-100"
                                  style={{ height: "80px", minHeight: "80px", objectFit: "cover" }}
                                  alt={mediaEntity?.title || item.title || 'Cart Item'}
                                  onError={(e) => {
                                    console.warn(`Image failed to load for cart item`);
                                    e.target.src = placeholderMedium;
                                  }}
                                />
                                <div className="position-absolute top-0 end-0 bg-warning text-dark px-1 px-md-2 py-0 py-md-1 rounded-pill small fw-bold" style={{ fontSize: '0.7rem' }}>
                                  #{index + 1}
                                </div>
                              </div>
                            </div>
                            <div className="col-8 col-sm-6 col-md-6 col-lg-6">
                              <h5 className="text-white fw-bold mb-1 mb-md-2 fs-6 fs-md-5">{mediaEntity?.title || item.title || 'Untitled'}</h5>
                              <p className="text-white-50 mb-1 mb-md-2 small">
                                <i className="fas fa-user me-1"></i>
                                {resolvePhotographerName(mediaEntity?.photographer || item.media?.photographer)}
                              </p>
                              <div className="d-flex align-items-center flex-wrap gap-1">
                                <span className="badge bg-warning text-dark small me-1 me-md-2">Photo</span>
                                <small className="text-white-50" style={{ fontSize: '0.7rem' }}>
                                  <i className="fas fa-calendar me-1"></i>
                                  Added to cart
                                </small>
                              </div>
                            </div>
                            <div className="col-12 col-sm-3 col-md-3 text-end">
                              <div className="mb-2 mb-md-3">
                                <div className="text-warning fw-bold fs-5 fs-md-4">
                                  KES {item.price?.toLocaleString() || '0'}
                                </div>
                              </div>
                              <button
                                className="btn btn-outline-danger btn-sm w-100 w-sm-auto"
                                onClick={() => removeFromCart(getMediaIdFromItem(item))}
                                disabled={updating}
                              >
                                <i className="fas fa-trash me-1 d-none d-sm-inline"></i>
                                <span className="d-inline d-sm-none">Remove</span>
                                <span className="d-none d-sm-inline">Remove</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checkout Sidebar */}
            <div className="col-12 col-lg-4 order-first order-lg-last">
              <div className="sticky-top" style={{ top: '20px' }}>
                <div className="card bg-dark border-warning mb-3 mb-md-4" style={glassStyle}>
                  <div className="card-header bg-warning text-dark py-2 py-md-3">
                    <h5 className="mb-0 fw-bold fs-6 fs-md-5">
                      <i className="fas fa-receipt me-2"></i>
                      Order Summary
                    </h5>
                  </div>
                  <div className="card-body p-3 p-md-4">
                    <div className="d-flex justify-content-between mb-2 small">
                      <span className="text-white-50">Items ({cartItems.length})</span>
                      <span className="text-white fw-medium">{cartItems.length}</span>
                    </div>
                    <hr className="border-secondary my-2 my-md-3" />
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-white fw-bold fs-6 fs-md-5">Total Amount</span>
                      <span className="text-warning fw-bold fs-5 fs-md-4">
                        KES {totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="alert alert-info py-2 px-3 mb-3 small">
                      <i className="fas fa-wallet me-1"></i>
                      <span className="fw-medium">Wallet:</span> KES {walletBalance.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="card bg-dark border-secondary mb-3 mb-md-4" style={glassStyle}>
                  <div className="card-header py-2 py-md-3">
                    <h6 className="mb-0 text-white fw-bold fs-6 fs-md-6">
                      <i className="fas fa-credit-card me-2"></i>
                      Payment Method
                    </h6>
                  </div>
                  <div className="card-body p-3 p-md-4">
                    <div className="mb-3">
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="paymentMethod"
                          id="mpesa"
                          value="mpesa"
                          checked={paymentMethod === 'mpesa'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <label className="form-check-label text-white small fw-medium" htmlFor="mpesa">
                          <i className="fas fa-mobile-alt me-2 text-success"></i>
                          M-Pesa (Mobile Money)
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="paymentMethod"
                          id="wallet"
                          value="wallet"
                          checked={paymentMethod === 'wallet'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <label className="form-check-label text-white small fw-medium" htmlFor="wallet">
                          <i className="fas fa-wallet me-2 text-warning"></i>
                          Wallet Balance
                        </label>
                      </div>
                    </div>

                    {paymentMethod === 'mpesa' && (
                      <div className="mb-3">
                        <label className="form-label text-white-50 small fw-medium">
                          <i className="fas fa-phone me-1"></i>
                          M-Pesa Phone Number
                        </label>
                        <input
                          type="tel"
                          className={`form-control form-control-sm ${phoneError ? 'is-invalid' : mpesaPhone ? 'is-valid' : ''}`}
                          placeholder="254XXXXXXXXX"
                          value={mpesaPhone}
                          onChange={handlePhoneChange}
                          maxLength="12"
                          style={{ fontSize: '0.9rem' }}
                        />
                        {phoneError && (
                          <div className="invalid-feedback d-block small mt-1">
                            {phoneError}
                          </div>
                        )}
                        <small className="text-white-50 mt-1 d-block" style={{ fontSize: '0.75rem' }}>
                          Enter your M-Pesa registered number
                        </small>
                      </div>
                    )}

                    {paymentMethod === 'wallet' && totalAmount > walletBalance && (
                      <div className="alert alert-warning py-2 px-3 mb-3 small">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Insufficient wallet balance. Please top up or use M-Pesa.
                      </div>
                    )}

                    <button
                      className={`btn w-100 ${paymentMethod === 'mpesa' ? 'btn-success' : 'btn-warning'} py-2 py-md-3`}
                      style={{ fontSize: '0.9rem', fontWeight: '600' }}
                      onClick={paymentMethod === 'mpesa' ? handleMpesaCheckout : handleWalletCheckout}
                      disabled={
                        updating ||
                        mpesaProcessing ||
                        (paymentMethod === 'wallet' && totalAmount > walletBalance) ||
                        (paymentMethod === 'mpesa' && (!mpesaPhone || phoneError))
                      }
                    >
                      {updating || mpesaProcessing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          <span className="small">{mpesaProcessing ? 'Sending STK Push...' : 'Processing...'}</span>
                        </>
                      ) : (
                        <>
                          <i className={`fas ${paymentMethod === 'mpesa' ? 'fa-mobile-alt' : 'fa-credit-card'} me-2`}></i>
                          <span className="fw-medium">
                            {paymentMethod === 'mpesa' ? 'Pay with M-Pesa' : 'Complete Purchase'}
                          </span>
                        </>
                      )}
                    </button>

                    {paymentMethod === 'mpesa' && (
                      <div className="alert alert-info py-2 px-3 mt-3 small">
                        <i className="fas fa-info-circle me-1"></i>
                        <span style={{ fontSize: '0.75rem' }}>
                          You'll receive an STK push on your phone. Enter your M-Pesa PIN to complete payment.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="alert alert-success py-2 px-3" style={glassStyle}>
                  <small className="text-success" style={{ fontSize: '0.75rem' }}>
                    <i className="fas fa-shield-alt me-1"></i>
                    Secure checkout powered by M-Pesa. Your payment information is protected.
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};

export default BuyerCart;