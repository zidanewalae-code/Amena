// Register page for new users with role selection.
import { useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '../lib/api';
import { saveAuth } from '../lib/auth';

function routeForRole(role) {
  if (role === 'beneficiary') return '/dashboard/beneficiary';
  return '/dashboard/home';
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'donor',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Full name, email, and password are required.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      if (!response.ok || !data?.token) {
        setError(data?.message || 'Register failed');
        return;
      }

      saveAuth({ token: data.token, user: data.user || null });
      setSuccess('Account created. Redirecting...');
      window.location.href = routeForRole(data.user?.role);
    } catch (_error) {
      setError('Unable to connect to backend');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="card" style={{ maxWidth: 620, marginInline: 'auto' }}>
        <h1>Register</h1>
        <p className="muted">Create your profile and start donating, shopping, or coordinating impact missions.</p>
        <form onSubmit={submitRegister}>
          <label className="label">Full name</label>
          <input className="input" value={form.full_name} onChange={(e) => setForm((v) => ({ ...v, full_name: e.target.value }))} required />

          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} required />

          <label className="label">Password</label>
          <input type="password" className="input" value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} required />

          <label className="label">Role</label>
          <select className="select" value={form.role} onChange={(e) => setForm((v) => ({ ...v, role: e.target.value }))}>
            <option value="donor">Donor</option>
            <option value="organization">Association (NGO)</option>
            <option value="beneficiary">Beneficiary</option>
            <option value="courier">Delivery Agent</option>
            <option value="company">Company</option>
            <option value="admin">Admin</option>
          </select>

          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} />

          {error ? <p style={{ color: '#991b1b', fontWeight: 700 }}>{error}</p> : null}
          {success ? <p style={{ color: '#166534', fontWeight: 700 }}>{success}</p> : null}
          <button className="button" type="submit" disabled={loading}>{loading ? 'Creation...' : 'Create account'}</button>
          <Link className="button button-soft" href="/login">I already have an account</Link>
        </form>
      </section>
    </main>
  );
}
