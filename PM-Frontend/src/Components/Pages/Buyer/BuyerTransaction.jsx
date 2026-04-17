import React, { useState, useEffect } from "react";
import BuyerLayout from "./BuyerLayout";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../api/apiConfig";
import { fetchProtectedUrl } from "../../../utils/imageUrl";

const API = API_BASE_URL;

const BuyerTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id || user._id;
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch purchase history
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/payments/purchase-history/${userId}`, { headers });
      // Handle various response formats
      let transactionData = [];
      if (Array.isArray(res.data)) {
        transactionData = res.data;
      } else if (res.data?.purchases && Array.isArray(res.data.purchases)) {
        transactionData = res.data.purchases;
      } else if (res.data?.transactions && Array.isArray(res.data.transactions)) {
        transactionData = res.data.transactions;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        transactionData = res.data.data;
      }
      setTransactions(Array.isArray(transactionData) ? transactionData : []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  };

  // Fetch receipt details
  const fetchReceipt = async (receiptId) => {
    try {
      const res = await axios.get(`${API}/payments/receipt/${receiptId}`, { headers });
      setSelectedReceipt(res.data);
      setShowReceiptModal(true);
    } catch (err) {
      console.error("Error fetching receipt:", err);
      alert("Failed to load receipt");
    }
  };

  // Get signed URL for download
  const getSignedUrl = async (mediaId) => {
    try {
      const downloadUrl = await fetchProtectedUrl(mediaId);
      if (!downloadUrl) {
        alert("Failed to generate download link. You may not have access to this media.");
        return;
      }
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error("Error getting download URL:", err);
      alert("Failed to generate download link");
    }
  };

  useEffect(() => {
    if (!token || !userId) {
      setError("Please login to view transactions");
      return;
    }
    fetchTransactions();
  }, []);

  const getStatusBadge = (status) => {
    const colors = {
      completed: "success",
      pending: "warning",
      failed: "danger",
      refunded: "info"
    };
    return `badge bg-${colors[status] || "secondary"}`;
  };

  return (
    <BuyerLayout>
      <div className="text-white">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">
            <i className="fas fa-history me-2 text-warning"></i>
            Transaction History
          </h2>
          <button 
            className="btn btn-outline-warning"
            onClick={fetchTransactions}
            disabled={loading}
          >
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-receipt fa-4x text-white-50 mb-3"></i>
            <h5 className="mb-3">No transactions yet</h5>
            <p className="text-white-50 mb-4">Start exploring and purchase your first photo!</p>
            <Link to="/buyer/explore" className="btn btn-warning">
              <i className="fas fa-compass me-2"></i>
              Explore Photos
            </Link>
          </div>
        ) : (
          <div className="card bg-dark border-secondary">
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th>Receipt ID</th>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Amount</th>
                    <th>Txn Code</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, idx) => (
                    <tr key={tx._id || idx}>
                      <td>
                        <small className="text-warning">#{tx.receiptId || tx._id?.slice(-6)}</small>
                      </td>
                      <td>{new Date(tx.createdAt || tx.date).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          {tx.mediaDetails?.title || tx.title}
                          <small className="text-white-50 d-block">
                            {tx.mediaDetails?.photographerName}
                          </small>
                        </div>
                      </td>
                      <td className="text-warning fw-bold">KES {tx.amount || tx.price}</td>
                      <td>
                        <span className="text-white-50" style={{ fontSize: '0.85rem' }}>
                          {tx.transactionId || tx.mpesaReceiptNumber || tx.checkoutRequestID || tx.merchantRequestID || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadge(tx.status)}>
                          {tx.status || "completed"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => fetchReceipt(tx.receiptId || tx._id)}
                          >
                            <i className="fas fa-receipt"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => getSignedUrl(tx.mediaId)}
                          >
                            <i className="fas fa-download"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <div
          className="modal show d-block"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(5px)",
            zIndex: 1050,
          }}
          onClick={() => setShowReceiptModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content bg-dark border-warning"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header border-warning">
                <h5 className="modal-title text-warning">
                  <i className="fas fa-receipt me-2"></i>
                  Payment Receipt
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowReceiptModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <i className="fas fa-check-circle text-success fa-4x mb-3"></i>
                  <h5>Payment Successful!</h5>
                </div>
                
                <div className="bg-dark p-3 rounded border border-secondary">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-white-50">Receipt ID:</span>
                    <span className="text-warning">#{selectedReceipt.receiptId}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-white-50">Date:</span>
                    <span>{new Date(selectedReceipt.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-white-50">Item:</span>
                    <span>{selectedReceipt.mediaDetails?.title}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-white-50">Photographer:</span>
                    <span>{selectedReceipt.mediaDetails?.photographerName}</span>
                  </div>
                  <hr className="border-secondary" />
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Amount Paid:</span>
                    <span className="text-warning">KES {selectedReceipt.amount}</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button
                  className="btn btn-warning"
                  onClick={() => window.print()}
                >
                  <i className="fas fa-print me-2"></i>
                  Print Receipt
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowReceiptModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </BuyerLayout>
  );
};

export default BuyerTransactions;