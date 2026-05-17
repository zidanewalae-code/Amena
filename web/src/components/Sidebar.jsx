import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Sidebar({ publicLinks, dashboardLinks, user, isAuthed, onLogout }) {
  return (
    <aside className="sidebar">
      <div>
        <Link to="/" className="brand">
          AMENA
        </Link>
        <p className="brand-text">Simple humanitarian donation platform</p>
      </div>

      <nav className="nav-group">
        <span className="nav-label">Public</span>
        {publicLinks.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <nav className="nav-group">
        <span className="nav-label">Dashboards</span>
        {dashboardLinks.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {isAuthed ? (
          <>
            <div className="user-chip">
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
            </div>
            <button className="ghost-button" onClick={onLogout} type="button">
              Logout
            </button>
          </>
        ) : (
          <div className="sidebar-footer-links">
            <Link className="ghost-button" to="/login">
              Login
            </Link>
            <Link className="primary-button" to="/register">
              Register
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}