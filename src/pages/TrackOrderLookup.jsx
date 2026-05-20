import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const TrackOrderLookup = () => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const value = orderId.trim();
    if (value) navigate(`/orders/${value}/tracking`);
  };

  return (
    <section className="tracking-lookup">
      <div className="page-heading">
        <p className="eyebrow">Track Order</p>
        <h1>Follow your Cantley order</h1>
        <p>Use your order detail link from My Orders, or enter the order ID shared in your confirmation.</p>
      </div>
      <form className="form-panel tracking-lookup-form" onSubmit={submit}>
        <label>
          Order ID
          <input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Paste order ID" />
        </label>
        <button className="primary-button" type="submit">Track order</button>
        <Link className="secondary-button" to="/orders">Open My Orders</Link>
      </form>
    </section>
  );
};

export default TrackOrderLookup;
