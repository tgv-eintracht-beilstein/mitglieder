import type { Metadata } from "next";
import { Suspense } from "react";
import { LayoutContent } from "./layout-client";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mitglied.tgveintrachtbeilstein.de"),
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
      <Suspense fallback={null}>
        <LayoutContent>{children}</LayoutContent>
      </Suspense>
    </html>
  );
}
