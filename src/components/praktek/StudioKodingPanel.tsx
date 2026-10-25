import React, { useRef, useState } from 'react';
import {
  Code2,
  Gamepad2,
  ExternalLink,
  Maximize2,
  Minimize2,
  Puzzle,
  RotateCw,
  Sparkles,
  Wifi,
} from 'lucide-react';

type CodingToolId = 'blockly-code' | 'blockly-games' | 'scratch';

interface CodingTool {
  title: string;
  shortTitle: string;
  subtitle: string;
  url: string;
  /** URL opsional untuk tombol "Buka Tab Baru" bila berbeda dari sumber iframe. */
  openUrl?: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  externalUrl?: string;
  accent: string;
}

const CODING_TOOLS: Record<CodingToolId, CodingTool> = {
  'blockly-code': {
    title: 'Google Blockly Code Workspace',
    shortTitle: 'Google Blockly',
    subtitle: 'Blok visual → ekspor Python, JavaScript, PHP',
    url: 'https://blockly-demo.appspot.com/static/demos/code/index.html',
    badge: 'RESMI GOOGLE',
    description:
      'Susun balok logika visual (Logic, Loops, Math, Text, Variables, Functions) dan amati langsung bagaimana blok diterjemahkan ke kode bahasa pemrograman profesional secara real-time.',
    icon: Code2,
    accent: '#2e59e6',
  },
  'blockly-games': {
    title: 'Blockly Games (Labirin & Puzzle Logika)',
    shortTitle: 'Blockly Games',
    subtitle: 'Game edukasi algoritma interaktif',
    url: 'https://blockly.games/',
    badge: 'GAME EDUKASI',
    description:
      'Selesaikan tantangan labirin terprogram: kendalikan karakter dengan sekuensial langkah, percabangan jalan (if-else), dan perulangan (while) hingga garis akhir.',
    icon: Gamepad2,
    accent: '#7e22ce',
  },
  scratch: {
    title: 'Scratch 3.0 Studio (PenguinMod Editor)',
    shortTitle: 'Scratch 3.0',
    subtitle: 'Animasi & game dengan blok warna-warni',
    // TurboWarp menolak dimuat di dalam iframe ("Invalid TurboWarp Embed"),
    // jadi editor di halaman ini memakai PenguinMod (mod Scratch 3.0 yang kompatibel).
    url: 'https://studio.penguinmod.com/editor.html',
    openUrl: 'https://turbowarp.org/editor',
    badge: 'SCRATCH 3.0',
    description:
      'Workspace Scratch 3.0 yang langsung bisa dipakai di dalam halaman tanpa akun login (PenguinMod). Karena TurboWarp dan Scratch MIT tidak mengizinkan editor mereka disematkan di iframe, gunakan tombol "Buka Tab Baru" untuk membuka TurboWarp dengan performa maksimal.',
    icon: Puzzle,
    accent: '#d97706',
    externalUrl: 'https://scratch.mit.edu/create',
  },
};

const MISSIONS = [
  {
    title: 'MISI 1: SEKUENSIAL',
    color: 'text-[#2e59e6]',
    desc: 'Susun balok gerak langkah demi langkah untuk mengarahkan karakter dari titik awal ke tujuan tanpa rintangan.',
  },
  {
    title: 'MISI 2: PERCABANGAN',
    color: 'text-purple-700',
    desc: 'Gunakan balok if-else untuk mendeteksi rintangan: jika ada belokan ke kanan, maka belok kanan.',
  },
  {
    title: 'MISI 3: PERULANGAN (LOOP)',
    color: 'text-amber-700',
    desc: 'Gunakan perulangan repeat while agar program berjalan efisien tanpa menulis instruksi berulang kali.',
  },
  {
    title: 'MISI 4: VARIABEL & SKOR',
    color: 'text-emerald-700',
    desc: 'Buat variabel skor yang bertambah +1 setiap kali karakter berhasil mengumpulkan objek target.',
  },
];

