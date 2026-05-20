import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const config = {
  story: { title: "Story Mention", path: "/rewards/story", amount: 20 },
  reel: { title: "Reel Upload", path: "/rewards/reel", amount: 30 },
  "wear-earn": { title: "Wear & Earn", path: "/rewards/wear-earn", amount: 30 }
};

const RewardUpload = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const reward = config[type] || config.story;
  const [proofImage, setProofImage] = useState(null);
  const [proofVideo, setProofVideo] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReward = async (event) => {
    event.preventDefault();
    setError("");

    if (!proofImage && !proofVideo) {
      setError("Proof image or video is required.");
      return;
    }

    const data = new FormData();
    if (proofImage) data.append("proofImage", proofImage);
    if (proofVideo) data.append("proofVideo", proofVideo);
    setIsSubmitting(true);

    try {
      await api.post(reward.path, data);
      showToast("Reward submitted for verification.");
      navigate("/rewards");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit reward.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">Wear & Earn</p>
        <h1>{reward.title}</h1>
        <p>Potential reward: Rs. {reward.amount}. Admin verification is required.</p>
      </div>
      <form className="form-panel" onSubmit={submitReward}>
        {error ? <div className="form-alert">{error}</div> : null}
        <label>
          Proof image
          <input accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => setProofImage(event.target.files?.[0] || null)} />
        </label>
        <label>
          Proof video
          <input accept="video/mp4,video/quicktime,video/webm" type="file" onChange={(event) => setProofVideo(event.target.files?.[0] || null)} />
        </label>
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Submitting..." : "Submit proof"}
        </button>
      </form>
    </section>
  );
};

export default RewardUpload;
