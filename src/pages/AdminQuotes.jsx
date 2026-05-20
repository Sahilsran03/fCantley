import React, { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const statuses = ["New", "Contacted", "Quoted", "Approved", "Rejected"];

const AdminQuotes = () => {
  const { showToast } = useToast();
  const [quotes, setQuotes] = useState([]);
  const [activeQuote, setActiveQuote] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ quotedAmount: "", adminNote: "", status: "Quoted" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQuotes = async () => {
    const response = await api.get("/admin/quotes");
    setQuotes(response.data.quotes || []);
  };

  useEffect(() => {
    loadQuotes()
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load quote requests."))
      .finally(() => setIsLoading(false));
  }, []);

  const openQuote = async (quoteId) => {
    try {
      const response = await api.get(`/admin/quotes/${quoteId}`);
      const quote = response.data.quote;
      setActiveQuote(quote);
      setQuoteForm({
        quotedAmount: quote.quotedAmount || "",
        adminNote: quote.adminNote || "",
        status: quote.status === "New" ? "Quoted" : quote.status
      });
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load quote details.");
    }
  };

  const updateStatus = async (quoteId, status) => {
    try {
      const response = await api.put(`/admin/quotes/${quoteId}/status`, { status, adminNote: activeQuote?._id === quoteId ? quoteForm.adminNote : "" });
      setQuotes((current) => current.map((quote) => quote._id === quoteId ? response.data.quote : quote));
      if (activeQuote?._id === quoteId) setActiveQuote(response.data.quote);
      showToast("Quote status updated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update quote status.");
    }
  };

  const submitQuote = async (event) => {
    event.preventDefault();
    if (!activeQuote) return;

    try {
      const response = await api.put(`/admin/quotes/${activeQuote._id}/quote`, quoteForm);
      setActiveQuote(response.data.quote);
      setQuotes((current) => current.map((quote) => quote._id === activeQuote._id ? response.data.quote : quote));
      showToast("Quote amount saved.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save quote amount.");
    }
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Quote Requests</h1>
      </div>
      {isLoading ? <div className="analytics-skeleton">Loading quote requests...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}

      <div className="quote-admin-layout">
        <div className="admin-table">
          {!isLoading && !quotes.length && !error ? (
            <div className="empty-state">
              <h2>No quote requests yet</h2>
              <p>Bulk order quote requests will appear here.</p>
            </div>
          ) : quotes.map((quote) => (
            <div className="admin-row product-admin-row" key={quote._id}>
              <div>
                <strong>{quote.productType} - {Number(quote.quantity).toLocaleString("en-IN")} pcs</strong>
                <span>{quote.businessName || quote.fullName} - {quote.email}</span>
              </div>
              <span className={`status-badge status-${quote.status.toLowerCase()}`}>{quote.status}</span>
              <span>{quote.quotedAmount ? `Rs. ${Number(quote.quotedAmount).toLocaleString("en-IN")}` : "Not quoted"}</span>
              <button type="button" onClick={() => openQuote(quote._id)}>Manage</button>
            </div>
          ))}
        </div>

        {activeQuote ? (
          <aside className="chart-panel quote-detail-panel">
            <h2>{activeQuote.productType}</h2>
            <p><strong>Customer:</strong> {activeQuote.fullName} ({activeQuote.email}, {activeQuote.phone})</p>
            <p><strong>Business:</strong> {activeQuote.businessName || "Not provided"}</p>
            <p><strong>Quantity:</strong> {Number(activeQuote.quantity).toLocaleString("en-IN")}</p>
            <p><strong>Material:</strong> {activeQuote.preferredMaterial || "Not specified"}</p>
            <p><strong>Print:</strong> {activeQuote.printType || "Not specified"}</p>
            <p><strong>Sizes:</strong> {activeQuote.sizesBreakdown || "Not provided"}</p>
            <p><strong>Message:</strong> {activeQuote.message || "No message"}</p>
            {activeQuote.designFiles?.length ? (
              <div className="file-list">
                {activeQuote.designFiles.map((file) => (
                  <a href={file.url} key={file.publicId} rel="noreferrer" target="_blank">
                    {file.originalName || "Design file"}
                  </a>
                ))}
              </div>
            ) : <p>No files uploaded.</p>}

            <form className="quote-admin-form" onSubmit={submitQuote}>
              <label>
                Status
                <select value={quoteForm.status} onChange={(event) => setQuoteForm((current) => ({ ...current, status: event.target.value }))}>
                  {statuses.map((status) => <option value={status} key={status}>{status}</option>)}
                </select>
              </label>
              <label>
                Quoted amount
                <input min="0" type="number" value={quoteForm.quotedAmount} onChange={(event) => setQuoteForm((current) => ({ ...current, quotedAmount: event.target.value }))} />
              </label>
              <label>
                Admin note
                <textarea rows="4" value={quoteForm.adminNote} onChange={(event) => setQuoteForm((current) => ({ ...current, adminNote: event.target.value }))} />
              </label>
              <button className="primary-button" type="submit">Save quote</button>
            </form>

            <div className="status-actions">
              {statuses.map((status) => (
                <button type="button" key={status} onClick={() => updateStatus(activeQuote._id, status)}>
                  Mark {status}
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
};

export default AdminQuotes;
