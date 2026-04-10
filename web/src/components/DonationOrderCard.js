// DonationOrderCard displays one donation order summary and linked payment status.
import { formatMoney } from '../lib/currency';

export default function DonationOrderCard({ order }) {
  const paymentStatus = order.transaction?.status || 'pending';

  return (
    <div className="card">
      <h3>{order.order_reference}</h3>
      <p className="muted">Status commande: <span className={`badge badge-${order.status}`}>{order.status}</span></p>
      <p>Total: {formatMoney(order.total_amount, order.currency)}</p>
      <p>Paiement: <span className={`badge badge-${paymentStatus}`}>{paymentStatus}</span></p>
      <p>Dons inclus: {(order.donations || []).length}</p>
    </div>
  );
}
