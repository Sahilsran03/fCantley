import React from "react";
import { Link } from "react-router-dom";
import { getMediaUrl } from "../utils/media.js";
import CodAdvancePayment from "../components/CodAdvancePayment.jsx";
import "./OrderDetails.css";

const hasAmount = (value) => (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value)) && Number(value) >= 0;
const money = (value) => hasAmount(value) ? `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Not available";
const dateLabel = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not available";
};
const paymentLabel = (order) => {
  const { paymentMethod: method, paymentStatus: status } = order;
  if (status === "Paid") return method === "ONLINE" ? "Paid Online" : method === "WALLET" ? "Paid with Wallet" : "Paid";
  if (order.orderStatus === "Cancelled") return status === "AdvancePaid" ? "Advance Paid" : status || "Not available";
  if (method === "COD" && status === "Pending") return "Pay on Delivery";
  if (method === "COD" && status === "AdvancePaid") return `Advance Paid${hasAmount(order.remainingCodDue) ? ` · Remaining COD ${money(order.remainingCodDue)}` : ""}`;
  return status === "AdvancePaid" ? "Advance Paid" : status || "Not available";
};

export default function OrderDetailsStorefront({ order, error, onRetry, canCancel, canReturn, loadOrder }) {
  if (!order) return (
    <section className="cantley-order" aria-labelledby="order-state-title">
      <div className="cantley-order-state" role={error ? "alert" : "status"}>
        {!error ? <span className="cantley-order-loader" aria-hidden="true" /> : null}
        <p className="cantley-order-eyebrow">Cantley · Your order</p>
        <h1 id="order-state-title">{error ? "We couldn’t load your order" : "Loading your order"}</h1>
        <p>{error || "Gathering the details of your pieces."}</p>
        {error ? <button className="cantley-order-button" type="button" onClick={onRetry}>Retry</button> : null}
      </div>
    </section>
  );
  const address = order.shippingAddress;
  const items = Array.isArray(order.items) ? order.items : [];
  const discount = hasAmount(order.discountAmount) ? order.discountAmount : order.discount;
  return (
    <section className="cantley-order" aria-labelledby="cantley-order-title">
      <header className="cantley-order-heading">
        <p className="cantley-order-eyebrow">Your Cantley wardrobe</p>
        <h1 id="cantley-order-title">Order details</h1>
        <div className="cantley-order-meta">
          <div><span>Order number</span><strong>{order.orderNumber || "Not available"}</strong></div>
          <div><span>Order date</span><strong>{dateLabel(order.createdAt)}</strong></div>
          <div><span>Order status</span><strong className="cantley-order-status">{order.orderStatus || "Not available"}</strong></div>
        </div>
      </header>
      <div className="cantley-order-layout">
        <div className="cantley-order-main">
          <section className="cantley-order-panel" aria-labelledby="order-pieces-title">
            <h2 id="order-pieces-title">Your pieces</h2>
            {items.length ? items.map((item, index) => {
              const image = getMediaUrl(item.image);
              return (
                <article className="cantley-order-item" key={`${item.product}-${index}`}>
                  <div className="cantley-order-image"><span aria-hidden="true">C.</span>{image ? <img src={image} alt={item.name || "Ordered product"} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}</div>
                  <div className="cantley-order-item-copy">
                    <h3>{item.name || "Ordered product"}</h3>
                    <dl className="cantley-order-options">
                      {[["Size", item.size], ["Color", item.color], ["Finish", item.finish], ["SKU", item.sku]].filter(([, value]) => typeof value === "string" && value.trim()).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                      {hasAmount(item.quantity) ? <div><dt>Quantity</dt><dd>{item.quantity}</dd></div> : null}
                    </dl>
                  </div>
                  <div className="cantley-order-item-price"><span>Item price</span><strong>{money(item.finalPrice)}</strong></div>
                </article>
              );
            }) : <p className="cantley-order-muted">Item details are not available.</p>}
          </section>
          <section className="cantley-order-panel" aria-labelledby="order-address-title">
            <h2 id="order-address-title">Delivery address</h2>
            {address ? <address className="cantley-order-address">
              {address.fullName ? <strong>{address.fullName}</strong> : null}
              {[address.addressLine1, address.addressLine2, [address.city, address.state, address.postalCode].filter(Boolean).join(", "), address.phone, address.email].filter(Boolean).map((line, index) => <p key={index}>{line}</p>)}
            </address> : <p className="cantley-order-muted">Delivery address is not available.</p>}
          </section>
          {order.courierName || order.trackingNumber || order.estimatedDeliveryDate ? <section className="cantley-order-panel" aria-labelledby="order-tracking-title">
            <h2 id="order-tracking-title">Delivery details</h2>
            <dl className="cantley-order-facts">
              {order.courierName ? <div><dt>Courier</dt><dd>{order.courierName}</dd></div> : null}
              {order.trackingNumber ? <div><dt>Tracking number</dt><dd>{order.trackingNumber}</dd></div> : null}
              {order.estimatedDeliveryDate ? <div><dt>Estimated delivery</dt><dd>{dateLabel(order.estimatedDeliveryDate)}</dd></div> : null}
            </dl>
          </section> : null}
        </div>
        <aside className="cantley-order-sidebar" aria-label="Order summary and actions">
          <section className="cantley-order-panel cantley-order-summary">
            <h2>Order summary</h2>
            <dl className="cantley-order-totals">
              <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
              {hasAmount(order.shippingFee) ? <div><dt>Shipping</dt><dd>{money(order.shippingFee)}</dd></div> : null}
              {hasAmount(discount) ? <div><dt>Discount</dt><dd>−{money(discount)}</dd></div> : null}
              <div className="cantley-order-grand-total"><dt>Total</dt><dd>{money(order.totalAmount)}</dd></div>
            </dl>
            {order.appliedCoupon?.code ? <p className="cantley-order-note">Coupon: {order.appliedCoupon.code}{hasAmount(order.appliedCoupon.discountAmount) ? ` · ${money(order.appliedCoupon.discountAmount)} off` : ""}</p> : null}
            {order.appliedOffers?.length ? <ul className="cantley-order-offers">{order.appliedOffers.map((offer, index) => offer.title ? <li key={index}>{offer.title}</li> : null)}</ul> : null}
            <dl className="cantley-order-facts cantley-order-payment">
              <div><dt>Payment method</dt><dd>{{ ONLINE: "Online", WALLET: "Wallet", COD: "COD" }[order.paymentMethod] || "Not available"}</dd></div>
              <div><dt>Payment status</dt><dd>{paymentLabel(order)}</dd></div>
            </dl>
            <CodAdvancePayment order={order} onVerified={loadOrder} onRefresh={loadOrder} />
          </section>
          {canCancel || canReturn ? <section className="cantley-order-panel cantley-order-actions" aria-label="Manage order">
            <h2>Manage order</h2>
            {canCancel ? <Link className="cantley-order-button cantley-order-button-secondary" to={`/returns/new?orderId=${order._id}&type=CANCEL`}>Cancel Order</Link> : null}
            {canReturn ? <Link className="cantley-order-button cantley-order-button-secondary" to={`/returns/new?orderId=${order._id}&type=RETURN`}>Request Return</Link> : null}
          </section> : null}
        </aside>
      </div>
    </section>
  );
}
