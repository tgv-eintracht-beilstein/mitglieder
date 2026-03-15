"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  existing?: string;
  onSave: (dataUrl: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function SignatureModal({ existing, onSave, onDelete, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [agreed, setAgreed] = useState(!!existing);
  const [isEmpty, setIsEmpty] = useState(!existing);

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

  const clear = () => {
    initCanvas();
    setIsEmpty(true);
  };

  const handleAgreeChange = (checked: boolean) => {
    setAgreed(checked);
    if (!checked) clear();
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold">Digitale Unterschrift</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-4">
          <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => handleAgreeChange(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0" />
            <span>
              Ich bin damit einverstanden, dieses Dokument mit einer digitalen Unterschrift zu unterzeichnen.
              Die digitale Unterschrift hat für diesen Zweck die gleiche rechtliche Wirkung wie eine handschriftliche Unterschrift.
            </span>
          </label>

          <div className={`border-2 rounded-lg overflow-hidden transition-colors ${agreed ? "border-gray-300" : "border-gray-100 opacity-40 pointer-events-none"}`}>
            <canvas
              ref={canvasRef}
              width={600}
              height={220}
              className="w-full touch-none cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>
          <p className="text-xs text-gray-400">Bitte hier unterschreiben</p>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-between items-center">
          <div className="flex gap-2">
            <button onClick={clear} disabled={!agreed} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40">
              Zur&uuml;cksetzen
            </button>
            {existing && (
              <button onClick={() => { onDelete(); onClose(); }} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                L&ouml;schen
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Abbrechen
            </button>
            <button onClick={save} disabled={!agreed || isEmpty}
              className="px-4 py-2 text-sm bg-[#b11217] text-white rounded-lg hover:bg-[#8f0f13] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
