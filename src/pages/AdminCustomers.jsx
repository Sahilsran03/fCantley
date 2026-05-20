import React from "react";
import AdminNav from "../components/AdminNav.jsx";

const AdminCustomers = () => (
  <section className="admin-page">
    <AdminNav />
    <div className="empty-state">
      <p className="eyebrow">Admin</p>
      <h1>Customers</h1>
      <p>Customer management is coming soon. Authentication is already active.</p>
    </div>
  </section>
);

export default AdminCustomers;
