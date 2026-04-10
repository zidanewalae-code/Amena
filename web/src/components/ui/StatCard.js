// Small KPI card used by all role dashboards.
export default function StatCard({ label, value, hint }) {
  return (
    <div className="card compact rounded-xl border border-slate-200 bg-white/90">
      <p className="muted m-0 text-sm uppercase tracking-wide">{label}</p>
      <p className="m-0 my-2 text-3xl font-extrabold text-slate-900">{value}</p>
      {hint ? <p className="muted m-0 text-sm">{hint}</p> : null}
    </div>
  );
}
