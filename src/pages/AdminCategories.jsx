import React, { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";

const emptyCategory = { name: "", slug: "", description: "", sortOrder: 0, isActive: true };
const maxFileSize = 40 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

const AdminCategories = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyCategory);
  const [imageFile, setImageFile] = useState(null);
  const [currentImage, setCurrentImage] = useState("");
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = () => {
    setIsLoading(true);
    api
      .get("/admin/categories")
      .then((response) => {
        setCategories(response.data.categories || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load categories."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const updateField = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const updateImage = (event) => {
    const file = event.target.files?.[0] || null;

    if (file && !allowedImageTypes.includes(file.type)) {
      setError("Category image must be jpg, jpeg, png, or webp.");
      event.target.value = "";
      return;
    }

    if (file && file.size > maxFileSize) {
      setError("Category image must be 40MB or smaller.");
      event.target.value = "";
      return;
    }

    setError("");
    setImageFile(file);
  };

  const resetForm = () => {
    setForm(emptyCategory);
    setImageFile(null);
    setCurrentImage("");
    setEditingId("");
    setError("");
  };

  const buildFormData = () => {
    const data = new FormData();
    data.append("name", form.name);
    data.append("slug", form.slug);
    data.append("description", form.description);
    data.append("sortOrder", form.sortOrder);
    data.append("isActive", String(form.isActive));
    if (imageFile) data.append("image", imageFile);
    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const data = buildFormData();
      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, data);
      } else {
        await api.post("/admin/categories", data);
      }
      showToast(editingId ? "Category updated." : "Category created.");
      resetForm();
      loadCategories();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save category.");
    }
  };

  const editCategory = (category) => {
    setEditingId(category._id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive
    });
    setImageFile(null);
    setCurrentImage(getMediaUrl(category.image));
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm("Delete this Cantley category?")) return;

    try {
      await api.delete(`/admin/categories/${categoryId}`);
      showToast("Category deleted.");
      loadCategories();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete category.");
    }
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Categories</h1>
      </div>

      <form className="form-panel" onSubmit={handleSubmit}>
        {error ? <div className="form-alert">{error}</div> : null}
        <label>
          Name
          <input name="name" value={form.name} onChange={updateField} required />
        </label>
        <label>
          Slug
          <input name="slug" value={form.slug} onChange={updateField} placeholder="auto from name" />
        </label>
        <label>
          Description
          <textarea name="description" rows="3" value={form.description} onChange={updateField} />
        </label>
        <label>
          Category image
          <input
            accept="image/jpeg,image/png,image/webp"
            type="file"
            onChange={updateImage}
          />
        </label>
        {currentImage || imageFile ? (
          <div className="media-preview-grid">
            <div className="media-preview">
              <img src={imageFile ? URL.createObjectURL(imageFile) : currentImage} alt="Category" />
              <span>{imageFile?.name || "Current image"}</span>
            </div>
          </div>
        ) : null}
        <label>
          Sort order
          <input name="sortOrder" type="number" value={form.sortOrder} onChange={updateField} />
        </label>
        <div className="checkbox-row">
          <label>
            <input name="isActive" type="checkbox" checked={form.isActive} onChange={updateField} />
            Active
          </label>
        </div>
        <button className="primary-button" type="submit">
          {editingId ? "Update category" : "Create category"}
        </button>
        {editingId ? (
          <button className="secondary-button" type="button" onClick={resetForm}>
            Cancel edit
          </button>
        ) : null}
      </form>

      {isLoading ? <div className="analytics-skeleton">Loading categories...</div> : null}
      {!isLoading && !categories.length && !error ? (
        <div className="empty-state">
          <h2>No categories yet</h2>
          <p>Create Cantley categories to organize products.</p>
        </div>
      ) : (
        <div className="admin-table">
          {categories.map((category) => (
            <div className="admin-row" key={category._id}>
              <div>
                <strong>{category.name}</strong>
                <span>{category.slug}</span>
              </div>
              <span>{category.isActive ? "Active" : "Inactive"}</span>
              <button type="button" onClick={() => editCategory(category)}>
                Edit
              </button>
              <button type="button" onClick={() => deleteCategory(category._id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminCategories;
