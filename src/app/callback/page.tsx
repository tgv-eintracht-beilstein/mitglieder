"use client";

import { useEffect } from "react";
import { handleCallback } from "@/lib/auth";

export default function CallbackPage() {
  useEffect(() => {
    handleCallback().then((ok) => {
      window.location.href = ok ? "/" : "/?error=login_failed";
    });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-gray-500">Anmeldung wird verarbeitet…</p>
    </div>
  );
}
