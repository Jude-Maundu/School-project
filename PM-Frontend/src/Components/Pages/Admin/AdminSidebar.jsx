import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const AdminSidebar = ({ isOpen, onToggle, onNav }) => {
  const location = useLocation();

  // More transparent glass style
  const glassStyle = {
    background: "rgba(0, 0, 0, 0.4)", // Reduced from 0.7 to 0.4
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRight: "1px solid rgba(255, 255, 255, 0.15)",
  };

  const menuItems = [
    {
      path: "/admin/dashboard",
      icon: "fa-chart-pie",
      label: "Dashboard",
      badge: null,
    },
    {
      path: "/admin/media",
      icon: "fa-photo-video",
      label: "Media",
      badge: "24",
    },
    {
      path: "/admin/users",
      icon: "fa-users",
      label: "Users",
      badge: "12",
    },
    {
      path: "/admin/analytics",
      icon: "fa-chart-line",
      label: "Analytics",
      badge: null,
    },
    {
      path: "/admin/shares",
      icon: "fa-link",
      label: "Shares",
      badge: null,
    },
    {
      path: "/admin/receipts",
      icon: "fa-receipt",
      label: "Receipts",
      badge: "8",
    },
    {
      path: "/admin/refunds",
      icon: "fa-undo",
      label: "Refunds",
      badge: "3",
    },
    {
      path: "/admin/audit",
      icon: "fa-search-dollar",
      label: "Purchase Audit",
      badge: null,
    },
    {
      path: "/admin/settings",
      icon: "fa-cog",
      label: "Settings",
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="btn btn-warning position-fixed d-md-none"
        style={{
          bottom: "20px",
          right: "20px",
          zIndex: 1050,
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          boxShadow: "0 4px 15px rgba(255, 193, 7, 0.3)",
        }}
        onClick={onToggle}
      >
        <i className={`fas ${isOpen ? "fa-times" : "fa-bars"}`}></i>
      </button>

      {/* Sidebar - Wider */}
      <div
        className={`
          ${isOpen ? "d-block" : "d-none d-md-block"}
          position-fixed position-md-static
          top-0 start-0
          h-100
          col-10 col-md-3 col-lg-2
          p-0
          overflow-auto
        `}
        style={{
          ...glassStyle,
          zIndex: 1040,
          width: isOpen ? "320px" : "auto",
        }}
      >
        {/* Header with Logo */}
        <div className="p-4 border-bottom border-white border-opacity-10">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                background: "rgba(255, 193, 7, 0.2)",
                borderRadius: "12px",
                padding: "10px",
                border: "1px solid rgba(255, 193, 7, 0.3)",
              }}
            >
              <i className="fas fa-camera text-warning fa-lg"></i>
            </div>
            <div>
              <span className="fw-bold fs-5 text-white">Photo</span>
              <span className="fw-bold fs-5 text-warning">Market</span>
            </div>
          </div>
          {/* <h6 className="text-white-50 small fw-semibold mt-4 mb-0">
            <i className="fas fa-bars me-2" style={{ fontSize: "0.8rem" }}></i>
            MAIN NAVIGATION
          </h6> */}
        </div>

        {/* Menu Items */}
        <ul className="nav flex-column px-3 mt-3">
          {menuItems.map((item) => (
            <li className="nav-item mb-2" key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center justify-content-between rounded-3 py-2 px-3 ${
                    isActive ? "active" : ""
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive
                    ? "rgba(255, 193, 7, 0.2)"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(255, 193, 7, 0.4)"
                    : "1px solid transparent",
                  color: isActive ? "#ffc107" : "rgba(255, 255, 255, 0.8)",
                  transition: "all 0.3s ease",
                  padding: "12px 16px", // Larger padding
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains("active")) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains("active")) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }
                }}
                onClick={() => {
                  if (onNav) onNav();
                }}
              >
                <span>
                  <i
                    className={`fas ${item.icon} me-3`}
                    style={{
                      color: location.pathname === item.path ? "#ffc107" : "inherit",
                      width: "24px", // Fixed width for icons
                      fontSize: "1.1rem",
                    }}
                  ></i>
                  <span className="fs-6">{item.label}</span>
                </span>
                {item.badge && (
                  <span
                    className="badge rounded-pill px-2 py-1"
                    style={{
                      background: "rgba(255, 193, 7, 0.2)",
                      color: "#ffc107",
                      fontSize: "0.7rem",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Storage Info */}
        <div className="px-4 mt-5">
          <div
            className="p-4 rounded-3 text-center"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <i className="fas fa-cloud-upload-alt fa-xl text-warning mb-3"></i>
            <h6 className="small fw-bold text-white mb-2">Storage Usage</h6>
            <div className="progress" style={{ height: "6px", background: "rgba(255,255,255,0.1)" }}>
              <div
                className="progress-bar bg-warning"
                style={{ width: "65%" }}
              ></div>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <small className="text-white-50" style={{ fontSize: "0.65rem" }}>
                45.2 GB used
              </small>
              <small className="text-white-50" style={{ fontSize: "0.65rem" }}>
                78.3 GB total
              </small>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="px-4 mt-3 mb-4">
          <div
            className="p-3 rounded-3"
            style={{
              background: "rgba(0, 0, 0, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-white-50" style={{ fontSize: "0.65rem" }}>
                <i className="fas fa-circle text-success me-2" style={{ fontSize: "0.5rem" }}></i>
                System Status
              </small>
              <span className="badge bg-success bg-opacity-25 text-success px-2 py-1">
                Online
              </span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-white-50" style={{ fontSize: "0.65rem" }}>
                Version
              </small>
              <small className="text-white" style={{ fontSize: "0.65rem" }}>
                2.1.4
              </small>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-top border-white border-opacity-10 mt-auto">
          <small className="text-white-50 d-block text-center" style={{ fontSize: "0.6rem" }}>
            © 2024 PhotoMarket Admin
          </small>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-md-none"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(5px)",
            zIndex: 1035,
          }}
          onClick={() => {
            if (onToggle) onToggle();
          }}
        ></div>
      )}
    </>
  );
};

export default AdminSidebar;