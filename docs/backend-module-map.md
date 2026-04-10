# Amena NestJS Module Map

## Auth and Identity
Endpoints:
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/verify-email
- POST /auth/forgot-password
- POST /auth/reset-password

Entities touched:
- users
- audit_logs

## Organizations and Verification
Endpoints:
- POST /organizations
- POST /organizations/:id/documents
- POST /organizations/:id/review
- GET /organizations/:id

Entities touched:
- organizations
- organization_verifications
- trust_scores
- audit_logs

## Needs Lifecycle
Endpoints:
- POST /needs
- PATCH /needs/:id
- POST /needs/:id/publish
- POST /needs/:id/close
- POST /needs/:id/updates
- GET /needs
- GET /needs/:id

Entities touched:
- needs
- need_updates
- beneficiaries
- organizations
- ratings

## Donation and Checkout
Endpoints:
- POST /cart/items
- PATCH /cart/items/:id
- DELETE /cart/items/:id
- POST /checkout
- GET /donations/me

Entities touched:
- donation_carts
- donation_cart_items
- checkout_orders
- checkout_order_items
- donations

## Payments
Endpoints:
- POST /payments/intent
- POST /payments/webhooks/:provider
- GET /payments/:id

Entities touched:
- payment_transactions
- checkout_orders
- donations
- audit_logs

Rules:
- enforce idempotency_key uniqueness
- only webhook updates payment final statuses

## Delivery and Courier
Endpoints:
- POST /missions
- POST /missions/:id/assign
- POST /missions/:id/events
- POST /missions/:id/proof
- GET /missions/:id/track

Entities touched:
- delivery_missions
- delivery_events
- delivery_proofs
- courier_profiles
- courier_ratings

## Notifications
Endpoints:
- GET /notifications
- POST /notifications/test
- PATCH /notifications/:id/read

Entities touched:
- notifications

## Trust and Rating
Endpoints:
- POST /ratings
- GET /trust/:targetType/:targetId

Entities touched:
- ratings
- trust_scores
- courier_ratings

Background jobs:
- recompute trust_scores on new rating, mission completion, verification outcome

## Admin and Moderation
Endpoints:
- GET /admin/review-queue
- POST /admin/disputes/:id/resolve
- GET /admin/audit-logs

Entities touched:
- audit_logs
- organizations
- needs
- delivery_missions
- payment_transactions
