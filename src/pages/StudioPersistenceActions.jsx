import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import api from "../services/api.js";
import { artworkSides, exportStudioPreview, serializeStudio, validateStudio, variantOptions } from "./studioPersistence.js";

const containsDesign = (cart, id) => cart?.items?.some((item) => (item.customDesign?._id || item.customDesign) === id);

const StudioPersistenceActions = ({ product, variant, designs, imageRatio, uploadPending, onBusyChange }) => {
  const navigate = useNavigate();
  const { loadCart } = useCart();
  const lock = useRef(false);
  const requestKey = useRef(null);
  if (!requestKey.current) requestKey.current = crypto.randomUUID();
  const saved = useRef(null);
  const uncertainSave = useRef(null);
  const cartConfirmed = useRef(false);
  const cartUncertain = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const invalid = validateStudio(product, variant, designs, imageRatio);

  const run = async (addToCart) => {
    if (lock.current || uploadPending) return;
    if (invalid && !cartConfirmed.current && !cartUncertain.current) { setError(invalid); return; }
    lock.current = true; setBusy(true); onBusyChange(true); setError(""); setMessage("");
    let stage = "save";
    try {
      if (cartConfirmed.current || cartUncertain.current) {
        stage = "refresh";
        const cart = await loadCart();
        if (cartConfirmed.current || containsDesign(cart, saved.current?.id)) {
          cartConfirmed.current = true; setMessage("Custom design added to cart."); navigate("/cart"); return;
        }
        // The endpoint has no idempotency key: never blindly repeat an ambiguous cart POST.
        throw new Error("The cart request could not be confirmed. Check your cart before trying again; this preview will not submit a duplicate request.");
      }
      const sides = artworkSides(designs);
      const files = sides.map((side) => designs[side].file);
      const canvasJson = serializeStudio(designs, requestKey.current, imageRatio);
      const signature = JSON.stringify({ product: product._id, variant: variantOptions(variant), canvasJson });
      if (uncertainSave.current) {
        setMessage("Checking the previous save...");
        const response = await api.get("/designs/my-designs");
        const found = response.data.designs?.find((design) => design.canvasJson?.basicStudio?.requestKey === requestKey.current);
        if (!found) throw new Error("The previous save could not be confirmed. Check My designs before starting a new save; your local artwork is still available.");
        saved.current = { ...uncertainSave.current, id: found._id };
        uncertainSave.current = null;
      }
      const filesMatch = saved.current?.files.length === files.length && files.every((file, index) => saved.current.files[index] === file);
      if (!saved.current || saved.current.signature !== signature || !filesMatch) {
        stage = "preview"; setMessage("Exporting product preview...");
        const preview = await exportStudioPreview(product, designs);
        const body = new FormData();
        body.append("productId", product._id);
        // Same design-type mapping used by the existing ProductDetails -> legacy Studio flow.
        body.append("designType", ["hoodie", "sticker", "label"].includes(product.productType) ? product.productType : "tshirt");
        body.append("status", "Draft");
        body.append("placement", sides[0]);
        body.append("customization", JSON.stringify({ placement: sides[0] }));
        body.append("variantSnapshot", JSON.stringify(variantOptions(variant)));
        body.append("canvasJson", JSON.stringify(canvasJson));
        body.append("previewImage", preview, "cantley-studio-preview.png");
        if (!filesMatch) sides.forEach((side) => body.append("sourceFiles", designs[side].file, `${side}-${designs[side].fileName}`));
        stage = "save"; setMessage("Uploading artwork and saving design...");
        let response;
        try {
          response = saved.current?.id
            ? await api.put(`/designs/${saved.current.id}`, body, { timeout: 120000 })
            : await api.post("/designs/save-draft", body, { timeout: 120000 });
        } catch (requestError) {
          if ((!requestError.response || requestError.response.status >= 500) && !saved.current?.id) uncertainSave.current = { signature, files };
          throw requestError;
        }
        if (!response.data.design?._id) {
          if (!saved.current?.id) uncertainSave.current = { signature, files };
          throw new Error("The server did not return a saved design reference.");
        }
        saved.current = { id: response.data.design._id, signature, files };
      }
      setMessage("Design saved.");
      if (addToCart) {
        stage = "cart"; setMessage("Adding saved design to cart...");
        try { await api.post(`/designs/${saved.current.id}/add-to-cart`); }
        catch (requestError) { if (!requestError.response || requestError.response.status >= 500) cartUncertain.current = true; throw requestError; }
        cartConfirmed.current = true;
        stage = "refresh"; await loadCart();
        setMessage("Custom design added to cart."); navigate("/cart");
      }
    } catch (requestError) {
      setMessage("");
      const details = requestError.response?.data?.message || requestError.message;
      const prefix = stage === "preview" ? "Preview export failed. The product image may not allow canvas export."
        : stage === "cart" ? "Unable to confirm Add to Cart. Your saved design is retained."
        : stage === "refresh" ? "Cart confirmation needs attention."
        : "Artwork upload/design save failed. Your local artwork is retained.";
      setError(`${prefix} ${details || "Please try again."}`);
    } finally { lock.current = false; setBusy(false); onBusyChange(false); }
  };
  return <div className="studio-persistence">
    {invalid && <p>{invalid}</p>}
    <button type="button" disabled={busy || uploadPending || Boolean(invalid) || cartConfirmed.current || cartUncertain.current} onClick={() => run(false)}>Save Design</button>
    <button className="basic-studio-cart" type="button" disabled={busy || uploadPending || (Boolean(invalid) && !cartConfirmed.current && !cartUncertain.current)} onClick={() => run(true)}>{cartConfirmed.current || cartUncertain.current ? "Check Cart" : "Add to Cart"}</button>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
};
export default StudioPersistenceActions;
