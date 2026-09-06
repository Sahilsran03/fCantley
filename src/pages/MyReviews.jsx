import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/reviews/my-reviews")
      .then((response) => {
        setReviews(response.data.reviews || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load reviews."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="admin-page">
      <div className="page-heading">
        <p className="eyebrow">Reviews</p>
        <h1>My Reviews</h1>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      {isLoading ? <div className="analytics-skeleton">Loading reviews...</div> : null}
      {!isLoading && !reviews.length && !error ? (
        <div className="empty-state">
          <h2>No reviews yet</h2>
          <p>Earn Rs. 10 wallet credit for one eligible written review per product per delivered and fully paid order.</p>
          <Link className="button-link" to="/orders">
            View orders
          </Link>
        </div>
      ) : !isLoading ? (
        <div className="admin-table">
          {reviews.map((review) => (
            <div className="admin-row" key={review._id}>
              <div>
                <strong>{review.product?.name || "Product"}</strong>
                <span>{review.rating} rating - Verified Purchase</span>
              </div>
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default MyReviews;
