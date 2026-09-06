import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Account.css";
import { useAuth } from "../context/AuthContext.jsx";

const Profile = () => {
  const { user, refreshProfile, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    refreshProfile()
      .then((profile) => {
        setForm({ name: profile.name, phone: profile.phone });
      })
      .catch(() => {
        setError("Unable to load profile.");
      });
  }, [refreshProfile]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      await updateProfile(form);
      setMessage("Profile updated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Profile update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="cantley-account account-profile">
      <div className="auth-copy">
        <p className="eyebrow">Account</p>
        <h1>Account</h1>
        <p>{user?.email}</p>
        <div className="account-panel account-wallet"><h2>Wallet Balance</h2><strong>{(typeof user?.walletBalance === "number" || (typeof user?.walletBalance === "string" && user.walletBalance.trim() !== "")) && Number.isFinite(Number(user.walletBalance)) ? `₹${Number(user.walletBalance).toLocaleString("en-IN")}` : "Unavailable"}</strong></div>
        {user?.loyaltyRank ? <p>Loyalty rank: {user.loyaltyRank}</p> : null}
      </div>

      <form className="form-panel" onSubmit={handleSubmit}>
        {message ? <div className="form-success" role="status">{message}</div> : null}
        {error ? <div className="form-alert" role="alert">{error}</div> : null}

        <label>
          Name
          <input name="name" value={form.name} onChange={updateField} required minLength="2" />
        </label>

        <label>
          Phone
          <input name="phone" value={form.phone} onChange={updateField} required />
        </label>

        <label>
          Role
          <input value={user?.role || ""} readOnly />
        </label>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="account-links">
        <Link to="/wishlist">Wishlist</Link>
        <Link to="/designs/saved">Saved Designs</Link>
        <Link to="/recently-viewed">Recently Viewed</Link>
      </div>
    </section>
  );
};

export default Profile;
