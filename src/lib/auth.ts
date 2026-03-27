const COGNITO_DOMAIN = "https://tgv-eintracht-beilstein.auth.eu-central-1.amazoncognito.com";
const CLIENT_ID = "5eg4a17tb2op22nasc2s1t6omq";
const REDIRECT_URI =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://mitglieder.tgveintrachtbeilstein.de/callback"
    : "http://localhost:3003/callback";
const API_URL = "https://9f0uyejcqi.execute-api.eu-central-1.amazonaws.com";

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
  // check expiry
  if (tokens.expires_at && Date.now() > tokens.expires_at) {
    sessionStorage.removeItem("auth_tokens");
    return null;
  }
  return tokens as { access_token: string; id_token: string; username: string };
}

export function getUsername() {
  return getTokens()?.username ?? null;
}

export async function login() {
  const { verifier, challenge } = await generatePKCE();
  sessionStorage.setItem("pkce_verifier", verifier);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "openid email profile",
    code_challenge_method: "S256",
    code_challenge: challenge,
  });
  window.location.href = `${COGNITO_DOMAIN}/oauth2/authorize?${params}`;
}

export async function handleCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const verifier = sessionStorage.getItem("pkce_verifier");
  if (!code || !verifier) return false;

  const res = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code,
      code_verifier: verifier,
    }),
  });

  if (!res.ok) return false;
  const data = await res.json();
  sessionStorage.removeItem("pkce_verifier");

  // decode id_token to get email
  const payload = JSON.parse(atob(data.id_token.split(".")[1]));
  sessionStorage.setItem(
    "auth_tokens",
    JSON.stringify({
      access_token: data.access_token,
      id_token: data.id_token,
      username: payload.email || payload.sub,
      expires_at: Date.now() + data.expires_in * 1000,
    })
  );
  return true;
}

export function logout() {
  sessionStorage.removeItem("auth_tokens");
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri:
      typeof window !== "undefined" && window.location.hostname !== "localhost"
        ? "https://mitglieder.tgveintrachtbeilstein.de"
        : "http://localhost:3003",
  });
  window.location.href = `${COGNITO_DOMAIN}/logout?${params}`;
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
