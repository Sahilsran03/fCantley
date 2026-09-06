import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";
import { createDesigns, formatPrice, isAvailable, previewGuides } from "./studioPreview.js";
import "./DesignStudio.css";
import { ArtworkCanvas, ArtworkControls } from "./StudioArtwork.jsx";
import StudioPersistenceActions from "./StudioPersistenceActions.jsx";

const values = (variants, key) => [...new Set(variants.map((variant) => variant[key]).filter(Boolean))];
const variantLabel = (variant, index) => [variant.sku, variant.material, variant.printType, variant.finish, variant.shape,
  variant.width != null && variant.height != null ? `${variant.width} x ${variant.height} ${variant.unit || ""}` : "",
  variant.waterproof ? "Waterproof" : ""].filter(Boolean).join(" / ") || `Option ${index + 1}`;

const StudioImage = ({ source, name, side, design, onChange, onImageRatio }) => {
  const [failed, setFailed] = useState(false);
  const [ratio, setRatio] = useState(null);
  const guide = previewGuides[side];
  if (!source || failed) return <p className="basic-studio-empty">Product image unavailable.</p>;
  return <div className="basic-studio-image" style={ratio ? { width: `min(100%, ${480 * ratio}px)` } : undefined}>
    <img src={source} alt={`${name} catalog preview`} onError={() => { setFailed(true); onImageRatio(null); }} onLoad={(event) => { const next = event.currentTarget.naturalWidth / event.currentTarget.naturalHeight; setRatio(next); onImageRatio(next); }} />
    {ratio && <div className="basic-studio-guide" aria-hidden="true" style={{ left: `${guide.x * 100}%`, top: `${guide.y * 100}%`, width: `${guide.width * 100}%`, height: `${guide.height * 100}%` }} />}
    {ratio && <ArtworkCanvas design={design} side={side} onChange={onChange} />}
  </div>;
};

