"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function PdfModeDetector() {
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("pdf") === "1") {
      document.documentElement.classList.add("pdf-capture");
    }
  }, [params]);

  return null;
}
