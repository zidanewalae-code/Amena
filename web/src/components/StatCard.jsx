import React from 'react';

export default function StatCard({ label, value, hint, icon, trend, tone = 'default' }) {
  // Support both legacy string trend and structured { direction, label }
  let trendObj = null;

  if (trend) {
    if (typeof trend === 'string') {
      const direction = String(trend).trim().startsWith('-') ? 'down' : 'up';
      trendObj = { direction, label: trend };
    } else if (typeof trend === 'object') {
      trendObj = trend;
    }
  }

  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-topline">
        {icon ? <span className="stat-icon">{icon}</span> : null}
        {trendObj ? (
          <span className={`trend-pill ${trendObj.direction === 'up' ? 'tone-up' : 'tone-down'}`}>
            {trendObj.direction === 'up' ? '↑' : '↓'} {trendObj.label}
          </span>
        ) : null}
      </div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{displayValue}</strong>
      {hint ? <p>{hint}</p> : null}
    </article>
  );
}