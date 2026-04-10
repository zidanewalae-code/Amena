// Reusable card component to render one need item in lists.
export default function NeedCard({ need }) {
  return (
    <div className="card">
      <h3>{need.title}</h3>
      <p className="muted">{need.category} | Urgence: {need.urgency_level}</p>
      <p>{need.description}</p>
      <p>
        Collecte: {Number(need.amount_collected || 0).toFixed(2)} / {Number(need.amount_target || 0).toFixed(2)} TND
      </p>
      <p className="muted">Status: {need.status}</p>
    </div>
  );
}
