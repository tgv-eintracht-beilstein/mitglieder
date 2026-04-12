"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUsername, getGroups, login } from "@/lib/auth";
import Link from "next/link";

export default function AuthButton({ className, simple }: { className?: string; simple?: boolean }) {
  const [username, setUsername] = useState<string | null | undefined>(undefined);
  const [groups, setGroups] = useState<string[] | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const u = getUsername();
    const g = getGroups();
    setUsername(u ?? null);
    setGroups(g ?? []);
  }, []);

  const base = className ?? "px-3 py-1.5 text-sm font-medium";

  if (username === undefined) {
    // Auth status unknown — reserve space to avoid layout shift
    return <div className={`${base} rounded-full invisible`}>Anmelden</div>;
  }

  if (!username) {
    return (
      <button
        onClick={login}
        className={`${base} rounded-full bg-[#b11217] text-white hover:bg-[#8f0f13] transition-colors`}
      >
        Anmelden
      </button>
    );
  }

  const isGst = groups.includes("geschäftsstelle") || groups.includes("tgv-geschaeftsstelle");
  const isVorstand = groups.includes("vorstand") || groups.includes("tgv-vorstand") || groups.includes("hauptausschuss") || groups.includes("tgv-hauptausschuss") || groups.includes("erweiterter-vorstand") || groups.includes("tgv-erweiterter-vorstand");
  const isAbteilungsleiter = groups.includes("abteilungsleiter") || groups.includes("tgv-abteilungsleiter") || groups.some(g => g.startsWith("abt-") || g.startsWith("tgv-abt-"));
  const hasInboxAccess = groups.includes("tgv-inbox-access") || isGst || isVorstand || isAbteilungsleiter;

  const iconCls = (active: boolean) => `p-2 rounded-full transition-colors ${active ? "bg-white text-[#8f0f13]" : "text-white hover:bg-white/10"}`;

  return (
    <div className="flex items-center gap-1 bg-black/20 rounded-full p-1 backdrop-blur-sm border border-white/10">
      {/* Files */}
      <Link href="/meine-dateien" className={iconCls(pathname === "/meine-dateien")} title="Meine Dateien">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      </Link>

      {/* Inbox */}
      {hasInboxAccess && (
        <Link href="/nachrichten" className={iconCls(pathname === "/nachrichten")} title="Nachrichten">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9-2 2-2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
        </Link>
      )}

      {/* Profile */}
      <Link href="/profil" className={iconCls(pathname === "/profil")} title="Profil">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </Link>
    </div>
  );
}
