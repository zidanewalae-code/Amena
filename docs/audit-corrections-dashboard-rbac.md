# Audit complet des dashboards AMENA

Date: 2026-05-17

## 1. Architecture dashboard actuelle

- Frontend React + Vite avec une navigation centralisée dans `web/src/lib/access.js`.
- `DashboardPage.jsx` est unique et s’adapte au rôle via `getDashboardConfig()`, `getDashboardSections()` et `getDashboardStats()`.
- `Layout.jsx` récupère les liens visibles via `getVisibleSidebarLinks(user)` et les transmet à `Sidebar.jsx`.
- `ProtectedRoute.jsx` protège les pages par rôle et redirige vers le dashboard adapté.
- Backend Express + Sequelize avec middleware JWT `authMiddleware` et contrôle de rôle `roleMiddleware`.
- Le backend reste la source de vérité pour la sécurité; le frontend n’est qu’une couche UX.

## 2. Flux login -> dashboard

1. `LoginPage.jsx` appelle `POST /api/auth/login`.
2. `auth.jsx` stocke `amena_token` et `amena_user`, puis lit aussi le rôle depuis le JWT.
3. `App.jsx` redirige `/dashboard` vers le dashboard du rôle courant.
4. `ProtectedRoute.jsx` bloque l’accès direct si le rôle ne correspond pas.
5. `Layout.jsx` et `Sidebar.jsx` affichent les liens selon `access.js`.

## 3. Matrice RBAC frontend

### ADMIN
- Liens visibles: Home, Dashboard, Orders, Alerts, Profile.
- Sections dashboard: users, orders, payments, alerts.
- Endpoints appelés par `DashboardPage.jsx`: `/users`, `/orders`, `/payments`, `/alerts`.
- Actions CRUD autorisées côté UI: gérer orders, alerts, profile; les listes users/payments restent consultatives dans le dashboard.
- Boutons visibles: Refresh dashboard, Manage orders, Manage alerts, plus les actions de pages CRUD accessibles via sidebar.

### DONATOR
- Liens visibles: Home, Dashboard, Donations, Orders, History, Profile.
- Sections dashboard: dons, orders, history.
- Endpoints appelés: `/dons`, `/orders`, `/history`.
- Actions CRUD autorisées côté UI: donations et orders via pages dédiées; profile en édition; notifications lues selon le backend.
- Boutons visibles: Refresh dashboard, Open donations, Open orders, Open history, Edit profile.

### ORGANIZATION
- Liens visibles: Home, Dashboard, Products, Donations, Orders, Alerts, Profile.
- Sections dashboard: products, dons, orders, alerts.
- Endpoints appelés: `/products`, `/dons`, `/orders`, `/alerts`.
- Actions CRUD autorisées côté UI: products, donations, alerts, orders, profile.
- Boutons visibles: Refresh dashboard, Manage products, Manage donations, Manage orders, Manage alerts.

### DELIVERY_PERSON
- Liens visibles: Home, Dashboard, Orders, History, Profile.
- Sections dashboard: orders, history, notifications.
- Endpoints appelés: `/orders`, `/history`.
- Actions CRUD autorisées côté UI: consultation des orders et historique; mise à jour de statut sur les commandes assignées.
- Boutons visibles: Refresh dashboard, Open orders, Open history, Edit profile.

## 4. Boutons et composants visibles

- `DashboardPage.jsx` affiche les cartes statistiques via `StatCard` pour chaque section configurée.
- Chaque section affiche une `DashboardCard` avec une description et un bouton d’action si `section.action` existe.
- `refresh dashboard` renvoie vers le dashboard du rôle courant via `getDashboardPath(role)`.
- `ProductsPage.jsx` affiche les boutons Create, Update, Delete, Add category, selon `admin` ou `organization`.
- `DonationsPage.jsx` affiche Create, Edit, Delete pour `admin`, `organization`, `donator`.
- `OrdersPage.jsx` affiche Create/Edit/Delete, avec mode status-only pour `delivery_person`.
- `AlertsPage.jsx` affiche Create, Edit, Delete pour `admin` et `organization`.
- `PaymentsPage.jsx` est en lecture simple, sans formulaire de modification.
- `NotificationsPage.jsx` est en lecture simple, sans action destructive côté UI.
- `HistoryPage.jsx` est en lecture simple.

