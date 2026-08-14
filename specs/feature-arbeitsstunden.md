# Arbeitsstunden — maximal einfach, maximal automatisch

> Konzept für den TGV Fußball. Kennenlernen Oktober 2026, Beschlussvorlage MV 2027.
> Status: **Entwurf / Diskussionsgrundlage.**

## Die Leitidee

Jedes Arbeitsstunden-System scheitert an derselben Stelle: **es macht Arbeit, um Arbeit zu
verwalten.** Wer Helfer sucht, will keine Software pflegen. Wer helfen soll, will kein Konto
anlegen. Deshalb sind hier vier Entscheidungen die Basis — alles andere folgt daraus:

| # | Entscheidung | Wirkung |
|---|---|---|
| 1 | **Kein Login für Mitglieder.** Persönlicher Link per Mail/SMS, ein Tipp genügt. | Kein Passwort, kein „ich komm nicht rein", keine Support-Last beim Vorstand |
| 2 | **Bestätigung per Widerspruch, nicht per Zusage.** Wer sich gemeldet hat, bekommt die Stunden automatisch gutgeschrieben — außer der Einsatzleiter meldet aktiv „war nicht da". | Der Normalfall kostet **null** Klicks. Nur die Ausnahme macht Arbeit |
| 3 | **Der Haushalt ist die Einheit, nicht die Person.** Soll und Ist zählen pro Familie. | Die ganze „Eltern als Vertreter"-Komplexität entfällt ersatzlos — es gibt nichts zu vertreten, die Familie *ist* das Konto |
| 4 | **Der Stand kommt zum Mitglied, nicht das Mitglied zum Stand.** Kontostand steht unter jeder Mail. | Niemand muss irgendwo nachsehen. Kein Portal-Zwang |

Alles, was diesen vier Punkten widerspricht, fliegt raus — auch wenn es „nice to have" wäre.

---

## So sieht es für ein Mitglied aus

Eine Familie mit einem F-Jugend-Kind, über die ganze Saison:

1. **September**, eine Mail: *„Familie Müller: 5 Arbeitsstunden bis 30.06. Hier die nächsten
   Gelegenheiten."*
2. **Alle 2–3 Wochen** eine kurze Mail mit 3–5 offenen Schichten, die zeitlich passen.
   Ein Button pro Schicht: **„Mach ich."** Ein Tipp. Fertig. Kein Formular, kein Login.
3. Sofort danach: Bestätigungsmail mit **Kalendereintrag (.ics)** → Termin steht im Handy.
   Erinnerung 2 Tage vorher.
4. **Nach dem Einsatz: nichts zu tun.** Am Folgetag: *„Danke! 2 Std. gutgeschrieben.
   Stand: 2 von 5."*
5. **Falls im Mai noch was offen ist:** *„Noch 3 Stunden — hier die letzten Termine."*

**Gesamter Aufwand fürs Mitglied: eine Mail lesen, pro Einsatz einmal tippen.**
Kein Konto, kein Passwort, keine App, kein Nachtragen, kein Nachfragen.

## So sieht es für den Funktionär aus

| Wann | Was zu tun ist |
|---|---|
| Einmal pro Saison | Schicht-Vorlagen je Spieltag anlegen (Kasse, Grill, Kuchen, Auf-/Abbau …) + eine Zahl: Soll-Stunden pro Haushalt |
| Pro Heimspiel | **Nichts.** Schichten entstehen automatisch aus dem Spielplan |
| Helfer suchen | **Nichts.** Einladungen gehen automatisch raus, bevorzugt an Haushalte mit dem größten Rückstand |
| Nach dem Einsatz | Eine Mail: „War jemand nicht da?" — Ignorieren = alle bekommen ihre Stunden |
| Saisonende | Ein Klick: Liste aller Haushalte mit Soll/Ist für den Vorstand |

---

## Die drei Mechanismen, die das tragen

### 1. Schichten entstehen von selbst

Der Verein hat bereits einen Spielplan. Eine Vorlage pro Heimspiel-Typ genügt:

```
Heimspiel Herren  →  Kasse (2 Pers., 3 Std.)
                     Grill (3 Pers., 4 Std.)
                     Kuchentheke (2 Pers., 3 Std.)
                     Aufbau (2 Pers., 1 Std.) / Abbau (2 Pers., 1 Std.)
```

Spielplan importieren (iCal/CSV, ggf. aus fussball.de — **vorab zu prüfen, ob der Export dort
verfügbar ist**) → alle Schichten der Saison stehen. Danach kein Anlegen pro Spieltag mehr.
Sonderveranstaltungen (Sommerfest, Turnier) legt man von Hand an — der Aufwand ist ein Formular
pro Jahr, nicht pro Woche.

