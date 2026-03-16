"use client";

import { useState, useEffect } from "react";

type Props = {
  onReset: () => void;
  filename?: string;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  onDownloadReady?: (fn: () => void) => void;
  disabled?: boolean;
};

export default function FormFooter({ onReset, filename = "formular.pdf", contentRef: _contentRef, onDownloadReady, disabled: disabledProp }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (!window.location.pathname) return;
    setLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Load current page in hidden iframe with ?pdf=1 so print styles apply
      const iframeUrl = `${window.location.pathname}?pdf=1`;
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:1050px;height:1px;border:0;visibility:hidden";
      document.body.appendChild(iframe);

      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        iframe.src = iframeUrl;
      });

      // Give React a moment to hydrate, apply styles, and load images
      await new Promise(r => setTimeout(r, 1500));

      const iframeDoc = iframe.contentDocument!;
      const iframeBody = iframeDoc.body;

      // Wait for all images to load
      await Promise.all(
        Array.from(iframeDoc.images).map(img =>
          img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
        )
      );

      // Size iframe to full content height
      iframe.style.height = iframeBody.scrollHeight + "px";
      await new Promise(r => setTimeout(r, 200));

      const canvas = await html2canvas(iframeBody, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1050,
        height: iframeBody.scrollHeight,
        windowWidth: 1050,
        windowHeight: iframeBody.scrollHeight,
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
        // JPEG at 85% quality — much smaller than PNG
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

  useEffect(() => { onDownloadReady?.(handleDownload); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-2 print:hidden mt-2 mb-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="w-full md:w-auto px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs hover:bg-red-100 transition-colors"
        >
          Formular zurücksetzen
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5V1h8v4"/><rect x="1" y="5" width="12" height="6" rx="1"/><path d="M3 11v2h8v-2"/><circle cx="10.5" cy="8" r="0.5" fill="currentColor"/>
          </svg>
          Drucken
        </button>
      </div>
      <button
        onClick={handleDownload}
        disabled={loading || disabledProp}
        className="flex w-full md:w-auto justify-center items-center gap-1.5 px-5 py-3 text-base bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {loading ? "Erstelle PDF…" : "PDF herunterladen"}
      </button>
    </div>
  );
}
