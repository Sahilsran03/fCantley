import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";
import CodAdvancePayment from "../components/CodAdvancePayment.jsx";
import "./Checkout.css";

const formatInr = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const itemOptionLabels = {
  size: "Size",
  color: "Color",
  material: "Material",
  printType: "Print type",
  finish: "Finish",
  shape: "Shape"
};

const OrderSuccess = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigationOrder = location.state?.order || null;
  const [order, setOrder] = useState(navigationOrder);
  const [hasAuthoritativeOrder, setHasAuthoritativeOrder] = useState(false);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshLockRef = useRef(false);

  const loadOrder = useCallback(() => {
    if (refreshLockRef.current) return Promise.resolve(false);
    refreshLockRef.current = true;
    setIsRefreshing(true);
    setError("");
    return api.get(`/orders/${id}`)
      .then((response) => {
        setOrder(response.data.order);
        setHasAuthoritativeOrder(true);
        return true;
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Unable to refresh this order.");
        return false;
      })
      .finally(() => {
        refreshLockRef.current = false;
        setIsRefreshing(false);
      });
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const confirmedOrder = hasAuthoritativeOrder ? order : null;
  const address = confirmedOrder?.shippingAddress;
  const discount = Number(confirmedOrder?.discountAmount || confirmedOrder?.discount || 0);

  return (
    <main className="order-success-page">
      <header className="order-success-hero">
        <p className="eyebrow">{navigationOrder || confirmedOrder ? "Order confirmed" : "Order"}</p>
        <h1>{navigationOrder || confirmedOrder ? "Your order has been placed" : "Loading order confirmation"}</h1>
        <p className="order-success-reference">
          Order <strong>{navigationOrder?.orderNumber || confirmedOrder?.orderNumber || id}</strong>
        </p>
        <p>We have received your order. Payment and delivery progress are shown separately below.</p>
      </header>

      {!hasAuthoritativeOrder && isRefreshing ? (
        <section className="order-success-loading" aria-busy="true">
          <div aria-hidden="true"><span /><span /><span /></div>
          <p role="status">Loading the latest order details...</p>
        </section>
      ) : null}

      {error ? (
        <section className="order-success-fetch-error" aria-labelledby="order-load-error-heading">
          <h2 id="order-load-error-heading">We couldn't load the latest order details</h2>
          <div className="form-alert" role="alert">{error}</div>
          <button className="secondary-button" type="button" onClick={loadOrder} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Try again"}
          </button>
        </section>
      ) : null}

      {confirmedOrder ? (
        <div className="order-success-content">
          <section className="order-success-section" aria-labelledby="success-status-heading">
            <header>
              <p className="eyebrow">Order status</p>
              <h2 id="success-status-heading">{confirmedOrder.orderStatus}</h2>
            </header>
            <p>Order reference: <strong>{confirmedOrder.orderNumber}</strong></p>
          </section>

          <section className="order-success-section order-success-payment" aria-labelledby="success-payment-heading">
            <header>
              <p className="eyebrow">Payment</p>
              <h2 id="success-payment-heading">
                {confirmedOrder.orderStatus === "Cancelled"
                  ? "Order cancelled"
                  : confirmedOrder.paymentMethod === "WALLET"
                    ? confirmedOrder.paymentStatus === "Paid" ? "Payment complete" : "Wallet payment not confirmed"
                    : confirmedOrder.paymentMethod === "ONLINE"
                    ? confirmedOrder.paymentStatus === "Paid" ? "Payment complete" : "Online payment pending"
                    : confirmedOrder.paymentStatus === "Paid"
                    ? "Fully paid"
                    : confirmedOrder.paymentStatus === "AdvancePaid"
                      ? "Advance paid"
                      : Number(confirmedOrder.onlineAdvanceRequired || 0) > 0
                        ? "Advance payment pending"
                        : "Pay on delivery"}
              </h2>
            </header>
            {confirmedOrder.paymentMethod === "WALLET" ? (
              <div className="info-panel">
                {confirmedOrder.paymentStatus === "Paid" ? (
                  <p>Paid with Cantley Wallet: {formatInr(confirmedOrder.totalAmount)}</p>
                ) : <p role="alert">Wallet payment has not been confirmed. Please contact Cantley.</p>}
                {confirmedOrder.orderStatus === "Cancelled" ? (
                  <p>{confirmedOrder.refundStatus === "Refunded" ? "Wallet amount restored. Nothing due on delivery." : "This order is cancelled. Nothing due on delivery. Wallet restoration is not confirmed."}</p>
                ) : confirmedOrder.paymentStatus === "Paid" ? <p>Nothing due on delivery.</p> : null}
              </div>
            ) : confirmedOrder.paymentMethod === "COD" ? <CodAdvancePayment order={confirmedOrder} onVerified={loadOrder} onRefresh={loadOrder} /> : (
              <div className="info-panel">
                <p>Paid online: {formatInr(confirmedOrder.onlineAmountPaid)}</p>
                {confirmedOrder.paymentStatus === "Paid" && confirmedOrder.orderStatus !== "Cancelled"
                  ? <p>Payment complete. Nothing due on delivery.</p>
                  : <p>{confirmedOrder.orderStatus === "Cancelled" ? "This order is cancelled." : "Online payment has not been confirmed. Check the latest order status before paying."}</p>}
              </div>
            )}
            {confirmedOrder.paymentStatus !== "Paid" && confirmedOrder.orderStatus !== "Cancelled" ? (
              <button className="secondary-button order-refresh-button" type="button" onClick={loadOrder} disabled={isRefreshing}>
                {isRefreshing ? "Refreshing payment status..." : "Refresh payment status"}
              </button>
            ) : null}
          </section>

          <section className="order-success-section" aria-labelledby="success-delivery-heading">
            <header>
              <p className="eyebrow">Delivery</p>
              <h2 id="success-delivery-heading">Delivery information</h2>
            </header>
            {address ? (
              <address className="order-success-address">
                <strong>{address.fullName}</strong>
                <span>{address.phone}</span>
                <span>{address.addressLine1}</span>
                {address.addressLine2 ? <span>{address.addressLine2}</span> : null}
                <span>{address.city}, {address.state} {address.postalCode}</span>
                <span>{address.country}</span>
              </address>
            ) : null}
            {confirmedOrder.estimatedDeliveryDate ? (
              <p>Estimated delivery: <strong>{formatDate(confirmedOrder.estimatedDeliveryDate)}</strong></p>
            ) : null}
            {confirmedOrder.trackingNumber ? <p>Tracking number: <strong>{confirmedOrder.trackingNumber}</strong></p> : null}
            {confirmedOrder.courierName ? <p>Courier: <strong>{confirmedOrder.courierName}</strong></p> : null}
          </section>

          <section className="order-success-section" aria-labelledby="success-summary-heading">
            <header>
              <p className="eyebrow">Order summary</p>
              <h2 id="success-summary-heading">{confirmedOrder.items.length} item{confirmedOrder.items.length === 1 ? "" : "s"}</h2>
            </header>
            <div className="order-success-items">
              {confirmedOrder.items.map((item, index) => {
                const options = Object.entries(itemOptionLabels)
                  .map(([key, label]) => item[key] ? `${label}: ${item[key]}` : "")
                  .filter(Boolean);
                return (
                  <article className="order-success-item" key={`${item.product || item.name}-${index}`}>
                    <img
                      src={getMediaUrl(item.image) || "https://placehold.co/96x96/f1f5f9/334155?text=Cantley"}
                      alt={item.name || "Ordered product"}
                    />
                    <div>
                      <h3>{item.name}</h3>
                      {options.length ? <p>{options.join(" · ")}</p> : null}
                      {item.variantSku ? <p>SKU: {item.variantSku}</p> : null}
                      <p>Quantity: {item.quantity}</p>
                    </div>
                    <strong>{formatInr(item.finalPrice)} each</strong>
                  </article>
                );
              })}
            </div>
            <dl className="order-success-financials">
              <div><dt>Subtotal</dt><dd>{formatInr(confirmedOrder.subtotal)}</dd></div>
              {discount > 0 ? <div><dt>Discount</dt><dd>− {formatInr(discount)}</dd></div> : null}
              <div><dt>Shipping</dt><dd>{formatInr(confirmedOrder.shippingFee)}</dd></div>
              <div className="order-success-total"><dt>Total</dt><dd>{formatInr(confirmedOrder.totalAmount)}</dd></div>
            </dl>
          </section>

          <nav className="order-success-actions" aria-label="Order actions">
            <Link className="button-link" to={`/orders/${id}`}>View order</Link>
            <Link className="secondary-button" to="/orders">View my orders</Link>
            <Link className="text-link" to="/shop">Continue shopping</Link>
          </nav>
        </div>
      ) : null}
    </main>
  );
};

export default OrderSuccess;