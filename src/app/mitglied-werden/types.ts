export interface Address {
  id: string;
  label: string;
  strasse: string;
  plz: string;
  ort: string;
}

export interface Person {
  id: string;
  vorname: string;
  nachname: string;
  geburtsdatum: string;
  telefon: string;
  email: string;
  abteilungen: string[];
  addressId: string;
  istPartner: boolean;
  signature: string;
}

export interface FormState {
  adressen: Address[];
  kontoinhaber: string;
  iban: string;
  signature: string;
  overrideDate: string | null;
  personen: Person[];
  familienmitgliedschaft: boolean;
}

export function emptyAddress(): Address {
  return {
    id: Math.random().toString(36).slice(2, 9),
    label: "",
    strasse: "",
    plz: "",
    ort: "",
  };
}

export function emptyPerson(addressId = ""): Person {
  return {
    id: Math.random().toString(36).slice(2, 9),
    vorname: "",
    nachname: "",
    geburtsdatum: "",
    telefon: "",
    email: "",
    abteilungen: [],
    addressId,
    istPartner: false,
    signature: "",
  };
}

export function defaultState(): FormState {
  const addr = emptyAddress();
  return {
    adressen: [addr],
    kontoinhaber: "",
    iban: "",
    signature: "",
    overrideDate: null,
    personen: [emptyPerson(addr.id)],
    familienmitgliedschaft: false,
  };
}
