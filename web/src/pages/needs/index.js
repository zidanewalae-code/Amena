// Needs page lists available needs and links to details and creation form.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import NeedCard from '../../components/NeedCard';
import { apiUrl } from '../../lib/api';

export default function NeedsListPage() {
  const [needs, setNeeds] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({ urgency_level: '', category: '', location: '' });

  async function loadNeeds() {
    const query = new URLSearchParams({ page: String(page), limit: String(limit), sort_by: 'priority' });
    if (filters.urgency_level) query.set('urgency_level', filters.urgency_level);
    if (filters.category) query.set('category', filters.category);
    if (filters.location) query.set('location', filters.location);

    const response = await fetch(apiUrl(`/api/needs?${query.toString()}`));
    const data = await response.json();
    setNeeds(Array.isArray(data.items) ? data.items : []);
  }

  useEffect(() => {
    loadNeeds().catch(() => {});
  }, [page, limit, filters]);

  return (
    <main className="page">
      <h1>Liste des besoins</h1>
      <div className="nav">
        <Link href="/needs/new">Creer un besoin</Link>
      </div>
      <div className="card compact">
        <div className="actions-row">
          <select className="select" style={{ maxWidth: 180 }} value={filters.urgency_level} onChange={(e) => setFilters((v) => ({ ...v, urgency_level: e.target.value }))}>
            <option value="">urgency: all</option>
            <option value="critical">critical</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
          <select className="select" style={{ maxWidth: 180 }} value={filters.category} onChange={(e) => setFilters((v) => ({ ...v, category: e.target.value }))}>
            <option value="">category: all</option>
            <option value="food">food</option>
            <option value="medical">medical</option>
            <option value="education">education</option>
            <option value="housing">housing</option>
            <option value="emergency">emergency</option>
          </select>
          <input className="input" style={{ maxWidth: 220 }} placeholder="location/city" value={filters.location} onChange={(e) => setFilters((v) => ({ ...v, location: e.target.value }))} />
        </div>
      </div>
      {needs.map((need) => (
        <Link key={need.id} href={`/needs/${need.id}`}>
          <NeedCard need={need} />
        </Link>
      ))}
      {!needs.length && <p className="muted">Aucun besoin disponible.</p>}

      <div className="card compact">
        <div className="actions-row">
          <button className="button button-soft" onClick={() => setPage((v) => Math.max(1, v - 1))}>Prev</button>
          <span>Page {page}</span>
          <button className="button button-soft" onClick={() => setPage((v) => v + 1)}>Next</button>
          <select className="select" style={{ maxWidth: 120 }} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>
    </main>
  );
}
