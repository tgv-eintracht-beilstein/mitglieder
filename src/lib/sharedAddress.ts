export const SHARED_ADDRESS_KEY = "shared_address_v1";

export interface SharedAddress {
  nachname: string;
  vorname: string;
  strasse: string;
  plzOrt: string;
  geburtsdatum: string;
  telefon: string;
}

export function loadSharedAddress(): SharedAddress {
  try {
    const raw = localStorage.getItem(SHARED_ADDRESS_KEY);
    if (raw) return JSON.parse(raw) as SharedAddress;
  } catch {}
  return { nachname: "", vorname: "", strasse: "", plzOrt: "", geburtsdatum: "", telefon: "" };
}

export function saveSharedAddress(addr: SharedAddress) {
  localStorage.setItem(SHARED_ADDRESS_KEY, JSON.stringify(addr));
}
