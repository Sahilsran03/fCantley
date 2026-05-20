import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await forgotPassword({ email });
      setMessage(response.message || "If an account exists with this email, a reset link has been sent.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to request password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">Account help</p>
        <h1>Forgot password</h1>
        <p>Enter your Cantley account email and we will send a secure reset link if the account exists.</p>
      </div>

      <form className="form-panel" onSubmit={handleSubmit}>
        {error ? <div className="form-alert">{error}</div> : null}
        {message ? <div className="form-success">{message}</div> : null}

        <label>
          Email
          <input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>

        <p className="form-footer">
          Remembered it? <Link to="/login">Back to login</Link>
        </p>
      </form>
    </section>
  );
};

export default ForgotPassword;
