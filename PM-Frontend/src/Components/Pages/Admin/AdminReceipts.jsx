import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import { API_BASE_URL } from "../../../api/apiConfig";

const API = API_BASE_URL;

const AdminReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchReceipts = async () => {
    try {
      const res = await axios.get(`${API}/payments/admin/receipts`, { headers });
      setReceipts(res.data);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const filteredReceipts = receipts.filter(r => {
    const searchTerm = search.toLowerCase();
    const matchesSearch = 
      r.user?.email?.toLowerCase().includes(searchTerm) ||
      r.receiptNumber?.toLowerCase().includes(searchTerm) ||
      r.transactionId?.toLowerCase().includes(searchTerm);
    
    if (dateFilter === "all") return matchesSearch;
    
    const date = new Date(r.createdAt);
    const now = new Date();
    const days = (now - date) / (1000 * 60 * 60 * 24);
    
    if (dateFilter === "today") return days <= 1 && matchesSearch;
    if (dateFilter === "week") return days <= 7 && matchesSearch;
    if (dateFilter === "month") return days <= 30 && matchesSearch;
    
    return matchesSearch;
  });

  const totalRevenue = filteredReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const photographerShare = totalRevenue * 0.7;
  const platformFees = totalRevenue * 0.3;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <h4 className="fw-bold mb-3 mb-md-0">
          <i className="fas fa-receipt me-2 text-warning"></i>
          Receipts Management
        </h4>
        <button className="btn btn-warning" onClick={fetchReceipts}>
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card bg-dark border-warning">
            <div className="card-body">
              <small className="text-white-50">Total Revenue</small>
              <h4 className="fw-bold text-warning">KES {totalRevenue.toLocaleString()}</h4>
              <small className="text-success">
                <i className="fas fa-arrow-up me-1"></i>
                +12.5% this month
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-dark border-info">
            <div className="card-body">
              <small className="text-white-50">Photographers Share (70%)</small>
              <h4 className="fw-bold text-info">KES {photographerShare.toLocaleString()}</h4>
              <small className="text-white-50">To be disbursed</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-dark border-success">
            <div className="card-body">
              <small className="text-white-50">Platform Fees (30%)</small>
              <h4 className="fw-bold text-success">KES {platformFees.toLocaleString()}</h4>
              <small className="text-white-50">Net profit</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control bg-dark border-secondary text-white"
            placeholder="Search by email or receipt number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <select
            className="form-select bg-dark border-secondary text-white"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-warning mb-3"></div>
          <p>Loading receipts...</p>
        </div>
      )}

      {/* Receipts Table */}
      {!loading && (
        <div className="table-responsive bg-dark rounded-3 border border-secondary">
          <table className="table table-dark table-hover mb-0">
            <thead>
              <tr>
                <th className="ps-3">Receipt #</th>
                <th>User</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Txn Code</th>
                <th>Status</th>
                <th>Date</th>
                <th className="pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.map((r) => (
                <tr key={r._id}>
                  <td className="ps-3">
                    <small className="fw-bold">{r.receiptNumber || `REC-${r._id?.substring(0, 8)}`}</small>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <i className="fas fa-user-circle text-warning"></i>
                      {r.user?.email || "N/A"}
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-warning text-dark">KES {r.amount}</span>
                  </td>
                  <td>
                    <span className={`badge bg-${r.method === 'mpesa' ? 'success' : 'info'}`}>
                      <i className={`fas fa-${r.method === 'mpesa' ? 'mobile-alt' : 'credit-card'} me-1`}></i>
                      {r.method || 'card'}
                    </span>
                  </td>
                  <td>
                    <span className="text-white-50" style={{ fontSize: '0.8rem' }}>
                      {r.transactionId || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge bg-${r.status === 'completed' ? 'success' : 'warning'}`}>
                      {r.status || 'pending'}
                    </span>
                  </td>
                  <td>
                    <small>{new Date(r.createdAt).toLocaleString()}</small>
                  </td>
                  <td className="pe-3">
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => setSelectedReceipt(r)}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="modal-dialog">
            <div className="modal-content bg-dark border-warning">
              <div className="modal-header border-warning">
                <h5 className="modal-title text-warning">Receipt Details</h5>
                <button className="btn-close btn-close-white" onClick={() => setSelectedReceipt(null)}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <i className="fas fa-receipt fa-3x text-warning mb-2"></i>
                  <h5>{selectedReceipt.receiptNumber || `REC-${selectedReceipt._id?.substring(0, 8)}`}</h5>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <div className="card bg-dark border-secondary p-2">
                      <small className="text-white-50">User</small>
                      <span>{selectedReceipt.user?.email || "N/A"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="card bg-dark border-secondary p-2">
                      <small className="text-white-50">Amount</small>
                      <span className="text-warning fw-bold">KES {selectedReceipt.amount}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="card bg-dark border-secondary p-2">
                      <small className="text-white-50">Method</small>
                      <span>{selectedReceipt.method || 'card'}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="card bg-dark border-secondary p-2">
                      <small className="text-white-50">Transaction Code</small>
                      <span>{selectedReceipt.transactionId || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="card bg-dark border-secondary p-2">
                      <small className="text-white-50">Date</small>
                      <span>{new Date(selectedReceipt.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReceipts;