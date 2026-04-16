import React from "react";
import { Page, View, Text, s, PdfHeader, PdfFooter, Field, Sig, ApprovalSig, InfoGrid, Checkbox } from "@/lib/pdf";
import { formatIban } from "@/lib/iban";

function formatDateDE(v: string) {
  if (!v) return "";
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : v;
}

export interface EhrenamtState {
  nachname: string; vorname: string; strasse: string; plzOrt: string;
  geburtsdatum: string; telefon: string; email: string; iban: string;
  abteilung: string; funktion: string; verguetung: string; jahr: string;
  verzicht: boolean; spendenbetrag: string;
  zahlungBar: boolean; zahlungUeberweisung: boolean;
  signature: string; overrideDate: string | null;
}

export function EhrenamtspauschaleDoc({ state, dateValue, limit }: {
  state: EhrenamtState; dateValue: string; limit: number;
}) {
  const verguetung = parseFloat(state.verguetung) || 0;
  const auszahlbetrag = state.verzicht ? 0 : verguetung;

  return (
    <Page size="A4" style={s.page}>
      <PdfHeader subtitle={`Ehrenamtspauschale – ${state.vorname} ${state.nachname}${state.abteilung ? ` · ${state.abteilung}` : ""}`} />

      <InfoGrid
        left={[
          { label: "Jahr", value: state.jahr },
          { label: "Abteilung", value: state.abteilung },
          { label: "Funktion", value: state.funktion },
          { label: "Vergütung", value: state.verguetung ? `${state.verguetung} € (max. ${limit} €)` : "" },
        ]}
        right={[
          { label: "Nachname", value: state.nachname },
          { label: "Vorname", value: state.vorname },
          { label: "Geburtsdatum", value: formatDateDE(state.geburtsdatum) },
          { label: "Straße", value: state.strasse },
          { label: "PLZ, Ort", value: state.plzOrt },
          { label: "Telefon", value: state.telefon },
          { label: "E-Mail", value: state.email },
        ]}
      />

      <Text style={s.h2}>Erklärung zur Ehrenamtspauschale</Text>
      <Text style={s.p}>
        Erklärung für die nebenberufliche Vereinsbeschäftigung bei Berücksichtigung des Ehrenamtsfreibetrages nach
        § 3 Nr. 26a EStG. Der TGV "Eintracht" Beilstein 1823 e. V., Albert-Einstein-Str. 20, 71717 Beilstein wird folgende
        Erklärung zum Ehrenamtsfreibetrag nach § 3 Nr. 26a EStG abgegeben:
      </Text>
      <Text style={s.p}>
        Der/Die nach den gesetzlichen Vorgaben gewählte Vereinsmitarbeiter/in ist ehrenamtlich in der Funktion als {state.funktion || "_______________"} in
        der Abteilung {state.abteilung || "_______________"} im Rahmen der satzungsmässigen und gemeinnützigen Aufgabenstellung des Vereins tätig.
        Der hierfür geleisteten Aufwandsentschädigung liegt eine Vergütung in Höhe von {state.verguetung || "____"} Euro pauschal zu Grunde.
      </Text>
      <Text style={s.p}>
        Hiermit erkläre ich die Ehrenamtspauschale nach § 3 Nr. 26a EStG im Kalenderjahr {state.jahr} noch nicht in Anspruch
        genommen zu haben, bzw. nicht anderweitig in Anspruch nehmen werde.
        Mir ist bekannt, dass Nachteile des Vereins zu meinen Lasten gehen.
      </Text>

      <Text style={s.h2}>Auszahlbetrag & Zahlung</Text>
      {auszahlbetrag === 0 && state.verzicht ? (
        <Text style={[s.p, { color: "#16a34a", fontWeight: 600 }]}>
          Vielen Dank für Ihre Spende in Höhe von {state.spendenbetrag || state.verguetung || "0,00"} € an den Verein!
        </Text>
      ) : (
        <View style={{ gap: 4 }}>
          <Checkbox checked={state.zahlungBar}>Auszahlbetrag bar erhalten</Checkbox>
          <Checkbox checked={state.zahlungUeberweisung}>Auszahlbetrag bitte überweisen auf nachfolgende Bankverbindung</Checkbox>
          {state.zahlungUeberweisung && state.iban && (
            <View style={{ marginLeft: 12 }}><Field label="IBAN" value={formatIban(state.iban)} /></View>
          )}
        </View>
      )}

      <Sig label="Unterschrift" signature={state.signature || undefined}
        dateLabel="Ort, Datum" dateValue={dateValue} />
      <ApprovalSig />
      <PdfFooter />
    </Page>
  );
}
