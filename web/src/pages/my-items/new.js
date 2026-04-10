import { useMemo, useState } from 'react';
import { apiUrl } from '../../lib/api';
import { getStoredAuth } from '../../lib/auth';

function suggestCategory(fileName, title) {
  const text = `${fileName || ''} ${title || ''}`.toLowerCase();
  if (text.includes('shoe') || text.includes('sneaker') || text.includes('boot')) return 'shoes';
  if (text.includes('belt') || text.includes('bag') || text.includes('hat')) return 'accessories';
  return 'clothes';
}

function suggestPrice(condition) {
  if (condition === 'new') return 80;
  if (condition === 'like_new') return 55;
  if (condition === 'good') return 30;
  return 15;
}

export default function AddItemPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    size: '',
    condition: 'good',
    category: 'clothes',
    image_url: '',
    price: '20',
    urgent_need: false,
    is_donation: true,
    association_name: ''
  });
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const aiSuggestion = useMemo(() => ({
    category: suggestCategory(fileName, form.title),
    price: suggestPrice(form.condition)
  }), [fileName, form.title, form.condition]);

  async function submitItem(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    const auth = getStoredAuth();
    if (!auth?.token) {
      setError('Please login first.');
      return;
    }

    const response = await fetch(apiUrl('/api/marketplace/items'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({
        ...form,
        category: form.category || aiSuggestion.category,
        price: Number(form.price || aiSuggestion.price),
        is_free: Number(form.price || 0) === 0
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data?.message || 'Failed to add item');
      return;
    }

    setMessage('Item added successfully.');
    setForm({ title: '', description: '', size: '', condition: 'good', category: aiSuggestion.category, image_url: '', price: String(aiSuggestion.price), urgent_need: false, is_donation: true, association_name: '' });
    setFileName('');
  }

  return (
    <main className="page">
      <section className="card">
        <h1>Add Item</h1>
        <p className="muted">AI suggestion: category {aiSuggestion.category}, price {aiSuggestion.price} TND.</p>

        <form onSubmit={submitItem}>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} required />

          <label className="label">Description</label>
          <textarea className="textarea" rows={4} value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} required />

          <div className="grid-2">
            <div>
              <label className="label">Size</label>
              <input className="input" value={form.size} onChange={(e) => setForm((v) => ({ ...v, size: e.target.value }))} />
            </div>
            <div>
              <label className="label">Condition</label>
              <select className="select" value={form.condition} onChange={(e) => setForm((v) => ({ ...v, condition: e.target.value }))}>
                <option value="new">new</option>
                <option value="like_new">like_new</option>
                <option value="good">good</option>
                <option value="fair">fair</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label className="label">Category</label>
              <select className="select" value={form.category} onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))}>
                <option value="clothes">clothes</option>
                <option value="shoes">shoes</option>
                <option value="accessories">accessories</option>
                <option value="other">other</option>
              </select>
            </div>
            <div>
              <label className="label">Suggested price (TND)</label>
              <input className="input" type="number" min={0} value={form.price} onChange={(e) => setForm((v) => ({ ...v, price: e.target.value }))} />
            </div>
          </div>

          <label className="label">Image</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
          <input className="input" placeholder="Optional image URL" value={form.image_url} onChange={(e) => setForm((v) => ({ ...v, image_url: e.target.value }))} />

          <div className="grid-2">
            <label className="label"><input type="checkbox" checked={form.is_donation} onChange={(e) => setForm((v) => ({ ...v, is_donation: e.target.checked }))} /> Donation item</label>
            <label className="label"><input type="checkbox" checked={form.urgent_need} onChange={(e) => setForm((v) => ({ ...v, urgent_need: e.target.checked }))} /> Urgent need label</label>
          </div>

          <label className="label">Association name (transparency)</label>
          <input className="input" value={form.association_name} onChange={(e) => setForm((v) => ({ ...v, association_name: e.target.value }))} />

          <button className="button" type="submit">Publish item</button>
          {message ? <p style={{ color: '#166534', fontWeight: 700 }}>{message}</p> : null}
          {error ? <p style={{ color: '#991b1b', fontWeight: 700 }}>{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
