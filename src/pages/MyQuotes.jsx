import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import "./Quotes.css";

const hasNumber = (value) => (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value)) && Number(value) >= 0;
const MyQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const loadQuotes = useCallback(() => {
    setIsLoading(true); setError("");
    return api.get("/quotes/my-quotes")
      .then((response) => { setQuotes(response.data.quotes || []); setError(""); })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load quotes."))
      .finally(() => setIsLoading(false));
  }, []);
  useEffect(() => { loadQuotes(); }, [loadQuotes]);
  return <section className="cantley-quotes" aria-labelledby="quotes-title">
    <header className="page-heading row-heading"><div><p className="eyebrow">Bulk Orders</p><h1 id="quotes-title">My Quotes</h1><p>Your Cantley custom printing quote requests.</p></div><Link className="button-link" to="/bulk-orders">New quote</Link></header>
    {isLoading ? <div className="quotes-state" role="status"><p>Loading your quotes...</p></div> : error ? <div className="quotes-state" role="alert"><h2>We couldn’t load your quotes</h2><p>{error}</p><button className="secondary-button" type="button" onClick={loadQuotes}>Retry</button></div> : !quotes.length ? <div className="quotes-state"><h2>No quote requests yet</h2><p>Request a custom quote for bulk T-shirts, hoodies, stickers, or labels.</p><Link className="button-link" to="/bulk-orders">Request Quote</Link></div> : <div className="quotes-history">{quotes.map((quote) => {
      const date = quote.createdAt ? new Date(quote.createdAt) : null;
      return <article className="quotes-request" key={quote._id}>
        <header className="quotes-request-heading"><div>{quote.productType ? <h2>{quote.productType}</h2> : null}<p className="quotes-reference">Request {quote._id}</p>{quote.businessName || quote.fullName ? <p>{quote.businessName || quote.fullName}</p> : null}</div>{quote.status ? <span className="quotes-status">{quote.status}</span> : null}</header>
        <dl className="quotes-facts">{hasNumber(quote.quantity) ? <div><dt>Requested quantity</dt><dd>{Number(quote.quantity).toLocaleString("en-IN")}</dd></div> : null}{hasNumber(quote.quotedAmount) ? <div><dt>Quoted amount</dt><dd>₹{Number(quote.quotedAmount).toLocaleString("en-IN")}</dd></div> : null}{date && !Number.isNaN(date.getTime()) ? <div><dt>Requested</dt><dd><time dateTime={date.toISOString()}>{date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time></dd></div> : null}</dl>
        {quote.adminNote ? <div className="quotes-note"><h3>Note from Cantley</h3><p>{quote.adminNote}</p></div> : null}
      </article>;
    })}</div>}
  </section>;
};
export default MyQuotes;
