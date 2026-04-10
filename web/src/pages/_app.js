// Global app wrapper for all Next.js pages.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { clearAuth, getStoredAuth } from '../lib/auth';
import '../styles.css';

function linksForRole(role) {
  if (role === 'admin') {
    return [
      { href: '/dashboard/home', label: 'Home' },
      { href: '/dashboard/admin', label: 'Admin' },
      { href: '/admin/fraud-alerts', label: 'Fraud Alerts' },
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/orders', label: 'Orders' }
    ];
  }
  if (role === 'courier') {
    return [
      { href: '/dashboard/home', label: 'Home' },
      { href: '/dashboard/delivery', label: 'Missions' },
      { href: '/orders', label: 'Orders' },
      { href: '/marketplace', label: 'Marketplace' }
    ];
  }
  if (role === 'company') {
    return [
      { href: '/dashboard/home', label: 'Home' },
      { href: '/dashboard/company', label: 'Company' },
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/orders', label: 'Orders' }
    ];
  }
  if (role === 'organization') {
    return [
      { href: '/dashboard/home', label: 'Home' },
      { href: '/dashboard/association', label: 'Association' },
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/orders', label: 'Orders' }
    ];
  }
  return [
    { href: '/dashboard/home', label: 'Home' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/my-items', label: 'My Items' },
    { href: '/orders', label: 'Orders' },
    { href: '/messages', label: 'Messages' },
    { href: '/profile', label: 'Profile' }
  ];
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [authUser, setAuthUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setAuthUser(getStoredAuth()?.user || null);
  }, [router.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [router.pathname]);

  const isAuthenticated = Boolean(authUser);
  const publicNavPaths = ['/', '/about', '/login', '/register'];
  const isLandingNav = publicNavPaths.includes(router.pathname) && !isAuthenticated;
  const isBeneficiaryDashboard = router.pathname === '/dashboard/beneficiary';
  const displayName = authUser?.full_name || 'Beneficiary';
  const roleLinks = linksForRole(authUser?.role);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  function logout() {
    clearAuth();
    setAuthUser(null);
    window.location.href = '/';
  }

  return (
    <div className="app-shell">
      <div className="bg-orb bg-orb-a" aria-hidden="true" />
      <div className="bg-orb bg-orb-b" aria-hidden="true" />
      <header className="topbar">
        <Link href="/" className="brand">Amena</Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          Menu
        </button>
        {isLandingNav ? (
          <nav className={`topnav ${mobileOpen ? 'topnav-open' : ''}`} aria-label="Public navigation">
            <Link href="/">Home</Link>
            <Link href="/marketplace">Marketplace</Link>
            <Link href="/about">About</Link>
            <Link href="/login">Login</Link>
            <Link href="/register">Sign Up</Link>
          </nav>
        ) : isBeneficiaryDashboard ? (
          <>
            <nav className={`topnav ${mobileOpen ? 'topnav-open' : ''}`} aria-label="Beneficiary navigation">
              <Link href="/">Home</Link>
              <Link href="/dashboard/beneficiary">My Requests</Link>
              <Link href="/messages">Messages</Link>
              <Link href="/profile">Profile</Link>
            </nav>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {initials || 'BE'}
              </div>
              <span className="text-sm font-semibold text-slate-700">{displayName}</span>
            </div>
          </>
        ) : (
          <>
            <nav className={`topnav ${mobileOpen ? 'topnav-open' : ''}`} aria-label="Main navigation">
              {roleLinks.map((entry) => (
                <Link key={entry.href} href={entry.href}>{entry.label}</Link>
              ))}
              {!isAuthenticated ? <Link href="/login">Login</Link> : null}
              {!isAuthenticated ? <Link href="/register">Sign up</Link> : null}
              {isAuthenticated ? <button className="button button-soft" onClick={logout}>Logout</button> : null}
            </nav>
            {isAuthenticated ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {initials || 'US'}
                </div>
                <span className="text-sm font-semibold text-slate-700">{authUser?.full_name || 'User'}</span>
              </div>
            ) : null}
          </>
        )}
      </header>
      <Component {...pageProps} />
    </div>
  );
}
