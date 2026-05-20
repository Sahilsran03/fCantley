import React, { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const emptyForm = {
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: 0,
  minOrderAmount: 0,
  maxDiscountAmount: "",
  usageLimit: "",
  startDate: "",
  expiryDate: "",
  isActive: true
};

const AdminCoupons = () => {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadCoupons = () => {
    setIsLoading(true);
    api
      .get("/admin/coupons")
      .then((response) => {
        setCoupons(response.data.coupons || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load coupons."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submitCoupon = async (event) => {
    event.preventDefault();
    setError("");

    try {
      if (editingId) {
        await api.put(`/admin/coupons/${editingId}`, form);
        showToast("Coupon updated.");
      } else {
        await api.post("/admin/coupons", form);
        showToast("Coupon created.");
      }
      setForm(emptyForm);
      setEditingId("");
      loadCoupons();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save coupon.");
    }
  };

  const editCoupon = (coupon) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      type: coupon.type,
      value: coupon.value || 0,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount ?? "",
      usageLimit: coupon.usageLimit ?? "",
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : "",
      expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : "",
      isActive: Boolean(coupon.isActive)
    });
  };

  const deleteCoupon = async (couponId) => {
    if (!window.confirm("Delete this Cantley coupon?")) return;

    try {
      await api.delete(`/admin/coupons/${couponId}`);
      showToast("Coupon deleted.");
      loadCoupons();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete coupon.");
    }
  };

  const toggleCoupon = async (couponId) => {
    try {
      await api.patch(`/admin/coupons/${couponId}/toggle-active`);
      showToast("Coupon status updated.");
      loadCoupons();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update coupon.");
    }
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Coupons</h1>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      <form className="form-panel wide-form" onSubmit={submitCoupon}>
        <div className="form-grid">
          <label>
            Code
            <input name="code" value={form.code} onChange={updateForm} required />
          </label>
          <label>
            Type
            <select name="type" value={form.type} onChange={updateForm}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed</option>
              <option value="FREE_SHIPPING">Free shipping</option>
            </select>
          </label>
          <label>
            Value
            <input min="0" name="value" type="number" value={form.value} onChange={updateForm} />
          </label>
          <label>
            Minimum order
            <input min="0" name="minOrderAmount" type="number" value={form.minOrderAmount} onChange={updateForm} />
          </label>
          <label>
            Max discount
            <input min="0" name="maxDiscountAmount" type="number" value={form.maxDiscountAmount} onChange={updateForm} />
          </label>
          <label>
            Usage limit
            <input min="1" name="usageLimit" type="number" value={form.usageLimit} onChange={updateForm} />
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
        <button className="primary-button" type="submit">{editingId ? "Update coupon" : "Create coupon"}</button>
      </form>
      {isLoading ? <div className="analytics-skeleton">Loading coupons...</div> : null}
      {!isLoading && !coupons.length && !error ? (
        <div className="empty-state">
          <h2>No coupons yet</h2>
          <p>Create Cantley coupon codes for checkout discounts.</p>
        </div>
      ) : (
        <div className="admin-table">
          {coupons.map((coupon) => (
            <div className="admin-row product-admin-row" key={coupon._id}>
              <div>
                <strong>{coupon.code}</strong>
                <span>{coupon.type} - used {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ""}</span>
              </div>
              <span>{coupon.isActive ? "Active" : "Inactive"}</span>
              <button type="button" onClick={() => toggleCoupon(coupon._id)}>Toggle</button>
              <button type="button" onClick={() => editCoupon(coupon)}>Edit</button>
              <button type="button" onClick={() => deleteCoupon(coupon._id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminCoupons;
