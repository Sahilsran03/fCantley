import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO.jsx";
import { lastUpdated, policyPages } from "../data/customerPolicies.js";
import api from "../services/api.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";
import "./Policy.css";

const labels = {
  ABOUT_US: "About Cantley",
  PRIVACY_POLICY: "Privacy Policy",
  TERMS_CONDITIONS: "Terms & Conditions",
  SHIPPING_POLICY: "Shipping Policy",
  RETURN_REFUND_POLICY: "Return & Refund Policy",
  CANCELLATION_POLICY: "Cancellation Policy",
  COD_POLICY: "COD / Advance Payment Policy",
  CUSTOM_PRINTING_POLICY: "Custom Printing Policy",
  DESIGN_UPLOAD_GUIDELINES: "Design Upload Guidelines",
  FAQ: "FAQ"
};

const PolicyFallback = ({ fallback }) => (
  <div className="policy-layout">
    <aside className="policy-summary">
      <strong>Last updated</strong>
      <span>{lastUpdated}</span>
      <p>Customer-friendly guidance for Cantley orders, support, and custom printing.</p>
    </aside>
    <article className="policy-content">
      {fallback.sections.map((section) => (
        <section className="policy-section" key={section.heading}>
          <h2>{section.heading}</h2>
          {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.callout ? <div className="policy-callout">{section.callout}</div> : null}
        </section>
      ))}
    </article>
  </div>
);

const PublicPolicyPage = ({ type, canonical }) => {
  const fallback = policyPages[type];
  const [policy, setPolicy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    api
      .get(`/policies/${type}`)
      .then((response) => {
        setPolicy(response.data.policy);
        setError("");
      })
      .catch((requestError) => {
        if (fallback) {
          setPolicy(null);
          setError("");
          return;
        }
        setError(requestError.response?.data?.message || "Content not found.");
      })
      .finally(() => setIsLoading(false));
  }, [fallback, type]);

  if (isLoading) return <div className="cantley-policy policy-state" role="status">Loading policy...</div>;
  if (error) {
    return (
      <section className="cantley-policy policy-state">
        <div className="policy-error" role="alert">{error}</div>
        <Link className="policy-home-link" to="/">Go home</Link>
      </section>
    );
  }

  const title = policy?.title || fallback?.title || labels[type];
  const description = policy?.title
    ? `${policy.title} for Cantley.`
    : fallback?.description || `${labels[type]} for Cantley.`;

  return (
    <section className="cantley-policy" aria-labelledby="policy-title">
      <SEO title={title} description={description} canonical={canonical} />
      <header className="policy-heading">
        <p className="eyebrow">Cantley customer information</p>
        <h1 id="policy-title">{title}</h1>
        <p>{description}</p>
      </header>
      {policy ? (
        <div className="policy-layout">
          <aside className="policy-summary">
            <strong>Last updated</strong>
            <span>{new Date(policy.updatedAt || policy.createdAt || Date.now()).toLocaleDateString()}</span>
            <p>This policy is managed from the Cantley admin CMS.</p>
          </aside>
          <article className="cms-content policy-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.content) }} />
        </div>
      ) : <PolicyFallback fallback={fallback} />}
    </section>
  );
};

export default PublicPolicyPage;
