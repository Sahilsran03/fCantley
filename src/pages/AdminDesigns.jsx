import React, { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";

const statuses = ["Draft", "Submitted", "Approved", "Rejected"];

const AdminDesigns = () => {
  const { showToast } = useToast();
  const [designs, setDesigns] = useState([]);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");

  const loadDesigns = () => {
    api
      .get("/admin/designs")
      .then((response) => setDesigns(response.data.designs))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load designs."));
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  const updateStatus = async (designId, status) => {
    await api.put(`/admin/designs/${designId}/status`, { status, adminNote: notes[designId] || "" });
    showToast("Design status updated.");
    loadDesigns();
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Designs</h1>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      <div className="admin-table">
        {designs.map((design) => (
          <article className="admin-design-card" key={design._id}>
            <img src={getMediaUrl(design.previewImage) || "https://placehold.co/220x220/f1f5f9/334155?text=Design"} alt={design.designType} />
            <div>
              <strong>{design.product?.name || design.designType}</strong>
              <span>{design.user?.email} - {design.status}</span>
              <p>{design.customization?.text || "No custom text"}</p>
              <div className="file-list">
                {design.sourceFiles?.map((file) => (
                  <a href={file.url} key={file.publicId} rel="noreferrer" target="_blank">{file.originalName || file.resourceType}</a>
                ))}
              </div>
              <textarea
                placeholder="Admin note"
                rows="3"
                value={notes[design._id] ?? design.adminNote ?? ""}
                onChange={(event) => setNotes((current) => ({ ...current, [design._id]: event.target.value }))}
              />
            </div>
            <div className="status-actions">
              {statuses.map((status) => (
                <button key={status} type="button" onClick={() => updateStatus(design._id, status)}>
                  {status}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AdminDesigns;
