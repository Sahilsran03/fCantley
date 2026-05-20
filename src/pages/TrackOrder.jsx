import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api.js";

const TrackOrder = () => {
  const { id } = useParams();
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/orders/${id}/tracking`)
      .then((response) => setTracking(response.data.tracking))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load tracking."));
  }, [id]);

  if (error) return <div className="form-alert">{error}</div>;
  if (!tracking) return <p>Loading tracking...</p>;

  return (
    <section className="order-detail-page">
      <div className="page-heading">
        <p className="eyebrow">Tracking</p>
        <h1>{tracking.orderNumber}</h1>
        <p>{tracking.orderStatus} - {tracking.paymentStatus}</p>
      </div>

      <div className="tracking-grid">
        <aside className="cart-summary">
          <h2>Courier</h2>
          <p>{tracking.courierName || "Courier will be assigned soon."}</p>
          <p>Tracking: {tracking.trackingNumber || "Pending"}</p>
          {tracking.estimatedDeliveryDate ? <p>Estimated delivery: {new Date(tracking.estimatedDeliveryDate).toLocaleDateString()}</p> : null}
          {tracking.shippingNotes ? <p>{tracking.shippingNotes}</p> : null}
        </aside>

        <div className="timeline">
          {(tracking.trackingHistory || []).map((item, index) => (
            <div className="timeline-item" key={`${item.status}-${index}`}>
              <span />
              <div>
                <strong>{item.status}</strong>
                <p>{item.message || "Status updated"}</p>
                <small>{new Date(item.timestamp).toLocaleString()}</small>
              </div>
            </div>
          ))}
          {!tracking.trackingHistory?.length ? <p>No tracking updates yet.</p> : null}
        </div>
      </div>
    </section>
  );
};

export default TrackOrder;
