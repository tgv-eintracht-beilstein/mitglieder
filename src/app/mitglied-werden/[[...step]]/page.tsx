import type { Metadata } from "next";
// import MembershipWizard, { stepFromSlug } from "../wizard";

export const metadata: Metadata = {
  title: 'Mitglied werden – TGV "Eintracht" Beilstein 1823 e. V.',
  description: "Digitaler Aufnahmeantrag mit Datenschutz- und SEPA-Freigaben für Familien.",
};

const stepSlugs = ["familie-kontakt", "personen", "datenschutz", "sepa-mandat", "dokumente", "zusammenfassung"];

export function generateStaticParams() {
  return [{ step: [] }, ...stepSlugs.map((s) => ({ step: [s] }))];
}

export default async function MitgliedWerdenPage({ params }: { params: Promise<{ step?: string[] }> }) {
  const { step } = await params;
  return <></>;
}
