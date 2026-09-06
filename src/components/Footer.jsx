import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => (
  <footer className="cantley-footer">
    <div className="cantley-footer-inner">
      <div className="cantley-footer-main">
        <div className="cantley-footer-brand">
          <Link className="cantley-footer-logo" to="/" aria-label="Cantley home">
            <img src="/cantley-logo.jpeg" alt="Cantley" />
          </Link>
          <p>Premium custom apparel, stickers, labels, design uploads, and bulk order support for modern Indian brands.</p>
          <a className="cantley-footer-contact" href="mailto:hello@cantley.in">Support: hello@cantley.in</a>
        </div>

        <nav className="cantley-footer-group" aria-labelledby="footer-shop-title">
          <h2 id="footer-shop-title">Shop</h2>
          <ul>
            <li><Link to="/shop">Products</Link></li>
            <li><Link to="/design-studio">Design Studio</Link></li>
            <li><Link to="/bulk-orders">Bulk Orders</Link></li>
            <li><Link to="/lookbook">Lookbook</Link></li>
          </ul>
        </nav>

        <nav className="cantley-footer-group" aria-labelledby="footer-care-title">
          <h2 id="footer-care-title">Customer Care</h2>
          <ul>
            <li><Link to="/contact">Contact Cantley</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/account">My Account</Link></li>
            <li><Link to="/orders">My Orders</Link></li>
            <li><Link to="/track-order">Track Order</Link></li>
            <li><Link to="/wishlist">Wishlist</Link></li>
          </ul>
        </nav>

        <nav className="cantley-footer-group" aria-labelledby="footer-information-title">
          <h2 id="footer-information-title">Information</h2>
          <ul>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms-and-conditions">Terms &amp; Conditions</Link></li>
            <li><Link to="/shipping-policy">Shipping Policy</Link></li>
            <li><Link to="/return-refund-policy">Return &amp; Refund Policy</Link></li>
            <li><Link to="/cancellation-policy">Cancellation Policy</Link></li>
            <li><Link to="/cod-policy">COD / Advance Payment</Link></li>
            <li><Link to="/custom-printing-policy">Custom Printing Policy</Link></li>
            <li><Link to="/design-upload-guidelines">Design Upload Guidelines</Link></li>
          </ul>
        </nav>
      </div>

      <div className="cantley-footer-bottom">
        <p>&copy; {new Date().getFullYear()} Cantley</p>
        <nav aria-label="Footer legal links">
          <Link to="/privacy-policy">Privacy</Link>
          <Link to="/terms-and-conditions">Terms</Link>
        </nav>
      </div>
    </div>
  </footer>
);

export default Footer;
