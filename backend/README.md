# Amena Backend - Sprint 7 (Fiabilite et Resilience)

Backend Node.js / Express / Sequelize pour le workflow complet de dons: panier, checkout, paiement live/mock, webhooks securises, historique filtre, admin dashboard, KPI et alertes.

## Modules Sprint 6
- DonationCart + DonationCartItem
- DonationOrder + Donation
- PaymentTransaction (1 transaction par order)
- PaymentWebhookEvent + Notification
- Endpoints /api/donations, /api/payments, /api/admin

## Structure principale
- controllers/
  - donationCartController.js
  - donationOrderController.js
  - donationController.js
  - paymentController.js
- routes/
  - donationRoutes.js
  - paymentRoutes.js
- models/
  - DonationCart.js
  - DonationCartItem.js
  - DonationOrder.js
  - Donation.js
  - PaymentTransaction.js

## Prerequis
- MariaDB en execution
- Variables .env configurees

## Installation
1. Installer dependances
   npm install
2. Copier env
   Copy-Item .env.example .env
3. Demarrer API
   npm start
4. Charger donnees de test
   npm run seed

## Endpoints donation
### Cart
- GET /api/donations/cart
- POST /api/donations/cart/items
- PATCH /api/donations/cart/items/:itemId
- DELETE /api/donations/cart/items/:itemId

### Orders
- POST /api/donations/checkout (provider_name + currency TND/USD/EUR)
- GET /api/donations/orders/history (filtres status/payment_status/date/montant/provider/currency)
- GET /api/donations/orders/:id

### Donations
- GET /api/donations/by-user
- GET /api/donations/by-need/:needId
- GET /api/donations/test

## Platform aliases (Socio-Solidarity)
- POST /api/auth/logout
- GET /api/orders?page=1&limit=10&status=pending|paid|failed
- POST /api/orders
- GET /api/donations?page=1&limit=10&status=pending|paid|failed&from=YYYY-MM-DD&to=YYYY-MM-DD
- POST /api/donations
- GET /api/deliveries?status=assigned|in_progress|delivered
- PATCH /api/deliveries/:id/status
- GET /api/contributions?type=all|money|product&page=1&limit=10
- POST /api/contributions

## Endpoints paiement
- POST /api/payments/mock-intent
- POST /api/payments/mock-confirm
- POST /api/payments/callback
- GET /api/payments/:id
- POST /api/payments/webhook/mock
- POST /api/payments/webhook/stripe

## Endpoints admin paiement
- GET /api/admin/transactions
- GET /api/admin/payments
- GET /api/admin/transactions/export?format=csv|excel
- GET /api/admin/metrics
- PATCH /api/admin/orders/:orderId/cancel
- PATCH /api/admin/transactions/:transactionId/incident

## Endpoints monitoring
- GET /api/monitoring/webhooks
- GET /api/monitoring/heartbeat

Retourne les orders `pending` sans webhook recu dans le delai `WEBHOOK_ALERT_THRESHOLD_MIN`.
Quand au moins un order depasse le seuil:
- log structure `monitoring.webhooks.alert`
- notification in-app admins
- email alerte (vers `MONITORING_ALERT_EMAILS` ou fallback emails admins)

`/api/monitoring/heartbeat` ajoute un check provider (mock/stripe/paypal) avec timestamp `checked_at`.
Le champ `issue_type` permet de distinguer:
- `healthy`
- `webhook_absent_or_delayed`
- `provider_unavailable`

Si provider down, le backend declenche automatiquement alertes logs/in-app/email.
Le monitoring declenche aussi un retry automatique des paiements pending via provider status API (`retry_results`).

## Resilience Sprint 7
- Heartbeat provider reel Stripe/PayPal
- Retry automatique sur webhook manquant/echec API provider
- Rollback partiel supporte: callback avec `failed_need_ids` -> `partially_paid`
- Audit trail immutable: `payment_audit_logs` (hash chain + trace_id)
- Logs structures enrichis (provider/status/trace_id)
- KPI enrichis: amount_by_currency, provider_health, realtime_series_60m

