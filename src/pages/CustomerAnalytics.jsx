import React, { useEffect, useState } from "react";
import { Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AdminNav from "../components/AdminNav.jsx";
import AnalyticsFilter from "../components/AnalyticsFilter.jsx";
import api from "../services/api.js";
import { exportCsv } from "../utils/csv.js";

const colors = ["#357266", "#0f172a", "#be7c4d", "#6366f1", "#9f1239"];

const CustomerAnalytics = () => {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/analytics/customers", { params: { range } }).then((response) => setData(response.data));
  }, [range]);

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div><p className="eyebrow">Analytics</p><h1>Customer Analytics</h1></div>
        <AnalyticsFilter range={range} onRangeChange={setRange} onExport={() => exportCsv("cantley-customers.csv", data?.topCustomers || [])} />
      </div>
      {!data ? <div className="analytics-skeleton">Loading customers...</div> : (
        <>
          <div className="metric-grid">
            <article className="metric-card"><span>New Customers</span><strong>{data.newCustomersCount}</strong></article>
            <article className="metric-card"><span>Repeat Customers</span><strong>{data.repeatCustomers}</strong></article>
          </div>
          <div className="dashboard-grid">
            <section className="chart-panel"><h2>Customer Growth</h2><ResponsiveContainer height={280} width="100%"><LineChart data={data.customerGrowth}><XAxis dataKey="label" /><YAxis /><Tooltip /><Line dataKey="customers" stroke="#357266" strokeWidth={3} /></LineChart></ResponsiveContainer></section>
            <section className="chart-panel"><h2>Loyalty Ranks</h2><ResponsiveContainer height={280} width="100%"><PieChart><Pie data={data.loyaltyRankDistribution} dataKey="count" nameKey="_id" outerRadius={90}>{data.loyaltyRankDistribution.map((entry, index) => <Cell fill={colors[index % colors.length]} key={entry._id} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></section>
            <section className="chart-panel wide-chart"><h2>Top Customers by Order Value</h2>{data.topCustomers.map((customer) => <p key={customer._id}>{customer.name} - Order Value Rs. {Number(customer.orderValue).toLocaleString("en-IN")} - {customer.orders} orders</p>)}</section>
          </div>
        </>
      )}
    </section>
  );
};

export default CustomerAnalytics;
