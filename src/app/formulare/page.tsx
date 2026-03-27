"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getTokens } from "@/lib/auth";
import { listVersions, getDownloadUrl } from "@/lib/sync";

const FORMS = [
  { key: "ehrenamtspauschale_v2", label: "Ehrenamtspauschale", href: "/ehrenamtspauschale" },
  { key: "reisekosten_v1", label: "Reisekostenabrechnung", href: "/reisekosten" },
  { key: "uebungsleiterpauschale_v1", label: "Übungsleiterpauschale", href: "/uebungsleiterpauschale" },
];

interface Version {
  sk: string;
  key: string;
  createdAt: string;
  label: string;
  data: string;
  fileKeys: string[];
}

export default function FormularePage() {
  const [versions, setVersions] = useState<Record<string, Version[]>>({});
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!getTokens();

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    (async () => {
      const result: Record<string, Version[]> = {};
      for (const form of FORMS) {
        try {
          result[form.key] = await listVersions(form.key);
        } catch {
          result[form.key] = [];
        }
      }
      setVersions(result);
      setLoading(false);
    })();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Meine Formulare</h1>
        <p className="text-gray-500 text-sm">Bitte melden Sie sich an.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Meine Formulare</h1>
      <p className="text-gray-500 text-sm mb-6">
        Übersicht aller Formulare und gespeicherten PDF-Versionen.
      </p>

      {loading ? (
        <p className="text-gray-400 text-sm">Laden…</p>
      ) : (
        <div className="space-y-6">
          {FORMS.map((form) => (
            <div key={form.key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">{form.label}</h2>
                <Link
                  href={form.href}
                  className="text-xs text-[#b11217] hover:text-[#8f0f13] font-medium"
                >
                  Bearbeiten →
                </Link>
              </div>

              {(versions[form.key]?.length ?? 0) === 0 ? (
                <p className="text-gray-400 text-sm">Keine gespeicherten Versionen.</p>
              ) : (
                <div className="space-y-2">
                  {versions[form.key].map((v) => {
                    const ts = v.sk.split("#").pop() || "";
                    return (
                      <div key={v.sk} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                        <div>
                          <span className="font-medium text-sm text-gray-900">{v.label}</span>
                          <span className="text-xs text-gray-400 ml-2">
                            {new Date(v.createdAt).toLocaleString("de-DE")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {v.fileKeys?.length > 0 && (
                            <button
                              onClick={async () => {
                                for (const fk of v.fileKeys) {
                                  const url = await getDownloadUrl(fk);
                                  window.open(url, "_blank");
                                }
                              }}
                              className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                            >
                              PDF ↓
                            </button>
                          )}
                          <Link
                            href={`${form.href}?version=${encodeURIComponent(ts)}&readonly=1`}
                            className="text-xs text-[#b11217] hover:text-[#8f0f13] font-medium"
                          >
                            Ansehen
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
