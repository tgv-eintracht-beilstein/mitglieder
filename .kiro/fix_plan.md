# Ralph Fix Plan — Vereinssoftware

## Phase 1: Foundation (specs/phase-1-foundation.md)

- [ ] Monorepo-Setup: pnpm workspaces, ESLint, Prettier, TypeScript strict
- [x] CDK AuthStack: Cognito User Pool, App Client, custom:tenant_id + custom:roles attributes
- [x] CDK DatabaseStack: DynamoDB Tabellen (Tenants, Members, Structure, Events, Documents, Auth) + GSIs + PITR
- [ ] CDK ApiStack: API Gateway HTTP API, Lambda Authorizer, Routen
- [x] CDK StorageStack: S3 Bucket + CloudFront
- [ ] Lambda Authorizer: JWT-Validierung, Tenant-Extraktion, Tenant-Status-Cache (5 Min TTL)
- [ ] RBAC-Middleware: Rollen-Prüfung (superadmin, admin, abteilungsleiter, teamleiter, mitglied)
- [ ] API: POST /tenants, GET /tenants/me, PUT /tenants/me
- [ ] API: POST /auth/login, POST /auth/register, POST /auth/refresh
- [ ] API: GET/POST /members, GET/PUT /members/:id
- [ ] API: GET/POST /roles, PUT/DELETE /roles/:id
- [ ] Zod-Validierung an allen API-Boundaries
- [ ] OpenAPI-Dokumentation (openapi.yaml)

## Phase 2: Kernfunktionen (specs/phase-2-kernfunktionen.md)

- [ ] API: GET /structure, POST/PUT/DELETE /structure/nodes, PUT /structure/nodes/:id/reorder
- [ ] Vereinsstruktur: 3-Ebenen-Hierarchie, Ebenen-Labels pro Tenant konfigurierbar
- [ ] Mitglied-Datenmodell: alle Felder inkl. Bankdaten (verschlüsselt), Zuordnungen, Zeiträume
- [ ] API: vollständige /members CRUD + /members/:id/zuordnungen + /members/:id/mitgliedschaften
- [ ] Mitglieder-Filter: status, abteilung, team, geschlecht, alter, eintrittsdatum, search, pagination
- [ ] GET /members/export (Excel/CSV), POST /members/import (CSV mit Fehler-Report)
- [ ] GET /reports/verbandsmeldung + /export (A- und B-Meldung)
- [ ] Listen-System: smarte, statische und freie Listen mit Berechtigungen
- [ ] API: GET/POST /lists, GET/PUT/DELETE /lists/:id, /lists/:id/members, /lists/:id/permissions, /lists/:id/export
- [ ] Teams: Datenmodell, Teamleiter-Rechte, Beitrittsanfragen, Aufnahmestopp
- [ ] API: /departments/:id/teams, /teams/:id CRUD + members + leaders + requests
- [ ] GET /departments/:id/potential-members

## Phase 3: Kommunikation & Events (specs/phase-3-kommunikation-events.md)

- [ ] SES-Konfiguration: Shared Domain, Configuration Set, Bounce/Complaint-Handling
- [ ] E-Mail-Versand: Empfänger auflösen (Liste/Team/Abteilung/manuell), BCC-Batches via SQS
- [ ] Gruppenzahler-Fallback für Kinder ohne eigene E-Mail
- [ ] API: POST/GET /emails, POST /emails/:id/send, GET /emails/:id/recipients
- [ ] E-Mail-Vorlagen: GET/POST/PUT/DELETE /email-templates
- [ ] Quota-Enforcement: E-Mails/Monat pro Tier (500/5000/50000)
- [ ] Event-Datenmodell: einmalig + wiederkehrend (Instanz-Generierung 3 Monate voraus)
- [ ] Standortverwaltung: Belegungsplan, Überbuchungswarnung
- [ ] API: vollständige /events CRUD + /events/calendar + RSVP
- [ ] API: /locations CRUD + /locations/:id/schedule + /locations/:id/availability
- [ ] Dokumente: Pre-Signed Upload/Download URLs, Sichtbarkeitssteuerung
- [ ] API: /documents CRUD + /documents/upload-url + /documents/:id/download
- [ ] Speicher-Limits pro Tier (1/10/100 GB)

## Phase 4: Portal & Check-in (specs/phase-4-portal-checkin.md)

- [ ] Öffentliches Portal: Subdomain-Routing, Seiten (Startseite, Abteilungen, Kalender, Dokumente)
- [ ] Portal-Konfiguration: Branding (Farben, Logo), Impressum, Datenschutz, Custom Domain (Premium)
- [ ] Sichtbarkeits-Matrix: öffentlich/intern/Team korrekt durchsetzen
- [ ] Mitglieder-Login-Bereich: Profil, Teams, Kalender, Dokumente, Benachrichtigungen
- [ ] Profil-Selbstverwaltung: E-Mail (mit Bestätigung), Telefon, Adresse, Bankdaten
- [ ] Änderungs-Audit: jede Profil-Änderung protokollieren
- [ ] Check-in: QR-Code-Generierung (zeitlich begrenzt), QR-Scan-Validierung, manueller Check-in
- [ ] Check-in: Doppel-Check-in verhindern (idempotent), Anwesenheitsstatistik
- [ ] API: /checkins CRUD + /checkins/:id/scan + /checkins/:id/qr-code
- [ ] API: /teams/:id/attendance + export, /members/:id/attendance
- [ ] Online-Mitgliedsantrag: konfigurierbares Formular, Duplikat-Prüfung, Spam-Schutz
- [ ] Antrags-Flow: Validierung → Bestätigungs-E-Mail → Admin-Benachrichtigung → Annehmen/Ablehnen → Mitglied anlegen
- [ ] PDF-Generierung bei Annahme (Antrag + SEPA-Mandat)
- [ ] API: GET /application/config, POST /application/submit, /applications CRUD + accept/reject
- [ ] In-App Benachrichtigungen: alle Auslöser implementieren
- [ ] API: /notifications + /notifications/:id/read + /notifications/read-all + /notifications/unread-count

