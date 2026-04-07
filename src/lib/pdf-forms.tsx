import React from "react";
import { Document, Page, View, Text, s, PdfHeader, PdfFooter, Field, Sig, InfoGrid, Checkbox } from "@/lib/pdf";
import { StyleSheet } from "@react-pdf/renderer";

const KM_RATE = 0.3;

function calcStunden(von: string, bis: string): number {
  if (!von || !bis) return 0;
  const [vh, vm] = von.split(":").map(Number);
  const [bh, bm] = bis.split(":").map(Number);
  const diff = (bh * 60 + bm) - (vh * 60 + vm);
  return diff > 0 ? Math.round(diff / 15) * 0.25 : 0;
}

interface Row {
  id: number; datum: string; von: string; bis: string;
  satz: string; km: string; beschreibung: string;
}

function calcRow(row: Row): number {
  return calcStunden(row.von, row.bis) * (parseFloat(row.satz) || 0) + (parseFloat(row.km) || 0) * KM_RATE;
}

function formatDateDE(v: string) {
  if (!v) return "";
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : v;
}

const t = StyleSheet.create({
  th: { fontSize: 7, fontWeight: 700, color: "#6b7280", paddingVertical: 4, paddingHorizontal: 3, borderRightWidth: 1, borderRightColor: "#e5e7eb", textAlign: "center" },
  td: { fontSize: 7, paddingVertical: 3, paddingHorizontal: 3, borderRightWidth: 1, borderRightColor: "#f3f4f6", textAlign: "center" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  headerRow: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#d1d5db", backgroundColor: "#f9fafb" },
  footRow: { flexDirection: "row", borderTopWidth: 2, borderTopColor: "#d1d5db", backgroundColor: "#f9fafb" },
  right: { textAlign: "right" },
  bold: { fontWeight: 700 },
});

export interface AufwandsformularState {
  nachname: string; vorname: string; strasse: string; plzOrt: string;
  geburtsdatum: string; telefon: string; email: string;
  abteilung: string; uebungsleiterKategorie: string;
  monatVon: string; monatBis: string; iban: string; aufwandsspende: string;
  zahlungBar: boolean; zahlungUeberweisung: boolean;
  steuerVollHoehe: boolean; steuerBisZu: boolean; steuerBisZuBetrag: string; steuerNicht: boolean;
  signature: string; overrideDate: string | null;
  rows: Row[];
}

export interface AufwandsConfig {
  title: string;
  showKm?: boolean;
  showStunden?: boolean;
  showSteuererklärung?: boolean;
  showVerzicht?: boolean;
  showKategorie?: boolean;
}

export function AufwandsformularDoc({ state, config, dateValue }: {
  state: AufwandsformularState; config: AufwandsConfig; dateValue: string;
}) {
  const showKm = config.showKm !== false;
  const showStunden = config.showStunden !== false;
  const aufwand = state.rows.reduce((sum, r) => sum + calcRow(r), 0);
  const spende = Math.min(parseFloat(state.aufwandsspende) || 0, aufwand);
  const auszahlbetrag = Math.max(0, aufwand - spende);

  // Build column widths
  const cols: { label: string; width: string; align?: string }[] = [{ label: "Datum", width: "14%" }];
  if (showStunden) {
    cols.push({ label: "von", width: "8%" }, { label: "bis", width: "8%" }, { label: "Std.", width: "8%" }, { label: "€/Std.", width: "8%" });
  }
  if (showKm) cols.push({ label: "km", width: "8%" });
  cols.push({ label: "Ergebnis", width: "12%", align: "right" }, { label: "Kursbezeichnung / Reiseziel", width: "auto" });

  return (
    <Page size="A4" style={s.page}>
      <PdfHeader subtitle={`${config.title} – ${state.vorname} ${state.nachname}${state.abteilung ? ` · ${state.abteilung}` : ""}`} />

      <InfoGrid
        left={[
          { label: "Abteilung", value: state.abteilung },
          { label: "Zeitraum", value: [state.monatVon, state.monatBis].filter(Boolean).join(" – ") },
          ...(config.showKategorie ? [{ label: "Kategorie", value: state.uebungsleiterKategorie }] : []),
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

      {/* Table */}
      <View style={{ marginBottom: 10 }}>
        <View style={t.headerRow}>
          <Text style={[t.th, { width: "14%", textAlign: "left" }]}>Datum</Text>
          {showStunden && <Text style={[t.th, { width: "8%" }]}>von</Text>}
          {showStunden && <Text style={[t.th, { width: "8%" }]}>bis</Text>}
          {showStunden && <Text style={[t.th, { width: "8%" }]}>Std.</Text>}
          {showStunden && <Text style={[t.th, { width: "8%" }]}>€/Std.</Text>}
          {showKm && <Text style={[t.th, { width: "10%" }]}>km</Text>}
          <Text style={[t.th, { width: "12%", textAlign: "right" }]}>Ergebnis</Text>
          <Text style={[t.th, { flex: 1, textAlign: "left", borderRightWidth: 0 }]}>Kursbezeichnung / Reiseziel</Text>
        </View>
        {state.rows.map((row) => {
          const stunden = calcStunden(row.von, row.bis);
          return (
            <View key={row.id} style={t.row}>
              <Text style={[t.td, { width: "14%", textAlign: "left" }]}>{formatDateDE(row.datum)}</Text>
              {showStunden && <Text style={[t.td, { width: "8%" }]}>{row.von}</Text>}
              {showStunden && <Text style={[t.td, { width: "8%" }]}>{row.bis}</Text>}
              {showStunden && <Text style={[t.td, { width: "8%" }]}>{stunden.toFixed(2)}</Text>}
              {showStunden && <Text style={[t.td, { width: "8%" }]}>{row.satz}</Text>}
              {showKm && <Text style={[t.td, { width: "10%" }]}>{row.km}</Text>}
              <Text style={[t.td, { width: "12%", textAlign: "right", fontWeight: 600 }]}>{calcRow(row).toFixed(2)} €</Text>
              <Text style={[t.td, { flex: 1, textAlign: "left", borderRightWidth: 0 }]}>{row.beschreibung}</Text>
            </View>
          );
        })}
        {/* Totals */}
        <View style={t.footRow}>
          <Text style={[t.td, { flex: 1, fontWeight: 700, textAlign: "left" }]}>Aufwandsentschädigung</Text>
          <Text style={[t.td, { width: "12%", textAlign: "right", fontWeight: 700, borderRightWidth: 0 }]}>{aufwand.toFixed(2)} €</Text>
        </View>
        {spende > 0 && (
          <View style={[t.row, { backgroundColor: "#f9fafb" }]}>
            <Text style={[t.td, { flex: 1, fontWeight: 700, textAlign: "left", color: "#b11217" }]}>abzüglich Aufwandsspende</Text>
            <Text style={[t.td, { width: "12%", textAlign: "right", fontWeight: 700, color: "#b11217", borderRightWidth: 0 }]}>− {spende.toFixed(2)} €</Text>
          </View>
        )}
        <View style={[t.footRow, { backgroundColor: "#f3f4f6" }]}>
          <Text style={[t.td, { flex: 1, fontWeight: 700, fontSize: 9, textAlign: "left" }]}>Auszahlbetrag</Text>
          <Text style={[t.td, { width: "12%", textAlign: "right", fontWeight: 700, fontSize: 9, color: auszahlbetrag > 0 ? "#16a34a" : undefined, borderRightWidth: 0 }]}>{auszahlbetrag.toFixed(2)} €</Text>
        </View>
      </View>

      {/* Tax declaration */}
      {config.showSteuererklärung !== false && (
        <View style={{ marginBottom: 10 }}>
          <Text style={s.h2}>Steuererklärung</Text>
          <Text style={s.p}>
            Hiermit erkläre ich, {state.vorname} {state.nachname}, geb. am {formatDateDE(state.geburtsdatum)},
            dass ich die Steuerbefreiung nach § 3 Nr. 26 EStG im laufenden Kalenderjahr
            bei den Einnahmen aus einer anderen nebenberuflichen, begünstigten Tätigkeit nicht ...
          </Text>
          <View style={{ gap: 4, marginTop: 4 }}>
            <Checkbox checked={state.steuerVollHoehe}>in voller Höhe ({state.monatVon >= "2026" ? "3.300,00" : "3.000,00"} Euro)</Checkbox>
            <Checkbox checked={state.steuerBisZu}>bis zu {state.steuerBisZuBetrag || "____"} Euro</Checkbox>
            <Checkbox checked={state.steuerNicht}>nicht in Anspruch genommen habe bzw. in Anspruch nehmen werde.</Checkbox>
          </View>
        </View>
      )}

      {/* Payment */}
      <View style={{ marginBottom: 10 }}>
        <Text style={s.h2}>Auszahlbetrag & Zahlung</Text>
        {auszahlbetrag === 0 && spende > 0 ? (
          <Text style={[s.p, { color: "#16a34a", fontWeight: 600 }]}>
            Vielen Dank für Ihre Spende in Höhe von {spende.toFixed(2)} € an den Verein!
          </Text>
        ) : (
          <View style={{ gap: 4 }}>
            <Checkbox checked={state.zahlungBar}>Auszahlbetrag bar erhalten</Checkbox>
            <Checkbox checked={state.zahlungUeberweisung}>Auszahlbetrag bitte überweisen auf nachfolgende Bankverbindung</Checkbox>
            {state.zahlungUeberweisung && state.iban && (
              <View style={{ marginLeft: 12 }}><Field label="IBAN" value={state.iban} /></View>
            )}
          </View>
        )}
      </View>

      <Sig label="Unterschrift Leistungsempfänger" signature={state.signature || undefined}
        dateLabel="Ort, Datum" dateValue={dateValue} />
      <PdfFooter />
    </Page>
  );
}

/* ── Verzichtserklärung ── */

export function VerzichtDoc({ state, dateValue }: {
  state: { nachname: string; vorname: string; strasse: string; plzOrt: string; jahr: string; betrag: string; spendenbetrag: string; signature: string };
  dateValue: string;
}) {
  return (
    <Page size="A4" style={s.page}>
      <PdfHeader subtitle={`Ehrenamtspauschale Verzicht – ${state.vorname} ${state.nachname}`} />
      <Text style={s.h1}>Verzicht auf Auszahlung der Ehrenamtspauschale</Text>

      <Text style={s.h2}>Angaben zum Verzicht</Text>
        <View style={s.fieldRow}>
          <View style={s.fieldCol}><Field label="Jahr" value={state.jahr} /></View>
          <View style={s.fieldCol}><Field label="Pauschale nach § 3 Nr. 26a EStG" value={`${state.betrag || "0,00"} €`} /></View>
        </View>
        <View style={s.fieldRow}>
          <View style={s.fieldCol}><Field label="Spendenbetrag" value={`${state.spendenbetrag || "0,00"} €`} /></View>
          <View style={s.fieldCol}><Field label="Person" value={`${state.vorname} ${state.nachname}`} /></View>
        </View>
        <View style={[s.fieldRow, { marginBottom: 10 }]}>
          <View style={s.fieldCol}><Field label="Straße, Hausnummer" value={state.strasse} /></View>
          <View style={s.fieldCol}><Field label="PLZ, Ort" value={state.plzOrt} /></View>
        </View>

      <Text style={s.h2}>Verzichtserklärung</Text>
        <Text style={s.p}>
          Für das Jahr {state.jahr || "____"} habe ich aufgrund meiner ehrenamtlichen Tätigkeit im Turn- und Gesangverein
          Eintracht Beilstein 1823 e.V. Anspruch auf die Ehrenamtspauschale nach § 3 Nr. 26a EstG in Höhe von {state.betrag || "____"} €.
        </Text>
        <Text style={s.p}>
          Ich bin damit einverstanden, dass die mir zustehende Aufwandsentschädigung nicht an mich ausgezahlt wird.
        </Text>
        <Text style={s.p}>
          Den nicht ausgezahlten Betrag in Höhe von {state.spendenbetrag || "____"} € wende ich dem Turn- und Gesangverein
          Eintracht Beilstein 1823 e.V. als Spende zu und bitte um Ausstellung einer entsprechenden Spendenbescheinigung.
        </Text>
        <Text style={s.p}>
          Gleichzeitig versichere ich hiermit, dass die Steuerbefreiung nach § 3 Nr. 26a EstG nicht bereits für eine andere
          ehrenamtliche Tätigkeit berücksichtigt wurde.
        </Text>

      <Sig label="Unterschrift des ehrenamtlich Tätigen" signature={state.signature || undefined}
        dateLabel="Ort, Datum" dateValue={dateValue} />
      <PdfFooter />
    </Page>
  );
}
