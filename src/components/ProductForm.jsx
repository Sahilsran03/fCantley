import React, { useMemo, useState } from "react";
import { getMediaUrl } from "../utils/media.js";
import VariantForm, { createEmptyVariant } from "./VariantForm.jsx";

const maxFileSize = 40 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/webm"];
const clothingTypes = ["tshirt", "hoodie", "oversized-tshirt"];
const stickerTypes = ["sticker", "label"];

const emptyProduct = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  category: "",
  productType: "tshirt",
  basePrice: "",
  isActive: true,
  isFeatured: false,
  tags: "",
  ratingAverage: 0,
  ratingCount: 0
};

const productToForm = (product) => ({
  name: product?.name || "",
  slug: product?.slug || "",
  description: product?.description || "",
  shortDescription: product?.shortDescription || "",
  category: product?.category?._id || product?.category || "",
  productType: product?.productType || "tshirt",
  basePrice: product?.basePrice ?? "",
  isActive: product?.isActive ?? true,
  isFeatured: product?.isFeatured ?? false,
  tags: product?.tags?.join(", ") || "",
  ratingAverage: product?.ratingAverage ?? 0,
  ratingCount: product?.ratingCount ?? 0
});

const appendField = (data, key, value) => {
  data.append(key, typeof value === "boolean" ? String(value) : value ?? "");
};

const normalizeVariantsForSubmit = (variants) =>
  variants.map((variant) => ({
    size: variant.size || "",
    color: variant.color || "",
    material: variant.material || "",
    printType: variant.printType || "",
    finish: variant.finish || "",
    shape: variant.shape || "",
    width: variant.width === "" ? "" : Number(variant.width || 0),
    height: variant.height === "" ? "" : Number(variant.height || 0),
    unit: variant.unit || "",
    waterproof: Boolean(variant.waterproof),
    stock: Number(variant.stock || 0),
    sku: variant.sku || "",
    priceModifier: Number(variant.priceModifier || 0)
  }));

const validateVariants = (productType, variants) => {
  if (clothingTypes.includes(productType) && variants.length < 1) {
    return "At least one variant is required for clothing products.";
  }

  for (const [index, variant] of variants.entries()) {
    if (Number(variant.stock) < 0) {
      return `Variant ${index + 1}: stock must be 0 or greater.`;
    }

    if (clothingTypes.includes(productType) && !String(variant.size || "").trim()) {
      return `Variant ${index + 1}: size is required.`;
    }

    if (stickerTypes.includes(productType) && (!variant.shape || !variant.width || !variant.height)) {
      return `Variant ${index + 1}: shape, width, and height are required.`;
    }
  }

  const skus = variants.map((variant) => String(variant.sku || "").trim()).filter(Boolean);
  if (new Set(skus).size !== skus.length) {
    return "Variant SKU values must be unique when provided.";
  }

  return "";
};

