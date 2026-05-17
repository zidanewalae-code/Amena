import React from 'react';

export default function Navbar({ title, subtitle, user, actions }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">AMENA</p>
        <h1>{title}</h1>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      </div>
      <div className="topbar-actions">
        {actions}
        {user ? <span className="status-pill">{user.role}</span> : null}
      </div>
    </header>
  );
}