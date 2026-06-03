# Phase 2: Kernfunktionen — Detaillierte Spezifikation

## Ziel

Die zentralen Verwaltungsfunktionen einer Vereinssoftware implementieren: Vereinsstruktur (hierarchisch), vollständige Mitgliederverwaltung, Listen-System und Abteilungs-/Team-Management. Am Ende von Phase 2 kann ein Verein seine komplette Organisationsstruktur abbilden und Mitglieder verwalten.

---

## 2.1 Vereinsstruktur

### Anforderungen

Die Vereinsstruktur bildet die hierarchische Gliederung eines Vereins ab. Sie ist frei konfigurierbar und unterstützt bis zu 3 Ebenen.

### Ebenen-Konzept

| Ebene | Beispiel Sportverein | Beispiel Musikverein | Konfigurierbar |
|-------|---------------------|---------------------|----------------|
| Ebene 1 | Abteilung (Fußball, Tennis) | Ensemble (Orchester, Chor) | Label frei wählbar |
| Ebene 2 | Altersklasse (U9, U12, Senioren) | Leistungsstufe (Anfänger, Fortgeschritten) | Label frei wählbar |
| Ebene 3 | Mannschaft (Mädchen, Jungen) | Gruppe (Sopran, Alt) | Label frei wählbar |

### Datenmodell: Vereinsstruktur-Knoten

```
StrukturKnoten {
  id: string (UUID)
  tenant_id: string
  parent_id: string | null        // null = Root-Ebene
  ebene: 1 | 2 | 3
  name: string                    // z.B. "Fußball", "U12", "Mädchen"
  sort_order: number              // Reihenfolge innerhalb der Ebene
  fachverbandsnummer: string?     // Optional, z.B. "Fußball 30"
  gruppierung: string?            // Gruppierung für Portal-Anzeige
  sichtbarkeit: "öffentlich" | "intern" | "verborgen"
  im_antrag_anzeigen: boolean     // Im Online-Mitgliedsantrag wählbar?
  beschreibung: string?           // Rich-Text Beschreibung
  bild_url: string?               // Header-Bild
  kontakt_info: {
    name: string?
    email: string?
    telefon: string?
  }?
  created_at: string (ISO 8601)
  updated_at: string (ISO 8601)
}
```

### Regeln

