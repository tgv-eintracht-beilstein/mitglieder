"use client";

import React from "react";
import FormHeader from "./form-header";

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
}

export default function VerzichtPageContent({ state, overrideDate, onOverrideDateChange, onSignClick }: VerzichtPageContentProps) {
  const city = state.plzOrt.replace(/^[\d\s]+/, "").replace(/[^a-zA-ZäöüÄÖÜß\s-]/g, "").trim() || "_______________";
  const today = new Date().toLocaleDateString("de-DE");
  const defaultDate = [city, today].filter(s => s !== "_______________" && s !== "").join(", ");

  return (
    <div className="space-y-4">
      {/* PDF-only page header */}
      <div className="pdf-only hidden items-center gap-3 mb-4 pb-3 border-b-2 border-gray-300">
        <img src="/tgv-logo.png" alt="TGV Logo" width={44} height={44} />
        <div>
          <div className="font-bold text-base text-gray-900">TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.V.</div>
          <div className="text-xs text-gray-500">Ehrenamtspauschale Verzicht &ndash; {state.jahr} &middot; {state.vorname} {state.nachname}</div>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-[#b11217] print:hidden">Verzicht auf Auszahlung der Ehrenamtspauschale</h1>

      <FormHeader
        title="Ehrenamtspauschale Verzicht"
        contextFields={[
          {
            label: "Jahr",
            printValue: state.jahr,
            content: (
              <span className="text-sm border-b border-gray-300 py-0.5 block">{state.jahr}</span>
            ),
          },
        ]}
        personalFields={[
          { label: "Nachname", key: "nachname", value: state.nachname, onChange: () => {}, required: true },
          { label: "Vorname", key: "vorname", value: state.vorname, onChange: () => {}, required: true },
          { label: "Straße", key: "strasse", value: state.strasse, onChange: () => {}, required: true },
          { label: "PLZ / Ort", key: "plzOrt", value: state.plzOrt, onChange: () => {}, required: true },
          { label: "Geburtsdatum", key: "geburtsdatum", type: "date", value: state.geburtsdatum, onChange: () => {}, required: true },
          { label: "Telefon", key: "telefon", type: "tel", value: state.telefon, onChange: () => {}, required: true },
          { label: "E-Mail", key: "email", type: "email", value: state.email, onChange: () => {}, required: true },
        ]}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">
          Verzichtserklärung
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 divide-y sm:divide-y-0 print:divide-y-0 sm:divide-x print:divide-x divide-gray-100 border-b border-gray-100">
          <div className="px-4 py-3">
            <div className={`text-[10px] uppercase tracking-wide mb-1 ${!state.betrag ? "text-[#b11217]" : "text-gray-400"}`}>Pauschale nach § 3 Nr. 26a EstG{!state.betrag && " *"}</div>
            <div className="flex items-baseline gap-1">
              <PI value={state.betrag}>
                <span className="text-sm border-b border-gray-300 py-0.5 block">{state.betrag || "0,00"}</span>
              </PI>
              <span className="text-sm text-gray-500 shrink-0">€</span>
            </div>
          </div>
          <div className="px-4 py-3">
            <div className={`text-[10px] uppercase tracking-wide mb-1 ${!state.spendenbetrag ? "text-[#b11217]" : "text-gray-400"}`}>Spendenbetrag{!state.spendenbetrag && " *"}</div>
            <div className="flex items-baseline gap-1">
              <PI value={state.spendenbetrag}>
                <span className="text-sm border-b border-gray-300 py-0.5 block">{state.spendenbetrag || "0,00"}</span>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <div className="grid grid-cols-2 gap-8 text-xs text-gray-400">
          <div className="flex flex-col">
            <div className="flex-1 border-b border-gray-400 min-h-[4rem] flex items-end pb-1 text-gray-700 font-medium text-sm">
              <div className="flex-1 flex items-center gap-1 group">
                <input type="text"
                  id="sig-date-input-eap-content"
                  value={overrideDate !== "" ? (overrideDate ?? "") : defaultDate}
                  onChange={e => onOverrideDateChange?.(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none p-0 m-0 focus:ring-0 print:hidden" />
                <button type="button" onClick={() => document.getElementById("sig-date-input-eap-content")?.focus()}
                  className="p-1 text-gray-300 hover:text-[#b11217] transition-colors print:hidden" aria-label="Datum bearbeiten">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                  </svg>
                </button>
                <span className="hidden print:inline">
                  {overrideDate !== "" ? overrideDate : defaultDate}
                </span>
              </div>
            </div>
            <div className="mt-1">Ort, Datum</div>
          </div>
          <div className="flex flex-col">
            <div className="flex-1 border-b border-gray-400 min-h-[4rem] flex flex-col justify-end">
              {state.signature && (
                <div className="text-[7pt] text-green-600 leading-tight mb-0.5">
                  ✓ Einwilligung zur digitalen Unterschrift erteilt
                </div>
              )}
              {state.signature ? (
                <img src={state.signature} alt="Unterschrift"
                  onClick={onSignClick}
                  className="max-h-14 w-auto object-contain cursor-pen hover:opacity-80 transition-opacity print:cursor-default"
                  title="Klicken zum Bearbeiten" />
              ) : (
                <button onClick={onSignClick}
                  className="mb-1 w-full px-3 py-2 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors print:hidden">
                  Unterschreiben
                </button>
              )}
            </div>
            <div className="mt-1">Unterschrift des ehrenamtlich Tätigen</div>
          </div>
        </div>
      </div>
    </div>
  );
}
