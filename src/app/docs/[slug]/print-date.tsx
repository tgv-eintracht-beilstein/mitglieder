"use client";

export default function PrintDate() {
  return (
    <div className="text-right text-xs text-gray-400">
      <div>Ausgedruckt am</div>
      <div className="font-medium text-gray-600">
        {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
      </div>
    </div>
  );
}
