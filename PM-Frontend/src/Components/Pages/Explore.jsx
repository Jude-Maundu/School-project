import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  
  // Fading banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [nextBannerIndex, setNextBannerIndex] = useState(1);
  const [isFading, setIsFading] = useState(false);
  
  const navigate = useNavigate();

  const bannerImages = [
    { 
      id: 1, 
      url: "https://images.unsplash.com/photo-1492691527719-9d1e4e485a21?auto=format&fit=crop&w=800&q=80", 
      title: "Premium Photography", 
      description: "Discover breathtaking images from top photographers worldwide",
      badge: "Featured Collection",
      buttonText: "Start Exploring",
      price: "From $19"
    },
    { 
      id: 2, 
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80", 
      title: "Limited Time Offer", 
      description: "Get 30% off on all nature photography - this week only!",
      badge: "Summer Sale",
      buttonText: "Shop Now",
      price: "Save 30%"
    },
    { 
      id: 3, 
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80", 
      title: "New Arrivals", 
      description: "Fresh content added daily from emerging creators",
      badge: "Just Added",
      buttonText: "View New",
      price: "New"
    },
    { 
      id: 4, 
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80", 
      title: "Editor's Choice", 
      description: "Curated collection of award-winning photography",
      badge: "Premium Selection",
      buttonText: "Explore Collection",
      price: "Curated"
    },
    { 
      id: 5, 
      url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80", 
      title: "Free Downloads", 
      description: "Limited time: select photos available for free download",
      badge: "Free Offer",
      buttonText: "Get Free Photos",
      price: "FREE"
    }
  ];

  // Auto-rotate banner images
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

  // Mock data
  const mockCategories = [
    { id: 'all', name: 'All', icon: 'fas fa-th-large', count: 1250, color: '#ffc107' },
    { id: 'nature', name: 'Nature', icon: 'fas fa-leaf', count: 342, color: '#4caf50' },
    { id: 'travel', name: 'Travel', icon: 'fas fa-plane', count: 289, color: '#2196f3' },
    { id: 'lifestyle', name: 'Lifestyle', icon: 'fas fa-camera-retro', count: 415, color: '#9c27b0' },
    { id: 'food', name: 'Food', icon: 'fas fa-utensils', count: 178, color: '#ff9800' },
    { id: 'architecture', name: 'Architecture', icon: 'fas fa-building', count: 234, color: '#607d8b' },
    { id: 'technology', name: 'Technology', icon: 'fas fa-microchip', count: 156, color: '#00bcd4' },
    { id: 'portrait', name: 'Portrait', icon: 'fas fa-user', count: 198, color: '#e91e63' },
    { id: 'sports', name: 'Sports', icon: 'fas fa-futbol', count: 124, color: '#f44336' },
  ];

  const mockPhotos = [
    {
      id: 1,
      title: "Mountain Serenity",
      photographer: "Alex Rivera",
      price: 29,
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      likes: 234,
      downloads: 1245,
      category: "nature",
      tags: ["mountain", "nature", "landscape"],
      licenseType: "commercial",
      rating: 4.8,
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      title: "Urban Explorer",
      photographer: "Nina Patel",
      price: 39,
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
      likes: 187,
      downloads: 892,
      category: "travel",
      tags: ["city", "urban", "street"],
      licenseType: "commercial",
      rating: 4.6,
      createdAt: "2024-01-20"
    },
    {
      id: 3,
      title: "Ocean Dreams",
      photographer: "Marcus Webb",
      price: 34,
      image: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&h=400&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&h=300&fit=crop",
      likes: 312,
      downloads: 2156,
      category: "nature",
      tags: ["ocean", "beach", "waves"],
      licenseType: "commercial",
      rating: 4.9,
      createdAt: "2024-01-10"
    },
    {
      id: 4,
      title: "Forest Magic",
      photographer: "Lisa Chang",
      price: 27,
      image: "https://images.unsplash.com/photo-1426604966841-d7cdac3996e5?w=600&h=400&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1426604966841-d7cdac3996e5?w=400&h=300&fit=crop",
      likes: 156,
      downloads: 734,
      category: "nature",
      tags: ["forest", "trees", "magic"],
      licenseType: "personal",
      rating: 4.7,
      createdAt: "2024-01-18"
    },
    {
      id: 5,
      title: "City Lights",
      photographer: "David Kim",
      price: 32,
      image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&h=400&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop",
      likes: 421,
      downloads: 3102,
      category: "architecture",
      tags: ["city", "night", "lights"],
      licenseType: "commercial",
      rating: 4.9,
      createdAt: "2024-01-05"
    },
    {
      id: 6,
      title: "Abstract Art",
      photographer: "Sofia Martinez",
      price: 45,
      image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&h=400&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=300&fit=crop",
      likes: 278,
      downloads: 1567,
      category: "lifestyle",
      tags: ["abstract", "art", "colorful"],
      licenseType: "commercial",
      rating: 4.8,
      createdAt: "2024-01-12"
    },
    {
      id: 7,
      title: "Delicious Burger",
      photographer: "Carlos Mendez",
      price: 24,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
      likes: 445,
      downloads: 2876,
      category: "food",
      tags: ["food", "burger", "delicious"],
      licenseType: "commercial",
      rating: 4.9,
      createdAt: "2024-01-08"
    },
    {
      id: 8,
      title: "Tech Workspace",
      photographer: "Emily Chen",
      price: 38,
      image: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=600&h=400&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=400&h=300&fit=crop",
      likes: 198,
      downloads: 1243,
      category: "technology",
      tags: ["technology", "workspace", "laptop"],
      licenseType: "commercial",
      rating: 4.7,
      createdAt: "2024-01-14"
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setPhotos(mockPhotos);
      setCategories(mockCategories);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (selectedCategory !== 'all') {
      setSearchParams({ category: selectedCategory });
    } else {
      setSearchParams({});
    }
  }, [selectedCategory, setSearchParams]);

  const filteredPhotos = photos.filter(photo => {
    const matchesCategory = selectedCategory === 'all' || photo.category === selectedCategory;
    const matchesPrice = photo.price >= priceRange[0] && photo.price <= priceRange[1];
    const matchesSearch = photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          photo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesPrice && matchesSearch;
  });

  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    switch(sortBy) {
      case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
      case 'popular': return b.likes - a.likes;
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      default: return 0;
    }
  });

  return (
    <div className="bg-dark text-white min-vh-100" style={{ 
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    }}>
      {/* Modern Navigation */}
      <nav className="navbar navbar-expand-lg fixed-top w-100 py-3" style={{
        background: "rgba(0, 0, 0, 0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 193, 7, 0.2)",
        zIndex: 1000
      }}>
        <div className="container px-3 px-lg-4">
          <Link to="/" className="navbar-brand fw-bold text-decoration-none d-flex align-items-center gap-2">
            <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
              <i className="fas fa-camera text-dark fs-5"></i>
            </div>
            <span className="fs-4 fw-bold">
              <span className="text-white">Photo</span>
              <span className="text-warning">Market</span>
            </span>
          </Link>
          
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <i className="fas fa-bars text-warning fs-3"></i>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center gap-2 gap-lg-3">
              <li className="nav-item">
                <Link className="nav-link text-white px-3 py-2 rounded-pill hover-bg-warning transition" to="/explore">
                  <i className="fas fa-compass me-1"></i> Explore
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white px-3 py-2 rounded-pill hover-bg-warning transition" to="/pricing">
                  <i className="fas fa-tag me-1"></i> Pricing
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white px-3 py-2 rounded-pill hover-bg-warning transition" to="/become-seller">
                  <i className="fas fa-crown me-1"></i> Sell
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/login">
                  <button className="btn btn-outline-warning rounded-pill px-4 py-2 hover-glow">
                    <i className="fas fa-sign-in-alt me-2"></i> Sign In
                  </button>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register">
                  <button className="btn btn-warning rounded-pill px-4 py-2 text-dark fw-semibold hover-scale">
                    <i className="fas fa-user-plus me-2"></i> Join Free
                  </button>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content with Sidebar */}
      <div className="container px-3 px-lg-4" style={{ paddingTop: "100px" }}>
        <div className="row g-4">
          
          {/* Main Content Area */}
          <div className={`${!isMobile ? 'col-lg-9' : 'col-12'}`}>
            
            {/* Hero Section */}
            <div className="text-center mb-5">
              <div className="d-inline-flex align-items-center gap-2 bg-warning bg-opacity-10 rounded-pill px-4 py-2 mb-4">
                <i className="fas fa-fire text-warning"></i>
                <span className="text-warning small fw-semibold">50,000+ Premium Photos</span>
              </div>
              <h1 className="display-3 fw-bold mb-3" style={{ 
                background: "linear-gradient(135deg, #fff 0%, #ffc107 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                Discover Stunning <br className="d-none d-sm-block" />Visual Stories
              </h1>
              <p className="lead text-white-50 mb-4" style={{ maxWidth: "600px", margin: "0 auto" }}>
                Browse millions of high-quality photos from talented creators around the world
              </p>
              
              {/* Enhanced Search Bar */}
              <div className="position-relative mx-auto" style={{ maxWidth: "500px" }}>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-warning text-warning rounded-start-pill ps-4">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-lg bg-dark border-warning text-white"
                    placeholder="Search photos, categories, or creators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ borderLeft: "none", borderRight: "none" }}
                  />
                  <button className="btn btn-warning rounded-end-pill px-4" onClick={() => setSearchQuery(searchQuery)}>
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Modern Category Pills */}
            <div className="mb-5">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-bold mb-0">
                  <i className="fas fa-th-large text-warning me-2"></i>
                  Categories
                </h5>
                <span className="text-white-50 small">{filteredPhotos.length} results</span>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`btn rounded-pill px-4 py-2 transition-all ${selectedCategory === category.id ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
                    style={{ fontSize: "0.9rem" }}
                  >
                    <i className={`${category.icon} me-2`}></i>
                    {category.name}
                    <span className="ms-2 opacity-75">({category.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-dark bg-opacity-50 rounded-3 p-3 mb-4" style={{ backdropFilter: "blur(10px)" }}>
              <div className="row g-3 align-items-center">
                <div className="col-md-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="form-select bg-dark border-warning text-white rounded-pill"
                  >
                    <option value="newest">✨ Newest First</option>
                    <option value="popular">🔥 Most Popular</option>
                    <option value="price-low">💰 Price: Low to High</option>
                    <option value="price-high">💎 Price: High to Low</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <div className="btn-group w-100">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`btn ${viewMode === 'grid' ? 'btn-warning' : 'btn-outline-warning'} rounded-start-pill`}
                    >
                      <i className="fas fa-th-large me-2"></i> Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`btn ${viewMode === 'list' ? 'btn-warning' : 'btn-outline-warning'} rounded-end-pill`}
                    >
                      <i className="fas fa-list me-2"></i> List
                    </button>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-center gap-3">
                    <span className="text-white-50 small">Max Price:</span>
                    <input
                      type="range"
                      className="form-range flex-grow-1"
                      min="0"
                      max="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    />
                    <span className="text-warning fw-bold">${priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Grid/Layout */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-warning mb-3" style={{ width: "3rem", height: "3rem" }}></div>
                <p className="text-white-50">Loading amazing photos...</p>
              </div>
            ) : sortedPhotos.length > 0 ? (
              <div className={viewMode === 'grid' ? 'row g-4' : 'd-flex flex-column gap-4'}>
                {sortedPhotos.map(photo => (
                  <div key={photo.id} className={viewMode === 'grid' ? 'col-md-6 col-lg-4' : 'col-12'}>
                    <div className="card bg-dark border-0 overflow-hidden rounded-4 hover-lift transition-all" style={{ 
                      background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                      backdropFilter: "blur(10px)",
                      cursor: "pointer"
                    }}
                    onClick={() => navigate(`/login?redirect=/photos/${photo.id}`)}>
                      <div className="position-relative overflow-hidden" style={{ height: viewMode === 'list' ? "200px" : "240px" }}>
                        <img
                          src={photo.thumbnail}
                          alt={photo.title}
                          className="w-100 h-100 object-fit-cover transition-transform"
                          style={{ objectFit: "cover", transition: "transform 0.5s ease" }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        />
                        <div className="position-absolute top-0 end-0 m-3">
                          <span className="badge bg-warning text-dark rounded-pill px-3 py-2 fw-bold">
                            ${photo.price}
                          </span>
                        </div>
                        {photo.rating >= 4.8 && (
                          <div className="position-absolute top-0 start-0 m-3">
                            <span className="badge bg-danger rounded-pill px-3 py-2">
                              <i className="fas fa-crown me-1"></i> Editor's Pick
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="fw-bold mb-1 text-white">{photo.title}</h6>
                            <p className="text-white-50 small mb-0">
                              <i className="fas fa-user-circle me-1"></i> {photo.photographer}
                            </p>
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-link text-danger p-0">
                              <i className="far fa-heart"></i>
                            </button>
                          </div>
                        </div>
                        <div className="d-flex gap-2 mb-3">
                          {photo.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="badge bg-secondary bg-opacity-25 text-white-50 px-2 py-1 rounded-pill small">
                              #{tag}
                            </span>
                          ))}
                          {photo.tags.length > 2 && (
                            <span className="badge bg-secondary bg-opacity-25 text-white-50 px-2 py-1 rounded-pill small">
                              +{photo.tags.length - 2}
                            </span>
                          )}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex gap-3 text-white-50 small">
                            <span><i className="fas fa-heart text-danger me-1"></i> {photo.likes}</span>
                            <span><i className="fas fa-download me-1"></i> {photo.downloads}</span>
                            <span><i className="fas fa-star text-warning me-1"></i> {photo.rating}</span>
                          </div>
                          <button className="btn btn-sm btn-warning rounded-pill px-3">
                            <i className="fas fa-shopping-cart me-1"></i> Buy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-search fa-3x text-secondary mb-3"></i>
                <h4 className="text-white-50">No photos found</h4>
                <p className="text-white-50">Try adjusting your filters or search query</p>
                <button 
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setPriceRange([0, 100]);
                  }}
                  className="btn btn-warning rounded-pill px-4 mt-3"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Load More */}
            {sortedPhotos.length > 0 && (
              <div className="text-center mt-5">
                <button className="btn btn-outline-warning rounded-pill px-5 py-3 hover-glow">
                  <i className="fas fa-sync-alt me-2"></i>
                  Load More Photos
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR - Fading Banner */}
          {!isMobile && (
            <div className="col-lg-3">
              <div className="position-sticky" style={{ top: "100px" }}>
                
                {/* Fading Banner */}
                <div className="position-relative rounded-4 overflow-hidden mb-4" style={{ 
                  height: "500px",
                  background: "#0a0a0a",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
                }}>
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
                  
                  <div className="position-relative h-100 d-flex flex-column justify-content-end p-4" style={{ zIndex: 2 }}>
                    <div className="badge bg-warning text-dark rounded-pill mb-3 align-self-start px-3 py-2">
                      <i className="fas fa-fire me-1"></i> {bannerImages[currentBannerIndex].badge}
                    </div>
                    <h3 className="fw-bold mb-2">{bannerImages[currentBannerIndex].title}</h3>
                    <p className="text-white-50 small mb-3">{bannerImages[currentBannerIndex].description}</p>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-warning fw-bold">{bannerImages[currentBannerIndex].price}</span>
                      <button 
                        className="btn btn-sm btn-warning rounded-pill px-3"
                        onClick={() => navigate('/register')}
                      >
                        {bannerImages[currentBannerIndex].buttonText}
                      </button>
                    </div>
                  </div>
                  
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
                          width: currentBannerIndex === idx ? "28px" : "6px",
                          height: "6px",
                          backgroundColor: currentBannerIndex === idx ? "#ffc107" : "rgba(255,255,255,0.4)",
                          cursor: "pointer"
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Stats Card */}
                <div className="bg-gradient rounded-4 p-4 mb-4 text-center" style={{
                  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
                }}>
                  <i className="fas fa-chart-line fs-1 text-warning mb-2"></i>
                  <h4 className="fw-bold mb-2">Join Our Community</h4>
                  <p className="text-white-50 small mb-3">50,000+ active creators</p>
                  <button className="btn btn-warning rounded-pill w-100" onClick={() => navigate('/register')}>
                    <i className="fas fa-user-plus me-2"></i> Sign Up Free
                  </button>
                </div>

                {/* Trending Tags */}
                <div className="bg-gradient rounded-4 p-4" style={{
                  background: "linear-gradient(135deg, #2a1b3d 0%, #1a1a2e 100%)"
                }}>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="fas fa-fire text-warning"></i>
                    <h6 className="fw-bold mb-0">Trending Tags</h6>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {["nature", "sunset", "cityscape", "portrait", "wildlife", "abstract", "vintage", "minimal"].map((tag, idx) => (
                      <button
                        key={idx}
                        className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1"
                        onClick={() => setSearchQuery(tag)}
                      >
                        <i className="fas fa-hashtag me-1"></i> {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .transition-all {
          transition: all 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3) !important;
        }
        
        .hover-glow:hover {
          box-shadow: 0 0 20px rgba(255,193,7,0.5);
        }
        
        .hover-scale:hover {
          transform: scale(1.05);
        }
        
        .hover-bg-warning:hover {
          background-color: rgba(255,193,7,0.1);
          color: #ffc107 !important;
        }
        
        .object-fit-cover {
          object-fit: cover;
        }
        
        .bg-gradient {
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
          backdrop-filter: blur(10px);
        }
        
        @media (max-width: 768px) {
          .display-3 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Explore;