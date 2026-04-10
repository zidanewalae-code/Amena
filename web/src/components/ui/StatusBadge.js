// Reusable status badge with consistent color mapping across dashboards.
export default function StatusBadge({ status }) {
  const normalized = String(status || 'pending').toLowerCase();
  const map = {
    pending: 'pending',
    paid: 'paid',
    success: 'success',
    validated: 'success',
    preparing: 'pending',
    assigned: 'pending',
    delivered: 'paid',
    available: 'success',
    completed: 'success',
    failed: 'failed',
    canceled: 'canceled',
    cancelled: 'canceled',
    refunded: 'refunded',
    picked_up: 'pending',
    in_progress: 'pending'
  };

  const token = map[normalized] || 'pending';
  return <span className={`badge badge-${token} inline-flex items-center`}>{normalized}</span>;
}
