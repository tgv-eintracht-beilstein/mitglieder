"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDebug } from "@/lib/use-debug";
import { getTokens, callApi } from "@/lib/auth";

const pages = [
  {
    href: "/profil",
    label: "Profil & Nachrichten",
    desc: "Ihre Mitgliedsgruppen und Nachrichtenzentrale",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
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
];

interface AnnouncementItem {
  name: string;
  text: string;
  departments: string[];
}

interface Announcements {
  upcomingBirthdays: AnnouncementItem[];
  pastBirthdays: AnnouncementItem[];
  anniversaries: AnnouncementItem[];
}

interface MyData {
  contactDetails: {
    first_name: string;
    family_name: string;
    date_of_birth: string | null;
    street: string;
    zip: string;
    city: string;
    private_phone: string;
    mobile_phone: string;
  };
  joinDate: string | null;
  membershipNumber: string | null;
  groups: { name: string; start: string | null; end: string | null }[];
}

function formatDate(d: string | null) {
  if (!d) return "–";
  const date = new Date(d);
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Home() {
  const [debug] = useDebug();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const visiblePages = debug || isLoggedIn ? pages : pages.filter(p => p.href !== "/profil");

  const [announcements, setAnnouncements] = useState<Announcements | null>(null);
  const [myData, setMyData] = useState<MyData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loggedIn = !!getTokens();
    setIsLoggedIn(loggedIn);
    if (!loggedIn) return;
    setLoading(true);
    Promise.all([
      callApi("/announcements").catch(() => null),
      callApi("/my-data").catch(() => null),
    ]).then(([ann, data]) => {
      setAnnouncements(ann);
      setMyData(data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="flex justify-between items-start mb-10">
        <div className="flex-1 pr-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {isLoggedIn ? "Dashboard" : "Willkommen im Mitgliederbereich"}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {isLoggedIn
              ? "Übersicht über Ihre Mitgliedschaft und aktuelle Vereinsnachrichten."
              : "Hier finden Sie alle wichtigen Formulare und Dokumente des TGV \"Eintracht\" Beilstein 1823 e. V. Wählen Sie einen Bereich aus, um fortzufahren."}
          </p>
        </div>
      </div>

      {isLoggedIn && (
        <div className="space-y-4 mb-8">
          {/* Announcements - Three Columns */}
          {loading && !announcements && (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Lade Vereinsnachrichten…
            </div>
          )}
          {announcements && (
            <div className="grid md:grid-cols-3 gap-4">
              <AnnouncementColumn title="🎉 Vereinsjubiläen" items={announcements.anniversaries.slice(0, 5)} />
              <AnnouncementColumn title="🎂 Anstehende Geburtstage" items={announcements.upcomingBirthdays.slice(0, 5)} />
              <AnnouncementColumn title="🎂 Vergangene Geburtstage" items={announcements.pastBirthdays.slice(0, 5)} />
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3">
        {visiblePages.map(({ href, label, desc, icon }) => (
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
              <div className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</div>
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

function AnnouncementColumn({ title, items }: { title: string; items: { name: string; text: string; departments: string[] }[] }) {
  if (!items.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <h3 className="font-semibold text-sm text-gray-900 mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-600 leading-relaxed">
            <span className="font-medium text-gray-800">{item.name}</span> {item.text}
            {item.departments.length > 0 && (
              <span className="inline-flex flex-wrap gap-1 ml-1">
                {item.departments.map((d, j) => (
                  <span key={j} className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium">{d}</span>
                ))}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
