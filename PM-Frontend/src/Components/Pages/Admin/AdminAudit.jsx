import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getAdminPurchaseAudit } from "../../../api/API";

const AdminAudit = () => {
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBuyer, setFilterBuyer] = useState("");
  const [filterPhotographer, setFilterPhotographer] = useState("");

  const fetchAudit = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminPurchaseAudit();
      setAudit(res.data?.audit || []);
    } catch (err) {
      console.error("Error fetching audit data", err);
      setError(err.response?.data?.message || "Failed to fetch audit data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const filtered = audit.filter((row) => {
    const buyerMatch = !filterBuyer || row.buyer?.email?.includes(filterBuyer) || row.buyer?._id?.includes(filterBuyer);
    const photographerMatch = !filterPhotographer || row.photographer?.email?.includes(filterPhotographer) || row.photographer?._id?.includes(filterPhotographer);
    return buyerMatch && photographerMatch;
  });

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold">
          <i className="fas fa-search-dollar me-2 text-warning"></i>
          Purchase Audit
        </h4>
        <button
          className="btn btn-outline-warning"
          onClick={fetchAudit}
          disabled={loading}
        >
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <input
            className="form-control bg-dark border-secondary text-white"
            placeholder="Filter by buyer email / ID"
            value={filterBuyer}
            onChange={(e) => setFilterBuyer(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <input
            className="form-control bg-dark border-secondary text-white"
            placeholder="Filter by photographer email / ID"
            value={filterPhotographer}
            onChange={(e) => setFilterPhotographer(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-file-invoice-dollar fa-4x text-white-50 mb-3"></i>
          <h5 className="mb-3">No audit entries found</h5>
          <p className="text-white-50">Try adjusting the filters or refresh the data.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-dark table-striped table-hover align-middle">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Photographer</th>
                <th>Media</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.paymentId || row._id || Math.random()}>
                  <td>
                    <div className="fw-bold text-white">{row.buyer?.email || row.buyer?._id || "-"}</div>
                    <div className="text-white-50 small">{row.buyer?.username || ""}</div>
                  </td>
                  <td>
                    <div className="fw-bold text-white">{row.photographer?.email || row.photographer?._id || "-"}</div>
                    <div className="text-white-50 small">{row.photographer?.username || ""}</div>
                  </td>
                  <td>
                    <div className="fw-bold text-white">{row.media?.title || row.media?.name || "-"}</div>
                    <div className="text-white-50 small">{row.media?._id || ""}</div>
                  </td>
                  <td className="text-warning">KES {row.amount ?? row.price ?? "-"}</td>
                  <td className="text-white-50" style={{ minWidth: "140px" }}>
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
                  </td>
                  <td>
                    {row.downloadUrl ? (
                      <a
                        href={row.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-warning"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-white-50 small">No link</span>
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

export default AdminAudit;
