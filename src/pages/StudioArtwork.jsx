import React, { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage } from "fabric";
import { previewGuides } from "./studioPreview.js";

export const centeredArtwork = (design, side, imageRatio) => {
  const guide = previewGuides[side];
  const ratio = design.aspectRatio / imageRatio;
  const width = Math.min(guide.width * .7, guide.height * .7 * ratio);
  return { ...design, x: guide.x + guide.width / 2, y: guide.y + guide.height / 2,
    width, height: width / ratio, rotation: 0 };
};

// x/y are the artwork center; dimensions are unrotated, normalized to the catalog image.
export const ArtworkCanvas = ({ design, side, onChange }) => {
  const host = useRef(null);
  const latest = useRef({ design, onChange });
  latest.current = { design, onChange };
  const [size, setSize] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const canvasRef = useRef(null);
  const objectRef = useRef(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setSize({ width, height });
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!size || !design?.source) return undefined;
    let alive = true;
    setLoadError(false);
    const element = document.createElement("canvas");
    host.current.appendChild(element);
    const canvas = new Canvas(element, { width: size.width, height: size.height, selection: false,
      preserveObjectStacking: true, uniformScaling: true, uniScaleKey: null });
    canvasRef.current = canvas;
    const guide = previewGuides[side];
    const bounds = { left: guide.x * size.width, top: guide.y * size.height,
      width: guide.width * size.width, height: guide.height * size.height };
    const constrain = (object) => {
      let box = object.getBoundingRect();
      const fit = Math.min(1, bounds.width / box.width, bounds.height / box.height);
      if (fit < 1) object.set({ scaleX: object.scaleX * fit, scaleY: object.scaleY * fit });
      object.setCoords();
      box = object.getBoundingRect();
      object.set({ left: object.left + Math.max(bounds.left - box.left, Math.min(0, bounds.left + bounds.width - box.left - box.width)),
        top: object.top + Math.max(bounds.top - box.top, Math.min(0, bounds.top + bounds.height - box.top - box.height)) });
      object.setCoords();
    };
    const persist = (object) => {
      constrain(object);
      latest.current.onChange({ ...latest.current.design, x: object.left / size.width, y: object.top / size.height,
        width: object.getScaledWidth() / size.width, height: object.getScaledHeight() / size.height, rotation: object.angle });
    };
    FabricImage.fromURL(design.source).then((object) => {
      if (!alive) { object.dispose(); return; }
      const current = latest.current.design;
      object.set({ originX: "center", originY: "center", left: current.x * size.width, top: current.y * size.height,
        scaleX: current.width * size.width / object.width, scaleY: current.height * size.height / object.height,
        angle: current.rotation, cornerStyle: "circle", cornerColor: "#ffffff", cornerStrokeColor: "#514b3e",
        borderColor: "#514b3e", transparentCorners: false, cornerSize: 12, touchCornerSize: 30,
        lockScalingFlip: true, minScaleLimit: Math.min(bounds.width / object.width, bounds.height / object.height) * .12 });
      object.setControlsVisibility({ ml: false, mr: false, mt: false, mb: false });
      objectRef.current = object;
      canvas.add(object); constrain(object); canvas.setActiveObject(object); canvas.requestRenderAll();
      ["object:moving", "object:scaling", "object:rotating"].forEach((name) => canvas.on(name, () => { constrain(object); canvas.requestRenderAll(); }));
      canvas.on("object:modified", () => persist(object));
    }).catch(() => { if (alive) setLoadError(true); });
    return () => {
      alive = false; canvasRef.current = null; objectRef.current = null;
      // Remove the wrapper immediately so StrictMode and resizes cannot leave an old canvas visible.
      canvas.wrapperEl?.remove();
      canvas.dispose();
    };
  }, [size, design?.source, side]);
  useEffect(() => {
    const object = objectRef.current;
    if (!object || !size || !design) return;
    object.set({ left: design.x * size.width, top: design.y * size.height,
      scaleX: design.width * size.width / object.width, scaleY: design.height * size.height / object.height, angle: design.rotation });
    object.setCoords(); canvasRef.current?.requestRenderAll();
  }, [design, size]);
  return <><div ref={host} className="studio-artwork-canvas" aria-label="Artwork positioning canvas" />{loadError && <p className="studio-artwork-error" role="alert">Unable to display artwork. Please replace the image.</p>}</>;
};

export const ArtworkControls = ({ side, design, imageRatio, disabled, onChange, onPendingChange }) => {
  const input = useRef(null);
  const sequence = useRef(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => { onPendingChange?.(pending); }, [pending, onPendingChange]);
  useEffect(() => () => { sequence.current += 1; onPendingChange?.(false); }, [onPendingChange]);
  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 40 * 1024 * 1024) {
      setError("Choose a PNG, JPG or WebP image, 40MB or smaller."); return;
    }
    const request = ++sequence.current;
    setPending(true);
    const source = URL.createObjectURL(file);
    try {
      const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      const signatureMatches = file.type === "image/png"
        ? [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
        : file.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
      if (!signatureMatches) throw new Error("Unsupported image contents");
      const image = new Image();
      image.src = source;
      await image.decode();
      if (request !== sequence.current) { URL.revokeObjectURL(source); return; }
      if (!image.naturalWidth || !image.naturalHeight) throw new Error("Invalid image");
      onChange(centeredArtwork({ source, file, fileName: file.name, aspectRatio: image.naturalWidth / image.naturalHeight }, side, imageRatio));
    } catch {
      URL.revokeObjectURL(source);
      if (request === sequence.current) setError("This image could not be read. Please choose another PNG, JPG or WebP file.");
    } finally { if (request === sequence.current) setPending(false); }
  };
  return <div className="basic-studio-artwork"><h2>Artwork / {side === "front" ? "Front" : "Back"}</h2>
    <p role="status">{pending ? "Reading artwork..." : design?.fileName || "No design uploaded yet"}</p>
    <input hidden ref={input} type="file" accept="image/png,image/jpeg,image/webp" aria-label={`Upload ${side} artwork`} onChange={upload} />
    <button type="button" disabled={disabled || pending} onClick={() => input.current?.click()}>{design ? "Replace Design" : "Upload Design"}</button>
    {design && <div className="studio-artwork-actions"><button type="button" disabled={pending} onClick={() => onChange(null)}>Remove</button><button type="button" disabled={pending || disabled} onClick={() => onChange(centeredArtwork(design, side, imageRatio))}>Reset Position</button></div>}
    {error && <p role="alert">{error}</p>}
    <p>PNG, JPG or WebP. Up to 40MB. Drag artwork to move it; use corner handles to resize and the top handle to rotate.</p>
    <p>Save your design before leaving. Changing product clears the local artwork. Saved-design reopening is not available in this basic editor yet.</p>
  </div>;
};
