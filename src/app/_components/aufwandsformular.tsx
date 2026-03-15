"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import SignatureModal from "@/app/_components/signature-modal";
import FormHeader from "@/app/_components/form-header";
import { SHARED_ADDRESS_KEY, saveSharedAddress, loadSharedAddress } from "@/lib/sharedAddress";
import { buildPdfFilename } from "@/lib/pdfFilename";
const KM_RATE = 0.3;

const ABTEILUNGEN: { name: string; slug: string }[] = [
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

function AbteilungIcon({ slug, print = false, size = 20 }: { slug: string; print?: boolean; size?: number }) {
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

function AbteilungSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = ABTEILUNGEN.find(a => a.name === value);

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
        <span className="hidden print:block text-sm text-gray-400">–</span>
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
  abteilung: string;
  monat: string;
  iban: string;
  aufwandsspende: string;
  zahlungBar: boolean;
  zahlungUeberweisung: boolean;
  spendenquittung: boolean;
  spendenquittungNummer: string;
  steuerVollHoehe: boolean;
  steuerBisZu: boolean;
  steuerBisZuBetrag: string;
  steuerNicht: boolean;
  signature: string;
  rows: Row[];
  nextId: number;
}

export interface AufwandsformularConfig {
  storageKey: string;
  title: string;
  filename: string;
}

function validateIban(raw: string): boolean {
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
  const [h, m] = value ? value.split(":") : ["", ""];
  const selectCls = `bg-transparent border-b border-gray-300 focus:outline-none focus:border-[#b11217] text-xs ${className ?? ""}`;
  return (
    <span className="inline-flex items-center gap-0.5">
      <select value={h} onChange={e => onChange(`${e.target.value}:${m || "00"}`)} className={selectCls} style={{ width: 40 }}>
        <option value="">--</option>
        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
      <span className="text-gray-400">:</span>
      <select value={m} onChange={e => onChange(`${h || "00"}:${e.target.value}`)} className={selectCls} style={{ width: 36 }}>
        <option value="">--</option>
        {MINUTES.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </span>
  );
}

function emptyRow(id: number): Row {
  return { id, datum: "", von: "00:00", bis: "00:00", satz: "15", km: "", beschreibung: "" };
}

function defaultState(): FormState {
  return {
    nachname: "", vorname: "", strasse: "", plzOrt: "",
    geburtsdatum: "", telefon: "", abteilung: "", monat: currentMonth(),
    iban: "", aufwandsspende: "",
    zahlungBar: false, zahlungUeberweisung: false,
    spendenquittung: false, spendenquittungNummer: "",
    steuerVollHoehe: false, steuerBisZu: false, steuerBisZuBetrag: "", steuerNicht: false,
    signature: "",
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

function RowEditModal({ row, onSave, onDelete, onClose }: {
  row: Row; onSave: (r: Row) => void; onDelete: () => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState<Row>({ ...row });
  const f = <K extends keyof Row>(k: K, v: Row[K]) => setDraft(d => ({ ...d, [k]: v }));
  const stunden = calcStunden(draft.von, draft.bis);
  const ergebnis = stunden * (parseFloat(draft.satz) || 0) + (parseFloat(draft.km) || 0) * KM_RATE;
  const fieldCls = "w-full border-b border-gray-300 bg-transparent py-2 text-base focus:outline-none focus:border-[#b11217]";

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
          <input type="date" value={draft.datum} onChange={e => f("datum", e.target.value)} className={fieldCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400">von</label>
            <div className="py-2 border-b border-gray-300"><TimeSelect value={draft.von} onChange={v => f("von", v)} className="text-base" /></div>
          </div>
          <div>
            <label className="text-xs text-gray-400">bis</label>
            <div className="py-2 border-b border-gray-300"><TimeSelect value={draft.bis} onChange={v => f("bis", v)} className="text-base" /></div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-600">
          Aufwand: <span className="font-semibold tabular-nums">{stunden.toFixed(2)} Std.</span>
        </div>
        <div>
          <label className="text-xs text-gray-400">€ / Std.</label>
          <input type="number" value={draft.satz} onChange={e => f("satz", e.target.value)} step="0.5" min="0" className={fieldCls} />
        </div>
        <div>
          <label className="text-xs text-gray-400">km</label>
          <input type="number" value={draft.km} onChange={e => f("km", e.target.value)} step="1" min="0" className={fieldCls} />
        </div>
        <div className="bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-600">
          Ergebnis: <span className="font-semibold tabular-nums">{ergebnis.toFixed(2)} €</span>
        </div>
        <div>
          <label className="text-xs text-gray-400">Kursbezeichnung / Reiseziel</label>
          <input type="text" value={draft.beschreibung} onChange={e => f("beschreibung", e.target.value)} className={fieldCls} />
        </div>
      </div>
      <div className="px-4 py-4 border-t border-gray-100 flex gap-3">
        <button onClick={onDelete} className="px-4 py-2.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">Löschen</button>
        <button onClick={() => { onSave(draft); onClose(); }} className="flex-1 py-2.5 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors font-medium">Speichern</button>
      </div>
    </div>
  );
}
function DownloadButton({ filename, storageKey: _storageKey }: { filename: string; storageKey: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const iframeUrl = `${window.location.pathname}?pdf=1`;
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:1050px;height:1px;border:0;visibility:hidden";
      document.body.appendChild(iframe);
      await new Promise<void>((resolve) => { iframe.onload = () => resolve(); iframe.src = iframeUrl; });
      await new Promise(r => setTimeout(r, 1500));
      const iframeDoc = iframe.contentDocument!;
      const iframeBody = iframeDoc.body;
      await Promise.all(Array.from(iframeDoc.images).map(img =>
        img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
      ));
      iframe.style.height = iframeBody.scrollHeight + "px";
      await new Promise(r => setTimeout(r, 200));
      const canvas = await html2canvas(iframeBody, {
        scale: 1.5, useCORS: true, logging: false, backgroundColor: '#ffffff',
        width: 1050, height: iframeBody.scrollHeight,
        windowWidth: 1050, windowHeight: iframeBody.scrollHeight,
      });
      document.body.removeChild(iframe);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableW = pageW - margin * 2;
      const imgH = (canvas.height * usableW) / canvas.width;
      let remaining = imgH;
      let first = true;
      while (remaining > 0) {
        const sliceH = Math.min(remaining, pageH - margin * 2);
        const srcY = (imgH - remaining) * (canvas.height / imgH);
        const srcH = sliceH * (canvas.height / imgH);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.ceil(srcH);
        sliceCanvas.getContext("2d")!.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        if (!first) pdf.addPage();
        pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.85), "JPEG", margin, margin, usableW, sliceH);
        remaining -= sliceH;
        first = false;
      }
      pdf.save(filename);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors font-medium disabled:opacity-60"
    >
      {loading ? (
        <>
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="7" cy="7" r="5" strokeOpacity="0.3"/>
            <path d="M7 2a5 5 0 015 5" strokeLinecap="round"/>
          </svg>
          Erstelle PDF…
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 1v8M4 6l3 3 3-3"/>
            <path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/>
          </svg>
          PDF herunterladen
        </>
      )}
    </button>
  );
}

export default function Aufwandsformular({ config }: { config: AufwandsformularConfig }) {
  const { storageKey, title, filename } = config;
  const [state, setState] = useState<FormState>(defaultState);
  const [showSignModal, setShowSignModal] = useState(false);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const addr = loadSharedAddress();
      const raw = localStorage.getItem(storageKey);
      const saved = raw ? JSON.parse(raw) as FormState : null;
      setState(s => ({
        ...s,
        ...(saved ?? {}),
        // personal fields always come from shared store
        nachname: addr.nachname, vorname: addr.vorname, strasse: addr.strasse,
        plzOrt: addr.plzOrt, geburtsdatum: addr.geburtsdatum, telefon: addr.telefon,
      }));
    } catch {}
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== SHARED_ADDRESS_KEY || !e.newValue) return;
      try {
        const a = JSON.parse(e.newValue);
        setState(s => ({ ...s, nachname: a.nachname || "", vorname: a.vorname || "", strasse: a.strasse || "", plzOrt: a.plzOrt || "", geburtsdatum: a.geburtsdatum || "", telefon: a.telefon || "" }));
      } catch {}
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify(state));
    saveSharedAddress({ nachname: state.nachname, vorname: state.vorname, strasse: state.strasse, plzOrt: state.plzOrt, geburtsdatum: state.geburtsdatum, telefon: state.telefon });
  }, [state, hydrated, storageKey]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value })), []);

  const updateRow = useCallback((id: number, key: keyof Row, value: string) =>
    setState((s) => ({ ...s, rows: s.rows.map((r) => r.id === id ? { ...r, [key]: value } : r) })), []);

  const addRow = useCallback(() =>
    setState((s) => {
      const last = s.rows[s.rows.length - 1];
      return { ...s, rows: [...s.rows, { id: s.nextId, datum: last?.datum ?? "", von: last?.von || "00:00", bis: last?.bis || "00:00", satz: last?.satz ?? "15", km: last?.km ?? "", beschreibung: last?.beschreibung ?? "" }], nextId: s.nextId + 1 };
    }), []);

  const removeRow = useCallback((id: number) =>
    setState((s) => ({ ...s, rows: s.rows.filter((r) => r.id !== id) })), []);

  if (!hydrated) return null;

  const sortedRows = [...state.rows].sort((a, b) => {
    const key = (r: Row) => `${r.datum}T${r.von || "00:00"}`;
    return key(a).localeCompare(key(b));
  });

  const aufwand = state.rows.reduce((sum, r) => sum + calcRow(r), 0);
  const spende = parseFloat(state.aufwandsspende) || 0;
  const endbetrag = aufwand - spende;
  const inputCls = "w-full bg-transparent border-b border-gray-300 px-1 py-1 text-xs focus:outline-none focus:border-blue-400";

  return (
    <div className="reisekosten-form px-1" ref={contentRef}>

      {/* PDF-only page header (hidden on screen, shown in pdf-capture) */}
      <div className="pdf-only hidden items-center gap-3 mb-4 pb-3 border-b-2 border-gray-300">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tgv-logo.png" alt="TGV Logo" width={44} height={44} />
        <div className="flex-1">
          <div className="font-bold text-base text-gray-900">TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.V.</div>
          <div className="text-xs text-gray-500">{title} &ndash; {state.monat}{state.abteilung ? ` · ${state.abteilung}` : ""} &middot; {state.vorname} {state.nachname}</div>
        </div>
        {(() => {
          const abt = ABTEILUNGEN.find(a => a.name === state.abteilung);
          return abt ? <AbteilungIcon slug={abt.slug} print size={36} /> : null;
        })()}
      </div>

      {/* Page headline */}
      <div className="flex items-center justify-between mb-3 print:hidden">
        <h1 className="text-2xl font-bold text-[#b11217]">{title}</h1>
        <DownloadButton filename={buildPdfFilename(title, state.vorname, state.nachname)} storageKey={storageKey} />
      </div>

      {/* ── Header ── */}
      <FormHeader
        title={title}
        contextFields={[
          {
            label: "Abteilung",
            printValue: state.abteilung,
            content: (
              <AbteilungSelect value={state.abteilung} onChange={v => set("abteilung", v)} />
            ),
          },
          {
            label: "Monat",
            printValue: state.monat,
            content: (
              <input type="month" value={state.monat} onChange={(e) => set("monat", e.target.value)}
                className="w-full border-b border-gray-300 bg-transparent py-0.5 text-sm focus:outline-none focus:border-[#b11217]" />
            ),
          },
        ]}
        personalFields={[
          { label: "Nachname", key: "nachname", value: state.nachname, onChange: v => set("nachname", v) },
          { label: "Vorname", key: "vorname", value: state.vorname, onChange: v => set("vorname", v) },
          { label: "Straße", key: "strasse", value: state.strasse, onChange: v => set("strasse", v) },
          { label: "PLZ / Ort", key: "plzOrt", value: state.plzOrt, onChange: v => set("plzOrt", v) },
          { label: "Geburtsdatum", key: "geburtsdatum", type: "date", value: state.geburtsdatum, onChange: v => set("geburtsdatum", v) },
          { label: "Telefon", key: "telefon", type: "tel", value: state.telefon, onChange: v => set("telefon", v) },
        ]}
      />

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase print:hidden flex items-center justify-between">
          <span>Tätigkeitsnachweis</span>
          <button onClick={addRow} className="md:hidden flex items-center justify-center w-6 h-6 rounded bg-white/20 hover:bg-white/30 transition-colors" aria-label="Zeile hinzufügen">
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/></svg>
          </button>
        </div>

        {/* Mobile: tap-to-edit cards */}
        <div className="md:hidden print:hidden divide-y divide-gray-100">
          {sortedRows.map((row) => (
            <button key={row.id} onClick={() => setEditingRowId(row.id)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="text-sm font-medium text-gray-800">
                  {row.datum || <span className="text-gray-300">Kein Datum</span>}
                  {(row.von || row.bis) && <span className="text-gray-400 font-normal ml-2 text-xs">{row.von}–{row.bis}</span>}
                </div>
                <div className="text-sm font-semibold text-[#b11217] tabular-nums ml-4 shrink-0">{calcRow(row).toFixed(2)} €</div>
              </div>
              <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                {(row.von || row.bis) && <span>{calcStunden(row.von, row.bis).toFixed(2)} Std.</span>}
                {row.km && <span>{row.km} km</span>}
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
                <th className="border-r border-gray-200 px-2 py-2">von</th>
                <th className="border-r border-gray-200 px-2 py-2">bis</th>
                <th className="border-r border-gray-200 px-2 py-2 whitespace-nowrap">Aufwand Std.</th>
                <th className="border-r border-gray-200 px-2 py-2">€/Std.</th>
                <th className="border-r border-gray-200 px-2 py-2">km</th>
                <th className="border-r border-gray-200 px-2 py-2 whitespace-nowrap">Ergebnis</th>
                <th className="border-r border-gray-200 px-2 py-2 text-left">Kursbezeichnung / Reiseziel</th>
                <th className="px-2 py-2 print:hidden w-8">
                  <button onClick={addRow} className="flex items-center justify-center w-6 h-6 rounded bg-[#b11217] text-white hover:bg-[#8f0f13] transition-colors" aria-label="Zeile hinzufügen">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/></svg>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.id} className="pdf-row border-b border-gray-100 hover:bg-blue-50">
                  <td className="border-r border-gray-100 px-1 py-1.5">
                    <PI value={row.datum}><input type="date" value={row.datum} onChange={(e) => updateRow(row.id, "datum", e.target.value)} className={inputCls} style={{ width: 110 }} /></PI>
                  </td>
                  <td className="border-r border-gray-100 px-1 py-1.5">
                    <PI value={row.von}><TimeSelect value={row.von} onChange={v => updateRow(row.id, "von", v)} /></PI>
                  </td>
                  <td className="border-r border-gray-100 px-1 py-1.5">
                    <PI value={row.bis}><TimeSelect value={row.bis} onChange={v => updateRow(row.id, "bis", v)} /></PI>
                  </td>
                  <td className="border-r border-gray-100 px-2 py-1.5 text-center tabular-nums">{calcStunden(row.von, row.bis).toFixed(2)}</td>
                  <td className="border-r border-gray-100 px-1 py-1.5">
                    <PI value={row.satz}><input type="number" value={row.satz} onChange={(e) => updateRow(row.id, "satz", e.target.value)} step="0.5" min="0" className={inputCls} style={{ width: 52 }} /></PI>
                  </td>
                  <td className="border-r border-gray-100 px-1 py-1.5">
                    <PI value={row.km}><input type="number" value={row.km} onChange={(e) => updateRow(row.id, "km", e.target.value)} step="1" min="0" className={inputCls} style={{ width: 52 }} /></PI>
                  </td>
                  <td className="border-r border-gray-100 px-2 py-1.5 text-right font-semibold tabular-nums whitespace-nowrap">{calcRow(row).toFixed(2)} €</td>
                  <td className="border-r border-gray-100 px-1 py-1.5">
                    <PI value={row.beschreibung}><input type="text" value={row.beschreibung} onChange={(e) => updateRow(row.id, "beschreibung", e.target.value)} className={inputCls} /></PI>
                  </td>
                  <td className="px-1 py-1.5 print:hidden">
                    <div className="flex items-center justify-center">
                      <button onClick={() => removeRow(row.id)} disabled={state.rows.length === 1}
                        className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 text-gray-800 hover:bg-gray-100 disabled:opacity-20 transition-colors" aria-label="Zeile entfernen">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td colSpan={6} className="px-3 py-2 font-bold">Aufwandsentsch&auml;digung</td>
                <td className="px-2 py-2 text-right font-bold tabular-nums border-l border-gray-200 whitespace-nowrap">{aufwand.toFixed(2)} &euro;</td>
                <td colSpan={2} className="print:hidden" />
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={6} className="px-3 py-1 font-bold">abz&uuml;glich Aufwandsspende</td>
                <td className="px-2 py-1 border-l border-gray-200">
                  <input type="number" min="0" step="0.01" value={state.aufwandsspende} onChange={(e) => set("aufwandsspende", e.target.value)} placeholder="0.00"
                    className="w-full text-right text-xs bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-400 print:hidden" />
                  <span className="hidden print:block text-right text-xs tabular-nums">{spende.toFixed(2)} &euro;</span>
                </td>
                <td colSpan={2} className="print:hidden" />
              </tr>
              <tr className="bg-gray-100 border-t border-gray-300">
                <td colSpan={6} className="px-3 py-2 font-bold text-sm">Endbetrag</td>
                <td className="px-2 py-2 text-right font-bold text-sm tabular-nums border-l border-gray-200 whitespace-nowrap">{endbetrag.toFixed(2)} &euro;</td>
                <td colSpan={2} className="print:hidden" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile totals */}
        <div className="md:hidden print:hidden border-t border-gray-200 px-4 py-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Aufwandsentschädigung</span>
            <span className="tabular-nums font-medium">{aufwand.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>abzgl. Aufwandsspende</span>
            <input type="number" min="0" step="0.01" value={state.aufwandsspende} onChange={(e) => set("aufwandsspende", e.target.value)} placeholder="0.00"
              className="w-24 text-right bg-transparent border-b border-gray-300 focus:outline-none focus:border-[#b11217] tabular-nums" />
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
            <span>Endbetrag</span>
            <span className="tabular-nums">{endbetrag.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Row edit modal (mobile) */}
      {editingRowId !== null && (() => {
        const row = state.rows.find(r => r.id === editingRowId);
        if (!row) return null;
        return (
          <RowEditModal
            row={row}
            onSave={(updated) => setState(s => ({ ...s, rows: s.rows.map(r => r.id === updated.id ? updated : r) }))}
            onDelete={() => { removeRow(editingRowId); setEditingRowId(null); }}
            onClose={() => setEditingRowId(null)}
          />
        );
      })()}

      {/* ── Payment ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase print:hidden">Endbetrag &amp; Zahlung</div>
        <div className="p-4 text-sm space-y-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={state.zahlungBar} onChange={(e) => set("zahlungBar", e.target.checked)} className="w-4 h-4" />
          Endbetrag bar erhalten
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={state.zahlungUeberweisung} onChange={(e) => set("zahlungUeberweisung", e.target.checked)} className="w-4 h-4" />
          Endbetrag bitte &uuml;berweisen auf nachfolgende Bankverbindung
        </label>
        {state.zahlungUeberweisung && (
          <div className="ml-6 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 shrink-0 text-xs">IBAN:</span>
              <PI value={state.iban} className="flex-1">
                <input type="text" value={state.iban} onChange={(e) => set("iban", e.target.value)}
                  placeholder="DE00 0000 0000 0000 0000 00"
                  className={`w-full border-b bg-transparent px-1 py-0.5 text-sm focus:outline-none ${
                    state.iban === "" ? "border-gray-300 focus:border-blue-500"
                    : validateIban(state.iban) ? "border-green-500 text-green-700"
                    : "border-red-400 text-red-600"
                  }`} />
              </PI>
            </div>
            {state.iban !== "" && !validateIban(state.iban) && <p className="text-xs text-red-500 ml-10">Ung&uuml;ltige IBAN</p>}
            {state.iban !== "" && validateIban(state.iban) && <p className="text-xs text-green-600 ml-10">IBAN g&uuml;ltig</p>}
          </div>
        )}
        <label className="flex items-center gap-2 flex-wrap">
          <input type="checkbox" checked={state.spendenquittung} onChange={(e) => set("spendenquittung", e.target.checked)} className="w-4 h-4" />
          Bitte um Erstellung einer Aufwandsspendenquittung *) &uuml;ber
          {state.spendenquittung && (
            <span className="flex items-center gap-2 ml-1">
              <input type="text" value={state.spendenquittungNummer} onChange={(e) => set("spendenquittungNummer", e.target.value)}
                placeholder="Nummer"
                className="w-28 border-b border-gray-300 bg-transparent px-1 py-0.5 text-sm focus:outline-none focus:border-blue-500" />
              <span className="text-gray-400 text-xs">Spendenquittung erstellt mit Nummer</span>
            </span>
          )}
        </label>
        </div>
      </div>

      {/* ── Legal declaration ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase print:hidden">Steuererklärung</div>
        <div className="p-4 text-sm">
        <p className="mb-3 text-gray-700 text-xs leading-relaxed">
          Hiermit erkl&auml;re ich,{" "}
          <span className="font-medium">{[state.vorname, state.nachname].filter(Boolean).join(" ") || "_______________"}</span>
          {" "}geb. am{" "}
          <span className="font-medium">{state.geburtsdatum || "_______________"}</span>
          , dass ich die Steuerbefreiung nach &sect; 3 Nr. 26 EStG im laufenden Kalenderjahr
          bei den Einnahmen aus einer anderen nebenberuflichen, beg&uuml;nstigten T&auml;tigkeit
          (wie z.B. f&uuml;r: Bund, L&auml;nder, Gemeinden, Gemeindeverbände, Industrie- und
          Handelskammern, Rechtsanwaltskammern, Steuerberatungskammern,
          Wirtschaftspr&uuml;ferkammern, &Auml;rztekammern, Universit&auml;ten oder der Tr&auml;ger der
          Sozialversicherung etc.) ...
        </p>
        <div className="space-y-2 mb-1 text-xs">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={state.steuerVollHoehe} onChange={(e) => set("steuerVollHoehe", e.target.checked)} className="w-4 h-4" />
            in voller H&ouml;he (3.300,00 Euro)
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={state.steuerBisZu} onChange={(e) => set("steuerBisZu", e.target.checked)} className="w-4 h-4" />
              bis zu
            </label>
            <input type="number" value={state.steuerBisZuBetrag} onChange={(e) => set("steuerBisZuBetrag", e.target.value)}
              placeholder="Betrag" className="w-20 border-b border-gray-300 bg-transparent px-1 py-0.5 focus:outline-none focus:border-blue-500" />
            <span>Euro</span>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={state.steuerNicht} onChange={(e) => set("steuerNicht", e.target.checked)} className="w-4 h-4" />
            nicht
          </label>
        </div>
        <p className="text-xs text-gray-600 mb-3 italic">in Anspruch genommen habe bzw. in Anspruch nehmen werde.</p>
        <p className="text-xs text-gray-400 mb-4">
          Jegliche Ver&auml;nderungen in meiner Person oder meinen T&auml;tigkeiten, insbesondere
          die Aufnahme weiterer T&auml;tigkeit werde ich unverz&uuml;glich mitteilen. Mir ist bekannt,
          dass Nachteile des Vereins zu meinen Lasten gehen.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-6 pt-4 border-t border-gray-200 print:border-t-0 text-xs text-gray-400">
          <div className="flex flex-col">
            <div className="flex-1 border-b border-gray-400 print:border-0 min-h-[4rem] print:min-h-0 flex items-end pb-1 text-gray-700 font-medium">
              {[state.plzOrt.replace(/^[\d\s]+/, "").replace(/[^a-zA-ZäöüÄÖÜß\s-]/g, "").trim(), new Date().toLocaleDateString("de-DE")].filter(Boolean).join(", ")}
            </div>
            <div className="mt-1 print:mt-0">Ort, Datum</div>
          </div>
          <div className="flex flex-col">
            <div className="flex-1 border-b border-gray-400 print:border-0 min-h-[4rem] print:min-h-0" />
            <div className="mt-1 print:mt-0">Unterschrift 1./2. Vors./Abt.L.</div>
          </div>
          <div className="flex flex-col">
            {state.signature && (
              <div className="hidden print:block text-[7pt] text-green-600 leading-tight mb-1">
                ✓ Einwilligung zur digitalen Unterschrift erteilt
              </div>
            )}
            <div className="flex-1 border-b border-gray-400 print:border-0 min-h-[4rem] print:min-h-0 flex flex-col justify-end">
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
            <div className="mt-1 print:mt-0">Unterschrift Leistungsempf&auml;nger</div>
          </div>
        </div>
        </div>
      </div>

      {showSignModal && (
        <SignatureModal
          existing={state.signature || undefined}
          onSave={(dataUrl) => { set("signature", dataUrl); setShowSignModal(false); }}
          onDelete={() => set("signature", "")}
          onClose={() => setShowSignModal(false)}
        />
      )}

      <div className="pdf-footer hidden mt-6 pt-3 border-t border-gray-200 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tgv-logo-sw.png" alt="TGV Logo" width={36} height={36} className="opacity-60 shrink-0" />
        <span className="text-[10px] text-gray-400 leading-snug">
          TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.V. &middot; Albert-Einstein-Str. 20 &middot; 71717 Beilstein &middot; Tel. 07062&ndash;5753
        </span>
      </div>

      <div className="flex items-center justify-between print:hidden mt-2 mb-6">
        <button
          onClick={() => { localStorage.removeItem(storageKey); setState(defaultState()); }}
          className="px-5 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition-colors"
        >
          Formular zurücksetzen
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5V1h8v4"/><rect x="1" y="5" width="12" height="6" rx="1"/><path d="M3 11v2h8v-2"/><circle cx="10.5" cy="8" r="0.5" fill="currentColor"/>
            </svg>
            Drucken
          </button>
        </div>
      </div>
    </div>
  );
}
