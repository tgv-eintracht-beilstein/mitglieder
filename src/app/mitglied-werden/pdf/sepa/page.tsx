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
  const namen = state.personen.map((p) => `${p.vorname} ${p.nachname}`).join(", ");
  const inhaber = state.kontoinhaber || (first ? `${first.vorname} ${first.nachname}` : "");

  return (
    <div className="p-6 text-sm text-gray-700 leading-relaxed">
      <PdfHeader subtitle={`SEPA-Lastschriftmandat · ${inhaber}`} />
      <h1 className="text-lg font-bold text-[#b11217] mb-4">SEPA-Lastschriftmandat</h1>

      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gläubiger</div>
        <p>TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.&thinsp;V.</p>
        <p>Albert-Einstein-Str. 20, 71717 Beilstein</p>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zahlungspflichtiger / Kontoinhaber</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-400 text-xs">Kontoinhaber</span><br />{inhaber}</div>
          <div><span className="text-gray-400 text-xs">Anschrift</span><br />{addr?.strasse}, {addr?.plz} {addr?.ort}</div>
          <div className="col-span-2"><span className="text-gray-400 text-xs">IBAN</span><br /><span className="font-mono tracking-wider">{state.iban}</span></div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mitglieder</div>
        <p>{namen}</p>
      </div>

      <div className="space-y-3 text-sm mb-6">
        <p>Ich ermächtige den TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.&thinsp;V., Zahlungen von meinem Konto mittels Lastschrift einzuziehen. Zugleich weise ich mein Kreditinstitut an, die vom Verein auf mein Konto gezogenen Lastschriften einzulösen.</p>
        <p>Die Beiträge des Vereins werden durch Abbuchungsermächtigung im Lastschriftverfahren erhoben (vgl. Beitragsordnung §&thinsp;2 Abs.&thinsp;12). Die Einzugsermächtigung kann jederzeit schriftlich widerrufen werden.</p>
        <p>Hinweis: Ich kann innerhalb von acht Wochen, beginnend mit dem Belastungsdatum, die Erstattung des belasteten Betrages verlangen. Es gelten dabei die mit meinem Kreditinstitut vereinbarten Bedingungen.</p>
        <p>Ich bin verpflichtet, Kontenänderungen umgehend der Geschäftsstelle mitzuteilen (vgl. Beitragsordnung §&thinsp;2 Abs.&thinsp;5). Bei Rücklastschriften werden die anfallenden Gebühren dem Mitglied in Rechnung gestellt.</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-16 text-xs text-gray-400 items-end">
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
          <div className="border-t border-gray-400 pt-1">Unterschrift Kontoinhaber</div>
        </div>
      </div>

      <PdfFooter />
    </div>
  );
}
