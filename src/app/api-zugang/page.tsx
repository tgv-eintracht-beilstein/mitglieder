"use client";

import { useState, useEffect, useCallback } from "react";
import { callApi, getTokens } from "@/lib/auth";

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
}

export default function ApiZugangPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoggedIn = !!getTokens();

  const loadKeys = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await callApi("/apikeys");
      setKeys(data);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const createKey = async () => {
    setCreatedKey(null);
    try {
      const data = await callApi("/apikeys", {
        method: "POST",
        body: JSON.stringify({ name: newKeyName || "default" }),
      });
      setCreatedKey(data.key);
      setNewKeyName("");
      loadKeys();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const deleteKey = async (id: string) => {
    try {
      await callApi(`/apikeys/${id}`, { method: "DELETE" });
      loadKeys();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">API-Zugang</h1>
        <p className="text-gray-500 text-sm">Bitte melden Sie sich an, um API-Schlüssel zu verwalten.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">API-Zugang</h1>
      <p className="text-gray-500 text-sm mb-6">
        Erstellen Sie API-Schlüssel, um Ihre Daten über die REST-API abzurufen. Jeder Schlüssel ist auf 60 Anfragen pro Stunde begrenzt.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {createdKey && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-800">
          <p className="font-semibold mb-1">Neuer API-Schlüssel erstellt:</p>
          <code className="block bg-white border border-green-300 rounded px-3 py-2 text-xs break-all font-mono">{createdKey}</code>
          <p className="mt-2 text-xs text-green-600">Speichern Sie diesen Schlüssel sicher — er wird nicht erneut angezeigt.</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Neuen Schlüssel erstellen</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Name (z.B. Meine Integration)"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#b11217]"
          />
          <button
            onClick={createKey}
            className="px-4 py-2 bg-[#b11217] text-white rounded-lg text-sm font-medium hover:bg-[#8f0f13] transition-colors"
          >
            Erstellen
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Ihre API-Schlüssel</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Laden…</p>
        ) : keys.length === 0 ? (
          <p className="text-gray-400 text-sm">Keine API-Schlüssel vorhanden.</p>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <div>
                  <span className="font-medium text-sm text-gray-900">{k.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    Erstellt: {new Date(k.createdAt).toLocaleDateString("de-DE")}
                  </span>
                </div>
                <button
                  onClick={() => deleteKey(k.id)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Widerrufen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">API-Dokumentation</h2>
        <p className="text-gray-500 text-sm mb-4">
          Verwenden Sie Ihren API-Schlüssel im <code className="bg-gray-100 px-1 rounded text-xs">X-Api-Key</code> Header.
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Formulardaten abrufen</h3>
            <div className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs font-mono overflow-x-auto">
              <div>GET /ext/data/&#123;key&#125;</div>
              <div className="text-gray-500 mt-1"># Beispiel:</div>
              <div>curl -H &quot;X-Api-Key: tgv_...&quot; \</div>
              <div>&nbsp;&nbsp;https://api.tgveintrachtbeilstein.de/ext/data/ehrenamtspauschale_v2</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Verfügbare Schlüssel</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><code className="bg-gray-100 px-1 rounded text-xs">ehrenamtspauschale_v2</code> — Ehrenamtspauschale</li>
              <li><code className="bg-gray-100 px-1 rounded text-xs">reisekosten_v1</code> — Reisekostenabrechnung</li>
              <li><code className="bg-gray-100 px-1 rounded text-xs">uebungsleiterpauschale_v1</code> — Übungsleiterpauschale</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Rate Limiting</h3>
            <p className="text-sm text-gray-600">Maximal 60 Anfragen pro Stunde pro API-Schlüssel. Bei Überschreitung erhalten Sie HTTP 429.</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Antwortformat</h3>
            <div className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs font-mono overflow-x-auto">
              <div>&#123;</div>
              <div>&nbsp;&nbsp;&quot;key&quot;: &quot;ehrenamtspauschale_v2&quot;,</div>
              <div>&nbsp;&nbsp;&quot;data&quot;: &#123; ... &#125;,</div>
              <div>&nbsp;&nbsp;&quot;updatedAt&quot;: &quot;2026-03-25T14:30:00Z&quot;</div>
              <div>&#125;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
