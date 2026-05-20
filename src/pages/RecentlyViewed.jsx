import React, { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";
import api from "../services/api.js";

const RecentlyViewed = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/recently-viewed")
      .then((response) => setItems(response.data.products || []))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load recently viewed products."));
  }, []);

  return (
    <section className="catalog-page">
      <div className="page-heading">
        <p className="eyebrow">Account</p>
        <h1>Recently Viewed</h1>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      {!items.length && !error ? (
        <div className="empty-state">
          <h2>No recently viewed products</h2>
          <p>Products you open will appear here.</p>
        </div>
      ) : (
        <div className="product-grid">
          {items.map((item) => item.product ? <ProductCard key={item.product._id} product={item.product} /> : null)}
        </div>
      )}
    </section>
  );
};

export default RecentlyViewed;
