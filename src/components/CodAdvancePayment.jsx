import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { loadRazorpayCheckout } from "../utils/razorpay.js";

// Validate display amounts before conversion: missing values are not a zero balance.
const displayAmount = (value) => {
  if (typeof value !== "number" && (typeof value !== "string" || value.trim() === "")) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};
const formatInr = (value) => value.toLocaleString("en-IN");

const CodAdvancePayment = ({ order, onVerified, onRefresh }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [isInitiating, setIsInitiating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmationUncertain, setConfirmationUncertain] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const paymentButtonRef = useRef(null);
  const paymentLockRef = useRef(false);
  const refreshLockRef = useRef(false);
  const callbackRef = useRef(null);
  const required = Number(order.onlineAdvanceRequired || 0);
  const paid = Number(order.onlineAmountPaid || 0);
  // Keep payment eligibility inputs unchanged; presentation uses validated raw amounts.
  const displayedRequired = displayAmount(order.onlineAdvanceRequired);
  const displayedPaid = displayAmount(order.onlineAmountPaid);
  const remaining = displayAmount(order.remainingCodDue);
  const projectedCod = displayAmount(order.codDueAfterRequiredAdvance);
  const canPay = required > paid
    && order.orderStatus !== "Cancelled"
    && !["Paid", "AdvancePaid"].includes(order.paymentStatus)
    && !confirmationUncertain;

  useEffect(() => {
    if (confirmationUncertain && order.codAdvancePayment && required > 0 && paid >= required &&
        ["Paid", "AdvancePaid"].includes(order.paymentStatus)) {
      setConfirmationUncertain(false);
      setMessageIsError(false);
      setMessage("Advance payment confirmed.");
    }
  }, [confirmationUncertain, order.codAdvancePayment, order.paymentStatus, paid, required]);

  const refreshPaymentStatus = async () => {
    if (refreshLockRef.current) return;
    refreshLockRef.current = true;
    setIsRefreshing(true);
    try {
      // Reuse the original callback after transport uncertainty; this cannot create a charge.
      if (callbackRef.current) {
        const response = await api.post(`/orders/${order._id}/payments/cod-advance/verify`, callbackRef.current);
        if (response.data.status !== "PAYMENT_CONFIRMED" || String(response.data.orderId) !== String(order._id)) throw new Error("Unconfirmed payment");
        await onVerified?.();
        setConfirmationUncertain(false);
        setMessageIsError(false);
        setMessage("Advance payment confirmed.");
        return;
      }
      const response = await api.get(`/orders/${order._id}`);
      const current = response.data.order;
      await onRefresh?.();
      if (String(current?._id) === String(order._id) && current.paymentMethod === "COD" &&
          current.codAdvancePayment && ["Paid", "AdvancePaid"].includes(current.paymentStatus) &&
          Number(current.onlineAmountPaid) >= Number(current.onlineAdvanceRequired)) {
        setConfirmationUncertain(false);
        setMessageIsError(false);
        setMessage("Advance payment confirmed.");
      } else {
        setMessageIsError(true);
        setMessage("Payment status could not be confirmed. Check payment status before trying again.");
      }
    } catch {
      await onRefresh?.();
      setMessageIsError(true);
      setMessage("Payment status could not be confirmed. Check payment status before trying again.");
    } finally {
      refreshLockRef.current = false;
      setIsRefreshing(false);
    }
  };

  const startPayment = async () => {
    if (paymentLockRef.current || !canPay) return;
    if (!isAuthenticated) {
      setMessageIsError(true);
      setMessage("Please sign in again before starting payment.");
      return;
    }

    paymentLockRef.current = true;
    setIsInitiating(true);
    setConfirmationUncertain(false);
    setMessageIsError(false);
    setMessage("");
    let checkoutOpened = false;
    let callbackHandled = false;
    try {
      const response = await api.post(`/orders/${order._id}/payments/cod-advance`);
      const initiated = response.data;
      if (initiated.status === "PAYMENT_CONFIRMED" && String(initiated.orderId) === String(order._id)) {
        await onVerified?.();
        setMessage("Advance payment confirmed.");
        paymentLockRef.current = false;
        return;
      }
      const amountInr = Number(initiated.amount);
      const amountPaise = amountInr * 100;

      if (
        initiated.status !== "PAYMENT_INITIATED"
        || !String(initiated.keyId || "").trim()
        || !String(initiated.razorpayOrderId || "").trim()
        || initiated.currency !== "INR"
        || !Number.isInteger(amountInr)
        || amountInr < 1
        || !Number.isSafeInteger(amountPaise)
      ) {
        throw new Error("The payment details returned by the server are invalid.");
      }

      const Razorpay = await loadRazorpayCheckout();
      const checkout = new Razorpay({
        key: initiated.keyId,
        amount: amountPaise,
        currency: initiated.currency,
        name: "Cantley",
        description: `COD advance for order ${order.orderNumber}`,
        order_id: initiated.razorpayOrderId,
        prefill: {
          name: order.shippingAddress?.fullName || "",
          email: order.shippingAddress?.email || "",
          contact: order.shippingAddress?.phone || ""
        },
        handler: async (paymentResponse) => {
          if (callbackHandled) return;
          callbackHandled = true;
          callbackRef.current = {
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_signature: paymentResponse.razorpay_signature
          };
          setMessageIsError(false);
          setMessage("Payment submitted. Confirming payment...");
          try {
            const verification = await api.post(`/orders/${order._id}/payments/cod-advance/verify`, {
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });
            if (verification.data.status !== "PAYMENT_CONFIRMED" || String(verification.data.orderId) !== String(order._id)) {
              throw new Error("Payment confirmation is still processing.");
            }
            const refreshed = await onVerified?.();
            setMessage(refreshed === false
              ? "Payment verified. Refresh payment status to load the latest order balance."
              : "Advance payment confirmed.");
            showToast("Advance payment confirmed.");
          } catch {
            setConfirmationUncertain(true);
            setMessageIsError(true);
            setMessage("Payment status could not be confirmed. Check payment status before trying again.");
            await onRefresh?.();
          } finally {
            paymentLockRef.current = false;
            setIsInitiating(false);
          }
        },
        modal: {
          ondismiss: () => {
            if (callbackHandled) return;
            callbackHandled = true;
            paymentLockRef.current = false;
            setMessageIsError(false);
            setMessage("Payment was not completed.");
            setIsInitiating(false);
            paymentButtonRef.current?.focus();
          }
        }
      });

      checkout.on("payment.failed", () => {
        if (callbackHandled) return;
        callbackHandled = true;
        paymentLockRef.current = false;
        setMessageIsError(true);
        setMessage("Payment could not be completed. You can try again.");
        setIsInitiating(false);
        paymentButtonRef.current?.focus();
      });
      checkout.open();
      checkoutOpened = true;
    } catch (error) {
      paymentLockRef.current = false;
      const serverMessage = error.response?.data?.message;
      const messageText = serverMessage || error.message || "Online payment is temporarily unavailable. Please try again.";
      setMessageIsError(true);
      setMessage(messageText);
      showToast(messageText, "error");
    } finally {
      if (!checkoutOpened) setIsInitiating(false);
    }
  };

  if (order.paymentMethod !== "COD") return null;

  return (
    <div className="info-panel">
      <h3>Online advance</h3>
      {order.orderStatus === "Cancelled" ? <p>Order cancelled. No advance payment can be made.</p> : null}
      {order.orderStatus !== "Cancelled" && order.paymentStatus === "Paid" ? <p>Fully paid.</p> : null}
      {order.orderStatus !== "Cancelled" && order.paymentStatus === "AdvancePaid" ? (
        <>
          <p>Advance paid.</p>
          {displayedPaid !== null ? <p>Paid online: Rs. {formatInr(displayedPaid)}</p> : null}
          {remaining > 0
            ? <p>Remaining COD: Rs. {formatInr(remaining)}</p>
            : remaining === 0 ? <p>Fully paid. No amount remains payable on delivery.</p> : <p>Remaining COD amount unavailable.</p>}
        </>
      ) : null}
      {order.orderStatus !== "Cancelled" && order.paymentStatus !== "Paid" && order.paymentStatus !== "AdvancePaid" && displayedRequired === 0 ? (
        <>
          <p>No online advance is required.</p>
          {remaining !== null ? <p>Rs. {formatInr(remaining)} is payable as COD on delivery.</p> : <p>Remaining COD amount unavailable.</p>}
        </>
      ) : null}
      {order.orderStatus !== "Cancelled" && !["Paid", "AdvancePaid"].includes(order.paymentStatus) && displayedRequired > 0 ? (
        <>
          <p>{order.paymentStatus === "Failed" ? "Advance payment was unsuccessful. You can retry." : "Advance payment pending."}</p>
          <p>Online advance required: Rs. {formatInr(displayedRequired)}</p>
          {displayedPaid !== null ? <p>Paid online: Rs. {formatInr(displayedPaid)}</p> : null}
          {remaining !== null ? <p>Current unpaid order balance: Rs. {formatInr(remaining)}</p> : null}
          {projectedCod !== null ? <p>{projectedCod > 0
            ? `After successful Rs. ${formatInr(displayedRequired)} advance payment: Rs. ${formatInr(projectedCod)} payable on delivery.`
            : "After successful payment, no COD will remain."}</p> : null}
        </>
      ) : null}
      {order.orderStatus !== "Cancelled" && !["Paid", "AdvancePaid"].includes(order.paymentStatus) && displayedRequired === null ? <p>Online advance amount unavailable.</p> : null}
      {canPay ? (
        <button ref={paymentButtonRef} className="primary-button" type="button" onClick={startPayment} disabled={isInitiating}>
          {isInitiating ? "Preparing secure payment..." : "Pay online advance"}
        </button>
      ) : null}
      {confirmationUncertain ? (
        <button className="secondary-button" type="button" onClick={refreshPaymentStatus} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing payment status..." : "Refresh payment status"}
        </button>
      ) : null}
      {message ? <p role={messageIsError ? "alert" : "status"}>{message}</p> : null}
    </div>
  );
};

export default CodAdvancePayment;