import React, { useState, useEffect, useRef, useCallback } from "react";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "../api/API";
import { useNavigate } from "react-router-dom";

const NotificationDropdown = ({ userRole = "user" }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications(15, 0);
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.error("Notification fetch error:", err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((u) => Math.max(0, u - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      const deleted = notifications.find((n) => n._id === id);
      if (deleted && !deleted.isRead) {
        setUnreadCount((u) => Math.max(0, u - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleView = (actionUrl) => {
    if (actionUrl) {
      navigate(actionUrl);
      setOpen(false);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like": return "fas fa-heart";
      case "comment": return "fas fa-comment";
      case "follow": return "fas fa-user-plus";
      case "purchase": return "fas fa-shopping-cart";
      case "share": return "fas fa-share-alt";
      default: return "fas fa-bell";
    }
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        className="btn btn-link position-relative p-0"
        onClick={() => setOpen(!open)}
        style={{ outline: "none", textDecoration: "none" }}
      >
        <div
          className="d-flex align-items-center justify-content-center rounded-circle"
          style={{
            width: "40px",
            height: "40px",
            background: "rgba(255, 255, 255, 0.05)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
        >
          <i className="fas fa-bell text-white-50" style={{ fontSize: "1.1rem" }}></i>
          {unreadCount > 0 && (
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
              style={{
                background: "#ffc107",
                color: "#000",
                fontSize: "0.6rem",
                padding: "2px 5px",
                minWidth: "18px",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="position-absolute end-0 mt-2 rounded-3 overflow-hidden"
          style={{
            width: "360px",
            maxWidth: "calc(100vw - 20px)",
            background: "#1a1a1a",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            zIndex: 1100,
          }}
        >
          {/* Header */}
          <div className="p-3 border-bottom" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0 fw-semibold" style={{ color: "#e5e5e5" }}>
                  <i className="fas fa-bell me-2" style={{ color: "#9ca3af" }}></i>
                  Notifications
                </h6>
                {unreadCount > 0 && (
                  <small className="text-secondary d-block mt-1">
                    {unreadCount} new
                  </small>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  className="btn btn-sm"
                  onClick={handleMarkAllRead}
                  style={{ color: "#9ca3af", fontSize: "0.7rem" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ffc107"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{ maxHeight: "420px", overflowY: "auto" }}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-secondary" style={{ width: "28px", height: "28px" }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-inbox text-secondary fa-2x mb-2"></i>
                <p className="text-secondary small mb-0">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3 border-bottom ${!n.isRead ? "bg-dark" : ""}`}
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.05)",
                    cursor: n.actionUrl ? "pointer" : "default",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = !n.isRead ? "#1e1e1e" : "transparent"}
                  onClick={() => handleView(n.actionUrl)}
                >
                  <div className="d-flex gap-2">
                    {/* Icon */}
                    <div
                      className="rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center"
                      style={{
                        width: "32px",
                        height: "32px",
                        background: "rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <i className={`${getNotificationIcon(n.type)} text-secondary`} style={{ fontSize: "0.8rem" }}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="mb-1 small fw-semibold" style={{ color: "#e5e5e5" }}>
                          {n.title}
                        </h6>
                        <small className="text-secondary" style={{ fontSize: "0.65rem" }}>
                          {formatTime(n.createdAt)}
                        </small>
                      </div>
                      {n.message && (
                        <p className="mb-1 text-secondary small" style={{ fontSize: "0.7rem" }}>
                          {n.message.length > 80 ? n.message.substring(0, 80) + "..." : n.message}
                        </p>
                      )}
                      <div className="d-flex gap-3 mt-1">
                        {!n.isRead && (
                          <button
                            className="btn btn-sm p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(n._id);
                            }}
                            style={{ color: "#9ca3af", fontSize: "0.65rem" }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "#ffc107"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          className="btn btn-sm p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(n._id);
                          }}
                          style={{ color: "#9ca3af", fontSize: "0.65rem" }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 text-center border-top" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
              <button
                className="btn btn-sm w-100"
                onClick={() => {
                  navigate("/notifications");
                  setOpen(false);
                }}
                style={{ color: "#9ca3af", fontSize: "0.7rem" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#ffc107"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
              >
                View all
                <i className="fas fa-arrow-right ms-1"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;