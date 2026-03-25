"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import SignatureModal from "@/app/_components/signature-modal";
import VerzichtPageContent from "./verzicht-page-content";
import DownloadButtonBase from "./download-button";
import FormHeader, { formatDateDE } from "@/app/_components/form-header";
import { SHARED_ADDRESS_KEY, saveSharedAddress, loadSharedAddress, loadSharedSignature, saveSharedSignature } from "@/lib/sharedAddress";
import { buildPdfFilename } from "@/lib/pdfFilename";
import { UEBUNGSLEITER_CATEGORIES } from "@/lib/constants";
const KM_RATE = 0.3;
const BESCHREIBUNGEN_KEY = "tgv_beschreibungen_v1";

function loadBeschreibungen(): string[] {
  try { return JSON.parse(localStorage.getItem(BESCHREIBUNGEN_KEY) ?? "[]"); } catch { return []; }
}
function saveBeschreibung(val: string) {
  if (!val.trim()) return;
  const list = loadBeschreibungen();
  const next = [val.trim(), ...list.filter(s => s !== val.trim())].slice(0, 50);
  localStorage.setItem(BESCHREIBUNGEN_KEY, JSON.stringify(next));
}

function BeschreibungInput({ value, onChange, className, large }: {
  value: string; onChange: (v: string) => void; className?: string; large?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setSuggestions(loadBeschreibungen()); }, []);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function handleChange(v: string) {
    onChange(v);
    const q = v.trim().toLowerCase();
    setFiltered(q ? suggestions.filter(s => s.toLowerCase().includes(q) && s !== v) : suggestions);
    setOpen(true);
  }

  function pick(s: string) { onChange(s); setOpen(false); }

  function handleBlur() {
    saveBeschreibung(value);
    setSuggestions(loadBeschreibungen());
  }

  const isEmpty = !value.trim();
  const baseCls = large
    ? `w-full border-b bg-transparent py-2 text-base focus:outline-none transition-colors ${isEmpty ? "border-[#b11217] focus:border-[#b11217]" : "border-gray-300 focus:border-[#b11217]"}`
    : `w-full bg-transparent border-b px-1 py-1 text-xs focus:outline-none transition-colors ${isEmpty ? "border-[#b11217] focus:border-[#b11217]" : "border-gray-300 focus:border-blue-400"}`;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <input
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => { setFiltered(value.trim() ? suggestions.filter(s => s.toLowerCase().includes(value.trim().toLowerCase()) && s !== value) : suggestions); setOpen(true); }}
        onBlur={handleBlur}
        placeholder={large ? "Kursbezeichnung / Reiseziel" : ""}
        className={baseCls}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full left-0 w-full min-w-[200px] bg-white border border-gray-200 rounded shadow-md mt-0.5 max-h-48 overflow-y-auto print:hidden">
          {filtered.map(s => (
            <li key={s}>
              <button type="button" onMouseDown={() => pick(s)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 truncate">
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const ABTEILUNGEN: { name: string; slug: string }[] = [
  { name: "Fußball",       slug: "fussball" },
  { name: "Leichtathletik",slug: "leichtathletik" },
  { name: "Turnen",        slug: "turnen" },
  { name: "Tischtennis",   slug: "tischtennis" },
  { name: "Handball",      slug: "handball" },
  { name: "Schwimmen",     slug: "schwimmen" },
  { name: "Gymnastik",     slug: "gymnastik" },
  { name: "Gesang",        slug: "gesang" },
  { name: "Tennis",        slug: "tennis" },
  { name: "Ski & Berg",    slug: "ski_und_berg" },
];

export function AbteilungIcon({ slug, print = false, size = 20 }: { slug: string; print?: boolean; size?: number }) {
  const ext = print ? "png" : "svg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/abteilung.${slug}.${ext}`}
      alt=""
      width={size}
      height={size}
      className="shrink-0 object-contain"
    />
  );
}

export function AbteilungSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = ABTEILUNGEN.find((a) => a.name === value);

  const items = (
    <>
      {ABTEILUNGEN.map((a) => (
        <button
          key={a.name}
          type="button"
          onClick={() => { onChange(a.name); setOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 text-left ${value === a.name ? "text-[#b11217] font-medium" : ""}`}
        >
          <AbteilungIcon slug={a.slug} size={22} />
          {a.name}
        </button>
      ))}
    </>
  );

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="print:hidden w-full flex items-center gap-2 border-b border-gray-300 bg-transparent py-0.5 text-sm focus:outline-none focus:border-[#b11217] text-left"
      >
        {selected && <AbteilungIcon slug={selected.slug} size={18} />}
        <span className={value ? "" : "text-gray-400"}>{value || "– bitte wählen –"}</span>
        <svg className="ml-auto shrink-0 text-gray-400" width={12} height={12} viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" /></svg>
      </button>

      {/* Print view */}
      {selected ? (
        <span className="hidden print:flex items-center gap-2 text-sm">
          <AbteilungIcon slug={selected.slug} print size={18} />
          {value}
        </span>
      ) : (
        <span className="hidden print:block text-sm text-gray-400">– keine Abteilung gewählt –</span>
      )}

      {/* Desktop dropdown */}
      {open && (
        <div className="hidden sm:block absolute z-50 top-full left-0 w-full bg-white border border-gray-200 rounded shadow-md mt-0.5 print:hidden">
          {items}
        </div>
      )}

      {/* Mobile fullscreen overlay */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-50 bg-white flex flex-col print:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="font-medium text-sm">Abteilung wählen</span>
            <button type="button" onClick={() => setOpen(false)} className="p-1 text-gray-500">
              <svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <path d="M4 4l12 12M16 4L4 16" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
            {items}
          </div>
        </div>
      )}
    </div>
   );
 }

function UEbungsleiterCategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
   const [open, setOpen] = useState(false);
   const ref = useRef<HTMLDivElement>(null);

   useEffect(() => {
     function handleClick(e: MouseEvent) {
       if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
     }
     document.addEventListener("mousedown", handleClick);
     return () => document.removeEventListener("mousedown", handleClick);
   }, []);

   const selected = UEBUNGSLEITER_CATEGORIES.find((a) => a.name === value);

   const items = (
     <>
       {UEBUNGSLEITER_CATEGORIES.map((a) => (
         <button
           key={a.name}
           type="button"
           onClick={() => { onChange(a.name); setOpen(false); }}
           className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 text-left ${value === a.name ? "text-[#b11217] font-medium" : ""}`}
         >
           {a.name}
         </button>
       ))}
     </>
   );

   return (
     <div ref={ref} className="relative w-full">
       {/* Trigger */}
       <button
         type="button"
         onClick={() => setOpen(o => !o)}
         className="print:hidden w-full flex items-center gap-2 border-b border-gray-300 bg-transparent py-0.5 text-sm focus:outline-none focus:border-[#b11217] text-left"
       >
         <span className={value ? "" : "text-gray-400"}>{value || "– bitte wählen –"}</span>
         <svg className="ml-auto shrink-0 text-gray-400" width={12} height={12} viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" /></svg>
       </button>

       {/* Print view */}
       {selected ? (
         <span className="hidden print:block text-sm">
           {value}
         </span>
       ) : (
         <span className="hidden print:block text-sm text-gray-400">– keine Kategorie gewählt –</span>
       )}

       {/* Desktop dropdown */}
       {open && (
         <div className="hidden sm:block absolute z-50 top-full left-0 w-full bg-white border border-gray-200 rounded shadow-md mt-0.5 print:hidden">
           {items}
         </div>
       )}

       {/* Mobile fullscreen overlay */}
       {open && (
         <div className="sm:hidden fixed inset-0 z-50 bg-white flex flex-col print:hidden">
           <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
             <span className="font-medium text-sm">Kategorie wählen</span>
             <button type="button" onClick={() => setOpen(false)} className="p-1 text-gray-500">
               <svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                 <path d="M4 4l12 12M16 4L4 16" />
               </svg>
             </button>
           </div>
           <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
             {items}
           </div>
         </div>
       )}
     </div>
    );
  }

const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

function formatMonthRange(von: string, bis: string): string {
  if (!von) return "– bitte wählen –";
  const [vy, vm] = von.split("-").map(Number);
  if (!bis || bis === von) return `${MONTHS_DE[vm - 1]} ${vy}`;
  const [by, bm] = bis.split("-").map(Number);
  if (vy === by) return `${MONTHS_DE[vm - 1]} – ${MONTHS_DE[bm - 1]} ${vy}`;
  return `${MONTHS_DE[vm - 1]} ${vy} – ${MONTHS_DE[bm - 1]} ${by}`;
}

export function MonthSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function openPanel() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen(o => !o);
  }

  const [year, month] = value ? value.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
  const label = value ? `${MONTHS_DE[month - 1]} ${year}` : "– bitte wählen –";
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const content = (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-center gap-2">
        <button type="button" onClick={() => onChange(`${year - 1}-${String(month).padStart(2,"0")}`)}
          className="p-1 rounded hover:bg-gray-100 text-gray-500">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4l-4 4 4 4"/></svg>
        </button>
        <select value={year} onChange={e => onChange(`${e.target.value}-${String(month).padStart(2,"0")}`)}
          className="border-b border-gray-300 bg-transparent text-sm font-medium focus:outline-none focus:border-[#b11217] px-1">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button type="button" onClick={() => onChange(`${year + 1}-${String(month).padStart(2,"0")}`)}
          className="p-1 rounded hover:bg-gray-100 text-gray-500">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4l4 4-4 4"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {MONTHS_DE.map((m, i) => (
          <button key={m} type="button"
            onClick={() => { onChange(`${year}-${String(i+1).padStart(2,"0")}`); setOpen(false); }}
            className={`py-2 text-xs rounded-lg transition-colors ${month === i+1 ? "bg-[#b11217] text-white font-medium" : "hover:bg-gray-100 text-gray-700"}`}>
            {m.slice(0,3)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative w-full">
      <button ref={btnRef} type="button" onClick={openPanel}
        className="print:hidden w-full flex items-center gap-2 border-b border-gray-300 bg-transparent py-0.5 text-sm focus:outline-none focus:border-[#b11217] text-left">
        <span className={value ? "" : "text-gray-400"}>{label}</span>
        <svg className="ml-auto shrink-0 text-gray-400" width={12} height={12} viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round"/></svg>
      </button>
      <span className="hidden print:block text-sm">{label}</span>
      {open && (
        <>
          {/* Desktop: fixed panel escapes overflow clipping */}
          <div ref={panelRef} className="hidden sm:block fixed z-[200] w-64 bg-white border border-gray-200 rounded shadow-md print:hidden"
            style={{ top: pos.top, left: pos.left }}>{content}</div>
          {/* Mobile: fullscreen overlay */}
          <div className="sm:hidden fixed inset-0 z-[200] bg-white flex flex-col print:hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="font-medium text-sm">Monat wählen</span>
              <button type="button" onClick={() => setOpen(false)} className="p-1 text-gray-500">
                <svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 4l12 12M16 4L4 16"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{content}</div>
          </div>
        </>
      )}
    </div>
  );
}

export function DateSelect({ value, onChange, className, minYear }: { value: string; onChange: (v: string) => void; className?: string; minYear?: number }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [yearDraft, setYearDraft] = useState<string | null>(null);
  const [pickMonth, setPickMonth] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close() { setOpen(false); }
    function h(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", h);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", h);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, []);

  function openPanel() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const panelW = 276;
      const left = Math.min(r.left, window.innerWidth - panelW - 8);
      setPos({ top: r.bottom + 4, left: Math.max(8, left) });
    }
    setOpen(o => { if (o) setPickMonth(false); return !o; });
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const parts = value ? value.split("-").map(Number) : [null, null, null];
  const [year, month, day] = parts as [number|null, number|null, number|null];
  const label = value ? `${String(day).padStart(2,"0")}.${String(month).padStart(2,"0")}.${year}` : "– Datum –";
  const curYear = today.getFullYear();
  const curMonth = today.getMonth() + 1;
  const curDay = today.getDate();
  const yearFrom = minYear ?? curYear - 2;
  const years = Array.from({ length: Math.max(5, curYear + 5 - yearFrom + 1) }, (_, i) => curYear + 5 - i);
  // When empty, display current month; otherwise use value's month
  const displayYear = year ?? curYear;
  const displayMonth = month ?? curMonth;
  const daysInMonth = new Date(displayYear, displayMonth, 0).getDate();

  function set(y: number, m: number, d: number) {
    const clampedD = Math.min(d, new Date(y, m, 0).getDate());
    onChange(`${y}-${String(m).padStart(2,"0")}-${String(clampedD).padStart(2,"0")}`);
  }

  const desktopPanel = (
    <div className="p-3 space-y-3 min-w-[260px]">
      <div className="flex items-center gap-2">
        {pickMonth && <button type="button" onClick={() => setPickMonth(false)} className="order-last text-gray-400 hover:text-gray-600">
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
        </button>}
        <input
          type="number"
          value={yearDraft ?? displayYear}
          onFocus={e => { setYearDraft(String(displayYear)); e.target.select(); }}
          onBlur={() => {
            const y = Number(yearDraft);
            if (y >= (minYear ?? curYear - 100) && y <= curYear + 10) set(y, displayMonth, day ?? curDay);
            setYearDraft(null);
          }}
          onChange={e => {
            setYearDraft(e.target.value);
            const y = Number(e.target.value);
            if (y >= (minYear ?? curYear - 100) && y <= curYear + 10) set(y, displayMonth, day ?? curDay);
          }}
          min={minYear ?? 1900}
          max={curYear + 10}
          className={`w-20 border-b bg-transparent text-sm focus:outline-none px-1 py-1 text-center transition-colors ${yearDraft !== null && (isNaN(Number(yearDraft)) || Number(yearDraft) < (minYear ?? curYear - 100)) ? "border-red-500 text-red-600" : "border-gray-300 focus:border-[#b11217]"}`}
        />
        <button type="button" onClick={() => setPickMonth(p => !p)}
          className="flex-1 border-b border-gray-300 bg-transparent text-sm focus:outline-none hover:border-[#b11217] px-1 py-1 text-left">
          {MONTHS_DE[displayMonth - 1]} ▾
        </button>
      </div>
      {pickMonth ? (
        <div className="grid grid-cols-3 gap-1">
          {MONTHS_DE.map((m, i) => (
            <button key={m} type="button"
              onClick={() => { set(displayYear, i + 1, day ?? curDay); setPickMonth(false); }}
              className={`text-xs rounded px-1 py-2 transition-colors
                ${displayMonth === i + 1 ? "bg-[#b11217] text-white font-medium" : "hover:bg-gray-100 text-gray-700"}`}>
              {m}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
        {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => (
          <div key={d} className="text-center text-[10px] text-gray-400 font-medium py-1">{d}</div>
        ))}
        {Array.from({ length: new Date(displayYear, displayMonth - 1, 1).getDay() === 0 ? 6 : new Date(displayYear, displayMonth - 1, 1).getDay() - 1 }, (_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const isSelected = day === d && year === displayYear && month === displayMonth;
          const isToday = d === curDay && displayMonth === curMonth && displayYear === curYear;
          return (
            <button key={d} type="button"
              onClick={() => { set(displayYear, displayMonth, d); setOpen(false); }}
              className={`aspect-square text-xs rounded-full transition-colors
                ${isSelected ? "bg-[#b11217] text-white font-medium" :
                  isToday ? "ring-1 ring-[#b11217] text-[#b11217] font-medium hover:bg-red-50" :
                  "hover:bg-gray-100 text-gray-700"}`}>
              {d}
            </button>
          );
        })}
        </div>
      )}
    </div>
  );

  return (
    <div className={`relative ${className ?? ""}`}>
      {/* Mobile: native date input */}
      <input
        type="date"
        value={value}
        min={`${yearFrom}-01-01`}
        onChange={e => onChange(e.target.value)}
        className="sm:hidden w-full bg-transparent border-b border-gray-300 py-0.5 text-[length:inherit] focus:outline-none focus:border-[#b11217] print:hidden"
      />
      {/* Desktop: custom button + panel */}
      <button ref={btnRef} type="button" onClick={openPanel}
        className="hidden sm:flex w-full items-center gap-1 border-b border-gray-300 bg-transparent py-0.5 text-[length:inherit] focus:outline-none focus:border-[#b11217] text-left print:hidden">
        <span className={value ? "" : "text-gray-400"}>{label}</span>
        <svg className="ml-auto shrink-0 text-gray-400" width={12} height={12} viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round"/></svg>
      </button>
      <span className="hidden print:block text-sm">{label}</span>
      {open && (
        <div ref={panelRef} className="fixed z-[200] bg-white border border-gray-200 rounded shadow-md print:hidden"
          style={{ top: pos.top, left: pos.left }}>{desktopPanel}</div>
      )}
    </div>
  );
}

function NumberInput({ value, onChange, step = 1, min = 0, className, large }: {
  value: string; onChange: (v: string) => void; step?: number; min?: number; className?: string; large?: boolean;
}) {
  const num = parseFloat(value) || 0;
  function adjust(delta: number) {
    const next = Math.max(min, Math.round((num + delta) * 100) / 100);
    onChange(String(next));
  }
  return (
    <span className={`inline-flex items-center justify-center border-b border-gray-300 focus-within:border-[#b11217] ${className ?? ""}`}>
      <button type="button" onClick={() => adjust(-step)}
        className={`text-gray-400 hover:text-gray-700 print:hidden leading-none ${large ? "px-4 py-2 text-xl" : "px-1"}`}>−</button>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} step={step} min={min}
        className={`text-center bg-transparent focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${large ? "w-20 text-base" : "w-10 text-xs"}`} />
      <button type="button" onClick={() => adjust(step)}
        className={`text-gray-400 hover:text-gray-700 print:hidden leading-none ${large ? "px-4 py-2 text-xl" : "px-1"}`}>+</button>
    </span>
  );
}

interface Row {
  id: number;
  datum: string;
  von: string;
  bis: string;
  satz: string;
  km: string;
  beschreibung: string;
}

interface FormState {
  nachname: string;
  vorname: string;
  strasse: string;
  plzOrt: string;
  geburtsdatum: string;
  telefon: string;
  email: string;
  abteilung: string;
  uebungsleiterKategorie: string;
  monatVon: string;
  monatBis: string;
  iban: string;
  aufwandsspende: string;
  zahlungBar: boolean;
  zahlungUeberweisung: boolean;
  steuerVollHoehe: boolean;
  steuerBisZu: boolean;
  steuerBisZuBetrag: string;
  steuerNicht: boolean;
  signature: string;
  overrideDate: string | null;
  rows: Row[];
  nextId: number;
}

export interface AufwandsformularConfig {
  storageKey: string;
  title: string;
  filename: string;
  showKm?: boolean;      // default true
  showStunden?: boolean; // default true
  showSteuererklärung?: boolean; // default true
  showVerzicht?: boolean; // default true – generate Verzichtserklärung PDF when spende > 0
  enforceMaxAufwand?: boolean; // default false – when true, Aufwandsentschädigung may not exceed the tax-free limit
  showKategorie?: boolean; // default false – show Übungsleiter category select (Jugend/Erwachsene)
}

export function validateIban(raw: string): boolean {
  const iban = raw.replace(/\s+/g, "").toUpperCase();
  if (iban.length < 5) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.split("").map((c) => {
    const code = c.charCodeAt(0);
    return code >= 65 && code <= 90 ? String(code - 55) : c;
  }).join("");
  let remainder = 0;
  for (const ch of numeric) {
    remainder = (remainder * 10 + parseInt(ch, 10)) % 97;
  }
  return remainder === 1;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function calcStunden(von: string, bis: string): number {
  if (!von || !bis) return 0;
  const [vh, vm] = von.split(":").map(Number);
  const [bh, bm] = bis.split(":").map(Number);
  const diff = (bh * 60 + bm) - (vh * 60 + vm);
  return diff > 0 ? Math.round(diff / 15) * 0.25 : 0;
}

function calcRow(row: Row): number {
  const stunden = calcStunden(row.von, row.bis);
  return stunden * (parseFloat(row.satz) || 0) + (parseFloat(row.km) || 0) * KM_RATE;
}


function getMaxSpendenBetrag(year: string | null): number {
  // Get the maximum spending limit based on year
  // For 2026 and later: 3300, before 2026: 3000
  if (!year) return 3300; // Default to current limit
  const yearNum = parseInt(year);
  return yearNum >= 2026 ? 3300 : 3000;
}


function nowRounded(): string {
  const d = new Date();
  const m = Math.round(d.getMinutes() / 15) * 15 % 60;
  const h = m === 60 ? d.getHours() + 1 : d.getHours();
  return `${String(h % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

const MINUTES = ["00", "15", "30", "45"];

function TimeSelect({ value, onChange, className }: {
  value: string; onChange: (v: string) => void; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  // Local draft for mobile — only committed on checkmark
  const [draftH, setDraftH] = useState<string>("00");
  const [draftM, setDraftM] = useState<string>("00");
  const [pickedH, setPickedH] = useState(false);
  const [pickedM, setPickedM] = useState(false);

  useEffect(() => {
    function close() { setOpen(false); }
    function h(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      if (mobileRef.current?.contains(e.target as Node)) return;
      close();
    }
    document.addEventListener("mousedown", h);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", h);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, []);

  function openPanel() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    // Init draft from current value
    const [h, m] = value ? value.split(":") : ["00", "00"];
    setDraftH(h);
    setDraftM(m);
    setPickedH(false);
    setPickedM(false);
    setOpen(o => !o);
  }

  const [curH, curM] = value ? value.split(":") : ["00", "00"];
  const label = value || "––:––";
  const draftLabel = `${draftH}:${draftM}`;

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

  // Desktop: picks apply immediately
  function pickDesktop(h: string, m: string) {
    onChange(`${h}:${m}`);
    setOpen(false);
  }

  function renderContent(large: boolean) {
    const displayH = large ? draftH : curH;
    const displayM = large ? draftM : curM;
    const btnH = large ? "py-3 text-base" : "py-1 text-xs";
    const btnM = large ? "py-4 text-lg font-medium" : "py-1.5 text-xs";
    return (
      <div className={large ? "p-4 space-y-4" : "p-3 space-y-2 w-56"}>
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Stunde</div>
        <div className="grid grid-cols-6 gap-1">
          {hours.map(h => (
            <button key={h} type="button"
              onClick={() => {
                if (large) { setDraftH(h); setPickedH(true); if (pickedM) { onChange(`${h}:${displayM}`); setOpen(false); } }
                else pickDesktop(h, displayM);
              }}
              className={`rounded transition-colors ${btnH} ${displayH === h ? "bg-[#b11217] text-white font-medium" : "hover:bg-gray-100 text-gray-700"}`}>
              {h}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide pt-1">Minute</div>
        <div className="grid grid-cols-4 gap-2">
          {MINUTES.map(m => (
            <button key={m} type="button"
              onClick={() => {
                if (large) { setDraftM(m); setPickedM(true); if (pickedH) { onChange(`${displayH}:${m}`); setOpen(false); } }
                else pickDesktop(displayH, m);
              }}
              className={`rounded transition-colors ${btnM} ${displayM === m ? "bg-[#b11217] text-white font-medium" : "hover:bg-gray-100 text-gray-700"}`}>
              :{m}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <span className={`relative inline-block ${className ?? ""}`}>
      <button ref={btnRef} type="button" onClick={openPanel}
        className="w-full flex items-center gap-1 border-b border-gray-300 bg-transparent py-0.5 text-[length:inherit] focus:outline-none focus:border-[#b11217] text-left print:hidden tabular-nums">
        <span className={value ? "" : "text-gray-400"}>{label}</span>
        <svg className="ml-auto shrink-0 text-gray-400" width={10} height={10} viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round"/></svg>
      </button>
      <span className="hidden print:inline text-xs tabular-nums">{label}</span>
      {open && (
        <>
          <div ref={panelRef} className="hidden sm:block fixed z-[200] bg-white border border-gray-200 rounded shadow-md print:hidden"
            style={{ top: pos.top, left: pos.left }}>{renderContent(false)}</div>
          <div ref={mobileRef} className="sm:hidden fixed inset-0 z-[200] bg-white flex flex-col print:hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="font-medium text-sm tabular-nums">{draftLabel}</span>
              <div className="flex items-center gap-2">
                {(pickedH || pickedM) && (
                  <button type="button" onClick={() => { onChange(draftLabel); setOpen(false); }} className="p-1 text-green-600">
                    <svg width={22} height={22} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 10l5 5 7-8"/></svg>
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)} className="p-1 text-gray-500">
                  <svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 4l12 12M16 4L4 16"/></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">{renderContent(true)}</div>
          </div>
        </>
      )}
    </span>
  );
}

function PrintCheckbox({ checked }: { checked: boolean }) {
  return (
    <span className="hidden print:inline-flex items-center justify-center shrink-0 relative top-[2px]" style={{ width: 14, height: 14 }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="13" height="13" rx="1.5" stroke="#333" strokeWidth="1" fill="white"/>
        {checked && <path d="M4 4l6 6M10 4l-6 6" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>}
      </svg>
    </span>
  );
}

function emptyRow(id: number): Row {
  return { id, datum: "", von: "00:00", bis: "00:00", satz: "15", km: "", beschreibung: "" };
}

function defaultState(): FormState {
  return {
    nachname: "", vorname: "", strasse: "", plzOrt: "",
    geburtsdatum: "", telefon: "", email: "", abteilung: "", uebungsleiterKategorie: "Jugend",
    monatVon: "", monatBis: "", iban: "", aufwandsspende: "",
    zahlungBar: false, zahlungUeberweisung: false,
    steuerVollHoehe: false, steuerBisZu: false, steuerBisZuBetrag: "", steuerNicht: false,
    signature: "",
    overrideDate: null,
    rows: [emptyRow(1)],
    nextId: 2,
  };
}

function PI({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block w-full ${className ?? ""}`}>
      <span className="print:hidden w-full">{children}</span>
      <span className="hidden print:inline">{value}</span>
    </span>
  );
}

