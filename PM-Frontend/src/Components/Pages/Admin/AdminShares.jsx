import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminGetAllShares } from "../../../api/API";

const AdminShares = () => {
  const [shares, setShares] = useState([]);
  const [summary, setSummary] = useState({
    totalShares: 0,
    activeShares: 0,
    expiredShares: 0,
    totalAccesses: 0,
    totalDownloads: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const res = await adminGetAllShares("", 20, 0);
      const data = res.data || {};
      const shareList = Array.isArray(data.shares) ? data.shares : [];
      const totalAccesses = shareList.reduce((sum, item) => sum + (item.accessCount || 0), 0);
      const totalDownloads = shareList.reduce((sum, item) => sum + (item.downloadCount || 0), 0);
      const activeShares = shareList.filter((item) => item.isActive).length;
      const expiredShares = shareList.filter((item) => item.isExpired).length;

      setShares(shareList);
      setSummary({
        totalShares: data.total ?? shareList.length,
        activeShares,
        expiredShares,
        totalAccesses,
        totalDownloads,
      });
      setError(null);
    } catch (err) {
      console.error("AdminShares error:", err);
      setError(err.response?.data?.error || "Failed to load share monitoring data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  return (
    <AdminLayout>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="fas fa-link me-2 text-warning"></i>
            Share Monitoring
          </h2>
          <p className="text-white-50 small mb-0">
            Review active share links, usage, and download activity across the platform.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" style={{ width: "3rem", height: "3rem" }}></div>
          <p className="text-white-50 mt-3">Loading share monitoring data...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="row g-3 mb-4">
            {[
              { title: "Total Shares", value: summary.totalShares, icon: "fa-link", color: "warning" },
              { title: "Active", value: summary.activeShares, icon: "fa-check", color: "success" },
              { title: "Expired", value: summary.expiredShares, icon: "fa-clock", color: "secondary" },
              { title: "Total Accesses", value: summary.totalAccesses, icon: "fa-eye", color: "info" },
              { title: "Total Downloads", value: summary.totalDownloads, icon: "fa-download", color: "primary" },
            ].map((card) => (
              <div className="col-lg-2 col-md-4" key={card.title}>
                <div className="card bg-dark border-secondary h-100 p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className={`badge bg-${card.color} text-dark`}>
                      <i className={`fas ${card.icon}`}></i>
                    </span>
                    <small className="text-white-50">{card.title}</small>
                  </div>
                  <h4 className="fw-bold text-white">{card.value}</h4>
                </div>
              </div>
            ))}
          </div>

          <div className="card border-0" style={{
            background: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-dark table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Type</th>
                      <th>Owner</th>
                      <th>Accesses</th>
                      <th>Downloads</th>
                      <th>Remaining</th>
                      <th>Expires</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shares.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-white-50 py-4">
                          No share data available.
                        </td>
                      </tr>
                    ) : (
                      shares.map((share, idx) => (
                        <tr key={idx}>
                          <td style={{ maxWidth: "180px" }} className="text-truncate">
                            <small>{share.token}</small>
                          </td>
                          <td>{share.media ? "Media" : "Album"}</td>
                          <td>{share.createdBy?.name || share.createdBy?.email || "Unknown"}</td>
                          <td>{share.accessCount || 0}</td>
                          <td>{share.downloadCount || 0}</td>
                          <td>{share.remainingDownloads}</td>
                          <td>{share.expiresAt ? new Date(share.expiresAt).toLocaleDateString() : "Never"}</td>
                          <td>
                            <span className={`badge bg-${share.isActive ? "success" : "secondary"}`}>
                              {share.isActive ? "Active" : "Revoked"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminShares;
