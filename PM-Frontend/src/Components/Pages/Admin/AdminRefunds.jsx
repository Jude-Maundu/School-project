import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import { API_BASE_URL } from "../../../api/apiConfig";

const API = API_BASE_URL;

const AdminRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchRefunds = async () => {
    try {
      const res = await axios.get(`${API}/payments/admin/refunds`, { headers });
      setRefunds(res.data);
    } catch (error) {
      console.error("Error fetching refunds:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleApprove = async (refundId) => {
    if (!window.confirm("Approve this refund?")) return;
    try {
      await axios.post(`${API}/payments/refund/approve`, { refundId }, { headers });
      fetchRefunds();
    } catch (error) {
      alert("Failed to approve refund");
    }
  };

  const handleReject = async (refundId) => {
    if (!window.confirm("Reject this refund?")) return;
    try {
      await axios.post(`${API}/payments/refund/reject`, { refundId }, { headers });
      fetchRefunds();
    } catch (error) {
      alert("Failed to reject refund");
    }
  };

  const handleProcess = async (refundId) => {
    if (!window.confirm("Process this refund and credit wallet?")) return;
    try {
      await axios.post(`${API}/payments/refund/process`, { refundId }, { headers });
      fetchRefunds();
    } catch (error) {
      alert("Failed to process refund");
    }
  };

  const filteredRefunds = refunds.filter(r => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const stats = {
    pending: refunds.filter(r => r.status === "pending").length,
    approved: refunds.filter(r => r.status === "approved").length,
    rejected: refunds.filter(r => r.status === "rejected").length,
    processed: refunds.filter(r => r.status === "processed").length,
    totalAmount: refunds.reduce((sum, r) => sum + (r.amount || 0), 0),
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <h4 className="fw-bold mb-3 mb-md-0">
          <i className="fas fa-undo me-2 text-warning"></i>
          Refunds Management
        </h4>
        <button className="btn btn-warning" onClick={fetchRefunds}>
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-2 col-6">
          <div className="card bg-dark border-warning p-2 text-center">
            <h5 className="text-warning mb-0">{stats.pending}</h5>
            <small>Pending</small>
          </div>
        </div>
        <div className="col-md-2 col-6">
          <div className="card bg-dark border-success p-2 text-center">
            <h5 className="text-success mb-0">{stats.approved}</h5>
            <small>Approved</small>
          </div>
        </div>
        <div className="col-md-2 col-6">
          <div className="card bg-dark border-danger p-2 text-center">
            <h5 className="text-danger mb-0">{stats.rejected}</h5>
            <small>Rejected</small>
          </div>
        </div>
        <div className="col-md-2 col-6">
          <div className="card bg-dark border-info p-2 text-center">
            <h5 className="text-info mb-0">{stats.processed}</h5>
            <small>Processed</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-dark border-warning p-2 text-center">
            <h5 className="text-warning mb-0">KES {stats.totalAmount.toLocaleString()}</h5>
            <small>Total Refund Amount</small>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <div className="btn-group">
          {["pending", "approved", "rejected", "processed", "all"].map((f) => (
            <button
              key={f}
              className={`btn ${filter === f ? "btn-warning" : "btn-outline-warning"}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-warning mb-3"></div>
          <p>Loading refunds...</p>
        </div>
      )}

      {/* Refunds Table */}
      {!loading && (
        <div className="table-responsive bg-dark rounded-3 border border-secondary">
          <table className="table table-dark table-hover mb-0">
            <thead>
              <tr>
                <th className="ps-3">User</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th className="pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRefunds.map((r) => (
                <tr key={r._id}>
                  <td className="ps-3">
                    <div className="d-flex align-items-center gap-2">
                      <i className="fas fa-user-circle text-warning"></i>
                      {r.user?.email || "N/A"}
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-warning text-dark">KES {r.amount}</span>
                  </td>
                  <td>
                    <small>{r.reason || "No reason provided"}</small>
                  </td>
                  <td>
                    <span className={`badge bg-${
                      r.status === "pending" ? "warning" :
                      r.status === "approved" ? "success" :
                      r.status === "rejected" ? "danger" : "info"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <small>{new Date(r.createdAt).toLocaleDateString()}</small>
                  </td>
                  <td className="pe-3">
                    {r.status === "pending" && (
                      <>
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleApprove(r._id)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-danger me-2"
                          onClick={() => handleReject(r._id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {r.status === "approved" && (
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleProcess(r._id)}
                      >
                        Process Refund
                      </button>
                    )}
                    {r.status === "processed" && (
                      <span className="text-success">
                        <i className="fas fa-check-circle"></i> Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminRefunds;