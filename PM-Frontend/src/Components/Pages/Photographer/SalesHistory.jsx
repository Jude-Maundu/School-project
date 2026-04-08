import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import PhotographerLayout from "./PhotographerLayout";
import { API_BASE_URL } from "../../../api/apiConfig";

const API = API_BASE_URL;

const PhotographerSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const photographerId = user?._id;

  const headers = { Authorization: `Bearer ${token}` };

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get photographer's transactions (sales)
      const transactionsRes = await axios.get(`${API}/payments/transactions/${photographerId}`, { headers });
      
      // Transform transactions to sales format
      const sales = (transactionsRes.data || []).map(transaction => ({
        _id: transaction.id || transaction._id,
        receiptNumber: `REC-${(transaction.id || transaction._id)?.substring(0, 8)}`,
        user: { email: transaction.description?.split(' for ')[0]?.replace('Earnings from ', '') || 'Unknown' },
        items: [{ title: transaction.description?.split(' for ')[1] || 'Media' }],
        amount: transaction.amount,
        createdAt: transaction.date || transaction.createdAt,
        status: transaction.status || 'completed'
      }));

      setSales(sales);
      
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  }, [photographerId, headers, API]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const filteredSales = sales.filter(s => {
    if (filter === "all") return true;
    if (filter === "today") {
      const today = new Date().toDateString();
      return new Date(s.createdAt).toDateString() === today;
    }
    if (filter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(s.createdAt) >= weekAgo;
    }
    return true;
  });

  const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.amount || 0), 0);

  return (
    <PhotographerLayout>
      <h4 className="fw-bold mb-4">
        <i className="fas fa-chart-line me-2 text-warning"></i>
        Sales History
      </h4>

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card bg-dark border-warning">
            <div className="card-body">
              <small className="text-white-50">Total Sales</small>
              <h4 className="text-warning fw-bold">{filteredSales.length}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-dark border-success">
            <div className="card-body">
              <small className="text-white-50">Revenue</small>
              <h4 className="text-success fw-bold">KES {totalRevenue.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-dark border-info">
            <div className="card-body">
              <small className="text-white-50">Average Sale</small>
              <h4 className="text-info fw-bold">
                KES {filteredSales.length ? (totalRevenue / filteredSales.length).toFixed(0) : 0}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <div className="btn-group">
          <button
            className={`btn ${filter === "all" ? "btn-warning" : "btn-outline-warning"}`}
            onClick={() => setFilter("all")}
          >
            All Time
          </button>
          <button
            className={`btn ${filter === "today" ? "btn-warning" : "btn-outline-warning"}`}
            onClick={() => setFilter("today")}
          >
            Today
          </button>
          <button
            className={`btn ${filter === "week" ? "btn-warning" : "btn-outline-warning"}`}
            onClick={() => setFilter("week")}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card bg-dark border-secondary">
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
                    <th className="ps-3">Receipt #</th>
                    <th>Buyer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th className="pe-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale._id}>
                      <td className="ps-3">
                        <small className="fw-bold">{sale.receiptNumber || `REC-${sale._id?.substring(0, 8)}`}</small>
                      </td>
                      <td>
                        <i className="fas fa-user-circle text-warning me-2"></i>
                        {sale.user?.email || "Anonymous"}
                      </td>
                      <td>{sale.items?.length || 1} item(s)</td>
                      <td>
                        <span className="badge bg-success">KES {sale.amount}</span>
                      </td>
                      <td>
                        <small>{new Date(sale.createdAt).toLocaleString()}</small>
                      </td>
                      <td className="pe-3">
                        <span className="badge bg-success">Completed</span>
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-white-50 py-4">
                        No sales found
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

export default PhotographerSales;