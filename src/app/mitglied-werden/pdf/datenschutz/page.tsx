"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FormState } from "../../types";
import { PdfHeader, PdfFooter } from "../../pdf-layout";

const STORAGE_KEY = "mitglied_werden_v1";

function isMinor(geb: string) {
  if (!geb) return false;
  const [y, m, d] = geb.split("-").map(Number);
  const t = new Date();
  let a = t.getFullYear() - y;
  if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d)) a--;
  return a < 18;
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
    <div className="p-8 text-sm text-gray-700 leading-relaxed">
      <PdfHeader />
      <h1 className="text-lg font-bold text-[#b11217] uppercase tracking-wide mb-1">Datenschutz</h1>
      <h2 className="text-xs font-bold text-[#b11217] uppercase tracking-wide mb-4">Einwilligungserklärung für die Veröffentlichung von Daten</h2>

      <div className="text-xs text-gray-600 space-y-3 mb-6">
        <p>
          Der TGV &quot;Eintracht&quot; Beilstein 1823 e. V. weist hiermit darauf hin, dass ausreichende technische Maßnahmen zur
          Gewährleistung des Datenschutzes getroffen wurden. Dennoch kann bei einer Veröffentlichung von personenbezogenen
          Mitgliederdaten im Internet ein umfassender Datenschutz nicht garantiert werden. Daher nimmt das Vereinsmitglied die
          Risiken für eine eventuelle Persönlichkeitsverletzung zur Kenntnis und ist sich bewusst, dass:
        </p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>die personenbezogenen Daten auch in Staaten abrufbar sind, die keine der Bundesrepublik Deutschland vergleichbaren Datenschutzbestimmungen kennen.</li>
          <li>die Vertraulichkeit, die Integrität (Unverletzlichkeit), die Authentizität (Echtheit) und die Verfügbarkeit der personenbezogenen Daten nicht garantiert ist.</li>
        </ul>
        <p>
          Das Vereinsmitglied trifft diese Entscheidung zur Veröffentlichung seiner Daten im Internet freiwillig und kann seine
          Einwilligung gegenüber dem Vereinsvorstand jederzeit widerrufen.
        </p>
      </div>

      <h3 className="text-sm font-bold text-[#b11217] uppercase tracking-wide mb-3">Erklärung</h3>

      <div className="mb-4">
        <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Name in Druckbuchstaben</div>
        <div className="border-b border-gray-300 py-1 min-h-[1.5rem] text-sm uppercase">{p.vorname} {p.nachname}</div>
      </div>

      <p className="text-xs text-gray-600 mb-4">
        Ich bestätige das Vorstehende zur Kenntnis genommen zu haben und willige ein, dass der TGV &quot;Eintracht&quot; Beilstein 1823
        e. V. und seinen Gliederungen/Abteilungen folgende Daten zu meiner Person auf den Vereins- bzw.
        Abteilungswebseiten, Pressemitteilungen in der lokalen Presse und Meldungen an Verbände öffentlich verwenden darf:
      </p>

      <ul className="list-disc pl-6 text-xs text-gray-700 space-y-1 mb-6">
        <li>Vorname &amp; Nachname, Geburtsdatum, Alter, Adresse &amp; Kontaktdaten (Telefon, E-Mail)</li>
        <li>Funktionen bei Funktionären</li>
        <li>Fotos während Vereinsaktivitäten</li>
        <li>Sonstige Daten (z. B. Spielerpass-Nr., ID-Nr., Übungsleiterlizenzen, Mannschaftsgruppe)</li>
      </ul>

      <p className="text-xs text-gray-600 mb-4">
        Darüber hinaus bestätige ich, die <span className="font-semibold">Datenschutzverordnung</span> des TGV &quot;Eintracht&quot; Beilstein 1823 e. V. gelesen und akzeptiert zu haben.
      </p>

      <div className="grid grid-cols-2 gap-8 mt-10 text-xs text-gray-500 items-end">
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

      <p className="text-[8px] text-gray-500 mt-6 leading-relaxed">
        Hinweis: Bitte beachten Sie, dass keinerlei Haftung für die korrekte Anwendung im Einzelfall und Aktualität der Informationen zum
        Zeitpunkt der Verwendung übernommen werden kann. Die Informationen können insoweit nur Anregungen liefern und sind stets an
        die individuellen Bedürfnisse im Einzelfall anzupassen. Wir empfehlen ergänzend rechtlichen Rat im Vorfeld einzuholen.
      </p>

      <PdfFooter />
    </div>
  );
}
