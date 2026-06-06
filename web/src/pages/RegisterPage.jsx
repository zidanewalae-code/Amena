import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { getDashboardPath } from '../lib/access';

const registrationRoles = [
  { value: 'donator', label: 'Donator' },
  { value: 'organization', label: 'Organization' },
  { value: 'delivery_person', label: 'Delivery Person' }
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'donator' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/register', form);
      login(response.data);
      navigate(getDashboardPath(response.data.user.role));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <Layout title="Register" subtitle="Create your AMENA account and choose your role.">
      <section className="public-auth-layout">
        <article className="public-auth-aside card">
          <span className="section-badge">Create account</span>
          <h2>Rejoignez une expérience plus fluide.</h2>
          <p>
            Créez votre profil en quelques instants et activez un espace de travail adapté à votre mission au sein de
            la plateforme.
          </p>

          <div className="auth-highlight-list auth-progress-list">
            <div>
              <strong>1. Profil</strong>
              <p>Vos informations de base.</p>
            </div>
            <div>
              <strong>2. Accès</strong>
              <p>Vos identifiants de connexion.</p>
            </div>
            <div>
              <strong>3. Rôle</strong>
              <p>Votre périmètre d’action dans la plateforme.</p>
            </div>
          </div>
        </article>

        <section className="card auth-card public-auth-card">
          <div className="card-header">
            <div>
              <span className="section-badge">Inscription</span>
              <h2>Créer un compte</h2>
              <p>Un formulaire plus structuré pour rejoindre l’espace AMENA avec le bon rôle dès le départ.</p>
            </div>
          </div>

          <form className="form-grid auth-form" onSubmit={handleSubmit}>
            <label>
              <span>Name</span>
              <input name="name" value={form.name} onChange={handleChange} autoComplete="name" />
            </label>

            <label>
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" />
            </label>

            <label className="password-field">
              <span>Password</span>
              <div className="password-control">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <label>
              <span>Phone</span>
              <input name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" />
            </label>

            <label>
              <span>Role</span>
              <select name="role" value={form.role} onChange={handleChange}>
                {registrationRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>

            {error ? <p className="inline-message error">{error}</p> : null}

            <button className="primary-button" type="submit">
              Register
            </button>
          </form>

          <p className="card-note">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </section>
      </section>
    </Layout>
  );
}