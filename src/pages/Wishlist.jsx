import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import "./Wishlist.css";

const Wishlist = () => {
  const { products, isLoading } = useWishlist();

  return (
    <section className="cantley-wishlist" aria-labelledby="wishlist-title">
      <header className="cantley-wishlist-heading">
        <p className="cantley-wishlist-eyebrow">Your Cantley edit</p>
        <div className="cantley-wishlist-title-row">
          <h1 id="wishlist-title">Wishlist</h1>
          {!isLoading ? <p className="cantley-wishlist-count" aria-live="polite" aria-atomic="true">{products.length} {products.length === 1 ? "item" : "items"}</p> : null}
        </div>
        <p className="cantley-wishlist-description">The pieces you love, saved for later.</p>
      </header>
      {isLoading ? (
        <div className="cantley-wishlist-state" role="status">
          <span className="cantley-wishlist-loader" aria-hidden="true" />
          <h2>Loading your wishlist</h2>
          <p>Gathering your saved pieces.</p>
        </div>
      ) : !products.length ? (
        <div className="cantley-wishlist-state">
          <span className="cantley-wishlist-mark" aria-hidden="true">♡</span>
          <h2>Your wishlist is empty</h2>
          <p>Save your favourite Cantley pieces and find them here whenever you’re ready.</p>
          <Link className="cantley-wishlist-shop" to="/shop">Shop Products <span aria-hidden="true">↗</span></Link>
        </div>
      ) : (
        <div className="cantley-wishlist-grid">
          {products.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      )}
    </section>
  );
};

export default Wishlist;
