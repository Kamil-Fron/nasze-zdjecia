import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Printer, 
  Download, 
  Heart, 
  Copy, 
  Check, 
  QrCode, 
  Sparkles,
  Smartphone,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { WeddingSettings } from '../types/wedding';

interface TableQrGeneratorProps {
  settings: WeddingSettings;
}

export const TableQrGenerator: React.FC<TableQrGeneratorProps> = ({ settings }) => {
  const [headline, setHeadline] = useState('Uwiecznij ten dzień z nami!');
  const [instructions, setInstructions] = useState('Zeskanuj kod aparatem w telefonie, wpisz swoje imię i wrzucaj zdjęcia wprost do naszej wspólnej galerii!');
  const [designTheme, setDesignTheme] = useState<'gold' | 'boho' | 'minimal' | 'rose'>('gold');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiesToPrint, setCopiesToPrint] = useState<number>(6);
  const [isMultiPrint, setIsMultiPrint] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // Default app URL (including full path /nasze-zdjecia/ on GitHub Pages) or custom domain
  const appBaseUrl = typeof window !== 'undefined' 
    ? (window.location.origin + window.location.pathname).replace(/\/$/, '')
    : 'https://kamil-fron.github.io/nasze-zdjecia';
  const effectiveUrl = customUrl.trim() || appBaseUrl;

  useEffect(() => {
    QRCode.toDataURL(effectiveUrl, {
      width: 450,
      margin: 2,
      color: {
        dark: designTheme === 'gold' ? '#4A3B2C' : designTheme === 'boho' ? '#2D3A29' : designTheme === 'rose' ? '#5E2938' : '#1A1A1A',
        light: '#FFFFFF'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('Failed to generate QR code:', err);
    });
  }, [effectiveUrl, designTheme]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(effectiveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `kod_qr_wesele_${settings.coupleNames.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="py-6 px-4 max-w-5xl mx-auto space-y-6">
      {/* Control Panel */}
      <div className="no-print bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Karty z Kodem QR na Stoły Weselne
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Wydrukuj i postaw na stołach winietki lub ramki z kodem QR, aby goście mogli od razu skanować aparatami w telefonach.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-medium shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Drukuj Karty na Stoły</span>
            </button>
            <button
              onClick={handleDownloadQrPng}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              title="Pobierz sam plik graficzny QR"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Pobierz PNG</span>
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Styl Graficzny
            </label>
            <select
              value={designTheme}
              onChange={(e) => setDesignTheme(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-400 bg-white"
            >
              <option value="gold">Złota Elegancja & Krem</option>
              <option value="boho">Rustykalne Boho & Eukaliptus</option>
              <option value="rose">Romantyczny Róż & Perły</option>
              <option value="minimal">Nowoczesny Minimalizm</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nagłówek na karcie
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Układ do druku
            </label>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setIsMultiPrint(!isMultiPrint)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  isMultiPrint ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                {isMultiPrint ? `Wydruk wielokrotny (${copiesToPrint} szt.)` : 'Pojedyncza karta'}
              </button>
              {isMultiPrint && (
                <input
                  type="number"
                  min="2"
                  max="30"
                  value={copiesToPrint}
                  onChange={(e) => setCopiesToPrint(Math.min(30, Math.max(2, Number(e.target.value))))}
                  className="w-16 px-2 py-1.5 text-xs border rounded-lg text-center"
                  title="Liczba kopii do druku"
                />
              )}
            </div>
          </div>
        </div>

        {/* Link info & custom domain option */}
        <div className="p-4 bg-stone-50 rounded-2xl space-y-3 text-xs text-stone-600">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate max-w-lg">
              <span className="font-semibold text-stone-700">Aktywny adres w kodzie QR:</span>
              <span className="font-mono text-emerald-700 font-medium truncate">{effectiveUrl}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 font-medium cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Skopiowano!' : 'Kopiuj link aplikacji'}</span>
            </button>
          </div>

          <div className="border-t border-stone-200/60 pt-2 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-stone-500 shrink-0">Własny adres www (opcjonalnie):</span>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder={`Domyślnie: ${appBaseUrl}`}
              className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs text-stone-800 font-mono"
            />
            {customUrl && (
              <button
                type="button"
                onClick={() => setCustomUrl('')}
                className="text-[11px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
              >
                Przywróć domyślny
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Printable Preview Area */}
      <div className="flex justify-center">
        {!isMultiPrint ? (
          <div
            className={`printable-card w-full max-w-md p-8 sm:p-10 rounded-3xl text-center shadow-lg transition-all ${
              designTheme === 'gold'
                ? 'bg-[#FDFBF7] border-4 border-[#CBB279] text-[#3D3024]'
                : designTheme === 'boho'
                ? 'bg-[#F7F9F5] border-4 border-[#8B9D83] text-[#243321]'
                : designTheme === 'rose'
                ? 'bg-[#FFF9FA] border-4 border-[#E5B6C4] text-[#4A2633]'
                : 'bg-white border-4 border-stone-900 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl">✨</span>
              <Heart className="w-4 h-4 fill-current opacity-70" />
              <span className="text-xl">✨</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-1">
              {settings.coupleNames}
            </h1>

            <h2 className="text-xl sm:text-2xl font-serif italic mt-3 mb-2 font-medium">
              {headline}
            </h2>

            <p className="text-xs sm:text-sm max-w-xs mx-auto opacity-80 leading-relaxed mb-6 font-sans">
              {instructions}
            </p>

            <div className="p-4 bg-white rounded-2xl shadow-sm border border-stone-200 inline-block mx-auto mb-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Kod QR do dodawania zdjęć"
                  className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-stone-400">
                  Generowanie kodu QR...
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-3 border-t border-current/20 text-[11px] font-sans">
              <div className="flex flex-col items-center">
                <span className="text-base mb-0.5">📱</span>
                <span>1. Zeskanuj kod</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base mb-0.5">✍️</span>
                <span>2. Wpisz imię</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base mb-0.5">📸</span>
                <span>3. Dodaj fotki</span>
              </div>
            </div>

            <div className="mt-6 text-[10px] opacity-60 uppercase tracking-widest font-sans">
              Wspólna galeria weselna bez logowania i instalacji
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            {Array.from({ length: copiesToPrint }, (_, i) => i + 1).map((idx) => (
              <div
                key={idx}
                className="printable-card p-6 rounded-2xl text-center border-2 border-stone-400 bg-white shadow-xs space-y-3"
              >
                <div className="text-xs uppercase tracking-widest font-bold text-stone-500">
                  {settings.coupleNames}
                </div>
                <div className="text-xl font-serif font-bold text-stone-900">
                  Podziel się zdjęciami!
                </div>
                <p className="text-xs text-stone-600 max-w-xs mx-auto">
                  Zeskanuj kod aparatem telefonu i dodaj swoje zdjęcia do wspólnej galerii.
                </p>

                <div className="p-2 bg-white rounded-xl border border-stone-200 inline-block mx-auto">
                  {qrDataUrl && (
                    <img src={qrDataUrl} alt="QR" className="w-40 h-40 object-contain mx-auto" />
                  )}
                </div>

                <div className="text-[10px] text-stone-500">
                  Bez haseł i bez logowania
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
