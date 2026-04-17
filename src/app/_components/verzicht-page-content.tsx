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
  overrideDate?: string | null;
  onOverrideDateChange?: (v: string | null) => void;
  onSignClick?: () => void;
  hideFooter?: boolean;
}

export default function VerzichtPageContent({ state, overrideDate, onOverrideDateChange, onSignClick, hideFooter }: VerzichtPageContentProps) {
  const city = state.plzOrt.replace(/^[\d\s]+/, "").replace(/[^a-zA-ZäöüÄÖÜß\s-]/g, "").trim() || "_______________";
  const today = new Date().toLocaleDateString("de-DE");
  const defaultDate = [city, today].filter(s => s !== "_______________" && s !== "").join(", ");

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold text-[#b11217] print:hidden">Verzicht auf Auszahlung der Ehrenamtspauschale</h1>

      {/* Angaben zum Verzicht */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">
          Angaben zum Verzicht
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Jahr</div>
              <span className="font-semibold text-gray-900">{state.jahr}</span>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Pauschale nach § 3 Nr. 26a EStG</div>
              <span className="font-semibold text-gray-900">{state.betrag || "0,00"} €</span>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Spendenbetrag</div>
              <span className="font-semibold text-gray-900">{state.spendenbetrag || "0,00"} €</span>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Person</div>
              <span className="font-semibold text-gray-900">{state.vorname} {state.nachname}</span>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">Straße, Hausnummer</div>
              <span className="font-semibold text-gray-900">{state.strasse}</span>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-0.5">PLZ, Ort</div>
              <span className="font-semibold text-gray-900">{state.plzOrt}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verzichtserklärung */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">
          Verzichtserklärung
        </div>
        <div className="p-4 text-sm text-gray-700 space-y-4 leading-relaxed">
          <p>
            Für das Jahr <span className="font-bold text-gray-900">{state.jahr || "____"}</span> habe ich aufgrund meiner ehrenamtlichen Tätigkeit im Turn- und Gesangverein Eintracht Beilstein 1823 e.V. Anspruch auf die Ehrenamtspauschale nach § 3 Nr. 26a EstG in Höhe von <span className="font-bold text-gray-900">{state.betrag || "____"} €</span>.
          </p>
          <p>
            Ich bin damit einverstanden, dass die mir zustehende Aufwandsentschädigung nicht an mich ausgezahlt wird.
          </p>
          <p>
            Den nicht ausgezahlten Betrag in Höhe von <span className="font-bold text-gray-900">{state.spendenbetrag || "____"} €</span> wende ich dem Turn- und Gesangverein Eintracht Beilstein 1823 e.V. als Spende zu und bitte um Ausstellung einer entsprechenden Spendenbescheinigung.
          </p>
          <p>
            Gleichzeitig versichere ich hiermit, dass die Steuerbefreiung nach § 3 Nr. 26a EstG nicht bereits für eine andere ehrenamtliche Tätigkeit berücksichtigt wurde.
          </p>
        </div>
      </div>

      {/* Unterschrift */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="p-4 text-sm space-y-6">
          {/* Row 1: Ort, Datum + Unterschrift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-4 text-xs text-gray-500">
            <div className="flex flex-col">
              <div className="flex-1 border-0 min-h-[3rem] print:min-h-0 flex items-end pb-1 text-gray-700 font-medium">
                <div className="flex-1 flex items-center gap-1 group">
                  <input type="text"
                    id="sig-date-input-eap-content"
                    value={overrideDate != null ? overrideDate : defaultDate}
                    onChange={e => onOverrideDateChange?.(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none p-0 m-0 focus:ring-0 print:hidden" />
                  <div className="flex items-center gap-0.5 print:hidden">
                    {overrideDate != null && (
                      <button type="button" onClick={() => onOverrideDateChange?.(null)}
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
                  <span className="hidden print:inline">
                    {overrideDate != null ? overrideDate : defaultDate}
                  </span>
                </div>
              </div>
              <div className="mt-1 print:mt-0 border-t border-gray-400 pt-1">Ort, Datum</div>
            </div>
            <div className="flex flex-col">
              {state.signature && (
                <div className="text-[7pt] text-green-700 leading-tight mb-1">
                  &#10003; Einwilligung zur digitalen Unterschrift erteilt
                </div>
              )}
              <div className="flex-1 border-0 min-h-[3rem] print:min-h-0 flex flex-col justify-end">
                {state.signature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.signature} alt="Unterschrift"
                    onClick={onSignClick}
                    width={571} height={56}
                    style={{ height: 56, width: "auto", imageRendering: "auto", objectFit: "contain" }}
                    className="cursor-pen hover:opacity-80 transition-opacity print:cursor-default"
                    title="Klicken zum Bearbeiten" />
                ) : (
                  onSignClick && (
                    <button onClick={onSignClick}
                      className="mb-1 w-full px-3 py-2 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors print:hidden">
                      Unterschreiben
                    </button>
                  )
                )}
              </div>
              <div className="mt-1 print:mt-0 border-t border-gray-400 pt-1">Unterschrift des ehrenamtlich Tätigen</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
