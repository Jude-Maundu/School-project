import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import PhotographerLayout from "./PhotographerLayout";
import { API_BASE_URL, API_ENDPOINTS } from "../../../api/apiConfig";
import { getAuthHeaders, getCurrentUserId } from "../../../utils/auth";

const PhotographerEarnings = () => {
  const [earnings, setEarnings] = useState({
    total: 0,
    pending: 0,
    withdrawn: 0,
    available: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const photographerId = getCurrentUserId();
  const headers = getAuthHeaders();

  const fetchEarnings = useCallback(async () => {
    if (!photographerId) {
      console.warn("Photographer ID missing; cannot fetch earnings.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const summaryRes = await axios.get(API_ENDPOINTS.PAYMENTS.EARNINGS_SUMMARY(photographerId), { headers });
      const transactionsRes = await axios.get(API_ENDPOINTS.PAYMENTS.TRANSACTIONS(photographerId), { headers });

      setEarnings({
        total: summaryRes.data?.total || 0,
        pending: summaryRes.data?.pending || 0,
        withdrawn: summaryRes.data?.withdrawn || 0,
        available: summaryRes.data?.available || 0,
      });

      setTransactions(transactionsRes.data || []);
      
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  }, [photographerId, headers]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const handleWithdraw = () => {
    if (earnings.available < 1000) {
      alert("Minimum withdrawal amount is KES 1,000");
      return;
    }
    alert("Withdrawal request submitted successfully!");
  };

  return (
    <PhotographerLayout>
      <h4 className="fw-bold mb-4">
        <i className="fas fa-dollar-sign me-2 text-warning"></i>
        My Earnings
      </h4>

      {/* Earnings Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card bg-dark border-warning">
            <div className="card-body text-center">
              <small className="text-white-50">Total Earnings</small>
              <h3 className="text-warning fw-bold">KES {earnings.total.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-dark border-info">
            <div className="card-body text-center">
              <small className="text-white-50">Available</small>
              <h3 className="text-info fw-bold">KES {earnings.available.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-dark border-warning">
            <div className="card-body text-center">
              <small className="text-white-50">Pending</small>
              <h3 className="text-warning fw-bold">KES {earnings.pending.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-dark border-success">
            <div className="card-body text-center">
              <small className="text-white-50">Withdrawn</small>
              <h3 className="text-success fw-bold">KES {earnings.withdrawn.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Button */}
      <div className="card bg-dark border-secondary mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h6>Available for Withdrawal: <span className="text-warning">KES {earnings.available.toLocaleString()}</span></h6>
              <p className="text-white-50 small mb-md-0">Minimum withdrawal: KES 1,000</p>
            </div>
            <div className="col-md-4 text-end">
              <button
                className="btn btn-warning px-4"
                onClick={handleWithdraw}
                disabled={earnings.available < 1000}
              >
                <i className="fas fa-money-bill-wave me-2"></i>
                Withdraw Funds
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card bg-dark border-secondary">
        <div className="card-header bg-transparent border-secondary">
          <h6 className="mb-0 text-warning">
            <i className="fas fa-history me-2"></i>
            Transaction History
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
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="pe-3">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => (
                    <tr key={idx}>
                      <td className="ps-3">
                        <small>{new Date(t.createdAt).toLocaleDateString()}</small>
                      </td>
                      <td>{t.description || "Media Sale"}</td>
                      <td>
                        <span className="badge bg-success">KES {t.amount}</span>
                      </td>
                      <td>
                        <span className={`badge bg-${t.status === 'completed' ? 'success' : 'warning'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="pe-3">
                        <span className="badge bg-info">Sale</span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-white-50 py-4">
                        No transactions yet
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

export default PhotographerEarnings;