import React, { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AnalyticsFilter from "../components/AnalyticsFilter.jsx";
import AdminNav from "../components/AdminNav.jsx";
import api from "../services/api.js";
import { exportCsv } from "../utils/csv.js";

const metricLabels = {
  grossOrderValue: "Gross Order Value",
  grossMoneyReceived: "Gross Money Received",
  onlineReceived: "Online Received",
  codCollected: "COD Collected",
  codOutstanding: "Current COD Outstanding",
  cancelledOrderValue: "Cancelled Order Value",
  paidOrders: "Fully Paid Orders",
  unpaidOrPartiallyPaidOrders: "Unpaid / Partially Paid",
  incompleteFinancialOrders: "Incomplete Financial Data",
  totalOrders: "Orders",
  totalCustomers: "Customers",
  totalProducts: "Products",
  pendingOrders: "Pending",
  deliveredOrders: "Delivered",
  cancelledOrders: "Cancelled",
  lowStockProducts: "Low Stock",
  totalReviews: "Reviews",
  totalRewardsGiven: "Rewards Given"
};

const AdminDashboard = () => {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);
  const [sales, setSales] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/admin/analytics/dashboard", { params: { range } }),
      api.get("/admin/analytics/sales", { params: { range } })
    ])
      .then(([dashboardResponse, salesResponse]) => {
        setData(dashboardResponse.data);
        setSales(salesResponse.data.daily);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load analytics."));
  }, [range]);

  const metrics = data?.metrics || {};

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Cantley Dashboard</h1>
          <p>Order value, collected money, outstanding COD, and operations at a glance.</p>
        </div>
        <AnalyticsFilter
          range={range}
          onRangeChange={setRange}
          onExport={() => exportCsv("cantley-dashboard-orders.csv", data?.recentOrders || [])}
        />
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      {!data ? <div className="analytics-skeleton">Loading analytics...</div> : null}
      {data ? (
        <>
          <div className="metric-grid">
            {Object.entries(metricLabels).map(([key, label]) => (
              <article className="metric-card" key={key}>
                <span>{label}</span>
                <strong>{["grossOrderValue", "grossMoneyReceived", "onlineReceived", "codCollected", "codOutstanding", "cancelledOrderValue", "totalRewardsGiven"].includes(key) ? `Rs. ${Number(metrics[key] || 0).toLocaleString("en-IN")}` : Number(metrics[key] || 0).toLocaleString("en-IN")}</strong>
              </article>
            ))}
          </div>
          <div className="chart-panel">
            <h2>Order Value Trend</h2>
            {sales.length ? (
              <ResponsiveContainer height={280} width="100%">
                <BarChart data={sales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orderValue" fill="#357266" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p>No sales data for this range.</p>}
          </div>
          <div className="dashboard-grid">
            <section className="chart-panel">
              <h2>Top Products</h2>
              {data.topProducts.map((product) => <p key={product._id}>{product.name} - {product.quantity} sold</p>)}
            </section>
            <section className="chart-panel">
              <h2>Low Stock Alerts</h2>
              {data.lowStockProducts.map((product) => <p key={product._id}>{product.name}</p>)}
            </section>
            <section className="chart-panel">
              <h2>Recent Orders</h2>
              {data.recentOrders.map((order) => <p key={order._id}>{order.orderNumber} - Rs. {Number(order.totalAmount).toLocaleString("en-IN")}</p>)}
            </section>
            <section className="chart-panel">
              <h2>Reward Summary</h2>
              {data.rewardSummary.map((reward) => <p key={reward._id}>{reward._id}: Rs. {Number(reward.amount).toLocaleString("en-IN")}</p>)}
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
};

export default AdminDashboard;
