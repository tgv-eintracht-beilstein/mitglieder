# PRFAQ: Mitgliederportal des TGV „Eintracht" Beilstein 1823 e. V.

## Pressemitteilung

**Beilstein, März 2026** – Der TGV „Eintracht" Beilstein 1823 e. V. stellt sein neues digitales Mitgliederportal vor. Die Webanwendung ersetzt die bisherige papierbasierte Verwaltung von Abrechnungsformularen, Vereinsdokumenten und Beitragsübersichten durch eine moderne, mobilfähige Lösung – ohne Login, ohne Benutzerkonto, ohne Server-Datenbank.

Ehrenamtliche Funktionsträger, Übungsleiter und Mitglieder können ab sofort Ehrenamtspauschalen, Übungsleiterpauschalen und Reisekostenabrechnungen direkt im Browser ausfüllen, digital unterschreiben und als druckfertige PDF-Dokumente herunterladen. Alle Eingaben werden ausschließlich lokal im Browser gespeichert – es werden keine personenbezogenen Daten an einen Server übertragen.

„Unsere Ehrenamtlichen sollen ihre Zeit für den Verein nutzen, nicht für Papierkram", sagt der Vorstand. „Mit dem Portal können Formulare in wenigen Minuten am Handy ausgefüllt werden – oder leer ausgedruckt und klassisch per Hand unterschrieben werden."

