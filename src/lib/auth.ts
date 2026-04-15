const API_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? "https://api.tgveintrachtbeilstein.de/mitglieder"
  : "https://api.tgveintrachtbeilstein.de/mitglieder";

interface AuthConfig {
  cognitoDomain: string;
  clientId: string;
  redirectUri: string;
  logoutUri: string;
}

let _config: AuthConfig | null = null;

async function getConfig(): Promise<AuthConfig> {
  if (_config) return _config;
  const res = await fetch(`${API_URL}/config`);
  if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);
  _config = await res.json();
  return _config!;
}

function base64url(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generatePKCE() {
  const rand = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64url(rand);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64url(new Uint8Array(digest));
  return { verifier, challenge };
}

const STORAGE_KEY = "auth_tokens";

interface StoredTokens {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  username: string;
  groups: string[];
  expires_at: number;
}

function readTokens(): StoredTokens | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function writeTokens(tokens: StoredTokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

function clearTokens() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getTokens() {
  return readTokens();
}

export function getUsername() {
  return readTokens()?.username ?? null;
}

export function getGroups() {
  return readTokens()?.groups ?? [];
}

async function refreshTokens(): Promise<StoredTokens | null> {
  const stored = readTokens();
  if (!stored?.refresh_token) return null;

  try {
    const cfg = await getConfig();
    const res = await fetch(`${cfg.cognitoDomain}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: cfg.clientId,
        refresh_token: stored.refresh_token,
      }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    const payload = JSON.parse(atob(data.id_token.split(".")[1]));
    const updated: StoredTokens = {
      access_token: data.access_token,
      id_token: data.id_token,
      refresh_token: data.refresh_token || stored.refresh_token,
      username: payload.email || payload.sub,
      groups: payload["cognito:groups"] || [],
      expires_at: Date.now() + data.expires_in * 1000,
    };
    writeTokens(updated);
    return updated;
  } catch {
    clearTokens();
    return null;
  }
}

async function getValidTokens(): Promise<StoredTokens | null> {
  const stored = readTokens();
  if (!stored) return null;
  // Refresh 60s before expiry
  if (stored.expires_at && Date.now() > stored.expires_at - 60_000) {
    return refreshTokens();
  }
  return stored;
}

export async function login() {
  const [cfg, { verifier, challenge }] = await Promise.all([getConfig(), generatePKCE()]);
  sessionStorage.setItem("pkce_verifier", verifier);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: "openid email profile",
    code_challenge_method: "S256",
    code_challenge: challenge,
    lang: "de",
  });
  window.location.href = `${cfg.cognitoDomain}/oauth2/authorize?${params}`;
}

export async function handleCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const verifier = sessionStorage.getItem("pkce_verifier");
  if (!code || !verifier) return false;

  const cfg = await getConfig();
  const res = await fetch(`${cfg.cognitoDomain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      code,
      code_verifier: verifier,
    }),
  });

  if (!res.ok) return false;
  const data = await res.json();
  sessionStorage.removeItem("pkce_verifier");

  const payload = JSON.parse(atob(data.id_token.split(".")[1]));
  writeTokens({
    access_token: data.access_token,
    id_token: data.id_token,
    refresh_token: data.refresh_token,
    username: payload.email || payload.sub,
    groups: payload["cognito:groups"] || [],
    expires_at: Date.now() + data.expires_in * 1000,
  });
  return true;
}

export async function logout() {
  clearTokens();
  const cfg = await getConfig();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    logout_uri: cfg.logoutUri,
  });
  window.location.href = `${cfg.cognitoDomain}/logout?${params}`;
}

export async function callApi(path: string, options?: RequestInit) {
  const tokens = await getValidTokens();
  if (!tokens) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${tokens.id_token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
