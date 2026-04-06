"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const leftItems = [
  { href: "/docs", label: "Dokumente" },
  { href: "/mitgliedsbeitraege", label: "Mitgliedsbeiträge" },
  { href: "/mitglied-werden", label: "Mitglied werden" },
];

const rightItems = [
  { href: "/reisekosten", label: "Reisekosten" },
  { href: "/uebungsleiterpauschale", label: "Übungsleiterpauschale" },
  { href: "/ehrenamtspauschale", label: "Ehrenamtspauschale" },
];

const allItems = [...leftItems, ...rightItems];

const linkCls = (active: boolean) =>
  `inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold transition-all duration-200 !no-underline ${
    active ? "bg-white text-[#8f0f13] border-white" : "border-white/30 text-white hover:bg-white hover:text-[#8f0f13]"
  }`;

export function LeftNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-2">
      {leftItems.map(({ href, label }) => (
        <Link key={href} href={href} className={linkCls(pathname === href)}>{label}</Link>
      ))}
    </nav>
  );
}

export function RightNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-2">
      {rightItems.map(({ href, label }) => (
        <Link key={href} href={href} className={linkCls(pathname === href)}>{label}</Link>
      ))}
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
            <a href="https://tgveintrachtbeilstein.de"
              className="block px-4 py-3 rounded-full text-lg font-semibold text-white hover:bg-white/10 transition-colors !no-underline">
              Webseite
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
