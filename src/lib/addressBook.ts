export interface SavedAddress {
  id: string;
  nachname: string;
  vorname: string;
  strasse: string;
  plzOrt: string;
  geburtsdatum: string;
  telefon: string;
  email: string;
  /** beschreibung → hourly rate override */
  rateOverrides?: Record<string, string>;
}

const KEY = "tgv_address_book_v1";
const SEL_KEY = "tgv_address_book_selected_v1";

function load(): SavedAddress[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function save(list: SavedAddress[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAddresses(): SavedAddress[] { return load(); }

export function addAddress(addr: Omit<SavedAddress, "id">): SavedAddress {
  const list = load();
  const entry = { ...addr, id: crypto.randomUUID() };
  list.push(entry);
  save(list);
  return entry;
}

export function updateAddress(addr: SavedAddress) {
  const list = load();
  const i = list.findIndex(a => a.id === addr.id);
  if (i >= 0) list[i] = addr; else list.push(addr);
  save(list);
}

export function removeAddress(id: string) {
  save(load().filter(a => a.id !== id));
  // also remove from selection
  saveSelectedIds(getSelectedIds().filter(x => x !== id));
}

export function addressLabel(a: SavedAddress): string {
  return [a.vorname, a.nachname].filter(Boolean).join(" ") || "Unbenannt";
}

export function emptyAddress(): Omit<SavedAddress, "id"> {
  return { nachname: "", vorname: "", strasse: "", plzOrt: "", geburtsdatum: "", telefon: "", email: "", rateOverrides: {} };
}

// ── Global selection (synced across forms via localStorage events) ──

export function getSelectedIds(): string[] {
  try { return JSON.parse(localStorage.getItem(SEL_KEY) ?? "[]"); } catch { return []; }
}

export function saveSelectedIds(ids: string[]) {
  localStorage.setItem(SEL_KEY, JSON.stringify(ids));
}

export function getSelectedAddresses(): SavedAddress[] {
  const ids = getSelectedIds();
  const all = load();
  return ids.map(id => all.find(a => a.id === id)).filter(Boolean) as SavedAddress[];
}
