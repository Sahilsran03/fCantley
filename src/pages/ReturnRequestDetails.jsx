import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api.js";
import "./Returns.css";

const hasAmount = (value) => (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value)) && Number(value) >= 0;
const money = (value) => `₹${Number(value).toLocaleString("en-IN")}`;
const dateText = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : null;
};
const ReturnRequestDetails = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const load = useCallback(() => {
    setIsLoading(true); setError("");
    return api.get(`/returns/${id}`).then((response) => setRequest(response.data.request))
      .catch((e) => setError(e.response?.data?.message || "Unable to load request."))
      .finally(() => setIsLoading(false));
  }, [id]);
  useEffect(() => { load(); }, [load]);
  if (isLoading || error || !request) return <section className="cantley-returns"><div className="returns-state" role={error ? "alert" : "status"}><h1>{isLoading ? "Loading request..." : "Unable to load request"}</h1>{error ? <p>{error}</p> : null}{!isLoading ? <button className="secondary-button" type="button" onClick={load}>Retry</button> : null}</div></section>;
  return <section className="cantley-returns">
    <header className="page-heading row-heading"><div><p className="eyebrow">Returns &amp; Refunds</p><h1>Request details</h1><p>{request.type}{request.order?.orderNumber ? ` · ${request.order.orderNumber}` : ""}{request.order?.orderStatus ? ` · ${request.order.orderStatus}` : ""}</p></div><Link className="button-link" to="/returns">All requests</Link></header>
    <div className="returns-layout">
      <div className="returns-panel"><h2>Your request</h2><dl className="returns-facts">
        <div><dt>Request ID</dt><dd>{request._id}</dd></div>
        {dateText(request.createdAt) ? <div><dt>Requested</dt><dd>{dateText(request.createdAt)}</dd></div> : null}
        {request.status ? <div><dt>Status</dt><dd><span className="returns-status">{request.status}</span></dd></div> : null}
        {request.reason ? <div><dt>Reason</dt><dd className="returns-copy">{request.reason}</dd></div> : null}
        {request.reasonCategory ? <div><dt>Category</dt><dd>{request.reasonCategory}</dd></div> : null}
        {request.selectedItemSnapshot?.name ? <div><dt>Item</dt><dd>{request.selectedItemSnapshot.name}</dd></div> : null}
        {request.requestedQuantity != null ? <div><dt>Requested quantity</dt><dd>{request.requestedQuantity}</dd></div> : null}
        {request.order?.paymentMethod ? <div><dt>Payment method</dt><dd>{request.order.paymentMethod}</dd></div> : null}
        {request.order?.paymentStatus ? <div><dt>Payment status</dt><dd>{request.order.paymentStatus}</dd></div> : null}
        {hasAmount(request.order?.totalAmount) ? <div><dt>Order total</dt><dd>{money(request.order.totalAmount)}</dd></div> : null}
      </dl>
      <h2 className="returns-subheading">Proof images</h2>{request.proofImages?.length ? <div className="returns-proof">{request.proofImages.map((image, index) => <a href={image.url} key={image.publicId || index} rel="noreferrer" target="_blank"><img alt={image.originalName || `Request proof ${index + 1}`} src={image.url} /></a>)}</div> : <p className="returns-meta">No proof images uploaded.</p>}</div>
      <aside className="returns-panel returns-refund"><h2>Refund updates</h2><dl className="returns-facts">
        {request.refundStatus ? <div><dt>Refund status</dt><dd>{request.refundStatus}</dd></div> : null}
        {hasAmount(request.approvedRefundAmount) ? <div><dt>Approved refund</dt><dd>{money(request.approvedRefundAmount)}</dd></div> : hasAmount(request.refundAmount) ? <div><dt>Legacy refund amount</dt><dd>{money(request.refundAmount)}</dd></div> : null}
        {hasAmount(request.completedRefundAmount) ? <div><dt>Refunded</dt><dd>{money(request.completedRefundAmount)}</dd></div> : null}
        {hasAmount(request.remainingRefundAmount) ? <div><dt>Remaining refund</dt><dd>{money(request.remainingRefundAmount)}</dd></div> : null}
      </dl>
      {request.refundTransactions?.map((transaction, index) => <div className="returns-transaction" key={transaction._id || index}>{transaction.method ? <p>Refund method: {transaction.method}</p> : null}{hasAmount(transaction.amount) ? <p>{money(transaction.amount)}</p> : null}{dateText(transaction.processedAt) ? <p>{dateText(transaction.processedAt)}</p> : null}</div>)}
      {request.adminNote ? <div className="returns-transaction"><h2>Note from Cantley</h2><p className="returns-copy">{request.adminNote}</p></div> : null}</aside>
    </div>
  </section>;
};
export default ReturnRequestDetails;
