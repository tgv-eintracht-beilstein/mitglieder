import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DocPageClient from "./client";

const PDF_BASE = "https://raw.githubusercontent.com/tgv-eintracht-beilstein/dokumentation/gh-pages";
const docsDir = path.join(process.cwd(), "dokumentation/docs");

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return fs.readdirSync(docsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ slug: f.replace(/\.md$/, "") }));
}

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

  const { data } = matter(fs.readFileSync(file, "utf8"));
  const pdfUrl = `${PDF_BASE}/${slug}.pdf`;

  return (
    <DocPageClient
      title={data.title}
      preface={data.preface}
      pdfUrl={pdfUrl}
      filename={`${slug}.pdf`}
    />
  );
}