Variables utiles:
- `WEBHOOK_ALERT_THRESHOLD_MIN`
- `MONITORED_PAYMENT_PROVIDERS` (ex: `mock,stripe`)
- `MONITORING_ALERT_EMAILS`
- `APP_ENV`
- `WEBHOOK_RETRY_MAX_ATTEMPTS`
- `SLACK_WEBHOOK_URL`
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_MODE`

## Exemples Postman / Insomnia
### 1) Ajouter au panier
POST /api/donations/cart/items
Headers:
- Authorization: Bearer <JWT_DONOR>
- Content-Type: application/json
Body:
{
  "need_id": 1,
  "amount": 75
}

### 2) Checkout
POST /api/donations/checkout
Headers:
- Authorization: Bearer <JWT_DONOR>
Body:
{
  "provider_name": "mock",
  "currency": "USD"
}

### 3) Creer paiement mock
POST /api/payments/mock-intent
Headers:
- Authorization: Bearer <JWT_DONOR>
- Content-Type: application/json
Body:
{
  "order_id": 1,
  "provider_name": "mock_stripe"
}

### 4) Confirmer paiement mock
POST /api/payments/mock-confirm
Headers:
- Authorization: Bearer <JWT_DONOR>
- Content-Type: application/json
Body:
{
  "transaction_id": 1,
  "success": true
}

### 5) Exemple callback provider (Stripe/local mock)
POST /api/payments/callback
Headers:
- Content-Type: application/json
Body:
{
  "order_id": 1,
  "transaction_id": "pi_mock_12345",
  "provider_name": "mock",
  "status": "paid"
}

### 6) Lister transactions admin (filtres)
GET /api/admin/transactions?status=failed&provider=stripe&page=1&limit=20
Headers:
- Authorization: Bearer <JWT_ADMIN>

### 7) Annuler order pending
PATCH /api/admin/orders/3/cancel
Headers:
- Authorization: Bearer <JWT_ADMIN>

### 8) Marquer incident paiement
PATCH /api/admin/transactions/5/incident
Headers:
- Authorization: Bearer <JWT_ADMIN>
- Content-Type: application/json
Body:
{
  "incident_note": "Webhook non recu"
}

### 9) KPIs monitoring
GET /api/admin/metrics
Headers:
- Authorization: Bearer <JWT_ADMIN>

### 10) Monitoring webhooks
GET /api/monitoring/webhooks
Headers:
- Authorization: Bearer <JWT_ADMIN>

### 11) Monitoring heartbeat providers
GET /api/monitoring/heartbeat
Headers:
- Authorization: Bearer <JWT_ADMIN>

### 12) Callback partiel (rollback partiel)
POST /api/payments/callback
Headers:
- x-webhook-secret: <PAYMENT_WEBHOOK_SECRET>
- Content-Type: application/json
Body:
{
  "order_id": 1,
  "transaction_id": "pi_partial_001",
  "provider_name": "stripe",
  "status": "paid",
  "failed_need_ids": [3],
  "event_id": "evt_partial_001"
}

Resultat attendu: order `partially_paid`, une partie des donations `confirmed`, autres `failed`.

## E2E orchestration Sprint 6.1b
Depuis `web/`:
1. npm install
2. npx playwright install
3. npm run test:e2e:orchestrated

Le script orchestre:
- reset seed backend
- lancement backend local
- lancement web local
- execution Playwright desktop + mobile viewport
- resume final succes/erreurs

## Sprint 9 - Scalabilite et tests

### Optimisations backend
- Checkout: creation des lignes donations en batch (`bulkCreate`) au lieu d'insert unitaire.
- Historique orders: pagination en 2 phases (IDs puis chargement details) pour reduire la charge SQL sur les includes.
- Callback paiement: suppression du N+1 sur `Need` via prechargement des besoins par lot.
- Indexes ajoutes:
  - `donation_orders`: `(donor_user_id,status,created_at)`, `(currency,created_at)`, `(total_amount,created_at)`, `last_webhook_at`
  - `payment_transactions`: `(provider_name,status,created_at)`, `(incident_flag,created_at)`, `(currency,created_at)`, `transaction_id`, `last_webhook_at`
  - `payment_webhook_events`: `(provider_name,processed_at)`, `(processed_at)`
  - `donations`: `(order_id,status)`

### Tests de charge
Script charge Sprint 9 (checkout + webhook + dashboard):

```powershell
npm run test:load
```

Variables optionnelles:
- `LOAD_API_BASE_URL` (defaut `http://localhost:5000`)
- `LOAD_ITERATIONS` (defaut `20`)
- `LOAD_CONCURRENCY` (defaut `5`)
- `LOAD_PAYMENT_WEBHOOK_SECRET` (defaut `change_me`)
- `LOAD_PROVIDERS` (defaut `mock`, liste CSV)

Note: sous SQLite local, des erreurs `SQLITE_BUSY` peuvent apparaitre en forte concurrence ecriture webhook; en CI/production MariaDB, ce comportement est nettement reduit.

## Comptes seed
- donor1@amena.tn / secret123
- donor2@amena.tn / secret123
- donor3@amena.tn / secret123

## Notes
- Tous les endpoints sensibles utilisent auth JWT et validation express-validator.
- Le role donor est requis pour ajouter au panier et lancer checkout (admin accepte en override).
- /api/donations/test retourne un resume cart/order/donation utile pour debug.
- Le role admin est requis pour /api/admin/*.
- `npm test` execute les suites unit/integration incluant les scenarios Sprint 6.
