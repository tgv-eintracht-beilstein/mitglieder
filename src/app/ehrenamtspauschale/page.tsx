"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import SignatureModal from "@/app/_components/signature-modal";
import FormHeader from "@/app/_components/form-header";
import DownloadButton from "@/app/_components/download-button";
import SubmitButton from "@/app/_components/submit-button";
import VerzichtPageContent from "@/app/_components/verzicht-page-content";
import { SHARED_ADDRESS_KEY, saveSharedAddress, loadSharedAddress, loadSharedSignature, saveSharedSignature } from "@/lib/sharedAddress";
import { buildPdfFilename } from "@/lib/pdfFilename";
import { syncSave, syncLoad, subscribe, uploadPdfAndSaveVersion } from "@/lib/sync";
import { validateIban } from "@/lib/iban";
import { AbteilungSelect, ABTEILUNGEN, AbteilungIcon } from "@/app/_components/aufwandsformular";
import AddressBookModal, { useAddressSelection } from "@/app/_components/address-book-picker";
import { type SavedAddress, getSelectedAddresses } from "@/lib/addressBook";

const STORAGE_KEY = "ehrenamtspauschale_v2";

function getEhrenamtLimit(year: number): number {
  return year >= 2026 ? 960 : 840;
}

interface FormState {
  nachname: string;
  vorname: string;
  strasse: string;
  plzOrt: string;
  geburtsdatum: string;
  telefon: string;
  email: string;
  iban: string;
  abteilung: string;
  funktion: string;
  verguetung: string;
  jahr: string;
  verzicht: boolean;
  spendenbetrag: string;
  zahlungBar: boolean;
  zahlungUeberweisung: boolean;
  signature: string;
  overrideDate: string | null;
}

function defaultState(): FormState {
  return {
    nachname: "", vorname: "", strasse: "", plzOrt: "",
    geburtsdatum: "", telefon: "", email: "",
    iban: "",
    abteilung: "", funktion: "", verguetung: "",
    jahr: String(new Date().getFullYear()),
    verzicht: false, spendenbetrag: "",
    zahlungBar: false, zahlungUeberweisung: false,
    signature: "", overrideDate: null,
  };
}

