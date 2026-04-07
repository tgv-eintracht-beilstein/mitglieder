"use client";

import { useState } from "react";

export default function DownloadPageButton({ filename }: { filename: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const { downloadPdf } = await import("@/lib/pdf");
      const { MitgliedsbeitraegeDoc } = await import("@/lib/pdf-mitgliedsbeitraege");
      const React = (await import("react")).default;
      await downloadPdf(React.createElement(MitgliedsbeitraegeDoc), filename);
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
      className="flex items-center gap-1.5 px-5 py-2.5 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors font-medium disabled:opacity-60 whitespace-nowrap"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 1v8M4 6l3 3 3-3"/>
        <path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/>
      </svg>
      {loading ? "Erstelle PDF…" : "PDF herunterladen"}
    </button>
  );
}
