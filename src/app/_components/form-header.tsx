"use client";

import React from "react";
import { DateSelect } from "./aufwandsformular";

export function formatDateDE(v: string): string {
  if (!v) return v;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : v;
}

function PI({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-block w-full">
      <span className="print:hidden w-full">{children}</span>
      <span className="hidden print:inline">{value}</span>
    </span>
  );
}

const fieldCls = "w-full bg-transparent border-b px-1 py-0.5 text-sm focus:outline-none transition-colors";
function fieldBorder(value: string, required?: boolean, invalid?: boolean) {
  if ((required && !value) || invalid) return "border-[#b11217] focus:border-[#b11217]";
  return "border-gray-300 focus:border-[#b11217]";
}

export interface FormHeaderField {
  label: string;
  key: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  invalid?: boolean;
}

export interface FormHeaderContextField {
  label: string;
  content: React.ReactNode;
  printValue: string;
  required?: boolean;
  value?: string;
}

interface Props {
  title: string;
  contextFields: FormHeaderContextField[];
  personalFields: FormHeaderField[];
  onAddressBook?: () => void;
  addressBookCount?: number;
  /** When non-empty, replaces personal fields with a selected-people list */
  selectedAddresses?: { vorname: string; nachname: string; plzOrt: string }[];
}

export default function FormHeader({ title, contextFields, personalFields, onAddressBook, addressBookCount, selectedAddresses }: Props) {
  const showList = selectedAddresses && selectedAddresses.length > 0;
  return (
    <>
      {/* Screen: 2 boxes */}
      <div className="print:hidden grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide rounded-t-xl">{title.toUpperCase()}</div>
          <div className="px-4 py-3 space-y-2">
            {contextFields.map((f) => (
              <div key={f.label}>
                <div className="text-[10px] mb-0.5 flex items-center gap-0.5">
                  <span className={f.required && !f.value ? "text-[#b11217]" : "text-gray-500"}>{f.label}</span>
                  {f.required && !f.value && <span className="text-[#b11217] leading-none">*</span>}
                </div>
                <div className={f.required && !f.value ? "[&_input]:border-[#b11217] [&_select]:border-[#b11217] [&_button]:border-[#b11217]" : ""}>
                  {f.content}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide rounded-t-xl flex items-center justify-between">
            <span>PERSÖNLICHE ANGABEN</span>
            {onAddressBook && (
              <button type="button" onClick={onAddressBook}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded px-1.5 py-0.5 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                {(addressBookCount ?? 0) > 0 && <span className="bg-white text-[#b11217] text-[9px] font-bold px-1 rounded-full">{addressBookCount}</span>}
              </button>
            )}
          </div>
          <div className="px-4 py-3 space-y-2">
            {showList ? (
              <div className="space-y-1.5">
                <div className="text-sm text-gray-900">
                  {selectedAddresses.map(a => a.vorname || a.nachname).join(", ")}
                </div>
                <button type="button" onClick={onAddressBook}
                  className="text-[10px] text-[#b11217] hover:underline font-medium">
                  Auswahl bearbeiten…
                </button>
              </div>
            ) : (
              personalFields.map((f) => (
                <div key={f.key}>
                  <label htmlFor={`field-${f.key}`} className="text-[10px] mb-0.5 flex items-center gap-0.5">
                    <span className={f.required && !f.value ? "text-[#b11217]" : "text-gray-500"}>{f.label}</span>
                    {f.required && !f.value && <span className="text-[#b11217] leading-none">*</span>}
                  </label>
                  <PI value={f.type === "date" ? formatDateDE(f.value) : f.value}>
                    {f.type === "date"
                      ? <DateSelect value={f.value} onChange={f.onChange} className={`text-sm ${f.required && !f.value ? "[&_button]:border-[#b11217] [&_input]:border-[#b11217]" : ""}`} />
                      : <input id={`field-${f.key}`} type={f.type ?? "text"} value={f.value} onChange={e => f.onChange(e.target.value)} className={`${fieldCls} ${fieldBorder(f.value, f.required, f.invalid)}`} />
                    }
                  </PI>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="hidden print:block mb-3">
        <div>
          <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide">{title.toUpperCase()}</div>
          <div className="grid grid-cols-2 text-sm">
            <div className="px-3 py-2 space-y-2">
              {contextFields.map((f) => (
                <div key={f.label}>
                  <div className="text-[10px] text-gray-500 mb-0.5">{f.label}</div>
                  <span className="text-sm">{f.printValue}</span>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 space-y-1">
              {personalFields.map((f) => (
                <div key={f.key} className="flex items-baseline gap-2">
                  <span className="text-[10px] text-gray-500 w-20 shrink-0">{f.label}</span>
                  <span className="text-sm">{f.type === "date" ? formatDateDE(f.value) : f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