const DesignStudio = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeSide, setActiveSide] = useState("front");
  const [designs, setDesigns] = useState(createDesigns);
  const [imageRatio, setImageRatio] = useState(null);
  const [persistenceBusy, setPersistenceBusy] = useState(false);
  const [uploadPending, setUploadPending] = useState(false);
  const objectUrls = useRef(new Set());
  useEffect(() => {
    const current = new Set(Object.values(designs).map((design) => design?.source).filter(Boolean));
    objectUrls.current.forEach((source) => { if (!current.has(source)) URL.revokeObjectURL(source); });
    objectUrls.current = current;
  }, [designs]);
  useEffect(() => () => { objectUrls.current.forEach((source) => URL.revokeObjectURL(source)); }, []);
  const updateArtwork = (side, design) => setDesigns((current) => ({ ...current, [side]: design }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const variants = selectedProduct?.variants || [];
  const selectedColor = selectedVariant?.color || "";
  const selectedSize = selectedVariant?.size || "";
  const colors = values(variants, "color");
  const sizes = values(variants, "size");
  const matchingVariants = variants.filter((variant) => (variant.color || "") === selectedColor && (variant.size || "") === selectedSize);
  const query = new URLSearchParams(location.search);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    setLoading(true);
    setError("");
    const load = async () => {
      // Existing backend design/cart eligibility is any active product, with stock checked per variant.
      // There is no separate customizable flag or customizable-product endpoint.
      let page = 1;
      let pages = 1;
      const catalog = [];
      do {
        const response = await api.get("/products", { params: { page, limit: 48 }, signal: controller.signal });
        catalog.push(...(response.data.products || []));
        pages = response.data.totalPages || response.data.pages || 1;
        page += 1;
      } while (page <= pages);
      if (mounted) setProducts(catalog.filter((product) => product.isActive !== false));
    };
    load().catch((requestError) => {
      if (mounted && requestError.name !== "CanceledError") setError("Unable to load products. Please try again.");
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; controller.abort(); };
  }, [attempt]);

  useEffect(() => {
    if (loading || error) return;
    const params = new URLSearchParams(location.search);
    const requested = params.get("slug") || params.get("product") || location.state?.product?._id;
    const product = requested ? products.find((item) => item._id === requested || item.slug === requested) : null;
    setSelectedProduct(product || null);
    setSelectedVariant(product?.variants?.find(isAvailable) || product?.variants?.[0] || null);
    setSelectionError(requested && !product ? "This product is unavailable. Please choose another product." : "");
    setActiveSide("front");
    setDesigns(createDesigns());
    setImageRatio(null);
  }, [products, loading, error, location.search, location.state]);

  const chooseProduct = (id) => {
    const product = products.find((item) => item._id === id);
    const params = new URLSearchParams(location.search);
    params.delete("product"); params.delete("slug"); params.delete("type"); params.delete("design");
    if (product) { params.set("product", product._id); params.set("slug", product.slug); }
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params}` : "" }, { replace: true, state: null });
  };
  const chooseColor = (color) => {
    const candidates = variants.filter((variant) => variant.color === color && isAvailable(variant));
    setSelectedVariant(candidates.find((variant) => (variant.size || "") === selectedSize) || candidates[0] || null);
  };
  const image = getMediaUrl(selectedProduct?.images?.[0]);

  return <section className="basic-studio" aria-labelledby="studio-title">
    <header className="basic-studio-heading"><div><p className="basic-studio-kicker">Cantley Studio</p><h1 id="studio-title">Make it yours</h1><p>Choose your product, color and size to start your preview.</p></div><Link to="/designs">My designs</Link></header>
    {query.get("design") && <p className="basic-studio-notice" role="status">Saved artwork editing is not available in this basic preview. Your saved design has not been changed.</p>}
    {error && <div className="basic-studio-notice" role="alert">{error} <button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></div>}
    {selectionError && <p className="basic-studio-notice" role="alert">{selectionError}</p>}
    <div className="basic-studio-layout">
      <aside inert={persistenceBusy} className="basic-studio-controls" aria-labelledby="studio-product-title">
        <h2 id="studio-product-title">Choose Product</h2>
        <label className="basic-studio-label" htmlFor="studio-product">Product</label>
        <select id="studio-product" value={selectedProduct?._id || ""} disabled={loading || Boolean(error)} onChange={(event) => chooseProduct(event.target.value)}><option value="">Select a product</option>{products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}</select>
        {loading ? <p role="status">Loading products...</p> : !error && !products.length ? <p role="status">No products are available.</p> : null}
        {selectedProduct && <>
          <div className="basic-studio-product">{image && <img key={image} src={image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />}<div><strong>{selectedProduct.name}</strong><span>Base price {formatPrice(selectedProduct.basePrice)}</span></div></div>
          <fieldset><legend>Color{selectedColor ? `: ${selectedColor}` : ""}</legend><div className="basic-studio-options">{colors.map((color) => <button type="button" key={color} aria-pressed={color === selectedColor} disabled={!variants.some((variant) => variant.color === color && isAvailable(variant))} onClick={() => chooseColor(color)}>{/^#[0-9a-f]{6}$/i.test(color) && <span className="basic-studio-swatch" style={{ backgroundColor: color }} aria-hidden="true" />}{color}</button>)}</div>{!colors.length && <p>No color options supplied.</p>}</fieldset>
          <fieldset><legend>Size</legend><div className="basic-studio-options">{sizes.map((size) => <button type="button" key={size} aria-pressed={size === selectedSize} disabled={!variants.some((variant) => (variant.color || "") === selectedColor && variant.size === size && isAvailable(variant))} onClick={() => setSelectedVariant(variants.find((variant) => (variant.color || "") === selectedColor && variant.size === size && isAvailable(variant)))}>{size}</button>)}</div>{!sizes.length && <p>No size options supplied.</p>}</fieldset>
          {matchingVariants.length > 1 && <label className="basic-studio-label">Variant<select value={variants.indexOf(selectedVariant)} onChange={(event) => setSelectedVariant(variants[Number(event.target.value)])}>{matchingVariants.map((variant) => <option key={variants.indexOf(variant)} value={variants.indexOf(variant)} disabled={!isAvailable(variant)}>{variantLabel(variant, variants.indexOf(variant))}{!isAvailable(variant) ? " - Out of stock" : ""}</option>)}</select></label>}
          {selectedVariant && !isAvailable(selectedVariant) && <p role="status">This variant is out of stock.</p>}
        </>}
      </aside>
      <section inert={persistenceBusy} className="basic-studio-workspace" aria-label="Product preview">
        <div className="basic-studio-sides" role="group" aria-label="Preview side">{["front", "back"].map((side) => <button type="button" key={side} aria-pressed={activeSide === side} onClick={() => setActiveSide(side)}>{side === "front" ? "Front" : "Back"}</button>)}</div>
        <div className="basic-studio-stage">{selectedProduct && !loading && !error ? <StudioImage key={selectedProduct._id + image} source={image} name={selectedProduct.name} side={activeSide} design={designs[activeSide]} onChange={(design) => updateArtwork(activeSide, design)} onImageRatio={setImageRatio} /> : <p className="basic-studio-empty">Choose a product to see its preview.</p>}</div>
        {selectedProduct && <p className="basic-studio-caption">Catalog image shown for both sides and all colors. Dashed area is a preview guide only, not an accurate print boundary.</p>}
      </section>
      <aside className="basic-studio-summary" aria-labelledby="studio-summary-title">
        <div inert={persistenceBusy}><ArtworkControls onPendingChange={setUploadPending} key={`${selectedProduct?._id || "none"}-${activeSide}`} side={activeSide} design={designs[activeSide]} imageRatio={imageRatio} disabled={!selectedProduct || !imageRatio || loading || Boolean(error)} onChange={(design) => updateArtwork(activeSide, design)} /></div>
        <h2 id="studio-summary-title">Your Design</h2>
        <dl><dt>Product</dt><dd>{selectedProduct?.name || "Not selected"}</dd><dt>Color</dt><dd>{selectedColor || "Not specified"}</dd><dt>Size</dt><dd>{selectedSize || "Not specified"}</dd><dt>Side</dt><dd>{activeSide === "front" ? "Front" : "Back"}</dd><dt>Front artwork</dt><dd>{designs.front?.fileName || "No design uploaded yet"}</dd><dt>Back artwork</dt><dd>{designs.back?.fileName || "No design uploaded yet"}</dd><dt>Base price</dt><dd>{selectedProduct ? formatPrice(selectedProduct.basePrice) : "Select a product"}</dd>{selectedVariant && <><dt>Variant price adjustment</dt><dd>{formatPrice(selectedVariant.priceModifier)}</dd></>}</dl>
        <p>Prices shown are the catalog base price and variant adjustment. Cart pricing is confirmed by the server.</p>
        <StudioPersistenceActions key={selectedProduct?._id || "none"} product={selectedProduct} variant={selectedVariant} designs={designs} imageRatio={imageRatio} uploadPending={uploadPending} onBusyChange={setPersistenceBusy} />
      </aside>
    </div>
  </section>;
};
export default DesignStudio;
