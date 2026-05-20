import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import api from "../services/api.js";

const AdminReturns = () => {
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({ status: "", type: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    api
      .get("/admin/returns", { params: filters })
      .then((response) => {
        setRequests(response.data.requests || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load requests."))
      .finally(() => setIsLoading(false));
  }, [filters]);

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Return Requests</h1>
      </div>
      <div className="filter-bar">
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
          <option value="">All statuses</option>
          {["Pending", "Approved", "Rejected", "Completed"].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
          <option value="">All types</option>
          {["CANCEL", "RETURN", "REFUND"].map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
      {isLoading ? <div className="analytics-skeleton">Loading return requests...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}
      {!isLoading && !requests.length && !error ? (
        <div className="empty-state">
          <h2>No return requests</h2>
          <p>Customer cancellation, return, and refund requests will appear here.</p>
        </div>
      ) : (
        <div className="admin-table">
          {requests.map((request) => (
            <div className="admin-row return-admin-row" key={request._id}>
              <div>
                <strong>{request.type} - {request.order?.orderNumber || "Order"}</strong>
                <span>{request.user?.email || request.order?.shippingAddress?.email}</span>
              </div>
              <span className={`status-badge status-${request.status.toLowerCase()}`}>{request.status}</span>
              <span>{request.refundStatus}</span>
              <Link to={`/admin/returns/${request._id}`}>Manage</Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminReturns;
