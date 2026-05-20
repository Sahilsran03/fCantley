import React, { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import RichTextEditor from "../components/RichTextEditor.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";

const policyTypes = [
  "PRIVACY_POLICY",
  "TERMS_CONDITIONS",
  "SHIPPING_POLICY",
  "RETURN_REFUND_POLICY",
  "CANCELLATION_POLICY",
  "COD_POLICY",
  "CUSTOM_PRINTING_POLICY",
  "DESIGN_UPLOAD_GUIDELINES",
  "ABOUT_US"
];

const labels = {
  PRIVACY_POLICY: "Privacy Policy",
  TERMS_CONDITIONS: "Terms & Conditions",
  SHIPPING_POLICY: "Shipping Policy",
  RETURN_REFUND_POLICY: "Return & Refund Policy",
  CANCELLATION_POLICY: "Cancellation Policy",
  COD_POLICY: "COD / Advance Payment Policy",
  CUSTOM_PRINTING_POLICY: "Custom Printing Policy",
  DESIGN_UPLOAD_GUIDELINES: "Design Upload Guidelines",
  ABOUT_US: "About Us"
};

const emptyPolicy = {
  type: "PRIVACY_POLICY",
  title: "",
  content: "<p></p>",
  isPublished: false
};

const AdminPolicies = () => {
  const { showToast } = useToast();
  const [policies, setPolicies] = useState([]);
  const [activePolicy, setActivePolicy] = useState(null);
  const [form, setForm] = useState(emptyPolicy);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPolicies = () => {
    api
      .get("/admin/policies")
      .then((response) => {
        const items = (response.data.policies || []).filter((policy) => policy.type !== "FAQ");
        setPolicies(items);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load policies."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const startPolicy = (policy) => {
    const nextPolicy = policy || emptyPolicy;
    setActivePolicy(policy || null);
    setForm({
      type: nextPolicy.type,
      title: nextPolicy.title || labels[nextPolicy.type],
      content: nextPolicy.content || "<p></p>",
      isPublished: Boolean(nextPolicy.isPublished)
    });
  };

  const savePolicy = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const response = activePolicy ? await api.put(`/admin/policies/${activePolicy._id}`, form) : await api.post("/admin/policies", form);
      const saved = response.data.policy;
      setPolicies((current) => {
        const exists = current.some((policy) => policy._id === saved._id);
        return exists ? current.map((policy) => (policy._id === saved._id ? saved : policy)) : [...current, saved].filter((policy) => policy.type !== "FAQ");
      });
      setActivePolicy(saved);
      showToast("Policy saved.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save policy.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async (policy) => {
    try {
      const response = await api.put(`/admin/policies/${policy._id}/publish`, { isPublished: !policy.isPublished });
      setPolicies((current) => current.map((item) => (item._id === policy._id ? response.data.policy : item)));
      if (activePolicy?._id === policy._id) {
        setActivePolicy(response.data.policy);
        setForm((current) => ({ ...current, isPublished: response.data.policy.isPublished }));
      }
      showToast(response.data.policy.isPublished ? "Policy published." : "Policy unpublished.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update policy.");
    }
  };

  const deletePolicy = async (policy) => {
    if (!window.confirm("Delete this policy?")) return;
    try {
      await api.delete(`/admin/policies/${policy._id}`);
      setPolicies((current) => current.filter((item) => item._id !== policy._id));
      if (activePolicy?._id === policy._id) {
        setActivePolicy(null);
        setForm(emptyPolicy);
      }
      showToast("Policy deleted.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete policy.");
    }
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Admin CMS</p>
          <h1>Policy Management</h1>
        </div>
        <button className="primary-button" type="button" onClick={() => startPolicy(null)}>Add policy</button>
      </div>
      {isLoading ? <div className="analytics-skeleton">Loading policies...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}

      <div className="quote-admin-layout">
        <div className="admin-table">
          {!isLoading && !policies.length && !error ? (
            <div className="empty-state">
              <h2>No policies yet</h2>
              <p>Create Cantley policy content and publish it when ready.</p>
            </div>
          ) : policies.map((policy) => (
            <div className="admin-row cms-admin-row" key={policy._id}>
              <div>
                <strong>{policy.title}</strong>
                <span>{labels[policy.type] || policy.type}</span>
              </div>
              <span className={`status-badge ${policy.isPublished ? "status-approved" : "status-pending"}`}>
                {policy.isPublished ? "Published" : "Draft"}
              </span>
              <button type="button" onClick={() => startPolicy(policy)}>Edit</button>
              <button type="button" onClick={() => togglePublish(policy)}>{policy.isPublished ? "Unpublish" : "Publish"}</button>
              <button type="button" onClick={() => deletePolicy(policy)}>Delete</button>
            </div>
          ))}
        </div>

        <aside className="form-panel quote-detail-panel">
          <form className="quote-admin-form" onSubmit={savePolicy}>
            <h2>{activePolicy ? "Edit policy" : "Add policy"}</h2>
            <label>
              Type
              <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value, title: current.title || labels[event.target.value] }))}>
                {policyTypes.map((type) => <option key={type} value={type}>{labels[type]}</option>)}
              </select>
            </label>
            <label>
              Title
              <input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label>
              Content
              <RichTextEditor value={form.content} onChange={(content) => setForm((current) => ({ ...current, content }))} />
            </label>
            <label className="inline-check">
              <input checked={form.isPublished} type="checkbox" onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} />
              Published
            </label>
            <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save policy"}</button>
          </form>
          <div className="cms-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.content) }} />
        </aside>
      </div>
    </section>
  );
};

export default AdminPolicies;
