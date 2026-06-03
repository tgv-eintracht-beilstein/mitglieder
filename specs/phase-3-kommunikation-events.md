# Phase 3: Kommunikation & Events — Detaillierte Spezifikation

## Ziel

Kommunikationswerkzeuge (E-Mail-Verteiler) und ein vollständiges Event-System mit Kalender, Standortverwaltung und Dokumenten-Management implementieren. Am Ende von Phase 3 können Vereine ihre Mitglieder per E-Mail erreichen, Events planen und Dokumente verwalten.

---

## 3.1 E-Mail & Kommunikation

### Übersicht

Das Kommunikationsmodul ermöglicht den Versand von E-Mails an Listen, Teams oder einzelne Mitglieder. Es nutzt Amazon SES als Versand-Infrastruktur.

### E-Mail-Versand-Modell

```
EmailNachricht {
  id: string (UUID)
  tenant_id: string
  
  // Empfänger
  empfaenger_typ: "liste" | "team" | "abteilung" | "manuell"
  empfaenger_referenz_id: string?    // Liste-ID, Team-ID oder Abteilung-ID
  empfaenger_ids: string[]?          // Bei manueller Auswahl
  
  // Inhalt
  betreff: string
  inhalt: string                     // Rich-Text (HTML)
  anhaenge: [
    {
      dateiname: string
      s3_key: string
      groesse_bytes: number
    }
  ]?
  
  // Versand
  absender_name: string              // Vereinsname oder Abteilungsname
  absender_email: string             // Verifizierte SES-Adresse oder no-reply
  reply_to: string?                  // Antwort-Adresse
  
  // Status
  status: "entwurf" | "gesendet" | "fehlgeschlagen"
  gesendet_am: string?
  gesendet_von: string               // User-ID
  
  // Statistik
  empfaenger_anzahl: number
  erfolgreich_zugestellt: number
  fehlgeschlagen: number
  ohne_email: string[]               // Mitglieder-IDs ohne E-Mail-Adresse
  
  created_at: string
}
```

### Versand-Logik

1. **Empfänger auflösen:**
   - Liste → Smarte Liste berechnen oder statische Liste laden
   - Team → Alle Team-Mitglieder
   - Abteilung → Alle Mitglieder der Abteilung
   - Manuell → Direkte Mitglieder-IDs

2. **E-Mail-Adressen sammeln:**
   - Mitglied hat eigene E-Mail → verwenden
   - Mitglied hat keine E-Mail + ist Kind → Gruppenzahler-E-Mail verwenden
   - Mitglied hat keine E-Mail + kein Gruppenzahler → in `ohne_email` Liste

3. **Versand:**
   - BCC-Versand (Empfänger sehen sich nicht gegenseitig)
   - Batches von max. 50 Empfängern pro SES-Call
   - Asynchron via SQS Queue (Lambda verarbeitet Batches)

4. **Nachbereitung:**
   - Bounce/Complaint-Handling via SES Notifications
   - Statistik aktualisieren

### Hinweis-System

Vor dem Versand wird dem Absender angezeigt:
- Anzahl Empfänger mit E-Mail (grün markiert)
- Anzahl Empfänger ohne E-Mail (grau markiert, mit Tooltip)
- Warnung wenn > 20% ohne E-Mail

### Vorlagen (optional, Phase 3)

```
EmailVorlage {
  id: string
  tenant_id: string
  name: string
  betreff: string
  inhalt: string              // Mit Platzhaltern: {{vorname}}, {{nachname}}, {{vereinsname}}
  kategorie: string?          // z.B. "Training", "Allgemein", "Einladung"
  created_at: string
}
```

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| POST | `/emails` | E-Mail erstellen (Entwurf) |
| GET | `/emails` | Gesendete E-Mails auflisten |
| GET | `/emails/:id` | E-Mail-Detail mit Statistik |
| POST | `/emails/:id/send` | E-Mail versenden |
| DELETE | `/emails/:id` | Entwurf löschen |
| GET | `/emails/:id/recipients` | Empfänger-Vorschau (vor Versand) |
| GET | `/email-templates` | Vorlagen auflisten |
| POST | `/email-templates` | Vorlage erstellen |
| PUT | `/email-templates/:id` | Vorlage bearbeiten |
| DELETE | `/email-templates/:id` | Vorlage löschen |