## 5. Matrice RBAC backend

### Auth
- `POST /api/auth/register`: public.
- `POST /api/auth/login`: public.
- `POST /api/auth/logout`: authenticated.
- `authMiddleware.js`: 401 si token manquant ou invalide.

### Users
- `GET /api/users`: admin only.
- `GET /api/users/:id`: authenticated, owner only ou admin.
- `PATCH /api/users/:id`: authenticated, owner only ou admin, sans changement de rôle.
- `PATCH /api/users/:id/role`: admin only.
- `DELETE /api/users/:id`: admin only côté route.

### Products
- `GET /api/products`: authenticated, `delivery_person` bloqué par la route.
- `GET /api/products/:id`: authenticated, `delivery_person` bloqué.
- `POST /api/products`: admin + organization.
- `PUT /api/products/:id`: admin + organization.
- `DELETE /api/products/:id`: admin only.

### Dons
- `GET /api/dons`: authenticated, admin/organization global, donator filtré à ses dons.
- `GET /api/dons/:id`: owner only ou admin/organization selon le don.
- `POST /api/dons`: admin/organization/donator, avec donor forcé au compte connecté pour donator.
- `PATCH /api/dons/:id`: owner-aware.
- `DELETE /api/dons/:id`: owner-aware.

### Orders
- `GET /api/orders`: admin/organization global; donator et delivery_person filtrés.
- `GET /api/orders/:id`: owner-aware ou admin/organization.
- `POST /api/orders`: admin/organization/donator.
- `PUT /api/orders/:id`: delivery_person limité au statut; autres rôles peuvent modifier davantage selon ownership.
- `DELETE /api/orders/:id`: owner-aware ou admin/organization, avec règles métier côté contrôleur.

### Payments
- `GET /api/payments`: admin global, donator filtré à ses paiements.
- `GET /api/payments/:id`: admin ou owner donator.
- `POST /api/payments`: admin only.
- `PATCH /api/payments/:id`: admin only.
- `DELETE /api/payments/:id`: admin only.

### Alerts
- `GET /api/alerts`: admin global, organization limité à ses alerts, donator/delivery_person limités aux alerts publiques.
- `GET /api/alerts/:id`: même logique de visibilité.
- `POST /api/alerts`: admin ou organization, avec `organization_id` forcé pour organization.
- `PUT /api/alerts/:id`: admin global; organization uniquement sur ses propres alerts.
- `DELETE /api/alerts/:id`: admin + route.

### Notifications
- `GET /api/notifications`: admin global, autres rôles filtrés par périmètre lié à la commande.
- `GET /api/notifications/:id`: same ownership/role checks.
- `POST /api/notifications`: admin or roles authorized by route, with backend ownership checks.
- `PUT /api/notifications/:id`: same ownership/role checks.
- `DELETE /api/notifications/:id`: same ownership/role checks.

### History
- `GET /api/history`: admin/organization global, other roles filtered.
- `GET /api/history/:id`: owner-aware via delivery_person or donor relation.
- `POST /api/history`: admin + organization.
- `PUT /api/history/:id`: admin + organization.
- `DELETE /api/history/:id`: admin only.

## 6. Incohérences frontend/backend

- Le frontend bloque désormais `delivery_person` sur `/products` et le backend fait la même chose.
- Les dashboards affichent des jeux de données configurés dans `access.js`; toute divergence entre cette config et les règles métier se traduit immédiatement en écart UX.
- Les pages `PaymentsPage.jsx`, `NotificationsPage.jsx` et `HistoryPage.jsx` existent maintenant, mais leur visibilité métier doit rester alignée avec les règles de rôle réelles.
- L’accès aux notifications dépend du lien avec une commande, car le schéma SQL ne contient pas de destinataire explicite.

## 7. Routes non protégées

