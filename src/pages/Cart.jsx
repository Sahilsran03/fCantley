import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";
import "./Cart.css";

const optionLabels = {
  size: "Size",
  color: "Color",
  material: "Material",
  printType: "Print type",
  finish: "Finish"
};

const Cart = () => {
  const { cart, isLoading, updateQuantity, removeItem, clearCart, applyCoupon } = useCart();
  const { showToast } = useToast();
  const [couponCode, setCouponCode] = useState(cart.appliedCouponCode || "");
  const [activeOffers, setActiveOffers] = useState([]);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [pendingItemIds, setPendingItemIds] = useState(() => new Set());

  useEffect(() => {
    setCouponCode(cart.appliedCouponCode || "");
  }, [cart.appliedCouponCode]);

  useEffect(() => {
    api.get("/offers/active").then((response) => setActiveOffers(response.data.offers)).catch(() => setActiveOffers([]));
  }, []);

  const updateItem = async (itemId, quantity) => {
    if (pendingItemIds.has(itemId)) return;
    setPendingItemIds((current) => new Set(current).add(itemId));
    try {
      await updateQuantity(itemId, Math.max(1, Number(quantity || 1)));
      showToast("Cart updated.");
    } catch (requestError) {
      showToast(requestError.response?.data?.message || "Unable to update Cart.", "error");
    } finally {
      setPendingItemIds((current) => {
        const next = new Set(current);
        next.delete(itemId);
        return next;
      });
    }
  };

  const removeCartItem = async (itemId) => {
    if (pendingItemIds.has(itemId)) return;
    setPendingItemIds((current) => new Set(current).add(itemId));
    try {
      await removeItem(itemId);
      showToast("Item removed from Cart.");
    } catch (requestError) {
      showToast(requestError.response?.data?.message || "Unable to remove item.", "error");
    } finally {
      setPendingItemIds((current) => {
        const next = new Set(current);
        next.delete(itemId);
        return next;
      });
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
    setIsApplyingCoupon(true);

    try {
      await applyCoupon(couponCode);
      showToast("Coupon applied.");
    } catch (requestError) {
      setCouponError(requestError.response?.data?.message || "Unable to apply coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  if (isLoading) {
    return (
      <section className="cart-page cart-loading-state" aria-busy="true">
        <div className="cart-loading-heading" aria-hidden="true" />
        <div className="cart-loading-layout" aria-hidden="true">
          <div className="cart-loading-items"><span /><span /></div>
          <div className="cart-loading-summary" />
        </div>
        <p className="sr-only" role="status">Loading Cart...</p>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Cart</p>
          <h1>Your Cart</h1>
          {cart.items.length ? <p className="cart-heading-count">{cart.itemCount} item{cart.itemCount === 1 ? "" : "s"}</p> : null}
        </div>
        {cart.items.length ? (
          <button className="secondary-button" type="button" onClick={clearAll}>
            Clear Cart
          </button>
        ) : null}
      </div>

      {!cart.items.length ? (
        <div className="empty-state cart-empty-state">
          <h2>Your Cart is empty</h2>
          <p>Browse Cantley products and keep your picks here.</p>
          <Link className="button-link" to="/shop">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => {
              const image = getMediaUrl(item.product?.images?.[0]);
              const selectedOptions = Object.entries(item.selectedOptions || {}).filter(([, value]) => value);
              const isItemPending = pendingItemIds.has(item._id);
              const itemDetails = (
                <div className="cart-item-details">
                  <h2>{item.product?.name}</h2>
                  {selectedOptions.length || item.variantSku ? (
                    <dl className="cart-item-options">
                      {selectedOptions.map(([key, value]) => (
                        <div key={key}><dt>{optionLabels[key] || key}</dt><dd>{value}</dd></div>
                      ))}
                      {item.variantSku ? <div><dt>SKU</dt><dd>{item.variantSku}</dd></div> : null}
                    </dl>
                  ) : null}
                  <p className="cart-item-unit-price">Rs. {Number(item.unitPrice).toLocaleString("en-IN")}</p>
                </div>
              );

              return (
                <article className="cart-item" key={item._id}>
                  {item.product?.slug ? (
                    <Link className="cart-item-image" to={`/products/${item.product.slug}`}>
                      <img src={image || "https://placehold.co/220x220/f1f5f9/334155?text=Cantley"} alt={item.product?.name || "Cart product"} />
                    </Link>
                  ) : (
                    <div className="cart-item-image">
                      <img src={image || "https://placehold.co/220x220/f1f5f9/334155?text=Cantley"} alt={item.product?.name || "Cart product"} />
                    </div>
                  )}
                  {item.product?.slug ? <Link className="cart-item-details-link" to={`/products/${item.product.slug}`}>{itemDetails}</Link> : itemDetails}
                  <div className="cart-item-controls">
                    <div>
                      <span className="cart-control-label">Quantity</span>
                      <div className="quantity-stepper" aria-label={`Quantity for ${item.product?.name}`}>
                        <button aria-label={`Decrease quantity for ${item.product?.name}`} type="button" onClick={() => updateItem(item._id, Number(item.quantity || 1) - 1)} disabled={isItemPending || Number(item.quantity || 1) <= 1}>−</button>
                        <input aria-label={`Quantity for ${item.product?.name}`} disabled={isItemPending} min="1" type="number" value={item.quantity} onChange={(event) => updateItem(item._id, Number(event.target.value || 1))} />
                        <button aria-label={`Increase quantity for ${item.product?.name}`} type="button" onClick={() => updateItem(item._id, Number(item.quantity || 1) + 1)} disabled={isItemPending}>+</button>
                      </div>
                    </div>
                    <div className="cart-item-subtotal">
                      <span className="cart-control-label">Subtotal</span>
                      <strong>Rs. {(item.unitPrice * item.quantity).toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                  <button className="cart-item-remove" type="button" disabled={isItemPending} onClick={() => removeCartItem(item._id)} aria-label={`Remove ${item.product?.name} from Cart`}>
                    {isItemPending ? "Updating..." : "Remove"}
                  </button>
                </article>
              );
            })}
          </div>
          <aside className="cart-summary">
            <header className="cart-summary-header">
              <p className="eyebrow">Your order</p>
              <h2>Order Summary</h2>
            </header>

            <form className="coupon-form cart-coupon-form" onSubmit={submitCoupon}>
              <label htmlFor="cart-coupon-code">Promo code</label>
              <div className="cart-coupon-row">
                <input
                  id="cart-coupon-code"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  placeholder="Enter code"
                  disabled={isApplyingCoupon}
                />
                <button className="secondary-button" type="submit" disabled={isApplyingCoupon || !couponCode.trim()}>
                  {isApplyingCoupon ? "Applying..." : "Apply"}
                </button>
              </div>
              {couponError ? <div className="form-alert" role="alert">{couponError}</div> : null}
              {cart.appliedCouponCode ? (
                <p className="cart-applied-coupon"><span>Applied</span><strong>{cart.appliedCouponCode}</strong></p>
              ) : null}
            </form>

            {cart.appliedOffers?.length ? (
              <div className="cart-offers cart-applied-offers">
                <h3>Applied offers</h3>
                {cart.appliedOffers.map((offer, index) => (
                  <p key={`${offer.title}-${index}`}>
                    <span>{offer.title}</span>
                    {offer.discountAmount ? <strong>− Rs. {Number(offer.discountAmount).toLocaleString("en-IN")}</strong> : null}
                  </p>
                ))}
              </div>
            ) : null}
            {activeOffers.length ? (
              <div className="cart-offers cart-active-offers">
                <h3>Available offers</h3>
                {activeOffers.map((offer) => (
                  <p key={offer._id}>{offer.title}</p>
                ))}
              </div>
            ) : null}
            {cart.itemCount >= 5 ? (
              <div className="cart-reward-message">
                <strong>Free T-shirt reward unlocked</strong>
                <p>Buy 5 items, get 1 free T-shirt reward will be saved with checkout.</p>
              </div>
            ) : (
              <div className="cart-reward-message">
                <strong>Buy 5 Get 1 Free</strong>
                <p>Add {Math.max(0, 5 - Number(cart.itemCount || 0))} more item(s) to unlock a free T-shirt reward.</p>
              </div>
            )}

            <dl className="cart-financials">
              <div><dt>Subtotal</dt><dd>Rs. {Number(cart.subtotal || 0).toLocaleString("en-IN")}</dd></div>
              {cart.discountAmount ? (
                <div className="cart-discount-row"><dt>Discount</dt><dd>− Rs. {Number(cart.discountAmount).toLocaleString("en-IN")}</dd></div>
              ) : null}
              <div className="cart-total-row"><dt>Total</dt><dd>Rs. {Number(cart.totalAmount || cart.subtotal || 0).toLocaleString("en-IN")}</dd></div>
            </dl>

            <Link className="button-link cart-checkout-cta" to="/checkout">
              Proceed to Checkout
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
};

export default Cart;
