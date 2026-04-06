"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FormState } from "../../types";
import { PdfHeader, PdfFooter } from "../../pdf-layout";
import { ABTEILUNGEN } from "@/app/_components/aufwandsformular";

const STORAGE_KEY = "mitglied_werden_v1";

function formatDate(v: string) {
  if (!v) return "";
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : v;
}

export default function Wrapper() {
  return <Suspense><AntragPdf /></Suspense>;
}

function AntragPdf() {
  const params = useSearchParams();
  const idx = parseInt(params.get("idx") ?? "0");
  const [state, setState] = useState<FormState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, []);

  if (!state) return null;
  const p = state.personen[idx];
  if (!p) return null;
  const addr = state.adressen.find((a) => a.id === p.addressId);

  const today = new Date().toLocaleDateString("de-DE");
  const city = addr?.ort || "Beilstein";

  return (
    <div className="p-6 text-sm text-gray-700 leading-relaxed">
      <PdfHeader subtitle={`Aufnahmeantrag · ${p.vorname} ${p.nachname}`} />
      <h1 className="text-lg font-bold text-[#b11217] mb-4">Aufnahmeantrag</h1>

      <p className="mb-4">Hiermit beantrage ich die Aufnahme in den TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.&thinsp;V.</p>

      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Persönliche Angaben</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-400 text-xs">Nachname</span><br />{p.nachname}</div>
          <div><span className="text-gray-400 text-xs">Vorname</span><br />{p.vorname}</div>
          <div><span className="text-gray-400 text-xs">Geburtsdatum</span><br />{formatDate(p.geburtsdatum)}</div>
          <div><span className="text-gray-400 text-xs">Telefon</span><br />{p.telefon}</div>
          <div><span className="text-gray-400 text-xs">Anschrift</span><br />{addr?.strasse}, {addr?.plz} {addr?.ort}</div>
          <div><span className="text-gray-400 text-xs">E-Mail</span><br />{p.email}</div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gewünschte Abteilung(en)</div>
        {p.abteilungen.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {p.abteilungen.map((name) => {
              const abt = ABTEILUNGEN.find((a) => a.name === name);
              return (
                <span key={name} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full text-sm">
                  {abt && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/abteilung.${abt.slug}.png`} alt="" width={16} height={16} />
                  )}
                  {name}
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-gray-400">– keine Abteilung gewählt –</span>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-6">
        Ich erkenne die Satzung und die Ordnungen des Vereins in der jeweils gültigen Fassung an.
        Mir ist bekannt, dass die Mitgliedschaft durch freiwilligen Austritt zum Ende des laufenden
        Jahres unter Einhaltung einer Kündigungsfrist von 30 Tagen beendet werden kann. Die Kündigung
        muss dem Vorstand schriftlich zugestellt werden (§&thinsp;6 Abs.&thinsp;3 der Satzung). Die Beitragspflicht
        richtet sich nach der Beitragsordnung in der jeweils gültigen Fassung.
      </p>

      <div className="grid grid-cols-2 gap-8 mt-16 text-xs text-gray-400 items-end">
        <div>
          <div className="h-14 flex items-end pb-1 text-gray-700 font-medium">{city}, {today}</div>
          <div className="border-t border-gray-400 pt-1">Ort, Datum</div>
        </div>
        <div>
          <div className="h-14 flex flex-col justify-end">
            {p.signature && (
              <>
                <div className="text-[7pt] text-green-600 leading-tight mb-1">&#10003; Einwilligung zur digitalen Unterschrift erteilt</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.signature} alt="Unterschrift" style={{ height: 40, width: "auto", imageRendering: "auto", objectFit: "contain" }} />
              </>
            )}
          </div>
          <div className="border-t border-gray-400 pt-1">Unterschrift {p.vorname} {p.nachname}{p.geburtsdatum && (() => { const [y,m,d] = p.geburtsdatum.split("-").map(Number); const t = new Date(); let a = t.getFullYear()-y; if(t.getMonth()+1<m||(t.getMonth()+1===m&&t.getDate()<d))a--; return a < 18 ? " / Erziehungsberechtigte/r" : ""; })()}</div>
        </div>
      </div>

      <PdfFooter />
    </div>
  );
}
