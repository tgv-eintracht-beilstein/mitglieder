"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { callApi } from "@/lib/auth";

interface Props {
  pdfUrl: string;
  pdfKey: string;
  onClose: () => void;
  onSigned: () => void;
}

export default function SignPdfModal({ pdfUrl, pdfKey, onClose, onSigned }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [sigPos, setSigPos] = useState({ x: 100, y: 400 });
  const [sigSize] = useState({ w: 200, h: 80 });
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const [signing, setSigning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [pdfScale, setPdfScale] = useState(1);
  const [pdfDims, setPdfDims] = useState({ w: 0, h: 0 });

  // Load PDF pages
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      const loaded = [];
      for (let i = 1; i <= pdf.numPages; i++) loaded.push(await pdf.getPage(i));
      if (!cancelled) setPages(loaded);
    })();
    return () => { cancelled = true; };
  }, [pdfUrl]);

  // Render current page
  useEffect(() => {
    if (!pages[currentPage] || !canvasRef.current || !containerRef.current) return;
    const page = pages[currentPage];
    const containerW = containerRef.current.clientWidth - 32;
    const vp1 = page.getViewport({ scale: 1 });
    const scale = containerW / vp1.width;
    const vp = page.getViewport({ scale: scale * (window.devicePixelRatio || 1) });
    const canvas = canvasRef.current;
    canvas.width = vp.width;
    canvas.height = vp.height;
    canvas.style.width = `${containerW}px`;
    canvas.style.height = `${(vp1.height * scale)}px`;
    setPdfScale(scale);
    setPdfDims({ w: vp1.width, h: vp1.height });
    page.render({ canvasContext: canvas.getContext("2d")!, canvas, viewport: vp });
  }, [pages, currentPage]);

  // Signature pad drawing
  const startDraw = useCallback((e: React.PointerEvent) => {
    const c = sigCanvasRef.current;
    if (!c) return;
    setDrawing(true);
    const r = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  }, []);

  const draw = useCallback((e: React.PointerEvent) => {
    if (!drawing) return;
    const c = sigCanvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    ctx.lineCap = "round";
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
    ctx.stroke();
    setHasSig(true);
  }, [drawing]);

  const endDraw = useCallback(() => setDrawing(false), []);

  function clearSig() {
    const c = sigCanvasRef.current;
    if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasSig(false);
  }

  // Drag signature position on PDF
  const onDragStart = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    dragOffset.current = { x: e.clientX - sigPos.x * pdfScale, y: e.clientY - sigPos.y * pdfScale };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [sigPos, pdfScale]);

  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const newX = (e.clientX - dragOffset.current.x) / pdfScale;
    const newY = (e.clientY - dragOffset.current.y) / pdfScale;
    setSigPos({ x: Math.max(0, Math.min(newX, pdfDims.w - sigSize.w)), y: Math.max(0, Math.min(newY, pdfDims.h - sigSize.h)) });
  }, [dragging, pdfScale, pdfDims, sigSize]);

  const onDragEnd = useCallback(() => setDragging(false), []);

  async function handleSign() {
    if (!hasSig || !sigCanvasRef.current) return;
    setSigning(true);
    try {
      const dataUrl = sigCanvasRef.current.toDataURL("image/png");
      await callApi("/sign-pdf", {
        method: "POST",
        body: JSON.stringify({
          key: pdfKey,
          signatureDataUrl: dataUrl,
          x: sigPos.x,
          y: sigPos.y,
          width: sigSize.w,
          height: sigSize.h,
          page: currentPage,
        }),
      });
      onSigned();
    } catch (e) {
      console.error(e);
      alert("Unterschrift fehlgeschlagen");
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <span className="font-semibold text-gray-900">PDF unterschreiben</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4 min-h-0">
          {/* Page navigation */}
          {pages.length > 1 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="px-2 py-1 rounded border disabled:opacity-30">←</button>
              <span>Seite {currentPage + 1} / {pages.length}</span>
              <button disabled={currentPage >= pages.length - 1} onClick={() => setCurrentPage(p => p + 1)} className="px-2 py-1 rounded border disabled:opacity-30">→</button>
            </div>
          )}

          {/* PDF with draggable signature overlay */}
          <div ref={containerRef} className="relative bg-gray-100 rounded-xl overflow-hidden">
            <canvas ref={canvasRef} className="block" />
            {hasSig && (
              <div
                className="absolute border-2 border-dashed border-[#b11217] bg-[#b11217]/5 cursor-move rounded"
                style={{ left: sigPos.x * pdfScale, top: sigPos.y * pdfScale, width: sigSize.w * pdfScale, height: sigSize.h * pdfScale }}
                onPointerDown={onDragStart}
                onPointerMove={onDragMove}
                onPointerUp={onDragEnd}
              >
                <img src={sigCanvasRef.current?.toDataURL()} alt="" className="w-full h-full object-contain pointer-events-none" />
                <div className="absolute -top-5 left-0 text-[10px] text-[#b11217] font-medium">Unterschrift hierher ziehen</div>
              </div>
            )}
          </div>

          {/* Signature pad */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">Unterschrift zeichnen:</span>
              {hasSig && <button onClick={clearSig} className="text-xs text-gray-500 hover:text-gray-600">Löschen</button>}
            </div>
            <canvas
              ref={sigCanvasRef}
              width={400}
              height={120}
              className="w-full border border-gray-200 rounded-lg bg-white cursor-crosshair touch-none"
              onPointerDown={startDraw}
              onPointerMove={draw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100">Abbrechen</button>
          <button
            onClick={handleSign}
            disabled={!hasSig || signing}
            className="px-5 py-2 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] font-medium disabled:opacity-50"
          >
            {signing ? "Unterschreibe…" : "Jetzt unterschreiben"}
          </button>
        </div>
      </div>
    </div>
  );
}
