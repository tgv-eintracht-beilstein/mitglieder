"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  // { href: "/mitglied-werden"label: "Mitglied werden" },
  { href: "/docs", label: "Dokumente" },
  { href: "/mitgliedsbeitraege", label: "Mitgliedsbeiträge" },
  { href: "/reisekosten", label: "Reisekosten" },
  { href: "/uebungsleiterpauschale", label: "Übungsleiterpauschale" },
  { href: "/ehrenamtspauschale-verzicht", label: "EAP-Verzicht" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden [@media(min-width:1075px)]:flex items-center gap-1 print:hidden">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === href
                ? "bg-white text-[#b11217]"
                : "text-red-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger button */}
      <button
        className="[@media(max-width:1074px)]:flex hidden print:hidden p-2 rounded-lg hover:bg-white/20 transition-colors"
        onClick={() => setOpen(true)}
        aria-label="Menü öffnen"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="19" y2="6" />
          <line x1="3" y1="11" x2="19" y2="11" />
          <line x1="3" y1="16" x2="19" y2="16" />
        </svg>
      </button>

      {/* Fullscreen mobile menu */}
      {open && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#b11217] to-[#8f0f13] flex flex-col print:hidden">
          <div className="flex justify-end p-5">
            <button
              onClick={() => setOpen(false)}
              aria-label="Menü schließen"
              className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="4" x2="20" y2="20" />
                <line x1="20" y1="4" x2="4" y2="20" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col items-center justify-center flex-1 gap-6">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`text-2xl font-semibold transition-colors ${
                  pathname === href
                    ? "text-white"
                    : "text-red-200 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
