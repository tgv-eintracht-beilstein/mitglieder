"use client";

import { useState, useEffect } from "react";
import {
  type SavedAddress,
  getAddresses,
  getSelectedIds,
  saveSelectedIds,
  emptyAddress,
  save as saveAll,
  initAddressBookSync,
  onAddressBookChange,
} from "@/lib/addressBook";
import { initSharedSync } from "@/lib/sharedAddress";
import { loadBeschreibungen, DateSelect } from "./aufwandsformular";

interface Props {
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  current?: Omit<SavedAddress, "id">;
}

const SEL_KEY = "tgv_address_book_selected_v1";

export function useAddressSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    initAddressBookSync();
    initSharedSync();
    setSelectedIds(getSelectedIds());
    function onStorage(e: StorageEvent) {
      if (e.key === SEL_KEY) setSelectedIds(getSelectedIds());
    }
    window.addEventListener("storage", onStorage);
    const unsub = onAddressBookChange(() => setSelectedIds(getSelectedIds()));
    return () => { window.removeEventListener("storage", onStorage); unsub(); };
  }, []);

  function setSelected(ids: string[]) { saveSelectedIds(ids); setSelectedIds(ids); }
  function refresh() { setSelectedIds(getSelectedIds()); }

  return [selectedIds, setSelected, refresh] as const;
}

const FIELDS: { key: keyof Omit<SavedAddress, "id">; label: string; type?: string; required?: boolean }[] = [
  { key: "vorname", label: "Vorname", required: true },
  { key: "nachname", label: "Nachname", required: true },
  { key: "strasse", label: "Straße, Hausnummer", required: true },
  { key: "plzOrt", label: "PLZ, Ort", required: true },
  { key: "geburtsdatum", label: "Geburtsdatum", type: "date", required: true },
  { key: "telefon", label: "Telefon", type: "tel" },
  { key: "email", label: "E-Mail", type: "email" },
];

function isValid(a: SavedAddress): boolean {
  return !!(a.vorname && a.nachname && a.strasse && a.plzOrt && a.geburtsdatum);
}

function RateOverrides({ addr, onChange, fCls }: { addr: SavedAddress; onChange: (a: SavedAddress) => void; fCls: string }) {
  const overrides = addr.rateOverrides ?? {};
  const beschreibungen = loadBeschreibungen();

  if (beschreibungen.length === 0) return null;

  function set(key: string, val: string) {
    const next = { ...overrides };
    if (val) next[key] = val; else delete next[key];
    onChange({ ...addr, rateOverrides: next });
  }

  return (
    <>
      {beschreibungen.map(b => (
        <div key={b}>
          <div className="text-[10px] text-gray-500 mb-0.5">Stundensatz: {b} (€/h)</div>
          <input type="number" step="0.5" min="0" value={overrides[b] ?? ""} onChange={e => set(b, e.target.value)}
            placeholder="—" className={`${fCls} border-gray-300 focus:border-[#b11217]`} />
        </div>
      ))}
    </>
  );
}

