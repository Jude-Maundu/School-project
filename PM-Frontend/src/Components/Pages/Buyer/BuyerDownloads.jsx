import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import BuyerLayout from "./BuyerLayout";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "../../../api/apiConfig";
import { placeholderMedium } from "../../../utils/placeholders";
import { getImageUrl, fetchProtectedUrl } from "../../../utils/imageUrl";
import { getLocalPurchases, setLocalPurchases, disableApi, isApiAvailable } from "../../../utils/localStore";

const API = API_BASE_URL;

const BuyerDownloads = () => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const hasFetched = useRef(false);

  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = useMemo(() => userStr ? JSON.parse(userStr) : {}, [userStr]);
  const userId = user.id || user._id;
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  // Extract Cloudinary URL from the item
  const getCloudinaryUrl = useCallback((item) => {
    const mediaObj = item.mediaDetails || item.media || item;
    
    // Check for fileUrl
    if (mediaObj.fileUrl && mediaObj.fileUrl.includes('cloudinary')) {
      return mediaObj.fileUrl;
    }
    
    // Check for url
    if (mediaObj.url && mediaObj.url.includes('cloudinary')) {
      return mediaObj.url;
    }
    
    // Check for imageUrl
    if (mediaObj.imageUrl && mediaObj.imageUrl.includes('cloudinary')) {
      return mediaObj.imageUrl;
    }
    
    // Check from thumbnail
    if (mediaObj.thumbnail && mediaObj.thumbnail.includes('cloudinary')) {
      return mediaObj.thumbnail;
    }
    
    return null;
  }, []);

  // Get media image URL
  const getMediaImageUrl = useCallback((item) => {
    const mediaId = item.mediaId || item.mediaDetails?._id || item._id;
    
    if (mediaId && imageUrls[mediaId]) {
      return imageUrls[mediaId];
    }
    
    // Try Cloudinary URL
    const cloudinaryUrl = getCloudinaryUrl(item);
    if (cloudinaryUrl) {
      return cloudinaryUrl;
    }
    
    // Try direct URL from media object
    const mediaObj = item.mediaDetails || item.media || item;
    if (mediaObj) {
      const url = getImageUrl(mediaObj, null);
      if (url && url !== placeholderMedium && url.startsWith('http')) {
        return url;
      }
    }
    
    return placeholderMedium;
  }, [imageUrls, getCloudinaryUrl]);

  const isImageLoading = useCallback((item) => {
    const mediaId = item.mediaId || item.mediaDetails?._id || item._id;
    return loadingImages[mediaId];
  }, [loadingImages]);

  // Resolve image URL
  const resolveImageUrl = useCallback(async (item, mediaId) => {
    console.log(`🔍 Resolving image URL for media ${mediaId}`);
    
    // Try Cloudinary URL first
    const cloudinaryUrl = getCloudinaryUrl(item);
    if (cloudinaryUrl) {
      console.log(`✅ Using Cloudinary URL for ${mediaId}`);
      return cloudinaryUrl;
    }
    
    let mediaObj = item.mediaDetails || item.media || item;
    
    // Try direct file URL
    if (mediaObj?.fileUrl && mediaObj.fileUrl.startsWith('http')) {
      console.log(`✅ Using direct URL for ${mediaId}`);
      return mediaObj.fileUrl;
    }

    // Try protected URL API (may fail with 403)
    try {
      const protectedUrl = await fetchProtectedUrl(mediaId, { userId, token });
      if (protectedUrl && protectedUrl.startsWith('http')) {
        console.log(`✅ Got protected URL for ${mediaId}`);
        return protectedUrl;
      }
    } catch (err) {
      console.warn(`⚠️ Failed to fetch protected URL for ${mediaId}:`, err.message);
    }

    // Fallback to placeholder
    return placeholderMedium;
  }, [userId, token, getCloudinaryUrl]);

  // Preload all image URLs
  const preloadImageUrls = useCallback(async (downloadsList) => {
    const urlMap = {};
    
    for (const item of downloadsList) {
      let mediaId = item.mediaId || item.mediaDetails?._id || item._id;
      
      if (!mediaId && item.mediaDetails?._id) mediaId = item.mediaDetails._id;
      if (!mediaId && item.media?._id) mediaId = item.media._id;
      if (!mediaId && item._id) mediaId = item._id;
      
      if (!mediaId) {
        console.warn("⚠️ No media ID found for item:", item);
        continue;
      }
      
      console.log(`📸 Preloading image for media ${mediaId}`);
      setLoadingImages(prev => ({ ...prev, [mediaId]: true }));
      
      const url = await resolveImageUrl(item, mediaId);
      urlMap[mediaId] = url;
      
      setLoadingImages(prev => ({ ...prev, [mediaId]: false }));
    }
    
    setImageUrls(urlMap);
    console.log(`✅ Preloaded ${Object.keys(urlMap).length} image URLs`);
  }, [resolveImageUrl]);

  // Fetch purchase history
  const fetchDownloads = useCallback(async () => {
    if (!token || !userId) {
      setError("Please login to view your downloads");
      setLoading(false);
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    try {
      setLoading(true);
      setError(null);

      console.log("📥 Fetching downloads for user:", userId);

      if (!isApiAvailable("purchaseHistory")) {
        console.log("ℹ️ Using local purchases (API unavailable)");
        const localPurchases = getLocalPurchases();
        setDownloads(localPurchases);
        await preloadImageUrls(localPurchases);
        setLoading(false);
        return;
      }

      const res = await axios.get(API_ENDPOINTS.PAYMENTS.PURCHASE_HISTORY(userId), {
        headers,
        timeout: 30000,
      });

      console.log("✅ Downloads response:", res.data);

      let downloadsData = [];
      if (Array.isArray(res.data)) {
        downloadsData = res.data;
      } else if (res.data?.purchases && Array.isArray(res.data.purchases)) {
        downloadsData = res.data.purchases;
      } else if (res.data?.items && Array.isArray(res.data.items)) {
        downloadsData = res.data.items;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        downloadsData = res.data.data;
      } else {
        console.warn("Unexpected response structure:", res.data);
        downloadsData = [];
      }

      const normalizedDownloads = downloadsData.map(item => ({
        ...item,
        mediaId: item.mediaId || item.mediaDetails?._id || item._id,
        title: item.mediaDetails?.title || item.title || item.media?.title || "Untitled",
        photographerName: item.mediaDetails?.photographerName || item.photographerName || item.photographer?.username || "Anonymous",
        createdAt: item.createdAt || item.date || new Date().toISOString(),
        mediaDetails: item.mediaDetails || item.media || item,
        originalImageUrl: item.mediaDetails?.fileUrl || item.media?.fileUrl || item.fileUrl
      }));

      setDownloads(normalizedDownloads);
      setCurrentPage(1);
      
      setLocalPurchases(normalizedDownloads);
      await preloadImageUrls(normalizedDownloads);
      
    } catch (err) {
      console.error("❌ Error fetching downloads:", err);

      if (err.response?.status === 404 || err.response?.status === 400) {
        console.log("ℹ️ Using local purchases");
        disableApi("purchaseHistory");
        const localPurchases = getLocalPurchases();
        setDownloads(localPurchases);
        setCurrentPage(1);
        await preloadImageUrls(localPurchases);
        setError("Using local purchase data");
      } else if (err.code === 'ECONNABORTED') {
        setError("Request timeout. Please check your connection.");
      } else if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        localStorage.clear();
      } else {
        setError(err.response?.data?.message || "Failed to load downloads");
      }
    } finally {
      setLoading(false);
    }
  }, [token, userId, headers, preloadImageUrls]);

  const refreshDownloads = useCallback(() => {
    hasFetched.current = false;
    fetchDownloads();
  }, [fetchDownloads]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(downloads.length / itemsPerPage));
  const currentDownloads = downloads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle download with Cloudinary fallback
  const handleDownload = useCallback(async (item) => {
    const mediaId = item.mediaId;
    const title = item.title;
    
    if (!mediaId) {
      alert("Cannot download: Media ID not found");
      return;
    }

    setDownloadingId(mediaId);

    try {
      console.log(`📥 Downloading media: ${mediaId}`);
      
      // Method 1: Try Cloudinary URL directly
      const cloudinaryUrl = getCloudinaryUrl(item);
      if (cloudinaryUrl) {
        console.log(`🌐 Using Cloudinary URL for download: ${cloudinaryUrl}`);
        
        const response = await fetch(cloudinaryUrl);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${title || 'download'}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          console.log(`✅ Download successful from Cloudinary: ${title}`);
          setDownloadingId(null);
          return;
        }
      }
      
      // Method 2: Try stored image URL
      const imageUrl = getMediaImageUrl(item);
      if (imageUrl && imageUrl !== placeholderMedium && imageUrl.startsWith('http') && !imageUrl.includes('placeholder')) {
        console.log(`🌐 Using stored image URL for download: ${imageUrl}`);
        
        const response = await fetch(imageUrl);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${title || 'download'}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          console.log(`✅ Download successful from stored URL: ${title}`);
          setDownloadingId(null);
          return;
        }
      }
      
      // Method 3: Try API with token
      console.log("🔄 Trying API download with token...");
      const downloadUrl = `${API}/media/${mediaId}/download`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title || 'download'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log(`✅ Download successful from API: ${title}`);
        setDownloadingId(null);
        return;
      }
      
      // Method 4: Open in new tab as last resort
      if (imageUrl && imageUrl !== placeholderMedium) {
        console.log(`🌐 Opening image in new tab: ${imageUrl}`);
        window.open(imageUrl, '_blank');
        alert("Image opened in new tab. Right-click and select 'Save Image As...' to download.");
        setDownloadingId(null);
        return;
      }
      
      throw new Error("No downloadable URL found");
      
    } catch (err) {
      console.error("❌ Download error:", err);
      alert("Unable to download this file. Please try again later.");
    } finally {
      setDownloadingId(null);
    }
  }, [token, getCloudinaryUrl, getMediaImageUrl]);

  // Fetch on mount
  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  // If not authenticated, show login prompt
  if (!token || !userId) {
    return (
      <BuyerLayout>
        <div className="text-center py-5">
          <i className="fas fa-lock text-warning fa-4x mb-3"></i>
          <h4 className="text-white mb-3">Authentication Required</h4>
          <p className="text-white-50 mb-4">Please login to view your downloads</p>
          <Link to="/login" className="btn btn-warning">
            <i className="fas fa-sign-in-alt me-2"></i>
            Go to Login
          </Link>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="text-white">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">
            <i className="fas fa-download me-2 text-warning"></i>
            My Downloads
          </h2>
          <button 
            className="btn btn-outline-warning btn-sm rounded-pill px-4"
            onClick={refreshDownloads}
            disabled={loading}
          >
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-white-50">Loading your downloads...</p>
          </div>
        ) : downloads.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-cloud-download-alt fa-4x text-white-50 mb-3"></i>
            <h5 className="mb-3">No downloads yet</h5>
            <p className="text-white-50 mb-4">Purchase your first photo to start downloading!</p>
            <Link to="/buyer/explore" className="btn btn-warning btn-lg rounded-pill px-5">
              <i className="fas fa-compass me-2"></i>
              Explore Photos
            </Link>
          </div>
        ) : (
          <>
            <div className="row g-4">
              {currentDownloads.map((item, idx) => {
                const mediaId = item.mediaId;
                const title = item.title;
                const photographer = item.photographerName;
                const purchaseDate = item.createdAt;
                const receiptId = item.receiptId || item._id?.slice(-6) || "N/A";
                const isDownloading = downloadingId === mediaId;
                const imageUrl = getMediaImageUrl(item);
                const isLoadingImage = isImageLoading(item);
                
                return (
                  <div className="col-lg-4 col-md-6" key={item._id || idx}>
                    <div className="card bg-dark border-secondary h-100" style={{ borderRadius: "16px", overflow: "hidden" }}>
                      <div className="position-relative" style={{ height: "200px", backgroundColor: "#1a1a1a" }}>
                        {isLoadingImage ? (
                          <div className="d-flex align-items-center justify-content-center h-100">
                            <div className="spinner-border text-warning" style={{ width: "1.5rem", height: "1.5rem" }}></div>
                          </div>
                        ) : (
                          <img
                            src={imageUrl}
                            className="card-img-top"
                            style={{ height: "200px", objectFit: "contain", width: "100%", backgroundColor: "#1a1a1a" }}
                            alt={title}
                            onError={(e) => {
                              console.error(`❌ Image failed to load for ${mediaId}`);
                              e.target.src = placeholderMedium;
                              e.target.onerror = null;
                            }}
                          />
                        )}
                        <span className="position-absolute top-0 end-0 m-2 badge bg-success rounded-pill px-3 py-2">
                          <i className="fas fa-check-circle me-1"></i>
                          Purchased
                        </span>
                      </div>
                      <div className="card-body d-flex flex-column p-3">
                        <h5 className="fw-bold mb-1 text-truncate text-white">{title}</h5>
                        <p className="text-white-50 small mb-2">
                          <i className="fas fa-camera me-1"></i>
                          {photographer}
                        </p>
                        <div className="mt-auto">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <small className="text-white-50">
                              <i className="fas fa-calendar me-1"></i>
                              {new Date(purchaseDate).toLocaleDateString()}
                            </small>
                            <small className="text-white-50">
                              <i className="fas fa-receipt me-1"></i>
                              {receiptId}
                            </small>
                          </div>
                          <button
                            className="btn btn-warning w-100 py-2 fw-semibold"
                            onClick={() => handleDownload(item)}
                            disabled={isDownloading}
                            style={{ borderRadius: "12px" }}
                          >
                            {isDownloading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Preparing...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-download me-2"></i>
                                Download
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center mt-4">
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => goToPage(page)}>{page}</button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .page-link {
          background-color: #2a2a2e;
          border-color: #3a3a3e;
          color: #ffc107;
        }
        .page-link:hover {
          background-color: #3a3a3e;
          border-color: #ffc107;
          color: #ffc107;
        }
        .page-item.active .page-link {
          background-color: #ffc107;
          border-color: #ffc107;
          color: #1a1a2e;
        }
        .page-item.disabled .page-link {
          background-color: #1a1a2e;
          border-color: #2a2a2e;
          color: #6c757d;
        }
      `}</style>
    </BuyerLayout>
  );
};

export default BuyerDownloads;