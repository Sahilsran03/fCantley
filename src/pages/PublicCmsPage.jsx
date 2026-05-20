import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SEO from "../components/SEO.jsx";
import api from "../services/api.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";

const fallbackContact = {
  title: "Contact Cantley",
  metaDescription: "Contact Cantley for custom apparel, stickers, labels, bulk orders, and support.",
  content: "<p>Reach Cantley for order support, custom printing questions, shipping help, and bulk order requests.</p><p>Email: support@cantley.in</p>"
};

const PublicCmsPage = ({ slug: fixedSlug, fallback }) => {
  const params = useParams();
  const slug = fixedSlug || params.slug;
  const [page, setPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    api
      .get(`/pages/${slug}`)
      .then((response) => {
        setPage(response.data.page);
        setError("");
      })
      .catch((requestError) => {
        if (fallback) {
          setPage(fallback); 
          setError("");
          return;
        }
        setError(requestError.response?.data?.message || "Page not found.");
      })
      .finally(() => setIsLoading(false));
  }, [fallback, slug]);

  if (isLoading) return <div className="analytics-skeleton">Loading page...</div>;
  if (error) {
    return (
      <section className="admin-page">
        <div className="form-alert">{error}</div>
        <Link className="button-link" to="/">Go home</Link>
      </section>
    );
  }

  return (
    <section className="cms-public-page">
      <SEO title={page.metaTitle || page.title} description={page.metaDescription || page.title} canonical={`/${slug}`} />
      <div className="page-heading">
        <p className="eyebrow">Cantley</p>
        <h1>{page.title}</h1>
      </div>
      <article className="cms-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }} />
    </section>
  );
};

export const ContactPage = () => <PublicCmsPage slug="contact" fallback={fallbackContact} />;

export default PublicCmsPage;
