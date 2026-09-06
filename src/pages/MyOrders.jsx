import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";
import "./MyOrders.css";

const hasAmount = (value) => (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value)) && Number(value) >= 0;
const money = (value) => hasAmount(value) ? `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Not available";
const paymentLabel = (order) => {
  const { paymentMethod: method, paymentStatus: status } = order;
  if (status === "Paid") return method === "ONLINE" ? "Paid Online" : method === "WALLET" ? "Paid with Wallet" : "Paid";
  if (order.orderStatus === "Cancelled") return status === "AdvancePaid" ? "Advance Paid" : status || "Not available";
  if (method === "COD" && status === "Pending") return "Pay on Delivery";
  if (method === "COD" && status === "AdvancePaid") return `Advance Paid${hasAmount(order.remainingCodDue) ? ` · Remaining COD ${money(order.remainingCodDue)}` : ""}`;
  return status === "AdvancePaid" ? "Advance Paid" : status || "Not available";
};
const orderDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date unavailable";
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const loadOrders = useCallback(() => {
    setIsLoading(true);
    setError("");
    return api.get("/orders/my-orders")
      .then((response) => {
        setOrders(response.data.orders);
        setError("");
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Unable to load orders.");
      })
      .finally(() => setIsLoading(false));
  }, []);
  useEffect(() => { loadOrders(); }, [loadOrders]);
  const canCancel = (order) => ["Pending", "Design Review", "Approved"].includes(order.orderStatus);

  return (
    <section className="my-orders" aria-labelledby="my-orders-title">
      <header className="my-orders-heading">
        <p className="my-orders-eyebrow">Your Cantley wardrobe</p>
        <h1 id="my-orders-title">My Orders</h1>
        <p>Your pieces, all in one place.</p>
      </header>
      {isLoading ? (
        <div className="my-orders-state" role="status" aria-live="polite">
          <span className="my-orders-loading" aria-hidden="true" />
          <h2>Loading your orders</h2><p>Gathering your order details.</p>
        </div>
      ) : error ? (
        <div className="my-orders-state" role="alert">
          <h2>We couldn’t load your orders</h2><p>{error}</p>
          <button className="my-orders-button" type="button" onClick={loadOrders}>Retry</button>
        </div>
      ) : !orders.length ? (
        <div className="my-orders-state">
          <span className="my-orders-empty-mark" aria-hidden="true">C.</span>
          <h2>Your wardrobe starts here</h2><p>No orders yet. Find your next everyday favourite.</p>
          <Link className="my-orders-button" to="/shop">Explore the collection</Link>
        </div>
      ) : (
        <div className="my-orders-list">
          <p className="my-orders-count">{orders.length} {orders.length === 1 ? "order" : "orders"}</p>
          {orders.map((order) => {
            const items = Array.isArray(order.items) ? order.items : [];
            const first = items[0];
            const image = getMediaUrl(first?.image);
            const quantitiesKnown = items.length > 0 && items.every((item) => hasAmount(item.quantity));
            const count = quantitiesKnown ? items.reduce((sum, item) => sum + Number(item.quantity), 0) : null;
            return (
              <article className="my-orders-card" key={order._id} aria-label={`Order ${order.orderNumber || "details"}`}>
                <div className="my-orders-card-heading">
                  <div><p className="my-orders-label">Order number</p><h2>{order.orderNumber || "Not available"}</h2><p className="my-orders-date">{orderDate(order.createdAt)}</p></div>
                  <span className="my-orders-status">{order.orderStatus || "Status unavailable"}</span>
                </div>
                <div className="my-orders-card-body">
                  <div className="my-orders-product">
                    <div className="my-orders-image">
                      <span aria-hidden="true">C.</span>
                      {image ? <img src={image} alt={first?.name || "Ordered product"} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
                    </div>
                    <div><h3>{first?.name || "Order items"}</h3><p>{count === null ? "Item count unavailable" : `${count} ${count === 1 ? "item" : "items"}`}{items.length > 1 ? ` · ${items.length} products` : ""}</p></div>
                  </div>
                  <dl className="my-orders-payment">
                    <div><dt>Payment method</dt><dd>{{ ONLINE: "Online", WALLET: "Wallet", COD: "COD" }[order.paymentMethod] || "Not available"}</dd></div>
                    <div><dt>Payment status</dt><dd>{paymentLabel(order)}</dd></div>
                  </dl>
                  <div className="my-orders-total"><p className="my-orders-label">Order total</p><strong>{money(order.totalAmount)}</strong></div>
                </div>
                <footer className="my-orders-actions">
                  <div className="my-orders-secondary">
                    <Link to={`/orders/${order._id}/tracking`} aria-label={`Track order ${order.orderNumber || ""}`}>Track Order</Link>
                    {canCancel(order) ? <Link to={`/returns/new?orderId=${order._id}&type=CANCEL`} aria-label={`Cancel order ${order.orderNumber || ""}`}>Cancel</Link> : null}
                  </div>
                  <Link className="my-orders-button" to={`/orders/${order._id}`} aria-label={`View order ${order.orderNumber || ""}`}>View Order <span aria-hidden="true">↗</span></Link>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MyOrders;
