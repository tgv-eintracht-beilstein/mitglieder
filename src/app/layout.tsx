import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import TopNav from "@/app/_components/sidebar";
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
    <html lang="de">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
      </head>
      <body className={`${inter.className} bg-[#f6f7f9] text-gray-800`}>
        {/* Top header */}
        <header className="bg-gradient-to-r from-[#b11217] to-[#8f0f13] text-white print:hidden">
          <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center gap-4">
            <Image
              src="https://www.tgveintrachtbeilstein.de/wp-content/uploads/2016/04/tgv.logo_.512.png"
              alt="TGV Logo"
              width={48}
              height={48}
              className="bg-white rounded-lg p-1 shrink-0"
              unoptimized
            />
            <div className="flex-1 min-w-0 hidden md:block">
              <h1 className="text-lg font-bold leading-tight">
                TGV &bdquo;Eintracht&ldquo; Beilstein e. V.
              </h1>
              <p className="text-xs text-red-200">Mitgliederbereich</p>
            </div>
            <TopNav />
          </div>
        </header>

        <main className="max-w-screen-xl mx-auto py-8 px-3 md:px-8 min-h-[calc(100vh-64px)]">
          {children}
        </main>

        <footer className="bg-[#1f1f1f] text-white text-sm print:hidden">
          <div className="max-w-screen-xl mx-auto px-6 py-8 flex flex-wrap gap-8 justify-around">
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
        </footer>
      </body>
    </html>
  );
}
