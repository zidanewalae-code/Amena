# Sprints detaillees pour Amena

## Hypotheses de planning
- Capacite equipe cible: 5 a 8 personnes (backend, frontend web, mobile, QA, DevOps)
- Cadence: sprint de 1 a 2 semaines
- Definition of Done (DoD) commune:
  - Code merge avec revue
  - Tests unitaires/integration verts
  - Telemetrie (logs/metrics) branchee
  - Documentation API/UI mise a jour
  - Feature validee sur environnement staging

## Sprint 1 - Setup & Auth (1 semaine)
Objectif:
- Poser la base technique et livrer un flux d'authentification complet multi-role.

Backlog:
- Initialiser frontend web (Next.js) et mobile (React Native)
- Initialiser backend NestJS (ou Express si choix final)
- Configurer MariaDB et executer le schema SQL
- Mettre en place migration/versioning DB
- Authentification inscription/connexion pour roles:
  - donor
  - organization
  - beneficiary
  - company
  - courier
  - admin
- Verification email
- Mot de passe oublie + reset token
- Dashboard minimal avec protection de route (test login)

Livrables:
- API /auth fonctionnelle
- Ecran login/register web + mobile
- RBAC minimum par role
- CI de base (lint + tests)

Criteres d'acceptation:
- Un utilisateur peut s'inscrire, verifier son email, se connecter et rafraichir son token
- Les routes protegees refusent role non autorise

## Sprint 2 - Gestion utilisateurs et profils (1 a 2 semaines)
Objectif:
- Structurer les profils metier par role et les ecrans de gestion.

Backlog:
- CRUD profil utilisateur (nom, email, role, telephone, statut)
- Profil donateur (preferences de dons, historique simplifie)
- Profil organisation:
  - verification statut
  - upload de documents
- Profil beneficiaire:
  - vulnerabilite
  - national_id_hash
- Profil courier:
  - type
  - vehicule
  - zone de service
  - score de confiance
- Profil entreprise:
  - budget RSE
  - secteur
- UI responsive profil web + mobile

Livrables:
- API /users, /organizations, /beneficiaries, /couriers, /companies
- Ecrans profil role-based

Criteres d'acceptation:
- Chaque role peut lire/modifier son profil selon les regles
- Admin peut suspendre/reactiver un compte

## Sprint 3 - Gestion des besoins (Needs) (2 semaines)
Objectif:
- Permettre la publication et le suivi des besoins de facon transparente.

Backlog:
- CRUD besoins: titre, description, categorie, urgence, montant cible
- Workflow statut:
  - draft
  - under_review
  - published
  - partially_funded
  - funded
  - closed
  - rejected
- Updates de besoin avec preuves (photo/doc)
- Dashboard de suivi montant collecte/restant
- Notifications automatiques aux donateurs interesses

Livrables:
- API /needs + /need-updates
- Ecrans liste/detail/suivi besoin

Criteres d'acceptation:
- Un besoin publie apparait dans le catalogue
- Le pourcentage de financement se met a jour en temps reel ou quasi reel

## Sprint 4 - Gestion des dons (2 semaines)
Objectif:
- Construire le tunnel de don de bout en bout.

Backlog:
- Donation carts + items
- Checkout securise
- Integration paiement (Stripe ou provider local)
- Journalisation des transactions
- Historique des dons par donateur
- Mise a jour automatique amount_collected
- Notifications de don confirme (push/email)

Livrables:
- API /cart, /checkout, /payments, /donations
- Ecrans checkout et historique

Criteres d'acceptation:
- Paiement reussi cree une donation confirmee
- Amount_collected du need est coherent avec la somme des dons confirmes

## Sprint 5 - Livraisons / Couriers (2 semaines)
Objectif:
- Garantir la tracabilite logistique de l'aide.

Backlog:
- Creation delivery_missions liees aux needs/donations
- Assignation courier manuelle + mode auto (regles simples)
- Suivi statuts:
  - to_assign
  - assigned
  - in_progress
  - delivered
  - failed
