import React, { useState } from "react";

const PasswordField = ({ label = "Password", ...inputProps }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label>
      {label}
      <span className="password-field">
        <input {...inputProps} type={isVisible ? "text" : "password"} />
        <button
          aria-label={isVisible ? "Hide password" : "Show password"}
          className="password-toggle"
          type="button"
          onClick={() => setIsVisible((current) => !current)}
        >
          <span className={`eye-icon ${isVisible ? "visible" : ""}`} aria-hidden="true" />
        </button>
      </span>
    </label>
  );
};

export default PasswordField;
