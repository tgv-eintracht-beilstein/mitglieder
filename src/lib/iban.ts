import { isValidIBAN, electronicFormatIBAN } from "ibantools";

/**
 * Validate an IBAN string (spaces allowed).
 */
export function validateIban(raw: string): boolean {
  const electronic = electronicFormatIBAN(raw) ?? "";
  return isValidIBAN(electronic);
}
