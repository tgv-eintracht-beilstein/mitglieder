import Link from "next/link";

const pages = [
  { href: "/mitgliedsbeitraege", label: "Mitgliedsbeitr\u00e4ge", desc: "Beitragsübersicht 2026" },
  { href: "/reisekosten", label: "Reisekosten", desc: "Aufwandsentschädigung abrechnen" },
  { href: "/docs", label: "Dokumente", desc: "Satzung, Ordnungen und mehr" },
];

export default function Home() {
  return (
    <div className="max-w-lg mx-auto mt-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Willkommen im Mitgliederbereich
      </h1>
      <p className="text-gray-500 mb-10 text-sm">
        TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.&thinsp;V.
      </p>
      <div className="grid gap-4">
        {pages.map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="block bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 text-left hover:border-[#b11217] hover:shadow-md transition-all group"
          >
            <div className="font-semibold text-gray-900 group-hover:text-[#b11217] transition-colors">
              {label}
            </div>
            <div className="text-sm text-gray-400 mt-0.5">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
