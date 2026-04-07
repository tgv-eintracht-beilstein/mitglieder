import React from "react";
import { Document, Page, View, Text, s, PdfHeader, PdfFooter, Field, Sig, Bullet, Checkbox, InfoGrid, Section } from "@/lib/pdf";
import type { FormState, Person, Address } from "./types";
import { DATENSCHUTZ_KATEGORIEN } from "./types";

function formatDate(v: string) {
  if (!v) return "";
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : v;
}

function isMinor(geb: string) {
  if (!geb) return false;
  const [y, m, d] = geb.split("-").map(Number);
  const t = new Date();
  let a = t.getFullYear() - y;
  if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d)) a--;
  return a < 18;
}

/* ── Datenschutz ── */

export function DatenschutzDoc({ person, city, today }: {
  person: Person; city: string; today: string;
}) {
  const kategorien = person.datenschutzKategorien ?? DATENSCHUTZ_KATEGORIEN;

  return (
    <Page size="A4" style={s.page}>
      <PdfHeader subtitle={`Datenschutz – ${person.vorname} ${person.nachname}`} />
      <Text style={s.h1}>Einwilligungserklärung für die Veröffentlichung von Daten</Text>

      <Text style={s.p}>
        Der TGV "Eintracht" Beilstein 1823 e. V. weist hiermit darauf hin, dass ausreichende technische Maßnahmen zur
        Gewährleistung des Datenschutzes getroffen wurden. Dennoch kann bei einer Veröffentlichung von personenbezogenen
        Mitgliederdaten im Internet ein umfassender Datenschutz nicht garantiert werden. Daher nimmt das Vereinsmitglied die
        Risiken für eine eventuelle Persönlichkeitsverletzung zur Kenntnis und ist sich bewusst, dass:
      </Text>
      <Bullet>die personenbezogenen Daten auch in Staaten abrufbar sind, die keine der Bundesrepublik Deutschland vergleichbaren Datenschutzbestimmungen kennen.</Bullet>
      <Bullet>die Vertraulichkeit, die Integrität (Unverletzlichkeit), die Authentizität (Echtheit) und die Verfügbarkeit der personenbezogenen Daten nicht garantiert ist.</Bullet>
      <Text style={[s.p, { marginTop: 6 }]}>
        Das Vereinsmitglied trifft diese Entscheidung zur Veröffentlichung seiner Daten im Internet freiwillig und kann seine
        Einwilligung gegenüber dem Vereinsvorstand jederzeit widerrufen.
      </Text>

      <Text style={[s.h2, { marginTop: 10 }]}>Erklärung</Text>
      <Field label="Name in Druckbuchstaben" value={`${person.vorname} ${person.nachname}`.toUpperCase()} />

      <Text style={s.p}>
        Ich bestätige das Vorstehende zur Kenntnis genommen zu haben und willige ein, dass der TGV "Eintracht" Beilstein 1823
        e. V. und seinen Gliederungen/Abteilungen folgende Daten zu meiner Person öffentlich verwenden darf:
      </Text>

      <View style={{ marginBottom: 8 }}>
        {DATENSCHUTZ_KATEGORIEN.map((k) => (
          <Checkbox key={k} checked={kategorien.includes(k)}>{k}</Checkbox>
        ))}
      </View>

      <Text style={s.p}>
        Darüber hinaus bestätige ich, die Datenschutzverordnung des TGV "Eintracht" Beilstein 1823 e. V. gelesen und akzeptiert zu haben.
      </Text>

      <Sig label={`Unterschrift${isMinor(person.geburtsdatum) ? " (Erziehungsberechtigte/r)" : ""}`}
        signature={person.signature || undefined} dateLabel="Ort, Datum" dateValue={`${city}, ${today}`} />

      <Text style={[s.small, { marginTop: 16 }]}>
        Hinweis: Bitte beachten Sie, dass keinerlei Haftung für die korrekte Anwendung im Einzelfall und Aktualität der Informationen zum
        Zeitpunkt der Verwendung übernommen werden kann. Wir empfehlen ergänzend rechtlichen Rat im Vorfeld einzuholen.
      </Text>
      <PdfFooter />
    </Page>
  );
}

/* ── Antrag (one per person, compact) ── */

