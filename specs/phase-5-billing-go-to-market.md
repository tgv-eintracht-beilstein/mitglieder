# Phase 5: Billing & Go-to-Market — Detaillierte Spezifikation

## Ziel

Monetarisierung implementieren: Stripe-basierte Abonnements, Tenant-Onboarding mit Self-Service-Registrierung, Usage-Metering und operativen Betrieb absichern. Am Ende von Phase 5 können Vereine sich selbst registrieren, eine Trial-Phase nutzen und auf ein bezahltes Abo upgraden.

---

## 5.1 Subscription-Modell & Pricing

### Pricing-Tiers

| | Starter | Standard | Premium |
|---|---|---|---|
| **Preis** | 9,90 €/Monat | 29,90 €/Monat | 79,90 €/Monat |
| **Mitglieder** | bis 100 | bis 500 | unbegrenzt |
| **Admins/Verwalter** | 3 | 10 | unbegrenzt |
| **Speicherplatz** | 1 GB | 10 GB | 100 GB |
| **E-Mails/Monat** | 500 | 5.000 | 50.000 |
| **Abteilungen** | 3 | 10 | unbegrenzt |
| **Teams** | 10 | 50 | unbegrenzt |
| **Online-Antrag** | ✅ | ✅ | ✅ |
| **Check-in** | ❌ | ✅ | ✅ |
| **Verbandsmeldung** | Basis | Erweitert | Erweitert + Export |
| **Custom Domain** | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ |
| **API-Zugang** | ❌ | ❌ | ✅ |

### Jahresabo-Rabatt

- 2 Monate gratis bei jährlicher Zahlung
- Starter: 99 €/Jahr (statt 118,80 €)
- Standard: 299 €/Jahr (statt 358,80 €)
- Premium: 799 €/Jahr (statt 958,80 €)

### Trial-Periode

- 30 Tage kostenlos (Standard-Features)
- Keine Kreditkarte erforderlich bei Registrierung
- 7 Tage vor Ablauf: Erinnerungs-E-Mail
- 1 Tag vor Ablauf: Letzte Warnung
- Nach Ablauf: Read-Only Modus (Daten bleiben erhalten, keine neuen Aktionen)
- 30 Tage nach Ablauf ohne Upgrade: Daten-Löschung angekündigt
- 60 Tage nach Ablauf: Daten gelöscht (mit vorheriger Warnung)

---

## 5.2 Stripe-Integration

### Datenmodell: Subscription

```
Subscription {
  tenant_id: string
  
  // Stripe-Referenzen
  stripe_customer_id: string
  stripe_subscription_id: string?
  stripe_payment_method_id: string?
  
  // Status
  status: "trial" | "active" | "past_due" | "canceled" | "expired"
  tier: "starter" | "standard" | "premium"
  billing_interval: "monthly" | "yearly"
  
  // Zeiträume
  trial_start: string?
  trial_end: string?
  current_period_start: string
  current_period_end: string
  canceled_at: string?
  cancel_at_period_end: boolean
  
  // Zahlungsinformationen
  zahlungsmethode: {
    typ: "sepa" | "kreditkarte"
    letzte_vier: string?             // Letzte 4 Ziffern
    ablaufdatum: string?             // MM/YY (bei Kreditkarte)
    iban_letzte_vier: string?        // Letzte 4 der IBAN (bei SEPA)
  }?
  
  // Usage (aktueller Abrechnungszeitraum)
  usage: {
    mitglieder_aktuell: number
    speicher_bytes: number
    emails_gesendet: number
    admins_aktuell: number
  }
  
  // Rechnungsadresse
  rechnungsadresse: {
    name: string                     // Vereinsname
    strasse: string
    plz: string
    ort: string
    land: string
    ust_id: string?                  // Umsatzsteuer-ID (optional)
  }
  
  updated_at: string
}
```

### Stripe-Produkte & Preise

| Stripe Product | Price (Monthly) | Price (Yearly) |
|---|---|---|
| `vereinssoftware_starter` | 990 cents EUR | 9900 cents EUR |
| `vereinssoftware_standard` | 2990 cents EUR | 29900 cents EUR |
| `vereinssoftware_premium` | 7990 cents EUR | 79900 cents EUR |

**Wichtig:** Alle Beträge in Cent (Integer), niemals Floats.

### Webhook-Events (Stripe → Backend)

| Event | Aktion |
|-------|--------|
| `customer.subscription.created` | Subscription-Status auf "active" setzen |
| `customer.subscription.updated` | Tier/Status aktualisieren |
| `customer.subscription.deleted` | Status auf "canceled" setzen |
| `invoice.payment_succeeded` | Rechnung als bezahlt markieren |
| `invoice.payment_failed` | Status auf "past_due", Grace Period starten |
| `customer.subscription.trial_will_end` | Erinnerungs-E-Mail senden (3 Tage vorher) |

