"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  existing?: string;
  sharedSignature?: string;
  onSave: (dataUrl: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

type Tab = "draw" | "upload" | "saved";

export default function SignatureModal({ existing, sharedSignature, onSave, onDelete, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [agreed, setAgreed] = useState(!!existing);
  const [isEmpty, setIsEmpty] = useState(!existing);
  const [tab, setTab] = useState<Tab>("draw");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    initCanvas();
    if (existing) {
      const canvas = canvasRef.current!;
      const img = new window.Image();
      img.onload = () => canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = existing;
    }
  }, [existing, initCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    drawing.current = true;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setIsEmpty(false);
  }, []);

  const stopDraw = useCallback(() => { drawing.current = false; }, []);

  const clear = () => { initCanvas(); setIsEmpty(true); };

  const handleAgreeChange = (checked: boolean) => {
    setAgreed(checked);
    if (!checked) { clear(); setUploadPreview(null); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadPreview(ev.target?.result as string);
      setIsEmpty(false);
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (tab === "saved" && sharedSignature) { onSave(sharedSignature); return; }
    if (tab === "upload" && uploadPreview) { onSave(uploadPreview); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
  };

  const canSave = agreed && (
    (tab === "draw" && !isEmpty) ||
    (tab === "upload" && !!uploadPreview) ||
    (tab === "saved" && !!sharedSignature)
  );

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-[#b11217] text-[#b11217]" : "border-transparent text-gray-500 hover:text-gray-700"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold">Digitale Unterschrift</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-4">
          <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => handleAgreeChange(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0" />
            <span>
              Ich bin damit einverstanden, dieses Dokument mit einer digitalen Unterschrift zu unterzeichnen.
              Die digitale Unterschrift hat für diesen Zweck die gleiche rechtliche Wirkung wie eine handschriftliche Unterschrift.
            </span>
          </label>

          <div className={`transition-opacity ${agreed ? "" : "opacity-40 pointer-events-none"}`}>
            <div className="flex border-b border-gray-200 mb-3">
              <button type="button" onClick={() => setTab("draw")} className={tabCls("draw")}>Zeichnen</button>
              <button type="button" onClick={() => setTab("upload")} className={tabCls("upload")}>Bild hochladen</button>
              {sharedSignature && (
                <button type="button" onClick={() => { setTab("saved"); setAgreed(true); }} className={tabCls("saved")}>Gespeicherte verwenden</button>
              )}
            </div>

            {tab === "draw" && (
              <>
                <div className="border-2 rounded-lg overflow-hidden border-gray-300">
                  <canvas ref={canvasRef} width={600} height={220} className="w-full touch-none cursor-crosshair"
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Bitte hier unterschreiben</p>
              </>
            )}

            {tab === "upload" && (
              <div className="space-y-3">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {uploadPreview ? (
                  <div className="border-2 border-gray-300 rounded-lg p-3 flex flex-col items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadPreview} alt="Unterschrift Vorschau" className="max-h-28 object-contain" />
                    <button type="button" onClick={() => { setUploadPreview(null); setIsEmpty(true); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="text-xs text-gray-500 hover:text-red-500 transition-colors">Bild entfernen</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 flex flex-col items-center gap-2 text-gray-500 hover:border-[#b11217] hover:text-[#b11217] transition-colors">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span className="text-sm">Unterschrift-Bild auswählen</span>
                    <span className="text-xs">JPG, PNG, GIF, WebP</span>
                  </button>
                )}
              </div>
            )}

            {tab === "saved" && sharedSignature && (
              <div className="border-2 border-gray-200 rounded-lg p-4 flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sharedSignature} alt="Gespeicherte Unterschrift" className="max-h-28 object-contain" />
                <p className="text-xs text-gray-500">Zuletzt verwendete Unterschrift</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-between items-center">
          <div className="flex gap-2">
            {tab === "draw" && (
              <button onClick={clear} disabled={!agreed} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40">
                Zurücksetzen
              </button>
            )}
            {existing && (
              <button onClick={() => { onDelete(); onClose(); }} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                Löschen
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Abbrechen</button>
            <button onClick={save} disabled={!canSave}
              className="px-4 py-2 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
