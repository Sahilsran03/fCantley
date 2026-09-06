let scriptPromise;
let initialized = false;
let activeCallback = null;
const scriptUrl = "https://accounts.google.com/gsi/client";

export const loadGoogleIdentity = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      reject(new Error("Google sign-in could not load. Please retry or use email and password."));
    };
    const timer = window.setTimeout(fail, 15000);
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timer);
      if (window.google?.accounts?.id) resolve(window.google.accounts.id);
      else fail();
    };
    document.head.appendChild(script);
  }).catch((error) => { scriptPromise = undefined; throw error; });
  return scriptPromise;
};

export const renderGoogleAuthButton = (gis, element, clientId, callback, onClick) => {
  if (!initialized) {
    gis.initialize({ client_id: clientId, ux_mode: "popup", auto_select: false, callback: (response) => {
      if (activeCallback && response?.state === activeCallback.state) activeCallback.callback(response);
    } });
    initialized = true;
  }
  const state = crypto.randomUUID();
  activeCallback = { state, callback };
  gis.renderButton(element, { type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "rectangular", width: Math.min(360, Math.floor(element.getBoundingClientRect().width)), state, click_listener: onClick });
  return () => {
    if (activeCallback?.state === state) activeCallback = null;
    element.replaceChildren();
  };
};
