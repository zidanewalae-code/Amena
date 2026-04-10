# Amena MVP Architecture (Web + Mobile + Backend)

## 1) Product Scope
Amena is a trust-first solidarity platform connecting:
- Donors (including diaspora)
- Beneficiaries
- Verified organizations
- Companies (CSR)
- Couriers
- Admins

Core objective: transparent, traceable, and efficient aid flow end-to-end.

## 2) High-Level System
Clients:
- Web app: Next.js (public pages + donor/admin dashboards)
- Mobile app: React Native (courier + beneficiary + donor lightweight flows)

Backend:
- NestJS modular monolith (initially), API-first
- REST + WebSocket gateway for real-time mission and payment status events

Data:
- MariaDB/MySQL for transactional data
- Redis for cache, rate-limits, OTP/session temporary state, job coordination
- Object storage (S3 compatible) for proof photos and verification docs

Async:
- Queue workers (BullMQ) for notifications, payment webhook retries, trust-score recomputation

Observability:
- OpenTelemetry traces
- Structured logs (pino)
- Metrics (Prometheus + Grafana)

Security:
- JWT access + refresh tokens
- Role-based access control (RBAC)
- Data encryption in transit (TLS) and at rest where provider supports it
- PII minimization and hashing for sensitive national identifiers

## 3) Backend Module Boundaries (NestJS)
- AuthModule: register/login/refresh/password reset, email verification
- UsersModule: profiles, role-specific profile enrichments
- OrganizationsModule: onboarding, verification documents, KYC decisions
- NeedsModule: create/review/publish/close, updates/proofs
- DonationsModule: cart, checkout, donation lifecycle
- PaymentsModule: provider abstraction, webhooks, reconciliation
- DeliveryModule: mission assignment, event stream, proof upload, OTP validation
- NotificationsModule: in-app, email, sms, push orchestration
- TrustModule: ratings, trust score model, abuse checks
- AdminModule: moderation, audit logs, dispute handling
- AnalyticsModule: donor/organization KPI aggregates

## 4) API and Contract Style
- Public APIs versioned: /api/v1
- OpenAPI generated from NestJS decorators
- Idempotency required for payment and checkout endpoints
- Cursor pagination for activity feeds, offset pagination for admin reports
- Webhooks signed and timestamped

## 5) Multi-Role Access Model
Roles:
- donor
- organization
- beneficiary
- company
- courier
- admin

Authorization:
- Role guard + resource ownership guard
- Policy checks for state transitions (example: only verified organizations can publish needs)

## 6) Data Integrity and Trust
- Every money movement links: cart -> order -> payment transaction -> donation rows
- Mission proof includes photo + optional GPS + OTP hash
- Ratings restricted to one rating per user per target
- Trust score recomputed asynchronously from verified signals

## 7) Deployment Topology (Initial)
- One NestJS service + worker service
- One Next.js service
- Mobile app consumes same API
- Managed MariaDB + managed Redis + object storage
- CDN in front of Next.js and media assets

## 8) Scale Path
Phase 1: modular monolith
Phase 2: extract Payments and Delivery services if throughput or team scaling requires
Phase 3: regional deployment with data residency controls

## 9) Non-Functional Targets (MVP)
- API p95 latency under 300 ms for read endpoints
- Payment webhook processing under 30 seconds end-to-end
- 99.9% monthly availability target for core donation path
- Full auditability of financial and delivery events
