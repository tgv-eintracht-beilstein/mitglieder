import { isValidIBAN, electronicFormatIBAN, friendlyFormatIBAN } from "ibantools";

/**
 * Validate an IBAN string (spaces allowed).
 */
export function validateIban(raw: string): boolean {
  const electronic = electronicFormatIBAN(raw) ?? "";
  return isValidIBAN(electronic);
}

/** Format IBAN in groups of 4 (e.g. DE89 6206 2215 0004 3370 00). */
export function formatIban(raw: string): string {
  return friendlyFormatIBAN(raw) ?? raw;
}