import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  Font,
  StyleSheet,
  pdf,
  Svg,
  Rect,
  Path as SvgPath,
} from "@react-pdf/renderer";

/* ── Fonts ── */

Font.register({
  family: "SourceSansPro",
  fonts: [
    { src: "/fonts/SourceSansPro-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/SourceSansPro-Semibold.ttf", fontWeight: 600 },
    { src: "/fonts/SourceSansPro-Bold.ttf", fontWeight: 700 },
  ],
});

/* ── Colors ── */

const RED = "#b11217";
const G = {
  900: "#111827", 700: "#374151", 600: "#4b5563", 500: "#6b7280",
  400: "#9ca3af", 300: "#d1d5db", 200: "#e5e7eb",
};

/* ── Styles ── */

export const s = StyleSheet.create({
  page: { fontFamily: "SourceSansPro", fontSize: 9, color: G[700], paddingTop: 30, paddingBottom: 55, paddingHorizontal: 35 },
  // header
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: G[300] },
  headerLogo: { width: 36, height: 36 },
  headerTitle: { fontWeight: 700, fontSize: 9, color: G[700], textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center", lineHeight: 1.3 },
  // headings
  h1: { fontSize: 13, fontWeight: 700, color: RED, letterSpacing: 0.3, marginBottom: 10 },
  h2: { fontSize: 9, fontWeight: 600, color: RED, letterSpacing: 0.3, marginBottom: 6 },
  // section card
  sectionBar: { backgroundColor: RED, color: "#fff", paddingHorizontal: 12, paddingVertical: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  sectionBody: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderTopWidth: 0, borderColor: G[200] },
  // fields
  fieldLabel: { fontSize: 7, color: G[400], textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 },
  fieldValue: { fontSize: 9, borderBottomWidth: 1, borderBottomColor: G[300], paddingVertical: 3, minHeight: 16 },
  fieldRow: { flexDirection: "row", gap: 16, marginBottom: 6 },
  fieldCol: { flex: 1 },
  // table
  tableHeader: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: G[300], paddingBottom: 4, marginBottom: 2 },
  tableHeaderCell: { fontSize: 7, fontWeight: 700, color: G[500], textTransform: "uppercase", letterSpacing: 0.3 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: G[200], paddingVertical: 4 },
  tableCell: { fontSize: 8 },
  // signature
  sigRow: { flexDirection: "row", gap: 24, marginTop: 30 },
  sigCol: { flex: 1 },
  sigLine: { borderTopWidth: 1, borderTopColor: G[400], paddingTop: 3, fontSize: 8, color: G[400], marginTop: 4 },
  sigValue: { minHeight: 40, justifyContent: "flex-end", paddingBottom: 3 },
  sigImage: { height: 32, objectFit: "contain" },
  sigCheck: { fontSize: 6, color: "#16a34a", marginBottom: 2 },
  // footer
  footer: { position: "absolute", bottom: 20, left: 35, right: 35, borderTopWidth: 1, borderTopColor: G[300], paddingTop: 8, flexDirection: "row", gap: 20 },
  footerCol: { flex: 1 },
  footerText: { fontSize: 6.5, color: G[500], lineHeight: 1.6 },
  footerBold: { fontSize: 6.5, fontWeight: 700, color: G[700] },
  // text
  p: { fontSize: 8, color: G[600], marginBottom: 6, lineHeight: 1.6 },
  bold: { fontWeight: 700 },
  small: { fontSize: 7, color: G[400], lineHeight: 1.5 },
  listItem: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 10, fontSize: 8, color: G[600] },
});

/* ── Reusable components ── */

