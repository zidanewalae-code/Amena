# Analyse du plan des sprints Amena

## Resume executif
Le plan en 10 sprints est solide et couvre correctement le cycle metier complet: onboarding, besoins, dons, livraison, confiance, conversation et lancement. Les priorites sont globalement bien ordonnees, mais 4 points critiques doivent etre verrouilles tres tot:
- Architecture de chat (tables + stockage attachments)
- Strategie paiement locale (en plus de Stripe)
- Strategie anti-fraude/abus des ratings et missions
- Gouvernance de donnees sensibles (PII + documents)

## Forces du plan
- Progression metier logique du plus critique vers le plus avancé
- Presence explicite des statuts de needs et missions
- Focus confiance (trust score) et preuve de livraison
- Sprint final dedie a qualite + deploiement

## Ecarts techniques identifies (par rapport au schema actuel)
1. Module chat non modele en base
Le schema actuel ne contient pas les tables conversation/messages/attachments/read receipts.

2. Preferences de notification absentes
Il manque une table de preferences utilisateur pour canal/categorie.

3. IA recommandations non tracee
Aucune table pour historiser les recommandations affichees/clics (utile pour amelioration modele).

4. Moderation de contenu chat
Pas de table de reports/moderation pour messages litigieux.

## Tables recommandees a ajouter
- conversations
- conversation_participants
- messages
- message_attachments
- message_read_receipts
- message_reports
- notification_preferences
- recommendation_events

## Risques majeurs et mitigations
1. Risque paiement/webhooks incoherents
Mitigation: idempotency stricte, retries, reconciliation quotidienne, audit logs.

2. Risque de surcharge equipe mobile + web simultane
Mitigation: prioriser ecrans critiques mobile d'abord pour courier, web d'abord pour admin/donor.

3. Risque confiance (fausses preuves livraison)
Mitigation: OTP + photo horodatee + GPS + controles aleatoires admin.

4. Risque legal/confidentialite
Mitigation: retention policy, chiffrement stockage docs, acces RBAC strict, pseudonymisation.

## Dependances critiques
- Sprint 3 depend de Sprint 2 (verification organization)
- Sprint 4 depend de Sprint 3 (besoins publies)
- Sprint 5 depend de Sprint 4 (dons confirmes)
- Sprint 6 peut demarrer partiellement en parallele de Sprint 5
- Sprint 7 depend des donnees de Sprints 3-6

## Recommandations d'ordonnancement
- Demarrer design DB chat en fin Sprint 2, implementation Sprint 6
- Integrer observabilite des Sprint 1 (traces + logs + metrics)
- Introduire tests E2E du parcours don des Sprint 4, pas attendre Sprint 10
- Ajouter un mini hardening securite a la fin de chaque sprint

## Definition de pret (DoR) conseillée
Avant debut de chaque sprint:
- User stories avec criteres d'acceptation mesurables
- Contrats API defini (OpenAPI)
- Migrations DB preparees
- Donnees de test disponibles

## Definition de fini (DoD) conseillée
Avant cloture de sprint:
- Couverture tests minimale atteinte (a definir par module)
- Monitoring et alertes en place pour la feature livree
- Documentation technique et produit mise a jour
- Validation PO + QA signee

## KPIs de pilotage recommande
- Delivery velocity (stories done / sprint)
- Defect leakage (bugs prod / sprint)
- API p95 sur endpoints critiques
- Taux succes paiement
- Taux completion mission
- Taux adoption chat (DAU chat / DAU total)

## Conclusion
Le plan est pertinent pour un MVP trust-first. La principale action immediate est de completer le modele de donnees pour le chat et les preferences notifications avant Sprint 6, puis de maintenir une discipline qualite continue au lieu de concentrer tous les tests a la fin.
