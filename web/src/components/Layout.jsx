import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getVisibleSidebarLinks } from '../lib/access';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ title, subtitle, sidebar, children }) {
  const { user, isAuthed, logout } = useAuth();
  const { publicLinks, dashboardLinks } = getVisibleSidebarLinks(user);
  const quickActions = sidebar || (
    dashboardLinks.length ? (
      <>
        {dashboardLinks.slice(0, 2).map((item) => (
          <Link key={item.to} className="ghost-button" to={item.to}>
            {item.label}
          </Link>
        ))}
      </>
    ) : null
  );

  return (
    <div className="app-shell">
      <Sidebar
        publicLinks={publicLinks}
        dashboardLinks={dashboardLinks}
        user={user}
        isAuthed={isAuthed}
        onLogout={logout}
      />

      <main className="main-panel">
        <Navbar title={title} subtitle={subtitle} user={user} actions={quickActions} onLogout={logout} />

        {children}
      </main>
    </div>
  );
}