### 2. Einladung nach Rückstand statt Gießkanne

Nicht alle bekommen alles. Vor jeder Einladungsrunde wird sortiert: **wer am weitesten hinten
liegt, wird zuerst gefragt.** Ergebnis:

- Familien, die ihr Soll erfüllt haben, werden **nicht mehr behelligt** → keine Mail-Müdigkeit
- Die Last verteilt sich von allein, ohne dass jemand eine Liste führt
- Ist eine Schicht 10 Tage vorher nicht voll, geht sie automatisch an alle raus

Das ist der Teil, der in Excel schlicht nicht geht — und der Teil, der aus „wir fragen immer
dieselben fünf Leute" ein faires System macht.

### 3. Gutschrift durch Schweigen

Der eigentliche Trick. Nach dem Einsatz bekommt der Einsatzleiter **eine** Mail:

> Kuchentheke, Sa 14.09. — angemeldet waren: Müller, Schmidt, Yildirim.
> Alles wie geplant? Dann ist nichts zu tun.
> [War jemand nicht da?]

Passiert nichts, werden nach 72 Stunden alle Stunden gutgeschrieben. Nur bei einem Nein-Fall
muss überhaupt jemand klicken. In der Praxis heißt das: **an den allermeisten Spieltagen
klickt niemand irgendwo hin, und die Stunden stimmen trotzdem.**

---

## Datenmodell — drei Dinge, mehr nicht

```
Haushalt {                         // die Kontoeinheit
  id, tenant_id, name,
  kontakte: [{ name, email, mobil? }],   // Eltern, beide, egal wer klickt
  mitglieder: [mitglied_id],             // die Kinder/Aktiven dahinter
  soll_stunden: number,                  // aus Vereins-Einstellung, überschreibbar
  befreit: boolean, befreiungsgrund: string?
}

Schicht {
  id, tenant_id, titel, start, ende, stunden, benoetigt: number,
  quelle: "vorlage" | "manuell", event_ref?,
  helfer: [{ haushalt_id, person_name, zugesagt_am, status }]
  // status: "zugesagt" | "gutgeschrieben" | "nicht_erschienen" | "abgesagt"
}

Buchung {
  id, tenant_id, haushalt_id, jahr, stunden,
  quelle: "einsatz" | "ehrenamt_pauschal" | "korrektur",
  schicht_id?, notiz?, angelegt_am, angelegt_von
}
```

Der Kontostand wird **aus den Buchungen berechnet**, nicht separat gepflegt — damit kann er
nicht auseinanderlaufen. Vereins-Einstellungen sind vier Zahlen, keine Regel-Engine:
Soll-Stunden pro Haushalt, Stichtag, Widerspruchsfrist, (optional) Ausgleichsbetrag.

**Ehrenamt anrechnen** ist eine einzige Pauschal-Buchung pro Saison: *„Trainer F-Jugend →
20 Std."* Einmal eintragen, erledigt. Kein Regelwerk, keine Altersstaffeln, keine Matrix.

## Was wir bewusst **nicht** bauen

Jeder dieser Punkte klingt sinnvoll und macht das System schlechter:

| Nicht bauen | Warum |
|---|---|
| QR-Code-Check-in vor Ort | Zusätzliche Hürde (Handy, Scannen, Empfang) für ein Problem, das Mechanismus 3 schon löst |
| Eigene Login-/Rechte-Verwaltung für Eltern | Entfällt komplett durch den Haushalt als Kontoeinheit |
| Freikauf-Bezahlflow | Ihr sagt selbst: bringt keine Helfer. Falls die MV einen Ausgleichsbetrag beschließt, erscheint er als Zahl auf der Jahresliste — den Einzug macht der Kassier im bestehenden Beitragslauf |
| Regelwerk-Engine mit Alters-/Statusstaffeln | Eine Zahl + Ausnahmeliste deckt 95 % ab. Staffeln kann man nachrüsten, wenn sie wirklich beschlossen werden |
| Eigene App | Mail + ein Link reichen. Eine App müsste installiert und gepflegt werden |
| Unterschrift/PDF pro Einsatz | Für eine Kuchentheke unverhältnismäßig. Nachweis = lückenloses Protokoll (siehe unten) |

## Zum Thema „Nachweis"

Ihr habt zu Recht betont, dass Excel ohne Nachweis das Kernproblem ist. Der Nachweis hier ist
nicht eine Unterschrift, sondern das **lückenlose Protokoll**: Wer sich wann für welche Schicht
gemeldet hat, wer wann gutgeschrieben hat (bzw. dass die Frist ohne Widerspruch ablief), wer
wann etwas korrigiert hat — alles mit Zeitstempel und Urheber, nicht änderbar ohne
Korrekturbuchung. Das ist belastbarer als jede unterschriebene Liste, weil nichts nachträglich
still verschwinden kann.