### SES-Konfiguration

- Verifizierte Domain pro Tenant (oder Shared no-reply Domain)
- Absender: `vereinsname@mail.vereinssoftware.de` (Shared) oder eigene Domain
- Configuration Set für Bounce/Complaint Tracking
- Sending Quota: Abhängig vom Subscription-Tier

| Tier | E-Mails/Monat |
|------|---------------|
| Starter | 500 |
| Standard | 5.000 |
| Premium | 50.000 |

### Berechtigungen

| Aktion | superadmin | admin | abteilungsleiter | teamleiter | mitglied |
|--------|:---:|:---:|:---:|:---:|:---:|
| E-Mail an alle senden | ✅ | ✅ | ❌ | ❌ | ❌ |
| E-Mail an eigene Abteilung | ✅ | ✅ | ✅ | ❌ | ❌ |
| E-Mail an eigenes Team | ✅ | ✅ | ✅ | ✅ | ❌ |
| Vorlagen verwalten | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 3.2 Event-System

### Event-Datenmodell

```
Event {
  id: string (UUID)
  tenant_id: string
  
  // Grunddaten
  titel: string
  beschreibung: string?              // Rich-Text
  bild_url: string?
  eventrichtlinie: string?           // Regeln/Hinweise für Teilnehmer
  
  // Typ
  typ: "einmalig" | "wiederkehrend"
  
  // Zeitraum (einmalig)
  start_datum: string (ISO DateTime)
  end_datum: string (ISO DateTime)
  ganztaegig: boolean
  
  // Wiederholung (wiederkehrend)
  wiederholung: {
    frequenz: "täglich" | "wöchentlich" | "monatlich"
    wochentage: number[]?            // 0=Mo, 6=So (bei wöchentlich)
    intervall: number                // Alle X Wochen/Tage/Monate
    startzeit: string                // HH:mm
    dauer_minuten: number
    serie_start: string (ISO Date)
    serie_ende: string (ISO Date)
  }?
  
  // Ort
  standort_typ: "intern" | "extern"
  standort_id: string?               // Verweis auf Vereins-Standort
  standort_details: {                // Bei externem Standort
    name: string
    adresse: string
    plz: string?
    ort: string?
  }?
  platz_exklusiv: boolean            // Standort exklusiv gebucht?
  
  // Zuordnung
  team_id: string?                   // Für welches Team (optional)
  abteilung_id: string?              // Für welche Abteilung (optional)
  
  // Sichtbarkeit
  sichtbarkeit: "öffentlich" | "intern" | "nur_team"
  status: "veröffentlicht" | "unveröffentlicht"
  
  // Teilnehmer
  eventleitung: [
    {
      mitglied_id: string
      rolle: string?                 // z.B. "Trainer", "Organisator"
    }
  ]
  gaeste: [
    {
      mitglied_id: string
      status: "eingeladen" | "zugesagt" | "abgesagt" | "offen"
    }
  ]
  auto_gaeste_aus_team: boolean      // Automatisch alle Team-Mitglieder einladen
  max_teilnehmer: number?            // Kapazitätsgrenze
  
  // Meta
  erstellt_von: string
  created_at: string
  updated_at: string
}
```

### Wiederkehrende Events — Instanz-Generierung

Wiederkehrende Events werden als Serie gespeichert. Einzelne Instanzen werden bei Bedarf generiert:

```
EventInstanz {
  id: string
  serie_id: string                   // Verweis auf wiederkehrendes Event
  tenant_id: string
  datum: string (ISO Date)
  startzeit: string
  endzeit: string
  status: "geplant" | "abgesagt" | "verschoben"
  abweichung: {                      // Nur wenn diese Instanz abweicht
    titel: string?
    beschreibung: string?
    standort_id: string?
    startzeit: string?
  }?
}
```

**Regeln:**
- Instanzen werden für die nächsten 3 Monate voraus-generiert
- Einzelne Instanzen können abgesagt oder verschoben werden ohne die Serie zu ändern
- Änderungen an der Serie betreffen nur zukünftige Instanzen

### Standortverwaltung

