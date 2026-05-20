import React, { useEffect, useState } from "react";
import { Line, LineChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AdminNav from "../components/AdminNav.jsx";
import AnalyticsFilter from "../components/AnalyticsFilter.jsx";
import api from "../services/api.js";
import { exportCsv } from "../utils/csv.js";

const SalesAnalytics = () => {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/analytics/sales", { params: { range } })
      .then((response) => { setData(response.data); setError(""); })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load sales analytics."));
  }, [range]);

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div><p className="eyebrow">Analytics</p><h1>Sales Analytics</h1></div>
        <AnalyticsFilter range={range} onRangeChange={setRange} onExport={() => exportCsv("cantley-sales.csv", data?.daily || [])} />
      </div>
      {error ? <div className="form-alert">{error}</div> : null}
      {!data ? <div className="analytics-skeleton">Loading sales...</div> : (
        <div className="dashboard-grid">
          <section className="chart-panel wide-chart">
            <h2>Daily Sales</h2>
            <ResponsiveContainer height={300} width="100%">
              <LineChart data={data.daily}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Line dataKey="revenue" stroke="#357266" strokeWidth={3} /></LineChart>
            </ResponsiveContainer>
          </section>
          <section className="chart-panel"><h2>Weekly Orders</h2><ResponsiveContainer height={260} width="100%"><BarChart data={data.weekly}><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="orders" fill="#0f172a" /></BarChart></ResponsiveContainer></section>
          <section className="chart-panel"><h2>Category Sales</h2><ResponsiveContainer height={260} width="100%"><BarChart data={data.categorySales}><XAxis dataKey="category" /><YAxis /><Tooltip /><Bar dataKey="revenue" fill="#be7c4d" /></BarChart></ResponsiveContainer></section>
          <section className="chart-panel"><h2>Monthly Sales</h2><ResponsiveContainer height={260} width="100%"><LineChart data={data.monthly}><XAxis dataKey="label" /><YAxis /><Tooltip /><Line dataKey="revenue" stroke="#6366f1" strokeWidth={3} /></LineChart></ResponsiveContainer></section>
        </div>
      )}
    </section>
  );
};

export default SalesAnalytics;
