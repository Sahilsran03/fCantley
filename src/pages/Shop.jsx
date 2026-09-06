import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import ProductCard from "../components/ProductCard.jsx";
import SEO from "../components/SEO.jsx";
import { ProductGridSkeleton } from "../components/Skeleton.jsx";
import api from "../services/api.js";
import { breadcrumbSchema, truncate } from "../utils/seo.js";
import "./Shop.css";

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

const supportedFilterKeys = Object.keys(initialFilters);
const filterOnlyKeys = ["category", "productType", "material", "color", "minPrice", "maxPrice", "minRating", "inStock", "featured"];
const sortOptions = ["featured", "trending", "best-selling", "most-viewed", "highest-rated", "most-reviewed", "latest", "price-asc", "price-desc"];

const positiveInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? String(number) : "1";
};

const nonNegativeNumber = (value) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? String(number) : "";
};

const filtersFromSearchParams = (params) => {
  const next = { ...initialFilters };
  next.q = params.get("q") || "";
  next.category = params.get("category") || "";
  next.productType = params.get("productType") || "";
  next.material = params.get("material") || "";
  next.color = params.get("color") || "";
  next.minPrice = nonNegativeNumber(params.get("minPrice"));
  next.maxPrice = nonNegativeNumber(params.get("maxPrice"));
  next.minRating = ["3", "4"].includes(params.get("minRating")) ? params.get("minRating") : "";
  next.inStock = params.get("inStock") === "true" ? "true" : "";
  next.featured = params.get("featured") === "true" ? "true" : "";
  next.sort = sortOptions.includes(params.get("sort")) ? params.get("sort") : "featured";
  next.page = positiveInteger(params.get("page"));
  return next;
};

