import React from 'react';

export default function AlertCard({ alert, onEdit, onDelete, canEdit }) {
  return (
    <article className="list-card">
      <div>
        <strong>{alert.title || 'Untitled alert'}</strong>
        <p>{alert.description || 'No description'}</p>
        <span className="meta-line">
          Priority: {alert.priority || '-'} | Organization: {alert.organization_id}
        </span>
      </div>
      {canEdit ? (
        <div className="row-actions">
          <button className="link-button" type="button" onClick={() => onEdit(alert)}>
            Edit
          </button>
          <button className="link-button danger" type="button" onClick={() => onDelete(alert.alert_id)}>
            Delete
          </button>
        </div>
      ) : null}
    </article>
  );
}