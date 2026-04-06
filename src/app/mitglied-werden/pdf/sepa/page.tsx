"use client";

import { useEffect, useState } from "react";
import type { FormState } from "../../types";
import { PdfHeader, PdfFooter } from "../../pdf-layout";

const STORAGE_KEY = "mitglied_werden_v1";

export default function SepaPdf() {
  const [state, setState] = useState<FormState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, []);

  if (!state) return null;

  const first = state.personen[0];
  const addr = first ? state.adressen.find((a) => a.id === first.addressId) : null;
  const today = new Date().toLocaleDateString("de-DE");
  const city = addr?.ort || "Beilstein";
  const inhaber = state.kontoinhaber || (first ? `${first.vorname} ${first.nachname}` : "");

  const fieldCls = "border-b border-gray-300 py-1 min-h-[1.5rem] text-sm";
  const labelCls = "text-[9px] text-gray-400 uppercase tracking-wider mb-0.5";

  return (
    <div className="p-8 text-sm text-gray-700 leading-relaxed">
      <PdfHeader />
      <h1 className="text-lg font-bold text-[#b11217] uppercase tracking-wide mb-4">SEPA Lastschriftmandat</h1>

      <div className="text-xs text-gray-600 space-y-2 mb-6">
        <p>
          Ich ermächtige den TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.&thinsp;V. bis auf Widerruf, Zahlungen von meinem Konto mittels
          Lastschrift einzuziehen. Zugleich weise ich mein Kreditinstitut an, die vom TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.&thinsp;V.
          auf mein Konto gezogenen Lastschriften einzulösen. Das untenstehende Kreditinstitut wird bei Nichteinlösung
          einer erhobenen Lastschrift, bei Widerspruch oder nach Kontoauflösung ermächtigt, dem TGV
          &bdquo;Eintracht&ldquo; Beilstein 1823 e.&thinsp;V. auf Anforderung Name und Anschrift des/der Verfügungsberechtigen
          mitzuteilen, damit ein Anspruch erhoben werden kann. Entstehende Kosten für Rücklastschriften seitens der
          Bank gehen zu meinen Lasten.
        </p>
        <p>
          Bei Rechnungsstellung wird zur Deckung der Mehrkosten ein Aufwandszuschlag in Höhe von &euro;&thinsp;5,00 erhoben.
        </p>
        <p>
          Gläubiger-Identifikationsnummer: DE66ZZZ00000274455
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <div>
          <div className={labelCls}>Kontoinhaber (Vorname, Name)</div>
          <div className={fieldCls}>{inhaber}</div>
        </div>
        <div>
          <div className={labelCls}>Straße, Hausnummer</div>
          <div className={fieldCls}>{addr?.strasse}</div>
        </div>
        <div>
          <div className={labelCls}>PLZ, Ort</div>
          <div className={fieldCls}>{addr?.plz} {addr?.ort}</div>
        </div>
        <div>
          <div className={labelCls}>Bank</div>
          <div className={fieldCls}></div>
        </div>
        <div>
          <div className={labelCls}>BIC</div>
          <div className={fieldCls}></div>
        </div>
        <div>
          <div className={labelCls}>IBAN</div>
          <div className={`${fieldCls} font-mono tracking-wider`}>{state.iban}</div>
        </div>
      </div>

      <div className="text-xs text-gray-600 space-y-2 mb-8">
        <p>
          Ihre Mandatsreferenznummer wird Ihre zukünftige Mitgliedsnummer sein.
        </p>
        <p>
          Einzugsdaten und fällige Beträge entnehmen Sie bitte dem Dokument Vereins- und Abteilungsbeiträge,
          der Finanz- und Beitragsordnung.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-12 text-xs text-gray-400 items-end">
        <div>
          <div className="h-14 flex items-end pb-1 text-gray-700 font-medium">{city}, {today}</div>
          <div className="border-t border-gray-400 pt-1">Ort, Datum</div>
        </div>
        <div>
          <div className="h-14 flex flex-col justify-end">
            {state.signature && (
              <>
                <div className="text-[7pt] text-green-600 leading-tight mb-1">&#10003; Einwilligung zur digitalen Unterschrift erteilt</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.signature} alt="Unterschrift" style={{ height: 40, width: "auto", imageRendering: "auto", objectFit: "contain" }} />
              </>
            )}
          </div>
          <div className="border-t border-gray-400 pt-1">Unterschrift</div>
        </div>
      </div>

      <PdfFooter />
    </div>
  );
}
