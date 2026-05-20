import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PasswordField from "../components/PasswordField.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const { resetPassword } = useAuth();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword({ token, password: form.password });
      setMessage(response.message || "Password reset successfully.");
      window.setTimeout(() => navigate("/login", { replace: true }), 1000);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">Account security</p>
        <h1>Reset password</h1>
        <p>Create a new Cantley password. The reset link expires after a short time for your safety.</p>
      </div>

      <form className="form-panel" onSubmit={handleSubmit}>
        {error ? <div className="form-alert">{error}</div> : null}
        {message ? <div className="form-success">{message}</div> : null}

        <PasswordField
          label="New password"
          name="password"
          minLength="8"
          value={form.password}
          onChange={updateField}
          required
        />

        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          minLength="8"
          value={form.confirmPassword}
          onChange={updateField}
          required
        />

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Resetting..." : "Reset password"}
        </button>

        <p className="form-footer">
          <Link to="/login">Back to login</Link>
        </p>
      </form>
    </section>
  );
};

export default ResetPassword;
