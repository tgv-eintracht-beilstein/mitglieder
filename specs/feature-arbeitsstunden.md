# Feature-Vorschlag: Verpflichtende Arbeitsstunden — Konzept & Machbarkeit

> Antwort auf die Anfrage des TGV Fußball (Aug. 2026): Kennenlernen im Oktober 2026,
> Beschlussvorlage für die Mitgliederversammlung 2027. Status: **Entwurf / Diskussionsgrundlage**,
> noch kein committeter Roadmap-Bestandteil.

## Ziel

Prüfen, ob und wie sich verpflichtende Arbeitsstunden (Pflichteinsätze, "Ehrenamt-Soll")
digital abbilden lassen: Einsätze anlegen, Mitglieder (bzw. Eltern für ihre Kinder) melden
sich an, ein Verantwortlicher bestätigt nach dem Einsatz die Teilnahme, und daraus entsteht
ein prüfbares Stundenkonto je Mitglied/Familie — als Ersatz für lokale Excel-Listen ohne
Nachweis.

---

## 1. Was die Software dafür bereits mitbringt

Das Datenmodell und die geplanten Phasen (`specs/phase-1-foundation.md` bis
`phase-6-differenzierung-wachstum.md`) liefern die meisten Bausteine bereits mit:

| Baustein | Woher | Nutzen für Arbeitsstunden |
|---|---|---|
| Login/Portal mit Cognito, rollenbasierte Berechtigungen | Phase 1, Phase 4.1 | Mitglieder-Login, Basis für "wer darf was sehen/bestätigen" |
| Familien-/Gruppenzahler-Konzept (`familien_id`, `ist_gruppenzahler`) | Phase 2 | Grundlage für Familienkonten |
| **Adressbuch-Muster (bereits produktiv im TGV-Bereich)** | `src/lib/addressBook.ts`, genutzt in Mitglied-werden, Reisekosten, Ehrenkodex | Ein Login verwaltet mehrere verknüpfte Personen (z. B. Kinder) und stellt für jede eigene Formulare/Nachweise aus — genau das Muster, das für "Eltern als Vertreter" gebraucht wird |
| Digitale Unterschrift + PDF-Nachweis, bereits produktiv | `signature-modal.tsx`, `sign-pdf.js`, Ehrenkodex/Selbstverpflichtungserklärung | Vorlage für eine rechtssichere, digitale "Bestätigung, dass etwas stattgefunden hat" |
| Event-System mit Gästeliste, Zu-/Absage-Status | Phase 3.2 (`Event.gaeste[].status`) | Grundgerüst für "Einsatz anlegen" und "sich anmelden" |
| Check-in-System (QR / manuell durch Teamleiter) | Phase 4.2 | Grundgerüst für "Bestätigung, dass der Einsatz stattgefunden hat" |
| Nachrichten & E-Mail-Automatisierung (Erinnerungen) | Phase 3.1, Phase 6.5 | Erinnerung an offene Pflichtstunden vor Stichtag |
| Reporting/Export (z. B. Anwesenheitsstatistik als Excel) | Phase 4.2, Phase 6 | Vorbild für einen "Arbeitsstunden-Report" für den Vorstand |

**Kurzfassung:** Es müsste nichts von Grund auf neu erfunden werden — Arbeitsstunden lassen
sich als Kombination aus *Event* (Einsatz), *Check-in* (Bestätigung) und *Familienkonto*
(Eltern-Login) abbilden, die alle drei bereits konzipiert bzw. im aktuellen Mitgliederbereich
sogar schon im Einsatz sind.

## 2. Was fehlt / neu dazukommen müsste

1. **Einsatz als eigener Event-Typ** (`typ: "arbeitseinsatz"`) mit benötigter Helferzahl und
   Stundenwert statt reinem Ja/Nein-RSVP.
2. **Bestätigung *nach* dem Termin statt vorher** — der bestehende Check-in ist für
   "anwesend beim Training", das Arbeitsstunden-Modell braucht zusätzlich einen Status
   *"bestätigt vom Einsatzleiter"* mit Zeitstempel/Unterschrift als Nachweis.
3. **Stundenkonto pro Mitglied bzw. Familie** — Soll/Ist-Bilanz pro Vereinsjahr, keine
   Einzelbuchung wie beim Check-in.
4. **Eltern-als-Vertreter-Login formalisieren** — heute existiert das Adressbuch-Muster nur
   pro Formular; für Arbeitsstunden braucht es eine echte, dauerhafte Verknüpfung
   Erziehungsberechtigte(r) ↔ Kind mit Berechtigung, für das Kind An-/Abzumelden und dessen
   Stundenkonto einzusehen.
5. **Regelwerk-Engine** — konfigurierbar, wie viele Stunden pro Mitgliedsart/Alter/Familie
   fällig sind, wer befreit ist, ob Ehrenamt (Trainer, Vorstand, Kassenprüfer …) angerechnet
   wird, und ob/wie ein Freikauf möglich ist.
6. **Mahnwesen/Reporting** — Übersicht offener Stunden je Familie, Erinnerung vor Stichtag,
   Exportliste für den Vorstand zur Abrechnung nach Saisonende.

## 3. Vorgeschlagenes Datenmodell (Erweiterung, angelehnt an Phase 3/4)

