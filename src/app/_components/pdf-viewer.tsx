"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

export type PdfViewerHandle = {
  download: () => void;
  print: () => void;
};

const PdfViewer = forwardRef<PdfViewerHandle, { url: string; filename?: string }>(
  function PdfViewer({ url, filename = "dokument.pdf" }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState(false);
    const pdfRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);

    useImperativeHandle(ref, () => ({
      async download() {
        const res = await fetch(url);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      async print() {
        const res = await fetch(url);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const iframe = document.createElement("iframe");
        iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:0";
        iframe.src = objectUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow!.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(objectUrl);
          }, 60000);
        };
      },
    }));

    useEffect(() => {
      let cancelled = false;

      async function render() {
        try {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.mjs",
            import.meta.url
          ).toString();

          const pdf = await pdfjsLib.getDocument(url).promise;
          if (cancelled || !containerRef.current) return;
          pdfRef.current = pdf;

          containerRef.current.innerHTML = "";
          const containerWidth = (containerRef.current.clientWidth || 800) - 16;

          const pages = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            pages.push(await pdf.getPage(i));
          }

          // Render at full width-fit quality
          const maxW = Math.max(...pages.map(p => p.getViewport({ scale: 1 }).width));
          const renderScale = (containerWidth / maxW) * (window.devicePixelRatio || 1);

          for (let i = 0; i < pages.length; i++) {
            if (cancelled) break;
            const page = pages[i];
            const vp = page.getViewport({ scale: renderScale });

            const canvas = document.createElement("canvas");
            canvas.width = vp.width;
            canvas.height = vp.height;
            canvas.style.display = "block";
            canvas.style.maxWidth = "100%";
            canvas.style.height = "auto";
            canvas.style.marginBottom = i < pages.length - 1 ? "8px" : "0";

            containerRef.current.appendChild(canvas);
            const ctx = canvas.getContext("2d")!;
            await page.render({ canvasContext: ctx, canvas, viewport: vp }).promise;
          }
        } catch {
          if (!cancelled) setError(true);
        }
      }

      render();
      return () => { cancelled = true; };
    }, [url]);

    if (error) return (
      <p className="text-sm text-gray-500 text-center py-8">
        PDF konnte nicht geladen werden.{" "}
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#b11217] underline">
          Direkt öffnen
        </a>
      </p>
    );

    return (
      <div
        ref={containerRef}
        className="w-full h-full overflow-auto rounded-xl bg-gray-100 p-2"
      />
    );
  }
);

export default PdfViewer;
