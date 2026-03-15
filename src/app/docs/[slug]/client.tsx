"use client";

import { useRef } from "react";
import PdfViewer, { PdfViewerHandle } from "@/app/_components/pdf-viewer";

type Props = {
  title: string;
  preface?: string;
  pdfUrl: string;
  filename: string;
};

export default function DocPageClient({ title, preface, pdfUrl, filename }: Props) {
  const viewerRef = useRef<PdfViewerHandle>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#b11217]">{title}</h1>
          {preface && <p className="mt-1 text-sm text-gray-500">{preface}</p>}
        </div>
        <button
          onClick={() => viewerRef.current?.download()}
          className="print:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          title="Herunterladen"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 1v8M4 6l3 3 3-3"/>
            <path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/>
          </svg>
          Herunterladen
        </button>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <PdfViewer ref={viewerRef} url={pdfUrl} filename={filename} />
      </section>
    </>
  );
}
