import React from 'react';
import { useAuth } from '../lib/auth';
import { getVisibleSidebarLinks } from '../lib/access';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ title, subtitle, sidebar, children }) {
  const { user, isAuthed, logout } = useAuth();
  const { publicLinks, dashboardLinks } = getVisibleSidebarLinks(user);

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
        <Navbar title={title} subtitle={subtitle} user={user} actions={sidebar} />

        {children}
      </main>
    </div>
  );
}