### Webhook-Sicherheit

- Signatur-Verifizierung mit Stripe Webhook Secret
- Idempotenz: Event-ID speichern, Duplikate ignorieren
- Async-Verarbeitung: 200 sofort zurückgeben, in SQS Queue verarbeiten
- Retry-Handling: Stripe sendet bis zu 3 Tage lang erneut

### Payment Failure & Grace Period

1. Zahlung fehlgeschlagen → Status: `past_due`
2. Tag 1: E-Mail "Zahlung fehlgeschlagen, bitte Zahlungsmethode aktualisieren"
3. Tag 3: Zweite Erinnerung
4. Tag 7: Letzte Warnung "Zugang wird in 3 Tagen eingeschränkt"
5. Tag 10: Read-Only Modus (keine neuen Mitglieder, Events etc.)
6. Tag 30: Subscription gekündigt, Daten-Löschung angekündigt

### Plan-Wechsel (Upgrade/Downgrade)

**Upgrade:**
- Sofort wirksam
- Proration: Restbetrag des alten Plans wird gutgeschrieben
- Stripe berechnet automatisch den Differenzbetrag

**Downgrade:**
- Wirksam zum Ende des aktuellen Abrechnungszeitraums
- Prüfung ob aktuelle Nutzung ins neue Tier passt
- Warnung wenn Limits überschritten werden (z.B. "Sie haben 150 Mitglieder, Starter erlaubt nur 100")
- Downgrade wird blockiert wenn Limits nicht eingehalten werden können

