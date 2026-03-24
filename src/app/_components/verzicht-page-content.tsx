"use client";

import React from "react";

export function PI({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block w-full ${className ?? ""}`}>
      <span className="print:hidden w-full">{children}</span>
      <span className="hidden print:inline">{value}</span>
    </span>
  );
}

interface VerzichtPageContentProps {
  state: {
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
  };
  overrideDate?: string;
  onOverrideDateChange?: (v: string) => void;
  onSignClick?: () => void;
  hideFooter?: boolean;
}

export default function VerzichtPageContent({ state, overrideDate, onOverrideDateChange, onSignClick, hideFooter }: VerzichtPageContentProps) {
  const city = state.plzOrt.replace(/^[\d\s]+/, "").replace(/[^a-zA-ZäöüÄÖÜß\s-]/g, "").trim() || "_______________";
  const today = new Date().toLocaleDateString("de-DE");
  const defaultDate = [city, today].filter(s => s !== "_______________" && s !== "").join(", ");

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 space-y-6">
      {/* PDF-only page header */}
      <div className="pdf-only hidden items-center gap-4 mb-6 pb-4 border-b-2 border-gray-100">
        <img src="/tgv-logo.png" alt="TGV Logo" width={52} height={52} />
        <div className="flex-1">
          <p className="font-bold text-lg text-gray-900 tracking-tight">TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e. V.</p>
          <p className="text-xs text-[#b11217] font-semibold">EHRENAMTSPAUSCHALE VERZICHT &ndash; {state.jahr} &middot; {(state.vorname + " " + state.nachname).toUpperCase()}</p>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-[#b11217] print:hidden">Verzicht auf Auszahlung der Ehrenamtspauschale</h1>

      <div className="bg-[#b11217] text-white px-5 py-3 rounded-xl shadow-md shadow-red-900/10">
        <p className="text-sm font-bold tracking-widest">VERZICHT AUF AUSZAHLUNG DER EHRENAMTSPAUSCHALE</p>
        <p className="text-[11px] text-red-100/90 font-medium mt-0.5">Grundlage: § 3 Nr. 26a EStG</p>
      </div>

      <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-gray-700">
        <div className="border-b border-gray-50 pb-2">
          <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-0.5">JAHR</p>
          <p className="text-sm font-semibold text-gray-900">{state.jahr}</p>
        </div>
        <div className="border-b border-gray-50 pb-2">
          <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-0.5">PAUSCHALE NACH § 3 NR. 26A ESTG</p>
          <p className="text-sm font-semibold text-gray-900">{state.betrag || "0,00"} €</p>
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="border-b border-gray-50 pb-2">
            <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-0.5">SPENDENBETRAG</p>
            <p className="text-sm font-semibold text-gray-900">{state.spendenbetrag || "0,00"} €</p>
          </div>
          <div className="border-b border-gray-50 pb-2">
            <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-0.5">PERSON</p>
            <p className="text-sm font-semibold text-gray-900">{state.vorname} {state.nachname}</p>
          </div>
        </div>
        <div className="border-b border-gray-50 pb-2">
          <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-0.5">STRASSE, HAUSNUMMER</p>
          <p className="text-sm font-semibold text-gray-900">{state.strasse}</p>
        </div>
        <div className="border-b border-gray-50 pb-2">
          <p className="text-[10px] font-bold tracking-wider text-gray-400 mb-0.5">PLZ, ORT</p>
          <p className="text-sm font-semibold text-gray-900">{state.plzOrt}</p>
        </div>
      </div>

      <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 text-sm text-gray-600 space-y-4 leading-relaxed">
        <p>
          Für das Jahr <span className="font-bold text-gray-900">{state.jahr || "____"}</span> habe ich aufgrund meiner ehrenamtlichen Tätigkeit im Turn- und Gesangverein Eintracht Beilstein 1823 e.V. Anspruch auf die Ehrenamtspauschale nach § 3 Nr. 26a EstG in Höhe von <span className="font-bold text-gray-900">{state.betrag || "____"} €</span>.
        </p>
        <p>
          Ich bin damit einverstanden, dass die mir zustehende Aufwandsentschädigung nicht an mich ausgezahlt wird.
        </p>
        <p>
          Den nicht ausgezahlten Betrag in Höhe von <span className="font-bold text-gray-900">{state.spendenbetrag || "____"} €</span> wende ich dem Turn- und Gesangverein Eintracht Beilstein 1823 e.V. als Spende zu und bitte um Ausstellung einer entsprechenden Spendenbescheinigung.
        </p>
        <p className="text-[11px] italic">
          Gleichzeitig versichere ich hiermit, dass die Steuerbefreiung nach § 3 Nr. 26a EstG nicht bereits für eine andere ehrenamtliche Tätigkeit berücksichtigt wurde.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 p-5 bg-white shadow-sm mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-[11px] text-gray-400 print:hidden">
          <div>
            <div className="border-b border-gray-300 min-h-[48px] flex items-end pb-1 text-sm font-medium text-gray-900">
              <div className="flex-1 flex items-center gap-1 group">
                <input type="text"
                  id="sig-date-input-eap-content"
                  value={overrideDate !== "" ? (overrideDate ?? "") : defaultDate}
                  onChange={e => onOverrideDateChange?.(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none p-0 m-0 focus:ring-0" />
                <div className="flex items-center gap-0.5">
                  {overrideDate !== "" && (
                    <button type="button" onClick={() => onOverrideDateChange?.("")}
                      className="p-1 text-gray-300 hover:text-[#b11217] transition-colors" title="Zurücksetzen">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                  <button type="button" onClick={() => document.getElementById("sig-date-input-eap-content")?.focus()}
                    className="p-1 text-gray-300 hover:text-[#b11217] transition-colors" title="Bearbeiten">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-1.5 tracking-wide font-bold">ORT, DATUM</p>
          </div>
          <div>
            <div className="min-h-[48px] border-b border-gray-300 flex flex-col justify-end">
              {state.signature ? (
                <img src={state.signature} alt="Unterschrift" className="max-h-16 object-contain" />
              ) : (
                <span className="text-xs text-gray-300 italic mb-1">Noch keine digitale Unterschrift vorhanden</span>
              )}
            </div>
            <p className="mt-1.5 tracking-wide font-bold">UNTERSCHRIFT DES EHRENAMTLICH TÄTIGEN</p>
            {onSignClick && (
              <button
                type="button"
                onClick={onSignClick}
                className="mt-3 inline-flex items-center px-3 py-1.5 text-[10px] font-bold tracking-wider border border-gray-200 rounded-lg text-gray-500 hover:border-[#b11217] hover:text-[#b11217] transition-all active:scale-95"
              >
                {state.signature ? "UNTERSCHRIFT BEARBEITEN" : "JETZT UNTERSCHREIBEN"}
              </button>
            )}
          </div>
        </div>
        {/* Print: single row with shared border-top */}
        <div className="hidden print:block text-[11px] text-gray-400">
          <div className="grid grid-cols-2 gap-x-8 items-end min-h-[48px]">
            <div className="text-sm font-medium text-gray-900 pb-1">
              {overrideDate !== "" ? overrideDate : defaultDate}
            </div>
            <div className="pb-1">
              {state.signature && (
                <img src={state.signature} alt="Unterschrift" className="max-h-12 object-contain" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 border-t border-gray-300 pt-1">
            <p className="tracking-wide font-bold">ORT, DATUM</p>
            <p className="tracking-wide font-bold">UNTERSCHRIFT DES EHRENAMTLICH TÄTIGEN</p>
          </div>
        </div>
      </div>


    </div>
  );
}