```
Standort {
  id: string (UUID)
  tenant_id: string
  
  name: string                       // z.B. "Trainingsplatz Feld 1"
  kategorie: string?                 // z.B. "Fußball", "Halle", "Schwimmbad"
  adresse: {
    strasse: string
    hausnummer: string
    plz: string
    ort: string
  }
  
  kapazitaet: number?                // Max. Personen
  ausstattung: string[]?             // z.B. ["Flutlicht", "Umkleiden", "Parkplatz"]
  
  // Verfügbarkeit
  verfuegbar_von: string?            // HH:mm
  verfuegbar_bis: string?            // HH:mm
  verfuegbare_tage: number[]?        // 0=Mo, 6=So
  
  bild_url: string?
  notizen: string?
  
  created_at: string
  updated_at: string
}
```

### Belegungsplan & Überbuchungswarnung

- Jeder Standort hat einen Belegungsplan (Kalender-Ansicht)
- Wenn ein Event an einem Standort erstellt wird, der bereits belegt ist:
  - Warnung anzeigen: "Dieser Standort ist zu diesem Zeitpunkt bereits belegt"
  - Vorschlag alternativer freier Zeitslots
  - Überbuchung ist möglich (mit Bestätigung), da Plätze geteilt werden können

### Kalender-Ansichten

| Ansicht | Beschreibung |
|---------|-------------|
| Monatsansicht | Alle Events des Monats als Kacheln |
| Wochenansicht | Stundenraster mit Events |
| Tagesansicht | Detaillierte Tagesplanung |
| Listenansicht | Chronologische Liste aller Events |

**Filter:**
- Nach Team
- Nach Abteilung
- Nach Standort
- Nach Event-Typ (Training, Turnier, Versammlung etc.)
- Zeitraum

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/events` | Events auflisten (mit Filtern) |
| POST | `/events` | Event erstellen |
| GET | `/events/:id` | Event-Detail |
| PUT | `/events/:id` | Event bearbeiten |
| DELETE | `/events/:id` | Event löschen |
| POST | `/events/:id/publish` | Event veröffentlichen |
| POST | `/events/:id/cancel` | Event absagen |
| GET | `/events/:id/guests` | Gästeliste |
| PUT | `/events/:id/guests/:memberId` | RSVP-Status ändern |
| GET | `/events/calendar` | Kalender-Daten (optimiert für Ansichten) |
| GET | `/locations` | Standorte auflisten |
| POST | `/locations` | Standort erstellen |
| GET | `/locations/:id` | Standort-Detail |
| PUT | `/locations/:id` | Standort bearbeiten |
| DELETE | `/locations/:id` | Standort löschen |
| GET | `/locations/:id/schedule` | Belegungsplan |
| GET | `/locations/:id/availability` | Freie Zeitslots prüfen |

### Berechtigungen (Events)

| Aktion | superadmin | admin | abteilungsleiter | teamleiter | mitglied |
|--------|:---:|:---:|:---:|:---:|:---:|
| Alle Events sehen | ✅ | ✅ | Nur eigene Abt. | Nur eigenes Team | Nur öffentlich + eigenes Team |
| Event erstellen | ✅ | ✅ | ✅ (eigene Abt.) | ✅ (eigenes Team) | ❌ |
| Event bearbeiten | ✅ | ✅ | ✅ (eigene Abt.) | ✅ (eigenes Team) | ❌ |
| Event löschen | ✅ | ✅ | ✅ (eigene Abt.) | ❌ | ❌ |
| Standorte verwalten | ✅ | ✅ | ❌ | ❌ | ❌ |
| Standorte einsehen | ✅ | ✅ | ✅ (Leserecht) | ❌ | ❌ |

---

## 3.3 Dokumente

### Dokument-Datenmodell

```
Dokument {
  id: string (UUID)
  tenant_id: string
  
  // Zuordnung
  kontext_typ: "verein" | "abteilung" | "team"
  kontext_id: string                 // Tenant-ID, Abteilung-ID oder Team-ID
  
  // Datei
  dateiname: string                  // Originalname
  dateityp: string                   // MIME-Type
  groesse_bytes: number
  s3_key: string                     // Speicherort in S3
  
  // Metadaten
  titel: string                      // Anzeigename (z.B. "Sonderordnung Fußball")
  beschreibung: string?
  kategorie: string?                 // z.B. "Ordnung", "Trainingsplan", "Information"
  
  // Sichtbarkeit
  sichtbarkeit: "öffentlich" | "nur_mitglieder" | "nur_team"
  
  // Meta
  hochgeladen_von: string
  created_at: string
  updated_at: string
}
```

### Upload-Flow

1. Client fordert Pre-Signed Upload URL an
2. Client lädt Datei direkt zu S3 hoch
3. Client bestätigt Upload mit Metadaten
4. Backend erstellt Dokument-Eintrag in DynamoDB
5. Optional: Virus-Scan via Lambda Trigger auf S3

### Datei-Beschränkungen

| Einschränkung | Wert |
|---------------|------|
| Max. Dateigröße | 50 MB |
| Erlaubte Typen | PDF, DOC/DOCX, XLS/XLSX, JPG, PNG, MP4 |
| Max. Dokumente pro Team | 50 |
| Max. Dokumente pro Abteilung | 100 |
| Max. Speicher pro Tenant (Starter) | 1 GB |
| Max. Speicher pro Tenant (Standard) | 10 GB |
| Max. Speicher pro Tenant (Premium) | 100 GB |

### Sichtbarkeits-Regeln

| Sichtbarkeit | Wer kann sehen |
|-------------|----------------|
| `öffentlich` | Jeder (auch nicht eingeloggt) |
| `nur_mitglieder` | Nur eingeloggte Mitglieder des Vereins |
| `nur_team` | Nur Mitglieder des zugeordneten Teams |

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/documents` | Dokumente auflisten (gefiltert nach Kontext + Berechtigung) |
| POST | `/documents/upload-url` | Pre-Signed Upload URL anfordern |
| POST | `/documents` | Dokument-Metadaten erstellen (nach Upload) |
| GET | `/documents/:id` | Dokument-Metadaten |
| GET | `/documents/:id/download` | Download-URL generieren (Pre-Signed) |
| PUT | `/documents/:id` | Metadaten bearbeiten |
| DELETE | `/documents/:id` | Dokument löschen (S3 + DynamoDB) |
| GET | `/departments/:id/documents` | Dokumente einer Abteilung |
| GET | `/teams/:id/documents` | Dokumente eines Teams |

