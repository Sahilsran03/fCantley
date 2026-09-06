import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resendOtp, verifyOtp } = useAuth();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    if (!resendCooldown) return undefined;
    const timer = window.setTimeout(() => setResendCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || isResending) return;
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      await verifyOtp({ email, otp });
      navigate("/account", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "OTP verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (isSubmitting || isResending || resendCooldown > 0 || !email) return;
    setError("");
    setMessage("");
    setIsResending(true);

    try {
      const response = await resendOtp({ email });
      setMessage(response.message || "A new OTP has been sent.");
      setResendCooldown(30);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <section className="storefront-auth" aria-labelledby="recovery-heading">
      <header className="storefront-auth-heading">
        <h1 id="recovery-heading">Verify your email</h1>
        <p>Enter the 6-digit code sent to your email to finish creating your account.</p>
      </header>

      <form className="storefront-auth-form" onSubmit={handleSubmit}>
        {error ? <div className="storefront-auth-error" role="alert">{error}</div> : null}
        {message ? <div className="storefront-auth-success" role="status">{message}</div> : null}

        <label>
          Email
          <input
            name="email"
            type="email" autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Verification code
          <input
            name="otp"
            className="storefront-auth-otp"
            autoComplete="one-time-code"
            aria-describedby="otp-help"
            inputMode="numeric"
            maxLength="6"
            pattern="[0-9]{6}"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            required
          />
        </label>

        <p className="storefront-auth-note" id="otp-help">Enter the 6-digit code from your email.</p>

        <button className="storefront-auth-submit" type="submit" aria-busy={isSubmitting} disabled={isSubmitting || isResending}>
          {isSubmitting ? "Verifying..." : "Verify and login"}
        </button>

        <button
          className="storefront-auth-secondary"
          aria-busy={isResending}
          type="button"
          disabled={isSubmitting || isResending || resendCooldown > 0 || !email}
          onClick={handleResend}
        >
          {isResending ? "Sending..." : resendCooldown ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
        </button>

        <p className="storefront-auth-footer">
          <Link to="/login">Back to login</Link>
        </p>
      </form>
    </section>
  );
};

export default VerifyOtp;
