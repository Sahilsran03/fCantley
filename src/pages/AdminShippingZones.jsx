import React, { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const emptyForm = {
  country: "India",
  state: "",
  city: "",
  postalCode: "",
  shippingFee: 0,
  estimatedDays: 5,
  isCODAvailable: true
};

const AdminShippingZones = () => {
  const { showToast } = useToast();
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");

  const loadZones = () => {
    api.get("/admin/shipping-zones").then((response) => setZones(response.data.zones)).catch((requestError) => {
      setError(requestError.response?.data?.message || "Unable to load shipping zones.");
    });
  };

  useEffect(() => {
    loadZones();
  }, []);

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submitZone = async (event) => {
    event.preventDefault();
    if (editingId) {
      await api.put(`/admin/shipping-zones/${editingId}`, form);
      showToast("Shipping zone updated.");
    } else {
      await api.post("/admin/shipping-zones", form);
      showToast("Shipping zone created.");
    }
    setForm(emptyForm);
    setEditingId("");
    loadZones();
  };

  const editZone = (zone) => {
    setEditingId(zone._id);
    setForm({
      country: zone.country,
      state: zone.state || "",
      city: zone.city || "",
      postalCode: zone.postalCode,
      shippingFee: zone.shippingFee,
      estimatedDays: zone.estimatedDays,
      isCODAvailable: zone.isCODAvailable
    });
  };

  const deleteZone = async (zoneId) => {
    await api.delete(`/admin/shipping-zones/${zoneId}`);
    showToast("Shipping zone deleted.");
    loadZones();
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Shipping Zones</h1>
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      <form className="form-panel wide-form" onSubmit={submitZone}>
        <div className="form-grid">
          <label>Country<input name="country" value={form.country} onChange={updateForm} required /></label>
          <label>State<input name="state" value={form.state} onChange={updateForm} /></label>
          <label>City<input name="city" value={form.city} onChange={updateForm} /></label>
          <label>Postal code<input name="postalCode" value={form.postalCode} onChange={updateForm} required /></label>
          <label>Shipping fee<input min="0" name="shippingFee" type="number" value={form.shippingFee} onChange={updateForm} /></label>
          <label>Estimated days<input min="1" name="estimatedDays" type="number" value={form.estimatedDays} onChange={updateForm} /></label>
        </div>
        <div className="checkbox-row">
          <label><input checked={form.isCODAvailable} name="isCODAvailable" type="checkbox" onChange={updateForm} />COD available</label>
        </div>
        <button className="primary-button" type="submit">{editingId ? "Update zone" : "Create zone"}</button>
      </form>
      <div className="admin-table">
        {zones.map((zone) => (
          <div className="admin-row product-admin-row" key={zone._id}>
            <div><strong>{zone.postalCode}</strong><span>{zone.city || "Any city"}, {zone.state || "Any state"}, {zone.country}</span></div>
            <span>Rs. {Number(zone.shippingFee).toLocaleString("en-IN")}</span>
            <span>{zone.estimatedDays} days</span>
            <button type="button" onClick={() => editZone(zone)}>Edit</button>
            <button type="button" onClick={() => deleteZone(zone._id)}>Delete</button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdminShippingZones;
