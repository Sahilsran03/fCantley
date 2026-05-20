import React, { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AdminNav from "../components/AdminNav.jsx";
import AnalyticsFilter from "../components/AnalyticsFilter.jsx";
import api from "../services/api.js";

const RewardAnalytics = () => {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/analytics/rewards", { params: { range } }).then((response) => setData(response.data));
  }, [range]);

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div><p className="eyebrow">Analytics</p><h1>Reward Analytics</h1></div>
        <AnalyticsFilter range={range} onRangeChange={setRange} />
      </div>
      {!data ? <div className="analytics-skeleton">Loading rewards...</div> : (
        <>
          <div className="metric-grid">
            {["reviewRewards", "storyRewards", "reelRewards", "wearEarnRewards"].map((key) => (
              <article className="metric-card" key={key}>
                <span>{key.replace("Rewards", "").replace(/([A-Z])/g, " $1")}</span>
                <strong>Rs. {Number(data[key]?.totalAmount || 0).toLocaleString("en-IN")}</strong>
              </article>
            ))}
          </div>
          <section className="chart-panel">
            <h2>Reward Distribution</h2>
            <ResponsiveContainer height={300} width="100%">
              <BarChart data={data.rewards}><XAxis dataKey="_id" /><YAxis /><Tooltip /><Bar dataKey="totalAmount" fill="#357266" /><Bar dataKey="count" fill="#0f172a" /></BarChart>
            </ResponsiveContainer>
          </section>
        </>
      )}
    </section>
  );
};

export default RewardAnalytics;
