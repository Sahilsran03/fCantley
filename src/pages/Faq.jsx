import React, { useCallback, useEffect, useState } from "react";
import SEO from "../components/SEO.jsx";
import api from "../services/api.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";
import "./Support.css";

const Faq = () => {
  const [faq, setFaq] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const loadFaq = useCallback(() => {
    setIsLoading(true); setError("");
    return api.get("/faqs")
      .then((response) => { setFaq(response.data.faq); setError(""); })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load FAQs."))
      .finally(() => setIsLoading(false));
  }, []);
  useEffect(() => { loadFaq(); }, [loadFaq]);
  const content = faq?.content ? sanitizeHtml(faq.content) : "";
  return (
    <section className="cantley-support support-faq" aria-labelledby="faq-title">
      <SEO title={faq?.title || "FAQ"} description="Cantley frequently asked questions." canonical="/faq" />
      <header className="page-heading"><p className="eyebrow">Cantley support</p><h1 id="faq-title">{faq?.title || "FAQ"}</h1><p>Answers to your Cantley questions.</p></header>
      {isLoading ? <div className="support-state" role="status"><p>Loading FAQs...</p></div> : error ? <div className="support-state" role="alert"><h2>We couldn’t load the FAQs</h2><p>{error}</p><button className="secondary-button" type="button" onClick={loadFaq}>Retry</button></div> : content.trim() ? <details className="support-faq-content" open><summary>Questions &amp; answers</summary><article className="cms-content" dangerouslySetInnerHTML={{ __html: content }} /></details> : <div className="support-state"><h2>No FAQs available yet</h2><p>Published questions and answers will appear here.</p></div>}
    </section>
  );
};
export default Faq;
