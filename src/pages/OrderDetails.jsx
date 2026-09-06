import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";
import CodAdvancePayment from "../components/CodAdvancePayment.jsx";
import OrderDetailsStorefront from "./OrderDetailsStorefront.jsx";

const OrderDetails = ({ admin = false }) => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const loadOrder = useCallback(() => {
    return api
      .get(admin ? `/admin/orders/${id}` : `/orders/${id}`)
      .then((response) => {
        setOrder(response.data.order);
        setError("");
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Unable to load order.");
      });
  }, [admin, id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (!admin && (error || !order)) return <OrderDetailsStorefront error={error} onRetry={() => { setError(""); return loadOrder(); }} />;
  if (error) return <div className="form-alert">{error}</div>;
  if (!order) return <p>Loading order...</p>;

  const canCancel = ["Pending", "Design Review", "Approved"].includes(order.orderStatus);
  const canReturn = order.orderStatus === "Delivered" && order.deliveredAt && Number(order.remainingCodDue || 0) === 0 && Number(order.onlineAmountPaid || 0) + Number(order.codAmountCollected || 0) >= Number(order.totalAmount || 0) && Date.now() <= new Date(order.deliveredAt).getTime() + 7 * 24 * 60 * 60 * 1000;

  if (!admin) return <OrderDetailsStorefront order={order} canCancel={canCancel} canReturn={canReturn} loadOrder={loadOrder} />;

  return (
    <section className="order-detail-page">
      <div className="page-heading">
        <p className="eyebrow">{admin ? "Admin order" : "Order"}</p>
        <h1>{order.orderNumber}</h1>
        <p>
          {order.orderStatus} | {order.paymentStatus}
        </p>
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
          <p>Shipping: Rs. {Number(order.shippingFee).toLocaleString("en-IN")}</p>
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
          {!admin ? <CodAdvancePayment order={order} onVerified={loadOrder} onRefresh={loadOrder} /> : null}
          <p>Courier: {order.courierName || "Pending"}</p>
          <p>Tracking: {order.trackingNumber || "Pending"}</p>
          {order.estimatedDeliveryDate ? <p>ETA: {new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p> : null}
          <strong>Total: Rs. {Number(order.totalAmount).toLocaleString("en-IN")}</strong>
          <div className="form-actions">
            {canCancel ? <Link className="secondary-button" to={`/returns/new?orderId=${order._id}&type=CANCEL`}>Cancel Order</Link> : null}
            {canReturn ? <Link className="secondary-button" to={`/returns/new?orderId=${order._id}&type=RETURN`}>Request Return</Link> : null}
          </div>
          <h2>Shipping</h2>
          <p>{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.phone}</p>
          <p>{order.shippingAddress.email}</p>
          <p>
            {order.shippingAddress.addressLine1}, {order.shippingAddress.addressLine2}
          </p>
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
          </p>
        </aside>
      </div>
    </section>
  );
};

export default OrderDetails;
