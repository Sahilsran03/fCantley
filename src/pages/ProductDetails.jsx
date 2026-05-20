import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import ProductGallery from "../components/ProductGallery.jsx";
import ProductCard from "../components/ProductCard.jsx";
import SEO from "../components/SEO.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import api from "../services/api.js";
import { getMediaUrl, getOptimizedImageUrl } from "../utils/media.js";
import { breadcrumbSchema, productSchema, productUrl, truncate } from "../utils/seo.js";

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
  const [reviewError, setReviewError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    api
      .get(`/products/${slug}`)
      .then((response) => {
        setProduct(response.data.product);
        setRelatedProducts(response.data.relatedProducts || []);
        setError("");
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Unable to load product.");
      });
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
      api
        .get("/orders/my-orders")
        .then((response) => {
          const eligibleOrders = (response.data.orders || []).filter((order) =>
            order.items.some((item) => item.product === product._id || item.product?._id === product._id)
          );
          setMyOrders(eligibleOrders);
          setReviewForm((current) => ({ ...current, orderId: eligibleOrders[0]?._id || "" }));
        })
        .catch(() => setMyOrders([]));
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
  const videoUrl = getMediaUrl(product?.video);
  const selectedVariant = product?.variants?.[selectedVariantIndex];
  const finalPrice = Number(product?.basePrice || 0) + Number(selectedVariant?.priceModifier || 0);
  const isSelectedVariantOutOfStock = selectedVariant && Number(selectedVariant.stock || 0) <= 0;
  const wished = product?._id ? isWishlisted(product._id) : false;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/products/${slug}` } } });
      return;
    }

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
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to add product to Cart.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/products/${slug}` } } });
      return;
    }

    const added = await toggleWishlist(product._id);
    showToast(added ? "Added to wishlist." : "Removed from wishlist.");
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
      await api.post("/reviews", {
        productId: product._id,
        orderId: reviewForm.orderId,
        rating: reviewForm.rating,
        reviewText: reviewForm.reviewText
      });
      const response = await api.get(`/products/${product._id}/reviews`);
      setReviews(response.data.reviews);
      setReviewForm((current) => ({ ...current, reviewText: "" }));
      showToast("Review submitted. Rs. 10 wallet reward added for text reviews.");
    } catch (requestError) {
      setReviewError(requestError.response?.data?.message || "Unable to submit review.");
    } finally {
      setIsReviewing(false);
    }
  };

  if (error) {
    return <div className="form-alert">{error}</div>;
  }

  if (!product) {
    return <p>Loading product...</p>;
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
        <ProductGallery images={product.images} name={product.name} />

      <div className="product-detail-copy">
        <p className="eyebrow">{product.category?.name || product.productType}</p>
        <h1>{product.name}</h1>
        <p className="lead">{product.shortDescription || product.description}</p>
        <strong className="detail-price">Rs. {finalPrice.toLocaleString("en-IN")}</strong>
        <p className="rating-line">
          {Number(product.ratingAverage || 0).toFixed(1)} rating - {product.ratingCount || 0} reviews
        </p>
        {error ? <div className="form-alert">{error}</div> : null}

        <div className="option-block">
          <h2>Options</h2>
          <dl>
            <div>
              <dt>Sizes</dt>
              <dd>{options.sizes.join(", ") || "Custom"}</dd>
            </div>
            <div>
              <dt>Colors</dt>
              <dd>{options.colors.join(", ") || "Custom"}</dd>
            </div>
            <div>
              <dt>Materials</dt>
              <dd>{options.materials.join(", ") || "Custom"}</dd>
            </div>
            <div>
              <dt>Print types</dt>
              <dd>{options.printTypes.join(", ") || "Custom"}</dd>
            </div>
            <div>
              <dt>Finishes</dt>
              <dd>{options.finishes.join(", ") || "Custom"}</dd>
            </div>
          </dl>
        </div>

        {videoUrl ? (
          <div className="option-block">
            <h2>Product video</h2>
            <video className="detail-video" controls src={videoUrl} />
          </div>
        ) : null}

        <div className="option-block">
          <h2>Add to Cart</h2>
          {product.variants?.length ? (
            <label>
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
            <p>
              Stock: {selectedVariant.stock} - SKU: {selectedVariant.sku || "Not assigned"}
            </p>
          ) : null}
          <label>
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
            className="primary-button"
            type="button"
            disabled={isAdding || isSelectedVariantOutOfStock}
            onClick={handleAddToCart}
          >
            {isSelectedVariantOutOfStock ? "Out of stock" : isAdding ? "Adding..." : "Add to Cart"}
          </button>
          <button className={`secondary-button wishlist-inline ${wished ? "active" : ""}`} type="button" onClick={handleWishlist}>
            {wished ? "Saved to Wishlist" : "Add to Wishlist"}
          </button>
          <Link
            className="button-link"
            state={{ product }}
            to={`/design-studio?product=${product._id}&slug=${product.slug}&type=${product.productType === "hoodie" ? "hoodie" : product.productType === "sticker" ? "sticker" : product.productType === "label" ? "label" : "tshirt"}`}
          >
            Customize Design
          </Link>
          <Link
            className="secondary-button"
            state={{ product }}
            to={`/design-studio?product=${product._id}&slug=${product.slug}&type=${product.productType === "hoodie" ? "hoodie" : product.productType === "sticker" ? "sticker" : product.productType === "label" ? "label" : "tshirt"}`}
          >
            Save Design
          </Link>
        </div>

        <div className="option-block">
          <h2>Reviews</h2>
          <p>
            {Number(product.ratingAverage || 0).toFixed(1)} average rating - {product.ratingCount || 0} reviews
          </p>
          {reviews.length ? (
            reviews.map((review) => (
              <div className="review-item" key={review._id}>
                <strong>{review.user?.name || "Customer"} - {review.rating}/5</strong>
                <span>Verified Purchase</span>
                <p>{review.reviewText || "No written review."}</p>
              </div>
            ))
          ) : (
            <p>No reviews yet.</p>
          )}
        </div>

        <form className="option-block" onSubmit={submitReview}>
          <h2>Write a review</h2>
          {reviewError ? <div className="form-alert">{reviewError}</div> : null}
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
          <button className="primary-button" disabled={isReviewing} type="submit">
            {isReviewing ? "Submitting..." : "Submit review"}
          </button>
        </form>
      </div>
      </div>
      {relatedProducts.length ? (
        <div className="catalog-page related-products">
          <div className="page-heading"><p className="eyebrow">Related</p><h1>More from this collection</h1></div>
          <div className="product-grid">{relatedProducts.map((item) => <ProductCard key={item._id} product={item} />)}</div>
        </div>
      ) : null}
    </section>
  );
};

export default ProductDetails;
