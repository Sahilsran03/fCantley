import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordField from "../components/PasswordField.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
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
      const response = await register(form);
      navigate("/verify-otp", { state: { email: response.email || form.email } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">Create account</p>
        <h1>Register</h1>
        <p>Enter your details and Cantley will send an OTP before creating your account.</p>
      </div>

      <form className="form-panel" onSubmit={handleSubmit}>
        {error ? <div className="form-alert">{error}</div> : null}

        <label>
          Name
          <input name="name" value={form.name} onChange={updateField} required minLength="2" />
        </label>

        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </label>

        <label>
          Phone
          <input name="phone" value={form.phone} onChange={updateField} required />
        </label>

        <PasswordField
          name="password"
          value={form.password}
          onChange={updateField}
          required
          minLength="8"
        />

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending OTP..." : "Send OTP"}
        </button>

        <p className="form-footer">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
};

export default Register;