### API-Endpunkte (Billing)

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/billing/subscription` | Aktuelle Subscription |
| POST | `/billing/checkout` | Stripe Checkout Session erstellen |
| POST | `/billing/portal` | Stripe Customer Portal Session |
| GET | `/billing/invoices` | Rechnungshistorie |
| GET | `/billing/usage` | Aktuelle Nutzung vs. Limits |
| POST | `/billing/change-plan` | Plan wechseln |
| POST | `/billing/cancel` | Kündigung (zum Periodenende) |
| POST | `/billing/reactivate` | Kündigung widerrufen |
| POST | `/webhooks/stripe` | Stripe Webhook Endpoint |

---

## 5.3 Usage-Metering & Quota-Enforcement

### Gemessene Ressourcen

| Ressource | Messung | Enforcement |
|-----------|---------|-------------|
| Mitglieder | Anzahl aktiver Mitglieder | Hard Limit (kein neues Mitglied über Limit) |
| Admins/Verwalter | Anzahl Benutzer mit Admin-Rolle | Hard Limit |
| Speicherplatz | Summe aller Dokumente in S3 | Hard Limit (kein Upload über Limit) |
| E-Mails | Gesendete E-Mails im Abrechnungszeitraum | Soft Limit (Warnung bei 80%, Block bei 100%) |
| Abteilungen | Anzahl Abteilungen | Hard Limit |
| Teams | Anzahl Teams | Hard Limit |

### Quota-Prüfung

Bei jeder relevanten Aktion wird geprüft:

```
QuotaPruefung {
  // Input
  tenant_id: string
  ressource: "mitglieder" | "admins" | "speicher" | "emails" | "abteilungen" | "teams"
  
  // Ergebnis
  erlaubt: boolean
  aktuell: number
  limit: number
  prozent_genutzt: number
  nachricht: string?                 // z.B. "Sie haben 95% Ihres Speicherplatzes verbraucht"
}
```

### Quota-Überschreitung Response

```json
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Mitglieder-Limit erreicht. Ihr Starter-Plan erlaubt maximal 100 Mitglieder.",
    "details": {
      "ressource": "mitglieder",
      "aktuell": 100,
      "limit": 100,
      "upgrade_url": "/billing/change-plan"
    }
  }
}
```

HTTP Status: `402 Payment Required`

### Usage-Events (EventBridge)

Jede billable Aktion publiziert ein Event:

```json
{
  "source": "vereinssoftware.usage",
  "detail-type": "UsageEvent",
  "detail": {
    "tenant_id": "abc123",
    "event_type": "email_sent",
    "quantity": 1,
    "timestamp": "2026-05-12T14:30:00Z"
  }
}
```

Event-Typen:
- `member_created` / `member_deleted`
- `email_sent`
- `document_uploaded` / `document_deleted`
- `department_created` / `department_deleted`
- `team_created` / `team_deleted`

---

## 5.4 Tenant-Onboarding

### Registrierungs-Flow

1. **Landing Page:**
   - Pricing-Übersicht
   - "Kostenlos testen" Button
   
2. **Registrierungsformular:**
   - Vereinsname
   - Admin-Name (Vor-/Nachname)
   - E-Mail-Adresse
   - Passwort
   - Akzeptanz AGB + Datenschutz
   
3. **E-Mail-Bestätigung:**
   - Verifizierungs-Link per E-Mail
   - 24h gültig
   
4. **Setup-Wizard (nach Login):**
   - Schritt 1: Vereinsdaten vervollständigen (Adresse, Logo)
   - Schritt 2: Vereinsstruktur anlegen (Ebenen-Labels, erste Abteilung)
   - Schritt 3: Erste Mitglieder anlegen oder CSV-Import
   - Schritt 4: Weitere Verwalter einladen (optional)
   - Überspringbar (jeder Schritt)

5. **Trial startet:**
   - 30 Tage Standard-Features
   - Dashboard zeigt verbleibende Trial-Tage
   - Hinweis auf Upgrade-Möglichkeit

### Setup-Wizard Datenmodell

```
OnboardingStatus {
  tenant_id: string
  
  schritte: {
    vereinsdaten: "offen" | "abgeschlossen" | "übersprungen"
    struktur: "offen" | "abgeschlossen" | "übersprungen"
    mitglieder: "offen" | "abgeschlossen" | "übersprungen"
    verwalter: "offen" | "abgeschlossen" | "übersprungen"
  }
  
  wizard_abgeschlossen: boolean
  wizard_abgeschlossen_am: string?
}
```

### CSV-Import (Mitglieder)

**Unterstützte Formate:** CSV, XLSX

**Erwartete Spalten (flexibel, Mapping im UI):**

| Spalte | Pflicht | Mapping |
|--------|---------|---------|
| Vorname | ✅ | `vorname` |
| Nachname | ✅ | `nachname` |
| Geburtsdatum | ✅ | `geburtsdatum` (diverse Formate: DD.MM.YYYY, YYYY-MM-DD) |
| E-Mail | ❌ | `email` |
| Straße | ❌ | `strasse` |
| PLZ | ❌ | `plz` |
| Ort | ❌ | `ort` |
| Telefon | ❌ | `telefon` |
| Eintrittsdatum | ❌ | `eintrittsdatum` |
| Abteilung | ❌ | `abteilung` (Name-Matching) |
| Mitgliedsnummer | ❌ | `mitgliedsnummer` |

**Import-Flow:**
1. Datei hochladen
2. Spalten-Mapping im UI (Drag & Drop oder Dropdown)
3. Vorschau der ersten 10 Zeilen
4. Validierung (Fehler werden angezeigt)
5. Import starten (async, Fortschrittsanzeige)
6. Ergebnis-Report: X importiert, Y Fehler (mit Details)

### Verwalter-Einladung

1. Admin gibt E-Mail + Rolle ein
2. Einladungs-E-Mail wird versendet
3. Eingeladener klickt Link → Registrierung mit vorausgefüllter Rolle
4. Nach Registrierung: Sofort Zugriff gemäß Rolle

```
Einladung {
  id: string
  tenant_id: string
  email: string
  rolle: string                      // z.B. "abteilungsleiter"
  scope: object?                     // z.B. { abteilungen: ["abt_fussball"] }
  eingeladen_von: string
  status: "ausstehend" | "angenommen" | "abgelaufen"
  gueltig_bis: string                // 7 Tage
  created_at: string
}
```

### API-Endpunkte (Onboarding)

| Method | Path | Beschreibung |
|--------|------|-------------|
| POST | `/register` | Verein + Admin registrieren |
| POST | `/register/verify` | E-Mail verifizieren |
| GET | `/onboarding/status` | Wizard-Status |
| PUT | `/onboarding/step/:step` | Schritt abschließen/überspringen |
| POST | `/members/import` | CSV-Import starten |
| GET | `/members/import/:id/status` | Import-Status |
| POST | `/invitations` | Verwalter einladen |
| GET | `/invitations` | Ausstehende Einladungen |
| DELETE | `/invitations/:id` | Einladung widerrufen |
| POST | `/invitations/:id/accept` | Einladung annehmen |

---

## 5.5 Betrieb & Monitoring

### CloudWatch Dashboards

**System-Dashboard:**
- API-Latenz (p50, p95, p99)
- Error Rate (4xx, 5xx)
- Lambda Invocations & Duration
- DynamoDB Read/Write Capacity
- SES Bounce/Complaint Rate

**Tenant-Dashboard:**
- Aktive Tenants
- Neue Registrierungen/Tag
- Trial → Paid Conversion Rate
- Churn Rate
- MRR (Monthly Recurring Revenue)
- Usage pro Tier (Durchschnitt)

### Alerting

| Alarm | Schwelle | Aktion |
|-------|----------|--------|
| API Error Rate > 5% | 5 Minuten | PagerDuty + Slack |
| API Latenz p99 > 3s | 10 Minuten | Slack |
| DynamoDB Throttling | Jedes Event | Slack |
| SES Bounce Rate > 5% | 1 Stunde | E-Mail an Ops |
| Lambda Errors > 10/min | 5 Minuten | PagerDuty |
| Neue Registrierung | Jedes Event | Slack (Info) |

### DSGVO-Compliance

**Datenexport (Art. 20 DSGVO):**
- Mitglied kann Export aller eigenen Daten anfordern
- Format: JSON + PDF
- Bereitstellung innerhalb 72h (async generiert)
- Download-Link per E-Mail (7 Tage gültig)

**Datenlöschung (Art. 17 DSGVO):**
- Mitglied kann Löschung beantragen
- Admin bestätigt Löschung
- Alle personenbezogenen Daten werden gelöscht
- Anonymisierte Statistik-Daten bleiben erhalten
- Audit-Log der Löschung (wer, wann, was)
- Löschung aus Backups nach 30 Tagen

**Datenverarbeitungsvertrag (AVV):**
- Template bereitstellen für Vereine
- Automatisch bei Registrierung akzeptiert
- Als PDF downloadbar

### Backup-Strategie

| Ressource | Methode | Retention |
|-----------|---------|-----------|
| DynamoDB | Point-in-Time Recovery (PITR) | 35 Tage |
| S3 (Dokumente) | Versioning + Lifecycle Rules | 90 Tage (alte Versionen) |
| Cognito | Export via API (regelmäßig) | 30 Tage |

### Tenant-Lifecycle

```
┌──────────┐    ┌────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐
│ Registr. │───▶│ Trial  │───▶│  Active  │───▶│ Canceled │───▶│ Deleted │
└──────────┘    └────────┘    └──────────┘    └──────────┘    └─────────┘
                     │              │                │
                     │              ▼                │
                     │         ┌──────────┐         │
                     └────────▶│ Expired  │─────────┘
                               └──────────┘
