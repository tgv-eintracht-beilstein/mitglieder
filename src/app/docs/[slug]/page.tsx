import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import markdownToHtml from "@/lib/markdownToHtml";
import type { Metadata } from "next";
import PrintDate from "./print-date";

const PDF_BASE = "https://github.com/tgv-eintracht-beilstein/dokumentation/raw/gh-pages";

const docsDir = path.join(process.cwd(), "dokumentation/docs");

export async function generateStaticParams() {
  return fs.readdirSync(docsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ slug: f.replace(/\.md$/, "") }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const file = path.join(docsDir, `${slug}.md`);
  if (!fs.existsSync(file)) return {};
  const { data } = matter(fs.readFileSync(file, "utf8"));
  return { title: data.title };
}

export default async function DocPage({ params }: Params) {
  const { slug } = await params;
  const file = path.join(docsDir, `${slug}.md`);
  if (!fs.existsSync(file)) return notFound();

  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const html = await markdownToHtml(content);

  return (
    <div className="max-w-2xl mx-auto">

      {/* Print header */}
      <div className="hidden print:flex items-center justify-between mb-6 pb-4 border-b-2 border-[#b11217]">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.tgveintrachtbeilstein.de/wp-content/uploads/2016/04/tgv.logo_.512.png"
            alt="TGV Logo" className="h-10 w-10 bg-white rounded p-0.5"
          />
          <div>
            <div className="font-bold text-sm text-gray-900">TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.&thinsp;V.</div>
            <div className="text-xs text-gray-500">{data.title}</div>
          </div>
        </div>
        <PrintDate />
      </div>

      {/* Screen header */}
      <div className="print:hidden mb-6">
        <div className="inline-block bg-[#b11217] text-white text-xs font-bold px-3 py-1 rounded mb-2 uppercase tracking-wide">
          Dokument
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
            {data.preface && (
              <p className="mt-2 text-sm text-gray-500 leading-relaxed border-l-2 border-[#b11217] pl-3">{data.preface}</p>
            )}
          </div>
          <a href={`${PDF_BASE}/${slug}.pdf`} target="_blank" rel="noopener noreferrer"
            className="shrink-0 hover:opacity-80 transition-opacity" title="PDF herunterladen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://www.tgveintrachtbeilstein.de/wp-content/uploads/2018/12/pdf.png" alt="PDF herunterladen" className="h-8 w-auto" />
          </a>
        </div>
      </div>

      <div
        className="prose prose-sm max-w-none
          prose-headings:text-gray-900 prose-headings:font-semibold
          prose-h1:text-xl prose-h2:text-base prose-h3:text-sm
          prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-1
          prose-a:text-[#b11217] prose-strong:text-gray-800
          print:prose-h2:border-b print:prose-h2:border-gray-300"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Print footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-gray-200 text-[8pt] text-gray-400 flex justify-between">
        <span>TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.&thinsp;V. &middot; Albert-Einstein-Str. 20 &middot; 71717 Beilstein</span>
      </div>
    </div>
  );
}
