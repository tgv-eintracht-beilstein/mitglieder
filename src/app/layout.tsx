import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import TopNav from "@/app/_components/sidebar";
import { Suspense } from "react";
import PdfModeDetector from "@/app/_components/pdf-mode-detector";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `TGV \u201eEintracht\u201c Beilstein e. V.`,
  description: `TGV \u201eEintracht\u201c Beilstein e. V. \u2013 Mitgliederbereich`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
      </head>
      <body className={`${inter.className} bg-[#f6f7f9] text-gray-800`}>
        <Suspense><PdfModeDetector /></Suspense>
        {/* Top header */}
        <header className="bg-gradient-to-r from-[#b11217] to-[#8f0f13] text-white print:hidden">
          <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center gap-4">
            <Link href="/">
              <Image
                src="/tgv-logo.png"
                alt="TGV Logo"
                width={48}
                height={48}
                className="bg-white rounded-lg p-1 shrink-0 hover:opacity-90 transition-opacity"
                loading="eager"
                unoptimized
              />
            </Link>
            <div className="flex-1 min-w-0 hidden md:block">
              <h1 className="text-lg font-bold leading-tight whitespace-nowrap">
                TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e. V.
              </h1>
              <p className="text-xs text-red-200">Mitgliederbereich</p>
            </div>
            <div className="ml-auto">
              <TopNav />
            </div>
          </div>
        </header>

        <main className="max-w-screen-xl mx-auto py-8 px-4 md:px-8 min-h-[calc(100vh-64px)]">
          {children}
        </main>

        <footer className="bg-[#1f1f1f] text-white text-sm print:hidden">
          <div className="max-w-screen-xl mx-auto px-6 py-8">
            <div className="flex flex-col items-center gap-6 text-center md:flex-row md:flex-wrap md:justify-around md:text-left md:items-start">
              <div>
                <strong className="block mb-1">TGV &bdquo;Eintracht&ldquo; Beilstein e. V.</strong>
                Albert-Einstein-Str. 20 &middot; 71717 Beilstein
              </div>
              <div>
                <strong className="block mb-1">Kontakt</strong>
                Tel: +49 (0) 7062 5753<br />
                Email: info@tgveintrachtbeilstein.de
              </div>
              <div>
                <strong className="block mb-1">Bankverbindung</strong>
                Volksbank Beilstein-Ilsfeld-Abstatt eG<br />
                IBAN: DE63 6206 2215 0001 0770 07<br />
                BIC: GENODES1BIA
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700 text-center text-xs text-gray-400">
              <Link href="/impressum" className="hover:text-white transition-colors">
                Impressum & Datenschutz
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
