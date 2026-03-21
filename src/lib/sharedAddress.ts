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

export function loadSharedAddress(): SharedAddress {
  try {
    const raw = localStorage.getItem(SHARED_ADDRESS_KEY);
    if (raw) return { email: "", ...JSON.parse(raw) as SharedAddress };
  } catch {}
  return { nachname: "", vorname: "", strasse: "", plzOrt: "", geburtsdatum: "", telefon: "", email: "" };
}

export function saveSharedAddress(addr: SharedAddress) {
  localStorage.setItem(SHARED_ADDRESS_KEY, JSON.stringify(addr));
}

export const SHARED_SIGNATURE_KEY = "shared_signature_v1";

export function loadSharedSignature(): string {
  try { return localStorage.getItem(SHARED_SIGNATURE_KEY) ?? ""; } catch { return ""; }
}

export function saveSharedSignature(dataUrl: string) {
  try { localStorage.setItem(SHARED_SIGNATURE_KEY, dataUrl); } catch {}
}
