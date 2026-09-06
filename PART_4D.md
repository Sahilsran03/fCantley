# Part 4D: Wallet checkout frontend integration

1. **Files changed:** src/pages/Checkout.jsx, src/pages/Checkout.css, src/pages/OrderSuccess.jsx; new src/scripts/testWalletCheckoutBrowser.mjs and this PART_4D.md. Existing uncommitted frontend work was retained. Backend was read only to verify API contracts; no backend files were changed in Part 4D.

2. **Payment options:** Online Payment / Pay securely online with Razorpay; Wallet / Pay instantly using your Cantley Wallet; Cash on Delivery / Pay on delivery, advance may be required. Exact values are ONLINE, WALLET, COD.

3. **Default:** ONLINE remains the default.

4. **Method switching:** selection immediately clears preview/error records. Terms are keyed by method, delivery country/postal code, Cart version, and coupon. The effect cancels stale responses and requests a fresh preview. All methods retain expectedCartVersion. A Wallet response does not erase previously known COD unavailability because that response does not contain isCODAvailable. COD responses omit paymentMethod; the existing COD contract remains supported. ONLINE and WALLET responses must match their selected method.

5. **Wallet preview fields:** walletBalance, walletAmountRequired, isWalletSufficient, walletBalanceAfterPayment, totalAmount, shippingFee, and optional estimatedDeliveryDate. Display uses returned values only. AuthContext balance is never used to decide payment eligibility. Malformed Wallet responses fail as preview errors; no local sufficiency or remainder arithmetic exists.

6. **Sufficient UI:** Available balance, Wallet payment, Balance after payment, and the text “Your Wallet can cover this order.” Numeric amounts are formatted from preview values. The positive state does not rely on color.

7. **Insufficient UI:** visible Available balance and Required/Wallet payment amounts plus an alert explaining insufficient wallet balance and suggesting another payment method. No after-payment amount is shown for an insufficient preview. Wallet remains selectable while its payment CTA is disabled. A malformed/unavailable balance is shown as Unavailable, not zero.

8. **CTA:** Wallet uses “Pay Rs. X from Wallet”; loading says “Paying from Wallet...”. Initial payment requires a current confirmed WALLET preview and isWalletSufficient === true, plus existing form/cart validation. Online keeps Pay online, COD keeps Place order. During Wallet preview loading, old balance/sufficiency is removed and a role=status message describes the refresh.

9. **Checkout request:** POST /orders/checkout through the existing /api Axios base URL, with paymentMethod WALLET, shippingAddress, couponCode, notes, expectedCartVersion, and Idempotency-Key. No balance, sufficiency, after-payment balance, totalAmount, ledger ID, or refund amount is sent.

10. **Success/navigation:** the returned Order must have a real ID, WALLET, Paid, Committed, and not be Cancelled. Then existing loadCart and refreshProfile run with Promise.allSettled, and navigation goes directly to /order-success/:id. No Online endpoint, Razorpay loader, popup, verification, or Online recovery state is entered. Profile/cart refresh failure does not turn an already-paid server Order into a payment failure.

11. **Commit-time insufficient handling:** the exact backend rejection is shown in the checkout alert. No success navigation or cart clearing occurs. The preview is invalidated and explicitly refreshed, even when address/cart/method are unchanged; the user profile is refreshed too. A definite rejection clears the attempt snapshot so the customer can change method or retry after fresh terms. Existing Cart-version conflicts refresh Cart as before.

12. **Balance refresh:** existing AuthContext.refreshProfile fetches /users/profile and updates stored user state. No manual subtraction or AuthContext redesign. It runs after successful Wallet checkout and after a failed Wallet commit attempt; checkout balance presentation still comes only from preview.

13. **Duplicate-click protection:** the existing synchronous submitLockRef is set before asynchronous work. The idempotency key and exact request payload are retained for an ambiguous transport/server response. “Check checkout again” replays that same request to recover its authoritative result; this is checkout-request recovery, not the Online payment state machine. While an ambiguous request is unresolved, method/form changes remain locked to avoid creating a second Order. Definite 4xx rejection unlocks correction. A timeout does not prove that the server rolled back; no fresh key is fabricated in that case.

14. **Online regression:** onlinePayment.js and razorpay.js were not modified. Default preview, authoritative initiation amount, verification, dismissal, same-Order retry, uncertain verification, webhook-first paid status recovery, reservation expiry, and synchronous locks remain covered. Wallet's branch is separate from the unchanged Online flow.

