import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <section className="not-found-page">
    <p className="eyebrow">404</p>
    <h1>Page not found</h1>
    <p>The page you are looking for does not exist.</p>
    <Link className="button-link" to="/">
      Go home
    </Link>
  </section>
);

export default NotFound;
