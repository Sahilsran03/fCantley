import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "../components/SEO.jsx";
import api from "../services/api.js";
import { getOptimizedImageUrl } from "../utils/media.js";

const Lookbook = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [lookbooks, setLookbooks] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: searchParams.get("search") || "", page: searchParams.get("page") || "1" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !(key === "page" && value === "1")) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    setSearchParams(query, { replace: true });
    setIsLoading(true);
    api
      .get(`/lookbook?limit=9${query ? `&${query}` : ""}`)
      .then((response) => {
        setLookbooks(response.data.lookbooks || []);
        setMeta({ page: response.data.page || 1, pages: response.data.pages || 1, total: response.data.total || 0 });
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load lookbook."))
      .finally(() => setIsLoading(false));
  }, [query, setSearchParams]);

  return (
    <section className="editorial-page">
      <SEO title="Cantley Lookbook" description="Customer style showcases and custom printing inspiration from Cantley." canonical={`/lookbook${query ? `?${query}` : ""}`} />
      <div className="editorial-hero">
        <p className="eyebrow">Lookbook</p>
        <h1>Real print ideas for apparel, stickers, labels, and events</h1>
        <p>Browse Cantley looks and customer-ready concepts built around custom printing.</p>
      </div>
      <div className="filter-bar">
        <input name="search" value={filters.search} onChange={(event) => setFilters({ search: event.target.value, page: "1" })} placeholder="Search lookbook" />
      </div>
      {isLoading ? <div className="analytics-skeleton">Loading lookbook...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}
      {!isLoading && !lookbooks.length && !error ? (
        <div className="empty-state"><h2>No lookbook entries yet</h2><p>Published Cantley style showcases will appear here.</p></div>
      ) : (
        <>
          <div className="lookbook-grid">
            {lookbooks.map((item) => (
              <Link className="lookbook-card" to={`/lookbook/${item.slug}`} key={item._id}>
                <img src={getOptimizedImageUrl(item.images?.[0], { width: 900 }) || "https://placehold.co/900x1100/f1f5f9/334155?text=Cantley"} alt={item.title} />
                <div>
                  <p className="eyebrow">{item.customerName || "Cantley Style"}</p>
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="pagination">
            <button className="secondary-button" disabled={meta.page <= 1} type="button" onClick={() => setFilters((current) => ({ ...current, page: String(meta.page - 1) }))}>Previous</button>
            <span>Page {meta.page} of {meta.pages}</span>
            <button className="secondary-button" disabled={meta.page >= meta.pages} type="button" onClick={() => setFilters((current) => ({ ...current, page: String(meta.page + 1) }))}>Next</button>
          </div>
        </>
      )}
    </section>
  );
};

export default Lookbook;
