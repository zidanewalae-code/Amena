// Funded needs page displays needs impacted by the authenticated donor.
import { useState } from 'react';

export default function FundedNeedsPage() {
  const [token, setToken] = useState('');
  const [rows, setRows] = useState([]);

  async function loadRows() {
    const response = await fetch('http://localhost:5000/api/donations/funded-needs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setRows(Array.isArray(data) ? data : []);
  }

  return (
    <main className="page">
      <h1>Suivi des besoins finances</h1>
      <div className="card">
        <label className="label">JWT Token</label>
        <textarea className="textarea" rows={3} value={token} onChange={(e) => setToken(e.target.value)} />
        <button className="button" onClick={loadRows}>Charger suivi</button>
      </div>
      {rows.map((row) => (
        <div key={row.need_id} className="card">
          <h3>{row.title}</h3>
          <p className="muted">Status: {row.status}</p>
          <p>Donne par moi: {row.donated_by_me} TND</p>
          <p>Total collecte: {row.amount_collected}/{row.amount_target} TND</p>
        </div>
      ))}
      {!rows.length && <p className="muted">Aucun besoin finance affiche.</p>}
    </main>
  );
}
