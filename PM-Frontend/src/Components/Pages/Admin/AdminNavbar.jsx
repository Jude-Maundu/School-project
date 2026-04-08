import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationDropdown from "../../NotificationDropdown";

const AdminNavbar = ({ toggleSidebar }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Transparent style like homepage
  const transparentStyle = {
    background: "transparent",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  };

  return (
    <nav
      className="navbar navbar-dark px-4 py-3 position-sticky top-0 w-100"
      style={{
        ...transparentStyle,
        zIndex: 1030,
      }}
    >
      <div className="container-fluid px-0">
        {/* Brand with enhanced styling */}
        <Link to="/admin/dashboard" className="text-decoration-none">
          <span className="navbar-brand fw-bold fs-4 d-flex align-items-center">
            <div
              className="d-flex align-items-center justify-content-center me-2"
              style={{
                background: "rgba(255, 193, 7, 0.15)",
                borderRadius: "10px",
                padding: "8px",
                border: "1px solid rgba(255, 193, 7, 0.3)",
              }}
            >
              <i className="fas fa-camera text-warning"></i>
            </div>
            {/* <div>
              <span className="text-white">Photo</span>
              <span className="text-warning">Market</span>
              <span
                className="ms-2 small text-white-50 d-none d-md-inline"
                style={{ fontSize: "0.7rem" }}
              >
                Admin Panel
              </span>
            </div> */}
          </span>
        </Link>

        {/* Right side items */}
        <div className="d-flex align-items-center gap-3">
          <div className="d-none d-md-block">
            <NotificationDropdown userRole="admin" />
          </div>

          {/* Admin Profile */}
          <div className="position-relative">
            <button
              className="btn d-flex align-items-center gap-2 rounded-3"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "5px 10px",
              }}
            >
              <div
                className="rounded-circle bg-warning bg-opacity-25 d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px" }}
              >
                <i className="fas fa-user-shield text-warning"></i>
              </div>
              <div className="d-none d-md-block text-start">
                <div className="small fw-bold text-white">Admin User</div>
                <div className="small text-white-50" style={{ fontSize: "0.65rem" }}>
                  admin@photmarket.com
                </div>
              </div>
              <i
                className={`fas fa-chevron-down ms-1 text-white-50 ${
                  showProfileMenu ? "rotate-180" : ""
                }`}
                style={{
                  fontSize: "0.7rem",
                  transition: "transform 0.3s ease",
                }}
              ></i>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div
                className="position-absolute end-0 mt-2 rounded-3 overflow-hidden"
                style={{
                  minWidth: "200px",
                  background: "rgba(0, 0, 0, 0.9)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  zIndex: 1040,
                }}
              >
                <div className="p-2">
                  <button
                    className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded-2 border-0 bg-transparent w-100 text-start"
                    style={{
                      color: "#fff",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <i className="fas fa-user-circle text-warning" style={{ width: "20px" }}></i>
                    <span>Profile</span>
                  </button>

                  <button
                    className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded-2 border-0 bg-transparent w-100 text-start"
                    style={{
                      color: "#fff",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <i className="fas fa-cog text-warning" style={{ width: "20px" }}></i>
                    <span>Settings</span>
                  </button>

                  <div className="dropdown-divider bg-secondary bg-opacity-25 my-2"></div>

                  <button
                    className="d-flex align-items-center gap-2 px-3 py-2 w-100 border-0 bg-transparent text-danger rounded-2"
                    onClick={handleLogout}
                    style={{
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(220, 53, 69, 0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <i className="fas fa-sign-out-alt" style={{ width: "20px" }}></i>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="btn d-md-none p-2 rounded-3"
            onClick={toggleSidebar}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <i className="fas fa-bars text-white"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;