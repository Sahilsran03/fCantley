import assert from "node:assert/strict";
import { createOnlinePaymentFlow, razorpayOnlineOptions } from "../utils/onlinePayment.js";
const order = { _id: "order-1", orderNumber: "CNT-1", totalAmount: 999, shippingAddress: {} };
const initiated = { status: "PAYMENT_INITIATED", keyId: "public_test_key", razorpayOrderId: "provider-order", amount: 450, currency: "INR", cantleyOrderId: order._id };
const make = () => {
  const state = { phases: [], calls: [], popups: [], confirmed: 0, current: { ...order, paymentMethod: "ONLINE", paymentStatus: "Pending", inventoryStatus: "Reserved" } };
  class Razorpay {
    constructor(options) { this.options = options; state.popups.push(this); }
    on(name, callback) { this.failed = callback; }
    open() { this.opened = true; }
    close() { this.options.modal.ondismiss(); }
  }
  const api = {
    async post(url, data) {
      assert(!url.endsWith("/checkout")); state.calls.push({ url, data });
      if (url.endsWith("/verify")) {
        if (state.verifyError) throw state.verifyError;
        return { data: { status: "PAYMENT_CONFIRMED", orderId: order._id } };
      }
      if (state.initiationError) throw state.initiationError;
      return { data: initiated };
    },
    async get(url) { state.calls.push({ url }); if (state.refreshError) throw new Error("network"); return { data: { order: state.current } }; }
  };
  const flow = createOnlinePaymentFlow({ order, api, loadRazorpay: async () => {
    if (state.scriptError) throw new Error("Razorpay Checkout could not be loaded."); return Razorpay;
  }, onState: (value) => { state.phases.push(value); state.latest = value; }, onConfirmed: () => { state.confirmed++; } });
  return { state, flow };
};
const callback = { razorpay_payment_id: "provider-payment", razorpay_order_id: "provider-order", razorpay_signature: "test-signature", amount: 1 };
assert.equal(razorpayOnlineOptions(initiated, order).amount, 45000, "provider amount uses initiation, not order/preview");
for (const override of [{ amount: 0 }, { currency: "USD" }, { cantleyOrderId: "other" }]) assert.throws(() => razorpayOnlineOptions({ ...initiated, ...override }, order));
const h = make(); await Promise.all([h.flow.start(), h.flow.start()]);
assert.equal(h.state.popups.length, 1); assert.equal(h.state.calls.length, 1);
h.state.popups[0].close(); assert.equal(h.state.latest.phase, "dismissed");
await h.flow.start(); assert.equal(h.state.popups.length, 2);
const popup = h.state.popups[1];
const verification = popup.options.handler(callback);
popup.options.modal.ondismiss(); await popup.options.handler(callback); await verification;
assert.equal(h.state.confirmed, 1);
const verifyCalls = h.state.calls.filter((entry) => entry.url.endsWith("/verify"));
assert.equal(verifyCalls.length, 1);
assert.deepEqual(Object.keys(verifyCalls[0].data).sort(), ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"]);
assert.equal(h.state.latest.phase, "confirmed");
const script = make(); script.state.scriptError = true; await script.flow.start();
assert.equal(script.state.latest.phase, "error"); script.state.scriptError = false; await script.flow.start();
assert.equal(script.state.popups.length, 1);
const uncertain = make(); await uncertain.flow.start(); uncertain.state.verifyError = new Error("network");
await uncertain.state.popups[0].options.handler(callback);
assert.equal(uncertain.state.latest.phase, "uncertain");
const before = uncertain.state.calls.length; await uncertain.flow.start(); assert.equal(uncertain.state.calls.length, before);
uncertain.state.refreshError = true; await uncertain.flow.checkStatus(); assert.equal(uncertain.state.latest.phase, "uncertain");
uncertain.state.refreshError = false; await Promise.all([uncertain.flow.checkStatus(), uncertain.flow.checkStatus()]);
assert.equal(uncertain.state.latest.phase, "ready");
assert.equal(uncertain.state.popups.length, 1, "status checking never opens a popup");
await uncertain.flow.start(); assert.equal(uncertain.state.popups.length, 2);
const webhook = make(); await webhook.flow.start(); webhook.state.verifyError = new Error("network");
await webhook.state.popups[0].options.handler(callback);
webhook.state.current.paymentStatus = "Paid"; webhook.state.current.inventoryStatus = "Committed";
await webhook.flow.checkStatus(); assert.equal(webhook.state.confirmed, 1);
for (const [changes, expected] of [[{ inventoryStatus: "Released" }, "expired"], [{ orderStatus: "Cancelled" }, "cancelled"]]) {
  const terminal = make(); Object.assign(terminal.state.current, changes); await terminal.flow.checkStatus();
  assert.equal(terminal.state.latest.phase, expected); await terminal.flow.start(); assert.equal(terminal.state.popups.length, 0);
}
const expired = make(); expired.state.initiationError = { response: { status: 409, data: { message: "Online reservation expired. Start a fresh checkout." } } };
await expired.flow.start(); assert.equal(expired.state.latest.phase, "expired"); assert.equal(expired.state.popups.length, 0);
const failed = make(); await failed.flow.start(); failed.state.popups[0].failed();
assert.equal(failed.state.latest.phase, "uncertain"); await failed.flow.start(); assert.equal(failed.state.popups.length, 1);
console.log("Online payment flow: amount, verification, dismissal, same-order retries, uncertainty, webhook refresh, expiry and synchronous locks passed.");
