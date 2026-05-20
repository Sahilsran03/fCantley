import React from "react";
import { NavLink } from "react-router-dom";

const AdminNav = () => (
  <nav className="admin-nav" aria-label="Admin navigation">
    <NavLink to="/admin">Dashboard</NavLink>
    <NavLink to="/admin/analytics/sales">Sales</NavLink>
    <NavLink to="/admin/analytics/products">Product Insights</NavLink>
    <NavLink to="/admin/analytics/customers">Customers BI</NavLink>
    <NavLink to="/admin/analytics/rewards">Reward BI</NavLink>
    <NavLink to="/admin/announcements">Announcements</NavLink>
    <NavLink to="/admin/notifications">Notifications</NavLink>
    <NavLink to="/admin/products">Products</NavLink>
    <NavLink to="/admin/categories">Categories</NavLink>
    <NavLink to="/admin/coupons">Coupons</NavLink>
    <NavLink to="/admin/pages">CMS Pages</NavLink>
    <NavLink to="/admin/policies">Policies</NavLink>
    <NavLink to="/admin/faqs">FAQ</NavLink>
    <NavLink to="/admin/blog">Blog</NavLink>
    <NavLink to="/admin/lookbook">Lookbook</NavLink>
    <NavLink to="/admin/designs">Designs</NavLink>
    <NavLink to="/admin/offers">Offers</NavLink>
    <NavLink to="/admin/customers">Customers</NavLink>
    <NavLink to="/admin/orders">Orders</NavLink>
    <NavLink to="/admin/returns">Returns</NavLink>
    <NavLink to="/admin/quotes">Quotes</NavLink>
    <NavLink to="/admin/shipping-zones">Shipping</NavLink>
    <NavLink to="/admin/rewards">Rewards</NavLink>
    <NavLink to="/admin/reviews">Reviews</NavLink>
  </nav>
);

export default AdminNav;
