import React, { useEffect, useState, useCallback } from "react";
import BuyerLayout from "./BuyerLayout";
import { Link, useNavigate } from "react-router-dom";
import {
  getAllMedia,
  getPurchaseHistory,
  getUserFavorites,
  getWalletBalance,
  getLikedMedia,
  addFavorite,
  removeFavorite,
  likeMedia,
  unlikeMedia,
  followUser,
  unfollowUser,
  getUserFollowing,
} from "../../../api/API";
import { placeholderMedium, placeholderSmall } from "../../../utils/placeholders";
import { getImageUrl, fetchProtectedUrl } from "../../../utils/imageUrl";
import { getDisplayName } from "../../../utils/auth";

const BuyerDashboard = () => {
  const [featuredMedia, setFeaturedMedia] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    purchases: 0,
    downloads: 0,
    favorites: 0,
    wallet: 0,
    totalSpent: 0
  });
  const [likedItems, setLikedItems] = useState(new Set());
  const [likingItem, setLikingItem] = useState(null);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [followingUser, setFollowingUser] = useState(null);
  const [imageUrls, setImageUrls] = useState({});

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};
  const displayName = getDisplayName(user) || "Buyer";

  const userId = user?.id || user?._id || user?.userId || user?.uid;

  const loadLikedItems = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getLikedMedia();
      const likedIds = new Set((res.data || []).map(item => item._id));
      setLikedItems(likedIds);
    } catch (err) {
      console.warn("Unable to load liked items", err);
    }
  }, [token]);

  const loadFollowingStatus = useCallback(async () => {
    if (!token || !userId) return;
    try {
      const res = await getUserFollowing(userId);
      const followingList = res.data?.following || [];
      const followingIds = new Set(followingList.map(u => u._id));
      setFollowingUsers(followingIds);
    } catch (err) {
      console.warn("Unable to load following status", err);
    }
  }, [token, userId]);

  // 🔧 FIXED: Better image resolution for any item
  const resolveImage = useCallback((item) => {
    if (!item) return placeholderMedium;
    
    // Try to get from imageUrls first
    const mediaId = item._id || item.mediaId || item.media?._id;
    if (mediaId && imageUrls[mediaId]) {
      return imageUrls[mediaId];
    }
    
    // Try direct getImageUrl
    return getImageUrl(item, placeholderMedium);
  }, [imageUrls]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all media
        const mediaRes = await getAllMedia();
        let allMedia = [];
        if (Array.isArray(mediaRes.data?.media)) {
          allMedia = mediaRes.data.media;
        } else if (Array.isArray(mediaRes.data)) {
          allMedia = mediaRes.data;
        }
        console.log(`✅ Loaded ${allMedia.length} media items`);

        let purchases = [];
        let favorites = [];
        let walletAmount = 0;
        let totalSpent = 0;

        if (userId) {
          try {
            const purchasesRes = await getPurchaseHistory(userId);
            console.log("📦 Purchase history response:", purchasesRes.data);
            
            // Handle different response structures
            if (Array.isArray(purchasesRes.data)) {
              purchases = purchasesRes.data;
            } else if (purchasesRes.data?.purchases) {
              purchases = purchasesRes.data.purchases;
            } else if (purchasesRes.data?.purchaseHistory) {
              purchases = purchasesRes.data.purchaseHistory;
            } else if (purchasesRes.data?.data && Array.isArray(purchasesRes.data.data)) {
              purchases = purchasesRes.data.data;
            }
            
            // Calculate total spent
            totalSpent = purchases.reduce((sum, p) => sum + (p.amount || p.price || 0), 0);
            console.log(`✅ Found ${purchases.length} purchases, total spent: ${totalSpent}`);
          } catch (err) {
            console.log("ℹ️ No purchase history yet", err?.message || err);
          }

          try {
            const favRes = await getUserFavorites(userId);
            favorites = Array.isArray(favRes.data)
              ? favRes.data
              : Array.isArray(favRes.data?.favorites)
                ? favRes.data.favorites
                : [];
          } catch (err) {
            console.log("ℹ️ Favorites not available", err?.message || err);
          }

          try {
            const walletRes = await getWalletBalance(userId);
            const walletData = walletRes.data || {};
            walletAmount = Number(
              walletData.balance ??
              walletData.netBalance ??
              walletData.amount ??
              walletData.wallet ??
              0
            ) || 0;
          } catch (err) {
            console.log("ℹ️ Wallet balance unavailable", err?.message || err);
          }
        }

        // Fallback to localStorage wallet
        if (!walletAmount) {
          const rawWallet = localStorage.getItem("pm_wallet") || localStorage.getItem("wallet");
          if (rawWallet) {
            try {
              const parsedWallet = JSON.parse(rawWallet);
              walletAmount = Number(parsedWallet?.balance ?? parsedWallet?.amount ?? parsedWallet?.wallet ?? parsedWallet) || walletAmount;
            } catch {
              walletAmount = Number(rawWallet) || walletAmount;
            }
          }
        }

        const featured = allMedia.slice(0, 8);
        const rec = allMedia.slice(8, 14);

        setFeaturedMedia(featured);
        setRecommended(rec);
        setRecentPurchases(purchases.slice(0, 5));

        setStats({
          purchases: purchases.length || 0,
          downloads: purchases.filter(p => p.downloaded).length || purchases.length || 0,
          favorites: favorites.length || 0,
          wallet: walletAmount || 0,
          totalSpent: totalSpent || 0,
        });

        // Preload protected URLs for purchased/free items
        const purchasedMediaIds = new Set((purchases || []).map(p => p.media?._id || p.mediaId || p.media?._id || p._id));
        const itemsToResolve = [...featured, ...rec, ...purchases.slice(0, 5)];
        const urls = {};
        await Promise.all(
          itemsToResolve.map(async (item) => {
            // Get media ID from multiple possible locations
            const mediaId = item._id || item.mediaId || item.media?._id || item.id;
            if (!mediaId) return;

            const isFree = !item.price || item.price <= 0;
            const isPurchased = purchasedMediaIds.has(mediaId);

            if (!isFree && !isPurchased) return;

            const raw = getImageUrl(item, null);
            if (raw && !raw.includes("/opt/") && !raw.startsWith("file://") && raw.startsWith("http")) {
              urls[mediaId] = raw;
              return;
            }

            try {
              const protectedUrl = await fetchProtectedUrl(mediaId);
              if (protectedUrl && protectedUrl !== placeholderMedium) {
                urls[mediaId] = protectedUrl;
              }
            } catch (err) {
              console.debug("Could not resolve protected URL for", mediaId);
            }
          })
        );
        setImageUrls(urls);

        await loadLikedItems();
        await loadFollowingStatus();

      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setError(err.response?.data?.message || "Failed to load content. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, loadLikedItems, loadFollowingStatus]);

  const handleLike = async (mediaId) => {
    if (!token) {
      alert("Please login to like photos");
      return;
    }

    const isLiked = likedItems.has(mediaId);
    try {
      setLikingItem(mediaId);
      if (isLiked) {
        await unlikeMedia(mediaId);
        if (userId) {
          try {
            await removeFavorite(userId, mediaId);
          } catch (favErr) {
            console.warn('Warning: unable to remove from favorites', favErr);
          }
        }
        setLikedItems(prev => {
          const next = new Set(prev);
          next.delete(mediaId);
          return next;
        });
      } else {
        await likeMedia(mediaId);
        if (userId) {
          try {
            await addFavorite({ userId, mediaId });
          } catch (favErr) {
            console.warn('Warning: unable to add to favorites', favErr);
          }
        }
        setLikedItems(prev => new Set(prev).add(mediaId));
      }

      setFeaturedMedia(prev => prev.map(item =>
        item._id === mediaId ? { ...item, likes: (item.likes || 0) + (isLiked ? -1 : 1) } : item
      ));
      setRecommended(prev => prev.map(item =>
        item._id === mediaId ? { ...item, likes: (item.likes || 0) + (isLiked ? -1 : 1) } : item
      ));
    } catch (err) {
      console.error("Error toggling like:", err);
      alert("Failed to update like. Please try again.");
    } finally {
      setLikingItem(null);
    }
  };

  const handleFollow = async (photographerId) => {
    if (!token) {
      alert("Please login to follow photographers");
      return;
    }

    if (!photographerId) return;

    const isFollowing = followingUsers.has(photographerId);
    try {
      setFollowingUser(photographerId);
      if (isFollowing) {
        await unfollowUser(photographerId);
        setFollowingUsers(prev => {
          const next = new Set(prev);
          next.delete(photographerId);
          return next;
        });
      } else {
        await followUser(photographerId);
        setFollowingUsers(prev => new Set(prev).add(photographerId));
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      alert("Failed to update following status.");
    } finally {
      setFollowingUser(null);
    }
  };

  // 🔧 Helper to get image for purchase item
  const getPurchaseImageUrl = (purchase) => {
    // Try multiple locations where the image URL might be
    const media = purchase.media || purchase;
    
    // Get media ID
    const mediaId = purchase._id || purchase.mediaId || purchase.media?._id || media._id;
    
    // Check if we have a pre-fetched URL
    if (mediaId && imageUrls[mediaId]) {
      return imageUrls[mediaId];
    }
    
    // Check for direct URL in media
    if (media.fileUrl) {
      const filename = media.fileUrl.split('/').pop();
      if (filename) {
        return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://pm-backend-f3b6.onrender.com'}/uploads/photos/${filename}`;
      }
    }
    
    // Check for thumbnail or image field
    if (media.thumbnail) return media.thumbnail;
    if (media.image) return media.image;
    if (media.imageUrl) return media.imageUrl;
    
    // Try getImageUrl utility
    return getImageUrl(media, placeholderSmall);
  };

  if (error) {
    return (
      <BuyerLayout>
        <div className="text-center py-5">
          <i className="fas fa-exclamation-triangle text-warning fa-4x mb-3"></i>
          <h4 className="text-white mb-3">Oops! Something went wrong</h4>
          <p className="text-white-50 mb-4">{error}</p>
          <button className="btn btn-warning" onClick={() => window.location.reload()}>
            <i className="fas fa-sync-alt me-2"></i>
            Refresh Page
          </button>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      {/* Welcome Banner - Original Color */}
      <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25 mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h4 className="fw-bold text-white mb-2">
                Welcome back, {displayName}! 👋
              </h4>
              <p className="text-white-50 mb-md-0">
                Discover stunning photos from talented photographers worldwide.
              </p>
            </div>
            <div className="col-md-4 text-md-end">
              <Link to="/buyer/explore" className="btn btn-warning">
                <i className="fas fa-compass me-2"></i>
                Explore Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="card bg-dark border-secondary">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle p-3" style={{ background: "rgba(255,193,7,0.1)" }}>
                  <i className="fas fa-shopping-cart text-warning"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-0">{stats.purchases}</h5>
                  <small className="text-white-50">Purchases</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card bg-dark border-secondary">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle p-3" style={{ background: "rgba(40,167,69,0.1)" }}>
                  <i className="fas fa-download text-success"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-0">{stats.downloads}</h5>
                  <small className="text-white-50">Downloads</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card bg-dark border-secondary">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle p-3" style={{ background: "rgba(23,162,184,0.1)" }}>
                  <i className="fas fa-heart text-info"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-0">{stats.favorites}</h5>
                  <small className="text-white-50">Favorites</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card bg-dark border-secondary">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle p-3" style={{ background: "rgba(255,193,7,0.1)" }}>
                  <i className="fas fa-wallet text-warning"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-0">KES {stats.wallet.toLocaleString()}</h5>
                  <small className="text-white-50">Wallet</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="card bg-dark border-secondary h-100 text-center p-3" style={{ cursor: "pointer" }} onClick={() => navigate("/buyer/explore")}>
            <i className="fas fa-compass text-warning fa-2x mb-2"></i>
            <h6 className="fw-bold mb-1">Explore</h6>
            <small className="text-white-50">Discover new photos</small>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card bg-dark border-secondary h-100 text-center p-3" style={{ cursor: "pointer" }} onClick={() => navigate("/buyer/favorites")}>
            <i className="fas fa-heart text-danger fa-2x mb-2"></i>
            <h6 className="fw-bold mb-1">Favorites</h6>
            <small className="text-white-50">{stats.favorites} saved items</small>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card bg-dark border-secondary h-100 text-center p-3" style={{ cursor: "pointer" }} onClick={() => navigate("/buyer/wallet")}>
            <i className="fas fa-wallet text-warning fa-2x mb-2"></i>
            <h6 className="fw-bold mb-1">Wallet</h6>
            <small className="text-white-50">KES {stats.wallet.toLocaleString()}</small>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card bg-dark border-secondary h-100 text-center p-3" style={{ cursor: "pointer" }} onClick={() => navigate("/buyer/downloads")}>
            <i className="fas fa-download text-success fa-2x mb-2"></i>
            <h6 className="fw-bold mb-1">Downloads</h6>
            <small className="text-white-50">{stats.downloads} items</small>
          </div>
        </div>
      </div>

      {/* Featured Media - Gallery View */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold">
            <i className="fas fa-star me-2 text-warning"></i>
            Featured Photos
          </h5>
          <Link to="/buyer/explore" className="text-warning text-decoration-none small">
            View All <i className="fas fa-arrow-right ms-1"></i>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : featuredMedia.length === 0 ? (
          <div className="text-center py-4">
            <i className="fas fa-images fa-3x text-white-50 mb-3"></i>
            <p className="text-white-50">No photos available yet</p>
          </div>
        ) : (
          <div className="row g-3">
            {featuredMedia.map((item) => (
              <div className="col-lg-3 col-md-4 col-6" key={item._id}>
                <div className="card bg-dark border-secondary h-100 overflow-hidden">
                  <div className="position-relative">
                    <img
                      src={resolveImage(item)}
                      alt={item.title}
                      className="card-img-top"
                      style={{ height: "160px", objectFit: "cover", backgroundColor: "#1a1a1a" }}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderMedium;
                      }}
                    />
                    <div className="position-absolute bottom-0 start-0 end-0 p-2 bg-gradient-to-t from-black">
                      <h6 className="text-white mb-0 small fw-bold text-truncate">{item.title || "Untitled"}</h6>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-white-50">
                          <i className="fas fa-camera me-1"></i>
                          {item.photographer?.username || "Anonymous"}
                        </small>
                        <small className="text-warning fw-bold">KES {item.price || 0}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Purchases & Recommended */}
      <div className="row g-4">
        {/* Recent Purchases Section - FIXED IMAGES */}
        <div className="col-md-6">
          <div className="card bg-dark border-secondary h-100">
            <div className="card-header bg-transparent border-secondary">
              <h6 className="mb-0 text-warning">
                <i className="fas fa-history me-2"></i>
                Recent Purchases
              </h6>
            </div>
            <div className="card-body p-0">
              {recentPurchases.length > 0 ? (
                <div className="list-group list-group-flush bg-dark">
                  {recentPurchases.map((purchase, index) => {
                    const mediaItem = purchase.media || purchase;
                    const imageUrl = getPurchaseImageUrl(purchase);
                    const title = mediaItem.title || purchase.title || "Photo";
                    const date = purchase.date || purchase.createdAt || Date.now();
                    
                    return (
                      <div key={purchase._id || index} className="list-group-item bg-transparent text-white border-secondary">
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={imageUrl}
                            alt={title}
                            width="50"
                            height="50"
                            className="rounded"
                            style={{ objectFit: "cover", backgroundColor: "#1a1a1a" }}
                            onError={(e) => {
                              console.log(`Image failed to load for purchase: ${title}`);
                              e.target.onerror = null;
                              e.target.src = placeholderSmall;
                            }}
                          />
                          <div className="flex-grow-1">
                            <h6 className="small fw-bold mb-0 text-truncate">{title}</h6>
                            <small className="text-white-50">
                              Purchased on {new Date(date).toLocaleDateString()}
                            </small>
                          </div>
                          <button className="btn btn-sm btn-outline-warning" onClick={() => navigate("/buyer/downloads")}>
                            <i className="fas fa-download"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-shopping-bag fa-3x text-white-50 mb-3"></i>
                  <p className="text-white-50 mb-2">No purchases yet</p>
                  <Link to="/buyer/explore" className="btn btn-sm btn-warning">
                    Start Exploring
                  </Link>
                </div>
              )}
              <div className="card-footer bg-transparent border-secondary text-center">
                <Link to="/buyer/transactions" className="text-warning text-decoration-none small">
                  View All Transactions <i className="fas fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended for You Section */}
        <div className="col-md-6">
          <div className="card bg-dark border-secondary h-100">
            <div className="card-header bg-transparent border-secondary">
              <h6 className="mb-0 text-warning">
                <i className="fas fa-thumbs-up me-2"></i>
                Recommended for You
              </h6>
            </div>
            <div className="card-body">
              <div className="row g-2">
                {recommended.slice(0, 4).map((item) => (
                  <div className="col-6" key={item._id}>
                    <div className="card bg-dark border-secondary h-100">
                      <img
                        src={resolveImage(item)}
                        alt=""
                        className="card-img-top"
                        style={{ height: "110px", objectFit: "cover", backgroundColor: "#1a1a1a" }}
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = placeholderMedium;
                        }}
                      />
                      <div className="card-body p-2">
                        <small className="fw-bold d-block text-truncate">{item.title || "Untitled"}</small>
                        <small className="text-warning">KES {item.price || 0}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-3">
                <Link to="/buyer/explore" className="btn btn-outline-warning btn-sm">
                  Explore More <i className="fas fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary Card */}
      <div className="mt-4">
        <div className="card bg-dark border-secondary">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h6 className="text-warning mb-2">
                  <i className="fas fa-chart-line me-2"></i>
                  Your Activity Summary
                </h6>
                <div className="d-flex gap-4 flex-wrap">
                  <div>
                    <small className="text-white-50">Total Spent</small>
                    <p className="text-white fw-bold mb-0">KES {stats.totalSpent.toLocaleString()}</p>
                  </div>
                  <div>
                    <small className="text-white-50">Average per Purchase</small>
                    <p className="text-white fw-bold mb-0">
                      KES {stats.purchases ? Math.round(stats.totalSpent / stats.purchases).toLocaleString() : 0}
                    </p>
                  </div>
                  <div>
                    <small className="text-white-50">Collection Size</small>
                    <p className="text-white fw-bold mb-0">{stats.purchases} photos</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6 text-md-end mt-3 mt-md-0">
                <Link to="/buyer/wallet" className="btn btn-outline-warning btn-sm me-2">
                  <i className="fas fa-wallet me-1"></i>
                  Add Funds
                </Link>
                <Link to="/buyer/explore" className="btn btn-warning btn-sm">
                  <i className="fas fa-shopping-cart me-1"></i>
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .bg-gradient-to-t {
          background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0));
        }
        .card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
      `}</style>
    </BuyerLayout>
  );
};

export default BuyerDashboard;