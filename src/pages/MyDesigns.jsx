import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";

const MyDesigns = () => {
  const { showToast } = useToast();
  const [designs, setDesigns] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/designs/my-designs")
      .then((response) => setDesigns(response.data.designs))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load designs."));
  }, []);

  const saveTemplate = async (design) => {
    const response = await api.put(`/designs/${design._id}/save-template`, {
      templateName: design.templateName || design.product?.name || `${design.designType} template`
    });
    setDesigns((current) => current.map((item) => (item._id === design._id ? response.data.design : item)));
    showToast("Design saved as template.");
  };

  return (
    <section className="catalog-page">
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Studio</p>
          <h1>My Designs</h1>
        </div>
        <Link className="button-link" to="/design-studio">New design</Link>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      {!designs.length ? (
        <div className="empty-state">
          <h2>No designs yet</h2>
          <p>Create a custom Cantley T-shirt, hoodie, sticker, or label design.</p>
        </div>
      ) : (
        <div className="product-grid">
          {designs.map((design) => (
            <article className="product-card" key={design._id}>
              <div className="product-card-image">
                <img src={getMediaUrl(design.previewImage) || "https://placehold.co/420x315/f1f5f9/334155?text=Cantley+Design"} alt={design.designType} />
              </div>
              <div className="product-card-body">
                <h2>{design.product?.name || `${design.designType} design`}</h2>
                <p>{design.customization?.placement} - {design.status}</p>
                {design.adminNote ? <p>{design.adminNote}</p> : null}
                <span className="discount-badge">{design.status}</span>
                <button className="secondary-button" type="button" onClick={() => saveTemplate(design)}>
                  {design.isSavedTemplate ? "Saved Template" : "Save Template"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default MyDesigns;
