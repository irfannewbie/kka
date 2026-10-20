import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  BookOpen,
  Compass,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles,
  Search,
  Layers,
  Terminal,
  Puzzle,
  Play,
  Check,
} from 'lucide-react';
import { MATERI_KELAS_8_SEMESTER_1, BabKelas8KKA } from '../../data/materiKelas8Semester1';

interface Kelas8KkaSemester1ViewProps {
  onOpenStudio?: () => void;
  onOpenQuiz?: () => void;
}

const STORAGE_REFLEKSI_KEY = 'materi_k8kka_refleksi_progress_v1';

/** Ikon per bab untuk tombol filter. */
const BAB_ICONS: Record<string, React.ReactNode> = {
  'kka-bab1': <Compass className="h-3.5 w-3.5" />,
  'kka-bab2': <Terminal className="h-3.5 w-3.5" />,
  'kka-bab3': <BrainCircuit className="h-3.5 w-3.5" />,
};

export const Kelas8KkaSemester1View: React.FC<Kelas8KkaSemester1ViewProps> = ({
  onOpenStudio,
  onOpenQuiz,
}) => {
  // Selected Bab filter ('semua' | 'kka-bab1' | 'kka-bab2' | 'kka-bab3')
  const [activeBabFilter, setActiveBabFilter] = useState<string>('semua');

  // Search keyword inside materials
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Expanded sub-topics (Record of itemId -> boolean): default buka sub-bab A di tiap bab
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(() => {
    return {
      'kka-b1-a': true,
      'kka-b1-b': false,
      'kka-b1-c': false,
      'kka-b1-d': false,
      'kka-b1-e': false,
      'kka-b1-f': false,
      'kka-b1-g': false,
      'kka-b1-h': false,
      'kka-b2-a': true,
      'kka-b2-b': false,
      'kka-b2-c': false,
      'kka-b2-d': false,
      'kka-b2-e': false,
      'kka-b2-f': false,
      'kka-b2-g': false,
      'kka-b2-h': false,
      'kka-b3-a': true,
      'kka-b3-b': false,
      'kka-b3-c': false,
      'kka-b3-d': false,
      'kka-b3-e': false,
      'kka-b3-f': false,
      'kka-b3-g': false,
      'kka-b3-h': false,
    };
  });

  // Track checked self-reflection items
  const [checkedRefleksi, setCheckedRefleksi] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_REFLEKSI_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save checked reflection items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_REFLEKSI_KEY, JSON.stringify(checkedRefleksi));
    } catch {
      // ignore
    }
  }, [checkedRefleksi]);

  const toggleTopic = (id: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleRefleksi = (id: string) => {
    setCheckedRefleksi((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAllInBab = (bab: BabKelas8KKA, expand: boolean) => {
    setExpandedTopics((prev) => {
      const updated = { ...prev };
      bab.materiPokok.forEach((item) => {
        updated[item.id] = expand;
      });
      return updated;
    });
  };

  // Filter chapters based on activeBabFilter
  const displayedBabs = MATERI_KELAS_8_SEMESTER_1.filter((bab) => {
    if (activeBabFilter === 'semua') return true;
    return bab.id === activeBabFilter;
  });

  // Calculate overall self-reflection completion progress
  const totalRefleksiItems = MATERI_KELAS_8_SEMESTER_1.reduce(
    (acc, bab) => acc + bab.refleksiDiri.length,
    0
  );
  const completedRefleksiItems = Object.values(checkedRefleksi).filter(Boolean).length;
  const progressPercent =
    totalRefleksiItems > 0 ? Math.round((completedRefleksiItems / totalRefleksiItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* HERO BANNER & SEMESTER 1 CURRICULUM OVERVIEW              */}
      {/* ========================================================= */}
      <div className="bg-white border-2 border-[#1a1a1a] p-4 sm:p-6 shadow-[4px_4px_0px_#1a1a1a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#7c3aed] text-white font-mono-code text-[11px] font-bold border border-[#1a1a1a]">
                KURIKULUM MERDEKA
              </span>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-950 font-mono-code text-[11px] font-bold border border-amber-400">
                KODING &amp; KECERDASAN ARTIFISIAL KELAS 8 &bull; SEMESTER 1
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono-code text-[10px] border border-slate-300">
                3 BAB UTAMA
              </span>
            </div>
            <h1 className="font-mono-code text-xl sm:text-2xl font-black text-[#1a1a1a] tracking-tight">
              Materi Koding &amp; Kecerdasan Artifisial Kelas 8 (Semester 1)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Panduan belajar komprehensif memuat <strong>Bab 1 (Algoritma)</strong>,{' '}
              <strong>Bab 2 (Pemrograman)</strong>, serta{' '}
              <strong>Bab 3 (Pengenalan Perangkat KA Sederhana)</strong>. Setiap bab dilengkapi
              Tujuan Pembelajaran, Peta Konsep Materi, Apersepsi, Materi Pokok, Rangkuman, dan
              Refleksi Diri.
            </p>
          </div>

          {/* Quick Stats & Progress Badge */}
          <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3.5 font-mono-code shrink-0 shadow-[2px_2px_0px_#1a1a1a] min-w-[220px]">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
              <span>Progres Refleksi Diri:</span>
              <span className="text-[#7c3aed] font-black">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 mt-1.5 border border-[#1a1a1a] overflow-hidden">
              <div
                className="bg-[#7c3aed] h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-slate-600 mt-1.5 flex items-center justify-between">
              <span>
                {completedRefleksiItems} dari {totalRefleksiItems} target tercapai
              </span>
              {progressPercent === 100 && (
                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" /> Tuntas!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Shortcut Toolbar for Practical Tools */}
        <div className="mt-4 pt-4 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono-code font-bold text-slate-600 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Praktik &amp; Latihan:</span>
            </span>
            <button
              type="button"
              onClick={onOpenStudio}
              className="px-3 py-1 bg-[#7c3aed] hover:bg-violet-800 text-white font-mono-code text-xs font-bold transition-all border border-[#1a1a1a] flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#1a1a1a]"
            >
              <Puzzle className="h-3.5 w-3.5" />
              <span>Studio Koding (Blockly &amp; Scratch) &rarr;</span>
            </button>
            {onOpenQuiz && (
              <button
                type="button"
                onClick={onOpenQuiz}
                className="px-3 py-1 bg-[#FAF8F5] hover:bg-slate-200 text-[#1a1a1a] font-mono-code text-xs font-bold transition-all border border-[#1a1a1a] flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                <span>Buka Kuis &rarr;</span>
              </button>
            )}
          </div>

          {/* Search within modules */}
          <div className="relative w-full sm:w-auto min-w-[200px]">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik materi..."
              className="w-full bg-[#FAF8F5] border border-slate-300 pl-8 pr-3 py-1 text-xs font-mono-code focus:outline-none focus:border-[#7c3aed] focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BAB FILTER TABS (SEMUA / BAB 1 / BAB 2 / BAB 3)            */}
      {/* ========================================================= */}
      <div className="bg-white border-2 border-[#1a1a1a] p-2 shadow-[2px_2px_0px_#1a1a1a]">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveBabFilter('semua')}
            className={`w-full sm:w-auto px-4 py-2 font-mono-code text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeBabFilter === 'semua'
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>SEMUA BAB (1 - 3)</span>
          </button>

          {MATERI_KELAS_8_SEMESTER_1.map((bab) => (
            <button
              key={bab.id}
              type="button"
              onClick={() => setActiveBabFilter(bab.id)}
              style={
                activeBabFilter === bab.id
                  ? { backgroundColor: bab.themeColor.primary, borderColor: bab.themeColor.primary }
                  : undefined
              }
              className={`w-full sm:w-auto px-3.5 py-2 font-mono-code text-xs font-bold border transition-all cursor-pointer flex items-center justify-between sm:justify-start gap-2 ${
                activeBabFilter === bab.id
                  ? 'text-white shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {BAB_ICONS[bab.id]}
                <span>{bab.filterLabel}</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.2 bg-white/20 text-current rounded-xs font-bold">
                {bab.filterAbbrev}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* CHAPTER CONTENT RENDERING                                 */}
      {/* ========================================================= */}
      <div className="space-y-8">
        {displayedBabs.map((bab) => {
          // Filter topics within Bab if search query is active
          const filteredTopics = bab.materiPokok.filter((item) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
              item.title.toLowerCase().includes(q) ||
              item.subtitle.toLowerCase().includes(q) ||
              item.content.some((c) => c.toLowerCase().includes(q)) ||
              item.keyPoints?.some((k) => k.toLowerCase().includes(q))
            );
          });

          return (
            <section
              key={bab.id}
              id={bab.id}
              className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] overflow-hidden"
            >
              {/* Chapter Header Banner */}
              <div
                className="p-4 sm:p-6 text-white border-b-2 border-[#1a1a1a]"
                style={{ backgroundColor: bab.themeColor.primary }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 bg-white text-[#1a1a1a] font-mono-code text-[10px] font-black uppercase tracking-wider border border-[#1a1a1a]">
                        {bab.badge}
                      </span>
                      <span className="px-2 py-0.5 bg-black/30 text-white font-mono-code text-[10px] font-bold">
                        Semester {bab.semester}
                      </span>
                      <span className="px-2 py-0.5 bg-black/30 text-white font-mono-code text-[10px]">
                        {bab.materiPokok.length} Sub-Materi Pokok
                      </span>
                    </div>
                    <h2 className="font-mono-code text-xl sm:text-2xl font-black tracking-tight">
                      Bab {bab.babNumber}: {bab.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/90 mt-1 font-mono-code">
                      {bab.subtitle}
                    </p>
                  </div>

                  {/* Expand/Collapse All Subtopics */}
                  <div className="flex items-center gap-2 font-mono-code text-xs shrink-0 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => handleExpandAllInBab(bab, true)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white border border-white/40 transition-all cursor-pointer"
                    >
                      Buka Semua Sub-Bab
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExpandAllInBab(bab, false)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white border border-white/40 transition-all cursor-pointer"
                    >
                      Tutup Semua
                    </button>
                  </div>
                </div>

                {/* Sub-navigation inside chapter */}
                <div className="mt-4 pt-3 border-t border-white/30 flex flex-wrap items-center gap-2 text-xs font-mono-code">
                  <span className="text-white/80 text-[11px] font-bold">Navigasi Bab:</span>
                  <a
                    href={`#${bab.id}-tujuan`}
                    className="px-2 py-0.5 bg-white/15 hover:bg-white/30 rounded-xs transition-colors"
                  >
                    Tujuan Pembelajaran
                  </a>
                  <a
                    href={`#${bab.id}-peta`}
                    className="px-2 py-0.5 bg-white/15 hover:bg-white/30 rounded-xs transition-colors"
                  >
                    Peta Konsep
                  </a>
                  <a
                    href={`#${bab.id}-apersepsi`}
                    className="px-2 py-0.5 bg-white/15 hover:bg-white/30 rounded-xs transition-colors"
                  >
                    Apersepsi
                  </a>
                  <a
                    href={`#${bab.id}-materi`}
                    className="px-2 py-0.5 bg-white/25 hover:bg-white/40 rounded-xs font-bold transition-colors"
                  >
                    Materi Pokok ({bab.materiPokok.length})
                  </a>
                  <a
                    href={`#${bab.id}-rangkuman`}
                    className="px-2 py-0.5 bg-white/15 hover:bg-white/30 rounded-xs transition-colors"
                  >
                    Rangkuman
                  </a>
                  <a
                    href={`#${bab.id}-refleksi`}
                    className="px-2 py-0.5 bg-white/15 hover:bg-white/30 rounded-xs transition-colors"
                  >
                    Refleksi Diri
                  </a>
                </div>
              </div>

              {/* Main Chapter Body */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* --------------------------------------------------- */}
                {/* 1. TUJUAN PEMBELAJARAN                              */}
                {/* --------------------------------------------------- */}
                <div
                  id={`${bab.id}-tujuan`}
                  className="bg-[#FAF8F5] border border-[#1a1a1a] p-4 scroll-mt-20"
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 bg-[#1a1a1a] text-white flex items-center justify-center font-mono-code font-bold text-xs">
                      1
                    </div>
                    <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">
                      Tujuan Pembelajaran (Learning Objectives)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 font-mono-code">
                    Setelah mempelajari bab ini secara tuntas, peserta didik diharapkan mampu:
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
                    {bab.tujuanPembelajaran.map((tujuan, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                        <CheckCircle2 className="h-4 w-4 text-[#107c41] shrink-0 mt-0.5" />
                        <span>{tujuan}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* --------------------------------------------------- */}
                {/* 2. PETA KONSEP MATERI                               */}
                {/* --------------------------------------------------- */}
                <div
                  id={`${bab.id}-peta`}
                  className="bg-white border border-[#1a1a1a] p-4 scroll-mt-20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-[#1a1a1a] text-white flex items-center justify-center font-mono-code font-bold text-xs">
                      2
                    </div>
                    <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">
                      Peta Konsep Materi
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-4 font-mono-code">
                    {bab.petaKonsep.description}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {bab.petaKonsep.nodes.map((node, nIdx) => (
                      <div
                        key={nIdx}
                        className="bg-[#FAF8F5] border-2 border-dashed border-[#1a1a1a] p-3 flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-mono-code text-xs font-bold text-[#1a1a1a] border-b border-slate-300 pb-1.5 mb-2">
                            {node.category}
                          </div>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {node.items.map((item, iIdx) => (
                              <li
                                key={iIdx}
                                className="flex items-center gap-1.5 font-mono-code text-[11px]"
                              >
                                <span className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full"></span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-3 pt-1 border-t border-slate-200 text-[10px] font-mono-code text-slate-400 text-right">
                          Komponen {nIdx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --------------------------------------------------- */}
                {/* 3. APERSEPSI (PEMANTIK PEMBELAJARAN)                 */}
                {/* --------------------------------------------------- */}
                <div
                  id={`${bab.id}-apersepsi`}
                  className="bg-sky-50/70 border border-sky-300 p-4 scroll-mt-20"
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 bg-sky-600 text-white flex items-center justify-center font-mono-code font-bold text-xs">
                      3
                    </div>
                    <h3 className="font-mono-code text-sm font-bold text-sky-950 uppercase tracking-wide flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4 text-sky-600" />
                      <span>Apersepsi (Pemantik Pembelajaran)</span>
                    </h3>
                  </div>

                  {/* Cerita pemantik yang menghubungkan materi dengan kehidupan nyata */}
                  <div className="bg-white border border-sky-200 p-3.5 space-y-2 text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {bab.apersepsi.story.map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>

                  {/* Pertanyaan pemantik untuk memancing rasa ingin tahu */}
                  <div className="mt-3.5 font-mono-code text-xs font-bold text-sky-900 uppercase tracking-wider">
                    Pertanyaan Pemantik:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    {bab.apersepsi.questions.map((tanya, tIdx) => (
                      <div
                        key={tIdx}
                        className="bg-white border border-sky-300 p-3 shadow-[2px_2px_0px_#0284c7] flex flex-col justify-between"
                      >
                        <p className="text-xs text-slate-800 italic leading-relaxed">
                          &ldquo;{tanya}&rdquo;
                        </p>
                        <div className="mt-2 pt-2 border-t border-sky-100 font-mono-code text-[10px] text-sky-800 font-bold">
                          #Apersepsi {tIdx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --------------------------------------------------- */}
                {/* 4. MATERI POKOK (SUB-BAB A, B, C...)               */}
                {/* --------------------------------------------------- */}
                <div id={`${bab.id}-materi`} className="space-y-4 scroll-mt-20 pt-2">
                  <div className="flex items-center justify-between border-b-2 border-[#1a1a1a] pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#1a1a1a] text-white flex items-center justify-center font-mono-code font-bold text-xs">
                        4
                      </div>
                      <h3 className="font-mono-code text-base font-bold text-[#1a1a1a] uppercase tracking-wide">
                        Materi Pokok Pembelajaran
                      </h3>
                    </div>
                    <span className="font-mono-code text-xs text-slate-500">
                      Menampilkan {filteredTopics.length} dari {bab.materiPokok.length} Sub-Materi
                    </span>
                  </div>

                  {filteredTopics.length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF8F5] border border-dashed border-slate-300 font-mono-code text-xs text-slate-500">
                      Tidak ditemukan sub-materi yang cocok dengan kata kunci &ldquo;{searchQuery}
                      &rdquo;.
                    </div>
                  ) : (
                    filteredTopics.map((item) => {
                      const isExpanded = expandedTopics[item.id] ?? true;

                      return (
                        <div
                          key={item.id}
                          className="bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] transition-all"
                        >
                          {/* Subtopic Header Accordion Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleTopic(item.id)}
                            className="w-full p-3.5 sm:p-4 text-left flex items-start justify-between gap-3 bg-[#FAF8F5] hover:bg-slate-100 transition-colors cursor-pointer border-b border-slate-200"
                          >
                            <div className="flex items-start gap-3">
                              <span className="w-7 h-7 bg-[#1a1a1a] text-white font-mono-code font-bold text-sm flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#1a1a1a]">
                                {item.letter}
                              </span>
                              <div>
                                <h4 className="font-mono-code text-sm sm:text-base font-bold text-[#1a1a1a] leading-tight">
                                  {item.letter}. {item.title}
                                </h4>
                                <p className="font-mono-code text-xs text-slate-600 mt-0.5">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.actionButton && (
                                <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-100 text-[#107c41] font-mono-code text-[10px] font-bold border border-emerald-300">
                                  Praktik Tersedia
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              )}
                            </div>
                          </button>

                          {/* Subtopic Content (Collapsed or Expanded) */}
                          {isExpanded && (
                            <div className="p-4 sm:p-6 space-y-4">
                              {/* Narrative Paragraphs */}
                              <div className="space-y-2 text-xs sm:text-sm text-slate-800 leading-relaxed">
                                {item.content.map((p, pIdx) => (
                                  <p key={pIdx}>{p}</p>
                                ))}
                              </div>

                              {/* Key Points Bullet List */}
                              {item.keyPoints && item.keyPoints.length > 0 && (
                                <div className="bg-[#FAF8F5] border-l-4 border-[#1a1a1a] p-3.5 space-y-1.5">
                                  <div className="font-mono-code text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-1">
                                    Poin Kunci &amp; Konsep Inti:
                                  </div>
                                  <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                                    {item.keyPoints.map((kp, kpIdx) => (
                                      <li key={kpIdx} className="leading-relaxed">
                                        • {kp}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Data Table if applicable */}
                              {item.table && (
                                <div className="overflow-x-auto border border-[#1a1a1a]">
                                  <table className="w-full text-xs font-mono-code border-collapse">
                                    <thead>
                                      <tr className="bg-[#1a1a1a] text-white">
                                        {item.table.headers.map((h, hIdx) => (
                                          <th
                                            key={hIdx}
                                            className="p-2.5 text-left border-r border-white/20 last:border-r-0 font-bold"
                                          >
                                            {h}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.table.rows.map((row, rIdx) => (
                                        <tr
                                          key={rIdx}
                                          className={`border-b border-slate-200 last:border-b-0 ${
                                            rIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]'
                                          }`}
                                        >
                                          {row.map((col, cIdx) => (
                                            <td
                                              key={cIdx}
                                              className="p-2.5 border-r border-slate-200 last:border-r-0"
                                            >
                                              {col}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Case Examples if applicable */}
                              {item.examples && item.examples.length > 0 && (
                                <div className="space-y-2">
                                  {item.examples.map((ex, exIdx) => (
                                    <div
                                      key={exIdx}
                                      className="bg-blue-50/60 border border-blue-200 p-3"
                                    >
                                      <div className="font-mono-code text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                        <BookOpen className="h-3.5 w-3.5" />
                                        <span>{ex.title}</span>
                                      </div>
                                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                                        {ex.desc}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Practical Action Button for Studio Koding */}
                              {item.actionButton && (
                                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-violet-50/70 border border-violet-300 p-3">
                                  <div className="flex items-center gap-2">
                                    <Puzzle className="h-4 w-4 text-violet-700" />
                                    <span className="text-xs font-mono-code font-bold text-violet-950">
                                      Ingin langsung mempraktikkan materi ini? Studio Koding
                                      (Blockly &amp; Scratch) tersedia pada materi Informatika Kelas
                                      8.
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={onOpenStudio}
                                    className="px-3 py-1.5 bg-[#7c3aed] hover:bg-violet-800 text-white font-mono-code text-xs font-bold transition-all border border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Play className="h-3 w-3" />
                                    <span>{item.actionButton.label} &rarr;</span>
                                  </button>
                                </div>
                              )}

                              {/* Pro-Tip Box */}
                              {item.tip && (
                                <div className="bg-amber-50 border border-amber-200 p-2.5 flex items-start gap-2 text-xs text-amber-900">
                                  <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                  <span>{item.tip}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* --------------------------------------------------- */}
                {/* 5. RANGKUMAN MATERI                                 */}
                {/* --------------------------------------------------- */}
                <div
                  id={`${bab.id}-rangkuman`}
                  className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-4 sm:p-5 scroll-mt-20"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-[#1a1a1a] text-white flex items-center justify-center font-mono-code font-bold text-xs">
                      5
                    </div>
                    <h3 className="font-mono-code text-sm sm:text-base font-bold text-[#1a1a1a] uppercase tracking-wide">
                      Rangkuman Materi Bab {bab.babNumber}
                    </h3>
                  </div>
                  <div className="space-y-2 text-xs sm:text-sm text-slate-800">
                    {bab.rangkumanMateri.map((rangkum, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full mt-2 shrink-0"></span>
                        <p className="leading-relaxed">{rangkum}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --------------------------------------------------- */}
                {/* 6. REFLEKSI DIRI INTERAKTIF                         */}
                {/* --------------------------------------------------- */}
                <div
                  id={`${bab.id}-refleksi`}
                  className="bg-emerald-50/50 border-2 border-[#107c41] p-4 sm:p-5 scroll-mt-20 shadow-[3px_3px_0px_#107c41]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#107c41] text-white flex items-center justify-center font-mono-code font-bold text-xs">
                        6
                      </div>
                      <h3 className="font-mono-code text-sm sm:text-base font-bold text-emerald-950 uppercase tracking-wide">
                        Refleksi Diri (Self-Assessment)
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono-code text-emerald-800">
                      Beri tanda centang pada konsep yang telah kamu kuasai:
                    </span>
                  </div>

                  <div className="space-y-2">
                    {bab.refleksiDiri.map((item) => {
                      const isChecked = checkedRefleksi[item.id] ?? false;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleRefleksi(item.id)}
                          className={`w-full p-2.5 sm:p-3 text-left border transition-all flex items-center gap-3 cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-100/80 border-emerald-500 text-emerald-950 font-medium'
                              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 border flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? 'bg-[#107c41] border-[#107c41] text-white'
                                : 'bg-white border-slate-400'
                            }`}
                          >
                            {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs sm:text-sm leading-relaxed">
                            {item.statement}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-code text-emerald-900">
                    <span>
                      Tercapai:{' '}
                      <strong>
                        {bab.refleksiDiri.filter((r) => checkedRefleksi[r.id]).length} /{' '}
                        {bab.refleksiDiri.length}
                      </strong>{' '}
                      indikator
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Progres otomatis tersimpan di peramban ini
                    </span>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
