import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const AdminLookbook = () => {
  const { showToast } = useToast();
  const [lookbooks, setLookbooks] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    api
      .get("/admin/lookbook", { params: { search } })
      .then((response) => {
        setLookbooks(response.data.lookbooks || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load lookbook."))
      .finally(() => setIsLoading(false));
  }, [search]);

  const togglePublish = async (entry) => {
    try {
      const response = await api.put(`/admin/lookbook/${entry._id}/publish`, { isPublished: !entry.isPublished });
      setLookbooks((current) => current.map((item) => (item._id === entry._id ? response.data.lookbook : item)));
      showToast(response.data.lookbook.isPublished ? "Lookbook published." : "Lookbook unpublished.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update lookbook.");
    }
  };

  const deleteEntry = async (entryId) => {
    if (!window.confirm("Delete this lookbook entry?")) return;
    try {
      await api.delete(`/admin/lookbook/${entryId}`);
      setLookbooks((current) => current.filter((entry) => entry._id !== entryId));
      showToast("Lookbook entry deleted.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete lookbook entry.");
    }
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div><p className="eyebrow">Content Marketing</p><h1>Lookbook Management</h1></div>
        <Link className="button-link" to="/admin/lookbook/new">Add lookbook</Link>
      </div>
      <div className="filter-bar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search lookbook" /></div>
      {isLoading ? <div className="analytics-skeleton">Loading lookbook entries...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}
      {!isLoading && !lookbooks.length && !error ? (
        <div className="empty-state"><h2>No lookbook entries yet</h2><p>Create fashion and printing showcases for Cantley.</p></div>
      ) : (
        <div className="admin-table">
          {lookbooks.map((entry) => (
            <div className="admin-row content-admin-row" key={entry._id}>
              <div><strong>{entry.title}</strong><span>{entry.customerName || "Cantley"} | {entry.images?.length || 0} images</span></div>
              <span className={`status-badge ${entry.isPublished ? "status-approved" : "status-pending"}`}>{entry.isPublished ? "Published" : "Draft"}</span>
              <Link to={`/admin/lookbook/${entry._id}/edit`}>Edit</Link>
              <button type="button" onClick={() => togglePublish(entry)}>{entry.isPublished ? "Unpublish" : "Publish"}</button>
              <button type="button" onClick={() => deleteEntry(entry._id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminLookbook;
