"use client";

import { useEffect, useState } from "react";
import Container from "@/app/_components/container";
import { getTokens, callApi } from "@/lib/auth";

export default function NachrichtenPage() {
  const [tokens, setTokens] = useState<any | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [sending, setSending] = useState(false);
  const [composeMode, setComposeMode] = useState<"reply" | "forward" | null>(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

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

  // Auto-select first message when messages load
  useEffect(() => {
    if (messages.length > 0 && !selected) setSelected(messages[0]);
  }, [messages, selected]);

  async function archiveMessage(m: any) {
    if (!confirm(`Nachricht "${m.subject}" archivieren?`)) return;
    try {
      await callApi("/messages/archive", { method: "POST", body: JSON.stringify({ id: m.id }) });
      setMessages((s) => s.filter(x => x.id !== m.id));
      if (selected?.id === m.id) setSelected(null);
    } catch (e) { alert("Archivieren fehlgeschlagen"); console.error(e); }
  }

  function openReply(m: any) {
    setComposeMode("reply");
    setTo(m.from);
    setSubject(m.subject.startsWith("Re: ") ? m.subject : `Re: ${m.subject}`);
    setBody(`\n\n---- Ursprüngliche Nachricht von ${m.from} am ${new Date(m.sentAt).toLocaleString("de-DE")} ----\n${m.body}`);
  }

  function openForward(m: any) {
    setComposeMode("forward");
    setTo("");
    setSubject(m.subject.startsWith("Fwd: ") ? m.subject : `Fwd: ${m.subject}`);
    setBody(`\n\n---- Weitergeleitete Nachricht von ${m.from} am ${new Date(m.sentAt).toLocaleString("de-DE")} ----\n${m.body}`);
  }

  async function sendMessage() {
    if (!to) { alert("Empfänger erforderlich"); return; }
    setSending(true);
    try {
      await callApi("/messages", { method: "POST", body: JSON.stringify({ recipientEmail: to, subject, body }) });
      alert("Nachricht gesendet");
      setComposeMode(null);
      setTo(""); setSubject(""); setBody("");
    } catch (e) { alert("Senden fehlgeschlagen"); console.error(e); }
    setSending(false);
  }

  if (tokens === undefined) return <p className="text-center text-gray-500 mt-20">Laden…</p>;
  if (!tokens) return <p className="text-center text-gray-500 mt-20">Bitte zuerst anmelden.</p>;

  return (
    <main>
      <Container>
        <div className="max-w-6xl mx-auto py-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Nachrichten</h1>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">{loading ? "Laden…" : `${messages.length}`}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selected && openReply(selected)}
                  disabled={!selected}
                  className="px-3 py-1 text-sm rounded-md bg-[#b11217] text-white hover:bg-[#8f0f13] disabled:opacity-50"
                >Antworten</button>
                <button
                  onClick={() => selected && openForward(selected)}
                  disabled={!selected}
                  className="px-3 py-1 text-sm rounded-md bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                >Weiterleiten</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
            <div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-auto max-h-[70vh]">
                {messages.map((m) => (
                  <div key={m.id} className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${selected?.id === m.id ? "bg-gray-50" : ""}`} onClick={() => setSelected(m)}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{m.subject}</div>
                        <div className="text-xs text-gray-400 truncate">{m.from} · {new Date(m.sentAt).toLocaleString("de-DE")}</div>

                      </div>

                      {/* Archive icon on the right */}
                      <div className="shrink-0 ml-3">
                        <button onClick={(e) => { e.stopPropagation(); archiveMessage(m); }} title="Archivieren" aria-label="Archivieren" className="p-2 rounded hover:bg-gray-100 text-green-600">
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
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{selected.subject}</h2>
                    <div className="text-xs text-gray-400">Von: {selected.from} · {new Date(selected.sentAt).toLocaleString("de-DE")}</div>
                  </div>

                  <div className="mt-4 text-sm text-gray-800 whitespace-pre-wrap">{selected.body}</div>

                  {selected.type === "SUBMISSION" && selected.formData && (
                    <div className="mt-4">
                      <h3 className="font-semibold">Formulardaten</h3>
                      <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-40">{JSON.stringify(selected.formData, null, 2)}</pre>
                    </div>
                  )}

                  {composeMode && (
                    <div className="mt-6">
                      <h3 className="font-semibold">{composeMode === "reply" ? "Antwort" : "Weiterleiten"}</h3>
                      <div className="mt-2 grid gap-2">
                        <input value={to} onChange={e => setTo(e.target.value)} placeholder="An" className="px-3 py-2 border rounded" />
                        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Betreff" className="px-3 py-2 border rounded" />
                        <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className="px-3 py-2 border rounded" />
                        <div className="flex gap-2">
                          <button onClick={sendMessage} disabled={sending} className="px-4 py-2 bg-[#b11217] text-white rounded">Senden</button>
                          <button onClick={() => { setComposeMode(null); setTo(""); setSubject(""); setBody(""); }} className="px-4 py-2 border rounded">Abbrechen</button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
