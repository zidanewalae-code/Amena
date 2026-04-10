# Architecture MVC pour Amena

## 1. Vision
Amena suit une architecture MVC pour separer clairement:
- Model: donnees et regles d'acces base MariaDB
- Controller: logique applicative et orchestration des cas metier
- View: interfaces web et mobile qui consomment les APIs

Objectif: evolutivite, testabilite et transparence des flux de dons.

## 2. Model (M)
Le Model represente les entites metier et leurs relations. Il execute le CRUD et encapsule les contraintes de persistence.

### 2.1 Modeles principaux
- Users: donateurs, organisations, beneficiaires, entreprises, couriers, admins
- Organizations: associations et verification documentaire
- Beneficiaries: informations sensibles, vulnerabilite, hash identifiant
- Needs: besoins publics, statut, urgence, objectif financier
- DonationCarts, CheckoutOrders, Donations, PaymentTransactions: tunnel de don
- DeliveryMissions, DeliveryEvents, DeliveryProofs: suivi logistique
- CourierProfiles, CourierRatings, TrustScores: confiance et performance
- Notifications: in-app, email, sms, push
- AuditLogs: journal de transparence et traçabilite

### 2.2 Relations metier typiques
- User hasOne Organization
- User hasOne Beneficiary
- User hasOne CourierProfile
- User hasOne Company
- Need belongsTo Organization
- Need belongsTo Beneficiary
- Need hasMany Donations
- CheckoutOrder hasMany Donations
- DeliveryMission belongsTo Need
- DeliveryMission belongsTo Donation
- DeliveryMission hasMany DeliveryEvents
- DeliveryMission hasMany DeliveryProofs
- User hasMany Notifications

### 2.3 Regles de modeles
- Validation des montants > 0
- Contraintes d'unicite pour eviter doublons de paiement/rating
- Statuts stricts pour Needs et DeliveryMissions
- Audit automatique des actions sensibles

## 3. Controller (C)
Le Controller recoit les requetes HTTP/WebSocket, appelle les services metier, puis renvoie des reponses JSON normalisees.

### 3.1 Controllers principaux
- AuthController:
  - POST /auth/signup
  - POST /auth/login
  - POST /auth/forgot-password
  - POST /auth/reset-password
  - POST /auth/verify-email

- UserController:
  - GET /users/me
  - PATCH /users/me
  - PATCH /users/:id/status (admin)

- NeedController:
  - POST /needs
  - GET /needs
  - GET /needs/:id
  - PATCH /needs/:id
  - POST /needs/:id/publish
  - POST /needs/:id/updates

- DonationController:
  - POST /cart/items
  - GET /cart
  - POST /checkout
  - GET /donations/me

- PaymentController:
  - POST /payments/intent
  - POST /payments/webhooks/:provider
  - GET /payments/:id

- DeliveryController:
  - POST /missions
  - POST /missions/:id/assign
  - POST /missions/:id/events
  - POST /missions/:id/proofs
  - GET /missions/:id/track

- NotificationController:
  - GET /notifications
  - PATCH /notifications/:id/read

- ChatController:
  - GET /conversations
  - POST /conversations/:id/messages
  - WS /chat (temps reel)

- RatingController:
  - POST /ratings
  - GET /trust/:targetType/:targetId

- AdminController:
  - GET /admin/review-queue
  - POST /admin/organizations/:id/verify
  - POST /admin/messages/:id/moderate

### 3.2 Responsibilities du Controller
- Authentifier et autoriser (RBAC)
- Valider DTO et payload
- Appeler la couche service
- Gérer pagination, filtres, tri
- Uniformiser erreurs et codes HTTP
- Tracer actions vers AuditLogs

## 4. View (V)
La View affiche les donnees renvoyees par les controllers et gere l'experience utilisateur.

### 4.1 Web (React / Next.js)
- Dashboard donateur
- Catalogue de besoins
- Tunnel de don
- Suivi des missions
- Back-office admin moderation/verifications

### 4.2 Mobile (React Native)
- Parcours courier (missions, preuves, statut)
- Parcours beneficiaire (suivi besoin et notifications)
- Parcours donateur leger (dons et suivi)

### 4.3 Composants UI reutilisables
- NeedCard, DonationSummary, MissionTimeline
- NotificationCenter, TrustBadge
- ChatThread, ChatInput, AttachmentPreview
- Modals de confirmation et statuts

### 4.4 Contrat View <-> API
- Reponses JSON versionnees (/api/v1)
- Etat de chargement, vide, erreur gere dans chaque ecran
- Polling ou WebSocket pour les flux temps reel (chat, livraison, paiements)

## 5. Flux MVC exemple
Exemple: POST /needs
1. View envoie formulaire besoin.
2. NeedController valide et autorise la requete.
3. NeedService applique la logique metier.
4. NeedModel persiste dans MariaDB.
5. Controller renvoie la ressource creee en JSON.
6. View met a jour la liste et affiche confirmation.

## 6. Structure de dossiers recommandee

Backend (NestJS, style MVC + services):
- src/auth
- src/users
- src/organizations
- src/beneficiaries
- src/needs
- src/donations
- src/payments
- src/delivery
- src/notifications
- src/chat
- src/ratings
- src/admin
- src/common

Dans chaque module:
- controller
- service
- model/entity
- repository
- dto
- tests

Frontend web (Next.js):
- app/(public)
- app/(dashboard)
- features/auth
- features/needs
- features/donations
- features/delivery
- features/chat
- features/notifications
- components/shared
- lib/api

Mobile (React Native):
- src/screens
- src/features
- src/components
- src/services/api
- src/store

## 7. Bonnes pratiques de mise en oeuvre
- Garder les controllers fins, deplacer metier dans services
- Centraliser gestion des erreurs (middleware/interceptor)
- Journaliser evenements critiques (paiement, verification, livraison)
- Couvrir les cas critiques par tests d'integration
- Maintenir compatibilite API avec versionning

## 8. Conclusion
Cette architecture MVC fournit une base claire pour Amena:
- Model solide pour la transparence des donnees
- Controller robuste pour les regles de confiance
- View coherente sur web et mobile

Elle est adaptee a un MVP evolutif vers une plateforme internationale.
