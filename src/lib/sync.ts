import { callApi, getTokens } from "./auth";

// ─── Echo suppression ────────────────────────────────────────────────────────

let skipNextSave = new Set<string>();

export function markRemoteUpdate(key: string) {
  skipNextSave.add(key);
}

// ─── Save & Load ─────────────────────────────────────────────────────────────

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

export async function syncSave(key: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data);
  localStorage.setItem(key, json);

  if (!getTokens()) return;

  // Skip if this save was triggered by a remote poll update
  if (skipNextSave.has(key)) {
    skipNextSave.delete(key);
    return;
  }

  const existing = saveTimers.get(key);
  if (existing) clearTimeout(existing);

  saveTimers.set(key, setTimeout(async () => {
    saveTimers.delete(key);
    try {
      const resp = await callApi("/sync", {
        method: "POST",
        body: JSON.stringify({ key, data: json }),
      });
      lastKnownTimestamp.set(key, resp.updatedAt);
    } catch {
      // Offline — local save succeeded
    }
  }, 500));
}

export async function syncLoad<T>(key: string): Promise<T | null> {
  const local = localStorage.getItem(key);
  const localData: T | null = local ? JSON.parse(local) : null;

  if (!getTokens()) return localData;

  try {
    const resp = await callApi(`/sync?key=${encodeURIComponent(key)}`);
    if (!resp.data) return localData;
    const remote: T = JSON.parse(resp.data);
    localStorage.setItem(key, JSON.stringify(remote));
    if (resp.updatedAt) lastKnownTimestamp.set(key, resp.updatedAt);
    return remote;
  } catch {
    return localData;
  }
}

// ─── Real-time Polling ───────────────────────────────────────────────────────

type SubscriptionCallback = (key: string, data: unknown) => void;

const subscribers = new Map<string, Set<SubscriptionCallback>>();
const lastKnownTimestamp = new Map<string, string>();
let pollInterval: ReturnType<typeof setInterval> | null = null;

async function poll() {
  if (!getTokens() || subscribers.size === 0) return;

  for (const [key, cbs] of subscribers) {
    if (cbs.size === 0) continue;
    try {
      const resp = await callApi(`/sync?key=${encodeURIComponent(key)}`);
      if (!resp.data || !resp.updatedAt) continue;

      const prev = lastKnownTimestamp.get(key);
      if (prev === resp.updatedAt) continue;

      lastKnownTimestamp.set(key, resp.updatedAt);
      const data = JSON.parse(resp.data);
      localStorage.setItem(key, JSON.stringify(data));

      // Mark this key so the resulting setState -> syncSave doesn't echo back
      markRemoteUpdate(key);
      cbs.forEach((cb) => cb(key, data));
    } catch {
      // Offline — skip
    }
  }
}

function startPolling() {
  if (pollInterval) return;
  pollInterval = setInterval(poll, 2000);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

export function subscribe(key: string, callback: SubscriptionCallback): () => void {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key)!.add(callback);

  if (getTokens()) startPolling();

  return () => {
    subscribers.get(key)?.delete(callback);
    let total = 0;
    for (const s of subscribers.values()) total += s.size;
    if (total === 0) stopPolling();
  };
}

export function disconnectRealtime() {
  stopPolling();
  subscribers.clear();
  lastKnownTimestamp.clear();
}