- Ebene 1 hat keinen Parent (Root-Level)
- Ebene 2 muss Parent in Ebene 1 haben
- Ebene 3 muss Parent in Ebene 2 haben
- Löschen nur möglich wenn keine Mitglieder zugeordnet sind
- Fachverbandsnummer wird von Ebene 1 an alle Kinder vererbt (überschreibbar pro Kind)
- Labels der Ebenen sind pro Verein konfigurierbar (in Tenant-Settings)

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/structure` | Gesamte Struktur als Baum |
| POST | `/structure/nodes` | Neuen Knoten anlegen |
| PUT | `/structure/nodes/:id` | Knoten bearbeiten |
| DELETE | `/structure/nodes/:id` | Knoten löschen (nur wenn leer) |
| PUT | `/structure/nodes/:id/reorder` | Reihenfolge ändern |
| PUT | `/tenants/me/structure-labels` | Ebenen-Labels konfigurieren |

### Antwort-Format (Baum)

```json
{
  "data": {
    "labels": ["Abteilung", "Altersklasse", "Mannschaft"],
    "nodes": [
      {
        "id": "abt_fussball",
        "name": "Fußball",
        "ebene": 1,
        "fachverbandsnummer": "Fußball 30",
        "children": [
          {
            "id": "ak_u12",
            "name": "U12",
            "ebene": 2,
            "children": [
              { "id": "team_maedchen", "name": "Mädchen", "ebene": 3, "children": [] }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 2.2 Mitgliederverwaltung

### Mitglied-Datenmodell

```
Mitglied {
  id: string (UUID)
  tenant_id: string
  
  // Stammdaten
  anrede: "Herr" | "Frau" | "Divers" | null
  vorname: string
  nachname: string
  geburtsdatum: string (ISO Date)
  geschlecht: "männlich" | "weiblich" | "divers" | "keine Angabe"
  
  // Kontakt
  email: string?
  telefon: string?
  mobil: string?
  
  // Adresse
  strasse: string?
  hausnummer: string?
  plz: string?
  ort: string?
  land: string (default: "DE")
  
  // Bankdaten (verschlüsselt)
  iban: string? (encrypted)
  bic: string?
  kontoinhaber: string?
  sepa_mandat_datum: string?
  sepa_mandat_referenz: string?
  
  // Mitgliedschaft
  mitgliedsnummer: string? (auto-generiert oder manuell)
  eintrittsdatum: string (ISO Date)
  austrittsdatum: string?
  status: "aktiv" | "passiv" | "ausgetreten" | "gesperrt"
  ehrenmitglied: boolean
  
  // Vereinsstruktur-Zuordnung
  zuordnungen: [
    {
      struktur_knoten_id: string
      seit: string (ISO Date)
      bis: string?
      status: "aktiv" | "inaktiv"
    }
  ]
  
  // Verbandsmeldung
  in_verbandsmeldung: boolean (default: true)
  
  // Familie/Gruppenzahler
  familien_id: string?           // Verknüpfung zu Familien-Gruppe
  ist_gruppenzahler: boolean
  gruppenzahler_id: string?      // Verweis auf zahlende Person
  
  // Meta
  notizen: string?
  custom_fields: Record<string, string>?
  created_at: string (ISO 8601)
  updated_at: string (ISO 8601)
  created_by: string (User-ID)
}
```

### Mitgliedschaft-Zeiträume

Ein Mitglied kann mehrere Mitgliedschafts-Zeiträume haben (Austritt + Wiedereintritt):

```
MitgliedschaftZeitraum {
  id: string
  mitglied_id: string
  eintrittsdatum: string
  austrittsdatum: string?
  status: "aktiv" | "passiv"
  austrittsgrund: string?
}
```

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/members` | Liste (paginiert, filterbar) |
| POST | `/members` | Mitglied anlegen |
| GET | `/members/:id` | Detail-Ansicht |
| PUT | `/members/:id` | Mitglied bearbeiten |
| DELETE | `/members/:id` | Mitglied löschen (Soft-Delete) |
| POST | `/members/:id/zuordnungen` | Struktur-Zuordnung hinzufügen |
| DELETE | `/members/:id/zuordnungen/:zuordnungId` | Zuordnung entfernen |
| POST | `/members/:id/mitgliedschaften` | Neuen Zeitraum anlegen |
| GET | `/members/export` | Excel/CSV-Export |
| POST | `/members/import` | CSV-Import |

### Filter-Parameter (GET /members)

| Parameter | Typ | Beschreibung |
|-----------|-----|-------------|
| `status` | string | aktiv, passiv, ausgetreten |
| `abteilung_id` | string | Filter nach Abteilung |
| `team_id` | string | Filter nach Team |
| `struktur_knoten_id` | string | Filter nach beliebigem Struktur-Knoten |
| `geschlecht` | string | männlich, weiblich, divers |
| `altersgruppe_von` | number | Mindestalter |
| `altersgruppe_bis` | number | Höchstalter |
| `eintrittsdatum_von` | string | Eingetreten nach Datum |
| `eintrittsdatum_bis` | string | Eingetreten vor Datum |
| `ehrenmitglied` | boolean | Nur Ehrenmitglieder |
| `search` | string | Volltextsuche (Name, E-Mail, Mitgliedsnummer) |
| `page` | number | Seite (default: 1) |
| `page_size` | number | Einträge pro Seite (default: 50, max: 200) |
| `sort_by` | string | Sortierfeld |
| `sort_order` | "asc" \| "desc" | Sortierrichtung |

### Verbandsmeldung

Die Verbandsmeldung ist ein Bericht über alle Mitglieder zu einem Stichtag.

**Parameter:**
- `stichtag`: Datum (z.B. 01.04.2026)
- `typ`: "A-Meldung" (jedes Mitglied einmal) | "B-Meldung" (pro Abteilung gezählt)
- `status_filter`: "aktiv" | "passiv" | "alle"

**Ausgabe:**
- Gruppiert nach Abteilung
- Pro Abteilung: Anzahl männlich / weiblich / divers / gesamt
- Pro Jahrgang: Aufschlüsselung
- Export als Excel

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/reports/verbandsmeldung` | Verbandsmeldung generieren |
| GET | `/reports/verbandsmeldung/export` | Als Excel exportieren |

---

## 2.3 Listen-System

### Konzept

Listen sind gespeicherte Ansichten auf Mitglieder-Daten. Es gibt zwei Typen:

| Typ | Beschreibung | Aktualisierung |
|-----|-------------|----------------|
| **Smarte Liste** | Regelbasiert (Filter-Kriterien gespeichert) | Automatisch — Mitglieder die Kriterien erfüllen sind enthalten |
| **Statische Liste** | Manuell zusammengestellt | Manuell — Mitglieder werden explizit hinzugefügt/entfernt |
| **Freie Liste** | Benutzerdefinierte Spalten, kein Mitglieder-Bezug | Manuell — für To-Dos, Kuchenlisten etc. |

### Datenmodell: Liste

```
Liste {
  id: string (UUID)
  tenant_id: string
  name: string
  typ: "smart" | "statisch" | "frei"
  kategorie: "mitglieder" | "abteilung" | "frei"
  
  // Nur für smarte Listen
  filter_kriterien: {
    status: string[]?
    abteilung_ids: string[]?
    team_ids: string[]?
    geschlecht: string[]?
    altersgruppe_von: number?
    altersgruppe_bis: number?
    ehrenmitglied: boolean?
    custom_rules: FilterRule[]?
  }?
  
  // Nur für statische Listen
  mitglieder_ids: string[]?
  
  // Nur für freie Listen
  spalten: [
    {
      id: string
      name: string
      typ: "text" | "zahl" | "datum" | "checkbox" | "auswahl"
      optionen: string[]?  // Für Typ "auswahl"
      pflichtfeld: boolean
    }
  ]?
  eintraege: [
    {
      id: string
      werte: Record<string, any>
      erstellt_von: string
      erstellt_am: string
    }
  ]?
  
  // Berechtigungen
  berechtigungen: [
    {
      rolle_id: string
      zugriff: "vollzugriff" | "lesen" | "gesperrt"
    }
  ]
  
  // Meta
  erstellt_von: string
  created_at: string
  updated_at: string
}
```

### Berechtigungen pro Liste

- Jede Liste kann individuell pro Rolle freigegeben werden
- Optionen: `vollzugriff` | `lesen` | `gesperrt`
- Gesperrte Listen sind für die Rolle unsichtbar
- Superadmin hat immer Vollzugriff

### API-Endpunkte

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/lists` | Alle Listen (gefiltert nach Berechtigung) |
| POST | `/lists` | Neue Liste erstellen |
| GET | `/lists/:id` | Liste mit Inhalt abrufen |
| PUT | `/lists/:id` | Liste bearbeiten |
| DELETE | `/lists/:id` | Liste löschen |
| GET | `/lists/:id/members` | Mitglieder der Liste (smart: berechnet, statisch: gespeichert) |
| POST | `/lists/:id/members` | Mitglied zu statischer Liste hinzufügen |
| DELETE | `/lists/:id/members/:memberId` | Mitglied aus statischer Liste entfernen |
| PUT | `/lists/:id/permissions` | Berechtigungen setzen |
| GET | `/lists/:id/export` | Liste als Excel exportieren |

### Smarte Listen — Auswertung

Smarte Listen werden bei jedem Abruf dynamisch berechnet:
1. Filter-Kriterien werden auf die Mitglieder-Tabelle angewendet
2. Ergebnis wird paginiert zurückgegeben
3. Mitglieder die neu hinzukommen und Kriterien erfüllen, erscheinen automatisch
4. Mitglieder die Kriterien nicht mehr erfüllen, verschwinden automatisch

---

## 2.4 Abteilungs- & Team-Management

### Abteilung (= Struktur-Knoten Ebene 1)

Abteilungen sind die oberste Organisationsebene. Sie werden über die Vereinsstruktur (2.1) angelegt und haben zusätzliche Verwaltungsfunktionen:

**Erweiterte Abteilungs-Attribute:**
```
Abteilung (extends StrukturKnoten) {
  // Zusätzlich zu StrukturKnoten:
  teams: Team[]
  mitglieder_anzahl: number (computed)
  aufnahmestopp: boolean
  dokumente: DokumentRef[]
  kontaktpersonen: [
    {
      mitglied_id: string
      rolle: string  // z.B. "Abteilungsleiter", "Stellvertreter"
    }
  ]
}
```

### Team-Datenmodell

```
Team {
  id: string (UUID)
  tenant_id: string
  abteilung_id: string           // Gehört zu Abteilung
  struktur_knoten_id: string?    // Optional: Zuordnung zu Ebene 2/3
  
  name: string
  beschreibung: string?          // Rich-Text
  bild_url: string?
  
  gruppierung: string?           // Für Portal-Gruppierung (z.B. "Herren", "Damen", "Kids")
  fachverbandsnummer: string?    // Überschreibt Abteilungs-Nummer
  
  sichtbarkeit: "öffentlich" | "intern" | "verborgen"
  status: "veröffentlicht" | "unveröffentlicht"
  beitritt_genehmigung: boolean  // Beitrittsanfrage erforderlich?
  
  // Teamleitung
  teamleitung: [
    {
      mitglied_id: string
      rechte: TeamleiterRechte
    }
  ]
  
  // Mitglieder
  mitglieder_ids: string[]
  max_mitglieder: number?        // Kapazitätsgrenze (optional)
  
  created_at: string
  updated_at: string
}
```

### Teamleiter-Rechte (konfigurierbar pro Teamleiter)

```
TeamleiterRechte {
  mitglieder_annehmen: boolean       // Beitrittsanfragen annehmen/ablehnen
  mitglieder_hinzufuegen: boolean    // Neue Mitglieder zum Team hinzufügen
  mitglieder_entfernen: boolean      // Mitglieder aus Team entfernen
  dokumente_hochladen: boolean       // Team-Dokumente verwalten
  mitglieder_exportieren: boolean    // Mitgliederliste exportieren
  export_umfang: "basis" | "basis_kontakt" | "alle"  // Welche Felder im Export
  anwesenheit_verwalten: boolean     // Check-in Liste verwalten
  events_erstellen: boolean          // Events für das Team erstellen
}
```

### Potenzielle Teammitglieder

Mitglieder die einen Beitrag für eine Abteilung zahlen, aber noch keinem Team zugeordnet sind:

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/departments/:id/potential-members` | Potenzielle Teammitglieder der Abteilung |

**Logik:** Alle Mitglieder mit `zuordnung.struktur_knoten_id` = Abteilung, die in keinem Team der Abteilung sind.

### Beitrittsanfragen

```
Beitrittsanfrage {
  id: string
  tenant_id: string
  team_id: string
  mitglied_id: string
  status: "ausstehend" | "angenommen" | "abgelehnt"
  nachricht: string?             // Optionale Nachricht des Mitglieds
  bearbeitet_von: string?        // User-ID
  bearbeitet_am: string?
  created_at: string
}
```

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/teams/:id/requests` | Ausstehende Beitrittsanfragen |
| POST | `/teams/:id/requests` | Beitrittsanfrage stellen (als Mitglied) |
| PUT | `/teams/:id/requests/:requestId` | Anfrage annehmen/ablehnen |

### Aufnahmestopp

- Pro Abteilung aktivierbar
- Wenn aktiv: Abteilung wird im Online-Mitgliedsantrag nicht angezeigt
- Bestehende Mitglieder sind nicht betroffen
- Nur superadmin/admin/abteilungsleiter können Stopp setzen/aufheben

### API-Endpunkte (Teams)

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/departments/:deptId/teams` | Teams einer Abteilung |
| POST | `/departments/:deptId/teams` | Team erstellen |
| GET | `/teams/:id` | Team-Detail |
| PUT | `/teams/:id` | Team bearbeiten |
| DELETE | `/teams/:id` | Team löschen |
| POST | `/teams/:id/members` | Mitglied zum Team hinzufügen |
| DELETE | `/teams/:id/members/:memberId` | Mitglied aus Team entfernen |
| GET | `/teams/:id/members` | Team-Mitglieder auflisten |
| PUT | `/teams/:id/leaders/:leaderId` | Teamleiter-Rechte konfigurieren |
| POST | `/teams/:id/leaders` | Teamleiter hinzufügen |
| DELETE | `/teams/:id/leaders/:leaderId` | Teamleiter entfernen |
| GET | `/teams/:id/members/export` | Team-Mitglieder exportieren |

---

## 2.5 Datenvalidierung

### Pflichtfelder bei Mitglied-Erstellung

| Feld | Pflicht | Validierung |
|------|---------|-------------|
| vorname | ✅ | Min 1, Max 100 Zeichen |
| nachname | ✅ | Min 1, Max 100 Zeichen |
| geburtsdatum | ✅ | Gültiges Datum, nicht in der Zukunft |
| eintrittsdatum | ✅ | Gültiges Datum |
| email | ❌ | Gültiges E-Mail-Format wenn angegeben |
| iban | ❌ | IBAN-Validierung (Prüfziffer) wenn angegeben |
| plz | ❌ | 5 Ziffern (DE), länderspezifisch |

### Eindeutigkeits-Constraints

- E-Mail pro Tenant eindeutig (wenn angegeben)
- Mitgliedsnummer pro Tenant eindeutig
- Team-Name pro Abteilung eindeutig
- Struktur-Knoten-Name pro Parent eindeutig

---

## 2.6 Akzeptanzkriterien Phase 2

- [ ] Vereinsstruktur kann mit bis zu 3 Ebenen angelegt werden
- [ ] Ebenen-Labels sind pro Verein konfigurierbar
- [ ] Mitglieder können mit allen Stammdaten angelegt und bearbeitet werden
- [ ] Mitglieder können einer oder mehreren Struktur-Knoten zugeordnet werden
- [ ] Verbandsmeldung (A + B) kann zu beliebigem Stichtag generiert werden
- [ ] Smarte Listen werden automatisch aktualisiert wenn sich Mitgliederdaten ändern
- [ ] Freie Listen können mit benutzerdefinierten Spalten erstellt werden
- [ ] Listen-Berechtigungen können pro Rolle gesetzt werden
- [ ] Teams können erstellt und Mitglieder zugewiesen werden
- [ ] Teamleiter-Rechte sind individuell konfigurierbar
- [ ] Beitrittsanfragen können gestellt und bearbeitet werden
- [ ] Aufnahmestopp blendet Abteilung im Antrag aus
- [ ] Potenzielle Teammitglieder werden korrekt berechnet
- [ ] Excel-Export funktioniert für Mitglieder und Listen
- [ ] CSV-Import für Mitglieder funktioniert (mit Fehler-Report)
- [ ] Abteilungsleiter sieht nur seine Abteilung und deren Teams
