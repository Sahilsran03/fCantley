import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const AdminTwoFactor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resendAdminTwoFactor, verifyAdminTwoFactor } = useAuth();
  const [email, setEmail] = useState(location.state?.email || "");
  const [requestToken] = useState(location.state?.requestToken || "");
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
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      await verifyAdminTwoFactor({ email, otp, requestToken });
      navigate(location.state?.from?.pathname || "/admin", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Admin verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    setIsResending(true);

    try {
      const response = await resendAdminTwoFactor({ email, requestToken });
      setMessage(response.message || "A new admin verification code has been sent.");
      setResendCooldown(30);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to resend admin verification code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">Admin security</p>
        <h1>Verify admin login</h1>
        <p>Enter the 6-digit code sent to your admin email before opening the Cantley admin panel.</p>
      </div>

      <form className="form-panel" onSubmit={handleSubmit}>
        {error ? <div className="form-alert">{error}</div> : null}
        {message ? <div className="form-success">{message}</div> : null}

        <label>
          Email
          <input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label>
          Verification code
          <input
            name="otp"
            inputMode="numeric"
            maxLength="6"
            pattern="[0-9]{6}"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            required
          />
        </label>

        <button
          className="secondary-button"
          type="button"
          disabled={isResending || resendCooldown > 0 || !email || !requestToken}
          onClick={handleResend}
        >
          {isResending ? "Sending..." : resendCooldown ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
        </button>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify admin login"}
        </button>

        <p className="form-footer">
          Need a new code? <Link to="/login">Login again</Link>
        </p>
      </form>
    </section>
  );
};

export default AdminTwoFactor;
