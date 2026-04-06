export function PdfHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-gray-300">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/tgv-logo.png" alt="TGV Logo" width={44} height={44} />
      <div className="flex-1">
        <div className="font-bold text-base text-gray-900">
          TGV &bdquo;Eintracht&ldquo; Beilstein 1823 e.V.
        </div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>
    </div>
  );
}

export function PdfFooter() {
  return (
    <div className="mt-10 pt-6 border-t border-gray-100">
      <div className="grid grid-cols-3 gap-6 text-[9px] leading-relaxed text-gray-400">
        <div className="space-y-1">
          <p className="font-bold text-gray-600 tracking-wider">KONTAKT</p>
          <p>Albert-Einstein-Str. 20 &middot; 71717 Beilstein</p>
          <p>Tel. +49 (0) 7062 5753</p>
          <p>info@tgveintrachtbeilstein.de</p>
          <p>www.tgveintrachtbeilstein.de</p>
        </div>
        <div className="space-y-1">
          <p className="font-bold text-gray-600 tracking-wider">VEREINSDATEN</p>
          <p>Steuer-Nr. 65208/49689</p>
          <p>Amtsgericht Stuttgart &middot; VR 101009</p>
          <p>Vorstand: Armin Maurer</p>
        </div>
        <div className="space-y-1">
          <p className="font-bold text-gray-600 tracking-wider">BANKVERBINDUNG</p>
          <p>Volksbank Beilstein-Ilsfeld-Abstatt eG</p>
          <p className="font-medium text-gray-500">
            IBAN: DE63 6206 2215 0001 0770 07
          </p>
          <p>BIC: GENODES1BIA</p>
        </div>
      </div>
    </div>
  );
}
