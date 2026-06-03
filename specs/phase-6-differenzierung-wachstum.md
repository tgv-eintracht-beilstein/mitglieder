# Phase 6: Differenzierung & Wachstum — Detaillierte Spezifikation

## Ziel

Features implementieren, die das Produkt von der Konkurrenz abheben: Beitragsverwaltung mit SEPA-Lastschrift, Finanzen, Automatisierungen, Verbands-Schnittstellen und eine Mobile App. Phase 6 ist modular — Features können unabhängig voneinander priorisiert und ausgeliefert werden.

---

## 6.1 Beitragsverwaltung

### Konzept

Vereine erheben Mitgliedsbeiträge. Das System verwaltet Beitragsarten, berechnet fällige Beträge und unterstützt SEPA-Lastschrifteinzug.

### Beitragsart-Datenmodell

```
Beitragsart {
  id: string (UUID)
  tenant_id: string
  
  name: string                       // z.B. "Grundbeitrag Erwachsene"
  beschreibung: string?
  
  // Betrag (in Cent!)
  betrag_cent: number                // z.B. 12000 = 120,00 €
  waehrung: "EUR"
  
  // Rhythmus
  rhythmus: "monatlich" | "vierteljährlich" | "halbjährlich" | "jährlich" | "einmalig"
  faelligkeitsmonat: number[]?       // z.B. [1, 7] für halbjährlich im Jan + Jul
  faelligkeitstag: number            // Tag im Monat (1-28)
  
  // Zuordnung
  gilt_fuer: {
    typ: "alle" | "abteilung" | "altersgruppe" | "manuell"
    abteilung_ids: string[]?
    alter_von: number?
    alter_bis: number?
  }
  
  // Ermäßigungen
  ermaessigungen: [
    {
      id: string
      name: string                   // z.B. "Familienermäßigung", "Sozialermäßigung"
      typ: "prozent" | "absolut"
      wert: number                   // Prozent (z.B. 50) oder Cent (z.B. 6000)
      bedingung: string?             // Freitext-Beschreibung
    }
  ]
  
  // Status
  aktiv: boolean
  gueltig_ab: string?
  gueltig_bis: string?
  
  created_at: string
  updated_at: string
}
```

### Mitgliedsbeitrag (pro Mitglied)

```
Mitgliedsbeitrag {
  id: string
  tenant_id: string
  mitglied_id: string
  beitragsart_id: string
  
  // Berechnung
  basis_betrag_cent: number
  ermaessigung_id: string?
  ermaessigung_betrag_cent: number
  endbetrag_cent: number             // basis - ermäßigung
  
  // Fälligkeit
  faellig_am: string (ISO Date)
  
  // Status
  status: "offen" | "bezahlt" | "gemahnt" | "storniert" | "uneinbringlich"
  bezahlt_am: string?
  zahlungsart: "lastschrift" | "überweisung" | "bar" | "sonstig"?
  
  // SEPA
  lastschrift_id: string?            // Verweis auf SEPA-Transaktion
  
  // Mahnung
  mahnstufe: 0 | 1 | 2 | 3
  letzte_mahnung_am: string?
  
  created_at: string
}
```

### SEPA-Lastschrift

```
SEPALastschrift {
  id: string
  tenant_id: string
  
  // Sammellastschrift
  ausfuehrungsdatum: string (ISO Date)
  typ: "CORE" | "B2B"               // Privatperson vs. Firma
  sequenz: "FRST" | "RCUR" | "OOFF" // Erst-/Folge-/Einmallastschrift
  
  // Positionen
  positionen: [
    {
      mitglied_id: string
      beitrag_ids: string[]          // Welche Beiträge eingezogen werden
      betrag_cent: number
      iban: string
      bic: string?
      kontoinhaber: string
      mandat_referenz: string
      mandat_datum: string
    }
  ]
  
  // Summen
  anzahl_positionen: number
  gesamtbetrag_cent: number
  
  // Status
  status: "erstellt" | "exportiert" | "eingereicht" | "ausgeführt" | "teilweise_fehlgeschlagen"
  
  // SEPA-XML
  xml_datei_s3_key: string?          // Generierte PAIN.008 XML-Datei
  
  // Rückläufer
  ruecklaufer: [
    {
      mitglied_id: string
      grund: string                  // z.B. "Konto nicht gedeckt", "Mandat ungültig"
      betrag_cent: number
      ruecklauf_datum: string
    }
  ]
  
  created_at: string
  updated_at: string
}
```

### SEPA-XML Generierung (PAIN.008)

Das System generiert SEPA-XML Dateien im Format PAIN.008.001.02 (oder .03), die bei der Hausbank des Vereins eingereicht werden können.

