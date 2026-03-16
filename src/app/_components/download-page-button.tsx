"use client";

import { useState } from "react";

export default function DownloadPageButton({ filename }: { filename: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const iframeUrl = `${window.location.pathname}?pdf=1`;
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:1050px;height:1px;border:0;visibility:hidden";
      document.body.appendChild(iframe);
      await new Promise<void>((resolve) => { iframe.onload = () => resolve(); iframe.src = iframeUrl; });
      await new Promise(r => setTimeout(r, 1500));
      const iframeDoc = iframe.contentDocument!;
      const iframeBody = iframeDoc.body;
      await Promise.all(Array.from(iframeDoc.images).map(img =>
        img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
      ));
      iframe.style.height = iframeBody.scrollHeight + "px";
      await new Promise(r => setTimeout(r, 200));
      const canvas = await html2canvas(iframeBody, {
        scale: 1.5, useCORS: true, logging: false, backgroundColor: "#ffffff",
        width: 1050, height: iframeBody.scrollHeight,
        windowWidth: 1050, windowHeight: iframeBody.scrollHeight,
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
