import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/orders/my-orders")
      .then((response) => {
        setOrders(response.data.orders);
        setError("");
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Unable to load orders.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <p>Loading orders...</p>;

  const canCancel = (order) => ["Pending", "Design Review", "Approved"].includes(order.orderStatus);

  return (
    <section className="admin-page">
      <div className="page-heading">
        <p className="eyebrow">Orders</p>
        <h1>My Orders</h1>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      {!orders.length && !error ? (
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p>Your Cantley orders will appear here.</p>
          <Link className="button-link" to="/shop">
            Shop products
          </Link>
        </div>
      ) : (
        <div className="admin-table">
          {orders.map((order) => (
            <div className="admin-row product-admin-row" key={order._id}>
              <div>
                <strong>{order.orderNumber}</strong>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <span>{order.orderStatus}</span>
              <span>{order.paymentStatus}</span>
              <span>{order.trackingNumber || order.courierName || "Tracking pending"}</span>
              <span>Advance Rs. {Number(order.advanceAmount).toLocaleString("en-IN")}</span>
              <span>Remaining Rs. {Number(order.remainingAmount).toLocaleString("en-IN")}</span>
              <Link to={`/orders/${order._id}`}>View</Link>
              <Link to={`/orders/${order._id}/tracking`}>Track Order</Link>
              {canCancel(order) ? <Link to={`/returns/new?orderId=${order._id}&type=CANCEL`}>Cancel</Link> : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MyOrders;
