import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Play,
  Copy,
  Check,
  Calculator,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';
import { ExcelWorkbookData } from '../../types/excelLab';
import { DEFAULT_FORMULA_GUIDES } from '../../services/excelLabStore';

interface ExcelFormulaGuideViewProps {
  onTryFormulaInPlayground: (sampleWb: ExcelWorkbookData) => void;
}

export const ExcelFormulaGuideView: React.FC<ExcelFormulaGuideViewProps> = ({
  onTryFormulaInPlayground,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(false);

  const categories = [
    'Semua',
    'Aritmatika & Dasar',
    'Statistik',
    'Logika & Kondisional',
    'Waktu & Tanggal',
    'Teks & Karakter',
    'Pencarian (Lookup)',
  ];

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: DEFAULT_FORMULA_GUIDES.length };
    DEFAULT_FORMULA_GUIDES.forEach((guide) => {
      counts[guide.category] = (counts[guide.category] || 0) + 1;
    });
    return counts;
  }, []);

  const filteredGuides = useMemo(() => {
    return DEFAULT_FORMULA_GUIDES.filter((item) => {
      const matchesCat =
        selectedCategory === 'Semua' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.schoolUseCase.toLowerCase().includes(q) ||
        item.syntax.toLowerCase().includes(q);

      return matchesCat && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Aritmatika & Dasar':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Statistik':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Logika & Kondisional':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'Waktu & Tanggal':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Teks & Karakter':
        return 'bg-pink-100 text-pink-900 border-pink-300';
      case 'Pencarian (Lookup)':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] p-5 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono-code text-xs text-[#107c41] font-bold uppercase mb-1">
              <BookOpen className="h-4 w-4" />
              <span>MATERI LENGKAP & ENSIKLOPEDIA FORMULA SPREADSHEET</span>
            </div>
            <h1 className="font-serif-display italic font-bold text-3xl sm:text-4xl text-[#1a1a1a]">
              Panduan Rumus & Fungsi Spreadsheet
            </h1>
            <p className="font-sans text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Panduan pengolahan data dasar terlengkap: Fungsi Dasar (SUM, COUNT, SUMIF, COUNTIF, Aritmatika, Date & Time, Teks), Statistik Dasar (AVERAGE, MEDIAN, MAX, MIN, LARGE, SMALL), Logika & Kondisional (IF, AND, OR, NOT, Perbandingan), serta Pencarian Data.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <div className="p-3 bg-emerald-50 border-2 border-[#107c41] font-mono-code text-xs space-y-1">
              <span className="font-bold text-[#107c41] block uppercase text-[10px]">Tips Interaktif:</span>
              <p className="text-slate-700 font-sans text-xs">
                Klik tombol <strong>"Coba di Spreadsheet"</strong> pada setiap kartu untuk memuat dataset simulasi langsung ke lembar kerja.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-[#1a1a1a] font-mono-code text-xs font-bold shadow-[2px_2px_0px_#1a1a1a] flex items-center justify-between gap-2 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-amber-700" />
                <span>Rangkuman Cepat Operator</span>
              </div>
              {showCheatSheet ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Cheat Sheet: Operator Aritmatika & Perbandingan */}
      {showCheatSheet && (
        <div className="bg-[#fffdf5] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
            <h2 className="font-mono-code font-bold text-sm text-[#1a1a1a] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>TABEL REFERENSI CEPAT: OPERATOR ARITMATIKA & PERBANDINGAN</span>
            </h2>
            <span className="text-[11px] font-mono-code text-slate-500">Awali selalu dengan tanda =</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-code">
            {/* Operator Aritmatika */}
            <div className="bg-white border border-slate-300 p-3 space-y-2">
              <span className="font-bold text-emerald-800 uppercase block border-b pb-1 text-[11px]">
                1. Operator Aritmatika (Matematika)
              </span>
              <ul className="space-y-1.5 text-slate-700 font-sans">
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">+</code> <strong>Penjumlahan</strong>: Contoh <code>=A2 + B2</code></li>
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">-</code> <strong>Pengurangan</strong>: Contoh <code>=B2 - C2</code></li>
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">*</code> <strong>Perkalian</strong> (tanda bintang): Contoh <code>=B2 * 10</code></li>
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">/</code> <strong>Pembagian</strong> (garis miring): Contoh <code>=C2 / 5</code></li>
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">^</code> <strong>Pemangkatan</strong> (caret): Contoh <code>=2 ^ 3</code> (hasil 8)</li>
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">%</code> <strong>Persentase</strong>: Contoh <code>=B2 * 10%</code></li>
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">( )</code> <strong>Kurung Prioritas</strong>: Mendahulukan hitungan, misal <code>=(A1+B1)*C1</code></li>
              </ul>
            </div>

            {/* Operator Perbandingan */}
            <div className="bg-white border border-slate-300 p-3 space-y-2">
              <span className="font-bold text-sky-800 uppercase block border-b pb-1 text-[11px]">
                2. Operator Perbandingan (Menghasilkan TRUE / FALSE)
              </span>
              <ul className="space-y-1.5 text-slate-700 font-sans">
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">=</code> <strong>Sama Dengan</strong>: Contoh <code>=A2 = 100</code></li>
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">&lt;&gt;</code> <strong>Tidak Sama Dengan</strong>: Contoh <code>=B2 &lt;&gt; "Lulus"</code></li>
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">&gt;</code> <strong>Lebih Besar Dari</strong>: Contoh <code>=B2 &gt; 80</code></li>
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">&lt;</code> <strong>Lebih Kecil Dari</strong>: Contoh <code>=B2 &lt; 75</code></li>
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">&gt;=</code> <strong>Lebih Besar atau Sama Dengan</strong>: Contoh <code>=B2 &gt;= 75</code></li>
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">&lt;=</code> <strong>Lebih Kecil atau Sama Dengan</strong>: Contoh <code>=B2 &lt;= 50</code></li>
                <li><code className="font-mono-code font-bold bg-slate-100 px-1.5 py-0.5 border">&amp;</code> <strong>Penggabung Teks</strong>: Contoh <code>=A2 &amp; " " &amp; B2</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-4 shadow-[4px_4px_0px_#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono-code text-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-slate-700 uppercase mr-1 flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" />
            <span>Kategori:</span>
          </span>
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#107c41] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari rumus (misal: SUM, IF, MID, YEAR)..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#1a1a1a] text-xs font-mono-code text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#107c41]"
          />
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs font-mono-code text-slate-600 px-1">
        <span>Menampilkan <strong>{filteredGuides.length}</strong> formula dalam kategori <strong>{selectedCategory}</strong></span>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-red-600 underline cursor-pointer"
          >
            Hapus filter pencarian
          </button>
        )}
      </div>

      {/* Formula Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredGuides.map((guide) => (
          <div
            key={guide.id}
            className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 flex flex-col justify-between space-y-4 font-mono-code hover:shadow-[5px_5px_0px_#1a1a1a] transition-all"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b-2 border-slate-200 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black text-[#107c41] tracking-wider">
                    ={guide.name}
                  </span>
                </div>
                <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${getCategoryColor(guide.category)}`}>
                  {guide.category}
                </span>
              </div>

              {/* Syntax Box */}
              <div className="mt-3 p-2.5 bg-[#f8fafc] border border-slate-300 rounded-xs flex items-center justify-between gap-2">
                <div className="overflow-x-auto">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                    Sintaks Rumus:
                  </span>
                  <code className="text-xs font-bold text-[#1e40af] select-all">
                    {guide.syntax}
                  </code>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(guide.id, guide.syntax)}
                  title="Salin sintaks"
                  className="p-1.5 hover:bg-slate-200 border border-slate-300 text-slate-600 shrink-0 cursor-pointer"
                >
                  {copiedId === guide.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Description */}
              <p className="font-sans text-xs text-slate-700 mt-2.5 leading-relaxed">
                {guide.description}
              </p>

              {/* Parameters Breakdown */}
              <div className="mt-3 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Penjelasan Bagian Rumus (Argumen):
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] font-sans text-slate-600">
                  {guide.parameters.map((p, pIdx) => (
                    <li key={pIdx}>
                      <strong className="font-mono-code text-[#107c41]">{p.name}</strong>: {p.desc}
                    </li>
                  ))}
                </ul>
              </div>

              {/* School Case Box */}
              <div className="mt-3 p-2.5 bg-emerald-50/70 border border-emerald-300 text-emerald-950 font-sans text-xs">
                <span className="font-bold text-[10px] font-mono-code uppercase block text-[#107c41] mb-0.5">
                  Contoh Kasus Nyata di Sekolah:
                </span>
                <span>{guide.schoolUseCase}</span>
              </div>
            </div>

            {/* Bottom Action: Try in Playground */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-[11px] text-slate-600 font-sans truncate">
                Contoh: <code className="bg-slate-100 px-1 py-0.5 border font-bold text-slate-800">{guide.exampleFormula}</code> → <strong>{guide.exampleOutput}</strong>
              </div>

              <button
                type="button"
                onClick={() => onTryFormulaInPlayground(guide.sampleWorkbook)}
                className="px-3.5 py-1.5 bg-[#107c41] hover:bg-emerald-700 text-white font-bold text-xs border border-[#1a1a1a] shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Coba di Spreadsheet</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
