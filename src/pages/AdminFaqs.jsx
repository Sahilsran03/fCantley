import React, { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import RichTextEditor from "../components/RichTextEditor.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";

const emptyFaq = {
  type: "FAQ",
  title: "FAQ",
  content: "<h2>Question</h2><p>Answer</p>",
  isPublished: false
};

const AdminFaqs = () => {
  const { showToast } = useToast();
  const [faq, setFaq] = useState(null);
  const [form, setForm] = useState(emptyFaq);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/policies")
      .then((response) => {
        const found = (response.data.policies || []).find((policy) => policy.type === "FAQ");
        if (found) {
          setFaq(found);
          setForm(found);
        }
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load FAQ."))
      .finally(() => setIsLoading(false));
  }, []);

  const saveFaq = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const response = faq ? await api.put(`/admin/policies/${faq._id}`, form) : await api.post("/admin/policies", form);
      setFaq(response.data.policy);
      setForm(response.data.policy);
      showToast("FAQ saved.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save FAQ.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!faq) return;
    try {
      const response = await api.put(`/admin/policies/${faq._id}/publish`, { isPublished: !faq.isPublished });
      setFaq(response.data.policy);
      setForm(response.data.policy);
      showToast(response.data.policy.isPublished ? "FAQ published." : "FAQ unpublished.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update FAQ.");
    }
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Admin CMS</p>
          <h1>FAQ Management</h1>
        </div>
        {faq ? <button className="secondary-button" type="button" onClick={togglePublish}>{faq.isPublished ? "Unpublish" : "Publish"}</button> : null}
      </div>
      {isLoading ? <div className="analytics-skeleton">Loading FAQ...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}
      {!isLoading ? (
        <div className="cms-editor-layout">
          <form className="form-panel" onSubmit={saveFaq}>
            <div className="form-grid">
              <label>
                Title
                <input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="inline-check">
                <input checked={form.isPublished} type="checkbox" onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} />
                Published
              </label>
            </div>
            <label>
              Content
              <RichTextEditor value={form.content} onChange={(content) => setForm((current) => ({ ...current, content }))} />
            </label>
            <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save FAQ"}</button>
          </form>
          <aside className="form-panel cms-preview-panel">
            <p className="eyebrow">Preview</p>
            <h2>{form.title}</h2>
            <article className="cms-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.content) }} />
          </aside>
        </div>
      ) : null}
    </section>
  );
};

export default AdminFaqs;
