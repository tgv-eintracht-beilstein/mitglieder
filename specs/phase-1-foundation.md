# Phase 1: Foundation — Detaillierte Spezifikation

## Ziel

Technische Grundlage schaffen: Multi-Tenant-Architektur, Authentifizierung, Autorisierung und Datenmodell. Am Ende von Phase 1 existiert eine deploybare Infrastruktur, die einen Verein (Tenant) anlegen, einen Benutzer authentifizieren und rollenbasiert auf geschützte API-Endpunkte zugreifen lässt.

---

## 1.1 Projekt-Setup & Repository-Struktur

### Zielstruktur

```
/
├── frontend/                # React + TypeScript + Tailwind (Vite)
│   ├── src/
│   │   ├── features/        # Feature-Module (auth/, verein/, mitglieder/)
│   │   ├── components/      # Shared UI-Komponenten
│   │   ├── hooks/           # Custom Hooks (useAuth, useTenant)
│   │   ├── contexts/        # React Contexts (TenantContext, AuthContext)
│   │   ├── utils/           # Hilfsfunktionen
│   │   └── styles/          # Tailwind Config, globale Styles
│   └── package.json
├── backend/
│   ├── functions/           # Lambda Handler
│   │   ├── authorizer/      # JWT-Validierung + Tenant-Injection
│   │   ├── api/             # API-Endpunkte
│   │   └── admin/           # Tenant-Management
│   ├── lib/                 # Business Logic
│   │   ├── auth/            # RBAC-Prüfungen
│   │   ├── tenants/         # Tenant-Isolation
│   │   └── validation/      # Input-Validierung
│   ├── db/                  # Data Access Layer (Tenant-aware)
│   └── infrastructure/      # CDK Stacks
│       ├── api-stack.ts
│       ├── database-stack.ts
│       ├── auth-stack.ts
│       └── storage-stack.ts
├── schema/
│   ├── openapi.yaml         # API-Spezifikation
│   └── types/               # Shared TypeScript Types
└── .kiro/
```

### Konventionen

- Sprache Backend: TypeScript (Node.js 20 Runtime)
- Sprache Frontend: TypeScript (strict mode)
- IaC: AWS CDK v2 (TypeScript)
- Monorepo: pnpm Workspaces
- Linting: ESLint + Prettier
- Region: eu-central-1 (Frankfurt)

---

## 1.2 Multi-Tenant Datenmodell

### Grundprinzip

- **1 Tenant = 1 Verein**
- Alle DynamoDB-Keys beginnen mit `TENANT#<vereinId>`
- Kein Cross-Tenant-Zugriff möglich (erzwungen durch Authorizer + Data Access Layer)

### Tabellen-Übersicht

| Tabelle | Zweck | Partition Key | Sort Key |
|---------|-------|---------------|----------|
| `Tenants` | Verein-Stammdaten, Subscription-Status | `TENANT#<id>` | `META` |
| `Members` | Mitglieder eines Vereins | `TENANT#<vereinId>#MEMBER#<id>` | `PROFILE` / `MEMBERSHIP#<timestamp>` |
| `Structure` | Vereinsstruktur (Abteilungen, Teams) | `TENANT#<vereinId>#DEPT#<abteilungId>` | `META` / `TEAM#<teamId>` |
| `Events` | Veranstaltungen | `TENANT#<vereinId>#EVENT#<id>` | `META` / `GUEST#<memberId>` |
| `Documents` | Dokument-Metadaten | `TENANT#<vereinId>#DOC#<id>` | `META` |
| `Auth` | Rollen & Berechtigungen | `TENANT#<vereinId>#ROLE#<roleId>` | `META` / `PERMISSION#<resource>` |

### GSI-Design (vorläufig)

| GSI | Partition Key | Sort Key | Zweck |
|-----|---------------|----------|-------|
| `MembersByEmail` | `TENANT#<vereinId>#EMAIL#<email>` | — | Eindeutigkeitsprüfung |
| `MembersByDept` | `TENANT#<vereinId>#DEPT#<abteilungId>` | `MEMBER#<id>` | Mitglieder pro Abteilung |
| `EventsByDate` | `TENANT#<vereinId>` | `DATE#<isoDate>#EVENT#<id>` | Kalender-Queries |
| `UserByAuth` | `AUTH#<cognitoSub>` | `TENANT#<vereinId>` | Auth-Sub → Tenant-Mapping |

### Tenant-Entity

```
{
  pk: "TENANT#abc123",
  sk: "META",
  name: "TG Villingen",
  slug: "tg-villingen",
  logo_url: "s3://...",
  subscription_status: "trial" | "active" | "past_due" | "canceled",
  subscription_tier: "starter" | "standard" | "premium",
  trial_ends_at: "2026-07-01T00:00:00Z",
  stripe_customer_id: "cus_...",
  settings: {
    structure_labels: ["Verein", "Altersklasse", "Mannschaft"],
    default_language: "de",
    timezone: "Europe/Berlin"
  },
  created_at: "2026-05-12T10:00:00Z",
  updated_at: "2026-05-12T10:00:00Z"
}
```

---

