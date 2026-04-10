// Append-only payment audit trail with chained hashes for immutability checks.
const crypto = require('crypto');
const { PaymentAuditLog } = require('../../models');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function appendAuditEvent({
  paymentTransactionId,
  donationOrderId,
  eventType,
  providerName,
  statusBefore,
  statusAfter,
  traceId,
  payload,
  dbTx
}) {
  const payloadString = JSON.stringify(payload || {});
  const payloadHash = sha256(payloadString);

  const last = await PaymentAuditLog.findOne({
    where: { payment_transaction_id: paymentTransactionId },
    order: [['id', 'DESC']],
    transaction: dbTx
  });

  const previousHash = last?.chain_hash || null;
  const chainSeed = `${previousHash || ''}|${payloadHash}|${traceId}|${eventType}|${statusAfter || ''}|${new Date().toISOString()}`;
  const chainHash = sha256(chainSeed);

  return PaymentAuditLog.create(
    {
      payment_transaction_id: paymentTransactionId,
      donation_order_id: donationOrderId,
      event_type: eventType,
      provider_name: providerName || null,
      status_before: statusBefore || null,
      status_after: statusAfter || null,
      trace_id: traceId,
      previous_hash: previousHash,
      payload_hash: payloadHash,
      chain_hash: chainHash,
      payload: payload || null
    },
    { transaction: dbTx }
  );
}

module.exports = {
  appendAuditEvent
};
