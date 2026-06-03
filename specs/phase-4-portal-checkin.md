# Phase 4: Portal & Check-in — Detaillierte Spezifikation

## Ziel

Ein öffentliches Mitgliederportal (Vereins-Website), einen Login-Bereich für Mitglieder-Selbstverwaltung, ein digitales Check-in-System und den Online-Mitgliedsantrag implementieren. Am Ende von Phase 4 haben Vereine eine vollständige digitale Präsenz mit Interaktionsmöglichkeiten für Mitglieder.

---

## 4.1 Mitgliederportal (Öffentliche Vereinsseite)

### Konzept

Jeder Verein erhält ein öffentlich zugängliches Portal unter einer Subdomain oder einem Slug:
- `https://tg-villingen.vereinssoftware.de` (Subdomain)
- oder `https://app.vereinssoftware.de/v/tg-villingen` (Pfad-basiert)

Das Portal zeigt öffentliche Informationen und bietet einen Login-Bereich für Mitglieder.

### Seiten-Struktur (öffentlich, ohne Login)

| Seite | Inhalt | Datenquelle |
|-------|--------|-------------|
| **Startseite** | Vereinsname, Logo, Beschreibung, Neuigkeiten | Tenant-Settings |
| **Abteilungen** | Übersicht aller veröffentlichten Abteilungen | Struktur (sichtbarkeit = öffentlich) |
| **Abteilung-Detail** | Beschreibung, Teams, Kontakt, Dokumente | Abteilung + Teams |
| **Team-Detail** | Beschreibung, Teamleitung, Kalender, Dokumente | Team-Entity |
| **Kalender** | Öffentliche Events aller Abteilungen | Events (sichtbarkeit = öffentlich) |
| **Dokumente** | Öffentliche Dokumente | Dokumente (sichtbarkeit = öffentlich) |
| **Mitglied werden** | Online-Mitgliedsantrag | Formular-Konfiguration |
| **Impressum/Datenschutz** | Rechtliche Informationen | Tenant-Settings |

### Seiten-Struktur (eingeloggt, Mitglieder-Bereich)

| Seite | Inhalt | Berechtigung |
|-------|--------|-------------|
| **Mein Profil** | Eigene Stammdaten einsehen/bearbeiten | Alle Mitglieder |
| **Meine Teams** | Teams in denen man Mitglied ist | Alle Mitglieder |
| **Interner Kalender** | Öffentliche + interne Events | Alle Mitglieder |
| **Team-Dokumente** | Dokumente mit Sichtbarkeit "nur_team" | Team-Mitglieder |
| **Beitrittsanfragen** | Team beitreten (wenn Genehmigung erforderlich) | Alle Mitglieder |
| **Benachrichtigungen** | Event-Einladungen, Absagen, Neuigkeiten | Alle Mitglieder |

### Portal-Konfiguration (pro Tenant)

```
PortalEinstellungen {
  tenant_id: string
  
  // Branding
  primaerfarbe: string               // Hex-Code
  sekundaerfarbe: string
  logo_url: string
  favicon_url: string?
  header_bild_url: string?
  
  // Inhalte
  willkommenstext: string?           // Rich-Text für Startseite
  impressum: string                  // Pflicht (deutsches Recht)
  datenschutzerklaerung: string      // Pflicht (DSGVO)
  
  // Funktionen
  portal_aktiv: boolean              // Portal ein-/ausschalten
  registrierung_aktiv: boolean       // Online-Antrag ein-/ausschalten
  kalender_oeffentlich: boolean      // Kalender ohne Login sichtbar
  
  // Custom Domain (Premium)
  custom_domain: string?             // z.B. "portal.tg-villingen.de"
  custom_domain_verifiziert: boolean
}
```

### Sichtbarkeits-Matrix

| Element | Nicht eingeloggt | Eingeloggt (Mitglied) | Eingeloggt (Team-Mitglied) |
|---------|:---:|:---:|:---:|
| Öffentliche Abteilungen | ✅ | ✅ | ✅ |
| Interne Teams | ❌ | ✅ | ✅ |
| Verborgene Teams | ❌ | ❌ | ❌ (nur Admin) |
| Öffentliche Events | ✅ | ✅ | ✅ |
| Interne Events | ❌ | ✅ | ✅ |
| Team-Events | ❌ | ❌ | ✅ |
| Öffentliche Dokumente | ✅ | ✅ | ✅ |
| Mitglieder-Dokumente | ❌ | ✅ | ✅ |
| Team-Dokumente | ❌ | ❌ | ✅ |

### Profil-Selbstverwaltung

Mitglieder können im Portal folgende Daten selbst bearbeiten:

