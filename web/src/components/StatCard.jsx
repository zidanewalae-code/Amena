import React from 'react';

export default function StatCard({ label, value, hint, icon, trend, tone = 'default' }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-topline">
        {icon ? <span className="stat-icon">{icon}</span> : null}
        {trend ? <span className="trend-pill">{trend}</span> : null}
      </div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint ? <p>{hint}</p> : null}
    </article>
  );
}