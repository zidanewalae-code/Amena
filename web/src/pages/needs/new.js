// Need creation page posts a new need for organization or beneficiary roles.
import { useState } from 'react';
import { apiUrl } from '../../lib/api';

export default function NewNeedPage() {
  const [token, setToken] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'food',
    urgency_level: 'medium',
    amount_target: '100'
  });
  const [result, setResult] = useState(null);

  async function submitForm(e) {
    e.preventDefault();

    const response = await fetch(apiUrl('/api/needs'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...form,
        amount_target: Number(form.amount_target)
      })
    });

    const data = await response.json();
    setResult(data);
  }

  return (
    <main className="page">
      <h1>Creer un besoin</h1>
      <form className="card" onSubmit={submitForm}>
        <label className="label">JWT Token</label>
        <textarea className="textarea" rows={3} value={token} onChange={(e) => setToken(e.target.value)} required />

        <label className="label">Titre</label>
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />

        <label className="label">Description</label>
        <textarea className="textarea" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />

        <label className="label">Categorie</label>
        <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="food">food</option>
          <option value="medical">medical</option>
          <option value="education">education</option>
          <option value="housing">housing</option>
          <option value="emergency">emergency</option>
          <option value="other">other</option>
        </select>

        <label className="label">Urgence</label>
        <select className="select" value={form.urgency_level} onChange={(e) => setForm({ ...form, urgency_level: e.target.value })}>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>

        <label className="label">Montant cible</label>
        <input className="input" type="number" min="1" value={form.amount_target} onChange={(e) => setForm({ ...form, amount_target: e.target.value })} required />

        <button className="button" type="submit">Publier</button>
      </form>

      {result && (
        <div className="card">
          <h3>Reponse API</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
