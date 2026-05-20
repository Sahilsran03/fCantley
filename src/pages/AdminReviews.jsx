import React, { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import api from "../services/api.js";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/reviews")
      .then((response) => {
        setReviews(response.data.reviews || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load reviews."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Reviews</h1>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      {isLoading ? <div className="analytics-skeleton">Loading reviews...</div> : null}
      {!isLoading && !reviews.length && !error ? (
        <div className="empty-state">
          <h2>No reviews yet</h2>
          <p>Customer reviews for Cantley products will appear here.</p>
        </div>
      ) : (
        <div className="admin-table">
          {reviews.map((review) => (
            <div className="admin-row product-admin-row" key={review._id}>
              <div>
                <strong>{review.product?.name || "Product"}</strong>
                <span>{review.user?.email} - {review.rating} rating</span>
              </div>
              <span>Verified Purchase</span>
              <span>{review.reviewText || "No text"}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminReviews;
