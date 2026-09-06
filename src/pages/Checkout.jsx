import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";
import { loadRazorpayCheckout } from "../utils/razorpay.js";
import { createOnlinePaymentFlow, onlinePaymentBusy } from "../utils/onlinePayment.js";
import "./Checkout.css";

const optionLabels = {
  size: "Size",
  color: "Color",
  material: "Material",
  printType: "Print type",
  finish: "Finish"
};

const emptyAddress = {
  fullName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  postalCode: ""
};

const Checkout = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { cart, isLoading: isCartLoading, loadCart } = useCart();
  const { showToast } = useToast();
  const [shippingAddress, setShippingAddress] = useState(() => ({
    ...emptyAddress,
    fullName: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || ""
  }));
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ONLINE");
  const [previewResult, setPreviewResult] = useState(null);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [codAvailability, setCodAvailability] = useState(null);
  const [onlineOrder, setOnlineOrder] = useState(null);
  const [onlineState, setOnlineState] = useState({ phase: "idle", message: "", isError: false });
  const onlineFlowRef = useRef(null);
  const mountedRef = useRef(true);
  const recoveryActionRef = useRef(null);
  const recoveryStatusRef = useRef(null);
  const checkoutAttemptRef = useRef(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewFailure, setPreviewFailure] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const checkoutErrorRef = useRef(null);

  const deliveryKey = JSON.stringify([shippingAddress.postalCode.trim(), shippingAddress.country.trim(), cart.version, cart.appliedCouponCode || ""]);
  const previewKey = JSON.stringify([deliveryKey, paymentMethod]);
  const preview = previewResult?.key === previewKey ? previewResult.data : null;
  const previewError = previewFailure?.key === previewKey ? previewFailure.message : "";
  const codUnavailable = codAvailability?.key === deliveryKey && codAvailability.available === false;
  const subtotal = Number(cart.subtotal || 0);
  const shippingFee = Number(preview?.shippingFee || 0);
  const previewReady = Boolean(preview && !isPreviewLoading && !previewError);
  const paymentEligible = previewReady && (paymentMethod === "WALLET" ? preview.isWalletSufficient === true : paymentMethod === "COD" ? preview.isCODAvailable === true : true);

  const selectPaymentMethod = (event) => {
    setPreviewResult(null);
    setPreviewFailure(null);
    setError("");
    setPaymentMethod(event.target.value);
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; onlineFlowRef.current?.dispose(); };
  }, []);
  useEffect(() => {
    if (onlineOrder && !onlinePaymentBusy(onlineState.phase)) {
      (recoveryActionRef.current || recoveryStatusRef.current)?.focus();
    }
  }, [onlineOrder, onlineState.phase]);

  const updateAddress = (event) => {
    setSelectedAddressId("");
    if (["postalCode", "country"].includes(event.target.name)) setPreviewResult(null);
    setShippingAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  useEffect(() => {
    api.get("/users/profile")
      .then((response) => {
        const addresses = response.data.user.addresses || [];
        const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0];
        setSavedAddresses(addresses);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
          setShippingAddress((current) => ({
            ...current,
            fullName: defaultAddress.fullName || current.fullName,
            phone: defaultAddress.phone || current.phone,
            email: response.data.user.email || current.email,
            addressLine1: defaultAddress.addressLine1 || "",
            addressLine2: defaultAddress.addressLine2 || "",
            city: defaultAddress.city || "",
            state: defaultAddress.state || "",
            country: defaultAddress.country || "India",
            postalCode: defaultAddress.postalCode || ""
          }));
        }
      })
      .catch(() => {});
  }, []);

  const useSavedAddress = (event) => {
    const addressId = event.target.value;
    const address = savedAddresses.find((item) => item._id === addressId);
    setSelectedAddressId(addressId);
    if (!address) return;
    setPreviewResult(null);
    setShippingAddress((current) => ({
      ...current,
      fullName: address.fullName || current.fullName,
      phone: address.phone || current.phone,
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      city: address.city || "",
      state: address.state || "",
      country: address.country || "India",
      postalCode: address.postalCode || ""
    }));
  };

  useEffect(() => {
    const postalCode = shippingAddress.postalCode.trim();
    const country = shippingAddress.country.trim();
    if (onlineOrder || !postalCode || !country || !cart.version || !cart.items.length) {
      setPreviewResult(null);
      setPreviewFailure(null);
      setIsPreviewLoading(false);
      return undefined;
    }
    let cancelled = false;
    setPreviewResult(null);
    setPreviewFailure(null);
    setIsPreviewLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await api.post("/orders/checkout-preview", {
          postalCode, country, paymentMethod,
          couponCode: cart.appliedCouponCode || "", expectedCartVersion: cart.version
        });
        if (cancelled) return;
        const data = response.data.preview;
        if (!data || (paymentMethod !== "COD" && data.paymentMethod !== paymentMethod)) throw new Error("Unable to confirm the selected payment method.");
        if (paymentMethod === "WALLET" && (
          typeof data.isWalletSufficient !== "boolean" ||
          !Number.isFinite(data.walletAmountRequired) || !Number.isFinite(data.totalAmount) || !Number.isFinite(data.shippingFee) ||
          (data.isWalletSufficient && (!Number.isFinite(data.walletBalance) || !Number.isFinite(data.walletBalanceAfterPayment)))
        )) throw new Error("Unable to confirm Wallet payment terms.");
        setPreviewResult({ key: previewKey, data });
        if (typeof data.isCODAvailable === "boolean") setCodAvailability({ key: deliveryKey, available: data.isCODAvailable });
      } catch (requestError) {
        if (cancelled) return;
        const message = requestError.response?.data?.message || requestError.message || "Unable to confirm delivery and payment terms.";
        setPreviewFailure({ key: previewKey, message });
        if (paymentMethod === "COD" && /COD.*(not available|unavailable)|not available for COD/i.test(message)) {
          setCodAvailability({ key: deliveryKey, available: false, message });
        }
      } finally {
        if (!cancelled) setIsPreviewLoading(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [previewKey, onlineOrder, previewRevision]);

  const validate = () => {
    const required = ["fullName", "phone", "email", "addressLine1", "city", "state", "country", "postalCode"];
    if (required.some((field) => !shippingAddress[field].trim())) {
      return "Please complete all required shipping fields.";
    }
    if (!cart.items.length) {
      return "Your Cart is empty.";
    }
    if (previewReady && paymentMethod === "WALLET" && preview.isWalletSufficient !== true) return "Insufficient wallet balance. Choose another payment method.";
    if (!paymentEligible) {
      return previewError || "Please wait while payment terms are confirmed.";
    }
    return "";
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    if (submitLockRef.current || onlineOrder) return;
    submitLockRef.current = true;
    const validationError = checkoutAttemptRef.current ? "" : validate();
    if (validationError) {
      setError(validationError);
      submitLockRef.current = false;
      requestAnimationFrame(() => checkoutErrorRef.current?.focus());
      return;
    }
    setError("");
    setIsSubmitting(true);
    if (!checkoutAttemptRef.current) {
      checkoutAttemptRef.current = { key: crypto.randomUUID(), payload: {
        shippingAddress: { ...shippingAddress }, paymentMethod,
        couponCode: cart.appliedCouponCode || "", notes, expectedCartVersion: cart.version
      } };
    }
    const attempt = checkoutAttemptRef.current;
    if (attempt.payload.paymentMethod === "ONLINE") setOnlineState({ phase: "creating-order", message: "Creating your order..." });
    try {
      const response = await api.post("/orders/checkout", attempt.payload, {
        headers: { "Idempotency-Key": attempt.key }
      });
      if (!mountedRef.current) return;
      const created = response.data.order;
      if (!created?._id || created.paymentMethod !== attempt.payload.paymentMethod) throw new Error("Unable to confirm the created order. Please check checkout again.");
      if (created.paymentMethod === "ONLINE") {
        // Retain the Order before cart refresh; recovery never depends on this cart again.
        setOnlineOrder(created);
        onlineFlowRef.current = createOnlinePaymentFlow({
          order: created, api, loadRazorpay: loadRazorpayCheckout, onState: setOnlineState,
          onConfirmed: (id) => navigate(`/order-success/${id}`)
        });
        void loadCart().catch(() => {});
        if (created.paymentStatus === "Paid" && created.inventoryStatus === "Committed") {
          navigate(`/order-success/${created._id}`);
        } else {
          void onlineFlowRef.current.start();
        }
      } else if (created.paymentMethod === "WALLET") {
        if (created.paymentStatus !== "Paid" || created.inventoryStatus !== "Committed" || created.orderStatus === "Cancelled") {
          throw new Error("Wallet payment could not be confirmed. Please check this checkout request again.");
        }
        await Promise.allSettled([loadCart(), refreshProfile()]);
        if (!mountedRef.current) return;
        showToast("Payment complete. Paid with Cantley Wallet.");
        navigate("/order-success/" + created._id, { state: { order: created } });
      } else {
        await loadCart().catch(() => {});
        showToast("Order created successfully.");
        navigate(`/order-success/${created._id}`, { state: { order: created } });
      }
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message || "Unable to place order.";
      const status = requestError.response?.status;
      const definiteRejection = status >= 400 && status < 500 && status !== 408 && status !== 429 && !/being processed/i.test(message);
      if (definiteRejection) checkoutAttemptRef.current = null;
      setError(definiteRejection ? message : `${message} Check checkout again to recover the same order request.`);
      if (attempt.payload.paymentMethod === "WALLET") {
        // A preview is informational; any failed commit requires fresh server terms.
        setPreviewResult(null);
        setPreviewFailure(null);
        setPreviewRevision((revision) => revision + 1);
        void refreshProfile().catch(() => {});
      }
      if (status === 409 && /Cart has changed/.test(message)) {
        setPreviewResult(null);
        await loadCart().catch(() => {});
      }
      requestAnimationFrame(() => checkoutErrorRef.current?.focus());
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (onlineOrder) {
    const busy = onlinePaymentBusy(onlineState.phase);
    const canRetry = ["dismissed", "error", "ready"].includes(onlineState.phase);
    const ended = ["expired", "cancelled"].includes(onlineState.phase);
    return (
      <section className="checkout-page checkout-online-recovery" aria-labelledby="online-recovery-heading">
        <p className="eyebrow">Secure online payment</p>
        <h1 id="online-recovery-heading">{onlineState.phase === "confirmed" ? "Payment complete" : "Your order is saved"}</h1>
        <p>Order <strong>{onlineOrder.orderNumber || onlineOrder._id}</strong></p>
        <div className="checkout-recovery-card">
          <div className="checkout-term-row"><span>Order total</span><strong>{"\u20b9"}{Number(onlineOrder.totalAmount).toLocaleString("en-IN")}</strong></div>
          <p ref={recoveryStatusRef} tabIndex="-1" role={onlineState.isError ? "alert" : "status"}>{onlineState.message || "Preparing your secure payment..."}</p>
          {canRetry ? <button ref={recoveryActionRef} type="button" className="primary-button" onClick={() => onlineFlowRef.current?.start()} aria-busy={busy} disabled={busy}>Retry payment</button> : null}
          {!ended && onlineState.phase !== "confirmed" ? (
            <button ref={canRetry ? undefined : recoveryActionRef} type="button" className="secondary-button" onClick={() => onlineFlowRef.current?.checkStatus()} aria-busy={busy} disabled={busy}>
              {onlineState.phase === "checking-status" ? "Checking payment status..." : "Check payment status"}
            </button>
          ) : null}
          {ended ? <Link ref={recoveryActionRef} className="button-link" to="/shop">Start shopping again</Link> : null}
        </div>
        <Link to={`/orders/${onlineOrder._id}`}>View saved order</Link>
      </section>
    );
  }

  if ((isCartLoading || !cart.id) && !checkoutAttemptRef.current) {
    return (
      <section className="checkout-page checkout-loading" aria-busy="true">
        <div className="checkout-loading-heading" aria-hidden="true" />
        <div className="checkout-loading-layout" aria-hidden="true">
          <div><span /><span /><span /></div>
          <aside><span /><span /><span /></aside>
        </div>
        <p className="sr-only" role="status">Loading your checkout...</p>
      </section>
    );
  }

  if (!cart.items.length && !checkoutAttemptRef.current) {
    return (
      <section className="checkout-page">
        <div className="empty-state">
          <p className="eyebrow">Checkout</p>
          <h1>Your Cart is empty</h1>
          <p>Add products before continuing to checkout.</p>
          <Link className="button-link" to="/shop">
            Continue shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <div className="page-heading">
        <h1>Checkout</h1>
      </div>

      <form className="checkout-layout" onSubmit={placeOrder}>
        <div className="form-panel wide-form checkout-form">
          {error ? <div ref={checkoutErrorRef} className="form-alert checkout-form-error" role="alert" tabIndex="-1">{error}</div> : null}

          <fieldset className="checkout-details" disabled={isSubmitting || Boolean(checkoutAttemptRef.current)}>
          <section className="checkout-form-section" aria-labelledby="checkout-contact-heading">
            <header className="checkout-section-heading">
              <span>01</span>
              <h2 id="checkout-contact-heading">Contact</h2>
            </header>
            <div className="form-grid checkout-contact-grid">
            <label>
              Full name
              <input autoComplete="name" name="fullName" value={shippingAddress.fullName} onChange={updateAddress} required />
            </label>
            <label>
              Phone
              <input autoComplete="tel" name="phone" type="tel" value={shippingAddress.phone} onChange={updateAddress} required />
            </label>
            <label className="checkout-field-full">
              Email
              <input autoComplete="email" name="email" type="email" value={shippingAddress.email} onChange={updateAddress} required />
            </label>
            </div>
          </section>

          <section className="checkout-form-section" aria-labelledby="checkout-delivery-heading">
            <header className="checkout-section-heading">
              <span>02</span>
              <h2 id="checkout-delivery-heading">Delivery address</h2>
            </header>
            {savedAddresses.length ? (
              <label className="checkout-saved-address">
                Saved address
                <select value={selectedAddressId} onChange={useSavedAddress}>
                  <option value="">Enter a new address</option>
                  {savedAddresses.map((address) => (
                    <option value={address._id} key={address._id}>
                      {address.fullName} - {address.city}{address.isDefault ? " (Default)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="form-grid checkout-address-grid">
            <label className="checkout-field-full">
              Address line 1
              <input autoComplete="address-line1" name="addressLine1" value={shippingAddress.addressLine1} onChange={updateAddress} required />
            </label>
            <label className="checkout-field-full">
              Address line 2
              <input autoComplete="address-line2" name="addressLine2" value={shippingAddress.addressLine2} onChange={updateAddress} />
            </label>
            <label>
              City
              <input autoComplete="address-level2" name="city" value={shippingAddress.city} onChange={updateAddress} required />
            </label>
            <label>
              State
              <input autoComplete="address-level1" name="state" value={shippingAddress.state} onChange={updateAddress} required />
            </label>
            <label>
              Postal code
              <input autoComplete="postal-code" inputMode="numeric" name="postalCode" value={shippingAddress.postalCode} onChange={updateAddress} required />
            </label>
            <label>
              Country
              <input autoComplete="country-name" name="country" value={shippingAddress.country} onChange={updateAddress} required />
            </label>
            </div>

            <label>
              Notes
              <textarea rows="4" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
          </section>

          <section className="checkout-form-section checkout-payment-section" aria-labelledby="checkout-payment-heading">
            <header className="checkout-section-heading">
              <span>03</span>
              <h2 id="checkout-payment-heading">Payment</h2>
            </header>
            <fieldset className="checkout-methods">
              <legend className="sr-only">Payment method</legend>
              <label className={`checkout-method ${paymentMethod === "ONLINE" ? "is-selected" : ""}`}>
                <input type="radio" name="paymentMethod" value="ONLINE" checked={paymentMethod === "ONLINE"} onChange={selectPaymentMethod} />
                <span><strong>Online Payment</strong><small>Pay securely online with Razorpay</small>{paymentMethod === "ONLINE" ? <em>Selected</em> : null}</span>
              </label>
              <label className={paymentMethod === "WALLET" ? "checkout-method is-selected" : "checkout-method"}>
                <input type="radio" name="paymentMethod" value="WALLET" checked={paymentMethod === "WALLET"} onChange={selectPaymentMethod} />
                <span><strong>Wallet</strong><small>Pay instantly using your Cantley Wallet</small>{paymentMethod === "WALLET" ? <em>Selected</em> : null}</span>
              </label>
              <label className={`checkout-method ${paymentMethod === "COD" ? "is-selected" : ""} ${codUnavailable ? "is-unavailable" : ""}`}>
                <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === "COD"} onChange={selectPaymentMethod} disabled={codUnavailable} aria-describedby="cod-method-detail" />
                <span><strong>Cash on Delivery</strong><small id="cod-method-detail">{codUnavailable ? codAvailability.message || "Not available for this order/address" : "Pay on delivery. Advance may be required."}</small>{paymentMethod === "COD" ? <em>Selected</em> : null}</span>
              </label>
            </fieldset>
            <div className={`checkout-preview-state ${isPreviewLoading ? "is-loading" : previewError ? "is-error" : previewReady ? "is-ready" : "is-waiting"}`}>
              {isPreviewLoading ? <p role="status">{paymentMethod === "WALLET" ? "Updating Wallet balance and payment terms..." : "Updating delivery and payment terms..."}</p> : null}
              {previewError ? <p className="form-alert" role="alert">{previewError}</p> : null}
              {!isPreviewLoading && !preview && !previewError ? <p>Enter your delivery postal code to confirm shipping and payment terms.</p> : null}
              {!isPreviewLoading && preview ? (
                <p>{paymentMethod !== "COD" || preview.isCODAvailable ? "Delivery and payment terms confirmed by Cantley." : "COD is unavailable for this order."}</p>
              ) : null}
            </div>
          </section>
          </fieldset>
        </div>

        <aside className="cart-summary checkout-summary">
          <header className="checkout-summary-heading">
            <p className="eyebrow">Your order</p>
            <h2>Order summary</h2>
          </header>
          <div className="checkout-items">
            {cart.items.map((item) => {
              const selectedOptions = Object.entries(item.selectedOptions || {}).filter(([, value]) => value);
              return (
                <div className="checkout-item" key={item._id}>
                  <img
                    src={getMediaUrl(item.product?.images?.[0]) || "https://placehold.co/96x96/f1f5f9/334155?text=Cantley"}
                    alt={item.product?.name || "Checkout product"}
                  />
                  <div>
                    <strong>{item.product?.name}</strong>
                    {selectedOptions.length ? (
                      <span className="checkout-item-options">
                        {selectedOptions.map(([key, value]) => `${optionLabels[key] || key}: ${value}`).join(" · ")}
                      </span>
                    ) : null}
                    <span>Qty: {item.quantity}</span>
                  </div>
                  <span>Rs. {(item.unitPrice * item.quantity).toLocaleString("en-IN")}</span>
                </div>
              );
            })}
          </div>

          {cart.appliedCoupon ? <p className="checkout-coupon-line">Coupon {cart.appliedCoupon.code}: − Rs. {Number(cart.appliedCoupon.discountAmount || 0).toLocaleString("en-IN")}</p> : null}
          {cart.appliedOffers?.length ? (
            <div className="checkout-applied-offers">
              {cart.appliedOffers.map((offer, index) => (
                <span key={`${offer.title}-${index}`}>
                  {offer.title}
                  {offer.discountAmount ? ` · − Rs. ${Number(offer.discountAmount).toLocaleString("en-IN")}` : ""}
                </span>
              ))}
            </div>
          ) : null}

          <dl className="checkout-financials">
            <div><dt>Subtotal</dt><dd>Rs. {subtotal.toLocaleString("en-IN")}</dd></div>
            {cart.discountAmount ? <div className="checkout-discount-row"><dt>Discount</dt><dd>− Rs. {Number(cart.discountAmount).toLocaleString("en-IN")}</dd></div> : null}
            <div><dt>Shipping</dt><dd>{isPreviewLoading ? "Updating..." : preview ? `Rs. ${shippingFee.toLocaleString("en-IN")}` : "Pending"}</dd></div>
            <div className="checkout-total-row"><dt>Total</dt><dd>{preview ? `Rs. ${Number(preview.totalAmount).toLocaleString("en-IN")}` : "Pending"}</dd></div>
          </dl>

          <section className="checkout-payment-terms" aria-labelledby="checkout-terms-heading">
            <h3 id="checkout-terms-heading">Payment terms</h3>
            {isPreviewLoading ? <p>Updating server-confirmed terms...</p> : null}
            {previewError ? <p className="checkout-terms-error">Terms unavailable until the delivery check succeeds.</p> : null}
            {!isPreviewLoading && !preview && !previewError ? <p>Complete your delivery details to confirm payment terms.</p> : null}
            {previewReady && paymentMethod === "COD" && !preview.isCODAvailable ? <p>COD is unavailable for this order.</p> : null}
            {previewReady && paymentMethod === "COD" && preview.isCODAvailable && Number(preview.onlineAdvanceRequired) === 0 ? (
              <>
                <strong>Pay on delivery</strong>
                <p>Rs. {Number(preview.codDueAfterAdvance).toLocaleString("en-IN")} payable on delivery.</p>
              </>
            ) : null}
            {previewReady && paymentMethod === "COD" && preview.isCODAvailable && Number(preview.onlineAdvanceRequired) > 0 ? (
              <>
                <div className="checkout-term-row"><span>Online advance required</span><strong>Rs. {Number(preview.onlineAdvanceRequired).toLocaleString("en-IN")}</strong></div>
                {Number(preview.codDueAfterAdvance) > 0
                  ? <p>After successful advance: Rs. {Number(preview.codDueAfterAdvance).toLocaleString("en-IN")} payable on delivery.</p>
                  : <p>No amount will remain payable on delivery after successful payment.</p>}
                <p>After placing your order, you'll complete the required online advance securely through Razorpay.</p>
              </>
            ) : null}
            {previewReady && paymentMethod === "WALLET" ? (
              <>
                <div className="checkout-term-row checkout-wallet-row"><span>Available balance</span><strong>{Number.isFinite(preview.walletBalance) ? "Rs. " + preview.walletBalance.toLocaleString("en-IN") : "Unavailable"}</strong></div>
                <div className="checkout-term-row checkout-wallet-row"><span>Wallet payment</span><strong>Rs. {preview.walletAmountRequired.toLocaleString("en-IN")}</strong></div>
                {preview.isWalletSufficient === true ? (
                  <>
                    <div className="checkout-term-row checkout-wallet-row"><span>Balance after payment</span><strong>Rs. {preview.walletBalanceAfterPayment.toLocaleString("en-IN")}</strong></div>
                    <p role="status">Your Wallet can cover this order.</p>
                  </>
                ) : <p className="checkout-terms-error" role="alert">Insufficient wallet balance. Required: Rs. {preview.walletAmountRequired.toLocaleString("en-IN")}. Choose another payment method.</p>}
              </>
            ) : null}
            {previewReady && paymentMethod === "ONLINE" ? (
              <>
                <div className="checkout-term-row"><span>Pay online</span><strong>{"\u20b9"}{Number(preview.onlineAmountRequired).toLocaleString("en-IN")}</strong></div>
                <p>Complete your payment securely with Razorpay. Nothing is due on delivery after successful payment.</p>
              </>
            ) : null}
            {previewReady && preview.estimatedDeliveryDate ? (
              <p className="checkout-estimated-delivery">Estimated delivery: {new Date(preview.estimatedDeliveryDate).toLocaleDateString()}</p>
            ) : null}
          </section>

          <div className="checkout-policy-links" aria-label="Checkout policy links">
            <Link to="/terms-and-conditions">Terms & Conditions</Link>
            <Link to="/return-refund-policy">Return/Refund Policy</Link>
            <Link to="/cod-policy">COD Policy</Link>
            <Link to="/custom-printing-policy">Custom Printing Policy</Link>
          </div>
          <button className="primary-button" type="submit" aria-busy={isSubmitting} disabled={isSubmitting || (!checkoutAttemptRef.current && !paymentEligible)}>
            {isSubmitting ? (paymentMethod === "ONLINE" ? "Creating your order..." : paymentMethod === "WALLET" ? "Paying from Wallet..." : "Placing order...") : checkoutAttemptRef.current ? "Check checkout again" : paymentMethod === "ONLINE" ? (previewReady ? `Pay \u20b9${Number(preview.onlineAmountRequired).toLocaleString("en-IN")} online` : "Pay online") : paymentMethod === "WALLET" ? (previewReady ? "Pay Rs. " + preview.walletAmountRequired.toLocaleString("en-IN") + " from Wallet" : "Pay from Wallet") : "Place order"}
          </button>
        </aside>
      </form>
    </section>
  );
};

export default Checkout;
