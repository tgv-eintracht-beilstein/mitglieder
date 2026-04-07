const faqs = [
  { q: "Wie werde ich Mitglied im TGV Eintracht Beilstein?", a: 'Füllen Sie das Online-Formular unter "Mitglied werden" aus. Sie erhalten Datenschutzerklärung, Aufnahmeantrag und SEPA-Mandat als PDF zum Ausdrucken und Unterschreiben. Die unterschriebenen Unterlagen geben Sie in der Geschäftsstelle ab oder senden sie per Post.' },
  { q: "Ab wann gilt meine Mitgliedschaft?", a: "Die Mitgliedschaft beginnt mit dem Datum, das auf dem Aufnahmeantrag eingetragen ist – in der Regel der Tag der Abgabe." },
  { q: "Kann ich in mehreren Abteilungen gleichzeitig aktiv sein?", a: "Ja. Wählen Sie im Aufnahmeantrag einfach alle gewünschten Abteilungen aus. Für jede Abteilung fällt ein eigener Abteilungsbeitrag an, der Vereinsbeitrag wird nur einmal berechnet." },
  { q: "Was kostet die Mitgliedschaft?", a: 'Der Vereinsbeitrag beträgt 80 € (Erwachsene), 35 € (Kinder bis 18) oder 130 € (Familie) pro Jahr. Dazu kommt der jeweilige Abteilungsbeitrag. Alle Details finden Sie unter "Mitgliedsbeiträge".' },
  { q: "Gibt es eine Familienmitgliedschaft?", a: "Ja. Ab zwei Personen im selben Haushalt können Sie die Familienmitgliedschaft wählen. Der Vereinsbeitrag beträgt dann pauschal 130 € für alle Familienmitglieder." },
  { q: "Wie kann ich meine Mitgliedschaft kündigen?", a: "Kündigungen sind ausschließlich zum Jahresende (31.12.) möglich und müssen bis zum 30.11. schriftlich bei der Geschäftsstelle eingehen." },
  { q: "Was ist das SEPA-Lastschriftmandat?", a: "Damit ermächtigen Sie den Verein, die Mitgliedsbeiträge direkt von Ihrem Konto einzuziehen. Das ist die einfachste Zahlungsart und vermeidet Mahngebühren." },
  { q: "Kann ich die Formulare auch handschriftlich ausfüllen?", a: "Ja. Sie können die PDFs herunterladen, ausdrucken und von Hand ausfüllen. Die digitale Unterschrift im Online-Formular ist optional." },
  { q: "Was ist die Übungsleiterpauschale?", a: "Übungsleiter, Trainer und Betreuer können eine steuerfreie Aufwandsentschädigung von bis zu 3.000 € (ab 2026: 3.300 €) pro Jahr nach § 3 Nr. 26 EStG erhalten." },
  { q: "Was ist die Ehrenamtspauschale?", a: "Ehrenamtlich Tätige (z. B. Platzwarte, Kassierer) können eine steuerfreie Pauschale von bis zu 840 € pro Jahr nach § 3 Nr. 26a EStG erhalten." },
  { q: "Kann ich auf die Auszahlung der Pauschale verzichten?", a: "Ja. Im Formular können Sie den Verzicht ankreuzen. Der Betrag wird dann als Spende an den Verein behandelt, und Sie erhalten eine Spendenbescheinigung." },
  { q: "Wie reiche ich eine Reisekostenabrechnung ein?", a: "Nutzen Sie das Formular unter Reisekosten. Tragen Sie Datum, Reiseziel, Kilometer und ggf. Stunden ein. Das PDF wird automatisch erstellt und kann bei der Geschäftsstelle eingereicht werden." },
  { q: "Wie hoch ist die Kilometerpauschale?", a: "Die Kilometerpauschale beträgt 0,30 € pro gefahrenem Kilometer." },
  { q: "Wo finde ich die Satzung und Ordnungen des Vereins?", a: 'Unter "Dokumente" finden Sie alle aktuellen Vereinsdokumente – Satzung, Beitragsordnung, Finanzordnung, Ehrenkodex und weitere Ordnungen als PDF zum Download.' },
  { q: "Wer ist mein Ansprechpartner bei Fragen?", a: "Die Geschäftsstelle erreichen Sie unter +49 (0) 7062 5753 oder per E-Mail an info@tgveintrachtbeilstein.de. Die Adresse ist Albert-Einstein-Str. 20, 71717 Beilstein." },
  { q: "Brauche ich für jedes Familienmitglied eine eigene Datenschutzerklärung?", a: "Ja. Jede Person muss eine eigene Datenschutzerklärung unterschreiben. Im Online-Formular wird diese automatisch für jede hinzugefügte Person erstellt." },
  { q: "Kann ich meine Abteilung wechseln?", a: "Ja. Wenden Sie sich an die Geschäftsstelle oder den jeweiligen Abteilungsleiter. Ein Wechsel ist jederzeit möglich, der Beitrag wird entsprechend angepasst." },
  { q: "Was passiert bei einer Rücklastschrift?", a: "Die Kosten für Rücklastschriften gehen zu Ihren Lasten. Bei Rechnungsstellung wird zusätzlich ein Aufwandszuschlag von 5,00 € erhoben." },
  { q: "Kann ich die digitale Unterschrift nachträglich ändern?", a: "Ja. Klicken Sie im Formular auf die bestehende Unterschrift, um sie zu bearbeiten oder neu zu zeichnen. Die Unterschrift wird lokal in Ihrem Browser gespeichert." },
  { q: "Werden meine Daten im Browser gespeichert?", a: "Ja. Alle Formulardaten werden ausschließlich lokal in Ihrem Browser gespeichert. Es werden keine Daten an Server übertragen, bis Sie das PDF herunterladen und einreichen." },
];

export default function FaqPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#b11217]">Häufig gestellte Fragen</h1>
        <p className="text-sm text-gray-500 mt-1">Antworten auf die wichtigsten Fragen rund um Mitgliedschaft, Formulare und Vereinsorganisation.</p>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <h2 className="text-sm font-medium text-gray-900 mb-1">{faq.q}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </>
  );
}
