"use client";

export default function PrintButton() {
  return (
    <div className="mt-6 flex justify-center print:hidden">
      <button
        onClick={() => window.print()}
        className="px-6 py-3 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900 transition-colors"
      >
        Drucken / Als PDF speichern
      </button>
    </div>
  );
}