## 1.3 Authentifizierung (AWS Cognito)

### Setup

- **Cognito User Pool**: Shared (alle Vereine), Tenant-Zuordnung über Custom Attributes
- **Custom Attribute**: `custom:tenant_id` (gesetzt bei Registrierung)
- **Custom Attribute**: `custom:roles` (JSON-Array, z.B. `["superadmin"]`)
- **App Client**: Für Frontend (PKCE Flow, kein Client Secret)
- **Hosted UI**: Optional für schnellen Start, später Custom Login

### Registrierungs-Flow

1. Neuer Verein wird angelegt (Tenant-Entity in DynamoDB)
2. Admin-User wird in Cognito erstellt mit `custom:tenant_id = <vereinId>`
3. `custom:roles = ["superadmin"]` wird gesetzt
4. Bestätigungs-E-Mail wird versendet
5. Nach Bestätigung: Login → JWT mit Tenant-Claims

### JWT Token Claims (nach Authorizer-Anreicherung)

```json
{
  "sub": "cognito-user-id",
  "custom:tenant_id": "abc123",
  "custom:roles": "[\"superadmin\"]",
  "email": "admin@tg-villingen.de",
  "email_verified": true
}
```

### Passwort-Policy

- Mindestens 8 Zeichen
- Groß-/Kleinbuchstaben + Zahl
- Kein Sonderzeichen erzwungen (Vereins-Ehrenamtliche als Zielgruppe)

---

## 1.4 Lambda Authorizer

### Aufgabe

Jeder API-Request durchläuft den Authorizer. Dieser:

1. Validiert das JWT (Signatur, Expiry, Issuer)
2. Extrahiert `tenant_id` aus Custom Claims
3. Extrahiert `roles` aus Custom Claims
4. Prüft ob Tenant aktiv ist (Cache, TTL 5 Min)
5. Injiziert in `requestContext.authorizer`:
   - `tenantId`
   - `userId` (Cognito Sub)
   - `roles` (Array)
   - `email`

### Fehlerbehandlung

| Szenario | Response |
|----------|----------|
| Kein Token | 401 Unauthorized |
| Ungültiges Token | 401 Unauthorized |
| Token abgelaufen | 401 Unauthorized |
| Tenant inaktiv/gesperrt | 403 Forbidden |
| Tenant nicht gefunden | 403 Forbidden |

### Caching

- Tenant-Status wird im Lambda-Memory gecacht (Cold Start: DynamoDB Lookup)
- TTL: 5 Minuten
- Invalidierung bei Subscription-Änderung über EventBridge

---

## 1.5 RBAC (Role-Based Access Control)

### Rollen-Hierarchie

| Rolle | Scope | Beschreibung |
|-------|-------|-------------|
| `superadmin` | Gesamter Verein | Vollzugriff auf alle Daten und Einstellungen |
| `admin` | Gesamter Verein | Wie Superadmin, aber kann keine Admins verwalten |
| `abteilungsleiter` | 1+ Abteilungen | Verwaltet zugewiesene Abteilungen und deren Teams |
| `teamleiter` | 1+ Teams | Verwaltet zugewiesene Teams (konfigurierbare Rechte) |
| `mitglied` | Eigenes Profil | Lese-/Schreibzugriff auf eigenes Profil, Portal-Ansicht |

### Berechtigungs-Matrix (Phase 1 — Basis)

| Ressource | superadmin | admin | abteilungsleiter | teamleiter | mitglied |
|-----------|:---:|:---:|:---:|:---:|:---:|
| Vereinseinstellungen | ✅ | ✅ | ❌ | ❌ | ❌ |
| Alle Mitglieder lesen | ✅ | ✅ | Nur eigene Abt. | Nur eigenes Team | ❌ |
| Mitglied bearbeiten | ✅ | ✅ | Nur eigene Abt. | ❌ | Nur eigenes Profil |
| Mitglied anlegen | ✅ | ✅ | ✅ | ❌ | ❌ |
| Rollen verwalten | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admins verwalten | ✅ | ❌ | ❌ | ❌ | ❌ |
| Abteilung verwalten | ✅ | ✅ | Nur eigene | ❌ | ❌ |
| Team verwalten | ✅ | ✅ | Nur eigene Abt. | Nur eigenes | ❌ |

### Rollen-Zuweisung (Datenmodell)

```
{
  pk: "TENANT#abc123#ROLE#role_001",
  sk: "META",
  name: "Abteilungsleiter Fußball",
  type: "abteilungsleiter",
  user_id: "cognito-sub-xyz",
  scope: {
    abteilungen: ["abt_fussball"],
    teams: []  // leer = alle Teams der Abteilung
  },
  permissions: {
    members: { read: true, write: true, delete: false },
    events: { read: true, write: true, delete: true },
    documents: { read: true, write: true, delete: false },
    finances: { read: false, write: false, delete: false }
  },
  created_at: "2026-05-12T10:00:00Z"
}
```

---

## 1.6 API-Design (Phase 1 Endpunkte)

### Base URL

`https://api.vereinssoftware.de/v1`

### Endpunkte Phase 1

