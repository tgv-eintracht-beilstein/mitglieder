"use client";

import { useState } from "react";

export default function ImpressumPage() {
  const [exportStatus, setExportStatus] = useState<string>("");
  const [importStatus, setImportStatus] = useState<string>("");

  const handleExport = () => {
    try {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key) || "";
        }
      }

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      a.href = url;
      a.download = `tgv-beitraege-export-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus("Export erfolgreich! Datei wurde heruntergeladen.");
      setTimeout(() => setExportStatus(""), 5000);
    } catch (error) {
      setExportStatus("Fehler beim Export: " + (error as Error).message);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Clear existing data (optional - you might want to confirm this)
        localStorage.clear();

        // Import all data
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, value as string);
        }

        setImportStatus(`Import erfolgreich! ${Object.keys(data).length} Einträge wurden importiert.`);
        setTimeout(() => {
          setImportStatus("");
          window.location.reload(); // Reload to apply imported data
        }, 2000);
      } catch (error) {
        setImportStatus("Fehler beim Import: " + (error as Error).message);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Impressum & Datenschutz</h1>

      <div className="space-y-6">
        {/* Impressum */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Angaben gemäß § 5 TMG</h2>
            <div className="text-gray-700 space-y-1">
              <p className="font-medium">TGV „Eintracht" Beilstein 1823 e. V.</p>
              <p>Albert-Einstein-Straße 20</p>
              <p>71717 Beilstein</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Kontakt</h2>
            <div className="text-gray-700 space-y-1">
              <p>Telefon: +49 (0) 7062 5753</p>
              <p>Telefax: +49 (0) 7062 916736</p>
              <p>E-Mail: <a href="mailto:info@tgveintrachtbeilstein.de" className="text-[#b11217] hover:underline">info@tgveintrachtbeilstein.de</a></p>
              <p>Internet: <a href="https://www.tgveintrachtbeilstein.de" target="_blank" rel="noopener noreferrer" className="text-[#b11217] hover:underline">www.tgveintrachtbeilstein.de</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Vertreten durch</h2>
            <p className="text-gray-700">Armin Maurer (Vorstand)</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Registereintrag</h2>
            <div className="text-gray-700 space-y-1">
              <p>Registergericht: Amtsgericht Stuttgart</p>
              <p>Registernummer: VR 101009</p>
              <p>Steuernummer: 65208/49689</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <div className="text-gray-700">
              <p>Armin Maurer</p>
              <p>Albert-Einstein-Straße 20, 71717 Beilstein</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Datenschutzbeauftragter gemäß DSGVO</h2>
            <div className="text-gray-700 space-y-1">
              <p>Bernhard Rode</p>
              <p>E-Mail: <a href="mailto:datenschutz@tgveintrachtbeilstein.de" className="text-[#b11217] hover:underline">datenschutz@tgveintrachtbeilstein.de</a></p>
            </div>
          </section>
        </div>

        {/* Haftungsausschluss */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Haftungsausschluss</h2>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Haftung für Inhalte</h3>
            <div className="text-gray-700 text-sm space-y-2">
              <p>
                Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
                Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen
                oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
              <p>
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
                Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
                Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Haftung für Links</h3>
            <div className="text-gray-700 text-sm space-y-2">
              <p>
                Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben.
                Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets
                der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
              </p>
              <p>
                Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren
                zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne
                konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Urheberrecht</h3>
            <div className="text-gray-700 text-sm space-y-2">
              <p>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.
                Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen
                der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              </p>
              <p>
                Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite
                nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet.
                Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis.
                Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
              </p>
            </div>
          </section>
        </div>

        {/* Datenschutzerklärung */}
        <div id="datenschutz" className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Datenschutzerklärung</h2>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Datenschutz auf einen Blick</h3>
            <div className="text-gray-700 text-sm space-y-2">
              <p>
                Diese Anwendung respektiert Ihre Privatsphäre. Alle von Ihnen eingegebenen Daten werden <strong>ausschließlich lokal in Ihrem Browser gespeichert</strong>
                und <strong>niemals an externe Server übertragen</strong>. Es findet keine Erfassung, Speicherung oder Verarbeitung personenbezogener Daten auf Servern des Vereins
                oder Dritter statt.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Keine Datenübertragung an Server</h3>
            <div className="text-gray-700 text-sm space-y-2">
              <p>
                Diese Anwendung ist eine reine Client-seitige Webanwendung (Static Export). Das bedeutet:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Alle Formulardaten werden nur in Ihrem Browser gespeichert</li>
                <li>Keine Übertragung Ihrer Daten an Server des Vereins oder Dritte</li>
                <li>Keine zentrale Datenspeicherung</li>
                <li>Keine Datenverarbeitung auf externen Systemen</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Was wird im Browser gespeichert?</h3>
            <div className="text-gray-700 text-sm space-y-3">
              <p>Die Anwendung verwendet den <strong>lokalen Speicher Ihres Browsers (localStorage)</strong>, um Ihre Formulareingaben zu speichern:</p>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Persönliche Daten (Formular-übergreifend gespeichert):</h4>
                  <ul className="list-disc list-inside space-y-0.5 ml-4 text-xs">
                    <li>Nachname, Vorname</li>
                    <li>Straße und Hausnummer</li>
                    <li>PLZ und Ort</li>
                    <li>Geburtsdatum</li>
                    <li>Telefonnummer</li>
                    <li>E-Mail-Adresse</li>
                    <li>Digitale Unterschrift (als Bilddatei)</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Speicherschlüssel: <code className="bg-white px-1 rounded">shared_address_v1</code>, <code className="bg-white px-1 rounded">shared_signature_v1</code>
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Formulardaten pro Formular:</h4>
                  <ul className="list-disc list-inside space-y-0.5 ml-4 text-xs">
                    <li><strong>Reisekostenabrechnung:</strong> Datum, Strecke (Von-Bis), Kilometer, Beschreibung, Abteilung, Zeitraum, IBAN,
                      Zahlungsart, Aufwandsspende, Steueroptionen</li>
                    <li><strong>Übungsleiterpauschale:</strong> Datum, Uhrzeiten, Stundensatz, Beschreibung, Abteilung, Zeitraum, IBAN,
                      Zahlungsart, Aufwandsspende, Steueroptionen</li>
                    <li><strong>Ehrenamtspauschale:</strong> Bank, BIC, IBAN, Abteilung, Funktion, Vergütung, Verzicht, Spendenbetrag</li>
                    <li><strong>Ehrenamtspauschale (Verzicht, alt):</strong> Jahr, Pauschalbetrag, Spendenbetrag</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Speicherschlüssel: <code className="bg-white px-1 rounded">reisekosten_v1</code>,
                    <code className="bg-white px-1 rounded ml-1">uebungsleiterpauschale_v1</code>,
                    <code className="bg-white px-1 rounded ml-1">ehrenamtspauschale_v2</code>,
                    <code className="bg-white px-1 rounded ml-1">ehrenamtspauschale_verzicht_v1</code>
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Beschreibungen (Autocomplete-Funktion):</h4>
                  <ul className="list-disc list-inside space-y-0.5 ml-4 text-xs">
                    <li>Liste zuvor eingegebener Tätigkeitsbeschreibungen für schnellere Wiederverwendung</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Speicherschlüssel: <code className="bg-white px-1 rounded">tgv_beschreibungen_v1</code>
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                <p className="text-xs text-blue-900">
                  <strong>ℹ️ Hinweis:</strong> Diese Daten verbleiben ausschließlich auf Ihrem Gerät und werden nicht an Server übertragen.
                  Sie können alle Daten jederzeit über die „Zurücksetzen"-Funktion in den Formularen oder durch Löschen Ihrer Browser-Daten entfernen.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Keine Cookies, kein Tracking</h3>
            <div className="text-gray-700 text-sm space-y-2">
              <p>
                Diese Anwendung verwendet:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Keine Cookies</strong> – Es werden keine Cookies gesetzt</li>
                <li><strong>Keine Analyse-Tools</strong> – Kein Google Analytics, Matomo oder ähnliche Dienste</li>
                <li><strong>Keine externen Dienste</strong> – Keine Einbindung von Social Media Plugins, Werbung oder Tracking-Pixeln</li>
                <li><strong>Keine Webserver-Logs mit personenbezogenen Daten</strong> – Da statisch gehostet</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Ihre Rechte</h3>
            <div className="text-gray-700 text-sm space-y-2">
              <p>Da alle Daten ausschließlich lokal in Ihrem Browser gespeichert werden, haben Sie jederzeit volle Kontrolle:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Löschung:</strong> Nutzen Sie die „Zurücksetzen"-Funktion in den Formularen oder löschen Sie die Browser-Daten</li>
                <li><strong>Auskunft:</strong> Öffnen Sie die Browser-Entwicklertools (F12) → Application/Speicher → Local Storage, um alle gespeicherten Daten einzusehen</li>
                <li><strong>Berichtigung:</strong> Ändern Sie Ihre Daten direkt in den Formularen</li>
                <li><strong>Übertragbarkeit:</strong> Exportieren Sie Ihre Formulare als PDF-Dateien</li>
              </ul>
              <p className="mt-3">
                Da keine Datenverarbeitung auf unseren Servern stattfindet, ist eine Auskunftserteilung durch den Verein nicht erforderlich.
                Sie haben die vollständige Kontrolle über Ihre Daten in Ihrem Browser.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">6. Beschwerde bei der Aufsichtsbehörde</h3>
            <div className="text-gray-700 text-sm space-y-2">
              <p>
                Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren:
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mt-2">
                <p className="font-semibold">Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg</p>
                <p>Königstraße 10a, 70173 Stuttgart</p>
                <p>Postfach 10 29 32, 70025 Stuttgart</p>
                <p>Tel.: <a href="tel:+4971161554110" className="text-[#b11217] hover:underline">0711/615541-0</a></p>
                <p>E-Mail: <a href="mailto:poststelle@lfdi.bwl.de" className="text-[#b11217] hover:underline">poststelle@lfdi.bwl.de</a></p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">7. Änderungen dieser Datenschutzerklärung</h3>
            <div className="text-gray-700 text-sm">
              <p>
                Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht
                oder um Änderungen unserer Anwendung umzusetzen. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.
              </p>
            </div>
          </section>

          <section className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Stand: März 2026
            </p>
          </section>
        </div>

        {/* Daten Export/Import */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Daten sichern & wiederherstellen</h2>

          <section>
            <p className="text-gray-700 text-sm mb-4">
              Da alle Ihre Formulardaten nur lokal in Ihrem Browser gespeichert sind, können Sie diese hier exportieren
              und auf einem anderen Gerät oder nach dem Löschen der Browser-Daten wieder importieren.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Daten exportieren</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Lädt eine JSON-Datei mit allen Ihren gespeicherten Formulardaten herunter.
                </p>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors text-sm font-medium"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2v8m-3-3l3 3 3-3"/>
                    <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2"/>
                  </svg>
                  Daten exportieren
                </button>
                {exportStatus && (
                  <p className="mt-2 text-xs text-green-600">{exportStatus}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Daten importieren</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Stellt Ihre Formulardaten aus einer exportierten JSON-Datei wieder her.
                  <strong className="text-red-600"> Achtung:</strong> Vorhandene Daten werden überschrieben!
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 14V6m-3 3l3-3 3 3"/>
                    <path d="M2 5v-2a1 1 0 011-1h10a1 1 0 011 1v2"/>
                  </svg>
                  Daten importieren
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
                {importStatus && (
                  <p className="mt-2 text-xs text-green-600">{importStatus}</p>
                )}
              </div>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-900">
                <strong>💡 Tipp:</strong> Exportieren Sie Ihre Daten regelmäßig als Backup, besonders vor dem
                Löschen Ihrer Browser-Daten oder bei einem Gerätewechsel.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
