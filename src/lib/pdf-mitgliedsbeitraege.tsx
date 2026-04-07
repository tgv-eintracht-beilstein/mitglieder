import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { s, PdfHeader, PdfFooter } from "@/lib/pdf";

const t = StyleSheet.create({
  section: { marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#b11217", marginBottom: 6 },
  subTitle: { fontSize: 9, fontWeight: 700, color: "#b11217", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 3, marginTop: 10, marginBottom: 4 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingVertical: 3 },
  label: { flex: 1, fontSize: 8, color: "#374151" },
  price: { fontSize: 8, fontWeight: 600, color: "#111827", textAlign: "right" },
  note: { fontSize: 6.5, color: "#6b7280", marginTop: 3, lineHeight: 1.5 },
  p: { fontSize: 8, color: "#4b5563", marginBottom: 4, lineHeight: 1.5 },
});

function PriceRow({ label, price }: { label: string; price: string }) {
  return (
    <View style={t.row}>
      <Text style={t.label}>{label}</Text>
      <Text style={t.price}>{price}</Text>
    </View>
  );
}

export function MitgliedsbeitraegeDoc() {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader subtitle="Mitgliedsbeiträge 2026" />

        <Text style={t.p}>
          Der Jahresbeitrag setzt sich aus einem Vereinsbeitrag und dem/den jeweiligen Abteilungsbeitrag/-beiträgen zusammen:
        </Text>

        <View style={t.section}>
          <Text style={t.sectionTitle}>Vereinsbeitrag</Text>
          <Text style={t.p}>
            Der fällige Vereinsbeitrag muss jährlich im Januar beglichen werden. Bei erteiltem SEPA Mandat wird der Betrag Ende Januar (ab dem 22.) automatisch eingezogen.
          </Text>
          <PriceRow label="Vereinsbeitrag für Erwachsene" price="80,00 Euro" />
          <PriceRow label="Vereinsbeitrag für Zweitmitglieder *" price="45,00 Euro" />
          <PriceRow label="Vereinsbeitrag für Kinder bis 18 Jahren" price="35,00 Euro" />
          <PriceRow label="Vereinsbeitrag Auszubildende, Schüler und Studenten 18–25 Jahre **" price="35,00 Euro" />
          <PriceRow label="Vereinsbeitrag für Familien ***" price="130,00 Euro" />
          <Text style={t.note}>
            * Ehe- oder Lebenspartner{"\n"}
            ** Bescheinigungen sind bis 31.12. d. J. bei der Geschäftsstelle vorzulegen{"\n"}
            *** ein Kind aus Familienmitgliedschaft wird im Jahr nach Volljährigkeit als Erstmitglied weitergeführt, wenn keine Bescheinigung für die Ermäßigung vorliegt.
          </Text>
        </View>

        <View style={t.section}>
          <Text style={t.sectionTitle}>Abteilungsbeiträge</Text>
          <Text style={t.p}>
            Fällige Abteilungsbeiträge müssen jährlich im Februar beglichen werden. Bei erteiltem SEPA Mandat wird der Betrag Ende Februar (ab dem 11.) automatisch eingezogen.
          </Text>

          <Text style={t.subTitle}>Fußball</Text>
          <PriceRow label="Erwachsene Aktive" price="72,00 Euro" />
          <PriceRow label="1. Kind einer Familie oder Schüler / Student / Azubi" price="60,00 Euro" />
          <PriceRow label="2. Kind einer Familie" price="36,00 Euro" />
          <PriceRow label="3. und jedes weitere Kind einer Familie" price="0,00 Euro" />
          <PriceRow label="Familienbeitrag" price="100,00 Euro" />
          <PriceRow label="Fördermitglied (Passive, Trainer)" price="40,00 Euro" />
          <Text style={t.note}>Beitragsbefreiung auf Antrag für Mitglieder ab 60 Jahren</Text>

          <Text style={t.subTitle}>Gesang</Text>
          <PriceRow label="Aktive" price="70,00 Euro" />
          <PriceRow label="Passive" price="0,00 Euro" />

          <Text style={t.subTitle}>Schwimmen</Text>
          <PriceRow label="Aktiv/Passiv" price="20,00 Euro" />
          <PriceRow label="Familienbeitrag" price="30,00 Euro" />
          <PriceRow label="Beitragsfreies Mitglied" price="0,00 Euro" />

          <Text style={t.subTitle}>Handball</Text>
          <PriceRow label="Abteilungsbeitrag" price="50,00 Euro" />

          <Text style={t.subTitle}>Tischtennis</Text>
          <PriceRow label="Aktiv" price="50,00 Euro" />
          <PriceRow label="Passiv" price="0,00 Euro" />
          <PriceRow label="Familienbeitrag" price="100,00 Euro" />

          <Text style={t.subTitle}>Tennis</Text>
          <PriceRow label="Aktive" price="120,00 Euro" />
          <PriceRow label="Schüler, Studenten, Auszubildende von 18 bis einschl. 26 Jahre *" price="50,00 Euro" />
          <PriceRow label="Kinder und Jugendliche ab 10–18 Jahre" price="30,00 Euro" />
          <PriceRow label="Kinder und Jugendliche bis 0–9 Jahre" price="0,00 Euro" />
          <PriceRow label="Passive" price="50,00 Euro" />
          <Text style={t.note}>
            * Der Ausbildungsnachweis, mindestens gültig bis zum 31.07. d. J. muss bis Mitte Januar des Beitragsjahres vorgelegt werden. Andernfalls wird der Beitrag für ein erwachsenes Mitglied erhoben.
          </Text>

          <Text style={t.subTitle}>Turnen & Leichtathletik</Text>
          <PriceRow label="Abteilungsbeitrag Kinderturnen/Leichtathletik" price="50,00 Euro" />
          <PriceRow label="Abteilungsbeitrag 2. Kind" price="30,00 Euro" />
          <PriceRow label="Abteilungsbeitrag ab dem 3. Kind" price="0,00 Euro" />
          <PriceRow label="Eltern-Kind-Turnen" price="25,00 Euro/Kind" />
          <PriceRow label="Jedermänner" price="50,00 Euro" />
          <PriceRow label="Tang Soo Doo" price="Kursbeitrag" />

          <Text style={t.subTitle}>Gymnastik</Text>
          <PriceRow label="Abteilungsbeitrag" price="15,00 Euro" />
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
