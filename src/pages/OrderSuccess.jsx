import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api from "../services/api.js";

const OrderSuccess = () => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);

  useEffect(() => {
    if (!order) {
      api.get(`/orders/${id}`).then((response) => setOrder(response.data.order));
    }
  }, [id, order]);

  return (
    <section className="checkout-page">
      <div className="empty-state">
        <p className="eyebrow">Order placed</p>
        <h1>Thank you for ordering from Cantley</h1>
        <p>Order number: {order?.orderNumber || "Loading..."}</p>
        {order ? (
          <>
            <p>
              Advance required: Rs. {Number(order.advanceAmount).toLocaleString("en-IN")} | Remaining: Rs.{" "}
              {Number(order.remainingAmount).toLocaleString("en-IN")}
            </p>
            <p>Our team will contact you for Rs. 100 or 20% advance confirmation before processing.</p>
          </>
        ) : null}
        <Link className="button-link" to={`/orders/${id}`}>
          View order details
        </Link>
      </div>
    </section>
  );
};

export default OrderSuccess;
