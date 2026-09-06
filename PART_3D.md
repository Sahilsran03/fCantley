# Part 3D: checkout Online payment frontend

Completed frontend integration using the existing Part 3C backend. No backend source, environment settings, secrets or Razorpay TEST MODE settings were changed.

## Files changed

- src/pages/Checkout.jsx: exact ONLINE/COD selection, authoritative method-keyed previews, safe checkout idempotency snapshot, persisted Online Order recovery and payment CTA.
- src/pages/Checkout.css: accessible selectable payment cards, responsive recovery layout and checkout-screen-only footer logo sizing to eliminate measured overflow.
- src/pages/OrderSuccess.jsx: authoritative Online payment status and paid-online/no-delivery-due wording; COD component renders only for COD.
- src/components/CodAdvancePayment.jsx: defensive COD-only render guard. COD initiation/verification and advance architecture remain unchanged.
- src/utils/razorpay.js: shared deduplicated script loader with failure cleanup and a bounded loading timeout.
- src/utils/onlinePayment.js (new): same-Order Online payment state machine, initiation-response amount validation, verification and uncertainty recovery.
- src/scripts/testOnlinePayment.mjs, testRazorpayLoader.mjs, testCheckoutBrowser.mjs (new): focused flow/loader tests and isolated headless-browser coverage.
- PART_3D.md (new): this report.

## Checkout and method switching

ONLINE is the default. Actual paymentMethod radio controls use exactly ONLINE and COD, with visible labels and a text Selected indicator. Wallet is not shown. Online copy names Razorpay; COD explains delivery payment and possible advance.

Preview requests send paymentMethod, postalCode, country, couponCode and expectedCartVersion only. Preview/error records are keyed by method, postal address country/code, cart version and coupon. A selection change immediately hides the previous terms, disables initial submission and requests a fresh preview. Stale responses cannot supply terms for a different key. Shipping/cart/stock errors stay visible without switching methods automatically.

Online shows server preview.totalAmount and preview.onlineAmountRequired. COD retains server onlineAdvanceRequired and codDueAfterAdvance for no, partial and full advance. No advance formula is computed in React. Informational server isCODAvailable=false disables only COD, with unavailable-for-order/address wording; valid Online checkout remains usable.

Initial submission retains an Idempotency-Key and exact request snapshot. Synchronous submit locking protects both methods. Uncertain checkout responses retain that snapshot for Check checkout again; definite rejections permit correction. No client financial/inventory fields are sent.

## Online flow and amount authority

POST /orders/checkout with ONLINE creates the persisted Order. Its ID is retained before refreshing the cart. The checkout form is replaced by a saved-Order recovery view before the cleared cart can produce an empty-cart screen. Initial Online payment begins once from the explicit customer submission, with no mount-triggered popup.

POST /orders/:id/payments/online supplies public keyId, razorpayOrderId, amount (INR), currency and cantleyOrderId. The same convention as COD converts only that initiated.amount to paise for Razorpay. Preview, cart and navigation-state totals never supply the provider amount. Browser tests deliberately return a different initiation amount than preview and verify the provider receives the initiation amount.

Razorpay handler sends only razorpay_payment_id, razorpay_order_id and razorpay_signature to POST /orders/:id/payments/online/verify. PAYMENT_CONFIRMED for the exact Order is required before success navigation. React never marks the Order Paid. Safe prefill uses saved shipping contact data; provider/public IDs and signatures are never logged.

Explicit states include creating-order, preparing-payment, razorpay-open, verifying, dismissed, uncertain, checking-status, ready, error, expired, cancelled and confirmed. Synchronous locks protect initiation, popup, verification, retry and status checks. Stale/duplicate callbacks are ignored; dismissal cannot override an in-progress verification. Leaving the page disposes the popup flow.

## Recovery

Dismissal is neutral: Payment was not completed. Retry payment uses the same saved Order and begins at Online initiation; it never calls checkout creation. Script/open failures and recoverable initiation failures also preserve that Order. The shared loader reuses window.Razorpay, deduplicates concurrent loads, cleans up failed scripts and permits retry.

Verification failures/rejections enter uncertainty: no immediate Retry payment is exposed. Check payment status fetches GET /orders/:id. Paid/Committed navigates to Order Success, including webhook-first settlement. Cancelled disables retry. Released shows expired messaging and Start shopping again to /shop, without claiming cart restoration.

If GET reports Pending/Reserved, the status action additionally calls Online initiation solely to have the backend validate current reservation eligibility/lazy expiry. It does not open Razorpay. Retry is enabled only after this succeeds. A failed refresh remains uncertain. No client clock calculation decides authoritative expiry. Backend expiry conflicts show the required fresh-checkout message and disable payment retry.

The Order ID is retained for the current mounted Checkout session as requested. Page reload/leaving Checkout ends that in-memory recovery session; cross-reload resume UI is not added. Saved Orders remain available through the existing Orders area.

## Order Success and COD

OrderSuccess continues fetching GET /orders/:id and displays financial values only from the authoritative response. ONLINE/Paid shows Payment complete, Paid online and Nothing due on delivery. Pending Online displays no COD language. CodAdvancePayment is guarded both at the OrderSuccess call site and inside the component.

COD still creates the Order then navigates to /order-success/:id, where required advance remains payable through the existing COD component. No advance was moved into Checkout. Browser tests cover no advance, partial advance and full advance with the existing COD success actions.

## Accessibility and responsive review

Radio semantics, visible labels, selected text, focus outlines, status/alert roles, aria-busy and synchronous locks are present. Focus returns to the recovery action/status after dismissal or errors. Payment cards exceed 44px; CTAs are full width and at least 50px. Choices stack at 1024px and below and labels/financial text wrap.

Headless Edge with mocked backend/Razorpay passed at 1440, 1024, 768, 430, 390 and 360 pixels with no horizontal overflow. Desktop and 390px screenshots were visually reviewed. Browser measurement found an intrinsic oversized shared footer logo; Checkout.css now constrains it only while Checkout/OrderSuccess is present, leaving shared footer source unchanged.

Browser tests also cover default Online preview, both method switches and stale-term removal, disabled COD with usable Online, double submission, one saved Order across dismissal/retry, initiation amount authority, verification uncertainty with no retry, webhook-paid refresh to success, and COD no/partial/full advance.

## Verification and limits

Commands:

- node src/scripts/testOnlinePayment.mjs
- node src/scripts/testRazorpayLoader.mjs
- node src/scripts/testCheckoutBrowser.mjs (local Vite at 127.0.0.1:5183 and isolated headless Edge CDP at 127.0.0.1:9333)
- npm.cmd run build
- git diff --check, plus a full-file whitespace scan including new/untracked Part 3D files.

Browser API requests and Razorpay are mocked; no backend Order or Payment was created. No live Razorpay TEST MODE payment was performed. Provider popup/network behavior remains to be verified against Razorpay TEST MODE. No packages were installed.

The final production build passed (851 modules); Vite reports the existing React Router use-client directive warnings. Frontend repository-wide git diff --check and scoped checks passed, including new files. The requested secret-name scan found no matches in frontend/src or the production bundle, and the new payment flow contains no console logging. All unrelated working-tree changes were preserved. Backend, .env, Razorpay TEST MODE and secrets are untouched. No amount is trusted from React, no Wallet choice exists, and the COD advance architecture is preserved. Stopped after Part 3D.
