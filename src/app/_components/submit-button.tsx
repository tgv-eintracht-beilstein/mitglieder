"use client";

import { useState, useEffect, useRef } from "react";
import { getUsername } from "@/lib/auth";
import { callApi } from "@/lib/auth";
import { uploadPdf, submitForm } from "@/lib/form-api";
import PdfViewer from "./pdf-viewer";

interface Props {
  formType: string;
  getFormData: () => unknown;
  getPdfBlobs: () => Promise<{ blob: Blob; filename: string }[]>;
  disabled?: boolean;
  missingCount?: number;
  checks?: { label: string; valid: boolean }[];
  onDownload?: () => Promise<void>;
  side?: "top" | "bottom";
}

type UploadedFile = { key: string; filename: string };

export default function SubmitButton({ formType, getFormData, getPdfBlobs, disabled: disabledProp, missingCount, checks, onDownload, side = "bottom" }: Props) {
  const [user, setUser] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ top: 0, bottom: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setUser(getUsername()); }, []);

  if (!user) return null;

  function handleMouseEnter() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const tooltipW = 288;
      const distFromRight = window.innerWidth - r.right;
      let finalRight = distFromRight;
      if (window.innerWidth - finalRight - tooltipW < 8) finalRight = window.innerWidth - tooltipW - 8;
      if (finalRight < 8) finalRight = 8;
      if (side === "top") setPos({ top: 0, bottom: window.innerHeight - r.top + 6, right: finalRight });
      else setPos({ top: r.bottom + 6, bottom: 0, right: finalRight });
    }
    setHovered(true);
  }

  async function handleVorschau() {
    setUploading(true);
    try {
      const blobs = await getPdfBlobs();
      const uploaded: UploadedFile[] = [];
      for (const b of blobs) {
        const key = await uploadPdf(b.blob, b.filename);
        uploaded.push({ key, filename: b.filename });
      }
      setFiles(uploaded);
      if (uploaded.length > 0) await handlePreview(uploaded[0]);
    } catch (e) {
      console.error(e);
      alert("Fehler beim Hochladen. Bitte versuchen Sie es erneut.");
    } finally {
      setUploading(false);
    }
  }

  async function handlePreview(file: UploadedFile) {
    const { url } = await callApi(`/file?key=${encodeURIComponent(file.key)}`);
    setPreview({ name: file.filename, url });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitForm(formType, getFormData(), files.map((f) => f.key));
      setFiles([]);
      setPreview(null);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Fehler beim Absenden. Bitte versuchen Sie es erneut.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownloadClick() {
    if (!onDownload) return;
    setDownloading(true);
    try { await onDownload(); } catch (e) { console.error(e); } finally { setDownloading(false); }
  }

  const sorted = checks ? [...checks].sort((a, b) => (a.valid === b.valid ? 0 : a.valid ? 1 : -1)) : [];

  return (
    <>
      <div className="relative inline-flex w-full md:w-auto" onMouseEnter={handleMouseEnter} onMouseLeave={() => setHovered(false)}>
        {hovered && disabledProp && sorted.length > 0 && (
          <div className="fixed z-[300] w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 print:hidden"
            style={{ top: side === "bottom" ? pos.top : "auto", bottom: side === "top" ? pos.bottom : "auto", right: pos.right }}>
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
          onClick={handleVorschau}
          disabled={uploading || done || disabledProp}
          className="shrink-0 w-full justify-center flex items-center gap-1.5 px-5 py-3 text-base bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap overflow-hidden text-ellipsis md:w-auto md:py-2.5 md:text-sm"
        >
          {uploading ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="7" cy="7" r="5" strokeOpacity="0.3"/>
                <path d="M7 2a5 5 0 015 5" strokeLinecap="round"/>
              </svg>
              Erstelle PDFs…
            </>
          ) : done ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Gesendet ✓
            </>
          ) : disabledProp && missingCount ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <span>{missingCount} {missingCount === 1 ? "Pflichtfeld fehlt" : "Pflichtfelder fehlen"}</span>
              <span className="ml-1 bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{missingCount}</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Vorschau &amp; Absenden
            </>
          )}
        </button>
      </div>

      {files.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/50 md:flex md:items-center md:justify-center md:p-4" onClick={() => { setFiles([]); setPreview(null); }}>
          <div className="bg-white h-full md:h-auto md:rounded-2xl md:shadow-2xl w-full md:max-w-5xl md:max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <span className="font-semibold text-gray-900">Vorschau – {files.length} {files.length === 1 ? "Datei" : "Dateien"}</span>
              <button onClick={() => { setFiles([]); setPreview(null); }} className="text-gray-400 hover:text-gray-700 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
              <div className="shrink-0 border-b md:border-b-0 md:border-r border-gray-100 overflow-auto divide-y divide-gray-100 md:w-64">
                {files.map((file) => (
                  <button
                    key={file.key}
                    onClick={() => handlePreview(file)}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-left text-sm transition-colors ${preview?.name === file.filename ? "bg-red-50 text-[#b11217]" : "text-gray-900 hover:bg-gray-50"}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-red-400">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span className="truncate">{file.filename}</span>
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-auto p-4 bg-gray-50">
                {preview ? (
                  <PdfViewer url={preview.url} filename={preview.name} />
                ) : (
                  <p className="text-sm text-gray-400 text-center mt-20">Datei auswählen für Vorschau</p>
                )}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
              {onDownload && (
                <button
                  onClick={handleDownloadClick}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-60"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 1v8M4 6l3 3 3-3"/><path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/>
                  </svg>
                  {downloading ? "Lädt…" : "PDF herunterladen"}
                </button>
              )}
              <div className="flex-1" />
              <button onClick={() => { setFiles([]); setPreview(null); }} className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                Abbrechen
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                </svg>
                {submitting ? "Sende…" : "Absenden"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