Das Portal ist unter [mitglieder.tgveintrachtbeilstein.de](https://mitglieder.tgveintrachtbeilstein.de) erreichbar und steht allen Mitgliedern ohne Registrierung zur Verfügung.

---

## FAQ

### Allgemein

**Was ist das Mitgliederportal?**
Eine Webanwendung für Mitglieder und Ehrenamtliche des TGV „Eintracht" Beilstein. Sie bietet digitale Formulare für Abrechnungen, eine Dokumentenbibliothek mit Satzung und Ordnungen, eine Übersicht der aktuellen Mitgliedsbeiträge sowie ein vollständiges Impressum mit Datenschutzerklärung.

**Brauche ich ein Benutzerkonto?**
Nein. Das Portal funktioniert ohne Login und ohne Registrierung. Alle Daten bleiben lokal im Browser (localStorage).

**Funktioniert das Portal auf dem Handy?**
Ja. Alle Formulare und Seiten sind für mobile Geräte optimiert. Auf dem Handy werden PDFs direkt zum Download angeboten, auf dem Desktop kann alternativ gedruckt werden. Eingabeelemente wie Datums-, Zeit- und Monatsauswahl sind für Touch-Bedienung angepasst.

**Was passiert mit meinen Daten?**
Nichts verlässt Ihr Gerät. Formulardaten werden im localStorage des Browsers gespeichert und können jederzeit gelöscht werden. Es gibt keine Server-Datenbank, keine Tracking-Cookies, keine Analytics und keine Übertragung personenbezogener Daten. Details finden Sie in der Datenschutzerklärung unter Impressum & Datenschutz.

**Kann ich meine Daten sichern oder auf ein anderes Gerät übertragen?**
Ja. Unter „Impressum & Datenschutz" gibt es eine Export-Funktion, die alle gespeicherten Daten als JSON-Datei herunterlädt. Diese Datei kann auf einem anderen Gerät über die Import-Funktion wieder eingelesen werden.

**Kann ich alle meine gespeicherten Daten löschen?**
Ja. Über die Datenverwaltung im Impressum können Sie alle lokal gespeicherten Daten auf einmal löschen. Alternativ können Sie den Browser-Speicher manuell leeren.

---

### Formulare – Übergreifend

**Welche Formulare gibt es?**
- **Ehrenamtspauschale** – Abrechnung nach § 3 Nr. 26a EStG mit Erklärung zum Ehrenamtsfreibetrag, optionalem Verzicht auf Auszahlung (Aufwandsspende) und separater Verzichtserklärung als PDF
- **Übungsleiterpauschale** – Steuerfreie Vergütung für Übungsleiter nach § 3 Nr. 26 EStG mit Steuererklärung, Stunden-/Satzberechnung und Kategorieauswahl (Jugend/Erwachsene)
- **Reisekostenabrechnung** – Fahrtkosten mit Kilometerangaben (0,30 €/km) und Aufwandsentschädigungen

**Werden meine Eingaben gespeichert?**
Ja, automatisch und lokal im Browser. Beim nächsten Besuch sind alle Felder vorausgefüllt. Persönliche Daten (Name, Adresse, Geburtsdatum, Kontakt) werden formularübergreifend geteilt, sodass sie nur einmal eingegeben werden müssen.

**Muss ich digital unterschreiben?**
Nein. Die digitale Unterschrift ist bei allen Formularen optional. Formulare können auch ohne Unterschrift heruntergeladen oder ausgedruckt und per Hand unterschrieben werden.

**Wie funktioniert die digitale Unterschrift?**
Es gibt drei Möglichkeiten: direkt auf dem Bildschirm zeichnen, ein Bild der Unterschrift hochladen (JPG, PNG, GIF, WebP) oder eine zuvor gespeicherte Unterschrift wiederverwenden. Vor dem Unterschreiben muss eine Einwilligungserklärung bestätigt werden. Die Unterschrift wird formularübergreifend gespeichert und kann in allen Formularen wiederverwendet werden.

**Kann ich ein leeres Formular ausdrucken?**
Ja. Alle Felder einschließlich Ort/Datum und Unterschrift können leer gelassen werden. Das Ort/Datum-Feld kann explizit geleert werden, um ein komplett leeres Formular zum handschriftlichen Ausfüllen zu erzeugen.

**Wie funktioniert der PDF-Download?**
Das Formular wird im Browser als hochauflösendes PDF gerendert (3× Skalierung für scharfe Ausgabe). Der Dateiname wird automatisch generiert im Format `yyyy-mm-dd-titel-nachname-vorname.pdf`. Auf dem Desktop kann alternativ die Druckfunktion des Browsers genutzt werden.

**Was zeigt der Download-Button an, wenn Pflichtfelder fehlen?**
Der Button zeigt die Anzahl der fehlenden Pflichtfelder an. Beim Hovern (Desktop) erscheint eine Checkliste aller Pflichtfelder mit grünem Haken oder rotem Kreuz.

**Kann ich das Formular zurücksetzen?**
Ja. Jedes Formular hat einen „Formular zurücksetzen"-Button, der alle Eingaben auf die Standardwerte zurücksetzt.

---

### Ehrenamtspauschale

**Was enthält das Ehrenamtspauschale-Formular?**
Persönliche Daten, Abteilung und Funktion im Verein, Vergütungsbetrag, Erklärung zum Ehrenamtsfreibetrag nach § 3 Nr. 26a EStG, Zahlungsart (bar oder Überweisung) und optionaler Verzicht auf Auszahlung.

**Was bedeutet „Verzicht auf Auszahlung"?**
Ehrenamtliche können auf die Auszahlung verzichten und den Betrag als Aufwandsspende an den Verein zurückgeben. Bei Aktivierung wird der Spendenbetrag automatisch auf die volle Vergütung gesetzt. Das Portal erzeugt dann automatisch eine separate Verzichtserklärung als zusätzliches PDF.

**Was passiert bei vollständiger Spende?**
Wenn der Auszahlbetrag 0 € beträgt (vollständige Spende innerhalb des Freibetrags), entfällt die Auswahl der Zahlungsart. Stattdessen wird eine Dankesnachricht angezeigt.

**Wie funktioniert die Zahlungsart?**
Bei Auszahlung kann zwischen Barzahlung und Überweisung gewählt werden. Die IBAN-Eingabe mit automatischer Validierung erscheint nur bei Überweisung.

**Gibt es eine Obergrenze für die Vergütung?**
Ja. Die Vergütung wird gegen den gesetzlichen Ehrenamtsfreibetrag geprüft (840 € ab 2026). Bei Überschreitung wird eine Warnung angezeigt.

---

### Übungsleiterpauschale & Reisekostenabrechnung

**Was ist der Tätigkeitsnachweis?**
Eine tabellarische Aufstellung der einzelnen Tätigkeiten mit Datum, Zeitraum (von/bis), Beschreibung und – je nach Formular – Stundensatz oder Kilometerangabe. Zeilen können hinzugefügt und entfernt werden. Die Beträge werden automatisch berechnet.

**Wie funktioniert die Zeiteingabe?**
Über einen eigenen Zeitwähler mit Stunden- (0–23) und Minutenraster (00/15/30/45). Auf dem Handy öffnet sich ein Vollbild-Picker, der nach Auswahl von Stunde und Minute automatisch bestätigt. Auf dem Desktop wird jede Auswahl sofort übernommen.

**Was ist die Beschreibung-Autovervollständigung?**
Einmal eingegebene Tätigkeitsbeschreibungen werden lokal gespeichert und bei zukünftigen Eingaben als Vorschläge angeboten. So müssen wiederkehrende Beschreibungen nicht erneut getippt werden.

**Wie funktioniert die Monatsauswahl?**
Über einen Monatswähler mit Monatsraster und editierbarer Jahreseingabe. Der Abrechnungszeitraum (von/bis) wird im Formular und PDF als formatierter Bereich angezeigt (z. B. „Januar – März 2026").

**Was bedeutet „Aufwand erzwingen" bei der Übungsleiterpauschale?**
Die Aufwandsentschädigung darf den steuerfreien Freibetrag nicht überschreiten (3.300 € ab 2026, 3.000 € davor). Das Formular prüft dies automatisch und verhindert eine Überschreitung.

**Gibt es eine Steuererklärung im Formular?**
Ja, bei der Übungsleiterpauschale. Es muss angegeben werden, ob der Freibetrag nach § 3 Nr. 26 EStG in voller Höhe, bis zu einem bestimmten Betrag oder nicht in Anspruch genommen wird. Bei der Reisekostenabrechnung entfällt diese Erklärung.

**Wie wird die Aufwandsspende berechnet?**
Der Spendenbetrag kann frei gewählt oder per Button auf den vollen Aufwandsbetrag gesetzt werden. Der Auszahlbetrag ergibt sich aus der Differenz. Bei vollständiger Spende entfällt die Zahlungsart.

**Welche Kategorien gibt es bei der Übungsleiterpauschale?**
Jugend und Erwachsene. Die Kategorie wird im Formular und PDF angezeigt.

---

### Dokumente

**Welche Dokumente sind verfügbar?**
Die Vereinssatzung, alle Ordnungen (Beitragsordnung, Geschäftsordnung, Ehrenordnung etc.) sowie das Corporate-Design-Paket mit Logos, Schriften und Vorlagen. Dokumente können online gelesen oder als PDF heruntergeladen werden.

**Woher kommen die Dokumente?**
Die Dokumente werden aus einem separaten GitHub-Repository (`tgv-eintracht-beilstein/dokumentation`) als Markdown-Dateien geladen und bei jedem Build als statische Seiten generiert. PDF-Downloads verweisen auf die automatisch erzeugten PDFs im selben Repository.

---

### Mitgliedsbeiträge

**Wo finde ich die aktuellen Mitgliedsbeiträge?**
Unter „Mitgliedsbeiträge" sind alle Vereins- und Abteilungsbeiträge für das aktuelle Jahr aufgelistet – gegliedert nach Vereinsbeitrag und Abteilungsbeiträgen.

**Welche Abteilungen sind aufgeführt?**
Fußball, Gesang, Schwimmen, Handball, Tischtennis, Tennis, Turnen & Leichtathletik und Gymnastik. Jede Abteilung hat ein eigenes Icon und eine detaillierte Beitragsübersicht mit Kategorien (Aktive, Passive, Kinder, Familien, Fördermitglieder etc.).

**Kann ich die Beitragsübersicht ausdrucken?**
Ja. Auf dem Desktop über die Druckfunktion, auf dem Handy als PDF-Download. Die Druckversion enthält einen eigenen Header und Footer mit Vereinslogo und Bankverbindung.

---

### Impressum & Datenschutz

**Was enthält die Impressum-Seite?**
Vollständiges Impressum mit Vereinsanschrift, Vorstand, Registergericht, Kontaktdaten und Datenschutzbeauftragtem. Dazu eine ausführliche Datenschutzerklärung, die erklärt, welche Daten wo im Browser gespeichert werden (mit konkreten localStorage-Schlüsseln).

**Gibt es eine Datenexport/-import-Funktion?**
Ja. Unter „Ihre Daten verwalten" können alle lokal gespeicherten Formulardaten als JSON-Datei exportiert und auf einem anderen Gerät wieder importiert werden. Außerdem können alle Daten mit einem Klick gelöscht werden.

---

### Technisches

**Welche Technologie wird verwendet?**
Next.js mit statischer Generierung (Static Site Generation), gehostet auf GitHub Pages. Die Formulare nutzen React mit clientseitigem State. PDF-Erzeugung erfolgt über html2canvas und jsPDF mit 3× Skalierung. Styling mit Tailwind CSS.

**Werden Daten an Dritte übertragen?**
Nein. Die Seite ist vollständig statisch und hat kein Backend. Es gibt keine Tracking-Cookies, keine Analytics, keine externen API-Aufrufe bei der Formularnutzung und keine serverseitige Datenverarbeitung.

**Wie wird die IBAN validiert?**
Über den standardisierten Modulo-97-Algorithmus (ISO 13616). Die Validierung erfolgt in Echtzeit bei der Eingabe mit visueller Rückmeldung (grün/rot).

**Wie werden die PDFs erzeugt?**
Das Formular wird im Browser über html2canvas als Bild gerendert und anschließend mit jsPDF in ein PDF konvertiert. Bei Formularen mit Verzichtserklärung werden zwei separate PDFs erzeugt und nacheinander heruntergeladen.

**Wie funktioniert das Deployment?**
Automatisch über GitHub Actions. Bei jedem Push auf `main` wird die Seite gebaut und auf GitHub Pages deployed.