function RowEditModal({ row, onSave, onDelete, onClose, showKm = true, showStunden = true }: {
  row: Row; onSave: (r: Row) => void; onDelete: () => void; onClose: () => void;
  showKm?: boolean; showStunden?: boolean;
}) {
  const [draft, setDraft] = useState<Row>({ ...row });
  const f = <K extends keyof Row>(k: K, v: Row[K]) => setDraft(d => ({ ...d, [k]: v }));
  const stunden = calcStunden(draft.von, draft.bis);
  const ergebnis = stunden * (parseFloat(draft.satz) || 0) + (parseFloat(draft.km) || 0) * KM_RATE;
  const fieldCls = "w-full border-b border-gray-300 bg-transparent py-2 text-base focus:outline-none focus:border-[#b11217] transition-colors";

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-[#b11217] text-white">
        <span className="font-semibold">Zeile bearbeiten</span>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded" aria-label="Schließen">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/>
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <label className="text-xs text-gray-400">Datum</label>
          <DateSelect value={draft.datum} onChange={v => f("datum", v)} className={fieldCls} />
        </div>
        {showStunden && (
          <div>
            <label className="text-xs text-gray-400">von</label>
            <TimeSelect value={draft.von} onChange={v => {
              const [oh, om] = draft.von.split(":").map(Number);
              const [bh, bm] = draft.bis.split(":").map(Number);
              const diff = draft.bis !== "00:00" || draft.von !== "00:00" ? (bh * 60 + bm) - (oh * 60 + om) : 60;
              const [nh, nm] = v.split(":").map(Number);
              const nb = Math.max(0, Math.min(nh * 60 + nm + diff, 23 * 60 + 59));
              f("von", v);
              f("bis", `${String(Math.floor(nb / 60)).padStart(2, "0")}:${String(nb % 60).padStart(2, "0")}`);
            }} className="w-full text-base" />
          </div>
        )}
        {showStunden && (
          <div>
            <label className="text-xs text-gray-400">bis</label>
            <TimeSelect value={draft.bis} onChange={v => f("bis", v)} className="w-full text-base" />
          </div>
        )}
        {showStunden && (
          <div className="bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-600">
            Aufwand: <span className="font-semibold tabular-nums">{stunden.toFixed(2)} Std.</span>
          </div>
        )}
        {showStunden && (
          <div>
            <label className="text-xs text-gray-400">€ / Std.</label>
            <div className="py-2"><NumberInput value={draft.satz} onChange={v => f("satz", v)} step={0.5} className="w-full" large /></div>
          </div>
        )}
        {showKm && (
          <div>
            <label className="text-xs text-gray-400">km</label>
            <div className="py-2"><NumberInput value={draft.km} onChange={v => f("km", v)} step={1} className="w-full" large /></div>
          </div>
        )}
        <div className="bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-600">
          Ergebnis: <span className="font-semibold tabular-nums">{ergebnis.toFixed(2)} €</span>
        </div>
        <div>
          <label className={`text-xs ${!draft.beschreibung.trim() ? "text-[#b11217]" : "text-gray-400"}`}>
            Kursbezeichnung / Reiseziel{!draft.beschreibung.trim() && <span className="ml-0.5">*</span>}
          </label>
          <BeschreibungInput value={draft.beschreibung} onChange={v => f("beschreibung", v)} large />
        </div>
      </div>
      <div className="px-4 py-4 border-t border-gray-100 flex gap-3">
        <button onClick={onDelete} className="px-4 py-2.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">Löschen</button>
        <button onClick={() => { onSave(draft); onClose(); }} className="flex-1 py-2.5 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors font-medium">Speichern</button>
      </div>
    </div>
  );
}
type SharePayload = { abteilung: string; rows: Row[] };