- Delivery proofs: photo, signature, OTP, GPS
- Ratings courier + trust_score
- Notifications a chaque changement d'etape

Livrables:
- API /missions, /delivery-events, /delivery-proofs
- Timeline mission web + mobile courier

Criteres d'acceptation:
- Une mission livree contient une preuve exploitable
- Le donor et l'admin peuvent suivre le statut sans ambiguite

## Sprint 6 - Conversation / Chat (1 a 2 semaines)
Objectif:
- Permettre la communication contextualisee en temps reel.

Backlog:
- Backend REST + WebSocket pour chat
- Composant chat web + mobile
- Messages texte + attachments (images/PDF)
- Statut lu/non lu
- Filtrage par contexte:
  - need
  - mission
  - donor
- Notifications push/email/in-app
- Historique + recherche (conversation, utilisateur, date)
- Admin moderation/suppression messages

Livrables:
- API /conversations, /messages
- Gateway WebSocket
- UI chat cross-platform

Criteres d'acceptation:
- Message recu en temps reel pour participants connectes
- Historique etat lu/non lu coherent entre web et mobile

## Sprint 7 - Systeme de confiance & IA (1 a 2 semaines)
Objectif:
- Renforcer la fiabilite et la pertinence des interactions.

Backlog:
- Ratings pour needs, organizations, couriers
- Trust scores avec score_details JSON
- Recommandations IA besoins <-> donateurs (interets, localisation, historique)
- Alertes anomalies (missions en retard, comportements suspects)

Livrables:
- API /ratings et /trust
- Job asynchrone de recalcul trust
- Moteur de recommandation V1 (rule-based + scoring)

Criteres d'acceptation:
- Un nouveau rating impacte le trust score
- Les recommandations affichent des besoins pertinents et explicables

## Sprint 8 - Notifications & Alerts (1 semaine)
Objectif:
- Unifier tous les canaux de notification.

Backlog:
- Push, email, SMS
- Evenements couverts:
  - nouveau besoin
  - nouveau message
  - donation confirmee
  - mission assignee
  - update de besoin
- Preferences utilisateur par canal/categorie

Livrables:
- Centre de preferences notifications
- Worker de notifications et retries

Criteres d'acceptation:
- Les notifications critiques sont delivrees avec retries
- L'utilisateur peut desactiver un canal non critique

## Sprint 9 - UX/UI & touche tunisienne (1 semaine)
Objectif:
- Humaniser l'experience et adapter au contexte local.

Backlog:
- Contenus Darja/Francais pour messages et notifications
- Templates chaleureux et simples
- Direction artistique community feel
- QA responsive web + mobile
- Tests parcours complet donor -> need -> mission -> chat

Livrables:
- Design tokens finalises
- Copywriting localise
- Flux critiques polishes

Criteres d'acceptation:
- Tous les ecrans critiques sont exploitables mobile et desktop
- Les parcours de don et suivi sont fluides en moins de 5 etapes majeures

## Sprint 10 - Testing & Deploiement (1 a 2 semaines)
Objectif:
- Stabiliser, securiser et lancer en production pilote.

Backlog:
- Tests unitaires et integration frontend/backend
- Tests fonctionnels end-to-end
- Pentest de base (auth, IDOR, rate limit)
- Deploiement cloud (staging + prod)
- Monitoring + analytics + alerting
- Runbooks incidents

Livrables:
- Pipeline CI/CD complet
- Dashboards monitoring
- Checklist go-live signee

Criteres d'acceptation:
- SLA cible respectee sur flux critique don
- Zero bug bloquant ouvert a la mise en prod

## KPIs transverses par sprint
- Taux conversion don
- Delai moyen de financement d'un besoin
- Taux de livraison reussie
- Delai moyen de traitement d'une verification organisation
- Taux de lecture des notifications
- Satisfaction utilisateur (NPS simple ou note 1-5)
