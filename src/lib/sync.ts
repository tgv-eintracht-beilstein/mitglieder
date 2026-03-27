import { callApi, getTokens } from "./auth";
import { buildPdfFilename } from "./pdfFilename";

const GRAPHQL_URL = "https://3mebhuz5mzbobiylspolw4k5hy.appsync-api.eu-central-1.amazonaws.com/graphql";
const REALTIME_URL = "wss://3mebhuz5mzbobiylspolw4k5hy.appsync-realtime-api.eu-central-1.amazonaws.com/graphql";

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const tokens = getTokens();
  if (!tokens) throw new Error("Not authenticated");
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: tokens.id_token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

// ─── Mutations & Queries ─────────────────────────────────────────────────────

export async function syncSave(key: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data);
  localStorage.setItem(key, json);

  if (!getTokens()) return;

  try {
    await gql(`mutation PutFormData($key: String!, $data: AWSJSON!) {
      putFormData(key: $key, data: $data) { pk sk updatedAt }
    }`, { key, data: json });
  } catch {
    // Offline — local save succeeded
  }
}

export async function syncLoad<T>(key: string): Promise<T | null> {
  const local = localStorage.getItem(key);
  const localData: T | null = local ? JSON.parse(local) : null;

  if (!getTokens()) return localData;

  try {
    const resp = await gql<{ getFormData: { data: string; updatedAt: string } | null }>(
      `query GetFormData($key: String!) {
        getFormData(key: $key) { data updatedAt }
      }`, { key }
    );
    if (!resp.getFormData) return localData;
    const remote: T = JSON.parse(resp.getFormData.data);
    localStorage.setItem(key, JSON.stringify(remote));
    return remote;
  } catch {
    return localData;
  }
}

export async function saveVersion(key: string, data: unknown, label?: string, fileKeys?: string[]) {
  return gql<{ saveFormVersion: { sk: string; createdAt: string; label: string; fileKeys: string[] } }>(
    `mutation SaveVersion($key: String!, $data: AWSJSON!, $label: String, $fileKeys: [String]) {
      saveFormVersion(key: $key, data: $data, label: $label, fileKeys: $fileKeys) { sk createdAt label fileKeys }
    }`, { key, data: JSON.stringify(data), label: label || "PDF Export", fileKeys: fileKeys || [] }
  );
}

/** Upload PDF blob to S3 via presigned URL, then save version with S3 key */
export async function uploadPdfAndSaveVersion(
  key: string,
  data: unknown,
  pdfBlobs: { blob: Blob; title: string; vorname: string; nachname: string }[],
  label?: string,
) {
  const fileKeys: string[] = [];

  for (const { blob, title, vorname, nachname } of pdfBlobs) {
    const filename = buildPdfFilename(title, vorname, nachname);

    // Get presigned upload URL
    const { uploadUrl, s3Key } = await callApi("/upload/presign", {
      method: "POST",
      body: JSON.stringify({ filename, contentType: "application/pdf" }),
    });

    // Upload directly to S3
    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      body: blob,
    });

    fileKeys.push(s3Key);
  }

  // Save version with file references
  return saveVersion(key, data, label, fileKeys);
}

/** Get a presigned download URL for an S3 key */
export async function getDownloadUrl(s3Key: string): Promise<string> {
  const resp = await callApi(`/download/presign?s3Key=${encodeURIComponent(s3Key)}`);
  return resp.downloadUrl;
}

export async function listVersions(key: string) {
  const resp = await gql<{ listFormVersions: { sk: string; key: string; createdAt: string; label: string; data: string; fileKeys: string[] }[] }>(
    `query ListVersions($key: String!) {
      listFormVersions(key: $key) { sk key createdAt label data fileKeys }
    }`, { key }
  );
  return resp.listFormVersions || [];
}

export async function getVersion(key: string, timestamp: string) {
  const resp = await gql<{ getFormVersion: { data: string; createdAt: string; label: string } | null }>(
    `query GetVersion($key: String!, $timestamp: String!) {
      getFormVersion(key: $key, timestamp: $timestamp) { data createdAt label }
    }`, { key, timestamp }
  );
  return resp.getFormVersion;
}

// ─── Real-time Subscription ──────────────────────────────────────────────────

type SubscriptionCallback = (key: string, data: unknown) => void;

let ws: WebSocket | null = null;
let subscribers: Map<string, Set<SubscriptionCallback>> = new Map();

function getUserSub(): string | null {
  const tokens = getTokens();
  if (!tokens) return null;
  try {
    const payload = JSON.parse(atob(tokens.id_token.split(".")[1]));
    return payload.sub;
  } catch { return null; }
}

function connectRealtime() {
  const tokens = getTokens();
  const sub = getUserSub();
  if (!tokens || !sub || ws) return;

  const header = btoa(JSON.stringify({
    host: new URL(GRAPHQL_URL).host,
    Authorization: tokens.id_token,
  }));

  const connectUrl = `${REALTIME_URL}?header=${encodeURIComponent(header)}&payload=${btoa("{}")}`;
  ws = new WebSocket(connectUrl, "graphql-ws");

  ws.onopen = () => {
    ws?.send(JSON.stringify({ type: "connection_init" }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "connection_ack") {
      // Subscribe to form data changes for this user
      const subscriptionQuery = `subscription OnFormDataChanged($pk: String!) {
        onFormDataChanged(pk: $pk) { pk sk data updatedAt }
      }`;

      ws?.send(JSON.stringify({
        id: "form-sync",
        type: "start",
        payload: {
          data: JSON.stringify({
            query: subscriptionQuery,
            variables: { pk: `USER#${sub}` },
          }),
          extensions: {
            authorization: {
              host: new URL(GRAPHQL_URL).host,
              Authorization: tokens.id_token,
            },
          },
        },
      }));
    }

    if (msg.type === "data" && msg.id === "form-sync") {
      const item = msg.payload?.data?.onFormDataChanged;
      if (!item) return;
      const key = item.sk.replace("DATA#", "");
      const data = JSON.parse(item.data);

      // Update localStorage
      localStorage.setItem(key, JSON.stringify(data));

      // Notify subscribers
      const subs = subscribers.get(key);
      if (subs) subs.forEach(cb => cb(key, data));
    }

    if (msg.type === "ka") {
      // keepalive — do nothing
    }
  };

  ws.onclose = () => {
    ws = null;
    // Reconnect after 3 seconds
    setTimeout(connectRealtime, 3000);
  };

  ws.onerror = () => {
    ws?.close();
  };
}

export function subscribe(key: string, callback: SubscriptionCallback): () => void {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key)!.add(callback);

  // Ensure WebSocket is connected
  connectRealtime();

  // Return unsubscribe function
  return () => {
    subscribers.get(key)?.delete(callback);
  };
}

export function disconnectRealtime() {
  if (ws) {
    ws.close();
    ws = null;
  }
  subscribers.clear();
}
