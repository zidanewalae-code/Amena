// Simple accessible toast notification.
import { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`} role="status" aria-live="polite" aria-atomic="true">
      <span>{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Close notification">x</button>
    </div>
  );
}
