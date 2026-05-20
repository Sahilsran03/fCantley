import React from "react";
import ProductCard from "../components/ProductCard.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

const Wishlist = () => {
  const { products, isLoading } = useWishlist();

  return (
    <section className="catalog-page">
      <div className="page-heading">
        <p className="eyebrow">Account</p>
        <h1>Wishlist</h1>
      </div>
      {isLoading ? <p>Loading wishlist...</p> : null}
      {!isLoading && !products.length ? (
        <div className="empty-state">
          <h2>Your wishlist is empty</h2>
          <p>Save Cantley products you want to revisit later.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      )}
    </section>
  );
};

export default Wishlist;
