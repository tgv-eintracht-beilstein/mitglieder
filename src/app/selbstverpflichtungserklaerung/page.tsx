"use client";

import { useState, useCallback, useEffect } from "react";
import SignatureModal from "@/app/_components/signature-modal";
import FormHeader from "@/app/_components/form-header";
import SubmitButton from "@/app/_components/submit-button";
import { SHARED_ADDRESS_KEY, saveSharedAddress, loadSharedAddress, loadSharedSignature, saveSharedSignature } from "@/lib/sharedAddress";
import { buildPdfFilename } from "@/lib/pdfFilename";
import { syncSave, syncLoad, subscribe } from "@/lib/sync";
import { AbteilungSelect } from "@/app/_components/aufwandsformular";

const STORAGE_KEY = "selbstverpflichtungserklaerung_v1";

interface FormState {
  nachname: string;
  vorname: string;
  geburtsdatum: string;
  strasse: string;
  plzOrt: string;
  abteilung: string;
  signature: string;
  overrideDate: string | null;
}

function defaultState(): FormState {
  return {
    nachname: "", vorname: "", geburtsdatum: "", strasse: "", plzOrt: "",
    abteilung: "", signature: "", overrideDate: null,
  };
}

export default function SelbstverpflichtungserklaerungPage() {
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
            ...(addr.strasse && { strasse: addr.strasse }),
            ...(addr.plzOrt && { plzOrt: addr.plzOrt }),
            ...(addr.geburtsdatum && { geburtsdatum: addr.geburtsdatum }),
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
        setState((s) => ({ ...s, nachname: a.nachname || "", vorname: a.vorname || "", strasse: a.strasse || "", plzOrt: a.plzOrt || "", geburtsdatum: a.geburtsdatum || "" }));
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
    saveSharedAddress({ ...loadSharedAddress(), nachname: state.nachname, vorname: state.vorname, strasse: state.strasse, plzOrt: state.plzOrt, geburtsdatum: state.geburtsdatum });
  }, [state, hydrated]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value })), []);

  if (!hydrated) return null;

  const allChecks: { label: string; valid: boolean }[] = [
    { label: "Nachname", valid: !!state.nachname },
    { label: "Vorname", valid: !!state.vorname },
    { label: "Geburtsdatum", valid: !!state.geburtsdatum },
    { label: "Strasse", valid: !!state.strasse },
    { label: "PLZ / Ort", valid: !!state.plzOrt },
    { label: "Abteilung", valid: !!state.abteilung },
  ];
  const missing = allChecks.filter((c) => !c.valid);
  const isComplete = missing.length === 0;

  const city = state.plzOrt.replace(/^[\d\s]+/, "").replace(/[^a-zA-ZäöüÄÖÜß\s-]/g, "").trim() || "_______________";
  const today = new Date().toLocaleDateString("de-DE");
  const defaultDate = [city, today].filter((s) => s !== "_______________" && s !== "").join(", ");
  const dateValue = state.overrideDate !== null ? state.overrideDate : defaultDate;

  const buildDocs = async () => {
    const React = (await import("react")).default;
    const { Document } = await import("@react-pdf/renderer");
    const { SelbstverpflichtungDoc } = await import("@/lib/pdf-ehrenkodex");
    return [{
      doc: <Document><SelbstverpflichtungDoc state={state} dateValue={dateValue} /></Document>,
      filename: buildPdfFilename("selbstverpflichtungserklaerung", state.vorname, state.nachname),
    }];
  };

  const handleDownload = async () => {
    const { downloadMultiplePdfs } = await import("@/lib/pdf");
    await downloadMultiplePdfs(await buildDocs(), buildPdfFilename("selbstverpflichtungserklaerung", state.vorname, state.nachname));
  };

  return (
    <div className="selbstverpflichtungserklaerung-form px-1">
      <div className="flex items-center justify-between mb-3 print:hidden">
        <h1 className="text-2xl font-bold text-[#b11217]">Selbstverpflichtungserklärung</h1>
        <div className="hidden md:flex items-center gap-2">
          <SubmitButton formType="selbstverpflichtungserklaerung" disabled={!isComplete} missingCount={missing.length} checks={allChecks} side="bottom" onDownload={handleDownload} getFormData={() => state} getPdfBlobs={async () => { const { renderPdfBlobs } = await import("@/lib/pdf"); return renderPdfBlobs(await buildDocs()); }} />
        </div>
      </div>

      <FormHeader
        title="Selbstverpflichtungserklärung"
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
          { label: "Geburtsdatum", key: "geburtsdatum", type: "date", value: state.geburtsdatum, onChange: (v) => set("geburtsdatum", v), required: true },
          { label: "Strasse, Hausnummer", key: "strasse", value: state.strasse, onChange: (v) => set("strasse", v), required: true },
          { label: "PLZ, Ort", key: "plzOrt", value: state.plzOrt, onChange: (v) => set("plzOrt", v), required: true },
        ]}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">
          Erklärung
        </div>
        <div className="p-4 text-sm text-gray-700 space-y-4 leading-relaxed">
          <p>
            Hiermit versichere ich, dass ich nicht wegen einer Straftat nach den §§ 171, 174 bis 174c, 176 bis 180a,
            181a, 182 bis 184f, 225, 232 bis 233a, 234, 235 oder 236 des Strafgesetzbuches (StGB) verurteilt worden
            bin und auch keine entsprechenden Verfahren gegen mich anhängig sind.
          </p>
          <p>
            Im Rahmen dieser Erklärung verpflichte ich mich dazu, dem TGV „Eintracht" Beilstein 1823 e. V. über die
            Einleitung eines entsprechenden Verfahrens zu informieren.
          </p>
        </div>
      </div>

      {/* Signature */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="p-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-4 text-xs text-gray-500">
            <div className="flex flex-col">
              <div className="flex-1 border-0 min-h-[3rem] print:min-h-0 flex items-end pb-1 text-gray-700 font-medium">
                <div className="flex-1 flex items-center gap-1 group">
                  <input type="text" id="sig-date-input-sv"
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
        <SubmitButton formType="selbstverpflichtungserklaerung" disabled={!isComplete} missingCount={missing.length} checks={allChecks} side="top" onDownload={handleDownload} getFormData={() => state} getPdfBlobs={async () => { const { renderPdfBlobs } = await import("@/lib/pdf"); return renderPdfBlobs(await buildDocs()); }} />
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
