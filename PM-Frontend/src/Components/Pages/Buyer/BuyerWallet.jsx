import React, { useState, useEffect, useCallback } from "react";
import BuyerLayout from "./BuyerLayout";
import axios from "axios";
import { API_BASE_URL } from "../../../api/apiConfig";
import {
  getLocalWalletBalance,
  setLocalWalletBalance,
  getLocalWalletTransactions,
  addLocalWalletTransaction,
  isApiAvailable,
  disableApi,
} from "../../../utils/localStore";

const API = API_BASE_URL;

const BuyerWallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(null);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id || user._id;
  
  // ✅ FIXED: Define headers properly
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  // Fetch wallet balance and transactions
  const fetchWalletData = useCallback(async () => {
    const feature = "wallet";

    try {
      setLoading(true);
      setError(null);

      if (!isApiAvailable(feature)) {
        setBalance(getLocalWalletBalance());
        setTransactions(getLocalWalletTransactions());
        setLoading(false);
        return;
      }

      // Fetch wallet balance
      try {
        const balanceRes = await axios.get(`${API}/payments/wallet/${userId}`, { headers, timeout: 10000 });
        let balanceValue = 0;
        if (typeof balanceRes.data === 'number') {
          balanceValue = balanceRes.data;
        } else if (balanceRes.data?.balance !== undefined) {
          balanceValue = balanceRes.data.balance;
        } else if (balanceRes.data?.amount !== undefined) {
          balanceValue = balanceRes.data.amount;
        } else if (balanceRes.data?.data && typeof balanceRes.data.data === 'number') {
          balanceValue = balanceRes.data.data;
        }
        setBalance(balanceValue || 0);
        console.log("✅ Wallet balance:", balanceValue);
        setLocalWalletBalance(balanceValue || 0);
      } catch (balanceErr) {
        console.error("Error fetching balance:", balanceErr);
        setBalance(getLocalWalletBalance());
      }

      // Fetch wallet transactions
      try {
        // Try multiple possible endpoints
        let transactionData = [];
        
        // Try the transaction endpoint first
        try {
          const transactionsRes = await axios.get(`${API}/payments/transactions/${userId}`, { headers, timeout: 10000 });
          if (Array.isArray(transactionsRes.data)) {
            transactionData = transactionsRes.data;
          } else if (transactionsRes.data?.transactions && Array.isArray(transactionsRes.data.transactions)) {
            transactionData = transactionsRes.data.transactions;
          } else if (transactionsRes.data?.items && Array.isArray(transactionsRes.data.items)) {
            transactionData = transactionsRes.data.items;
          } else if (transactionsRes.data?.data && Array.isArray(transactionsRes.data.data)) {
            transactionData = transactionsRes.data.data;
          }
          console.log("✅ Transactions from /transactions:", transactionData.length);
        } catch (err) {
          console.log("Transactions endpoint failed, trying purchase history...");
          
          // Try purchase history endpoint as fallback
          try {
            const purchaseRes = await axios.get(`${API}/payments/purchase-history/${userId}`, { headers, timeout: 10000 });
            if (Array.isArray(purchaseRes.data)) {
              transactionData = purchaseRes.data.map(p => ({
                _id: p.paymentId || p._id,
                amount: p.amount,
                type: "debit",
                description: `Purchase: ${p.title || "Media"}`,
                createdAt: p.date || p.createdAt,
                status: p.status || "completed"
              }));
            }
            console.log("✅ Transactions from purchase-history:", transactionData.length);
          } catch (purchaseErr) {
            console.log("Purchase history endpoint also failed");
          }
        }
        
        // If still no transactions, use local storage
        if (transactionData.length === 0) {
          const localTransactions = getLocalWalletTransactions();
          if (localTransactions && localTransactions.length > 0) {
            transactionData = localTransactions;
            console.log("📦 Using local transactions:", transactionData.length);
          }
        }

        // Normalize transactions to consistent fields
        transactionData = transactionData.map((tx, index) => ({
          id: tx.id || tx._id || tx.reference || `tx_${index}`,
          type: tx.type || (Number(tx.amount) >= 0 ? 'credit' : 'debit'),
          amount: Number(tx.amount) || 0,
          description: tx.description || tx.note || tx.details || 'Wallet transaction',
          createdAt: tx.date || tx.createdAt || tx.timestamp || new Date().toISOString(),
          status: tx.status || 'completed',
        }));
        
        setTransactions(transactionData);
        
      } catch (err) {
        console.error("Error fetching transactions:", err);
        const localTransactions = getLocalWalletTransactions();
        setTransactions(localTransactions || []);
      }
      
    } catch (err) {
      console.error("Error fetching wallet data:", err);
      const status = err.response?.status;
      if (status === 404 || status === 400) {
        disableApi(feature);
        setBalance(getLocalWalletBalance());
        setTransactions(getLocalWalletTransactions());
        setError("Using local wallet data (backend endpoints unavailable)");
      } else {
        setError("Failed to load wallet data");
      }
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^254\d{9}$/;
    if (!phone) {
      setError('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(phone)) {
      setError('Please enter a valid Kenyan phone number (254XXXXXXXXX)');
      return false;
    }
    setError('');
    return true;
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.startsWith('0')) {
      value = '254' + value.substring(1);
    } else if (value.length > 0 && !value.startsWith('254')) {
      value = '254' + value;
    }
    setPhone(value);
    if (value.length >= 12) {
      validatePhoneNumber(value);
    } else {
      setError('');
    }
  };

  const handleMpesaPayment = async () => {
    if (!amount || Number(amount) < 10) {
      setError("Please enter a valid amount (minimum KES 10)");
      return;
    }
    if (!validatePhoneNumber(phone)) {
      return;
    }

    const feature = "mpesa";
    if (!isApiAvailable(feature)) {
      await handleMockPayment();
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      const res = await axios.post(`${API}/payments/mpesa`, {
        buyerId: userId,
        buyerPhone: phone,
        amount: parseFloat(amount),
        walletTopup: true,
      }, { headers });

      if (res.data.success) {
        setSuccessMessage("STK Push sent to your phone. Please enter your PIN to complete payment.");
        
        // Poll for payment completion
        const paymentId = res.data.payment?._id;
        if (paymentId) {
          const checkPayment = setInterval(async () => {
            try {
              const statusRes = await axios.get(`${API}/payments/${paymentId}`, { headers });
              if (statusRes.data?.status === 'completed') {
                clearInterval(checkPayment);
                await fetchWalletData();
                setShowAddFunds(false);
                setAmount("");
                setPhone("");
                setSelectedAmount(null);
                setSuccessMessage(`KES ${amount} added to wallet successfully!`);
                setTimeout(() => setSuccessMessage(null), 5000);
              }
            } catch (err) {
              console.log("Checking payment status...");
            }
          }, 3000);
          
          setTimeout(() => {
            clearInterval(checkPayment);
            fetchWalletData();
          }, 60000);
        } else {
          setTimeout(() => {
            fetchWalletData();
            setShowAddFunds(false);
            setAmount("");
            setPhone("");
            setSelectedAmount(null);
            setSuccessMessage(null);
          }, 10000);
        }
      }
    } catch (err) {
      console.error("M-Pesa error:", err.response?.data || err.message);
      const status = err.response?.status;
      if (status === 404 || status === 400) {
        disableApi(feature);
        await handleMockPayment();
      } else {
        setError(err.response?.data?.message || "M-Pesa payment failed");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleMockPayment = async () => {
    if (!amount || amount < 10) {
      setError("Please enter a valid amount (minimum KES 10)");
      return;
    }

    const added = parseFloat(amount);
    const newBalance = getLocalWalletBalance() + added;
    setLocalWalletBalance(newBalance);
    
    // Add transaction to local storage
    const newTransaction = {
      _id: `tx_${Date.now()}`,
      amount: added,
      type: "credit",
      description: `Wallet top-up of KES ${added}`,
      createdAt: new Date().toISOString(),
      status: "completed"
    };
    addLocalWalletTransaction(newTransaction);
    
    // Update state
    setBalance(newBalance);
    setTransactions(prev => [newTransaction, ...prev]);
    setSuccessMessage(`KES ${amount} added to wallet successfully!`);
    
    setTimeout(() => {
      setShowAddFunds(false);
      setAmount("");
      setPhone("");
      setSelectedAmount(null);
      setSuccessMessage(null);
    }, 3000);
  };

  const handleQuickAmount = (value) => {
    setSelectedAmount(value);
    setAmount(value.toString());
  };

  useEffect(() => {
    if (!token || !userId) {
      setError("Please login to view wallet");
      return;
    }
    fetchWalletData();
  }, [fetchWalletData, token, userId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <BuyerLayout>
      <div className="text-white" style={{ minHeight: '100vh' }}>
        <div className="mb-4">
          <h2 className="fw-bold mb-2">
            <i className="fas fa-wallet me-2 text-warning"></i>
            My Wallet
          </h2>
          <p className="text-white-50">Manage your funds and view transaction history</p>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert" style={{ borderRadius: '12px' }}>
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show mb-4" role="alert" style={{ borderRadius: '12px' }}>
            <i className="fas fa-check-circle me-2"></i>
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-white-50">Loading your wallet data...</p>
          </div>
        ) : (
          <div className="row g-4">
            {/* Balance Card */}
            <div className="col-12 col-lg-5">
              <div 
                className="card border-0 h-100"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,193,7,0.15) 0%, rgba(255,193,7,0.05) 100%)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,193,7,0.3)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <div className="card-body p-4">
                  <div className="text-center mb-4">
                    <div className="mb-3">
                      <i className="fas fa-wallet fa-3x text-warning"></i>
                    </div>
                    <h6 className="text-white-50 mb-2">Available Balance</h6>
                    <h1 className="display-4 fw-bold text-warning mb-0">
                      KES {balance.toLocaleString()}
                    </h1>
                    <div className="mt-2">
                      <span className="badge bg-success bg-opacity-25 text-success px-3 py-2 rounded-pill">
                        <i className="fas fa-check-circle me-1"></i> Active
                      </span>
                    </div>
                  </div>

                  {!showAddFunds ? (
                    <button
                      className="btn btn-warning w-100 py-3 rounded-pill fw-bold"
                      onClick={() => setShowAddFunds(true)}
                      style={{ fontSize: '1.1rem', transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <i className="fas fa-plus-circle me-2"></i>
                      Add Funds to Wallet
                    </button>
                  ) : (
                    <div className="mt-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">Add Funds</h6>
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-pill"
                          onClick={() => {
                            setShowAddFunds(false);
                            setAmount("");
                            setPhone("");
                            setSelectedAmount(null);
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-white-50 small">Quick Amount</label>
                        <div className="d-flex flex-wrap gap-2">
                          {quickAmounts.map((amt) => (
                            <button
                              key={amt}
                              onClick={() => handleQuickAmount(amt)}
                              className={`btn rounded-pill px-3 py-2 ${
                                selectedAmount === amt
                                  ? 'btn-warning text-dark'
                                  : 'btn-outline-warning'
                              }`}
                              style={{ transition: 'all 0.2s ease' }}
                            >
                              KES {amt.toLocaleString()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-white-50 small">Amount (KES)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-dark border-secondary text-warning">KES</span>
                          <input
                            type="number"
                            className="form-control bg-dark border-secondary text-white"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => {
                              setAmount(e.target.value);
                              setSelectedAmount(null);
                            }}
                            min="10"
                            step="10"
                          />
                        </div>
                        <small className="text-white-50">Minimum: KES 10</small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-white-50 small">M-Pesa Phone Number</label>
                        <div className="input-group">
                          <span className="input-group-text bg-dark border-secondary">
                            <i className="fas fa-phone text-warning"></i>
                          </span>
                          <input
                            type="tel"
                            className="form-control bg-dark border-secondary text-white"
                            placeholder="254712345678"
                            value={phone}
                            onChange={handlePhoneChange}
                          />
                        </div>
                        <small className="text-white-50">Format: 254XXXXXXXXX</small>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-success flex-grow-1 py-2 rounded-pill"
                          onClick={handleMpesaPayment}
                          disabled={processing}
                        >
                          {processing ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Processing...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-mobile-alt me-2"></i>
                              Pay with M-Pesa
                            </>
                          )}
                        </button>
                        <button
                          className="btn btn-outline-warning flex-grow-1 py-2 rounded-pill"
                          onClick={handleMockPayment}
                          disabled={processing}
                        >
                          <i className="fas fa-credit-card me-2"></i>
                          Mock Payment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transactions Section */}
            <div className="col-12 col-lg-7">
              <div 
                className="card border-0 h-100"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div className="card-header bg-transparent border-secondary p-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="fw-bold mb-1">
                        <i className="fas fa-history me-2 text-warning"></i>
                        Transaction History
                      </h5>
                      <small className="text-white-50">Your recent wallet activities</small>
                    </div>
                    <span className="badge bg-warning text-dark rounded-pill px-3 py-2">
                      {transactions.length} {transactions.length === 1 ? 'Transaction' : 'Transactions'}
                    </span>
                  </div>
                </div>
                
                <div className="card-body p-0">
                  {transactions.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-receipt fa-3x text-white-50 mb-3"></i>
                      <h6 className="text-white-50">No transactions yet</h6>
                      <p className="small text-white-50">Your transaction history will appear here</p>
                      <button 
                        className="btn btn-outline-warning btn-sm rounded-pill mt-2"
                        onClick={() => setShowAddFunds(true)}
                      >
                        Add Funds to Get Started
                      </button>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {transactions.slice(0, 10).map((tx, idx) => (
                        <div 
                          key={tx.id || tx._id || idx} 
                          className="list-group-item bg-transparent text-white border-secondary px-4 py-3"
                          style={{ transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-3">
                              <div 
                                className="rounded-circle p-2"
                                style={{
                                  background: tx.type === 'credit' 
                                    ? 'rgba(40, 167, 69, 0.1)' 
                                    : 'rgba(220, 53, 69, 0.1)',
                                  width: '40px',
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <i className={`fas ${tx.type === 'credit' ? 'fa-arrow-down text-success' : 'fa-arrow-up text-danger'} fa-lg`}></i>
                              </div>
                              <div>
                                <div className="fw-bold">
                                  {tx.description || tx.title || (tx.type === 'credit' ? 'Deposit' : 'Purchase')}
                                </div>
                                <small className="text-white-50">
                                  {formatDate(tx.createdAt || tx.date)}
                                </small>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className={`fw-bold ${tx.type === 'credit' ? 'text-success' : 'text-danger'}`}>
                                {tx.type === 'credit' ? '+' : '-'} KES {(tx.amount || tx.price).toLocaleString()}
                              </div>
                              <small className="text-white-50">
                                <span className={`badge ${tx.status === 'completed' ? 'bg-success' : 'bg-warning'} bg-opacity-25 rounded-pill px-2`}>
                                  {tx.status || "completed"}
                                </span>
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {transactions.length > 10 && (
                  <div className="card-footer bg-transparent border-secondary p-3 text-center">
                    <button className="btn btn-sm btn-outline-warning rounded-pill px-4">
                      View All {transactions.length} Transactions
                      <i className="fas fa-arrow-right ms-2"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Tips */}
        {!loading && (
          <div className="row mt-4">
            <div className="col-12">
              <div 
                className="p-3 rounded-3"
                style={{
                  background: 'rgba(255,193,7,0.05)',
                  border: '1px solid rgba(255,193,7,0.2)',
                  borderRadius: '12px'
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <i className="fas fa-lightbulb text-warning fa-lg"></i>
                  <div>
                    <small className="text-white-50 d-block">
                      <strong className="text-warning">Quick Tip:</strong> Add funds to your wallet to purchase photos instantly. 
                      M-Pesa payments are processed within seconds. All your purchases and deposits are shown here.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};

export default BuyerWallet;