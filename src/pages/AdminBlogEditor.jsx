import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import RichTextEditor from "../components/RichTextEditor.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { getOptimizedImageUrl } from "../utils/media.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";

const emptyPost = {
  title: "",
  slug: "",
  excerpt: "",
  content: "<p></p>",
  author: "Cantley",
  tags: "",
  category: "",
  metaTitle: "",
  metaDescription: "",
  isPublished: false
};

const slugify = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const AdminBlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyPost);
  const [coverFile, setCoverFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(id);
  const previewTitle = useMemo(() => form.metaTitle || form.title || "Untitled story", [form.metaTitle, form.title]);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/admin/blog/${id}`)
      .then((response) => {
        const post = response.data.post;
        setForm({ ...post, tags: (post.tags || []).join(", ") });
        setCoverImage(post.coverImage);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load blog post."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const submitPost = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value ?? ""));
      if (coverFile) data.append("coverImage", coverFile);
      const response = isEditing ? await api.put(`/admin/blog/${id}`, data) : await api.post("/admin/blog", data);
      showToast(isEditing ? "Blog post updated." : "Blog post created.");
      navigate(`/admin/blog/${response.data.post._id}/edit`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save blog post.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateTitle = (title) => setForm((current) => ({ ...current, title, slug: current.slug || slugify(title) }));

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div><p className="eyebrow">Content Marketing</p><h1>{isEditing ? "Edit Blog Post" : "Add Blog Post"}</h1></div>
        <Link className="button-link" to="/admin/blog">All posts</Link>
      </div>
      {isLoading ? <div className="analytics-skeleton">Loading blog post...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}
      {!isLoading ? (
        <div className="cms-editor-layout">
          <form className="form-panel" onSubmit={submitPost}>
            <div className="form-grid">
              <label>Title<input required value={form.title} onChange={(event) => updateTitle(event.target.value)} /></label>
              <label>Slug<input required value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} /></label>
              <label>Category<input required value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} /></label>
              <label>Author<input value={form.author} onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))} /></label>
            </div>
            <label>Excerpt<textarea required rows="3" value={form.excerpt} onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))} /></label>
            <label>Content<RichTextEditor value={form.content} onChange={(content) => setForm((current) => ({ ...current, content }))} /></label>
            <label>Cover image<input accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} /></label>
            <label>Tags<input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="fashion, printing, labels" /></label>
            <div className="form-grid">
              <label>SEO title<input value={form.metaTitle} onChange={(event) => setForm((current) => ({ ...current, metaTitle: event.target.value }))} /></label>
              <label>SEO description<textarea rows="3" value={form.metaDescription} onChange={(event) => setForm((current) => ({ ...current, metaDescription: event.target.value }))} /></label>
            </div>
            <label className="inline-check"><input checked={form.isPublished} type="checkbox" onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} />Published</label>
            <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save post"}</button>
          </form>
          <aside className="form-panel cms-preview-panel">
            <p className="eyebrow">Preview</p>
            <h2>{previewTitle}</h2>
            {(coverFile || coverImage) ? <img className="editorial-preview-image" src={coverFile ? URL.createObjectURL(coverFile) : getOptimizedImageUrl(coverImage, { width: 640 })} alt="" /> : null}
            <p>{form.excerpt}</p>
            <article className="cms-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.content) }} />
          </aside>
        </div>
      ) : null}
    </section>
  );
};

export default AdminBlogEditor;