- Toutes les routes backend sont maintenant couvertes par `authMiddleware`.
- Les routes sensibles sont complétées par `roleMiddleware` ou par un filtrage d ownership dans les contrôleurs.
- Le frontend protège l’accès direct aux routes grâce à `ProtectedRoute.jsx`.

## 8. Endpoints sensibles

- `/api/users`
- `/api/payments`
- `/api/alerts`
- `/api/notifications`
- `/api/orders`
- `/api/dons`
- `/api/history`
- `/api/products`

## 9. Problèmes critiques corrigés

- Lecture/édition/suppression de toutes les notifications par n’importe quel utilisateur authentifié.
- Lecture globale d’alerts privées par des rôles non autorisés.
- Accès backend incohérent sur les products pour `delivery_person`.
- Dépendance du frontend seul pour des règles qui devaient être appliquées côté API.

## 10. Problèmes moyens corrigés ou réduits

- Harmonisation du redirection flow login -> dashboard.
- Réduction des écarts entre sidebar et accès backend.
- Ajout de pages manquantes pour les vues demandées.
- Centralisation RBAC préservée dans `access.js`.

## 11. Problèmes mineurs ou résiduels

- Les notifications n’ont pas de champ SQL `user_id` ou `recipient_id` dédié.
- La visibilité des alerts publiques repose sur la convention applicative `priority = public`.
- Certaines listes du dashboard restent plus riches que la matrice métier minimale demandée; cela doit être surveillé si le besoin produit se resserre.

## 12. Liens cassés

- Aucun lien cassé constaté dans les routes frontend validées.
- Les routes `/payments` et `/history` existent désormais côté frontend.
- La route `/notifications` n’est plus exposée dans la navigation finale.

## 13. Boutons inutiles

- Aucun bouton critique inutile n’a été constaté dans les pages principales.
- Les boutons `Manage` dans le dashboard restent cohérents avec les pages CRUD exposées.

## 14. Endpoints chargés inutilement

- `DashboardPage.jsx` charge toutes les sections configurées pour un rôle; cela reste volontaire et conforme au pattern centralisé.
- Les pages simples `PaymentsPage.jsx`, `NotificationsPage.jsx`, `HistoryPage.jsx` lisent leurs endpoints sans ajouter de logique métier superflue, mais `NotificationsPage.jsx` n’est plus exposée dans la navigation finale.

## 15. Validation finale par rôle

### Admin
- Peut accéder aux dashboards et aux endpoints admin autorisés.
- Voit users, orders, payments, alerts.
- Les endpoints sensibles restent protégés.

### Donator
- Ne peut pas ouvrir le dashboard admin.
- Ne peut pas accéder à `/api/users` ni à `/api/payments` en tant qu’organisation.
- Voit ses données filtrées sur dons, orders, historique, notifications selon le périmètre autorisé.

### Organization
- Ne peut pas accéder à `/api/users`.
- Ne peut pas accéder à `/api/payments`.
- Voit ses products, donations, alerts, orders.

### Delivery_person
- Ne peut pas accéder à `/products`.
- Ne peut pas lire les alerts privées organization.
- Ne peut pas agir sur les notifications hors périmètre.
- Voit ses commandes assignées et son historique de livraison.

## Validation technique

- `web`: `npm run build` -> succès.
- Backend: `node --check` sur les fichiers patchés -> succès.
- Tests live JWT/RBAC:
  - `delivery_person` -> `/products` : 403.
  - `donator` -> `/users` : 403.
  - `organization` -> `/payments` : 403.
  - token invalide -> `/orders` : 401.
  - `delivery_person` -> alert privée organization : 403.
  - `delivery_person` -> alert publique : 200.
  - `donator` -> notification propre : 200.

## Limitations restantes du schéma SQL

- `Notification` manque d’un destinataire explicite; l’ownership reste dérivé de `order_id`.
- `Alert` ne possède pas de vrai statut de visibilité séparé; la notion de public est une convention métier.
- Tant que le schéma n’évolue pas, certaines règles resteront des conventions applicatives plutôt que des contraintes structurelles.
