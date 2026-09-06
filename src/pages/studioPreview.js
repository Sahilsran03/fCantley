// Normalized image coordinates, frontend preview only. Never submit as print specifications.
const previewGuide = Object.freeze({ x: 0.3, y: 0.22, width: 0.4, height: 0.5 });
export const previewGuides = Object.freeze({ front: previewGuide, back: previewGuide });
// Artwork per side: { source, file, fileName, aspectRatio, x, y, width, height, rotation }.
// x/y are center coordinates; width/height are unrotated dimensions in normalized image space.
export const createDesigns = () => ({ front: null, back: null });
export const isAvailable = (variant) => typeof variant.stock !== "number" || variant.stock > 0;
export const formatPrice = (value) => typeof value === "number" && Number.isFinite(value)
  ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value)
  : "Not available";
