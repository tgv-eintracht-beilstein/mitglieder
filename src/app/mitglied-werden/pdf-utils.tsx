import React from "react";
import type { FormState } from "./types";
import { buildPdfFilename } from "@/lib/pdfFilename";

export async function buildAllDocs(state: FormState) {
  const { Document } = await import("@react-pdf/renderer");
  const { DatenschutzDoc, AntragDoc, SepaDoc } = await import("./pdf-docs");

  const today = new Date().toLocaleDateString("de-DE");
  const docs: { doc: React.ReactElement; filename: string }[] = [];

  for (const person of state.personen) {
    const addr = state.adressen.find((a) => a.id === person.addressId);
    const city = addr?.ort || "Beilstein";

    docs.push({
      doc: <Document><DatenschutzDoc person={person} city={city} today={today} /></Document>,
      filename: buildPdfFilename("datenschutz", person.vorname, person.nachname),
    });
    docs.push({
      doc: <Document><AntragDoc person={person} addr={addr} city={city} today={today} /></Document>,
      filename: buildPdfFilename("mitgliedsantrag", person.vorname, person.nachname),
    });
  }

  const firstAddr = state.adressen.find((a) => a.id === state.personen[0]?.addressId);
  docs.push({
    doc: <Document><SepaDoc state={state} addr={firstAddr} city={firstAddr?.ort || "Beilstein"} today={today} /></Document>,
    filename: buildPdfFilename("sepa-mandat", state.personen[0]?.vorname || "", state.personen[0]?.nachname || ""),
  });

  return docs;
}

export async function generateAllPdfs(state: FormState, combined = true): Promise<void> {
  const { downloadMultiplePdfs } = await import("@/lib/pdf");
  await downloadMultiplePdfs(await buildAllDocs(state), buildPdfFilename("mitgliedsantrag", state.personen[0]?.vorname || "", state.personen[0]?.nachname || ""), combined);
}
