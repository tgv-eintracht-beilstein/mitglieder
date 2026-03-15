"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import SignatureModal from "@/app/_components/signature-modal";

const KM_RATE = 0.3;

const ABTEILUNGEN = [
  "Fußball",
  "Gesang",
  "Schwimmen",
  "Handball",
  "Tischtennis",
  "Tennis",
  "Turnen & Leichtathletik",
];

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
  return stunden * (parseFloat(row.satz) || 0)
    + (parseFloat(row.km) || 0) * KM_RATE;
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

const STORAGE_KEY = "uebungsleiterpauschale_v1";

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

/** Renders an input on screen, plain text in print */
function PI({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block w-full ${className ?? ""}`}>
      <span className="print:hidden w-full">{children}</span>
      <span className="hidden print:inline">{value}</span>
    </span>
  );
}

/** Fullscreen modal to edit a single row on mobile */
function RowEditModal({ row, onSave, onDelete, onClose }: {
  row: Row;
  onSave: (r: Row) => void;
  onDelete: () => void;
  onClose: () => void;
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
            <div className="py-2 border-b border-gray-300">
              <TimeSelect value={draft.von} onChange={v => f("von", v)} className="text-base" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">bis</label>
            <div className="py-2 border-b border-gray-300">
              <TimeSelect value={draft.bis} onChange={v => f("bis", v)} className="text-base" />
            </div>
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
        <button onClick={onDelete}
          className="px-4 py-2.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
          Löschen
        </button>
        <button onClick={() => { onSave(draft); onClose(); }}
          className="flex-1 py-2.5 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors font-medium">
          Speichern
        </button>
      </div>
    </div>
  );
}

export default function UebungsleiterpauschaleePage() {
  const [state, setState] = useState<FormState>(defaultState);
  const [showSignModal, setShowSignModal] = useState(false);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as FormState);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value })), []);

  const updateRow = useCallback((id: number, key: keyof Row, value: string) =>
    setState((s) => ({
      ...s,
      rows: s.rows.map((r) => r.id === id ? { ...r, [key]: value } : r),
    })), []);

  const addRow = useCallback(() =>
    setState((s) => {
      const last = s.rows[s.rows.length - 1];
      const newRow: Row = {
        id: s.nextId,
        datum: last?.datum ?? "",
        von: last?.von || "00:00",
        bis: last?.bis || "00:00",
        satz: last?.satz ?? "15",
        km: last?.km ?? "",
        beschreibung: last?.beschreibung ?? "",
      };
      return { ...s, rows: [...s.rows, newRow], nextId: s.nextId + 1 };
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
    <div className="reisekosten-form overflow-x-hidden">

      {/* Print-only header */}
      <div className="hidden print:flex items-center gap-3 mb-4 pb-3 border-b border-gray-300">
        <Image
          src="https://www.tgveintrachtbeilstein.de/wp-content/uploads/2016/04/tgv.logo_.512.png"
          alt="TGV Logo"
          width={40}
          height={40}
          unoptimized
        />
        <div className="text-xs text-gray-600">
          <strong className="block">ÜBUNGSLEITERPAUSCHALE &ndash; {state.monat}</strong>
          TGV &bdquo;Eintracht&ldquo; Beilstein e. V. &middot; {state.vorname} {state.nachname}
        </div>
      </div>

      {/* ── Header ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
        {/* Red title bar */}
        <div className="bg-[#b11217] text-white px-4 py-2 flex items-center gap-3">
          <span className="font-bold tracking-wide text-sm uppercase">Übungsleiterpauschale</span>
          <span className="text-white/60 text-xs">Abrechnung</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 divide-y md:divide-y-0 print:divide-y-0 md:divide-x print:divide-x divide-gray-200 text-sm">

          {/* Col 1: Abteilung + Monat */}
          <div className="px-3 py-2 space-y-2">
            <div>
              <div className="text-[10px] text-gray-400 mb-0.5">Abteilung</div>
              <PI value={state.abteilung}>
                <select
                  value={state.abteilung}
                  onChange={(e) => set("abteilung", e.target.value)}
                  className="w-full border-b border-gray-300 bg-transparent py-0 text-sm focus:outline-none focus:border-[#b11217]"
                >
                  <option value="">– bitte wählen –</option>
                  {ABTEILUNGEN.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </PI>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 mb-0.5">Monat</div>
              <PI value={state.monat}>
                <input type="month" value={state.monat} onChange={(e) => set("monat", e.target.value)}
                  className="w-full border-b border-gray-300 bg-transparent py-0 text-sm focus:outline-none focus:border-[#b11217]" />
              </PI>
            </div>
          </div>

          {/* Col 2: TGV address */}
          <div className="px-3 py-2 flex flex-col justify-center text-center text-gray-700 leading-snug">
            <div className="font-bold text-gray-900 text-sm">TGV &quot;Eintracht&quot; Beilstein 1823 e.V.</div>
            <div className="text-xs text-gray-500 mt-0.5">Albert-Einstein-Str. 20 &middot; 71717 Beilstein</div>
            <div className="text-xs text-gray-400 mt-0.5">Tel. 07062&ndash;5753 &middot; Fax 07062&ndash;916736</div>
          </div>

          {/* Col 3: Person */}
          <div className="px-3 py-2 space-y-1">
            {([
              ["Nachname", "nachname", "text"],
              ["Vorname", "vorname", "text"],
              ["Straße", "strasse", "text"],
              ["PLZ / Ort", "plzOrt", "text"],
              ["Geburtsdatum", "geburtsdatum", "date"],
              ["Telefon", "telefon", "tel"],
            ] as [string, keyof FormState, string][]).map(([label, key, type]) => (
              <div key={key} className="flex items-baseline gap-2">
                <span className="text-[10px] text-gray-400 w-20 shrink-0">{label}</span>
                <PI value={state[key] as string} className="flex-1 min-w-0">
                  <input
                    type={type}
                    value={state[key] as string}
                    onChange={(e) => set(key, e.target.value)}
                    className="w-full border-b border-gray-200 bg-transparent py-0 text-sm focus:outline-none focus:border-[#b11217]"
                  />
                </PI>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden">

        {/* Mobile: tap-to-edit cards */}
        <div className="md:hidden print:hidden divide-y divide-gray-100">
          {sortedRows.map((row) => (
            <button key={row.id} onClick={() => setEditingRowId(row.id)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="text-sm font-medium text-gray-800">
                  {row.datum || <span className="text-gray-300">Kein Datum</span>}
                  {(row.von || row.bis) && (
                    <span className="text-gray-400 font-normal ml-2 text-xs">{row.von}–{row.bis}</span>
                  )}
                </div>
                <div className="text-sm font-semibold text-[#b11217] tabular-nums ml-4 shrink-0">
                  {calcRow(row).toFixed(2)} €
                </div>
              </div>
              <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                {(row.von || row.bis) && (
                  <span>{calcStunden(row.von, row.bis).toFixed(2)} Std.</span>
                )}
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
                <th className="border-r border-gray-200 px-2 py-2">Aufwand<br/>Std.</th>
                <th className="border-r border-gray-200 px-2 py-2">€/Std.</th>
                <th className="border-r border-gray-200 px-2 py-2">km</th>
                <th className="border-r border-gray-200 px-2 py-2">Ergebnis</th>
                <th className="border-r border-gray-200 px-2 py-2 text-left">Kursbezeichnung / Reiseziel</th>
                <th className="px-2 py-2 print:hidden w-6"></th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="border-r border-gray-100 px-1 py-1.5">
                    <PI value={row.datum}>
                      <input type="date" value={row.datum} onChange={(e) => updateRow(row.id, "datum", e.target.value)} className={inputCls} style={{ width: 110 }} />
                    </PI>
                  </td>
                  <td className="border-r border-gray-100 px-1 py-1.5">
                    <PI value={row.von}>
                      <TimeSelect value={row.von} onChange={v => updateRow(row.id, "von", v)} />
                    </PI>
                  </td>
                  <td className="border-r border-gray-100 px-1 py-1.5">
                    <PI value={row.bis}>
                      <TimeSelect value={row.bis} onChange={v => updateRow(row.id, "bis", v)} />
                    </PI>
                  </td>
                  <td className="border-r border-gray-100 px-2 py-1.5 text-center tabular-nums">
                    {calcStunden(row.von, row.bis).toFixed(2)}
                  </td>
                  <td className="border-r border-gray-100 px-1 py-1.5">
                    <PI value={row.satz}>
                      <input type="number" value={row.satz} onChange={(e) => updateRow(row.id, "satz", e.target.value)} step="0.5" min="0" className={inputCls} style={{ width: 52 }} />
                    </PI>
                  </td>
                  <td className="border-r border-gray-100 px-1 py-1.5">
                    <PI value={row.km}>
                      <input type="number" value={row.km} onChange={(e) => updateRow(row.id, "km", e.target.value)} step="1" min="0" className={inputCls} style={{ width: 52 }} />
                    </PI>
                  </td>
                  <td className="border-r border-gray-100 px-2 py-1.5 text-right font-semibold tabular-nums">
                    {calcRow(row).toFixed(2)} €
                  </td>
                  <td className="border-r border-gray-100 px-1 py-1.5">
                    <input type="text" value={row.beschreibung} onChange={(e) => updateRow(row.id, "beschreibung", e.target.value)} className={inputCls} />
                  </td>
                  <td className="px-1 py-1.5 text-center print:hidden">
                    <button onClick={() => removeRow(row.id)} disabled={state.rows.length === 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-20 text-base leading-none" aria-label="Zeile entfernen">
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td colSpan={6} className="px-3 py-2 font-bold">Aufwandsentsch&auml;digung</td>
                <td className="px-2 py-2 text-right font-bold tabular-nums border-l border-gray-200">{aufwand.toFixed(2)} &euro;</td>
                <td colSpan={2} className="print:hidden" />
              </tr>
              <tr className="bg-gray-50">
                <td colSpan={6} className="px-3 py-1 font-bold">abz&uuml;glich Aufwandsspende</td>
                <td className="px-2 py-1 border-l border-gray-200">
                  <input type="number" min="0" step="0.01" value={state.aufwandsspende}
                    onChange={(e) => set("aufwandsspende", e.target.value)}
                    placeholder="0.00"
                    className="w-full text-right text-xs bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-400 print:hidden" />
                  <span className="hidden print:block text-right text-xs tabular-nums">{spende.toFixed(2)} &euro;</span>
                </td>
                <td colSpan={2} className="print:hidden" />
              </tr>
              <tr className="bg-gray-100 border-t border-gray-300">
                <td colSpan={6} className="px-3 py-2 font-bold text-sm">Endbetrag</td>
                <td className="px-2 py-2 text-right font-bold text-sm tabular-nums border-l border-gray-200">{endbetrag.toFixed(2)} &euro;</td>
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
            <input type="number" min="0" step="0.01" value={state.aufwandsspende}
              onChange={(e) => set("aufwandsspende", e.target.value)}
              placeholder="0.00"
              className="w-24 text-right bg-transparent border-b border-gray-300 focus:outline-none focus:border-[#b11217] tabular-nums" />
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
            <span>Endbetrag</span>
            <span className="tabular-nums">{endbetrag.toFixed(2)} €</span>
          </div>
        </div>

        <div className="p-3 print:hidden">
          <button onClick={addRow}
            className="px-3 py-1.5 bg-[#b11217] text-white rounded text-xs hover:bg-[#8f0f13] transition-colors">
            + Zeile hinzuf&uuml;gen
          </button>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 text-sm space-y-2">
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
              <input
                type="text"
                value={state.iban}
                onChange={(e) => set("iban", e.target.value)}
                placeholder="DE00 0000 0000 0000 0000 00"
                className={`flex-1 border-b bg-transparent px-1 py-0.5 text-sm focus:outline-none ${
                  state.iban === ""
                    ? "border-gray-300 focus:border-blue-500"
                    : validateIban(state.iban)
                    ? "border-green-500 text-green-700"
                    : "border-red-400 text-red-600"
                }`}
              />
            </div>
            {state.iban !== "" && !validateIban(state.iban) && (
              <p className="text-xs text-red-500 ml-10">Ung&uuml;ltige IBAN</p>
            )}
            {state.iban !== "" && validateIban(state.iban) && (
              <p className="text-xs text-green-600 ml-10">IBAN g&uuml;ltig</p>
            )}
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

      {/* ── Legal declaration ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 text-sm">
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
              placeholder="Betrag"
              className="w-20 border-b border-gray-300 bg-transparent px-1 py-0.5 focus:outline-none focus:border-blue-500" />
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
        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200 text-xs text-gray-400">
          {/* Ort, Datum */}
          <div className="flex flex-col">
            <div className="flex-1 border-b border-gray-400 min-h-[4rem] flex items-end pb-1 text-gray-700 font-medium">
              {[state.plzOrt.replace(/^[\d\s]+/, "").replace(/[^a-zA-ZäöüÄÖÜß\s-]/g, "").trim(), new Date().toLocaleDateString("de-DE")].filter(Boolean).join(", ")}
            </div>
            <div className="mt-1 truncate">Ort, Datum</div>
          </div>
          {/* Vors */}
          <div className="flex flex-col">
            <div className="flex-1 border-b border-gray-400 min-h-[4rem]" />
            <div className="mt-1 truncate">Unterschrift 1./2. Vors./Abt.L.</div>
          </div>
          {/* Leistungsempfänger */}
          <div className="flex flex-col">
            <div className="flex-1 border-b border-gray-400 min-h-[4rem] flex flex-col justify-end">
              {state.signature && (
                <div className="hidden print:block text-[7pt] text-green-600 leading-tight mb-0.5">
                  ✓ Einwilligung zur digitalen Unterschrift erteilt
                </div>
              )}
              {state.signature ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={state.signature} alt="Unterschrift"
                    onClick={() => setShowSignModal(true)}
                    className="h-14 object-contain cursor-pointer hover:opacity-80 transition-opacity print:cursor-default"
                    title="Klicken zum Bearbeiten" />
                </>
              ) : (
                <button onClick={() => setShowSignModal(true)}
                  className="mb-1 w-full px-3 py-2 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors print:hidden">
                  Unterschreiben
                </button>
              )}
            </div>
            <div className="mt-1 truncate">Unterschrift Leistungsempf&auml;nger</div>
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

      <div className="flex justify-center gap-3 print:hidden">
        <button onClick={() => window.print()}
          className="px-6 py-3 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900 transition-colors">
          Drucken / Als PDF speichern
        </button>
        <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setState(defaultState()); }}
          className="px-6 py-3 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors">
          Formular zur&uuml;cksetzen
        </button>
      </div>
    </div>
  );
}