| Feld | Selbst bearbeitbar | Anmerkung |
|------|:---:|------|
| E-Mail | ✅ | Mit Bestätigung |
| Telefon/Mobil | ✅ | |
| Adresse | ✅ | |
| Profilbild | ✅ | |
| Bankdaten | ✅ | Mit SEPA-Mandat-Erneuerung |
| Name | ❌ | Nur durch Admin |
| Geburtsdatum | ❌ | Nur durch Admin |
| Mitgliedsstatus | ❌ | Nur durch Admin |
| Vereinsstruktur-Zuordnung | ❌ | Nur durch Admin/Abteilungsleiter |

**Änderungs-Audit:** Jede Profil-Änderung durch das Mitglied wird protokolliert (wer, wann, was geändert).

---

## 4.2 Digitaler Check-in

### Konzept

Der digitale Check-in ermöglicht die Erfassung der Anwesenheit bei Events/Trainings. Zwei Modi:

1. **QR-Code Check-in:** Mitglieder scannen einen QR-Code mit ihrem Smartphone
2. **Manueller Check-in:** Teamleiter markiert Anwesende in einer Liste

### Check-in Datenmodell

```
CheckIn {
  id: string (UUID)
  tenant_id: string
  
  event_id: string                   // Zugehöriges Event / Event-Instanz
  team_id: string
  datum: string (ISO Date)
  
  // Teilnehmer
  teilnehmer: [
    {
      mitglied_id: string
      status: "anwesend" | "abwesend" | "entschuldigt" | "offen"
      eingecheckt_um: string?        // Timestamp des Check-ins
      methode: "qr" | "manuell" | "selbst"
      eingecheckt_von: string?       // User-ID (bei manuell)
    }
  ]
  
  // QR-Code
  qr_code_token: string             // Einmaliger Token für diesen Check-in
  qr_code_gueltig_bis: string       // Ablaufzeit (z.B. Event-Ende + 30 Min)
  
  // Statistik
  anwesend_anzahl: number
  abwesend_anzahl: number
  quote_prozent: number
  
  created_at: string
  updated_at: string
}
```

### QR-Code Flow

1. **Teamleiter generiert QR-Code:**
   - Öffnet Event/Training in der App
   - Klickt "Check-in starten"
   - QR-Code wird generiert (enthält verschlüsselten Token + Event-ID)
   - QR-Code ist zeitlich begrenzt gültig (Event-Dauer + 30 Min Buffer)

2. **Mitglied scannt QR-Code:**
   - Öffnet Kamera / App
   - Scannt QR-Code
   - Wird als "anwesend" markiert
   - Bestätigung wird angezeigt

3. **Validierung:**
   - Token muss gültig und nicht abgelaufen sein
   - Mitglied muss dem Team angehören
   - Doppel-Check-in wird verhindert (idempotent)

### Manueller Check-in Flow

1. Teamleiter öffnet Event/Training
2. Sieht Liste aller Team-Mitglieder
3. Markiert anwesende Mitglieder per Checkbox
4. Kann "entschuldigt" für abgemeldete Mitglieder setzen
5. Speichert Check-in

### Anwesenheitsstatistik

```
AnwesenheitsStatistik {
  team_id: string
  zeitraum: { von: string, bis: string }
  
  // Pro Mitglied
  mitglieder_statistik: [
    {
      mitglied_id: string
      name: string
      events_gesamt: number
      anwesend: number
      abwesend: number
      entschuldigt: number
      quote_prozent: number
    }
  ]
  
  // Pro Event/Training
  event_statistik: [
    {
      event_id: string
      datum: string
      titel: string
      anwesend: number
      gesamt: number
      quote_prozent: number
    }
  ]
  
  // Gesamt
  durchschnittliche_quote: number
  trend: "steigend" | "fallend" | "stabil"
}
```

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| POST | `/checkins` | Check-in für Event starten |
| GET | `/checkins/:id` | Check-in Detail |
| PUT | `/checkins/:id` | Check-in aktualisieren (manuell) |
| POST | `/checkins/:id/scan` | QR-Code Scan verarbeiten |
| GET | `/checkins/:id/qr-code` | QR-Code generieren/abrufen |
| GET | `/teams/:id/attendance` | Anwesenheitsstatistik für Team |
| GET | `/teams/:id/attendance/export` | Statistik als Excel exportieren |
| GET | `/members/:id/attendance` | Anwesenheit eines Mitglieds |

### Berechtigungen (Check-in)

| Aktion | superadmin | admin | abteilungsleiter | teamleiter | mitglied |
|--------|:---:|:---:|:---:|:---:|:---:|
| Check-in starten | ✅ | ✅ | ✅ (eigene Abt.) | ✅ (eigenes Team) | ❌ |
| Manuell einchecken | ✅ | ✅ | ✅ (eigene Abt.) | ✅ (eigenes Team) | ❌ |
| QR-Code scannen (selbst) | — | — | — | — | ✅ |
| Statistik einsehen | ✅ | ✅ | ✅ (eigene Abt.) | ✅ (eigenes Team) | ❌ |
| Statistik exportieren | ✅ | ✅ | ✅ (eigene Abt.) | Konfigurierbar | ❌ |