**Voraussetzungen:**
- Gläubiger-ID des Vereins (Bundesbank)
- IBAN des Vereinskontos
- Gültige SEPA-Mandate aller Mitglieder

**Flow:**
1. Beiträge werden fällig (automatisch oder manuell ausgelöst)
2. System erstellt Sammellastschrift mit allen fälligen Positionen
3. SEPA-XML wird generiert
4. Admin lädt XML herunter und reicht bei Bank ein
5. Nach Ausführung: Status aktualisieren
6. Rückläufer manuell erfassen → Mahnung auslösen

### Mahnwesen

| Mahnstufe | Tage nach Fälligkeit | Aktion |
|-----------|---------------------|--------|
| 0 | 0 | Beitrag fällig |
| 1 | 14 | 1. Mahnung (E-Mail) |
| 2 | 28 | 2. Mahnung (E-Mail + Brief-Vorlage) |
| 3 | 42 | 3. Mahnung (Letzte Warnung) |
| — | 60 | Status "uneinbringlich" (manuell) |

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/fees/types` | Beitragsarten auflisten |
| POST | `/fees/types` | Beitragsart erstellen |
| PUT | `/fees/types/:id` | Beitragsart bearbeiten |
| GET | `/fees` | Fällige/offene Beiträge |
| POST | `/fees/generate` | Beiträge für Periode generieren |
| PUT | `/fees/:id` | Beitrag-Status ändern (bezahlt etc.) |
| POST | `/fees/sepa/create` | Sammellastschrift erstellen |
| GET | `/fees/sepa/:id/xml` | SEPA-XML herunterladen |
| PUT | `/fees/sepa/:id/status` | Lastschrift-Status aktualisieren |
| POST | `/fees/sepa/:id/returns` | Rückläufer erfassen |
| POST | `/fees/reminders` | Mahnlauf starten |
| GET | `/members/:id/fees` | Beitragshistorie eines Mitglieds |

---

## 6.2 Finanzen

### Kassenbuch

```
Buchung {
  id: string
  tenant_id: string
  
  datum: string (ISO Date)
  typ: "einnahme" | "ausgabe"
  kategorie: string                  // z.B. "Mitgliedsbeiträge", "Sportgeräte", "Hallenmiete"
  
  betrag_cent: number                // Immer positiv, Typ bestimmt Richtung
  waehrung: "EUR"
  
  beschreibung: string
  belegnummer: string?
  beleg_s3_key: string?              // Scan/Foto des Belegs
  
  // Zuordnung
  abteilung_id: string?              // Optional: Abteilungs-Zuordnung
  kostenstelle: string?
  
  // Verknüpfung
  beitrag_id: string?                // Verknüpfung zu Mitgliedsbeitrag
  
  erstellt_von: string
  created_at: string
}
```

### Kassenberichte

| Bericht | Inhalt | Format |
|---------|--------|--------|
| Kassenbericht (Zeitraum) | Einnahmen/Ausgaben gruppiert nach Kategorie | PDF + Excel |
| Jahresabschluss | Gesamtübersicht eines Geschäftsjahres | PDF |
| Abteilungs-Bericht | Einnahmen/Ausgaben einer Abteilung | PDF + Excel |
| DATEV-Export | Buchungen im DATEV-Format | CSV (DATEV-kompatibel) |

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/finance/bookings` | Buchungen auflisten (filterbar) |
| POST | `/finance/bookings` | Buchung erstellen |
| PUT | `/finance/bookings/:id` | Buchung bearbeiten |
| DELETE | `/finance/bookings/:id` | Buchung löschen |
| GET | `/finance/reports/summary` | Zusammenfassung (Zeitraum) |
| GET | `/finance/reports/annual` | Jahresabschluss |
| GET | `/finance/reports/department/:id` | Abteilungs-Bericht |
| GET | `/finance/export/datev` | DATEV-Export |

### Berechtigungen (Finanzen)

- Nur `superadmin` und `admin` mit explizitem Finanz-Recht
- Bankdaten in Mitgliederprofilen nur mit Finanz-Recht sichtbar
- Abteilungsleiter: Optional Lese-Zugriff auf eigene Abteilungs-Finanzen

---

## 6.3 Automatisierungen

### Automatisierungs-Engine

