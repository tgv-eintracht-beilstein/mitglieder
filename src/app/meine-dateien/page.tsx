"use client";

import { useEffect, useState, useRef } from "react";
import { getTokens, callApi } from "@/lib/auth";
import { uploadFile } from "@/lib/form-api";
import PdfViewer from "@/app/_components/pdf-viewer";

type FileEntry = { key: string; name: string; size: number; lastModified: string };

function formatSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export default function MeineDateienPage() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [tokens, setTokens] = useState<ReturnType<typeof getTokens> | null | undefined>(undefined);

  async function load() {
    setLoading(true);
    try {
      const data = await callApi("/files");
      setFiles(data);
    } catch { setFiles([]); }
    setLoading(false);
  }

  useEffect(() => {
    const t = getTokens();
    setTokens(t);
    if (t) load();
    else setLoading(false);
  }, []);

  async function handlePreview(file: FileEntry) {
    const { url } = await callApi(`/file?key=${encodeURIComponent(file.key)}`);
    setPreview({ name: file.name, url });
  }

  async function handleDelete(file: FileEntry) {
    if (!confirm(`„${file.name}" wirklich löschen?`)) return;
    setDeleting(file.key);
    try {
      await callApi("/file", { method: "DELETE", body: JSON.stringify({ key: file.key }) });
      setFiles((f) => f.filter((x) => x.key !== file.key));
      if (preview?.name === file.name) setPreview(null);
    } catch (e) { alert("Löschen fehlgeschlagen"); }
    setDeleting(null);
  }

  const ACCEPT = "application/pdf,image/png,image/jpeg";
  const MAX_SIZE = 10 * 1024 * 1024;

  async function handleUpload() {
    const input = fileRef.current;
    if (!input?.files?.length) return;
    for (const f of Array.from(input.files)) {
      if (f.size > MAX_SIZE) { alert(`„${f.name}" ist zu groß (max. 10 MB).`); return; }
    }
    setUploading(true);
    try {
      for (const file of Array.from(input.files)) {
        await uploadFile(new Blob([await file.arrayBuffer()], { type: file.type }), file.name, file.type);
      }
      input.value = "";
      await load();
    } catch { alert("Upload fehlgeschlagen"); }
    setUploading(false);
  }

  if (tokens === undefined) {
    return <p className="text-center text-gray-500 mt-20">Laden…</p>;
  }

  if (!tokens) {
    return <p className="text-center text-gray-500 mt-20">Bitte zuerst anmelden.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meine Dateien</h1>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#b11217] text-white text-sm font-medium hover:bg-[#8e0f13] disabled:opacity-50 transition-colors"
          >
            {uploading ? "Lädt…" : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 11V3M4 6l3-3 3 3"/><path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/>
                </svg>
                Hochladen
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Laden…</p>
      ) : files.length === 0 ? (
        <p className="text-gray-500 text-sm">Keine Dateien vorhanden.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {files.map((file) => (
            <div key={file.key} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400 shrink-0">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <div className="min-w-0 flex-1">
                <button onClick={() => handlePreview(file)} className="text-sm font-medium text-gray-900 hover:text-[#b11217] truncate block max-w-full text-left transition-colors">
                  {file.name}
                </button>
                <div className="text-xs text-gray-500">
                  {formatSize(file.size)} · {new Date(file.lastModified).toLocaleDateString("de-DE")}
                </div>
              </div>
              <button
                onClick={() => handlePreview(file)}
                className="text-xs text-gray-500 hover:text-[#b11217] transition-colors shrink-0"
                title="Vorschau"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              <button
                onClick={() => handleDelete(file)}
                disabled={deleting === file.key}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors shrink-0 disabled:opacity-50"
                title="Löschen"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <span className="font-semibold text-gray-900 truncate">{preview.name}</span>
              <button onClick={() => setPreview(null)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <PdfViewer url={preview.url} filename={preview.name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
