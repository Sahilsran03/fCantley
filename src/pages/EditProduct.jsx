import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import ProductForm from "../components/ProductForm.jsx";
import api from "../services/api.js";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/admin/categories"), api.get("/admin/products")])
      .then(([categoryResponse, productResponse]) => {
        setCategories(categoryResponse.data.categories);
        const foundProduct = productResponse.data.products.find((item) => item._id === id);
        if (!foundProduct) {
          setError("Product not found.");
          return;
        }
        setProduct(foundProduct);
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Unable to load product.");
      });
  }, [id]);

  const updateProduct = async (payload) => {
    await api.put(`/admin/products/${id}`, payload);
    navigate("/admin/products");
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Edit product</h1>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      {product ? (
        <ProductForm
          categories={categories}
          initialProduct={product}
          submitLabel="Update product"
          onSubmit={updateProduct}
        />
      ) : null}
    </section>
  );
};

export default EditProduct;
