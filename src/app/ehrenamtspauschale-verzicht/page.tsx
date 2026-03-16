"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import SignatureModal from "@/app/_components/signature-modal";
import FormFooter from "@/app/_components/form-footer";
import FormHeader from "@/app/_components/form-header";
import { SHARED_ADDRESS_KEY, saveSharedAddress, loadSharedAddress } from "@/lib/sharedAddress";
import { buildPdfFilename } from "@/lib/pdfFilename";

const STORAGE_KEY = "ehrenamtspauschale_verzicht_v1";

interface FormState {
  nachname: string;
  vorname: string;
  strasse: string;
  plzOrt: string;
  geburtsdatum: string;
  telefon: string;
  jahr: string;
  betrag: string;
  spendenbetrag: string;
  signature: string;
}

function defaultState(): FormState {
  return {
    nachname: "", vorname: "", strasse: "", plzOrt: "", geburtsdatum: "", telefon: "",
    jahr: String(new Date().getFullYear()),
    betrag: "", spendenbetrag: "", signature: "",
  };
}

function PI({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-block w-full">
      <span className="print:hidden w-full">{children}</span>
      <span className="hidden print:inline">{value}</span>
    </span>
  );
}

const inputCls = "w-full bg-transparent border-b border-gray-300 px-1 py-1 text-sm focus:outline-none focus:border-[#b11217]";

