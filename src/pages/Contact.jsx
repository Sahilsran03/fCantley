import React, { useEffect, useState } from "react";
import SEO from "../components/SEO.jsx";
import api from "../services/api.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";

const Contact = () => {
  const [cmsPage, setCmsPage] = useState(null);

  useEffect(() => {
    api
      .get("/pages/contact")
      .then((response) => setCmsPage(response.data.page))
      .catch(() => setCmsPage(null));
  }, []);

  return (
    <section className="contact-page">
      <SEO title="Contact / Support" description="Contact Cantley support for orders, custom printing, shipping, and design upload help." canonical="/contact" />
      <div className="page-heading policy-heading">
        <p className="eyebrow">Cantley support</p>
        <h1>Contact / Support</h1>
        <p>Need help with a custom printed clothing order, stickers, labels, COD confirmation, shipping, or design upload? Reach the Cantley support team.</p>
      </div>

      <div className="contact-support-grid">
        <article className="contact-support-card">
          <span>Email</span>
          <strong>support@cantley.in</strong>
          <p>Use this placeholder for order questions, refund requests, design approval, and account help.</p>
        </article>
        <article className="contact-support-card">
          <span>WhatsApp</span>
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
          <p>This form is a website placeholder. Please connect it to support email or CRM when the backend endpoint is ready.</p>
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
          <button className="secondary-button" type="button">Form coming soon</button>
        </form>

        <aside className="policy-summary contact-support-note">
          <strong>Before ordering internationally</strong>
          <p>Contact Cantley support before placing an international order so shipping availability, charges, and delivery estimates can be checked.</p>
          <strong>For custom printing</strong>
          <p>Keep your design files clear, high quality, and ready for review. Processing time can depend on design approval, printing, quality check, and shipping.</p>
        </aside>
      </div>

      {cmsPage?.content ? (
        <article className="cms-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cmsPage.content) }} />
      ) : null}
    </section>
  );
};

export default Contact;
