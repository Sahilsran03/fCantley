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
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            {isVisible ? (
              <>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </>
            ) : (
              <>
                <path d="m3 3 18 18M10.6 5.1A12 12 0 0 1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3 3.9M6.1 6.1A21 21 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 5.9-1.9M9.9 9.9a3 3 0 0 0 4.2 4.2" />
              </>
            )}
          </svg>
        </button>
      </span>
    </label>
  );
};

export default PasswordField;
