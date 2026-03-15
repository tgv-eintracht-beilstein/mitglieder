import type { Metadata } from "next";
import Image from "next/image";
import PrintButton from "@/app/_components/print-button";

export const metadata: Metadata = {
  title: 'Mitgliedsbeitr\u00e4ge 2026 \u2013 TGV "Eintracht" Beilstein e. V.',
};

function PriceTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full border-collapse mt-2 mb-2">
      <tbody>
        {rows.map(([label, price]) => (
          <tr key={label} className="border-b border-gray-100 last:border-0">
            <td className="py-2 pr-4 text-sm text-gray-700">{label}</td>
            <td className="py-2 text-right text-sm font-semibold whitespace-nowrap text-gray-900">
              {price}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-[#b11217] mt-0 mb-3 uppercase tracking-wide">
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-6 mb-1">
      {children}
    </h3>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-500 mt-2 leading-relaxed">{children}</p>;
}

export default function MitgliedsbeitraegePage() {
  return (
    <>
      {/* Print-only header */}
      <div className="hidden print:flex items-center gap-3 mb-6 pb-4 border-b border-gray-300">
        <Image
          src="https://www.tgveintrachtbeilstein.de/wp-content/uploads/2016/04/tgv.logo_.512.png"
          alt="TGV Logo"
          width={40}
          height={40}
          unoptimized
        />
        <div className="text-xs text-gray-600">
          <strong className="block">MITGLIEDSBEITR&Auml;GE 2026</strong>
          TGV &bdquo;Eintracht&ldquo; Beilstein e. V.
        </div>
      </div>
      <h1 className="text-2xl font-bold text-[#b11217] mb-6">
        Mitgliedsbeiträge 2026
      </h1>

      <Section>
        <p className="text-sm text-gray-600 mb-4">
          Der Jahresbeitrag setzt sich aus einem Vereinsbeitrag und dem/den
          jeweiligen Abteilungsbeitrag/-beiträgen zusammen:
        </p>

        <SectionTitle>Vereinsbeitrag</SectionTitle>
        <p className="text-sm text-gray-600 mb-3">
          Der fällige Vereinsbeitrag muss jährlich im Januar beglichen werden.
          Bei erteiltem SEPA Mandat wird der Betrag Ende Januar (ab dem 22.)
          automatisch eingezogen.
        </p>
        <PriceTable
          rows={[
            ["Vereinsbeitrag für Erwachsene", "60,00 Euro"],
            ["Vereinsbeitrag für Zweitmitglieder *", "35,00 Euro"],
            ["Vereinsbeitrag für Kinder bis 18 Jahren", "25,00 Euro"],
            ["Vereinsbeitrag Auszubildende, Schüler und Studenten 18–25 Jahre **", "30,00 Euro"],
            ["Vereinsbeitrag für Familien ***", "100,00 Euro"],
          ]}
        />
        <Note>
          * Ehe- oder Lebenspartner<br />
          ** Bescheinigungen sind bis 31.12. d. J. bei der Geschäftsstelle vorzulegen<br />
          *** ein Kind aus Familienmitgliedschaft wird im Jahr nach Volljährigkeit als
          Erstmitglied weitergeführt, wenn keine Bescheinigung für die Ermäßigung vorliegt.
        </Note>
      </Section>

      <Section>
        <SectionTitle>Abteilungsbeiträge</SectionTitle>
        <p className="text-sm text-gray-600 mb-2">
          Fällige Abteilungsbeiträge müssen jährlich im Februar beglichen werden.
          Bei erteiltem SEPA Mandat wird der Betrag Ende Februar (ab dem 11.)
          automatisch eingezogen.
        </p>

        <SubTitle>Fußball</SubTitle>
        <PriceTable
          rows={[
            ["Erwachsene Aktive", "72,00 Euro"],
            ["1. Kind einer Familie oder Schüler / Student / Azubi", "60,00 Euro"],
            ["2. Kind einer Familie", "36,00 Euro"],
            ["3. und jedes weitere Kind einer Familie", "0,00 Euro"],
            ["Familienbeitrag", "100,00 Euro"],
            ["Fördermitglied (Passive, Trainer)", "40,00 Euro"],
          ]}
        />
        <Note>Beitragsbefreiung auf Antrag für Mitglieder ab 60 Jahren</Note>

        <SubTitle>Gesang</SubTitle>
        <PriceTable
          rows={[
            ["Aktive", "50,00 Euro"],
            ["Passive", "0,00 Euro"],
          ]}
        />

        <SubTitle>Schwimmen</SubTitle>
        <PriceTable
          rows={[
            ["Aktiv/Passiv", "20,00 Euro"],
            ["Familienbeitrag", "30,00 Euro"],
            ["Beitragsfreies Mitglied", "0,00 Euro"],
          ]}
        />

        <SubTitle>Handball</SubTitle>
        <PriceTable
          rows={[
            ["Jugendliche 12–18 Jahre", "50,00 Euro"],
            ["Erwachsene 18–50 Jahre", "50,00 Euro"],
          ]}
        />

        <SubTitle>Tischtennis</SubTitle>
        <PriceTable
          rows={[
            ["Aktiv", "50,00 Euro"],
            ["Passiv", "0,00 Euro"],
            ["Familienbeitrag", "100,00 Euro"],
          ]}
        />

        <SubTitle>Tennis</SubTitle>
        <PriceTable
          rows={[
            ["Aktive", "120,00 Euro"],
            ["Schüler, Studenten, Auszubildende von 18 bis einschl. 26 Jahre *", "50,00 Euro"],
            ["Kinder und Jugendliche ab 10–18 Jahre", "30,00 Euro"],
            ["Kinder und Jugendliche bis 0–9 Jahre", "0,00 Euro"],
            ["Passive", "50,00 Euro"],
          ]}
        />
        <Note>
          * Der Ausbildungsnachweis, mindestens gültig bis zum 31.07. d. J. muss bis Mitte
          Januar des Beitragsjahres vorgelegt werden. Andernfalls wird der Beitrag für ein
          erwachsenes Mitglied erhoben.
        </Note>

        <SubTitle>Turnen &amp; Leichtathletik</SubTitle>
        <PriceTable
          rows={[
            ["Abteilungsbeitrag Kinderturnen/Leichtathletik", "30,00 Euro"],
            ["Abteilungsbeitrag 2. Kind", "15,00 Euro"],
            ["Abteilungsbeitrag ab dem 3. Kind", "0,00 Euro"],
            ["Eltern-Kind-Turnen", "10,00 Euro/Kind"],
            ["Abteilungsbeitrag Jedermann Sport", "30,00 Euro"],
            ["Tang Soo Doo Kursbeitrag", "–"],
          ]}
        />
      </Section>

      <PrintButton />
    </>
  );
}
