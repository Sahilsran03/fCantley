import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

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
    <section className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">Email verification</p>
        <h1>Verify OTP</h1>
        <p>Enter the 6-digit code sent to your email to finish creating your account.</p>
      </div>

      <form className="form-panel" onSubmit={handleSubmit}>
        {error ? <div className="form-alert">{error}</div> : null}
        {message ? <div className="form-success">{message}</div> : null}

        <label>
          Email
          <input
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          OTP
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
          disabled={isResending || resendCooldown > 0 || !email}
          onClick={handleResend}
        >
          {isResending ? "Sending..." : resendCooldown ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
        </button>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify and login"}
        </button>
      </form>
    </section>
  );
};

export default VerifyOtp;
