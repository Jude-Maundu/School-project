import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import NotificationDropdown from "../../NotificationDropdown";
import { getLocalCart } from "../../../utils/localStore";

const BuyerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({ name: "Buyer" });
  const [walletBalance, setWalletBalance] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-close sidebar on resize to desktop
      if (!mobile) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Load user data safely on component mount
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        setUser(JSON.parse(userStr));
      }

      const walletData = localStorage.getItem("pm_wallet");
      if (walletData) {
        const parsed = JSON.parse(walletData);
        setWalletBalance(Number(parsed.balance || 0));
      } else {
        const oldWallet = localStorage.getItem("wallet");
        if (oldWallet !== null) {
          setWalletBalance(Number(oldWallet) || 0);
        }
      }

      setCartCount(getLocalCart().length);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, []);

  // Keep cart badge in sync
  useEffect(() => {
    const handleCartUpdate = () => setCartCount(getLocalCart().length);
    window.addEventListener("pm:cart-updated", handleCartUpdate);
    return () => window.removeEventListener("pm:cart-updated", handleCartUpdate);
  }, []);

  // Keep wallet balance in sync
  useEffect(() => {
    const handleWalletUpdate = () => {
      try {
        const walletData = localStorage.getItem("pm_wallet");
        if (walletData) {
          const parsed = JSON.parse(walletData);
          setWalletBalance(parsed.balance || 0);
        }
      } catch (error) {
        console.error("Error updating wallet balance:", error);
      }
    };
    window.addEventListener("pm:wallet-updated", handleWalletUpdate);
    return () => window.removeEventListener("pm:wallet-updated", handleWalletUpdate);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const navItems = [
    { path: "/buyer/dashboard", icon: "fa-home", label: "Dashboard", mobileLabel: "Home" },
    { path: "/buyer/explore", icon: "fa-compass", label: "Explore", mobileLabel: "Explore" },
    { path: "/buyer/follow", icon: "fa-user-friends", label: "Followers", mobileLabel: "Followers" },
    { path: "/buyer/cart", icon: "fa-shopping-cart", label: "Cart", mobileLabel: "Cart", badge: cartCount },
    { path: "/buyer/transactions", icon: "fa-history", label: "Transactions", mobileLabel: "History" },
    { path: "/buyer/downloads", icon: "fa-download", label: "My Downloads", mobileLabel: "Downloads" },
    { path: "/buyer/favorites", icon: "fa-heart", label: "Favorites", mobileLabel: "Likes" },
    { path: "/messages", icon: "fa-comments", label: "Messages", mobileLabel: "Messages" },
    { path: "/buyer/wallet", icon: "fa-wallet", label: "Wallet", mobileLabel: "Wallet" },
    { path: "/buyer/profile", icon: "fa-user", label: "Profile", mobileLabel: "Profile" },
  ];

  // Don't render layout on login page
  if (location.pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-vh-100 bg-dark text-white">
      {/* Background Image */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2070&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: "0.1",
          zIndex: 0,
        }}
      ></div>

      {/* Content */}
      <div className="position-relative" style={{ zIndex: 1 }}>
        {/* Navbar - Responsive */}
        <nav className="navbar navbar-dark px-3 px-md-4 py-2 py-md-3 sticky-top w-100"
             style={{
               background: "rgba(0, 0, 0, 0.95)",
               backdropFilter: "blur(10px)",
               borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
               zIndex: 1030,
             }}>
          <div className="container-fluid px-0">
            <div className="d-flex align-items-center gap-2 gap-md-3">
              {/* Hamburger menu - only visible on mobile */}
              <button
                className="btn btn-link text-warning d-md-none p-0"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ fontSize: "1.25rem" }}
              >
                <i className={`fas ${sidebarOpen ? "fa-times" : "fa-bars"}`}></i>
              </button>
              <Link to="/buyer/dashboard" className="d-flex align-items-center text-decoration-none">
                <img
                  src="/Pasted%20image.png"
                  alt="PhotoMarket Logo"
                  style={{
                    width: "36px",
                    height: "36px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 193, 7, 0.8)",
                    marginRight: "0.5rem",
                  }}
                />
                <span className="fw-bold" style={{ fontSize: "clamp(1rem, 5vw, 1.5rem)" }}>
                  <span className="text-white d-none d-sm-inline">Photo</span>
                  <span className="text-warning d-none d-sm-inline">Market</span>
                  <span className="text-white d-inline d-sm-none">PM</span>
                </span>
              </Link>
              <span className="badge bg-warning text-dark d-none d-md-inline">
                Buyer
              </span>
            </div>

            <div className="d-flex align-items-center gap-2 gap-md-3">
              <Link to="/buyer/cart" className="text-white position-relative text-decoration-none">
                <i className="fas fa-shopping-cart" style={{ fontSize: "clamp(1rem, 4vw, 1.25rem)" }}></i>
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark"
                        style={{ fontSize: "0.6rem", padding: "0.25rem 0.4rem" }}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Notification Dropdown - NOW VISIBLE ON ALL SCREENS */}
              <div className="notification-wrapper">
                <NotificationDropdown userRole="buyer" />
              </div>

              {/* Wallet Balance - Hidden on very small screens, visible on tablet+ */}
              <div className="d-none d-md-block">
                <span className="badge bg-warning bg-opacity-25 text-warning p-2">
                  <i className="fas fa-wallet me-2"></i>
                  KES {Number(walletBalance).toLocaleString()}
                </span>
              </div>

              <div className="dropdown">
                <button
                  className="btn btn-link text-white text-decoration-none dropdown-toggle p-0 d-flex align-items-center"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ fontSize: "clamp(0.875rem, 3vw, 1rem)" }}
                >
                  <i className="fas fa-user-circle" style={{ fontSize: "clamp(1.25rem, 5vw, 1.5rem)" }}></i>
                  <span className="d-none d-md-inline ms-1 ms-md-2">
                    {user?.name?.split(' ')[0] || "Buyer"}
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end bg-dark border-secondary">
                  <li><Link className="dropdown-item text-white" to="/buyer/profile"><i className="fas fa-user me-2 text-warning"></i>Profile</Link></li>
                  <li><Link className="dropdown-item text-white" to="/buyer/wallet"><i className="fas fa-wallet me-2 text-warning"></i>Wallet</Link></li>
                  <li><Link className="dropdown-item text-white" to="/buyer/settings"><i className="fas fa-cog me-2 text-warning"></i>Settings</Link></li>
                  <li><hr className="dropdown-divider bg-secondary" /></li>
                  <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="fas fa-sign-out-alt me-2"></i>Logout</button></li>
                </ul>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Wallet Banner */}
        {isMobile && (
          <div className="d-md-none px-3 py-2 sticky-top" style={{ 
            background: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            marginTop: "-1px",
            zIndex: 1020
          }}>
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-white-50 small">
                <i className="fas fa-wallet me-1 text-warning"></i>Wallet Balance
              </span>
              <span className="text-warning fw-bold">
                KES {Number(walletBalance).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Main Layout Container */}
        <div className="d-flex" style={{ minHeight: "calc(100vh - 70px)" }}>
          {/* Sidebar - Always visible on desktop, conditionally on mobile */}
          <div
            className={`
              ${isMobile ? 'position-fixed top-0 start-0 h-100' : 'position-relative d-block'}
              ${isMobile && !sidebarOpen ? 'd-none' : 'd-block'}
            `}
            style={{
              width: "280px",
              background: "rgba(0, 0, 0, 0.95)",
              backdropFilter: "blur(12px)",
              borderRight: "1px solid rgba(255, 255, 255, 0.1)",
              overflowY: "auto",
              zIndex: 1050,
              transition: "transform 0.3s ease-in-out",
              transform: isMobile && sidebarOpen ? "translateX(0)" : isMobile ? "translateX(-100%)" : "translateX(0)",
            }}
          >
            {/* Mobile Sidebar Header */}
            {isMobile && (
              <div className="d-flex d-md-none justify-content-between align-items-center p-3 border-bottom border-secondary">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <img
                      src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=90&q=80"
                      alt="PhotoMarket Logo"
                      style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "6px", border: "1px solid rgba(255, 193, 7, 0.8)" }}
                    />
                    <span className="fw-bold text-white" style={{ fontSize: "0.95rem" }}>
                      PhotoMarket
                    </span>
                  </div>
                  <div className="small text-white-50 mt-1">
                    <i className="fas fa-user me-1"></i>
                    {user?.name || "Buyer"}
                  </div>
                </div>
                <button
                  className="btn btn-link text-warning p-0"
                  onClick={() => setSidebarOpen(false)}
                >
                  <i className="fas fa-times fa-lg"></i>
                </button>
              </div>
            )}

            <div className="p-3 p-md-4 border-bottom border-secondary border-opacity-25">
              <h6 className="text-white-50 small mb-0">
                <i className="fas fa-shopping-bag me-2"></i>
                BUYER MENU
              </h6>
            </div>

            <ul className="nav flex-column p-2 p-md-3">
              {navItems.map((item, idx) => (
                <li className="nav-item mb-1 mb-md-2" key={idx}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `nav-link d-flex align-items-center justify-content-between rounded-3 py-2 py-md-3 px-3 ${
                        isActive ? 'active' : ''
                      }`
                    }
                    style={({ isActive }) => ({
                      background: isActive ? "rgba(255, 193, 7, 0.15)" : "transparent",
                      border: isActive ? "1px solid rgba(255, 193, 7, 0.3)" : "none",
                      color: isActive ? "#ffc107" : "rgba(255,255,255,0.7)",
                      transition: "all 0.3s ease",
                      fontSize: "clamp(0.875rem, 3vw, 1rem)",
                    })}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.classList.contains("active")) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.classList.contains("active")) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                    onClick={() => isMobile && setSidebarOpen(false)}
                  >
                    <span className="d-flex align-items-center">
                      <i className={`fas ${item.icon} me-2 me-md-3`} style={{ width: "20px", fontSize: "clamp(0.875rem, 3vw, 1rem)" }}></i>
                      <span className="d-none d-md-inline">{item.label}</span>
                      <span className="d-inline d-md-none">{item.mobileLabel}</span>
                    </span>
                    {item.badge > 0 && (
                      <span className="badge bg-warning text-dark rounded-pill">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Wallet Info in Sidebar for mobile */}
            {isMobile && sidebarOpen && (
              <div className="p-3 mt-auto border-top border-secondary">
                <div className="p-3 rounded-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <small className="text-white-50 d-block text-center">
                    Wallet Balance: <span className="text-warning fw-bold">KES {Number(walletBalance).toLocaleString()}</span>
                  </small>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div
            className="flex-grow-1"
            style={{
              transition: "margin-left 0.3s ease-in-out",
              width: "calc(100% - 280px)",
            }}
          >
            <div className="p-3 p-md-4">
              {children}
            </div>
          </div>
        </div>

        {/* Mobile Backdrop */}
        {isMobile && sidebarOpen && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 1040,
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && !sidebarOpen && (
        <div className="d-md-none position-fixed bottom-0 start-0 w-100"
             style={{
               background: "rgba(0, 0, 0, 0.95)",
               backdropFilter: "blur(10px)",
               borderTop: "1px solid rgba(255, 255, 255, 0.1)",
               zIndex: 1030,
               paddingBottom: "env(safe-area-inset-bottom)",
             }}>
          <div className="d-flex justify-content-around align-items-center py-2">
            {navItems.slice(0, 5).map((item, idx) => (
              <NavLink
                key={idx}
                to={item.path}
                className={({ isActive }) => 
                  `d-flex flex-column align-items-center text-decoration-none py-1 px-2 rounded ${
                    isActive ? 'text-warning' : 'text-white-50'
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? "#ffc107" : "rgba(255,255,255,0.7)",
                  fontSize: "0.7rem",
                  transition: "all 0.2s ease",
                })}
              >
                <i className={`fas ${item.icon} mb-1`} style={{ fontSize: "1.1rem" }}></i>
                <span className="small">{item.mobileLabel}</span>
                {item.badge > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark"
                        style={{ fontSize: "0.5rem", padding: "0.15rem 0.3rem" }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </NavLink>
            ))}
            <NavLink
              to="/buyer/profile"
              className={({ isActive }) => 
                `d-flex flex-column align-items-center text-decoration-none py-1 px-2 rounded ${
                  isActive ? 'text-warning' : 'text-white-50'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? "#ffc107" : "rgba(255,255,255,0.7)",
                fontSize: "0.7rem",
              })}
            >
              <i className="fas fa-user mb-1" style={{ fontSize: "1.1rem" }}></i>
              <span className="small">Profile</span>
            </NavLink>
          </div>
        </div>
      )}

      {/* Add padding bottom on mobile for bottom nav */}
      {isMobile && !sidebarOpen && (
        <div style={{ paddingBottom: "70px" }}></div>
      )}

      <style jsx>{`
        .notification-wrapper {
          display: block;
        }
        
        /* Ensure notification dropdown is properly positioned on mobile */
        @media (max-width: 768px) {
          .notification-wrapper {
            margin-right: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default BuyerLayout;