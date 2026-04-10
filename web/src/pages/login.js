// Login page connected to backend /api/auth/login endpoint.
import { useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '../lib/api';
import { saveAuth } from '../lib/auth';

function routeForRole(role) {
  if (role === 'beneficiary') return '/dashboard/beneficiary';
  return '/dashboard/home';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function submitLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok || !data?.token) {
        setError(data?.message || 'Login failed');
        return;
      }

      saveAuth({ token: data.token, user: data.user || null });
      setInfo('Login successful. Redirecting...');
      window.location.href = routeForRole(data.user?.role);
    } catch (_error) {
      setError('Unable to connect to backend');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="card" style={{ maxWidth: 560, marginInline: 'auto' }}>
        <h1>Login</h1>
        <p className="muted">Access your solidarity account and continue your impact journey.</p>

        <form onSubmit={submitLogin}>
          <label className="label" htmlFor="login-email">Email</label>
          <input id="login-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label className="label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="actions-row" style={{ justifyContent: 'space-between', marginTop: -6, marginBottom: 10 }}>
            <span className="muted">Secure login</span>
            <button type="button" className="button button-soft" onClick={() => setInfo('Password reset link flow can be connected to /api/auth/forgot-password.')}>Forgot password?</button>
          </div>

          {error ? <p style={{ color: '#991b1b', fontWeight: 600 }}>{error}</p> : null}
          {info ? <p style={{ color: '#166534', fontWeight: 600 }}>{info}</p> : null}

          <div className="actions-row">
            <button className="button" type="submit" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
            <Link className="button button-soft" href="/register">Create account</Link>
          </div>
        </form>

        <div className="card compact" style={{ marginTop: 12 }}>
          <strong>Comptes seed utiles</strong>
          <p className="muted">admin@amena.tn / secret123</p>
          <p className="muted">donor1@amena.tn / secret123</p>
        </div>
      </section>
    </main>
  );
}
