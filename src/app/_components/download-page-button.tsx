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
      // Force signature images to render at natural aspect ratio
      Array.from(iframeDoc.images).forEach((img) => {
        if (img.alt === "Unterschrift" && img.naturalWidth && img.naturalHeight) {
          const h = img.getBoundingClientRect().height || 56;
          const w = (img.naturalWidth / img.naturalHeight) * h;
          img.style.width = `${w}px`;
          img.style.height = `${h}px`;
        }
      });
      iframe.style.height = iframeBody.scrollHeight + "px";
      await new Promise(r => setTimeout(r, 200));
      const canvas = await html2canvas(iframeBody, {
        scale: 3, useCORS: true, logging: false, backgroundColor: "#ffffff",
        width: 1050, height: iframeBody.scrollHeight,
        windowWidth: 1050, windowHeight: iframeBody.scrollHeight,
      });
      document.body.removeChild(iframe);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;

      const pxToMm = usableW / 1050;
      const breakMarkers = Array.from(iframeBody.querySelectorAll(".print\\:break-before-page"))
        .map(el => (el as HTMLElement).offsetTop * pxToMm);

      const imgH = (canvas.height * usableW) / canvas.width;
      let currentY = 0;
      let first = true;

      while (currentY < imgH) {
        let sliceH = Math.min(imgH - currentY, usableH);
        
        const nextBreak = breakMarkers.find(m => m > currentY + 5 && m < currentY + sliceH);
        if (nextBreak) {
          sliceH = nextBreak - currentY;
        }

        const scale = canvas.width / 1050;
        const srcY = (currentY / pxToMm) * scale;
        const srcH = (sliceH / pxToMm) * scale;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.ceil(srcH);
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        }

        if (!first) pdf.addPage();
        pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.85), "JPEG", margin, margin, usableW, sliceH);
        
        currentY += sliceH;
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
