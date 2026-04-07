"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SignatureModal from "@/app/_components/signature-modal";
import DownloadButton from "@/app/_components/download-button";
import { validateIban } from "@/lib/iban";
import { ABTEILUNGEN, AbteilungIcon, DateSelect } from "@/app/_components/aufwandsformular";
import { loadSharedSignature, saveSharedSignature } from "@/lib/sharedAddress";
import type { FormState, Person, Address } from "./types";
import { defaultState, emptyPerson, emptyAddress } from "./types";
import { generateAllPdfs } from "./pdf-utils";

const STORAGE_KEY = "mitglied_werden_v1";
type SignTarget = { personId: string } | "sepa";
const fieldCls = "w-full bg-transparent border-b px-1 py-0.5 text-sm focus:outline-none transition-colors";
function fb(v: string, req?: boolean) {
  return req && !v ? "border-[#b11217] focus:border-[#b11217]" : "border-gray-300 focus:border-[#b11217]";
}

function Field({ label, value, required, children }: { label: string; value: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] mb-0.5 flex items-center gap-0.5">
        <span className={required && !value ? "text-[#b11217]" : "text-gray-400"}>{label}</span>
        {required && !value && <span className="text-[#b11217] leading-none">*</span>}
      </div>
      {children}
    </div>
  );
}