Auf Wunsch pro Haushalt am Saisonende ein PDF-Auszug — die PDF-Erzeugung ist im Repo bereits
produktiv im Einsatz (`src/lib/pdf-forms.tsx`, Ehrenkodex/Beitragsformulare).

---

## Woran wir andocken (und was neu ist)

**Vorhanden und wiederverwendbar:**
- Cognito-Login + Rollen für die *Funktionärs*-Seite → `src/lib/auth.ts`, `infrastructure/lib/auth-stack.ts`
- EventBridge-Pipeline für asynchrone Verarbeitung → `backend/src/send-message.js`, `process-message.js`
  (genau das Muster für Erinnerungen und Fristabläufe)
- DynamoDB-Tabellen inkl. Events-Tabelle → `infrastructure/lib/database-stack.ts`
- PDF-Erzeugung und Formular-Einreichung → `backend/src/submit-form.js`, `src/lib/pdf-forms.tsx`

**Neu zu bauen:**
- **E-Mail-Versand nach außen (Amazon SES)** — bisher gibt es nur den internen Postkorb; SES ist
  in Phase 3 vorgesehen, aber noch nicht aufgesetzt. Das ist die Grundlage des ganzen Konzepts
  und sollte als Erstes stehen.
- Signierte Einmal-Links (Token, begrenzte Gültigkeit) statt Login
- Die drei Entities oben + der Zeitsteuerung (Einladungsrunden, Widerspruchsfrist)

**Die eine offene Abwägung:** Der persönliche Link ist ein Zugangsschlüssel — wer ihn
weiterleitet, gibt den Zugriff auf den Haushalts-Kontostand weiter. Dahinter stehen nur Namen
und Stundenzahlen, keine Bank- oder Gesundheitsdaten, und Links laufen ab. Ich halte das für
verhältnismäßig; wer mehr will, kann sich zusätzlich normal einloggen (Cognito ist da). Diese
Entscheidung sollte der Vorstand aber bewusst treffen, nicht ich.

---

## Was für die MV 2027 zu entscheiden ist

Bewusst kurz — das ist Satzungs-/Ordnungsarbeit, nicht Software:

1. **Wie viele Stunden pro Haushalt und Jahr?** (Eine Zahl. Pro Haushalt, nicht pro Kind —
   sonst zahlt die kinderreiche Familie doppelt.)
2. **Wer ist befreit?** (Passive, Ehrenmitglieder, Alleinerziehende … — als Ausnahmeliste)
3. **Zählt Ehrenamt mit?** (Trainer, Vorstand, Schiri, Jugendleiter — sonst trifft es die,
   die ohnehin schon tragen)
4. **Was passiert bei Nichterfüllung?** ⚠️ Hier liegt das rechtliche Risiko, nicht in der
   Technik: Eine Umlage/Ablöse braucht eine saubere Grundlage in Satzung oder Beitragsordnung,
   sonst ist sie als verdeckte Beitragserhöhung angreifbar. **Vor der MV kurz vereinsrechtlich
   prüfen lassen** — unabhängig davon, welche Software am Ende läuft.
5. **Stichtag** und ob Rest-Stunden verfallen oder ins Folgejahr wandern.

Alle fünf Antworten sind im Modell oben Einstellungen — keine davon erzwingt eine
Software-Änderung.

---

## Vorschlag für Oktober

Ein lauffähiger Prototyp auf einer Testabteilung, mit dem der Vorstand den kompletten Weg
einmal selbst durchspielt — nicht produktiv, ohne Anbindung an die echte Mitgliederverwaltung:

1. Schicht-Vorlage anlegen, Testspielplan importieren → Schichten entstehen
2. Einladungsmail mit „Mach ich"-Button an ein paar Testhaushalte
3. Anmeldung ohne Login, Bestätigungsmail + Kalendereintrag
4. Widerspruchsfrist läuft ab → Stunden automatisch gutgeschrieben
5. Kontostand-Mail + Vorstandsliste Soll/Ist

Damit ist die Frage „funktioniert das für uns?" nach 15 Minuten Ausprobieren beantwortet — und
die Regelwerk-Diskussion für die MV startet auf einer konkreten Grundlage statt auf einem
Konzeptpapier.

*Rückmeldung erbeten: passt dieser Zuschnitt, und ist die Entscheidung „Link statt Login"
(Abschnitt Abwägung) so für euch in Ordnung?*
