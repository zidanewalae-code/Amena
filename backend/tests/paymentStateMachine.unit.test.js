// Unit tests for payment state transitions.
const { canTransition } = require('../services/payments/paymentStateMachine');

describe('payment state machine', () => {
  test('allows pending to paid/failed/refunded', () => {
    expect(canTransition('pending', 'paid')).toBe(true);
    expect(canTransition('pending', 'failed')).toBe(true);
    expect(canTransition('pending', 'refunded')).toBe(true);
  });

  test('allows paid to refunded only', () => {
    expect(canTransition('paid', 'refunded')).toBe(true);
    expect(canTransition('paid', 'failed')).toBe(false);
  });

  test('blocks invalid transitions', () => {
    expect(canTransition('failed', 'paid')).toBe(false);
    expect(canTransition('refunded', 'paid')).toBe(false);
  });
});