const ProductForm = ({ categories, initialProduct, submitLabel, onSubmit }) => {
  const initialState = useMemo(() => productToForm(initialProduct), [initialProduct]);
  const [form, setForm] = useState(initialProduct ? initialState : emptyProduct);
  const [variants, setVariants] = useState(() =>
    initialProduct?.variants?.length ? initialProduct.variants : [createEmptyVariant()]
  );
  const [existingImages, setExistingImages] = useState(() => initialProduct?.images || []);
  const [newImages, setNewImages] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingVideoUrl = removeVideo ? "" : getMediaUrl(initialProduct?.video);
  const totalImages = existingImages.length + newImages.length;

  const updateField = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const updateProductType = (event) => {
    const nextProductType = event.target.value;
    setForm((current) => ({ ...current, productType: nextProductType }));

    if (!variants.length && clothingTypes.includes(nextProductType)) {
      setVariants([createEmptyVariant()]);
    }
  };

  const updateImages = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.some((file) => !allowedImageTypes.includes(file.type))) {
      setError("Product images must be jpg, jpeg, png, or webp files.");
      event.target.value = "";
      return;
    }

    if (files.some((file) => file.size > maxFileSize)) {
      setError("Each product image must be 40MB or smaller.");
      event.target.value = "";
      return;
    }

    if (existingImages.length + files.length > 5) {
      setError("Product can have a maximum of 5 images.");
      event.target.value = "";
      return;
    }

    setError("");
    setNewImages(files);
  };

  const updateVideo = (event) => {
    const file = event.target.files?.[0] || null;

    if (file && !allowedVideoTypes.includes(file.type)) {
      setError("Product video must be mp4, mov, or webm.");
      event.target.value = "";
      return;
    }

    if (file && file.size > maxFileSize) {
      setError("Product video must be 40MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");
    setVideoFile(file);
    setRemoveVideo(Boolean(file));
  };

  const removeExistingImage = (index) => {
    setExistingImages((current) => current.filter((item, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (totalImages > 5) {
      setError("Product can have a maximum of 5 images.");
      setIsSubmitting(false);
      return;
    }

    const normalizedVariants = normalizeVariantsForSubmit(variants);
    const variantError = validateVariants(form.productType, normalizedVariants);

    if (variantError) {
      setError(variantError);
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    appendField(data, "name", form.name);
    appendField(data, "slug", form.slug);
    appendField(data, "description", form.description);
    appendField(data, "shortDescription", form.shortDescription);
    appendField(data, "category", form.category);
    appendField(data, "productType", form.productType);
    appendField(data, "basePrice", form.basePrice);
    appendField(data, "isActive", form.isActive);
    appendField(data, "isFeatured", form.isFeatured);
    appendField(data, "ratingAverage", form.ratingAverage);
    appendField(data, "ratingCount", form.ratingCount);
    appendField(
      data,
      "tags",
      JSON.stringify(
        form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    );
    appendField(data, "variants", JSON.stringify(normalizedVariants));

    if (initialProduct) {
      appendField(data, "retainedImages", JSON.stringify(existingImages));
      appendField(data, "removeVideo", removeVideo && !videoFile ? "true" : "false");
    }

    newImages.forEach((file) => data.append("images", file));
    if (videoFile) data.append("video", videoFile);

    try {
      await onSubmit(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-panel wide-form" onSubmit={handleSubmit}>
      {error ? <div className="form-alert">{error}</div> : null}

      <div className="form-grid">
        <label>
          Name
          <input name="name" value={form.name} onChange={updateField} required />
        </label>
        <label>
          Slug
          <input name="slug" value={form.slug} onChange={updateField} placeholder="auto from name" />
        </label>
        <label>
          Category
          <select name="category" value={form.category} onChange={updateField} required>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Product type
          <select name="productType" value={form.productType} onChange={updateProductType}>
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
          Base price
          <input name="basePrice" type="number" min="0" value={form.basePrice} onChange={updateField} required />
        </label>
        <label>
          Rating average
          <input
            name="ratingAverage"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={form.ratingAverage}
            onChange={updateField}
          />
        </label>
        <label>
          Rating count
          <input name="ratingCount" type="number" min="0" value={form.ratingCount} onChange={updateField} />
        </label>
      </div>

      <label>
        Short description
        <input name="shortDescription" value={form.shortDescription} onChange={updateField} />
      </label>

      <label>
        Description
        <textarea name="description" rows="5" value={form.description} onChange={updateField} />
      </label>

      <label>
        Product images
        <input accept="image/jpeg,image/png,image/webp" multiple type="file" onChange={updateImages} />
      </label>

      <div className="media-preview-grid">
        {existingImages.map((image, index) => (
          <div className="media-preview" key={`${getMediaUrl(image)}-${index}`}>
            <img src={getMediaUrl(image)} alt="Existing product" />
            <button type="button" onClick={() => removeExistingImage(index)}>
              Remove
            </button>
          </div>
        ))}
        {newImages.map((image) => (
          <div className="media-preview" key={image.name}>
            <img src={URL.createObjectURL(image)} alt={image.name} />
            <span>{image.name}</span>
          </div>
        ))}
      </div>

      <label>
        Product video
        <input accept="video/mp4,video/quicktime,video/webm" type="file" onChange={updateVideo} />
      </label>

      {existingVideoUrl || videoFile ? (
        <div className="video-preview">
          {videoFile ? (
            <video controls src={URL.createObjectURL(videoFile)} />
          ) : (
            <video controls src={existingVideoUrl} />
          )}
          <span>{videoFile?.name || "Existing video"}</span>
          {existingVideoUrl ? (
            <button type="button" onClick={() => setRemoveVideo(true)}>
              Remove video
            </button>
          ) : null}
        </div>
      ) : null}

      <label>
        Tags
        <input name="tags" value={form.tags} onChange={updateField} placeholder="custom, cotton, premium" />
      </label>

      <VariantForm
        basePrice={form.basePrice}
        productType={form.productType}
        variants={variants}
        onChange={setVariants}
      />

      <div className="checkbox-row">
        <label>
          <input name="isActive" type="checkbox" checked={form.isActive} onChange={updateField} />
          Active
        </label>
        <label>
          <input name="isFeatured" type="checkbox" checked={form.isFeatured} onChange={updateField} />
          Featured
        </label>
      </div>

      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
};

export default ProductForm;
