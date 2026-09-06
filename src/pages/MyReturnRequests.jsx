import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import "./Returns.css";

const MyReturnRequests = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setIsLoading(true); setError("");
    return api.get("/returns/my-requests").then((response) => setRequests(response.data.requests || []))
      .catch((e) => setError(e.response?.data?.message || "Unable to load requests."))
      .finally(() => setIsLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  return <section className="cantley-returns">
    <header className="page-heading row-heading"><div><p className="eyebrow">Your Cantley requests</p><h1>Returns &amp; Refunds</h1><p>Your return, cancellation, and refund updates.</p></div><Link className="button-link" to="/returns/new">New request</Link></header>
    {isLoading ? <div className="returns-state" role="status">Loading requests...</div> : error ? <div className="returns-state" role="alert"><h2>Unable to load requests</h2><p>{error}</p><button className="secondary-button" onClick={load} type="button">Retry</button></div> : !requests.length ? <div className="returns-state"><h2>No return requests</h2><p>Your requests will appear here.</p><Link className="button-link" to="/returns/new">Create request</Link></div> : <div className="returns-list">{requests.map((request) => {
      const date = request.createdAt ? new Date(request.createdAt) : null;
      return <article className="returns-row" key={request._id}>
        <div><p className="returns-meta">{request.type}</p><h2>{request.order?.orderNumber || request._id}</h2><p className="returns-meta">Request {request._id}</p>{date && !Number.isNaN(date.getTime()) ? <time dateTime={date.toISOString()}>{date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time> : null}{request.selectedItemSnapshot?.name ? <p>{request.selectedItemSnapshot.name}</p> : null}{request.requestedQuantity != null ? <p>Quantity: {request.requestedQuantity}</p> : null}</div>
        <div className="returns-row-status">{request.status ? <p><span className="returns-label">Request status</span><strong className="returns-status">{request.status}</strong></p> : null}{request.refundStatus ? <p><span className="returns-label">Refund status</span>{request.refundStatus}</p> : null}</div>
        <Link className="secondary-button" to={`/returns/${request._id}`} aria-label={`View request ${request._id}`}>View request</Link>
      </article>;
    })}</div>}
  </section>;
};
export default MyReturnRequests;
