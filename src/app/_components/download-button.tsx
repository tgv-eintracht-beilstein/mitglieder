"use client";

import { useState, useRef } from "react";

type Props = {
  filename: string;
  disabled?: boolean;
  missingCount?: number;
  checks?: { label: string; valid: boolean }[];
  side?: "top" | "bottom";
  count?: number;
  onDownload?: () => Promise<void>;
};

export default function DownloadButton({ filename, disabled: disabledProp, missingCount, checks, side = "bottom", count, onDownload }: Props) {
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState({ top: 0, bottom: 0, right: 0 });
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleMouseEnter() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const tooltipW = 288; // w-72
      const distFromRight = window.innerWidth - r.right;
      
      let finalRight = distFromRight;
      if (window.innerWidth - finalRight - tooltipW < 8) {
        finalRight = window.innerWidth - tooltipW - 8;
      }
      if (finalRight < 8) {
        finalRight = 8;
      }
      
      if (side === "top") {
        setPos({ top: 0, bottom: window.innerHeight - r.top + 6, right: finalRight });
      } else {
        setPos({ top: r.bottom + 6, bottom: 0, right: finalRight });
      }
    }
    setHovered(true);
  }

  async function handleDownload() {
    if (onDownload) {
      setLoading(true);
      try {
        await onDownload();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    console.warn("onDownload not provided to DownloadButton");
  }

  const sorted = checks ? [...checks].sort((a, b) => (a.valid === b.valid ? 0 : a.valid ? 1 : -1)) : [];

  return (
    <div className="relative inline-flex" onMouseEnter={handleMouseEnter} onMouseLeave={() => setHovered(false)}>
      {hovered && disabledProp && sorted.length > 0 && (
        <div className="fixed z-[300] w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 print:hidden"
          style={{ 
            top: side === "bottom" ? pos.top : "auto", 
            bottom: side === "top" ? pos.bottom : "auto", 
            right: pos.right 
          }}>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Pflichtfelder</div>
          <ul className="space-y-1">
            {sorted.map(c => (
              <li key={c.label} className="flex items-center gap-2 text-xs">
                <span className={`shrink-0 font-bold ${c.valid ? "text-green-500" : "text-[#b11217]"}`}>{c.valid ? "\u2713" : "\u2717"}</span>
                <span className={c.valid ? "text-gray-400" : "text-gray-800 font-medium"}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        ref={btnRef}
        onClick={handleDownload}
        disabled={loading || disabledProp}
        className="shrink-0 w-full justify-center flex items-center gap-1.5 px-5 py-3 text-base bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap overflow-hidden text-ellipsis md:w-auto md:py-2.5 md:text-sm"
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="7" cy="7" r="5" strokeOpacity="0.3"/>
              <path d="M7 2a5 5 0 015 5" strokeLinecap="round"/>
            </svg>
            Erstelle PDFs…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 1v8M4 6l3 3 3-3"/>
              <path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/>
            </svg>
            {disabledProp && missingCount
              ? <><span>{missingCount} {missingCount === 1 ? "Pflichtfeld fehlt" : "Pflichtfelder fehlen"}</span><span className="ml-1 bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{missingCount}</span></>
              : (count && count > 1 ? `${count} PDFs herunterladen` : "PDF herunterladen")
            }
          </>
        )}
      </button>
    </div>
  );
}
