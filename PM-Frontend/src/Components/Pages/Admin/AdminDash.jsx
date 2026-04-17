import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../../api/apiConfig";
import { placeholderMedium } from "../../../utils/placeholders";

const API = API_BASE_URL;

const AdminDash = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalMedia: 0,
    totalTransactions: 0,
    pendingRefunds: 0,
    photographerEarnings: 0,
    platformFees: 0,
  });
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [recentRefunds, setRecentRefunds] = useState([]);
  const [shareSummary, setShareSummary] = useState({
    totalShares: 0,
    activeShares: 0,
    expiredShares: 0,
    totalAccesses: 0,
    totalDownloads: 0,
  });
  const [recentShares, setRecentShares] = useState([]);
  const [popularMedia, setPopularMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");

  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      setLoading(true);
      
      const [
        dashboardRes,
        mediaRes,
        receiptsRes,
        refundsRes,
        usersRes,
        sharesRes,
      ] = await Promise.all([
        axios.get(`${API}/payments/admin/dashboard`, { headers }).catch(() => ({ data: {} })),
        axios.get(`${API}/media`, { headers }),
        axios.get(`${API}/payments/admin/receipts`, { headers }),
        axios.get(`${API}/payments/admin/refunds`, { headers }),
        axios.get(`${API}/auth/users`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/notifications/admin/shares?limit=6`, { headers }).catch(() => ({ data: {} })),
      ]);

      const media = Array.isArray(mediaRes.data?.media) 
        ? mediaRes.data.media 
        : (Array.isArray(mediaRes.data) ? mediaRes.data : []);
      
      const receipts = receiptsRes.data || [];
      setRecentReceipts(receipts.slice(0, 5));
      
      const refunds = refundsRes.data || [];
      setRecentRefunds(refunds.filter(r => r.status === "pending").slice(0, 5));
      
      const dashboardStats = dashboardRes.data?.stats || {};
      const totalRevenue = dashboardStats.totalRevenue ?? receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
      const totalTransactions = dashboardStats.totalSales ?? receipts.length;
      const totalUsers = dashboardStats.totalBuyers + dashboardStats.totalPhotographers + dashboardStats.totalAdmins || (Array.isArray(usersRes.data) ? usersRes.data.length : 0);
      const pendingRefunds = dashboardStats.pendingRefunds ?? refunds.filter(r => r.status === "pending").length;
      const photographerEarnings = dashboardStats.totalPhotographerEarnings ?? totalRevenue * 0.7;
      const platformFees = totalRevenue - photographerEarnings;

      const shares = Array.isArray(sharesRes.data?.shares) ? sharesRes.data.shares : [];
      const totalAccesses = shares.reduce((sum, item) => sum + (item.accessCount || 0), 0);
      const totalDownloads = shares.reduce((sum, item) => sum + (item.downloadCount || 0), 0);
      const activeShares = shares.filter((item) => item.isActive).length;
      const expiredShares = shares.filter((item) => item.isExpired).length;
      setShareSummary({
        totalShares: sharesRes.data?.total ?? shares.length,
        activeShares,
        expiredShares,
        totalAccesses,
        totalDownloads,
      });
      setRecentShares(shares.slice(0, 5));

      const popular = [...media].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5);
      setPopularMedia(popular);
      
      setStats({
        totalRevenue,
        totalUsers,
        totalMedia: dashboardStats.totalMedia ?? media.length,
        totalTransactions,
        pendingRefunds,
        photographerEarnings,
        platformFees,
      });
      
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatKES = (amount) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  const statsCards = [
    { title: "Total Revenue", value: formatKES(stats.totalRevenue), icon: "fa-dollar-sign", color: "warning", change: "+12.5%", bg: "rgba(255, 193, 7, 0.1)" },
    { title: "Photographers", value: formatKES(stats.photographerEarnings), icon: "fa-camera", color: "info", change: "70% share", bg: "rgba(23, 162, 184, 0.1)" },
    { title: "Platform Fees", value: formatKES(stats.platformFees), icon: "fa-percent", color: "success", change: "30% share", bg: "rgba(40, 167, 69, 0.1)" },
    { title: "Total Media", value: stats.totalMedia, icon: "fa-photo-video", color: "primary", change: `${stats.totalMedia} items`, bg: "rgba(0, 123, 255, 0.1)" },
    { title: "Total Users", value: stats.totalUsers, icon: "fa-users", color: "purple", change: "active users", bg: "rgba(128, 0, 128, 0.1)" },
    { title: "Active Shares", value: shareSummary.activeShares, icon: "fa-link", color: "info", change: `${shareSummary.totalShares} total`, bg: "rgba(23, 162, 184, 0.1)" },
    { title: "Share Accesses", value: shareSummary.totalAccesses, icon: "fa-eye", color: "warning", change: `${shareSummary.totalDownloads} downloads`, bg: "rgba(255, 193, 7, 0.1)" },
    { title: "Pending Refunds", value: stats.pendingRefunds, icon: "fa-undo", color: "danger", change: "awaiting review", bg: "rgba(220, 53, 69, 0.1)" },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="fas fa-chart-pie me-2 text-warning"></i>
            Admin Dashboard
          </h4>
          <p className="text-white-50 small mb-0">
            <i className="fas fa-calendar-alt me-2"></i>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        
        <div className="btn-group mt-3 mt-md-0">
          {["day", "week", "month", "year"].map((range) => (
            <button
              key={range}
              className={`btn btn-sm ${timeRange === range ? "btn-warning" : "btn-outline-warning"}`}
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-warning mb-3" style={{ width: "3rem", height: "3rem" }}></div>
          <p className="text-white-50">Loading dashboard...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            {statsCards.map((stat, idx) => (
              <div className="col-xl-3 col-lg-4 col-md-6" key={idx}>
                <div
                  className="card border-0 h-100"
                  style={{
                    background: stat.bg,
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="text-white-50 small mb-1">{stat.title}</p>
                        <h3 className="fw-bold mb-0">{stat.value}</h3>
                        <small className={`text-${stat.color} d-block mt-2`}>
                          <i className="fas fa-arrow-up me-1"></i>
                          {stat.change}
                        </small>
                      </div>
                      <div
                        className="rounded-circle p-3"
                        style={{
                          background: `rgba(255, 255, 255, 0.1)`,
                          border: `1px solid rgba(255, 193, 7, 0.2)`,
                        }}
                      >
                        <i className={`fas ${stat.icon} text-${stat.color}`}></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div
                className="card border-0"
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div className="card-header bg-transparent border-warning border-opacity-25 py-3">
                  <h6 className="fw-bold mb-0">
                    <i className="fas fa-chart-line me-2 text-warning"></i>
                    Revenue Overview ({timeRange})
                  </h6>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-end" style={{ height: "200px" }}>
                    {[65, 45, 75, 55, 85, 70, 60].map((height, idx) => (
                      <div key={idx} className="text-center" style={{ width: "12%" }}>
                        <div
                          className="bg-warning rounded-3 mb-2"
                          style={{
                            height: `${height}px`,
                            width: "100%",
                            opacity: 0.7 + (height / 200),
                          }}
                        ></div>
                        <small className="text-white-50" style={{ fontSize: "0.6rem" }}>
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Media */}
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div
                className="card border-0"
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div className="card-header bg-transparent border-warning border-opacity-25 py-3">
                  <h6 className="fw-bold mb-0">
                    <i className="fas fa-fire me-2 text-warning"></i>
                    Popular Media
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {popularMedia.map((item, idx) => (
                      <div className="col-md-2 col-4" key={item.id || item._id || idx}>
                        <div className="position-relative">
                          <img
                            src={item.thumbnail || item.image || placeholderMedium}
                            alt={item.title}
                            className="img-fluid rounded-3 w-100"
                            style={{ height: "100px", objectFit: "cover" }}
                            onError={(e) => { e.target.src = placeholderMedium; }}
                          />
                          <span className="position-absolute top-0 end-0 m-1 badge bg-warning text-dark">
                            <i className="fas fa-heart me-1"></i>
                            {item.likes || 0}
                          </span>
                        </div>
                        <small className="d-block text-truncate mt-1 text-white-50">{item.title}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Share Monitoring */}
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div className="card border-0" style={{
                background: "rgba(0, 0, 0, 0.3)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}>
                <div className="card-header bg-transparent border-warning border-opacity-25 py-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold mb-1">
                      <i className="fas fa-link me-2 text-warning"></i>
                      Share Monitoring
                    </h6>
                    <p className="text-white-50 small mb-0">Track active share links, access count, and recent share activity.</p>
                  </div>
                  <Link to="/admin/shares" className="btn btn-sm btn-outline-warning">
                    View All Shares
                  </Link>
                </div>
                <div className="card-body">
                  <div className="row g-3 mb-3">
                    {[
                      { title: "Total Shares", value: shareSummary.totalShares, icon: "fa-link", color: "warning" },
                      { title: "Active Shares", value: shareSummary.activeShares, icon: "fa-eye", color: "info" },
                      { title: "Expired Shares", value: shareSummary.expiredShares, icon: "fa-clock", color: "secondary" },
                      { title: "Total Accesses", value: shareSummary.totalAccesses, icon: "fa-chart-line", color: "success" },
                      { title: "Total Downloads", value: shareSummary.totalDownloads, icon: "fa-download", color: "primary" },
                    ].map((card) => (
                      <div className="col-md-4 col-lg-2" key={card.title}>
                        <div className="card bg-dark border-secondary h-100 p-3">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className={`badge bg-${card.color} text-dark`}>
                              <i className={`fas ${card.icon}`}></i>
                            </span>
                            <small className="text-white-50">{card.title}</small>
                          </div>
                          <h4 className="fw-bold mb-0 text-white">{card.value}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Share Token</th>
                          <th>Type</th>
                          <th>Owner</th>
                          <th>Accesses</th>
                          <th>Downloads</th>
                          <th>Remaining</th>
                          <th>Expires</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentShares.length === 0 && (
                          <tr>
                            <td colSpan="7" className="text-center text-white-50 py-4">
                              No share activity available.
                            </td>
                          </tr>
                        )}
                        {recentShares.map((share, idx) => (
                          <tr key={idx}>
                            <td className="text-truncate" style={{ maxWidth: '180px' }}>
                              <small>{share.token}</small>
                            </td>
                            <td>{share.media ? "Media" : "Album"}</td>
                            <td>{share.createdBy?.name || share.createdBy?.email || "Unknown"}</td>
                            <td>{share.accessCount || 0}</td>
                            <td>{share.downloadCount || 0}</td>
                            <td>{share.remainingDownloads}</td>
                            <td>{share.expiresAt ? new Date(share.expiresAt).toLocaleDateString() : "Never"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="row g-3">
            <div className="col-lg-6">
              <div
                className="card border-0"
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div className="card-header bg-transparent border-warning border-opacity-25 d-flex justify-content-between align-items-center py-3">
                  <h6 className="fw-bold mb-0">
                    <i className="fas fa-receipt me-2 text-warning"></i>
                    Recent Receipts
                  </h6>
                  <Link to="/admin/receipts" className="btn btn-sm btn-outline-warning">
                    View All
                  </Link>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0">
                      <tbody>
                        {recentReceipts.map((r, idx) => (
                          <tr key={idx}>
                            <td className="ps-3">
                              <small>{r.user?.email || "N/A"}</small>
                            </td>
                            <td>
                              <span className="badge bg-warning text-dark">
                                {formatKES(r.amount)}
                              </span>
                            </td>
                            <td className="text-end pe-3">
                              <small className="text-white-50">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </small>
                            </td>
                          </tr>
                        ))}
                        {recentReceipts.length === 0 && (
                          <tr>
                            <td colSpan="3" className="text-center text-white-50 py-4">
                              No recent receipts
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div
                className="card border-0"
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div className="card-header bg-transparent border-warning border-opacity-25 d-flex justify-content-between align-items-center py-3">
                  <h6 className="fw-bold mb-0">
                    <i className="fas fa-undo me-2 text-warning"></i>
                    Pending Refunds
                  </h6>
                  <Link to="/admin/refunds" className="btn btn-sm btn-outline-warning">
                    Manage
                  </Link>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0">
                      <tbody>
                        {recentRefunds.map((r, idx) => (
                          <tr key={idx}>
                            <td className="ps-3">
                              <small>{r.user?.email || "N/A"}</small>
                            </td>
                            <td>
                              <span className="badge bg-danger">
                                {formatKES(r.amount)}
                              </span>
                            </td>
                            <td className="text-end pe-3">
                              <small className="text-white-50">
                                {r.reason?.substring(0, 20)}...
                              </small>
                            </td>
                          </tr>
                        ))}
                        {recentRefunds.length === 0 && (
                          <tr>
                            <td colSpan="3" className="text-center text-white-50 py-4">
                              No pending refunds
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDash;