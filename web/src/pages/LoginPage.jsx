import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { getDashboardPath } from '../lib/access';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', form);
      login(response.data);
      navigate(getDashboardPath(response.data.user.role));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed');
    }
  }

  return (
    <Layout title="Login" subtitle="Access the AMENA dashboard with your account.">
      <section className="card auth-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" value={form.password} onChange={handleChange} />
          </label>

          {error ? <p className="inline-message error">{error}</p> : null}

          <button className="primary-button" type="submit">
            Login
          </button>
        </form>

        <p className="card-note">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </Layout>
  );
}