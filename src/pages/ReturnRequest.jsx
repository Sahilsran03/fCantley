import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const requestTypes = ["CANCEL", "RETURN", "REFUND"];
const maxFileSize = 40 * 1024 * 1024;
const cancellableStatuses = ["Pending", "Design Review", "Approved"];

const ReturnRequest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({
    order: searchParams.get("orderId") || "",
    orderItem: "",
    type: searchParams.get("type") || "RETURN",
    reason: ""
  });
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/orders/my-orders")
      .then((response) => {
        setOrders(response.data.orders || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load orders."))
      .finally(() => setIsLoading(false));
  }, []);

  const selectedOrder = useMemo(() => orders.find((order) => order._id === form.order), [form.order, orders]);
  const canCancelSelected = selectedOrder ? cancellableStatuses.includes(selectedOrder.orderStatus) : true;

  const updateFiles = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 5) {
      setError("Upload a maximum of 5 proof images.");
      return;
    }
    const oversized = selectedFiles.find((file) => file.size > maxFileSize);
    if (oversized) {
      setError("Each proof image must be 40MB or smaller.");
      return;
    }
    setFiles(selectedFiles);
    setError("");
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("order", form.order);
      formData.append("type", form.type);
      formData.append("reason", form.reason);
      if (form.orderItem) formData.append("orderItem", form.orderItem);
      files.forEach((file) => formData.append("proofImages", file));

      const response = await api.post("/returns", formData);
      showToast("Request submitted.");
      navigate(`/returns/${response.data.request._id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Returns</p>
          <h1>Return/Refund Request</h1>
          <p>Cancellation is available before Printing. Custom printed products can be returned after printing only for damaged or wrong items.</p>
        </div>
        <Link className="button-link" to="/returns">My requests</Link>
      </div>

      {isLoading ? <div className="analytics-skeleton">Loading eligible orders...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}

      <form className="form-panel wide-form" onSubmit={submitRequest}>
        <div className="form-grid">
          <label>
            Request type
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
              {requestTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label>
            Order
            <select value={form.order} required onChange={(event) => setForm((current) => ({ ...current, order: event.target.value, orderItem: "" }))}>
              <option value="">Select an order</option>
              {orders.map((order) => (
                <option key={order._id} value={order._id}>
                  {order.orderNumber} - {order.orderStatus}
                </option>
              ))}
            </select>
          </label>
        </div>

        {form.type === "CANCEL" && selectedOrder && !canCancelSelected ? (
          <div className="form-alert">This order cannot be cancelled because Printing has already started.</div>
        ) : null}

        {selectedOrder && form.type !== "CANCEL" ? (
          <label>
            Item (optional)
            <select value={form.orderItem} onChange={(event) => setForm((current) => ({ ...current, orderItem: event.target.value }))}>
              <option value="">Whole order</option>
              {selectedOrder.items.map((item, index) => (
                <option key={`${item.product}-${index}`} value={String(index)}>
                  {item.name} - Qty {item.quantity}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label>
          Reason
          <textarea
            rows="5"
            required
            value={form.reason}
            onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
            placeholder="Tell Cantley what happened."
          />
        </label>
        <label>
          Proof images
          <input accept="image/jpeg,image/png,image/webp" multiple type="file" onChange={updateFiles} />
        </label>
        {files.length ? <p className="form-footer">{files.length} proof image{files.length === 1 ? "" : "s"} selected.</p> : null}
        <button className="primary-button" disabled={isSubmitting || (form.type === "CANCEL" && selectedOrder && !canCancelSelected)} type="submit">
          {isSubmitting ? "Submitting..." : "Submit request"}
        </button>
      </form>
    </section>
  );
};

export default ReturnRequest;
