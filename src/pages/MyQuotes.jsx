import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

const MyQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/quotes/my-quotes")
      .then((response) => {
        setQuotes(response.data.quotes || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load quotes."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="admin-page">
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Bulk Orders</p>
          <h1>My Quotes</h1>
          <p>Track your Cantley custom printing quote requests.</p>
        </div>
        <Link className="button-link" to="/bulk-orders">New quote</Link>
      </div>
      {isLoading ? <div className="analytics-skeleton">Loading quotes...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}
      {!isLoading && !quotes.length && !error ? (
        <div className="empty-state">
          <h2>No quote requests yet</h2>
          <p>Request a custom quote for bulk T-shirts, hoodies, stickers, or labels.</p>
          <Link className="button-link" to="/bulk-orders">Request Quote</Link>
        </div>
      ) : (
        <div className="quote-grid">
          {quotes.map((quote) => (
            <article className="quote-card" key={quote._id}>
              <div className="row-heading">
                <div>
                  <h2>{quote.productType}</h2>
                  <p>{quote.businessName || quote.fullName}</p>
                </div>
                <span className={`status-badge status-${quote.status.toLowerCase()}`}>{quote.status}</span>
              </div>
              <p>Quantity: {Number(quote.quantity).toLocaleString("en-IN")}</p>
              {quote.quotedAmount ? <p>Quoted amount: Rs. {Number(quote.quotedAmount).toLocaleString("en-IN")}</p> : <p>Quoted amount: Pending</p>}
              {quote.adminNote ? <p>Admin note: {quote.adminNote}</p> : null}
              <small>{new Date(quote.createdAt).toLocaleString()}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default MyQuotes;