---

## 4.3 Online-Mitgliedsantrag

### Konzept

Ein konfigurierbares Online-Formular, über das neue Mitglieder dem Verein beitreten können. Der Antrag wird digital eingereicht und muss vom Verein bestätigt werden.

### Antrags-Konfiguration (pro Tenant)

```
AntragsKonfiguration {
  tenant_id: string
  
  aktiv: boolean                     // Antrag ein-/ausschalten
  
  // Pflichtfelder
  pflichtfelder: string[]            // z.B. ["vorname", "nachname", "geburtsdatum", "email"]
  optionale_felder: string[]         // z.B. ["telefon", "adresse"]
  
  // Abteilungswahl
  abteilung_wahl: "pflicht" | "optional" | "deaktiviert"
  verfuegbare_abteilungen: string[]  // IDs der wählbaren Abteilungen (ohne Aufnahmestopp)
  mehrfachauswahl: boolean           // Mehrere Abteilungen wählbar?
  
  // Beitragsanzeige
  beitraege_anzeigen: boolean        // Beiträge im Antrag anzeigen?
  
  // Rechtliches
  datenschutz_text: string           // DSGVO-Einwilligungstext
  satzung_url: string?               // Link zur Satzung
  zusaetzliche_einwilligungen: [
    {
      id: string
      text: string
      pflicht: boolean
    }
  ]
  
  // SEPA
  sepa_im_antrag: boolean            // SEPA-Mandat direkt im Antrag?
  
  // Bestätigung
  bestaetigungs_email: boolean       // Automatische Bestätigungs-E-Mail?
  bestaetigungs_text: string?        // Text der Bestätigungs-E-Mail
  
  // Benachrichtigung
  benachrichtigung_an: string[]      // E-Mail-Adressen die bei neuem Antrag informiert werden
}
```

### Antrags-Datenmodell

```
Mitgliedsantrag {
  id: string (UUID)
  tenant_id: string
  
  // Antragsdaten (vom Antragsteller ausgefüllt)
  antragsdaten: {
    anrede: string?
    vorname: string
    nachname: string
    geburtsdatum: string
    geschlecht: string?
    email: string
    telefon: string?
    adresse: {
      strasse: string?
      hausnummer: string?
      plz: string?
      ort: string?
    }?
    gewuenschte_abteilungen: string[]
    bankdaten: {
      iban: string?
      kontoinhaber: string?
    }?
  }
  
  // Einwilligungen
  einwilligungen: [
    {
      id: string
      text: string
      erteilt: boolean
      erteilt_am: string
    }
  ]
  datenschutz_akzeptiert: boolean
  datenschutz_akzeptiert_am: string
  
  // Status
  status: "eingegangen" | "in_bearbeitung" | "angenommen" | "abgelehnt"
  bearbeitet_von: string?
  bearbeitet_am: string?
  ablehnungsgrund: string?
  
  // Ergebnis
  erstelltes_mitglied_id: string?    // ID des angelegten Mitglieds (nach Annahme)
  
  // Meta
  ip_adresse: string?                // Für Missbrauchserkennung
  eingegangen_am: string
  created_at: string
}
```

### Antrags-Flow

1. **Antragsteller füllt Formular aus:**
   - Pflichtfelder ausfüllen
   - Abteilung(en) wählen (wenn konfiguriert)
   - Datenschutzerklärung akzeptieren
   - Optional: SEPA-Mandat erteilen
   - Absenden

2. **System verarbeitet Antrag:**
   - Validierung aller Felder
   - Duplikat-Prüfung (Name + Geburtsdatum)
   - Antrag in DynamoDB speichern
   - Bestätigungs-E-Mail an Antragsteller
   - Benachrichtigungs-E-Mail an konfigurierte Empfänger

3. **Verein bearbeitet Antrag:**
   - Admin/Abteilungsleiter sieht neue Anträge im Dashboard
   - Prüft Daten
   - Nimmt an → Mitglied wird automatisch angelegt + Zuordnung
   - Oder lehnt ab → Ablehnungs-E-Mail an Antragsteller

4. **Nach Annahme:**
   - Mitglied-Entity wird erstellt
   - Zuordnung zu gewählter Abteilung
   - Willkommens-E-Mail an neues Mitglied
   - Optional: Login-Daten für Portal

### PDF-Generierung

