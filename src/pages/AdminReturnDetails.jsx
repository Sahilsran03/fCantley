import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const statuses = ["Pending", "Approved", "Rejected", "Completed"];
const refundStatuses = ["NotRequired", "Pending", "Processed", "Failed"];

const AdminReturnDetails = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [request, setRequest] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: "Pending", adminNote: "", refundAmount: "", refundStatus: "NotRequired" });
  const [refundForm, setRefundForm] = useState({ refundStatus: "NotRequired", refundAmount: "", adminNote: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadRequest = () => {
    api
      .get(`/admin/returns/${id}`)
      .then((response) => {
        const data = response.data.request;
        setRequest(data);
        setStatusForm({
          status: data.status,
          adminNote: data.adminNote || "",
          refundAmount: data.refundAmount || "",
          refundStatus: data.refundStatus
        });
        setRefundForm({
          refundStatus: data.refundStatus,
          refundAmount: data.refundAmount || "",
          adminNote: data.adminNote || ""
        });
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load request."));
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  const updateStatus = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await api.put(`/admin/returns/${id}/status`, statusForm);
      setRequest(response.data.request);
      showToast("Request status updated.");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update request.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateRefund = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await api.put(`/admin/returns/${id}/refund-status`, refundForm);
      setRequest(response.data.request);
      showToast("Refund status updated.");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update refund status.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!request && !error) {
    return (
      <section className="admin-page">
        <AdminNav />
        <div className="analytics-skeleton">Loading request...</div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <AdminNav />
      {error ? <div className="form-alert">{error}</div> : null}
      {request ? (
        <>
          <div className="page-heading row-heading">
            <div>
              <p className="eyebrow">Admin returns</p>
              <h1>{request.type} Request</h1>
              <p>{request.order?.orderNumber} - {request.order?.orderStatus}</p>
            </div>
            <Link className="button-link" to="/admin/returns">Back to returns</Link>
          </div>

          <div className="checkout-layout">
            <div className="form-panel">
              <h2>Request</h2>
              <p><strong>Customer:</strong> {request.user?.name || "Customer"} ({request.user?.email || request.order?.shippingAddress?.email})</p>
              <p><strong>Status:</strong> {request.status}</p>
              <p><strong>Refund status:</strong> {request.refundStatus}</p>
              <p><strong>Reason:</strong> {request.reason}</p>
              <p><strong>Order total:</strong> Rs. {Number(request.order?.totalAmount || 0).toLocaleString("en-IN")}</p>
              <p><strong>Payment:</strong> {request.order?.paymentMethod || "COD"} / {request.order?.paymentStatus || "Pending"}</p>
              {request.proofImages?.length ? (
                <div className="proof-grid">
                  {request.proofImages.map((image) => (
                    <a href={image.url} key={image.publicId} rel="noreferrer" target="_blank">
                      <img alt={image.originalName || "Proof"} src={image.url} />
                    </a>
                  ))}
                </div>
              ) : <p>No proof images uploaded.</p>}
            </div>

            <aside className="cart-summary">
              <form className="quote-admin-form" onSubmit={updateStatus}>
                <h2>Approve or reject</h2>
                <label>
                  Status
                  <select value={statusForm.status} onChange={(event) => setStatusForm((current) => ({ ...current, status: event.target.value }))}>
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label>
                  Refund amount
                  <input min="0" type="number" value={statusForm.refundAmount} onChange={(event) => setStatusForm((current) => ({ ...current, refundAmount: event.target.value }))} />
                </label>
                <label>
                  Refund status
                  <select value={statusForm.refundStatus} onChange={(event) => setStatusForm((current) => ({ ...current, refundStatus: event.target.value }))}>
                    {refundStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label>
                  Admin note
                  <textarea rows="4" value={statusForm.adminNote} onChange={(event) => setStatusForm((current) => ({ ...current, adminNote: event.target.value }))} />
                </label>
                <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save decision"}</button>
              </form>

              <form className="quote-admin-form" onSubmit={updateRefund}>
                <h2>Manual refund tracking</h2>
                <label>
                  Refund status
                  <select value={refundForm.refundStatus} onChange={(event) => setRefundForm((current) => ({ ...current, refundStatus: event.target.value }))}>
                    {refundStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label>
                  Refund amount
                  <input min="0" type="number" value={refundForm.refundAmount} onChange={(event) => setRefundForm((current) => ({ ...current, refundAmount: event.target.value }))} />
                </label>
                <label>
                  Admin note
                  <textarea rows="3" value={refundForm.adminNote} onChange={(event) => setRefundForm((current) => ({ ...current, adminNote: event.target.value }))} />
                </label>
                <button className="secondary-button" disabled={isSaving} type="submit">Update refund</button>
              </form>
            </aside>
          </div>
        </>
      ) : null}
    </section>
  );
};

export default AdminReturnDetails;
