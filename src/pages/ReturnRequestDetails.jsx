import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api.js";

const timelineSteps = ["Pending", "Approved", "Completed"];

const ReturnRequestDetails = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/returns/${id}`)
      .then((response) => {
        setRequest(response.data.request);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load request."));
  }, [id]);

  if (error) return <div className="form-alert">{error}</div>;
  if (!request) return <div className="analytics-skeleton">Loading request...</div>;

  const steps = request.status === "Rejected" ? ["Pending", "Rejected"] : timelineSteps;
  const activeIndex = steps.indexOf(request.status);

  return (
    <section className="admin-page">
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Returns</p>
          <h1>{request.type} Request</h1>
          <p>{request.order?.orderNumber} - {request.order?.orderStatus}</p>
        </div>
        <Link className="button-link" to="/returns">All requests</Link>
      </div>

      <div className="checkout-layout">
        <div className="form-panel">
          <h2>Status timeline</h2>
          <div className="timeline">
            {steps.map((step, index) => (
              <div className={`timeline-item ${index <= activeIndex ? "active" : ""}`} key={step}>
                <span />
                <div>
                  <strong>{step}</strong>
                  <p>{index <= activeIndex ? "Updated by Cantley" : "Waiting"}</p>
                </div>
              </div>
            ))}
          </div>
          <p><strong>Refund status:</strong> {request.refundStatus}</p>
          {request.refundAmount ? <p><strong>Refund amount:</strong> Rs. {Number(request.refundAmount).toLocaleString("en-IN")}</p> : null}
          {request.adminNote ? <p><strong>Admin note:</strong> {request.adminNote}</p> : null}
        </div>

        <aside className="cart-summary">
          <h2>Request details</h2>
          <p><strong>Status:</strong> {request.status}</p>
          <p><strong>Reason:</strong> {request.reason}</p>
          <p><strong>Payment:</strong> {request.order?.paymentMethod || "COD"} / {request.order?.paymentStatus || "Pending"}</p>
          <p><strong>Total:</strong> Rs. {Number(request.order?.totalAmount || 0).toLocaleString("en-IN")}</p>
          {request.proofImages?.length ? (
            <div className="proof-grid">
              {request.proofImages.map((image) => (
                <a href={image.url} key={image.publicId} rel="noreferrer" target="_blank">
                  <img alt={image.originalName || "Proof"} src={image.url} />
                </a>
              ))}
            </div>
          ) : <p>No proof images uploaded.</p>}
        </aside>
      </div>
    </section>
  );
};

export default ReturnRequestDetails;
