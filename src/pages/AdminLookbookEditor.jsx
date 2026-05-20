import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { getOptimizedImageUrl } from "../utils/media.js";

const emptyEntry = {
  title: "",
  slug: "",
  description: "",
  customerName: "",
  relatedProducts: [],
  isPublished: false
};

const slugify = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const AdminLookbookEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyEntry);
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(id);

  useEffect(() => {
    api.get("/admin/products").then((response) => setProducts(response.data.products || [])).catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/admin/lookbook/${id}`)
      .then((response) => {
        const entry = response.data.lookbook;
        setForm({ ...entry, relatedProducts: (entry.relatedProducts || []).map((product) => product._id || product) });
        setImages(entry.images || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load lookbook entry."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const submitEntry = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, Array.isArray(value) ? value.join(",") : value ?? "");
      });
      imageFiles.forEach((file) => data.append("images", file));
      const response = isEditing ? await api.put(`/admin/lookbook/${id}`, data) : await api.post("/admin/lookbook", data);
      showToast(isEditing ? "Lookbook updated." : "Lookbook created.");
      navigate(`/admin/lookbook/${response.data.lookbook._id}/edit`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save lookbook.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateTitle = (title) => setForm((current) => ({ ...current, title, slug: current.slug || slugify(title) }));
  const toggleProduct = (productId) => {
    setForm((current) => ({
      ...current,
      relatedProducts: current.relatedProducts.includes(productId)
        ? current.relatedProducts.filter((idValue) => idValue !== productId)
        : [...current.relatedProducts, productId]
    }));
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div><p className="eyebrow">Content Marketing</p><h1>{isEditing ? "Edit Lookbook" : "Add Lookbook"}</h1></div>
        <Link className="button-link" to="/admin/lookbook">All lookbook</Link>
      </div>
      {isLoading ? <div className="analytics-skeleton">Loading lookbook...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}
      {!isLoading ? (
        <div className="cms-editor-layout">
          <form className="form-panel" onSubmit={submitEntry}>
            <div className="form-grid">
              <label>Title<input required value={form.title} onChange={(event) => updateTitle(event.target.value)} /></label>
              <label>Slug<input required value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} /></label>
            </div>
            <label>Description<textarea required rows="5" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <label>Customer name<input value={form.customerName} onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} /></label>
            <label>Images<input accept="image/jpeg,image/png,image/webp" multiple type="file" onChange={(event) => setImageFiles(Array.from(event.target.files || []).slice(0, 8))} /></label>
            <div className="product-picker">
              <strong>Related products</strong>
              {products.map((product) => (
                <label className="inline-check" key={product._id}>
                  <input checked={form.relatedProducts.includes(product._id)} type="checkbox" onChange={() => toggleProduct(product._id)} />
                  {product.name}
                </label>
              ))}
            </div>
            <label className="inline-check"><input checked={form.isPublished} type="checkbox" onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} />Published</label>
            <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save lookbook"}</button>
          </form>
          <aside className="form-panel cms-preview-panel">
            <p className="eyebrow">Preview</p>
            <h2>{form.title || "Untitled lookbook"}</h2>
            <p>{form.description}</p>
            <div className="proof-grid">
              {imageFiles.map((file) => <img key={file.name} src={URL.createObjectURL(file)} alt="" />)}
              {!imageFiles.length ? images.map((image) => <img key={image.publicId} src={getOptimizedImageUrl(image, { width: 360 })} alt="" />) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
};

export default AdminLookbookEditor;
