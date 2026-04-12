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

function base64url(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generatePKCE() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64url(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  );
  return { verifier, challenge };
}

export function getTokens() {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("auth_tokens");
  if (!raw) return null;
  const tokens = JSON.parse(raw);
  if (tokens.expires_at && Date.now() > tokens.expires_at) {
    sessionStorage.removeItem("auth_tokens");
    return null;
  }
  return tokens as { access_token: string; id_token: string; username: string; groups: string[] };
}

export function getUsername() {
  return getTokens()?.username ?? null;
}

export function getGroups() {
  return getTokens()?.groups ?? [];
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
  sessionStorage.setItem(
    "auth_tokens",
    JSON.stringify({
      access_token: data.access_token,
      id_token: data.id_token,
      username: payload.email || payload.sub,
      groups: payload["cognito:groups"] || [],
      expires_at: Date.now() + data.expires_in * 1000,
    })
  );
  return true;
}

export async function logout() {
  sessionStorage.removeItem("auth_tokens");
  const cfg = await getConfig();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    logout_uri: cfg.logoutUri,
  });
  window.location.href = `${cfg.cognitoDomain}/logout?${params}`;
}

export async function callApi(path: string, options?: RequestInit) {
  const tokens = getTokens();
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