export const StudioKodingPanel: React.FC = () => {
  const [activeTool, setActiveTool] = useState<CodingToolId>('blockly-code');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTool = CODING_TOOLS[activeTool];

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => setIsFullscreen((prev) => !prev));
    } else {
      document
        .exitFullscreen?.()
        .then(() => setIsFullscreen(false))
        .catch(() => setIsFullscreen(false));
    }
  };

  return (
    <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-3.5 sm:p-5">
      {/* Header */}
      <div className="flex flex-col gap-3 pb-3 border-b-2 border-[#1a1a1a]">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 font-mono-code text-[10px] font-bold uppercase mb-1">
            <span className="px-2 py-0.5 bg-[#2e59e6] text-white">STUDIO KODING</span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400">
              3 EDITOR INTERAKTIF
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <Wifi className="h-2.5 w-2.5" />
              BUTUH INTERNET
            </span>
          </div>
          <h2 className="font-mono-code text-lg sm:text-2xl font-black text-[#1a1a1a]">
            Studio Koding (Blockly &amp; Scratch)
          </h2>
          <p className="text-[11px] sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Eksplorasi logika koding blok visual, percabangan (if-else), perulangan (loops), dan
            konversi kode ke Python &amp; JavaScript melalui 3 studio interaktif.
          </p>
        </div>

        {/* Actions — tombol besar & sejajar di ponsel */}
        <div className="grid grid-cols-3 gap-1.5 font-mono-code text-[11px] sm:flex sm:items-center">
          <button
            type="button"
            onClick={() => setIframeKey((prev) => prev + 1)}
            className="min-h-[44px] px-2 py-2 bg-white hover:bg-slate-100 border border-[#1a1a1a] text-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-[1px_1px_0px_#1a1a1a]"
            title="Muat ulang workspace"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Muat Ulang</span>
          </button>
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="min-h-[44px] px-2 py-2 bg-white hover:bg-slate-100 border border-[#1a1a1a] text-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-[1px_1px_0px_#1a1a1a]"
            title="Toggle mode layar penuh"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Kecilkan</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Layar Penuh</span>
              </>
            )}
          </button>
          <a
            href={currentTool.openUrl ?? currentTool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-2 py-2 bg-[#1a1a1a] hover:bg-[#2e59e6] text-white font-bold border border-[#1a1a1a] transition-all flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a]"
            title="Buka di tab baru untuk area kerja maksimal"
          >
            <span>Tab Baru</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Engine selector — satu kolom di ponsel, tiga kolom di desktop */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {(Object.keys(CODING_TOOLS) as CodingToolId[]).map((id) => {
          const tool = CODING_TOOLS[id];
          const Icon = tool.icon;
          const active = activeTool === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTool(id)}
              style={
                active ? { backgroundColor: tool.accent, borderColor: tool.accent } : undefined
              }
              className={`w-full min-h-[52px] px-3 py-2.5 font-mono-code text-xs font-bold border-2 transition-all cursor-pointer flex items-center justify-between gap-2 text-left ${
                active
                  ? 'text-white shadow-[3px_3px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{tool.shortTitle}</span>
              </span>
              <span
                className={`text-[9px] px-1 py-0.5 shrink-0 ${
                  active ? 'bg-white/25 text-white' : 'bg-white text-slate-600'
                }`}
              >
                {tool.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Info bar */}
      <div className="mt-3 p-3 bg-[#FAF8F5] border border-[#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono-code text-[11px] sm:text-xs">
        <div>
          <span className="font-bold text-[#1a1a1a]">{currentTool.title}:</span>{' '}
          <span className="text-slate-600">{currentTool.description}</span>
        </div>
        {activeTool === 'scratch' && currentTool.externalUrl && (
          <a
            href={currentTool.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-800 font-bold hover:underline shrink-0 flex items-center gap-1"
          >
            <span>Buka Scratch Resmi (MIT) &rarr;</span>
          </a>
        )}
      </div>

      {/* Workspace iframe */}
      <div
        ref={containerRef}
        className={`mt-3 bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden transition-all relative ${
          isFullscreen ? 'fixed inset-0 z-50 p-2 bg-[#F2EFEB] flex flex-col h-screen w-screen' : ''
        }`}
      >
        {isFullscreen && (
          <div className="p-2 bg-[#1a1a1a] text-white flex items-center justify-between gap-2 font-mono-code text-[11px] sm:text-xs mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="font-bold truncate">{currentTool.title} (Layar Penuh)</span>
            </div>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="px-2.5 py-1.5 min-h-[40px] bg-white text-[#1a1a1a] font-bold border border-white hover:bg-slate-200 shrink-0"
            >
              Kembali ✕
            </button>
          </div>
        )}

        <iframe
          key={`${activeTool}-${iframeKey}`}
          src={currentTool.url}
          title={currentTool.title}
          className="w-full h-[58vh] min-h-[400px] sm:h-[620px] lg:h-[760px] border-none bg-white"
          allow="camera; microphone; accelerometer; gyroscope; fullscreen"
          loading="lazy"
        />
      </div>

      {/* Lembar tantangan praktikum */}
      <div className="mt-4 pt-4 border-t-2 border-[#1a1a1a]">
        <h3 className="font-mono-code text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Lembar Tantangan Praktikum:</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 font-mono-code text-xs">
          {MISSIONS.map((misi) => (
            <div
              key={misi.title}
              className="p-3 bg-[#FAF8F5] border border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
            >
              <div className={`font-bold mb-1 ${misi.color}`}>{misi.title}</div>
              <div className="text-[11px] text-slate-700 leading-relaxed">{misi.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
