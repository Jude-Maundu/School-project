import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PhotographerLayout from "./PhotographerLayout";
import { API_BASE_URL, API_ENDPOINTS } from "../../../api/apiConfig";
import { getAuthHeaders, getCurrentUserId } from "../../../utils/auth";

const API = API_BASE_URL;

const PhotographerWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({
    amount: "",
    method: "mpesa",
    phone: "",
    accountName: "",
    accountNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const photographerId = getCurrentUserId();
  const headers = getAuthHeaders();

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch withdrawals
      const withdrawalsRes = await axios.get(`${API}/withdrawals/my`, { headers });
      setWithdrawals(withdrawalsRes.data || []);
      
      // Fetch available balance from earnings
      const earningsRes = await axios.get(API_ENDPOINTS.PAYMENTS.EARNINGS_SUMMARY(photographerId), { headers });
      setAvailableBalance(earningsRes.data?.available || 0);
      
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  }, [photographerId, headers, API]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleRequest = async (e) => {
    e.preventDefault();
    
    if (!requestData.amount || Number(requestData.amount) < 1000) {
      alert("Minimum withdrawal amount is KES 1,000");
      return;
    }

    if (Number(requestData.amount) > availableBalance) {
      alert("Insufficient available balance");
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        amount: Number(requestData.amount),
        method: requestData.method,
        phoneNumber: requestData.method === 'mpesa' ? requestData.phone : undefined,
        accountName: requestData.method === 'bank' ? requestData.accountName : undefined,
        accountNumber: requestData.method === 'bank' ? requestData.accountNumber : undefined,
      };

      await axios.post(`${API}/withdrawals/request`, payload, { headers });
      
      alert("Withdrawal request submitted successfully!");
      setShowRequestForm(false);
      setRequestData({
        amount: "",
        method: "mpesa",
        phone: "",
        accountName: "",
        accountNumber: "",
      });
      
      // Refresh data
      fetchWithdrawals();
      
    } catch (error) {
      console.error("Error submitting withdrawal request:", error);
      alert(error.response?.data?.message || "Failed to submit withdrawal request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PhotographerLayout>
      <h4 className="fw-bold mb-4">
        <i className="fas fa-money-bill-wave me-2 text-warning"></i>
        Withdrawals
      </h4>

      {/* Balance Card */}
      <div className="card bg-dark border-warning mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <small className="text-white-50">Available Balance</small>
              <h2 className="text-warning fw-bold">KES {availableBalance.toLocaleString()}</h2>
              <p className="text-white-50 small mb-md-0">Minimum withdrawal: KES 1,000</p>
            </div>
            <div className="col-md-6 text-end">
              <button
                className="btn btn-warning px-4"
                onClick={() => setShowRequestForm(true)}
                disabled={availableBalance < 1000}
              >
                <i className="fas fa-plus-circle me-2"></i>
                Request Withdrawal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="modal-dialog">
            <div className="modal-content bg-dark border-warning">
              <div className="modal-header border-warning">
                <h5 className="modal-title text-warning">Request Withdrawal</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowRequestForm(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleRequest}>
                  <div className="mb-3">
                    <label className="form-label text-white-50">Amount (KES)</label>
                    <input
                      type="number"
                      className="form-control bg-dark text-white border-secondary"
                      value={requestData.amount}
                      onChange={(e) => setRequestData({...requestData, amount: e.target.value})}
                      required
                      min="1000"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-white-50">Withdrawal Method</label>
                    <select
                      className="form-select bg-dark text-white border-secondary"
                      value={requestData.method}
                      onChange={(e) => setRequestData({...requestData, method: e.target.value})}
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>

                  {requestData.method === "mpesa" ? (
                    <div className="mb-3">
                      <label className="form-label text-white-50">M-Pesa Phone Number</label>
                      <input
                        type="tel"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="254712345678"
                        value={requestData.phone}
                        onChange={(e) => setRequestData({...requestData, phone: e.target.value})}
                        required
                      />
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <label className="form-label text-white-50">Account Name</label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          value={requestData.accountName}
                          onChange={(e) => setRequestData({...requestData, accountName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label text-white-50">Account Number</label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          value={requestData.accountNumber}
                          onChange={(e) => setRequestData({...requestData, accountNumber: e.target.value})}
                          required
                        />
                      </div>
                    </>
                  )}

                  <button type="submit" className="btn btn-warning w-100" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawals History */}
      <div className="card bg-dark border-secondary">
        <div className="card-header bg-transparent border-secondary">
          <h6 className="mb-0 text-warning">
            <i className="fas fa-history me-2"></i>
            Withdrawal History
          </h6>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-warning"></div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th className="ps-3">Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Details</th>
                    <th className="pe-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w._id}>
                      <td className="ps-3">
                        <small>{new Date(w.createdAt).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <span className="badge bg-warning text-dark">KES {w.amount.toLocaleString()}</span>
                      </td>
                      <td>
                        <span className={`badge bg-${w.method === 'mpesa' ? 'success' : 'info'}`}>
                          {w.method.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <small className="text-white-50">
                          {w.method === 'mpesa' ? w.phoneNumber : `${w.accountName} - ${w.accountNumber}`}
                        </small>
                      </td>
                      <td className="pe-3">
                        <span className={`badge bg-${
                          w.status === 'completed' ? 'success' : 
                          w.status === 'pending' ? 'warning' : 
                          w.status === 'processing' ? 'info' : 'danger'
                        }`}>
                          {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-white-50 py-4">
                        No withdrawal requests yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PhotographerLayout>
  );
};

export default PhotographerWithdrawals;