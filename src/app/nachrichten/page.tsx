"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Container from "@/app/_components/container";
import { getTokens, callApi } from "@/lib/auth";
import PdfViewer from "@/app/_components/pdf-viewer";

const LABELS: Record<string, string> = {
  vorname: "Vorname", nachname: "Nachname", geburtsdatum: "Geburtsdatum",
  strasse: "Straße", plzOrt: "PLZ / Ort", plz: "PLZ", ort: "Ort",
  telefon: "Telefon", email: "E-Mail", iban: "IBAN",
  kontoinhaber: "Kontoinhaber", abteilung: "Abteilung", abteilungen: "Abteilungen",
  funktion: "Funktion", verguetung: "Vergütung", jahr: "Jahr",
  verzicht: "Verzicht", spendenbetrag: "Spendenbetrag",
  zahlungBar: "Zahlung bar", zahlungUeberweisung: "Zahlung Überweisung",
  familienmitgliedschaft: "Familienmitgliedschaft",
  uebungsleiterKategorie: "Übungsleiter-Kategorie",
  monatVon: "Monat von", monatBis: "Monat bis",
  aufwandsspende: "Aufwandsspende",
  datenschutzAkzeptiert: "Datenschutz akzeptiert",
  datenschutzKategorien: "Datenschutz-Kategorien",
  istPartner: "Partner",
};

function formatValue(v: unknown): string {
  if (v === true) return "Ja";
  if (v === false) return "Nein";
  if (Array.isArray(v)) return v.join(", ");
  if (v == null || v === "") return "–";
  return String(v);
}

const HIDDEN_KEYS = new Set(["signature", "overrideDate", "rows", "nextId", "id", "addressId"]);
const MASKED_KEYS = new Set(["iban"]);

function maskValue(k: string, v: unknown): string {
  if (MASKED_KEYS.has(k) && typeof v === "string" && v.length > 4) return "••••" + v.slice(-4);
  return formatValue(v);
}

