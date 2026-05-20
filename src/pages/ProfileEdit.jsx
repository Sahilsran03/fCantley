import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const ProfileEdit = () => {
  const { user, refreshProfile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    avatar: user?.avatar?.url || user?.avatar || "",
    gender: user?.gender || "",
    dateOfBirth: formatDate(user?.dateOfBirth)
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    refreshProfile()
      .then((profile) => {
        setForm({
          name: profile.name || "",
          phone: profile.phone || "",
          avatar: profile.avatar?.url || profile.avatar || "",
          gender: profile.gender || "",
          dateOfBirth: formatDate(profile.dateOfBirth)
        });
      })
      .catch(() => setError("Unable to load your profile."))
      .finally(() => setIsLoading(false));
  }, [refreshProfile]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    setError("");

    if (form.name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Phone is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile(form);
      showToast("Profile updated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Profile update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="analytics-skeleton">Loading profile...</div>;

  return (
    <section className="admin-page">
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>Edit profile</h1>
          <p>{user?.email}</p>
        </div>
        <Link className="secondary-button account-action-link" to="/account">
          Back to account
        </Link>
      </div>

      <form className="form-panel wide-form" onSubmit={submitProfile}>
        {error ? <div className="form-alert">{error}</div> : null}
        <div className="form-grid">
          <label>
            Name
            <input name="name" value={form.name} onChange={updateField} required minLength="2" />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={updateField} required />
          </label>
          <label>
            Avatar URL
            <input name="avatar" value={form.avatar} onChange={updateField} placeholder="https://..." />
          </label>
          <label>
            Gender
            <select name="gender" value={form.gender} onChange={updateField}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Date of birth
            <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} />
          </label>
          <label>
            Email
            <input value={user?.email || ""} readOnly />
          </label>
        </div>
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save profile"}
        </button>
      </form>
    </section>
  );
};

export default ProfileEdit;