export default function EhrenamtspauschaleVerzichtPage() {
  const [state, setState] = useState<FormState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [downloadFn, setDownloadFn] = useState<(() => void) | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const addr = loadSharedAddress();
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) as FormState : null;
      setState(s => ({
        ...s,
        ...(saved ?? {}),
        nachname: addr.nachname, vorname: addr.vorname, strasse: addr.strasse,
        plzOrt: addr.plzOrt, geburtsdatum: addr.geburtsdatum, telefon: addr.telefon,
      }));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== SHARED_ADDRESS_KEY || !e.newValue) return;
      try {
        const a = JSON.parse(e.newValue);
        setState(s => ({ ...s, nachname: a.nachname || "", vorname: a.vorname || "", strasse: a.strasse || "", plzOrt: a.plzOrt || "", geburtsdatum: a.geburtsdatum || "", telefon: a.telefon || "" }));
      } catch {}
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveSharedAddress({ nachname: state.nachname, vorname: state.vorname, strasse: state.strasse, plzOrt: state.plzOrt, geburtsdatum: state.geburtsdatum, telefon: state.telefon });
  }, [state, hydrated]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value })), []);

  if (!hydrated) return null;

  const fullName = [state.vorname, state.nachname].filter(Boolean).join(" ") || "_______________";
  const today = new Date().toLocaleDateString("de-DE");
  const city = state.plzOrt.replace(/^\d+\s*/, "").trim() || "_______________";

  return (
    <div className="overflow-x-hidden" ref={contentRef}>

      {/* PDF-only page header */}
      <div className="pdf-only hidden items-center gap-3 mb-4 pb-3 border-b-2 border-gray-300">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tgv-logo.png" alt="TGV Logo" width={44} height={44} />
        <div>
          <div className="font-bold text-base text-gray-900">TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.V.</div>
          <div className="text-xs text-gray-500">Ehrenamtspauschale Verzicht &ndash; {state.jahr} &middot; {state.vorname} {state.nachname}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 print:hidden">
        <h1 className="text-2xl font-bold text-[#b11217]">Verzicht auf Auszahlung der Ehrenamtspauschale</h1>
        <button
          onClick={() => downloadFn?.()}
          className="hidden md:flex items-center gap-1.5 px-5 py-2.5 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors font-medium whitespace-nowrap overflow-hidden text-ellipsis"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 1v8M4 6l3 3 3-3"/>
            <path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/>
          </svg>
          PDF herunterladen
        </button>
      </div>

      {/* Header */}
      <FormHeader
        title="Ehrenamtspauschale Verzicht"
        contextFields={[
          {
            label: "Jahr",
            printValue: state.jahr,
            content: (
              <input type="number" value={state.jahr} onChange={e => set("jahr", e.target.value)}
                className="w-full border-b border-gray-300 bg-transparent py-0.5 text-sm focus:outline-none focus:border-[#b11217]" />
            ),
          },
        ]}
        personalFields={[
          { label: "Nachname", key: "nachname", value: state.nachname, onChange: v => set("nachname", v) },
          { label: "Vorname", key: "vorname", value: state.vorname, onChange: v => set("vorname", v) },
          { label: "Straße", key: "strasse", value: state.strasse, onChange: v => set("strasse", v) },
          { label: "PLZ / Ort", key: "plzOrt", value: state.plzOrt, onChange: v => set("plzOrt", v) },
          { label: "Geburtsdatum", key: "geburtsdatum", type: "date", value: state.geburtsdatum, onChange: v => set("geburtsdatum", v) },
          { label: "Telefon", key: "telefon", type: "tel", value: state.telefon, onChange: v => set("telefon", v) },
        ]}
      />

      {/* Verzichtserklärung */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">
          Verzichtserklärung
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 divide-y sm:divide-y-0 print:divide-y-0 sm:divide-x print:divide-x divide-gray-100 border-b border-gray-100">
          <div className="px-4 py-3">
            <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Pauschale nach § 3 Nr. 26a EstG</div>
            <div className="flex items-baseline gap-1">
              <PI value={state.betrag}>
                <input type="number" value={state.betrag} onChange={e => set("betrag", e.target.value)}
                  placeholder="0,00"
                  className="w-full border-b border-gray-300 bg-transparent py-0.5 text-sm focus:outline-none focus:border-[#b11217]" />
              </PI>
              <span className="text-sm text-gray-500 shrink-0">€</span>
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Spendenbetrag</div>
            <div className="flex items-baseline gap-1">
              <PI value={state.spendenbetrag}>
                <input type="number" value={state.spendenbetrag} onChange={e => set("spendenbetrag", e.target.value)}
                  placeholder="0,00"
                  className="w-full border-b border-gray-300 bg-transparent py-0.5 text-sm focus:outline-none focus:border-[#b11217]" />
              </PI>
              <span className="text-sm text-gray-500 shrink-0">€</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3 text-sm text-gray-600 leading-relaxed">
          <p>
            Für das Jahr <span className="font-medium text-gray-900">{state.jahr || "____"}</span> habe
            ich aufgrund meiner ehrenamtlichen Tätigkeit im Turn- und Gesangverein Eintracht Beilstein
            1823 e.V. Anspruch auf die Ehrenamtspauschale nach § 3 Nr. 26a EstG in Höhe
            von <span className="font-medium text-gray-900">{state.betrag || "____"} €</span>.
          </p>
          <p>
            Ich bin damit einverstanden, dass die mir zustehende Aufwandsentschädigung nicht an mich
            ausgezahlt wird.
          </p>
          <p>
            Den nicht ausgezahlten Betrag in Höhe
            von <span className="font-medium text-gray-900">{state.spendenbetrag || "____"} €</span> wende
            ich dem Turn- und Gesangverein Eintracht Beilstein 1823 e.V. als Spende zu und bitte um
            Ausstellung einer entsprechenden Spendenbescheinigung.
          </p>
          <p>
            Gleichzeitig versichere ich hiermit, dass die Steuerbefreiung nach § 3 Nr. 26a EstG nicht
            bereits für eine andere ehrenamtliche Tätigkeit berücksichtigt wurde.
          </p>
        </div>
      </div>

      {/* Unterschrift */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <div className="grid grid-cols-2 gap-8 text-xs text-gray-400">
          <div className="flex flex-col">
            <div className="flex-1 border-b border-gray-400 min-h-[4rem] flex items-end pb-1 text-gray-700 font-medium text-sm">
              {city}, {today}
            </div>
            <div className="mt-1">Ort, Datum</div>
          </div>
          <div className="flex flex-col">
            <div className="flex-1 border-b border-gray-400 min-h-[4rem] flex flex-col justify-end">
              {state.signature && (
                <div className="hidden print:block text-[7pt] text-green-600 leading-tight mb-0.5">
                  ✓ Einwilligung zur digitalen Unterschrift erteilt
                </div>
              )}
              {state.signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={state.signature} alt="Unterschrift"
                  onClick={() => setShowSignModal(true)}
                  className="max-h-14 w-auto object-contain cursor-pen hover:opacity-80 transition-opacity print:cursor-default"
                  title="Klicken zum Bearbeiten" />
              ) : (
                <button onClick={() => setShowSignModal(true)}
                  className="mb-1 w-full px-3 py-2 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors print:hidden">
                  Unterschreiben
                </button>
              )}
            </div>
            <div className="mt-1">Unterschrift des ehrenamtlich Tätigen</div>
          </div>
        </div>
      </div>

      {showSignModal && (
        <SignatureModal
          existing={state.signature || undefined}
          onSave={(dataUrl) => { set("signature", dataUrl); setShowSignModal(false); }}
          onDelete={() => set("signature", "")}
          onClose={() => setShowSignModal(false)}
        />
      )}

      <FormFooter onReset={() => { localStorage.removeItem(STORAGE_KEY); setState(defaultState()); }} contentRef={contentRef} filename={buildPdfFilename("ehrenamtspauschale-verzicht", state.vorname, state.nachname)} onDownloadReady={fn => setDownloadFn(() => fn)} />

      <div className="pdf-footer hidden mt-6 pt-3 border-t border-gray-200 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tgv-logo-sw.png" alt="TGV Logo" width={36} height={36} className="opacity-60 shrink-0" />
        <span className="text-[10px] text-gray-400 leading-snug">
          TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.V. &middot; Albert-Einstein-Str. 20 &middot; 71717 Beilstein &middot; Tel. 07062&ndash;5753
        </span>
      </div>
    </div>
  );
}
