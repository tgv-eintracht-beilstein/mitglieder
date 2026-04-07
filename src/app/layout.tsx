import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import MobileNav, { LeftNav, RightNav } from "@/app/_components/sidebar";
import AuthButton from "@/app/_components/auth-button";
import { Suspense } from "react";
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
        {/* Top header — matches WordPress TGV style */}
        <header className="site-header fixed top-0 left-0 right-0 z-30 border-b border-[#6b0a0e] text-white print:hidden">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Left nav (desktop) */}
              <div className="hidden lg:flex items-center flex-1">
                <LeftNav />
              </div>

              {/* Center logo — overlaps below header */}
              <Link href="/" className="flex items-center justify-center shrink-0 mx-6 lg:mx-10 relative z-10 !no-underline group">
                <Image
                  src="/tgv-logo.png"
                  alt="TGV Logo"
                  width={56}
                  height={56}
                  className="site-logo relative drop-shadow-lg"
                  loading="eager"
                  unoptimized
                />
              </Link>

              {/* Right nav (desktop) + mobile toggle */}
              <div className="flex items-center flex-1 justify-end">
                <div className="hidden lg:flex">
                  <RightNav />
                </div>
                <div className="lg:hidden print:hidden">
                  <MobileNav />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-screen-xl mx-auto py-8 px-4 md:px-8 min-h-[calc(100vh-64px)] pt-24">
          {children}
        </main>

        <footer className="bg-[#1f1f1f] text-white text-sm print:hidden">
          <div className="max-w-screen-xl mx-auto px-6 py-8">
            <div className="flex flex-col items-center gap-6 text-center md:flex-row md:flex-wrap md:justify-around md:text-left md:items-start">
              <div>
                <strong className="block mb-1">TGV "Eintracht" Beilstein e. V.</strong>
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
