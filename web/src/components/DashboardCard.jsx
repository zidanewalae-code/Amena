import React from 'react';

export default function DashboardCard({ title, description, action, badge, children, footer }) {
  return (
    <article className="card dashboard-card">
      <div className="card-header">
        <div>
          {badge ? <span className="section-badge">{badge}</span> : null}
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
      {footer ? <div className="card-footer">{footer}</div> : null}
    </article>
  );
}