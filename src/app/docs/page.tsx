import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";

const PDF_BASE = "https://github.com/tgv-eintracht-beilstein/dokumentation/raw/gh-pages";

export default function DocsIndex() {
  const docsDir = path.join(process.cwd(), "dokumentation/docs");
  const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"));

  const docs = files.map((file) => {
    const raw = fs.readFileSync(path.join(docsDir, file), "utf8");
    const { data } = matter(raw);
    return { slug: file.replace(/\.md$/, ""), title: data.title || file, preface: data.preface || "" };
  }).sort((a, b) => {
    if (a.slug === "satzung") return -1;
    if (b.slug === "satzung") return 1;
    return a.title.localeCompare(b.title, "de");
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Dokumente</h1>
      <p className="text-sm text-gray-400 mb-6">TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.&thinsp;V.</p>
      <div className="space-y-3">
        {docs.map(({ slug, title, preface }) => (
          <div key={slug} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 hover:border-[#b11217] hover:shadow-md transition-all group flex items-center justify-between gap-4">
            <Link href={`/docs/${slug}`} className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 group-hover:text-[#b11217] transition-colors">{title}</div>
              {preface && <div className="text-xs text-gray-400 mt-1 line-clamp-2">{preface}</div>}
            </Link>
            <a href={`${PDF_BASE}/${slug}.pdf`} target="_blank" rel="noopener noreferrer"
              className="shrink-0 hover:opacity-80 transition-opacity" title="PDF herunterladen">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.tgveintrachtbeilstein.de/wp-content/uploads/2018/12/pdf.png" alt="PDF" className="h-8 w-auto" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
