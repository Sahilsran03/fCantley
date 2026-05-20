import React, { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const emptyForm = {
  title: "",
  description: "",
  type: "BUY_X_GET_Y",
  buyQuantity: 5,
  freeQuantity: 1,
  targetProduct: "",
  targetCategory: "",
  discountPercent: 0,
  isActive: true,
  startDate: "",
  expiryDate: ""
};

const AdminOffers = () => {
  const { showToast } = useToast();
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadOffers = () => {
    setIsLoading(true);
    api
      .get("/admin/offers")
      .then((response) => {
        setOffers(response.data.offers || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load offers."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOffers();
    api.get("/admin/products").then((response) => setProducts(response.data.products)).catch(() => setProducts([]));
    api.get("/admin/categories").then((response) => setCategories(response.data.categories)).catch(() => setCategories([]));
  }, []);

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submitOffer = async (event) => {
    event.preventDefault();
    setError("");

    try {
      if (editingId) {
        await api.put(`/admin/offers/${editingId}`, form);
        showToast("Offer updated.");
      } else {
        await api.post("/admin/offers", form);
        showToast("Offer created.");
      }
      setForm(emptyForm);
      setEditingId("");
      loadOffers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save offer.");
    }
  };

  const editOffer = (offer) => {
    setEditingId(offer._id);
    setForm({
      title: offer.title,
      description: offer.description || "",
      type: offer.type,
      buyQuantity: offer.buyQuantity || 0,
      freeQuantity: offer.freeQuantity || 0,
      targetProduct: offer.targetProduct?._id || offer.targetProduct || "",
      targetCategory: offer.targetCategory?._id || offer.targetCategory || "",
      discountPercent: offer.discountPercent || 0,
      isActive: Boolean(offer.isActive),
      startDate: offer.startDate ? offer.startDate.slice(0, 10) : "",
      expiryDate: offer.expiryDate ? offer.expiryDate.slice(0, 10) : ""
    });
  };

  const deleteOffer = async (offerId) => {
    if (!window.confirm("Delete this Cantley offer?")) return;

    try {
      await api.delete(`/admin/offers/${offerId}`);
      showToast("Offer deleted.");
      loadOffers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete offer.");
    }
  };

  const toggleOffer = async (offerId) => {
    try {
      await api.patch(`/admin/offers/${offerId}/toggle-active`);
      showToast("Offer status updated.");
      loadOffers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update offer.");
    }
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Offers</h1>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      <form className="form-panel wide-form" onSubmit={submitOffer}>
        <div className="form-grid">
          <label>
            Title
            <input name="title" value={form.title} onChange={updateForm} required />
          </label>
          <label>
            Type
            <select name="type" value={form.type} onChange={updateForm}>
              <option value="BUY_X_GET_Y">Buy X Get Y</option>
              <option value="COMBO">Combo</option>
              <option value="PRODUCT_DISCOUNT">Product discount</option>
            </select>
          </label>
          <label>
            Buy quantity
            <input min="0" name="buyQuantity" type="number" value={form.buyQuantity} onChange={updateForm} />
          </label>
          <label>
            Free quantity
            <input min="0" name="freeQuantity" type="number" value={form.freeQuantity} onChange={updateForm} />
          </label>
          <label>
            Discount percent
            <input max="100" min="0" name="discountPercent" type="number" value={form.discountPercent} onChange={updateForm} />
          </label>
          <label>
            Target category
            <select name="targetCategory" value={form.targetCategory} onChange={updateForm}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            Target product
            <select name="targetProduct" value={form.targetProduct} onChange={updateForm}>
              <option value="">All products</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>
          </label>
          <label>
            Start date
            <input name="startDate" type="date" value={form.startDate} onChange={updateForm} />
          </label>
          <label>
            Expiry date
            <input name="expiryDate" type="date" value={form.expiryDate} onChange={updateForm} />
          </label>
        </div>
        <label>
          Description
          <textarea name="description" rows="3" value={form.description} onChange={updateForm} />
        </label>
        <div className="checkbox-row">
          <label>
            <input checked={form.isActive} name="isActive" type="checkbox" onChange={updateForm} />
            Active
          </label>
        </div>
        <button className="primary-button" type="submit">{editingId ? "Update offer" : "Create offer"}</button>
      </form>
      {isLoading ? <div className="analytics-skeleton">Loading offers...</div> : null}
      {!isLoading && !offers.length && !error ? (
        <div className="empty-state">
          <h2>No offers yet</h2>
          <p>Create Cantley offers for cart and checkout promotions.</p>
        </div>
      ) : (
        <div className="admin-table">
          {offers.map((offer) => (
            <div className="admin-row product-admin-row" key={offer._id}>
              <div>
                <strong>{offer.title}</strong>
                <span>{offer.type} - {offer.discountPercent ? `${offer.discountPercent}% off` : `${offer.freeQuantity} free`}</span>
              </div>
              <span>{offer.isActive ? "Active" : "Inactive"}</span>
              <button type="button" onClick={() => toggleOffer(offer._id)}>Toggle</button>
              <button type="button" onClick={() => editOffer(offer)}>Edit</button>
              <button type="button" onClick={() => deleteOffer(offer._id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminOffers;
