import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import api from "../services/api.js";
import { getOptimizedImageUrl } from "../utils/media.js";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();
  const { unreadCount } = useNotifications();
  const { count: wishlistCount } = useWishlist();
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  React.useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSuggestions([]);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsSuggesting(true);
      api
        .get("/products", { params: { q: searchTerm.trim(), limit: 5, sort: "trending" } })
        .then((response) => setSuggestions(response.data.products || []))
        .catch(() => setSuggestions([]))
        .finally(() => setIsSuggesting(false));
    }, 240);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const search = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      setIsOpen(false);
      setSuggestions([]);
      navigate(`/shop?q=${encodeURIComponent(query)}`);
    }
  };

  const closeMenus = () => {
    setIsOpen(false);
    setIsAccountOpen(false);
    setSuggestions([]);
  };

  const logoutUser = () => {
    closeMenus();
    logout();
  };

  return (
    <div className="nav-shell">
      <div className="nav-utility">
        <form className="global-search" onSubmit={search}>
          <input
            name="q"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search Cantley products"
            aria-label="Search Cantley products"
            autoComplete="off"
          />
          {searchTerm.trim().length >= 2 ? (
            <div className="global-suggestions">
              {isSuggesting ? <span className="suggestion-loading">Searching...</span> : null}
              {!isSuggesting && suggestions.map((product) => (
                <Link to={`/products/${product.slug}`} key={product._id} onClick={closeMenus}>
                  <img src={getOptimizedImageUrl(product.images?.[0], { width: 96 }) || "https://placehold.co/96x96/f1f5f9/334155?text=Cantley"} alt="" />
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.category?.name || product.productType} - Rs. {Number(product.basePrice || 0).toLocaleString("en-IN")}</small>
                  </span>
                </Link>
              ))}
              {!isSuggesting && !suggestions.length ? <span className="suggestion-loading">No matching Cantley products.</span> : null}
            </div>
          ) : null}
        </form>
        <NavLink className="icon-nav-link" to="/wishlist" onClick={closeMenus} aria-label="Wishlist">
          <span>Wishlist</span>
          <strong>{wishlistCount}</strong>
        </NavLink>
        <NavLink className="icon-nav-link" to="/cart" onClick={closeMenus} aria-label="Cart">
          <span>Cart</span>
          <strong>{cart.itemCount || 0}</strong>
        </NavLink>
        <button
          className="mobile-menu-button"
          type="button"
          aria-expanded={isOpen}
          aria-controls="customer-navigation"
          onClick={() => setIsOpen((current) => !current)}
        >
          Menu
        </button>
      </div>

      <nav id="customer-navigation" className={`nav-links ${isOpen ? "open" : ""}`} aria-label="Primary navigation">
        <NavLink to="/" onClick={closeMenus}>Home</NavLink>
        <NavLink to="/shop" onClick={closeMenus}>Shop</NavLink>
        <NavLink to="/track-order" onClick={closeMenus}>Track Order</NavLink>
        <NavLink to="/design-studio" onClick={closeMenus}>Design Studio</NavLink>
        <NavLink to="/bulk-orders" onClick={closeMenus}>Bulk Orders</NavLink>
        <NavLink to="/blog" onClick={closeMenus}>Blog</NavLink>
        <NavLink to="/lookbook" onClick={closeMenus}>Lookbook</NavLink>
        <NavLink to="/faq" onClick={closeMenus}>FAQ</NavLink>
        {isAuthenticated ? (
          <div className="account-menu">
            <button className="nav-button" type="button" onClick={() => setIsAccountOpen((current) => !current)}>
              {user?.name || "Account"}
            </button>
            <div className={`account-dropdown ${isAccountOpen ? "open" : ""}`}>
              <Link to="/account" onClick={closeMenus}>Dashboard</Link>
              <Link to="/orders" onClick={closeMenus}>My Orders</Link>
              <Link to="/wishlist" onClick={closeMenus}>Wishlist</Link>
              <Link to="/returns" onClick={closeMenus}>Returns</Link>
              <Link to="/quotes" onClick={closeMenus}>Quotes</Link>
              <Link to="/designs" onClick={closeMenus}>Designs</Link>
              <Link to="/rewards" onClick={closeMenus}>Rewards</Link>
              <Link className="notification-link" to="/notifications" onClick={closeMenus}>Notifications {unreadCount ? <span>{unreadCount}</span> : null}</Link>
              {user?.role === "admin" ? <Link to="/admin/products" onClick={closeMenus}>Admin</Link> : null}
              <button type="button" onClick={logoutUser}>Logout</button>
            </div>
          </div>
        ) : (
          <>
            <NavLink to="/login" onClick={closeMenus}>Login</NavLink>
            <NavLink className="nav-register-link" to="/register" onClick={closeMenus}>Register</NavLink>
          </>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