export function PdfHeader({ subtitle }: { subtitle?: string } = {}) {
  return (
    <View style={s.headerRow}>
      <Image src="/tgv-logo.png" style={s.headerLogo} />
      <View style={{ flex: 1 }}>
        <Text style={s.headerTitle}>Turn- und Gesangverein "Eintracht" Beilstein 1823 e. V.</Text>
        {subtitle ? <Text style={{ fontSize: 7.5, color: G[500], textAlign: "center", marginTop: 3, lineHeight: 1.3 }}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export function PdfFooter() {
  return (
    <View style={s.footer} fixed>
      <View style={s.footerCol}>
        <Text style={s.footerBold}>TGV "Eintracht" Beilstein e. V.</Text>
        <Text style={s.footerText}>Albert-Einstein-Str. 20</Text>
        <Text style={s.footerText}>D-71717 Beilstein</Text>
      </View>
      <View style={s.footerCol}>
        <Text style={s.footerText}>Telefon  +49 (0) 7062 5753</Text>
        <Text style={s.footerText}>E-Mail  info@tgveintrachtbeilstein.de</Text>
        <Text style={s.footerText}>Webseite  https://www.tgveintrachtbeilstein.de</Text>
        <Text style={s.footerText}>Steuer-Nr.  65208/49689</Text>
      </View>
      <View style={s.footerCol}>
        <Text style={s.footerBold}>Volksbank Beilstein-Ilsfeld-Abstatt eG</Text>
        <Text style={s.footerText}>IBAN  DE63 6206 2215 0001 0770 07</Text>
        <Text style={s.footerText}>BIC  GENODES1BIA</Text>
      </View>
    </View>
  );
}

export function Field({ label, value }: { label: string; value?: string }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value || " "}</Text>
    </View>
  );
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <View style={s.fieldRow}>{children}</View>;
}

export function FieldCol({ children, flex }: { children: React.ReactNode; flex?: number }) {
  return <View style={[s.fieldCol, flex ? { flex } : {}]}>{children}</View>;
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.sectionBar}>{title}</Text>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

export function Sig({ label, signature, dateLabel, dateValue }: {
  label: string; signature?: string; dateLabel?: string; dateValue?: string;
}) {
  return (
    <View style={{ marginTop: 30 }}>
      {/* Content row — both columns same fixed height */}
      <View style={{ flexDirection: "row", gap: 24, height: 48, alignItems: "flex-end" }}>
        {dateLabel !== undefined && (
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <Text style={{ fontSize: 9, fontWeight: 600, color: G[700] }}>{dateValue || " "}</Text>
          </View>
        )}
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {signature ? (
            <>
              <Text style={s.sigCheck}>✓ Einwilligung zur digitalen Unterschrift erteilt</Text>
              <Image src={signature} style={s.sigImage} />
            </>
          ) : null}
        </View>
      </View>
      {/* Labels row — always perfectly aligned */}
      <View style={{ flexDirection: "row", gap: 24 }}>
        {dateLabel !== undefined && (
          <View style={{ flex: 1 }}><Text style={s.sigLine}>{dateLabel}</Text></View>
        )}
        <View style={{ flex: 1 }}><Text style={s.sigLine}>{label}</Text></View>
      </View>
    </View>
  );
}

export function ApprovalSig() {
  return (
    <View style={{ marginTop: 20 }}>
      <View style={{ flexDirection: "row", gap: 24, height: 48, alignItems: "flex-end" }}>
        <View style={{ flex: 1 }} />
        <View style={{ flex: 1 }} />
      </View>
      <View style={{ flexDirection: "row", gap: 24 }}>
        <View style={{ flex: 1 }}><Text style={s.sigLine}>Datum</Text></View>
        <View style={{ flex: 1 }}><Text style={s.sigLine}>Unterschrift Vorsitzender / Abteilungsleiter</Text></View>
      </View>
    </View>
  );
}

export function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.listItem}>
      <Text style={s.bullet}>•</Text>
      <Text style={[s.p, { flex: 1, marginBottom: 0 }]}>{children}</Text>
    </View>
  );
}

export function Checkbox({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 3 }}>
      {checked ? (
        <Svg width={10} height={10} viewBox="0 0 10 10" style={{ marginRight: 6, marginTop: 1 }}>
          <Rect x="0" y="0" width="10" height="10" rx="1" fill={RED} stroke={RED} strokeWidth="1" />
          <SvgPath d="M2.5 5.5 L4.5 7.5 L7.5 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      ) : (
        <Svg width={10} height={10} viewBox="0 0 10 10" style={{ marginRight: 6, marginTop: 1 }}>
          <Rect x="0.5" y="0.5" width="9" height="9" rx="1" fill="#fff" stroke={G[400]} strokeWidth="1" />
        </Svg>
      )}
      <Text style={[s.p, { flex: 1, marginBottom: 0 }]}>{children}</Text>
    </View>
  );
}

export function InfoGrid({ left, right }: {
  left: { label: string; value: string }[];
  right: { label: string; value: string }[];
}) {
  return (
    <View style={{ flexDirection: "row", gap: 16, marginBottom: 10 }}>
      <View style={{ flex: 1 }}>
        {left.map((f) => (
          <View key={f.label} style={{ marginBottom: 4 }}>
            <Text style={s.fieldLabel}>{f.label}</Text>
            <Text style={{ fontSize: 9, color: G[900] }}>{f.value || " "}</Text>
          </View>
        ))}
      </View>
      <View style={{ flex: 1 }}>
        {right.map((f) => (
          <View key={f.label} style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 2 }}>
            <Text style={[s.fieldLabel, { width: 55, marginBottom: 0 }]}>{f.label}</Text>
            <Text style={{ fontSize: 8, color: G[700], flex: 1 }}>{f.value || " "}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ── Download helpers ── */

export async function downloadPdf(doc: React.ReactElement, filename: string) {
  // react-pdf types changed between versions; cast to any to avoid strict typing issues
  const blob = await pdf(doc as any).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return blob;
}

export async function renderPdfBlobs(docs: { doc: React.ReactElement; filename: string }[]) {
  const blobs: { blob: Blob; filename: string }[] = [];
  for (const { doc, filename } of docs) {
    blobs.push({ blob: await pdf(doc as any).toBlob(), filename });
  }
  return blobs;
}

export async function downloadMultiplePdfs(docs: { doc: React.ReactElement; filename: string }[], mergedFilename?: string, combined = true) {
  const blobs: { blob: Blob; filename: string }[] = [];
  for (const { doc, filename } of docs) {
    blobs.push({ blob: await pdf(doc as any).toBlob(), filename });
  }
  if (!combined || blobs.length <= 1) {
    for (const { blob, filename } of blobs) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  } else {
    const { PDFDocument } = await import("pdf-lib");
    const merged = await PDFDocument.create();
    for (const { blob } of blobs) {
      const src = await PDFDocument.load(await blob.arrayBuffer());
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }
    const mergedBytes = await merged.save();
    const mergedBlob = new Blob([mergedBytes as any], { type: "application/pdf" });
    const url = URL.createObjectURL(mergedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mergedFilename || blobs[0].filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return blobs;
}

export { Document, Page, View, Text, Image };
