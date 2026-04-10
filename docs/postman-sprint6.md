# Postman Sprint 7 - Collection Guide

## Base URLs
- Backend local: http://localhost:5000
- Web local: http://localhost:3000

## Variables conseilles
- baseUrl = http://localhost:5000
- donorToken = <JWT donor>
- adminToken = <JWT admin>
- orderId = 1
- transactionId = 1

## Dossier Donations
1. GET {{baseUrl}}/api/donations/orders/history?page=1&limit=10&status=paid&payment_status=paid&currency=USD
- Headers: Authorization: Bearer {{donorToken}}

2. POST {{baseUrl}}/api/donations/checkout
- Headers: Authorization: Bearer {{donorToken}}, Content-Type: application/json
- Body:
{
  "provider_name": "mock",
  "currency": "EUR"
}

## Dossier Payments
3. POST {{baseUrl}}/api/payments/webhook/mock
- Headers: x-provider-signature: <hmac_sha256>, Content-Type: application/json
- Body:
{
  "event_id": "evt_manual_001",
  "order_id": {{orderId}},
  "transaction_id": "mock_tx_manual_001",
  "provider_name": "mock",
  "status": "paid"
}

4. POST {{baseUrl}}/api/payments/callback
- Headers: x-webhook-secret: <PAYMENT_WEBHOOK_SECRET>, Content-Type: application/json
- Body:
{
  "order_id": {{orderId}},
  "transaction_id": "pi_live_001",
  "provider_name": "stripe",
  "status": "failed",
  "event_id": "evt_live_failed_001"
}

## Dossier Admin
5. GET {{baseUrl}}/api/admin/transactions?status=failed&provider=stripe&page=1&limit=20
- Headers: Authorization: Bearer {{adminToken}}

6. PATCH {{baseUrl}}/api/admin/orders/{{orderId}}/cancel
- Headers: Authorization: Bearer {{adminToken}}

7. PATCH {{baseUrl}}/api/admin/transactions/{{transactionId}}/incident
- Headers: Authorization: Bearer {{adminToken}}, Content-Type: application/json
- Body:
{
  "incident_note": "Pending > 10 minutes"
}

8. GET {{baseUrl}}/api/admin/metrics
- Headers: Authorization: Bearer {{adminToken}}

9. GET {{baseUrl}}/api/admin/transactions/export?format=csv
- Headers: Authorization: Bearer {{adminToken}}

## Dossier Monitoring
10. GET {{baseUrl}}/api/monitoring/webhooks
- Headers: Authorization: Bearer {{adminToken}}

11. GET {{baseUrl}}/api/monitoring/heartbeat
- Headers: Authorization: Bearer {{adminToken}}

12. POST {{baseUrl}}/api/payments/callback (partial rollback example)
- Headers: x-webhook-secret: <PAYMENT_WEBHOOK_SECRET>, Content-Type: application/json
- Body:
{
  "order_id": {{orderId}},
  "transaction_id": "pi_partial_001",
  "provider_name": "stripe",
  "status": "paid",
  "failed_need_ids": [2],
  "event_id": "evt_partial_001"
}

Response fields cles:
- environment
- checked_at
- threshold_minutes
- issue_type
- delayed_orders_count
- delayed_orders[].last_webhook_at
- providers[].provider
- providers[].available
- providers[].reason
- retry_results[]

Issue_type attendu:
- healthy
- webhook_absent_or_delayed
- provider_unavailable

## Checks Postman recommandes
- History filters: verifier pagination.total_pages et items[]
- Admin cancel: verifier order_status=canceled et payment_status=canceled
- Incident: verifier incident_flag=true
- Metrics: verifier totals.failure_rate_percent et alerts.pending_without_webhook_over_10m
- Export: verifier presence entetes CSV
- Heartbeat: verifier issue_type et providers[]
- Retry: verifier retry_results[] (retried/reason/status)
- Partial rollback: verifier order partially_paid et lignes donation mix confirmed/failed

## E2E Orchestrated
Depuis le dossier web:
1. npm install
2. npx playwright install
3. npm run test:e2e:orchestrated

Le script affiche un resume final avec:
- seed/backend/web/playwright status
- tests passed/failed
- erreurs detectees
