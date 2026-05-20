import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import SEO from "../components/SEO.jsx";
import { ProductGridSkeleton } from "../components/Skeleton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import api from "../services/api.js";
import { getOptimizedImageUrl } from "../utils/media.js";

const productGroups = [
  { key: "featured", title: "Featured products", params: "featured=true&limit=6&sort=featured" },
  { key: "trending", title: "Trending products", params: "limit=6&sort=most-viewed" },
  { key: "bestSelling", title: "Best sellers", params: "limit=6&sort=best-selling" },
  { key: "recent", title: "Recently added", params: "limit=6&sort=latest" },
  { key: "topRated", title: "Top-rated products", params: "limit=6&sort=rating" }
];

const fallbackTiles = [
  { title: "Custom tees", text: "Print-ready everyday apparel", to: "/shop?productType=tshirt" },
  { title: "Labels", text: "Packaging details for small brands", to: "/shop?productType=label" },
  { title: "Sticker drops", text: "Sharp finish for product launches", to: "/shop?productType=sticker" }
];

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { products: wishlistProducts } = useWishlist();
  const [categories, setCategories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [groups, setGroups] = useState({});
  const [recentItems, setRecentItems] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const loadHome = async () => {
      try {
        const [categoryResponse, announcementResponse, faqResponse, ...productResponses] = await Promise.all([
          api.get("/categories", { signal: controller.signal }),
          api.get("/announcements", { signal: controller.signal }),
          api.get("/faqs", { signal: controller.signal }).catch(() => ({ data: { faqs: [] } })),
          ...productGroups.map((group) => api.get(`/products?${group.params}`, { signal: controller.signal }))
        ]);
        setCategories(categoryResponse.data.categories || []);
        setAnnouncements(announcementResponse.data.announcements || []);
        setFaqs(faqResponse.data.faqs || []);
        setGroups(
          productGroups.reduce((nextGroups, group, index) => {
            nextGroups[group.key] = productResponses[index].data.products || [];
            return nextGroups;
          }, {})
        );
      } catch (error) {
        if (error.name !== "CanceledError") {
          setCategories([]);
          setAnnouncements([]);
          setGroups({});
          setFaqs([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadHome();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get("/recently-viewed")
      .then((response) => setRecentItems(response.data.products || []))
      .catch(() => setRecentItems([]));
  }, [isAuthenticated]);

  const reviewProducts = useMemo(
    () => (groups.topRated || []).filter((product) => Number(product.ratingCount || 0) > 0).slice(0, 3),
    [groups.topRated]
  );
  const heroProducts = (groups.featured || []).slice(0, 3);
  const activeAnnouncement = announcements[0];
  const subscribe = (event) => {
    event.preventDefault();
    showToast("Thanks. Cantley updates will reach your inbox soon.");
    setEmail("");
  };

  return (
    <section className="home-stack">
      <SEO
        title="Cantley Custom Apparel, Stickers, Labels and Design Studio"
        description="Shop Cantley custom-ready clothing, stickers, labels, trending products, top-rated picks, and saved design workflows."
        canonical="/"
      />

      <div className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">Cantley Custom Studio</p>
          <h1>Premium custom wear, labels, and print-ready brand goods</h1>
          <p className="lead">
            Shop curated products, upload artwork, build bulk orders, and track every Cantley order from cart to delivery.
          </p>
          <div className="hero-proof-row">
            <span>COD available</span>
            <span>Design uploads</span>
            <span>Bulk quotes</span>
          </div>
          <div className="hero-actions">
            <Link className="button-link" to="/shop">Shop products</Link>
            <Link className="secondary-button" to="/design-studio">Open Design Studio</Link>
            <Link className="secondary-button" to="/track-order">Track Order</Link>
          </div>
        </div>
        <div className="hero-showcase" aria-label="Cantley featured products">
          {heroProducts.map((product) => (
            <Link className="hero-tile" to={`/products/${product.slug}`} key={product._id}>
              <img src={getOptimizedImageUrl(product.images?.[0], { width: 520 })} alt={product.name} loading="lazy" />
              <span>{product.name}</span>
            </Link>
          ))}
          {!heroProducts.length ? fallbackTiles.map((tile) => (
            <Link className="hero-tile fallback" to={tile.to} key={tile.title}>
              <strong>{tile.title}</strong>
              <span>{tile.text}</span>
            </Link>
          )) : null}
        </div>
      </div>

      <section className="offer-ribbon">
        <div>
          <p className="eyebrow">Limited Cantley offer</p>
          <h2>Buy 5 Get 1 Free on eligible T-shirt orders</h2>
          <p>Build team kits, launch drops, or event merchandise with reward tracking applied during checkout.</p>
        </div>
        <Link className="button-link" to="/shop?productType=tshirt">Shop the offer</Link>
      </section>

      {activeAnnouncement ? (
        <section className="announcement-section">
          <div>
            <p className="eyebrow">Announcement</p>
            <h2>{activeAnnouncement.title}</h2>
            <p>{activeAnnouncement.message}</p>
          </div>
          {activeAnnouncement.buttonLink ? <Link className="button-link" to={activeAnnouncement.buttonLink}>{activeAnnouncement.buttonText || "Explore"}</Link> : null}
        </section>
      ) : null}

      <section className="category-strip">
        <div className="row-heading">
          <div>
            <p className="eyebrow">Categories</p>
            <h2>Shop by collection</h2>
          </div>
          <Link className="text-link" to="/shop">View all</Link>
        </div>
        <div className="category-grid">
          {categories.slice(0, 6).map((category) => (
            <Link className="category-card" to={`/shop?category=${category.slug}`} key={category._id}>
              <img src={getOptimizedImageUrl(category.image, { width: 420 }) || "https://placehold.co/420x300/f1f5f9/334155?text=Cantley"} alt={category.name} loading="lazy" />
              <strong>{category.name}</strong>
              <span>{category.description || "Explore Cantley products"}</span>
            </Link>
          ))}
        </div>
      </section>

      {loading ? <ProductGridSkeleton /> : productGroups.map((group) => (
        <section className="catalog-section" key={group.key}>
          <div className="row-heading">
            <div>
              <p className="eyebrow">{group.title}</p>
              <h2>{group.key === "featured" ? "Made for the front row" : group.key === "trending" ? "Customers are watching these" : group.key === "bestSelling" ? "Most ordered by Cantley buyers" : group.key === "recent" ? "Fresh in the catalog" : "Loved by buyers"}</h2>
            </div>
            <Link className="text-link" to={`/shop?sort=${group.key === "topRated" ? "highest-rated" : group.key === "bestSelling" ? "best-selling" : group.key === "recent" ? "latest" : group.key}`}>Browse</Link>
          </div>
          <div className="product-grid">
            {(groups[group.key] || []).slice(0, 3).map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </section>
      ))}

      <section className="cta-split">
        <div className="cta-panel studio-cta">
          <p className="eyebrow">Custom printing</p>
          <h2>Upload your artwork and preview the idea</h2>
          <p>Use the Cantley Design Studio for tees, hoodies, stickers, and labels before placing an order.</p>
          <Link className="button-link" to="/design-studio">Start designing</Link>
        </div>
        <div className="cta-panel bulk-cta">
          <p className="eyebrow">Bulk orders</p>
          <h2>Planning merch for teams, events, or launches?</h2>
          <p>Share quantities, artwork, and deadlines so Cantley can prepare a manual quote.</p>
          <Link className="secondary-button" to="/bulk-orders">Request a quote</Link>
        </div>
      </section>

      <section className="how-it-works">
        <div className="row-heading">
          <div>
            <p className="eyebrow">How it works</p>
            <h2>From idea to doorstep</h2>
          </div>
        </div>
        <div className="steps-grid">
          {[
            ["Choose", "Pick a Cantley product, variant, material, and quantity."],
            ["Customize", "Upload proof files or design directly in the studio."],
            ["Confirm", "Place a COD order and complete manual advance confirmation."],
            ["Track", "Follow printing, shipping, delivery, and support updates."]
          ].map(([title, text], index) => (
            <article className="step-card" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {reviewProducts.length ? (
        <section className="reviews-section">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2>Top-rated by Cantley customers</h2>
          </div>
          <div className="review-highlight-grid">
            {reviewProducts.map((product) => (
              <Link className="review-highlight" to={`/products/${product.slug}`} key={product._id}>
                <strong>{Number(product.ratingAverage || 0).toFixed(1)} / 5</strong>
                <span>{product.name}</span>
                <p>{product.ratingCount} verified reviews</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="faq-preview">
        <div className="row-heading">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>Quick answers before you order</h2>
          </div>
          <Link className="text-link" to="/faq">Read all FAQs</Link>
        </div>
        <div className="faq-preview-grid">
          {(faqs.length ? faqs.slice(0, 3) : [
            { _id: "cod", title: "Is COD available?", content: "Cantley supports COD where shipping zones allow it, with manual advance confirmation for processing." },
            { _id: "custom", title: "Can I upload custom artwork?", content: "Yes. Use Design Studio or bulk quote forms to upload print-ready files and proof images." },
            { _id: "bulk", title: "Do you handle bulk orders?", content: "Yes. Submit a quote request with quantities, timeline, and customization notes." }
          ]).map((faq) => (
            <article className="faq-card" key={faq._id || faq.title}>
              <h3>{faq.title}</h3>
              <p>{String(faq.content || "").replace(/<[^>]*>/g, "").slice(0, 150)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="newsletter-panel">
        <div>
          <p className="eyebrow">Stay close</p>
          <h2>Get Cantley launches, offers, and printing ideas</h2>
          <p>No spam, just useful product drops and custom-order inspiration.</p>
        </div>
        <form onSubmit={subscribe}>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" aria-label="Email address" required />
          <button className="primary-button" type="submit">Notify me</button>
        </form>
      </section>

      {isAuthenticated && recentItems.length ? (
        <section className="catalog-section">
          <div className="row-heading">
            <div>
              <p className="eyebrow">Recently viewed</p>
              <h2>Back on your radar</h2>
            </div>
            <Link className="text-link" to="/recently-viewed">View history</Link>
          </div>
          <div className="product-grid">
            {recentItems.slice(0, 3).map((item) => item.product ? <ProductCard key={item.product._id} product={item.product} /> : null)}
          </div>
        </section>
      ) : null}

      {isAuthenticated && wishlistProducts.length ? (
        <section className="catalog-section">
          <div className="row-heading">
            <div>
              <p className="eyebrow">Wishlist</p>
              <h2>Saved picks</h2>
            </div>
            <Link className="text-link" to="/wishlist">Open wishlist</Link>
          </div>
          <div className="product-grid">
            {wishlistProducts.slice(0, 3).map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </section>
      ) : null}
    </section>
  );
};

export default Home;
