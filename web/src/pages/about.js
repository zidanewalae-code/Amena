import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="page">
      <section className="card hero">
        <p className="kicker">Smart Solidarity Marketplace</p>
        <h1>About the platform</h1>
        <p className="muted">
          We combine a marketplace for clothes and shoes, donation workflows, and transparent impact tracking so every purchase helps people in need.
        </p>
        <div className="actions-row">
          <Link className="button" href="/marketplace">Explore Marketplace</Link>
          <Link className="button button-soft" href="/register">Join the mission</Link>
        </div>
      </section>

      <section className="grid-2">
        <article className="card">
          <h3>Trust</h3>
          <p className="muted">Verified associations, fraud checks, and reporting tools protect all actors.</p>
        </article>
        <article className="card">
          <h3>Transparency</h3>
          <p className="muted">Orders include end-to-end timeline from purchase to beneficiary delivery.</p>
        </article>
      </section>
    </main>
  );
}
