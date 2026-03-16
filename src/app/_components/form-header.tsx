"use client";

import React from "react";
import { DateSelect } from "./aufwandsformular";

function PI({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-block w-full">
      <span className="print:hidden w-full">{children}</span>
      <span className="hidden print:inline">{value}</span>
    </span>
  );
}

const fieldCls = "w-full bg-transparent border-b border-gray-300 px-1 py-0.5 text-sm focus:outline-none focus:border-[#b11217]";

export interface FormHeaderField {
  label: string;
  key: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}

export interface FormHeaderContextField {
  label: string;
  content: React.ReactNode;
  printValue: string;
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
          <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">{title}</div>
          <div className="px-4 py-3 space-y-2">
            {contextFields.map((f) => (
              <div key={f.label}>
                <div className="text-[10px] text-gray-400 mb-0.5">{f.label}</div>
                {f.content}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase rounded-t-xl">Persönliche Angaben</div>
          <div className="px-4 py-3 space-y-2">
            {personalFields.map((f) => (
              <div key={f.key}>
                <div className="text-[10px] text-gray-400 mb-0.5">{f.label}</div>
                <PI value={f.value}>
                  {f.type === "date"
                    ? <DateSelect value={f.value} onChange={f.onChange} className="text-sm" />
                    : <input type={f.type ?? "text"} value={f.value} onChange={e => f.onChange(e.target.value)} className={fieldCls} />
                  }
                </PI>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Print/PDF: 3-column with TGV center */}
      <div className="hidden print:block mb-3">
        <div>
          <div className="bg-[#b11217] text-white px-4 py-2 text-sm font-bold tracking-wide uppercase">{title}</div>
          <div className="grid grid-cols-3 text-sm">
            <div className="px-3 py-2 space-y-2">
              {contextFields.map((f) => (
                <div key={f.label}>
                  <div className="text-[10px] text-gray-400 mb-0.5">{f.label}</div>
                  <span className="text-sm">{f.printValue}</span>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 flex flex-col justify-center text-center text-gray-700 leading-snug">
              <div className="font-bold text-gray-900 text-sm">TGV &quot;Eintracht&quot; Beilstein 1823 e.V.</div>
              <div className="text-xs text-gray-500 mt-0.5">Albert-Einstein-Str. 20 &middot; 71717 Beilstein</div>
              <div className="text-xs text-gray-400 mt-0.5">Tel. 07062&ndash;5753 &middot; Fax 07062&ndash;916736</div>
            </div>
            <div className="px-3 py-2 space-y-1">
              {personalFields.map((f) => (
                <div key={f.key} className="flex items-baseline gap-2">
                  <span className="text-[10px] text-gray-400 w-20 shrink-0">{f.label}</span>
                  <span className="text-sm">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
