# PRFAQ: Mitglieder – Der Account-Bereich des TGV „Eintracht" Beilstein 1823 e. V.

## Pressemitteilung

**Beilstein, Q3 2026** – Der TGV „Eintracht" Beilstein 1823 e. V. kündigt „Mitglieder" an – einen persönlichen Account-Bereich für alle Vereinsmitglieder. Aufbauend auf dem bestehenden Mitgliederportal, das Formulare und Dokumente rein lokal im Browser bereitstellt, geht der Verein den nächsten Schritt: Mitglieder erhalten ein eigenes Konto, über das sie ihre Stammdaten pflegen, Formulare direkt digital einreichen, ihren Beitragsstatus einsehen und mit dem Verein kommunizieren können.

„Das bisherige Portal hat gezeigt, dass unsere Mitglieder digitale Werkzeuge annehmen – wenn sie einfach genug sind", sagt der Vorstand. „Mit ‚Mitglieder' machen wir den logischen nächsten Schritt: Vom Formular-Download zur echten digitalen Mitgliederverwaltung. Aber ohne Komplexität. Kein Passwort merken, kein Benutzername – einfach E-Mail-Link klicken und drin sein."

Der Account-Bereich wird unter [mitglieder.tgveintrachtbeilstein.de/konto](https://mitglieder.tgveintrachtbeilstein.de/konto) erreichbar sein. Die bestehenden Funktionen (Formulare, Dokumente, Beitragsübersicht) bleiben weiterhin ohne Login nutzbar.

---

## Das Problem

### Für Mitglieder

- Formulare werden im Browser ausgefüllt und als PDF heruntergeladen – aber dann per E-Mail, WhatsApp oder Papier an den Verein übermittelt. Dieser Medienbruch ist umständlich und fehleranfällig.
- Persönliche Daten (Adresse, Bankverbindung, Kontakt) müssen bei Änderungen dem Verein separat mitgeteilt werden. Es gibt keinen zentralen Ort, an dem Mitglieder ihre eigenen Daten aktuell halten können.
- Mitglieder haben keine Übersicht über eingereichte Formulare, offene Beiträge oder den Status ihrer Anträge.
- Familienmitgliedschaften sind intransparent – Eltern wissen nicht genau, welche Kinder in welchen Abteilungen gemeldet sind.

### Für den Verein

- Eingereichte PDFs müssen manuell in die Vereinsverwaltung übertragen werden.
- Adressänderungen kommen über verschiedene Kanäle (E-Mail, Anruf, Zettel) und gehen unter.
- Es gibt keine digitale Übersicht, welche Formulare eingereicht wurden und welche noch ausstehen.
- Die Kommunikation mit Mitgliedern läuft über private E-Mail-Adressen und Messenger – ohne Archiv, ohne Nachvollziehbarkeit.

---

## Die Lösung

„Mitglieder" ist ein persönlicher Account-Bereich, der das bestehende Portal um vier Kernfunktionen erweitert:

### 1. Persönliches Konto mit Magic-Link-Login

Mitglieder melden sich mit ihrer E-Mail-Adresse an. Statt Passwort erhalten sie einen Einmal-Link per E-Mail (Magic Link). Kein Passwort vergessen, kein Benutzername, kein Registrierungsprozess. Die Ersteinladung erfolgt durch den Verein.

### 2. Stammdaten-Selbstverwaltung

Mitglieder pflegen ihre eigenen Daten: Name, Adresse, Geburtsdatum, Telefon, E-Mail, Bankverbindung (IBAN). Änderungen werden dem Verein automatisch als Änderungsantrag übermittelt und nach Prüfung übernommen. Bei Familienmitgliedschaften sehen Eltern alle zugehörigen Familienmitglieder und deren Abteilungszugehörigkeiten.

### 3. Digitale Formulareinreichung

Die bestehenden Formulare (Ehrenamtspauschale, Übungsleiterpauschale, Reisekostenabrechnung) können direkt aus dem Account heraus eingereicht werden – ohne PDF-Download, ohne E-Mail. Das Formular wird digital signiert und geht direkt an die zuständige Stelle im Verein. Mitglieder sehen eine Übersicht aller eingereichten Formulare mit Status (eingereicht, in Bearbeitung, erledigt).

### 4. Beitragsstatus und Vereinskommunikation

Mitglieder sehen ihren aktuellen Beitragsstatus (bezahlt, offen, überfällig) und erhalten Benachrichtigungen vom Verein – z. B. Erinnerungen an ausstehende Beiträge, Einladungen zu Versammlungen oder Informationen zu Abteilungsänderungen. Alles an einem Ort, alles nachvollziehbar.

---

## Architektur-Prinzipien

- **Bestehende Funktionen bleiben ohne Login nutzbar.** Formulare, Dokumente und Beitragsübersicht funktionieren weiterhin anonym und lokal. Der Account-Bereich ist eine optionale Erweiterung.
- **Privacy by Design.** Minimale Datenhaltung. Nur Daten, die der Verein ohnehin hat (Mitgliederstammdaten), werden digital abgebildet. Keine Tracking-Cookies, keine Analytics, keine Drittanbieter.
- **Magic Link statt Passwort.** Kein Passwort-Management, kein Brute-Force-Risiko, kein „Passwort vergessen"-Flow. Ein Link, eine E-Mail, fertig.
- **Serverless wo möglich.** Authentifizierung und Datenbank über verwaltete Cloud-Dienste (z. B. AWS Cognito + DynamoDB oder Supabase). Kein eigener Server-Betrieb.
- **Schrittweise Migration.** Mitglieder, die den Account nicht nutzen wollen, verlieren keine bestehende Funktionalität. Die Adoption erfolgt organisch.

---

## FAQ

### Allgemein

**Was ist „Mitglieder"?**
Ein persönlicher Account-Bereich für Mitglieder des TGV „Eintracht" Beilstein. Mitglieder können sich anmelden, ihre Daten verwalten, Formulare digital einreichen und ihren Beitragsstatus einsehen.

**Muss ich „Mitglieder" nutzen?**
Nein. Alle bestehenden Funktionen (Formulare ausfüllen und als PDF herunterladen, Dokumente lesen, Beitragsübersicht) bleiben ohne Login verfügbar. Der Account-Bereich ist ein zusätzliches Angebot.

**Was ändert sich am bestehenden Portal?**
Nichts. Das Portal unter mitglieder.tgveintrachtbeilstein.de funktioniert wie bisher. Der Account-Bereich wird als zusätzlicher Menüpunkt „Mein Konto" integriert.

**Kostet das etwas?**
Nein. Der Account-Bereich ist für alle Mitglieder kostenlos.

---

### Anmeldung & Sicherheit

**Wie melde ich mich an?**
Mit Ihrer beim Verein hinterlegten E-Mail-Adresse. Sie erhalten einen Einmal-Link per E-Mail, der Sie direkt einloggt. Kein Passwort nötig.

**Was ist ein Magic Link?**
Ein einmaliger, zeitlich begrenzter Link, der per E-Mail zugeschickt wird. Ein Klick darauf meldet Sie an. Der Link ist 15 Minuten gültig und kann nur einmal verwendet werden.

**Brauche ich ein Passwort?**
Nein. Die Anmeldung funktioniert ausschließlich über Magic Links. Es gibt kein Passwort, das vergessen oder gestohlen werden kann.

**Wie sicher ist das?**
So sicher wie Ihr E-Mail-Konto. Der Magic Link ist einmalig, zeitlich begrenzt und an Ihre E-Mail-Adresse gebunden. Die Verbindung ist durchgehend verschlüsselt (HTTPS). Sitzungen laufen nach 30 Tagen automatisch ab.

**Kann ich mich auf mehreren Geräten anmelden?**
Ja. Jedes Gerät erhält eine eigene Sitzung über einen neuen Magic Link.

**Was passiert, wenn ich meine E-Mail-Adresse ändere?**
Wenden Sie sich an den Verein. Nach Aktualisierung der E-Mail-Adresse in der Mitgliederverwaltung können Sie sich mit der neuen Adresse anmelden.

---

### Stammdaten

**Welche Daten kann ich einsehen und ändern?**
Name, Adresse, Geburtsdatum, Telefonnummer, E-Mail-Adresse und Bankverbindung (IBAN). Bei Familienmitgliedschaften zusätzlich die Daten der zugehörigen Familienmitglieder.

**Werden Änderungen sofort übernommen?**
Nein. Änderungen werden als Änderungsantrag an den Verein übermittelt und nach Prüfung durch die Geschäftsstelle übernommen. Sie sehen den Status Ihres Antrags im Account.

**Warum werden Änderungen nicht sofort übernommen?**
Weil der Verein die Datenhoheit behält. Änderungen an Stammdaten (insbesondere Bankverbindung und Adresse) werden geprüft, um Fehler und Missbrauch zu vermeiden.

**Kann ich die Daten meiner Kinder verwalten?**
Ja, wenn Sie als Familienoberhaupt einer Familienmitgliedschaft zugeordnet sind. Sie sehen alle Familienmitglieder und deren Abteilungszugehörigkeiten.

---

### Formulare

**Was ändert sich bei den Formularen?**
Wenn Sie angemeldet sind, werden Ihre Stammdaten automatisch in die Formulare übernommen. Nach dem Ausfüllen können Sie das Formular direkt digital einreichen – ohne PDF-Download und ohne E-Mail.

**Kann ich Formulare weiterhin als PDF herunterladen?**
Ja. Die PDF-Funktion bleibt vollständig erhalten. Die digitale Einreichung ist eine zusätzliche Option.

**Was passiert nach der Einreichung?**
Das Formular erscheint in Ihrer Übersicht mit dem Status „Eingereicht". Sobald es vom Verein bearbeitet wurde, ändert sich der Status auf „In Bearbeitung" und schließlich auf „Erledigt".

**Bekomme ich eine Bestätigung?**
Ja. Nach der Einreichung erhalten Sie eine Bestätigung im Account. Optional auch per E-Mail.

---

### Beiträge

**Kann ich meine Beiträge online bezahlen?**
Nein, nicht in der ersten Version. Der Beitragsstatus zeigt an, ob Beiträge offen oder bezahlt sind. Die Zahlung erfolgt weiterhin per SEPA-Lastschrift oder Überweisung.

**Was sehe ich im Beitragsstatus?**
Eine Übersicht Ihrer Vereins- und Abteilungsbeiträge für das aktuelle und vergangene Jahre: Betrag, Fälligkeitsdatum und Status (bezahlt, offen, überfällig).

**Bekomme ich Erinnerungen bei offenen Beiträgen?**
Ja. Bei überfälligen Beiträgen wird eine Erinnerung im Account angezeigt. Optional kann eine E-Mail-Benachrichtigung aktiviert werden.

---

### Datenschutz

**Welche Daten werden gespeichert?**
Nur die Daten, die der Verein ohnehin in seiner Mitgliederverwaltung führt: Stammdaten, Abteilungszugehörigkeiten, Beitragsstatus und eingereichte Formulare.

**Wo werden die Daten gespeichert?**
In einer verschlüsselten Datenbank in der EU (AWS Frankfurt oder vergleichbar). Es werden keine Daten an Dritte weitergegeben.

**Kann ich mein Konto löschen?**
Ja. Über die Kontoeinstellungen können Sie Ihr Konto deaktivieren. Die Vereinsmitgliedschaft bleibt davon unberührt – nur der digitale Zugang wird entfernt.

**Was passiert mit meinen Daten, wenn ich aus dem Verein austrete?**
Das Konto wird nach dem Austritt automatisch deaktiviert. Daten werden gemäß den gesetzlichen Aufbewahrungsfristen gelöscht.

---

### Technisches

**Welche Technologie wird verwendet?**
Das bestehende Next.js-Frontend wird um geschützte Routen erweitert. Authentifizierung über einen verwalteten Auth-Dienst (Magic Link via E-Mail). Backend-Logik über serverlose Funktionen (API Routes oder AWS Lambda). Datenbank über einen verwalteten Dienst (DynamoDB, Supabase o. ä.).

**Bleibt die Seite weiterhin statisch?**
Die öffentlichen Seiten (Formulare, Dokumente, Beitragsübersicht) bleiben statisch generiert. Der Account-Bereich wird serverseitig gerendert (SSR) oder clientseitig geladen, je nach Anforderung.

**Wie wird die Migration der Bestandsdaten durchgeführt?**
Die Geschäftsstelle lädt die bestehenden Mitgliederdaten (Name, E-Mail, Abteilungen) einmalig in das System. Mitglieder erhalten dann eine Einladungs-E-Mail mit Magic Link zur Erstanmeldung.

**Gibt es eine API?**
Ja, eine interne REST-API für die Kommunikation zwischen Frontend und Backend. Keine öffentliche API in der ersten Version.

---

### Rollout

**Wann kommt „Mitglieder"?**
Geplant für Q4 2026. Zunächst als Beta für den Vorstand und ausgewählte Abteilungsleiter, dann schrittweise für alle Mitglieder.

**Wie erfahre ich davon?**
Per E-Mail vom Verein. Mitglieder mit hinterlegter E-Mail-Adresse erhalten eine Einladung zur Erstanmeldung.

**Was, wenn ich keine E-Mail-Adresse habe?**
Dann nutzen Sie das Portal wie bisher – ohne Login, mit PDF-Download. Der Account-Bereich setzt eine E-Mail-Adresse voraus.
