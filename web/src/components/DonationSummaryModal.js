// Accessible modal showing checkout donation summary.
export default function DonationSummaryModal({ open, title, summary, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-summary-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="donation-summary-title">{title}</h2>
        <div className="modal-content">
          {summary ? <pre className="modal-pre">{JSON.stringify(summary, null, 2)}</pre> : <p>No data.</p>}
        </div>
        <div className="actions-row">
          <button className="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
