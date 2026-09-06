import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import ProductCard from "../components/ProductCard.jsx";
import SEO from "../components/SEO.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import api from "../services/api.js";
import { getMediaUrl, getOptimizedImageUrl } from "../utils/media.js";
import { breadcrumbSchema, productSchema, productUrl, truncate } from "../utils/seo.js";
import "./ProductDetails.css";

const unique = (items) => [...new Set(items.filter(Boolean))];
const getVariantLabel = (variant, product) => {
  const clothingLabel = [variant.size, variant.color, variant.material, variant.printType, variant.finish]
    .filter(Boolean)
    .join(" / ");
  const dimensionLabel =
    variant.shape || variant.width || variant.height
      ? [variant.shape, `${variant.width || "-"} x ${variant.height || "-"} ${variant.unit || ""}`, variant.material, variant.finish]
          .filter(Boolean)
          .join(" / ")
      : "";
  const label = dimensionLabel || clothingLabel || "Variant";
  const price = Number(product.basePrice || 0) + Number(variant.priceModifier || 0);
  const status = Number(variant.stock || 0) <= 0 ? " - Out of stock" : "";

  return `${label} - Rs. ${price.toLocaleString("en-IN")}${status}`;
};

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, reviewText: "", orderId: "" });
  const [error, setError] = useState("");
  const [productLoadError, setProductLoadError] = useState("");
  const [isProductLoading, setIsProductLoading] = useState(true);
  const [isProductNotFound, setIsProductNotFound] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isWishlistUpdating, setIsWishlistUpdating] = useState(false);
  const [wishlistError, setWishlistError] = useState("");
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
  const [failedGalleryImages, setFailedGalleryImages] = useState(() => new Set());
  const [failedGalleryVideos, setFailedGalleryVideos] = useState(() => new Set());
  const addToCartLockRef = useRef(false);

  useEffect(() => {
    setIsProductLoading(true);
    setProductLoadError("");
    setIsProductNotFound(false);
    api
      .get(`/products/${slug}`)
      .then((response) => {
        setProduct(response.data.product);
        setRelatedProducts(response.data.relatedProducts || []);
      })
      .catch((requestError) => {
        setProduct(null);
        if (requestError.response?.status === 404) setIsProductNotFound(true);
        else setProductLoadError(requestError.response?.data?.message || "Unable to load product.");
      })
      .finally(() => setIsProductLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product?._id) return;

    api
      .get(`/products/${product._id}/reviews`)
      .then((response) => {
        setReviews(response.data.reviews || []);
        setReviewError("");
      })
      .catch((requestError) => {
        setReviews([]);
        setReviewError(requestError.response?.data?.message || "Unable to load product reviews.");
      });

    if (isAuthenticated) {
      Promise.all([api.get("/orders/my-orders"), api.get("/reviews/my-reviews")])
        .then(([ordersResponse, reviewsResponse]) => {
          const alreadyReviewed = new Set(
            (reviewsResponse.data.reviews || [])
              .filter((review) => (review.product?._id || review.product) === product._id)
              .map((review) => String(review.order))
          );
          const eligibleOrders = (ordersResponse.data.orders || []).filter((order) =>
            order.orderStatus === "Delivered" &&
            order.paymentStatus === "Paid" &&
            Number(order.remainingCodDue || 0) === 0 &&
            !alreadyReviewed.has(String(order._id)) &&
            order.items.some((item) => item.product === product._id || item.product?._id === product._id)
          );
          setMyOrders(eligibleOrders);
          setReviewForm((current) => ({ ...current, orderId: eligibleOrders[0]?._id || "" }));
        })
        .catch(() => {
          setMyOrders([]);
        });
    }
    if (!relatedProducts.length && product.category?.slug) {
      api.get("/products", { params: { category: product.category.slug, limit: 4 } }).then((response) => {
        setRelatedProducts(response.data.products.filter((item) => item._id !== product._id));
      }).catch(() => setRelatedProducts([]));
    }
  }, [isAuthenticated, product?._id, relatedProducts.length]);

  useEffect(() => {
    if (isAuthenticated && product?._id) {
      api.post(`/recently-viewed/${product._id}`).catch(() => {});
    }
  }, [isAuthenticated, product?._id]);

  const options = useMemo(() => {
    const variants = product?.variants || [];
    return {
      sizes: unique(variants.map((variant) => variant.size)),
      colors: unique(variants.map((variant) => variant.color)),
      materials: unique(variants.map((variant) => variant.material)),
      printTypes: unique(variants.map((variant) => variant.printType)),
      finishes: unique(variants.map((variant) => variant.finish))
    };
  }, [product]);
  const galleryFallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 1125'%3E%3Crect width='900' height='1125' fill='%23f1f1ed'/%3E%3Ctext x='450' y='562.5' text-anchor='middle' dominant-baseline='middle' fill='%23334155' font-family='Arial,sans-serif' font-size='48'%3ECantley%3C/text%3E%3C/svg%3E";
  const galleryImages = useMemo(() => {
    const uniqueImages = new Set();
    return (product?.images || []).reduce((images, image) => {
      const source = getOptimizedImageUrl(image, { width: 1400 });
      if (source && !uniqueImages.has(source)) {
        uniqueImages.add(source);
        images.push(source);
      }
      return images;
    }, []);
  }, [product?.images]);
  const videoUrl = getMediaUrl(product?.video);
  const galleryMedia = useMemo(() => {
    const media = galleryImages.map((url) => ({ type: "image", url }));
    if (videoUrl) media.push({ type: "video", url: videoUrl });
    return media.length ? media : [{ type: "image", url: galleryFallback }];
  }, [galleryImages, videoUrl]);
  const activeGalleryMedia = galleryMedia[selectedGalleryIndex] || galleryMedia[0];
  const mainGalleryImage = failedGalleryImages.has(activeGalleryMedia.url) ? galleryFallback : activeGalleryMedia.url;
  const hasMultipleGalleryMedia = galleryMedia.length > 1;
  const optionDetails = [
    ["Sizes", options.sizes],
    ["Colors", options.colors],
    ["Materials", options.materials],
    ["Print types", options.printTypes],
    ["Finishes", options.finishes]
  ].filter(([, values]) => values.length);

  useEffect(() => {
    setSelectedGalleryIndex(0);
    setFailedGalleryImages(new Set());
    setFailedGalleryVideos(new Set());
  }, [product?._id]);
  const selectedVariant = product?.variants?.[selectedVariantIndex];
  const finalPrice = Number(product?.basePrice || 0) + Number(selectedVariant?.priceModifier || 0);
  const isSelectedVariantOutOfStock = selectedVariant && Number(selectedVariant.stock || 0) <= 0;
  const ratingCount = Number(product?.ratingCount || 0);
  const hasRating = Number.isFinite(ratingCount) && ratingCount > 0;
  const wished = product?._id ? isWishlisted(product._id) : false;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/products/${slug}` } } });
      return;
    }

    if (addToCartLockRef.current) return;
    addToCartLockRef.current = true;
    setIsAdding(true);
    setError("");

    try {
      await addToCart({
        productId: product._id,
        quantity,
        variantSku: selectedVariant?.sku || "",
        selectedOptions: {
          size: selectedVariant?.size || "",
          color: selectedVariant?.color || "",
          material: selectedVariant?.material || "",
          printType: selectedVariant?.printType || "",
          finish: selectedVariant?.finish || ""
        }
      });
      showToast("Added to Cart.");
      navigate("/cart");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to add product to Cart.");
    } finally {
      addToCartLockRef.current = false;
      setIsAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/products/${slug}` } } });
      return;
    }

    setIsWishlistUpdating(true);
    setWishlistError("");
    try {
      const added = await toggleWishlist(product._id);
      showToast(added ? "Added to wishlist." : "Removed from wishlist.");
    } catch (requestError) {
      setWishlistError(requestError.response?.data?.message || "Unable to update wishlist.");
    } finally {
      setIsWishlistUpdating(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewError("");

    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/products/${slug}` } } });
      return;
    }

    if (!reviewForm.orderId) {
      setReviewError("You can review only purchased products.");
      return;
    }

    setIsReviewing(true);

    try {
      const submission = await api.post("/reviews", {
        productId: product._id,
        orderId: reviewForm.orderId,
        rating: reviewForm.rating,
        reviewText: reviewForm.reviewText
      });
      const response = await api.get(`/products/${product._id}/reviews`);
      setReviews(response.data.reviews);
      setReviewForm((current) => ({ ...current, reviewText: "" }));
      setMyOrders((current) => current.filter((order) => order._id !== reviewForm.orderId));
      setReviewForm((current) => ({ ...current, orderId: "" }));
      showToast(submission.data.rewardGranted ? "Review submitted. Rs. 10 wallet credit added." : "Review submitted.");
    } catch (requestError) {
      setReviewError(requestError.response?.data?.message || "Unable to submit review.");
    } finally {
      setIsReviewing(false);
    }
  };

  if (isProductLoading) {
    return (
      <section className="product-detail-wrapper product-state" aria-busy="true" aria-label="Loading product">
        <div className="product-loading-grid" aria-hidden="true">
          <div className="product-loading-gallery" />
          <div className="product-loading-copy"><span /><span /><span /><span /></div>
        </div>
        <p className="sr-only" role="status">Loading product...</p>
      </section>
    );
  }

  if (isProductNotFound || productLoadError || !product) {
    return (
      <section className="product-detail-wrapper product-state">
        <div className="product-state-card" role={productLoadError ? "alert" : undefined}>
          <p className="eyebrow">{isProductNotFound ? "Product not found" : "Unable to load"}</p>
          <h1>{isProductNotFound ? "This product is no longer available" : "We couldn't load this product"}</h1>
          <p>{productLoadError || (isProductNotFound ? "It may have moved or is no longer listed." : "Please return to the shop and try again.")}</p>
          <Link className="button-link" to="/shop">Back to Shop</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="product-detail-wrapper">
      <SEO
        title={product.name}
        description={truncate(product.shortDescription || product.description)}
        image={getOptimizedImageUrl(product.images?.[0], { width: 1200 })}
        canonical={productUrl(product)}
        schema={[
          productSchema(product, reviews),
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: product.category?.name || "Shop", url: product.category?.slug ? `/shop?category=${product.category.slug}` : "/shop" },
            { name: product.name, url: `/products/${product.slug}` }
          ])
        ]}
      />
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: product.category?.name || "Shop", href: product.category?.slug ? `/shop?category=${product.category.slug}` : "/shop" },
        { label: product.name }
      ]} />
      <div className="product-detail-page">
        <div className="product-gallery product-gallery--details">
          {hasMultipleGalleryMedia ? (
            <div className="product-gallery-thumbs" aria-label="Product media">
              {galleryMedia.map((media, index) => (
                <button
                  key={`${media.type}-${media.url}`}
                  className={index === selectedGalleryIndex ? "active" : ""}
                  type="button"
                  onClick={() => setSelectedGalleryIndex(index)}
                  aria-label={media.type === "video" ? "View product video 1" : "View image " + (index + 1) + " of " + galleryImages.length + " for " + product.name}
                  aria-pressed={index === selectedGalleryIndex}
                >
                  {media.type === "image" ? (
                    <img
                      src={failedGalleryImages.has(media.url) ? galleryFallback : media.url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={() => setFailedGalleryImages((current) => new Set(current).add(media.url))}
                    />
                  ) : <span className="product-video-thumb" aria-hidden="true">▶</span>}
                </button>
              ))}
            </div>
          ) : null}
          <div className="product-gallery-main">
            {activeGalleryMedia.type === "video" ? (
              failedGalleryVideos.has(activeGalleryMedia.url) ? (
                <div className="product-video-unavailable" role="status">Product video unavailable.</div>
              ) : (
                <video controls playsInline preload="metadata" src={activeGalleryMedia.url} onError={() => setFailedGalleryVideos((current) => new Set(current).add(activeGalleryMedia.url))} />
              )
            ) : (
              <img
                className="zoomable-image"
                src={mainGalleryImage}
                alt={product.name || "Cantley product"}
                loading="eager"
                decoding="async"
                onError={() => setFailedGalleryImages((current) => new Set(current).add(activeGalleryMedia.url))}
              />
            )}
            {hasMultipleGalleryMedia ? (
              <span className="product-gallery-count" aria-hidden="true">
                {selectedGalleryIndex + 1} / {galleryMedia.length}
              </span>
            ) : null}
          </div>
        </div>

      <div className="product-detail-copy">
        <header className="product-purchase-header">
          {product.category?.name || product.productType ? <p className="eyebrow">{product.category?.name || product.productType}</p> : null}
          <h1>{product.name}</h1>
          {hasRating ? (
            <p className="rating-line" aria-label={Number(product.ratingAverage || 0).toFixed(1) + " out of 5 from " + ratingCount + " reviews"}>
              <span aria-hidden="true">Rating</span>
              <strong>{Number(product.ratingAverage || 0).toFixed(1)}</strong>
              <span>{ratingCount === 1 ? "1 review" : ratingCount + " reviews"}</span>
            </p>
          ) : null}
          <strong className="detail-price">Rs. {finalPrice.toLocaleString("en-IN")}</strong>
        </header>
        {product.shortDescription || product.description ? <p className="lead">{product.shortDescription || product.description}</p> : null}
        {error ? <div className="form-alert">{error}</div> : null}

        {optionDetails.length ? <div className="option-block">
          <h2>Options</h2>
          <dl>
            {optionDetails.map(([label, values]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{values.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </div> : null}

        <div className="option-block purchase-options-block">
          {product.variants?.length ? (
            <label className="variant-select-field">
              Variant
              <select
                value={selectedVariantIndex}
                onChange={(event) => setSelectedVariantIndex(Number(event.target.value))}
              >
                {product.variants.map((variant, index) => (
                  <option
                    disabled={Number(variant.stock || 0) <= 0}
                    key={`${variant.sku || index}-${index}`}
                    value={index}
                  >
                    {getVariantLabel(variant, product) || `Variant ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {selectedVariant ? (
            <p className={"variant-availability " + (isSelectedVariantOutOfStock ? "is-unavailable" : "is-available")}>
              <span>{isSelectedVariantOutOfStock ? "Out of stock" : "In stock"}</span>
              {selectedVariant.sku ? <><span className="metadata-separator" aria-hidden="true">·</span><span>SKU: {selectedVariant.sku}</span></> : null}
            </p>
          ) : null}
          <label className="quantity-field">
            Quantity
            <input
              disabled={isSelectedVariantOutOfStock}
              min="1"
              max={selectedVariant?.stock || undefined}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value || 1)))}
            />
          </label>
          <button
            className="primary-button purchase-add-button"
            type="button"
            disabled={isAdding || isSelectedVariantOutOfStock}
            onClick={handleAddToCart}
          >
            {isSelectedVariantOutOfStock ? "Out of stock" : isAdding ? "Adding..." : "Add to Cart"}
          </button>
          <button className={`secondary-button wishlist-inline ${wished ? "active" : ""}`} type="button" disabled={isWishlistUpdating} onClick={handleWishlist} aria-pressed={wished} aria-label={isWishlistUpdating ? "Updating wishlist" : wished ? "Remove product from wishlist" : "Add product to wishlist"}>
            {isWishlistUpdating ? "Updating..." : wished ? "Saved to Wishlist" : "Add to Wishlist"}
          </button>
          {wishlistError ? <div className="form-alert" role="alert">{wishlistError}</div> : null}
          <Link
            className="button-link purchase-customize-link"
            state={{ product }}
            to={`/design-studio?product=${product._id}&slug=${product.slug}&type=${product.productType === "hoodie" ? "hoodie" : product.productType === "sticker" ? "sticker" : product.productType === "label" ? "label" : "tshirt"}`}
          >
            Customize Design
          </Link>
          <Link
            className="secondary-button purchase-save-design"
            state={{ product }}
            to={`/design-studio?product=${product._id}&slug=${product.slug}&type=${product.productType === "hoodie" ? "hoodie" : product.productType === "sticker" ? "sticker" : product.productType === "label" ? "label" : "tshirt"}`}
          >
            Save Design
          </Link>
        </div>

        <section className="option-block reviews-section" aria-labelledby="reviews-heading">
          <h2 id="reviews-heading">Reviews</h2>
          {hasRating ? (
            <div className="review-summary" aria-label={Number(product.ratingAverage || 0).toFixed(1) + " out of 5 from " + ratingCount + " reviews"}>
              <strong>{Number(product.ratingAverage || 0).toFixed(1)}</strong>
              <span>out of 5</span>
              <span>{ratingCount === 1 ? "1 review" : ratingCount + " reviews"}</span>
            </div>
          ) : null}
          {reviews.length ? (
            <div className="review-list">
              {reviews.map((review) => (
                <article className="review-item" key={review._id}>
                  <div className="review-item-header">
                    <strong>{review.user?.name || "Customer"}</strong>
                    <span className="review-rating" aria-label={review.rating + " out of 5"}>{review.rating}/5</span>
                  </div>
                  {review.createdAt ? (
                    <time dateTime={review.createdAt}>
                      {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </time>
                  ) : null}
                  <p>{review.reviewText || "No written review."}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="review-empty">No reviews yet.</p>
          )}
        </section>

        <form className="option-block review-form" onSubmit={submitReview}>
          <h2>Write a review</h2>
          <p>Earn Rs. 10 wallet credit for one eligible written review per product per delivered and fully paid order.</p>
          {reviewError ? <div className="form-alert" role="alert">{reviewError}</div> : null}
          {!myOrders.length ? <p>Reviews become available after your order is delivered and fully paid.</p> : null}
          <label>
            Purchased order
            <select
              value={reviewForm.orderId}
              onChange={(event) => setReviewForm((current) => ({ ...current, orderId: event.target.value }))}
            >
              <option value="">Select order</option>
              {myOrders.map((order) => (
                <option key={order._id} value={order._id}>
                  {order.orderNumber}
                </option>
              ))}
            </select>
          </label>
          <label>
            Rating
            <select
              value={reviewForm.rating}
              onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))}
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating}
                </option>
              ))}
            </select>
          </label>
          <label>
            Review text
            <textarea
              rows="4"
              value={reviewForm.reviewText}
              onChange={(event) => setReviewForm((current) => ({ ...current, reviewText: event.target.value }))}
            />
          </label>
          <button className="primary-button review-submit" disabled={isReviewing || !myOrders.length} type="submit">
            {isReviewing ? "Submitting..." : "Submit review"}
          </button>
        </form>
      </div>
      </div>
      {relatedProducts.length ? (
        <div className="catalog-page related-products">
          <div className="page-heading"><p className="eyebrow">Related</p><h2>More from this collection</h2></div>
          <div className="product-grid">{relatedProducts.map((item) => <ProductCard key={item._id} product={item} />)}</div>
        </div>
      ) : null}
    </section>
  );
};

export default ProductDetails;
