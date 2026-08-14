# Arbeitsstunden — maximal einfach, maximal automatisch

> Konzept für den TGV Fußball. Kennenlernen Oktober 2026, Beschlussvorlage MV 2027.
> Status: **Entwurf / Diskussionsgrundlage.**

## Kernaussage

**Wir sollten das nicht neu bauen.** Die Prüfung der easyVerein-API (`easyverein-api.json`,
562 Endpunkte) zeigt: Der Motor für Arbeitsstunden ist bereits da und ihr bezahlt ihn schon.
Termine mit Anmeldefenster, Anmeldung durch Mitglieder, Einladung ganzer Gruppen per Knopfdruck,
E-Mail- und App-Benachrichtigungen, Kalendereintrag, Rechnungserzeugung, sogar Begleitpersonen
(= Eltern melden sich **mit** Kind an) — alles vorhanden.

Was fehlt, sind genau **drei** Dinge. Die bauen wir als dünne Automatisierungsschicht daneben,
nicht als zweites System. Das ist die eigentliche Vereinfachung: **Mitglieder bekommen nicht
noch ein Portal, sondern nutzen das, was sie ohnehin haben.**

---

## Was easyVerein bereits mitbringt

Belegt an den Endpunkten der API-Spec im Repo:

| Was wir brauchen | Endpunkt / Feld | Status |
|---|---|---|
| Einsatz als Termin anlegen | `POST /event` mit `min_participators`, `max_participators` | ✅ da |
| Anmeldefenster („ab wann, bis wann anmeldbar") | `start_participation`, `end_participation` | ✅ da |
| Mitglied meldet sich an | `POST /event/{id}/participation`, `state` | ✅ da |
| **Eltern melden sich mit Kind an** | `is_companion` (Begleitperson) | ✅ da |
| Einladung an ganze Gruppen | `POST /participation/invite-groups` | ✅ da |
| Einladungs-/Bestätigungsmails | `email-notification`, `emailNotificationInformParticipant` | ✅ da |
| Push aufs Handy | App-Notifications (`appNotificationEventChanged` …) | ✅ da |
| Kalendereintrag fürs Handy | `icsLink` am Event, `member/me/personal-calendar-export-url` | ✅ da |
| **Bestätigung nur durch Verantwortliche** | Mitglieder dürfen `state` nur auf 0/1/2 setzen — höhere Werte bleiben Admins vorbehalten | ✅ da (Semantik am Livesystem zu prüfen, s. u.) |
| Stundenkonto am Mitglied sichtbar | `custom-field` + `member/{id}/custom-fields` (inkl. Bulk-Update) | ✅ da |
| Wiederkehrende Einsätze | `create-interval-participation` | ✅ da |
| Spielplan importieren | `calendar.calendar_import_url` (ICS-Import) | ✅ da |
| Ausgleichsbetrag abrechnen | `event/{id}/generate-invoices`, `price-group`, bestehender SEPA-Lauf | ✅ da |
| Login für Mitglieder | Mitgliederbereich + App; zusätzlich OAuth2/OIDC (`oauth2-application`, `oauth2-custom-claim`) | ✅ da |
| Helferaufgaben je Termin | `task` mit `parent_event` | ✅ da |
| Lückenloses Protokoll | `notification-log`, Changelogs, Änderungsanträge mit accept/deny | ✅ da |

**Das heißt konkret:** Die Punkte aus eurer Anfrage — *„anmelden/registrieren und anschließend
Bestätigung dass es stattgefunden hat"* und *„Loginbereich für Mitglieder bzw. Eltern"* — sind
im Kern **bereits abgedeckt**. Was easyVerein nicht kennt, ist der Begriff „Arbeitsstunde".

## Die drei Lücken

1. **Kein Stundenkonto.** easyVerein zählt Teilnahmen, aber summiert sie nicht zu Soll/Ist je
   Haushalt und Vereinsjahr. Custom Fields können den Stand *speichern* und anzeigen — füllen
   muss ihn jemand.
2. **Keine Gutschrift-Automatik.** Es gibt keine Regel „72 Stunden nach dem Termin allen
   Angemeldeten die Stunden gutschreiben, außer es widerspricht jemand".
3. **Keine bedarfsgerechte Einladung.** `invite-groups` lädt eine *ganze* Gruppe ein. „Frag
   zuerst die, die am weitesten hinten liegen" muss von außen kommen.

Genau diese drei Dinge bauen wir — als kleiner Dienst, der über die API mit easyVerein spricht.
Alles andere bleibt easyVerein.

---

## Die Leitprinzipien

| # | Entscheidung | Wirkung |
|---|---|---|
| 1 | **Ein System, nicht zwei.** Anmeldung, Termin, Benachrichtigung, Stand — alles in easyVerein bzw. dessen App. | Mitglieder lernen nichts Neues. Kein zweiter Login, keine zweite Datenhaltung |
| 2 | **Bestätigung per Widerspruch, nicht per Zusage.** Wer angemeldet war, bekommt die Stunden automatisch — außer der Einsatzleiter meldet aktiv „war nicht da". | Der Normalfall kostet **null** Klicks |
| 3 | **Der Haushalt ist die Einheit.** Soll und Ist zählen pro Familie, nicht pro Person. | Die „Eltern als Vertreter"-Frage löst sich auf — zusätzlich deckt `is_companion` den Fall „Elternteil bringt Kind mit" schon technisch ab |
| 4 | **Der Stand kommt zum Mitglied.** Als Custom Field im Profil und in jeder Mail sichtbar. | Niemand muss irgendwo nachsehen |

## So sieht es für eine Familie aus

1. **September:** Nachricht über easyVerein — *„Familie Müller: 5 Arbeitsstunden bis 30.06."*
2. **Alle 2–3 Wochen:** Einladung zu 3–5 passenden Einsätzen (App-Push oder Mail).
   **Ein Tipp = angemeldet.** Wer sein Soll erfüllt hat, wird nicht mehr gefragt.
3. Termin landet über den ICS-Link automatisch im Handy-Kalender, Erinnerung inklusive.
4. **Nach dem Einsatz: nichts zu tun.** Stunden erscheinen im Profil.
5. **Bei Rückstand im Mai:** gezielte Erinnerung mit den letzten Gelegenheiten.

## So sieht es für den Funktionär aus

| Wann | Was zu tun ist |
|---|---|
| Einmal pro Saison | Schicht-Vorlagen + eine Zahl: Soll-Stunden pro Haushalt |
| Pro Heimspiel | **Nichts** — Termine entstehen aus dem importierten Spielplan |
| Helfer suchen | **Nichts** — Einladungen laufen automatisch, nach Rückstand sortiert |
| Nach dem Einsatz | Eine Nachricht: „War jemand nicht da?" — Ignorieren = alle bekommen ihre Stunden |
| Saisonende | Eine Liste Soll/Ist für den Vorstand |

---

## Die drei Automatismen — konkret

**1. Einsätze aus dem Spielplan.** Spielplan als ICS in easyVerein importieren
(`calendar_import_url`); unser Dienst liest die Heimspiele und legt je Spieltag die Schichten
als Events an (`POST /event/bulk-create` — Bulk, wegen des Rate-Limits von 100 Requests/Minute).
Eine Vorlage pro Spieltyp, danach kein Anlegen mehr von Hand.

**2. Einladung nach Rückstand.** Vor jeder Runde: Stundenstand je Haushalt lesen, aufsteigend
sortieren, den hintersten N Haushalten die offenen Schichten anbieten
(`POST /participation/invite` bzw. `invite-groups`). Ist eine Schicht 10 Tage vorher nicht voll,
geht sie an alle. Das macht aus „wir fragen immer dieselben fünf Leute" ein System, das sich
selbst ausbalanciert — und es ist der Teil, der in Excel schlicht nicht geht.

**3. Gutschrift durch Schweigen.** Nach dem Termin eine Nachricht an den Einsatzleiter mit der
Namensliste und einem einzigen Link „War jemand nicht da?". Passiert nichts, schreibt der Dienst
nach 72 Stunden allen Angemeldeten die Stunden gut (Custom Field per
`member/{id}/custom-fields/bulk-update`). **An den allermeisten Spieltagen klickt niemand
irgendwo hin, und die Stunden stimmen trotzdem.**

## Datenmodell — was wir selbst halten

Fast nichts. Mitglieder, Termine, Anmeldungen, Kontostand leben in easyVerein. Bei uns liegt nur:

```
Haushalt      { id, easyverein_member_ids[], soll_stunden, befreit, grund? }
Buchung       { id, haushalt_id, jahr, stunden, quelle, event_id?, angelegt_am, angelegt_von }
Vorlage       { spieltyp, schichten[{ titel, dauer, benoetigt, stunden }] }
```

Der Kontostand wird aus den Buchungen berechnet und nach easyVerein **zurückgeschrieben**, damit
er dort im Profil und in der App steht. Vier Einstellungen, keine Regel-Engine. „Ehrenamt
anrechnen" ist eine Pauschal-Buchung pro Saison (*Trainer F-Jugend → 20 Std.*), einmal eintragen.

## Was wir bewusst **nicht** bauen

Gegenüber dem ersten Entwurf fällt hier noch mehr weg — jedes Streichen ist ein Gewinn:

| Nicht bauen | Warum |
|---|---|
| Eigenes Event-/Anmeldesystem | easyVerein hat es inklusive Anmeldefenster, Kapazität und Begleitpersonen |
| **Eigener E-Mail-Versand (SES)** | easyVerein verschickt Einladungen und Bestätigungen selbst, über das SMTP-Profil des Vereins. Nur für frei formulierte Rundmails bliebe ein eigener Versand nötig — und das ist kein Muss |
| **Eigenes Login / Magic Links** | Mitgliederbereich und App existieren; für alles Weitere gibt es OAuth2/OIDC. Der Umweg über Einmal-Links aus dem ersten Entwurf ist damit vom Tisch |
| Eigene Kalender-/ICS-Erzeugung | `icsLink` liefert das fertig |
| QR-Code-Check-in | Zusätzliche Hürde für ein Problem, das die Gutschrift-Automatik löst |
| Freikauf-Bezahlflow | Ihr sagt selbst: bringt keine Helfer. Falls die MV einen Ausgleichsbetrag beschließt, erzeugt easyVerein die Rechnung (`generate-invoices`) im bestehenden Beitragslauf |
| Regel-Engine mit Alters-/Statusstaffeln | Eine Zahl + Ausnahmeliste deckt 95 % ab |

## Zum Thema „Nachweis"

Der Nachweis ist nicht eine Unterschrift, sondern das **lückenlose Protokoll**: Wer wann
angemeldet wurde, wer wann gutgeschrieben hat bzw. dass die Frist ohne Widerspruch ablief, wer
wann korrigiert hat. easyVerein führt dafür bereits Changelogs und `notification-log`; unsere
Buchungen sind unveränderlich und werden nur durch Korrekturbuchungen aufgehoben. Das ist
belastbarer als jede unterschriebene Liste, weil nichts still verschwinden kann.

---

## Offene technische Punkte

**⚠️ Zuerst zu klären — betrifft den laufenden Betrieb, nicht die Arbeitsstunden:**
Die easyVerein-Doku sagt, API-Tokens sind **30 Tage gültig und müssen nach 15 Tagen über
`refresh-token` erneuert werden**; jede Antwort trägt dazu ein `tokenRefreshNeeded`-Flag. Im
Repo lesen `get-my-data.js`, `get-my-documents.js` und `get-announcements.js` einen **statischen
Token aus dem Secrets Manager — eine Erneuerung findet nirgends statt**. Entweder wird der Token
bislang von Hand rotiert, oder der Mitgliederbereich fällt beim Ablauf aus. Das sollte
unabhängig von diesem Vorhaben geprüft und automatisiert werden.

Weitere Punkte:
- **Status-Semantik prüfen:** Welche `state`-Werte bedeuten was, und welcher steht nur Admins
  offen? Klärt `GET /participation/descriptions` am Livesystem — davon hängt ab, ob
  „bestätigt" ohne Zusatzfeld abbildbar ist.
- **API-Version:** Das Repo nutzt v3.0 (snake_case), offiziell „stable" ist v2.0 (camelCase).
  Vor dem Bau festlegen, auf welche Version wir uns stützen.
- **Rate-Limit 100 Anfragen/Minute** → konsequent die Bulk-Endpunkte nutzen.
- **App-Nutzung im Jugendbereich:** Wie viele Eltern haben die easyVerein-App bzw. einen
  Mitgliederbereich-Zugang? Davon hängt ab, ob wir zusätzlich einen niederschwelligen Mail-Weg
  brauchen. **Das ist die wichtigste offene Frage — bitte im Verein erheben.**

## Was für die MV 2027 zu entscheiden ist

Das ist Satzungs-/Ordnungsarbeit, nicht Software:

1. **Wie viele Stunden pro Haushalt und Jahr?** (Pro Haushalt, nicht pro Kind — sonst zahlt die
   kinderreiche Familie doppelt.)
2. **Wer ist befreit?** (Passive, Ehrenmitglieder, Alleinerziehende … als Ausnahmeliste)
3. **Zählt Ehrenamt mit?** (Trainer, Vorstand, Schiri — sonst trifft es die, die ohnehin tragen)
4. **Was passiert bei Nichterfüllung?** ⚠️ Hier liegt das rechtliche Risiko, nicht in der
   Technik: Eine Umlage braucht eine saubere Grundlage in Satzung oder Beitragsordnung, sonst
   ist sie als verdeckte Beitragserhöhung angreifbar. **Vor der MV vereinsrechtlich prüfen
   lassen** — unabhängig davon, welche Software läuft.
5. **Stichtag**, und ob Rest-Stunden verfallen oder ins Folgejahr wandern.

Alle fünf sind im Modell oben Einstellungen — keine erzwingt eine Software-Änderung.

---

## Vorschlag für Oktober

Weil der Motor steht, ist der Prototyp deutlich kleiner als zunächst gedacht — im Wesentlichen
Konfiguration von easyVerein plus ein kleiner Automatik-Dienst, auf einer Testabteilung:

1. Testtermine als Einsätze in easyVerein anlegen, mit Anmeldefenster und Helferzahl
2. Einladung an ein paar Testhaushalte — Anmeldung über App/Mitgliederbereich, ein Tipp
3. Widerspruchsfrist läuft ab → Stunden werden automatisch gebucht und als Custom Field ins
   Profil zurückgeschrieben
4. Übersicht Soll/Ist für den Vorstand

Damit ist nach 15 Minuten Ausprobieren beantwortet, ob das für euch funktioniert — und die
Regelwerk-Diskussion für die MV startet auf einer konkreten Grundlage.

*Rückmeldung erbeten: (a) passt dieser Zuschnitt, (b) wie verbreitet sind App/Mitgliederbereich
bei euren Eltern, und (c) sollen wir vorab das Token-Thema oben prüfen?*