15. **COD regression:** CodAdvancePayment.jsx was not changed and still renders only for COD. Browser tests cover no advance, partial advance, and full advance; their existing preview terms and OrderSuccess advance controls remain. No Wallet logic enters that component.

16. **COD unavailable:** disables only COD. Wallet remains usable with an authoritative sufficient preview even when COD is unavailable for shipping and the product has codAvailable=false. The frontend does not apply product COD restrictions to Wallet.

17. **OrderSuccess:** financial presentation still waits for GET /orders/:id, not navigation-state assumptions. WALLET/Paid displays Payment complete, Paid with Cantley Wallet, the stored Order total, and Nothing due on delivery. A malformed unpaid Wallet Order says Wallet payment not confirmed rather than showing Online/COD controls. A Cancelled Wallet Order never says money is due. “Wallet amount restored” is shown only when its authoritative refundStatus is Refunded; otherwise restoration is explicitly unconfirmed. No refund amount is invented.

18. **Returns UI audit:** MyOrders offers eligible cancellation, not an item-return button. OrderDetails' existing item-return eligibility requires fully received Online/COD components; valid Wallet Orders have zero such components and therefore do not expose Request Return. The returns UI was not changed. A manually entered return URL remains subject to the backend's intentional Wallet item-return block. No wording promises Wallet item-return refunds.

19. **Responsive review:** headless Edge with mocked APIs measured 1440, 1024, 768, 430, 390, and 360 px without horizontal overflow. Three payment cards fit desktop and stack at 1024 and below. Card targets exceed 44 px, amounts wrap, desktop summary remains sticky, mobile summary remains static. Desktop and 390 px screenshots were visually inspected. Wallet amounts use restrained payment-term typography. Screenshots are in the OS temporary directory under cantley-part4d-wallet-<width>.png.

20. **Accessibility:** one native paymentMethod radio group, wrapping visible labels/supporting text, checked indicators plus Selected text, keyboard arrow selection, visible focus outlines, native disabled CTA, aria-busy, loading role=status, and error/insufficiency role=alert. Browser assertions exercised keyboard selection, focus, target sizes, and disabled states.

21. **Security scan:** RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, and key_secret had no matches in frontend/src or the generated dist bundle. No sensitive payment payload or wallet transaction ID logging was introduced. Browser tests assert the exact allowed checkout payload and idempotency header. Tests use isolated fake user/token/provider data only.

22. **Tests:** node src/scripts/testOnlinePayment.mjs; node src/scripts/testRazorpayLoader.mjs; node src/scripts/testWalletCheckoutBrowser.mjs. The new browser script includes the existing Online/COD scenarios and adds sufficient/insufficient Wallet, all six widths, native keyboard behavior, immediate term invalidation, COD-disabled shipping/product, one checkout on double submit, no provider calls for Wallet, profile refresh, direct success, cancelled/refund-state display, and commit-time insufficient recovery. It also proves a server false sufficiency result overrides a numerically high balance. Cart-version invalidation and stale-effect cancellation were reviewed in the existing keyed-preview source.

23. **Build/checks:** npm.cmd run build passed (851 modules). Existing React Router “use client” directive warnings remain. Frontend git diff --check and full-file checks including new/untracked files passed. Frontend and backend are separate Git repositories; Part 4D checks do not include or change the previously documented backend whitespace. No packages were installed.

24. **Live payment status:** no real transaction and no live Razorpay TEST MODE payment were performed. Browser APIs and Razorpay were fulfilled by the isolated test harness. Live provider and real-backend end-to-end QA remain separate final checks.

25. **Remaining issues:** Wallet item-return/partial-refund UI and backend support are outside scope. A failed profile refresh can leave the account's cached balance stale until its next successful refresh; Checkout never uses that cache for payment. Ambiguous checkout-request recovery remains in-memory as in Part 3D; cross-reload recovery was not redesigned. Existing broader MyOrders/OrderDetails payment labels were not expanded. Real backend/provider integration QA remains.

26. **Confirmations:** backend untouched in Part 4D; .env and secrets untouched; Razorpay TEST MODE unchanged; no secrets exposed; no split payments; Wallet uses no Razorpay; Wallet values and sufficiency are server-authoritative; Online preserved; COD preserved; unrelated working-tree edits preserved.

Stopped after Part 4D.