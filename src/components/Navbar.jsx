import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import api from "../services/api.js";
import { getOptimizedImageUrl } from "../utils/media.js";
import "./Navbar.css";

const iconPaths = {
  menu: <path d="M3 7h18M3 12h18M3 17h18" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
  account: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 3.5-7 8-7s7 2 8 7" /></>,
  heart: <path d="M21 6a5 5 0 0 0-7-1l-2 2-2-2a5 5 0 1 0-7 8l9 9 9-9a5 5 0 0 0 0-7Z" />,
  bag: <><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  chevron: <path d="m8 10 4 4 4-4" />
};

const HeaderIcon = ({ name }) => (
  <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {iconPaths[name]}
  </svg>
);

const HeaderLogo = ({ onClick }) => (
  <Link className="header-logo" to="/" aria-label="Cantley home" onClick={onClick}>
    <img src="/cantley-logo.jpeg" alt="" />
    <span>Cantley</span>
  </Link>
);

const CountBadge = ({ count }) => count > 0
  ? <span className="header-count" aria-hidden="true">{count > 99 ? "99+" : count}</span>
  : null;

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();
  const { unreadCount } = useNotifications();
  const { count: wishlistCount } = useWishlist();
  const [surface, setSurface] = useState(null);
  const [drawerCategoriesOpen, setDrawerCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryState, setCategoryState] = useState("loading");
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchState, setSearchState] = useState("initial");
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const headerRef = useRef(null);
  const searchInputRef = useRef(null);
  const drawerCloseRef = useRef(null);
  const lastTriggerRef = useRef(null);
  const searchRequestIdRef = useRef(0);
  const cartCount = Number(cart.itemCount || 0);

  const closeSurface = (returnFocus = false) => {
    setSurface(null);
    setActiveSuggestion(-1);
    if (returnFocus) window.setTimeout(() => lastTriggerRef.current?.focus(), 0);
  };

  const openSurface = (name, event) => {
    lastTriggerRef.current = event.currentTarget;
    setSurface(name);
  };

  useEffect(() => {
    setSurface(null);
    setDrawerCategoriesOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/categories", { signal: controller.signal })
      .then((response) => {
        setCategories(response.data.categories || []);
        setCategoryState("success");
      })
      .catch((error) => {
        if (error.name !== "CanceledError") setCategoryState("error");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const query = searchTerm.trim();
    const requestId = ++searchRequestIdRef.current;
    setActiveSuggestion(-1);
    setSuggestions([]);

    if (query.length < 2) {
      setSearchState(query ? "typing" : "initial");
      return undefined;
    }

    setSearchState("typing");
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearchState("loading");
      api.get("/products", {
        params: { q: query, limit: 5, sort: "trending" },
        signal: controller.signal
      }).then((response) => {
        if (requestId !== searchRequestIdRef.current) return;
        const products = response.data.products || [];
        setSuggestions(products);
        setSearchState(products.length ? "results" : "empty");
      }).catch((error) => {
        if (requestId === searchRequestIdRef.current && error.name !== "CanceledError") {
          setSuggestions([]);
          setSearchState("error");
        }
      });
    }, 240);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm]);

  useEffect(() => {
    if (surface === "search") window.setTimeout(() => searchInputRef.current?.focus(), 0);
    if (surface === "drawer") window.setTimeout(() => drawerCloseRef.current?.focus(), 0);
    if (!["search", "drawer"].includes(surface)) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [surface]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && surface) {
        event.preventDefault();
        closeSurface(true);
        return;
      }
      if (!["search", "drawer"].includes(surface) || event.key !== "Tab") return;
      const id = surface === "search" ? "header-search-dialog" : "mobile-navigation-drawer";
      const container = document.getElementById(id);
      const focusable = container ? [...container.querySelectorAll("a[href], button:not([disabled]), input:not([disabled])")].filter((element) => element.getClientRects().length > 0) : [];
      if (!focusable.length) return;
      if (!container.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? focusable[focusable.length - 1] : focusable[0]).focus();
      } else if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusable[0].focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [surface]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (["account", "categories"].includes(surface) && headerRef.current && !headerRef.current.contains(event.target)) closeSurface();
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [surface]);

  const submitSearch = () => {
    const query = searchTerm.trim();
    if (!query) return;
    closeSurface();
    navigate("/shop?q=" + encodeURIComponent(query));
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setActiveSuggestion((current) => current >= suggestions.length - 1 ? 0 : current + 1);
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setActiveSuggestion((current) => current <= 0 ? suggestions.length - 1 : current - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeSuggestion >= 0) {
        closeSurface();
        navigate("/products/" + suggestions[activeSuggestion].slug);
      } else {
        submitSearch();
      }
    }
  };

  const categoryLinks = (compact = false) => (
    <div className={compact ? "drawer-category-list" : "category-menu-list"}>
      <Link to="/shop" onClick={() => closeSurface()}><strong>Shop All</strong>{!compact && <span>Explore every product</span>}</Link>
      {categoryState === "loading" && <p className="header-menu-state" role="status">Loading categories...</p>}
      {categoryState === "error" && <p className="header-menu-state is-error" role="status">Categories are unavailable right now.</p>}
      {categoryState === "success" && !categories.length && <p className="header-menu-state">No categories available.</p>}
      {categories.map((category) => (
        <Link to={"/shop?category=" + category.slug} key={category._id} title={category.name} onClick={() => closeSurface()}>
          <strong>{category.name}</strong>
          {!compact && category.description && <span>{category.description}</span>}
        </Link>
      ))}
    </div>
  );

  const accountLinks = (compact = false) => (
    <div className={compact ? "drawer-link-group" : "account-menu-list"}>
      {isAuthenticated ? <>
        <Link to="/account" onClick={() => closeSurface()}>Account</Link>
        <Link to="/account/profile" onClick={() => closeSurface()}>Profile</Link>
        <Link to="/orders" onClick={() => closeSurface()}>My Orders</Link>
        <Link to="/wishlist" onClick={() => closeSurface()}>Wishlist</Link>
        <Link to="/returns" onClick={() => closeSurface()}>Returns</Link>
        <Link to="/rewards" onClick={() => closeSurface()}>Rewards</Link>
        <Link to="/quotes" onClick={() => closeSurface()}>Quotes</Link>
        <Link to="/designs" onClick={() => closeSurface()}>Designs</Link>
        <Link to="/notifications" onClick={() => closeSurface()}>Notifications {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}</Link>
        {user?.role === "admin" && <Link to="/admin/products" onClick={() => closeSurface()}>Admin</Link>}
        <button className="header-logout" type="button" onClick={async () => { closeSurface(); await logout(); }}>Logout</button>
      </> : <>
        <Link to="/login" onClick={() => closeSurface()}>Login</Link>
        <Link to="/register" onClick={() => closeSurface()}>Register</Link>
      </>}
    </div>
  );

  return (
    <div className="storefront-navigation" ref={headerRef}>
      <div className="desktop-header-inner">
        <nav className="desktop-primary-nav" aria-label="Primary navigation">
          <NavLink to="/shop">Shop</NavLink>
          <div className="header-menu-anchor">
            <button type="button" className="desktop-nav-button" aria-expanded={surface === "categories"} aria-controls="desktop-category-menu" onClick={(event) => surface === "categories" ? closeSurface() : openSurface("categories", event)}>Categories <HeaderIcon name="chevron" /></button>
            <div id="desktop-category-menu" className={"header-dropdown category-menu " + (surface === "categories" ? "is-open" : "")}>
              <div className="header-dropdown-heading"><span>Shop by category</span><Link to="/shop" onClick={() => closeSurface()}>View all</Link></div>
              {categoryLinks()}
            </div>
          </div>
          <NavLink to="/design-studio">Design Studio</NavLink>
        </nav>
        <HeaderLogo />
        <nav className="desktop-action-nav" aria-label="Customer tools">
          <button type="button" className="header-action" aria-label="Search" aria-haspopup="dialog" aria-expanded={surface === "search"} aria-controls={surface === "search" ? "header-search-dialog" : undefined} onClick={(event) => openSurface("search", event)}><HeaderIcon name="search" /><span>Search</span></button>
          <div className="header-menu-anchor">
            <button type="button" className="header-action" aria-expanded={surface === "account"} aria-controls="desktop-account-menu" onClick={(event) => surface === "account" ? closeSurface() : openSurface("account", event)}><HeaderIcon name="account" /><span>Account</span></button>
            <div id="desktop-account-menu" className={"header-dropdown account-menu-panel " + (surface === "account" ? "is-open" : "")}>
              <div className="header-dropdown-heading"><span>{isAuthenticated ? "Your account" : "Welcome to Cantley"}</span></div>
              {accountLinks()}
            </div>
          </div>
          <NavLink className="header-action header-icon-action" to="/wishlist" aria-label={"Wishlist, " + wishlistCount + (wishlistCount === 1 ? " item" : " items")}><HeaderIcon name="heart" /><CountBadge count={wishlistCount} /></NavLink>
          <NavLink className="header-action header-icon-action" to="/cart" aria-label={"Cart, " + cartCount + (cartCount === 1 ? " item" : " items")}><HeaderIcon name="bag" /><CountBadge count={cartCount} /></NavLink>
        </nav>
      </div>

      <div className="mobile-header-inner">
        <button type="button" className="mobile-header-action" aria-label="Open navigation menu" aria-haspopup="dialog" aria-expanded={surface === "drawer"} aria-controls={surface === "drawer" ? "mobile-navigation-drawer" : undefined} onClick={(event) => openSurface("drawer", event)}><HeaderIcon name="menu" /></button>
        <HeaderLogo />
        <div className="mobile-header-tools">
          <button type="button" className="mobile-header-action" aria-label="Search" aria-haspopup="dialog" aria-expanded={surface === "search"} aria-controls={surface === "search" ? "header-search-dialog" : undefined} onClick={(event) => openSurface("search", event)}><HeaderIcon name="search" /></button>
          <NavLink className="mobile-header-action" to="/cart" aria-label={"Cart, " + cartCount + (cartCount === 1 ? " item" : " items")}><HeaderIcon name="bag" /><CountBadge count={cartCount} /></NavLink>
        </div>
      </div>

      {surface === "drawer" && <div className="header-modal-layer">
        <button className="header-backdrop" type="button" aria-label="Close navigation menu" onClick={() => closeSurface(true)} />
        <aside id="mobile-navigation-drawer" className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="drawer-heading"><HeaderLogo onClick={() => closeSurface()} /><button ref={drawerCloseRef} type="button" className="mobile-header-action" aria-label="Close navigation menu" onClick={() => closeSurface(true)}><HeaderIcon name="close" /></button></div>
          <nav className="drawer-navigation" aria-label="Mobile navigation">
            <Link className="drawer-feature-link" to="/shop" onClick={() => closeSurface()}>Shop All</Link>
            <button type="button" className="drawer-expand-button" aria-expanded={drawerCategoriesOpen} aria-controls="drawer-categories" onClick={() => setDrawerCategoriesOpen((current) => !current)}>Categories <HeaderIcon name="chevron" /></button>
            <div id="drawer-categories" hidden={!drawerCategoriesOpen}>{categoryLinks(true)}</div>
            <Link to="/design-studio" onClick={() => closeSurface()}>Design Studio</Link>
            <Link to="/track-order" onClick={() => closeSurface()}>Track Order</Link>
            <Link to="/wishlist" onClick={() => closeSurface()}>Wishlist {wishlistCount > 0 ? "(" + wishlistCount + ")" : ""}</Link>
            <div className="drawer-section"><span className="drawer-label">{isAuthenticated ? "Your account" : "Account"}</span>{accountLinks(true)}</div>
            <div className="drawer-section"><span className="drawer-label">Discover & support</span><div className="drawer-link-group">
              <Link to="/bulk-orders" onClick={() => closeSurface()}>Bulk Orders</Link>
              <Link to="/blog" onClick={() => closeSurface()}>Blog</Link>
              <Link to="/lookbook" onClick={() => closeSurface()}>Lookbook</Link>
              <Link to="/faq" onClick={() => closeSurface()}>FAQ</Link>
            </div></div>
          </nav>
        </aside>
      </div>}

      {surface === "search" && <div className="header-modal-layer search-modal-layer">
        <button className="header-backdrop" type="button" aria-label="Close search" onClick={() => closeSurface(true)} />
        <section id="header-search-dialog" className="header-search-dialog" role="dialog" aria-modal="true" aria-label="Search Cantley products">
          <div className="search-dialog-heading"><span>Search Cantley</span><button type="button" className="search-close" aria-label="Close search" onClick={() => closeSurface(true)}><HeaderIcon name="close" /></button></div>
          <form className="header-search-form" role="search" onSubmit={(event) => { event.preventDefault(); submitSearch(); }}>
            <HeaderIcon name="search" />
            <input ref={searchInputRef} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onKeyDown={handleSearchKeyDown} placeholder="Search products" aria-label="Search products" role="combobox" aria-autocomplete="list" aria-expanded={searchState === "results"} aria-controls="header-search-results" aria-activedescendant={activeSuggestion >= 0 ? "header-search-option-" + activeSuggestion : undefined} autoComplete="off" />
            {searchTerm && <button type="button" className="search-clear" onClick={() => { setSearchTerm(""); searchInputRef.current?.focus(); }}>Clear</button>}
          </form>
          <div className="search-status" aria-live="polite">
            {searchState === "initial" && "Start typing to discover Cantley products."}
            {searchState === "typing" && (searchTerm.trim().length < 2 ? "Enter at least 2 characters." : "Searching...")}
            {searchState === "loading" && "Searching..."}
            {searchState === "empty" && "No matching Cantley products."}
            {searchState === "error" && "Search is unavailable right now. Please try again."}
          </div>
          <div id="header-search-results" className="header-search-results" role="listbox" aria-label="Product suggestions">
            {suggestions.map((product, index) => (
              <Link id={"header-search-option-" + index} role="option" aria-selected={activeSuggestion === index} className={activeSuggestion === index ? "is-active" : ""} to={"/products/" + product.slug} key={product._id} onMouseEnter={() => setActiveSuggestion(index)} onClick={() => closeSurface()}>
                <img src={getOptimizedImageUrl(product.images?.[0], { width: 128 }) || "https://placehold.co/128x128/f4f4f2/222?text=Cantley"} alt="" />
                <span><strong>{product.name}</strong><small>{product.category?.name || product.productType}</small></span>
                <b>Rs. {Number(product.basePrice || 0).toLocaleString("en-IN")}</b>
              </Link>
            ))}
          </div>
          {searchTerm.trim().length >= 2 && <button className="search-view-all" type="button" onClick={submitSearch}>View all results for "{searchTerm.trim()}"</button>}
        </section>
      </div>}
    </div>
  );
};

export default Navbar;