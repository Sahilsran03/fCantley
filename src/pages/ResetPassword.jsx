import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PasswordField from "../components/PasswordField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

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
    if (isSubmitting || message) return;
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
    <section className="storefront-auth" aria-labelledby="recovery-heading">
      <header className="storefront-auth-heading">
        <h1 id="recovery-heading">Reset password</h1>
        <p>Create a new Cantley password. The reset link expires after a short time for your safety.</p>
      </header>

      <form className="storefront-auth-form" onSubmit={handleSubmit}>
        {error ? <div className="storefront-auth-error" role="alert">{error}</div> : null}
        {message ? <div className="storefront-auth-success" role="status">{message}</div> : null}

        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          aria-describedby="password-help"
          minLength="8"
          value={form.password}
          onChange={updateField}
          required
        />

        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          aria-describedby="password-help"
          minLength="8"
          value={form.confirmPassword}
          onChange={updateField}
          required
        />

        <p className="storefront-auth-note" id="password-help">Use at least 8 characters. Both passwords must match.</p>

        <button className="storefront-auth-submit" type="submit" aria-busy={isSubmitting} disabled={isSubmitting || Boolean(message)}>
          {isSubmitting ? "Resetting..." : "Reset password"}
        </button>

        <p className="storefront-auth-footer">
          <Link to="/login">Back to login</Link>
        </p>
      </form>
    </section>
  );
};

export default ResetPassword;
