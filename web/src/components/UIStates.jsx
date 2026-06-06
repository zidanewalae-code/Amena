import React from 'react';

export function EmptyState({ title = 'No data found', description, action }) {
  return (
    <div className="ui-state ui-state-empty" role="status">
      <div className="ui-state-icon">•</div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="ui-state-actions">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading…', compact = false }) {
  return (
    <div className={`ui-state ui-state-loading ${compact ? 'compact' : ''}`} role="status" aria-live="polite">
      <span className="ui-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, action }) {
  return (
    <div className="ui-state ui-state-error" role="alert">
      <div className="ui-state-icon">!</div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="ui-state-actions">{action}</div> : null}
    </div>
  );
}

export function SuccessState({ title = 'Completed', description, action }) {
  return (
    <div className="ui-state ui-state-success" role="status">
      <div className="ui-state-icon">✓</div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="ui-state-actions">{action}</div> : null}
    </div>
  );
}