// This flow holds one persisted Order. It never calls checkout creation.
export const onlinePaymentBusy = (phase) => ["creating-order", "preparing-payment", "razorpay-open", "verifying", "checking-status"].includes(phase);

export const razorpayOnlineOptions = (initiated, order) => {
  const amount = Number(initiated.amount);
  if (initiated.status !== "PAYMENT_INITIATED" || !initiated.keyId || !initiated.razorpayOrderId ||
      initiated.currency !== "INR" || !Number.isInteger(amount) || amount < 1 || !Number.isSafeInteger(amount * 100) ||
      String(initiated.cantleyOrderId) !== String(order._id)) {
    throw new Error("The payment details returned by the server are invalid.");
  }
  return {
    key: initiated.keyId, amount: amount * 100, currency: initiated.currency,
    order_id: initiated.razorpayOrderId, name: "Cantley", description: `Order ${order.orderNumber || order._id}`,
    prefill: { name: order.shippingAddress?.fullName || "", email: order.shippingAddress?.email || "", contact: order.shippingAddress?.phone || "" }
  };
};

export const createOnlinePaymentFlow = ({ order, api, loadRazorpay, onState, onConfirmed }) => {
  let phase = "idle";
  let locked = false;
  let disposed = false;
  let checkout;
  let generation = 0;
  const set = (next, message = "", isError = false) => {
    phase = next;
    if (!disposed) onState({ phase: next, message, isError });
  };
  const errorState = (error, fallback) => {
    const message = error.response?.data?.message || error.message || fallback;
    if (/reservation expired|inventory is not reserved|no longer payable|fresh checkout/i.test(message)) {
      set("expired", "Your payment reservation has expired. Please start checkout again.", true);
    } else if (/cancelled/i.test(message)) {
      set("cancelled", "This order is cancelled. Payment cannot be retried.", true);
    } else if (error.response?.status === 409 || /uncertain|reconciliation/i.test(message)) {
      set("uncertain", `${message} Check payment status before trying again.`, true);
    } else {
      set("error", message || fallback, true);
    }
  };
  const confirm = () => {
    set("confirmed", "Payment confirmed. Opening your order...");
    if (!disposed) onConfirmed(order._id);
  };
  const start = async () => {
    if (disposed || locked || ["uncertain", "expired", "cancelled", "confirmed"].includes(phase)) return;
    locked = true;
    const run = ++generation;
    let callbackHandled = false;
    set("preparing-payment", "Preparing your secure payment...");
    try {
      const response = await api.post(`/orders/${order._id}/payments/online`);
      if (disposed || run !== generation) return;
      const options = razorpayOnlineOptions(response.data, order);
      const Razorpay = await loadRazorpay();
      if (disposed || run !== generation) return;
      checkout = new Razorpay({
        ...options,
        handler: async (result) => {
          if (disposed || run !== generation || callbackHandled) return;
          callbackHandled = true;
          set("verifying", "Payment submitted. Confirming with Cantley...");
          try {
            const verification = await api.post(`/orders/${order._id}/payments/online/verify`, {
              razorpay_payment_id: result.razorpay_payment_id,
              razorpay_order_id: result.razorpay_order_id,
              razorpay_signature: result.razorpay_signature
            });
            if (disposed || run !== generation) return;
            if (verification.data.status !== "PAYMENT_CONFIRMED" || String(verification.data.orderId) !== String(order._id)) {
              throw new Error("Payment confirmation is still processing.");
            }
            confirm();
          } catch (error) {
            if (disposed || run !== generation) return;
            const rejection = error.response?.data?.message;
            set("uncertain", rejection
              ? `Payment verification could not be completed: ${rejection} Check payment status before trying again.`
              : "We couldn't confirm the payment status yet. Check payment status before trying again.", true);
          } finally {
            locked = false;
          }
        },
        modal: { ondismiss: () => {
          if (disposed || run !== generation || callbackHandled) return;
          callbackHandled = true;
          locked = false;
          set("dismissed", "Payment was not completed. Your order is saved; you can retry payment.");
        } }
      });
      checkout.on("payment.failed", () => {
        if (disposed || run !== generation || callbackHandled) return;
        callbackHandled = true;
        checkout.close();
        locked = false;
        set("uncertain", "The payment attempt could not be completed. Check payment status before trying again.", true);
      });
      set("razorpay-open", "Complete your payment in the secure Razorpay window.");
      checkout.open();
    } catch (error) {
      if (!disposed && run === generation) errorState(error, "Unable to open secure payment. Your order is saved.");
      locked = false;
    }
  };
  const checkStatus = async () => {
    if (disposed || locked || ["expired", "cancelled", "confirmed"].includes(phase)) return;
    locked = true;
    set("checking-status", "Checking the latest payment status...");
    try {
      const response = await api.get(`/orders/${order._id}`);
      if (disposed) return;
      const current = response.data.order;
      if (!current || String(current._id) !== String(order._id) || current.paymentMethod !== "ONLINE") throw new Error("Unable to confirm this order.");
      if (current.orderStatus === "Cancelled") { set("cancelled", "This order is cancelled. Payment cannot be retried.", true); return; }
      if (current.paymentStatus === "Paid" && current.inventoryStatus === "Committed") { confirm(); return; }
      if (current.inventoryStatus === "Released") { set("expired", "Your payment reservation has expired. Please start checkout again.", true); return; }
      if (current.paymentStatus !== "Pending" || current.inventoryStatus !== "Reserved") throw new Error("This payment needs review. Please contact Cantley before paying again.");
      // GET does not release elapsed reservations. Ask the server to validate expiry;
      // this may reuse/prepare a provider Order, but never opens a popup or charges.
      const eligibility = await api.post(`/orders/${order._id}/payments/online`);
      if (disposed) return;
      razorpayOnlineOptions(eligibility.data, current);
      set("ready", "Cantley confirms this order is unpaid and its payment reservation is available. You can retry payment.");
    } catch (error) {
      if (!disposed) {
        errorState(error, "Unable to check payment status.");
        if (phase === "error") set("uncertain", "We couldn't confirm the payment status yet. Please check again before paying.", true);
      }
    } finally { locked = false; }
  };
  return { start, checkStatus, dispose() { disposed = true; generation += 1; checkout?.close?.(); } };
};
