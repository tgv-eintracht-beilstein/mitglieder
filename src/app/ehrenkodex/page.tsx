"use client";

import { useState, useCallback, useEffect } from "react";
import SignatureModal from "@/app/_components/signature-modal";
import FormHeader from "@/app/_components/form-header";
import SubmitButton from "@/app/_components/submit-button";
import { SHARED_ADDRESS_KEY, saveSharedAddress, loadSharedAddress, loadSharedSignature, saveSharedSignature } from "@/lib/sharedAddress";
import { buildPdfFilename } from "@/lib/pdfFilename";
import { syncSave, syncLoad, subscribe } from "@/lib/sync";
import { AbteilungSelect } from "@/app/_components/aufwandsformular";

const STORAGE_KEY = "ehrenkodex_v1";

interface FormState {
  nachname: string;
  vorname: string;
  abteilung: string;
  signature: string;
  overrideDate: string | null;
}

function defaultState(): FormState {
  return { nachname: "", vorname: "", abteilung: "", signature: "", overrideDate: null };
}

export default function EhrenkodexPage() {
  const [state, setState] = useState<FormState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [sharedSignature, setSharedSignature] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const addr = loadSharedAddress();
        const saved = await syncLoad<FormState>(STORAGE_KEY);
        setState((s) => {
          const base = { ...s, ...(saved ?? {}) };
          return {
            ...base,
            ...(addr.nachname && { nachname: addr.nachname }),
            ...(addr.vorname && { vorname: addr.vorname }),
          };
        });
        setSharedSignature(loadSharedSignature());
      } catch {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== SHARED_ADDRESS_KEY || !e.newValue) return;
      try {
        const a = JSON.parse(e.newValue);
        setState((s) => ({ ...s, nachname: a.nachname || "", vorname: a.vorname || "" }));
      } catch {}
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    return subscribe(STORAGE_KEY, (_key, data) => {
      setState(data as FormState);
    });
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    syncSave(STORAGE_KEY, state);
    saveSharedAddress({ ...loadSharedAddress(), nachname: state.nachname, vorname: state.vorname });
  }, [state, hydrated]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value })), []);

  if (!hydrated) return null;

  const allChecks: { label: string; valid: boolean }[] = [
    { label: "Nachname", valid: !!state.nachname },
    { label: "Vorname", valid: !!state.vorname },
    { label: "Abteilung", valid: !!state.abteilung },
  ];
  const missing = allChecks.filter((c) => !c.valid);
  const isComplete = missing.length === 0;

  const today = new Date().toLocaleDateString("de-DE");
  const defaultDate = today;
  const dateValue = state.overrideDate !== null ? state.overrideDate : defaultDate;

  const fieldCls = "w-full bg-transparent border-b px-1 py-0.5 text-sm focus:outline-none transition-colors";
  function fieldBorder(value: string, required?: boolean) {
    return required && !value ? "border-[#b11217] focus:border-[#b11217]" : "border-gray-300 focus:border-[#b11217]";
  }

  const buildDocs = async () => {
    const React = (await import("react")).default;
    const { Document } = await import("@react-pdf/renderer");
    const { EhrenkodexDoc } = await import("@/lib/pdf-ehrenkodex");
    return [{
      doc: <Document><EhrenkodexDoc state={state} dateValue={dateValue} /></Document>,
      filename: buildPdfFilename("ehrenkodex", state.vorname, state.nachname),
    }];
  };

  const handleDownload = async () => {
    const { downloadMultiplePdfs } = await import("@/lib/pdf");
    await downloadMultiplePdfs(await buildDocs(), buildPdfFilename("ehrenkodex", state.vorname, state.nachname));
  };

  return (
    <div className="ehrenkodex-form px-1">
      <div className="flex items-center justify-between mb-3 print:hidden">
        <h1 className="text-2xl font-bold text-[#b11217]">Ehrenkodex</h1>
        <div className="hidden md:flex items-center gap-2">
          <SubmitButton formType="ehrenkodex" disabled={!isComplete} missingCount={missing.length} checks={allChecks} side="bottom" onDownload={handleDownload} getFormData={() => state} getPdfBlobs={async () => { const { renderPdfBlobs } = await import("@/lib/pdf"); return renderPdfBlobs(await buildDocs()); }} />
        </div>
      </div>

      <FormHeader
        title="Ehrenkodex"
        contextFields={[
          {
            label: "Abteilung",
            printValue: state.abteilung,
            value: state.abteilung,
            required: true,
            content: <AbteilungSelect value={state.abteilung} onChange={(v) => set("abteilung", v)} />,
          },
        ]}
        personalFields={[
          { label: "Nachname", key: "nachname", value: state.nachname, onChange: (v) => set("nachname", v), required: true },
          { label: "Vorname", key: "vorname", value: state.vorname, onChange: (v) => set("vorname", v), required: true },
        ]}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">
          Ehrenkodex
        </div>
        <div className="p-4 text-sm text-gray-700 space-y-4 leading-relaxed">
          <p>
            Der Ehrenkodex des TGV „Eintracht" Beilstein 1823 e. V. legt die Grundsätze für eine würdevolle,
            wertschätzende und grenzachtende Jugendarbeit fest. Er gilt für alle haupt- und ehrenamtlichen
            Mitarbeitenden, die mit Kindern und Jugendlichen im Verein tätig sind.
          </p>
          <p>
            Ich achte die Würde meiner Mitmenschen. Meine Arbeit in der Jugendarbeit im TGV „Eintracht" Beilstein
            1823 e. V. ist von Wertschätzung und Grenzachtung geprägt.
          </p>
          <div>
            <p className="font-semibold text-gray-900 mb-1">1. Grenzen achten / Nähe – Distanz</p>
            <p>
              Ich nehme die individuelle Grenzempfindung der Kinder und Jugendlichen wahr und respektiere sie. Ich
              achte auf Grenzüberschreitung durch Mitarbeitende und Teilnehmende in den Gruppen, bei Angeboten und
              Aktivitäten. Ich vertusche sie nicht und reagiere angemessen darauf.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">2. Aktiv Stellung beziehen / Kinder schützen</p>
            <p>
              Ich beziehe aktiv Stellung gegen abwertendes, gewalttätiges oder sexistisches Verhalten. Egal, ob
              dieses Verhalten durch Worte, Taten, Bilder oder Videos erfolgt.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">3. Vorbildfunktion / Abhängigkeiten verhindern</p>
            <p>
              Ich bin mir meiner Vorbildfunktion gegenüber den mir anvertrauten Kindern und Jugendlichen bewusst.
              Mein Leitungshandeln ist nachvollziehbar und ehrlich. Ich nutze keine Abhängigkeiten aus und
              missbrauche nicht das Vertrauen der Mädchen und Jungen.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">4. Sorgfältige Methodenauswahl</p>
            <p>
              Ich achte bei der Auswahl von Spielen, Methoden und Aktionen darauf, dass Mädchen und Jungen keine
              Angst gemacht wird und ihre persönlichen Grenzen nicht verletzt werden.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">5. Beratung einholen</p>
            <p>
              Bei Übergriffen oder massiven Formen seelischer, körperlicher oder sexualisierter Gewalt gegen Mädchen
              und Jungen hole ich mir umgehend Beratung von Fachkräften. Mit diesen spreche ich das weitere Vorgehen
              ab.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">6. Grenzverletzungen</p>
            <p>
              Ich nehme Grenzverletzungen durch andere Mitarbeitende und Teilnehmende in den Gruppen, bei Angeboten
              und Aktivitäten bewusst wahr und vertusche sie nicht.
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">7. Strafandrohung</p>
            <p>
              Mir ist bewusst, dass jede sexuelle Handlung mit Schutzbefohlenen disziplinarische und gegebenenfalls
              strafrechtliche Folgen hat. Ich versichere, dass ich nicht wegen einer Straftat im Zusammenhang mit
              sexualisierter Gewalt verurteilt bin oder ein solches Verfahren gegen mich anhängig ist. Für den Fall,
              dass diesbezüglich ein Ermittlungsverfahren gegen mich eingeleitet wird, verpflichte ich mich, dies
              dem TGV „Eintracht" Beilstein 1823 e. V. oder der Person, die mich beauftragt hat, umgehend
              mitzuteilen.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Dies bezieht sich auf folgende §§ StGB: 171, 174 bis 174c, 176 bis 180a, 181a, 182 bis 184f, 225, 232
              bis 233a, 234, 235 oder 236.
            </p>
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="p-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-4 text-xs text-gray-500">
            <div className="flex flex-col">
              <div className="flex-1 border-0 min-h-[3rem] print:min-h-0 flex items-end pb-1 text-gray-700 font-medium">
                <div className="flex-1 flex items-center gap-1 group">
                  <input type="text" id="sig-date-input-ek"
                    value={state.overrideDate !== null ? state.overrideDate : defaultDate}
                    onChange={(e) => set("overrideDate", e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none p-0 m-0 focus:ring-0 print:hidden" />
                  {state.overrideDate !== null && (
                    <button type="button" onClick={() => set("overrideDate", null)}
                      className="p-1 text-gray-300 hover:text-[#b11217] transition-colors print:hidden" title="Zurücksetzen">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                  <span className="hidden print:inline">{dateValue}</span>
                </div>
              </div>
              <div className="mt-1 print:mt-0 border-t border-gray-400 pt-1">Ort, Datum</div>
            </div>
            <div className="flex flex-col">
              {state.signature && <div className="text-[7pt] text-green-600 leading-tight mb-1">&#10003; Einwilligung zur digitalen Unterschrift erteilt</div>}
              <div className="flex-1 border-0 min-h-[3rem] print:min-h-0 flex flex-col justify-end">
                {state.signature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.signature} alt="Unterschrift" onClick={() => setShowSignModal(true)}
                    style={{ height: 56, width: "auto", imageRendering: "auto", objectFit: "contain" }}
                    className="cursor-pointer hover:opacity-80 transition-opacity print:cursor-default" title="Klicken zum Bearbeiten" />
                ) : (
                  <button onClick={() => setShowSignModal(true)}
                    className="mb-1 w-full px-3 py-2 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors print:hidden">
                    Unterschreiben
                  </button>
                )}
              </div>
              <div className="mt-1 print:mt-0 border-t border-gray-400 pt-1">Unterschrift</div>
            </div>
          </div>
        </div>
      </div>

      {showSignModal && (
        <SignatureModal
          existing={state.signature || undefined}
          sharedSignature={sharedSignature || undefined}
          onSave={(dataUrl) => { set("signature", dataUrl); saveSharedSignature(dataUrl); setSharedSignature(dataUrl); setShowSignModal(false); }}
          onDelete={() => set("signature", "")}
          onClose={() => setShowSignModal(false)}
        />
      )}

      <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-2 print:hidden mt-2 mb-6">
        <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setState(defaultState()); }}
          className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs hover:bg-red-100 transition-colors">
          Formular zurücksetzen
        </button>
        <SubmitButton formType="ehrenkodex" disabled={!isComplete} missingCount={missing.length} checks={allChecks} side="top" onDownload={handleDownload} getFormData={() => state} getPdfBlobs={async () => { const { renderPdfBlobs } = await import("@/lib/pdf"); return renderPdfBlobs(await buildDocs()); }} />
      </div>

      <div className="pdf-footer hidden print:flex mt-10 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-6 text-[9px] leading-relaxed text-gray-500">
          <div className="space-y-1">
            <p className="font-bold text-gray-600 tracking-wider">KONTAKT</p>
            <p>Albert-Einstein-Str. 20 · 71717 Beilstein</p>
            <p>Tel. +49 (0) 7062 5753</p>
            <p>info@tgveintrachtbeilstein.de</p>
            <p>www.tgveintrachtbeilstein.de</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-gray-600 tracking-wider">VEREINSDATEN</p>
            <p>Steuer-Nr. 65208/49689</p>
            <p>Amtsgericht Stuttgart · VR 101009</p>
            <p>Vorstand: Armin Maurer</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-gray-600 tracking-wider">BANKVERBINDUNG</p>
            <p>Volksbank Beilstein-Ilsfeld-Abstatt eG</p>
            <p className="font-medium text-gray-500">IBAN: DE63 6206 2215 0001 0770 07</p>
            <p>BIC: GENODES1BIA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
