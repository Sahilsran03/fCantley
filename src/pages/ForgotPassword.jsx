import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
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
    <section className="storefront-auth" aria-labelledby="recovery-heading">
      <header className="storefront-auth-heading">
        <h1 id="recovery-heading">Forgot password</h1>
        <p>Enter your Cantley account email and we will send a secure reset link if the account exists.</p>
      </header>

      <form className="storefront-auth-form" onSubmit={handleSubmit}>
        {error ? <div className="storefront-auth-error" role="alert">{error}</div> : null}
        {message ? <div className="storefront-auth-success" role="status">{message}</div> : null}

        <label>
          Email
          <input name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <button className="storefront-auth-submit" type="submit" aria-busy={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>

        <p className="storefront-auth-footer">
          Remembered it? <Link to="/login">Back to login</Link>
        </p>
      </form>
    </section>
  );
};

export default ForgotPassword;
