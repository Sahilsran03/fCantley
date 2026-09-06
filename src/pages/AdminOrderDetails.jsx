import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";

const orderStatuses = [
  "Pending",
  "Design Review",
  "Approved",
  "Printing",
  "Quality Check",
  "Packing",
  "Shipped",
  "Delivered",
  "Cancelled"
];
const cancellableStatuses = ["Pending", "Design Review", "Approved"];
const activeStatuses = orderStatuses.filter((status) => status !== "Cancelled");
const AdminOrderDetails = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [shippingForm, setShippingForm] = useState({ trackingNumber: "", courierName: "", estimatedDeliveryDate: "", shippingNotes: "" });
  const [trackingNote, setTrackingNote] = useState("");
  const [error, setError] = useState("");
  const [isCollectingCod, setIsCollectingCod] = useState(false);

  const loadOrder = () => {
    api
      .get(`/admin/orders/${id}`)
      .then((response) => {
        setOrder(response.data.order);
        setShippingForm({
          trackingNumber: response.data.order.trackingNumber || "",
          courierName: response.data.order.courierName || "",
          estimatedDeliveryDate: response.data.order.estimatedDeliveryDate ? response.data.order.estimatedDeliveryDate.slice(0, 10) : "",
          shippingNotes: response.data.order.shippingNotes || ""
        });
        setError("");
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Unable to load order.");
      });
  };

  const updateShipping = async (event) => {
    event.preventDefault();
    const response = await api.put(`/admin/orders/${id}/shipping`, shippingForm);
    setOrder(response.data.order);
    showToast("Shipping details updated.");
  };

  const addTracking = async (event) => {
    event.preventDefault();
    try {
      const response = await api.put(`/admin/orders/${id}/tracking-update`, { message: trackingNote });
      setOrder(response.data.order);
      setTrackingNote("");
      showToast("Tracking note added.");
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to add tracking note.";
      setError(message);
      showToast(message, "error");
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const updateOrderStatus = async (orderStatus) => {
    if (!orderStatus) return;
    if (
      ["Delivered", "Cancelled"].includes(orderStatus) &&
      !window.confirm(
        orderStatus === "Delivered"
          ? "Mark this order Delivered? COD collection remains a separate action."
          : "Cancel this order? This stops fulfillment and restores inventory."
      )
    ) return;

    try {
      const response = await api.put(`/admin/orders/${id}/status`, { orderStatus });
      setOrder(response.data.order);
      showToast(response.data.changed === false ? "Order already has this status." : "Order status updated.");
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to update order status.";
      setError(message);
      showToast(message, "error");
    }
  };

  const currentRank = activeStatuses.indexOf(order?.orderStatus);
  const validNextStatuses = currentRank < 0
    ? []
    : [
        ...activeStatuses.slice(currentRank + 1),
        ...(cancellableStatuses.includes(order?.orderStatus) ? ["Cancelled"] : [])
      ];

  const collectCod = async () => {
    const amount = Number(order.remainingCodDue || 0);
    if (!window.confirm(`Confirm that Rs. ${amount.toLocaleString("en-IN")} COD was collected?`)) return;

    setIsCollectingCod(true);
    setError("");
    try {
      const response = await api.patch(`/admin/orders/${id}/cod-collection`, { amount });
      setOrder(response.data.order);
      showToast("COD collection recorded.");
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to record COD collection.";
      setError(message);
      showToast(message, "error");
      if (requestError.response?.status === 409) loadOrder();
    } finally {
      setIsCollectingCod(false);
    }
  };

  const canCollectCod =
    order?.paymentMethod === "COD" &&
    order?.orderStatus === "Delivered" &&
    Number(order?.remainingCodDue || 0) > 0 &&
    Number(order?.onlineAmountPaid || 0) >= Number(order?.onlineAdvanceRequired || 0);

  if (error) {
    return (
      <section className="admin-page">
        <AdminNav />
        <div className="form-alert">{error}</div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="admin-page">
        <AdminNav />
        <p>Loading order...</p>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">Admin order</p>
        <h1>{order.orderNumber}</h1>
      </div>

      <div className="form-panel">
        <div className="form-grid">
          <label>
            Order status
            <select value="" onChange={(event) => updateOrderStatus(event.target.value)} disabled={!validNextStatuses.length}>
              <option value="">{validNextStatuses.length ? `Current: ${order.orderStatus}` : `${order.orderStatus} (terminal)`}</option>
              {validNextStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Payment status
            <input value={order.paymentStatus} readOnly />
          </label>
        </div>
      </div>

      <div className="checkout-layout">
        <form className="form-panel" onSubmit={updateShipping}>
          <h2>Shipping details</h2>
          <label>Courier<input value={shippingForm.courierName} onChange={(event) => setShippingForm((current) => ({ ...current, courierName: event.target.value }))} /></label>
          <label>Tracking number<input value={shippingForm.trackingNumber} onChange={(event) => setShippingForm((current) => ({ ...current, trackingNumber: event.target.value }))} /></label>
          <label>Estimated delivery<input type="date" value={shippingForm.estimatedDeliveryDate} onChange={(event) => setShippingForm((current) => ({ ...current, estimatedDeliveryDate: event.target.value }))} /></label>
          <label>Notes<textarea rows="3" value={shippingForm.shippingNotes} onChange={(event) => setShippingForm((current) => ({ ...current, shippingNotes: event.target.value }))} /></label>
          <button className="primary-button" type="submit">Save shipping</button>
        </form>
        <form className="form-panel" onSubmit={addTracking}>
          <h2>Add tracking note</h2>
          <p>Status: {order.orderStatus}</p>
          <label>Message<textarea rows="3" required value={trackingNote} onChange={(event) => setTrackingNote(event.target.value)} /></label>
          <button className="primary-button" type="submit">Add note</button>
        </form>
      </div>

      <div className="form-panel">
        <h2>Tracking history</h2>
        <div className="timeline">
          {(order.trackingHistory || []).map((item, index) => (
            <div className="timeline-item" key={`${item.status}-${item.timestamp}-${index}`}>
              <span />
              <div>
                <strong>{item.status}</strong>
                <p>{item.message || "Status updated"}</p>
                <small>{new Date(item.timestamp).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="checkout-layout">
        <div className="cart-items">
          {order.items.map((item, index) => (
            <article className="cart-item" key={`${item.product}-${index}`}>
              <div className="cart-item-image">
                <img src={getMediaUrl(item.image) || "https://placehold.co/220x220/f1f5f9/334155?text=Cantley"} alt={item.name} />
              </div>
              <div>
                <h2>{item.name}</h2>
                <p>
                  {item.size || "Custom"} / {item.color || "Any color"} / {item.finish || "Standard"}
                </p>
                <strong>Rs. {Number(item.finalPrice).toLocaleString("en-IN")}</strong>
              </div>
              <span>Qty {item.quantity}</span>
            </article>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Summary</h2>
          <p>Subtotal: Rs. {Number(order.subtotal).toLocaleString("en-IN")}</p>
          {order.appliedCoupon?.code ? (
            <p>Coupon {order.appliedCoupon.code}: Rs. {Number(order.appliedCoupon.discountAmount || 0).toLocaleString("en-IN")} off</p>
          ) : null}
          {order.appliedOffers?.length ? (
            <div className="discount-stack">
              {order.appliedOffers.map((offer, index) => (
                <span className="discount-badge" key={`${offer.title}-${index}`}>{offer.title}</span>
              ))}
            </div>
          ) : null}
          {order.discountAmount || order.discount ? <p>Discount: Rs. {Number(order.discountAmount || order.discount).toLocaleString("en-IN")}</p> : null}
          <p>Total: Rs. {Number(order.totalAmount).toLocaleString("en-IN")}</p>
          <div className="info-panel">
            <h3>COD financials</h3>
            <p>Order Total: Rs. {Number(order.totalAmount).toLocaleString("en-IN")}</p>
            <p>Online Advance Required: Rs. {Number(order.onlineAdvanceRequired || 0).toLocaleString("en-IN")}</p>
            <p>Online Amount Paid: Rs. {Number(order.onlineAmountPaid || 0).toLocaleString("en-IN")}</p>
            <p>Remaining COD Due: Rs. {Number(order.remainingCodDue || 0).toLocaleString("en-IN")}</p>
            <p>COD Amount Collected: Rs. {Number(order.codAmountCollected || 0).toLocaleString("en-IN")}</p>
            <p>Payment Status: {order.paymentStatus}</p>
            {canCollectCod ? (
              <button className="primary-button" type="button" onClick={collectCod} disabled={isCollectingCod}>
                {isCollectingCod
                  ? "Recording collection..."
                  : `Confirm COD Collection — Rs. ${Number(order.remainingCodDue).toLocaleString("en-IN")}`}
              </button>
            ) : null}
            {order.codCollectedAt ? (
              <p>
                Collected {new Date(order.codCollectedAt).toLocaleString()}
                {order.codCollectedBy ? ` by ${order.codCollectedBy.name || order.codCollectedBy.email || order.codCollectedBy}` : ""}
              </p>
            ) : null}
          </div>
          <p>Courier: {order.courierName || "Pending"}</p>
          <p>Tracking: {order.trackingNumber || "Pending"}</p>
          {order.estimatedDeliveryDate ? <p>ETA: {new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p> : null}
          <h2>Customer</h2>
          <p>{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.phone}</p>
          <p>{order.shippingAddress.email}</p>
          <p>
            {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state}
          </p>
        </aside>
      </div>
    </section>
  );
};

export default AdminOrderDetails;
