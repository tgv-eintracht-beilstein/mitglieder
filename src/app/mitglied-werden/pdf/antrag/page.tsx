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

function isMinor(geb: string) {
  if (!geb) return false;
  const [y, m, d] = geb.split("-").map(Number);
  const t = new Date();
  let a = t.getFullYear() - y;
  if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d)) a--;
  return a < 18;
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

  const fieldCls = "border-b border-gray-300 py-1 min-h-[1.5rem] text-sm";
  const labelCls = "text-[9px] text-gray-400 uppercase tracking-wider mb-0.5";

  return (
    <div className="p-8 text-sm text-gray-700 leading-relaxed">
      <PdfHeader />
      <h1 className="text-lg font-bold text-[#b11217] uppercase tracking-wide mb-6">Aufnahmeantrag</h1>

      <div className="space-y-3 mb-6">
        <div>
          <div className={labelCls}>Eintrittsdatum</div>
          <div className={fieldCls}>{today}</div>
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
          <div className={labelCls}>Telefon</div>
          <div className={fieldCls}>{p.telefon}</div>
        </div>
        <div>
          <div className={labelCls}>E-Mail</div>
          <div className={fieldCls}>{p.email}</div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Mitgliedschaft für folgende Personen (es muss für jede Person eine Datenschutzerklärung ausgefüllt werden):
      </p>

      <table className="w-full border-collapse mb-6 text-xs">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-1.5 font-bold text-gray-500 uppercase tracking-wider">Name</th>
            <th className="text-left py-1.5 font-bold text-gray-500 uppercase tracking-wider">Vorname</th>
            <th className="text-left py-1.5 font-bold text-gray-500 uppercase tracking-wider">Geschlecht</th>
            <th className="text-left py-1.5 font-bold text-gray-500 uppercase tracking-wider">Geburtsdatum</th>
            <th className="text-left py-1.5 font-bold text-gray-500 uppercase tracking-wider">Abteilung</th>
          </tr>
        </thead>
        <tbody>
          {state.personen.map((person) => {
            const abtNames = person.abteilungen.map((name) => {
              const abt = ABTEILUNGEN.find((a) => a.name === name);
              return abt ? name : name;
            });
            return (
              <tr key={person.id} className="border-b border-gray-200">
                <td className="py-2">{person.nachname}</td>
                <td className="py-2">{person.vorname}</td>
                <td className="py-2"></td>
                <td className="py-2">{formatDate(person.geburtsdatum)}</td>
                <td className="py-2">{abtNames.join(", ")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="text-xs text-gray-600 space-y-2 mb-8">
        <p>
          Mit der Genehmigung durch alle Erziehungsberechtigten übernehmen die bzw. übernimmt der
          Unterzeichnende die Haftung für die Beitragspflicht. Mit der Unterzeichnung bzw. Genehmigung durch den
          Erziehungsberechtigten werden die Satzung sowie alle Vereinsordnungen, insbesondere die Beitragsordnung,
          anerkannt. Die benannten Ordnungen des TGV „Eintracht" Beilstein sind in der Geschäftsstelle erhältlich.
        </p>
        <p>
          Kündigungen sind ausschließlich zum Jahresende (31.12.) möglich und müssen der Geschäftsstelle bis
          zum 30.11. des Jahres in schriftlicher Form vorliegen.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-12 text-xs text-gray-400 items-end">
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
          <div className="border-t border-gray-400 pt-1">Unterschrift{isMinor(p.geburtsdatum) ? " (Erziehungsberechtigte/r)" : ""}</div>
        </div>
      </div>

      <PdfFooter />
    </div>
  );
}