function AbteilungenPicker({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ABTEILUNGEN.map((a) => {
        const active = selected.includes(a.name);
        return (
          <button key={a.name} type="button"
            onClick={() => onChange(active ? selected.filter((s) => s !== a.name) : [...selected, a.name])}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              active ? "bg-[#b11217] text-white border-[#b11217]" : "bg-white text-gray-600 border-gray-200 hover:border-[#b11217] hover:text-[#b11217]"
            }`}
          >
            {active
              ? <span className="brightness-0 invert"><AbteilungIcon slug={a.slug} size={16} /></span>
              : <AbteilungIcon slug={a.slug} size={16} />}
            {a.name}
          </button>
        );
      })}
    </div>
  );
}

function AddressFields({ person, adressen, onUpdate }: {
  person: Person; adressen: Address[];
  onUpdate: (a: Address) => void;
}) {
  const cur = adressen.find((a) => a.id === person.addressId);
  if (!cur) return null;
  const u = (k: keyof Address, v: string) => onUpdate({ ...cur, [k]: v });
  return (
    <div className="grid grid-cols-[2fr_80px_1fr] gap-2">
      <Field label="Straße, Hausnummer" value={cur.strasse} required>
        <input type="text" value={cur.strasse} onChange={(e) => u("strasse", e.target.value)} className={`${fieldCls} ${fb(cur.strasse, true)}`} />
      </Field>
      <Field label="PLZ" value={cur.plz} required>
        <input type="text" value={cur.plz} onChange={(e) => u("plz", e.target.value)} className={`${fieldCls} ${fb(cur.plz, true)}`} />
      </Field>
      <Field label="Ort" value={cur.ort} required>
        <input type="text" value={cur.ort} onChange={(e) => u("ort", e.target.value)} className={`${fieldCls} ${fb(cur.ort, true)}`} />
      </Field>
    </div>
  );
}

// Vereinsbeitrag from Mitgliedsbeiträge 2026
const VEREIN_ERWACHSEN = 80;
const VEREIN_PARTNER = 45; // Zweitmitglied (Ehe-/Lebenspartner)
const VEREIN_KIND = 35;    // Kinder bis 18
const VEREIN_FAMILIE = 130;

// Abteilungsbeitrag base rates (Erwachsene Aktive, Mitgliedsbeiträge 2026)
const ABT_PRICES: Record<string, number> = {
  "Fußball": 72, "Gesang": 70, "Schwimmen": 20, "Handball": 50,
  "Tischtennis": 50, "Tennis": 120, "Turnen": 50, "Leichtathletik": 50,
  "Gymnastik": 15, "Ski & Berg": 0,
};

function getAge(geburtsdatum: string): number | null {
  if (!geburtsdatum) return null;
  const [y, m, d] = geburtsdatum.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

function CostEstimate({ personen, familie }: { personen: Person[]; familie: boolean }) {
  if (!personen.some((p) => p.abteilungen.length > 0)) return null;

  const rows: { name: string; typ: string; verein: number; abt: number }[] = [];
  for (const p of personen) {
    if (!p.abteilungen.length) continue;
    const age = getAge(p.geburtsdatum);
    const isChild = age !== null && age < 18;
    let verein: number;
    let typ: string;
    if (familie) {
      verein = VEREIN_FAMILIE; typ = "Familie";
    } else if (p.istPartner) {
      verein = VEREIN_PARTNER; typ = "Zweitmitglied";
    } else if (isChild) {
      verein = VEREIN_KIND; typ = "Kind";
    } else {
      verein = VEREIN_ERWACHSEN; typ = "Erwachsen";
    }
    const abt = p.abteilungen.reduce((sum, a) => sum + (ABT_PRICES[a] ?? 0), 0);
    rows.push({ name: [p.vorname, p.nachname].filter(Boolean).join(" ") || "Person", typ, verein: familie ? 0 : verein, abt });
  }
  const vereinTotal = familie ? VEREIN_FAMILIE : rows.reduce((s, r) => s + r.verein, 0);
  const abtTotal = rows.reduce((s, r) => s + r.abt, 0);
  const total = vereinTotal + abtTotal;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
      <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">Geschätzte Jahresbeiträge</div>
      <div className="px-4 py-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left py-1 font-normal">Person</th>
              <th className="text-left py-1 font-normal">Typ</th>
              <th className="text-right py-1 font-normal">Verein</th>
              <th className="text-right py-1 font-normal">Abteilung</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-1.5">{r.name}</td>
                <td className="text-gray-500 text-xs">{r.typ}</td>
                <td className="text-right text-gray-600">{familie ? "–" : `${r.verein},00 €`}</td>
                <td className="text-right text-gray-600">{r.abt},00 €</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {familie && (
              <tr className="border-t border-gray-100">
                <td className="py-1.5 text-gray-600" colSpan={3}>Familienbeitrag Verein</td>
                <td className="text-right text-gray-600">{VEREIN_FAMILIE},00 €</td>
              </tr>
            )}
            <tr className="border-t border-gray-200">
              <td className="py-2 font-semibold" colSpan={3}>Summe (ca.)</td>
              <td className="text-right font-bold text-[#b11217]">{total},00 €</td>
            </tr>
          </tfoot>
        </table>
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          Unverbindliche Schätzung gemäß Beitragsordnung (Anlage A). Der tatsächliche Beitrag kann
          je nach Mitgliedsstatus, Eintrittszeitpunkt und Abteilungsregelung abweichen. Die endgültige
          Berechnung erfolgt nach Bearbeitung des Aufnahmeantrags durch die Geschäftsstelle.
        </p>
      </div>
    </div>
  );
}

import { Suspense } from "react";

export default function MitgliedWerdenWrapper() {
  return <Suspense><MitgliedWerdenPage /></Suspense>;
}

function MitgliedWerdenPage() {
  const searchParams = useSearchParams();
  const debug = searchParams.get("debug") === "true";
  const [state, setState] = useState<FormState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [signTarget, setSignTarget] = useState<SignTarget | null>(null);
  const [sharedSig, setSharedSig] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s: FormState = JSON.parse(raw);
        // Migrate: ensure each person has their own address
        const seen = new Set<string>();
        for (const p of s.personen) {
          if (seen.has(p.addressId)) {
            const src = s.adressen.find((a) => a.id === p.addressId);
            const copy = { ...emptyAddress(), strasse: src?.strasse || "", plz: src?.plz || "", ort: src?.ort || "" };
            s.adressen.push(copy);
            p.addressId = copy.id;
          }
          seen.add(p.addressId);
        }
        setState(s);
      }
    } catch {}
    setSharedSig(loadSharedSignature());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setState((s) => ({ ...s, [key]: val }));
  }, []);

  const updatePerson = useCallback((id: string, patch: Partial<Person>) => {
    setState((s) => ({ ...s, personen: s.personen.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  }, []);

  const addPerson = useCallback(() => {
    setState((s) => {
      const last = s.personen[s.personen.length - 1];
      const lastAddr = last ? s.adressen.find((a) => a.id === last.addressId) : null;
      const newAddr = { ...emptyAddress(), strasse: lastAddr?.strasse || "", plz: lastAddr?.plz || "", ort: lastAddr?.ort || "" };
      const p = emptyPerson(newAddr.id);
      if (last) { p.nachname = last.nachname; p.abteilungen = [...last.abteilungen]; p.signature = last.signature; }
      return { ...s, adressen: [...s.adressen, newAddr], personen: [...s.personen, p] };
    });
  }, []);

  const removePerson = useCallback((id: string) => {
    setState((s) => ({ ...s, personen: s.personen.length > 1 ? s.personen.filter((p) => p.id !== id) : s.personen }));
  }, []);

  const saveAddress = useCallback((addr: Address) => {
    setState((s) => ({
      ...s,
      adressen: s.adressen.some((a) => a.id === addr.id)
        ? s.adressen.map((a) => (a.id === addr.id ? addr : a))
        : [...s.adressen, addr],
    }));
  }, []);

  if (!hydrated) return null;

  const getAddr = (p: Person) => state.adressen.find((a) => a.id === p.addressId);
  const firstAddr = getAddr(state.personen[0]);
  const firstP = state.personen[0];
  const city = firstAddr?.ort || (firstAddr as Record<string, string> | undefined)?.plzOrt?.replace(/^[\d\s]+/, "").trim() || "";
  const today = new Date().toLocaleDateString("de-DE");
  const defaultDate = city ? `${city}, ${today}` : today;

  const checks: { label: string; valid: boolean }[] = [
    { label: "IBAN", valid: validateIban(state.iban) },
  ];
  for (const p of state.personen) {
    const lbl = p.vorname || p.nachname ? `${p.vorname} ${p.nachname}` : "Person";
    const addr = getAddr(p);
    checks.push(
      { label: `${lbl}: Vorname`, valid: !!p.vorname },
      { label: `${lbl}: Nachname`, valid: !!p.nachname },
      { label: `${lbl}: Geburtsdatum`, valid: !!p.geburtsdatum },
      { label: `${lbl}: Abteilung`, valid: p.abteilungen.length > 0 },
      { label: `${lbl}: Adresse`, valid: !!(addr?.strasse && addr?.plz && addr?.ort) },
      { label: `${lbl}: Datenschutz`, valid: p.datenschutzAkzeptiert },
    );
  }
  const missing = checks.filter((c) => !c.valid);
  const isComplete = missing.length === 0;
  const pdfCount = 1;

  return (
    <div className="mitglied-werden-form px-1">
      <div className="flex items-center justify-between mb-3 print:hidden">
        <h1 className="text-2xl font-bold text-[#b11217]">Mitglied werden</h1>
        <div className="hidden md:flex items-center gap-2">
          <DownloadButton filename="mitgliedsantrag.pdf" disabled={!isComplete} missingCount={missing.length} checks={checks} side="bottom" count={pdfCount} onDownload={() => generateAllPdfs(state)} />
        </div>
      </div>

      {/* Personen */}
      <div className="space-y-3 mb-3">
        {state.personen.map((p, i) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl flex items-center justify-between">
              <span>Person {i + 1}{p.vorname || p.nachname ? ` – ${p.vorname} ${p.nachname}` : ""}</span>
              {state.personen.length > 1 && (
                <button onClick={() => removePerson(p.id)} className="text-red-200 hover:text-white transition-colors" title="Entfernen">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
            <div className="px-4 py-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2">
                <Field label="Nachname" value={p.nachname} required>
                  <input type="text" value={p.nachname} onChange={(e) => updatePerson(p.id, { nachname: e.target.value })} className={`${fieldCls} ${fb(p.nachname, true)}`} />
                </Field>
                <Field label="Vorname" value={p.vorname} required>
                  <input type="text" value={p.vorname} onChange={(e) => updatePerson(p.id, { vorname: e.target.value })} className={`${fieldCls} ${fb(p.vorname, true)}`} />
                </Field>
                <Field label="Geburtsdatum" value={p.geburtsdatum} required>
                  <DateSelect value={p.geburtsdatum} onChange={(v) => updatePerson(p.id, { geburtsdatum: v })} minYear={1920} className={`text-sm ${!p.geburtsdatum ? "[&_button]:border-[#b11217] [&_input]:border-[#b11217]" : ""}`} />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <Field label="Telefon" value="skip">
                  <input type="tel" value={p.telefon} onChange={(e) => updatePerson(p.id, { telefon: e.target.value })} className={`${fieldCls} border-gray-300 focus:border-[#b11217]`} />
                </Field>
                <Field label="E-Mail" value="skip">
                  <input type="email" value={p.email} onChange={(e) => updatePerson(p.id, { email: e.target.value })} className={`${fieldCls} border-gray-300 focus:border-[#b11217]`} />
                </Field>
              </div>
              <AddressFields person={p} adressen={state.adressen} onUpdate={(a) => saveAddress(a)} />
              <Field label="Abteilung(en)" value={p.abteilungen.length ? "ok" : ""} required>
                <AbteilungenPicker selected={p.abteilungen} onChange={(v) => updatePerson(p.id, { abteilungen: v })} />
              </Field>
              {/* Ehe-/Lebenspartner — only show if no other person has it checked */}
              {(!state.personen.some((o) => o.istPartner && o.id !== p.id)) && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={p.istPartner} onChange={(e) => updatePerson(p.id, { istPartner: e.target.checked })} className="w-4 h-4 accent-[#b11217]" />
                  <span className="text-sm text-gray-700">Zweitmitglied (Ehe-/Lebenspartner)</span>
                </label>
              )}
              {/* Datenschutz — required per person */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={p.datenschutzAkzeptiert} onChange={(e) => updatePerson(p.id, { datenschutzAkzeptiert: e.target.checked })} className="w-4 h-4 shrink-0 mt-0.5 accent-[#b11217]" />
                <span className={`text-sm ${!p.datenschutzAkzeptiert ? "text-[#b11217]" : "text-gray-700"}`}>
                  Ich habe die <a href="/impressum#datenschutz" target="_blank" className="underline hover:text-[#b11217]" onClick={(e) => e.stopPropagation()}>Datenschutzverordnung</a> gelesen und willige ein, dass der TGV &bdquo;Eintracht&ldquo; Beilstein meine Daten (Name, Geburtsdatum, Adresse, Kontaktdaten, Fotos, Vereinsfunktionen) auf Vereins- und Abteilungswebseiten, in Pressemitteilungen und bei Verbandsmeldungen veröffentlichen darf. <span className="text-[#b11217]">*</span>
                </span>
              </label>
              {/* Per-person signature */}
              <div className="pt-2 border-t border-gray-100">
                <div className="text-[10px] text-gray-400 mb-1">Unterschrift <span className="text-gray-300">(optional – kann auch handschriftlich auf dem Ausdruck erfolgen)</span></div>
                {p.signature ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.signature} alt="Unterschrift" className="h-10 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ imageRendering: "auto" }}
                      onClick={() => setSignTarget({ personId: p.id })} title="Klicken zum Bearbeiten" />
                    <span className="text-[10px] text-green-600">&#10003; Unterschrieben</span>
                    {state.personen.length > 1 && i > 0 && state.personen[0].signature && state.personen[0].signature !== p.signature && (
                      <button type="button" onClick={() => updatePerson(p.id, { signature: state.personen[0].signature })}
                        className="text-[10px] text-gray-400 hover:text-[#b11217] transition-colors">Von Person 1 übernehmen</button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSignTarget({ personId: p.id })}
                      className="px-3 py-1.5 text-xs bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors">
                      Unterschreiben
                    </button>
                    {state.personen.length > 1 && i > 0 && state.personen[0].signature && (
                      <button type="button" onClick={() => updatePerson(p.id, { signature: state.personen[0].signature })}
                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:border-[#b11217] hover:text-[#b11217] transition-colors">
                        Von Person 1 übernehmen
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addPerson} className="w-full mb-3 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#b11217] hover:text-[#b11217] transition-colors">
        + Weitere Person hinzufügen
      </button>

      {/* Familienmitgliedschaft */}
      {state.personen.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
          <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">Familienmitgliedschaft</div>
          <div className="px-4 py-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={state.familienmitgliedschaft} onChange={(e) => set("familienmitgliedschaft", e.target.checked)} className="w-5 h-5 shrink-0 accent-[#b11217]" />
              <span className="text-sm text-gray-700">Familienmitgliedschaft (130,00 € Vereinsbeitrag für alle Personen)</span>
            </label>
          </div>
        </div>
      )}

      {/* Cost estimation */}
      {debug && <CostEstimate personen={state.personen} familie={state.familienmitgliedschaft && state.personen.length > 1} />}

      {/* SEPA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">SEPA-Lastschriftmandat</div>
        <div className="px-4 py-3 space-y-3">
          <Field label="Kontoinhaber (falls abweichend)" value="skip">
            <input type="text" value={state.kontoinhaber} onChange={(e) => set("kontoinhaber", e.target.value)}
              placeholder={firstP ? `${firstP.vorname} ${firstP.nachname}` : ""}
              className={`${fieldCls} border-gray-300 focus:border-[#b11217]`} />
          </Field>
          <Field label="IBAN" value={validateIban(state.iban) ? "ok" : ""} required>
            <input type="text" value={state.iban} onChange={(e) => set("iban", e.target.value.toUpperCase())} placeholder="DE00 0000 0000 0000 0000 00"
              className={`${fieldCls} uppercase ${state.iban === "" ? "border-[#b11217] focus:border-[#b11217]" : validateIban(state.iban) ? "border-green-500 text-green-700 focus:border-green-500" : "border-[#b11217] text-[#b11217] focus:border-[#b11217]"}`} />
          </Field>
          <div className="pt-3 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-4 text-xs text-gray-400">
              <div className="flex flex-col">
                <div className="flex-1 border-0 min-h-[3rem] print:min-h-0 flex items-end pb-1 text-gray-700 font-medium">
                  <input type="text" id="sig-date-mw"
                    value={state.overrideDate !== null ? state.overrideDate : defaultDate}
                    onChange={(e) => set("overrideDate", e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none p-0 m-0 focus:ring-0 print:hidden" />
                  {state.overrideDate !== null && (
                    <button type="button" onClick={() => set("overrideDate", null)} className="p-1 text-gray-300 hover:text-[#b11217] transition-colors print:hidden" title="Zurücksetzen">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                  <span className="hidden print:inline">{state.overrideDate !== null ? state.overrideDate : defaultDate}</span>
                </div>
                <div className="mt-1 print:mt-0 border-t border-gray-400 pt-1">Ort, Datum</div>
              </div>
              <div className="flex flex-col">
                {state.signature && <div className="text-[7pt] text-green-600 leading-tight mb-1">&#10003; Einwilligung zur digitalen Unterschrift erteilt</div>}
                <div className="flex-1 border-0 min-h-[3rem] print:min-h-0 flex flex-col justify-end">
                  {state.signature ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={state.signature} alt="Unterschrift" onClick={() => setSignTarget("sepa")}
                      style={{ imageRendering: "auto" }}
                      className="max-h-14 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity print:cursor-default" title="Klicken zum Bearbeiten" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSignTarget("sepa")}
                        className="mb-1 px-4 py-2 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors print:hidden">
                        Unterschreiben
                      </button>
                      {state.personen[0]?.signature && (
                        <button type="button" onClick={() => set("signature", state.personen[0].signature)}
                          className="mb-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:border-[#b11217] hover:text-[#b11217] transition-colors print:hidden">
                          Von Person 1 übernehmen
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-1 print:mt-0 border-t border-gray-400 pt-1">Unterschrift Kontoinhaber <span className="text-gray-300">(optional)</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-2 print:hidden mt-2 mb-6">
        <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setState(defaultState()); }}
          className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs hover:bg-red-100 transition-colors">
          Formular zurücksetzen
        </button>
        <DownloadButton filename="mitgliedsantrag.pdf" disabled={!isComplete} missingCount={missing.length} checks={checks} side="top" count={pdfCount} onDownload={() => generateAllPdfs(state)} />
      </div>

      {signTarget && (
        <SignatureModal
          existing={
            signTarget === "sepa"
              ? state.signature || undefined
              : state.personen.find((p) => p.id === (signTarget as { personId: string }).personId)?.signature || undefined
          }
          sharedSignature={sharedSig || undefined}
          onSave={(d) => {
            if (signTarget === "sepa") {
              set("signature", d);
            } else {
              updatePerson((signTarget as { personId: string }).personId, { signature: d });
            }
            saveSharedSignature(d);
            setSharedSig(d);
            setSignTarget(null);
          }}
          onDelete={() => {
            if (signTarget === "sepa") {
              set("signature", "");
            } else {
              updatePerson((signTarget as { personId: string }).personId, { signature: "" });
            }
            setSignTarget(null);
          }}
          onClose={() => setSignTarget(null)}
        />
      )}
    </div>
  );
}
