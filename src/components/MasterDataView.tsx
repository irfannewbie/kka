import React from 'react';
import {
  RefreshCw,
  Plus,
  UserPlus,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { Student, TaskSubmission, AppNotification } from '../types';

interface MasterDataViewProps {
  students: Student[];
  tasks: TaskSubmission[];
  notifications: AppNotification[];
  spreadsheetUrl: string;
  spreadsheetId: string;
  isSyncing: boolean;
  onManualSync: () => void;
  onQuickAddStudent?: (student: Omit<Student, 'id'>) => Promise<void>;
  onOpenSubmitModal: () => void;
  onNavigateTab: (tab: 'showcase' | 'master' | 'tasks' | 'students' | 'spreadsheet') => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  students,
  tasks,
  spreadsheetUrl,
  isSyncing,
  onManualSync,
  onOpenSubmitModal,
  onNavigateTab,
}) => {
  // Dynamic list of unique groups from submitted tasks in spreadsheet
  const submittedGroups = Array.from(
    new Set(tasks.map((t) => t.group).filter(Boolean))
  ).sort();

  // Calculate live statistics
  const totalStudentsCount = students.length;
  const totalTasksCount = tasks.length;
  const activeGroupsCount = submittedGroups.length;

  return (
    <div className="space-y-6">
      {/* 1. MASTER PAGE EDITORIAL HEADER */}
      <header className="text-center py-6 sm:py-10 border-b-[1.5px] border-[#1a1a1a] bg-white/40 -mx-3.5 sm:-mx-5 px-4 shadow-2xs">
        <div className="inline-block px-3 py-1 bg-[#1a1a1a] text-white font-mono-code text-[10px] font-bold tracking-widest uppercase mb-2.5">
          [ PUSAT MANAJEMEN DATA & ADMINISTRATOR ]
        </div>
        <h1 className="font-serif-display italic font-bold text-4xl sm:text-6xl text-[#1a1a1a] tracking-tight leading-none">
          Halaman Master
        </h1>
        <span className="font-mono-code text-[11px] sm:text-xs font-bold text-slate-600 mt-2 block tracking-wider uppercase">
          KONTROL MASTER DATA SISWA, KELOMPOK, INPUT TUGAS & SINKRONISASI SHEET
        </span>
      </header>

      {/* 2. FAST ACTION BAR FOR TEACHERS & ADMINS */}
      <div className="bg-[#1a1a1a] text-white p-4 border-[1.5px] border-[#1a1a1a] shadow-[4px_4px_0px_#2e59e6] flex flex-wrap items-center justify-between gap-3 font-mono-code">
        <div className="flex items-center space-x-2">
          <Database className="h-4 w-4 text-[#2e59e6]" />
          <span className="text-xs font-bold uppercase tracking-wider">
            AKSI CEPAT ADMINISTRATOR
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenSubmitModal}
            className="inline-flex items-center gap-1.5 bg-[#2e59e6] hover:bg-white hover:text-[#1a1a1a] text-white px-3 py-1.5 text-xs font-bold border border-white/40 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> [ + INPUT KARYA BARU ]
          </button>

          <button
            onClick={() => onNavigateTab('students')}
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white hover:text-[#1a1a1a] text-white px-3 py-1.5 text-xs font-bold border border-white/20 transition-all cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" /> KELOLA DAFTAR SISWA
          </button>

          <button
            onClick={() => onNavigateTab('tasks')}
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white hover:text-[#1a1a1a] text-white px-3 py-1.5 text-xs font-bold border border-white/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> REKAP TABEL
          </button>

          <button
            onClick={onManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white hover:text-[#1a1a1a] text-white px-3 py-1.5 text-xs font-bold border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> SINKRONKAN
          </button>
        </div>
      </div>

      {/* 3. NEO-BRUTALIST STATS SUMMARY STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Total Siswa */}
        <div className="bg-white border-[1.5px] border-[#1a1a1a] p-3.5 shadow-[3px_3px_0px_#1a1a1a]">
          <div className="font-mono-code text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            TOTAL DATA SISWA
          </div>
          <div className="text-2xl font-bold font-mono-code text-[#1a1a1a] mt-1">
            {totalStudentsCount}
          </div>
          <div className="font-mono-code text-[10px] text-[#2e59e6] mt-0.5 font-bold">
            255 SISWA TERHUBUNG
          </div>
        </div>

        {/* Metric 2: Karya Terkumpul */}
        <div className="bg-white border-[1.5px] border-[#1a1a1a] p-3.5 shadow-[3px_3px_0px_#1a1a1a]">
          <div className="font-mono-code text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            TOTAL KARYA WEB
          </div>
          <div className="text-2xl font-bold font-mono-code text-[#1a1a1a] mt-1">
            {totalTasksCount}
          </div>
          <div className="font-mono-code text-[10px] text-emerald-700 mt-0.5 font-bold">
            SIAP DITAMPILKAN
          </div>
        </div>

        {/* Metric 3: Total Kelompok */}
        <div className="bg-white border-[1.5px] border-[#1a1a1a] p-3.5 shadow-[3px_3px_0px_#1a1a1a]">
          <div className="font-mono-code text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            TOTAL KELOMPOK
          </div>
          <div className="text-2xl font-bold font-mono-code text-[#1a1a1a] mt-1">
            {activeGroupsCount} <span className="text-xs text-slate-400">KELOMPOK</span>
          </div>
          <div className="font-mono-code text-[10px] text-[#2e59e6] mt-0.5 font-bold">
            KARYA KOLABORASI
          </div>
        </div>

        {/* Metric 4: Spreadsheet Status */}
        <div className="bg-white border-[1.5px] border-[#1a1a1a] p-3.5 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between">
          <div className="font-mono-code text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>DATA SOURCE</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-sm font-bold font-mono-code text-[#1a1a1a] truncate">
            G-SPREADSHEET
          </div>
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-code text-[10px] text-[#2e59e6] hover:underline font-bold flex items-center gap-1"
          >
            BUKA TABEL ASLI ↗
          </a>
        </div>
      </div>
    </div>
  );
};