function PrintCheckbox({ checked }: { checked: boolean }) {
  return (
    <span className="hidden print:inline-flex items-center justify-center shrink-0" style={{ width: 14, height: 14 }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="13" height="13" rx="1.5" stroke="#333" strokeWidth="1" fill="white"/>
        {checked && <path d="M3 7l3 3 5-5" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>}
      </svg>
    </span>
  );
}

export default function EhrenamtspauschaleePage() {
  const [state, setState] = useState<FormState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [sharedSignature, setSharedSignature] = useState("");
  const [combined, setCombined] = useState(true);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [selectedIds, , refreshSelection] = useAddressSelection();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const addr = loadSharedAddress();
        const saved = await syncLoad<FormState>(STORAGE_KEY);
        setState(s => {
          const base = { ...s, ...(saved ?? {}) };
          // Only override personal fields from shared address if non-empty
          return {
            ...base,
            ...(addr.nachname && { nachname: addr.nachname }),
            ...(addr.vorname && { vorname: addr.vorname }),
            ...(addr.strasse && { strasse: addr.strasse }),
            ...(addr.plzOrt && { plzOrt: addr.plzOrt }),
            ...(addr.geburtsdatum && { geburtsdatum: addr.geburtsdatum }),
            ...(addr.telefon && { telefon: addr.telefon }),
            ...(addr.email && { email: addr.email }),
          };
        });
        let sig = loadSharedSignature();
        if (!sig) {
          const otherKeys = ["uebungsleiterpauschale_v1", "reisekosten_v1", "ehrenamtspauschale_verzicht_v1"];
          for (const k of otherKeys) {
            try {
              const r = localStorage.getItem(k);
              if (r) { const p = JSON.parse(r); if (p?.signature) { sig = p.signature; break; } }
            } catch {}
          }
          if (!sig && saved?.signature) sig = saved.signature;
          if (sig) saveSharedSignature(sig);
        }
        setSharedSignature(sig);
      } catch {}
      setHydrated(true);
    })();
  }, []);

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

  // Real-time subscription — update form when data changes on another device
  useEffect(() => {
    if (!hydrated) return;
    return subscribe(STORAGE_KEY, (_key, data) => {
      setState(data as FormState);
    });
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    syncSave(STORAGE_KEY, state);
    saveSharedAddress({ nachname: state.nachname, vorname: state.vorname, strasse: state.strasse, plzOrt: state.plzOrt, geburtsdatum: state.geburtsdatum, telefon: state.telefon, email: state.email });
  }, [state, hydrated]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value })), []);

  // Auto-deselect payment when auszahlbetrag is 0 (full donation)
  useEffect(() => {
    if (!hydrated) return;
    if (state.verzicht) {
      // Auto-set spendenbetrag to verguetung when verzicht is checked
      if (state.spendenbetrag !== state.verguetung) {
        setState(prev => ({ ...prev, spendenbetrag: prev.verguetung }));
      }
      const v = parseFloat(state.verguetung) || 0;
      const s = parseFloat(state.verguetung) || 0;
      if (s > 0 && Math.max(0, v - s) === 0) {
        if (state.zahlungBar || state.zahlungUeberweisung) {
          setState(prev => ({ ...prev, zahlungBar: false, zahlungUeberweisung: false }));
        }
      }
    } else {
      if (state.spendenbetrag) {
        setState(prev => ({ ...prev, spendenbetrag: "" }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.verzicht, state.verguetung, hydrated]);

  if (!hydrated) return null;

  const verguetungNum = parseFloat(state.verguetung) || 0;
  const spendeNum = parseFloat(state.spendenbetrag) || 0;
  const jahrNum = parseInt(state.jahr) || new Date().getFullYear();
  const limit = getEhrenamtLimit(jahrNum);
  const limitExceeded = verguetungNum > limit;
  const auszahlbetrag = Math.max(0, verguetungNum - spendeNum);
  const spendeWithinLimit = state.verzicht && spendeNum > 0 && spendeNum <= limit;

  const multiSelected = selectedIds.length > 1;
  const allChecks: { label: string; valid: boolean }[] = [
    ...(multiSelected ? [
      { label: "Adressbuch", valid: selectedIds.length > 0 },
    ] : [
      { label: "Nachname", valid: !!state.nachname },
      { label: "Vorname", valid: !!state.vorname },
      { label: "Strasse", valid: !!state.strasse },
      { label: "PLZ / Ort", valid: !!state.plzOrt },
      { label: "Geburtsdatum", valid: !!state.geburtsdatum },
      { label: "Telefon", valid: !!state.telefon },
      { label: "E-Mail", valid: !!state.email },
    ]),
    { label: "Abteilung", valid: !!state.abteilung },
    { label: "Funktion", valid: !!state.funktion },
    ...(verguetungNum > 0 ? [
      { label: `Vergütung \u2264 ${limit} \u20ac`, valid: !limitExceeded },
    ] : []),
    ...(state.verzicht ? [
      { label: "Spendenbetrag", valid: spendeNum > 0 },
    ] : []),
    ...(auszahlbetrag === 0 && state.verzicht && spendeWithinLimit ? [] : [
      { label: "Zahlungsart", valid: multiSelected || state.zahlungBar || state.zahlungUeberweisung },
      ...(state.zahlungUeberweisung && !multiSelected ? [{ label: "IBAN", valid: validateIban(state.iban) }] : []),
    ]),
  ];
  const missing = allChecks.filter(c => !c.valid);
  const isComplete = missing.length === 0;

  const city = state.plzOrt.replace(/^[\d\s]+/, "").replace(/[^a-zA-ZäöüÄÖÜß\s-]/g, "").trim() || "_______________";
  const today = new Date().toLocaleDateString("de-DE");
  const defaultDate = [city, today].filter(s => s !== "_______________" && s !== "").join(", ");

  const fieldCls = "w-full bg-transparent border-b px-1 py-0.5 text-sm focus:outline-none transition-colors";
  function fieldBorder(value: string, required?: boolean, invalid?: boolean) {
    if ((required && !value) || invalid) return "border-[#b11217] focus:border-[#b11217]";
    return "border-gray-300 focus:border-[#b11217]";
  }

  const buildDocsForState = async (s: FormState) => {
    const React = (await import("react")).default;
    const { Document } = await import("@react-pdf/renderer");
    const { EhrenamtspauschaleDoc } = await import("@/lib/pdf-ehrenamt");
    const { VerzichtDoc } = await import("@/lib/pdf-forms");
    const dateValue = s.overrideDate !== null ? s.overrideDate : defaultDate;
    const docs: { doc: React.ReactElement; filename: string }[] = [];
    docs.push({
      doc: <Document><EhrenamtspauschaleDoc state={s} dateValue={dateValue} limit={limit} /></Document>,
      filename: buildPdfFilename("ehrenamtspauschale", s.vorname, s.nachname),
    });
    if (s.verzicht && (parseFloat(s.spendenbetrag) || 0) > 0) {
      docs.push({
        doc: <Document><VerzichtDoc state={{ nachname: s.nachname, vorname: s.vorname, strasse: s.strasse, plzOrt: s.plzOrt, jahr: s.jahr, betrag: s.verguetung, spendenbetrag: s.spendenbetrag || s.verguetung, signature: s.signature }} dateValue={dateValue} /></Document>,
        filename: buildPdfFilename("ehrenamtspauschale-verzicht", s.vorname, s.nachname),
      });
    }
    return docs;
  };

  const buildDocs = () => buildDocsForState(state);

  const buildAllDocs = async () => {
    const selected = getSelectedAddresses();
    if (selected.length === 0) return buildDocs();
    const docs: Awaited<ReturnType<typeof buildDocs>> = [];
    for (const addr of selected) {
      const s2: FormState = { ...state, nachname: addr.nachname, vorname: addr.vorname, strasse: addr.strasse, plzOrt: addr.plzOrt, geburtsdatum: addr.geburtsdatum, telefon: addr.telefon, email: addr.email };
      docs.push(...await buildDocsForState(s2));
    }
    return docs;
  };

  const handleDownload = async () => {
    const { downloadMultiplePdfs } = await import("@/lib/pdf");
    const docs = await buildAllDocs();
    const blobs = await downloadMultiplePdfs(docs, buildPdfFilename("ehrenamtspauschale", state.vorname, state.nachname), combined);

    try {
      const pdfBlobs = blobs.map(b => ({ blob: b.blob, title: "ehrenamtspauschale", vorname: state.vorname, nachname: state.nachname }));
      await uploadPdfAndSaveVersion(STORAGE_KEY, state, pdfBlobs, `PDF Export – ${new Date().toLocaleDateString("de-DE")}`);
    } catch {}
  };

  // Year options: current year +/- 2
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="ehrenamtspauschale-form px-1" ref={contentRef}>
      {/* Page headline */}
      <div className="flex items-center justify-between mb-3 print:hidden">
        <h1 className="text-2xl font-bold text-[#b11217]">Ehrenamtspauschale</h1>
        <div className="hidden md:flex items-center gap-2">
          <DownloadButton
            filename={buildPdfFilename("ehrenamtspauschale", state.vorname, state.nachname)}
            disabled={!isComplete}
            missingCount={missing.length}
            checks={allChecks}
            side="bottom"
            onDownload={handleDownload}
          />
          <SubmitButton formType="ehrenamtspauschale" getFormData={() => state} getPdfBlobs={async () => { const { renderPdfBlobs } = await import("@/lib/pdf"); return renderPdfBlobs(await buildDocs()); }} />
        </div>
      </div>

      {/* Header: context + personal data */}
      <FormHeader
        title="Ehrenamtspauschale"
        onAddressBook={() => setShowAddressBook(true)}
        addressBookCount={selectedIds.length}
        selectedAddresses={selectedIds.length > 1 ? getSelectedAddresses().map(a => ({ vorname: a.vorname, nachname: a.nachname, plzOrt: a.plzOrt })) : undefined}
        contextFields={[
          {
            label: "Jahr",
            printValue: state.jahr,
            value: state.jahr,
            required: true,
            content: (
              <select
                value={state.jahr}
                onChange={e => set("jahr", e.target.value)}
                className={`${fieldCls} border-gray-300 focus:border-[#b11217]`}
              >
                {yearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            ),
          },
          {
            label: "Abteilung",
            printValue: state.abteilung,
            value: state.abteilung,
            required: true,
            content: (
              <AbteilungSelect value={state.abteilung} onChange={v => set("abteilung", v)} />
            ),
          },
          {
            label: "Funktion / Tätigkeit",
            printValue: state.funktion,
            value: state.funktion,
            required: true,
            content: (
              <input
                type="text"
                value={state.funktion}
                onChange={e => set("funktion", e.target.value)}
                placeholder="z.B. Trainer, Betreuer, Platzwart"
                className={`${fieldCls} ${fieldBorder(state.funktion, true)}`}
              />
            ),
          },
          {
            label: `Vergütung pauschal (max. ${limit} \u20ac)`,
            printValue: state.verguetung ? `${state.verguetung} \u20ac` : "",
            value: state.verguetung,
            required: true,
            content: (
              <div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={state.verguetung}
                  onChange={e => set("verguetung", e.target.value)}
                  placeholder="0,00"
                  className={`${fieldCls} ${limitExceeded ? "border-[#b11217] text-[#b11217] focus:border-[#b11217]" : fieldBorder(state.verguetung, true)}`}
                />
                {limitExceeded && (
                  <p className="text-[10px] text-[#b11217] mt-1 leading-tight">
                    Freibetrag von {limit} € ({state.jahr}) überschritten
                  </p>
                )}
              </div>
            ),
          },
        ]}
        personalFields={[
          { label: "Nachname", key: "nachname", value: state.nachname, onChange: v => set("nachname", v), required: true },
          { label: "Vorname", key: "vorname", value: state.vorname, onChange: v => set("vorname", v), required: true },
          { label: "Strasse, Hausnummer", key: "strasse", value: state.strasse, onChange: v => set("strasse", v), required: true },
          { label: "PLZ, Ort", key: "plzOrt", value: state.plzOrt, onChange: v => set("plzOrt", v), required: true },
          { label: "Geburtsdatum", key: "geburtsdatum", type: "date", value: state.geburtsdatum, onChange: v => set("geburtsdatum", v), required: true },
          { label: "Telefon", key: "telefon", type: "tel", value: state.telefon, onChange: v => set("telefon", v), required: true },
          { label: "E-Mail", key: "email", type: "email", value: state.email, onChange: v => set("email", v), required: true },
        ]}
      />

      {/* Legal declaration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">
          Erklärung zur Ehrenamtspauschale
        </div>
        <div className="p-4 text-sm text-gray-700 space-y-4 leading-relaxed">
          <p className="text-sm text-gray-700">
            Erklärung für die nebenberufliche Vereinsbeschäftigung bei Berücksichtigung des Ehrenamtsfreibetrages nach
            § 3 Nr. 26a EStG. Der TGV &quot;Eintracht&quot; Beilstein 1823 e. V., Albert-Einstein-Str. 20, 71717 Beilstein wird folgende
            Erklärung zum Ehrenamtsfreibetrag nach § 3 Nr. 26a EStG abgegeben:
          </p>
          <p>
            Der/Die nach den gesetzlichen Vorgaben gewählte Vereinsmitarbeiter/in ist ehrenamtlich in der Funktion als{" "}
            <span className="font-bold text-gray-900">{state.funktion || "_______________"}</span>{" "}
            in der Abteilung{" "}
            <span className="font-bold text-gray-900">{state.abteilung || "_______________"}</span>{" "}
            im Rahmen der satzungsmässigen und gemeinnützigen Aufgabenstellung des Vereins tätig.
            Der hierfür geleisteten Aufwandsentschädigung liegt eine Vergütung in Höhe von{" "}
            <span className="font-bold text-gray-900">{state.verguetung || "____"} Euro</span>{" "}
            pauschal zu Grunde.
          </p>
          <p>
            Hiermit erkläre ich die Ehrenamtspauschale nach § 3 Nr. 26a EStG im Kalenderjahr {state.jahr} noch nicht in Anspruch
            genommen zu haben, <span className="font-bold underline">bzw. nicht anderweitig in Anspruch nehmen werde</span>.
            Mir ist bekannt, dass Nachteile des Vereins zu meinen Lasten gehen.
          </p>
        </div>
      </div>

      {/* Verzicht checkbox */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 print:hidden">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">
          Verzicht auf Auszahlung
        </div>
        <div className="p-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={state.verzicht}
              onChange={e => set("verzicht", e.target.checked)}
              className="w-5 h-5 shrink-0 accent-[#b11217]"
            />
            <span className="text-sm font-medium text-gray-800 group-hover:text-[#b11217] transition-colors">
              Ich verzichte auf die Auszahlung der Ehrenamtspauschale
            </span>
          </label>
        </div>
      </div>

      {/* Auszahlbetrag & Zahlung */}
      {!state.verzicht && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">Auszahlbetrag &amp; Zahlung</div>
        <div className="p-4 text-sm space-y-2">
        {auszahlbetrag === 0 && state.verzicht && spendeWithinLimit ? (
          <p className="text-green-700 text-sm font-medium">
            Vielen Dank für Ihre Spende in Höhe von {spendeNum.toFixed(2)} € an den Verein!
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
          Auszahlbetrag bitte überweisen auf nachfolgende Bankverbindung
        </label>
        {state.zahlungUeberweisung && (
          <div className="ml-6">
            <div className="flex items-center gap-2">
              <span className={`shrink-0 text-xs flex items-center gap-0.5 ${!validateIban(state.iban) ? "text-[#b11217]" : "text-gray-500"}`}>
                IBAN:{!validateIban(state.iban) && <span className="leading-none">*</span>}
              </span>
              <input type="text" value={state.iban} onChange={e => set("iban", e.target.value.toUpperCase())}
                placeholder="DE00 0000 0000 0000 0000 00"
                className={`flex-1 print:hidden ${fieldCls} ${state.iban === "" ? "border-gray-300 focus:border-[#b11217]" : validateIban(state.iban) ? "border-green-500 text-green-700 focus:border-green-500" : "border-[#b11217] text-[#b11217] focus:border-[#b11217]"} uppercase`} />
              <span className="hidden print:inline text-sm uppercase">{state.iban}</span>
              {state.iban !== "" && (
                <span className={`shrink-0 text-xs ${validateIban(state.iban) ? "text-green-600" : "text-[#b11217]"}`}>
                  {validateIban(state.iban) ? "\u2713" : "\u2717"}
                </span>
              )}
            </div>
          </div>
        )}
          </>
        )}
        </div>
      </div>
      )}

      {/* Signature section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="p-4 text-sm space-y-6">
          {/* Row 1: Ort, Datum + Unterschrift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-4 text-xs text-gray-400">
            <div className="flex flex-col">
              <div className="flex-1 border-0 min-h-[3rem] print:min-h-0 flex items-end pb-1 text-gray-700 font-medium">
                <div className="flex-1 flex items-center gap-1 group">
                  <input type="text"
                    id="sig-date-input-ea"
                    value={state.overrideDate !== null ? state.overrideDate : defaultDate}
                    onChange={e => set("overrideDate", e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none p-0 m-0 focus:ring-0 print:hidden" />
                  <div className="flex items-center gap-0.5 print:hidden">
                    {state.overrideDate !== null && (
                      <button type="button" onClick={() => set("overrideDate", null)}
                        className="p-1 text-gray-300 hover:text-[#b11217] transition-colors" title="Zurücksetzen">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                    <button type="button" onClick={() => document.getElementById("sig-date-input-ea")?.focus()}
                      className="p-1 text-gray-300 hover:text-[#b11217] transition-colors" title="Bearbeiten">
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
                  &#10003; Einwilligung zur digitalen Unterschrift erteilt
                </div>
              )}
              <div className="flex-1 border-0 min-h-[3rem] print:min-h-0 flex flex-col justify-end">
                {state.signature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.signature} alt="Unterschrift" onClick={() => setShowSignModal(true)}
                    style={{ height: 56, width: "auto", imageRendering: "auto", objectFit: "contain" }}
                    className="cursor-pen hover:opacity-80 transition-opacity print:cursor-default"
                    title="Klicken zum Bearbeiten" />
                ) : (
                  <button onClick={() => setShowSignModal(true)}
                    className="mb-1 w-full px-3 py-2 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors print:hidden">
                    Unterschreiben
                  </button>
                )}
              </div>
              <div className="mt-1 print:mt-0 border-t border-gray-400 pt-1">Unterschrift</div>
            </div>
          </div>

          {/* Row 2: Ort, Datum + Abteilungsleiter (print/PDF only) */}
          <div className="hidden print:grid grid-cols-2 gap-x-8 gap-y-4 text-xs text-gray-400">
            <div className="flex flex-col">
              <div className="flex-1 border-0 min-h-[3rem]" />
              <div className="border-t border-gray-400 pt-1">Ort, Datum</div>
            </div>
            <div className="flex flex-col">
              <div className="flex-1 border-0 min-h-[3rem]" />
              <div className="border-t border-gray-400 pt-1">Abteilungsleiter</div>
            </div>
          </div>

          {/* Row 3: Ort, Datum + 1. Vorsitzender (print/PDF only) */}
          <div className="hidden print:grid grid-cols-2 gap-x-8 gap-y-4 text-xs text-gray-400">
            <div className="flex flex-col">
              <div className="flex-1 border-0 min-h-[3rem]" />
              <div className="border-t border-gray-400 pt-1">Ort, Datum</div>
            </div>
            <div className="flex flex-col">
              <div className="flex-1 border-0 min-h-[3rem]" />
              <div className="border-t border-gray-400 pt-1">1. Vorsitzender</div>
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

      <AddressBookModal
        open={showAddressBook}
        onCancel={() => setShowAddressBook(false)}
        onClose={() => {
          setShowAddressBook(false);
          refreshSelection();
          const sel = getSelectedAddresses();
          if (sel.length === 1) {
            const a = sel[0];
            setState(s => ({ ...s, nachname: a.nachname, vorname: a.vorname, strasse: a.strasse, plzOrt: a.plzOrt, geburtsdatum: a.geburtsdatum, telefon: a.telefon, email: a.email }));
          }
        }}
        current={{ nachname: state.nachname, vorname: state.vorname, strasse: state.strasse, plzOrt: state.plzOrt, geburtsdatum: state.geburtsdatum, telefon: state.telefon, email: state.email }}
      />

      {/* Footer actions */}
      <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-2 print:hidden mt-2 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { localStorage.removeItem(STORAGE_KEY); setState(defaultState()); }}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs hover:bg-red-100 transition-colors"
          >
            Formular zurücksetzen
          </button>
          <button onClick={() => window.print()}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5V1h8v4"/><rect x="1" y="5" width="12" height="6" rx="1"/><path d="M3 11v2h8v-2"/><circle cx="10.5" cy="8" r="0.5" fill="currentColor"/>
            </svg>
            Drucken
          </button>
        </div>
        {(() => {
          const docsPerPerson = state.verzicht && spendeNum > 0 ? 2 : 1;
          const people = selectedIds.length > 0 ? selectedIds.length : 1;
          const totalDocs = people * docsPerPerson;
          return (
            <div className="flex items-center gap-2">
              {totalDocs > 1 && (
                <label className="inline-flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer select-none">
                  <span className={`relative inline-block w-7 h-4 rounded-full transition-colors ${combined ? "bg-[#b11217]" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${combined ? "translate-x-3" : ""}`} />
                  </span>
                  <input type="checkbox" checked={combined} onChange={e => setCombined(e.target.checked)} className="sr-only" />
                  PDF Dateien zusammenfassen
                </label>
              )}
              <DownloadButton
                filename={buildPdfFilename("ehrenamtspauschale", state.vorname, state.nachname)}
                disabled={!isComplete}
                missingCount={missing.length}
                checks={allChecks}
                side="top"
                count={!combined && totalDocs > 1 ? totalDocs : undefined}
                onDownload={handleDownload}
              />
            </div>
          );
        })()}
        <SubmitButton formType="ehrenamtspauschale" getFormData={() => state} getPdfBlobs={async () => { const { renderPdfBlobs } = await import("@/lib/pdf"); return renderPdfBlobs(await buildDocs()); }} />
      </div>

      {/* PDF footer (single, at the very bottom of main form) */}
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

      {/* Verzicht page (hidden, rendered for PDF capture only) */}
      {state.verzicht && spendeNum > 0 && (
        <div className="hidden print:block print:break-before-page mt-12 pt-12" data-page-break="verzicht">
          <div style={{ height: "60px" }} className="print:hidden" />
          <div className="verzicht-capture-root">
            <VerzichtPageContent
              state={{
                nachname: state.nachname,
                vorname: state.vorname,
                strasse: state.strasse,
                plzOrt: state.plzOrt,
                geburtsdatum: state.geburtsdatum,
                telefon: state.telefon,
                email: state.email,
                jahr: state.jahr,
                betrag: state.verguetung || "0,00",
                spendenbetrag: state.spendenbetrag || "0,00",
                signature: state.signature,
              }}
              overrideDate={state.overrideDate}
              hideFooter
            />
          </div>
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
        </div>
      )}
    </div>
  );
}
