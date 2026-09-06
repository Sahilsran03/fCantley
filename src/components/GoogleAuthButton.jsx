import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { loadGoogleIdentity, renderGoogleAuthButton } from "../services/googleIdentity.js";
import "./GoogleAuthButton.css";

const GoogleAuthButton = ({ disabled = false, onPendingChange }) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const container = useRef(null);
  const busy = useRef(false);
  const latest = useRef({ disabled, onPendingChange, navigate, location, googleLogin });
  latest.current = { disabled, onPendingChange, navigate, location, googleLogin };
  const [attempt, setAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [scriptFailed, setScriptFailed] = useState(false);
  const [hint, setHint] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    let mounted = true;
    let cleanup;
    setError(""); setIsLoading(true); setScriptFailed(false);
    if (!clientId) {
      setIsLoading(false);
      setError("Google sign-in is not configured. Please use email and password.");
      return undefined;
    }
    loadGoogleIdentity().then((gis) => {
      if (!mounted) return;
      cleanup = renderGoogleAuthButton(gis, container.current, clientId, async (response) => {
        if (!mounted || busy.current || latest.current.disabled) return;
        if (typeof response?.credential !== "string" || !response.credential.trim()) {
          setError("Google sign-in was not completed. Please try again.");
          return;
        }
        busy.current = true;
        setIsPending(true); setError(""); setHint("");
        latest.current.onPendingChange?.(true);
        try {
          await latest.current.googleLogin(response.credential);
          if (mounted) latest.current.navigate(latest.current.location.state?.from?.pathname || "/account", { replace: true });
        } catch (requestError) {
          if (mounted) {
            const status = requestError.response?.status;
            setError(status === 409 ? "An account with this email already exists. Sign in using your email and password." : status === 401 ? "Google sign-in could not be verified. Please try again." : status === 403 ? "Google sign-in is not available for this account. Use your existing sign-in method." : "Unable to sign in with Google. Please try again or use email and password.");
          }
        } finally {
          busy.current = false;
          if (mounted) { setIsPending(false); latest.current.onPendingChange?.(false); }
        }
      }, () => { if (mounted) { setError(""); setHint("If you close or cancel the Google window, you can try again or use email and password."); } });
      setIsLoading(false);
    }).catch(() => {
      if (mounted) { setIsLoading(false); setScriptFailed(true); setError("Google sign-in could not load. Please retry or use email and password."); }
    });
    return () => { mounted = false; cleanup?.(); };
  }, [clientId, attempt]);

  return <div className="google-auth">
    <div className="google-auth-divider"><span>OR</span></div>
    <div className="google-auth-button-host" ref={container} inert={disabled || isPending} aria-busy={isPending} />
    {isLoading ? <p role="status">Loading Google sign-in...</p> : null}
    {isPending ? <p role="status">Signing in with Google...</p> : null}
    {hint && !isPending ? <p role="status">{hint}</p> : null}
    {error ? <p className="google-auth-error" role="alert">{error}</p> : null}
    {scriptFailed ? <button type="button" className="google-auth-retry" onClick={() => setAttempt((value) => value + 1)}>Retry Google sign-in</button> : null}
  </div>;
};
export default GoogleAuthButton;
