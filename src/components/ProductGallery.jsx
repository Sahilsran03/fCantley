import React, { useEffect, useMemo, useState } from "react";
import { getOptimizedImageUrl } from "../utils/media.js";

const ProductGallery = ({ images = [], name }) => {
  const fallback = "https://placehold.co/900x700/f1f5f9/334155?text=Cantley";
  const galleryImages = useMemo(
    () => images.map((image) => getOptimizedImageUrl(image, { width: 1200 })).filter(Boolean),
    [images]
  );
  const displayImages = useMemo(() => (galleryImages.length ? galleryImages : [fallback]), [galleryImages]);
  const [activeImage, setActiveImage] = useState(displayImages[0]);

  useEffect(() => {
    setActiveImage(displayImages[0]);
  }, [displayImages]);

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <img className="zoomable-image" src={activeImage} alt={name} loading="eager" decoding="async" />
      </div>
      <div className="product-gallery-thumbs">
        {displayImages.map((image) => (
          <button
            className={image === activeImage ? "active" : ""}
            key={image}
            type="button"
            onClick={() => setActiveImage(image)}
          >
            <img src={image} alt={name} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductGallery;
