import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import "./Rewards.css";

const formatAmount = (value) => (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value)) ? `₹${Number(value).toLocaleString("en-IN")}` : "Unavailable";

const MyRewards = () => {
  const [rewards, setRewards] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const loadRewards = useCallback(() => {
    setIsLoading(true);
    setError("");
    return api.get("/rewards/my-rewards")
      .then((response) => { setRewards(response.data.rewards || []); setError(""); })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load rewards."))
      .finally(() => setIsLoading(false));
  }, []);
  useEffect(() => { loadRewards(); }, [loadRewards]);

  return (
    <section className="cantley-rewards" aria-labelledby="rewards-title">
      <header className="rewards-heading"><p className="rewards-eyebrow">Your Cantley rewards</p><h1 id="rewards-title">Rewards</h1><p>Your submissions and reward updates, all in one place.</p></header>
      <div className="rewards-overview">
        <section className="rewards-balance" aria-labelledby="rewards-balance-title"><h2 id="rewards-balance-title">Reward balance</h2><strong>Unavailable</strong><p>A separate reward balance is not available here.</p></section>
        <nav className="rewards-earn" aria-labelledby="rewards-earn-title"><h2 id="rewards-earn-title">Share your Cantley style</h2><p>Submit your proof for verification.</p><Link to="/rewards/story">Story proof <span aria-hidden="true">↗</span></Link><Link to="/rewards/reel">Reel proof <span aria-hidden="true">↗</span></Link><Link to="/rewards/wear-earn">Wear &amp; Earn <span aria-hidden="true">↗</span></Link></nav>
      </div>
      <section className="rewards-history" aria-labelledby="rewards-history-title">
        <h2 id="rewards-history-title">Reward history</h2>
        {isLoading ? <div className="rewards-state" role="status"><span className="rewards-loader" aria-hidden="true" /><p>Loading your rewards...</p></div> : error ? <div className="rewards-state" role="alert"><h3>We couldn’t load your rewards</h3><p>{error}</p><button className="rewards-button" type="button" onClick={loadRewards}>Retry</button></div> : !rewards.length ? <div className="rewards-state"><h3>No rewards yet</h3><p>Your story, reel, and Wear &amp; Earn submissions will appear here.</p></div> : <ul className="rewards-list">{rewards.map((reward) => <li key={reward._id} className="rewards-row"><div className="rewards-row-copy">{reward.type ? <h3>{reward.type}</h3> : null}{reward.adminNote ? <p>{reward.adminNote}</p> : null}</div><div className="rewards-row-status">{reward.status ? <><span className="rewards-label">Status</span><span className="rewards-status">{reward.status}</span></> : null}</div><div className="rewards-row-amount"><span className="rewards-label">Reward amount</span><strong>{formatAmount(reward.amount)}</strong></div></li>)}</ul>}
      </section>
    </section>
  );
};
export default MyRewards;
