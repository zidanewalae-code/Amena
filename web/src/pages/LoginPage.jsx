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
  const [showPassword, setShowPassword] = useState(false);

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
    <Layout title="Login" subtitle="Access the AMENA workspace with your account.">
      <section className="public-auth-layout">
        <article className="public-auth-aside card">
          <span className="section-badge">Secure access</span>
          <h2>Bienvenue sur la plateforme.</h2>
          <p>
            Accédez à votre espace opérationnel pour suivre les dons, les alertes, les commandes et les activités
            sensibles de votre rôle.
          </p>

          <div className="auth-highlight-list">
            <div>
              <strong>Navigation claire</strong>
              <p>Une interface pensée pour retrouver l’essentiel rapidement.</p>
            </div>
            <div>
              <strong>Contraste élevé</strong>
              <p>Les actions importantes ressortent immédiatement.</p>
            </div>
            <div>
              <strong>Expérience premium</strong>
              <p>Un parcours visuel cohérent dès la première seconde.</p>
            </div>
          </div>
        </article>

        <section className="card auth-card public-auth-card">
          <div className="card-header">
            <div>
              <span className="section-badge">Connexion</span>
              <h2>Se connecter</h2>
              <p>Accédez à votre tableau de bord et reprenez le travail là où vous vous êtes arrêté.</p>
            </div>
          </div>

          <form className="form-grid auth-form" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" />
            </label>

            <label className="password-field">
              <span>Mot de passe</span>
              <div className="password-control">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
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

            {error ? <p className="inline-message error">{error}</p> : null}

            <button className="primary-button" type="submit">
              Login
            </button>
          </form>

          <p className="card-note">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </section>
      </section>
    </Layout>
  );
}