// Simple messages center placeholder with role-aware information.
import { useMemo } from 'react';
import { getStoredAuth } from '../lib/auth';

export default function MessagesPage() {
  const auth = getStoredAuth();
  const role = auth?.user?.role || 'guest';

  const tips = useMemo(() => {
    if (role === 'donor') return ['Track donation updates', 'Receive assignment confirmations'];
    if (role === 'organization') return ['Discuss case verification', 'Send delivery coordination notes'];
    if (role === 'beneficiary') return ['Get request status updates', 'Confirm help reception'];
    if (role === 'company') return ['Track CSR campaign updates', 'Receive impact summaries'];
    if (role === 'admin') return ['Moderation alerts', 'Fraud/monitoring alerts'];
    return ['Sign in to access role-based messages.'];
  }, [role]);

  return (
    <main className="page">
      <h1>Messages</h1>
      <div className="card">
        <p className="muted">Current role: {role}</p>
        {tips.map((tip) => (
          <p key={tip}>{tip}</p>
        ))}
      </div>
    </main>
  );
}
