"use client";

import { useState, useEffect } from "react";
import { getUsername } from "@/lib/auth";
import { uploadPdf, submitForm } from "@/lib/form-api";

interface Props {
  formType: string;
  getFormData: () => unknown;
  getPdfBlobs: () => Promise<{ blob: Blob; filename: string }[]>;
}

export default function SubmitButton({ formType, getFormData, getPdfBlobs }: Props) {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { setUser(getUsername()); }, []);

  if (!user) return null;

  async function handleSubmit() {
    setLoading(true);
    try {
      const blobs = await getPdfBlobs();
      const keys = await Promise.all(blobs.map((b) => uploadPdf(b.blob, b.filename)));
      await submitForm(formType, getFormData(), keys);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Fehler beim Absenden. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={loading || done}
      className="flex items-center gap-1.5 px-5 py-2.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60 whitespace-nowrap"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
      {done ? "Gesendet ✓" : loading ? "Sende…" : "Absenden"}
    </button>
  );
}
