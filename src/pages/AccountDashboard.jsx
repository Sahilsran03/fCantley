import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

const AccountDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/users/profile").then((response) => setProfile(response.data)).catch((requestError) => {
      setError(requestError.response?.data?.message || "Unable to load account.");
    });
  }, []);

  if (error) return <div className="form-alert">{error}</div>;
  if (!profile) return <div className="analytics-skeleton">Loading account...</div>;

  const user = profile.user;
  const stats = profile.stats;
  const approvedRewards = stats.rewardsSummary.find((item) => item._id === "Approved");

  return (
    <section className="admin-page">
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">My Account</p>
          <h1>Welcome, {user.name}</h1>
          <p>{user.email}</p>
        </div>
        <Link className="button-link" to="/account/profile">Edit profile</Link>
      </div>
      <div className="metric-grid">
        <article className="metric-card"><span>Wallet</span><strong>Rs. {Number(user.walletBalance || 0).toLocaleString("en-IN")}</strong></article>
        <article className="metric-card"><span>Loyalty</span><strong>{user.loyaltyRank}</strong></article>
        <article className="metric-card"><span>Total Orders</span><strong>{stats.totalOrders}</strong></article>
        <article className="metric-card"><span>Rewards</span><strong>Rs. {Number(approvedRewards?.amount || 0).toLocaleString("en-IN")}</strong></article>
      </div>
      <div className="dashboard-grid">
        <section className="chart-panel">
          <h2>Recent orders</h2>
          {stats.recentOrders.length ? stats.recentOrders.map((order) => (
            <p key={order._id}>{order.orderNumber} - {order.orderStatus} - Rs. {Number(order.totalAmount).toLocaleString("en-IN")}</p>
          )) : <p>No recent orders.</p>}
        </section>
        <section className="chart-panel">
          <h2>Account shortcuts</h2>
          <Link to="/account/addresses">Address Book</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/designs/saved">Saved Designs</Link>
          <Link to="/notifications">Notifications</Link>
        </section>
      </div>
    </section>
  );
};

export default AccountDashboard;
