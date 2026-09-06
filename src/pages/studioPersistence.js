import { StaticCanvas, FabricImage, Textbox } from "fabric";
import { getMediaUrl } from "../utils/media.js";

export const artworkSides = (designs) => ["front", "back"].filter((side) => designs[side]);
export const variantOptions = (variant) => variant ? Object.fromEntries(
  ["sku", "size", "color", "material", "printType", "finish", "shape", "width", "height", "unit", "waterproof"]
    .filter((key) => variant[key] !== undefined).map((key) => [key, variant[key]])
) : null;

export const serializeStudio = (designs, requestKey, imageRatio) => ({
  // Existing canvasJson is Mixed JSON, copied unchanged to cart.designData.
  // Basic Studio's per-side metadata is intentionally not legacy Fabric canvas JSON.
  basicStudio: {
    version: 1,
    requestKey,
    coordinateSpace: "normalized-catalog-image-preview-only",
    origin: "center",
    imageRatio,
    manufacturingDimensions: false,
    sides: Object.fromEntries(artworkSides(designs).map((side, sourceFileIndex) => {
      const { fileName, x, y, width, height, rotation, aspectRatio } = designs[side];
      return [side, { sourceFileIndex, fileName, x, y, width, height, rotation, aspectRatio }];
    }))
  }
});

export const validateStudio = (product, variant, designs, imageRatio) => {
  if (!product?._id || product.isActive === false) return "Choose an available product.";
  if (product.variants?.length && (!product.variants.includes(variant) || variant.stock <= 0)) return "Choose an available product variant.";
  if (!imageRatio || !getMediaUrl(product.images?.[0])) return "A loaded product image is required to export the preview.";
  const sides = artworkSides(designs);
  if (!sides.length) return "Upload artwork on Front or Back before saving or adding to cart.";
  for (const side of sides) {
    const design = designs[side];
    if (!(design.file instanceof File) || !["image/png", "image/jpeg", "image/webp"].includes(design.file.type) || design.file.size > 40 * 1024 * 1024) return "Replace the artwork with a PNG, JPG or WebP file of 40MB or less.";
    if (![design.x, design.y, design.width, design.height, design.rotation].every(Number.isFinite) || design.width <= 0 || design.height <= 0) return "Reset the artwork position before saving.";
  }
  return "";
};

export const exportStudioPreview = async (product, designs) => {
  const sides = artworkSides(designs);
  const tileWidth = 480;
  const tileHeight = 560;
  const canvas = new StaticCanvas(document.createElement("canvas"), {
    width: tileWidth * sides.length, height: tileHeight, backgroundColor: "#f1f0eb", renderOnAddRemove: false
  });
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 30000);
  try {
    for (const [index, side] of sides.entries()) {
      const garment = await FabricImage.fromURL(getMediaUrl(product.images[0]), { crossOrigin: "anonymous", signal: controller.signal });
      const scale = Math.min(440 / garment.width, 480 / garment.height);
      const width = garment.width * scale;
      const height = garment.height * scale;
      const left = index * tileWidth + (tileWidth - width) / 2;
      const top = 48 + (480 - height) / 2;
      garment.set({ left, top, scaleX: scale, scaleY: scale, selectable: false });
      canvas.add(garment);
      const design = designs[side];
      const artwork = await FabricImage.fromURL(design.source, { signal: controller.signal });
      artwork.set({ originX: "center", originY: "center", left: left + design.x * width, top: top + design.y * height,
        scaleX: design.width * width / artwork.width, scaleY: design.height * height / artwork.height, angle: design.rotation });
      canvas.add(artwork);
      canvas.add(new Textbox(`${side === "front" ? "Front" : "Back"} - catalog preview`, {
        left: index * tileWidth + 20, top: 16, width: 440, textAlign: "center", fontSize: 16, fill: "#34342f"
      }));
    }
    canvas.renderAll();
    return await new Promise((resolve, reject) => {
      canvas.lowerCanvasEl.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Preview export returned no image.")), "image/png");
    });
  } finally { window.clearTimeout(timer); await canvas.dispose(); }
};
