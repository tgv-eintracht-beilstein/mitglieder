"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import SignatureModal from "@/app/_components/signature-modal";
import FormFooter from "@/app/_components/form-footer";
import { SHARED_ADDRESS_KEY, saveSharedAddress, loadSharedAddress, loadSharedSignature, saveSharedSignature } from "@/lib/sharedAddress";
import { buildPdfFilename } from "@/lib/pdfFilename";
import VerzichtPageContent from "@/app/_components/verzicht-page-content";

const STORAGE_KEY = "ehrenamtspauschale_verzicht_v1";

interface FormState {
  nachname: string;
  vorname: string;
  strasse: string;
  plzOrt: string;
  geburtsdatum: string;
  telefon: string;
  email: string;
  jahr: string;
  betrag: string;
  spendenbetrag: string;
  signature: string;
  overrideDate: string;
}

function defaultState(): FormState {
  return {
    nachname: "", vorname: "", strasse: "", plzOrt: "", geburtsdatum: "", telefon: "", email: "",
    jahr: String(new Date().getFullYear()),
    betrag: "", spendenbetrag: "", signature: "",
    overrideDate: "",
  };
}

export default function EhrenamtspauschaleVerzichtPage() {
  const [state, setState] = useState<FormState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [sharedSignature, setSharedSignature] = useState("");
  const [downloadFn, setDownloadFn] = useState<(() => void) | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect ?pdf=1 and activate pdf-capture mode
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('pdf') === '1') {
        document.body.classList.add('pdf-capture');
      }
    }

    try {
      const addr = loadSharedAddress();
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) as FormState : null;
      setState(s => ({
        ...s,
        ...(saved ?? {}),
        nachname: addr.nachname, vorname: addr.vorname, strasse: addr.strasse,
        plzOrt: addr.plzOrt, geburtsdatum: addr.geburtsdatum, telefon: addr.telefon, email: addr.email,
        // Always reset date field on page load
        overrideDate: "",
      }));
      // Load shared signature — fall back to scanning other form stores
      let sig = loadSharedSignature();
      if (!sig) {
        const otherKeys = ["uebungsleiterpauschale_v1", "reisekosten_v1"];
        for (const k of otherKeys) {
          try {
            const r = localStorage.getItem(k);
            if (r) { const p = JSON.parse(r); if (p?.signature) { sig = p.signature; break; } }
          } catch {}
        }
        if (!sig && saved?.signature) sig = saved.signature;
        if (sig) saveSharedSignature(sig);
      }
      setSharedSignature(sig);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== SHARED_ADDRESS_KEY || !e.newValue) return;
      try {
        const a = JSON.parse(e.newValue);
        setState(s => ({ ...s, nachname: a.nachname || "", vorname: a.vorname || "", strasse: a.strasse || "", plzOrt: a.plzOrt || "", geburtsdatum: a.geburtsdatum || "", telefon: a.telefon || "", email: a.email || "" }));
      } catch {}
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveSharedAddress({ nachname: state.nachname, vorname: state.vorname, strasse: state.strasse, plzOrt: state.plzOrt, geburtsdatum: state.geburtsdatum, telefon: state.telefon, email: state.email });
  }, [state, hydrated]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value })), []);

  if (!hydrated) return null;

  const isComplete = !!(
    state.nachname && state.vorname && state.strasse && state.plzOrt &&
    state.geburtsdatum && state.telefon && state.email && state.betrag && state.spendenbetrag && state.signature
  );

  return (
    <div className="overflow-x-hidden px-1 -mx-1" ref={contentRef}>
      {/* Page Toolbar */}
      <div className="flex items-center justify-between mb-3 print:hidden">
        <h1 className="text-2xl font-bold text-[#b11217]">Verzicht auf Auszahlung der Ehrenamtspauschale</h1>
        <button
          onClick={() => downloadFn?.()}
          disabled={!isComplete}
          className="hidden md:flex items-center gap-1.5 px-5 py-2.5 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors font-medium whitespace-nowrap overflow-hidden text-ellipsis disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 1v8M4 6l3 3 3-3"/>
            <path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/>
          </svg>
          PDF herunterladen
        </button>
      </div>

      <VerzichtPageContent
        state={state}
        overrideDate={state.overrideDate}
        onOverrideDateChange={v => set("overrideDate", v)}
        onSignClick={() => setShowSignModal(true)}
      />

      <div className="print:hidden mt-6">
        <FormFooter 
          onReset={() => { localStorage.removeItem(STORAGE_KEY); setState(defaultState()); }} 
          contentRef={contentRef} 
          filename={buildPdfFilename("ehrenamtspauschale-verzicht", state.vorname, state.nachname)} 
          onDownloadReady={fn => setDownloadFn(() => fn)} 
          disabled={!isComplete} 
        />
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