## Phase 5: Billing & Go-to-Market (specs/phase-5-billing-go-to-market.md)

- [ ] Stripe-Integration: Produkte + Preise anlegen (Starter/Standard/Premium, monatlich + jährlich)
- [ ] Stripe Checkout Session + Customer Portal
- [ ] Webhook-Handler: alle relevanten Events, Signatur-Verifizierung, Idempotenz via SQS
- [ ] Subscription-Datenmodell in DynamoDB, Trial-Logik (30 Tage)
- [ ] Plan-Upgrade (sofort + Proration) und Downgrade (Periodenende + Limit-Prüfung)
- [ ] Grace Period bei Zahlungsausfall (10 Tage → Read-Only)
- [ ] Quota-Enforcement: Mitglieder, Admins, Speicher, E-Mails, Abteilungen, Teams (402 bei Überschreitung)
- [ ] Usage-Events via EventBridge
- [ ] API: /billing/subscription, /billing/checkout, /billing/portal, /billing/invoices, /billing/usage, /billing/change-plan, /billing/cancel, /billing/reactivate, /webhooks/stripe
- [ ] Self-Service Registrierung: POST /register + E-Mail-Verifizierung
- [ ] Setup-Wizard: 4 Schritte, überspringbar, Status in DynamoDB
- [ ] CSV-Import mit Spalten-Mapping UI und Fortschrittsanzeige
- [ ] Verwalter-Einladung: E-Mail → Registrierung → Rolle
- [ ] API: /onboarding/status, /onboarding/step/:step, /members/import, /invitations CRUD + accept
- [ ] Trial-Erinnerungs-E-Mails (7 Tage + 1 Tag vor Ablauf)
- [ ] Tenant-Lifecycle: Trial → Active → Past Due → Canceled → Expired → Deleted
- [ ] CloudWatch Dashboards + Alerting
- [ ] DSGVO: Datenexport (Art. 20) + Datenlöschung (Art. 17)
- [ ] DynamoDB PITR aktivieren, S3 Versioning

## Phase 6: Differenzierung & Wachstum (specs/phase-6-differenzierung-wachstum.md)

- [ ] Beitragsarten: Betrag (Cent), Rhythmus, Zuordnung, Ermäßigungen
- [ ] Mitgliedsbeiträge: automatische Generierung, Mahnwesen (3 Stufen)
- [ ] SEPA-XML (PAIN.008): Sammellastschrift generieren, Rückläufer erfassen
- [ ] API: /fees/types CRUD, /fees, /fees/generate, /fees/sepa, /fees/reminders
- [ ] Kassenbuch: Buchungen, Kategorien, Belege (S3), Abteilungs-Zuordnung
- [ ] Berichte: Kassenbericht, Jahresabschluss, DATEV-Export
- [ ] API: /finance/bookings CRUD, /finance/reports/*, /finance/export/datev
- [ ] Automatisierungs-Engine: datum-, ereignis- und zeitplan-basierte Trigger
- [ ] Vordefinierte Automatisierungen (Geburtstag, Jubiläum, Beitrags-Erinnerung, Willkommens-Mail)
- [ ] API: /automations CRUD + test + history
- [ ] Umfragen & Abstimmungen: alle Fragetypen, anonyme Abstimmung, Ergebnis-Export
- [ ] API: /surveys CRUD + publish + responses + results
- [ ] iCal-Feed: pro Mitglied/Team, Token-Auth, Google Calendar kompatibel
- [ ] Verbandsmeldung-Export: Excel/CSV/XML je nach LSB-Format
- [ ] Statistik-Dashboard: Mitgliederentwicklung, Demografie, Anwesenheit, Finanzen
- [ ] API: /statistics/overview, /statistics/members, /statistics/attendance, /statistics/finance
- [ ] PWA: installierbar, QR-Check-in via Kamera, Web Push Notifications, Offline-Caching

## Completed

- [x] Projekt-Initialisierung
- [x] Ralph-Setup (.kiro/PROMPT.md, ralph_loop.sh Fix)

## Notes

- Implementiere immer eine vollständige Phase bevor du zur nächsten wechselst
- Alle Beträge in Cent (Integer), niemals Floats
- Tenant-Isolation ist nicht verhandelbar — jeder DAL-Zugriff muss TENANT# Prefix erzwingen
- Region: eu-central-1 (Frankfurt)
- Pnpm Workspaces: frontend/, backend/, schema/
