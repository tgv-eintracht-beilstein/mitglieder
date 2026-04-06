"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FormState } from "../../types";
import { PdfHeader, PdfFooter } from "../../pdf-layout";

const STORAGE_KEY = "mitglied_werden_v1";

function formatDate(v: string) {
  if (!v) return "";
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : v;
}

export default function Wrapper() {
  return <Suspense><DatenschutzPdf /></Suspense>;
}

function DatenschutzPdf() {
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
      <PdfHeader subtitle={`Datenschutzvereinbarung · ${p.vorname} ${p.nachname}`} />
      <h1 className="text-lg font-bold text-[#b11217] mb-4">Einwilligung zur Datenverarbeitung</h1>

      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <div><span className="text-gray-400 text-xs">Name</span><br />{p.vorname} {p.nachname}</div>
        <div><span className="text-gray-400 text-xs">Geburtsdatum</span><br />{formatDate(p.geburtsdatum)}</div>
        <div><span className="text-gray-400 text-xs">Anschrift</span><br />{addr?.strasse}, {addr?.plz} {addr?.ort}</div>
        <div><span className="text-gray-400 text-xs">E-Mail</span><br />{p.email}</div>
      </div>

      <div className="space-y-3 text-sm">
        <p>Ich willige ein, dass der TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.&thinsp;V. meine personenbezogenen Daten (Name, Anschrift, Geburtsdatum, Telefon, E-Mail, Bankverbindung, Abteilungszugehörigkeit) zum Zweck der Mitgliederverwaltung, des Beitragseinzugs und der vereinsinternen Kommunikation erhebt, verarbeitet und nutzt.</p>
        <p>Die Datenverarbeitung erfolgt auf Grundlage von Art.&thinsp;6 Abs.&thinsp;1 lit.&thinsp;b DSGVO (Vertragserfüllung/Mitgliedschaft) sowie Art.&thinsp;6 Abs.&thinsp;1 lit.&thinsp;a DSGVO (Einwilligung). Die personengeschützten Daten der Mitglieder werden nach den Bestimmungen der EU-Datenschutz-Grundverordnung (DSGVO) und des Bundesdatenschutzgesetzes (BDSG) gespeichert (vgl. Beitragsordnung §&thinsp;2 Abs.&thinsp;2).</p>
        <p>Die Daten werden ausschließlich für vereinsinterne Zwecke verwendet und nicht an Dritte weitergegeben, es sei denn, dies ist zur Erfüllung gesetzlicher Pflichten oder zur Durchführung des Vereinsbetriebs (z.&thinsp;B. Meldung an Sportverbände) erforderlich.</p>
        <p>Ich bin darüber informiert, dass ich diese Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen kann. Der Widerruf ist schriftlich an den Vorstand zu richten. Durch den Widerruf wird die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung nicht berührt.</p>
        <p>Mir ist bekannt, dass ich gemäß Art.&thinsp;15–21 DSGVO Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch habe. Beschwerden können an die zuständige Aufsichtsbehörde (Landesbeauftragter für den Datenschutz Baden-Württemberg) gerichtet werden.</p>
      </div>

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