export function AntragDoc({ person, addr, city, today }: {
  person: Person; addr?: Address; city: string; today: string;
}) {
  return (
    <Page size="A4" style={s.page}>
      <PdfHeader subtitle={`Aufnahmeantrag – ${person.vorname} ${person.nachname}`} />
      <Text style={s.h1}>Aufnahmeantrag</Text>

      <InfoGrid
        left={[
          { label: "Eintrittsdatum", value: today },
          { label: "Abteilung(en)", value: person.abteilungen.join(", ") },
        ]}
        right={[
          { label: "Nachname", value: person.nachname },
          { label: "Vorname", value: person.vorname },
          { label: "Geburtsdatum", value: formatDate(person.geburtsdatum) },
          { label: "Straße", value: addr?.strasse || "" },
          { label: "PLZ, Ort", value: [addr?.plz, addr?.ort].filter(Boolean).join(" ") },
          { label: "Telefon", value: person.telefon },
          { label: "E-Mail", value: person.email },
        ]}
      />

      <Text style={s.p}>
        Mit der Genehmigung durch alle Erziehungsberechtigten übernehmen die bzw. übernimmt der
        Unterzeichnende die Haftung für die Beitragspflicht. Mit der Unterzeichnung bzw. Genehmigung durch den
        Erziehungsberechtigten werden die Satzung sowie alle Vereinsordnungen, insbesondere die Beitragsordnung,
        anerkannt. Die benannten Ordnungen des TGV "Eintracht" Beilstein sind in der Geschäftsstelle erhältlich.
      </Text>
      <Text style={s.p}>
        Kündigungen sind ausschließlich zum Jahresende (31.12.) möglich und müssen der Geschäftsstelle bis
        zum 30.11. des Jahres in schriftlicher Form vorliegen.
      </Text>

      <Sig label={`Unterschrift${isMinor(person.geburtsdatum) ? " (Erziehungsberechtigte/r)" : ""}`}
        signature={person.signature || undefined} dateLabel="Ort, Datum" dateValue={`${city}, ${today}`} />
      <PdfFooter />
    </Page>
  );
}

/* ── SEPA ── */

export function SepaDoc({ state, addr, city, today }: {
  state: FormState; addr?: Address; city: string; today: string;
}) {
  const first = state.personen[0];
  const inhaber = state.kontoinhaber || (first ? `${first.vorname} ${first.nachname}` : "");

  return (
    <Page size="A4" style={s.page}>
      <PdfHeader subtitle="SEPA Lastschriftmandat" />
      <Text style={s.h1}>SEPA Lastschriftmandat</Text>

      <Text style={s.p}>
        Ich ermächtige den TGV "Eintracht" Beilstein 1823 e. V. bis auf Widerruf, Zahlungen von meinem Konto mittels
        Lastschrift einzuziehen. Zugleich weise ich mein Kreditinstitut an, die vom TGV "Eintracht" Beilstein 1823 e. V.
        auf mein Konto gezogenen Lastschriften einzulösen. Das untenstehende Kreditinstitut wird bei Nichteinlösung
        einer erhobenen Lastschrift, bei Widerspruch oder nach Kontoauflösung ermächtigt, dem TGV
        "Eintracht" Beilstein 1823 e. V. auf Anforderung Name und Anschrift des/der Verfügungsberechtigen
        mitzuteilen, damit ein Anspruch erhoben werden kann. Entstehende Kosten für Rücklastschriften seitens der
        Bank gehen zu meinen Lasten.
      </Text>
      <Text style={s.p}>Bei Rechnungsstellung wird zur Deckung der Mehrkosten ein Aufwandszuschlag in Höhe von 5,00 € erhoben.</Text>
      <Text style={[s.p, { fontWeight: 500 }]}>Gläubiger-Identifikationsnummer: DE66ZZZ00000274455</Text>

      <InfoGrid
        left={[
          { label: "Kontoinhaber", value: inhaber },
          { label: "IBAN", value: state.iban },
        ]}
        right={[
          { label: "Straße", value: addr?.strasse || "" },
          { label: "PLZ, Ort", value: [addr?.plz, addr?.ort].filter(Boolean).join(" ") },
        ]}
      />

      <Text style={[s.p, { marginTop: 4 }]}>Ihre Mandatsreferenznummer wird Ihre zukünftige Mitgliedsnummer sein.</Text>
      <Text style={s.p}>
        Einzugsdaten und fällige Beträge entnehmen Sie bitte dem Dokument Vereins- und Abteilungsbeiträge,
        der Finanz- und Beitragsordnung.
      </Text>

      <Sig label="Unterschrift Kontoinhaber" signature={state.signature || undefined}
        dateLabel="Ort, Datum" dateValue={`${city}, ${today}`} />
      <PdfFooter />
    </Page>
  );
}
