import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  BookOpen,
  Code2,
  Binary,
  Layers,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Bot,
  BrainCircuit,
  Compass,
  Play,
  Puzzle,
  Scale,
  ShieldAlert,
  FolderTree,
  AlertTriangle,
} from 'lucide-react';
import { Kelas7Semester1View } from './materi/Kelas7Semester1View';
import { Kelas8KkaSemester1View } from './materi/Kelas8KkaSemester1View';

interface MateriViewProps {
  /**
   * Membuka Ruang Praktik (`/praktek`).
   * `tool` memilih alat (excel/studio/doc/presentation), `view` membuka sub-tab tertentu.
   */
  onNavigatePraktek?: (tool?: string, view?: string) => void;
}

export const MateriView: React.FC<MateriViewProps> = ({ onNavigatePraktek }) => {
  // Read grade from URL parameter if present (?grade=7 or ?grade=8)
  const [selectedGrade, setSelectedGrade] = useState<'7' | '8'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const g = params.get('grade') || params.get('kelas');
      if (g === '8' || g === 'kelas8') return '8';
    }
    return '7';
  });

  // Tautan lama (?tab=excel|lab|guide|rumus) diarahkan ke halaman /praktek.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'excel' || tab === 'lab' || tab === 'guide' || tab === 'rumus') {
      const view = tab === 'guide' || tab === 'rumus' ? '&view=guide' : '';
      window.location.replace(`/praktek?tool=excel${view}`);
    }
  }, []);

  // Selected Bab for Kelas 8 (Bab 1, Bab 2, Bab 3, Bab 4, or semua)
  const [kelas8Bab, setKelas8Bab] = useState<'semua' | 'bab1' | 'bab2' | 'bab3' | 'bab4'>('semua');

  // Mata pelajaran Kelas 8: 'kka' (Koding & Kecerdasan Artifisial — Semester 1, default) atau 'informatika' (4 bab + studio)
  const [kelas8Mapel, setKelas8Mapel] = useState<'kka' | 'informatika'>('kka');

  // Binary converter mini tool state for Bab 2 Berpikir Komputasional
  const [binInput, setBinInput] = useState<string>('42');

  // Handle grade change and update URL parameter
  const handleSwitchGrade = (grade: '7' | '8') => {
    setSelectedGrade(grade);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('grade', grade);
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

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
              Pusat materi pembelajaran resmi Informatika serta Koding dan Kecerdasan Artifisial
              (KKA) untuk Kelas 7 &amp; Kelas 8. Materi KKA Semester 1 tersedia lengkap, dan seluruh
              <strong> alat praktik</strong> — Laboratorium Excel, Studio Koding (Blockly &amp;
              Scratch), Dokumen, dan Presentasi — kini dipusatkan di
              halaman{' '}
              <strong>Ruang Praktik</strong>.
            </p>
            {onNavigatePraktek && (
              <button
                type="button"
                onClick={() => onNavigatePraktek()}
                className="mt-2.5 min-h-[40px] px-3 py-2 bg-[#107c41] hover:bg-emerald-700 text-white font-mono-code text-[11px] font-bold border border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>RUANG PRAKTIK: EXCEL • KODING • DOKUMEN • PRESENTASI</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
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
                <span className="sm:hidden">ANALISIS DATA</span>
                <span className="hidden sm:inline">ANALISIS DATA + PRAKTIK</span>
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
                <span className="sm:hidden">INFO + KKA</span>
                <span className="hidden sm:inline">INFORMATIKA (4 BAB) & KKA SEM 1 (BAB 1-3)</span>
              </span>
            </button>
          </div>

          <div className="font-mono-code text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 self-center sm:self-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Rute Aktif: /?grade={selectedGrade}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION A: KELAS 7 CONTENT (SEMESTER 1 BAB 1-3)            */}
      {/* Praktik Excel & panduan rumus kini di halaman /praktek     */}
      {/* ========================================================= */}
      {selectedGrade === '7' && (
        <Kelas7Semester1View
          onOpenExcelLab={() => onNavigatePraktek?.('excel')}
          onOpenFormulaGuide={() => onNavigatePraktek?.('excel', 'guide')}
        />
      )}

      {/* ========================================================= */}
      {/* SECTION B: KELAS 8 CONTENT — 2 MATA PELAJARAN:            */}
      {/*   (1) KODING & KECERDASAN ARTIFISIAL (SEM 1, BAB 1-3)     */}
      {/*   (2) INFORMATIKA (4 BAB + STUDIO KODING)                 */}
      {/* ========================================================= */}
      {selectedGrade === '8' && (
        <div className="space-y-6">
          {/* Mata Pelajaran Selector for Kelas 8 */}
          <div className="bg-white border-2 border-[#1a1a1a] p-2 shadow-[2px_2px_0px_#1a1a1a] flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-1.5">
            <button
              type="button"
              onClick={() => setKelas8Mapel('kka')}
              className={`w-full sm:w-auto px-3.5 py-2 font-mono-code text-xs font-bold border transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-2 ${
                kelas8Mapel === 'kka'
                  ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
              }`}
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>KODING & KECERDASAN ARTIFISIAL — SEM 1 (BAB 1-3)</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-amber-400 text-amber-950 rounded-xs font-black">
                DEFAULT
              </span>
            </button>
            <button
              type="button"
              onClick={() => setKelas8Mapel('informatika')}
              className={`w-full sm:w-auto px-3.5 py-2 font-mono-code text-xs font-bold border transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-2 ${
                kelas8Mapel === 'informatika'
                  ? 'bg-[#2e59e6] text-white border-[#2e59e6] shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>INFORMATIKA (4 BAB: AD, BK, AP, HAK DIGITAL)</span>
            </button>
          </div>

          {/* Mapel 1: Koding & Kecerdasan Artifisial — Semester 1 (Bab 1-3) */}
          {kelas8Mapel === 'kka' && (
            <Kelas8KkaSemester1View
              onOpenStudio={() => onNavigatePraktek?.('studio')}
            />
          )}

          {/* Mapel 2: Informatika (materi 4 bab + studio koding) */}
          {kelas8Mapel === 'informatika' && (
            <>
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
          </div>

          {/* =================================================================== */}
          {/* BAB 3: ALGORITMA DAN PEMROGRAMAN — PRAKTIK DI /PRAKTEK              */}
          {/* =================================================================== */}
          {(kelas8Bab === 'semua' || kelas8Bab === 'bab3') && (
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-[#1a1a1a]">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 font-mono-code text-[10px] font-bold uppercase mb-1">
                    <span className="px-2 py-0.5 bg-[#2e59e6] text-white">BAB 3 • AP</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400">
                      PRAKTIK DIPINDAH KE /PRAKTEK
                    </span>
                  </div>
                  <h2 className="font-mono-code text-lg sm:text-2xl font-black text-[#1a1a1a]">
                    Algoritma dan Pemrograman (AP)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                    Studio praktik koding (Google Blockly, Blockly Games, dan Scratch 3.0/PenguinMod)
                    kini punya halaman khusus bersama Laboratorium Excel, Dokumen,
                    dan Presentasi di <strong>Ruang Praktik</strong>.
                  </p>
                </div>
                <Puzzle className="hidden md:block h-8 w-8 text-[#2e59e6] shrink-0" />
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono-code text-xs">
                <div className="p-3 bg-[#FAF8F5] border border-[#1a1a1a]">
                  <div className="font-bold text-[#2e59e6] mb-1">1. GOOGLE BLOCKLY</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Blok &rarr; Python/JavaScript, latihan logika sekuensial, percabangan, dan
                    perulangan.
                  </p>
                </div>
                <div className="p-3 bg-[#FAF8F5] border border-[#1a1a1a]">
                  <div className="font-bold text-purple-700 mb-1">2. BLOCKLY GAMES</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Game labirin &amp; puzzle logika untuk memantapkan konsep algoritma.
                  </p>
                </div>
                <div className="p-3 bg-[#FAF8F5] border border-[#1a1a1a]">
                  <div className="font-bold text-amber-700 mb-1">3. SCRATCH 3.0</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Editor Scratch/PenguinMod untuk membuat animasi dan game karya siswa.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => onNavigatePraktek?.('studio')}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-[#2e59e6] hover:bg-blue-700 text-white font-mono-code text-xs font-bold border border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>BUKA STUDIO KODING DI /PRAKTEK &rarr;</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigatePraktek?.()}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-[#FAF8F5] hover:bg-slate-200 text-[#1a1a1a] font-mono-code text-xs font-bold border border-[#1a1a1a] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>SEMUA ALAT PRAKTIK (EXCEL • KODING • DOKUMEN • PRESENTASI)</span>
                </button>
              </div>

              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 font-mono-code text-[11px] text-emerald-950 leading-relaxed">
                <strong>Catatan:</strong> materi teori Bab 1&ndash;Bab 4 (Analisis Data, Berpikir
                Komputasional, Algoritma Pemrograman, dan Hak-Hak Digital) tetap lengkap di halaman
                ini. Hanya <em>alat praktik</em>-nya yang dipindahkan agar mudah diakses dari menu
                Ruang Praktik.
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
            </>
          )}
        </div>
      )}
    </div>
  );
};