---

## 3.4 Akzeptanzkriterien Phase 3

### E-Mail
- [ ] E-Mails können an Listen, Teams und Abteilungen gesendet werden
- [ ] BCC-Versand (Empfänger sehen sich nicht gegenseitig)
- [ ] Mitglieder ohne E-Mail werden vor Versand angezeigt
- [ ] Gruppenzahler-E-Mail wird als Fallback für Kinder verwendet
- [ ] E-Mail-Vorlagen können erstellt und verwendet werden
- [ ] Versand-Historie mit Statistik ist einsehbar
- [ ] Quota-Limits werden pro Tier durchgesetzt

### Events
- [ ] Einmalige Events können erstellt und veröffentlicht werden
- [ ] Wiederkehrende Events generieren korrekte Instanzen
- [ ] Einzelne Instanzen können abgesagt werden ohne Serie zu ändern
- [ ] Standorte können verwaltet werden
- [ ] Belegungsplan zeigt Überschneidungen an
- [ ] Überbuchungswarnung wird angezeigt (Überbuchung mit Bestätigung möglich)
- [ ] Kalender zeigt Events in Monats-/Wochen-/Tages-/Listenansicht
- [ ] Filter nach Team/Abteilung/Standort funktioniert
- [ ] Gästeliste wird automatisch aus Team-Mitgliedern befüllt
- [ ] Sichtbarkeit (öffentlich/intern/nur Team) wird korrekt durchgesetzt
- [ ] Teamleiter können Events für ihr Team erstellen (wenn berechtigt)

### Dokumente
- [ ] Dokumente können per Pre-Signed URL hochgeladen werden
- [ ] Sichtbarkeitssteuerung funktioniert (öffentlich/Mitglieder/Team)
- [ ] Dokumente können pro Abteilung und pro Team zugeordnet werden
- [ ] Download generiert zeitlich begrenzte Pre-Signed URL
- [ ] Speicher-Limits werden pro Tier durchgesetzt
- [ ] Nur erlaubte Dateitypen können hochgeladen werden
