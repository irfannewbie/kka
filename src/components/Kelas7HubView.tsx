import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  LayoutGrid,
} from 'lucide-react';
import { Student } from '../types';
import { ExcelLabStudentWorkspace } from './excel/ExcelLabStudentWorkspace';
import { StudentCheckView } from './StudentCheckView';

interface Kelas7HubViewProps {
  students: Student[];
  spreadsheetId: string;
  spreadsheetUrl: string;
  initialSubTab?: 'excel' | 'nilai';
  onNavigateHome: () => void;
  onNavigateCek: () => void;
}

export const Kelas7HubView: React.FC<Kelas7HubViewProps> = ({
  students,
  spreadsheetId,
  spreadsheetUrl,
  initialSubTab = 'excel',
  onNavigateHome,
  onNavigateCek,
}) => {
  // Read initial subtab from URL query param if present (?tab=excel or ?tab=nilai)
  const [activeSubTab, setActiveSubTab] = useState<'excel' | 'nilai'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'nilai' || tab === 'tugas' || tab === 'cek') return 'nilai';
      if (tab === 'excel' || tab === 'lab') return 'excel';
    }
    return initialSubTab;
  });

  // Sync tab changes with URL query string
  const handleSwitchTab = (tab: 'excel' | 'nilai') => {
    setActiveSubTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER BANNER & DUAL TAB NAVIGATION FOR KELAS 7 */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b-2 border-[#1a1a1a]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5 font-mono-code text-[10px] font-bold uppercase">
              <span className="px-2 py-0.5 bg-[#107c41] text-white border border-[#1a1a1a]">
                INFORMATIKA KELAS 7 SMP
              </span>
              <span className="px-2 py-0.5 bg-[#FAF8F5] text-slate-700 border border-[#1a1a1a]">
                KELAS 7E ? 7F ? 7G ? 7H
              </span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-500">
                KURIKULUM MERDEKA: ANALISIS DATA
              </span>
            </div>
            <h1 className="font-mono-code text-lg sm:text-2xl font-black text-[#1a1a1a] tracking-tight">
              {activeSubTab === 'excel'
                ? 'Laboratorium Excel & Analisis Data Siswa'
                : 'Portal Cek Nilai & Pengerjaan Tugas Siswa'}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {activeSubTab === 'excel'
                ? 'Praktik pengolahan data dasar dengan spreadsheet: kuasai fungsi aritmatika, teks, tanggal, logika conditional, dan statistik dasar dengan auto-grading otomatis.'
                : 'Pengecekan rekapitulasi nilai evaluasi tengah semester (ASTS) dan status kelengkapan tugas harian Informatika Kelas 7E sampai 7H.'}
            </p>
          </div>

          {/* Quick External Actions */}
          <div className="flex flex-wrap items-center gap-2 font-mono-code text-xs self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={onNavigateHome}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-[#1a1a1a] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Showcase Utama</span>
            </button>
            <button
              type="button"
              onClick={onNavigateCek}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#2e59e6] font-bold border border-[#1a1a1a] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Portal Kelas 8</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Primary Tab Navigation Switcher */}
        <div className="pt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            {/* Tab 1: Laboratorium Excel */}
            <button
              type="button"
              onClick={() => handleSwitchTab('excel')}
              className={`px-4 py-2.5 font-mono-code text-xs font-bold border-2 transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-2 ${
                activeSubTab === 'excel'
                  ? 'bg-[#107c41] text-white border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              <span>LABORATORIUM EXCEL</span>
              <span
                className={`hidden md:inline-block text-[9px] px-1.5 py-0.2 border ${
                  activeSubTab === 'excel'
                    ? 'bg-white text-[#107c41] border-white font-black'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                MODUL PRAKTIK
              </span>
            </button>

            {/* Tab 2: Cek Nilai & Tugas */}
            <button
              type="button"
              onClick={() => handleSwitchTab('nilai')}
              className={`px-4 py-2.5 font-mono-code text-xs font-bold border-2 transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-2 ${
                activeSubTab === 'nilai'
                  ? 'bg-[#2e59e6] text-white border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
              }`}
            >
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>CEK NILAI & TUGAS (7E - 7H)</span>
              <span
                className={`hidden md:inline-block text-[9px] px-1.5 py-0.2 border ${
                  activeSubTab === 'nilai'
                    ? 'bg-white text-[#2e59e6] border-white font-black'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}
              >
                STATUS SISWA
              </span>
            </button>
          </div>

          <div className="font-mono-code text-[11px] text-slate-500 flex items-center gap-1.5 self-end sm:self-center">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Halaman Resmi Kelas 7 (inforkoding.vercel.app/kelas7)</span>
          </div>
        </div>
      </div>

      {/* 2. TAB CONTENT DISPLAY */}
      {activeSubTab === 'excel' ? (
        <ExcelLabStudentWorkspace
          onNavigateHome={onNavigateHome}
          onNavigateCek={onNavigateCek}
          onNavigateKelas7={() => handleSwitchTab('nilai')}
        />
      ) : (
        <StudentCheckView
          key="cek-kelas7-hub"
          gradeLevel="7"
          students={students}
          spreadsheetId={spreadsheetId}
          spreadsheetUrl={spreadsheetUrl}
          onNavigateHome={onNavigateHome}
          onNavigateCek={onNavigateCek}
          onNavigateExcel={() => handleSwitchTab('excel')}
        />
      )}
    </div>
  );
};
