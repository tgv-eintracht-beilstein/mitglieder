"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTokens, callApi } from "@/lib/auth";

const pages = [
  // {
  //   href: "/mitglied-werden",
  //   label: "Mitglied werden",
  //   desc: "Familien-Wizard mit Aufnahmeantrag, Datenschutz und SEPA-Mandat",
  //   icon: (
  //     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  //       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 3h5v5"/><path d="m21 3-7 7"/>
  //     </svg>
  //   ),
  // },
  {
    href: "/docs",
    label: "Dokumente",
    desc: "Satzung, Ordnungen und offizielle Vereinsdokumente",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: "/mitgliedsbeitraege",
    label: "Mitgliedsbeiträge",
    desc: "Übersicht der Vereins- und Abteilungsbeiträge für 2026",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/reisekosten",
    label: "Reisekostenabrechnung",
    desc: "Fahrtkosten und Aufwandsentschädigungen einreichen",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h18M3 12l4-4m-4 4 4 4"/><circle cx="17" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    href: "/uebungsleiterpauschale",
    label: "Übungsleiterpauschale",
    desc: "Steuerfreie Vergütung für Übungsleiter abrechnen (§ 3 Nr. 26 EStG)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: "/ehrenamtspauschale",
    label: "Ehrenamtspauschale",
    desc: "Ehrenamtspauschale nach § 3 Nr. 26a EStG mit optionalem Verzicht auf Auszahlung",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
      </svg>
    ),
  },
  // {
  //   href: "/api-zugang",
  //   label: "API-Zugang",
  //   desc: "API-Schlüssel erstellen und Dokumentation für Integrationen",
  //   icon: (
  //     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  //       <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  //     </svg>
  //   ),
  // },
];

export default function Home() {
  const [apiResult, setApiResult] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const tokens = getTokens();
    if (tokens) {
      callApi("/api")
        .then((data) => setApiResult(JSON.stringify(data)))
        .catch((e) => setApiError(e.message));
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Willkommen im Mitgliederbereich
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Hier finden Sie alle wichtigen Formulare und Dokumente des TGV "Eintracht" Beilstein 1823 e. V.
          Wählen Sie einen Bereich aus, um fortzufahren.
        </p>
      </div>

      {apiResult && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-800">
          <span className="font-semibold">API-Antwort:</span> {apiResult}
        </div>
      )}
      {apiError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-800">
          <span className="font-semibold">API-Fehler:</span> {apiError}
        </div>
      )}

      <div className="grid gap-3">
        {pages.map(({ href, label, desc, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 hover:border-[#b11217] hover:shadow-md transition-all group"
          >
            <div className="text-gray-300 group-hover:text-[#b11217] transition-colors shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 group-hover:text-[#b11217] transition-colors">
                {label}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 leading-snug">{desc}</div>
            </div>
            <svg className="ml-auto shrink-0 text-gray-200 group-hover:text-[#b11217] transition-colors" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3l5 5-5 5"/>
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
