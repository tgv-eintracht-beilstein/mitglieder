"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
      title="Drucken / Als PDF speichern"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5V1h8v4"/>
        <rect x="1" y="5" width="12" height="6" rx="1"/>
        <path d="M3 11v2h8v-2"/>
        <circle cx="10.5" cy="8" r="0.5" fill="currentColor"/>
      </svg>
      Drucken
    </button>
  );
}
