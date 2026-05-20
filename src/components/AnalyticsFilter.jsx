import React from "react";

const AnalyticsFilter = ({ range, onRangeChange, onExport }) => (
  <div className="analytics-filter">
    <select value={range} onChange={(event) => onRangeChange(event.target.value)}>
      <option value="today">Today</option>
      <option value="7d">7 days</option>
      <option value="30d">30 days</option>
      <option value="12m">12 months</option>
      <option value="all">All time</option>
    </select>
    {onExport ? <button className="secondary-button" type="button" onClick={onExport}>Export CSV</button> : null}
  </div>
);

export default AnalyticsFilter;
