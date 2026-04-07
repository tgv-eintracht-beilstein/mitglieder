import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";

const PDF_BASE = "https://raw.githubusercontent.com/tgv-eintracht-beilstein/dokumentation/gh-pages";

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 1v8M4 6l3 3 3-3"/>
    <path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/>
  </svg>
);

function DocRow({ slug, title, preface, downloadHref }: { slug?: string; title: string; preface?: string; downloadHref: string }) {
  return (
    <div className="rounded-lg border border-gray-100 px-4 py-3 hover:border-[#b11217] hover:shadow-sm transition-all group flex items-center justify-between gap-4">
      {slug ? (
        <Link href={`/docs/${slug}`} className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 group-hover:text-[#b11217] transition-colors">{title}</div>
          {preface && <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{preface}</div>}
        </Link>
      ) : (
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 group-hover:text-[#b11217] transition-colors">{title}</div>
          {preface && <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{preface}</div>}
        </div>
      )}
      <a
        href={downloadHref}
        target="_blank"
        rel="noopener noreferrer"
        title="Herunterladen"
        className="shrink-0 p-1.5 text-gray-400 hover:text-[#b11217] transition-colors"
      >
        <DownloadIcon />
      </a>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
      <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">{title}</div>
      <div className="p-4 space-y-2">{children}</div>
    </section>
  );
}

export default function DocsIndex() {
  const docsDir = path.join(process.cwd(), "dokumentation/docs");
  const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"));

  const docs = files.map((file) => {
    const raw = fs.readFileSync(path.join(docsDir, file), "utf8");
    const { data } = matter(raw);
    return { slug: file.replace(/\.md$/, ""), title: data.title || file, preface: data.preface || "" };
  });

  const satzung = docs.find(d => d.slug === "satzung");
  const ordnungen = docs
    .filter(d => d.slug !== "satzung")
    .sort((a, b) => a.title.localeCompare(b.title, "de"));

  return (
    <>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-[#b11217]">Dokumente</h1>
      </div>

      {satzung && (
        <Section title="Satzung">
          <DocRow slug={satzung.slug} title={satzung.title} preface={satzung.preface} downloadHref={`${PDF_BASE}/${satzung.slug}.pdf`} />
        </Section>
      )}

      <Section title="Ordnungen">
        {ordnungen.map(({ slug, title, preface }) => (
          <DocRow key={slug} slug={slug} title={title} preface={preface} downloadHref={`${PDF_BASE}/${slug}.pdf`} />
        ))}
      </Section>

      <Section title="Corporate Design">
        <DocRow
          title="Corporate Design Paket"
          preface="Logos, Schriften und Vorlagen für den einheitlichen Vereinsauftritt"
          downloadHref="https://github.com/tgv-eintracht-beilstein/design/archive/master.zip"
        />
      </Section>

      <Section title="Hilfe">
        <div className="rounded-lg border border-gray-100 px-4 py-3 hover:border-[#b11217] hover:shadow-sm transition-all group">
          <Link href="/docs/faq" className="block">
            <div className="font-semibold text-gray-900 group-hover:text-[#b11217] transition-colors">Häufig gestellte Fragen</div>
            <div className="text-xs text-gray-400 mt-0.5">Antworten auf die wichtigsten Fragen rund um Mitgliedschaft, Formulare und Vereinsorganisation</div>
          </Link>
        </div>
      </Section>
    </>
  );
}
