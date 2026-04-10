# UML - Projet Amena

## 1. Diagramme de composants (architecture globale)

```mermaid
flowchart LR
  subgraph Clients
    WEB[Web Next.js]
    MOB[Mobile React Native]
  end

  subgraph Backend[Backend Node.js/Express]
    ROUTES[Routes]
    CTRL[Controllers]
    SRV[Services]
    RT[Realtime Gateway\nSocket.io]
    ORM[Sequelize Models]
  end

  DB[(MariaDB / SQLite dev)]

  WEB -->|HTTP REST| ROUTES
  MOB -->|HTTP REST| ROUTES
  WEB <-->|WebSocket| RT
  MOB <-->|WebSocket| RT

  ROUTES --> CTRL
  CTRL --> SRV
  CTRL --> ORM
  SRV --> ORM
  ORM --> DB

  SRV --> RT
  CTRL --> RT
```

## 2. Diagramme de classes (domaine principal)

```mermaid
classDiagram
  class User {
    +id: bigint
    +full_name: string
    +email: string
    +role: enum
    +phone: string
    +is_active: boolean
  }

  class Organization {
    +id: bigint
    +user_id: bigint
  }

  class Beneficiary {
    +id: bigint
    +user_id: bigint
  }

  class Need {
    +id: bigint
    +organization_id: bigint
    +beneficiary_id: bigint
    +title: string
    +status: enum
  }

  class DonationOrder {
    +id: bigint
    +donor_user_id: bigint
    +total_amount: decimal
    +status: enum
  }

  class Donation {
    +id: bigint
    +order_id: bigint
    +need_id: bigint
    +donor_user_id: bigint
    +amount: decimal
  }

  class PaymentTransaction {
    +id: bigint
    +donation_order_id: bigint
    +provider_name: string
    +status: enum
    +amount: decimal
  }

  class CourierProfile {
    +id: bigint
    +user_id: bigint
    +vehicle_type: enum
    +verification_status: enum
    +trust_score: decimal
  }

  class DeliveryRequest {
    +id: bigint
    +requested_by_user_id: bigint
    +assigned_courier_id: bigint?
    +pickup_location: json
    +dropoff_location: json
    +proposed_price: decimal
    +accepted_price: decimal?
    +status: enum
    +expires_at: datetime
  }

  class DeliveryOffer {
    +id: bigint
    +request_id: bigint
    +courier_user_id: bigint
    +offered_price: decimal
    +status: enum
  }

  class DeliveryMission {
    +id: bigint
    +need_id: bigint
    +courier_user_id: bigint?
    +status: enum
  }

  class DeliveryEvent {
    +id: bigint
    +mission_id: bigint
    +event_type: enum
    +actor_user_id: bigint?
  }

  class DeliveryProof {
    +id: bigint
    +mission_id: bigint
    +photo_url: string?
    +gps_lat: float?
    +gps_lng: float?
  }

  User "1" --> "0..1" Organization : owns
  User "1" --> "0..1" Beneficiary : owns
  User "1" --> "0..1" CourierProfile : has
  Organization "1" --> "0..*" Need : publishes
  Beneficiary "1" --> "0..*" Need : concerns

  User "1" --> "0..*" DonationOrder : creates
  DonationOrder "1" --> "0..*" Donation : contains
  Need "1" --> "0..*" Donation : receives
  DonationOrder "1" --> "0..1" PaymentTransaction : paid_by

  User "1" --> "0..*" DeliveryRequest : requested_by
  User "1" --> "0..*" DeliveryRequest : assigned_courier
  DeliveryRequest "1" --> "0..*" DeliveryOffer : has
  User "1" --> "0..*" DeliveryOffer : submits

  Need "1" --> "0..*" DeliveryMission : delivered_with
  User "1" --> "0..*" DeliveryMission : courier
  DeliveryMission "1" --> "0..*" DeliveryEvent : logs
  DeliveryMission "1" --> "0..*" DeliveryProof : proofs
```

## 3. Diagramme de sequence (livraison type inDrive)

```mermaid
sequenceDiagram
  actor Assoc as Association/Admin
  participant API as DeliveryController
  participant DB as Sequelize/DB
  participant RT as Socket.io
  actor C1 as Courier A
  actor C2 as Courier B

  Assoc->>API: POST /delivery/requests\n(pickup, dropoff, proposed_price)
  API->>DB: create DeliveryRequest(status=pending)
  API->>RT: broadcast delivery:request:new (nearby couriers)
  RT-->>C1: request:new
  RT-->>C2: request:new

  C1->>API: POST /requests/:id/offers (offered_price=20)
  API->>DB: upsert DeliveryOffer(courier A)
  API->>RT: delivery:offer:update
  RT-->>Assoc: offer from A

  C2->>API: POST /requests/:id/offers (offered_price=18)
  API->>DB: upsert DeliveryOffer(courier B)
  API->>RT: delivery:offer:update
  RT-->>Assoc: offer from B

  Assoc->>API: PATCH /requests/:id/select-offer (offer B)
  API->>DB: transaction + row lock
  API->>DB: set request accepted + assigned_courier_id
  API->>DB: selected offer=accepted, others=rejected
  API->>RT: delivery:request:update
  RT-->>C2: offer_selected
  RT-->>C1: offer_rejected
  RT-->>Assoc: status accepted

  C2->>API: PATCH /requests/:id/status in_progress
  API->>DB: update status
  API->>RT: status_changed
  RT-->>Assoc: in_progress

  C2->>API: PATCH /requests/:id/status delivered
  API->>DB: update delivered_at
  API->>RT: status_changed
  RT-->>Assoc: delivered

  Assoc->>API: PATCH /requests/:id/status confirmed
  API->>DB: update confirmed_at
  API->>RT: status_changed
  RT-->>C2: confirmed
```

## 4. Etats de livraison (state machine)

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> accepted: select-offer
  pending --> expired: timeout
  pending --> canceled: cancel
  accepted --> in_progress: courier starts
  accepted --> canceled: cancel
  in_progress --> delivered: courier delivers
  in_progress --> canceled: incident/cancel
  delivered --> confirmed: association confirms
  expired --> pending: reassign
  canceled --> pending: reassign
```
