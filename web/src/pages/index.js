import Link from 'next/link';

const featured = [
  { id: 1, title: 'Winter jacket bundle', condition: 'good', impact: 'Urgent Need', price: 'Free', image: 'Warm jacket pack' },
  { id: 2, title: 'Kids sneakers set', condition: 'like new', impact: 'Donation', price: '35 TND', image: 'Sneakers for school' },
  { id: 3, title: 'School uniform pack', condition: 'new', impact: 'Donation', price: '48 TND', image: 'Uniform essentials' }
];

const testimonials = [
  {
    id: 1,
    name: 'Maha, Buyer',
    quote: 'I bought shoes and tracked the full impact to a local family. Transparent and simple.'
  },
  {
    id: 2,
    name: 'Rami, Donor',
    quote: 'My unused clothes now support people nearby. The process is fast and clear.'
  },
  {
    id: 3,
    name: 'Nour Association',
    quote: 'We receive verified deliveries with proof, then confirm distribution in one workflow.'
  }
];

export default function LandingPage() {
  return (
    <main className="page">
      <section className="hero card">
        <p className="kicker">Smart Solidarity Marketplace</p>
        <h1>Give Clothes, Change Lives</h1>
        <p className="muted">Turn your unused items into real impact.</p>
        <div className="actions-row">
          <Link className="button" href="/marketplace">Explore Marketplace</Link>
          <Link className="button button-soft" href="/register">Start Donating</Link>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-chip">Verified Associations</div>
          <div className="hero-chip">Live Impact Tracking</div>
          <div className="hero-chip">Trusted Donations</div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="card compact"><p className="muted">🧥 Total items donated</p><h2>18,420</h2></article>
        <article className="card compact"><p className="muted">💰 Total money raised</p><h2>420,500 TND</h2></article>
        <article className="card compact"><p className="muted">❤️ People helped</p><h2>9,780</h2></article>
        <article className="card compact"><p className="muted">✅ Verified associations</p><h2>126</h2></article>
      </section>

      <section className="card">
        <h2>How it works</h2>
        <div className="steps-grid">
          <div className="step-card"><p className="kicker">1. Donate</p><p>List clothes or shoes in minutes with transparent impact destination.</p></div>
          <div className="step-card"><p className="kicker">2. Shop</p><p>Buy useful items while funding verified solidarity actions.</p></div>
          <div className="step-card"><p className="kicker">3. Impact</p><p>Track delivery to association and beneficiary confirmation.</p></div>
        </div>
      </section>

      <section className="card">
        <h2>Featured items</h2>
        <div className="grid-2 featured-grid">
          {featured.map((item) => (
            <article key={item.id} className="card compact item-card">
              <div className="item-thumb" aria-hidden="true">{item.image}</div>
              <h3>{item.title}</h3>
              <p className="muted">Condition: {item.condition}</p>
              <p><strong>{item.price}</strong></p>
              <div className="actions-row">
                <span className="badge badge-pending">{item.impact}</span>
                <Link className="button button-soft" href="/marketplace">View Details</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Testimonials</h2>
        <div className="grid-2">
          {testimonials.map((entry) => (
            <article className="card compact" key={entry.id}>
              <p className="muted">“{entry.quote}”</p>
              <p><strong>{entry.name}</strong></p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