```

| Status | Zugriff | Dauer |
|--------|---------|-------|
| Trial | Voll (Standard-Features) | 30 Tage |
| Active | Voll (gemäß Tier) | Solange bezahlt |
| Past Due | Voll (Grace Period) | 10 Tage |
| Canceled | Read-Only | Bis Periodenende |
| Expired | Read-Only | 30 Tage |
| Deleted | Kein Zugriff, Daten gelöscht | — |

---

## 5.6 Akzeptanzkriterien Phase 5

### Billing
- [ ] Stripe Checkout funktioniert (Kreditkarte + SEPA)
- [ ] Subscription wird korrekt in DynamoDB gespeichert
- [ ] Webhooks werden verifiziert und idempotent verarbeitet
- [ ] Plan-Upgrade ist sofort wirksam mit Proration
- [ ] Plan-Downgrade wird zum Periodenende wirksam
- [ ] Downgrade wird blockiert wenn Limits überschritten
- [ ] Grace Period bei Zahlungsausfall funktioniert (10 Tage)
- [ ] Kündigung setzt Status auf "canceled" zum Periodenende
- [ ] Rechnungshistorie ist einsehbar
- [ ] Alle Beträge werden in Cent (Integer) verarbeitet

### Quota
- [ ] Mitglieder-Limit wird bei Erstellung geprüft
- [ ] Speicher-Limit wird bei Upload geprüft
- [ ] E-Mail-Limit wird bei Versand geprüft
- [ ] 402 Response mit Upgrade-Hinweis bei Überschreitung
- [ ] Usage-Dashboard zeigt aktuelle Nutzung vs. Limits

### Onboarding
- [ ] Self-Service Registrierung funktioniert (Verein + Admin)
- [ ] E-Mail-Verifizierung ist erforderlich
- [ ] Setup-Wizard führt durch Grundkonfiguration
- [ ] CSV-Import funktioniert mit Spalten-Mapping
- [ ] Verwalter können per E-Mail eingeladen werden
- [ ] Trial startet automatisch (30 Tage Standard)
- [ ] Erinnerungs-E-Mails werden vor Trial-Ende gesendet

### Betrieb
- [ ] CloudWatch Dashboards sind eingerichtet
- [ ] Alerting funktioniert bei Fehlerquoten
- [ ] DSGVO-Datenexport kann angefordert werden
- [ ] DSGVO-Datenlöschung kann durchgeführt werden
- [ ] DynamoDB PITR ist aktiviert
- [ ] Tenant-Lifecycle (Trial → Active → Canceled → Deleted) funktioniert