const ProductTypeLabels = {
  tshirt: "T-shirt",
  "oversized-tshirt": "Oversized T-shirt",
  hoodie: "Hoodie",
  sticker: "Sticker",
  label: "Label",
  other: "Other",
  clothing: "Other clothing"
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchKey]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const filterButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const requestIdRef = useRef(0);
  const resultsRef = useRef(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedCategory = categories.find((category) => category.slug === filters.category);
  const query = useMemo(() => {
    const params = new URLSearchParams();
    supportedFilterKeys.forEach((key) => {
      const value = filters[key];
      if (value && !(key === "page" && value === "1") && !(key === "sort" && value === "featured")) {
        params.set(key, value);
      }
    });
    return params.toString();
  }, [filters]);

  const requestQuery = useMemo(() => {
    const params = new URLSearchParams(query);
    if (!params.has("sort")) params.set("sort", filters.sort);
    return params.toString();
  }, [filters.sort, query]);

  const updateUrlFilters = (updater) => {
    const nextFilters = updater(filters);
    const nextParams = new URLSearchParams(searchParams);

    supportedFilterKeys.forEach((key) => nextParams.delete(key));
    supportedFilterKeys.forEach((key) => {
      const value = nextFilters[key];
      if (value && !(key === "page" && value === "1") && !(key === "sort" && value === "featured")) {
        nextParams.set(key, value);
      }
    });

    setSearchParams(nextParams);
  };

  useEffect(() => {
    api.get("/categories").then((response) => setCategories(response.data.categories || [])).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setProducts([]);

    api
      .get(`/products?limit=12${requestQuery ? `&${requestQuery}` : ""}`, { signal: controller.signal })
      .then((response) => {
        if (requestId !== requestIdRef.current) return;

        const responseProducts = response.data.products || [];
        setProducts(responseProducts);
        setMeta({
          total: response.data.total || 0,
          page: response.data.page || 1,
          totalPages: response.data.totalPages || response.data.pages || 1
        });

      })
      .catch((requestError) => {
        if (requestId === requestIdRef.current && requestError.name !== "CanceledError") {
          setProducts([]);
          setError(requestError.response?.data?.message || "Unable to load products.");
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });

    return () => controller.abort();
  }, [requestQuery, retryNonce]);

  useEffect(() => {
    if (loading || error || Number(filters.page) <= Number(meta.totalPages || 1)) return;
    updateUrlFilters((current) => ({ ...current, page: String(Math.max(1, Number(meta.totalPages) || 1)) }));
  }, [error, filters.page, loading, meta.totalPages]);

  const clearFilterFields = (current) => ({
    ...current,
    category: "",
    productType: "",
    material: "",
    color: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
    inStock: "",
    featured: "",
    page: "1"
  });

  const setPage = (page) => {
    updateUrlFilters((current) => ({ ...current, page: positiveInteger(page) }));
    window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const updateSort = (event) => {
    updateUrlFilters((current) => ({ ...current, sort: event.target.value, page: "1" }));
  };

  const resetFilters = () => {
    updateUrlFilters((current) => clearFilterFields(current));
  };

  const openFilterDrawer = () => {
    setDraftFilters({ ...filters });
    setIsFilterOpen(true);
  };

  const closeFilterDrawer = () => {
    setIsFilterOpen(false);
    window.setTimeout(() => filterButtonRef.current?.focus(), 0);
  };

  const updateDraftFilter = (event) => {
    const value = event.target.type === "checkbox" ? (event.target.checked ? "true" : "") : event.target.value;
    setDraftFilters((current) => ({ ...current, [event.target.name]: value }));
  };


  const clearDrawerFilters = () => {
    updateUrlFilters((current) => clearFilterFields(current));
    closeFilterDrawer();
  };

  const applyDraftFilters = () => {
    const minPrice = nonNegativeNumber(draftFilters.minPrice);
    const maxPrice = nonNegativeNumber(draftFilters.maxPrice);
    const normalizedDraft = {
      ...draftFilters,
      material: draftFilters.material.trim(),
      color: draftFilters.color.trim(),
      minPrice,
      maxPrice
    };
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      normalizedDraft.minPrice = maxPrice;
      normalizedDraft.maxPrice = minPrice;
    }
    updateUrlFilters((current) => ({
      ...current,
      ...Object.fromEntries(filterOnlyKeys.map((key) => [key, normalizedDraft[key]])),
      page: "1"
    }));
    closeFilterDrawer();
  };

  const removeFilter = (key) => {
    updateUrlFilters((current) => ({
      ...current,
      [key]: "",
      page: "1"
    }));
  };

  const clearActiveFilters = () => {
    updateUrlFilters((current) => clearFilterFields(current));
  };

  const clearSearch = () => {
    updateUrlFilters((current) => ({ ...current, q: "", page: "1" }));
  };

  useEffect(() => {
    if (!isFilterOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeFilterDrawer();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = drawerRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const frame = window.requestAnimationFrame(() => drawerRef.current?.querySelector("[data-filter-drawer-focus]")?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.cancelAnimationFrame(frame);
    };
  }, [isFilterOpen]);

  const activeFilters = filterOnlyKeys.filter((key) => filters[key]);
  const activeFilterCount = activeFilters.length;
  const activeFilterLabel = (key) => {
    if (key === "category") return categories.find((category) => category.slug === filters.category)?.name || filters.category;
    if (key === "productType") return ProductTypeLabels[filters.productType] || filters.productType;
    if (key === "minPrice" || key === "maxPrice") {
      if (filters.minPrice && filters.maxPrice) return `Rs. ${filters.minPrice}-Rs. ${filters.maxPrice}`;
      return filters.minPrice ? `From Rs. ${filters.minPrice}` : `Up to Rs. ${filters.maxPrice}`;
    }
    if (key === "minRating") return `${filters.minRating} stars & up`;
    if (key === "inStock") return "In stock";
    if (key === "featured") return "Featured";
    return filters[key];
  };
  const activeChipKeys = activeFilters.filter((key) => !(key === "maxPrice" && filters.minPrice));
  const title = selectedCategory ? `${selectedCategory.name} Collection` : filters.q ? `Search results for ${filters.q}` : "Shop Cantley";
  const hasActiveDiscovery = Boolean(filters.q || activeFilterCount || filters.sort !== "featured");
  const description = truncate(selectedCategory?.description || "Browse Cantley custom apparel, stickers, labels, featured products, and top-rated products.");

  return (
    <section className="catalog-page shop-page">
      <SEO
        title={title}
        description={description}
        canonical={`/shop${query ? `?${query}` : ""}`}
        schema={[breadcrumbSchema([{ name: "Home", url: "/" }, { name: "Shop", url: "/shop" }])]}
      />
      <header className="shop-collection-header">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
        <div className="shop-collection-heading">
          <div>
            <p className="eyebrow">Collection</p>
            <h1>{filters.q ? `Search results for "${filters.q}"` : selectedCategory?.name || "Shop all"}</h1>
          </div>
          <p className="shop-result-count" aria-live="polite">
            {loading ? "Loading products..." : `${meta.total} ${meta.total === 1 ? "product" : "products"}`}
          </p>
        </div>
        {filters.q ? <button className="text-link shop-clear-search" type="button" onClick={clearSearch}>Clear search</button> : null}
        {selectedCategory?.description ? <p className="shop-collection-description">{selectedCategory.description}</p> : null}
      </header>

      <div className="discovery-toolbar">
        <button ref={filterButtonRef} className="secondary-button filter-drawer-button" type="button" onClick={openFilterDrawer} aria-haspopup="dialog" aria-expanded={isFilterOpen}>
          Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
        </button>
        <label className="shop-sort-control">
          <span>Sort by</span>
          <select name="sort" value={filters.sort} onChange={updateSort} aria-label="Sort products">
            {sortOptions.map((option) => <option key={option} value={option}>{ProductTypeLabels[option] || option.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}</option>)}
          </select>
        </label>
      </div>

      {activeChipKeys.length ? (
        <div className="active-filter-chips" aria-label="Active filters">
          {activeChipKeys.map((key) => (
            <span className="active-filter-chip" key={key}>
              {activeFilterLabel(key)}
              <button type="button" onClick={() => removeFilter(key)} aria-label={`Remove ${activeFilterLabel(key)} filter`}>Remove</button>
            </span>
          ))}
          {activeChipKeys.length > 1 ? <button className="clear-active-filters" type="button" onClick={clearActiveFilters}>Clear all</button> : null}
        </div>
      ) : null}

      {isFilterOpen ? (
        <div className="shop-filter-drawer" role="presentation">
          <button className="shop-filter-drawer-backdrop" type="button" aria-label="Close filters" onClick={closeFilterDrawer} />
          <aside ref={drawerRef} className="shop-filter-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="shop-filter-drawer-title">
            <header className="shop-filter-drawer-header">
              <h2 id="shop-filter-drawer-title">Filters</h2>
              <button data-filter-drawer-focus className="shop-filter-close" type="button" onClick={closeFilterDrawer} aria-label="Close filters">Close</button>
            </header>
            <div className="shop-filter-drawer-body">
              <label>
                Category
                <select name="category" value={draftFilters.category} onChange={updateDraftFilter}>
                  <option value="">All categories</option>
                  {categories.map((category) => <option key={category._id} value={category.slug}>{category.name}</option>)}
                </select>
              </label>
              <label>
                Product type
                <select name="productType" value={draftFilters.productType} onChange={updateDraftFilter}>
                  <option value="">All types</option>
                  {Object.entries(ProductTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                Material
                <input name="material" value={draftFilters.material} onChange={updateDraftFilter} placeholder="Cotton, vinyl, paper" />
              </label>
              <label>
                Color
                <input name="color" value={draftFilters.color} onChange={updateDraftFilter} placeholder="Black, white, red" />
              </label>
              <div className="shop-price-fields">
                <label>
                  Min price
                  <input name="minPrice" type="number" min="0" value={draftFilters.minPrice} onChange={updateDraftFilter} placeholder="0" />
                </label>
                <label>
                  Max price
                  <input name="maxPrice" type="number" min="0" value={draftFilters.maxPrice} onChange={updateDraftFilter} placeholder="5000" />
                </label>
              </div>
              <label>
                Minimum rating
                <select name="minRating" value={draftFilters.minRating} onChange={updateDraftFilter}>
                  <option value="">Any rating</option>
                  <option value="4">4 stars & up</option>
                  <option value="3">3 stars & up</option>
                </select>
              </label>
              <fieldset>
                <legend>Availability</legend>
                <label className="shop-filter-check">
                  <input name="inStock" type="checkbox" checked={draftFilters.inStock === "true"} onChange={updateDraftFilter} />
                  In stock only
                </label>
              </fieldset>
              <fieldset>
                <legend>Featured</legend>
                <label className="shop-filter-check">
                  <input name="featured" type="checkbox" checked={draftFilters.featured === "true"} onChange={updateDraftFilter} />
                  Featured products only
                </label>
              </fieldset>
            </div>
            <footer className="shop-filter-drawer-footer">
              <button className="shop-filter-clear" type="button" onClick={clearDrawerFilters}>Clear all</button>
              <button className="shop-filter-apply" type="button" onClick={applyDraftFilters}>Apply filters</button>
            </footer>
          </aside>
        </div>
      ) : null}

            <div className="discovery-layout">
        <div className="discovery-results" ref={resultsRef}>
          {loading ? (
            <div className="shop-loading-state" role="status" aria-live="polite">
              <span className="visually-hidden">Loading products</span>
              <ProductGridSkeleton count={12} />
            </div>
          ) : error ? (
            <section className="shop-feedback-state shop-error-state" role="alert">
              <h2>Products could not be loaded</h2>
              <p>{error}</p>
              <button className="secondary-button" type="button" onClick={() => setRetryNonce((value) => value + 1)}>Retry</button>
            </section>
          ) : (
            <>
              <div className="product-grid">
                {products.map((product) => <ProductCard key={product._id} product={product} />)}
              </div>
              {!products.length ? (
                <section className="shop-feedback-state shop-empty-state">
                  <h2>{hasActiveDiscovery ? "No matching products" : "The catalog is being prepared"}</h2>
                  <p>{hasActiveDiscovery ? "Try changing your search, filters, or sort option." : "There are no products to show right now. Please check back soon."}</p>
                  {hasActiveDiscovery ? <button className="secondary-button" type="button" onClick={resetFilters}>Clear filters</button> : null}
                </section>
              ) : null}
              {products.length ? (
                <div className="pagination">
                  <button className="secondary-button" type="button" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)} aria-label="Previous products page">Previous</button>
                  <span aria-current="page">Page {meta.page} of {meta.totalPages}</span>
                  <button className="secondary-button" type="button" disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)} aria-label="Next products page">Next</button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Shop;
