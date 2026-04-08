import React, { useState, useEffect } from "react";
import PhotographerLayout from "./PhotographerLayout";
import { useNavigate } from "react-router-dom";
import { uploadMedia, getAllMedia } from "../../../api/API";
import { API_BASE_URL } from "../../../api/apiConfig";

const PhotographerUpload = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    mediaType: "photo",
    tags: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  
  // Fading banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [nextBannerIndex, setNextBannerIndex] = useState(1);
  const [isFading, setIsFading] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const bannerImages = [
    { 
      id: 1, 
      url: "https://images.unsplash.com/photo-1492691527719-9d1e4e485a21?auto=format&fit=crop&w=800&q=80", 
      title: "Upload Tips", 
      description: "High-quality images sell better. Use clear titles and relevant tags.",
      badge: "Pro Tip",
      icon: "fas fa-lightbulb"
    },
    { 
      id: 2, 
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80", 
      title: "Pricing Strategy", 
      description: "Set competitive prices to attract more buyers. Check market rates!",
      badge: "Pricing Guide",
      icon: "fas fa-chart-line"
    },
    { 
      id: 3, 
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80", 
      title: "SEO Optimization", 
      description: "Use descriptive titles and tags to make your content discoverable.",
      badge: "SEO Tips",
      icon: "fas fa-search"
    },
    { 
      id: 4, 
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80", 
      title: "Quality Matters", 
      description: "High-resolution images get 3x more sales. Upload in HD!",
      badge: "Quality Check",
      icon: "fas fa-crown"
    },
    { 
      id: 5, 
      url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80", 
      title: "Earn More", 
      description: "Consistent uploaders earn up to 50% more revenue monthly.",
      badge: "Revenue Tips",
      icon: "fas fa-dollar-sign"
    }
  ];

  // Auto-rotate banner images with fade effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length);
        setNextBannerIndex((prev) => (prev + 1) % bannerImages.length);
        setIsFading(false);
      }, 500);
    }, 5000);
    
    setNextBannerIndex(1 % bannerImages.length);
    return () => clearInterval(interval);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check authentication and role on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const role = localStorage.getItem("role");
      
      console.log("🔐 Auth Check - Token:", token ? "Present" : "Missing");
      console.log("🔐 Auth Check - Role:", role);
      console.log("🔐 Auth Check - User:", userStr);

      setUserRole(role);

      if (!token) {
        setError("No authentication token found. Please log in again.");
        setTimeout(() => navigate("/login"), 2000);
        return false;
      }

      // Allow both photographers AND admins
      if (role !== "photographer" && role !== "admin") {
        setError(`Access denied. Your role is "${role}". Photographers and admins only.`);
        setTimeout(() => navigate("/photographer/dashboard"), 2000);
        return false;
      }

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const id = user._id || user.id || user.photographerId || user.userId;
          setUserId(id);
          console.log("✅ User ID found:", id);
          console.log("✅ Role:", role, "- Access granted");
          return true;
        } catch (err) {
          console.error("Error parsing user data:", err);
          setError("Invalid user data. Please log in again.");
          setTimeout(() => navigate("/login"), 2000);
          return false;
        }
      } else {
        setError("User data not found. Please log in again.");
        setTimeout(() => navigate("/login"), 2000);
        return false;
      }
    };

    const isAuthenticated = checkAuth();
    setAuthChecked(true);
    setLoading(false);
  }, [navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError("Only image and video files are allowed");
        return;
      }
      
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setError("");
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Starting upload process...");
    console.log("User ID:", userId);
    console.log("File:", imageFile);

    if (!userId) {
      setError("User ID not found. Please log in again.");
      return;
    }

    if (!imageFile) {
      setError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", imageFile);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("price", formData.price);
      formDataToSend.append("mediaType", formData.mediaType);
      formDataToSend.append("photographer", userId);
      
      if (formData.tags) {
        const tagsArray = formData.tags.split(",").map(tag => tag.trim());
        formDataToSend.append("tags", JSON.stringify(tagsArray));
      }

      console.log("Sending request to:", API_BASE_URL);

      const response = await uploadMedia(formDataToSend, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      console.log("Upload successful!", response.data);
      alert("Media uploaded successfully!");
      const uploadedItem = response.data?.media || response.data?.item || response.data;
      navigate("/photographer/media", { state: { recentUpload: uploadedItem } });
      
    } catch (error) {
      console.error("Upload error:", error);
      setError(
        error.response?.data?.message || 
        error.message || 
        "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const testConnection = async () => {
    try {
      const response = await getAllMedia();
      console.log("API connection successful:", response.data);
      alert("✅ API is reachable!");
    } catch (error) {
      console.error("API connection failed:", error);
      alert("❌ Cannot reach API. Check if server is running");
    }
  };

  const glassStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  };

  if (!authChecked || loading) {
    return (
      <PhotographerLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-white-50 mt-3">Checking authentication...</p>
        </div>
      </PhotographerLayout>
    );
  }

  return (
    <PhotographerLayout>
      {/* Background Image */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2070&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: "0.1",
          zIndex: 0,
        }}
      ></div>

      {/* Content */}
      <div className="position-relative" style={{ zIndex: 1 }}>
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="fas fa-cloud-upload-alt me-2 text-warning"></i>
              Upload Media
            </h4>
            <p className="text-white-50 small mb-0">
              <i className="fas fa-info-circle me-2"></i>
              Share your creativity with the world
            </p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-md-0">
            <button 
              className="btn btn-outline-info rounded-pill px-4"
              onClick={testConnection}
              type="button"
            >
              <i className="fas fa-plug me-2"></i>
              Test Connection
            </button>
            <button 
              className="btn btn-outline-warning rounded-pill px-4"
              onClick={() => navigate("/photographer/media")}
              type="button"
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to Media
            </button>
          </div>
        </div>

        {/* Debug Info */}
        <div 
          className="alert mb-4"
          style={{
            background: "rgba(0, 123, 255, 0.1)",
            border: "1px solid rgba(0, 123, 255, 0.3)",
            borderRadius: "12px",
            color: "#17a2b8",
          }}
        >
          <div className="d-flex align-items-center">
            <i className="fas fa-bug me-3 fa-lg"></i>
            <div>
              <small className="d-block">
                <strong>Debug Info:</strong>
              </small>
              <small className="d-block">
                User ID: {userId || "❌ Not found"} | 
                Role: {userRole || "❌ No role"} |
                Token: {token ? "✅ Present" : "❌ Missing"} |
                Status: {(userRole === "photographer" || userRole === "admin") ? "✅ Access granted" : "❌ Access denied"}
              </small>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar Layout */}
        <div className="row g-4">
          
          {/* Main Form Area */}
          <div className={`${!isMobile ? 'col-lg-8' : 'col-12'}`}>
            <div 
              className="card border-0 h-100"
              style={{
                ...glassStyle,
                borderRadius: "24px",
              }}
            >
              <div className="card-body p-4">
                {error && (
                  <div 
                    className="alert d-flex align-items-center mb-4" 
                    style={{
                      background: "rgba(220, 53, 69, 0.1)",
                      border: "1px solid rgba(220, 53, 69, 0.3)",
                      borderRadius: "12px",
                      color: "#dc3545",
                    }}
                  >
                    <i className="fas fa-exclamation-circle me-2"></i>
                    <span>{error}</span>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white ms-auto" 
                      onClick={() => setError("")}
                    ></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Title Field */}
                  <div className="mb-4">
                    <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wide mb-2">
                      <i className="fas fa-heading me-2 text-warning"></i>
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control bg-transparent text-white"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "12px",
                        padding: "12px",
                      }}
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Enter media title"
                      required
                    />
                  </div>

                  {/* Description Field */}
                  <div className="mb-4">
                    <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wide mb-2">
                      <i className="fas fa-align-left me-2 text-warning"></i>
                      Description
                    </label>
                    <textarea
                      className="form-control bg-transparent text-white"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "12px",
                        padding: "12px",
                      }}
                      rows="4"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe your media..."
                    ></textarea>
                  </div>

                  {/* Price and Type Row */}
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wide mb-2">
                        <i className="fas fa-tag me-2 text-warning"></i>
                        Price (KES) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span 
                          className="input-group-text bg-transparent text-warning"
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          KES
                        </span>
                        <input
                          type="number"
                          className="form-control bg-transparent text-white"
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          placeholder="0.00"
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-4">
                      <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wide mb-2">
                        <i className="fas fa-film me-2 text-warning"></i>
                        Media Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select bg-transparent text-white"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "12px",
                          padding: "12px",
                        }}
                        value={formData.mediaType}
                        onChange={(e) => setFormData({...formData, mediaType: e.target.value})}
                        required
                      >
                        <option value="photo" className="bg-dark">📷 Photo</option>
                        <option value="video" className="bg-dark">🎥 Video</option>
                      </select>
                    </div>
                  </div>

                  {/* Tags Field */}
                  <div className="mb-4">
                    <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wide mb-2">
                      <i className="fas fa-tags me-2 text-warning"></i>
                      Tags
                    </label>
                    <input
                      type="text"
                      className="form-control bg-transparent text-white"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "12px",
                        padding: "12px",
                      }}
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      placeholder="nature, sunset, travel (comma separated)"
                    />
                    <small className="text-white-50 mt-1 d-block">
                      <i className="fas fa-info-circle me-1"></i>
                      Separate tags with commas
                    </small>
                  </div>

                  {/* File Upload */}
                  <div className="mb-4">
                    <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wide mb-2">
                      <i className="fas fa-file me-2 text-warning"></i>
                      Upload File <span className="text-danger">*</span>
                    </label>
                    <div
                      className="border-2 border-dashed rounded-4 p-4 text-center cursor-pointer"
                      style={{
                        border: "2px dashed rgba(255, 255, 255, 0.1)",
                        background: "rgba(255, 255, 255, 0.02)",
                      }}
                    >
                      <input
                        type="file"
                        className="d-none"
                        id="fileUpload"
                        onChange={handleFileChange}
                        accept="image/*,video/*"
                        required
                      />
                      <label htmlFor="fileUpload" className="d-block cursor-pointer">
                        <i className="fas fa-cloud-upload-alt fa-3x text-warning mb-3"></i>
                        <p className="text-white mb-1">
                          {imageFile ? imageFile.name : "Drag & drop or click to upload"}
                        </p>
                        <small className="text-white-50">
                          Supported: JPG, PNG, GIF, MP4, MOV (Max 10MB)
                        </small>
                      </label>
                    </div>
                  </div>

                  {/* Upload Progress Bar */}
                  {uploading && uploadProgress > 0 && (
                    <div className="mb-4">
                      <div className="d-flex justify-content-between mb-1">
                        <small className="text-white-50">Uploading...</small>
                        <small className="text-warning">{uploadProgress}%</small>
                      </div>
                      <div className="progress" style={{ height: "6px", background: "rgba(255,255,255,0.1)" }}>
                        <div 
                          className="progress-bar bg-warning" 
                          role="progressbar" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-warning w-100 py-3 fw-bold rounded-pill mt-3"
                    disabled={uploading || !userId || !imageFile}
                  >
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Uploading... {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <i className="fas fa-cloud-upload-alt me-2"></i>
                        Publish Media
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR - Preview + Fading Banner */}
          {!isMobile && (
            <div className="col-lg-4">
              <div className="position-sticky" style={{ top: "100px" }}>
                
                {/* Preview Panel */}
                <div 
                  className="card border-0 mb-4"
                  style={{
                    ...glassStyle,
                    borderRadius: "24px",
                  }}
                >
                  <div className="card-header bg-transparent border-warning border-opacity-25 p-4">
                    <h5 className="mb-0">
                      <i className="fas fa-eye me-2 text-warning"></i>
                      Preview
                    </h5>
                  </div>
                  <div className="card-body p-4 text-center">
                    {preview ? (
                      <>
                        {formData.mediaType === "video" ? (
                          <video
                            src={preview}
                            className="img-fluid rounded-3 mb-3"
                            style={{ maxHeight: "200px", width: "100%", objectFit: "cover" }}
                            controls
                          />
                        ) : (
                          <img
                            src={preview}
                            alt="Preview"
                            className="img-fluid rounded-3 mb-3"
                            style={{ maxHeight: "200px", width: "100%", objectFit: "cover" }}
                          />
                        )}
                        
                        <div className="mt-3">
                          {formData.title && (
                            <h6 className="text-white mb-2">{formData.title}</h6>
                          )}
                          
                          <div className="d-flex justify-content-center gap-2">
                            {formData.price && (
                              <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">
                                KES {formData.price}
                              </span>
                            )}
                            <span className="badge bg-info bg-opacity-25 text-info px-3 py-2 rounded-pill">
                              {formData.mediaType}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-5">
                        <i className="fas fa-image fa-4x text-white-50 mb-3"></i>
                        <p className="text-white-50">No file selected</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fading Banner Component */}
                <div className="position-relative rounded-4 overflow-hidden mb-4" style={{ 
                  height: "380px",
                  background: "#0a0a0a",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
                }}>
                  {/* Current Banner Image */}
                  <div
                    className="position-absolute w-100 h-100"
                    style={{
                      backgroundImage: `url(${bannerImages[currentBannerIndex].url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      transition: "opacity 0.8s ease-in-out",
                      opacity: isFading ? 0 : 1,
                      zIndex: 1
                    }}
                  >
                    <div className="position-absolute w-100 h-100" style={{
                      background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.9) 100%)"
                    }}></div>
                  </div>
                  
                  {/* Next Banner Image */}
                  <div
                    className="position-absolute w-100 h-100"
                    style={{
                      backgroundImage: `url(${bannerImages[nextBannerIndex].url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      transition: "opacity 0.8s ease-in-out",
                      opacity: isFading ? 1 : 0,
                      zIndex: 0
                    }}
                  >
                    <div className="position-absolute w-100 h-100" style={{
                      background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.9) 100%)"
                    }}></div>
                  </div>
                  
                  {/* Banner Content */}
                  <div className="position-relative h-100 d-flex flex-column justify-content-end p-4" style={{ zIndex: 2 }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className={`${bannerImages[currentBannerIndex].icon} text-warning fa-lg`}></i>
                      <div className="badge bg-warning text-dark rounded-pill px-3 py-1">
                        {bannerImages[currentBannerIndex].badge}
                      </div>
                    </div>
                    <h5 className="fw-bold mb-2">{bannerImages[currentBannerIndex].title}</h5>
                    <p className="text-white-50 small mb-3">
                      {bannerImages[currentBannerIndex].description}
                    </p>
                  </div>
                  
                  {/* Dots Indicator */}
                  <div className="position-absolute bottom-0 start-0 end-0 d-flex justify-content-center gap-2 pb-3" style={{ zIndex: 3 }}>
                    {bannerImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setIsFading(true);
                          setTimeout(() => {
                            setCurrentBannerIndex(idx);
                            setNextBannerIndex((idx + 1) % bannerImages.length);
                            setIsFading(false);
                          }, 500);
                        }}
                        className="border-0 rounded-pill transition-all"
                        style={{
                          width: currentBannerIndex === idx ? "24px" : "6px",
                          height: "6px",
                          backgroundColor: currentBannerIndex === idx ? "#ffc107" : "rgba(255,255,255,0.4)",
                          cursor: "pointer"
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Tips Card */}
                <div 
                  className="card border-0"
                  style={{
                    ...glassStyle,
                    borderRadius: "24px",
                  }}
                >
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="fas fa-chart-line text-warning fa-lg"></i>
                      <h6 className="fw-bold mb-0">Upload Best Practices</h6>
                    </div>
                    <ul className="list-unstyled mb-0">
                      <li className="d-flex align-items-start gap-2 mb-2">
                        <i className="fas fa-check-circle text-success mt-1 small"></i>
                        <small className="text-white-50">Use high-resolution images (minimum 1920x1080)</small>
                      </li>
                      <li className="d-flex align-items-start gap-2 mb-2">
                        <i className="fas fa-check-circle text-success mt-1 small"></i>
                        <small className="text-white-50">Add descriptive titles and relevant tags</small>
                      </li>
                      <li className="d-flex align-items-start gap-2 mb-2">
                        <i className="fas fa-check-circle text-success mt-1 small"></i>
                        <small className="text-white-50">Set competitive prices based on quality</small>
                      </li>
                      <li className="d-flex align-items-start gap-2">
                        <i className="fas fa-check-circle text-success mt-1 small"></i>
                        <small className="text-white-50">Upload consistently to build your portfolio</small>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .cursor-pointer {
          cursor: pointer;
        }
        
        .transition-all {
          transition: all 0.3s ease;
        }
        
        .border-dashed {
          border-style: dashed;
        }
        
        .tracking-wide {
          letter-spacing: 0.5px;
        }
      `}</style>
    </PhotographerLayout>
  );
};

export default PhotographerUpload;