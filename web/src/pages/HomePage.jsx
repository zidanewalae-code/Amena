import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const metrics = [
  { value: '24/7', label: 'Operational visibility' },
  { value: '100%', label: 'Role-aware access' },
  { value: '6', label: 'Core modules' },
  { value: '1', label: 'Unified workspace' }
];

const features = [
  {
    title: 'Gestion des dons',
    description: 'Suivez les contributions et les dons avec une lecture claire et immédiate.'
  },
  {
    title: 'Gestion des produits',
    description: 'Organisez le catalogue et les stocks dans une interface prête pour l’opérationnel.'
  },
  {
    title: 'Gestion des alertes',
    description: 'Mettez en avant les priorités et les signaux critiques sans surcharge visuelle.'
  },
  {
    title: 'Tableaux de bord',
    description: 'Accédez à une vue synthétique et adaptée à chaque rôle de l’organisation.'
  }
];

const values = [
  { title: 'Rapidité', description: 'Accès direct aux actions et aux informations les plus utiles.' },
  { title: 'Traçabilité', description: 'Chaque flux garde une structure lisible et exploitable.' },
  { title: 'Collaboration', description: 'Les rôles travaillent dans un même espace cohérent.' },
  { title: 'Transparence', description: 'Les indicateurs et les états restent visibles en permanence.' }
];

export default function HomePage() {
  return (
    <Layout
      title="Amena"
      subtitle="A premium operational workspace for humanitarian coordination."
    >
      <section className="hero home-hero card">
        <div className="hero-copy">
          <p className="eyebrow">Humanitarian SaaS</p>
          <h2>Coordonnez les dons et les opérations humanitaires depuis une plateforme unique.</h2>
          <p>
            AMENA centralise les dons, les produits, les alertes et les tableaux de bord dans une expérience claire,
            professionnelle et prête pour des équipes réelles.
          </p>

          <div className="button-row">
            <Link className="primary-button" to="/register">
              Commencer
            </Link>
            <Link className="ghost-button" to="/dashboard">
              Accéder au tableau de bord
            </Link>
            <Link className="link-button" to="/products">
              Découvrir la plateforme
            </Link>
          </div>
        </div>

        <div className="hero-panel home-hero-panel">
          {metrics.map((metric) => (
            <article key={metric.label} className="stat-card home-metric-card">
              <span className="stat-label">{metric.label}</span>
              <strong className="stat-value">{metric.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="grid-4 home-feature-grid">
        {features.map((feature) => (
          <article key={feature.title} className="card compact-card home-feature-card">
            <span className="section-badge">Feature</span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="card home-value-section">
        <div className="card-header">
          <div>
            <span className="section-badge">Value</span>
            <h2>Pourquoi l’équipe gagne en clarté</h2>
            <p>Une interface plus lisible, plus rapide et plus cohérente pour toute l’organisation.</p>
          </div>
        </div>

        <div className="grid-4 home-value-grid">
          {values.map((value) => (
            <article key={value.title} className="subtle-card home-value-card">
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="home-footer card">
        <div>
          <Link to="/" className="brand">
            AMENA
          </Link>
          <p>Plateforme humanitaire de coordination, conçue comme un SaaS moderne et professionnel.</p>
        </div>

        <nav className="home-footer-nav">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/products">Products</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>

        <p className="home-copyright">© {new Date().getFullYear()} AMENA. Tous droits réservés.</p>
      </footer>
    </Layout>
  );
}