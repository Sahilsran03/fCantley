import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import ProductForm from "../components/ProductForm.jsx";
import api from "../services/api.js";

const AddProduct = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get("/admin/categories").then((response) => setCategories(response.data.categories));
  }, []);

  const createProduct = async (payload) => {
    await api.post("/admin/products", payload);
    navigate("/admin/products");
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Add product</h1>
      </div>
      <ProductForm categories={categories} submitLabel="Create product" onSubmit={createProduct} />
    </section>
  );
};

export default AddProduct;
