# Weg von AWS — Bestandsaufnahme und Migrationsweg

> Status: **Entwurf / Entscheidungsgrundlage.** Zielplattform noch offen.

## Zuerst: es sind zwei Systeme, nicht eins

Das Repo enthält zwei getrennte Dinge, und „weg von AWS" trifft sie unterschiedlich hart:

| | Was | AWS-Bindung |
|---|---|---|
| **A — produktiv** | TGV-Mitgliederbereich (`backend/template.yaml`, SAM) | Mittel, gut lösbar |
| **B — geplant** | Multi-Tenant-Vereinssoftware (`infrastructure/`, `specs/phase-1…6`) | **Sehr tief** |

**A** ist eine überschaubare Sammlung von Endpunkten und lässt sich in Wochen umziehen.

**B** ist auf AWS-Primitive hin entworfen: DynamoDB mit Multi-Table- und GSI-Design, Cognito mit
Custom Attributes für Mandantentrennung, Lambda Authorizer, SES, EventBridge. Ein Plattform-
wechsel bedeutet dort keinen Umzug, sondern eine **Neukonzeption von Phase 1** — das Datenmodell
und das Auth-Konzept wären neu zu schreiben. Das sollte bewusst entschieden werden, bevor weiter
danach gebaut wird.

> Ehrliche Randbemerkung: Da ihr easyVerein bereits einsetzt und die Arbeitsstunden-Analyse
> gezeigt hat, wie viel dort schon vorhanden ist, lohnt vor der Neukonzeption von **B** die
> Frage, wie viel davon überhaupt noch gebaut werden soll. Das ist eine strategische
> Entscheidung, keine technische — aber sie spart im Zweifel die meiste Arbeit.

---

## Was heute wo läuft

**Bereits nicht auf AWS** — bleibt unverändert:
- Frontend: Next.js als statischer Export (`output: "export"`), gebaut mit Bun über GitHub
  Actions, ausgeliefert über **GitHub Pages** unter `mitglieder.tgveintrachtbeilstein.de`

**Auf AWS (produktiv, System A):**

| Baustein | Umfang |
|---|---|
| API Gateway (HTTP API) + Lambda | **19 Funktionen**, nodejs24.x |
| DynamoDB | 1 Tabelle (Formulare, Nachrichten, Sync-/Adressbuchdaten) |
| S3 + CloudFront + OAI | Dateien und PDFs, **mit Objektversionierung** (`list-file-versions.js`) |
| Cognito | User Pool, 2 App-Clients, **17 Gruppen**, Managed Login Branding |
| EventBridge | Nachrichtenzustellung (`send-message` → `process-message`) |
| Secrets Manager | easyVerein-API-Token |

**Auf AWS (geplant, System B):** CDK-Stacks für Tenants, Members, Structure, Events, Documents,
Auth — sechs DynamoDB-Tabellen mit GSIs, plus Cognito-Stack.

---

## Der Hebel: erst schrumpfen, dann umziehen

Der billigste Migrationsschritt ist der, den man nicht machen muss. Ein erheblicher Teil von
System A **dupliziert, was easyVerein ohnehin kann** — das gehört gelöscht, nicht umgezogen:

| Heute in AWS | easyVerein-Pendant | Empfehlung |
|---|---|---|
| `send-message`, `list-messages`, `archive-message`, `process-message` | Nachrichten, Chat, Forum | **Löschen** statt migrieren — spart DynamoDB *und* EventBridge |
| `list-files`, `get-file`, `delete-file`, `list-directory` | Dateiverwaltung mit Freigaben | Prüfen, ob easyVerein reicht |
| `get-announcements`, `get-my-data`, `get-my-documents` | — (sind bereits reine Proxys) | Bleiben, sind dünn |
| **Cognito (17 Gruppen)** | `member-group` + OAuth2/OIDC | **Ablösen** (s. u.) |

Die 17 Cognito-Gruppen (`vorstand`, `jugendvorstand`, `abt-fussball` …) bilden exakt das ab, was
easyVerein als `member-group` führt — und `get-my-data.js` liest diese Gruppen bereits von dort.
Die Doppelpflege besteht heute schon.

## Was danach übrig bleibt

Der echte, eigene Wert des Mitgliederbereichs — und der ist klein:

- **Die PDF-Formulare**: Reisekosten, Ehrenamts-/Übungsleiterpauschale, Ehrenkodex,
  Selbstverpflichtungserklärung, Mitgliedsantrag, Mitgliedsbeiträge (`src/lib/pdf-*.tsx`)
- **Formular-Einreichung + Ablage** (`submit-form`, `list-submissions`)
- **PDF-Signatur** (`sign-pdf`) und Datei-Upload
- **Adressbuch-/Sync-Funktion** (`sync-save`, `sync-load`)
- Künftig: der Arbeitsstunden-Automatikdienst

Das sind grob **8–10 Endpunkte, ein paar Megabyte Daten und einige Gigabyte Dateien.** Diese
Menge passt bequem auf einen einzelnen kleinen Server — die 19 Lambdas werden dabei zu *einer*
schlanken Node-Anwendung, was den Betrieb zusätzlich vereinfacht.

---

## Migration nach Bausteinen

