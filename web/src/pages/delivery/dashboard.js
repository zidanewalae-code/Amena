// Delivery dashboard page lists delivery missions and allows quick status updates.
import { useState } from 'react';

export default function DeliveryDashboardPage() {
  const [token, setToken] = useState('');
  const [missions, setMissions] = useState([]);
  const [missionId, setMissionId] = useState('');
  const [status, setStatus] = useState('in_progress');

  async function loadMissions() {
    const response = await fetch('http://localhost:5000/api/delivery/missions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setMissions(Array.isArray(data) ? data : []);
  }

  async function updateStatus() {
    if (!missionId) return;
    await fetch(`http://localhost:5000/api/delivery/missions/${missionId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status, event_note: 'Updated from web dashboard' })
    });
    await loadMissions();
  }

  return (
    <main className="page">
      <h1>Dashboard missions de livraison</h1>
      <div className="card">
        <label className="label">JWT Token</label>
        <textarea className="textarea" rows={3} value={token} onChange={(e) => setToken(e.target.value)} />
        <button className="button" onClick={loadMissions}>Charger missions</button>
      </div>

      <div className="card">
        <label className="label">Mission ID</label>
        <input className="input" value={missionId} onChange={(e) => setMissionId(e.target.value)} />
        <label className="label">Nouveau status</label>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="to_assign">to_assign</option>
          <option value="assigned">assigned</option>
          <option value="in_progress">in_progress</option>
          <option value="delivered">delivered</option>
          <option value="failed">failed</option>
          <option value="disputed">disputed</option>
          <option value="canceled">canceled</option>
        </select>
        <button className="button" onClick={updateStatus}>Mettre a jour status</button>
      </div>

      {missions.map((m) => (
        <div key={m.id} className="card">
          <h3>Mission #{m.id}</h3>
          <p className="muted">Status: {m.status}</p>
          <p>Need: {m.need?.title || '-'}</p>
          <p>Courier: {m.courier?.full_name || 'non assigne'}</p>
        </div>
      ))}
      {!missions.length && <p className="muted">Aucune mission a afficher.</p>}
    </main>
  );
}