export default function AddressBookModal({ open, onClose, onCancel, current }: Props) {
  const [draft, setDraft] = useState<SavedAddress[]>([]);
  const [draftSelected, setDraftSelected] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let all = getAddresses();
    let firstId: string | null = null;
    if (current && (current.vorname || current.nachname)) {
      const match = all.find(a => a.vorname === current.vorname && a.nachname === current.nachname);
      if (match) {
        all = all.map(a => a.id === match.id ? { ...current, id: match.id } : a);
        firstId = match.id;
      } else {
        const id = crypto.randomUUID();
        all = [{ ...current, id }, ...all];
        firstId = id;
      }
    }
    setDraft(all);
    const sel = getSelectedIds().filter(id => { const a = all.find(x => x.id === id); return a && isValid(a); });
    setDraftSelected(sel);
    setActiveId(firstId ?? all[0]?.id ?? null);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const sorted = [...draft].sort((a, b) => a.nachname.localeCompare(b.nachname) || a.vorname.localeCompare(b.vorname));
  const active = draft.find(a => a.id === activeId) ?? null;

  function handleChange(addr: SavedAddress) {
    setDraft(d => d.map(x => x.id === addr.id ? addr : x));
    if (!isValid(addr)) setDraftSelected(s => s.filter(x => x !== addr.id));
  }

  function handleAdd() {
    const id = crypto.randomUUID();
    setDraft(d => [...d, { ...emptyAddress(), id }]);
    setActiveId(id);
  }

  function handleDelete(id: string) {
    setDraft(d => d.filter(x => x.id !== id));
    setDraftSelected(s => s.filter(x => x !== id));
    if (activeId === id) setActiveId(sorted.find(a => a.id !== id)?.id ?? null);
  }

  function toggle(id: string) {
    const addr = draft.find(a => a.id === id);
    if (addr && !isValid(addr)) return;
    setDraftSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  function handleSave() {
    saveAll(draft);
    saveSelectedIds(draftSelected);
    onClose();
  }

  const fCls = "w-full bg-transparent border-b px-1 py-0.5 text-sm focus:outline-none transition-colors";
  function fBorder(value: string, required?: boolean) {
    return required && !value ? "border-[#b11217] focus:border-[#b11217]" : "border-gray-300 focus:border-[#b11217]";
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 print:hidden" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 h-[80vh] max-h-[600px] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">Adressbuch</h2>
          <button type="button" onClick={onCancel} className="p-1 text-gray-500 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body: left list + right edit */}
        <div className="flex-1 flex min-h-0">
          {/* Left: address list */}
          <div className="w-56 shrink-0 border-r border-gray-200 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {sorted.map(a => {
                const valid = isValid(a);
                const selected = draftSelected.includes(a.id);
                const isActive = activeId === a.id;
                const name = [a.vorname, a.nachname].filter(Boolean).join(" ") || "Neue Adresse";
                return (
                  <div key={a.id}
                    onClick={() => setActiveId(a.id)}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-l-2 transition-colors ${
                      isActive ? "border-[#b11217] bg-red-50/50" : "border-transparent hover:bg-gray-50"
                    } ${valid ? "" : "opacity-50"}`}>
                    <input type="checkbox" checked={selected} onChange={e => { e.stopPropagation(); toggle(a.id); }}
                      disabled={!valid && !selected}
                      className={`w-3.5 h-3.5 shrink-0 ${valid ? "accent-[#b11217]" : "accent-gray-300 cursor-not-allowed"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
                      {a.plzOrt && <div className="text-[10px] text-gray-500 truncate">{a.plzOrt}</div>}
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); handleDelete(a.id); }}
                      className="shrink-0 p-1 text-gray-300 hover:text-[#b11217] transition-colors" title="Löschen">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
              {draft.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-gray-500">Keine Adressen</div>
              )}
            </div>
            <div className="p-2 border-t border-gray-200">
              <button type="button" onClick={handleAdd}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-[#b11217] border border-[#b11217]/30 rounded-lg hover:bg-red-50 transition-colors font-medium">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 1v10M1 6h10"/></svg>
                Neue Adresse
              </button>
            </div>
          </div>

          {/* Right: edit pane */}
          <div className="flex-1 overflow-y-auto p-5">
            {active ? (
              <div className="space-y-2">
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <div className="text-[10px] mb-0.5 flex items-center gap-0.5">
                      <span className={f.required && !active[f.key] ? "text-[#b11217]" : "text-gray-500"}>{f.label}</span>
                      {f.required && !active[f.key] && <span className="text-[#b11217] leading-none">*</span>}
                    </div>
                    {f.type === "date"
                      ? <DateSelect value={active[f.key] as string} onChange={v => handleChange({ ...active, [f.key]: v })}
                          className={`text-sm ${f.required && !active[f.key] ? "[&_button]:border-[#b11217] [&_input]:border-[#b11217]" : ""}`} />
                      : <input type={f.type ?? "text"} value={active[f.key] as string}
                          onChange={e => handleChange({ ...active, [f.key]: e.target.value })}
                          placeholder={f.label}
                          className={`${fCls} ${fBorder(active[f.key] as string, f.required)}`} />
                    }
                  </div>
                ))}
                <RateOverrides addr={active} onChange={handleChange} fCls={fCls} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-500">
                Adresse auswählen oder neue erstellen
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200">
          {draftSelected.length > 0 && <span className="text-xs text-gray-500 mr-auto">{draftSelected.length} ausgewählt</span>}
          <button type="button" onClick={onCancel}
            className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Abbrechen
          </button>
          <button type="button" onClick={draftSelected.length > 0 ? handleSave : undefined} disabled={draftSelected.length === 0}
            className="px-4 py-1.5 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed">
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
}
