import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

const MyReturnRequests = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/returns/my-requests")
      .then((response) => {
        setRequests(response.data.requests || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load requests."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="admin-page">
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Returns</p>
          <h1>My Return Requests</h1>
          <p>Track cancellations, returns, and manual refund updates from Cantley.</p>
        </div>
        <Link className="button-link" to="/returns/new">New request</Link>
      </div>
      {isLoading ? <div className="analytics-skeleton">Loading requests...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}
      {!isLoading && !requests.length && !error ? (
        <div className="empty-state">
          <h2>No requests yet</h2>
          <p>Your return, cancellation, and refund requests will appear here.</p>
          <Link className="button-link" to="/returns/new">Create request</Link>
        </div>
      ) : (
        <div className="admin-table">
          {requests.map((request) => (
            <div className="admin-row return-admin-row" key={request._id}>
              <div>
                <strong>{request.type} - {request.order?.orderNumber || "Order"}</strong>
                <span>{new Date(request.createdAt).toLocaleString()}</span>
              </div>
              <span className={`status-badge status-${request.status.toLowerCase()}`}>{request.status}</span>
              <span>{request.refundStatus}</span>
              <Link to={`/returns/${request._id}`}>View</Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MyReturnRequests;
