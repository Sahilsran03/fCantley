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
const paymentStatuses = ["Pending", "AdvancePaid", "Paid", "Failed"];

const AdminOrderDetails = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [shippingForm, setShippingForm] = useState({ trackingNumber: "", courierName: "", estimatedDeliveryDate: "", shippingNotes: "" });
  const [trackingForm, setTrackingForm] = useState({ status: "Shipped", message: "" });
  const [error, setError] = useState("");

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
    const response = await api.put(`/admin/orders/${id}/tracking-update`, trackingForm);
    setOrder(response.data.order);
    setTrackingForm({ status: "Shipped", message: "" });
    showToast("Tracking update added.");
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const updateOrderStatus = async (orderStatus) => {
    const response = await api.put(`/admin/orders/${id}/status`, { orderStatus });
    setOrder(response.data.order);
    showToast("Order status updated.");
  };

  const updatePaymentStatus = async (paymentStatus) => {
    const response = await api.put(`/admin/orders/${id}/payment-status`, { paymentStatus });
    setOrder(response.data.order);
    showToast("Payment status updated.");
  };

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
            <select value={order.orderStatus} onChange={(event) => updateOrderStatus(event.target.value)}>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Payment status
            <select value={order.paymentStatus} onChange={(event) => updatePaymentStatus(event.target.value)}>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
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
          <h2>Tracking update</h2>
          <label>Status<select value={trackingForm.status} onChange={(event) => setTrackingForm((current) => ({ ...current, status: event.target.value }))}>
            {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select></label>
          <label>Message<textarea rows="3" value={trackingForm.message} onChange={(event) => setTrackingForm((current) => ({ ...current, message: event.target.value }))} /></label>
          <button className="primary-button" type="submit">Add update</button>
        </form>
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
          <p>Advance: Rs. {Number(order.advanceAmount).toLocaleString("en-IN")}</p>
          <p>Remaining: Rs. {Number(order.remainingAmount).toLocaleString("en-IN")}</p>
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
