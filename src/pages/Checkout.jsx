import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";

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
  const { user } = useAuth();
  const { cart, loadCart } = useCart();
  const { showToast } = useToast();
  const [shippingAddress, setShippingAddress] = useState(() => ({
    ...emptyAddress,
    fullName: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || ""
  }));
  const [notes, setNotes] = useState("");
  const [shippingInfo, setShippingInfo] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = Number(cart.subtotal || 0);
  const shippingFee = Number(shippingInfo?.shippingFee || 0);
  const totalAmount = Number(cart.totalAmount ?? subtotal) + shippingFee;
  const advanceAmount = useMemo(() => Math.min(totalAmount, Math.max(100, Math.ceil(totalAmount * 0.2))), [totalAmount]);
  const remainingAmount = Math.max(0, totalAmount - advanceAmount);

  const updateAddress = (event) => {
    setSelectedAddressId("");
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

  const checkShipping = async () => {
    if (!shippingAddress.postalCode.trim()) {
      setError("Please enter a postal code first.");
      return;
    }

    try {
      const response = await api.get(`/shipping/check/${shippingAddress.postalCode}`, {
        params: { country: shippingAddress.country || "India" }
      });
      setShippingInfo(response.data.shipping);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to check shipping.");
    }
  };

  const validate = () => {
    const required = ["fullName", "phone", "email", "addressLine1", "city", "state", "country", "postalCode"];
    if (required.some((field) => !shippingAddress[field].trim())) {
      return "Please complete all required shipping fields.";
    }
    if (!cart.items.length) {
      return "Your Cart is empty.";
    }
    return "";
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/orders/checkout", {
        shippingAddress,
        paymentMethod: "COD",
        couponCode: cart.appliedCouponCode || "",
        notes
      });
      await loadCart();
      showToast("Order created successfully.");
      navigate(`/order-success/${response.data.order._id}`, { state: { order: response.data.order } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart.items.length) {
    return (
      <section className="checkout-page">
        <div className="empty-state">
          <h1>Your Cart is empty</h1>
          <p>Add products to your Cart before checkout.</p>
          <Link className="button-link" to="/shop">
            Shop products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <div className="page-heading">
        <p className="eyebrow">Checkout</p>
        <h1>Place your order</h1>
      </div>

      <form className="checkout-layout" onSubmit={placeOrder}>
        <div className="form-panel wide-form">
          {error ? <div className="form-alert">{error}</div> : null}
          {savedAddresses.length ? (
            <label>
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
          <div className="form-grid">
            <label>
              Full name
              <input name="fullName" value={shippingAddress.fullName} onChange={updateAddress} required />
            </label>
            <label>
              Phone
              <input name="phone" value={shippingAddress.phone} onChange={updateAddress} required />
            </label>
            <label>
              Email
              <input name="email" type="email" value={shippingAddress.email} onChange={updateAddress} required />
            </label>
            <label>
              Postal code
              <input name="postalCode" value={shippingAddress.postalCode} onChange={updateAddress} required />
            </label>
            <label>
              Address line 1
              <input name="addressLine1" value={shippingAddress.addressLine1} onChange={updateAddress} required />
            </label>
            <label>
              Address line 2
              <input name="addressLine2" value={shippingAddress.addressLine2} onChange={updateAddress} />
            </label>
            <label>
              City
              <input name="city" value={shippingAddress.city} onChange={updateAddress} required />
            </label>
            <label>
              State
              <input name="state" value={shippingAddress.state} onChange={updateAddress} required />
            </label>
            <label>
              Country
              <input name="country" value={shippingAddress.country} onChange={updateAddress} required />
            </label>
          </div>

          <label>
            Notes
            <textarea rows="4" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>

          <div className="info-panel">
            <strong>COD only</strong>
            <p>Our team will contact you for Rs. 100 or 20% advance confirmation before processing.</p>
          </div>
          <div className="info-panel">
            <strong>Shipping check</strong>
            <p>{shippingInfo?.message || "Check your postal code for shipping fee, COD availability, and delivery estimate."}</p>
            {shippingInfo ? (
              <p>
                Fee Rs. {Number(shippingInfo.shippingFee || 0).toLocaleString("en-IN")} -{" "}
                {shippingInfo.isCODAvailable ? "COD available" : "COD unavailable"}
              </p>
            ) : null}
            {shippingInfo?.estimatedDeliveryDate ? (
              <p>Estimated delivery: {new Date(shippingInfo.estimatedDeliveryDate).toLocaleDateString()}</p>
            ) : null}
            <button className="secondary-button" type="button" onClick={checkShipping}>
              Check postal code
            </button>
          </div>
        </div>

        <aside className="cart-summary">
          <h2>Order summary</h2>
          <div className="checkout-items">
            {cart.items.map((item) => (
              <div className="checkout-item" key={item._id}>
                <img
                  src={getMediaUrl(item.product?.images?.[0]) || "https://placehold.co/96x96/f1f5f9/334155?text=Cantley"}
                  alt={item.product?.name}
                />
                <div>
                  <strong>{item.product?.name}</strong>
                  <span>Qty {item.quantity}</span>
                </div>
                <span>Rs. {(item.unitPrice * item.quantity).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
          <p>Subtotal: Rs. {subtotal.toLocaleString("en-IN")}</p>
          {cart.appliedCoupon ? <p>Coupon {cart.appliedCoupon.code}: Rs. {Number(cart.appliedCoupon.discountAmount || 0).toLocaleString("en-IN")} off</p> : null}
          {cart.appliedOffers?.length ? (
            <div className="discount-stack">
              {cart.appliedOffers.map((offer, index) => (
                <span className="discount-badge" key={`${offer.title}-${index}`}>
                  {offer.title}
                  {offer.discountAmount ? ` - Rs. ${Number(offer.discountAmount).toLocaleString("en-IN")} off` : ""}
                </span>
              ))}
            </div>
          ) : null}
          {cart.discountAmount ? <p>Discount: Rs. {Number(cart.discountAmount).toLocaleString("en-IN")}</p> : null}
          <p>Shipping: Rs. {shippingFee.toLocaleString("en-IN")}</p>
          <p>Advance required: Rs. {advanceAmount.toLocaleString("en-IN")}</p>
          <p>Remaining: Rs. {remainingAmount.toLocaleString("en-IN")}</p>
          <strong>Total: Rs. {totalAmount.toLocaleString("en-IN")}</strong>
          <div className="checkout-policy-links" aria-label="Checkout policy links">
            <Link to="/terms-and-conditions">Terms & Conditions</Link>
            <Link to="/return-refund-policy">Return/Refund Policy</Link>
            <Link to="/cod-policy">COD Policy</Link>
            <Link to="/custom-printing-policy">Custom Printing Policy</Link>
          </div>
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Placing order..." : "Place order"}
          </button>
        </aside>
      </form>
    </section>
  );
};

export default Checkout;