```
Automatisierung {
  id: string
  tenant_id: string
  
  name: string
  aktiv: boolean
  
  // Auslöser
  trigger: {
    typ: "datum" | "ereignis" | "zeitplan"
    
    // Datum-basiert
    datum_feld: string?              // z.B. "geburtsdatum", "eintrittsdatum"
    tage_vorher: number?             // z.B. 0 = am Tag, 7 = eine Woche vorher
    
    // Ereignis-basiert
    ereignis: string?                // z.B. "mitglied_erstellt", "beitrag_faellig"
    
    // Zeitplan
    cron: string?                    // z.B. "0 8 1 * *" (1. jeden Monats um 8:00)
  }
  
  // Aktion
  aktion: {
    typ: "email" | "benachrichtigung" | "status_aendern" | "bericht_erstellen"
    
    // E-Mail
    vorlage_id: string?
    empfaenger: "betroffenes_mitglied" | "admin" | "liste" | "custom"
    empfaenger_ids: string[]?
    
    // Status ändern
    feld: string?
    neuer_wert: string?
  }
  
  // Filter (optional: nur für bestimmte Mitglieder)
  filter: {
    abteilung_ids: string[]?
    status: string[]?
    altersgruppe: { von: number?, bis: number? }?
  }?
  
  // Statistik
  letzte_ausfuehrung: string?
  ausfuehrungen_gesamt: number
  
  created_at: string
}
```

### Vordefinierte Automatisierungen

| Name | Trigger | Aktion |
|------|---------|--------|
| Geburtstags-Gruß | Geburtsdatum = heute | E-Mail mit Glückwunsch |
| Jubiläums-Erinnerung | Eintrittsdatum Jahrestag | E-Mail + Benachrichtigung an Admin |
| Beitrags-Erinnerung | 7 Tage vor Fälligkeit | E-Mail an Mitglied |
| Willkommens-Mail | Mitglied erstellt | E-Mail mit Infos |
| Inaktivitäts-Warnung | Kein Check-in seit 3 Monaten | Benachrichtigung an Teamleiter |
| Verbandsmeldung-Erinnerung | 14 Tage vor Stichtag | E-Mail an Admin |

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/automations` | Automatisierungen auflisten |
| POST | `/automations` | Automatisierung erstellen |
| PUT | `/automations/:id` | Bearbeiten |
| DELETE | `/automations/:id` | Löschen |
| POST | `/automations/:id/test` | Test-Ausführung (Dry Run) |
| GET | `/automations/:id/history` | Ausführungs-Historie |

---

## 6.4 Umfragen & Abstimmungen

### Konzept

Digitale Umfragen und Abstimmungen für Mitgliederversammlungen, Terminabfragen oder Meinungsbilder.

### Datenmodell

```
Umfrage {
  id: string
  tenant_id: string
  
  titel: string
  beschreibung: string?
  typ: "umfrage" | "abstimmung" | "terminabfrage"
  
  // Fragen
  fragen: [
    {
      id: string
      text: string
      typ: "einzelauswahl" | "mehrfachauswahl" | "freitext" | "skala" | "ja_nein"
      optionen: string[]?            // Bei Auswahl-Fragen
      pflicht: boolean
      skala_min: number?             // Bei Skala (z.B. 1)
      skala_max: number?             // Bei Skala (z.B. 5)
    }
  ]
  
  // Teilnehmer
  teilnehmer_kreis: "alle" | "liste" | "team" | "abteilung"
  teilnehmer_referenz_id: string?
  
  // Einstellungen
  anonym: boolean                    // Anonyme Abstimmung?
  mehrfach_teilnahme: boolean        // Darf man Antwort ändern?
  ergebnis_sichtbar: "sofort" | "nach_ende" | "nur_admin"
  
  // Zeitraum
  start_datum: string
  end_datum: string
  
  // Status
  status: "entwurf" | "aktiv" | "beendet" | "archiviert"
  
  // Statistik
  teilnehmer_anzahl: number
  teilnahme_quote_prozent: number
  
  created_at: string
}
```

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/surveys` | Umfragen auflisten |
| POST | `/surveys` | Umfrage erstellen |
| GET | `/surveys/:id` | Umfrage-Detail |
| PUT | `/surveys/:id` | Bearbeiten |
| POST | `/surveys/:id/publish` | Veröffentlichen |
| POST | `/surveys/:id/responses` | Antwort abgeben |
| GET | `/surveys/:id/results` | Ergebnisse |
| GET | `/surveys/:id/results/export` | Ergebnisse exportieren |

---

## 6.5 Integrationen

### DOSB/LSB-Schnittstelle (Verbandsmeldung)

**Ziel:** Digitale Übermittlung der Verbandsmeldung an den Landessportbund.

