# Integration Web/Mobile - Sprint 6.1

## API base URLs
- Web: NEXT_PUBLIC_API_BASE_URL (default http://localhost:5000)
- Mobile: EXPO_PUBLIC_API_BASE_URL (default http://localhost:5000)

## Web integration
- cart.js:
  - GET /api/donations/cart
  - POST /api/donations/cart/items
  - POST /api/donations/checkout
- checkout.js:
  - POST /api/donations/checkout
  - GET /api/donations/orders/:id
  - POST /api/payments/callback (simulation secure callback)
- history.js:
  - GET /api/donations/orders/history with filters and pagination
- admin/payments.js:
  - GET /api/admin/payments
  - PATCH /api/admin/orders/:orderId/cancel
  - PATCH /api/admin/transactions/:transactionId/incident
  - GET /api/admin/metrics
  - GET /api/admin/transactions/export
  - GET /api/monitoring/webhooks

## Mobile integration
- CheckoutScreen.js:
  - POST /api/donations/cart/items
  - POST /api/donations/checkout
  - GET /api/donations/orders/:id
- DonationHistoryScreen.js:
  - GET /api/donations/by-user
- NeedsListScreen.js:
  - GET /api/needs

## Runtime setup
1. Backend running with .env configured (PAYMENT_WEBHOOK_SECRET, JWT_SECRET)
2. Seed data loaded: npm run seed or npm run seed:reset
3. Web: npm start (and export NEXT_PUBLIC_API_BASE_URL if not localhost)
4. Mobile: expo start (and export EXPO_PUBLIC_API_BASE_URL for device)

## Monitoring setup
- WEBHOOK_ALERT_THRESHOLD_MIN controls delay threshold
- APP_ENV tags alert payloads (development/staging/production)
- MONITORING_ALERT_EMAILS optional comma-separated recipients

## Notes
- Payment idempotence remains handled by payment_webhook_events
- last_webhook_at is stored on payment_transactions and donation_orders
- For real provider flow, Stripe webhooks still use /api/payments/webhook/stripe
