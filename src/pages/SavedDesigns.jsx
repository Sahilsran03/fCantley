import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";

const SavedDesigns = () => {
  const [designs, setDesigns] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/designs/saved")
      .then((response) => setDesigns(response.data.designs))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load saved designs."));
  }, []);

  const removeTemplate = async (designId) => {
    await api.delete(`/designs/${designId}/save-template`);
    setDesigns((current) => current.filter((design) => design._id !== designId));
  };

  return (
    <section className="catalog-page">
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Studio</p>
          <h1>Saved Designs</h1>
        </div>
        <Link className="button-link" to="/design-studio">New design</Link>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      {!designs.length && !error ? (
        <div className="empty-state">
          <h2>No saved templates</h2>
          <p>Save your favorite design drafts as reusable Cantley templates.</p>
        </div>
      ) : (
        <div className="product-grid">
          {designs.map((design) => (
            <article className="product-card" key={design._id}>
              <div className="product-card-image">
                <img src={getMediaUrl(design.previewImage) || "https://placehold.co/420x315/f1f5f9/334155?text=Saved+Design"} alt={design.templateName || design.designType} />
              </div>
              <div className="product-card-body">
                <h2>{design.templateName || `${design.designType} template`}</h2>
                <p>{design.product?.name || "Custom Cantley design"}</p>
                <button className="secondary-button" type="button" onClick={() => removeTemplate(design._id)}>Remove saved</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default SavedDesigns;
