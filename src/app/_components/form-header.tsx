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

const fieldCls = "w-full bg-transparent border-b px-1 py-0.5 text-sm focus:outline-none";
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
}

export default function FormHeader({ title, contextFields, personalFields }: Props) {
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
                  <span className={f.required && !f.value ? "text-[#b11217]" : "text-gray-400"}>{f.label}</span>
                  {f.required && !f.value && <span className="text-[#b11217] leading-none">*</span>}
                </div>
                <div className={f.required && !f.value ? "rounded border border-[#b11217]" : ""}>
                  {f.content}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide rounded-t-xl">PERSÖNLICHE ANGABEN</div>
          <div className="px-4 py-3 space-y-2">
            {personalFields.map((f) => (
              <div key={f.key}>
                <div className="text-[10px] mb-0.5 flex items-center gap-0.5">
                  <span className={f.required && !f.value ? "text-[#b11217]" : "text-gray-400"}>{f.label}</span>
                  {f.required && !f.value && <span className="text-[#b11217] leading-none">*</span>}
                </div>
                <PI value={f.type === "date" ? formatDateDE(f.value) : f.value}>
                  {f.type === "date"
                    ? <DateSelect value={f.value} onChange={f.onChange} className={`text-sm ${f.required && !f.value ? "[&_button]:border-[#b11217] [&_input]:border-[#b11217]" : ""}`} minYear={1823} />
                    : <input type={f.type ?? "text"} value={f.value} onChange={e => f.onChange(e.target.value)} className={`${fieldCls} ${fieldBorder(f.value, f.required, f.invalid)}`} />
                  }
                </PI>
              </div>
            ))}
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
                  <div className="text-[10px] text-gray-400 mb-0.5">{f.label}</div>
                  <span className="text-sm">{f.printValue}</span>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 space-y-1">
              {personalFields.map((f) => (
                <div key={f.key} className="flex items-baseline gap-2">
                  <span className="text-[10px] text-gray-400 w-20 shrink-0">{f.label}</span>
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
