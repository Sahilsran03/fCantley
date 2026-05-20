import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "../components/SEO.jsx";
import api from "../services/api.js";
import { getOptimizedImageUrl } from "../utils/media.js";

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    tag: searchParams.get("tag") || "",
    page: searchParams.get("page") || "1"
  });
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
      .get(`/blog?limit=9${query ? `&${query}` : ""}`)
      .then((response) => {
        setPosts(response.data.posts || []);
        setMeta({ page: response.data.page || 1, pages: response.data.pages || 1, total: response.data.total || 0 });
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load Cantley stories."))
      .finally(() => setIsLoading(false));
  }, [query, setSearchParams]);

  const categories = [...new Set(posts.map((post) => post.category).filter(Boolean))];
  const updateFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value, page: "1" }));
  const clearTag = () => setFilters((current) => ({ ...current, tag: "", page: "1" }));
  const setPage = (page) => setFilters((current) => ({ ...current, page: String(page) }));

  return (
    <section className="editorial-page">
      <SEO title="Cantley Blog" description="Fashion inspiration, custom printing ideas, and Cantley style stories." canonical={`/blog${query ? `?${query}` : ""}`} />
      <div className="editorial-hero">
        <p className="eyebrow">Cantley Journal</p>
        <h1>Custom printing ideas, fashion notes, and small-batch style</h1>
        <p>Read practical guides and inspiration for apparel, labels, stickers, and customer-ready brand moments.</p>
      </div>
      <div className="filter-bar">
        <input name="search" value={filters.search} onChange={updateFilter} placeholder="Search stories" />
        <input name="category" value={filters.category} onChange={updateFilter} list="blog-categories" placeholder="Category" />
        <input name="tag" value={filters.tag} onChange={updateFilter} placeholder="Tag" />
        <datalist id="blog-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
        {filters.tag ? (
          <button className="secondary-button" type="button" onClick={clearTag}>
            Clear tag
          </button>
        ) : null}
      </div>
      {isLoading ? <div className="analytics-skeleton">Loading Cantley stories...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}
      {!isLoading && !posts.length && !error ? (
        <div className="empty-state"><h2>No posts yet</h2><p>Published Cantley stories will appear here.</p></div>
      ) : (
        <>
          <div className="editorial-grid">
            {posts.map((post) => (
              <article className="editorial-card" key={post._id}>
                <Link to={`/blog/${post.slug}`} className="editorial-image">
                  <img src={getOptimizedImageUrl(post.coverImage, { width: 900 }) || "https://placehold.co/900x650/f1f5f9/334155?text=Cantley"} alt={post.title} />
                </Link>
                <div>
                  <p className="eyebrow">{post.category}</p>
                  <h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2>
                  <p>{post.excerpt}</p>
                  <span>{post.author || "Cantley"} | {Number(post.views || 0).toLocaleString("en-IN")} views</span>
                </div>
              </article>
            ))}
          </div>
          <div className="pagination">
            <button className="secondary-button" disabled={meta.page <= 1} type="button" onClick={() => setPage(meta.page - 1)}>Previous</button>
            <span>Page {meta.page} of {meta.pages}</span>
            <button className="secondary-button" disabled={meta.page >= meta.pages} type="button" onClick={() => setPage(meta.page + 1)}>Next</button>
          </div>
        </>
      )}
    </section>
  );
};

export default Blog;