| Method | Path | Beschreibung | Rollen |
|--------|------|-------------|--------|
| POST | `/tenants` | Neuen Verein registrieren | Public (kein Auth) |
| GET | `/tenants/me` | Eigenen Verein abrufen | Alle authentifizierten |
| PUT | `/tenants/me` | Vereinseinstellungen ändern | superadmin, admin |
| POST | `/auth/login` | Login (Cognito) | Public |
| POST | `/auth/register` | Registrierung | Public |
| POST | `/auth/refresh` | Token erneuern | Authentifiziert |
| GET | `/members` | Mitglieder auflisten (paginiert) | Rollenabhängig |
| POST | `/members` | Mitglied anlegen | superadmin, admin, abteilungsleiter |
| GET | `/members/:id` | Mitglied-Detail | Rollenabhängig |
| PUT | `/members/:id` | Mitglied bearbeiten | Rollenabhängig |
| GET | `/roles` | Rollen auflisten | superadmin |
| POST | `/roles` | Rolle anlegen | superadmin |
| PUT | `/roles/:id` | Rolle bearbeiten | superadmin |
| DELETE | `/roles/:id` | Rolle löschen | superadmin |

### Response-Format

**Erfolg:**
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "page_size": 50,
    "total": 234,
    "next_token": "..."
  }
}
```

**Fehler:**
```json
{
  "error": {
    "code": "MEMBER_NOT_FOUND",
    "message": "Mitglied mit ID xyz wurde nicht gefunden.",
    "details": {}
  }
}
```

---

## 1.7 Infrastruktur (CDK Stacks)

### Stack-Aufteilung

| Stack | Ressourcen |
|-------|-----------|
| `AuthStack` | Cognito User Pool, App Client, Custom Attributes |
| `DatabaseStack` | DynamoDB Tabellen, GSIs, PITR aktiviert |
| `ApiStack` | API Gateway (HTTP API), Lambda Authorizer, Routen |
| `StorageStack` | S3 Bucket (Dokumente/Bilder), CloudFront Distribution |
| `MonitoringStack` | CloudWatch Dashboards, Alarms, Log Groups |

### Environments

| Environment | Account | Zweck |
|-------------|---------|-------|
| `dev` | Development | Lokale Entwicklung, DynamoDB Local |
| `staging` | Staging | Integration Tests, Preview |
| `prod` | Production | Live-Betrieb |

### CI/CD

- GitHub Actions
- Trigger: Push auf `main` → Deploy Staging
- Trigger: Release Tag → Deploy Production
- Tests müssen grün sein vor Deploy
- CDK Diff als PR-Kommentar

---

## 1.8 Sicherheitsanforderungen

| Anforderung | Umsetzung |
|-------------|-----------|
| Verschlüsselung at rest | DynamoDB Default Encryption, S3 SSE-S3 |
| Verschlüsselung in transit | TLS 1.2+ (API Gateway erzwingt HTTPS) |
| Tenant-Isolation | Authorizer injiziert Tenant-ID, DAL erzwingt Prefix |
| Secrets Management | AWS Secrets Manager (DB-Credentials, API-Keys) |
| Input Validation | Zod-Schemas an API-Boundary |
| Rate Limiting | API Gateway Throttling (1000 req/s default, pro Tenant konfigurierbar) |
| CORS | Nur eigene Domain(s) erlaubt |
| DSGVO | Daten nur in eu-central-1, Lösch-Endpunkt geplant |

---

## 1.9 Akzeptanzkriterien Phase 1

- [ ] Ein neuer Verein kann sich registrieren (Tenant + Admin-User werden erstellt)
- [ ] Admin kann sich einloggen und erhält JWT mit Tenant-Claims
- [ ] Authorizer validiert Token und injiziert Tenant-Context
- [ ] API-Requests ohne/mit ungültigem Token werden mit 401 abgelehnt
- [ ] Admin kann Mitglieder anlegen, lesen, bearbeiten
- [ ] Mitglieder-Daten sind strikt Tenant-isoliert (kein Cross-Tenant-Zugriff)
- [ ] Rollen können angelegt und Benutzern zugewiesen werden
- [ ] Abteilungsleiter sieht nur Mitglieder seiner Abteilung
- [ ] Infrastruktur ist via CDK deploybar (dev + staging)
- [ ] API-Dokumentation (OpenAPI) ist aktuell und vollständig

---

## 1.10 Offene Entscheidungen

| Frage | Optionen | Empfehlung |
|-------|----------|-----------|
| Cognito Shared vs. Pool-per-Tenant | Shared Pool (günstiger) vs. Separate (isolierter) | Shared Pool mit Custom Attributes — skaliert besser, günstiger |
| API Gateway REST vs. HTTP API | REST (mehr Features) vs. HTTP (günstiger, schneller) | HTTP API — reicht für JWT Authorizer, 70% günstiger |
| Single-Table vs. Multi-Table DynamoDB | Single (komplex) vs. Multi (einfacher) | Multi-Table — einfacher zu warten, klare Boundaries |
| Frontend Framework | Vite + React vs. Next.js | Vite + React — SPA reicht, kein SSR nötig |
