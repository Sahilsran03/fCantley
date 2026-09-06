import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import "./Account.css";

const amount = (value) => (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value)) ? `₹${Number(value).toLocaleString("en-IN")}` : "Unavailable";

const AccountDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/users/profile").then((response) => setProfile(response.data)).catch((requestError) => {
      setError(requestError.response?.data?.message || "Unable to load account.");
    });
  }, []);

  if (error) return <section className="cantley-account"><div className="form-alert" role="alert">{error}</div></section>;
  if (!profile) return <section className="cantley-account"><div className="account-state" role="status">Loading account...</div></section>;

  const user = profile.user;
  const stats = profile.stats;
  const approvedRewards = stats.rewardsSummary.find((item) => item._id === "Approved");

  return (
    <section className="cantley-account">
      <header className="page-heading row-heading">
        <div><p className="eyebrow">Your Cantley wardrobe</p><h1>Account</h1><p>Welcome, {user.name}</p></div>
        <Link className="button-link" to="/account/profile">Edit profile</Link>
      </header>
      <div className="account-overview">
        <section className="account-panel">
          <h2>Personal details</h2>
          <dl className="account-details">
            <div><dt>Name</dt><dd>{user.name || "Not provided"}</dd></div>
            <div><dt>Email</dt><dd>{user.email || "Not provided"}</dd></div>
            <div><dt>Phone</dt><dd>{user.phone || "Not provided"}</dd></div>
          </dl>
        </section>
        <section className="account-panel account-wallet"><h2>Wallet Balance</h2><strong>{amount(user.walletBalance)}</strong></section>
      </div>
      <div className="account-membership">
        {user.loyaltyRank ? <p><span>Loyalty</span><strong>{user.loyaltyRank}</strong></p> : null}
        {stats.totalOrders != null ? <p><span>Total orders</span><strong>{stats.totalOrders}</strong></p> : null}
        {approvedRewards ? <p><span>Approved rewards</span><strong>{amount(approvedRewards.amount)}</strong></p> : null}
      </div>
      <div className="account-overview">
        <section className="account-panel">
          <h2>Recent orders</h2>
          {stats.recentOrders.length ? stats.recentOrders.map((order) => (
            <div className="account-recent-order" key={order._id}><strong>{order.orderNumber}</strong><span>{order.orderStatus}</span><span>{amount(order.totalAmount)}</span></div>
          )) : <p className="account-muted">No recent orders.</p>}
        </section>
        <nav className="account-panel account-navigation" aria-label="Account shortcuts">
          <h2>Your account</h2>
          <Link to="/account/addresses">Saved addresses <span aria-hidden="true">↗</span></Link>
          <Link to="/wishlist">Wishlist <span aria-hidden="true">↗</span></Link>
          <Link to="/designs/saved">Saved Designs <span aria-hidden="true">↗</span></Link>
          <Link to="/notifications">Notifications <span aria-hidden="true">↗</span></Link>
        </nav>
      </div>
    </section>
  );
};

export default AccountDashboard;
