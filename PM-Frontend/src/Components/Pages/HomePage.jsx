import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Link } from "react-router-dom";
import { getAllMedia } from "../../api/API";

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [apiMedia, setApiMedia] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setLoading(false), 1500);
    const timer2 = setTimeout(() => setLoadingPhotos(false), 2000);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);

    const fetchApiMedia = async () => {
      setApiLoading(true);
      try {
        const response = await getAllMedia();
        const data = Array.isArray(response?.data?.media)
          ? response.data.media
          : Array.isArray(response?.data)
            ? response.data
            : [];
        setApiMedia(data);
      } catch (error) {
        console.error("HomePage.getAllMedia failed", error);
        setApiError(
          error?.response?.data?.message ||
            error.message ||
            "Failed to load media",
        );
      } finally {
        setApiLoading(false);
      }
    };
    fetchApiMedia();

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle menu toggle
  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const categories = [
    { name: "Nature", icon: "fas fa-leaf", count: "12.5k", color: "success" },
    { name: "Travel", icon: "fas fa-plane", count: "8.2k", color: "info" },
    { name: "Lifestyle", icon: "fas fa-camera-retro", count: "15.3k", color: "danger" },
    { name: "Food", icon: "fas fa-utensils", count: "6.7k", color: "warning" },
    { name: "Architecture", icon: "fas fa-building", count: "9.1k", color: "secondary" },
    { name: "Technology", icon: "fas fa-microchip", count: "5.8k", color: "primary" },
    { name: "Portrait", icon: "fas fa-user", count: "11.2k", color: "info" },
    { name: "Sports", icon: "fas fa-futbol", count: "4.5k", color: "danger" },
  ];

  const howItWorks = [
    {
      title: "Browse Collection",
      icon: "fas fa-compass",
      description: "Explore thousands of high-quality photos from talented creators worldwide.",
      color: "warning",
    },
    {
      title: "Secure Purchase",
      icon: "fas fa-shield-alt",
      description: "Safe and encrypted payments with multiple payment options.",
      color: "success",
    },
    {
      title: "Instant Access",
      icon: "fas fa-bolt",
      description: "Download your purchased photos immediately in high resolution.",
      color: "info",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Creative Director",
      feedback: "The quality of photos is exceptional. Has transformed our marketing materials completely.",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Travel Blogger",
      feedback: "Fair revenue for photographers and affordable prices. Win-win for everyone!",
      avatar: "https://randomuser.me/api/portraits/men/46.jpg",
      rating: 5,
    },
    {
      name: "Emma Williams",
      role: "Graphic Designer",
      feedback: "Intuitive platform with stunning visuals. My go-to for client projects.",
      avatar: "https://randomuser.me/api/portraits/women/63.jpg",
      rating: 5,
    },
  ];

  const featuredPhotos = [
    {
      id: 1,
      title: "Mountain Serenity",
      photographer: "Alex Rivera",
      price: "$29",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
      likes: 234,
    },
    {
      id: 2,
      title: "Urban Explorer",
      photographer: "Nina Patel",
      price: "$39",
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop",
      likes: 187,
    },
    {
      id: 3,
      title: "Ocean Dreams",
      photographer: "Marcus Webb",
      price: "$34",
      image: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&h=400&fit=crop",
      likes: 312,
    },
    {
      id: 4,
      title: "Forest Magic",
      photographer: "Lisa Chang",
      price: "$27",
      image: "https://images.unsplash.com/photo-1426604966841-d7cdac3996e5?w=600&h=400&fit=crop",
      likes: 156,
    },
    {
      id: 5,
      title: "City Lights",
      photographer: "David Kim",
      price: "$32",
      image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&h=400&fit=crop",
      likes: 421,
    },
    {
      id: 6,
      title: "Abstract Art",
      photographer: "Sofia Martinez",
      price: "$45",
      image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&h=400&fit=crop",
      likes: 278,
    },
  ];

  const stats = [
    { value: "50K+", label: "Photos", icon: "fas fa-image" },
    { value: "10K+", label: "Customers", icon: "fas fa-users" },
    { value: "2.5K+", label: "Photographers", icon: "fas fa-camera" },
    { value: "150+", label: "Countries", icon: "fas fa-globe" },
  ];

  const displayedFeaturedPhotos = apiMedia && apiMedia.length > 0 ? apiMedia.slice(0, 6) : featuredPhotos;

  const SkeletonBox = ({ width, height, className = "" }) => (
    <div
      className={`bg-secondary bg-opacity-25 rounded placeholder-glow ${className}`}
      style={{ width: width || "100%", height: height || "20px" }}
    />
  );

  const SkeletonCard = () => (
    <div className="card bg-dark border-secondary h-100 placeholder-glow">
      <SkeletonBox height="200px" className="rounded-top" />
      <div className="card-body p-3">
        <SkeletonBox width="80%" height="20px" className="mb-2" />
        <SkeletonBox width="60%" height="16px" className="mb-2" />
        <div className="d-flex justify-content-between">
          <SkeletonBox width="40%" height="14px" />
          <SkeletonBox width="30%" height="14px" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-dark text-white" style={{ overflowX: "hidden" }}>
      {/* Navigation - Clear/Transparent on desktop, Frosted when menu open on mobile */}
      <nav 
        className={`navbar navbar-expand-lg fixed-top navbar-dark py-2 py-lg-3 transition-all duration-300 ${
          menuOpen ? 'menu-open' : ''
        }`}
        style={{ 
          background: menuOpen 
            ? "rgba(0, 0, 0, 0.85)" 
            : "transparent",
          backdropFilter: menuOpen ? "blur(20px)" : "none",
          transition: "all 0.3s ease-in-out",
          borderBottom: scrollY > 50 ? "1px solid rgba(255,193,7,0.2)" : "none"
        }}
      >
        <div className="container">
          <Link to="/" className="navbar-brand fw-bold fs-4 fs-lg-3">
            <i className="fas fa-camera me-2 text-warning"></i>
            <span className="d-none d-sm-inline">PhotoMarket</span>
            <span className="d-inline d-sm-none">PM</span>
          </Link>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            onClick={handleMenuToggle}
            style={{ 
              backgroundColor: "rgba(255,255,255,0.15)",
              padding: "8px 12px",
              transition: "all 0.3s ease"
            }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-2 gap-lg-3 py-3 py-lg-0">
              <li className="nav-item">
                <Link 
                  className="nav-link text-white px-3 py-2" 
                  to="/explore"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="fas fa-search me-2"></i> Explore
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link text-white px-3 py-2" 
                  to="/pricing"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="fas fa-tag me-2"></i> Pricing
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link text-white px-3 py-2" 
                  to="/become-seller"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="fas fa-crown me-2"></i> Become a Seller
                </Link>
              </li>
              <li className="nav-item w-100 w-lg-auto">
                <Link to="/login" className="d-block" onClick={() => setMenuOpen(false)}>
                  <button className="btn btn-outline-warning rounded-pill px-4 w-100">
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Login
                  </button>
                </Link>
              </li>
              <li className="nav-item w-100 w-lg-auto">
                <Link to="/register" className="d-block" onClick={() => setMenuOpen(false)}>
                  <button className="btn btn-warning rounded-pill px-4 text-dark fw-semibold w-100">
                    <i className="fas fa-user-plus me-2"></i>
                    Sign Up
                  </button>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Add custom CSS for mobile menu styling */}
      <style jsx="true">{`
        @media (max-width: 991px) {
          .navbar-collapse {
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            margin-top: 16px;
            padding: 16px;
            border: 1px solid rgba(255, 193, 7, 0.2);
            animation: slideDown 0.3s ease-out;
          }
          
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .navbar-collapse .nav-link {
            text-align: center;
            padding: 12px !important;
            border-radius: 12px;
            transition: all 0.2s ease;
          }
          
          .navbar-collapse .nav-link:hover {
            background: rgba(255, 193, 7, 0.1);
            transform: translateX(4px);
          }
          
          .navbar-collapse .btn {
            margin-top: 8px;
          }
        }
        
        /* Desktop navbar remains transparent */
        @media (min-width: 992px) {
          .navbar {
            background: transparent !important;
            backdrop-filter: none !important;
          }
          
          .navbar.scrolled {
            background: rgba(0, 0, 0, 0.8) !important;
            backdrop-filter: blur(10px) !important;
          }
        }
        
        /* Smooth transitions */
        .transition-all {
          transition: all 0.3s ease-in-out;
        }
        
        /* Active menu state */
        .navbar-toggler:active {
          transform: scale(0.95);
        }
      `}</style>

      {/* Hero Section */}
      <section className="min-vh-100 d-flex align-items-center position-relative overflow-hidden pt-5 mt-4 mt-lg-0">
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2070&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50"></div>

        <div className="container position-relative text-center text-lg-start py-5">
          <div className="row justify-content-center justify-content-lg-start">
            <div className="col-12 col-lg-8">
              {loading ? (
                <div className="placeholder-glow px-3">
                  <SkeletonBox width="150px" height="30px" className="mb-3 rounded-pill mx-auto mx-lg-0" />
                  <SkeletonBox width="100%" height="50px" className="mb-2" />
                  <SkeletonBox width="90%" height="50px" className="mb-3" />
                  <SkeletonBox width="80%" height="24px" className="mb-4 mx-auto mx-lg-0" />
                  <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start">
                    <SkeletonBox width="160px" height="48px" className="rounded-pill mx-auto mx-sm-0" />
                    <SkeletonBox width="160px" height="48px" className="rounded-pill mx-auto mx-sm-0" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="badge bg-warning text-dark px-3 px-md-4 py-2 rounded-pill mb-3 d-inline-block">
                    <i className="fas fa-star me-2"></i>
                    <span className="d-none d-sm-inline">Trusted by 10,000+ Creators Worldwide</span>
                    <span className="d-inline d-sm-none">10K+ Creators</span>
                  </div>
                  <h1 className="display-3 display-md-2 display-lg-1 fw-bold mb-2">
                    <span className="text-warning">Stunning</span> Photos
                  </h1>
                  <h2 className="display-5 display-md-4 fw-bold mb-3">Instant Access</h2>
                  <p className="lead mb-4 px-3 px-lg-0">
                    Join the world's leading creative community. High-quality images from the best photographers.
                  </p>
                  <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start mb-5">
                    <Link to="/explore">
                      <button className="btn btn-warning btn-lg px-4 px-md-5 rounded-pill fw-bold w-100 w-sm-auto">
                        <i className="fas fa-search me-2"></i>
                        Start Exploring
                      </button>
                    </Link>
                    <Link to="/demo">
                      <button className="btn btn-outline-light btn-lg px-4 px-md-5 rounded-pill w-100 w-sm-auto">
                        <i className="fas fa-play-circle me-2"></i>
                        Watch Demo
                      </button>
                    </Link>
                  </div>

                  <div className="row g-3 g-md-4 mt-4">
                    {stats.map((stat, idx) => (
                      <div key={idx} className="col-6 col-md-3">
                        <div className="text-center">
                          <i className={`${stat.icon} text-warning fs-2 mb-2 d-block`}></i>
                          <h3 className="h2 fw-bold text-warning mb-0">{stat.value}</h3>
                          <p className="text-white-50 small mb-0">{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Rest of your sections remain the same */}
      {/* Featured Photos */}
      <section className="py-5 bg-black">
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge bg-warning text-dark px-4 py-2 rounded-pill mb-3">
              <i className="fas fa-fire me-2"></i>
              Trending Now
            </span>
            <h2 className="display-5 fw-bold mb-3">Featured Photos</h2>
            <p className="text-white-50 mx-auto px-3" style={{ maxWidth: "500px" }}>
              Most popular photos this week, handpicked by our curators
            </p>
          </div>

          <div className="row g-3 g-md-4">
            {apiError && (
              <div className="col-12">
                <div className="alert alert-warning text-center">Unable to load latest media: {apiError}</div>
              </div>
            )}
            {loadingPhotos || apiLoading
              ? [1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="col-6 col-md-4 col-lg-4">
                    <SkeletonCard />
                  </div>
                ))
              : displayedFeaturedPhotos.map((photo, idx) => (
                  <div key={idx} className="col-6 col-md-4 col-lg-4">
                    <div className="card bg-dark border-secondary h-100">
                      <div className="position-relative overflow-hidden rounded-top">
                        <img
                          src={photo.image}
                          className="card-img-top w-100"
                          alt={photo.title}
                          style={{ height: "180px", objectFit: "contain", backgroundColor: "#1a1a1a", transition: "transform 0.3s ease" }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        />
                        <span className="position-absolute top-0 end-0 m-2 badge bg-warning text-dark">
                          ${photo.price || 0}
                        </span>
                      </div>
                      <div className="card-body p-2 p-md-3">
                        <h6 className="fw-bold mb-1 text-truncate">{photo.title}</h6>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-white-50 text-truncate">
                            <i className="fas fa-camera me-1"></i>
                            {photo.photographer?.username || photo.photographer || 'Unknown'}
                          </small>
                          <small className="text-white-50 flex-shrink-0">
                            <i className="fas fa-heart text-danger me-1"></i>
                            {photo.likes || 0}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>

          <div className="text-center mt-5">
            <Link to="/explore">
              <button className="btn btn-outline-warning rounded-pill px-4 px-md-5 py-2">
                View All Photos
                <i className="fas fa-arrow-right ms-2"></i>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge bg-warning text-dark px-4 py-2 rounded-pill mb-3">
              <i className="fas fa-magic me-2"></i>
              Simple Process
            </span>
            <h2 className="display-5 fw-bold mb-3">How It Works</h2>
            <p className="text-white-50 mx-auto px-3" style={{ maxWidth: "500px" }}>
              Three simple steps to get started with PhotoMarket
            </p>
          </div>

          <div className="row g-3 g-md-4">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="col-12 col-md-4">
                <div className="card bg-dark border-secondary text-center p-3 p-md-4 h-100">
                  <div className={`bg-${item.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3`}
                       style={{ width: "70px", height: "70px" }}>
                    <i className={`${item.icon} text-${item.color} fa-2x fa-3x-md`}></i>
                  </div>
                  <div className="badge bg-warning text-dark rounded-circle mb-2 mx-auto" style={{ width: "35px", height: "35px", lineHeight: "35px" }}>
                    {idx + 1}
                  </div>
                  <h5 className="fw-bold mb-3">{item.title}</h5>
                  <p className="text-white-50 mb-0 small">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-5 bg-black">
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge bg-warning text-dark px-4 py-2 rounded-pill mb-3">
              <i className="fas fa-tags me-2"></i>
              Categories
            </span>
            <h2 className="display-5 fw-bold mb-3">Explore by Category</h2>
            <p className="text-white-50 mx-auto px-3" style={{ maxWidth: "500px" }}>
              Find the perfect photo for your project
            </p>
          </div>

          <div className="row g-2 g-md-3">
            {categories.map((cat, idx) => (
              <div key={idx} className="col-4 col-md-3">
                <Link to={`/explore?category=${cat.name.toLowerCase()}`} className="text-decoration-none">
                  <div className="card bg-dark border-secondary text-center p-2 p-md-4 h-100">
                    <i className={`${cat.icon} text-${cat.color} fa-2x fa-3x-md mb-2`}></i>
                    <h6 className="fw-bold text-white mb-0 small">{cat.name}</h6>
                    <small className="text-white-50 d-none d-sm-block">{cat.count} photos</small>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge bg-warning text-dark px-4 py-2 rounded-pill mb-3">
              <i className="fas fa-comments me-2"></i>
              Testimonials
            </span>
            <h2 className="display-5 fw-bold mb-3">What Our Users Say</h2>
            <p className="text-white-50 mx-auto px-3" style={{ maxWidth: "500px" }}>
              Join thousands of satisfied customers
            </p>
          </div>

          <div className="row g-3 g-md-4">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="col-12 col-md-4">
                <div className="card bg-dark border-secondary p-3 p-md-4 h-100">
                  <div className="d-flex mb-3 justify-content-center">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <i key={i} className="fas fa-star text-warning me-1"></i>
                    ))}
                  </div>
                  <p className="mb-4 fst-italic small">"{testimonial.feedback}"</p>
                  <div className="d-flex align-items-center">
                    <img src={testimonial.avatar} alt={testimonial.name} className="rounded-circle me-3" width="45" height="45" />
                    <div>
                      <h6 className="fw-bold mb-0 small">{testimonial.name}</h6>
                      <small className="text-white-50">{testimonial.role}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-warning">
        <div className="container text-center py-3 py-md-4">
          <h2 className="h3 h2-md display-6 fw-bold text-dark mb-3">Ready to Start Your Creative Journey?</h2>
          <p className="text-dark mb-4">Join PhotoMarket today and get access to premium photos</p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <Link to="/register">
              <button className="btn btn-dark rounded-pill px-4 px-md-5 py-2 py-md-3 fw-bold">
                <i className="fas fa-user-plus me-2"></i>
                Sign Up Free
              </button>
            </Link>
            <Link to="/contact">
              <button className="btn btn-outline-dark rounded-pill px-4 px-md-5 py-2 py-md-3">
                <i className="fas fa-headset me-2"></i>
                Contact Sales
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white-50 pt-4 pt-md-5 pb-4">
        <div className="container">
          <div className="row g-4 pb-4">
            <div className="col-12 col-md-4 text-center text-md-start">
              <Link to="/" className="navbar-brand fw-bold fs-3 text-white mb-3 d-inline-block">
                <i className="fas fa-camera me-2 text-warning"></i>
                PhotoMarket
              </Link>
              <p className="small mb-3 px-3 px-md-0">Premium stock photos from the world's best photographers.</p>
              <div className="d-flex gap-3 justify-content-center justify-content-md-start">
                <a href="https://www.facebook.com" className="text-white-50" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook-f fa-lg"></i></a>
                <a href="https://www.twitter.com" className="text-white-50" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter fa-lg"></i></a>
                <a href="https://www.instagram.com" className="text-white-50" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram fa-lg"></i></a>
                <a href="https://www.linkedin.com" className="text-white-50" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin-in fa-lg"></i></a>
              </div>
            </div>
            <div className="col-6 col-md-2 text-center text-md-start">
              <h6 className="text-white fw-bold mb-3">Company</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><Link to="/about" className="text-white-50 text-decoration-none small">About Us</Link></li>
                <li className="mb-2"><Link to="/careers" className="text-white-50 text-decoration-none small">Careers</Link></li>
                <li className="mb-2"><Link to="/press" className="text-white-50 text-decoration-none small">Press</Link></li>
                <li className="mb-2"><Link to="/blog" className="text-white-50 text-decoration-none small">Blog</Link></li>
              </ul>
            </div>
            <div className="col-6 col-md-2 text-center text-md-start">
              <h6 className="text-white fw-bold mb-3">Resources</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><Link to="/help" className="text-white-50 text-decoration-none small">Help Center</Link></li>
                <li className="mb-2"><Link to="/sell" className="text-white-50 text-decoration-none small">Become a Seller</Link></li>
                <li className="mb-2"><Link to="/api" className="text-white-50 text-decoration-none small">API Docs</Link></li>
                <li className="mb-2"><Link to="/license" className="text-white-50 text-decoration-none small">License Info</Link></li>
              </ul>
            </div>
            <div className="col-12 col-md-4">
              <h6 className="text-white fw-bold mb-3 text-center text-md-start">Subscribe</h6>
              <p className="small mb-3 text-center text-md-start">Get the latest updates on new photos and exclusive offers</p>
              <div className="input-group">
                <input type="email" className="form-control bg-dark border-secondary text-white" placeholder="Enter your email" />
                <button className="btn btn-warning" type="button"><i className="fas fa-paper-plane"></i></button>
              </div>
            </div>
          </div>
          <hr className="border-secondary" />
          <div className="row">
            <div className="col-12 text-center">
              <p className="small mb-0">&copy; {new Date().getFullYear()} PhotoMarket. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;