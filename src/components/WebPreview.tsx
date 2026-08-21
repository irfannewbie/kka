import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Globe, AlertCircle, Loader2 } from 'lucide-react';

interface WebPreviewProps {
  webUrl?: string;
  pdfUrl?: string;
  themeIndex?: number;
  title: string;
  className?: string;
  screenshotUrl?: string;
  interactive?: boolean;
}

export const getThemeIndex = (idOrTitle: string, fallbackIndex: number = 0): number => {
  if (!idOrTitle) return fallbackIndex % 6;
  const hash = idOrTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), fallbackIndex);
  return Math.abs(hash) % 6;
};

export const WebPreview: React.FC<WebPreviewProps> = ({
  webUrl,
  pdfUrl,
  themeIndex = 0,
  title,
  className = '',
  screenshotUrl,
  interactive = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Normalize URLs
  const cleanWebUrl = webUrl && webUrl.trim() !== '-' && webUrl.trim() !== '' ? webUrl.trim() : '';
  const cleanPdfUrl = pdfUrl && pdfUrl.trim() !== '-' && pdfUrl.trim() !== '' ? pdfUrl.trim() : '';

  // Google Drive/Presentation embed URL converter
  const getEmbeddablePdfUrl = (url: string) => {
    if (url.includes('docs.google.com/presentation') || url.includes('drive.google.com/file')) {
      return url.replace(/\/edit(\?.*)?$/i, '/preview').replace(/\/view(\?.*)?$/i, '/preview');
    }
    return url;
  };

  const targetUrl = cleanWebUrl || (cleanPdfUrl ? getEmbeddablePdfUrl(cleanPdfUrl) : '');

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [targetUrl, iframeKey]);

  // Fallback screenshot URL from public thumbnail service if screenshotUrl isn't provided
  const fallbackThumbnailUrl = cleanWebUrl
    ? `https://api.microlink.io/?url=${encodeURIComponent(cleanWebUrl)}&screenshot=true&meta=false&embed=screenshot.url`
    : '';

  // 1. Explicit Screenshot provided
  if (screenshotUrl) {
    return (
      <img
        src={screenshotUrl}
        alt={title}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover object-top ${className}`}
      />
    );
  }

  // 2. Real Student Web URL or PDF URL present
  if (targetUrl) {
    if (interactive) {
      // Interactive Mode (for Modal Viewer)
      return (
        <div className={`relative w-full h-full bg-slate-900 overflow-hidden flex flex-col ${className}`}>
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 text-white p-4 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#2e59e6]" />
              <div className="text-center">
                <p className="font-mono-code text-xs text-slate-200">Memuat tampilan website siswa...</p>
                <p className="font-mono-code text-[11px] text-slate-400 truncate max-w-xs mt-1">{targetUrl}</p>
              </div>
            </div>
          )}

          {/* Fallback Error Overlay */}
          {hasError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm">Preview Tidak Dapat Ditampilkan di iFrame</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Website siswa membatasi tampilan tersemat (CORS/X-Frame). Anda tetap dapat membukanya secara langsung.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIframeKey((prev) => prev + 1)}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded border border-white/20 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Lagi</span>
                </button>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#2e59e6] hover:bg-[#1f40b5] text-white text-xs font-bold px-3 py-1.5 rounded shadow transition-colors"
                >
                  <span>Buka di Tab Baru</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Real Live Interactive Iframe */}
          <iframe
            key={`modal-iframe-${iframeKey}-${targetUrl}`}
            src={targetUrl}
            title={title}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            loading="eager"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        </div>
      );
    }

    // Card Thumbnail Mode (Live scaled view with pointer-events-none)
    return (
      <div className={`relative w-full h-full bg-slate-900 overflow-hidden select-none pointer-events-none ${className}`}>
        {/* Scaled Iframe Preview */}
        <div
          className="absolute origin-top-left"
          style={{
            width: '250%',
            height: '250%',
            transform: 'scale(0.4)',
          }}
        >
          <iframe
            key={`card-iframe-${targetUrl}`}
            src={targetUrl}
            title={title}
            tabIndex={-1}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        </div>

        {/* Fallback image if iframe loading takes time */}
        {isLoading && fallbackThumbnailUrl && (
          <img
            src={fallbackThumbnailUrl}
            alt={title}
            onError={() => setHasError(true)}
            className="absolute inset-0 w-full h-full object-cover object-top opacity-60 transition-opacity duration-300"
          />
        )}

        {/* Subtle glass gradient at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      </div>
    );
  }

  // 3. Fallback Illustrations if no URL is present
  const normalizedIndex = Math.abs(themeIndex) % 6;

  switch (normalizedIndex) {
    case 0:
      return (
        <div className={`w-full h-full bg-[#18233c] text-white flex flex-col relative overflow-hidden font-sans ${className}`}>
          <div className="h-9 bg-[#0f172a] px-3.5 flex items-center justify-between border-b border-white/10 text-[10px]">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <span className="text-base">👨‍🍳</span>
              <span className="tracking-wide">KANTIN MESYA</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300 font-medium">
              <span className="text-amber-400 font-bold border-b border-amber-400">Beranda</span>
              <span className="hover:text-white">Menu</span>
              <span className="hover:text-white">Pre-Order</span>
            </div>
          </div>

          <div className="flex-1 bg-gradient-to-r from-[#1c2947] to-[#2b3a5d] p-4 flex items-center justify-between relative overflow-hidden">
            <div className="z-10 max-w-[62%] space-y-1.5">
              <div className="text-amber-400 font-bold text-xs sm:text-sm leading-tight">
                Pemesanan Kantin Sekolah Pre-Order
              </div>
              <p className="text-[8px] sm:text-[9px] text-slate-300 leading-relaxed">
                Pesan menu favoritmu duluan untuk istirahat sekolah tanpa antre.
              </p>
              <div className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[8px] sm:text-[9px] px-2.5 py-1 rounded font-bold shadow">
                <span>Pesan Sekarang</span>
                <span>→</span>
              </div>
            </div>
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 border-2 border-white/40 flex items-center justify-center text-3xl sm:text-4xl shadow-lg shrink-0">
                🍱
              </div>
            </div>
          </div>

          <div className="h-16 bg-white text-slate-800 p-2 grid grid-cols-4 gap-1.5 text-[8px]">
            <div className="bg-amber-50/80 p-1.5 rounded border border-amber-200 flex flex-col justify-between items-center text-center">
              <span className="font-semibold text-slate-800 line-clamp-1">🍗 Ayam Geprek</span>
              <span className="text-emerald-700 font-bold">Rp 12.000</span>
            </div>
            <div className="bg-blue-50/80 p-1.5 rounded border border-blue-200 flex flex-col justify-between items-center text-center">
              <span className="font-semibold text-slate-800 line-clamp-1">🍜 Mie Goreng</span>
              <span className="text-emerald-700 font-bold">Rp 10.000</span>
            </div>
            <div className="bg-emerald-50/80 p-1.5 rounded border border-emerald-200 flex flex-col justify-between items-center text-center">
              <span className="font-semibold text-slate-800 line-clamp-1">🥤 Es Teh Manis</span>
              <span className="text-emerald-700 font-bold">Rp 3.000</span>
            </div>
            <div className="bg-rose-50/80 p-1.5 rounded border border-rose-200 flex flex-col justify-between items-center text-center">
              <span className="font-semibold text-slate-800 line-clamp-1">🥪 Roti Bakar</span>
              <span className="text-emerald-700 font-bold">Rp 8.000</span>
            </div>
          </div>
        </div>
      );

    case 1:
      return (
        <div className={`w-full h-full bg-[#0e1726] text-white flex flex-col relative overflow-hidden font-sans ${className}`}>
          <div className="h-9 bg-[#070d18] px-3.5 flex items-center justify-between border-b border-white/10 text-[10px]">
            <div className="flex items-center gap-1.5 font-bold text-sky-400">
              <span className="text-base">📚</span>
              <span>PERPUS DIGITAL SMP</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-slate-300">
              <span>Katalog</span>
              <span>Peminjaman</span>
            </div>
          </div>
          <div className="flex-1 bg-gradient-to-r from-sky-950 to-indigo-950 p-4 flex items-center justify-between">
            <div className="space-y-1.5 max-w-[65%]">
              <div className="text-sky-300 font-bold text-xs sm:text-sm leading-tight">
                Eksplorasi Ribuan Buku Pelajaran & Cerita
              </div>
              <p className="text-[8px] sm:text-[9px] text-slate-300">Pinjam buku digital langsung dari gadgetmu secara instan.</p>
            </div>
            <div className="w-18 h-18 rounded-full bg-sky-600/40 border-2 border-sky-400/40 flex items-center justify-center text-3xl shadow">
              📖
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className={`w-full h-full bg-[#111827] text-white flex flex-col items-center justify-center p-4 text-center ${className}`}>
          <Globe className="w-12 h-12 text-[#2e59e6] mb-2" />
          <h4 className="font-bold text-sm text-slate-200">{title}</h4>
          <p className="text-xs text-slate-400 mt-1">Proyek Web Siswa</p>
        </div>
      );
  }
};