```
Verbandsmeldung {
  tenant_id: string
  stichtag: string
  typ: "A" | "B"
  
  // Vereinsdaten
  vereinsnummer: string
  vereinsname: string
  
  // Meldedaten (pro Abteilung)
  abteilungen: [
    {
      fachverbandsnummer: string
      name: string
      mitglieder: {
        maennlich: { [jahrgang: string]: number }
        weiblich: { [jahrgang: string]: number }
        divers: { [jahrgang: string]: number }
      }
      gesamt: number
    }
  ]
  
  // Export
  format: "xlsx" | "csv" | "xml"    // Je nach LSB-Anforderung
}
```

### DFBnet-Integration (Fußball)

- Spieler-Passnummern verwalten
- Spielberechtigungen prüfen
- Ergebnismeldung (optional, Phase 6+)

### Kalender-Sync

```
KalenderSync {
  tenant_id: string
  mitglied_id: string?              // Pro Mitglied oder pro Team
  team_id: string?
  
  typ: "ical_feed" | "google_calendar"
  feed_url: string                   // Generierte iCal-URL (mit Token)
  
  // Filter
  nur_eigene_teams: boolean
  nur_oeffentlich: boolean
}
```

- iCal-Feed URL pro Mitglied/Team (mit Auth-Token im URL)
- Google Calendar Sync via iCal-Subscription
- Enthält alle relevanten Events (gefiltert nach Berechtigung)

### Buchhaltungs-Export

| Format | Ziel-Software | Felder |
|--------|--------------|--------|
| DATEV CSV | DATEV, Steuerberater | Buchungsdatum, Belegnummer, Betrag, Gegenkonto, Buchungstext |
| lexoffice API | lexoffice | Rechnungen, Belege (via REST API) |

### API-Endpunkte (Integrationen)

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/integrations/verbandsmeldung/export` | Verbandsmeldung exportieren |
| GET | `/integrations/calendar/:token.ics` | iCal-Feed (öffentlich, Token-Auth) |
| POST | `/integrations/calendar/sync` | Kalender-Sync konfigurieren |
| GET | `/integrations/datev/export` | DATEV-Export |

---

## 6.6 Mobile App

### Technologie-Entscheidung

**Empfehlung:** Progressive Web App (PWA) als erster Schritt, React Native als Ausbaustufe.

**PWA-Vorteile:**
- Kein App Store Review
- Sofortige Updates
- Gleiche Codebase wie Web
- Installierbar auf Homescreen
- Push Notifications (Web Push)

### Funktionsumfang Mobile

| Feature | PWA (Phase 6a) | Native (Phase 6b) |
|---------|:---:|:---:|
| Portal-Ansicht | ✅ | ✅ |
| Profil-Verwaltung | ✅ | ✅ |
| Event-Kalender | ✅ | ✅ |
| QR-Check-in (scannen) | ✅ | ✅ |
| QR-Check-in (anzeigen) | ✅ | ✅ |
| Push Notifications | ✅ (Web Push) | ✅ (Native Push) |
| Offline-Fähigkeit | Basis (Caching) | Erweitert |
| Kamera-Zugriff | ✅ (für QR) | ✅ |
| Team-Chat | ❌ | ✅ |
| Dokument-Viewer | ✅ | ✅ |

### Push Notifications

```
PushNotification {
  tenant_id: string
  empfaenger_id: string
  
  titel: string
  nachricht: string
  link: string?                      // Deep-Link in App
  
  typ: "event" | "team" | "allgemein" | "erinnerung"
  
  gesendet_am: string
  gelesen: boolean
}
```

**Auslöser für Push:**
- Neues Event im eigenen Team
- Event abgesagt/geändert
- Beitrittsanfrage angenommen/abgelehnt
- Erinnerung vor Event (konfigurierbar: 1h, 1 Tag vorher)
- Neue Nachricht vom Verein

### Team-Chat (Native App, optional)

```
ChatNachricht {
  id: string
  tenant_id: string
  team_id: string
  
  absender_id: string
  nachricht: string
  typ: "text" | "bild" | "datei"
  datei_url: string?
  
  created_at: string
}
```

**Regeln:**
- Nur Team-Mitglieder können im Team-Chat schreiben
- Teamleiter können Chat moderieren (Nachrichten löschen)
- Keine End-to-End-Verschlüsselung (Vereins-Kontext, kein Messenger-Ersatz)
- Nachrichten werden nach 90 Tagen archiviert

---

## 6.7 Statistik-Dashboard

### Vereins-Statistiken

```
VereinStatistik {
  tenant_id: string
  zeitraum: { von: string, bis: string }
  
  // Mitglieder
  mitglieder_gesamt: number
  mitglieder_aktiv: number
  mitglieder_passiv: number
  neueintritte: number
  austritte: number
  netto_wachstum: number
  fluktuation_prozent: number
  
  // Demografie
  altersverteilung: { [altersgruppe: string]: number }
  geschlechterverteilung: { maennlich: number, weiblich: number, divers: number }
  
  // Abteilungen
  mitglieder_pro_abteilung: { [abteilung: string]: number }
  wachstum_pro_abteilung: { [abteilung: string]: number }
  
  // Engagement
  durchschnittliche_anwesenheit: number
  events_durchgefuehrt: number
  
  // Finanzen (wenn Modul aktiv)
  einnahmen_cent: number
  ausgaben_cent: number
  offene_beitraege_cent: number
}
```

### Dashboard-Widgets

| Widget | Daten | Visualisierung |
|--------|-------|----------------|
| Mitgliederentwicklung | Monatliche Zu-/Abgänge | Liniendiagramm |
| Altersstruktur | Altersgruppen-Verteilung | Balkendiagramm |
| Abteilungs-Vergleich | Mitglieder pro Abteilung | Tortendiagramm |
| Anwesenheits-Trend | Durchschnittliche Check-in Quote | Liniendiagramm |
| Finanz-Übersicht | Einnahmen vs. Ausgaben | Balkendiagramm |
| Neueintritte | Letzte 30 Tage | Zahl + Trend-Pfeil |
| Austritte | Letzte 30 Tage | Zahl + Trend-Pfeil |
| Offene Beiträge | Summe offener Forderungen | Zahl |

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/statistics/overview` | Dashboard-Übersicht |
| GET | `/statistics/members` | Mitglieder-Statistik (Zeitraum) |
| GET | `/statistics/attendance` | Anwesenheits-Statistik |
| GET | `/statistics/finance` | Finanz-Statistik |
| GET | `/statistics/departments/:id` | Abteilungs-Statistik |

