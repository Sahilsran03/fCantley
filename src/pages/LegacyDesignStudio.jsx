import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, FabricImage, Rect, Textbox } from "fabric";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";

const maxFileSize = 40 * 1024 * 1024;
const artworkTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const placements = ["front", "back", "left sleeve", "right sleeve", "full sticker"];
const fonts = ["Inter", "Arial", "Georgia", "Impact", "Poppins", "Montserrat"];
const exportKeys = ["id", "name", "selectable", "evented"];

const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const DesignStudio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadCart } = useCart();
  const { showToast } = useToast();
  const query = new URLSearchParams(location.search);
  const canvasEl = useRef(null);
  const canvasRef = useRef(null);
  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const skipHistoryRef = useRef(false);
  const [product, setProduct] = useState(location.state?.product || null);
  const [designId, setDesignId] = useState(query.get("design") || "");
  const [designType, setDesignType] = useState(query.get("type") || "tshirt");
  const [placement, setPlacement] = useState("front");
  const [zoom, setZoom] = useState(1);
  const [layers, setLayers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sourceFiles, setSourceFiles] = useState([]);
  const [status, setStatus] = useState("Draft");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [textProps, setTextProps] = useState({
    text: "Cantley",
    fontFamily: "Inter",
    fontSize: 42,
    fill: "#111827",
    fontWeight: "normal",
    fontStyle: "normal",
    charSpacing: 0,
    textAlign: "center",
    angle: 0
  });

  const productId = query.get("product") || product?._id || "";
  const productSlug = query.get("slug") || "";
  const selectedVariant = product?.variants?.[0] || null;
  const productImage = useMemo(() => getMediaUrl(product?.images?.[0]), [product]);

  const refreshLayers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setLayers(
      [...canvas.getObjects()]
        .filter((object) => object.name !== "safe-print-area" && object.name !== "product-mockup")
        .reverse()
        .map((object) => ({
          id: object.id,
          name: object.name || object.type,
          type: object.type,
          visible: object.visible !== false,
          locked: !object.selectable
        }))
    );
  }, []);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || skipHistoryRef.current) return;
    historyRef.current.push(JSON.stringify(canvas.toJSON(exportKeys)));
    historyRef.current = historyRef.current.slice(-30);
    redoRef.current = [];
    refreshLayers();
  }, [refreshLayers]);

  const selectObject = useCallback((object) => {
    setSelected(object || null);
    if (!object) return;
    setTextProps((current) => ({
      ...current,
      text: object.text ?? current.text,
      fontFamily: object.fontFamily || current.fontFamily,
      fontSize: object.fontSize || current.fontSize,
      fill: object.fill || current.fill,
      fontWeight: object.fontWeight || "normal",
      fontStyle: object.fontStyle || "normal",
      charSpacing: object.charSpacing || 0,
      textAlign: object.textAlign || current.textAlign,
      angle: object.angle || 0
    }));
  }, []);

  const checkSafeArea = useCallback(() => {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    const safe = canvas?.getObjects().find((item) => item.name === "safe-print-area");
    if (!canvas || !object || !safe || object.name === "safe-print-area") {
      setWarning("");
      return;
    }
    const area = safe.getBoundingRect();
    const bounds = object.getBoundingRect();
    const outside =
      bounds.left < area.left ||
      bounds.top < area.top ||
      bounds.left + bounds.width > area.left + area.width ||
      bounds.top + bounds.height > area.top + area.height;
    setWarning(outside ? "Selected layer is outside the safe print area." : "");
  }, []);

  useEffect(() => {
    if (!productSlug || product) return;
    api.get(`/products/${productSlug}`).then((response) => setProduct(response.data.product)).catch(() => setProduct(null));
  }, [product, productSlug]);

  useEffect(() => {
    const canvas = new Canvas(canvasEl.current, {
      width: 720,
      height: 620,
      backgroundColor: "#f8fafc",
      preserveObjectStacking: true
    });
    canvasRef.current = canvas;
    canvas.add(new Rect({
      left: 210,
      top: 118,
      width: 300,
      height: 380,
      fill: "transparent",
      stroke: "#22c55e",
      strokeDashArray: [8, 8],
      selectable: false,
      evented: false,
      name: "safe-print-area",
      excludeFromExport: true
    }));
    historyRef.current = [JSON.stringify(canvas.toJSON(exportKeys))];
    canvas.on("selection:created", (event) => selectObject(event.selected?.[0]));
    canvas.on("selection:updated", (event) => selectObject(event.selected?.[0]));
    canvas.on("selection:cleared", () => selectObject(null));
    ["object:modified", "object:moving", "object:scaling", "object:rotating"].forEach((eventName) => {
      canvas.on(eventName, () => {
        checkSafeArea();
        if (eventName === "object:modified") saveHistory();
      });
    });
    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
  }, [checkSafeArea, saveHistory, selectObject]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !productImage) return;
    FabricImage.fromURL(productImage, { crossOrigin: "anonymous" }).then((image) => {
      canvas.getObjects().filter((object) => object.name === "product-mockup").forEach((object) => canvas.remove(object));
      image.set({
        left: 110,
        top: 48,
        scaleX: 500 / image.width,
        scaleY: 500 / image.height,
        selectable: false,
        evented: false,
        name: "product-mockup",
        excludeFromExport: true,
        opacity: 0.72
      });
      canvas.add(image);
      canvas.sendObjectToBack(image);
      canvas.requestRenderAll();
    }).catch(() => {});
  }, [productImage]);

  useEffect(() => {
    if (!designId) return;
    api.get(`/designs/${designId}`).then(async (response) => {
      const design = response.data.design;
      setDesignType(design.designType || "tshirt");
      setPlacement(design.placement || design.customization?.placement || "front");
      setStatus(design.status || "Draft");
      if (design.canvasJson && canvasRef.current) {
        skipHistoryRef.current = true;
        await canvasRef.current.loadFromJSON(design.canvasJson);
        skipHistoryRef.current = false;
        canvasRef.current.requestRenderAll();
        saveHistory();
      }
    }).catch(() => setError("Unable to load saved design."));
  }, [designId, saveHistory]);

  const addText = () => {
    const canvas = canvasRef.current;
    const text = new Textbox(textProps.text || "Cantley", {
      id: makeId(),
      name: "Custom text",
      left: 270,
      top: 250,
      width: 240,
      ...textProps
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    saveHistory();
  };

  const addArtwork = async (file) => {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const image = await FabricImage.fromURL(dataUrl);
    image.set({
      id: makeId(),
      name: file.name.replace(/\.[^.]+$/, "") || "Artwork",
      left: 260,
      top: 210,
      scaleX: Math.min(220 / image.width, 1),
      scaleY: Math.min(220 / image.height, 1)
    });
    canvasRef.current.add(image);
    canvasRef.current.setActiveObject(image);
    canvasRef.current.requestRenderAll();
    saveHistory();
  };

  const uploadArtwork = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const invalid = files.find((file) => !artworkTypes.includes(file.type) || file.size > maxFileSize);
    if (invalid) {
      setError("Artwork must be jpg, jpeg, png, webp, or svg and 40MB or smaller.");
      return;
    }
    try {
      for (const file of files) await addArtwork(file);
      setSourceFiles((current) => [...current, ...files].slice(0, 5));
      setError("");
      showToast("Artwork added to canvas.");
    } catch {
      setError("Unable to add artwork to canvas.");
    } finally {
      event.target.value = "";
    }
  };

  const updateSelected = (changes) => {
    const object = canvasRef.current?.getActiveObject();
    if (!object || object.name === "safe-print-area") return;
    object.set(changes);
    canvasRef.current.requestRenderAll();
    setTextProps((current) => ({ ...current, ...changes }));
    checkSafeArea();
    saveHistory();
  };

  const objectAction = (action) => {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object || object.name === "safe-print-area") return;
    if (action === "delete") canvas.remove(object);
    if (action === "forward") canvas.bringObjectForward(object);
    if (action === "backward") canvas.sendObjectBackwards(object);
    if (action === "center-h") object.set({ left: (canvas.width - object.getScaledWidth()) / 2 });
    if (action === "center-v") object.set({ top: (canvas.height - object.getScaledHeight()) / 2 });
    if (action === "lock") object.set({ selectable: false, evented: false });
    if (action === "duplicate") {
      object.clone().then((clone) => {
        clone.set({ id: makeId(), name: `${object.name || "Layer"} copy`, left: object.left + 24, top: object.top + 24 });
        canvas.add(clone);
        canvas.setActiveObject(clone);
        canvas.requestRenderAll();
        saveHistory();
      });
      return;
    }
    canvas.requestRenderAll();
    saveHistory();
  };

  const undo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length < 2) return;
    redoRef.current.push(historyRef.current.pop());
    skipHistoryRef.current = true;
    await canvas.loadFromJSON(historyRef.current[historyRef.current.length - 1]);
    skipHistoryRef.current = false;
    canvas.requestRenderAll();
    refreshLayers();
  };

  const redo = async () => {
    const canvas = canvasRef.current;
    const next = redoRef.current.pop();
    if (!canvas || !next) return;
    historyRef.current.push(next);
    skipHistoryRef.current = true;
    await canvas.loadFromJSON(next);
    skipHistoryRef.current = false;
    canvas.requestRenderAll();
    refreshLayers();
  };

  const selectLayer = (id) => {
    const object = canvasRef.current?.getObjects().find((item) => item.id === id);
    if (!object) return;
    canvasRef.current.setActiveObject(object);
    canvasRef.current.requestRenderAll();
    selectObject(object);
  };

  const toggleLayer = (id, key) => {
    const object = canvasRef.current?.getObjects().find((item) => item.id === id);
    if (!object) return;
    if (key === "visible") object.set({ visible: object.visible === false });
    if (key === "locked") object.set({ selectable: !object.selectable, evented: !object.evented });
    canvasRef.current.requestRenderAll();
    refreshLayers();
  };

  const renameLayer = (id, name) => {
    const object = canvasRef.current?.getObjects().find((item) => item.id === id);
    if (object) object.set({ name });
    refreshLayers();
  };

  const setCanvasZoom = (next) => {
    const value = Math.min(1.8, Math.max(0.5, next));
    canvasRef.current.setZoom(value);
    setZoom(value);
  };

  const canvasToBlob = () => new Promise((resolve) => {
    const canvas = canvasRef.current;
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    canvas.lowerCanvasEl.toBlob(resolve, "image/png", 0.92);
  });

  const buildFormData = async (nextStatus) => {
    const formData = new FormData();
    const blob = await canvasToBlob();
    formData.append("designType", designType);
    formData.append("status", nextStatus);
    formData.append("placement", placement);
    formData.append("customization", JSON.stringify({ ...textProps, placement }));
    formData.append("canvasJson", JSON.stringify(canvasRef.current.toJSON(exportKeys)));
    if (productId) formData.append("productId", productId);
    if (selectedVariant) formData.append("variantSnapshot", JSON.stringify(selectedVariant));
    if (blob) formData.append("previewImage", blob, "cantley-design-preview.png");
    sourceFiles.forEach((file) => formData.append("sourceFiles", file));
    return formData;
  };

  const saveDesign = async (nextStatus = "Draft") => {
    setIsSaving(true);
    setError("");
    try {
      const formData = await buildFormData(nextStatus);
      const response = designId ? await api.put(`/designs/${designId}`, formData) : await api.post("/designs/save-draft", formData);
      setDesignId(response.data.design._id);
      setStatus(response.data.design.status);
      showToast(nextStatus === "Submitted" ? "Design submitted for review." : "Design draft saved.");
      return response.data.design;
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save design.");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const addToCart = async () => {
    const design = await saveDesign("Submitted");
    if (!design?._id) return;
    try {
      await api.post(`/designs/${design._id}/add-to-cart`);
      await loadCart();
      showToast("Custom design added to Cart.");
      navigate("/cart");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to add design to Cart.");
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const mod = event.ctrlKey || event.metaKey;
      if (event.key === "Delete") objectAction("delete");
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
      if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
      if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        objectAction("duplicate");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <section className="studio-page upgraded-studio">
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Cantley Studio</p>
          <h1>Professional Design Studio</h1>
          <p>Create custom T-shirts, hoodies, stickers, and labels with layers, placement, and preview export.</p>
        </div>
        <Link className="secondary-button" to="/designs">My designs</Link>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      {warning ? <div className="form-alert">{warning}</div> : null}
      <div className="studio-editor-shell">
        <aside className="studio-toolbar">
          <button type="button" onClick={addText}>Text</button>
          <label>Artwork<input accept=".jpg,.jpeg,.png,.webp,.svg" multiple type="file" onChange={uploadArtwork} /></label>
          <button type="button" onClick={() => objectAction("duplicate")}>Duplicate</button>
          <button type="button" onClick={() => objectAction("delete")}>Delete</button>
          <button type="button" onClick={undo}>Undo</button>
          <button type="button" onClick={redo}>Redo</button>
          <button type="button" onClick={() => setCanvasZoom(zoom + 0.1)}>Zoom +</button>
          <button type="button" onClick={() => setCanvasZoom(zoom - 0.1)}>Zoom -</button>
          <button type="button" onClick={() => setCanvasZoom(1)}>Reset</button>
        </aside>
        <div className="studio-canvas-stage">
          <div className={`studio-product-frame ${designType}`}><canvas ref={canvasEl} /></div>
          <div className="studio-mobile-actions">
            <button type="button" onClick={addText}>Add text</button>
            <label>Upload<input accept=".jpg,.jpeg,.png,.webp,.svg" multiple type="file" onChange={uploadArtwork} /></label>
            <button type="button" onClick={() => saveDesign("Draft")}>Save</button>
            <button type="button" onClick={addToCart}>Cart</button>
          </div>
        </div>
        <aside className="studio-properties">
          <div className="studio-panel compact">
            <h2>Product</h2>
            <label>Type<select value={designType} onChange={(event) => setDesignType(event.target.value)}><option value="tshirt">T-shirt</option><option value="hoodie">Hoodie</option><option value="sticker">Sticker</option><option value="label">Label</option></select></label>
            <label>Placement<select value={placement} onChange={(event) => setPlacement(event.target.value)}>{placements.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <p>{product?.name || "Open from a Cantley product page for exact product and variant context."}</p>
          </div>
          <div className="studio-panel compact">
            <h2>Properties</h2>
            <label>Text<input value={textProps.text} onChange={(event) => updateSelected({ text: event.target.value })} disabled={!selected?.text} /></label>
            <label>Font<select value={textProps.fontFamily} onChange={(event) => updateSelected({ fontFamily: event.target.value })}>{fonts.map((font) => <option key={font} value={font}>{font}</option>)}</select></label>
            <label>Size<input min="8" max="180" type="number" value={textProps.fontSize} onChange={(event) => updateSelected({ fontSize: Number(event.target.value || 42) })} /></label>
            <label>Color<input type="color" value={textProps.fill} onChange={(event) => updateSelected({ fill: event.target.value })} /></label>
            <label>Letter spacing<input min="0" max="800" type="range" value={textProps.charSpacing} onChange={(event) => updateSelected({ charSpacing: Number(event.target.value) })} /></label>
            <label>Rotate<input min="-180" max="180" type="range" value={textProps.angle} onChange={(event) => updateSelected({ angle: Number(event.target.value) })} /></label>
            <div className="studio-button-grid">
              <button type="button" onClick={() => updateSelected({ fontWeight: textProps.fontWeight === "bold" ? "normal" : "bold" })}>Bold</button>
              <button type="button" onClick={() => updateSelected({ fontStyle: textProps.fontStyle === "italic" ? "normal" : "italic" })}>Italic</button>
              <button type="button" onClick={() => updateSelected({ textAlign: "left" })}>Left</button>
              <button type="button" onClick={() => updateSelected({ textAlign: "center" })}>Center</button>
              <button type="button" onClick={() => objectAction("center-h")}>Center H</button>
              <button type="button" onClick={() => objectAction("center-v")}>Center V</button>
              <button type="button" onClick={() => objectAction("forward")}>Forward</button>
              <button type="button" onClick={() => objectAction("backward")}>Backward</button>
              <button type="button" onClick={() => objectAction("lock")}>Lock</button>
            </div>
          </div>
          <div className="studio-panel compact">
            <h2>Layers</h2>
            <div className="studio-layers">
              {layers.map((layer) => (
                <div className="studio-layer-row" key={layer.id}>
                  <button type="button" onClick={() => selectLayer(layer.id)}>{layer.type}</button>
                  <input value={layer.name} onChange={(event) => renameLayer(layer.id, event.target.value)} />
                  <button type="button" onClick={() => toggleLayer(layer.id, "visible")}>{layer.visible ? "Hide" : "Show"}</button>
                  <button type="button" onClick={() => toggleLayer(layer.id, "locked")}>{layer.locked ? "Unlock" : "Lock"}</button>
                </div>
              ))}
              {!layers.length ? <p>No artwork or text layers yet.</p> : null}
            </div>
          </div>
        </aside>
      </div>
      <div className="studio-action-bar">
        <span>{status}</span>
        <button className="secondary-button" disabled={isSaving} type="button" onClick={() => saveDesign("Draft")}>{isSaving ? "Saving..." : "Save draft"}</button>
        <button className="secondary-button" disabled={isSaving} type="button" onClick={() => { setDesignId(""); saveDesign("Draft"); }}>Duplicate draft</button>
        <button className="secondary-button" disabled={isSaving} type="button" onClick={() => saveDesign("Submitted")}>Submit for review</button>
        <button className="primary-button" disabled={isSaving} type="button" onClick={addToCart}>Add custom design to Cart</button>
      </div>
    </section>
  );
};

export default DesignStudio;
