import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";

const Cart = () => {
  const { cart, isLoading, updateQuantity, removeItem, clearCart, applyCoupon } = useCart();
  const { showToast } = useToast();
  const [couponCode, setCouponCode] = useState(cart.appliedCouponCode || "");
  const [activeOffers, setActiveOffers] = useState([]);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    setCouponCode(cart.appliedCouponCode || "");
  }, [cart.appliedCouponCode]);

  useEffect(() => {
    api.get("/offers/active").then((response) => setActiveOffers(response.data.offers)).catch(() => setActiveOffers([]));
  }, []);

  const updateItem = async (itemId, quantity) => {
    try {
      await updateQuantity(itemId, Math.max(1, Number(quantity || 1)));
      showToast("Cart updated.");
    } catch (requestError) {
      showToast(requestError.response?.data?.message || "Unable to update Cart.", "error");
    }
  };

  const removeCartItem = async (itemId) => {
    try {
      await removeItem(itemId);
      showToast("Item removed from Cart.");
    } catch (requestError) {
      showToast(requestError.response?.data?.message || "Unable to remove item.", "error");
    }
  };

  const clearAll = async () => {
    try {
      await clearCart();
      showToast("Cart cleared.");
    } catch (requestError) {
      showToast(requestError.response?.data?.message || "Unable to clear Cart.", "error");
    }
  };

  const submitCoupon = async (event) => {
    event.preventDefault();
    setCouponError("");

    try {
      await applyCoupon(couponCode);
      showToast("Coupon applied.");
    } catch (requestError) {
      setCouponError(requestError.response?.data?.message || "Unable to apply coupon.");
    }
  };

  if (isLoading) {
    return <div className="analytics-skeleton">Loading Cart...</div>;
  }

  return (
    <section className="cart-page">
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Cart</p>
          <h1>Your Cart</h1>
        </div>
        {cart.items.length ? (
          <button className="secondary-button" type="button" onClick={clearAll}>
            Clear Cart
          </button>
        ) : null}
      </div>

      {!cart.items.length ? (
        <div className="empty-state">
          <h2>Your Cart is empty</h2>
          <p>Browse Cantley products and keep your picks here.</p>
          <Link className="button-link" to="/shop">
            Shop products
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => {
              const image = getMediaUrl(item.product?.images?.[0]);

              return (
                <article className="cart-item" key={item._id}>
                  <Link className="cart-item-image" to={`/products/${item.product?.slug}`}>
                    <img src={image || "https://placehold.co/220x220/f1f5f9/334155?text=Cantley"} alt={item.product?.name} />
                  </Link>
                  <div>
                    <h2>{item.product?.name}</h2>
                    <p>
                      {item.selectedOptions?.size || "Custom"} / {item.selectedOptions?.color || "Any color"}
                    </p>
                    <strong>Rs. {Number(item.unitPrice).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="quantity-stepper" aria-label={`Quantity for ${item.product?.name}`}>
                    <button type="button" onClick={() => updateItem(item._id, Number(item.quantity || 1) - 1)} disabled={Number(item.quantity || 1) <= 1}>
                      -
                    </button>
                    <input
                      aria-label="Quantity"
                      min="1"
                      type="number"
                      value={item.quantity}
                      onChange={(event) => updateItem(item._id, Number(event.target.value || 1))}
                    />
                    <button type="button" onClick={() => updateItem(item._id, Number(item.quantity || 1) + 1)}>
                      +
                    </button>
                  </div>
                  <button type="button" onClick={() => removeCartItem(item._id)}>
                    Remove
                  </button>
                </article>
              );
            })}
          </div>
          <aside className="cart-summary">
            <h2>Subtotal</h2>
            <strong>Rs. {Number(cart.subtotal || 0).toLocaleString("en-IN")}</strong>
            <p>{cart.itemCount} item{cart.itemCount === 1 ? "" : "s"} in Cart</p>
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
            {activeOffers.length ? (
              <div className="offer-panel">
                <strong>Active offers</strong>
                {activeOffers.map((offer) => (
                  <span key={offer._id}>{offer.title}</span>
                ))}
              </div>
            ) : null}
            {cart.itemCount >= 5 ? (
              <div className="info-panel">
                <strong>Free T-shirt reward unlocked</strong>
                <p>Buy 5 items, get 1 free T-shirt reward will be saved with checkout.</p>
              </div>
            ) : (
              <div className="info-panel">
                <strong>Buy 5 Get 1 Free</strong>
                <p>Add {Math.max(0, 5 - Number(cart.itemCount || 0))} more item(s) to unlock a free T-shirt reward.</p>
              </div>
            )}
            <form className="coupon-form" onSubmit={submitCoupon}>
              <label>
                Coupon code
                <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} />
              </label>
              {couponError ? <div className="form-alert">{couponError}</div> : null}
              <button className="secondary-button" type="submit">
                Apply coupon
              </button>
            </form>
            {cart.discountAmount ? <p>Discount: Rs. {Number(cart.discountAmount).toLocaleString("en-IN")}</p> : null}
            <p>Total: Rs. {Number(cart.totalAmount || cart.subtotal || 0).toLocaleString("en-IN")}</p>
            <Link className="button-link" to="/checkout">
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
};

export default Cart;
