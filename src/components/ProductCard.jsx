import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { getOptimizedImageUrl } from "../utils/media.js";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isWishlistPending, setIsWishlistPending] = useState(false);
  const quickViewTriggerRef = useRef(null);
  const quickViewDialogRef = useRef(null);
  const productName = product.name || "Cantley product";
  const image =
    getOptimizedImageUrl(product.images?.[0], { width: 640 }) ||
    "https://placehold.co/640x480/f1f5f9/334155?text=Cantley";
  const wished = isWishlisted(product._id);

  const stockSummary = useMemo(() => {
    const variants = product.variants;
    if (!Array.isArray(variants) || !variants.length) return null;

    const hasCompleteStockData = variants.every(
      (variant) =>
        variant &&
        variant.stock !== undefined &&
        variant.stock !== null &&
        Number.isFinite(Number(variant.stock))
    );
    if (!hasCompleteStockData) return null;

    const totalStock = variants.reduce(
      (sum, variant) => sum + Number(variant.stock),
      0
    );
    return totalStock <= 0 ? { label: "Out of stock", className: "stock-out" } : null;
  }, [product.variants]);

  const minVariantPrice = (product.variants || []).reduce((lowest, variant) => {
    const price = Number(product.basePrice || 0) + Number(variant.priceModifier || 0);
    return lowest === null ? price : Math.min(lowest, price);
  }, null);
  const displayPrice = minVariantPrice ?? Number(product.basePrice || 0);
  const categoryLabel = product.category?.name || product.productType;
  const ratingCount = Number(product.ratingCount || 0);
  const hasRating = Number.isFinite(ratingCount) && ratingCount > 0;
  const shortInformation = product.shortDescription || product.description;
  const badge =
    stockSummary ||
    (product.isFeatured ? { label: "Featured", className: "featured" } : null);
  const quickViewTitleId = `quick-view-title-${product._id || product.slug || "product"}`;

  const closeQuickView = () => {
    setIsQuickViewOpen(false);
    window.setTimeout(() => quickViewTriggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!isQuickViewOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const dialog = quickViewDialogRef.current;
    const focusDialog = () =>
      dialog?.querySelector("[data-quick-view-focus]")?.focus();

    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(focusDialog);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeQuickView();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isQuickViewOpen]);

  const handleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isWishlistPending) return;

    if (!isAuthenticated) {
      showToast("Please login to save wishlist items.", "error");
      return;
    }

    setIsWishlistPending(true);
    try {
      const added = await toggleWishlist(product._id);
      showToast(added ? "Added to wishlist." : "Removed from wishlist.");
    } catch {
      showToast("Unable to update wishlist. Please try again.", "error");
    } finally {
      setIsWishlistPending(false);
    }
  };

  return (
    <article className="product-card product-card--premium">
      <Link
        to={`/products/${product.slug}`}
        className="product-card-image"
        aria-label={`View ${productName}`}
      >
        <img
          src={image}
          alt={productName}
          loading="lazy"
          decoding="async"
          sizes="(max-width: 768px) 50vw, (max-width: 1279px) 33vw, 25vw"
        />
      </Link>

      {badge ? (
        <div className="product-badge-stack">
          <span className={badge.className}>{badge.label}</span>
        </div>
      ) : null}

      <button
        className={`wishlist-button ${wished ? "active" : ""}`}
        type="button"
        onClick={handleWishlist}
        aria-label={`${wished ? "Remove" : "Add"} ${productName} ${wished ? "from" : "to"} wishlist`}
        aria-pressed={wished}
        disabled={isWishlistPending}
      >
        <span aria-hidden="true">{wished ? "\u2665" : "\u2661"}</span>
      </button>

      <button
        ref={quickViewTriggerRef}
        className="quick-view-button"
        type="button"
        onClick={() => setIsQuickViewOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isQuickViewOpen}
      >
        Quick view
      </button>

      <div className="product-card-body">
        {categoryLabel ? <p className="product-card-category">{categoryLabel}</p> : null}
        <h2>
          <Link to={`/products/${product.slug}`}>{productName}</Link>
        </h2>
        <p className="product-card-price">
          {minVariantPrice !== null ? "From " : ""}Rs.{" "}
          {Number(displayPrice || 0).toLocaleString("en-IN")}
        </p>
        {hasRating ? (
          <p
            className="rating-preview"
            aria-label={`Rated ${Number(product.ratingAverage || 0).toFixed(1)} out of 5 from ${ratingCount} reviews`}
          >
            <span aria-hidden="true">{"\u2605"}</span>
            <strong>{Number(product.ratingAverage || 0).toFixed(1)}</strong>
            <span>({ratingCount})</span>
          </p>
        ) : null}
      </div>

      {isQuickViewOpen
        ? createPortal(
            <div className="quick-view-modal">
              <div
                className="quick-view-backdrop"
                aria-hidden="true"
                onMouseDown={closeQuickView}
              />
              <section
                ref={quickViewDialogRef}
                className="quick-view-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby={quickViewTitleId}
              >
                <button
                  className="quick-view-close"
                  type="button"
                  data-quick-view-focus
                  onClick={closeQuickView}
                  aria-label={`Close quick view for ${productName}`}
                >
                  Close
                </button>
                <div className="quick-view-media">
                  <img src={image} alt={productName} />
                </div>
                <div className="quick-view-content">
                  {categoryLabel ? (
                    <p className="quick-view-category">{categoryLabel}</p>
                  ) : null}
                  <h2 id={quickViewTitleId}>{productName}</h2>
                  <p className="quick-view-price">
                    {minVariantPrice !== null ? "From " : ""}Rs.{" "}
                    {Number(displayPrice || 0).toLocaleString("en-IN")}
                  </p>
                  {hasRating ? (
                    <p
                      className="quick-view-rating"
                      aria-label={`Rated ${Number(product.ratingAverage || 0).toFixed(1)} out of 5 from ${ratingCount} reviews`}
                    >
                      <span aria-hidden="true">{"\u2605"}</span>
                      <strong>{Number(product.ratingAverage || 0).toFixed(1)}</strong>
                      <span>({ratingCount})</span>
                    </p>
                  ) : null}
                  {shortInformation ? (
                    <p className="quick-view-description">{shortInformation}</p>
                  ) : null}
                  {stockSummary ? (
                    <span className={`status-badge ${stockSummary.className}`}>
                      {stockSummary.label}
                    </span>
                  ) : null}
                  <Link
                    className="button-link quick-view-product-link"
                    to={`/products/${product.slug}`}
                    onClick={() => setIsQuickViewOpen(false)}
                  >
                    View product
                  </Link>
                </div>
              </section>
            </div>,
            document.body
          )
        : null}
    </article>
  );
};

export default memo(ProductCard);
