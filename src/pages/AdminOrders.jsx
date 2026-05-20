import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import api from "../services/api.js";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/orders")
      .then((response) => {
        setOrders(response.data.orders);
        setError("");
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Unable to load orders.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Orders</h1>
      </div>
      {isLoading ? <p>Loading orders...</p> : null}
      {error ? <div className="form-alert">{error}</div> : null}
      {!isLoading && !orders.length && !error ? (
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p>New customer orders will appear here.</p>
        </div>
      ) : (
        <div className="admin-table">
          {orders.map((order) => (
            <div className="admin-row product-admin-row" key={order._id}>
              <div>
                <strong>{order.orderNumber}</strong>
                <span>{order.user?.email || order.shippingAddress.email}</span>
              </div>
              <span>{order.orderStatus}</span>
              <span>{order.paymentStatus}</span>
              <Link to={`/admin/orders/${order._id}`}>Manage</Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminOrders;