function encodeShare(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  if (typeof btoa !== "undefined") {
    return btoa(encodeURIComponent(json)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return Buffer.from(json).toString("base64url");
}

function decodeShare(s: string): SharePayload | null {
  try {
    const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - s.length % 4) % 4);
    const json = decodeURIComponent(atob(padded));
    return JSON.parse(json) as SharePayload;
  } catch { return null; }
}

function ShareModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    navigator.clipboard.writeText(url).then(() => setCopied(true)).catch(() => {});
  }, [url]);
  function copy() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-800">Formular teilen</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Schließen">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="15" y2="15"/><line x1="15" y1="3" x2="3" y2="15"/>
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500">Enthält Abteilung und Tätigkeitsnachweise — keine persönlichen Daten.</p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <span className="flex-1 text-xs text-gray-700 break-all font-mono">{url}</span>
        </div>
        <button onClick={copy}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${copied ? "bg-green-600 text-white" : "bg-[#b11217] text-white hover:bg-[#8f0f13]"}`}>
          {copied ? "✓ Kopiert" : "Link kopieren"}
        </button>
      </div>
    </div>
  );
}



export default function Aufwandsformular({ config }: { config: AufwandsformularConfig }) {
  const { storageKey, title, filename, showKm = true, showStunden = true, showSteuererklärung = true, showVerzicht = true, enforceMaxAufwand = false, showKategorie = false } = config;
  const [state, setState] = useState<FormState>(defaultState);
  const [showSignModal, setShowSignModal] = useState(false);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [flashingRowId, setFlashingRowId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sharedSignature, setSharedSignature] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [pendingShare, setPendingShare] = useState<SharePayload | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect ?pdf=1 and activate pdf-capture mode
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('pdf') === '1') {
        document.body.classList.add('pdf-capture');
      }
    }

    try {
      const addr = loadSharedAddress();
      const raw = localStorage.getItem(storageKey);
      const saved = raw ? JSON.parse(raw) as FormState : null;
      setState(s => ({
        ...s,
        ...(saved ?? {}),
        // personal fields always come from shared store
        nachname: addr.nachname, vorname: addr.vorname, strasse: addr.strasse,
        plzOrt: addr.plzOrt, geburtsdatum: addr.geburtsdatum, telefon: addr.telefon, email: addr.email,
        // overrideDate comes from saved state (persistent)
        overrideDate: saved?.overrideDate ?? null,
      }));
      // Load shared signature — fall back to scanning other form stores
      let sig = loadSharedSignature();
      if (!sig) {
        const otherKeys = ["uebungsleiterpauschale_v1", "reisekosten_v1", "ehrenamtspauschale_verzicht_v1"];
        for (const k of otherKeys) {
          if (k === storageKey) continue;
          try {
            const r = localStorage.getItem(k);
            if (r) { const p = JSON.parse(r); if (p?.signature) { sig = p.signature; break; } }
          } catch {}
        }
        // Also check current form
        if (!sig && saved?.signature) sig = saved.signature;
        if (sig) saveSharedSignature(sig);
      }
      setSharedSignature(sig);
    } catch {}
    setHydrated(true);
  }, [storageKey]);

  // Detect ?s= share param
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s");
    if (!s) return;
    const payload = decodeShare(s);
    if (!payload) return;
    // Remove param from URL without reload
    params.delete("s");
    const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
    window.history.replaceState({}, "", newUrl);
    // Check if form has meaningful data
    const hasData = state.rows.some(r => r.datum || r.beschreibung.trim()) || !!state.abteilung;
    if (hasData) {
      setPendingShare(payload);
    } else {
      setState(s => ({ ...s, abteilung: payload.abteilung, rows: payload.rows, nextId: Math.max(...payload.rows.map(r => r.id), 0) + 1 }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== SHARED_ADDRESS_KEY || !e.newValue) return;
      try {
        const a = JSON.parse(e.newValue);
        setState(s => ({ ...s, nachname: a.nachname || "", vorname: a.vorname || "", strasse: a.strasse || "", plzOrt: a.plzOrt || "", geburtsdatum: a.geburtsdatum || "", telefon: a.telefon || "", email: a.email || "" }));
      } catch {}
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify(state));
    saveSharedAddress({ nachname: state.nachname, vorname: state.vorname, strasse: state.strasse, plzOrt: state.plzOrt, geburtsdatum: state.geburtsdatum, telefon: state.telefon, email: state.email });
  }, [state, hydrated, storageKey]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value })), []);

  // Pre-fill Steuererklärung when aufwandsspende changes
  useEffect(() => {
    if (!hydrated) return;
    const spende = parseFloat(state.aufwandsspende) || 0;
    if (spende <= 0) return;
    const maxSpende = getMaxSpendenBetrag(state.monatVon || null);
    if (spende >= maxSpende) {
      setState(s => ({ ...s, steuerVollHoehe: true, steuerBisZu: false, steuerNicht: false }));
    } else {
      setState(s => ({ ...s, steuerVollHoehe: false, steuerBisZu: true, steuerNicht: false, steuerBisZuBetrag: spende.toFixed(2) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.aufwandsspende, hydrated]);

  // Auto-deselect payment when auszahlbetrag is 0 (full donation)
  useEffect(() => {
    if (!hydrated) return;
    const a = state.rows.reduce((sum, r) => sum + calcRow(r), 0);
    const s = parseFloat(state.aufwandsspende) || 0;
    if (Math.max(0, a - s) === 0 && s > 0) {
      if (state.zahlungBar || state.zahlungUeberweisung) {
        setState(prev => ({ ...prev, zahlungBar: false, zahlungUeberweisung: false }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.aufwandsspende, state.rows, hydrated]);

  // Auto-derive monat from row dates
  useEffect(() => {
    if (!hydrated) return;
    const months = state.rows.map(r => r.datum ? r.datum.slice(0, 7) : "").filter(Boolean).sort();
    if (months.length === 0) return;
    const von = months[0];
    const bis = months[months.length - 1];
    if (von !== state.monatVon || bis !== state.monatBis) setState(s => ({ ...s, monatVon: von, monatBis: bis }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rows, hydrated]);

  const updateRow = useCallback((id: number, key: keyof Row, value: string) =>
    setState((s) => ({ ...s, rows: s.rows.map((r) => r.id === id ? { ...r, [key]: value } : r) })), []);

  const addRow = useCallback(() =>
    setState((s) => {
      const last = s.rows[s.rows.length - 1];
      let newDatum = last?.datum ?? "";
      if (newDatum) {
        const d = new Date(newDatum);
        d.setDate(d.getDate() + 1);
        newDatum = d.toISOString().slice(0, 10);
      }
      const newId = s.nextId;
      setTimeout(() => {
        setFlashingRowId(newId);
        setTimeout(() => setFlashingRowId(null), 1600);
      }, 0);
      return { ...s, rows: [...s.rows, { id: newId, datum: newDatum, von: last?.von || "00:00", bis: last?.bis || "00:00", satz: last?.satz ?? "15", km: last?.km ?? "", beschreibung: last?.beschreibung ?? "" }], nextId: newId + 1 };
    }), []);

  const removeRow = useCallback((id: number) =>
    setState((s) => ({ ...s, rows: s.rows.filter((r) => r.id !== id) })), []);

  const duplicateRow = useCallback((id: number) => {
    setState((s) => {
      const row = s.rows.find(r => r.id === id);
      if (!row) return s;
      let newDatum = row.datum;
      if (row.datum) {
        const d = new Date(row.datum);
        d.setDate(d.getDate() + 7);
        newDatum = d.toISOString().slice(0, 10);
      }
      const newId = s.nextId;
      setTimeout(() => {
        setFlashingRowId(newId);
        setTimeout(() => setFlashingRowId(null), 1600);
      }, 0);
      return { ...s, rows: [...s.rows, { ...row, id: newId, datum: newDatum }], nextId: newId + 1 };
    });
  }, []);

  if (!hydrated) return null;

  const sortedRows = [...state.rows].sort((a, b) => {
    const key = (r: Row) => `${r.datum}T${r.von || "00:00"}`;
    return key(a).localeCompare(key(b));
  });

  const duplicateIds = new Set<number>();
  const seen = new Map<string, number>();
  for (const r of sortedRows) {
    const key = `${r.datum}|${r.von}|${r.bis}`;
    if (seen.has(key)) {
      duplicateIds.add(r.id);
      duplicateIds.add(seen.get(key)!);
    } else {
      seen.set(key, r.id);
    }
  }

  const aufwand = state.rows.reduce((sum, r) => sum + calcRow(r), 0);
  const maxAufwand = getMaxSpendenBetrag(state.monatVon || null);
  const aufwandExceeded = enforceMaxAufwand && aufwand > maxAufwand;
  const spende = parseFloat(state.aufwandsspende) || 0;
  const endbetrag = aufwand - spende;
  const auszahlbetrag = Math.max(0, endbetrag);
  const spendeGekuerzt = spende > aufwand;
  const inputCls = "w-full bg-transparent border-b border-gray-300 px-1 py-1 text-xs focus:outline-none focus:border-blue-400";

  const colsBefore = 1 + (showStunden ? 4 : 0) + (showKm ? 1 : 0);
  const allChecks: { label: string; valid: boolean }[] = [
    { label: "Nachname", valid: !!state.nachname },
    { label: "Vorname", valid: !!state.vorname },
    { label: "Straße", valid: !!state.strasse },
    { label: "PLZ / Ort", valid: !!state.plzOrt },
    { label: "Geburtsdatum", valid: !!state.geburtsdatum },
    { label: "Telefon", valid: !!state.telefon },
    { label: "E-Mail", valid: !!state.email },
    { label: "Abteilung", valid: !!state.abteilung },
    { label: "Auszahlbetrag oder Spende > 0", valid: auszahlbetrag > 0 || spende > 0 },
    ...(enforceMaxAufwand ? [{ label: `Aufwandsentschädigung ≤ ${maxAufwand.toLocaleString("de-DE")} €`, valid: !aufwandExceeded }] : []),
    ...(auszahlbetrag > 0 ? [
      { label: "Zahlungsart", valid: state.zahlungBar || state.zahlungUeberweisung },
      ...(state.zahlungUeberweisung ? [{ label: "IBAN", valid: validateIban(state.iban) }] : []),
    ] : []),
    ...(showSteuererklärung ? [{ label: "Steuererklärung", valid: state.steuerVollHoehe || state.steuerBisZu || state.steuerNicht }] : []),
    { label: "Tätigkeitsnachweis (mind. 1 vollständige Zeile)", valid: state.rows.some(r => r.datum && r.beschreibung.trim() && calcRow(r) > 0) },
    ...(state.rows.some(r => r.datum && !r.beschreibung.trim()) ? [{ label: "Bezeichnung in Tätigkeitsnachweis", valid: false }] : []),
    ...(state.rows.some(r => !r.datum && r.beschreibung.trim()) ? [{ label: "Datum in Tätigkeitsnachweis", valid: false }] : []),
  ];
  const missing = allChecks.filter(c => !c.valid);
  const isComplete = missing.length === 0;

  const city = state.plzOrt.replace(/^[\d\s]+/, "").replace(/[^a-zA-ZäöüÄÖÜß\s-]/g, "").trim() || "_______________";
  const today = new Date().toLocaleDateString("de-DE");
  const defaultDate = [city, today].filter(s => s !== "_______________" && s !== "").join(", ");

  const handleDownload = async () => {
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const iframeUrl = `${window.location.pathname}?pdf=1`;
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:1050px;height:1px;border:0";
      document.body.appendChild(iframe);
      await new Promise<void>((resolve) => { iframe.onload = () => resolve(); iframe.src = iframeUrl; });

      // Wait longer for content to stabilize, especially for multi-page forms
      await new Promise(r => setTimeout(r, showVerzicht && spende > 0 ? 2000 : 1500));

      const iframeDoc = iframe.contentDocument!;
      const iframeBody = iframeDoc.body;

      // Ensure pdf-capture class is applied
      iframeDoc.documentElement.classList.add('pdf-capture');

      // Wait for all images to load
      await Promise.all(Array.from(iframeDoc.images).map(img =>
        img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
      ));

      // Force layout recalculation
      iframe.style.height = iframeBody.scrollHeight + "px";
      await new Promise(r => setTimeout(r, 300));

      const fullCanvas = await html2canvas(iframeBody, {
        scale: 3, useCORS: true, logging: false, backgroundColor: '#ffffff',
        width: 1050, height: iframeBody.scrollHeight,
        windowWidth: 1050, windowHeight: iframeBody.scrollHeight,
      });

      // Find break markers more reliably - try multiple selectors
      let breakMarkers = Array.from(iframeBody.querySelectorAll('[data-page-break="verzicht"]'));
      if (breakMarkers.length === 0) {
        breakMarkers = Array.from(iframeBody.querySelectorAll(".print\\:break-before-page"));
      }

      const breakMarkersPx = breakMarkers
        .map(el => {
          const element = el as HTMLElement;
          const offsetTop = element.offsetTop;
          return offsetTop * 3; // *3 for html2canvas scale
        })
        .filter(y => y > 0); // Filter out invalid positions

      const canvases: HTMLCanvasElement[] = [];
      const filenames: string[] = [];

      const mainFilename = buildPdfFilename(title, state.vorname, state.nachname);

      if (showVerzicht && spende > 0 && breakMarkersPx.length > 0) {
        const breakY = breakMarkersPx[0];

        // More lenient break position validation
        const minBreakPosition = fullCanvas.height * 0.15; // At least 15% down
        const maxBreakPosition = fullCanvas.height * 0.95; // At most 95% down

        if (breakY > minBreakPosition && breakY < maxBreakPosition) {
          // Canvas for first PDF (Main form)
          const canvas1 = document.createElement("canvas");
          canvas1.width = fullCanvas.width;
          canvas1.height = Math.floor(breakY);
          const ctx1 = canvas1.getContext("2d");
          if (ctx1) {
            ctx1.fillStyle = "#ffffff";
            ctx1.fillRect(0, 0, canvas1.width, canvas1.height);
            ctx1.drawImage(fullCanvas, 0, 0, fullCanvas.width, breakY, 0, 0, fullCanvas.width, breakY);
          }
          canvases.push(canvas1);
          filenames.push(mainFilename);

          // Canvas for second PDF (Verzichtserklärung)
          const remainingHeight = fullCanvas.height - breakY;
          const canvas2 = document.createElement("canvas");
          canvas2.width = fullCanvas.width;
          canvas2.height = Math.floor(remainingHeight);
          const ctx2 = canvas2.getContext("2d");
          if (ctx2) {
            ctx2.fillStyle = "#ffffff";
            ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
            ctx2.drawImage(fullCanvas, 0, breakY, fullCanvas.width, remainingHeight, 0, 0, fullCanvas.width, remainingHeight);
          }
          canvases.push(canvas2);
          // Build proper verzicht filename
          const verzichtFilename = buildPdfFilename("verzichtserklarung", state.vorname, state.nachname);
          filenames.push(verzichtFilename);
        } else {
          canvases.push(fullCanvas);
          filenames.push(mainFilename);
        }
      } else {
        canvases.push(fullCanvas);
        filenames.push(mainFilename);
      }

      document.body.removeChild(iframe);

      for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        const currentFilename = filenames[i];

        if (canvas.height < 100) continue;

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const usableW = pageW - margin * 2;
        const usableH = pageH - margin * 2;
        const imgH = (canvas.height * usableW) / canvas.width;

        let currentY = 0;
        let firstPage = true;

        while (currentY < imgH) {
          const sliceH = Math.min(imgH - currentY, usableH);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = (sliceH * canvas.width) / usableW;
          const srcY = (currentY * canvas.width) / usableW;
          const sliceCtx = sliceCanvas.getContext("2d");
          if (sliceCtx) {
            sliceCtx.fillStyle = "#ffffff";
            sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            sliceCtx.drawImage(canvas, 0, srcY, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
          }
          if (!firstPage) pdf.addPage();
          pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.85), "JPEG", margin, margin, usableW, sliceH);
          currentY += sliceH;
          firstPage = false;
        }
        pdf.save(currentFilename);
        if (i < canvases.length - 1) await new Promise(r => setTimeout(r, 500));
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <div className="reisekosten-form px-1" ref={contentRef}>

      {/* PDF-only page header (hidden on screen, shown in pdf-capture) */}
      <div className="pdf-only hidden items-center gap-3 mb-4 pb-3 border-b-2 border-gray-300">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tgv-logo.png" alt="TGV Logo" width={44} height={44} />
        <div className="flex-1">
          <div className="font-bold text-base text-gray-900">TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.V.</div>
          <div className="text-xs text-gray-500">{title} &ndash; {formatMonthRange(state.monatVon, state.monatBis)}{state.abteilung ? ` · ${state.abteilung}` : ""} &middot; {state.vorname} {state.nachname}</div>
        </div>
        {(() => {
          const abt = ABTEILUNGEN.find(a => a.name === state.abteilung);
          return abt ? <AbteilungIcon slug={abt.slug} print size={36} /> : null;
        })()}
      </div>

      {/* Page headline */}
      <div className="flex items-center justify-between mb-3 print:hidden">
        <h1 className="text-2xl font-bold text-[#b11217]">{title}</h1>
        <div className="hidden md:flex items-center gap-2">
          <DownloadButtonBase filename={buildPdfFilename(title, state.vorname, state.nachname)} disabled={!isComplete} missingCount={missing.length} checks={allChecks} side="bottom" count={showVerzicht && spende > 0 ? 2 : 1} onDownload={handleDownload} />
        </div>
      </div>

      {/* ── Header ── */}
      <FormHeader
        title={title}
        contextFields={[
           {
             label: "Abteilung",
             printValue: state.abteilung,
             value: state.abteilung,
             required: true,
             content: (
               <AbteilungSelect value={state.abteilung} onChange={v => set("abteilung", v)} />
             ),
           },
           ...(showKategorie && state.abteilung ? [{
             label: "Kategorie",
             printValue: state.uebungsleiterKategorie,
             value: state.uebungsleiterKategorie || "Jugend",
             required: true,
             content: (
               <UEbungsleiterCategorySelect value={state.uebungsleiterKategorie || "Jugend"} onChange={v => set("uebungsleiterKategorie", v)} />
             ),
           }] : []),
          {
            label: "Zeitraum",
            printValue: formatMonthRange(state.monatVon, state.monatBis),
            value: state.monatVon,
            content: (
              <span className="text-sm">
                {state.monatVon
                  ? <span className="text-gray-700">{formatMonthRange(state.monatVon, state.monatBis)}</span>
                  : <span className="text-gray-400 italic text-xs">wird aus Tätigkeiten abgeleitet</span>
                }
              </span>
            ),
          },
        ]}
        personalFields={[
          { label: "Nachname", key: "nachname", value: state.nachname, onChange: v => set("nachname", v), required: true },
          { label: "Vorname", key: "vorname", value: state.vorname, onChange: v => set("vorname", v), required: true },
          { label: "Straße", key: "strasse", value: state.strasse, onChange: v => set("strasse", v), required: true },
          { label: "PLZ / Ort", key: "plzOrt", value: state.plzOrt, onChange: v => set("plzOrt", v), required: true },
          { label: "Geburtsdatum", key: "geburtsdatum", type: "date", value: state.geburtsdatum, onChange: v => set("geburtsdatum", v), required: true },
          { label: "Telefon", key: "telefon", type: "tel", value: state.telefon, onChange: v => set("telefon", v), required: true },
          { label: "E-Mail", key: "email", type: "email", value: state.email, onChange: v => set("email", v), required: true },
        ]}
      />

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase flex items-center justify-between rounded-t-xl">
          <span>Tätigkeitsnachweis</span>
          <button onClick={addRow} className="md:hidden flex items-center justify-center w-6 h-6 rounded bg-white/20 hover:bg-white/30 transition-colors" aria-label="Zeile hinzufügen">
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/></svg>
          </button>
        </div>

        {/* Mobile: tap-to-edit cards */}
        <div className="md:hidden print:hidden divide-y divide-gray-100">
          {sortedRows.map((row) => (
            <button key={row.id} onClick={() => setEditingRowId(row.id)}
              className={`w-full text-left px-4 py-3 transition-colors ${duplicateIds.has(row.id) ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}`}>
              <div className="flex justify-between items-start">
                <div className="text-sm font-medium text-gray-800">
                  {row.datum || <span className="text-gray-300">Kein Datum</span>}
                  {showStunden && (row.von || row.bis) && <span className="text-gray-400 font-normal ml-2 text-xs">{row.von}–{row.bis}</span>}
                </div>
                <div className="text-sm font-semibold text-[#b11217] tabular-nums ml-4 shrink-0">{calcRow(row).toFixed(2)} €</div>
              </div>
              <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                {showStunden && (row.von || row.bis) && <span>{calcStunden(row.von, row.bis).toFixed(2)} Std.</span>}
                {showKm && row.km && <span>{row.km} km</span>}
                {row.beschreibung && <span className="truncate">{row.beschreibung}</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Desktop: full table (also used for print) */}
        <div className="hidden md:block print:block overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: 700 }}>
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 text-center">
                <th className="border-r border-gray-200 px-2 py-2 text-left">Datum</th>
                {showStunden && <th className="border-r border-gray-200 px-2 py-2">von</th>}
                {showStunden && <th className="border-r border-gray-200 px-2 py-2">bis</th>}
                {showStunden && <th className="border-r border-gray-200 px-2 py-2 whitespace-nowrap">Aufwand Std.</th>}
                {showStunden && <th className="border-r border-gray-200 px-2 py-2">€/Std.</th>}
                {showKm && <th className="border-r border-gray-200 px-2 py-2 w-48">km</th>}
                <th className="border-r border-gray-200 px-2 py-2 whitespace-nowrap w-48 text-right">Ergebnis</th>
                <th className="border-r border-gray-200 px-2 py-2 text-left">Kursbezeichnung / Reiseziel</th>
                <th className="px-2 py-2 print:hidden w-8"></th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.id} className={`pdf-row border-b border-gray-100 ${duplicateIds.has(row.id) ? "row-duplicate" : "hover:bg-blue-50"} ${flashingRowId === row.id ? "row-flash" : ""}`}>
                  <td className="border-r border-gray-100 px-2 py-1.5 w-48 text-center">
                    <PI value={row.datum}><DateSelect value={row.datum} onChange={v => updateRow(row.id, "datum", v)} className="w-24" /></PI>
                  </td>
                  {showStunden && (
                    <td className="border-r border-gray-100 px-1 py-1.5 text-center">
                      <PI value={row.von}><TimeSelect value={row.von} onChange={v => {
                        const [oh, om] = row.von.split(":").map(Number);
                        const [bh, bm] = row.bis.split(":").map(Number);
                        const diff = row.bis !== "00:00" || row.von !== "00:00" ? (bh * 60 + bm) - (oh * 60 + om) : 60;
                        const [nh, nm] = v.split(":").map(Number);
                        const nb = Math.max(0, Math.min(nh * 60 + nm + diff, 23 * 60 + 59));
                        updateRow(row.id, "von", v);
                        updateRow(row.id, "bis", `${String(Math.floor(nb / 60)).padStart(2, "0")}:${String(nb % 60).padStart(2, "0")}`);
                      }} /></PI>
                    </td>
                  )}
                  {showStunden && (
                    <td className="border-r border-gray-100 px-1 py-1.5 text-center">
                      <PI value={row.bis}><TimeSelect value={row.bis} onChange={v => updateRow(row.id, "bis", v)} /></PI>
                    </td>
                  )}
                  {showStunden && (
                    <td className="border-r border-gray-100 px-2 py-1.5 text-center tabular-nums">{calcStunden(row.von, row.bis).toFixed(2)}</td>
                  )}
                  {showStunden && (
                    <td className="border-r border-gray-100 px-1 py-1.5 text-center">
                      <PI value={row.satz}><NumberInput value={row.satz} onChange={v => updateRow(row.id, "satz", v)} step={0.5} /></PI>
                    </td>
                  )}
                  {showKm && (
                    <td className="border-r border-gray-100 px-1 py-1.5 text-center w-48">
                      <PI value={row.km}><NumberInput value={row.km} onChange={v => updateRow(row.id, "km", v)} step={1} /></PI>
                    </td>
                  )}
                  <td className="border-r border-gray-100 px-2 py-1.5 text-right font-semibold tabular-nums whitespace-nowrap w-48">{calcRow(row).toFixed(2)} €</td>
                  <td className="border-r border-gray-100 px-1 py-1.5 text-left">
                    <PI value={row.beschreibung}><BeschreibungInput value={row.beschreibung} onChange={v => updateRow(row.id, "beschreibung", v)} /></PI>
                  </td>
                  <td className="px-1 py-1.5 print:hidden">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => duplicateRow(row.id)}
                        className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 text-gray-500 hover:bg-green-50 hover:border-green-400 hover:text-green-600 transition-colors" aria-label="Zeile duplizieren">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="6" height="6" rx="1"/><path d="M3 3V2a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H7"/>
                        </svg>
                      </button>
                      <button onClick={() => removeRow(row.id)} disabled={state.rows.length === 1}
                        className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 text-gray-800 hover:bg-gray-100 disabled:opacity-20 transition-colors" aria-label="Zeile entfernen">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tbody className="print:hidden">
              <tr>
                <td colSpan={colsBefore + 3} className="py-2 text-center">
                  <button onClick={addRow}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs text-[#b11217] border border-[#b11217] rounded-lg hover:bg-[#b11217] hover:text-white transition-colors"
                    aria-label="Zeile hinzufügen">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/></svg>
                    Zeile hinzufügen
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td colSpan={colsBefore} className="px-3 py-2 font-bold">Aufwandsentsch&auml;digung</td>
                <td className={`px-2 py-2 text-right font-bold tabular-nums border-l border-gray-200 whitespace-nowrap ${aufwandExceeded ? "text-[#b11217]" : ""}`}>{aufwand.toFixed(2)} &euro;</td>
                <td colSpan={2} className="print:hidden" />
              </tr>
              {aufwandExceeded && (
                <tr>
                  <td colSpan={colsBefore + 1} className="px-3 py-1 text-xs text-[#b11217] italic">
                    Aufwandsentschädigung übersteigt den Freibetrag von {maxAufwand.toLocaleString("de-DE")} €
                  </td>
                  <td colSpan={2} className="print:hidden" />
                </tr>
              )}
              <tr className="bg-gray-50">
                <td colSpan={colsBefore} className="px-3 py-1 pb-3">
                  <span className={`font-bold ${spende === 0 ? "text-[#b11217]" : "text-gray-800"}`}>abz&uuml;glich Aufwandsspende</span>
                  <span className="ml-1.5 text-[10px] text-gray-400 font-normal">Betrag, den Sie dem Verein spenden</span>
                </td>
                <td className="px-2 py-1 pb-3 border-l border-gray-200">
                  <div className="flex items-center justify-end gap-1">
                    {spende > 0 && <span className="text-[#b11217] font-bold text-base leading-none print:hidden">−</span>}
                    <input type="number" min="0" step="0.01" value={state.aufwandsspende} onChange={(e) => set("aufwandsspende", e.target.value)} placeholder="0.00"
                      className={`w-full text-right text-xs bg-transparent border-b focus:outline-none focus:border-blue-400 print:hidden ${spende === 0 ? "border-[#b11217] text-[#b11217]" : "border-[#b11217] text-[#b11217]"}`} />
                    {spende > 0 && <span className="text-[#b11217] text-xs font-semibold print:hidden">€</span>}
                  </div>
                  <span className={`hidden print:block text-right text-xs tabular-nums font-semibold ${spende > 0 ? "text-[#b11217]" : "text-gray-900"}`}>
                    {spende > 0 ? `− ${spende.toFixed(2)} €` : "0.00 €"}
                  </span>
                </td>
                <td colSpan={2} className="px-1 py-1 print:hidden">
                  <button type="button" onClick={() => set("aufwandsspende", Math.min(aufwand, getMaxSpendenBetrag(state.monatVon || null)).toFixed(2))}
                    title={`Aufwandsspende auf aktuellen Betrag setzen (max. ${getMaxSpendenBetrag(state.monatVon || null).toLocaleString("de-DE")} €)`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-700 border border-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors whitespace-nowrap">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/></svg>
                    Aufwand spenden
                  </button>
                </td>
              </tr>
              {spendeGekuerzt && (
                <tr>
                  <td colSpan={colsBefore + 1} className="px-3 py-1 text-xs text-amber-600 italic">
                    Aufwandsspende wird automatisch auf den gebuchten Betrag reduziert
                  </td>
                  <td colSpan={2} className="print:hidden" />
                </tr>
              )}
              <tr className="bg-gray-100 border-t border-gray-300">
                <td colSpan={colsBefore} className="px-3 py-2 font-bold text-sm">Auszahlbetrag</td>
                <td className={`px-2 py-2 text-right font-bold text-sm tabular-nums border-l border-gray-200 whitespace-nowrap ${auszahlbetrag > 0 ? "text-green-600" : ""}`}>{auszahlbetrag.toFixed(2)} &euro;</td>
                <td colSpan={2} className="print:hidden" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile totals */}
        <div className="md:hidden print:hidden border-t border-gray-200 px-4 py-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Aufwandsentschädigung</span>
            <span className={`tabular-nums font-medium ${aufwandExceeded ? "text-[#b11217]" : ""}`}>{aufwand.toFixed(2)} €</span>
          </div>
          {aufwandExceeded && (
            <div className="text-xs text-[#b11217] italic">
              Aufwandsentschädigung übersteigt den Freibetrag von {maxAufwand.toLocaleString("de-DE")} €
            </div>
          )}
          <div>
            <div className="flex justify-between items-center">
              <div>
                <span className={`font-medium ${spende === 0 ? "text-[#b11217]" : "text-gray-600"}`}>abzgl. Aufwandsspende</span>
                <div className="text-[10px] text-gray-400">Betrag, den Sie dem Verein spenden</div>
              </div>
              <div className="flex items-center justify-end gap-1">
                {spende > 0 && <span className="text-[#b11217] font-bold text-base leading-none">−</span>}
                <input type="number" min="0" step="0.01" value={state.aufwandsspende} onChange={(e) => set("aufwandsspende", e.target.value)} placeholder="0.00"
                  className="w-28 text-right bg-transparent border-b border-[#b11217] text-[#b11217] focus:outline-none focus:border-[#b11217] tabular-nums" />
                {spende > 0 && <span className="text-[#b11217] text-sm font-semibold">€</span>}
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button type="button" onClick={() => set("aufwandsspende", Math.min(aufwand, getMaxSpendenBetrag(state.monatVon || null)).toFixed(2))}
                title={`Aufwandsspende auf aktuellen Betrag setzen (max. ${getMaxSpendenBetrag(state.monatVon || null).toLocaleString("de-DE")} €)`}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-700 border border-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors whitespace-nowrap">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/></svg>
                Aufwand spenden
              </button>
            </div>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
            <span>Auszahlbetrag</span>
            <span className={`tabular-nums ${auszahlbetrag > 0 ? "text-green-600" : ""}`}>{auszahlbetrag.toFixed(2)} €</span>
          </div>
          {spendeGekuerzt && (
            <div className="text-xs text-amber-600 italic">
              Aufwandsspende wird automatisch auf den gebuchten Betrag reduziert
            </div>
          )}
        </div>
      </div>

      {/* Row edit modal (mobile) */}
      {editingRowId !== null && (() => {
        const row = state.rows.find(r => r.id === editingRowId);
        if (!row) return null;
        return (
          <RowEditModal
            key={editingRowId}
            row={row}
            showKm={showKm}
            showStunden={showStunden}
            onSave={(updated) => setState(s => ({ ...s, rows: s.rows.map(r => r.id === updated.id ? updated : r) }))}
            onDelete={() => { removeRow(editingRowId); setEditingRowId(null); }}
            onClose={() => setEditingRowId(null)}
          />
        );
      })()}

      {/* ── Legal declaration (Tax part) ── */}
      {showSteuererklärung && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">Steuererklärung</div>
        <div className="p-4 text-sm">
        <p className="mb-3 text-sm text-gray-700 leading-relaxed">
          Hiermit erkl&auml;re ich,{" "}
          <span className="font-medium">{[state.vorname, state.nachname].filter(Boolean).join(" ") || "_______________"}</span>
          {" "}geb. am{" "}
          <span className="font-medium">{formatDateDE(state.geburtsdatum) || "_______________"}</span>
          , dass ich die Steuerbefreiung nach &sect; 3 Nr. 26 EStG im laufenden Kalenderjahr
          bei den Einnahmen aus einer anderen nebenberuflichen, beg&uuml;nstigten T&auml;tigkeit
          (wie z.B. f&uuml;r: Bund, L&auml;nder, Gemeinden, Gemeindeverbände, Industrie- und
          Handelskammern, Rechtsanwaltskammern, Steuerberatungskammern,
          Wirtschaftspr&uuml;ferkammern, &Auml;rztekammern, Universit&auml;ten oder der Tr&auml;ger der
          Sozialversicherung etc.) ...
        </p>
        <div className="space-y-2 mb-3 text-sm text-gray-700">
          {!state.steuerVollHoehe && !state.steuerBisZu && !state.steuerNicht && (
            <p className="text-[#b11217] print:hidden">* Bitte eine Option auswählen</p>
          )}
          <label className="flex items-center gap-2">
            <input type="radio" name="steuer" checked={state.steuerVollHoehe} onChange={() => { set("steuerVollHoehe", true); set("steuerBisZu", false); set("steuerNicht", false); }} className="w-4 h-4 print:hidden" />
            <PrintCheckbox checked={state.steuerVollHoehe} />
            in voller H&ouml;he ({state.monatVon >= "2026" ? "3.300,00" : "3.000,00"} Euro)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="steuer" checked={state.steuerBisZu} onChange={() => { set("steuerVollHoehe", false); set("steuerBisZu", true); set("steuerNicht", false); }} className="w-4 h-4 print:hidden" />
            <PrintCheckbox checked={state.steuerBisZu} />
            <span>bis zu</span>
            <input type="number" value={state.steuerBisZuBetrag} onChange={(e) => set("steuerBisZuBetrag", e.target.value)}
              placeholder="Betrag" className="w-20 border-b border-gray-300 bg-transparent px-1 py-0.5 focus:outline-none focus:border-blue-500 print:hidden" />
            <span className="hidden print:inline">{state.steuerBisZuBetrag}</span>
            <span>Euro</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="steuer" checked={state.steuerNicht} onChange={() => { set("steuerVollHoehe", false); set("steuerBisZu", false); set("steuerNicht", true); }} className="w-4 h-4 print:hidden" />
            <PrintCheckbox checked={state.steuerNicht} />
            nicht in Anspruch genommen habe bzw. in Anspruch nehmen werde.
          </label>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          Jegliche Ver&auml;nderungen in meiner Person oder meinen T&auml;tigkeiten, insbesondere
          die Aufnahme weiterer T&auml;tigkeit werde ich unverz&uuml;glich mitteilen. Mir ist bekannt,
          dass Nachteile des Vereins zu meinen Lasten gehen.
        </p>
        </div>
      </div>
      )}

      {/* ── Payment ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">Auszahlbetrag &amp; Zahlung</div>
        <div className="p-4 text-sm space-y-2">
        {auszahlbetrag === 0 && spende > 0 ? (
          <p className="text-green-700 text-sm font-medium">
            Vielen Dank f&uuml;r Ihre Spende in H&ouml;he von {spende.toFixed(2)}&nbsp;&euro; an den Verein!
          </p>
        ) : (
          <>
        {!state.zahlungBar && !state.zahlungUeberweisung && (
          <p className="text-xs text-[#b11217] print:hidden">* Bitte eine Zahlungsart auswählen</p>
        )}
        <label className="flex items-center gap-2">
          <input type="radio" name="zahlung" checked={state.zahlungBar} onChange={() => { set("zahlungBar", true); set("zahlungUeberweisung", false); }} className="w-4 h-4 print:hidden" />
          <PrintCheckbox checked={state.zahlungBar} />
          Auszahlbetrag bar erhalten
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="zahlung" checked={state.zahlungUeberweisung} onChange={() => { set("zahlungBar", false); set("zahlungUeberweisung", true); }} className="w-4 h-4 print:hidden" />
          <PrintCheckbox checked={state.zahlungUeberweisung} />
          Auszahlbetrag bitte &uuml;berweisen auf nachfolgende Bankverbindung
        </label>
        {state.zahlungUeberweisung && (
          <div className="ml-6">
            <div className="flex items-center gap-2">
              <span className={`shrink-0 text-xs flex items-center gap-0.5 ${!validateIban(state.iban) ? "text-[#b11217]" : "text-gray-500"}`}>
                IBAN:{!validateIban(state.iban) && <span className="leading-none">*</span>}
              </span>
              <PI value={state.iban} className="flex-1 uppercase">
                <input type="text" value={state.iban} onChange={(e) => set("iban", e.target.value.toUpperCase())}
                  placeholder="DE00 0000 0000 0000 0000 00"
                  className={`w-full border-b bg-transparent px-1 py-0.5 text-sm uppercase focus:outline-none transition-colors ${
                    state.iban === "" ? "border-gray-300 focus:border-blue-500"
                    : validateIban(state.iban) ? "border-green-500 text-green-700"
                    : "border-[#b11217] text-[#b11217]"
                  }`} />
              </PI>
              {state.iban !== "" && (
                <span className={`shrink-0 text-xs ${validateIban(state.iban) ? "text-green-600" : "text-[#b11217]"}`}>
                  {validateIban(state.iban) ? "✓" : "✗"}
                </span>
              )}
            </div>
          </div>
        )}
          </>
        )}
        </div>
      </div>

      {/* ── Signature section (always shown) ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
        <div className="p-4 text-sm">
        {/* Row 1: Ort, Datum + Unterschrift Leistungsempfänger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-4 text-xs text-gray-400">
          <div className="flex flex-col">
            <div className="flex-1 border-0 min-h-[3rem] print:min-h-0 flex items-end pb-1 text-gray-700 font-medium">
              <div className="flex-1 flex items-center gap-1 group">
                <input type="text"
                  id="sig-date-input"
                  value={state.overrideDate !== null ? state.overrideDate : defaultDate}
                  onChange={e => set("overrideDate", e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none p-0 m-0 focus:ring-0 print:hidden" />
                <div className="flex items-center gap-0.5 print:hidden">
                  {state.overrideDate !== null && (
                    <button type="button" onClick={() => set("overrideDate", null)}
                      className="p-1 text-gray-300 hover:text-[#b11217] transition-colors" aria-label="Zurücksetzen">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                  <button type="button" onClick={() => document.getElementById("sig-date-input")?.focus()}
                    className="p-1 text-gray-300 hover:text-[#b11217] transition-colors" aria-label="Datum bearbeiten">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  </button>
                </div>
                <span className="hidden print:inline">
                  {state.overrideDate !== null ? state.overrideDate : defaultDate}
                </span>
              </div>
            </div>
            <div className="mt-1 print:mt-0 border-t border-gray-400 pt-1">Ort, Datum</div>
          </div>
          <div className="flex flex-col">
            {state.signature && (
              <div className="text-[7pt] text-green-600 leading-tight mb-1">
                ✓ Einwilligung zur digitalen Unterschrift erteilt
              </div>
            )}
            <div className="flex-1 border-0 min-h-[3rem] print:min-h-0 flex flex-col justify-end">
              {state.signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={state.signature} alt="Unterschrift" onClick={() => setShowSignModal(true)}
                  className="max-h-14 w-auto object-contain cursor-pen hover:opacity-80 transition-opacity print:cursor-default"
                  title="Klicken zum Bearbeiten" />
              ) : (
                <button onClick={() => setShowSignModal(true)}
                  className="mb-1 w-full px-3 py-2 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors print:hidden">
                  Unterschreiben
                </button>
              )}
            </div>
            <div className="mt-1 print:mt-0 border-t border-gray-400 pt-1">Unterschrift Leistungsempf&auml;nger</div>
          </div>
        </div>

        {/* Row 2: Unterschrift 1./2. Vors./Abt.L. (print/PDF only) */}
        <div className="hidden print:grid grid-cols-2 gap-x-8 gap-y-4 text-xs text-gray-400 mt-6">
          <div className="flex flex-col">
            <div className="flex-1 border-0 min-h-[3rem]" />
            <div className="border-t border-gray-400 pt-1">Ort, Datum</div>
          </div>
          <div className="flex flex-col">
            <div className="flex-1 border-0 min-h-[3rem]" />
            <div className="border-t border-gray-400 pt-1">Unterschrift 1./2. Vors./Abt.L.</div>
          </div>
        </div>
        </div>
      </div>

      {showSignModal && (
        <SignatureModal
          existing={state.signature || undefined}
          sharedSignature={sharedSignature || undefined}
          onSave={(dataUrl) => { set("signature", dataUrl); saveSharedSignature(dataUrl); setSharedSignature(dataUrl); setShowSignModal(false); }}
          onDelete={() => set("signature", "")}
          onClose={() => setShowSignModal(false)}
        />
      )}

      {showShareModal && shareUrl && (
        <ShareModal url={shareUrl} onClose={() => setShowShareModal(false)} />
      )}

      {pendingShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="font-semibold text-gray-800">Vorlage übernehmen?</div>
            <p className="text-sm text-gray-600">
              Dein Formular enthält bereits Daten. Soll die geteilte Vorlage (Abteilung + Tätigkeitsnachweise) deine aktuellen Einträge ersetzen?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPendingShare(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Abbrechen
              </button>
              <button onClick={() => {
                setState(s => ({ ...s, abteilung: pendingShare.abteilung, rows: pendingShare.rows, nextId: Math.max(...pendingShare.rows.map(r => r.id), 0) + 1 }));
                setPendingShare(null);
              }}
                className="flex-1 py-2 rounded-lg bg-[#b11217] text-white text-sm font-medium hover:bg-[#8f0f13] transition-colors">
                Übernehmen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pdf-footer hidden print:flex mt-10 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-6 text-[9px] leading-relaxed text-gray-400">
          <div className="space-y-1">
            <p className="font-bold text-gray-600 tracking-wider">KONTAKT</p>
            <p>Albert-Einstein-Str. 20 · 71717 Beilstein</p>
            <p>Tel. +49 (0) 7062 5753</p>
            <p>info@tgveintrachtbeilstein.de</p>
            <p>www.tgveintrachtbeilstein.de</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-gray-600 tracking-wider">VEREINSDATEN</p>
            <p>Steuer-Nr. 65208/49689</p>
            <p>Amtsgericht Stuttgart · VR 101009</p>
            <p>Vorstand: Armin Maurer</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-gray-600 tracking-wider">BANKVERBINDUNG</p>
            <p>Volksbank Beilstein-Ilsfeld-Abstatt eG</p>
            <p className="font-medium text-gray-500">IBAN: DE63 6206 2215 0001 0770 07</p>
            <p>BIC: GENODES1BIA</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-2 print:hidden mt-2 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { localStorage.removeItem(storageKey); setState(defaultState()); }}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs hover:bg-red-100 transition-colors"
          >
            Formular zurücksetzen
          </button>
          <button onClick={() => { const url = `${window.location.origin}${window.location.pathname}?s=${encodeShare({ abteilung: state.abteilung, rows: state.rows })}`; setShareUrl(url); setShowShareModal(true); }}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="2.5" r="1.5"/><circle cx="11" cy="11.5" r="1.5"/><circle cx="3" cy="7" r="1.5"/>
              <line x1="9.6" y1="3.3" x2="4.4" y2="6.1"/><line x1="4.4" y1="7.9" x2="9.6" y2="10.7"/>
            </svg>
            Formular teilen
          </button>
          <button onClick={() => window.print()}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5V1h8v4"/><rect x="1" y="5" width="12" height="6" rx="1"/><path d="M3 11v2h8v-2"/><circle cx="10.5" cy="8" r="0.5" fill="currentColor"/>
            </svg>
            Drucken
          </button>
        </div>
        <DownloadButtonBase filename={buildPdfFilename(title, state.vorname, state.nachname)} disabled={!isComplete} missingCount={missing.length} checks={allChecks} side="top" count={showVerzicht && spende > 0 ? 2 : 1} onDownload={handleDownload} />
      </div>

      {/* Second page for EAP Verzicht if donation is present */}
      {showVerzicht && spende > 0 && (
        <div className="hidden print:block print:break-before-page mt-12 pt-12" data-page-break="verzicht">
          {/* Slicing helper: JS-based PDF capture needs a clean gap or forced page break */}
          <div style={{ height: "60px" }} className="print:hidden" />
          <VerzichtPageContent
            state={{
              ...state,
              jahr: (state.monatVon || state.monatBis || new Date().toISOString()).slice(0, 4),
              betrag: spende.toFixed(2),
              spendenbetrag: spende.toFixed(2),
              signature: state.signature
            }}
            overrideDate={state.overrideDate}
            onOverrideDateChange={v => set("overrideDate", v)}
            onSignClick={() => setShowSignModal(true)}
          />
        </div>
      )}
    </div>
  );
}
