"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getTokens, getUsername, getGroups, callApi } from "@/lib/auth";
import PdfViewer from "@/app/_components/pdf-viewer";
import SignPdfModal from "./sign-pdf-modal";

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

/** Strip "Re: " prefixes to get the base thread subject */
function threadKey(subject: string) {
  return subject.replace(/^(Re:\s*)+/i, "").trim();
}

interface Thread {
  key: string;
  subject: string;
  messages: any[];
  latest: any;
}

function buildThreads(messages: any[]): Thread[] {
  const map = new Map<string, any[]>();
  for (const m of messages) {
    const k = threadKey(m.subject);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(m);
  }
  const threads: Thread[] = [];
  for (const [key, msgs] of map) {
    msgs.sort((a: any, b: any) => a.sentAt.localeCompare(b.sentAt));
    threads.push({ key, subject: key, messages: msgs, latest: msgs[msgs.length - 1] });
  }
  threads.sort((a, b) => b.latest.sentAt.localeCompare(a.latest.sentAt));
  return threads;
}

export default function NachrichtenPage() {
  const [tokens, setTokens] = useState<any | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [signModal, setSignModal] = useState<{ key: string; url: string } | null>(null);
  const [forwarding, setForwarding] = useState(false);
  const [forwardTarget, setForwardTarget] = useState("");
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const myEmail = useRef<string | null>(null);
  const myGroups = useRef<string[]>([]);

  useEffect(() => {
    const t = getTokens();
    setTokens(t ?? null);
    myEmail.current = getUsername();
    myGroups.current = getGroups();
    if (t) {
      setLoading(true);
      callApi("/messages")
        .then((data) => setMessages(data || []))
        .catch((e) => { console.error("Failed to load messages", e); setMessages([]); })
        .finally(() => setLoading(false));
    }
  }, []);

  const threads = buildThreads(messages);
  const thread = threads.find(t => t.key === selectedThread) ?? null;

  useEffect(() => {
    if (threads.length > 0 && !thread) setSelectedThread(threads[0].key);
  }, [threads.length]);

  // Scroll to bottom of conversation when thread changes or new message added
  useEffect(() => {
    requestAnimationFrame(() => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }));
  }, [thread?.messages.length, selectedThread]);

  const doArchive = useCallback(async (m: any) => {
    setMessages((prev) => {
      const next = prev.filter(x => x.id !== m.id);
      return next;
    });
    try {
      await callApi("/messages/archive", { method: "POST", body: JSON.stringify({ id: m.id, formType: m.formType }) });
    } catch (e) {
      setMessages((s) => [...s, m]);
      console.error("Archivieren fehlgeschlagen", e);
    }
  }, []);

  async function sendReply() {
    if (!thread || !replyText.trim()) return;
    setSending(true);
    try {
      // Find the other party to reply to
      const lastInbound = [...thread.messages].reverse().find(m => m.folder !== "SENT");
      const recipientEmail = lastInbound?.from || thread.latest.from;
      const subject = thread.subject.startsWith("Re: ") ? thread.subject : `Re: ${thread.subject}`;
      await callApi("/messages", { method: "POST", body: JSON.stringify({ recipientEmail, subject, body: replyText }) });
      // Optimistically add sent message to the list
      const sentMsg = {
        id: `${new Date().toISOString()}#optimistic-${Date.now()}`,
        from: myEmail.current,
        to: recipientEmail,
        subject,
        body: replyText,
        sentAt: new Date().toISOString(),
        type: "MESSAGE",
        folder: "SENT",
      };
      setMessages(prev => [...prev, sentMsg]);
      setReplyText("");
    } catch (e) { alert("Senden fehlgeschlagen"); console.error(e); }
    setSending(false);
  }

  const g = myGroups.current;
  const isGst = g.includes("geschäftsstelle") || g.includes("tgv-geschaeftsstelle");
  const canSign = g.includes("vorstand") || g.includes("tgv-vorstand") || g.includes("hauptausschuss") || g.includes("tgv-hauptausschuss") || g.includes("erweiterter-vorstand") || g.includes("tgv-erweiterter-vorstand") || g.includes("abteilungsleiter") || g.includes("tgv-abteilungsleiter") || g.some(s => s.startsWith("abt-") || s.startsWith("tgv-abt-"));

  const FORWARD_TARGETS = [
    { value: "tgv-vorstand", label: "Vorstand" },
    { value: "tgv-erweiterter-vorstand", label: "Erw. Vorstand" },
    { value: "tgv-hauptausschuss", label: "Hauptausschuss" },
    { value: "tgv-abteilungsleiter", label: "Abteilungsleiter" },
  ];

  async function handleForward() {
    if (!thread || !forwardTarget) return;
    setForwarding(true);
    try {
      const allPdfKeys = thread.messages.flatMap((m: any) => m.pdfKeys || []);
      const subject = `Fwd: ${thread.subject}`;
      await callApi("/messages", {
        method: "POST",
        body: JSON.stringify({ recipientEmail: forwardTarget, subject, body: `Weitergeleitet zur Unterschrift.`, pdfKeys: allPdfKeys }),
      });
      const sentMsg = {
        id: `${new Date().toISOString()}#fwd-${Date.now()}`,
        from: myEmail.current, to: `Gruppe: ${forwardTarget}`, subject,
        body: `Weitergeleitet zur Unterschrift an ${FORWARD_TARGETS.find(t => t.value === forwardTarget)?.label || forwardTarget}.`,
        sentAt: new Date().toISOString(), type: "MESSAGE", folder: "SENT", pdfKeys: allPdfKeys,
      };
      setMessages(prev => [...prev, sentMsg]);
      setForwardTarget("");
    } catch (e) { alert("Weiterleiten fehlgeschlagen"); console.error(e); }
    setForwarding(false);
  }

  function handleSigned() {
    if (signModal) {
      setAttachmentUrls(prev => { const next = { ...prev }; delete next[signModal.key]; return next; });
    }
    setSignModal(null);
  }

  // Load attachment URLs for all messages in the selected thread
  useEffect(() => {
    if (!thread) return;
    const allKeys = thread.messages.flatMap((m: any) => m.pdfKeys || []);
    if (allKeys.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const key of allKeys) {
        if (cancelled || attachmentUrls[key]) continue;
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
  }, [selectedThread, thread?.messages.length]);

  if (tokens === undefined) return (
    <div className="h-full flex flex-col px-4 md:px-8">
      <div className="max-w-5xl mx-auto w-full flex flex-col flex-1 min-h-0">
          <div className="py-4 shrink-0"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse" /></div>
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 flex-1 min-h-0">
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
    </div>
  );
  if (!tokens) return <p className="text-center text-gray-500 mt-20">Bitte zuerst anmelden.</p>;

  return (
    <div className="h-full flex flex-col px-4 md:px-8">
      <div className="max-w-5xl mx-auto w-full flex flex-col flex-1 min-h-0">
          <div className="py-4 shrink-0">
            <h1 className="text-2xl font-bold text-gray-900">Nachrichten</h1>
          </div>

          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <img src="/tgv-logo-sw.png" alt="TGV Logo" className="w-24 h-24 opacity-20 mb-6" />
              <p className="text-lg font-medium text-gray-400">Alles erledigt!</p>
              <p className="text-sm text-gray-300 mt-1">Keine neuen Nachrichten vorhanden.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 flex-1 min-h-0 overflow-hidden pb-4">
            {/* Thread list */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-auto">
                {threads.map((t) => {
                  const isSel = selectedThread === t.key;
                  const inboxCount = t.messages.filter(m => m.folder === "INBOX").length;
                  return (
                    <div key={t.key} className={`group px-4 py-3 hover:bg-gray-50 cursor-pointer ${isSel ? "bg-gray-50" : ""}`} onClick={() => { setSelectedThread(t.key); setReplyText(""); }}>
                      <div className="flex items-stretch gap-3">
                        <div className="shrink-0">
                          <div className={`w-1 rounded-r h-full ${isSel ? 'bg-[#b11217]' : 'bg-transparent group-hover:bg-gray-200'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium truncate ${isSel ? 'text-[#b11217]' : 'text-gray-900'}`}>{t.subject}</span>
                            {t.messages.length > 1 && <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5 shrink-0">{t.messages.length}</span>}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {t.latest.folder === "SENT" ? `An: ${t.latest.to}` : t.latest.from} · {new Date(t.latest.sentAt).toLocaleString("de-DE")}
                          </div>
                        </div>
                        {/* Archive only inbox messages */}
                        {inboxCount > 0 && (
                          <div className="shrink-0 ml-3">
                            <button onClick={(e) => { e.stopPropagation(); t.messages.filter(m => m.folder === "INBOX").forEach(m => doArchive(m)); }} title="Archivieren" aria-label="Archivieren" className={`p-2 rounded hover:bg-gray-100 text-green-600 transition-opacity duration-150 ${isSel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}`}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Conversation view */}
            <div className="flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-0">
              {!thread ? (
                <div className="flex-1 flex items-center justify-center p-6">
                  <p className="text-gray-500">Wähle eine Nachricht aus der linken Spalte.</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-gray-900 truncate">{thread.subject}</h2>
                        <div className="text-xs text-gray-400">{thread.messages.length} {thread.messages.length === 1 ? "Nachricht" : "Nachrichten"}</div>
                      </div>
                      {isGst && thread.messages.some((m: any) => m.pdfKeys?.length) && (
                        <div className="flex items-center gap-1 shrink-0">
                          <select value={forwardTarget} onChange={e => setForwardTarget(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
                            <option value="">Weiterleiten an…</option>
                            {FORWARD_TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <button onClick={handleForward} disabled={!forwardTarget || forwarding} className="px-3 py-1.5 text-xs bg-[#b11217] text-white rounded-lg font-medium hover:bg-[#8f0f13] disabled:opacity-40">
                            {forwarding ? "…" : "Senden"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-auto p-4 space-y-3">
                    {thread.messages.map((m: any) => {
                      const isMine = m.folder === "SENT";
                      return (
                        <div key={m.id} className={`rounded-lg p-3 ${isMine ? "bg-[#b11217]/5 border-l-2 border-[#b11217]/30" : "bg-gray-50 border-l-2 border-gray-200"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${isMine ? "text-[#b11217]" : "text-gray-600"}`}>
                              {isMine ? "Ich" : m.from}
                            </span>
                            <span className="text-[10px] text-gray-400">{new Date(m.sentAt).toLocaleString("de-DE")}</span>
                          </div>
                            <div className="text-sm text-gray-800 whitespace-pre-wrap">{m.body}</div>

                            {m.type === "SUBMISSION" && m.formData && (
                              <div className="mt-3">
                                <h3 className="font-semibold text-sm">Formulardaten</h3>
                                <FormDataTable data={m.formData} />
                              </div>
                            )}

                            {/* PDF attachments inline */}
                            {m.pdfKeys?.map((key: string) => {
                              const au = attachmentUrls[key];
                              if (!au) return <div key={key} className="text-xs text-gray-400 mt-2">Lade Anhang…</div>;
                              if (au === "NOT_FOUND") return <div key={key} className="text-xs text-red-500 mt-2">Anhang nicht gefunden.</div>;
                              return (
                                <div key={key} className="relative group mt-3">
                                  <PdfViewer url={`${au}#toolbar=0&navpanes=0`} filename={key.split("/").pop()} />
                                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                    {canSign && (
                                      <button
                                        onClick={() => setSignModal({ key, url: au })}
                                        title="Unterschreiben"
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[#b11217] text-white shadow-md hover:bg-[#8f0f13] transition-colors"
                                      >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                        </svg>
                                      </button>
                                    )}
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
                            })}
                          </div>
                      );
                    })}
                    <div ref={threadEndRef} />
                  </div>

                  {/* Reply box */}
                  <div className="px-4 py-3 border-t border-gray-100 shrink-0">
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
                </>
              )}
            </div>
          </div>
          )}
      {signModal && <SignPdfModal pdfUrl={signModal.url} pdfKey={signModal.key} onClose={() => setSignModal(null)} onSigned={handleSigned} />}
      </div>
    </div>
  );
}
