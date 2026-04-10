// Need detail page shows one need and its updates.
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function NeedDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [need, setNeed] = useState(null);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:5000/api/needs/${id}`)
      .then((r) => r.json())
      .then((data) => setNeed(data))
      .catch(() => {});
  }, [id]);

  if (!need) {
    return (
      <main className="page">
        <p>Chargement...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>{need.title}</h1>
      <p className="muted">Status: {need.status}</p>
      <p>{need.description}</p>
      <p>Progression: {need.progress_percent || 0}%</p>
      <p>Montant restant: {need.amount_remaining || 0} TND</p>

      <div className="card">
        <h3>Updates</h3>
        {(need.updates || []).map((item) => (
          <div key={item.id} style={{ marginBottom: 12 }}>
            <strong>{item.update_text}</strong>
            <div className="muted">{item.created_at}</div>
          </div>
        ))}
        {!need.updates?.length && <p className="muted">Aucune update.</p>}
      </div>
    </main>
  );
}
