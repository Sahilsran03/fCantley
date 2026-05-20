import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import ProductCard from "../components/ProductCard.jsx";
import SEO from "../components/SEO.jsx";
import { ProductGridSkeleton } from "../components/Skeleton.jsx";
import api from "../services/api.js";
import { breadcrumbSchema, truncate } from "../utils/seo.js";

const initialFilters = {
  category: "",
  productType: "",
  material: "",
  color: "",
  minPrice: "",
  maxPrice: "",
  minRating: "",
  inStock: "",
  featured: "",
  sort: "featured",
  q: "",
  page: "1"
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    ...Object.fromEntries(searchParams.entries())
  }));
  const [suggestions, setSuggestions] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedCategory = categories.find((category) => category.slug === filters.category);
  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !(key === "page" && value === "1")) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    api.get("/categories").then((response) => setCategories(response.data.categories || []));
  }, []);

  useEffect(() => {
    setSearchParams(query, { replace: true });
    const controller = new AbortController();
    setLoading(true);

    api
      .get(`/products?limit=12${query ? `&${query}` : ""}`, { signal: controller.signal })
      .then((response) => {
        setProducts(response.data.products || []);
        setMeta({
          total: response.data.total || 0,
          page: response.data.page || 1,
          totalPages: response.data.totalPages || response.data.pages || 1
        });
        setError("");
        if (!(response.data.products || []).length) {
          api
            .get("/products", { params: { limit: 4, sort: "trending", featured: "true" } })
            .then((suggestionResponse) => setSuggestedProducts(suggestionResponse.data.products || []))
            .catch(() => setSuggestedProducts([]));
        } else {
          setSuggestedProducts([]);
        }
      })
      .catch((requestError) => {
        if (requestError.name !== "CanceledError") {
          setError(requestError.response?.data?.message || "Unable to load products.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query, setSearchParams]);

  useEffect(() => {
    if (!filters.q || filters.q.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      api
        .get(`/products?q=${encodeURIComponent(filters.q)}&limit=5`)
        .then((response) => setSuggestions(response.data.products || []))
        .catch(() => setSuggestions([]));
    }, 220);

    return () => window.clearTimeout(timer);
  }, [filters.q]);

  const updateFilter = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value, page: "1" }));
  };

  const updateCheckboxFilter = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.checked ? "true" : "", page: "1" }));
  };

  const setPage = (page) => {
    setFilters((current) => ({ ...current, page: String(page) }));
  };

  const resetFilters = () => setFilters(initialFilters);
  const title = selectedCategory ? `${selectedCategory.name} Collection` : filters.q ? `Search results for ${filters.q}` : "Shop Cantley";
  const description = truncate(selectedCategory?.description || "Browse Cantley custom apparel, stickers, labels, featured products, and top-rated products.");
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => value && !["page", "sort"].includes(key)).length;

  const filterControls = (
    <div className="discovery-filter-panel">
      <div className="filter-panel-heading">
        <strong>Filters</strong>
        <button className="text-link" type="button" onClick={resetFilters}>Clear all</button>
      </div>
      <label>
        Category
        <select name="category" value={filters.category} onChange={updateFilter} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Product type
        <select name="productType" value={filters.productType} onChange={updateFilter} aria-label="Product type">
          <option value="">All types</option>
          <option value="tshirt">T-shirt</option>
          <option value="oversized-tshirt">Oversized T-shirt</option>
          <option value="hoodie">Hoodie</option>
          <option value="sticker">Sticker</option>
          <option value="label">Label</option>
          <option value="other">Other</option>
          <option value="clothing">Other clothing</option>
        </select>
      </label>
      <label>
        Material
        <input name="material" value={filters.material} onChange={updateFilter} placeholder="Cotton, vinyl, paper" />
      </label>
      <label>
        Color
        <input name="color" value={filters.color} onChange={updateFilter} placeholder="Black, white, red" />
      </label>
      <div className="price-filter-row">
        <label>
          Min price
          <input name="minPrice" type="number" min="0" value={filters.minPrice} onChange={updateFilter} placeholder="0" />
        </label>
        <label>
          Max price
          <input name="maxPrice" type="number" min="0" value={filters.maxPrice} onChange={updateFilter} placeholder="5000" />
        </label>
      </div>
      <label>
        Minimum rating
        <select name="minRating" value={filters.minRating} onChange={updateFilter}>
          <option value="">Any rating</option>
          <option value="4">4 stars & up</option>
          <option value="3">3 stars & up</option>
        </select>
      </label>
      <label className="inline-check">
        <input name="inStock" type="checkbox" checked={filters.inStock === "true"} onChange={updateCheckboxFilter} />
        In stock only
      </label>
      <label className="inline-check">
        <input name="featured" type="checkbox" checked={filters.featured === "true"} onChange={updateCheckboxFilter} />
        Featured only
      </label>
    </div>
  );

  return (
    <section className="catalog-page">
      <SEO
        title={title}
        description={description}
        canonical={`/shop${query ? `?${query}` : ""}`}
        schema={[breadcrumbSchema([{ name: "Home", url: "/" }, { name: "Shop", url: "/shop" }])]}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />

      <div className="page-heading">
        <p className="eyebrow">Shop</p>
        <h1>{filters.q ? `Showing results for "${filters.q}"` : selectedCategory?.name || "Products"}</h1>
        <p>{description}</p>
      </div>

      <div className="search-panel">
        <label>
          Search products and categories
          <input name="q" value={filters.q} onChange={updateFilter} placeholder="Search Cantley products" autoComplete="off" />
        </label>
        {suggestions.length ? (
          <div className="search-suggestions">
            {suggestions.map((product) => (
              <button key={product._id} type="button" onClick={() => setFilters((current) => ({ ...current, q: product.name, page: "1" }))}>
                {product.name}
                <span>{product.category?.name || product.productType}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="discovery-toolbar">
        <button className="secondary-button filter-drawer-button" type="button" onClick={() => setIsFilterOpen(true)}>
          Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
        </button>
        <select name="sort" value={filters.sort} onChange={updateFilter} aria-label="Sort products">
          <option value="featured">Featured</option>
          <option value="trending">Trending</option>
          <option value="best-selling">Best selling</option>
          <option value="most-viewed">Most viewed</option>
          <option value="highest-rated">Highest rated</option>
          <option value="most-reviewed">Most reviewed</option>
          <option value="latest">Latest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
        <button className="secondary-button" type="button" onClick={resetFilters}>Reset</button>
      </div>

      {error ? <div className="form-alert">{error}</div> : null}
      <div className="discovery-layout">
        <aside className="desktop-filters">{filterControls}</aside>
        <div className={`filter-drawer ${isFilterOpen ? "open" : ""}`}>
          <button className="filter-drawer-backdrop" type="button" aria-label="Close filters" onClick={() => setIsFilterOpen(false)} />
          <div className="filter-drawer-panel">
            <button className="secondary-button" type="button" onClick={() => setIsFilterOpen(false)}>Close filters</button>
            {filterControls}
          </div>
        </div>
        <div className="discovery-results">
          {loading ? <ProductGridSkeleton /> : (
            <>
              <div className="collection-meta">{meta.total} products found</div>
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              {!products.length && !error ? (
                <div className="empty-state">
                  <h2>No active products found</h2>
                  <p>Try another Cantley category, material, color, price range, or search term.</p>
                  <button className="secondary-button" type="button" onClick={resetFilters}>Reset filters</button>
                </div>
              ) : null}
              {!products.length && suggestedProducts.length ? (
                <section className="catalog-section">
                  <div className="row-heading">
                    <div>
                      <p className="eyebrow">Suggested</p>
                      <h2>Popular Cantley picks</h2>
                    </div>
                  </div>
                  <div className="product-grid">
                    {suggestedProducts.map((product) => <ProductCard key={product._id} product={product} />)}
                  </div>
                </section>
              ) : null}
              {products.length ? <div className="pagination">
                <button className="secondary-button" type="button" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>Previous</button>
                <span>Page {meta.page} of {meta.totalPages}</span>
                <button className="secondary-button" type="button" disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)}>Next</button>
              </div> : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Shop;
