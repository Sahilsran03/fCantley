import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";
import PasswordField from "../components/PasswordField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isGooglePending || isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      const response = await register(form);
      navigate("/verify-otp", { state: { email: response.email || form.email } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="storefront-auth" aria-labelledby="auth-heading">
      <header className="storefront-auth-heading">
        <h1 id="auth-heading">Create your account</h1>
        <p>Join Cantley</p>
      </header>

      <form className="storefront-auth-form" onSubmit={handleSubmit} aria-describedby="registration-note">
        {error ? <div className="storefront-auth-error" role="alert">{error}</div> : null}

        <label>
          Name
          <input name="name" autoComplete="name" value={form.name} onChange={updateField} required minLength="2" />
        </label>

        <label>
          Email
          <input name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
        </label>

        <label>
          Phone
          <input name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={updateField} required />
        </label>

        <PasswordField
          name="password"
          value={form.password}
          onChange={updateField}
          autoComplete="new-password"
          minLength="8"
          required
        />

        <p className="storefront-auth-note" id="registration-note">
          We will send an OTP to verify your email before creating your account.
        </p>

        <button className="storefront-auth-submit" type="submit" disabled={isSubmitting || isGooglePending} aria-busy={isSubmitting}>
          {isSubmitting ? "Sending OTP..." : "Create Account"}
        </button>

        <GoogleAuthButton disabled={isSubmitting} onPendingChange={setIsGooglePending} />

        <p className="storefront-auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  );
};

export default Register;
