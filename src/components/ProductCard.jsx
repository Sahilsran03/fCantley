import React, { memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { getOptimizedImageUrl } from "../utils/media.js";

const ProductCard = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const image =
    getOptimizedImageUrl(product.images?.[0], { width: 640 }) || "https://placehold.co/640x480/f1f5f9/334155?text=Cantley";
  const wished = isWishlisted(product._id);
  const stockSummary = useMemo(() => {
    const variants = product.variants || [];
    if (!variants.length) return { label: "Available", className: "stock-available" };
    const totalStock = variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
    if (totalStock <= 0) return { label: "Out of stock", className: "stock-out" };
    if (totalStock <= 5) return { label: "Low stock", className: "stock-low" };
    return { label: "In stock", className: "stock-available" };
  }, [product.variants]);
  const minVariantPrice = (product.variants || []).reduce((lowest, variant) => {
    const price = Number(product.basePrice || 0) + Number(variant.priceModifier || 0);
    return lowest === null ? price : Math.min(lowest, price);
  }, null);
  const displayPrice = minVariantPrice ?? Number(product.basePrice || 0);
  const hasVariantDeal = (product.variants || []).some((variant) => Number(variant.priceModifier || 0) < 0);

  const handleWishlist = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      showToast("Please login to save wishlist items.", "error");
      return;
    }

    const added = await toggleWishlist(product._id);
    showToast(added ? "Added to wishlist." : "Removed from wishlist.");
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`} className="product-card-image">
        <img src={image} alt={product.name} loading="lazy" decoding="async" sizes="(max-width: 760px) 100vw, 33vw" />
      </Link>
      <div className="product-badge-stack">
        {product.isFeatured ? <span>Featured</span> : null}
        {hasVariantDeal ? <span>Deal</span> : null}
        <span className={stockSummary.className}>{stockSummary.label}</span>
      </div>
      <button className={`wishlist-button ${wished ? "active" : ""}`} type="button" onClick={handleWishlist} aria-label="Toggle wishlist">
        {wished ? "Saved" : "Save"}
      </button>
      <div className="product-card-body">
        <p className="eyebrow">{product.category?.name || product.productType}</p>
        <h2>
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h2>
        <p>{product.shortDescription || product.description || "Custom-ready Cantley product."}</p>
        <div className="rating-preview">
          <strong>{Number(product.ratingAverage || 0).toFixed(1)}</strong>
          <span>{product.ratingCount || 0} reviews</span>
        </div>
        <div className="product-card-meta">
          <strong>{minVariantPrice !== null ? "From " : ""}Rs. {Number(displayPrice || 0).toLocaleString("en-IN")}</strong>
          <button className="quick-view-button" type="button" onClick={() => setIsQuickViewOpen(true)}>Quick view</button>
        </div>
      </div>
      {isQuickViewOpen ? (
        <div className="quick-view-modal" role="dialog" aria-modal="true" aria-label={`${product.name} quick view`}>
          <button className="quick-view-backdrop" type="button" aria-label="Close quick view" onClick={() => setIsQuickViewOpen(false)} />
          <div className="quick-view-panel">
            <button className="quick-view-close" type="button" onClick={() => setIsQuickViewOpen(false)}>Close</button>
            <img src={image} alt={product.name} />
            <div>
              <p className="eyebrow">{product.category?.name || product.productType}</p>
              <h2>{product.name}</h2>
              <p>{product.shortDescription || product.description || "Custom-ready Cantley product."}</p>
              <strong>Rs. {Number(displayPrice || 0).toLocaleString("en-IN")}</strong>
              <span className={`status-badge ${stockSummary.className}`}>{stockSummary.label}</span>
              <Link className="button-link" to={`/products/${product.slug}`}>View product</Link>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
};

export default memo(ProductCard);
