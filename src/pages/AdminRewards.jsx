import React, { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const AdminRewards = () => {
  const { showToast } = useToast();
  const [rewards, setRewards] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadRewards = () => {
    setIsLoading(true);
    api
      .get("/admin/rewards")
      .then((response) => {
        setRewards(response.data.rewards || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load rewards."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadRewards();
  }, []);

  const updateStatus = async (rewardId, status) => {
    try {
      await api.put(`/admin/rewards/${rewardId}/status`, { status });
      showToast("Reward updated.");
      loadRewards();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update reward.");
    }
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Rewards</h1>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      {isLoading ? <div className="analytics-skeleton">Loading rewards...</div> : null}
      {!isLoading && !rewards.length && !error ? (
        <div className="empty-state">
          <h2>No rewards yet</h2>
          <p>Cantley reward requests will appear here.</p>
        </div>
      ) : (
        <div className="admin-table">
          {rewards.map((reward) => (
            <div className="admin-row product-admin-row" key={reward._id}>
              <div>
                <strong>{reward.type}</strong>
                <span>{reward.user?.email} - Rs. {reward.amount}</span>
              </div>
              <span>{reward.status}</span>
              <button type="button" onClick={() => updateStatus(reward._id, "Approved")}>Approve</button>
              <button type="button" onClick={() => updateStatus(reward._id, "Rejected")}>Reject</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminRewards;
