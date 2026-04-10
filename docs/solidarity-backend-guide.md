# Socio-Solidarity Backend Guide

## Roles and tasks

- Donor:
  - Browses products.
  - Creates orders, adds products, checks out.
  - Makes direct donations.
  - Tracks assignments (where donation/order was sent).
- Admin:
  - Manages products (CRUD).
  - Manages beneficiaries (CRUD).
  - Assigns donations/orders to beneficiaries.
  - Validates or cancels pending donations/orders.
  - Reads KPI dashboard.

## Entity relationships (for frontend UI design)

- User -> SocialDonation: one-to-many.
- User -> SocialOrder: one-to-many.
- SocialOrder -> SocialOrderItem: one-to-many.
- SocialProduct -> SocialOrderItem: one-to-many.
- SocialBeneficiary -> SocialAssignment: one-to-many.
- SocialDonation -> SocialAssignment: one-to-many (optional link).
- SocialOrder -> SocialAssignment: one-to-many (optional link).

### UI layout guidance

- Donor area:
  - Product catalog page.
  - Cart/order page with line items.
  - Donation form page.
  - Traceability page (assignments with beneficiary details).
- Admin area:
  - Product management CRUD table.
  - Beneficiary management CRUD table.
  - Assignment page (select donation or order + beneficiary).
  - Status validation/cancel actions.
  - KPI dashboard card section.

## REST API endpoints (`/api/solidarity`)

### Products
- `GET /products`
- `GET /products/:id`
- `POST /products` (admin)
- `PATCH /products/:id` (admin)
- `DELETE /products/:id` (admin)

### Donations
- `POST /donations` (donor/admin)
- `GET /donations/my` (donor/admin)
- `GET /donations` (admin)
- `PATCH /donations/:id/status` (admin)

### Orders
- `POST /orders` (donor/admin)
- `GET /orders/my` (donor/admin, admin sees all)
- `POST /orders/:orderId/items` (donor/admin)
- `POST /orders/:orderId/checkout` (donor/admin)
- `PATCH /orders/:orderId/status` (admin)

### Beneficiaries
- `GET /beneficiaries`
- `POST /beneficiaries` (admin)
- `PATCH /beneficiaries/:id` (admin)
- `DELETE /beneficiaries/:id` (admin)

### Assignments and tracking
- `POST /assignments` (admin)
- `GET /assignments` (admin)
- `GET /tracking/my` (donor/admin)

### KPI
- `GET /kpis` (admin)

## Example API usage

### 1) Add products to order

```http
POST /api/solidarity/orders
Authorization: Bearer <DONOR_JWT>
```

Response includes `order.id`.

```http
POST /api/solidarity/orders/{orderId}/items
Authorization: Bearer <DONOR_JWT>
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}
```

```http
POST /api/solidarity/orders/{orderId}/checkout
Authorization: Bearer <DONOR_JWT>
```

### 2) Make donation

```http
POST /api/solidarity/donations
Authorization: Bearer <DONOR_JWT>
Content-Type: application/json

{
  "amount": 120.50
}
```

### 3) Assign donation/order to beneficiary

```http
POST /api/solidarity/assignments
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{
  "type": "donation",
  "donation_id": 5,
  "beneficiary_id": 2
}
```

Or for orders:

```http
{
  "type": "order",
  "order_id": 11,
  "beneficiary_id": 2
}
```
