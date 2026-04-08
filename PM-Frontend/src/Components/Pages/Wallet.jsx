import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../api/apiConfig";
import { getAuthToken } from "../../utils/auth";

// Since BuyerLayout doesn't exist, use a simple layout or remove it
// For now, let's create a simple wrapper div

const Wallet = () => {
  const [wallet, setWallet] = useState({
    balance: 0,
    currency: "KES",
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [activeTab, setActiveTab] = useState("balance");

  const token = getAuthToken();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};
  const userId = user?.id || user?._id;

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch wallet data
  const fetchWallet = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get wallet balance
      const walletRes = await axios.get(`${API_BASE_URL}/wallet/${userId}`, { headers });
      setWallet({
        balance: walletRes.data?.balance || 0,
        currency: "KES",
        transactions: walletRes.data?.transactions || []
      });
    } catch (err) {
      console.error("Error fetching wallet:", err);
      setError("Failed to load wallet data");
      setWallet({
        balance: 0,
        currency: "KES",
        transactions: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [userId]); // Added fetchWallet to dependency array is optional, but userId is the main dependency

  // Handle wallet topup
  const handleTopup = async () => {
    if (!topupAmount || parseFloat(topupAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!phoneNumber || !/^254\d{9}$/.test(phoneNumber)) {
      alert("Please enter a valid phone number (format: 254XXXXXXXXX)");
      return;
    }

    setProcessing(true);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payments/mpesa`,
        {
          buyerId: userId,
          buyerPhone: phoneNumber,
          amount: parseFloat(topupAmount),
          walletTopup: true
        },
        { headers }
      );

      if (response.data?.success) {
        alert(`STK Push sent to ${phoneNumber}. Please check your phone to complete payment.`);
        setShowTopupModal(false);
        setTopupAmount("");
        setPhoneNumber("");
        setTimeout(() => fetchWallet(), 5000);
      } else {
        alert(response.data?.message || "Failed to initiate payment");
      }
    } catch (err) {
      console.error("Topup error:", err);
      alert(err.response?.data?.message || "Failed to process topup");
    } finally {
      setProcessing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="container mt-5 pt-5">
        <div className="text-center py-5">
          <div className="spinner-border text-warning mb-3"></div>
          <p className="text-white-50">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark text-white" style={{ minHeight: "100vh" }}>
      <div className="container py-4">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">
              <i className="fas fa-wallet me-2 text-warning"></i>
              My Wallet
            </h2>
            <p className="text-white-50 small">
              Manage your funds and transactions
            </p>
          </div>
          <button
            className="btn btn-warning rounded-pill px-4 mt-3 mt-md-0"
            onClick={() => setShowTopupModal(true)}
          >
            <i className="fas fa-plus-circle me-2"></i>
            Top Up Wallet
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger mb-4">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        {/* Balance Card */}
        <div className="card bg-dark border-secondary mb-4" style={{ borderRadius: "20px" }}>
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-md-8">
                <p className="text-white-50 mb-1">Available Balance</p>
                <h1 className="display-4 fw-bold text-warning mb-0">
                  {formatCurrency(wallet.balance)}
                </h1>
                <p className="text-white-50 small mt-2">
                  <i className="fas fa-info-circle me-1"></i>
                  Use this balance to purchase photos instantly
                </p>
              </div>
              <div className="col-md-4 text-md-end mt-3 mt-md-0">
                <div className="d-flex gap-2 justify-content-md-end">
                  <button
                    className="btn btn-outline-warning rounded-pill"
                    onClick={() => setShowTopupModal(true)}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Add Funds
                  </button>
                  <Link to="/explore" className="btn btn-warning rounded-pill">
                    <i className="fas fa-shopping-cart me-2"></i>
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="d-flex gap-2 mb-4 border-bottom border-secondary pb-2">
          <button
            className={`btn btn-sm ${activeTab === "balance" ? "btn-warning" : "btn-outline-secondary"} rounded-pill px-4`}
            onClick={() => setActiveTab("balance")}
          >
            <i className="fas fa-chart-line me-2"></i>
            Balance Overview
          </button>
          <button
            className={`btn btn-sm ${activeTab === "transactions" ? "btn-warning" : "btn-outline-secondary"} rounded-pill px-4`}
            onClick={() => setActiveTab("transactions")}
          >
            <i className="fas fa-list me-2"></i>
            Transaction History
          </button>
        </div>

        {/* Balance Overview Tab */}
        {activeTab === "balance" && (
          <div className="row g-4">
            {/* Stats Cards */}
            <div className="col-md-4">
              <div className="card bg-dark border-secondary text-center p-3">
                <i className="fas fa-shopping-cart text-warning fa-2x mb-2"></i>
                <h5 className="text-white mb-1">Total Spent</h5>
                <h4 className="text-warning mb-0">{formatCurrency(0)}</h4>
                <small className="text-white-50">This month</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-dark border-secondary text-center p-3">
                <i className="fas fa-download text-info fa-2x mb-2"></i>
                <h5 className="text-white mb-1">Purchases</h5>
                <h4 className="text-info mb-0">0</h4>
                <small className="text-white-50">Total items</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-dark border-secondary text-center p-3">
                <i className="fas fa-calendar text-success fa-2x mb-2"></i>
                <h5 className="text-white mb-1">Member Since</h5>
                <h5 className="text-success mb-0">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </h5>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="col-12">
              <div className="card bg-dark border-secondary">
                <div className="card-body">
                  <h6 className="text-warning mb-3">Quick Actions</h6>
                  <div className="d-flex flex-wrap gap-3">
                    <Link to="/explore" className="btn btn-outline-warning rounded-pill">
                      <i className="fas fa-search me-2"></i>
                      Browse Photos
                    </Link>
                    <Link to="/purchases" className="btn btn-outline-info rounded-pill">
                      <i className="fas fa-history me-2"></i>
                      View Purchases
                    </Link>
                    <button
                      className="btn btn-outline-success rounded-pill"
                      onClick={() => setShowTopupModal(true)}
                    >
                      <i className="fas fa-plus-circle me-2"></i>
                      Top Up
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === "transactions" && (
          <div className="card bg-dark border-secondary">
            <div className="card-body p-0">
              {wallet.transactions?.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-receipt fa-4x text-white-50 mb-3"></i>
                  <h6 className="text-white-50">No transactions yet</h6>
                  <p className="text-white-50 small">Top up your wallet to see transactions here</p>
                  <button
                    className="btn btn-warning btn-sm rounded-pill mt-2"
                    onClick={() => setShowTopupModal(true)}
                  >
                    Top Up Now
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-dark table-hover mb-0">
                    <thead className="border-secondary">
                      <tr>
                        <th className="border-secondary">Date</th>
                        <th className="border-secondary">Type</th>
                        <th className="border-secondary">Description</th>
                        <th className="border-secondary text-end">Amount</th>
                        <th className="border-secondary text-end">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wallet.transactions.map((tx, idx) => (
                        <tr key={idx}>
                          <td className="border-secondary small">{formatDate(tx.date)}</td>
                          <td className="border-secondary">
                            <span className={`badge ${tx.type === "credit" ? "bg-success" : "bg-danger"}`}>
                              {tx.type === "credit" ? "Credit" : "Debit"}
                            </span>
                          </td>
                          <td className="border-secondary small">{tx.description || "Transaction"}</td>
                          <td className="border-secondary text-end fw-bold">
                            <span className={tx.type === "credit" ? "text-success" : "text-danger"}>
                              {tx.type === "credit" ? "+" : "-"} {formatCurrency(tx.amount)}
                            </span>
                          </td>
                          <td className="border-secondary text-end">
                            <span className="badge bg-success">Completed</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Topup Modal */}
      {showTopupModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border-warning">
              <div className="modal-header border-warning">
                <h5 className="modal-title text-warning">
                  <i className="fas fa-plus-circle me-2"></i>
                  Top Up Wallet
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowTopupModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label text-white">Amount (KES)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary text-warning">KES</span>
                    <input
                      type="number"
                      className="form-control bg-dark text-white border-secondary"
                      placeholder="Enter amount"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      min="10"
                      step="10"
                    />
                  </div>
                  <small className="text-white-50">Minimum topup: KES 10</small>
                </div>

                <div className="mb-4">
                  <label className="form-label text-white">M-Pesa Phone Number</label>
                  <input
                    type="tel"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="254712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <small className="text-white-50">Format: 254XXXXXXXXX (no spaces)</small>
                </div>

                <div className="bg-dark p-3 rounded mb-3" style={{ background: "rgba(255,193,7,0.1)" }}>
                  <p className="text-warning small mb-0">
                    <i className="fas fa-info-circle me-2"></i>
                    You will receive an M-Pesa STK push to complete the payment.
                  </p>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-warning flex-grow-1"
                    onClick={handleTopup}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-arrow-right me-2"></i>
                        Proceed to Payment
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setShowTopupModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;