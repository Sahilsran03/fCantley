import React, { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const emptyForm = { title: "", message: "", image: "", buttonText: "", buttonLink: "", targetAudience: "ALL", isActive: true, startDate: "", expiryDate: "" };

const AdminAnnouncements = () => {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");

  const load = () => api.get("/admin/announcements").then((response) => setAnnouncements(response.data.announcements));
  useEffect(() => { load(); }, []);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (editingId) {
      await api.put(`/admin/announcements/${editingId}`, form);
      showToast("Announcement updated.");
    } else {
      await api.post("/admin/announcements", form);
      showToast("Announcement created.");
    }
    setForm(emptyForm); setEditingId(""); load();
  };

  const send = async () => {
    await api.post("/admin/announcements/send", form);
    showToast("Announcement sent.");
    setForm(emptyForm); load();
  };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({ ...emptyForm, ...item, startDate: item.startDate?.slice(0, 10) || "", expiryDate: item.expiryDate?.slice(0, 10) || "" });
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading"><p className="eyebrow">Admin</p><h1>Announcements</h1></div>
      <form className="form-panel wide-form" onSubmit={submit}>
        <div className="form-grid">
          <label>Title<input name="title" value={form.title} onChange={update} required /></label>
          <label>Audience<select name="targetAudience" value={form.targetAudience} onChange={update}><option>ALL</option><option>CUSTOMERS</option><option>ADMINS</option></select></label>
          <label>Button text<input name="buttonText" value={form.buttonText} onChange={update} /></label>
          <label>Button link<input name="buttonLink" value={form.buttonLink} onChange={update} /></label>
          <label>Image URL<input name="image" value={form.image} onChange={update} /></label>
          <label>Start date<input name="startDate" type="date" value={form.startDate} onChange={update} /></label>
          <label>Expiry date<input name="expiryDate" type="date" value={form.expiryDate} onChange={update} /></label>
        </div>
        <label>Message<textarea name="message" rows="4" value={form.message} onChange={update} required /></label>
        <div className="checkbox-row"><label><input checked={form.isActive} name="isActive" type="checkbox" onChange={update} />Active</label></div>
        <button className="primary-button" type="submit">{editingId ? "Update" : "Create"}</button>
        <button className="secondary-button" type="button" onClick={send}>Send manual announcement</button>
      </form>
      <div className="admin-table">
        {announcements.map((item) => (
          <div className="admin-row product-admin-row" key={item._id}>
            <div><strong>{item.title}</strong><span>{item.targetAudience} - {item.isActive ? "Active" : "Inactive"}</span></div>
            <button type="button" onClick={() => edit(item)}>Edit</button>
            <button type="button" onClick={async () => { await api.delete(`/admin/announcements/${item._id}`); load(); }}>Delete</button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdminAnnouncements;
