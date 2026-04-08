import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import PhotographerLayout from "./PhotographerLayout";
import { useNavigate } from "react-router-dom";
import { fetchProtectedUrl, getImageUrl } from "../../../utils/imageUrl";
import { placeholderMedium } from "../../../utils/placeholders";
import { getAuthToken, getCurrentUserId } from "../../../utils/auth";
import {
  getMyMedia,
  deleteMedia,
  updateMediaPrice,
  createAlbum,
  getAlbums,
  getAlbumMedia,
  updateAlbum,
  deleteAlbum,
  generateShareLink,
  addMediaToAlbum,
  removeMediaFromAlbum,
  addCart,
} from "../../../api/API";

const PhotographerMedia = () => {
  // Watermark state
  const [watermark, setWatermark] = useState("");
  
  // Fetch watermark from backend on mount
  useEffect(() => {
    const fetchWatermark = async () => {
      try {
        const photographerId = getCurrentUserId();
        if (!photographerId) return;
        const res = await import("../../../api/API").then(m => m.getUser(photographerId));
        const profile = res.data || {};
        setWatermark(profile.watermark || "");
      } catch (err) {
        setWatermark("");
      }
    };
    fetchWatermark();
  }, []);

  // State declarations
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [shareMedia, setShareMedia] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [showEditAlbumModal, setShowEditAlbumModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [shareMaxDownloads, setShareMaxDownloads] = useState(10);
  const [shareExpirationDays, setShareExpirationDays] = useState(7);
  const [shareMessage, setShareMessage] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [shareQrUrl, setShareQrUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [mediaUrls, setMediaUrls] = useState({});
  const [activeTab, setActiveTab] = useState("gallery");
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [updatingAlbum, setUpdatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");
  const [createAlbumError, setCreateAlbumError] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [showAlbumMediaModal, setShowAlbumMediaModal] = useState(false);
  const [albumMedia, setAlbumMedia] = useState([]);
  const [loadingAlbumMedia, setLoadingAlbumMedia] = useState(false);
  const [showAddToAlbumModal, setShowAddToAlbumModal] = useState(false);
  const [selectedMediaForAlbum, setSelectedMediaForAlbum] = useState(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [addingToAlbum, setAddingToAlbum] = useState(false);
  const [addingAlbumToCart, setAddingAlbumToCart] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSetCoverModal, setShowSetCoverModal] = useState(false);
  const [albumForCover, setAlbumForCover] = useState(null);
  const [settingCover, setSettingCover] = useState(false);

  const navigate = useNavigate();
  const token = getAuthToken();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch protected URLs
  const fetchProtectedUrls = useCallback(async (mediaItems) => {
    const urlMap = {};
    
    for (const item of mediaItems) {
      const mediaId = item._id;
      if (!mediaId) continue;
      
      try {
        let url = getImageUrl(item, null);
        
        if (!url || url === placeholderMedium) {
          try {
            const protectedUrl = await fetchProtectedUrl(mediaId, { userId, token });
            if (protectedUrl && protectedUrl.trim()) {
              url = protectedUrl;
            }
          } catch (err) {
            console.warn(`Failed to fetch protected URL for ${item.title}`);
          }
        }
        
        urlMap[mediaId] = url || placeholderMedium;
      } catch (err) {
        urlMap[mediaId] = placeholderMedium;
      }
    }
    
    setMediaUrls(urlMap);
  }, [userId]);

  // Fetch media
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyMedia();

      let mediaItems = [];
      if (Array.isArray(res.data)) {
        mediaItems = res.data;
      } else if (Array.isArray(res.data?.media)) {
        mediaItems = res.data.media;
      } else {
        mediaItems = [];
      }

      const userMedia = userId 
        ? mediaItems.filter(item => {
            const ownerId = item.photographer?._id || item.photographer?.id || item.owner || item.userId;
            return String(ownerId) === String(userId);
          })
        : mediaItems;

      setMedia(userMedia);
      await fetchProtectedUrls(userMedia);
    } catch (error) {
      console.error("Error fetching media:", error);
      setError(error.response?.data?.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [userId, fetchProtectedUrls]);

  // Load albums
  const loadAlbums = async () => {
    try {
      const res = await getAlbums();
      let list = [];
      if (Array.isArray(res.data)) {
        list = res.data;
      } else if (Array.isArray(res.data?.albums)) {
        list = res.data.albums;
      } else if (Array.isArray(res.data?.data)) {
        list = res.data.data;
      }
      
      const albumsWithCovers = await Promise.all(list.map(async (album) => {
        if (album.coverImage) {
          return album;
        }
        try {
          const mediaRes = await getAlbumMedia(album._id);
          const mediaList = mediaRes.data?.media || [];
          if (mediaList.length > 0) {
            const firstMedia = mediaList[0];
            const coverUrl = getImageUrl(firstMedia, null);
            return { ...album, coverImage: coverUrl || placeholderMedium };
          }
        } catch (err) {
          console.warn(`Failed to get cover for album ${album.name}`);
        }
        return { ...album, coverImage: placeholderMedium };
      }));
      
      setAlbums(albumsWithCovers);
    } catch (err) {
      console.warn("Failed to load albums:", err.message);
    }
  };

  // Add entire album to cart
  const handleAddAlbumToCart = async (album) => {
    if (!album || !album._id) {
      alert("No album selected");
      return;
    }
    
    setAddingAlbumToCart(true);
    try {
      const res = await getAlbumMedia(album._id);
      const mediaList = res.data?.media || [];
      
      if (mediaList.length === 0) {
        alert("This album has no media to add to cart.");
        return;
      }
      
      let addedCount = 0;
      for (const mediaItem of mediaList) {
        try {
          await addCart(mediaItem._id);
          addedCount++;
        } catch (err) {
          console.error(`Failed to add ${mediaItem.title}:`, err);
        }
      }
      
      if (addedCount > 0) {
        alert(`Added ${addedCount} items from "${album.name}" to cart!`);
        window.dispatchEvent(new CustomEvent("pm:cart-updated"));
      } else {
        alert("Failed to add any items to cart. Please try again.");
      }
    } catch (err) {
      console.error("Error adding album to cart:", err);
      alert(err.response?.data?.message || "Failed to add album to cart");
    } finally {
      setAddingAlbumToCart(false);
    }
  };

  // Create album
  const handleCreateAlbum = async (event) => {
    event.preventDefault();
    if (!newAlbumName.trim()) {
      setCreateAlbumError("Please enter a name for the album.");
      return;
    }

    setCreateAlbumError(null);
    setCreatingAlbum(true);

    try {
      const payload = {
        name: newAlbumName.trim(),
        description: newAlbumDescription.trim(),
      };

      const res = await createAlbum(payload);
      const data = res.data || {};
      const album = data.album || data;
      
      setAlbums(prev => [...prev, { ...album, coverImage: placeholderMedium }]);
      setNewAlbumName("");
      setNewAlbumDescription("");
      setShowAlbumModal(false);
      
    } catch (err) {
      console.error("Create album error:", err);
      const message = err.response?.data?.message || err.message || "Failed to create album";
      setCreateAlbumError(message);
    } finally {
      setCreatingAlbum(false);
    }
  };

  // Set album cover
  const handleSetAlbumCover = async (albumId, mediaId) => {
    setSettingCover(true);
    try {
      const mediaItem = media.find(m => m._id === mediaId);
      const coverUrl = getImageUrl(mediaItem, placeholderMedium);
      
      await updateAlbum(albumId, { coverImage: coverUrl });
      
      setAlbums(prev => prev.map(album => 
        album._id === albumId ? { ...album, coverImage: coverUrl } : album
      ));
      
      if (selectedAlbum && selectedAlbum._id === albumId) {
        setSelectedAlbum(prev => ({ ...prev, coverImage: coverUrl }));
      }
      
      alert("Album cover updated successfully!");
      setShowSetCoverModal(false);
      setAlbumForCover(null);
    } catch (err) {
      console.error("Failed to set album cover:", err);
      alert(err.response?.data?.message || "Failed to set album cover");
    } finally {
      setSettingCover(false);
    }
  };

  // Add media to album
  const handleAddToAlbum = async () => {
    if (!selectedMediaForAlbum || !selectedAlbumId) {
      alert("Please select a media item and an album");
      return;
    }

    setAddingToAlbum(true);
    try {
      await addMediaToAlbum(selectedAlbumId, selectedMediaForAlbum._id);
      alert("Media added to album successfully!");
      
      if (selectedAlbum && selectedAlbum._id === selectedAlbumId) {
        await refreshAlbumMedia(selectedAlbumId);
      }
      
      await loadAlbums();
      
      setShowAddToAlbumModal(false);
      setSelectedMediaForAlbum(null);
      setSelectedAlbumId("");
    } catch (err) {
      console.error("Error adding to album:", err);
      alert(err.response?.data?.message || "Failed to add media to album");
    } finally {
      setAddingToAlbum(false);
    }
  };

  // Remove media from album
  const handleRemoveFromAlbum = async (mediaId, albumId) => {
    if (!window.confirm("Remove this media from the album?")) return;
    
    try {
      await removeMediaFromAlbum(albumId, mediaId);
      await refreshAlbumMedia(albumId);
      await loadAlbums();
    } catch (err) {
      console.error("Error removing from album:", err);
      alert(err.response?.data?.message || "Failed to remove media from album");
    }
  };

  // Refresh album media
  const refreshAlbumMedia = async (albumId) => {
    try {
      const res = await getAlbumMedia(albumId);
      const data = res.data || {};
      setAlbumMedia(data.media || []);
    } catch (err) {
      console.error("Failed to refresh album media:", err);
    }
  };

  // Generate share link for MEDIA
  const generateMediaShareLink = async (item) => {
    if (!item || !item._id) {
      setShareError("No media selected.");
      return;
    }

    setShareError(null);
    setShareLoading(true);

    try {
      const payload = {
        mediaId: item._id,
        maxDownloads: parseInt(shareMaxDownloads, 10) || 10,
        expirationDays: parseInt(shareExpirationDays, 10) || 7,
      };

      if (shareMessage?.trim()) {
        payload.message = shareMessage.trim();
      }

      const res = await generateShareLink(payload);
      const data = res.data || {};
      const link = data.shareUrl || data.link || data.url;

      if (!link) {
        throw new Error("No share URL returned.");
      }

      setShareLink(link);
      setShareQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`);
    } catch (err) {
      setShareError(err.message || "Failed to generate share link");
    } finally {
      setShareLoading(false);
    }
  };

  // Generate share link for ALBUM
  const generateAlbumShareLink = async (album) => {
    if (!album?._id) {
      setShareError("No album selected.");
      return;
    }
    
    setShareError(null);
    setShareLoading(true);
    
    try {
      const payload = {
        albumId: album._id,
        maxDownloads: parseInt(shareMaxDownloads, 10) || 10,
        expirationDays: parseInt(shareExpirationDays, 10) || 7,
        message: shareMessage?.trim() || undefined,
      };
      const res = await generateShareLink(payload);
      const data = res.data || {};
      const link = data.shareUrl || data.link || data.url;
      
      if (!link) throw new Error("No share URL returned");
      
      setShareLink(link);
      setShareQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`);
    } catch (err) {
      setShareError(err.message || "Failed to generate share link");
      setShareLink("");
      setShareQrUrl("");
    } finally {
      setShareLoading(false);
    }
  };

  // View album details
  const handleViewAlbum = async (album) => {
    if (!album?._id) return;
    setLoadingAlbumMedia(true);
    setSelectedAlbum(album);
    try {
      const res = await getAlbumMedia(album._id);
      const data = res.data || {};
      setAlbumMedia(data.media || []);
      setShowAlbumMediaModal(true);
    } catch (err) {
      console.error("Failed to load album media:", err);
      alert(err.response?.data?.message || "Failed to load album");
    } finally {
      setLoadingAlbumMedia(false);
    }
  };

  // Update album
  const handleUpdateAlbum = async (e) => {
    e.preventDefault();
    if (!editingAlbum?._id) return;
    if (!editingAlbum.name?.trim()) {
      alert("Album name is required");
      return;
    }

    setUpdatingAlbum(true);
    try {
      const payload = {
        name: editingAlbum.name.trim(),
        description: editingAlbum.description?.trim() || "",
      };

      const res = await updateAlbum(editingAlbum._id, payload);
      const updatedAlbum = res.data?.album || res.data;

      setAlbums(prev => prev.map(album => 
        album._id === editingAlbum._id ? { ...album, ...updatedAlbum } : album
      ));
      
      setShowEditAlbumModal(false);
      setEditingAlbum(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update album");
    } finally {
      setUpdatingAlbum(false);
    }
  };

  // Delete album
  const handleDeleteAlbum = async (albumId) => {
    if (!window.confirm("Delete this album? The media will remain in your library.")) return;
    
    try {
      await deleteAlbum(albumId);
      setAlbums(prev => prev.filter(album => album._id !== albumId));
      if (selectedAlbum?._id === albumId) {
        setShowAlbumMediaModal(false);
        setSelectedAlbum(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete album");
    }
  };

  // Get media URL
  const getMediaUrl = (item) => {
    if (!item) return placeholderMedium;
    const id = item._id;
    return mediaUrls[id] || placeholderMedium;
  };

  // Handle media error
  const handleMediaError = (event, item) => {
    console.warn(`Media failed to load: ${item.title}`);
    if (event?.target) {
      event.target.src = placeholderMedium;
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this media permanently?")) return;
    
    try {
      await deleteMedia(id);
      setMedia(media.filter(item => item._id !== id));
      setMediaUrls(prev => {
        const newMap = { ...prev };
        delete newMap[id];
        return newMap;
      });
    } catch (error) {
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  // Handle price update
  const handlePriceUpdate = async (id, newPrice) => {
    if (!newPrice || newPrice <= 0) {
      alert("Please enter a valid price");
      return;
    }

    try {
      await updateMediaPrice(id, newPrice);
      setMedia(media.map(item => 
        item._id === id ? { ...item, price: newPrice } : item
      ));
      setEditingItem(null);
    } catch (error) {
      alert(error.response?.data?.message || "Price update failed");
    }
  };

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      const userStr = localStorage.getItem("user");
      const role = localStorage.getItem("role");
      
      if (!token) {
        setError("Please log in again.");
        setTimeout(() => navigate("/login"), 2000);
        setAuthChecked(true);
        return;
      }

      if (role !== "photographer" && role !== "admin") {
        setError("Access denied. Photographers and admins only.");
        setTimeout(() => navigate("/photographer/dashboard"), 2000);
        setAuthChecked(true);
        return;
      }

      if (userStr) {
        try {
          const id = getCurrentUserId();
          setUserId(id);
          await fetchMedia();
          await loadAlbums();
        } catch (err) {
          setError("Invalid user data.");
          setTimeout(() => navigate("/login"), 2000);
        }
      }
      
      setAuthChecked(true);
    };

    checkAuth();
  }, [fetchMedia, navigate]);

  // Stats
  const stats = {
    total: media.length,
    photos: media.filter(item => item.mediaType === "photo").length,
    videos: media.filter(item => item.mediaType === "video").length,
    totalValue: media.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0),
  };

  const glassStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  };

  if (!authChecked) {
    return (
      <PhotographerLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-warning mb-3"></div>
          <p className="text-white-50">Loading...</p>
        </div>
      </PhotographerLayout>
    );
  }

  return (
    <PhotographerLayout>
      <div className="position-relative px-2 px-sm-3">
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="fas fa-photo-video me-2 text-warning"></i>
              My Media
            </h4>
            <p className="text-white-50 small mb-0">
              Manage your photos and videos
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button 
              className="btn btn-outline-success rounded-pill px-3 px-sm-4 py-2"
              style={{ fontSize: isMobile ? "0.85rem" : "0.9rem" }}
              onClick={() => setShowAlbumModal(true)}
            >
              <i className="fas fa-folder-plus me-2"></i>
              {isMobile ? "Album" : "New Album"}
            </button>
            <button 
              className="btn btn-outline-warning rounded-pill px-3 px-sm-4 py-2"
              style={{ fontSize: isMobile ? "0.85rem" : "0.9rem" }}
              onClick={fetchMedia}
            >
              <i className="fas fa-sync-alt me-2"></i>
              {isMobile ? "Refresh" : "Refresh"}
            </button>
            <Link to="/photographer/upload" className="btn btn-warning rounded-pill px-3 px-sm-4 py-2">
              <i className="fas fa-plus me-2"></i>
              {isMobile ? "Upload" : "Upload"}
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="d-flex gap-2 mb-4 border-bottom border-secondary pb-2 overflow-x-auto">
          <button
            className={`btn btn-sm ${activeTab === "gallery" ? "btn-warning" : "btn-outline-secondary"} rounded-pill px-3 px-sm-4 flex-shrink-0`}
            onClick={() => setActiveTab("gallery")}
          >
            <i className="fas fa-images me-2"></i>
            Gallery ({media.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === "albums" ? "btn-warning" : "btn-outline-secondary"} rounded-pill px-3 px-sm-4 flex-shrink-0`}
            onClick={() => setActiveTab("albums")}
          >
            <i className="fas fa-folder me-2"></i>
            Albums ({albums.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === "stats" ? "btn-warning" : "btn-outline-secondary"} rounded-pill px-3 px-sm-4 flex-shrink-0`}
            onClick={() => setActiveTab("stats")}
          >
            <i className="fas fa-chart-line me-2"></i>
            Stats
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger mb-4">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {activeTab === "stats" && (
          <div className="row g-2 g-sm-3 mb-4">
            <div className="col-6 col-sm-3">
              <div className="card text-center p-2 p-sm-3" style={glassStyle}>
                <h3 className="text-warning fw-bold mb-1 fs-2 fs-sm-1">{stats.total}</h3>
                <small className="text-white-50 fs-7">Total Items</small>
              </div>
            </div>
            <div className="col-6 col-sm-3">
              <div className="card text-center p-2 p-sm-3" style={glassStyle}>
                <h3 className="text-info fw-bold mb-1 fs-2 fs-sm-1">{stats.photos}</h3>
                <small className="text-white-50 fs-7">Photos</small>
              </div>
            </div>
            <div className="col-6 col-sm-3">
              <div className="card text-center p-2 p-sm-3" style={glassStyle}>
                <h3 className="text-success fw-bold mb-1 fs-2 fs-sm-1">{stats.videos}</h3>
                <small className="text-white-50 fs-7">Videos</small>
              </div>
            </div>
            <div className="col-6 col-sm-3">
              <div className="card text-center p-2 p-sm-3" style={glassStyle}>
                <h3 className="text-warning fw-bold mb-1 fs-6 fs-sm-5">
                  KES {stats.totalValue.toLocaleString()}
                </h3>
                <small className="text-white-50 fs-7">Total Value</small>
              </div>
            </div>
          </div>
        )}

        {/* Albums Section with Add to Cart Button */}
        {activeTab === "albums" && (
          <div className="mb-4">
            {albums.length === 0 ? (
              <div className="text-center py-5" style={glassStyle}>
                <i className="fas fa-folder-open fa-4x text-white-50 mb-3"></i>
                <p className="text-white-50 mb-3">No albums yet. Create your first album!</p>
                <button className="btn btn-warning" onClick={() => setShowAlbumModal(true)}>
                  <i className="fas fa-plus me-2"></i>Create Album
                </button>
              </div>
            ) : (
              <div className="row g-2 g-sm-3">
                {albums.map((album) => (
                  <div className="col-6 col-sm-4 col-md-3" key={album._id}>
                    <div className="card bg-dark border-secondary h-100" style={{ borderRadius: "12px", overflow: "hidden" }}>
                      <div className="position-relative">
                        <img
                          src={album.coverImage || placeholderMedium}
                          className="card-img-top"
                          alt={album.name}
                          style={{ height: "140px", objectFit: "cover", cursor: "pointer" }}
                          onClick={() => handleViewAlbum(album)}
                          onError={(e) => { e.target.src = placeholderMedium; }}
                        />
                        <div className="position-absolute top-0 end-0 m-2">
                          <div className="dropdown">
                            <button className="btn btn-sm btn-dark rounded-circle" data-bs-toggle="dropdown">
                              <i className="fas fa-ellipsis-v"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end bg-dark border-secondary">
                              <li>
                                <button className="dropdown-item text-white" onClick={() => handleViewAlbum(album)}>
                                  <i className="fas fa-eye me-2 text-info"></i>View
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item text-white" onClick={() => {
                                  setAlbumForCover(album);
                                  setShowSetCoverModal(true);
                                }}>
                                  <i className="fas fa-image me-2 text-success"></i>Set Cover
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item text-white" onClick={() => {
                                  setEditingAlbum(album);
                                  setShowEditAlbumModal(true);
                                }}>
                                  <i className="fas fa-edit me-2 text-warning"></i>Edit
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item text-white" onClick={() => generateAlbumShareLink(album)}>
                                  <i className="fas fa-share-alt me-2 text-success"></i>Share
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item text-warning" onClick={() => handleAddAlbumToCart(album)} disabled={addingAlbumToCart}>
                                  <i className="fas fa-shopping-cart me-2"></i>
                                  {addingAlbumToCart ? 'Adding...' : 'Add All to Cart'}
                                </button>
                              </li>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button className="dropdown-item text-danger" onClick={() => handleDeleteAlbum(album._id)}>
                                  <i className="fas fa-trash me-2"></i>Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="card-body p-2 p-sm-3">
                        <h6 className="text-warning mb-1 text-truncate fs-7">{album.name}</h6>
                        <p className="text-white-50 small text-truncate mb-2 fs-8">
                          {album.description || 'No description'}
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-white-50 fs-8">
                            <i className="fas fa-calendar me-1"></i>
                            {new Date(album.createdAt).toLocaleDateString()}
                          </small>
                          <button 
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleViewAlbum(album)}
                          >
                            View ({album.mediaCount || 0})
                          </button>
                        </div>
                        <button 
                          className="btn btn-sm btn-warning w-100 mt-2"
                          onClick={() => handleAddAlbumToCart(album)}
                          disabled={addingAlbumToCart}
                        >
                          <i className="fas fa-shopping-cart me-1"></i>
                          {addingAlbumToCart ? 'Adding to Cart...' : 'Add All to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Media Gallery */}
        {activeTab === "gallery" && (
          <>
            {loading ? (
              <div className="text-center py-5" style={glassStyle}>
                <div className="spinner-border text-warning mb-3"></div>
                <p className="text-white-50">Loading...</p>
              </div>
            ) : media.length === 0 ? (
              <div className="text-center py-5" style={glassStyle}>
                <i className="fas fa-cloud-upload-alt fa-4x text-white-50 mb-3"></i>
                <h5 className="text-white mb-2">Your library is empty</h5>
                <Link to="/photographer/upload" className="btn btn-warning mt-3">
                  Upload Media
                </Link>
              </div>
            ) : (
              <div className="row g-2 g-sm-3">
                {media.map((item) => {
                  const mediaUrl = getMediaUrl(item);
                  const isEditing = editingItem === item._id;
                  return (
                    <div className="col-6 col-sm-4 col-md-3" key={item._id}>
                      <div className="card border-0 h-100" style={glassStyle}>
                        <div className="watermark-overlay protected-content position-relative" style={{ cursor: "pointer" }}>
                          <img
                            src={mediaUrl}
                            className="card-img-top protected-image"
                            alt={item.title}
                            style={{ height: "180px", objectFit: "cover", width: "100%" }}
                            onClick={() => {
                              setSelectedMedia(item);
                              setShowPreviewModal(true);
                            }}
                            onError={(e) => handleMediaError(e, item)}
                          />
                          {watermark && (
                            <div
                              style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%) rotate(-25deg)",
                                fontSize: isMobile ? 14 : 18,
                                fontWeight: "bold",
                                color: "rgba(255,255,255,0.35)",
                                textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
                                pointerEvents: "none",
                                zIndex: 10,
                                userSelect: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {watermark}
                            </div>
                          )}
                        </div>
                        <div className="card-body p-2 p-sm-3">
                          <h6 className="text-truncate mb-2 fs-7 fw-semibold">{item.title || "Untitled"}</h6>
                          <div className="mb-2">
                            <span className="badge bg-warning text-dark rounded-pill px-2 py-1 fs-8">
                              KES {item.price || 0}
                            </span>
                          </div>
                          {isEditing ? (
                            <div className="d-flex gap-1">
                              <input
                                type="number"
                                className="form-control form-control-sm bg-dark text-white"
                                defaultValue={item.price}
                                id={`price-${item._id}`}
                                style={{ fontSize: "0.75rem" }}
                              />
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => {
                                  const input = document.getElementById(`price-${item._id}`);
                                  handlePriceUpdate(item._id, parseFloat(input.value));
                                }}
                              >
                                Save
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setEditingItem(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex flex-wrap gap-1">
                              <button
                                className="btn btn-sm btn-outline-warning flex-grow-1"
                                onClick={() => setEditingItem(item._id)}
                                style={{ fontSize: "0.7rem", padding: "4px 6px" }}
                              >
                                Price
                              </button>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => {
                                  setSelectedMediaForAlbum(item);
                                  setShowAddToAlbumModal(true);
                                }}
                                style={{ fontSize: "0.7rem", padding: "4px 6px" }}
                              >
                                <i className="fas fa-folder-plus"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => setShareMedia(item)}
                                style={{ fontSize: "0.7rem", padding: "4px 6px" }}
                              >
                                <i className="fas fa-share-alt"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(item._id)}
                                style={{ fontSize: "0.7rem", padding: "4px 6px" }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Set Cover Modal */}
      {showSetCoverModal && albumForCover && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered m-3" style={{ maxWidth: isMobile ? "95%" : "600px" }}>
            <div className="modal-content bg-dark border-warning">
              <div className="modal-header border-warning p-3 p-sm-4">
                <h5 className="modal-title text-warning fs-6 fs-sm-5">
                  <i className="fas fa-image me-2"></i>
                  Set Album Cover - {albumForCover.name}
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowSetCoverModal(false)}></button>
              </div>
              <div className="modal-body p-3 p-sm-4">
                <p className="text-white-50 small mb-3">Select a media item to use as the album cover:</p>
                <div className="row g-2" style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {media.map((item) => (
                    <div className="col-4 col-sm-3" key={item._id}>
                      <div 
                        className="card bg-dark border-secondary cursor-pointer"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSetAlbumCover(albumForCover._id, item._id)}
                      >
                        <img
                          src={getMediaUrl(item)}
                          alt={item.title}
                          style={{ height: "80px", objectFit: "cover" }}
                          onError={(e) => { e.target.src = placeholderMedium; }}
                        />
                        <div className="card-body p-1 text-center">
                          <small className="text-white-50 text-truncate d-block fs-8">{item.title || "Untitled"}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {settingCover && (
                  <div className="text-center mt-3">
                    <div className="spinner-border text-warning spinner-border-sm"></div>
                    <span className="text-white-50 ms-2">Setting cover...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Album Modal */}
      {showAddToAlbumModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered m-3" style={{ maxWidth: isMobile ? "95%" : "500px" }}>
            <div className="modal-content bg-dark border-warning">
              <div className="modal-header border-warning p-3 p-sm-4">
                <h5 className="modal-title text-warning fs-6 fs-sm-5">
                  <i className="fas fa-plus me-2"></i>
                  Add to Album
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowAddToAlbumModal(false)}></button>
              </div>
              <div className="modal-body p-3 p-sm-4">
                <div className="mb-3">
                  <label className="form-label text-white small">Select Media</label>
                  <select 
                    className="form-select bg-dark text-white border-secondary"
                    value={selectedMediaForAlbum?._id || ""}
                    onChange={(e) => {
                      const mediaItem = media.find(m => m._id === e.target.value);
                      setSelectedMediaForAlbum(mediaItem);
                    }}
                  >
                    <option value="">Choose a media item...</option>
                    {media.map(item => (
                      <option key={item._id} value={item._id}>
                        {item.title || "Untitled"} - KES {item.price}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label text-white small">Select Album</label>
                  <select 
                    className="form-select bg-dark text-white border-secondary"
                    value={selectedAlbumId}
                    onChange={(e) => setSelectedAlbumId(e.target.value)}
                  >
                    <option value="">Choose an album...</option>
                    {albums.map(album => (
                      <option key={album._id} value={album._id}>
                        {album.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-warning flex-grow-1" 
                    onClick={handleAddToAlbum}
                    disabled={addingToAlbum || !selectedMediaForAlbum || !selectedAlbumId}
                  >
                    {addingToAlbum ? 'Adding...' : 'Add to Album'}
                  </button>
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={() => setShowAddToAlbumModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Album Modal */}
      {showAlbumModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered m-3" style={{ maxWidth: isMobile ? "95%" : "500px" }}>
            <div className="modal-content bg-dark border-warning">
              <div className="modal-header border-warning p-3 p-sm-4">
                <h5 className="modal-title text-warning fs-6 fs-sm-5">
                  <i className="fas fa-folder-plus me-2"></i>
                  Create New Album
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowAlbumModal(false)}></button>
              </div>
              <div className="modal-body p-3 p-sm-4">
                {createAlbumError && (
                  <div className="alert alert-danger small">{createAlbumError}</div>
                )}
                <form onSubmit={handleCreateAlbum}>
                  <div className="mb-3">
                    <label className="form-label text-white small">Album Name *</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-secondary"
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-white small">Description</label>
                    <textarea
                      className="form-control bg-dark text-white border-secondary"
                      rows="3"
                      value={newAlbumDescription}
                      onChange={(e) => setNewAlbumDescription(e.target.value)}
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-warning flex-grow-1" disabled={creatingAlbum}>
                      {creatingAlbum ? 'Creating...' : 'Create Album'}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAlbumModal(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Album Modal */}
      {showEditAlbumModal && editingAlbum && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered m-3" style={{ maxWidth: isMobile ? "95%" : "500px" }}>
            <div className="modal-content bg-dark border-warning">
              <div className="modal-header border-warning p-3 p-sm-4">
                <h5 className="modal-title text-warning fs-6 fs-sm-5">
                  <i className="fas fa-edit me-2"></i>
                  Edit Album
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowEditAlbumModal(false)}></button>
              </div>
              <div className="modal-body p-3 p-sm-4">
                <form onSubmit={handleUpdateAlbum}>
                  <div className="mb-3">
                    <label className="form-label text-white small">Album Name *</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-secondary"
                      value={editingAlbum.name || ""}
                      onChange={(e) => setEditingAlbum({ ...editingAlbum, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-white small">Description</label>
                    <textarea
                      className="form-control bg-dark text-white border-secondary"
                      rows="3"
                      value={editingAlbum.description || ""}
                      onChange={(e) => setEditingAlbum({ ...editingAlbum, description: e.target.value })}
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-warning flex-grow-1" disabled={updatingAlbum}>
                      {updatingAlbum ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEditAlbumModal(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Panel */}
      {shareMedia && (
        <div className="card bg-dark border-warning mb-4 mx-2 mx-sm-0">
          <div className="card-header bg-transparent border-warning d-flex flex-wrap justify-content-between align-items-center gap-2 p-3">
            <h6 className="mb-0 text-warning fs-7">
              <i className="fas fa-share-alt me-2"></i>
              Share: {shareMedia?.title || 'Media'}
            </h6>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setShareMedia(null)}>
              Close
            </button>
          </div>
          <div className="card-body p-3">
            <div className="row g-2">
              <div className="col-6 mb-2">
                <label className="form-label text-white-50 small">Max Downloads</label>
                <input
                  type="number"
                  className="form-control form-control-sm bg-dark border-secondary text-white"
                  value={shareMaxDownloads}
                  onChange={(e) => setShareMaxDownloads(e.target.value)}
                  min={1}
                />
              </div>
              <div className="col-6 mb-2">
                <label className="form-label text-white-50 small">Expires (days)</label>
                <input
                  type="number"
                  className="form-control form-control-sm bg-dark border-secondary text-white"
                  value={shareExpirationDays}
                  onChange={(e) => setShareExpirationDays(e.target.value)}
                  min={1}
                />
              </div>
              <div className="col-12 mb-2">
                <label className="form-label text-white-50 small">Message (optional)</label>
                <textarea
                  className="form-control form-control-sm bg-dark border-secondary text-white"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  rows={2}
                />
              </div>
              {shareError && (
                <div className="col-12 mb-2">
                  <div className="alert alert-danger small p-2">{shareError}</div>
                </div>
              )}
              <div className="col-12">
                <button
                  className="btn btn-warning w-100 btn-sm"
                  onClick={() => generateMediaShareLink(shareMedia)}
                  disabled={shareLoading}
                >
                  {shareLoading ? 'Generating...' : 'Generate Share Link'}
                </button>
              </div>
              {shareLink && (
                <>
                  <div className="col-12 mt-2">
                    <div className="bg-dark p-2 rounded border border-warning">
                      <p className="text-white-50 small mb-1">Share Link</p>
                      <a href={shareLink} className="text-warning small" target="_blank" rel="noopener noreferrer" style={{ wordBreak: "break-all" }}>
                        {shareLink}
                      </a>
                    </div>
                  </div>
                  {shareQrUrl && (
                    <div className="col-12 mt-2 text-center">
                      <img src={shareQrUrl} alt="QR Code" width={100} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Album Media Modal with Add to Cart Button */}
      {showAlbumMediaModal && selectedAlbum && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.9)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered m-2" style={{ maxWidth: isMobile ? "95%" : "800px" }}>
            <div className="modal-content bg-dark border-warning">
              <div className="modal-header border-warning p-3">
                <div>
                  <h5 className="modal-title text-warning fs-6 fs-sm-5">
                    <i className="fas fa-folder-open me-2"></i>
                    {selectedAlbum.name}
                  </h5>
                  <p className="text-white-50 small mb-0 mt-1">{selectedAlbum.description}</p>
                </div>
                <button className="btn-close btn-close-white" onClick={() => setShowAlbumMediaModal(false)}></button>
              </div>
              <div className="modal-body p-3">
                <div className="mb-3 d-flex flex-wrap gap-2">
                  <button 
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => {
                      setSelectedMediaForAlbum(null);
                      setShowAddToAlbumModal(true);
                    }}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Add Media
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-success"
                    onClick={() => {
                      setAlbumForCover(selectedAlbum);
                      setShowSetCoverModal(true);
                      setShowAlbumMediaModal(false);
                    }}
                  >
                    <i className="fas fa-image me-2"></i>
                    Set Cover
                  </button>
                  <button 
                    className="btn btn-sm btn-warning"
                    onClick={() => handleAddAlbumToCart(selectedAlbum)}
                    disabled={addingAlbumToCart}
                  >
                    <i className="fas fa-shopping-cart me-2"></i>
                    {addingAlbumToCart ? 'Adding...' : 'Add All to Cart'}
                  </button>
                </div>
                {loadingAlbumMedia ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-warning"></div>
                  </div>
                ) : albumMedia.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-image fa-3x text-white-50 mb-2"></i>
                    <p className="text-white-50 small">This album has no media yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 text-end">
                      <small className="text-white-50">
                        Total: {albumMedia.length} items | 
                        KES {albumMedia.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toLocaleString()}
                      </small>
                    </div>
                    <div className="row g-2">
                      {albumMedia.map((item) => (
                        <div className="col-6 col-sm-4 col-md-3" key={item._id}>
                          <div className="card bg-dark border-secondary">
                            <img
                              src={getMediaUrl(item)}
                              className="card-img-top"
                              alt={item.title}
                              style={{ height: "120px", objectFit: "cover", cursor: "pointer" }}
                              onClick={() => {
                                setSelectedMedia(item);
                                setShowPreviewModal(true);
                              }}
                              onError={(e) => handleMediaError(e, item)}
                            />
                            <div className="card-body p-2">
                              <small className="text-white-50 text-truncate d-block fs-8">{item.title || 'Untitled'}</small>
                              <div className="mt-1">
                                <span className="badge bg-warning text-dark fs-8">KES {item.price || 0}</span>
                              </div>
                              <div className="mt-2 d-flex gap-1">
                                <button 
                                  className="btn btn-sm btn-outline-warning flex-grow-1"
                                  onClick={() => {
                                    setSelectedMedia(item);
                                    setShowPreviewModal(true);
                                  }}
                                  style={{ fontSize: "0.65rem", padding: "2px 4px" }}
                                >
                                  Details
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveFromAlbum(item._id, selectedAlbum._id)}
                                  style={{ fontSize: "0.65rem", padding: "2px 4px" }}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedMedia && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.9)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered m-2" style={{ maxWidth: isMobile ? "95%" : "600px" }}>
            <div className="modal-content bg-dark">
              <div className="modal-header border-secondary p-3">
                <h5 className="text-white fs-6">{selectedMedia.title || 'Media Details'}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowPreviewModal(false)}></button>
              </div>
              <div className="modal-body text-center p-3">
                <img
                  src={getMediaUrl(selectedMedia)}
                  alt={selectedMedia.title}
                  className="img-fluid rounded"
                  style={{ maxHeight: "50vh" }}
                  onError={(e) => handleMediaError(e, selectedMedia)}
                />
                <div className="mt-3 text-start">
                  <p className="small mb-1"><strong className="text-warning">Price:</strong> KES {selectedMedia.price}</p>
                  <p className="small mb-1"><strong className="text-warning">Likes:</strong> {selectedMedia.likes || 0}</p>
                  <p className="small mb-1"><strong className="text-warning">Views:</strong> {selectedMedia.views || 0}</p>
                  <p className="small mb-2"><strong className="text-warning">Downloads:</strong> {selectedMedia.downloads || 0}</p>
                  {albums.length > 0 && (
                    <div>
                      <label className="text-warning small">Add to Album:</label>
                      <select 
                        className="form-select form-select-sm bg-dark text-white border-secondary mt-1"
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedMediaForAlbum(selectedMedia);
                            setSelectedAlbumId(e.target.value);
                            handleAddToAlbum();
                          }
                        }}
                      >
                        <option value="">Select album</option>
                        {albums.map(album => (
                          <option key={album._id} value={album._id}>{album.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS */}
      <style>{`
        @media (max-width: 576px) {
          .fs-7 {
            font-size: 0.75rem !important;
          }
          .fs-8 {
            font-size: 0.65rem !important;
          }
          .btn-sm {
            padding: 0.25rem 0.5rem;
          }
          .card-body {
            padding: 0.5rem !important;
          }
        }
        
        .overflow-x-auto {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }
        
        .overflow-x-auto::-webkit-scrollbar {
          height: 3px;
        }
        
        .overflow-x-auto::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: rgba(255,193,7,0.5);
          border-radius: 10px;
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </PhotographerLayout>
  );
};

export default PhotographerMedia;