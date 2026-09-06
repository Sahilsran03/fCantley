let razorpayScriptPromise;

export const loadRazorpayCheckout = () => {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let finished = false;
    const finish = (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
      if (error) { script.remove(); reject(error); }
      else resolve(window.Razorpay);
    };
    const timer = setTimeout(() => finish(new Error("Razorpay Checkout took too long to load. Please retry.")), 15000);
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => finish(window.Razorpay ? null : new Error("Razorpay Checkout is unavailable."));
    script.onerror = () => finish(new Error("Razorpay Checkout could not be loaded."));
    document.head.appendChild(script);
  }).catch((error) => {
    razorpayScriptPromise = undefined;
    throw error;
  });
  return razorpayScriptPromise;
};
