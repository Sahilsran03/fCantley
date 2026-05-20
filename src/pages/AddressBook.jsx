import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",
  isDefault: false
};

const AddressBook = () => {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAddresses = async () => {
    const response = await api.get("/users/profile");
    setAddresses(response.data.user.addresses || []);
  };

  useEffect(() => {
    loadAddresses()
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load addresses."))
      .finally(() => setIsLoading(false));
  }, []);

  const updateField = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setForm(emptyAddress);
    setEditingId("");
    setError("");
  };

  const editAddress = (address) => {
    setEditingId(address._id);
    setForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      city: address.city || "",
      state: address.state || "",
      country: address.country || "India",
      postalCode: address.postalCode || "",
      isDefault: Boolean(address.isDefault)
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitAddress = async (event) => {
    event.preventDefault();
    setError("");

    const required = ["fullName", "phone", "addressLine1", "city", "state", "country", "postalCode"];
    if (required.some((field) => !String(form[field]).trim())) {
      setError("Please complete all required address fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = editingId
        ? await api.put(`/users/addresses/${editingId}`, form)
        : await api.post("/users/addresses", form);
      setAddresses(response.data.addresses || []);
      showToast(editingId ? "Address updated." : "Address added.");
      resetForm();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save address.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const response = await api.delete(`/users/addresses/${addressId}`);
      setAddresses(response.data.addresses || []);
      showToast("Address removed.");
      if (editingId === addressId) resetForm();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to remove address.");
    }
  };

  const setDefault = async (addressId) => {
    try {
      const response = await api.put(`/users/addresses/${addressId}/default`);
      setAddresses(response.data.addresses || []);
      showToast("Default address updated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to set default address.");
    }
  };

  if (isLoading) return <div className="analytics-skeleton">Loading addresses...</div>;

  return (
    <section className="admin-page">
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Address Book</p>
          <h1>Saved addresses</h1>
          <p>Choose a default address to speed up checkout.</p>
        </div>
        <Link className="secondary-button account-action-link" to="/account">
          Back to account
        </Link>
      </div>

      <form className="form-panel wide-form" onSubmit={submitAddress}>
        {error ? <div className="form-alert">{error}</div> : null}
        <div className="form-grid">
          <label>
            Full name
            <input name="fullName" value={form.fullName} onChange={updateField} required />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={updateField} required />
          </label>
          <label>
            Address line 1
            <input name="addressLine1" value={form.addressLine1} onChange={updateField} required />
          </label>
          <label>
            Address line 2
            <input name="addressLine2" value={form.addressLine2} onChange={updateField} />
          </label>
          <label>
            City
            <input name="city" value={form.city} onChange={updateField} required />
          </label>
          <label>
            State
            <input name="state" value={form.state} onChange={updateField} required />
          </label>
          <label>
            Country
            <input name="country" value={form.country} onChange={updateField} required />
          </label>
          <label>
            Postal code
            <input name="postalCode" value={form.postalCode} onChange={updateField} required />
          </label>
        </div>
        <label className="inline-check">
          <input name="isDefault" type="checkbox" checked={form.isDefault} onChange={updateField} />
          Make this my default address
        </label>
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingId ? "Update address" : "Add address"}
          </button>
          {editingId ? (
            <button className="secondary-button" type="button" onClick={resetForm}>
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="address-grid">
        {addresses.length ? addresses.map((address) => (
          <article className="address-card" key={address._id}>
            <div>
              <h2>{address.fullName}</h2>
              {address.isDefault ? <span className="discount-badge">Default</span> : null}
            </div>
            <p>{address.phone}</p>
            <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}</p>
            <p>{address.city}, {address.state} {address.postalCode}</p>
            <p>{address.country}</p>
            <div className="address-actions">
              <button className="secondary-button" type="button" onClick={() => editAddress(address)}>
                Edit
              </button>
              {!address.isDefault ? (
                <button className="secondary-button" type="button" onClick={() => setDefault(address._id)}>
                  Set default
                </button>
              ) : null}
              <button className="secondary-button" type="button" onClick={() => deleteAddress(address._id)}>
                Remove
              </button>
            </div>
          </article>
        )) : (
          <div className="empty-state">
            <h2>No saved addresses</h2>
            <p>Add your first shipping address for faster Cantley checkout.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default AddressBook;
