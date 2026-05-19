const transitions = {
  pending: new Set(['paid', 'failed', 'refunded']),
  paid: new Set(['refunded']),
  failed: new Set([]),
  refunded: new Set([])
};

function canTransition(fromState, toState) {
  return Boolean(transitions[fromState]?.has(toState));
}

module.exports = {
  canTransition
};