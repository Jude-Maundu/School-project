import React, { useState, useEffect } from "react";
import BuyerLayout from "./BuyerLayout";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../api/apiConfig";
import { fetchProtectedUrl } from "../../../utils/imageUrl";
import { placeholderMedium } from "../../../utils/placeholders";

const API = API_BASE_URL;

const BuyerTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [filter, setFilter] = useState("all"); // all, completed, pending, failed
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id || user._id;
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch purchase history
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/payments/purchase-history/${userId}`, { headers });
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
  const getSignedUrl = async (mediaId, title) => {
    setDownloadingId(mediaId);
    try {
      const downloadUrl = await fetchProtectedUrl(mediaId);
      if (!downloadUrl) {
        alert("Failed to generate download link. You may not have access to this media.");
        return;
      }
      
      // Fetch and download the file
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'download'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Error downloading:", err);
      alert("Failed to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge class
  const getStatusBadge = (status) => {
    const colors = {
      completed: "success",
      pending: "warning",
      failed: "danger",
      refunded: "info"
    };
    return `badge bg-${colors[status?.toLowerCase()] || "secondary"} px-3 py-2 rounded-pill`;
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === "all" || tx.status?.toLowerCase() === filter;
    const matchesSearch = tx.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.mediaDetails?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.receiptId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate summary stats
  const totalSpent = filteredTransactions.reduce((sum, tx) => sum + (tx.amount || tx.price || 0), 0);
  const completedCount = filteredTransactions.filter(tx => tx.status === "completed").length;
  const pendingCount = filteredTransactions.filter(tx => tx.status === "pending").length;

  useEffect(() => {
    if (!token || !userId) {
      setError("Please login to view transactions");
      return;
    }
    fetchTransactions();
  }, []);

  const glassStyle = {
    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px",
  };

  return (
    <BuyerLayout>
      <div className="text-white">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold mb-1">
              <i className="fas fa-history me-2 text-warning"></i>
              Transaction History
            </h2>
            <p className="text-white-50 mb-0 small">
              View all your purchases and download your media
            </p>
          </div>
          <button 
            className="btn btn-outline-warning rounded-pill px-4 py-2"
            onClick={fetchTransactions}
            disabled={loading}
          >
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4 rounded-3" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && transactions.length > 0 && (
          <div className="row g-3 mb-4">
            <div className="col-md-3 col-6">
              <div className="card text-center p-3" style={glassStyle}>
                <h3 className="text-warning fw-bold mb-1">{filteredTransactions.length}</h3>
                <small className="text-white-50">Total Purchases</small>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="card text-center p-3" style={glassStyle}>
                <h3 className="text-success fw-bold mb-1">{completedCount}</h3>
                <small className="text-white-50">Completed</small>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="card text-center p-3" style={glassStyle}>
                <h3 className="text-warning fw-bold mb-1">{pendingCount}</h3>
                <small className="text-white-50">Pending</small>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="card text-center p-3" style={glassStyle}>
                <h3 className="text-info fw-bold mb-1">KES {totalSpent.toLocaleString()}</h3>
                <small className="text-white-50">Total Spent</small>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {!loading && transactions.length > 0 && (
          <div className="d-flex flex-column flex-sm-row justify-content-between gap-3 mb-4">
            <div className="d-flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`btn btn-sm rounded-pill px-3 ${filter === "all" ? "btn-warning text-dark" : "btn-outline-warning"}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`btn btn-sm rounded-pill px-3 ${filter === "completed" ? "btn-warning text-dark" : "btn-outline-warning"}`}
              >
                <i className="fas fa-check-circle me-1"></i> Completed
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`btn btn-sm rounded-pill px-3 ${filter === "pending" ? "btn-warning text-dark" : "btn-outline-warning"}`}
              >
                <i className="fas fa-clock me-1"></i> Pending
              </button>
            </div>
            <div className="position-relative" style={{ width: "250px" }}>
              <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-white-50"></i>
              <input
                type="text"
                className="form-control bg-dark border-secondary text-white ps-5 rounded-pill"
                placeholder="Search by title or receipt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning mb-3" style={{ width: "3rem", height: "3rem" }}></div>
            <p className="text-white-50">Loading your transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-5" style={glassStyle}>
            <i className="fas fa-receipt fa-4x text-white-50 mb-3"></i>
            <h5 className="mb-3">No transactions found</h5>
            <p className="text-white-50 mb-4">
              {searchTerm || filter !== "all" ? "Try adjusting your filters" : "Start exploring and purchase your first photo!"}
            </p>
            {(searchTerm || filter !== "all") ? (
              <button 
                className="btn btn-outline-warning rounded-pill px-4"
                onClick={() => { setSearchTerm(""); setFilter("all"); }}
              >
                <i className="fas fa-undo me-2"></i>
                Clear Filters
              </button>
            ) : (
              <Link to="/buyer/explore" className="btn btn-warning rounded-pill px-4">
                <i className="fas fa-compass me-2"></i>
                Explore Photos
              </Link>
            )}
          </div>
        ) : (
          <div className="card bg-dark border-0" style={glassStyle}>
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr className="border-bottom border-secondary">
                    <th className="py-3">Receipt ID</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Item</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Transaction ID</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx, idx) => (
                    <tr key={tx._id || idx} className="border-bottom border-secondary">
                      <td className="py-3">
                        <span className="text-warning fw-medium">
                          #{tx.receiptId || tx._id?.slice(-8)}
                        </span>
                      </td>
                      <td className="py-3">
                        <small>{formatDate(tx.createdAt || tx.date)}</small>
                      </td>
                      <td className="py-3">
                        <div className="d-flex flex-column">
                          <span className="fw-medium">{tx.mediaDetails?.title || tx.title || "Untitled"}</span>
                          <small className="text-white-50">
                            <i className="fas fa-user-circle me-1"></i>
                            {tx.mediaDetails?.photographerName || tx.photographerName || "Unknown"}
                          </small>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-warning fw-bold fs-5">KES {tx.amount || tx.price}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-white-50 small" style={{ fontSize: '0.75rem' }}>
                          {tx.transactionId || tx.mpesaReceiptNumber || tx.checkoutRequestID || tx.merchantRequestID || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={getStatusBadge(tx.status)}>
                          <i className={`fas fa-${tx.status === "completed" ? "check-circle" : tx.status === "pending" ? "clock" : "exclamation-circle"} me-1`}></i>
                          {tx.status || "completed"}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-sm btn-outline-info rounded-circle"
                            style={{ width: "32px", height: "32px" }}
                            onClick={() => fetchReceipt(tx.receiptId || tx._id)}
                            title="View Receipt"
                          >
                            <i className="fas fa-receipt"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success rounded-circle"
                            style={{ width: "32px", height: "32px" }}
                            onClick={() => getSignedUrl(tx.mediaId, tx.title)}
                            disabled={downloadingId === tx.mediaId}
                            title="Download"
                          >
                            {downloadingId === tx.mediaId ? (
                              <div className="spinner-border spinner-border-sm"></div>
                            ) : (
                              <i className="fas fa-download"></i>
                            )}
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

      {/* Receipt Modal - Enhanced */}
      {showReceiptModal && selectedReceipt && (
        <div
          className="modal show d-block"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(8px)",
            zIndex: 1050,
          }}
          onClick={() => setShowReceiptModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div 
              className="modal-content bg-dark border-warning"
              style={{ borderRadius: "20px", overflow: "hidden" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header border-warning py-3 px-4">
                <h5 className="modal-title text-warning fw-bold">
                  <i className="fas fa-receipt me-2"></i>
                  Payment Receipt
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowReceiptModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="text-center mb-4">
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <i className="fas fa-check-circle text-success fa-3x"></i>
                  </div>
                  <h5 className="text-white fw-bold">Payment Successful!</h5>
                  <p className="text-white-50 small">Thank you for your purchase</p>
                </div>
                
                <div className="bg-dark p-4 rounded-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {/* Receipt Header */}
                  <div className="text-center mb-4">
                    <div className="mb-2">
                      <i className="fas fa-camera text-warning fa-2x"></i>
                    </div>
                    <h6 className="text-white mb-0">PhotoMarket</h6>
                    <small className="text-white-50">Official Payment Receipt</small>
                  </div>
                  
                  <hr className="border-secondary" />
                  
                  {/* Receipt Details */}
                  <div className="row mb-2">
                    <div className="col-6">
                      <small className="text-white-50">Receipt Number:</small>
                    </div>
                    <div className="col-6 text-end">
                      <small className="text-warning fw-bold">#{selectedReceipt.receiptId}</small>
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-6">
                      <small className="text-white-50">Date & Time:</small>
                    </div>
                    <div className="col-6 text-end">
                      <small className="text-white">{formatDate(selectedReceipt.createdAt)}</small>
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-6">
                      <small className="text-white-50">Transaction ID:</small>
                    </div>
                    <div className="col-6 text-end">
                      <small className="text-white">{selectedReceipt.transactionId || 'N/A'}</small>
                    </div>
                  </div>
                  
                  <hr className="border-secondary" />
                  
                  {/* Item Details */}
                  <div className="row mb-2">
                    <div className="col-6">
                      <small className="text-white-50">Item:</small>
                    </div>
                    <div className="col-6 text-end">
                      <small className="text-white fw-medium">{selectedReceipt.mediaDetails?.title}</small>
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-6">
                      <small className="text-white-50">Photographer:</small>
                    </div>
                    <div className="col-6 text-end">
                      <small className="text-white">{selectedReceipt.mediaDetails?.photographerName}</small>
                    </div>
                  </div>
                  
                  <hr className="border-secondary" />
                  
                  {/* Payment Summary */}
                  <div className="row mb-2">
                    <div className="col-6">
                      <strong className="text-white">Total Amount:</strong>
                    </div>
                    <div className="col-6 text-end">
                      <strong className="text-warning fs-5">KES {selectedReceipt.amount}</strong>
                    </div>
                  </div>
                  
                  <hr className="border-secondary" />
                  
                  {/* Footer */}
                  <div className="text-center mt-3">
                    <small className="text-white-50">
                      <i className="fas fa-shield-alt me-1"></i>
                      This is an official receipt from PhotoMarket
                    </small>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-secondary py-3 px-4">
                <button
                  className="btn btn-outline-warning rounded-pill px-4"
                  onClick={() => window.print()}
                >
                  <i className="fas fa-print me-2"></i>
                  Print Receipt
                </button>
                <button
                  className="btn btn-warning rounded-pill px-4"
                  onClick={() => setShowReceiptModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .table > :not(caption) > * > * {
          background-color: transparent !important;
          border-bottom-color: rgba(255,255,255,0.1);
        }
        .table-hover tbody tr:hover {
          background-color: rgba(255,193,7,0.05);
        }
        .btn-outline-info:hover {
          background-color: #0dcaf0;
          border-color: #0dcaf0;
          color: #000;
        }
        .btn-outline-success:hover {
          background-color: #198754;
          border-color: #198754;
        }
        @media print {
          .modal-content {
            box-shadow: none;
          }
          .modal-footer {
            display: none;
          }
        }
      `}</style>
    </BuyerLayout>
  );
};

export default BuyerTransactions;