```
Einsatz {                              // Spezialfall von Event (Phase 3.2), typ = "arbeitseinsatz"
  id, tenant_id, titel, beschreibung, start, ende, standort_id,
  abteilung_id, team_id,
  stunden_wert: number,                // wie viele Sollstunden zählt die Teilnahme
  max_helfer: number?,
  helfer: [{
    mitglied_id,                       // ggf. das Kind, angemeldet vom Elternteil
    angemeldet_von: string,            // Cognito-Sub des Elternteils/Mitglieds
    status: "angemeldet" | "abgesagt" | "bestätigt" | "nicht_erschienen",
    bestaetigt_von: string?,           // Einsatzleiter/Abteilungsleiter
    bestaetigt_am: string?
  }]
}

Arbeitsstundenkonto {
  tenant_id, vereinsjahr,
  konto_typ: "mitglied" | "familie",
  referenz_id: string,                 // mitglied_id oder familien_id
  soll_stunden: number,                // aus Regelwerk berechnet
  ist_stunden: number,                 // Summe bestätigter Einsätze
  freigekauft_stunden: number,
  buchungen: [{ einsatz_id, stunden, bestaetigt_am }]
}

Arbeitsstunden_Regelwerk {
  tenant_id,
  gilt_fuer: { alter_von, alter_bis, mitgliedsstatus: string[] },
  soll_stunden_pro_jahr: number,
  freikauf_erlaubt: boolean,
  freikauf_betrag_cent: number?,
  anrechnung_ehrenamt: boolean,        // Trainer/Vorstandstätigkeit zählt mit
  stichtag: string                     // z. B. "31.10." des Vereinsjahres
}
```

Das reiht sich sauber neben `Event`, `Members` und `Structure` aus Phase 1/3 ein und
bräuchte keine neue Kernarchitektur — nur zwei neue DynamoDB-Tabellen bzw. Item-Typen und
einen zusätzlichen RBAC-Eintrag ("Einsatzleiter").

## 4. Die zwei konkreten Fragen aus der Anfrage

**"Digital: anmelden/registrieren, danach Bestätigung dass es stattgefunden hat"**
→ Anmeldung = neuer Helfer-Eintrag im Einsatz (wie RSVP bei Events). Bestätigung = separater
Schritt *nach* dem Termin durch den Einsatzleiter/Abteilungsleiter (Rolle aus Phase 1.5),
analog zum manuellen Check-in (Phase 4.2), aber mit Zeitstempel + Namenszeichnung als Nachweis
statt reiner Anwesenheitsmarkierung — dasselbe Signatur-Muster wie beim Ehrenkodex.

**"Login-Bereich für Mitglieder bzw. Eltern als Vertreter ihrer Kinder"**
→ Grundmuster existiert bereits produktiv (Adressbuch/Familienverknüpfung). Für
Arbeitsstunden müsste daraus eine feste Eltern-Kind-Verknüpfung mit eigenen Rechten werden
(Kind anmelden, Kind-Stundenkonto einsehen), statt einer Formular-zu-Formular-Auswahl.

## 5. Vorschlag für Oktober: klickbarer Prototyp statt Konzeptpapier

Damit der Vorstand die Funktionsweise wirklich *ausprobieren* statt nur lesen kann, böte sich
ein nicht-produktiver Prototyp an, begrenzt auf eine Testabteilung/-gruppe:

- Einsatz anlegen (Titel, Termin, benötigte Helfer, Stundenwert)
- Anmeldung durch Testmitglieder bzw. testweise "als Elternteil für Kind"
- Bestätigung durch eine Testperson in der Rolle Einsatzleiter
- Übersicht "Meine Arbeitsstunden" (Soll/Ist) im Mitgliederbereich
- Einfacher Export für den Vorstand

Das lässt sich, sobald gewünscht, als Zeitrahmen von wenigen Tagen Umsetzung + Testphase vor
Oktober einplanen — separat vom Produktiv-Betrieb, damit nichts an der laufenden
Mitgliederverwaltung hängt.

## 6. Offene Entscheidungen für Regelwerk & Beschluss MV 2027

| Frage | Anmerkung |
|---|---|
| Wie viele Stunden pro Jahr, pro Mitglied oder pro Familie? | Bestimmt `soll_stunden_pro_jahr` |
| Wer ist betroffen? Ab welchem Alter, welche Mitgliedsarten (passiv, Ehrenmitglieder)? | Bestimmt `gilt_fuer` im Regelwerk |
| Zählt Ehrenamt (Trainer, Vorstand, Kassenprüfer, Jugendleiter) als Arbeitsstunden? | Sonst De-facto-Doppelbelastung Aktiver |
| Freikauf: ja/nein, welcher Betrag, wer legt ihn fest? | Ihr habt selbst angemerkt: reines Freikaufen bringt keine Helfer — ggf. bewusst hoch ansetzen oder ganz weglassen |
| Was passiert bei Nichterfüllung? | Für Rechtssicherheit braucht eine Umlage/Ablöse eine klare Grundlage in Satzung oder Beitragsordnung (echter Aufwendungsersatz, keine verdeckte Beitragserhöhung) — das sollte vor der MV rechtlich kurz geprüft werden, unabhängig von der Software |
| Datenschutz: wer sieht wessen Stundenkonto? | Eltern nur die eigenen Kinder, Abteilungsleiter nur die eigene Abteilung — passt zum bestehenden RBAC-Modell (Phase 1.5) |
| Stichtag & Vereinsjahr | Verfällt eine offene Stunde am Stichtag oder wird sie ins Folgejahr übertragen? |

Diese Punkte betreffen die Satzungs-/Ordnungsseite, nicht die Software — aber das Regelwerk
in Abschnitt 3 ist bewusst so gebaut, dass sich jede Antwort darauf ohne Software-Änderung
konfigurieren lässt (Soll-Stunden, Freikaufbetrag, Altersgrenzen, Anrechnung sind Parameter,
kein Code).

---

*Nächster Schritt: Rückmeldung, ob der Prototyp-Umfang aus Abschnitt 5 für den
Oktober-Termin passt, dann Umsetzung auf einer Testabteilung.*