---

## 6.8 Priorisierung

Die Features in Phase 6 sind unabhängig voneinander. Empfohlene Reihenfolge basierend auf Kundenwert:

| Priorität | Feature | Begründung |
|-----------|---------|-----------|
| 1 | Beitragsverwaltung + SEPA | Kernbedürfnis jedes Vereins, starker Differenziator |
| 2 | Statistik-Dashboard | Geringer Aufwand, hoher wahrgenommener Wert |
| 3 | Automatisierungen | Zeitersparnis für Ehrenamtliche |
| 4 | Kalender-Sync (iCal) | Geringer Aufwand, häufig nachgefragt |
| 5 | Mobile App (PWA) | Erreichbarkeit für Mitglieder |
| 6 | Finanzen/Kassenbuch | Wichtig, aber komplex |
| 7 | Verbandsmeldung-Export | Nische, aber Pflicht für viele Vereine |
| 8 | Umfragen | Nice-to-have |
| 9 | Team-Chat | Konkurrenz zu WhatsApp, schwer zu gewinnen |

---

## 6.9 Akzeptanzkriterien Phase 6

### Beitragsverwaltung
- [ ] Beitragsarten können mit Betrag, Rhythmus und Zuordnung erstellt werden
- [ ] Ermäßigungen (prozentual + absolut) funktionieren
- [ ] Beiträge werden automatisch zum Fälligkeitsdatum generiert
- [ ] SEPA-XML (PAIN.008) wird korrekt generiert
- [ ] Mahnlauf erstellt Mahnungen nach konfigurierbaren Stufen
- [ ] Rückläufer können erfasst werden

### Finanzen
- [ ] Buchungen (Einnahmen/Ausgaben) können erfasst werden
- [ ] Kassenbericht kann für beliebigen Zeitraum generiert werden
- [ ] DATEV-Export ist kompatibel

### Automatisierungen
- [ ] Datum-basierte Trigger (Geburtstag, Jubiläum) funktionieren
- [ ] Ereignis-basierte Trigger (Mitglied erstellt) funktionieren
- [ ] E-Mail-Aktionen werden korrekt ausgeführt
- [ ] Dry-Run zeigt betroffene Mitglieder ohne Ausführung

### Integrationen
- [ ] iCal-Feed ist generierbar und in Google Calendar importierbar
- [ ] Verbandsmeldung kann als Excel exportiert werden

### Mobile
- [ ] PWA ist installierbar auf iOS und Android
- [ ] QR-Check-in funktioniert über Kamera
- [ ] Push Notifications werden zugestellt
- [ ] Offline-Caching für Basis-Daten funktioniert

### Statistik
- [ ] Dashboard zeigt Mitgliederentwicklung korrekt
- [ ] Altersstruktur und Geschlechterverteilung werden berechnet
- [ ] Zeitraum-Filter funktioniert für alle Statistiken