| Baustein | Ziel | Aufwand |
|---|---|---|
| API Gateway + 19 Lambdas | Eine Node-App (Hono/Express) hinter Caddy | **Mittel**, überwiegend mechanisch |
| **S3** | S3-kompatibler Speicher (Hetzner Object Storage, MinIO, Garage) | **Gering** — `@aws-sdk/client-s3` bleibt, nur Endpoint/Credentials ändern sich ⚠️ Versionierung muss das Ziel unterstützen |
| **DynamoDB** | PostgreSQL (Tabelle mit `pk`/`sk` + JSONB) | **Mittel** — das Zugriffsmuster ist trivial (Key-Value mit Präfix-Query) |
| EventBridge | Direkter Aufruf oder kleine Queue — **oder entfällt** mit den Nachrichten | Gering |
| CloudFront | Caddy mit TLS, optional CDN davor | Gering |
| Secrets Manager | Umgebungsvariablen / Docker Secrets | Gering |
| **Cognito** | easyVerein als OIDC-Provider | **Hoch — der kritische Punkt** |
| Frontend | Bleibt auf GitHub Pages | — |

## Der kritische Punkt: Cognito ablösen

Alles andere ist Handwerk; hier liegt das eigentliche Risiko.

**Der elegante Weg:** easyVerein bietet `oauth2-application`, `oauth2-custom-claim` und die
Einstellung `allowOIDCPublicApplications` — es kann also als Identity Provider dienen. Mitglieder
melden sich mit ihrem easyVerein-Zugang an, die Mitgliedsgruppen kommen als Claims mit, und die
17 doppelt gepflegten Cognito-Gruppen entfallen ersatzlos. Das passt zur Linie aus der
Arbeitsstunden-Analyse: **ein System, nicht zwei.**

**Die Risiken, ehrlich benannt:**
- Bestehende Nutzer melden sich künftig mit **anderen Zugangsdaten** an. Das ist kein technisches,
  sondern ein Kommunikationsproblem — muss aber geplant werden.
- Zu prüfen: Hat jede Person, die den Mitgliederbereich heute nutzt, einen aktiven
  easyVerein-Zugang? Funktionsaccounts (Geschäftsstelle, Kassenprüfer) evtl. nicht.
- Die Berechtigungslogik hängt heute an `cognito:groups` im ID-Token (`src/lib/auth.ts`,
  `getGroups()`). Das Mapping easyVerein-Gruppe → Claim muss sauber sitzen, sonst verlieren
  Leute Zugriff.
- **Fallback festlegen**, falls easyVerein-OIDC in der Praxis nicht trägt: dann bräuchte es einen
  eigenen Identity Provider (Zitadel, Authentik, Keycloak) — was wieder ein System zum Betreiben
  bedeutet und dem Vereinfachungsziel zuwiderläuft.

**Empfehlung:** OIDC früh an einem Testzugang verifizieren — **bevor** der Rest migriert wird.
Trägt es nicht, ändert das die Reihenfolge und den Zuschnitt.

## Zielbild (Empfehlung, sofern kein anderer Treiber dagegensteht)

Ein kleiner Server bei einem deutschen Anbieter, alles in Docker Compose:

```
Caddy (TLS, Reverse Proxy)
  └── Node-App (die ~10 Endpunkte + Arbeitsstunden-Automatik)
        ├── PostgreSQL          (ehemals DynamoDB)
        └── S3-kompatibler Speicher (ehemals S3, versioniert)
Auth: easyVerein OIDC           (ehemals Cognito)
Frontend: GitHub Pages          (unverändert)
```

**Warum das:** deutscher Anbieter und damit die Datenhoheits-Frage sauber; kein Lock-in mehr;
Größenordnung unter 10 €/Monat (vor Buchung prüfen); und weil `@aws-sdk/client-s3` gegen
S3-kompatible Speicher weiterläuft, bleibt der Datei-Teil des Codes nahezu unverändert.

**Der Preis dafür:** ihr betreibt wieder einen Server — Updates, Backups, Monitoring. Bei einem
Verein ist das eine Bus-Faktor-Frage, keine technische. Wer das nicht will, nimmt eine verwaltete
Plattform in der EU und zahlt etwas mehr für weniger Betriebsarbeit. **Diese Abwägung solltet ihr
treffen, nicht ich** — sie hängt daran, wer die Wartung dauerhaft übernimmt.

## Sinnvolle Reihenfolge

1. **easyVerein-OIDC verifizieren** (Testzugang) — entscheidet über alles Weitere
2. **Token-Refresh reparieren** — siehe `feature-arbeitsstunden.md`, betrifft schon heute den
   laufenden Betrieb
3. **Schrumpfen:** Nachrichten-Endpunkte abschalten, Dateiverwaltung gegen easyVerein prüfen
4. **19 Lambdas → eine Node-App** zusammenführen, noch auf AWS, mit Tests
5. **Speicher umziehen** (S3 → S3-kompatibel), **Daten umziehen** (DynamoDB → Postgres)
6. **Auth umstellen** (Cognito → OIDC), mit Ankündigung an die Mitglieder
7. AWS-Konto leerräumen; CDK-Stacks von System B entscheiden (neu konzipieren oder verwerfen)

Die Schritte 1–4 lohnen sich unabhängig davon, wo ihr am Ende landet — sie verkleinern das
System, bevor es umzieht.

## Noch zu entscheiden

1. **Was ist der Treiber?** Kosten, Datenhoheit, Betriebsaufwand oder Lock-in — das ändert die
   Zielplattform.
2. **Selbst betreiben oder verwaltet?** Bus-Faktor gegen laufende Kosten.
3. **Was passiert mit System B** (Multi-Tenant-Vereinssoftware)? Neu konzipieren, pausieren oder
   verwerfen — vor weiterem Bau zu klären.
4. **Zeitrahmen** — und ob der Arbeitsstunden-Prototyp im Oktober noch auf AWS entstehen darf
   (schneller) oder gleich auf der neuen Plattform (kein Wegwerf-Aufwand).
