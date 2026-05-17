import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const features = [
  'Authentication and role-based dashboards',
  'Product, donation, order, and payment display',
  'Notifications, alerts, and history tracking',
  'Simple React UI with clean responsive layout'
];

export default function HomePage() {
  return (
    <Layout
      title="Humanitarian donation made simple"
      subtitle="AMENA helps donors, organizations, and delivery teams work from one lightweight platform."
    >
      <section className="hero card">
        <div className="hero-copy">
          <p className="eyebrow">Simple React frontend</p>
          <h2>Beginner-friendly interface for the simplified AMENA backend.</h2>
          <p>This frontend stays close to the CRUD API. No advanced workflow, no microfrontends, and no complex state management.</p>
          <div className="button-row">
            <Link className="primary-button" to="/register">
              Get started
            </Link>
            <Link className="ghost-button" to="/login">
              Login
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          {features.map((feature) => (
            <div key={feature} className="feature-pill">
              {feature}
            </div>
          ))}
        </div>
      </section>

      <section className="grid-3">
        <article className="card compact-card">
          <h3>Products</h3>
          <p>Manage stocked goods and categories with a simple table form.</p>
        </article>
        <article className="card compact-card">
          <h3>Alerts</h3>
          <p>Create and review organization alerts without extra workflow layers.</p>
        </article>
        <article className="card compact-card">
          <h3>Dashboards</h3>
          <p>Role-specific pages show dons, orders, payments, notifications, and history.</p>
        </article>
      </section>
    </Layout>
  );
}