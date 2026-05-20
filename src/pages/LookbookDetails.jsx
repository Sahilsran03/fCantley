import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import SEO from "../components/SEO.jsx";
import api from "../services/api.js";
import { getOptimizedImageUrl } from "../utils/media.js";

const LookbookDetails = () => {
  const { slug } = useParams();
  const [lookbook, setLookbook] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/lookbook/${slug}`)
      .then((response) => {
        setLookbook(response.data.lookbook);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load lookbook entry."));
  }, [slug]);

  if (error) return <section className="admin-page"><div className="form-alert">{error}</div><Link className="button-link" to="/lookbook">Back to lookbook</Link></section>;
  if (!lookbook) return <div className="analytics-skeleton">Loading lookbook...</div>;

  return (
    <section className="editorial-detail">
      <SEO title={lookbook.title} description={lookbook.description} image={getOptimizedImageUrl(lookbook.images?.[0], { width: 1200 })} canonical={`/lookbook/${lookbook.slug}`} />
      <div className="editorial-hero">
        <p className="eyebrow">{lookbook.customerName || "Cantley Lookbook"}</p>
        <h1>{lookbook.title}</h1>
        <p>{lookbook.description}</p>
      </div>
      <div className="lookbook-mosaic">
        {lookbook.images?.map((image) => (
          <img key={image.publicId} src={getOptimizedImageUrl(image, { width: 1200 })} alt={image.originalName || lookbook.title} />
        ))}
      </div>
      {lookbook.relatedProducts?.length ? (
        <section className="related-products">
          <div className="page-heading">
            <p className="eyebrow">Shop the idea</p>
            <h2>Related products</h2>
          </div>
          <div className="product-grid">
            {lookbook.relatedProducts.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </section>
      ) : null}
    </section>
  );
};

export default LookbookDetails;
