import React, { useState } from 'react';
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
  ArrowLeft,
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

  // Selected module filter for Kelas 8
  const [kelas8Module, setKelas8Module] = useState<string>('semua');

  // Handle grade change and update URL parameter
  const handleSwitchGrade = (grade: '7' | '8') => {
    setSelectedGrade(grade);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('grade', grade);
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

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
              Pusat materi pembelajaran komprehensif mata pelajaran Informatika dan Koding. Dilengkapi modul teori terstruktur, simulasi interaktif, dan <strong>Laboratorium Excel & Analisis Data</strong> dengan penilaian otomatis.
            </p>
          </div>

          {/* Quick Header External Actions */}
          <div className="flex flex-wrap items-center gap-2 font-mono-code text-xs self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={onNavigateHome}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#1a1a1a] font-bold border border-[#1a1a1a] transition-all cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Beranda Showcase</span>
            </button>
            {onNavigateCek && (
              <button
                type="button"
                onClick={onNavigateCek}
                className="px-3 py-1.5 bg-[#2e59e6] hover:bg-[#1f3fb3] text-white font-bold border border-[#1a1a1a] transition-all cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a]"
              >
                <span>Cek Nilai Siswa</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2. DUAL GRADE SELECTOR TABS (KELAS 7 & KELAS 8) */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSwitchGrade('7')}
              className={`flex-1 sm:flex-initial px-5 py-3 font-mono-code text-sm font-bold border-2 transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                selectedGrade === '7'
                  ? 'bg-[#107c41] text-white border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              <span>MATERI KELAS 7</span>
              <span
                className={`text-[10px] px-2 py-0.5 border font-mono-code font-bold ${
                  selectedGrade === '7'
                    ? 'bg-white text-[#107c41] border-white'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                LAB EXCEL & ANALISIS DATA
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchGrade('8')}
              className={`flex-1 sm:flex-initial px-5 py-3 font-mono-code text-sm font-bold border-2 transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                selectedGrade === '8'
                  ? 'bg-[#2e59e6] text-white border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
              }`}
            >
              <Code2 className="h-4 w-4 shrink-0" />
              <span>MATERI KELAS 8</span>
              <span
                className={`text-[10px] px-2 py-0.5 border font-mono-code font-bold ${
                  selectedGrade === '8'
                    ? 'bg-white text-[#2e59e6] border-white'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}
              >
                KODING, AI & JARINGAN
              </span>
            </button>
          </div>

          <div className="font-mono-code text-[11px] text-slate-500 flex items-center gap-1.5 self-end sm:self-center">
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
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setKelas7SubTab('excel')}
                className={`px-3.5 py-2 font-mono-code text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                  kelas7SubTab === 'excel'
                    ? 'bg-[#107c41] text-white border-[#107c41] shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>LABORATORIUM EXCEL (PRAKTIK & TUGAS)</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-400 text-amber-950 font-black">
                  UTAMA
                </span>
              </button>

              <button
                type="button"
                onClick={() => setKelas7SubTab('guide')}
                className={`px-3.5 py-2 font-mono-code text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                  kelas7SubTab === 'guide'
                    ? 'bg-[#2e59e6] text-white border-[#2e59e6] shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>PANDUAN LENGKAP RUMUS & FUNGSI</span>
              </button>

              <button
                type="button"
                onClick={() => setKelas7SubTab('modul')}
                className={`px-3.5 py-2 font-mono-code text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                  kelas7SubTab === 'modul'
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
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
              <ExcelFormulaGuideView onOpenPracticeSheet={() => setKelas7SubTab('excel')} />
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
      {/* SECTION B: KELAS 8 CONTENT (KODING, AI & JARINGAN)        */}
      {/* ========================================================= */}
      {selectedGrade === '8' && (
        <div className="space-y-4">
          {/* Kelas 8 Module Filter Bar */}
          <div className="bg-white border-2 border-[#1a1a1a] p-3 shadow-[2px_2px_0px_#1a1a1a] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 font-mono-code text-xs">
              <span className="font-bold text-slate-700 mr-1">TOPIK KELAS 8:</span>
              <button
                type="button"
                onClick={() => setKelas8Module('semua')}
                className={`px-3 py-1 font-bold border transition-all cursor-pointer ${
                  kelas8Module === 'semua'
                    ? 'bg-[#2e59e6] text-white border-[#2e59e6]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                Semua Modul
              </button>
              <button
                type="button"
                onClick={() => setKelas8Module('koding')}
                className={`px-3 py-1 font-bold border transition-all cursor-pointer ${
                  kelas8Module === 'koding'
                    ? 'bg-[#2e59e6] text-white border-[#2e59e6]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                Koding & Algoritma
              </button>
              <button
                type="button"
                onClick={() => setKelas8Module('ai')}
                className={`px-3 py-1 font-bold border transition-all cursor-pointer ${
                  kelas8Module === 'ai'
                    ? 'bg-[#2e59e6] text-white border-[#2e59e6]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                Kecerdasan Artifisial (AI)
              </button>
              <button
                type="button"
                onClick={() => setKelas8Module('jaringan')}
                className={`px-3 py-1 font-bold border transition-all cursor-pointer ${
                  kelas8Module === 'jaringan'
                    ? 'bg-[#2e59e6] text-white border-[#2e59e6]'
                    : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
                }`}
              >
                Jaringan & Komunikasi
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateKuis && (
                <button
                  type="button"
                  onClick={onNavigateKuis}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono-code text-xs font-bold transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a]"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Kuis Interaktif Kelas 8</span>
                </button>
              )}
            </div>
          </div>

          {/* Module Cards Grid for Kelas 8 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Modul 1: Algoritma & Pemrograman */}
            {(kelas8Module === 'semua' || kelas8Module === 'koding') && (
              <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[4px_4px_0px_#1a1a1a] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-400 font-mono-code text-[10px] font-bold">
                      MODUL AP • PEMROGRAMAN
                    </span>
                    <Terminal className="h-4 w-4 text-[#2e59e6]" />
                  </div>
                  <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a]">
                    Algoritma Pemrograman & Koding Web
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Pengenalan konsep fundamental koding: variabel, tipe data, struktur percabangan (if-else), perulangan (loops), fungsi/prosedur, serta pembuatan halaman web responsif.
                  </p>

                  <div className="mt-3 p-2.5 bg-[#1a1a1a] text-emerald-400 font-mono-code text-[11px] border border-[#1a1a1a]">
                    <div className="text-slate-400">// Contoh Struktur Logika Koding:</div>
                    <div className="text-blue-300">if (nilai &gt;= 75) &#123;</div>
                    <div className="pl-3 text-white">status = "TUNTAS";</div>
                    <div className="text-blue-300">&#125; else &#123;</div>
                    <div className="pl-3 text-amber-300">status = "REMEDIAL";</div>
                    <div className="text-blue-300">&#125;</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono-code text-xs">
                  <span className="text-blue-600 font-bold">Praktik Koding</span>
                  {onNavigateKuis && (
                    <button
                      type="button"
                      onClick={onNavigateKuis}
                      className="text-[#2e59e6] font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Uji Kode di Kuis</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Modul 2: Berpikir Komputasional Lanjutan */}
            {(kelas8Module === 'semua' || kelas8Module === 'koding') && (
              <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[4px_4px_0px_#1a1a1a] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-400 font-mono-code text-[10px] font-bold">
                      MODUL BK • TINGKAT LANJUT
                    </span>
                    <Binary className="h-4 w-4 text-purple-700" />
                  </div>
                  <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a]">
                    Sistem Bilangan & Struktur Data
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Konversi bilangan desimal, biner (basis 2), dan oktal/heksadesimal. Struktur data antrean (Queue), tumpukan (Stack), graf, serta algoritma pencarian linear & binary search.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono-code text-slate-500 space-y-1">
                    <div>• Konversi Biner: 1010₂ = 10₁₀</div>
                    <div>• Konsep Stack (LIFO) vs Queue (FIFO)</div>
                    <div>• Optimasi pencarian data biner</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono-code text-xs">
                  <span className="text-purple-700 font-bold">✓ Teori & Latihan</span>
                  <span className="text-slate-400">Kelas 8 SMP</span>
                </div>
              </div>
            )}

            {/* Modul 3: Jaringan Komputer & Internet */}
            {(kelas8Module === 'semua' || kelas8Module === 'jaringan') && (
              <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[4px_4px_0px_#1a1a1a] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 font-mono-code text-[10px] font-bold">
                      MODUL JKI • NETWORKING
                    </span>
                    <Globe className="h-4 w-4 text-emerald-700" />
                  </div>
                  <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a]">
                    Jaringan Komputer & Komunikasi Data
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Cara kerja transmisi paket data melalui protokol TCP/IP, pengalamatan IP Address (IPv4 & IPv6), Domain Name System (DNS), sertifikat SSL/TLS, serta mitigasi ancaman siber.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono-code text-slate-500 space-y-1">
                    <div>• Model lapisan jaringan (OSI 7 Layers)</div>
                    <div>• Cara kerja DNS menerjemahkan nama domain</div>
                    <div>• Enkripsi HTTPS & tanda gembok aman</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono-code text-xs">
                  <span className="text-emerald-700 font-bold">✓ Terverifikasi</span>
                  <span className="text-slate-400">Kelas 8 SMP</span>
                </div>
              </div>
            )}

            {/* Modul 4: Kecerdasan Artifisial (AI) & Machine Learning */}
            {(kelas8Module === 'semua' || kelas8Module === 'ai') && (
              <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[4px_4px_0px_#1a1a1a] flex flex-col justify-between border-l-4 border-l-[#2e59e6]">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-[#2e59e6] text-white font-mono-code text-[10px] font-bold">
                      MODUL KKA • KECERDASAN ARTIFISIAL
                    </span>
                    <Bot className="h-4 w-4 text-[#2e59e6]" />
                  </div>
                  <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a]">
                    Kecerdasan Artifisial & Machine Learning
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Mengenal bagaimana komputer belajar dari data: Supervised Learning, Unsupervised Learning, Computer Vision, pemrosesan bahasa alami (NLP), serta etika penggunaan Generative AI.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono-code text-slate-500 space-y-1">
                    <div>• Pelatihan data & pengenalan pola gambar</div>
                    <div>• Etika AI & bias dalam model algoritma</div>
                    <div>• Prompt Engineering yang efektif & etis</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono-code text-xs">
                  <span className="text-[#2e59e6] font-bold">AI & KKA 2</span>
                  <span className="text-slate-400">Kelas 8 SMP</span>
                </div>
              </div>
            )}

            {/* Modul 5: Proyek Koding & Portofolio Siswa */}
            {(kelas8Module === 'semua' || kelas8Module === 'koding') && (
              <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[4px_4px_0px_#1a1a1a] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400 font-mono-code text-[10px] font-bold">
                      PROYEK KKA 2 • PORTOFOLIO
                    </span>
                    <Flame className="h-4 w-4 text-amber-700" />
                  </div>
                  <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a]">
                    Pembuatan Portofolio Web Siswa
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Panduan praktis perancangan web portofolio siswa: menyusun struktur HTML, styling CSS, penautan link video karya, dan integrasi pengumpulan tugas ke Google Spreadsheet.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono-code text-slate-500 space-y-1">
                    <div>• Struktur halaman web semantik</div>
                    <div>• Hosting gratis & deployment web</div>
                    <div>• Publikasi link karya ke showcase</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono-code text-xs">
                  <button
                    type="button"
                    onClick={onNavigateHome}
                    className="text-[#2e59e6] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Lihat Contoh di Showcase</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Modul 6: Analisis Data Lanjutan */}
            {(kelas8Module === 'semua' || kelas8Module === 'ai') && (
              <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[4px_4px_0px_#1a1a1a] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-900 border border-slate-400 font-mono-code text-[10px] font-bold">
                      MODUL AD • ADVANCED
                    </span>
                    <Calculator className="h-4 w-4 text-slate-700" />
                  </div>
                  <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a]">
                    Analisis Data & Visualisasi Diagram
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Pengolahan dataset besar, pembersihan data hilang (missing values), conditional formatting lanjutan, dan pembuatan grafik visualisasi data yang informatif.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono-code text-slate-500 space-y-1">
                    <div>• Pemilihan jenis grafik (Bar, Pie, Line, Scatter)</div>
                    <div>• Korelasi dan tren pergerakan data</div>
                    <div>• Penyusunan laporan analitik sederhana</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono-code text-xs">
                  <button
                    type="button"
                    onClick={() => handleSwitchGrade('7')}
                    className="text-[#107c41] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Praktik Rumus di Lab Excel</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
