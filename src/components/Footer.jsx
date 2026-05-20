import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";

const Footer = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");

  const subscribe = (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    showToast("Thanks. Cantley updates will reach your inbox soon.");
    setEmail("");
  };

  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <Link className="brand footer-logo logo-brand" to="/" aria-label="Cantley home">
          <img src="/cantley-logo.jpeg" alt="" />
          <span>Cantley</span>
        </Link>
        <p>Premium custom apparel, stickers, labels, design uploads, and bulk order support for modern Indian brands.</p>
        <form className="footer-newsletter" onSubmit={subscribe}>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email for Cantley updates" aria-label="Newsletter email" />
          <button type="submit">Join</button>
        </form>
      </div>
      <div className="footer-grid">
        <div>
          <strong>Shop</strong>
          <Link to="/shop">Products</Link>
          <Link to="/design-studio">Design Studio</Link>
          <Link to="/bulk-orders">Bulk Orders</Link>
          <Link to="/lookbook">Lookbook</Link>
        </div>
        <div>
          <strong>Account</strong>
          <Link to="/account">Dashboard</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/track-order">Track Order</Link>
          <Link to="/wishlist">Wishlist</Link>
        </div>
        <div>
          <strong>Policies</strong>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-and-conditions">Terms & Conditions</Link>
          <Link to="/shipping-policy">Shipping Policy</Link>
          <Link to="/return-refund-policy">Return & Refund Policy</Link>
          <Link to="/cancellation-policy">Cancellation Policy</Link>
          <Link to="/cod-policy">COD / Advance Payment</Link>
          <Link to="/custom-printing-policy">Custom Printing Policy</Link>
          <Link to="/design-upload-guidelines">Design Upload Guidelines</Link>
        </div>
        <div>
          <strong>Contact</strong>
          <Link to="/contact">Contact Cantley</Link>
          <Link to="/faq">FAQ</Link>
          <span>Support: hello@cantley.in</span>
          <span>Instagram | YouTube | LinkedIn</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
