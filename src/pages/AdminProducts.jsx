import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const AdminProducts = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = () => {
    setIsLoading(true);
    api
      .get("/admin/products")
      .then((response) => {
        setProducts(response.data.products || []);
        setError("");
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Unable to load products.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const toggleProduct = async (productId) => {
    try {
      await api.patch(`/admin/products/${productId}/toggle-active`);
      showToast("Product status updated.");
      loadProducts();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update product.");
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Delete this Cantley product?")) return;

    try {
      await api.delete(`/admin/products/${productId}`);
      showToast("Product deleted.");
      loadProducts();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete product.");
    }
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Products</h1>
        </div>
        <Link className="button-link" to="/admin/products/new">
          Add product
        </Link>
      </div>

      {error ? <div className="form-alert">{error}</div> : null}
      {isLoading ? <div className="analytics-skeleton">Loading products...</div> : null}

      {!isLoading && !products.length && !error ? (
        <div className="empty-state">
          <h2>No products yet</h2>
          <p>Create Cantley products before opening the shop catalog.</p>
        </div>
      ) : (
        <div className="admin-table">
          {products.map((product) => (
            <div className="admin-row product-admin-row" key={product._id}>
              <div>
                <strong>{product.name}</strong>
                <span>
                  {product.category?.name || "No category"} - Rs.{" "}
                  {Number(product.basePrice).toLocaleString("en-IN")}
                </span>
              </div>
              <span>{product.isActive ? "Active" : "Inactive"}</span>
              <button type="button" onClick={() => toggleProduct(product._id)}>
                Toggle
              </button>
              <Link to={`/admin/products/${product._id}/edit`}>Edit</Link>
              <button type="button" onClick={() => deleteProduct(product._id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminProducts;
