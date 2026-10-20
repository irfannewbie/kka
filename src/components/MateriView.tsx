import React, { useState, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  FileSpreadsheet,
  BookOpen,
  Code2,
  Cpu,
  Globe,
  Binary,
  Layers,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Bot,
  BrainCircuit,
  Calculator,
  Compass,
  Lightbulb,
  ExternalLink,
  HelpCircle,
  FileText,
  Play,
  Flame,
  Maximize2,
  Minimize2,
  RotateCw,
  Gamepad2,
  Puzzle,
  Scale,
  ShieldAlert,
  FolderTree,
  Share2,
  AlertTriangle,
} from 'lucide-react';
import { ExcelLabStudentWorkspace } from './excel/ExcelLabStudentWorkspace';
import { ExcelFormulaGuideView } from './excel/ExcelFormulaGuideView';

interface MateriViewProps {
  onNavigateHome: () => void;
  onNavigateCek?: () => void;
  onNavigateKelas7?: () => void;
  onNavigateKuis?: () => void;
}

export const MateriView: React.FC<MateriViewProps> = ({
  onNavigateHome,
  onNavigateCek,
  onNavigateKelas7,
  onNavigateKuis,
}) => {
  // Read grade from URL parameter if present (?grade=7 or ?grade=8)
  const [selectedGrade, setSelectedGrade] = useState<'7' | '8'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const g = params.get('grade') || params.get('kelas');
      if (g === '8' || g === 'kelas8') return '8';
    }
    return '7';
  });

  // Subtab for Kelas 7
  const [kelas7SubTab, setKelas7SubTab] = useState<'excel' | 'guide' | 'modul'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'guide' || tab === 'rumus') return 'guide';
      if (tab === 'modul' || tab === 'teori') return 'modul';
    }
    return 'excel';
  });

  // Selected Bab for Kelas 8 (Bab 1, Bab 2, Bab 3, Bab 4, or semua)
  const [kelas8Bab, setKelas8Bab] = useState<'semua' | 'bab1' | 'bab2' | 'bab3' | 'bab4'>('semua');

  // Interactive Coding Engine Selector for Bab 3 Algoritma Pemrograman
  const [activeCodingTool, setActiveCodingTool] = useState<'blockly-code' | 'blockly-games' | 'scratch'>('blockly-code');
  const [isIframeFullscreen, setIsIframeFullscreen] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);

  // Binary converter mini tool state for Bab 2 Berpikir Komputasional
  const [binInput, setBinInput] = useState<string>('42');

  const studioContainerRef = useRef<HTMLDivElement>(null);

  // Handle grade change and update URL parameter
  const handleSwitchGrade = (grade: '7' | '8') => {
    setSelectedGrade(grade);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('grade', grade);
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  // Toggle fullscreen mode for the interactive iframe studio
  const handleToggleFullscreen = () => {
    if (!studioContainerRef.current) return;
    if (!document.fullscreenElement) {
      studioContainerRef.current.requestFullscreen?.().then(() => {
        setIsIframeFullscreen(true);
      }).catch(() => {
        setIsIframeFullscreen(!isIframeFullscreen);
      });
    } else {
      document.exitFullscreen?.().then(() => {
        setIsIframeFullscreen(false);
      }).catch(() => {
        setIsIframeFullscreen(false);
      });
    }
  };

  // Coding Tools Configurations
  const CODING_TOOLS: Record<
    'blockly-code' | 'blockly-games' | 'scratch',
    {
      title: string;
      subtitle: string;
      url: string;
      /** URL opsional untuk tombol "Buka Tab Baru" bila berbeda dari sumber iframe. */
      openUrl?: string;
      badge: string;
      description: string;
      icon: LucideIcon;
      externalUrl?: string;
    }
  > = {
    'blockly-code': {
      title: 'Google Blockly Code Workspace',
      subtitle: 'Visual Block Coding → Export ke JavaScript, Python, Dart, PHP & XML',
      url: 'https://blockly-demo.appspot.com/static/demos/code/index.html',
      badge: 'RESMI GOOGLE',
      description: 'Susun balok logika visual (Logic, Loops, Math, Text, Variables, Functions) dan amati langsung bagaimana blok diterjemahkan ke kode bahasa pemrograman profesional secara real-time.',
      icon: Code2,
    },
    'blockly-games': {
      title: 'Blockly Games (Labirin & Puzzle Logika)',
      subtitle: 'Game Edukasi Algoritma Pemrograman Interaktif',
      url: 'https://blockly.games/',
      badge: 'GAME EDUKASI',
      description: 'Selesaikan tantangan labirin terprogram: kendalikan karakter dengan sekuensial langkah, percabangan jalan (if-else), dan perulangan (while) hingga garis akhir.',
      icon: Gamepad2,
    },
    'scratch': {
      title: 'Scratch 3.0 Studio (PenguinMod Editor)',
      subtitle: 'Pemrograman Blok Visual Animasi & Game Siswa',
      // TurboWarp menolak dimuat di dalam iframe ("Invalid TurboWarp Embed"),
      // jadi editor di halaman ini memakai PenguinMod (mod Scratch 3.0 yang kompatibel).
      url: 'https://studio.penguinmod.com/editor.html',
      // TurboWarp tetap tersedia sebagai editor penuh, dibuka di tab baru.
      openUrl: 'https://turbowarp.org/editor',
      badge: 'SCRATCH 3.0',
      description:
        'Workspace Scratch 3.0 yang langsung bisa dipakai di dalam halaman tanpa akun login (PenguinMod). Karena TurboWarp dan Scratch MIT tidak mengizinkan editor mereka disematkan di iframe, gunakan tombol "Buka Tab Baru" untuk membuka TurboWarp dengan performa maksimal.',
      externalUrl: 'https://scratch.mit.edu/create',
      icon: Puzzle,
    },
  };

  const currentTool = CODING_TOOLS[activeCodingTool];

  // Helper for Decimal to Binary / Hex converter in Bab 2
  const decimalNumber = parseInt(binInput, 10);
  const binaryString = !isNaN(decimalNumber) && decimalNumber >= 0 ? decimalNumber.toString(2) : '0';
  const hexString = !isNaN(decimalNumber) && decimalNumber >= 0 ? decimalNumber.toString(16).toUpperCase() : '0';
  const octalString = !isNaN(decimalNumber) && decimalNumber >= 0 ? decimalNumber.toString(8) : '0';

  return (
    <div className="space-y-6">
      {/* 1. EDITORIAL HEADER BANNER */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b-2 border-[#1a1a1a]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 font-mono-code text-[10px] font-bold uppercase">
              <span className="px-2 py-0.5 bg-[#1a1a1a] text-white border border-[#1a1a1a]">
                PORTAL MATERI RESMI
              </span>
              <span className="px-2 py-0.5 bg-[#F2EFEB] text-slate-800 border border-[#1a1a1a]">
                KURIKULUM MERDEKA INFORMATIKA
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-500">
                LENGKAP: KELAS 7 & KELAS 8
              </span>
            </div>
            <h1 className="font-mono-code text-xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight flex items-center gap-2.5">
              <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-[#2e59e6]" />
              <span>Materi Pembelajaran Informatika</span>
            </h1>
            <p className="font-sans text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Pusat materi pembelajaran resmi mata pelajaran Informatika serta Koding dan Kecerdasan Artifisial (KKA). Dilengkapi <strong>Laboratorium Excel</strong> untuk Kelas 7 dan <strong>Studio Praktik Algoritma Pemrograman (Blockly & Scratch)</strong> untuk Kelas 8.
            </p>
          </div>
        </div>

        {/* 2. DUAL GRADE SELECTOR TABS (KELAS 7 & KELAS 8) */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSwitchGrade('7')}
              className={`w-full sm:w-auto px-2 py-2.5 sm:px-5 sm:py-3 font-mono-code text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 ${
                selectedGrade === '7'
                  ? 'bg-[#107c41] text-white border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] sm:shadow-[4px_4px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 shrink-0">
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                <span className="tracking-tight text-[11px] xs:text-xs sm:text-sm">MATERI KELAS 7</span>
              </div>
              <span
                className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 border font-mono-code font-bold text-center leading-none ${
                  selectedGrade === '7'
                    ? 'bg-white text-[#107c41] border-white'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                <span className="sm:hidden">LAB EXCEL</span>
                <span className="hidden sm:inline">LAB EXCEL & ANALISIS DATA</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchGrade('8')}
              className={`w-full sm:w-auto px-2 py-2.5 sm:px-5 sm:py-3 font-mono-code text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 ${
                selectedGrade === '8'
                  ? 'bg-[#2e59e6] text-white border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] sm:shadow-[4px_4px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 shrink-0">
                <Code2 className="h-4 w-4 shrink-0" />
                <span className="tracking-tight text-[11px] xs:text-xs sm:text-sm">MATERI KELAS 8</span>
              </div>
              <span
                className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 border font-mono-code font-bold text-center leading-none ${
                  selectedGrade === '8'
                    ? 'bg-white text-[#2e59e6] border-white'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}
              >
                <span className="sm:hidden">4 BAB (KKA)</span>
                <span className="hidden sm:inline">4 BAB: AD, BK, AP (BLOCKLY/SCRATCH), HAK DIGITAL</span>
              </span>
            </button>
          </div>

          <div className="font-mono-code text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 self-center sm:self-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Rute Aktif: /materi?grade={selectedGrade}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION A: KELAS 7 CONTENT (LAB EXCEL + MODUL TEORI)       */}
      {/* ========================================================= */}
      {selectedGrade === '7' && (
        <div className="space-y-4">
          {/* Sub-tab Navigation for Kelas 7 */}
          <div className="bg-white border-2 border-[#1a1a1a] p-2 flex flex-wrap items-center justify-between gap-2 shadow-[2px_2px_0px_#1a1a1a]">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setKelas7SubTab('excel')}
                className={`w-full sm:w-auto px-3.5 py-2 font-mono-code text-xs font-bold border transition-all cursor-pointer flex items-center justify-between sm:justify-start gap-2 ${
                  kelas7SubTab === 'excel'
                    ? 'bg-[#107c41] text-white border-[#107c41] shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
                  <span>LABORATORIUM EXCEL (PRAKTIK & TUGAS)</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-400 text-amber-950 font-black shrink-0">
                  UTAMA
                </span>
              </button>

              <button
                type="button"
                onClick={() => setKelas7SubTab('guide')}
                className={`w-full sm:w-auto px-3.5 py-2 font-mono-code text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                  kelas7SubTab === 'guide'
                    ? 'bg-[#2e59e6] text-white border-[#2e59e6] shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                <Calculator className="h-3.5 w-3.5 shrink-0" />
                <span>PANDUAN LENGKAP RUMUS & FUNGSI</span>
              </button>

              <button
                type="button"
                onClick={() => setKelas7SubTab('modul')}
                className={`w-full sm:w-auto px-3.5 py-2 font-mono-code text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                  kelas7SubTab === 'modul'
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span>MODUL TEORI KELAS 7 (BK, TIK, SK, JKI, AD)</span>
              </button>
            </div>

            <div className="font-mono-code text-[11px] text-slate-500 px-2 hidden md:block">
              Lab Excel kini terpusat di /materi
            </div>
          </div>

          {/* Sub-tab 1: Interactive Excel Lab Workspace */}
          {kelas7SubTab === 'excel' && (
            <div className="space-y-4">
              <ExcelLabStudentWorkspace
                onNavigateHome={onNavigateHome}
                onNavigateCek={onNavigateCek}
                onNavigateKelas7={onNavigateKelas7}
              />
            </div>
          )}

          {/* Sub-tab 2: Complete Formula Guide */}
          {kelas7SubTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[4px_4px_0px_#1a1a1a] flex items-center justify-between">
                <div>
                  <h2 className="font-mono-code text-base font-bold text-[#1a1a1a]">
                    Referensi Lengkap Sintaks Rumus Spreadsheet
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Panduan praktis pengolahan data dengan contoh rumus, input data, dan hasil perhitungan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setKelas7SubTab('excel')}
                  className="px-3 py-1.5 bg-[#107c41] text-white font-mono-code text-xs font-bold hover:bg-[#0c5c30] transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a]"
                >
                  <Play className="h-3 w-3" />
                  <span>Coba di Laboratorium Excel &rarr;</span>
                </button>
              </div>
              <ExcelFormulaGuideView onTryFormulaInPlayground={() => setKelas7SubTab('excel')} />
            </div>
          )}

          {/* Sub-tab 3: Kelas 7 Theory Modules */}
          {kelas7SubTab === 'modul' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: BK */}
              <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-400 font-mono-code text-[10px] font-bold">
                      MODUL 1 • BK
                    </span>
                    <BrainCircuit className="h-4 w-4 text-[#2e59e6]" />
                  </div>
                  <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a]">
                    Berpikir Komputasional (BK)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Mempelajari 4 pilar computational thinking: Dekomposisi, Pengenalan Pola, Abstraksi, dan Perancangan Algoritma untuk menyelesaikan masalah kompleks dalam kehidupan sehari-hari.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono-code text-slate-500 space-y-1">
                    <div>• Dekomposisi masalah besar menjadi bagian kecil</div>
                    <div>• Mencari pola berulang dan tren data</div>
                    <div>• Menyusun langkah algoritma terstruktur</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono-code text-xs">
                  <span className="text-emerald-700 font-bold">✓ Tersedia</span>
                  <button
                    type="button"
                    onClick={() => onNavigateKuis?.()}
                    className="text-[#2e59e6] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Latihan Soal</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Card 2: TIK */}
              <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 font-mono-code text-[10px] font-bold">
                      MODUL 2 • TIK
                    </span>
                    <Compass className="h-4 w-4 text-[#107c41]" />
                  </div>
                  <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a]">
                    Teknologi Informasi & Komunikasi
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Pengoperasian sistem antarmuka berbasis GUI, manajemen pengelolaan berkas dan folder, pembuatan dokumen pengolah kata, serta pembuatan slide presentasi yang efektif.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono-code text-slate-500 space-y-1">
                    <div>• Ekstensi file (.docx, .xlsx, .pdf, .zip)</div>
                    <div>• Struktur hierarki folder komputer</div>
                    <div>• Teknik pencarian informasi efektif (Web Search)</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono-code text-xs">
                  <span className="text-emerald-700 font-bold">✓ Tersedia</span>
                  <span className="text-slate-400 font-mono-code">SMP Kls 7</span>
                </div>
              </div>

              {/* Card 3: SK */}
              <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400 font-mono-code text-[10px] font-bold">
                      MODUL 3 • SK
                    </span>
                    <Cpu className="h-4 w-4 text-amber-700" />
                  </div>
                  <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a]">
                    Sistem Komputer (Hardware & OS)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Mengenal anatomi komputer: Perangkat Masukan (Input), Pemrosesan (CPU/ALU), Penyimpanan (RAM, ROM, SSD/HDD), Perangkat Keluaran (Output), serta interaksi dengan Sistem Operasi.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono-code text-slate-500 space-y-1">
                    <div>• Siklus kerja: Input &rarr; Proses &rarr; Output</div>
                    <div>• Perbedaan RAM (Volatile) vs ROM/Storage</div>
                    <div>• Peran OS (Windows, Linux, Android)</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono-code text-xs">
                  <span className="text-emerald-700 font-bold">✓ Tersedia</span>
                  <span className="text-slate-400 font-mono-code">SMP Kls 7</span>
                </div>
              </div>

              {/* Card 4: JKI */}
              <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-cyan-100 text-cyan-900 border border-cyan-400 font-mono-code text-[10px] font-bold">
                      MODUL 4 • JKI
                    </span>
                    <Globe className="h-4 w-4 text-cyan-700" />
                  </div>
                  <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a]">
                    Jaringan Komputer & Internet (JKI)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Prinsip dasar konektivitas jaringan lokal (LAN), jaringan nirkabel (Wi-Fi, Bluetooth), tethering ponsel pintar, serta proteksi keamanan saat berselancar di internet.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono-code text-slate-500 space-y-1">
                    <div>• Koneksi kabel (UTP/LAN) vs Nirkabel (Wi-Fi)</div>
                    <div>• Konsep dasar bandwidth & kecepatan data</div>
                    <div>• Keamanan berinternet & proteksi kata sandi</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono-code text-xs">
                  <span className="text-emerald-700 font-bold">✓ Tersedia</span>
                  <span className="text-slate-400 font-mono-code">SMP Kls 7</span>
                </div>
              </div>

              {/* Card 5: AD & Lab Excel */}
              <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between border-l-4 border-l-[#107c41]">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-[#107c41] text-white font-mono-code text-[10px] font-bold">
                      MODUL 5 • AD (UTAMA)
                    </span>
                    <FileSpreadsheet className="h-4 w-4 text-[#107c41]" />
                  </div>
                  <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a]">
                    Analisis Data & Spreadsheet
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Pengolahan data tabular dengan spreadsheet: sintaks formula dasar (SUM, COUNT), bersyarat (SUMIF, COUNTIF), statistik (AVERAGE, MEDIAN, MAX, MIN, LARGE, SMALL), manipulasi teks, dan logika IF.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono-code text-slate-500 space-y-1">
                    <div>• Formula dasar aritmatika & tanggal</div>
                    <div>• Fungsi teks (UPPER, LOWER, CONCATENATE)</div>
                    <div>• Evaluasi otomatis dan auto-grading</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono-code text-xs">
                  <button
                    type="button"
                    onClick={() => setKelas7SubTab('excel')}
                    className="px-2.5 py-1 bg-[#107c41] text-white font-bold hover:bg-[#0c5c30] transition-colors flex items-center gap-1"
                  >
                    <Play className="h-3 w-3" />
                    <span>Buka Lab Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setKelas7SubTab('guide')}
                    className="text-[#2e59e6] font-bold hover:underline"
                  >
                    Buku Rumus
                  </button>
                </div>
              </div>

              {/* Card 6: DSI */}
              <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-400 font-mono-code text-[10px] font-bold">
                      MODUL 6 • DSI
                    </span>
                    <ShieldCheck className="h-4 w-4 text-rose-700" />
                  </div>
                  <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a]">
                    Dampak Sosial Informatika
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Etika dan norma dalam dunia digital, pencegahan cyberbullying, menjaga jejak digital positif, serta hukum dasar perlindungan data pribadi dan privasi.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono-code text-slate-500 space-y-1">
                    <div>• Jejak digital (Digital Footprint)</div>
                    <div>• Etika bermedia sosial & anti-hoaks</div>
                    <div>• Keamanan akun & autentikasi 2 langkah</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono-code text-xs">
                  <span className="text-emerald-700 font-bold">✓ Tersedia</span>
                  <span className="text-slate-400 font-mono-code">SMP Kls 7</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION B: KELAS 8 CONTENT (4 BAB RESMI KURIKULUM)         */}
      {/* ========================================================= */}
      {selectedGrade === '8' && (
        <div className="space-y-6">
          {/* Chapter Selector Tabs for Kelas 8 */}
          <div className="bg-white border-2 border-[#1a1a1a] p-3 shadow-[3px_3px_0px_#1a1a1a] flex flex-wrap items-center justify-between gap-3 font-mono-code text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-slate-700 mr-1 uppercase">BAB KELAS 8:</span>
              <button
                type="button"
                onClick={() => setKelas8Bab('semua')}
                className={`px-3 py-1.5 font-bold border transition-all cursor-pointer ${
                  kelas8Bab === 'semua'
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#2e59e6]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                Semua Bab
              </button>
              <button
                type="button"
                onClick={() => setKelas8Bab('bab1')}
                className={`px-3 py-1.5 font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  kelas8Bab === 'bab1'
                    ? 'bg-[#107c41] text-white border-[#107c41] shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Bab 1: Analisis Data</span>
              </button>
              <button
                type="button"
                onClick={() => setKelas8Bab('bab2')}
                className={`px-3 py-1.5 font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  kelas8Bab === 'bab2'
                    ? 'bg-[#800080] text-white border-[#800080] shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                <BrainCircuit className="h-3.5 w-3.5" />
                <span>Bab 2: Berpikir Komputasional</span>
              </button>
              <button
                type="button"
                onClick={() => setKelas8Bab('bab3')}
                className={`px-3 py-1.5 font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  kelas8Bab === 'bab3'
                    ? 'bg-[#2e59e6] text-white border-[#2e59e6] shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-[#F2EFEB] hover:bg-white text-[#2e59e6] border-[#2e59e6] font-black'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Bab 3: Algoritma Pemrograman</span>
                <span className="text-[9px] px-1 bg-amber-400 text-amber-950 font-black">
                  STUDIO
                </span>
              </button>
              <button
                type="button"
                onClick={() => setKelas8Bab('bab4')}
                className={`px-3 py-1.5 font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  kelas8Bab === 'bab4'
                    ? 'bg-rose-700 text-white border-rose-700 shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Bab 4: Hak-Hak Digital</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateKuis && (
                <button
                  type="button"
                  onClick={onNavigateKuis}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-mono-code text-xs font-bold transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a]"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Kuis Ujian Kelas 8</span>
                </button>
              )}
            </div>
          </div>

          {/* =================================================================== */}
          {/* BAB 3: ALGORITMA DAN PEMROGRAMAN - INTERACTIVE CODING STUDIO        */}
          {/* ========================================================= */}
          {(kelas8Bab === 'semua' || kelas8Bab === 'bab3') && (
            <div className="space-y-4 pt-2">
              <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-[#1a1a1a]">
                  <div>
                    <div className="flex items-center gap-2 font-mono-code text-[10px] font-bold uppercase mb-1">
                      <span className="px-2 py-0.5 bg-[#2e59e6] text-white">BAB 3 • AP</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400">
                        STUDIO PRAKTIK KODING INTERAKTIF
                      </span>
                    </div>
                    <h2 className="font-mono-code text-lg sm:text-2xl font-black text-[#1a1a1a]">
                      Algoritma dan Pemrograman (AP)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                      Eksplorasi logika koding blok visual, pemecahan masalah algoritma, percabangan (if-else), perulangan (loops), dan konversi kode langsung ke Python & JavaScript melalui 3 studio interaktif:
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 font-mono-code text-xs shrink-0 self-start md:self-center">
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>Simulasi Live</span>
                    </span>
                  </div>
                </div>

                {/* Studio Platform Switcher Tabs */}
                <div className="pt-3.5 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCodingTool('blockly-code')}
                      className={`px-3.5 py-2 font-mono-code text-xs font-bold border-2 transition-all cursor-pointer flex items-center gap-2 ${
                        activeCodingTool === 'blockly-code'
                          ? 'bg-[#2e59e6] text-white border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]'
                          : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      <Code2 className="h-4 w-4" />
                      <span>1. GOOGLE BLOCKLY CODE</span>
                      <span className="text-[9px] px-1 bg-amber-400 text-amber-950 font-black">
                        BLOK &rarr; PYTHON
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCodingTool('blockly-games')}
                      className={`px-3.5 py-2 font-mono-code text-xs font-bold border-2 transition-all cursor-pointer flex items-center gap-2 ${
                        activeCodingTool === 'blockly-games'
                          ? 'bg-purple-700 text-white border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]'
                          : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      <Gamepad2 className="h-4 w-4" />
                      <span>2. BLOCKLY GAMES</span>
                      <span className="text-[9px] px-1 bg-purple-200 text-purple-900 font-bold">
                        GAME LABIRIN
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCodingTool('scratch')}
                      className={`px-3.5 py-2 font-mono-code text-xs font-bold border-2 transition-all cursor-pointer flex items-center gap-2 ${
                        activeCodingTool === 'scratch'
                          ? 'bg-amber-600 text-white border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]'
                          : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      <Puzzle className="h-4 w-4" />
                      <span>3. SCRATCH 3.0 STUDIO</span>
                      <span className="text-[9px] px-1 bg-amber-200 text-amber-950 font-bold">
                        ANIMASI & GAME
                      </span>
                    </button>
                  </div>

                  {/* Actions for current tool */}
                  <div className="flex items-center gap-2 font-mono-code text-xs">
                    <button
                      type="button"
                      onClick={() => setIframeKey((prev) => prev + 1)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-[#1a1a1a] text-slate-700 transition-all cursor-pointer flex items-center gap-1 shadow-[1px_1px_0px_#1a1a1a]"
                      title="Muat ulang workspace"
                    >
                      <RotateCw className="h-3 w-3" />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleFullscreen}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-[#1a1a1a] text-slate-700 transition-all cursor-pointer flex items-center gap-1 shadow-[1px_1px_0px_#1a1a1a]"
                      title="Toggle mode layar penuh"
                    >
                      {isIframeFullscreen ? (
                        <>
                          <Minimize2 className="h-3 w-3" />
                          <span className="hidden sm:inline">Kecilkan</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-3 w-3" />
                          <span className="hidden sm:inline">Layar Penuh</span>
                        </>
                      )}
                    </button>

                    <a
                      href={currentTool.openUrl ?? currentTool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2e59e6] text-white font-bold border border-[#1a1a1a] transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a]"
                      title="Buka di tab baru peramban untuk area kerja maksimal"
                    >
                      <span>Buka Tab Baru</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* Info Bar for Active Tool */}
                <div className="mt-3 p-3 bg-[#FAF8F5] border border-[#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono-code text-xs">
                  <div>
                    <span className="font-bold text-[#1a1a1a]">{currentTool.title}:</span>{' '}
                    <span className="text-slate-600">{currentTool.description}</span>
                  </div>
                  {activeCodingTool === 'scratch' && currentTool.externalUrl && (
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

                {/* THE INTERACTIVE IFRAME WORKSPACE CONTAINER */}
                <div
                  ref={studioContainerRef}
                  className={`mt-3 bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden transition-all relative ${
                    isIframeFullscreen ? 'fixed inset-0 z-50 p-2 bg-[#F2EFEB] flex flex-col h-screen w-screen' : ''
                  }`}
                >
                  {isIframeFullscreen && (
                    <div className="p-2 bg-[#1a1a1a] text-white flex items-center justify-between font-mono-code text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        <span className="font-bold">{currentTool.title} (Mode Layar Penuh)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleFullscreen}
                        className="px-2.5 py-1 bg-white text-[#1a1a1a] font-bold border border-white hover:bg-slate-200"
                      >
                        Kembali ke Halaman Normal ✕
                      </button>
                    </div>
                  )}

                  <iframe
                    key={`${activeCodingTool}-${iframeKey}`}
                    src={currentTool.url}
                    title={currentTool.title}
                    className="w-full h-[600px] sm:h-[720px] lg:h-[800px] border-none bg-white"
                    allow="camera; microphone; accelerometer; gyroscope; fullscreen"
                    loading="lazy"
                  />
                </div>

                {/* Pedagogical Guidance & Practical Mission Cards for Students */}
                <div className="mt-4 pt-4 border-t-2 border-[#1a1a1a]">
                  <h4 className="font-mono-code text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>LEMBAR TANTANGAN PRAKTIKUM ALGORITMA PEMROGRAMAN KELAS 8:</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono-code text-xs">
                    <div className="p-3 bg-[#FAF8F5] border border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
                      <div className="font-bold text-[#2e59e6] mb-1">MISI 1: SEKUENSIAL</div>
                      <div className="text-[11px] text-slate-700 leading-relaxed">
                        Susun balok gerak langkah demi langkah untuk mengarahkan karakter dari titik awal ke tujuan tanpa rintangan.
                      </div>
                    </div>

                    <div className="p-3 bg-[#FAF8F5] border border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
                      <div className="font-bold text-purple-700 mb-1">MISI 2: PERCABANGAN</div>
                      <div className="text-[11px] text-slate-700 leading-relaxed">
                        Gunakan balok <span className="text-[#1a1a1a] font-bold">if-else</span> untuk mendeteksi rintangan: jika ada belokan ke kanan, maka belok kanan.
                      </div>
                    </div>

                    <div className="p-3 bg-[#FAF8F5] border border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
                      <div className="font-bold text-amber-700 mb-1">MISI 3: PERULANGAN (LOOP)</div>
                      <div className="text-[11px] text-slate-700 leading-relaxed">
                        Gunakan perulangan <span className="text-[#1a1a1a] font-bold">repeat while</span> agar program berjalan efisien tanpa menulis instruksi berulang kali.
                      </div>
                    </div>

                    <div className="p-3 bg-[#FAF8F5] border border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
                      <div className="font-bold text-emerald-700 mb-1">MISI 4: VARIABEL & SKOR</div>
                      <div className="text-[11px] text-slate-700 leading-relaxed">
                        Buat variabel <span className="text-[#1a1a1a] font-bold">skor</span> yang bertambah +1 setiap kali karakter berhasil mengumpulkan objek target.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* BAB 1: ANALISIS DATA (AD)                                          */}
          {/* =================================================================== */}
          {(kelas8Bab === 'semua' || kelas8Bab === 'bab1') && (
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#107c41] text-white font-mono-code text-[10px] font-bold">
                    BAB 1 • AD
                  </span>
                  <h3 className="font-mono-code text-base sm:text-xl font-black text-[#1a1a1a]">
                    Bab 1: Analisis Data (AD)
                  </h3>
                </div>
                <FileSpreadsheet className="h-5 w-5 text-[#107c41]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
                <div className="p-3.5 bg-[#FAF8F5] border border-[#1a1a1a] space-y-2">
                  <h4 className="font-mono-code font-bold text-sm text-[#107c41] flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>1. Konsep & Siklus Analisis Data</span>
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    Analisis data adalah proses inspeksi, pembersihan (*data cleaning*), transformasi, dan pemodelan data untuk menemukan pola informasi yang berguna dalam pengambilan keputusan.
                  </p>
                  <div className="font-mono-code text-[11px] text-slate-600 pt-1">
                    • Pengumpulan data (survei, log, sensor)<br/>
                    • Pembersihan duplikat & missing values<br/>
                    • Penarikan kesimpulan statistik
                  </div>
                </div>

                <div className="p-3.5 bg-[#FAF8F5] border border-[#1a1a1a] space-y-2">
                  <h4 className="font-mono-code font-bold text-sm text-[#107c41] flex items-center gap-1.5">
                    <Layers className="h-4 w-4" />
                    <span>2. Pivot Table & Filter Lanjutan</span>
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    Pengorganisasian data multidimensi dengan Pivot Table untuk meringkas ribuan baris data transaksi atau nilai siswa menjadi tabel ikhtisar yang ringkas dan mudah dipahami.
                  </p>
                  <div className="font-mono-code text-[11px] text-slate-600 pt-1">
                    • Pemilahan baris, kolom, dan nilai (Sum/Avg)<br/>
                    • Penerapan filter bersyarat (*Conditional*)<br/>
                    • Validasi rentang data angka
                  </div>
                </div>

                <div className="p-3.5 bg-[#FAF8F5] border border-[#1a1a1a] space-y-2">
                  <h4 className="font-mono-code font-bold text-sm text-[#107c41] flex items-center gap-1.5">
                    <Compass className="h-4 w-4" />
                    <span>3. Visualisasi Grafik & Chart</span>
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    Menerjemahkan kumpulan angka menjadi representasi visual: Grafik Batang (perbandingan kategori), Garis (tren waktu), Lingkaran (proporsi persentase), dan Scatter Plot (korelasi 2 variabel).
                  </p>
                  <div className="font-mono-code text-[11px] text-slate-600 pt-1">
                    • Pemilihan tipe chart yang tepat<br/>
                    • Pembacaan kecenderungan dan anomali<br/>
                    • Penyusunan laporan presentasi data
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 font-mono-code text-xs">
                <span className="text-slate-600">
                  Ingin praktik langsung rumus spreadsheet (SUM, COUNTIF, AVERAGE, IF)?
                </span>
                <button
                  type="button"
                  onClick={() => handleSwitchGrade('7')}
                  className="px-3 py-1.5 bg-[#107c41] hover:bg-[#0c5c30] text-white font-bold transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a] cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Buka Laboratorium Excel di Kelas 7 &rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* BAB 2: BERPIKIR KOMPUTASIONAL (BK)                                  */}
          {/* =================================================================== */}
          {(kelas8Bab === 'semua' || kelas8Bab === 'bab2') && (
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#800080] text-white font-mono-code text-[10px] font-bold">
                    BAB 2 • BK
                  </span>
                  <h3 className="font-mono-code text-base sm:text-xl font-black text-[#1a1a1a]">
                    Bab 2: Berpikir Komputasional (BK)
                  </h3>
                </div>
                <BrainCircuit className="h-5 w-5 text-purple-700" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
                <div className="p-3.5 bg-[#FAF8F5] border border-[#1a1a1a] space-y-2">
                  <h4 className="font-mono-code font-bold text-sm text-purple-800 flex items-center gap-1.5">
                    <FolderTree className="h-4 w-4" />
                    <span>1. Struktur Data Graf & Pohon (Tree)</span>
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    Representasi hubungan objek dalam komputer: <strong>Graf</strong> (kumpulan simpul/node dan sisi/edge seperti jaringan jalan atau pertemanan sosmed) dan <strong>Pohon (Tree)</strong> (struktur hierarki bercabang dengan simpul akar, induk, dan anak).
                  </p>
                </div>

                <div className="p-3.5 bg-[#FAF8F5] border border-[#1a1a1a] space-y-2">
                  <h4 className="font-mono-code font-bold text-sm text-purple-800 flex items-center gap-1.5">
                    <Binary className="h-4 w-4" />
                    <span>2. Sistem Bilangan Biner & Heksadesimal</span>
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    Komputer bekerja dengan sinyal digital biner (0 dan 1 / Low and High voltage). Mempelajari konversi bilangan Desimal (basis 10), Biner (basis 2), dan Heksadesimal (basis 16) yang digunakan pada kode warna RGB dan memori.
                  </p>
                </div>

                <div className="p-3.5 bg-[#FAF8F5] border border-[#1a1a1a] space-y-2">
                  <h4 className="font-mono-code font-bold text-sm text-purple-800 flex items-center gap-1.5">
                    <Terminal className="h-4 w-4" />
                    <span>3. Algoritma Pencarian & Pengurutan</span>
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    Efisiensi pemrosesan data: <strong>Linear Search</strong> (pencarian berurutan) vs <strong>Binary Search</strong> (pencarian bagi-dua pada data terurut). Serta algoritma <strong>Bubble Sort</strong> dan <strong>Insertion Sort</strong>.
                  </p>
                </div>
              </div>

              {/* Interactive Mini Binary Converter Tool */}
              <div className="mt-4 p-3.5 bg-[#1a1a1a] text-white border border-[#1a1a1a] font-mono-code text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Binary className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold text-amber-300">SIMULATOR KONVERSI BILANGAN KOMPUTER:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="bin-input" className="text-slate-300">Desimal:</label>
                    <input
                      id="bin-input"
                      type="number"
                      min="0"
                      max="65535"
                      value={binInput}
                      onChange={(e) => setBinInput(e.target.value)}
                      className="w-24 px-2 py-1 bg-white text-[#1a1a1a] font-bold border border-white text-center"
                    />
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900 p-2 border border-slate-700">
                    <div className="text-slate-400 text-[10px]">Biner (Basis 2):</div>
                    <div className="text-emerald-400 font-bold text-sm tracking-widest">{binaryString}₂</div>
                  </div>
                  <div className="bg-slate-900 p-2 border border-slate-700">
                    <div className="text-slate-400 text-[10px]">Oktal (Basis 8):</div>
                    <div className="text-blue-300 font-bold text-sm tracking-widest">{octalString}₈</div>
                  </div>
                  <div className="bg-slate-900 p-2 border border-slate-700">
                    <div className="text-slate-400 text-[10px]">Heksadesimal (Basis 16):</div>
                    <div className="text-amber-300 font-bold text-sm tracking-widest">0x{hexString}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* BAB 4: HAK-HAK DIGITAL (DSI & KKA)                                  */}
          {/* =================================================================== */}
          {(kelas8Bab === 'semua' || kelas8Bab === 'bab4') && (
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-rose-700 text-white font-mono-code text-[10px] font-bold">
                    BAB 4 • DSI
                  </span>
                  <h3 className="font-mono-code text-base sm:text-xl font-black text-[#1a1a1a]">
                    Bab 4: Hak-Hak Digital (Dampak Sosial Informatika & AI)
                  </h3>
                </div>
                <ShieldCheck className="h-5 w-5 text-rose-700" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
                <div className="p-3.5 bg-[#FAF8F5] border border-[#1a1a1a] space-y-2">
                  <h4 className="font-mono-code font-bold text-sm text-rose-800 flex items-center gap-1.5">
                    <Scale className="h-4 w-4" />
                    <span>1. Hak Cipta & Lisensi Perangkat Lunak</span>
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    Pengakuan Hak Atas Kekayaan Intelektual (HAKI) atas karya digital, software, dan konten multimedia. Membedakan <strong>Hak Cipta Proprietary</strong>, <strong>Lisensi Terbuka (Open Source / MIT / GPL)</strong>, dan ragam lisensi <strong>Creative Commons (CC)</strong>.
                  </p>
                  <div className="font-mono-code text-[11px] text-slate-600 pt-1">
                    • Larangan pembajakan software & crack<br/>
                    • Kewajiban atribusi (mencantumkan sumber)<br/>
                    • Pemanfaatan lisensi domain publik
                  </div>
                </div>

                <div className="p-3.5 bg-[#FAF8F5] border border-[#1a1a1a] space-y-2">
                  <h4 className="font-mono-code font-bold text-sm text-rose-800 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4" />
                    <span>2. Perlindungan Data Pribadi & Privasi</span>
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    Memahami hak atas privasi data pribadi (Personal Data Protection) di era internet. Menjaga data sensitif (NIK, kata sandi, lokasi real-time), mitigasi serangan phishing, social engineering, serta pemahaman atas regulasi UU Perlindungan Data Pribadi (UU PDP).
                  </p>
                  <div className="font-mono-code text-[11px] text-slate-600 pt-1">
                    • Autentikasi dua faktor (2FA)<br/>
                    • Enkripsi end-to-end pesan instan<br/>
                    • Kebijakan izin aplikasi (Permissions)
                  </div>
                </div>

                <div className="p-3.5 bg-[#FAF8F5] border border-[#1a1a1a] space-y-2">
                  <h4 className="font-mono-code font-bold text-sm text-rose-800 flex items-center gap-1.5">
                    <Bot className="h-4 w-4" />
                    <span>3. Etika Kecerdasan Artifisial (AI Ethics)</span>
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    Pemanfaatan AI secara bertanggung jawab: memahami bias dalam algoritma machine learning, transparansi data pelatihan, bahaya disinformasi *deepfake*, serta integritas akademik dalam penggunaan Generative AI di sekolah.
                  </p>
                  <div className="font-mono-code text-[11px] text-slate-600 pt-1">
                    • Sikap kritis terhadap output AI (fact-checking)<br/>
                    • Menghindari plagiarisme digital<br/>
                    • Menjaga rekam jejak digital positif
                  </div>
                </div>
              </div>

              {/* Ethics Commitment Box */}
              <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-400 font-mono-code text-xs text-amber-950 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">PRINSIP DIGITAL CITIZENSHIP KELAS 8:</span> Setiap siswa wajib menghormati karya orang lain, melindungi identitas diri, tidak melakukan perundungan siber (*cyberbullying*), dan menggunakan teknologi kecerdasan artifisial sebagai sarana kolaborasi belajar yang beretika.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
