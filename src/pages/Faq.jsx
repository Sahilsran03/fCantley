import React, { useEffect, useState } from "react";
import SEO from "../components/SEO.jsx";
import { faqItems, lastUpdated } from "../data/customerPolicies.js";
import api from "../services/api.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";

const Faq = () => {
  const [faq, setFaq] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/faqs")
      .then((response) => {
        setFaq(response.data.faq);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "FAQ content not found."))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="analytics-skeleton">Loading FAQs...</div>;

  return (
    <section className="cms-public-page">
      <SEO title={faq?.title || "FAQ"} description="Cantley frequently asked questions." canonical="/faq" />
      <div className="page-heading policy-heading">
        <p className="eyebrow">Cantley support</p>
        <h1>{faq?.title || "FAQ"}</h1>
        <p>Quick answers for Cantley custom printing, COD, shipping, returns, and design uploads.</p>
      </div>
      {!error && faq?.content ? <article className="cms-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.content) }} /> : null}
      <div className="faq-accordion">
        <div className="policy-summary">
          <strong>Last updated</strong>
          <span>{lastUpdated}</span>
          <p>These answers cover common customer questions. Contact support for order-specific help.</p>
        </div>
        <div className="faq-accordion-list">
          {faqItems.map((item, index) => (
            <details className="faq-accordion-item" key={item.question} open={index === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;
