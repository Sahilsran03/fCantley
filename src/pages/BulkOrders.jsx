import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import "./Quotes.css";

const maxFileSize = 40 * 1024 * 1024;
const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  businessName: "",
  productType: "T-shirts",
  quantity: "",
  preferredMaterial: "",
  printType: "",
  sizesBreakdown: "",
  message: ""
};

const BulkOrders = () => {
  const { showToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [successQuote, setSuccessQuote] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const updateFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 5) {
      setError("Upload up to 5 design or reference files.");
      event.target.value = "";
      return;
    }
    if (selected.some((file) => file.size > maxFileSize)) {
      setError("Each file must be 40MB or less.");
      event.target.value = "";
      return;
    }
    setError("");
    setFiles(selected);
  };

  const submitQuote = async (event) => {
    event.preventDefault();
    if (submitLock.current) return;
    const formElement = event.currentTarget;
    setError("");
    setSuccessQuote(null);

    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.productType.trim()) {
      setError("Please complete name, email, phone, and product type.");
      return;
    }
    if (!Number(form.quantity) || Number(form.quantity) < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    files.forEach((file) => data.append("designFiles", file));

    submitLock.current = true;
    setIsSubmitting(true);
    try {
      const response = await api.post("/quotes", data);
      setSuccessQuote(response.data.quote);
      setForm(initialForm);
      setFiles([]);
      formElement.reset();
      showToast("Quote request submitted.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit quote request.");
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <section className="cantley-quotes">
      <div className="quotes-hero">
        <div>
          <p className="eyebrow">Cantley for your business</p>
          <h1>Bulk Orders</h1>
          <h2>Custom printing for teams, schools, brands, and businesses.</h2>
          <p className="lead">Share your quantity, product type, size split, and artwork. Cantley will review the request and respond with a custom quote.</p>
          <div className="hero-actions">
            <a className="button-link" href="#quote-form">Request Quote</a>
            <Link className="secondary-button" to="/quotes">My Quotes</Link>
          </div>
        </div>
        <div className="quotes-intro-panel">
          <strong>Built for B2B printing</strong>
          <span>School events</span>
          <span>Brand merch</span>
          <span>Team uniforms</span>
          <span>Creator drops</span>
        </div>
      </div>

      <form className="form-panel wide-form" id="quote-form" onSubmit={submitQuote}>
        <div className="page-heading">
          <p className="eyebrow">Request Quote</p>
          <h2>Tell us what you need</h2>
        </div>
        {successQuote ? (
          <div className="form-success" role="status">
            Quote request received.{successQuote.status ? ` Status: ${successQuote.status}.` : ""}{successQuote._id ? ` Reference: ${successQuote._id}.` : ""}
          </div>
        ) : null}
        {error ? <div className="form-alert" role="alert">{error}</div> : null}
        <div className="form-grid">
          <label>
            Name
            <input name="fullName" value={form.fullName} onChange={updateField} required />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={updateField} required />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={updateField} required />
          </label>
          <label>
            Business name
            <input name="businessName" value={form.businessName} onChange={updateField} />
          </label>
          <label>
            Product type
            <select name="productType" value={form.productType} onChange={updateField} required>
              <option>T-shirts</option>
              <option>Oversized T-shirts</option>
              <option>Hoodies</option>
              <option>Stickers</option>
              <option>Labels</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Quantity
            <input name="quantity" min="1" type="number" value={form.quantity} onChange={updateField} required />
          </label>
          <label>
            Material
            <input name="preferredMaterial" value={form.preferredMaterial} onChange={updateField} placeholder="Cotton, fleece, vinyl..." />
          </label>
          <label>
            Print type
            <input name="printType" value={form.printType} onChange={updateField} placeholder="DTF, screen print, embroidery..." />
          </label>
        </div>
        <label>
          Size breakdown
          <textarea
            name="sizesBreakdown"
            rows="3"
            value={form.sizesBreakdown}
            onChange={updateField}
            placeholder="Example: S 20, M 40, L 30, XL 10"
          />
        </label>
        <label>
          Design/reference files
          <input
            accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf,video/mp4,video/quicktime,video/webm"
            multiple
            type="file"
            onChange={updateFiles}
          />
        </label>
        {files.length ? (
          <div className="file-list">
            {files.map((file) => <span key={`${file.name}-${file.size}`}>{file.name}</span>)}
          </div>
        ) : null}
        <label>
          Message
          <textarea name="message" rows="5" value={form.message} onChange={updateField} placeholder="Timeline, colors, packaging needs, or any extra notes." />
        </label>
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Request Quote"}
        </button>
      </form>
    </section>
  );
};

export default BulkOrders;
