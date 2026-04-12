"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import AuthButton from "./auth-button";
import { getTokens } from "@/lib/auth";

const leftItems = [
  { href: "/docs", label: "Dokumente" },
  { href: "/mitgliedsbeitraege", label: "Mitgliedsbeiträge" },
];

const formulare = [
  { href: "/mitglied-werden", label: "Mitglied werden" },
  { href: "/reisekosten", label: "Reisekosten" },
  { href: "/uebungsleiterpauschale", label: "Übungsleiterpauschale" },
  { href: "/ehrenamtspauschale", label: "Ehrenamtspauschale" },
];

const allItems = [...leftItems, ...formulare];

const linkCls = (active: boolean) =>
  `inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold transition-all duration-200 !no-underline ${
    active ? "bg-white text-[#8f0f13] border-white" : "border-white/30 text-white hover:bg-white hover:text-[#8f0f13]"
  }`;

function FormulareDropdown() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = formulare.some((f) => pathname === f.href);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className={linkCls(active)}>
        Formulare
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[200px] z-50">
          {formulare.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-sm font-medium transition-colors !no-underline ${
                pathname === href ? "text-[#8f0f13] bg-red-50" : "text-gray-700 hover:bg-gray-50 hover:text-[#8f0f13]"
              }`}>{label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function LeftNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-2">
      {leftItems.map(({ href, label }) => (
        <Link key={href} href={href} className={linkCls(pathname === href)}>{label}</Link>
      ))}
      <FormulareDropdown />
    </nav>
  );
}

export function RightNav() {
  return (
    <nav className="flex items-center gap-2">
      <AuthButton />
      <a href="https://tgveintrachtbeilstein.de"
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/30 text-sm font-semibold text-white hover:bg-white hover:text-[#8f0f13] transition-all duration-200 !no-underline">
        Webseite
      </a>
    </nav>
  );
}

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
        onClick={() => setOpen(true)}
        aria-label="Menü öffnen"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{
          background: "radial-gradient(ellipse 40% 120% at 20% 50%, rgba(220,38,38,0.6), transparent 70%), radial-gradient(ellipse 35% 150% at 70% 40%, rgba(143,15,19,0.7), transparent 60%), radial-gradient(ellipse 30% 130% at 45% 60%, rgba(0,0,0,0.5), transparent 65%), radial-gradient(ellipse 80% 200% at 50% 100%, #dc2626, #8f0f13 40%, #111 90%)",
        }}>
          <button onClick={() => setOpen(false)} aria-label="Menü schließen"
            className="absolute top-5 right-5 p-2 rounded-lg text-white hover:bg-white/10 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <nav className="flex flex-col items-center gap-2 w-full max-w-xs">
            {allItems.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`block px-4 py-3 rounded-full text-lg font-semibold transition-colors !no-underline ${
                  pathname === href ? "text-white bg-white/10" : "text-white hover:bg-white/10"
                }`}>
                {label}
              </Link>
            ))}
            {getTokens() && (
              <Link href="/meine-dateien" onClick={() => setOpen(false)}
                className={`block px-4 py-3 rounded-full text-lg font-semibold transition-colors !no-underline ${
                  pathname === "/meine-dateien" ? "text-white bg-white/10" : "text-white hover:bg-white/10"
                }`}>
                Meine Dateien
              </Link>
            )}
            <a href="https://tgveintrachtbeilstein.de"
              className="block px-4 py-3 rounded-full text-lg font-semibold text-white hover:bg-white/10 transition-colors !no-underline">
              Webseite
            </a>
            <div className="px-4 py-3">
              <AuthButton className="block w-full px-4 py-3 text-lg font-semibold" simple />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
