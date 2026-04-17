"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import MobileNav, { LeftNav, RightNav } from "@/app/_components/sidebar";
import { useDebug } from "@/lib/use-debug";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNachrichten = pathname === "/nachrichten";
  const [debug, toggleDebug] = useDebug();

  return (
    <body className={`${inter.className} bg-[#f6f7f9] text-gray-800`}>
      <header className="site-header fixed top-0 left-0 right-0 z-30 border-b border-[#6b0a0e] text-white print:hidden">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="hidden lg:flex items-center flex-1">
                <LeftNav />
              </div>

              <Link href="https://tgveintrachtbeilstein.de" className="flex items-center justify-center shrink-0 mx-6 lg:mx-10 relative z-10 !no-underline group">
                <Image
                  src="/tgv-logo.webp"
                  alt="TGV Logo"
                  width={56}
                  height={56}
                  className="site-logo relative drop-shadow-lg"
                  loading="eager"
                />
              </Link>

              <div className="flex items-center flex-1 justify-end">
                <div className="hidden lg:flex">
                  <RightNav debug={debug} />
                </div>
                <div className="lg:hidden print:hidden">
                  <MobileNav debug={debug} />
                </div>
              </div>
            </div>
          </div>
        </header>

      <main className={isNachrichten ? "h-[calc(100vh-64px)] mt-16 overflow-hidden" : "max-w-screen-xl mx-auto py-8 px-4 md:px-8 min-h-[calc(100vh-64px)] pt-24"}>
        {children}
      </main>

      {!isNachrichten && (
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
            <div className="mt-6 pt-4 border-t border-gray-700 text-center text-xs text-gray-300">
              <Link href="/impressum" className="hover:text-white transition-colors">
                Impressum & Datenschutz
              </Link>
              <span className="mx-2">·</span>
              <button onClick={toggleDebug} className="hover:text-white transition-colors">
                {debug ? "Debug is on" : "Debug is off"}
              </button>
            </div>
          </div>
        </footer>
      )}
    </body>
  );
}
