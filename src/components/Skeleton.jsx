import React from "react";
const Skeleton = ({ className = "", lines = 1 }) => (
  <div className={`skeleton ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, index) => (
      <span key={index} />
    ))}
  </div>
);

export const ProductGridSkeleton = ({ count = 6 }) => (
  <div className="product-grid">
    {Array.from({ length: count }).map((_, index) => (
      <article className="product-card product-card-skeleton" key={index}>
        <Skeleton className="skeleton-image" />
        <div className="product-card-body">
          <Skeleton lines={4} />
        </div>
      </article>
    ))}
  </div>
);

export default Skeleton;
