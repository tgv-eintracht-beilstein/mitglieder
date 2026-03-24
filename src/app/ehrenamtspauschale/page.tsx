"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import SignatureModal from "@/app/_components/signature-modal";
import FormHeader from "@/app/_components/form-header";
import DownloadButton from "@/app/_components/download-button";
import VerzichtPageContent from "@/app/_components/verzicht-page-content";
import { SHARED_ADDRESS_KEY, saveSharedAddress, loadSharedAddress, loadSharedSignature, saveSharedSignature } from "@/lib/sharedAddress";
import { buildPdfFilename } from "@/lib/pdfFilename";
import { validateIban } from "@/lib/iban";
import { AbteilungSelect } from "@/app/_components/aufwandsformular";

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
  signature: string;
  overrideDate: string;
}

function defaultState(): FormState {
  return {
    nachname: "", vorname: "", strasse: "", plzOrt: "",
    geburtsdatum: "", telefon: "", email: "",
    iban: "",
    abteilung: "", funktion: "", verguetung: "",
    jahr: String(new Date().getFullYear()),
    verzicht: false, spendenbetrag: "",
    signature: "", overrideDate: "",
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
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("pdf") === "1") {
        document.body.classList.add("pdf-capture");
      }
    }

    try {
      const addr = loadSharedAddress();
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) as FormState : null;
      setState(s => ({
        ...s,
        ...(saved ?? {}),
        nachname: addr.nachname, vorname: addr.vorname, strasse: addr.strasse,
        plzOrt: addr.plzOrt, geburtsdatum: addr.geburtsdatum, telefon: addr.telefon, email: addr.email,
        overrideDate: "",
      }));
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

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveSharedAddress({ nachname: state.nachname, vorname: state.vorname, strasse: state.strasse, plzOrt: state.plzOrt, geburtsdatum: state.geburtsdatum, telefon: state.telefon, email: state.email });
  }, [state, hydrated]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value })), []);

  if (!hydrated) return null;

  const verguetungNum = parseFloat(state.verguetung) || 0;
  const spendeNum = parseFloat(state.spendenbetrag) || 0;
  const jahrNum = parseInt(state.jahr) || new Date().getFullYear();
  const limit = getEhrenamtLimit(jahrNum);
  const limitExceeded = verguetungNum > limit;

  const allChecks: { label: string; valid: boolean }[] = [
    { label: "Nachname", valid: !!state.nachname },
    { label: "Vorname", valid: !!state.vorname },
    { label: "Strasse", valid: !!state.strasse },
    { label: "PLZ / Ort", valid: !!state.plzOrt },
    { label: "Geburtsdatum", valid: !!state.geburtsdatum },
    { label: "Telefon", valid: !!state.telefon },
    { label: "E-Mail", valid: !!state.email },
    { label: "IBAN", valid: validateIban(state.iban) },
    { label: "Abteilung", valid: !!state.abteilung },
    { label: "Funktion", valid: !!state.funktion },
    { label: "Vergütung", valid: verguetungNum > 0 },
    { label: `Vergütung \u2264 ${limit} \u20ac`, valid: !limitExceeded },
    { label: "Unterschrift", valid: !!state.signature },
    ...(state.verzicht ? [
      { label: "Spendenbetrag", valid: spendeNum > 0 },
    ] : []),
  ];
  const missing = allChecks.filter(c => !c.valid);
  const isComplete = missing.length === 0;

  const city = state.plzOrt.replace(/^[\d\s]+/, "").replace(/[^a-zA-ZäöüÄÖÜß\s-]/g, "").trim() || "_______________";
  const today = new Date().toLocaleDateString("de-DE");
  const defaultDate = [city, today].filter(s => s !== "_______________" && s !== "").join(", ");

  const fieldCls = "w-full bg-transparent border-b px-1 py-0.5 text-sm focus:outline-none";
  function fieldBorder(value: string, required?: boolean, invalid?: boolean) {
    if ((required && !value) || invalid) return "border-[#b11217] focus:border-[#b11217]";
    return "border-gray-300 focus:border-[#b11217]";
  }

  const handleDownload = async () => {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const iframeUrl = `${window.location.pathname}?pdf=1`;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:1050px;height:1px;border:0";
    document.body.appendChild(iframe);
    await new Promise<void>((resolve) => { iframe.onload = () => resolve(); iframe.src = iframeUrl; });
    await new Promise(r => setTimeout(r, state.verzicht ? 2000 : 1500));

    const iframeDoc = iframe.contentDocument!;
    const iframeBody = iframeDoc.body;
    iframeDoc.documentElement.classList.add("pdf-capture");

    await Promise.all(Array.from(iframeDoc.images).map(img =>
      img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
    ));

    iframe.style.height = iframeBody.scrollHeight + "px";
    await new Promise(r => setTimeout(r, 300));

    const fullCanvas = await html2canvas(iframeBody, {
      scale: 3, useCORS: true, logging: false, backgroundColor: "#ffffff",
      width: 1050, height: iframeBody.scrollHeight,
      windowWidth: 1050, windowHeight: iframeBody.scrollHeight,
    });

    const breakMarker = iframeBody.querySelector('[data-page-break="verzicht"]') as HTMLElement | null;
    const breakMarkerPx = breakMarker ? breakMarker.offsetTop * 3 : 0;

    const canvases: HTMLCanvasElement[] = [];
    const filenames: string[] = [];
    const mainFilename = buildPdfFilename("ehrenamtspauschale", state.vorname, state.nachname);

    if (state.verzicht && breakMarkerPx > fullCanvas.height * 0.15 && breakMarkerPx < fullCanvas.height * 0.95) {
      const canvas1 = document.createElement("canvas");
      canvas1.width = fullCanvas.width;
      canvas1.height = Math.floor(breakMarkerPx);
      const ctx1 = canvas1.getContext("2d");
      if (ctx1) {
        ctx1.fillStyle = "#ffffff";
        ctx1.fillRect(0, 0, canvas1.width, canvas1.height);
        ctx1.drawImage(fullCanvas, 0, 0, fullCanvas.width, breakMarkerPx, 0, 0, fullCanvas.width, breakMarkerPx);
      }
      canvases.push(canvas1);
      filenames.push(mainFilename);

      const remainingHeight = fullCanvas.height - breakMarkerPx;
      const canvas2 = document.createElement("canvas");
      canvas2.width = fullCanvas.width;
      canvas2.height = Math.floor(remainingHeight);
      const ctx2 = canvas2.getContext("2d");
      if (ctx2) {
        ctx2.fillStyle = "#ffffff";
        ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
        ctx2.drawImage(fullCanvas, 0, breakMarkerPx, fullCanvas.width, remainingHeight, 0, 0, fullCanvas.width, remainingHeight);
      }
      canvases.push(canvas2);
      filenames.push(buildPdfFilename("ehrenamtspauschale-verzicht", state.vorname, state.nachname));
    } else {
      canvases.push(fullCanvas);
      filenames.push(mainFilename);
    }

    document.body.removeChild(iframe);

    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];
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
      pdf.save(filenames[i]);
      if (i < canvases.length - 1) await new Promise(r => setTimeout(r, 500));
    }
  };

  // Year options: current year +/- 2
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="ehrenamtspauschale-form px-1" ref={contentRef}>
      {/* PDF-only page header */}
      <div className="pdf-only hidden items-center gap-3 mb-4 pb-3 border-b-2 border-gray-300">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tgv-logo.png" alt="TGV Logo" width={44} height={44} />
        <div className="flex-1">
          <div className="font-bold text-base text-gray-900">TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.V.</div>
          <div className="text-xs text-gray-500">Ehrenamtspauschale &middot; {state.abteilung || "\u2013"} &middot; {state.vorname} {state.nachname}</div>
        </div>
      </div>

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
            count={state.verzicht ? 2 : 1}
            onDownload={handleDownload}
          />
        </div>
      </div>

      {/* Header: context + personal data */}
      <FormHeader
        title="Ehrenamtspauschale"
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
                    Freibetrag von {limit} &euro; ({state.jahr}) überschritten
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

      {/* Bankverbindung */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">Bankverbindung</div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`shrink-0 text-xs flex items-center gap-0.5 ${!validateIban(state.iban) ? "text-[#b11217]" : "text-gray-500"}`}>
              IBAN{!validateIban(state.iban) && <span className="leading-none">*</span>}
            </span>
            <input type="text" value={state.iban} onChange={e => set("iban", e.target.value.toUpperCase())}
              placeholder="DE00 0000 0000 0000 0000 00"
              className={`flex-1 ${fieldCls} ${state.iban === "" ? "border-gray-300 focus:border-[#b11217]" : validateIban(state.iban) ? "border-green-500 text-green-700 focus:border-green-500" : "border-[#b11217] text-[#b11217] focus:border-[#b11217]"} uppercase`} />
            {state.iban !== "" && (
              <span className={`shrink-0 text-xs ${validateIban(state.iban) ? "text-green-600" : "text-[#b11217]"}`}>
                {validateIban(state.iban) ? "\u2713" : "\u2717"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Legal declaration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">
          Erklärung zur Ehrenamtspauschale
        </div>
        <div className="p-4 text-sm text-gray-700 space-y-4 leading-relaxed">
          <p className="text-xs text-gray-500 italic">
            Erklärung für die nebenberufliche Vereinsbeschäftigung bei Berücksichtigung des Ehrenamtsfreibetrages nach
            &sect; 3 Nr. 26a EStG. Der TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e. V., Albert-Einstein-Str. 20, 71717 Beilstein wird folgende
            Erklärung zum Ehrenamtsfreibetrag nach &sect; 3 Nr. 26a EStG abgegeben:
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
            Hiermit erkläre ich die Ehrenamtspauschale nach &sect; 3 Nr. 26a EStG im Kalenderjahr {state.jahr} noch nicht in Anspruch
            genommen zu haben, <span className="font-bold underline">bzw. nicht anderweitig in Anspruch nehmen werde</span>.
            Mir ist bekannt, dass Nachteile des Vereins zu meinen Lasten gehen.
          </p>
        </div>
      </div>

      {/* Signature section - matches PNG layout: 3 rows of 2 columns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
        <div className="p-4 text-sm space-y-6">
          {/* Row 1: Ort, Datum + Unterschrift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-4 text-xs text-gray-400">
            <div className="flex flex-col">
              <div className="flex-1 border-0 min-h-[3rem] print:min-h-0 flex items-end pb-1 text-gray-700 font-medium">
                <div className="flex-1 flex items-center gap-1 group">
                  <input type="text"
                    id="sig-date-input-ea"
                    value={state.overrideDate !== "" ? state.overrideDate : defaultDate}
                    onChange={e => set("overrideDate", e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none p-0 m-0 focus:ring-0 print:hidden" />
                  <div className="flex items-center gap-0.5 print:hidden">
                    {state.overrideDate !== "" && (
                      <button type="button" onClick={() => set("overrideDate", "")}
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
                    {state.overrideDate !== "" ? state.overrideDate : defaultDate}
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
                    className="max-h-14 w-auto object-contain cursor-pen hover:opacity-80 transition-opacity print:cursor-default"
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

          {/* Row 2: Ort, Datum + Abteilungsleiter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-4 text-xs text-gray-400">
            <div className="flex flex-col">
              <div className="flex-1 border-0 min-h-[3rem] print:min-h-0" />
              <div className="mt-1 print:mt-0 border-t border-gray-400 pt-1">Ort, Datum</div>
            </div>
            <div className="flex flex-col">
              <div className="flex-1 border-0 min-h-[3rem] print:min-h-0" />
              <div className="mt-1 print:mt-0 border-t border-gray-400 pt-1">Abteilungsleiter</div>
            </div>
          </div>

          {/* Row 3: Ort, Datum + 1. Vorsitzender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-4 text-xs text-gray-400">
            <div className="flex flex-col">
              <div className="flex-1 border-0 min-h-[3rem] print:min-h-0" />
              <div className="mt-1 print:mt-0 border-t border-gray-400 pt-1">Ort, Datum</div>
            </div>
            <div className="flex flex-col">
              <div className="flex-1 border-0 min-h-[3rem] print:min-h-0" />
              <div className="mt-1 print:mt-0 border-t border-gray-400 pt-1">1. Vorsitzender</div>
            </div>
          </div>
        </div>
      </div>

      {/* Verzicht checkbox */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 print:hidden">
        <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">
          Verzicht auf Auszahlung
        </div>
        <div className="p-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={state.verzicht}
              onChange={e => set("verzicht", e.target.checked)}
              className="w-5 h-5 mt-0.5 shrink-0 accent-[#b11217]"
            />
            <div>
              <span className="text-sm font-medium text-gray-800 group-hover:text-[#b11217] transition-colors">
                Ich verzichte auf die Auszahlung der Ehrenamtspauschale
              </span>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                Bei Aktivierung wird zusätzlich eine Verzichtserklärung erzeugt. Beide Dokumente werden beim Download als separate PDFs erstellt.
              </p>
            </div>
          </label>

          {state.verzicht && (
            <div className="ml-8 mt-2">
              <div className="text-[10px] mb-0.5 flex items-center gap-0.5">
                <span className={spendeNum <= 0 ? "text-[#b11217]" : "text-gray-400"}>Spendenbetrag (Euro)</span>
                {spendeNum <= 0 && <span className="text-[#b11217] leading-none">*</span>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={state.spendenbetrag}
                  onChange={e => set("spendenbetrag", e.target.value)}
                  placeholder="0,00"
                  className={`w-40 ${fieldCls} ${fieldBorder(state.spendenbetrag, true)}`}
                />
                <button type="button"
                  onClick={() => set("spendenbetrag", state.verguetung)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-700 border border-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors whitespace-nowrap"
                  title="Spendenbetrag auf Vergütung setzen"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/></svg>
                  Aufwand spenden
                </button>
              </div>
            </div>
          )}
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
        <DownloadButton
          filename={buildPdfFilename("ehrenamtspauschale", state.vorname, state.nachname)}
          disabled={!isComplete}
          missingCount={missing.length}
          checks={allChecks}
          side="top"
          count={state.verzicht ? 2 : 1}
          onDownload={handleDownload}
        />
      </div>

      {/* Verzicht page (hidden, rendered for PDF capture only) */}
      {state.verzicht && spendeNum > 0 && (
        <div className="hidden print:block print:break-before-page border-t border-gray-200 mt-12 pt-12" data-page-break="verzicht">
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
        </div>
      )}

      {/* PDF footer (single, at the very bottom) */}
      <div className="pdf-footer hidden mt-10 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-6 text-[9px] leading-relaxed text-gray-400">
          <div className="space-y-1">
            <p className="font-bold text-gray-600 tracking-wider">KONTAKT</p>
            <p>Albert-Einstein-Str. 20 &middot; 71717 Beilstein</p>
            <p>Tel. +49 (0) 7062 5753</p>
            <p>info@tgveintrachtbeilstein.de</p>
            <p>www.tgveintrachtbeilstein.de</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-gray-600 tracking-wider">VEREINSDATEN</p>
            <p>Steuer-Nr. 65208/49689</p>
            <p>Amtsgericht Stuttgart &middot; VR 101009</p>
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
  );
}
