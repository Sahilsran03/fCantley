import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PasswordField from "../components/PasswordField.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
    <section className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>
        <p>Use your verified Cantley account to continue.</p>
      </div>

      <form className="form-panel" onSubmit={handleSubmit}>
        {error ? <div className="form-alert">{error}</div> : null}

        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </label>

        <PasswordField
          name="password"
          value={form.password}
          onChange={updateField}
          required
        />

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <p className="form-footer">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

        <p className="form-footer">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </section>
  );
};

export default Login;
