import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserFollowers, getUserFollowing } from "../../api/API";

const FollowPage = ({ Layout, roleLabel }) => {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  
  // Fading banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [nextBannerIndex, setNextBannerIndex] = useState(1);
  const [isFading, setIsFading] = useState(false);
  
  const bannerImages = [
    { 
      id: 1, 
      url: "https://images.unsplash.com/photo-1492691527719-9d1e4e485a21?auto=format&fit=crop&w=800&q=80", 
      title: "Connect with Creators", 
      description: "Follow photographers and discover amazing content",
      badge: "Community"
    },
    { 
      id: 2, 
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80", 
      title: "Build Your Network", 
      description: "Engage with like-minded photography enthusiasts",
      badge: "Network"
    },
    { 
      id: 3, 
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80", 
      title: "Stay Updated", 
      description: "Never miss new uploads from your favorite photographers",
      badge: "Updates"
    },
    { 
      id: 4, 
      url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80", 
      title: "Direct Messages", 
      description: "Chat directly with creators you follow",
      badge: "Messaging"
    },
    { 
      id: 5, 
      url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80", 
      title: "Exclusive Content", 
      description: "Get access to exclusive photos from followed creators",
      badge: "Premium"
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
  }, [bannerImages.length]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};
  const userId = user.id || user._id;

  useEffect(() => {
    const fetchFollowData = async () => {
      if (!userId) {
        setLoading(false);
        setError("Unable to load follow data. Please login again.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [followersRes, followingRes] = await Promise.all([
          getUserFollowers(userId),
          getUserFollowing(userId),
        ]);

        setFollowers(followersRes.data?.followers || []);
        setFollowing(followingRes.data?.following || []);
      } catch (err) {
        console.error("Follow page load failed:", err);
        setError(err.response?.data?.message || "Unable to load follow information.");
      } finally {
        setLoading(false);
      }
    };

    fetchFollowData();
  }, [userId]);

  const handleStartConversation = (otherUserId) => {
    if (!otherUserId || otherUserId === userId) return;
    navigate("/messages", { state: { selectedUserId: otherUserId } });
  };

  const renderUserItem = (person) => {
    const name = person.name || person.username || person.email || "Unknown user";
    const caption = person.username ? `@${person.username}` : person.email || "No handle";

    return (
      <div
        key={person._id || person.id || caption}
        className="d-flex align-items-center justify-content-between py-3 border-bottom border-white-10"
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center"
            style={{ width: 44, height: 44, fontWeight: 700 }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="fw-semibold text-white">{name}</div>
            <div className="text-white-50 small">{caption}</div>
          </div>
        </div>
        <button
          className="btn btn-sm btn-outline-warning"
          onClick={() => handleStartConversation(person._id || person.id)}
        >
          Message
        </button>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container-fluid">
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
          <div>
            <h2 className="mb-1">Followers & Following</h2>
            <p className="text-muted mb-0">
              See who follows you, who you follow, and start conversations from your follow lists.
            </p>
          </div>
          <div className="text-end text-muted">
            <small>{roleLabel} follow panel</small>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="row gy-4">
            {/* Main Content - Followers and Following Lists */}
            <div className={`${!isMobile ? 'col-lg-9' : 'col-12'}`}>
              <div className="row gy-4">
                <div className="col-lg-6">
                  <div className="card bg-secondary bg-opacity-10 border-secondary h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h5 className="card-title mb-1">Followers</h5>
                          <p className="text-muted mb-0">People who already follow you.</p>
                        </div>
                        <span className="badge bg-warning text-dark">{followers.length}</span>
                      </div>

                      {followers.length === 0 ? (
                        <div className="text-center py-4 text-white-50">
                          You do not have any followers yet.
                        </div>
                      ) : (
                        followers.map(renderUserItem)
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="card bg-secondary bg-opacity-10 border-secondary h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h5 className="card-title mb-1">Following</h5>
                          <p className="text-muted mb-0">People you are currently following.</p>
                        </div>
                        <span className="badge bg-warning text-dark">{following.length}</span>
                      </div>

                      {following.length === 0 ? (
                        <div className="text-center py-4 text-white-50">
                          You are not following anyone yet.
                        </div>
                      ) : (
                        following.map(renderUserItem)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR - Fading Banner (only visible on desktop/tablet) */}
            {!isMobile && (
              <div className="col-lg-3">
                <div className="position-sticky" style={{ top: "20px" }}>
                  
                  {/* Fading Banner Component */}
                  <div className="position-relative rounded-3 overflow-hidden mb-4" style={{ 
                    height: "480px",
                    background: "#0a0a0a",
                    borderRadius: "20px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
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
                        background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%)"
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
                        background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%)"
                      }}></div>
                    </div>
                    
                    {/* Banner Content */}
                    <div className="position-relative h-100 d-flex flex-column justify-content-end p-4" style={{ zIndex: 2 }}>
                      <div className="badge bg-warning text-dark rounded-pill mb-3 align-self-start px-3 py-1">
                        <i className="fas fa-users me-1"></i> {bannerImages[currentBannerIndex].badge}
                      </div>
                      <h4 className="fw-bold mb-2" style={{ fontSize: "1.2rem" }}>
                        {bannerImages[currentBannerIndex].title}
                      </h4>
                      <p className="text-white-50 small mb-3">
                        {bannerImages[currentBannerIndex].description}
                      </p>
                      <div className="d-flex gap-2 mb-3">
                        <button 
                          className="btn btn-sm btn-warning rounded-pill px-3 flex-grow-1"
                          onClick={() => navigate("/buyer/explore")}
                        >
                          <i className="fas fa-compass me-1"></i> Explore Creators
                        </button>
                      </div>
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
                          className="border-0 rounded-pill"
                          style={{
                            width: currentBannerIndex === idx ? "24px" : "6px",
                            height: "6px",
                            backgroundColor: currentBannerIndex === idx ? "#ffc107" : "rgba(255,255,255,0.5)",
                            transition: "all 0.3s ease",
                            cursor: "pointer"
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Additional Tip Card */}
                  <div className="bg-dark rounded-3 p-3 text-center" style={{ 
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", 
                    borderRadius: "20px" 
                  }}>
                    <i className="fas fa-lightbulb fs-1 text-warning mb-2"></i>
                    <h6 className="fw-bold mb-1">Pro Tip</h6>
                    <p className="small text-white-50 mb-2">
                      Follow photographers to see their latest work in your feed and get notified about new uploads!
                    </p>
                    <button 
                      className="btn btn-outline-warning btn-sm rounded-pill w-100"
                      onClick={() => navigate("/buyer/explore")}
                    >
                      <i className="fas fa-search me-1"></i> Discover New Creators
                    </button>
                  </div>

                  {/* Stats Card */}
                  <div className="mt-3 bg-dark rounded-3 p-3" style={{ 
                    background: "linear-gradient(135deg, #2a1b3d 0%, #1a1a2e 100%)", 
                    borderRadius: "20px" 
                  }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-white-50">Your Network</span>
                      <i className="fas fa-chart-line text-warning"></i>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-center">
                        <div className="h4 fw-bold text-warning mb-0">{followers.length}</div>
                        <small className="text-white-50">Followers</small>
                      </div>
                      <div className="text-center">
                        <div className="h4 fw-bold text-warning mb-0">{following.length}</div>
                        <small className="text-white-50">Following</small>
                      </div>
                      <div className="text-center">
                        <div className="h4 fw-bold text-warning mb-0">
                          {followers.length + following.length}
                        </div>
                        <small className="text-white-50">Total</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .card {
          animation: fadeInUp 0.4s ease-out;
          transition: all 0.2s ease;
        }
        
        .border-white-10 {
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
    </Layout>
  );
};

export default FollowPage;