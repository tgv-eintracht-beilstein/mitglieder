"use client";

import { useEffect, useState } from "react";
import Container from "@/app/_components/container";
import { getTokens, callApi, logout } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [tokens, setTokens] = useState<any>(null);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [directory, setDirectory] = useState<{users: any[], groups: any[]}>({users: [], groups: []});
  const router = useRouter();

  useEffect(() => {
    const t = getTokens();
    if (!t) {
      router.push("/");
      return;
    }
    setTokens(t);

    // Extract attributes from ID token payload
    try {
      const payload = JSON.parse(atob(t.id_token.split(".")[1]));
      const attrs: Record<string, string> = {};
      Object.entries(payload).forEach(([key, val]) => {
        // Filter for common and custom attributes
        if (key.startsWith("custom:") || ["given_name", "family_name", "phone_number", "birthdate", "address", "gender"].includes(key)) {
          attrs[key] = String(val);
        }
      });
      setAttributes(attrs);
    } catch (e) {
      console.error("Failed to parse ID token", e);
    }

    callApi("/directory").then(setDirectory).catch(console.error);
  }, [router]);

  if (!tokens) return null;

  const isGst = tokens.groups.includes("geschäftsstelle") || tokens.groups.includes("tgv-geschaeftsstelle");
  const isVorstand = tokens.groups.includes("vorstand") || tokens.groups.includes("tgv-vorstand") || tokens.groups.includes("hauptausschuss") || tokens.groups.includes("tgv-hauptausschuss") || tokens.groups.includes("erweiterter-vorstand") || tokens.groups.includes("tgv-erweiterter-vorstand");
  const isAbteilungsleiter = tokens.groups.includes("abteilungsleiter") || tokens.groups.includes("tgv-abteilungsleiter") || tokens.groups.some((g: string) => g.startsWith("abt-") || g.startsWith("tgv-abt-"));
  
  const hasInboxAccess = tokens.groups.includes("tgv-inbox-access") || isGst || isVorstand || isAbteilungsleiter;

  // Map technical group IDs to readable descriptions, filtering out access groups
  const displayGroups = tokens.groups
    .filter((g: string) => g !== "tgv-inbox-access")
    .map((groupId: string) => {
      // Prefer the group description for display; fall back to name or id
      if (groupId === "tgv-geschaeftsstelle" || groupId === "geschäftsstelle") return "Geschäftsstelle";
      const groupInfo = directory.groups.find(g => g.id === groupId);
      return groupInfo?.description || groupInfo?.name || groupId;
    });

  const labelMap: Record<string, string> = {
    given_name: "Vorname",
    family_name: "Nachname",
    phone_number: "Telefon",
    birthdate: "Geburtsdatum",
    address: "Adresse",
    gender: "Geschlecht"
  };

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
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Benutzerinformationen</h2>
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Email / Login</span>
                    <span className="text-lg font-medium">{tokens.username}</span>
                  </div>
                  
                  {Object.entries(attributes).map(([key, val]) => (
                    <div key={key} className="border-b border-gray-100 pb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                        {key.startsWith("custom:") ? key.split(":")[1] : (labelMap[key] || key)}
                      </span>
                      <span className="text-lg font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Ihre Rollen / Gruppen</h2>
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