Bei Annahme wird ein PDF des Antrags generiert und archiviert:
- Enthält alle Antragsdaten
- Datenschutz-Einwilligung mit Timestamp
- SEPA-Mandat (wenn erteilt)
- Wird in S3 gespeichert und dem Mitglied zugeordnet

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/application/config` | Antrags-Konfiguration (öffentlich) |
| POST | `/application/submit` | Antrag einreichen (öffentlich, kein Auth) |
| GET | `/applications` | Eingegangene Anträge (Admin) |
| GET | `/applications/:id` | Antrags-Detail |
| POST | `/applications/:id/accept` | Antrag annehmen |
| POST | `/applications/:id/reject` | Antrag ablehnen |
| PUT | `/application/config` | Konfiguration bearbeiten (Admin) |

### Spam-/Missbrauchsschutz

- Rate Limiting: Max. 5 Anträge pro IP pro Stunde
- Honeypot-Feld (unsichtbares Feld, das Bots ausfüllen)
- Optional: hCaptcha/Turnstile Integration
- Duplikat-Warnung bei gleichem Name + Geburtsdatum

---

## 4.4 Benachrichtigungen (In-App)

### Konzept

Mitglieder erhalten Benachrichtigungen im Portal über relevante Ereignisse:

```
Benachrichtigung {
  id: string
  tenant_id: string
  empfaenger_id: string              // Mitglied-ID
  
  typ: "event_einladung" | "event_absage" | "event_aenderung" 
     | "team_beitritt" | "team_anfrage_angenommen" | "team_anfrage_abgelehnt"
     | "dokument_neu" | "allgemein"
  
  titel: string
  nachricht: string
  link: string?                      // Deep-Link zur relevanten Seite
  
  gelesen: boolean
  gelesen_am: string?
  
  created_at: string
}
```

### Auslöser

| Ereignis | Empfänger | Benachrichtigung |
|----------|-----------|-----------------|
| Event erstellt (Team) | Alle Team-Mitglieder | "Neues Event: {titel}" |
| Event abgesagt | Alle Gäste | "Event abgesagt: {titel}" |
| Event geändert | Alle Gäste | "Event geändert: {titel}" |
| Team-Beitritt bestätigt | Neues Mitglied | "Du bist jetzt im Team {name}" |
| Beitrittsanfrage angenommen | Antragsteller | "Deine Anfrage wurde angenommen" |
| Beitrittsanfrage abgelehnt | Antragsteller | "Deine Anfrage wurde abgelehnt" |
| Neues Dokument (Team) | Team-Mitglieder | "Neues Dokument: {titel}" |

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/notifications` | Eigene Benachrichtigungen |
| PUT | `/notifications/:id/read` | Als gelesen markieren |
| PUT | `/notifications/read-all` | Alle als gelesen markieren |
| GET | `/notifications/unread-count` | Anzahl ungelesener |

---

## 4.5 Akzeptanzkriterien Phase 4

### Portal
- [ ] Öffentliche Vereinsseite zeigt Abteilungen, Teams, Kalender
- [ ] Sichtbarkeitsregeln werden korrekt durchgesetzt (öffentlich/intern/Team)
- [ ] Mitglieder können sich einloggen und ihr Profil einsehen
- [ ] Profil-Selbstverwaltung funktioniert (E-Mail, Telefon, Adresse)
- [ ] Änderungen werden auditiert
- [ ] Portal-Branding (Farben, Logo) ist pro Verein konfigurierbar
- [ ] Team-Beitrittsanfragen können über das Portal gestellt werden

### Check-in
- [ ] QR-Code wird pro Event/Training generiert
- [ ] Mitglieder können sich per QR-Scan einchecken
- [ ] Manueller Check-in durch Teamleiter funktioniert
- [ ] Doppel-Check-in wird verhindert
- [ ] Anwesenheitsstatistik pro Team ist korrekt
- [ ] Statistik kann als Excel exportiert werden
- [ ] QR-Code ist zeitlich begrenzt gültig

### Online-Mitgliedsantrag
- [ ] Formular ist konfigurierbar (Pflichtfelder, Abteilungswahl)
- [ ] Abteilungen mit Aufnahmestopp werden nicht angezeigt
- [ ] Datenschutz-Einwilligung ist Pflicht
- [ ] Bestätigungs-E-Mail wird an Antragsteller gesendet
- [ ] Admin wird über neue Anträge benachrichtigt
- [ ] Antrag kann angenommen oder abgelehnt werden
- [ ] Bei Annahme wird Mitglied automatisch angelegt
- [ ] Duplikat-Prüfung warnt bei gleichem Name + Geburtsdatum
- [ ] Spam-Schutz (Rate Limiting, Honeypot) funktioniert
- [ ] PDF des Antrags wird archiviert

### Benachrichtigungen
- [ ] In-App Benachrichtigungen werden bei relevanten Ereignissen erstellt
- [ ] Ungelesene Benachrichtigungen werden mit Badge angezeigt
- [ ] Benachrichtigungen können als gelesen markiert werden
