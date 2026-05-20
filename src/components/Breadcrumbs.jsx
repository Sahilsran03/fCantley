import { Link } from "react-router-dom";
import React from "react";

const Breadcrumbs = ({ items = [] }) => (
  <nav className="breadcrumbs" aria-label="Breadcrumb">
    {items.map((item, index) => (
      <span key={`${item.href}-${item.label}`}>
        {index > 0 ? <span aria-hidden="true">/</span> : null}
        {item.href && index < items.length - 1 ? <Link to={item.href}>{item.label}</Link> : <span>{item.label}</span>}
      </span>
    ))}
  </nav>
);

export default Breadcrumbs;
