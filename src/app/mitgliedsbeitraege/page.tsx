import type { Metadata } from "next";
import PrintButton from "@/app/_components/print-button";
import DownloadPageButton from "@/app/_components/download-page-button";

const ABTEILUNGEN = [
  { name: "Fußball",       slug: "fussball" },
  { name: "Leichtathletik",slug: "leichtathletik" },
  { name: "Turnen",        slug: "turnen" },
  { name: "Tischtennis",   slug: "tischtennis" },
  { name: "Handball",      slug: "handball" },
  { name: "Schwimmen",     slug: "schwimmen" },
  { name: "Gymnastik",     slug: "gymnastik" },
  { name: "Gesang",        slug: "gesang" },
  { name: "Tennis",        slug: "tennis" },
  { name: "Ski & Berg",    slug: "ski_und_berg" },
];

function AbteilungIcon({ slug, print = false, size = 20 }: { slug: string; print?: boolean; size?: number }) {
  const ext = print ? "png" : "svg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/abteilung.${slug}.${ext}`}
      alt=""
      width={size}
      height={size}
      className="shrink-0 object-contain"
    />
  );
}

export const metadata: Metadata = {
  title: 'Mitgliedsbeiträge 2026 – TGV "Eintracht" Beilstein e. V.',
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
  // Normalize the title (decode HTML entities and trim)
  const title = String(children)
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
  
  // For combined sections like "Turnen & Leichtathletik", show multiple icons
  const parts = title.split(" & ");
  const abteilungen = parts
    .map(part => ABTEILUNGEN.find(a => a.name === part.trim()))
    .filter((a): a is typeof ABTEILUNGEN[0] => a !== undefined);

  return (
    <div className="flex items-center gap-3 mt-6 mb-3 pb-3 border-b border-gray-200">
      <div className="flex items-center gap-2">
        {abteilungen.map((abt) => (
          <AbteilungIcon key={abt.slug} slug={abt.slug} size={24} />
        ))}
      </div>
      <h3 className="text-sm font-bold text-[#b11217] uppercase tracking-wider">
        {children}
      </h3>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-500 mt-2 leading-relaxed">{children}</p>;
}

export default function MitgliedsbeitraegePage() {
  return (
    <>
      {/* Print header */}
      <div className="hidden print:flex items-center gap-3 mb-6 pb-4 border-b border-gray-300">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tgv-logo.png" alt="TGV Logo" width={44} height={44} />
        <div>
          <div className="font-bold text-base text-gray-900">TGV &quot;Eintracht&quot; Beilstein 1823 e.V.</div>
          <div className="text-xs text-gray-500">Mitgliedsbeiträge 2026</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-[#b11217]">Mitgliedsbeiträge 2026</h1>
      </div>
      <h1 className="hidden print:block text-2xl font-bold text-[#b11217] mb-6">Mitgliedsbeiträge 2026</h1>

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
            ["Vereinsbeitrag für Erwachsene", "80,00 Euro"],
            ["Vereinsbeitrag für Zweitmitglieder *", "45,00 Euro"],
            ["Vereinsbeitrag für Kinder bis 18 Jahren", "35,00 Euro"],
            ["Vereinsbeitrag Auszubildende, Schüler und Studenten 18–25 Jahre **", "35,00 Euro"],
            ["Vereinsbeitrag für Familien ***", "130,00 Euro"],
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
            ["Aktive", "70,00 Euro"],
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
            ["Abteilungsbeitrag", "50,00 Euro"],
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
            ["Abteilungsbeitrag Kinderturnen/Leichtathletik", "50,00 Euro"],
            ["Abteilungsbeitrag 2. Kind", "30,00 Euro"],
            ["Abteilungsbeitrag ab dem 3. Kind", "0,00 Euro"],
            ["Eltern-Kind-Turnen", "25,00 Euro/Kind"],
            ["Jedermänner", "50,00 Euro"],
            ["Tang Soo Doo", "Kursbeitrag"],
          ]}
        />

        <SubTitle>Gymnastik</SubTitle>
        <PriceTable
          rows={[
            ["Abteilungsbeitrag", "15,00 Euro"],
          ]}
        />
      </Section>

      <div className="flex justify-start print:hidden mt-2 mb-6 gap-2">
        {/* Mobile: PDF download */}
        <div className="md:hidden">
          <DownloadPageButton filename="mitgliedsbeitraege-2026.pdf" />
        </div>
        {/* Desktop: print */}
        <div className="hidden md:block">
          <PrintButton />
        </div>
      </div>

      {/* Print footer */}      <div className="hidden print:grid grid-cols-3 gap-4 mt-6 pt-3 border-t border-gray-300 text-[10px] text-gray-500 leading-snug">
        <div className="flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tgv-logo-sw.png" alt="TGV Logo" width={32} height={32} className="opacity-50 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-gray-700">TGV &quot;Eintracht&quot; Beilstein e. V.</div>
            <div>Albert-Einstein-Str. 20 · 71717 Beilstein</div>
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-700 mb-0.5">Kontakt</div>
          <div>Tel: +49 (0) 7062 5753</div>
          <div>info@tgveintrachtbeilstein.de</div>
        </div>
        <div>
          <div className="font-semibold text-gray-700 mb-0.5">Bankverbindung</div>
          <div>Volksbank Beilstein-Ilsfeld-Abstatt eG</div>
          <div>IBAN: DE63 6206 2215 0001 0770 07</div>
          <div>BIC: GENODES1BIA</div>
        </div>
      </div>
    </>
  );
}
