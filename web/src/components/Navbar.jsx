import React from 'react';
import { Link } from 'react-router-dom';

function getInitials(name) {
  return String(name || 'User')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function Navbar({ title, subtitle, user, actions, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{title}</h1>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      </div>

      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Notifications">
          <span className="icon-badge" aria-hidden="true" />
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 20zm7-5H5l1.2-1.5V9.7A5.8 5.8 0 0 1 12 4a5.8 5.8 0 0 1 5.8 5.7v3.8z" />
          </svg>
        </button>

        {actions ? <div className="topbar-quick-actions">{actions}</div> : null}

        {user ? (
          <details className="user-menu">
            <summary className="user-menu-trigger">
              <span className="user-avatar" aria-hidden="true">{getInitials(user.name)}</span>
              <span className="user-menu-meta">
                <strong>{user.name || 'User'}</strong>
                <span>{user.role}</span>
              </span>
            </summary>

            <div className="user-menu-panel">
              <Link to="/profile">Profile</Link>
              <Link to="/dashboard">Dashboard</Link>
              {onLogout ? (
                <button type="button" className="user-menu-signout" onClick={onLogout}>
                  Sign out
                </button>
              ) : null}
            </div>
          </details>
        ) : null}
      </div>
    </header>
  );
}