import { syncSave, syncLoad, subscribe } from "./sync";

export interface SavedAddress {
  id: string;
  nachname: string;
  vorname: string;
  strasse: string;
  plzOrt: string;
  geburtsdatum: string;
  telefon: string;
  email: string;
  rateOverrides?: Record<string, string>;
}

const KEY = "tgv_address_book_v1";
const SEL_KEY = "tgv_address_book_selected_v1";

function load(): SavedAddress[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function save(list: SavedAddress[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  syncSave(KEY, list);
}

function saveSelection(ids: string[]) {
  localStorage.setItem(SEL_KEY, JSON.stringify(ids));
  syncSave(SEL_KEY, ids);
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
  saveSelection(getSelectedIds().filter(x => x !== id));
}

export function addressLabel(a: SavedAddress): string {
  return [a.vorname, a.nachname].filter(Boolean).join(" ") || "Unbenannt";
}

export function emptyAddress(): Omit<SavedAddress, "id"> {
  return { nachname: "", vorname: "", strasse: "", plzOrt: "", geburtsdatum: "", telefon: "", email: "", rateOverrides: {} };
}

export function getSelectedIds(): string[] {
  try { return JSON.parse(localStorage.getItem(SEL_KEY) ?? "[]"); } catch { return []; }
}

export function saveSelectedIds(ids: string[]) {
  saveSelection(ids);
}

export function getSelectedAddresses(): SavedAddress[] {
  const ids = getSelectedIds();
  const all = load();
  return ids.map(id => all.find(a => a.id === id)).filter(Boolean) as SavedAddress[];
}

// ── Remote sync: load from DB on startup, subscribe to changes ──

let initialized = false;
const listeners = new Set<() => void>();

export function onAddressBookChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function notify() { listeners.forEach(cb => cb()); }

export async function initAddressBookSync() {
  if (initialized) return;
  initialized = true;

  const remote = await syncLoad<SavedAddress[]>(KEY);
  if (remote) {
    localStorage.setItem(KEY, JSON.stringify(remote));
    notify();
  }

  const remoteSel = await syncLoad<string[]>(SEL_KEY);
  if (remoteSel) {
    localStorage.setItem(SEL_KEY, JSON.stringify(remoteSel));
    notify();
  }

  subscribe(KEY, (_k, data) => {
    localStorage.setItem(KEY, JSON.stringify(data));
    notify();
  });

  subscribe(SEL_KEY, (_k, data) => {
    localStorage.setItem(SEL_KEY, JSON.stringify(data));
    notify();
  });
}
