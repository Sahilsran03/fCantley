import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

const MyRewards = () => {
  const [rewards, setRewards] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/rewards/my-rewards")
      .then((response) => {
        setRewards(response.data.rewards || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load rewards."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="admin-page">
      <div className="page-heading">
        <p className="eyebrow">Rewards</p>
        <h1>My Rewards</h1>
        <div className="admin-nav">
          <Link to="/rewards/story">Story proof</Link>
          <Link to="/rewards/reel">Reel proof</Link>
          <Link to="/rewards/wear-earn">Wear & Earn</Link>
        </div>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      {isLoading ? <div className="analytics-skeleton">Loading rewards...</div> : null}
      {!isLoading && !rewards.length && !error ? (
        <div className="empty-state">
          <h2>No rewards yet</h2>
          <p>Upload story, reel, or Wear & Earn proof to earn wallet credits.</p>
        </div>
      ) : !isLoading ? (
        <div className="admin-table">
          {rewards.map((reward) => (
            <div className="admin-row product-admin-row" key={reward._id}>
              <div>
                <strong>{reward.type}</strong>
                <span>Rs. {Number(reward.amount).toLocaleString("en-IN")}</span>
              </div>
              <span>{reward.status}</span>
              <span>{reward.adminNote || "No note"}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default MyRewards;
