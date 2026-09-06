import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

import "./Returns.css";

const maxFileSize = 40 * 1024 * 1024;
const cancellable = ["Pending", "Design Review", "Approved"];
const proofRequired = ["DAMAGED", "WRONG_ITEM", "DEFECTIVE"];
const reasons = [["DAMAGED", "Damaged"], ["WRONG_ITEM", "Wrong item"], ["DEFECTIVE", "Defective"], ["SIZE_ISSUE", "Size issue"], ["OTHER", "Other"]];
const appearsReturnEligible = (order) => order.paymentMethod !== "WALLET" && order.orderStatus === "Delivered" && order.deliveredAt && Number(order.remainingCodDue || 0) === 0 && Number(order.onlineAmountPaid || 0) + Number(order.codAmountCollected || 0) >= Number(order.totalAmount || 0) && Date.now() <= new Date(order.deliveredAt).getTime() + 7 * 86400000;

const ReturnRequest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const requestedType = searchParams.get("type") === "CANCEL" ? "CANCEL" : "RETURN";
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ order: searchParams.get("orderId") || "", type: requestedType, orderItemIndex: "", requestedQuantity: 1, reasonCategory: "DAMAGED", reason: "" });
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitLock = useRef(false);
  const [loadError, setLoadError] = useState("");
  const loadOrders = useCallback(() => {
    setIsLoading(true); setLoadError("");
    return api.get("/orders/my-orders").then((response) => setOrders(response.data.orders || [])).catch((e) => setLoadError(e.response?.data?.message || "Unable to load orders.")).finally(() => setIsLoading(false));
  }, []);
  useEffect(() => { loadOrders(); }, [loadOrders]);
  const eligibleOrders = useMemo(() => orders.filter((order) => form.type === "CANCEL" ? cancellable.includes(order.orderStatus) : appearsReturnEligible(order)), [form.type, orders]);
  const selectedOrder = useMemo(() => orders.find((order) => order._id === form.order), [form.order, orders]);
  const selectedItem = selectedOrder?.items?.[Number(form.orderItemIndex)];

  const updateFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 5 || selected.some((file) => file.size > maxFileSize)) return setError("Upload at most 5 images; each must be 40MB or smaller.");
    setFiles(selected); setError("");
  };
  const submitRequest = async (event) => {
    event.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true; setIsSubmitting(true); setError("");
    try {
      if (form.type === "RETURN" && selectedOrder?.paymentMethod === "WALLET") throw new Error("Item returns for Wallet orders are not supported.");
      if (form.type === "RETURN" && proofRequired.includes(form.reasonCategory) && files.length === 0) throw new Error("Add at least one proof image for this reason.");
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => { if (value !== "") data.append(key, value); });
      files.forEach((file) => data.append("proofImages", file));
      const response = await api.post("/returns", data);
      showToast("Request submitted."); navigate(`/returns/${response.data.request._id}`);
    } catch (e) { setError(e.response?.data?.message || e.message || "Unable to submit request."); }
    finally { submitLock.current = false; setIsSubmitting(false); }
  };

  return <section className="cantley-returns">
    <div className="page-heading row-heading"><div><p className="eyebrow">Returns</p><h1>{form.type === "CANCEL" ? "Cancel Order" : "Request Return"}</h1><p>Returns are available for fully paid delivered orders for 7 calendar days.</p></div><Link className="button-link" to="/returns">My requests</Link></div>
    {isLoading ? <div className="returns-state" role="status">Loading eligible orders...</div> : null}{error ? <div className="form-alert" role="alert">{error}</div> : null}
    {loadError ? <div className="returns-state" role="alert"><p>{loadError}</p><button className="secondary-button" type="button" onClick={loadOrders}>Retry</button></div> : null}
    <form className="form-panel wide-form" onSubmit={submitRequest}>
      <fieldset disabled={isLoading || Boolean(loadError) || isSubmitting}><legend>Request information</legend>
      <label>Request type<select value={form.type} onChange={(e) => setForm((v) => ({ ...v, type: e.target.value, order: "", orderItemIndex: "" }))}><option value="RETURN">RETURN</option><option value="CANCEL">CANCEL</option></select></label>
      <label>Eligible order<select required value={form.order} onChange={(e) => setForm((v) => ({ ...v, order: e.target.value, orderItemIndex: "" }))}><option value="">Select an order</option>{eligibleOrders.map((order) => <option key={order._id} value={order._id}>{order.orderNumber} - {order.orderStatus}</option>)}</select></label>
      {!isLoading && !loadError && !eligibleOrders.length ? <p className="form-alert">No orders are currently eligible for this request type.</p> : null}
      {form.type === "RETURN" && selectedOrder && appearsReturnEligible(selectedOrder) ? <>
        <label>Item<select required value={form.orderItemIndex} onChange={(e) => setForm((v) => ({ ...v, orderItemIndex: e.target.value, requestedQuantity: 1 }))}><option value="">Select an exact item</option>{selectedOrder.items.map((item, index) => <option key={`${item.product}-${index}`} value={index}>{item.name} - {item.size || item.variantSku || "Standard"} - Qty {item.quantity}</option>)}</select></label>
        <label>Quantity<input type="number" min="1" max={selectedItem?.quantity || 1} required value={form.requestedQuantity} onChange={(e) => setForm((v) => ({ ...v, requestedQuantity: e.target.value }))} /></label>
        <label>Reason category<select value={form.reasonCategory} onChange={(e) => setForm((v) => ({ ...v, reasonCategory: e.target.value }))}>{reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </> : null}
      <label>Reason details<textarea rows="5" minLength="8" required value={form.reason} onChange={(e) => setForm((v) => ({ ...v, reason: e.target.value }))} /></label>
      <label>Proof images{form.type === "RETURN" && proofRequired.includes(form.reasonCategory) ? " (required)" : ""}<input accept="image/jpeg,image/png,image/webp" multiple type="file" onChange={updateFiles} /></label>
      <button className="primary-button" disabled={isSubmitting || !eligibleOrders.length || !eligibleOrders.some((order) => order._id === form.order)} type="submit">{isSubmitting ? "Submitting..." : "Submit request"}</button>
      </fieldset>
    </form>
  </section>;
};
export default ReturnRequest;
