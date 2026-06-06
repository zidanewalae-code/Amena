import React from 'react';
import { Link, NavLink } from 'react-router-dom';

function Icon({ name }) {
  const paths = {
    home: 'M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z',
    dashboard: 'M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5zm8 0A1.5 1.5 0 0 1 13.5 4h4A1.5 1.5 0 0 1 19 5.5v4A1.5 1.5 0 0 1 17.5 11h-4A1.5 1.5 0 0 1 12 9.5zm-8 8A1.5 1.5 0 0 1 5.5 12h4A1.5 1.5 0 0 1 11 13.5v4A1.5 1.5 0 0 1 9.5 19h-4A1.5 1.5 0 0 1 4 17.5zm8 0A1.5 1.5 0 0 1 13.5 12h4A1.5 1.5 0 0 1 19 13.5v4A1.5 1.5 0 0 1 17.5 19h-4A1.5 1.5 0 0 1 12 17.5z',
    products: 'M5 5.5A1.5 1.5 0 0 1 6.5 4h11A1.5 1.5 0 0 1 19 5.5v5A1.5 1.5 0 0 1 17.5 12h-11A1.5 1.5 0 0 1 5 10.5zm0 8A1.5 1.5 0 0 1 6.5 12h11A1.5 1.5 0 0 1 19 13.5v5A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5z',
    donations: 'M12 21s-7-4.6-9.2-8.4C1 8.8 3.5 5 7.5 5c2.1 0 3.5 1.2 4.5 2.6C13 6.2 14.4 5 16.5 5c4 0 6.5 3.8 4.7 7.6C19 16.4 12 21 12 21z',
    orders: 'M6 4h12l-1 14H7L6 4zm2 3 1 8h6l1-8H8z',
    alerts: 'M11.1 3.9a1 1 0 0 1 1.8 0l7 14A1 1 0 0 1 19 19H5a1 1 0 0 1-.9-1.4zM12 9v4m0 3h.01',
    notifications: 'M12 20a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 20zm7-5H5l1.2-1.5V9.7A5.8 5.8 0 0 1 12 4a5.8 5.8 0 0 1 5.8 5.7v3.8z',
    profile: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0'
  };

  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] || paths.dashboard} />
    </svg>
  );
}

function NavItem({ to, label, icon, end = false }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <span className="nav-link-left">
        <Icon name={icon} />
        <span>{label}</span>
      </span>
      <span className="nav-link-arrow">→</span>
    </NavLink>
  );
}

function NavSection({ title, items }) {
  if (!items.length) {
    return null;
  }

  return (
    <nav className="nav-group">
      <span className="nav-label">{title}</span>
      <div className="nav-stack">
        {items.map((item) => (
          <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} end={item.end} />
        ))}
      </div>
    </nav>
  );
}

function groupDashboardLinks(dashboardLinks) {
  const buckets = {
    operations: [],
    communication: [],
    account: []
  };

  dashboardLinks.forEach((item) => {
    const label = String(item.label || '').toLowerCase();

    if (label.includes('product') || label.includes('donation') || label.includes('order')) {
      buckets.operations.push(item);
      return;
    }

    if (label.includes('alert') || label.includes('notification')) {
      buckets.communication.push(item);
      return;
    }

    buckets.account.push(item);
  });

  return buckets;
}

export default function Sidebar({ publicLinks, dashboardLinks, user, isAuthed, onLogout }) {
  const grouped = groupDashboardLinks(dashboardLinks);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link to="/" className="brand">
          AMENA
        </Link>
        <p className="brand-text">Humanitarian operations dashboard</p>
      </div>

      <NavSection
        title="Dashboard"
        items={publicLinks.map((item) => ({ ...item, icon: item.to === '/' ? 'home' : 'dashboard', end: item.to === '/' }))}
      />

      <NavSection
        title="OPERATIONS"
        items={grouped.operations.map((item) => ({ ...item, icon: item.label.toLowerCase().includes('don') ? 'donations' : item.label.toLowerCase().includes('order') ? 'orders' : 'products' }))}
      />

      <NavSection
        title="COMMUNICATION"
        items={grouped.communication.map((item) => ({ ...item, icon: item.label.toLowerCase().includes('alert') ? 'alerts' : 'notifications' }))}
      />

      <NavSection
        title="COMPTE"
        items={grouped.account.length ? grouped.account.map((item) => ({ ...item, icon: 'profile' })) : [{ to: '/profile', label: 'Profil', icon: 'profile' }]}
      />

      <nav className="nav-group">
        <span className="nav-label">Shopping</span>
        <div className="nav-stack">
          <NavItem to="/cart" label="Cart" icon="products" />
        </div>
      </nav>

      <div className="sidebar-footer">
        {isAuthed ? (
          <>
            <div className="user-chip">
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
            </div>
            <button className="ghost-button" onClick={onLogout} type="button">
              Sign out
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