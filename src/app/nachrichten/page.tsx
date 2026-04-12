"use client";

import { useEffect, useState } from "react";
import Container from "@/app/_components/container";
import { getTokens, callApi } from "@/lib/auth";

export default function NachrichtenPage() {
  const [tokens, setTokens] = useState<any | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

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

  if (tokens === undefined) return <p className="text-center text-gray-500 mt-20">Laden…</p>;
  if (!tokens) return <p className="text-center text-gray-500 mt-20">Bitte zuerst anmelden.</p>;

  return (
    <main>
      <Container>
        <div className="max-w-4xl mx-auto py-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Nachrichten</h1>
            <div className="text-sm text-gray-500">{loading ? "Laden…" : `${messages.length} Nachrichten`}</div>
          </div>

          {messages.length === 0 && !loading ? (
            <p className="text-gray-500">Keine Nachrichten vorhanden.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
              {messages.map((m) => (
                <div key={m.id} className="px-5 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(m)}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{m.subject}</div>
                      <div className="text-xs text-gray-400 truncate">Von: {m.from} · {m.type || m.type === "SUBMISSION" ? (m.type === "SUBMISSION" ? "Formular" : "Nachricht") : ""}</div>
                    </div>
                    <div className="text-xs text-gray-400 ml-4">{new Date(m.sentAt).toLocaleString("de-DE")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selected.subject}</h2>
                  <div className="text-xs text-gray-400">Von: {selected.from} · {new Date(selected.sentAt).toLocaleString("de-DE")}</div>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700">Schließen</button>
              </div>

              <div className="mt-4 text-sm text-gray-800 whitespace-pre-wrap">
                {selected.body}
              </div>

              {selected.type === "SUBMISSION" && selected.formData && (
                <div className="mt-4">
                  <h3 className="font-semibold">Formulardaten</h3>
                  <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-40">{JSON.stringify(selected.formData, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
