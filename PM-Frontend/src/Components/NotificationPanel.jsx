import React, { useState, useEffect } from "react";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "../api/API";

const NotificationPanel = ({ userRole = "buyer" }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotifications(10, 0);
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and polling
  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Delete notification
  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Format time
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

  return (
    <>
      {/* Notification Bell - Fixed Position Top Right */}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
        <button
          className="btn btn-warning position-relative rounded-circle"
          style={{
            width: "60px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            boxShadow: "0 4px 12px rgba(255, 193, 7, 0.3)",
          }}
          onClick={() => {
            setShowPanel(!showPanel);
            if (!showPanel) fetchNotifications();
          }}
        >
          <i className="fas fa-bell"></i>
          {unreadCount > 0 && (
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ transform: "translate(-50%, -50%)" }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      {showPanel && (
        <div
          className="position-fixed top-0 end-0 h-100"
          style={{
            width: "400px",
            maxWidth: "90vw",
            backgroundColor: "#1a1a1a",
            borderLeft: "1px solid rgba(255, 193, 7, 0.2)",
            boxShadow: "-4px 0 16px rgba(0, 0, 0, 0.5)",
            zIndex: 1040,
            overflowY: "auto",
          }}
        >
          {/* Header */}
          <div className="p-3 border-bottom border-warning">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-warning">
                <i className="fas fa-bell me-2"></i>
                Notifications
              </h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowPanel(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            {unreadCount > 0 && (
              <small className="text-white-50 d-block mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </small>
            )}
          </div>

          {/* Mark All as Read */}
          {unreadCount > 0 && (
            <div className="p-2 border-bottom border-secondary">
              <button
                className="btn btn-sm btn-outline-warning w-100"
                onClick={handleMarkAllAsRead}
              >
                <i className="fas fa-check-double me-1"></i>
                Mark All As Read
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="p-3">
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-warning sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="text-center py-5 text-white-50">
                <i className="fas fa-inbox fa-2x mb-3 d-block"></i>
                <p>No notifications yet</p>
              </div>
            )}

            {!loading &&
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-3 rounded-3 mb-2 ${
                    notif.isRead
                      ? "bg-dark border border-secondary"
                      : "bg-warning bg-opacity-10 border border-warning"
                  }`}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="mb-1 text-white">
                        {!notif.isRead && (
                          <i className="fas fa-circle text-warning me-2" style={{ fontSize: "8px" }}></i>
                        )}
                        {notif.title}
                      </h6>
                      {notif.message && (
                        <p className="mb-2 text-white-50 small">{notif.message}</p>
                      )}
                      <small className="text-white-50">
                        <i className="fas fa-clock me-1"></i>
                        {formatTime(notif.createdAt)}
                      </small>
                    </div>

                    {/* Actions */}
                    <div className="ms-2 d-flex gap-1">
                      {notif.actionUrl && (
                        <a
                          href={notif.actionUrl}
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => setShowPanel(false)}
                        >
                          {notif.actionLabel || "View"}
                        </a>
                      )}
                      {!notif.isRead && (
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => handleMarkAsRead(notif._id)}
                          title="Mark as read"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(notif._id)}
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Overlay */}
      {showPanel && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)", zIndex: 1039 }}
          onClick={() => setShowPanel(false)}
        />
      )}
    </>
  );
};

export default NotificationPanel;
