"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/app/_components/container";
import { getTokens, logout, callApi } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface MemberData {
  contactDetails: {
    first_name?: string;
    family_name?: string;
    street?: string;
    zip?: string;
    city?: string;
    phone_mobile?: string;
    date_of_birth?: string;
  };
  joinDate: string | null;
  membershipNumber: string | null;
  groups: { name: string; short: string; paymentAmount: number | null; paymentInterval: number | null; start: string | null; end: string | null; paymentActive: boolean }[];
  paymentAmount: number | null;
  paymentIntervallMonths: number | null;
  paymentStartDate: string | null;
}

export default function ProfilePage() {
  const [tokens, setTokens] = useState<any>(null);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = getTokens();
    if (!t) {
      router.push("/");
      return;
    }
    setTokens(t);

    callApi("/my-data")
      .then(setMemberData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (!tokens) return null;

  const displayGroups = tokens.groups
    .filter((g: string) => g !== "tgv-inbox-access")
    .map((g: string) => {
      // Strip tgv- prefix, then format nicely
      let name = g.replace(/^tgv-/, "");
      // Known mappings
      const LABELS: Record<string, string> = {
        "vorstand": "Vorstand",
        "erweiterter-vorstand": "Erweiterter Vorstand",
        "hauptausschuss": "Hauptausschuss",
        "jugendvorstand": "Jugendvorstand",
        "geschaeftsstelle": "Geschäftsstelle",
        "abteilungsleiter": "Abteilungsleiter",
        "kassenprufer": "Kassenprüfer",
      };
      if (LABELS[name]) return LABELS[name];
      // abt-* → "Abt. Name"
      if (name.startsWith("abt-")) {
        const abt = name.slice(4).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
          .replace("Und", "&").replace("Fussball", "Fußball").replace("Ski Berg", "Ski & Berg");
        return `Abt. ${abt}`;
      }
      return name;
    });

  const cd = memberData?.contactDetails;

  return (
    <main>
      <Container>
        <div className="max-w-4xl mx-auto mt-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-lg bg-[#b11217] text-white text-sm font-medium hover:bg-[#8f0f13] transition-colors"
              >
              Abmelden
            </button>
              <Link href="/passwort-aendern" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                Passwort ändern
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Meine Daten</h2>
                {loading ? (
                  <p className="text-gray-500">Lade Profildaten…</p>
                ) : error ? (
                  <p className="text-red-600">Fehler: {error}</p>
                ) : cd ? (
                  <div className="space-y-4">
                    <Field label="Name" value={[cd.first_name, cd.family_name].filter(Boolean).join(" ")} />
                    <Field label="E-Mail" value={tokens.username} />
                    <Field label="Mitgliedsnummer" value={memberData?.membershipNumber} />
                    <Field label="Adresse" value={[cd.street, [cd.zip, cd.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")} />
                    <Field label="Telefon" value={cd.phone_mobile} />
                    <Field label="Geburtsdatum" value={cd.date_of_birth ? new Date(cd.date_of_birth).toLocaleDateString("de-DE") : undefined} />
                    <Field label="Eintrittsdatum" value={memberData?.joinDate ? new Date(memberData.joinDate).toLocaleDateString("de-DE") : undefined} />
                  </div>
                ) : (
                  <p className="text-gray-500">Kein Mitgliedsprofil gefunden.</p>
                )}
              </div>

              {memberData?.groups && memberData.groups.filter(g => !g.end && g.start).length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Mitgliedschaften & Abteilungen</h2>
                  <div className="space-y-2">
                    {memberData.groups.filter(g => !g.end && g.start).map((g, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="font-medium">{g.name}</span>
                        <span className="text-sm text-gray-500">seit {new Date(g.start!).toLocaleDateString("de-DE")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {memberData?.groups && memberData.groups.filter(g => !g.end && g.paymentActive).length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Gebuchte Beiträge</h2>
                  <div className="space-y-2">
                    {memberData.groups.filter(g => !g.end && g.paymentActive).map((g, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div>
                          <span className="font-medium">{g.name}</span>
                          {g.short && <span className="ml-2 text-xs text-gray-400">({g.short})</span>}
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold">
                            {g.paymentAmount != null ? `${Number(g.paymentAmount).toFixed(2).replace(".", ",")} €` : "–"}
                          </span>
                          {g.paymentInterval && (
                            <span className="text-xs text-gray-500 ml-1">
                              / {g.paymentInterval === 1 ? "Monat" : g.paymentInterval === 12 ? "Jahr" : `${g.paymentInterval} Mon.`}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Berechtigungen</h2>
                <div className="flex flex-col gap-2">
                  {displayGroups.length > 0 ? (
                    displayGroups.map((group: string) => (
                      <span key={group} className="px-3 py-2 bg-red-50 text-red-800 rounded-xl text-sm font-semibold border border-red-100">
                        {group}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm italic">Keine Gruppen zugewiesen.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="border-b border-gray-100 pb-2">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">{label}</span>
      <span className="text-lg font-medium">{value}</span>
    </div>
  );
}