function FormDataTable({ data }: { data: Record<string, unknown> }) {
  const { personen, adressen, ...rest } = data as any;

  const simpleEntries = Object.entries(rest).filter(
    ([k, v]) => !HIDDEN_KEYS.has(k) && typeof v !== "object"
  );

  return (
    <div className="mt-2 space-y-3 text-sm">
      {simpleEntries.length > 0 && (
        <table className="w-full text-left">
          <tbody>
            {simpleEntries.map(([k, v]) => (
              <tr key={k} className="border-b border-gray-100">
                <td className="py-1 pr-4 text-gray-500 whitespace-nowrap">{LABELS[k] || k}</td>
                <td className="py-1 text-gray-800">{maskValue(k, v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {Array.isArray(adressen) && adressen.map((a: any, i: number) => (
        <div key={a.id || i}>
          <div className="text-xs font-medium text-gray-500 mt-2">Adresse {adressen.length > 1 ? i + 1 : ""}</div>
          <table className="w-full text-left">
            <tbody>
              {["strasse", "plz", "ort"].map(k => a[k] ? (
                <tr key={k} className="border-b border-gray-100">
                  <td className="py-1 pr-4 text-gray-500 whitespace-nowrap">{LABELS[k] || k}</td>
                  <td className="py-1 text-gray-800">{a[k]}</td>
                </tr>
              ) : null)}
            </tbody>
          </table>
        </div>
      ))}
      {Array.isArray(personen) && personen.map((p: any, i: number) => (
        <div key={p.id || i}>
          <div className="text-xs font-medium text-gray-500 mt-2">Person {personen.length > 1 ? i + 1 : ""}</div>
          <table className="w-full text-left">
            <tbody>
              {["vorname", "nachname", "geburtsdatum", "telefon", "email", "abteilungen", "datenschutzAkzeptiert"].map(k => {
                const v = p[k];
                if (v == null || v === "") return null;
                return (
                  <tr key={k} className="border-b border-gray-100">
                    <td className="py-1 pr-4 text-gray-500 whitespace-nowrap">{LABELS[k] || k}</td>
                    <td className="py-1 text-gray-800">{formatValue(v)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default function NachrichtenPage() {
  const [tokens, setTokens] = useState<any | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = getTokens();
    setTokens(t ?? null);
    if (t) {
      setLoading(true);
      callApi("/messages")
        .then((data) => setMessages(data || []))
        .catch((e) => { console.error("Failed to load messages", e); setMessages([]); })
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !selected) setSelected(messages[0]);
  }, [messages]);

  const doArchive = useCallback(async (m: any) => {
    setMessages((prev) => {
      const next = prev.filter(x => x.id !== m.id);
      setSelected((s: any) => s?.id === m.id ? (next[0] ?? null) : s);
      return next;
    });
    try {
      await callApi("/messages/archive", { method: "POST", body: JSON.stringify({ id: m.id, formType: m.formType }) });
    } catch (e) {
      setMessages((s) => [...s, m].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
      console.error("Archivieren fehlgeschlagen", e);
    }
  }, []);

  async function sendReply() {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      const subject = selected.subject.startsWith("Re: ") ? selected.subject : `Re: ${selected.subject}`;
      await callApi("/messages", { method: "POST", body: JSON.stringify({ recipientEmail: selected.from, subject, body: replyText }) });
      setReplyText("");
    } catch (e) { alert("Senden fehlgeschlagen"); console.error(e); }
    setSending(false);
  }

  useEffect(() => {
    setAttachmentUrls({});
    if (!selected?.pdfKeys || selected.pdfKeys.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const key of selected.pdfKeys) {
        if (cancelled) return;
        try {
          const data = await callApi(`/file?key=${encodeURIComponent(key)}`);
          if (data?.url && !cancelled) setAttachmentUrls((s) => ({ ...s, [key]: data.url }));
        } catch (e) {
          console.error("Failed to fetch signed url for", key, e);
          if (!cancelled) setAttachmentUrls((s) => ({ ...s, [key]: "NOT_FOUND" }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selected?.id]);

  if (tokens === undefined) return (
    <main>
      <Container>
        <div className="max-w-4xl mx-auto mt-6">
          <div className="mb-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse" /></div>
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-4 py-3 flex gap-3">
                  <div className="w-1 rounded-r bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
              <div className="space-y-2 mt-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${85 - i * 15}%` }} />)}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
  if (!tokens) return <p className="text-center text-gray-500 mt-20">Bitte zuerst anmelden.</p>;

  return (
    <main>
      <Container>
        <div className="max-w-4xl mx-auto mt-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Nachrichten</h1>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <img src="/tgv-logo-sw.svg" alt="TGV Logo" className="w-24 h-24 opacity-20 mb-6" />
              <p className="text-lg font-medium text-gray-400">Alles erledigt!</p>
              <p className="text-sm text-gray-300 mt-1">Keine neuen Nachrichten vorhanden.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
            <div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-auto max-h-[70vh]">
                {messages.map((m) => (
                  <div key={m.id} className={`group px-4 py-3 hover:bg-gray-50 cursor-pointer ${selected?.id === m.id ? "bg-gray-50" : ""}`} onClick={() => setSelected(m)}>
                    <div className="flex items-stretch gap-3">
                      <div className="shrink-0">
                        <div className={`w-1 rounded-r h-full ${selected?.id === m.id ? 'bg-[#b11217]' : 'bg-transparent group-hover:bg-gray-200'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${selected?.id === m.id ? 'text-[#b11217]' : 'text-gray-900'}`}>{m.subject}</div>
                        <div className="text-xs text-gray-400 truncate">{m.from} · {new Date(m.sentAt).toLocaleString("de-DE")}</div>
                      </div>
                      <div className="shrink-0 ml-3">
                        <button onClick={(e) => { e.stopPropagation(); doArchive(m); }} title="Archivieren" aria-label="Archivieren" className={`p-2 rounded hover:bg-gray-100 text-green-600 transition-opacity duration-150 ${selected?.id === m.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {!selected ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <p className="text-gray-500">Wähle eine Nachricht aus der linken Spalte.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quick reply */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex gap-2 items-end">
                      <textarea
                        ref={replyRef}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                        placeholder="Antworten…"
                        rows={1}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none outline-none focus:border-gray-400"
                      />
                      <button onClick={sendReply} disabled={sending || !replyText.trim()} className="px-4 py-2 bg-[#b11217] text-white rounded-lg text-sm font-medium hover:bg-[#8f0f13] disabled:opacity-50">
                        Senden
                      </button>
                    </div>
                  </div>

                  {/* Message text */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">{selected.subject}</h2>
                      <div className="text-xs text-gray-400">Von: {selected.from} · {new Date(selected.sentAt).toLocaleString("de-DE")}</div>
                    </div>
                    <div className="mt-4 text-sm text-gray-800 whitespace-pre-wrap">{selected.body}</div>

                    {selected.type === "SUBMISSION" && selected.formData && (
                      <div className="mt-4">
                        <h3 className="font-semibold">Formulardaten</h3>
                        <FormDataTable data={selected.formData} />
                      </div>
                    )}
                  </div>

                  {/* PDF attachments */}
                  {selected.pdfKeys?.map((key: string) => (
                    <div key={key}>
                      {(() => {
                        const au = attachmentUrls[key];
                        if (!au) return <div className="text-sm text-gray-500">Lade Anhang…</div>;
                        if (au === "NOT_FOUND") return <div className="text-sm text-red-500">Anhang nicht gefunden.</div>;
                        return (
                          <div className="relative group">
                            <PdfViewer url={`${au}#toolbar=0&navpanes=0`} filename={key.split("/").pop()} />
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                              <button
                                onClick={async () => {
                                  const res = await fetch(au);
                                  const blob = await res.blob();
                                  const a = document.createElement("a");
                                  a.href = URL.createObjectURL(blob);
                                  a.download = key.split("/").pop() || "dokument.pdf";
                                  a.click();
                                  URL.revokeObjectURL(a.href);
                                }}
                                title="Herunterladen"
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#b11217] text-white shadow-md hover:bg-[#8f0f13] transition-colors"
                              >
                                <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M7 1v8M4 6l3 3 3-3"/>
                                  <path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/>
                                </svg>
                              </button>
                              <button
                                onClick={() => { const w = window.open(au); w?.addEventListener("load", () => w.print()); }}
                                title="Drucken"
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#b11217] text-white shadow-md hover:bg-[#8f0f13] transition-colors"
                              >
                                <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 5V1h8v4"/>
                                  <rect x="1" y="5" width="12" height="6" rx="1"/>
                                  <path d="M3 11v2h8v-2"/>
                                  <circle cx="10.5" cy="8" r="0.5" fill="currentColor"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </Container>
    </main>
  );
}
