import Aufwandsformular from "@/app/_components/aufwandsformular";

export default function ReisekostenPage() {
  return (
    <Aufwandsformular config={{
      storageKey: "reisekosten_v1",
      title: "Reisekostenabrechnung",
      filename: "reisekosten.pdf",
    }} />
  );
}
