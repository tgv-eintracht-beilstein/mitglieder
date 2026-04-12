import { syncSave, syncLoad, subscribe } from "./sync";

export const SHARED_ADDRESS_KEY = "shared_address_v1";

export interface SharedAddress {
  nachname: string;
  vorname: string;
  strasse: string;
  plzOrt: string;
  geburtsdatum: string;
  telefon: string;
  email: string;
}

const empty: SharedAddress = { nachname: "", vorname: "", strasse: "", plzOrt: "", geburtsdatum: "", telefon: "", email: "" };

export function loadSharedAddress(): SharedAddress {
  try {
    const raw = localStorage.getItem(SHARED_ADDRESS_KEY);
    if (raw) return { ...empty, ...JSON.parse(raw) };
  } catch {}
  return { ...empty };
}

export function saveSharedAddress(addr: SharedAddress) {
  localStorage.setItem(SHARED_ADDRESS_KEY, JSON.stringify(addr));
  syncSave(SHARED_ADDRESS_KEY, addr);
}

export const SHARED_SIGNATURE_KEY = "shared_signature_v1";

export function loadSharedSignature(): string {
  try { return localStorage.getItem(SHARED_SIGNATURE_KEY) ?? ""; } catch { return ""; }
}

export function saveSharedSignature(dataUrl: string) {
  try {
    localStorage.setItem(SHARED_SIGNATURE_KEY, dataUrl);
    syncSave(SHARED_SIGNATURE_KEY, dataUrl);
  } catch {}
}

// ── Remote sync on startup ──

let initialized = false;

export async function initSharedSync() {
  if (initialized) return;
  initialized = true;

  const addr = await syncLoad<SharedAddress>(SHARED_ADDRESS_KEY);
  if (addr) localStorage.setItem(SHARED_ADDRESS_KEY, JSON.stringify(addr));

  const sig = await syncLoad<string>(SHARED_SIGNATURE_KEY);
  if (sig) localStorage.setItem(SHARED_SIGNATURE_KEY, sig);

  subscribe(SHARED_ADDRESS_KEY, (_k, data) => {
    localStorage.setItem(SHARED_ADDRESS_KEY, JSON.stringify(data));
  });

  subscribe(SHARED_SIGNATURE_KEY, (_k, data) => {
    localStorage.setItem(SHARED_SIGNATURE_KEY, data as string);
  });
}
