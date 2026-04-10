// Payment state machine validates allowed transaction status transitions.
const transitions = {
  pending: ['partially_paid', 'paid', 'failed', 'refunded', 'canceled'],
  partially_paid: ['paid', 'failed', 'refunded'],
  paid: ['refunded'],
  failed: [],
  refunded: [],
  canceled: []
};

function canTransition(fromState, toState) {
  if (!fromState) return toState === 'pending';
  if (fromState === toState) return true;
  return (transitions[fromState] || []).includes(toState);
}

module.exports = {
  canTransition
};
