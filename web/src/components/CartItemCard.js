// CartItemCard renders one donation cart line with editable amount and remove action.
export default function CartItemCard({ item, onChangeAmount, onRemove }) {
  return (
    <div className="card">
      <h3>{item.need?.title || `Need #${item.need_id}`}</h3>
      <p className="muted">Categorie: {item.need?.category || '-'}</p>
      <label className="label">Montant (TND)</label>
      <input
        className="input"
        type="number"
        min="1"
        defaultValue={item.amount}
        onBlur={(e) => onChangeAmount(item.id, Number(e.target.value || 0))}
      />
      <button className="button" onClick={() => onRemove(item.id)}>Supprimer</button>
    </div>
  );
}
