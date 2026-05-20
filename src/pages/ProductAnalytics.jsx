import React, { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AdminNav from "../components/AdminNav.jsx";
import AnalyticsFilter from "../components/AnalyticsFilter.jsx";
import api from "../services/api.js";
import { exportCsv } from "../utils/csv.js";

const ProductAnalytics = () => {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/analytics/products", { params: { range } }).then((response) => setData(response.data));
  }, [range]);

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div><p className="eyebrow">Analytics</p><h1>Product Analytics</h1></div>
        <AnalyticsFilter range={range} onRangeChange={setRange} onExport={() => exportCsv("cantley-products.csv", data?.topSellingProducts || [])} />
      </div>
      {!data ? <div className="analytics-skeleton">Loading products...</div> : (
        <div className="dashboard-grid">
          <section className="chart-panel wide-chart"><h2>Top Selling Products</h2><ResponsiveContainer height={300} width="100%"><BarChart data={data.topSellingProducts}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="quantity" fill="#357266" /></BarChart></ResponsiveContainer></section>
          <section className="chart-panel"><h2>Low Stock</h2>{data.lowStockProducts.map((product) => <p key={product._id}>{product.name}</p>)}</section>
          <section className="chart-panel"><h2>Most Viewed</h2>{data.mostViewedProducts.map((product) => <p key={product._id}>{product.name} - {product.views} views</p>)}</section>
          <section className="chart-panel"><h2>Highest Rated</h2>{data.highestRatedProducts.map((product) => <p key={product._id}>{product.name} - {Number(product.ratingAverage).toFixed(1)} stars</p>)}</section>
        </div>
      )}
    </section>
  );
};

export default ProductAnalytics;
