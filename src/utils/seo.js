import { getMediaUrl } from "./media.js";

export const siteName = "Cantley";
export const siteOrigin = () => window.location.origin;

export const absoluteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
};

export const plainText = (value, fallback = "") =>
  String(value || fallback)
    .replace(/\s+/g, " ")
    .trim();

export const truncate = (value, length = 155) => {
  const text = plainText(value);
  return text.length > length ? `${text.slice(0, length - 1).trim()}...` : text;
};

export const productUrl = (product) => absoluteUrl(`/products/${product?.slug || ""}`);

export const productImageUrl = (product) =>
  getMediaUrl(product?.images?.[0]) || "https://placehold.co/1200x630/f1f5f9/334155?text=Cantley";

export const organizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteOrigin(),
  logo: absoluteUrl("/cantley-logo.jpeg")
});

export const breadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.url)
  }))
});

export const productSchema = (product, reviews = []) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: truncate(product.description || product.shortDescription, 500),
  image: product.images?.map(getMediaUrl).filter(Boolean),
  sku: product.variants?.find((variant) => variant.sku)?.sku || product.slug,
  brand: { "@type": "Brand", name: siteName },
  aggregateRating: product.ratingCount
    ? {
        "@type": "AggregateRating",
        ratingValue: Number(product.ratingAverage || 0).toFixed(1),
        reviewCount: product.ratingCount
      }
    : undefined,
  offers: {
    "@type": "Offer",
    priceCurrency: "INR",
    price: Number(product.basePrice || 0).toFixed(2),
    availability: product.variants?.some((variant) => Number(variant.stock || 0) > 0)
      ? "https://schema.org/InStock"
      : "https://schema.org/PreOrder",
    url: productUrl(product)
  },
  review: reviews.slice(0, 5).map((review) => ({
    "@type": "Review",
    author: { "@type": "Person", name: review.user?.name || "Cantley customer" },
    reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 },
    reviewBody: review.reviewText || "Verified Cantley purchase."
  }))
});
