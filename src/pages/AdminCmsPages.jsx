import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const AdminCmsPages = () => {
  const { showToast } = useToast();
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPages = () => {
    api
      .get("/admin/pages")
      .then((response) => {
        setPages(response.data.pages || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load pages."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadPages();
  }, []);

  const togglePublish = async (page) => {
    try {
      const response = await api.put(`/admin/pages/${page._id}/publish`, { isPublished: !page.isPublished });
      setPages((current) => current.map((item) => (item._id === page._id ? response.data.page : item)));
      showToast(response.data.page.isPublished ? "Page published." : "Page unpublished.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update page.");
    }
  };

  const deletePage = async (pageId) => {
    if (!window.confirm("Delete this page?")) return;
    try {
      await api.delete(`/admin/pages/${pageId}`);
      setPages((current) => current.filter((page) => page._id !== pageId));
      showToast("Page deleted.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete page.");
    }
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Admin CMS</p>
          <h1>CMS Pages</h1>
        </div>
        <Link className="button-link" to="/admin/pages/new">Add page</Link>
      </div>
      {isLoading ? <div className="analytics-skeleton">Loading pages...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}
      {!isLoading && !pages.length && !error ? (
        <div className="empty-state">
          <h2>No pages yet</h2>
          <p>Create editable static pages for Cantley.</p>
          <Link className="button-link" to="/admin/pages/new">Create page</Link>
        </div>
      ) : (
        <div className="admin-table">
          {pages.map((page) => (
            <div className="admin-row cms-admin-row" key={page._id}>
              <div>
                <strong>{page.title}</strong>
                <span>/{page.slug}</span>
              </div>
              <span className={`status-badge ${page.isPublished ? "status-approved" : "status-pending"}`}>
                {page.isPublished ? "Published" : "Draft"}
              </span>
              <Link to={`/admin/pages/${page._id}/edit`}>Edit</Link>
              <button type="button" onClick={() => togglePublish(page)}>{page.isPublished ? "Unpublish" : "Publish"}</button>
              <button type="button" onClick={() => deletePage(page._id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminCmsPages;
