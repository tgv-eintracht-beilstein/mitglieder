import Aufwandsformular from "@/app/_components/aufwandsformular";

export default function UebungsleiterpauschaleePage() {
  return (
    <Aufwandsformular config={{
      storageKey: "uebungsleiterpauschale_v1",
      title: "Übungsleiterpauschale",
      filename: "uebungsleiterpauschale.pdf",
    }} />
  );
}
