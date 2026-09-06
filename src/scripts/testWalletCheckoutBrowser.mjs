import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Run against a local Vite server and isolated headless Chromium/Edge CDP session.
// Every backend request is fulfilled here; Razorpay is a local mock, never a live payment.
const tabs = await (await fetch("http://127.0.0.1:9333/json/list")).json();
const tab = tabs.find((entry) => entry.type === "page");
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));
let sequence = 0;
const pending = new Map();
const command = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
});
const address = { _id: "address-1", isDefault: true, fullName: "Test Customer", email: "test@example.com", phone: "9999999999",
  addressLine1: "1 Test Road", city: "Delhi", state: "Delhi", postalCode: "110001", country: "India" };
const user = { _id: "user-1", name: "Test Customer", email: "test@example.com", phone: "9999999999", role: "customer", addresses: [address] };
const item = { _id: "item-1", quantity: 2, unitPrice: 300, selectedOptions: { size: "M", color: "Black" },
  product: { _id: "product-1", name: "Signature Cotton T-Shirt", images: [], slug: "test-shirt" } };
const fixture = { order: null, methodRequests: [], creates: 0, initiations: 0, verifyMode: "uncertain", codAvailable: true, codAdvance: 100, paid: false, walletBalance: 1000, walletSufficient: true, walletReject: false, profileReads: 0 };
const runtimeErrors = [];
const fulfill = (requestId, value, code = 200, type = "application/json") => command("Fetch.fulfillRequest", {
  requestId, responseCode: code, responseHeaders: [
    { name: "Content-Type", value: type }, { name: "Access-Control-Allow-Origin", value: "http://127.0.0.1:5183" },
    { name: "Access-Control-Allow-Headers", value: "authorization,content-type,idempotency-key" },
    { name: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" }
  ], body: Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64")
});
const handleRequest = async ({ requestId, request }) => {
  if (request.url.startsWith("https://checkout.razorpay.com/")) {
    return fulfill(requestId, `window.__payments=[]; window.Razorpay=class { constructor(options){this.options=options;window.__payments.push(this)} on(name,fn){this.failed=fn} open(){this.opened=true} close(){this.options.modal.ondismiss()} };`, 200, "application/javascript");
  }
  if (request.method === "OPTIONS") return fulfill(requestId, "", 204);
  const path = new URL(request.url).pathname.replace(/^\/api/, "");
  let data = {}; try { data = JSON.parse(request.postData || "{}"); } catch {}
  if (path === "/users/profile") { fixture.profileReads++; return fulfill(requestId, { user: { ...user, walletBalance: fixture.walletBalance } }); }
  if (path === "/cart") return fulfill(requestId, { cart: { id: "cart-1", items: fixture.order ? [] : [item], itemCount: fixture.order ? 0 : 2,
    version: fixture.order ? 2 : 1, subtotal: 600, totalAmount: 600, discountAmount: 0 } });
  if (path === "/orders/checkout-preview") {
    fixture.methodRequests.push(data.paymentMethod);
    assert.deepEqual(Object.keys(data).sort(), ["country", "couponCode", "expectedCartVersion", "paymentMethod", "postalCode"]);
    await new Promise((resolve) => setTimeout(resolve, 140));
    if (data.paymentMethod === "COD" && !fixture.codAvailable) return fulfill(requestId, { message: "COD is not available for this postal code." }, 400);
    if (data.paymentMethod === "WALLET") return fulfill(requestId, { preview: {
      paymentMethod: "WALLET", walletBalance: fixture.walletBalance, walletAmountRequired: 650,
      isWalletSufficient: fixture.walletSufficient, walletBalanceAfterPayment: fixture.walletSufficient ? 350 : null,
      totalAmount: 650, shippingFee: 50, onlineAdvanceRequired: 0, onlineAmountPaid: 0, remainingCodDue: 0, potentialCodAmount: 0, preview: true
    } });
    return fulfill(requestId, { preview: { ...(data.paymentMethod === "ONLINE" ? { paymentMethod: "ONLINE", onlineAmountRequired: 650 } : {}),
      totalAmount: 650, shippingFee: 50, isCODAvailable: fixture.codAvailable,
      onlineAdvanceRequired: data.paymentMethod === "COD" ? fixture.codAdvance : 0,
      codDueAfterAdvance: data.paymentMethod === "COD" ? 650 - fixture.codAdvance : 0, estimatedDeliveryDate: "2026-09-15" } });
  }
  if (path === "/orders/checkout") {
    fixture.creates++;
    assert.deepEqual(Object.keys(data).sort(), ["couponCode", "expectedCartVersion", "notes", "paymentMethod", "shippingAddress"]);
    assert(Object.entries(request.headers).some(([key, value]) => key.toLowerCase() === "idempotency-key" && value));
    if (data.paymentMethod === "WALLET" && fixture.walletReject) {
      fixture.walletBalance = 250; fixture.walletSufficient = false;
      return fulfill(requestId, { message: "Insufficient wallet balance." }, 409);
    }
    fixture.order = { _id: "order-1", orderNumber: "CNT-TEST-1", paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === "WALLET" ? "Paid" : "Pending", inventoryStatus: data.paymentMethod === "ONLINE" ? "Reserved" : "Committed", orderStatus: "Pending",
      totalAmount: data.paymentMethod === "ONLINE" ? 700 : 650, subtotal: 600, shippingFee: 50,
      onlineAmountPaid: 0, remainingCodDue: data.paymentMethod === "COD" ? 650 : 0,
      onlineAdvanceRequired: data.paymentMethod === "COD" ? fixture.codAdvance : 0,
      codDueAfterRequiredAdvance: 650 - fixture.codAdvance, shippingAddress: address,
      items: [{ product: "product-1", name: item.product.name, quantity: 2, finalPrice: 300 }] };
    if (data.paymentMethod === "WALLET") fixture.walletBalance = 350;
    return fulfill(requestId, { success: true, order: fixture.order }, 201);
  }
  if (path === "/orders/order-1/payments/online") {
    fixture.initiations++;
    return fulfill(requestId, { status: "PAYMENT_INITIATED", keyId: "public_test_key", razorpayOrderId: "provider-order", amount: 700, currency: "INR", cantleyOrderId: "order-1" });
  }
  if (path === "/orders/order-1/payments/online/verify") {
    assert.deepEqual(Object.keys(data).sort(), ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"]);
    return fulfill(requestId, { message: "Unable to confirm payment status." }, 502);
  }
  if (path === "/orders/order-1") {
    return fulfill(requestId, { order: fixture.paid ? { ...fixture.order, paymentStatus: "Paid", inventoryStatus: "Committed", onlineAmountPaid: 700 } : fixture.order });
  }
  if (path === "/announcements") return fulfill(requestId, { announcements: [] });
  if (path === "/categories") return fulfill(requestId, { categories: [] });
  return fulfill(requestId, { products: [], notifications: [], count: 0 });
};
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id) { const entry = pending.get(message.id); pending.delete(message.id); if (message.error) entry?.reject(new Error(message.error.message)); else entry?.resolve(message.result); }
  else if (message.method === "Fetch.requestPaused") handleRequest(message.params).catch((error) => { runtimeErrors.push(error.message); });
  else if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params.exceptionDetails.text);
});
const evaluate = async (expression) => {
  const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const waitFor = async (expression) => {
  for (let count = 0; count < 80; count++) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise((resolve) => setTimeout(resolve, 100)); }
  throw new Error(`Timed out: ${expression}`);
};
try {
  await command("Page.enable"); await command("Runtime.enable");
  await command("Fetch.enable", { patterns: [{ urlPattern: "*://*/api/*" }, { urlPattern: "https://checkout.razorpay.com/*" }] });
  await command("Page.addScriptToEvaluateOnNewDocument", { source: `localStorage.setItem('cantley_user', ${JSON.stringify(JSON.stringify(user))}); localStorage.setItem('cantley_access_token','isolated-test-token');` });
  await command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await command("Page.navigate", { url: "http://127.0.0.1:5183/checkout" });
  await waitFor("document.querySelector('button[type=submit]') && !document.querySelector('button[type=submit]').disabled");
  assert.equal(await evaluate("document.querySelector('[value=ONLINE]').checked"), true);
  assert.equal(fixture.methodRequests.at(-1), "ONLINE");
  for (const width of [1440, 1024, 768, 430, 390, 360]) {
    await command("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: false });
    await evaluate("document.querySelector('.checkout-payment-section').scrollIntoView({block:'center'})");
    assert(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), `overflow at ${width}`);
    assert(await evaluate("[...document.querySelectorAll('.checkout-method')].every(el => el.getBoundingClientRect().height >= 44)"));
    const capture = await command("Page.captureScreenshot", { format: "png" });
    await writeFile(join(tmpdir(), `cantley-part4d-${width}.png`), Buffer.from(capture.data, "base64"));
  }
  await evaluate("document.querySelector('[value=COD]').click()");
  assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), true);
  await waitFor("document.querySelector('.checkout-payment-terms').textContent.includes('Online advance required')");
  assert.equal(fixture.methodRequests.at(-1), "COD");
  await evaluate("document.querySelector('[value=ONLINE]').click()");
  assert.equal(await evaluate("document.querySelector('.checkout-payment-terms').textContent.includes('Online advance required')"), false);
  await waitFor("!document.querySelector('button[type=submit]').disabled");
  fixture.codAvailable = false;
  await evaluate("(()=>{const el=document.querySelector('[name=postalCode]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'110002');el.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await waitFor("document.querySelector('[value=COD]').disabled && !document.querySelector('button[type=submit]').disabled");
  await evaluate("document.querySelector('form.checkout-layout').requestSubmit();document.querySelector('form.checkout-layout')?.requestSubmit()");
  await waitFor("window.__payments?.length === 1");
  assert.equal(fixture.creates, 1); assert.equal(await evaluate("window.__payments[0].options.amount"), 70000);
  await evaluate("window.__payments[0].close()");
  await waitFor("document.body.textContent.includes('Retry payment')");
  assert.equal(await evaluate("document.body.textContent.includes('Your Cart is empty')"), false);
  await evaluate("document.querySelector('.checkout-recovery-card .primary-button').click(); document.querySelector('.checkout-recovery-card .primary-button')?.click()");
  await waitFor("window.__payments.length === 2");
  assert.equal(fixture.creates, 1); assert.equal(fixture.initiations, 2);
  await evaluate("window.__payments[1].options.handler({razorpay_payment_id:'mock-payment',razorpay_order_id:'provider-order',razorpay_signature:'mock-signature'})");
  await waitFor("document.querySelector('.checkout-recovery-card [role=alert]')");
  assert.equal(await evaluate("document.body.textContent.includes('Retry payment')"), false);
  fixture.paid = true;
  await evaluate("document.querySelector('.checkout-recovery-card .secondary-button').click()");
  await waitFor("location.pathname === '/order-success/order-1' && document.body.textContent.includes('Nothing due on delivery')");
  assert.equal(await evaluate("document.body.textContent.includes('Pay online advance')"), false);
  for (const advance of [0, 100, 650]) {
    fixture.order = null; fixture.paid = false; fixture.codAvailable = true; fixture.codAdvance = advance;
    await command("Page.navigate", { url: "http://127.0.0.1:5183/checkout" });
    await waitFor("document.querySelector('button[type=submit]') && !document.querySelector('button[type=submit]').disabled");
    await evaluate("document.querySelector('[value=COD]').click()");
    await waitFor("!document.querySelector('button[type=submit]').disabled");
    const terms = await evaluate("document.querySelector('.checkout-payment-terms').textContent");
    assert(advance === 0 ? terms.includes("Pay on delivery") : terms.includes("Online advance required"));
    if (advance === 650) assert(terms.includes("No amount will remain payable on delivery"));
    await evaluate("document.querySelector('form.checkout-layout').requestSubmit();document.querySelector('form.checkout-layout')?.requestSubmit()");
    await waitFor("location.pathname === '/order-success/order-1' && document.querySelector('.order-success-payment .info-panel')");
    assert.equal(fixture.order.paymentMethod, "COD");
    assert.equal(await evaluate("document.body.textContent.includes('Pay online advance')"), advance > 0);
  }
  assert.equal(fixture.creates, 4, "one Online order plus three COD cases");

  // Wallet uses no provider request; every monetary UI value comes from the fixture preview.
  fixture.order = null; fixture.paid = false; fixture.codAvailable = false;
  fixture.walletBalance = 1000; fixture.walletSufficient = true; item.product.codAvailable = false;
  await command("Page.navigate", { url: "http://127.0.0.1:5183/checkout" });
  await waitFor("document.querySelector('[value=COD]')?.disabled && !document.querySelector('button[type=submit]').disabled");
  assert.equal(await evaluate("document.querySelectorAll('input[type=radio][name=paymentMethod]').length"), 3);
  await evaluate("document.querySelector('[value=WALLET]').click()");
  assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), true);
  assert.equal(await evaluate("document.querySelector('.checkout-payment-terms').textContent.includes('Pay online')"), false);
  await waitFor("document.querySelector('.checkout-payment-terms').textContent.includes('Your Wallet can cover')");
  assert.equal(await evaluate("document.querySelector('[value=COD]').disabled"), true, "Wallet preview must not erase known COD unavailability");
  const walletTerms = await evaluate("document.querySelector('.checkout-payment-terms').textContent");
  assert(walletTerms.includes("1,000") && walletTerms.includes("650") && walletTerms.includes("350"));
  assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), false);
  for (const width of [1440, 1024, 768, 430, 390, 360]) {
    await command("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: false });
    await evaluate("document.querySelector('.checkout-payment-section').scrollIntoView({block:'center'})");
    assert(await evaluate("document.documentElement.scrollWidth <= innerWidth"), "Wallet overflow at " + width);
    assert(await evaluate("[...document.querySelectorAll('.checkout-method')].every(el => el.getBoundingClientRect().height >= 44)"));
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.checkout-summary')).position"), width > 768 ? "sticky" : "static");
    const capture = await command("Page.captureScreenshot", { format: "png" });
    await writeFile(join(tmpdir(), "cantley-part4d-wallet-" + width + ".png"), Buffer.from(capture.data, "base64"));
  }
  await evaluate("document.querySelector('[value=WALLET]').focus()");
  assert.equal(await evaluate("document.activeElement.value"), "WALLET");
  assert.notEqual(await evaluate("getComputedStyle(document.querySelector('[value=WALLET]').closest('label')).outlineStyle"), "none");
  await command("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
  await command("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
  await waitFor("document.querySelector('[value=ONLINE]').checked");
  assert.equal(await evaluate("document.querySelector('.checkout-payment-terms').textContent.includes('Available balance')"), false);
  await waitFor("!document.querySelector('button[type=submit]').disabled");
  await evaluate("document.querySelector('[value=WALLET]').click()");
  await waitFor("!document.querySelector('button[type=submit]').disabled");
  const createsBeforeWallet = fixture.creates, startsBeforeWallet = fixture.initiations, profilesBeforeWallet = fixture.profileReads;
  await evaluate("document.querySelector('form.checkout-layout').requestSubmit();document.querySelector('form.checkout-layout')?.requestSubmit()");
  await waitFor("location.pathname === '/order-success/order-1' && document.querySelector('.order-success-payment')?.textContent.includes('Paid with Cantley Wallet')");
  assert.equal(fixture.creates, createsBeforeWallet + 1); assert.equal(fixture.initiations, startsBeforeWallet);
  assert(fixture.profileReads > profilesBeforeWallet);
  assert.equal(await evaluate("Boolean(window.__payments?.length)"), false);
  assert.equal(await evaluate("document.querySelector('.order-success-payment').textContent.includes('Nothing due on delivery')"), true);
  assert.equal(await evaluate("/Paid online|Pay online advance|Retry payment|Online payment pending/.test(document.querySelector('.order-success-payment').textContent)"), false);

  fixture.order = { ...fixture.order, orderStatus: "Cancelled", refundStatus: "Refunded", inventoryStatus: "Restocked" };
  await command("Page.navigate", { url: "http://127.0.0.1:5183/order-success/order-1" });
  await waitFor("document.body.textContent.includes('Wallet amount restored')");
  fixture.order.refundStatus = "None";
  await command("Page.navigate", { url: "http://127.0.0.1:5183/order-success/order-1" });
  await waitFor("document.body.textContent.includes('Wallet restoration is not confirmed')");
  assert.equal(await evaluate("document.body.textContent.includes('Wallet amount restored')"), false);

  fixture.order = null; fixture.codAvailable = true; fixture.walletBalance = 250; fixture.walletSufficient = false;
  await command("Page.navigate", { url: "http://127.0.0.1:5183/checkout" });
  await waitFor("document.querySelector('button[type=submit]') && !document.querySelector('button[type=submit]').disabled");
  await evaluate("document.querySelector('[value=WALLET]').click()");
  await waitFor("document.querySelector('.checkout-payment-terms [role=alert]')");
  assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), true);
  assert.equal(await evaluate("document.querySelector('[value=WALLET]').disabled"), false);
  assert(await evaluate("document.querySelector('.checkout-payment-terms').textContent.includes('250')"));
  await evaluate("document.querySelector('[value=COD]').click()");
  assert.equal(await evaluate("document.querySelector('.checkout-payment-terms').textContent.includes('Available balance')"), false);
  await waitFor("!document.querySelector('button[type=submit]').disabled");

  fixture.walletBalance = 1000; fixture.walletSufficient = true; fixture.walletReject = true;
  await evaluate("document.querySelector('[value=WALLET]').click()");
  await waitFor("!document.querySelector('button[type=submit]').disabled");
  const previewsBeforeFailure = fixture.methodRequests.length, profilesBeforeFailure = fixture.profileReads;
  await evaluate("document.querySelector('form.checkout-layout').requestSubmit()");
  await waitFor("document.querySelector('.checkout-form-error')?.textContent.includes('Insufficient wallet balance')");
  await waitFor("document.querySelector('.checkout-payment-terms').textContent.includes('250')");
  assert.equal(await evaluate("location.pathname"), "/checkout");
  assert.equal(fixture.order, null); assert(fixture.methodRequests.length > previewsBeforeFailure); assert(fixture.profileReads > profilesBeforeFailure);
  assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), true);
  assert.equal(await evaluate("document.querySelector('[name=fullName]').value"), "Test Customer");
  assert.equal(await evaluate("document.querySelector('.checkout-items').textContent.includes('Signature Cotton')"), true);
  assert.equal(await evaluate("Boolean(document.querySelector('.checkout-online-recovery'))"), false);
  await evaluate("document.querySelector('[value=ONLINE]').click()");
  await waitFor("!document.querySelector('button[type=submit]').disabled");
  // Even a numerically sufficient balance cannot override the server's false decision.
  fixture.walletBalance = 1000; fixture.walletSufficient = false;
  await evaluate("document.querySelector('[value=WALLET]').click()");
  await waitFor("document.querySelector('.checkout-payment-terms [role=alert]')");
  assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), true);
  assert.equal(fixture.initiations, startsBeforeWallet);
  assert.deepEqual(runtimeErrors, []);
  console.log("Wallet browser checks passed: authoritative sufficient/insufficient terms, six widths, keyboard, COD independence, atomic success, profile refresh, duplicate click, cancellation display and commit-time failure recovery.");

  console.log("Browser checks passed: six widths without overflow; method invalidation; COD unavailable; one-order Online recovery; initiation amount; uncertain verification/webhook refresh; COD no/partial/full advance.");
  console.log(`Screenshots: ${join(tmpdir(), 'cantley-part4d-<width>.png')}`);
} finally { socket.close(); }
