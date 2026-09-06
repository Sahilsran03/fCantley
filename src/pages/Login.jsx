import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";
import PasswordField from "../components/PasswordField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
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
      const response = await login(form);
      if (response.requiresTwoFactor) {
        navigate("/admin-2fa", {
          replace: true,
          state: { email: response.email || form.email, requestToken: response.requestToken, from: location.state?.from }
        });
        return;
      }
      navigate(location.state?.from?.pathname || "/account", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="storefront-auth" aria-labelledby="auth-heading">
      <header className="storefront-auth-heading">
        <h1 id="auth-heading">Welcome back</h1>
        <p>Sign in to your Cantley account</p>
      </header>

      <form className="storefront-auth-form" onSubmit={handleSubmit}>
        {error ? <div className="storefront-auth-error" role="alert">{error}</div> : null}

        <label>
          Email
          <input name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
        </label>

        <PasswordField
          name="password"
          value={form.password}
          onChange={updateField}
          autoComplete="current-password"
          required
        />

        <p className="storefront-auth-forgot">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

        <button className="storefront-auth-submit" type="submit" disabled={isSubmitting || isGooglePending} aria-busy={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>

        <GoogleAuthButton disabled={isSubmitting} onPendingChange={setIsGooglePending} />

        <p className="storefront-auth-footer">
          New to Cantley? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  );
};

export default Login;
