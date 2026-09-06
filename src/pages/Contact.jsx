import React, { useCallback, useEffect, useState } from "react";
import SEO from "../components/SEO.jsx";
import api from "../services/api.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";
import "./Support.css";

const Contact = () => {
  const [cmsPage, setCmsPage] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const loadContact = useCallback(() => {
    setIsLoading(true); setError("");
    return api.get("/pages/contact")
      .then((response) => setCmsPage(response.data.page))
      .catch((requestError) => { setCmsPage(null); setError(requestError.response?.data?.message || "Unable to load additional support information."); })
      .finally(() => setIsLoading(false));
  }, []);
  useEffect(() => { loadContact(); }, [loadContact]);
  return (
    <section className="cantley-support">
      <SEO title="Contact / Support" description="Contact Cantley support for orders, custom printing, shipping, and design upload help." canonical="/contact" />
      <div className="page-heading policy-heading">
        <p className="eyebrow">Cantley support</p>
        <h1>Contact Us</h1>
        <p>Need help with a custom printed clothing order, stickers, labels, COD confirmation, shipping, or design upload? Reach the Cantley support team.</p>
      </div>

      <div className="contact-support-grid">
        <article className="contact-support-card">
          <span>Email · placeholder</span>
          <strong>support@cantley.in</strong>
          <p>Use this placeholder for order questions, refund requests, design approval, and account help.</p>
        </article>
        <article className="contact-support-card">
          <span>WhatsApp · placeholder</span>
          <strong>+91 00000 00000</strong>
          <p>International customers should contact WhatsApp/support before ordering to confirm shipping availability and charges.</p>
        </article>
        <article className="contact-support-card">
          <span>Business hours</span>
          <strong>Mon-Sat, 10:00 AM-6:00 PM IST</strong>
          <p>Replies may take longer on holidays, during high order volume, or while checking custom printing details.</p>
        </article>
      </div>

      <div className="contact-layout">
        <form className="form-panel contact-form-placeholder" onSubmit={(event) => event.preventDefault()}>
          <h2>Contact form</h2>
          <p>The contact form is not available yet. Messages cannot be sent from this page.</p>
          <label>
            Name
            <input placeholder="Your name" />
          </label>
          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>
          <label>
            Order number
            <input placeholder="Optional" />
          </label>
          <label>
            Message
            <textarea rows="5" placeholder="Tell us how we can help." />
          </label>
          <button className="secondary-button" type="button" disabled>Form coming soon</button>
        </form>

        <aside className="policy-summary contact-support-note">
          <strong>Before ordering internationally</strong>
          <p>Contact Cantley support before placing an international order so shipping availability, charges, and delivery estimates can be checked.</p>
          <strong>For custom printing</strong>
          <p>Keep your design files clear, high quality, and ready for review. Processing time can depend on design approval, printing, quality check, and shipping.</p>
        </aside>
      </div>

      {isLoading ? <div className="support-state" role="status">Loading additional support information...</div> : error ? <div className="support-state" role="alert"><p>{error}</p><button className="secondary-button" type="button" onClick={loadContact}>Retry</button></div> : null}
      {!isLoading && !error && cmsPage?.content ? (
        <article className="cms-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cmsPage.content) }} />
      ) : null}
    </section>
  );
};

export default Contact;
