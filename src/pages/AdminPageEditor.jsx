import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import RichTextEditor from "../components/RichTextEditor.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";

const emptyPage = {
  title: "",
  slug: "",
  content: "<p></p>",
  metaTitle: "",
  metaDescription: "",
  isPublished: false
};

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const AdminPageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyPage);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(id);
  const previewTitle = useMemo(() => form.metaTitle || form.title || "Untitled page", [form.metaTitle, form.title]);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/admin/pages/${id}`)
      .then((response) => {
        setForm(response.data.page);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load page."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const updateTitle = (title) => {
    setForm((current) => ({
      ...current,
      title,
      slug: current.slug || slugify(title)
    }));
  };

  const submitPage = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const response = isEditing ? await api.put(`/admin/pages/${id}`, form) : await api.post("/admin/pages", form);
      showToast(isEditing ? "Page updated." : "Page created.");
      navigate(`/admin/pages/${response.data.page._id}/edit`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save page.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Admin CMS</p>
          <h1>{isEditing ? "Edit Page" : "Add Page"}</h1>
        </div>
        <Link className="button-link" to="/admin/pages">All pages</Link>
      </div>
      {isLoading ? <div className="analytics-skeleton">Loading page...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}
      {!isLoading ? (
        <div className="cms-editor-layout">
          <form className="form-panel" onSubmit={submitPage}>
            <div className="form-grid">
              <label>
                Title
                <input required value={form.title} onChange={(event) => updateTitle(event.target.value)} />
              </label>
              <label>
                Slug
                <input required value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} />
              </label>
            </div>
            <label>
              Content
              <RichTextEditor value={form.content} onChange={(content) => setForm((current) => ({ ...current, content }))} />
            </label>
            <div className="form-grid">
              <label>
                SEO title
                <input value={form.metaTitle} onChange={(event) => setForm((current) => ({ ...current, metaTitle: event.target.value }))} />
              </label>
              <label>
                SEO description
                <textarea rows="3" value={form.metaDescription} onChange={(event) => setForm((current) => ({ ...current, metaDescription: event.target.value }))} />
              </label>
            </div>
            <label className="inline-check">
              <input checked={form.isPublished} type="checkbox" onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} />
              Published
            </label>
            <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save page"}</button>
          </form>

          <aside className="form-panel cms-preview-panel">
            <p className="eyebrow">Preview</p>
            <h2>{previewTitle}</h2>
            <article className="cms-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.content) }} />
          </aside>
        </div>
      ) : null}
    </section>
  );
};

export default AdminPageEditor;
