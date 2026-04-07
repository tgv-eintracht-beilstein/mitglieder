export function PdfHeader() {
  return (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-gray-300">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/tgv-logo.png" alt="TGV Logo" width={44} height={44} />
      <div className="flex-1 text-center">
        <div className="font-bold text-sm text-gray-700 uppercase tracking-wider">
          Turn- und Gesangverein "Eintracht" Beilstein 1823 e. V.
        </div>
      </div>
    </div>
  );
}

export function PdfFooter() {
  return (
    <div className="mt-10 pt-4 border-t border-gray-300">
      <div className="grid grid-cols-3 gap-6 text-[8.5px] leading-relaxed text-gray-500">
        <div className="space-y-0.5">
          <p className="font-semibold text-gray-700">TGV "Eintracht" Beilstein e. V.</p>
          <p>Albert-Einstein-Str. 20</p>
          <p>D-71717 Beilstein</p>
        </div>
        <div className="space-y-0.5">
          <p><span className="inline-block w-16 text-gray-400">Telefon</span>+49 (0) 7062 5753</p>
          <p><span className="inline-block w-16 text-gray-400">E-Mail</span>info@tgveintrachtbeilstein.de</p>
          <p><span className="inline-block w-16 text-gray-400">Webseite</span>https://www.tgveintrachtbeilstein.de</p>
          <p><span className="inline-block w-16 text-gray-400">Steuer-Nr.</span>65208/49689</p>
        </div>
        <div className="space-y-0.5">
          <p className="font-semibold text-gray-700">Volksbank Beilstein-Ilsfeld-Abstatt eG</p>
          <p><span className="inline-block w-10 text-gray-400">IBAN</span>DE63 6206 2215 0001 0770 07</p>
          <p><span className="inline-block w-10 text-gray-400">BIC</span>GENODES1BIA</p>
        </div>
      </div>
    </div>
  );
}
