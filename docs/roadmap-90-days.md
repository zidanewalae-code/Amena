# Amena 90-Day MVP Roadmap

## Sprint 0 (Week 1-2): Foundations
Goals:
- Repo setup (monorepo optional), CI/CD, environments
- Database migration baseline from SQL schema
- Auth + RBAC skeleton
- Observability baseline

Deliverables:
- NestJS app with module scaffolds
- Next.js shell with role-based routing
- Mobile starter project
- Infrastructure as code for staging

Exit criteria:
- Health checks, auth flow, and role guards running in staging

## Sprint 1 (Week 3-4): Needs + Verification Core
Goals:
- Organization onboarding and document submission
- Admin review workflow
- Need creation/review/publish lifecycle

Deliverables:
- Organization verification APIs and UI
- Needs APIs with filtering by status/category/urgency
- Audit logs for moderation actions

Exit criteria:
- Verified organization can publish a need end-to-end

## Sprint 2 (Week 5-6): Donation Checkout + Payments
Goals:
- Cart and checkout flow
- Payment provider integration (Stripe first)
- Webhook reliability and reconciliation

Deliverables:
- Donation cart UI and APIs
- Payment transaction lifecycle handling
- Idempotency and retry-safe webhook processing

Exit criteria:
- Donor can complete payment and see confirmed donation status

## Sprint 3 (Week 7-8): Delivery Tracking + Proof
Goals:
- Mission creation and assignment
- Courier tracking events
- Delivery proof with photo/GPS/OTP validation

Deliverables:
- Courier mobile flow for mission handling
- Timeline tracking endpoint and UI
- Mission dispute path

Exit criteria:
- Completed mission with proof visible to donor/admin

## Sprint 4 (Week 9-10): Trust, Notifications, and Hardening
Goals:
- Ratings and trust score computation
- Notification channels (in-app + email first)
- Security and performance hardening

Deliverables:
- Ratings APIs and anti-abuse checks
- Trust score background jobs
- p95 performance pass and alerting dashboards

Exit criteria:
- Trust score updates visible and notifications delivered reliably

## Sprint 5 (Week 11-12): Pilot Launch
Goals:
- UAT with pilot organizations and couriers
- Incident playbooks and support operations
- Final compliance and backup drills

Deliverables:
- Launch checklist complete
- Monitoring, on-call, rollback procedures
- KPI dashboard for donation conversion and fulfillment

Exit criteria:
- MVP go-live with pilot cohort and measurable SLA tracking

## KPIs to Track from Day 1
- Donation conversion rate
- Need funding completion time
- Mission completion rate
- Average proof verification time
- Refund/dispute rate
- Monthly active donors and repeat donor rate
