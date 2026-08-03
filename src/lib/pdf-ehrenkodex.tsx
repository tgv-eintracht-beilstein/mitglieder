import React from "react";
import { Page, Text, s, PdfHeader, PdfFooter, Sig, InfoGrid } from "@/lib/pdf";

function formatDateDE(v: string) {
  if (!v) return "";
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : v;
}

/* ── Ehrenkodex ── */

export interface EhrenkodexState {
  vorname: string; nachname: string; abteilung: string;
  signature: string;
}

export function EhrenkodexDoc({ state, dateValue }: { state: EhrenkodexState; dateValue: string }) {
  return (
    <Page size="A4" style={s.page}>
      <PdfHeader subtitle={`Ehrenkodex – ${state.vorname} ${state.nachname}${state.abteilung ? ` · ${state.abteilung}` : ""}`} />
      <Text style={s.h1}>Ehrenkodex</Text>

      <InfoGrid
        left={[{ label: "Abteilung", value: state.abteilung }]}
        right={[
          { label: "Nachname", value: state.nachname },
          { label: "Vorname", value: state.vorname },
        ]}
      />

      <Text style={s.p}>
        Ich achte die Würde meiner Mitmenschen. Meine Arbeit in der Jugendarbeit im TGV „Eintracht" Beilstein 1823
        e. V. ist von Wertschätzung und Grenzachtung geprägt.
      </Text>

      <Text style={[s.h2, { marginTop: 6 }]}>1. Grenzen achten / Nähe – Distanz</Text>
      <Text style={s.p}>
        Ich nehme die individuelle Grenzempfindung der Kinder und Jugendlichen wahr und respektiere sie. Ich achte
        auf Grenzüberschreitung durch Mitarbeitende und Teilnehmende in den Gruppen, bei Angeboten und Aktivitäten.
        Ich vertusche sie nicht und reagiere angemessen darauf.
      </Text>

      <Text style={s.h2}>2. Aktiv Stellung beziehen / Kinder schützen</Text>
      <Text style={s.p}>
        Ich beziehe aktiv Stellung gegen abwertendes, gewalttätiges oder sexistisches Verhalten. Egal, ob dieses
        Verhalten durch Worte, Taten, Bilder oder Videos erfolgt.
      </Text>

      <Text style={s.h2}>3. Vorbildfunktion / Abhängigkeiten verhindern</Text>
      <Text style={s.p}>
        Ich bin mir meiner Vorbildfunktion gegenüber den mir anvertrauten Kindern und Jugendlichen bewusst. Mein
        Leitungshandeln ist nachvollziehbar und ehrlich. Ich nutze keine Abhängigkeiten aus und missbrauche nicht
        das Vertrauen der Mädchen und Jungen.
      </Text>

      <Text style={s.h2}>4. Sorgfältige Methodenauswahl</Text>
      <Text style={s.p}>
        Ich achte bei der Auswahl von Spielen, Methoden und Aktionen darauf, dass Mädchen und Jungen keine Angst
        gemacht wird und ihre persönlichen Grenzen nicht verletzt werden.
      </Text>

      <Text style={s.h2}>5. Beratung einholen</Text>
      <Text style={s.p}>
        Bei Übergriffen oder massiven Formen seelischer, körperlicher oder sexualisierter Gewalt gegen Mädchen und
        Jungen hole ich mir umgehend Beratung von Fachkräften. Mit diesen spreche ich das weitere Vorgehen ab.
      </Text>

      <Text style={s.h2}>6. Grenzverletzungen</Text>
      <Text style={s.p}>
        Ich nehme Grenzverletzungen durch andere Mitarbeitende und Teilnehmende in den Gruppen, bei Angeboten und
        Aktivitäten bewusst wahr und vertusche sie nicht.
      </Text>

      <Text style={s.h2}>7. Strafandrohung</Text>
      <Text style={s.p}>
        Mir ist bewusst, dass jede sexuelle Handlung mit Schutzbefohlenen disziplinarische und gegebenenfalls
        strafrechtliche Folgen hat. Ich versichere, dass ich nicht wegen einer Straftat im Zusammenhang mit
        sexualisierter Gewalt verurteilt bin oder ein solches Verfahren gegen mich anhängig ist. Für den Fall, dass
        diesbezüglich ein Ermittlungsverfahren gegen mich eingeleitet wird, verpflichte ich mich, dies dem TGV
        „Eintracht" Beilstein 1823 e. V. oder der Person, die mich beauftragt hat, umgehend mitzuteilen.
      </Text>
      <Text style={[s.small, { marginBottom: 6 }]}>
        Dies bezieht sich auf folgende §§ StGB: 171, 174 bis 174c, 176 bis 180a, 181a, 182 bis 184f, 225, 232 bis
        233a, 234, 235 oder 236.
      </Text>

      <Sig label="Unterschrift" signature={state.signature || undefined} dateLabel="Ort, Datum" dateValue={dateValue} />
      <PdfFooter />
    </Page>
  );
}

/* ── Selbstverpflichtungserklärung ── */

export interface SelbstverpflichtungState {
  vorname: string; nachname: string; geburtsdatum: string;
  strasse: string; plzOrt: string; abteilung: string;
  signature: string;
}

export function SelbstverpflichtungDoc({ state, dateValue }: { state: SelbstverpflichtungState; dateValue: string }) {
  return (
    <Page size="A4" style={s.page}>
      <PdfHeader subtitle={`Selbstverpflichtungserklärung – ${state.vorname} ${state.nachname}${state.abteilung ? ` · ${state.abteilung}` : ""}`} />
      <Text style={s.h1}>Selbstverpflichtungserklärung</Text>

      <InfoGrid
        left={[{ label: "Abteilung", value: state.abteilung }]}
        right={[
          { label: "Nachname", value: state.nachname },
          { label: "Vorname", value: state.vorname },
          { label: "Geburtsdatum", value: formatDateDE(state.geburtsdatum) },
          { label: "Straße", value: state.strasse },
          { label: "PLZ, Ort", value: state.plzOrt },
        ]}
      />

      <Text style={s.p}>
        Hiermit versichere ich, dass ich nicht wegen einer Straftat nach den §§ 171, 174 bis 174c, 176 bis 180a,
        181a, 182 bis 184f, 225, 232 bis 233a, 234, 235 oder 236 des Strafgesetzbuches (StGB) verurteilt worden bin
        und auch keine entsprechenden Verfahren gegen mich anhängig sind.
      </Text>
      <Text style={s.p}>
        Im Rahmen dieser Erklärung verpflichte ich mich dazu, dem TGV „Eintracht" Beilstein 1823 e. V. über die
        Einleitung eines entsprechenden Verfahrens zu informieren.
      </Text>

      <Sig label="Unterschrift" signature={state.signature || undefined} dateLabel="Ort, Datum" dateValue={dateValue} />
      <PdfFooter />
    </Page>
  );
}
