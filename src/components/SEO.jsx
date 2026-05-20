import { useEffect } from "react";
import { absoluteUrl, organizationSchema, siteName, truncate } from "../utils/seo.js";

const setMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes.identity).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }

  Object.entries(attributes.values).forEach(([key, value]) => element.setAttribute(key, value));
};

const setCanonical = (href) => {
  let link = document.head.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

const SEO = ({
  title = "Cantley",
  description = "Shop custom-ready Cantley apparel, labels, stickers, and saved designs.",
  image,
  canonical,
  type = "website",
  schema = []
}) => {
  useEffect(() => {
    const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
    const metaDescription = truncate(description);
    const canonicalUrl = absoluteUrl(canonical || window.location.pathname + window.location.search);
    const previewImage = image || absoluteUrl("/cantley-logo.jpeg");
    const schemas = [organizationSchema(), ...schema].filter(Boolean);
    const scriptId = "cantley-jsonld";
    const existingScript = document.getElementById(scriptId);

    document.title = fullTitle;
    setCanonical(canonicalUrl);
    setMeta("meta[name='description']", {
      identity: { name: "description" },
      values: { content: metaDescription }
    });
    setMeta("meta[property='og:title']", {
      identity: { property: "og:title" },
      values: { content: fullTitle }
    });
    setMeta("meta[property='og:description']", {
      identity: { property: "og:description" },
      values: { content: metaDescription }
    });
    setMeta("meta[property='og:type']", {
      identity: { property: "og:type" },
      values: { content: type }
    });
    setMeta("meta[property='og:url']", {
      identity: { property: "og:url" },
      values: { content: canonicalUrl }
    });
    setMeta("meta[property='og:image']", {
      identity: { property: "og:image" },
      values: { content: previewImage }
    });
    setMeta("meta[name='twitter:card']", {
      identity: { name: "twitter:card" },
      values: { content: "summary_large_image" }
    });
    setMeta("meta[name='twitter:title']", {
      identity: { name: "twitter:title" },
      values: { content: fullTitle }
    });
    setMeta("meta[name='twitter:description']", {
      identity: { name: "twitter:description" },
      values: { content: metaDescription }
    });
    setMeta("meta[name='twitter:image']", {
      identity: { name: "twitter:image" },
      values: { content: previewImage }
    });

    if (existingScript) existingScript.remove();
    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
    document.head.appendChild(script);
  }, [canonical, description, image, schema, title, type]);

  return null;
};

export default SEO;
