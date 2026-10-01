import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  Plus,
  UserPlus,
  FileSpreadsheet,
  Database,
  Calculator,
  Activity,
  Clock,
  CheckCircle2,
  Globe,
  Video,
  Bell,
  Search,
  Trash2,
  ExternalLink,
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import { Student, TaskSubmission, AppNotification, SubstituteTaskSubmission } from '../types';
import { loadSubstituteTaskSubmissions } from '../services/sheetsService';
import { SessionTimerInfo } from '../services/firebaseAuth';
import { SessionCountdownPanel } from './SessionCountdownPanel';

interface MasterDataViewProps {
  students: Student[];
  tasks: TaskSubmission[];
  notifications: AppNotification[];
  spreadsheetUrl: string;
  spreadsheetId: string;
  isSyncing: boolean;
  lastSyncedAt?: string | null;
  onManualSync: () => void;
  onQuickAddStudent?: (student: Omit<Student, 'id'>) => Promise<void>;
  onOpenSubmitModal: () => void;
  onClearNotifications?: () => void;
  onNavigateTab: (tab: 'showcase' | 'master' | 'tasks' | 'students' | 'grades' | 'calculator' | 'spreadsheet' | 'substitute_tasks' | 'master_quiz' | 'kuis') => void;
  sessionInfo?: SessionTimerInfo;
  masterOpenSeconds?: number;
  isLoggingIn?: boolean;
  onRefreshSession?: () => void;
  onLogout?: () => void;
  userEmail?: string | null;
}

interface UnifiedActivityItem {
  id: string;
  category: 'system' | 'task' | 'substitute';
  title: string;
  subtitle: string;
  metaBadge?: string;
  statusBadge?: string;
  timestamp: string;
  sortTime: number;
  linkUrl?: string;
  targetTab?: 'tasks' | 'students' | 'grades' | 'spreadsheet' | 'substitute_tasks';
}

function parseTimestampToMs(ts: string, fallbackIndex: number): number {
  if (!ts) return Date.now() - fallbackIndex * 60000;
  const clean = ts.trim();

  // Try standard Date parse
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) return parsed;

  // Try DD/MM/YYYY HH:mm or DD-MM-YYYY HH:mm
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 12;
    const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    return new Date(year, month, day, hour, min, sec).getTime();
  }

  // Try HH:mm or HH.mm (today's time from notifications)
  const timeOnlyMatch = clean.match(/^(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?$/);
  if (timeOnlyMatch) {
    const now = new Date();
    now.setHours(
      parseInt(timeOnlyMatch[1], 10),
      parseInt(timeOnlyMatch[2], 10),
      timeOnlyMatch[3] ? parseInt(timeOnlyMatch[3], 10) : 0,
      0
    );
    return now.getTime();
  }

  return Date.now() - fallbackIndex * 60000;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  students,
  tasks,
  notifications,
  spreadsheetUrl,
  spreadsheetId,
  isSyncing,
  lastSyncedAt,
  onManualSync,
  onOpenSubmitModal,
  onClearNotifications,
  onNavigateTab,
  sessionInfo,
  masterOpenSeconds = 0,
  isLoggingIn = false,
  onRefreshSession,
  onLogout,
  userEmail,
}) => {
  const [substituteTasks, setSubstituteTasks] = useState<SubstituteTaskSubmission[]>([]);
  const [activeLogFilter, setActiveLogFilter] = useState<'all' | 'task' | 'substitute' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(10);

  // Load substitute task submissions for activity feed
  useEffect(() => {
    let isMounted = true;
    async function fetchSubstituteLogs() {
      try {
        const subs = await loadSubstituteTaskSubmissions(null, spreadsheetId);
        if (isMounted && Array.isArray(subs)) {
          setSubstituteTasks(subs);
        }
      } catch (e) {
        // ignore error in background log fetch
      }
    }
    fetchSubstituteLogs();
    return () => {
      isMounted = false;
    };
  }, [spreadsheetId, isSyncing]);

  // Calculate live statistics - in sync with submitted works from spreadsheet
  const totalStudentsCount = students.length;
  const totalTasksCount = tasks.length;
  const activeGroupsCount = totalTasksCount;

  // Build unified activity list
  const activityLogs = useMemo<UnifiedActivityItem[]>(() => {
    const items: UnifiedActivityItem[] = [];

    // 1. System & Admin Notifications
    notifications.forEach((notif, idx) => {
      const idTimestampMatch = notif.id.match(/notif-(\d+)/);
      const exactMs = idTimestampMatch
        ? parseInt(idTimestampMatch[1], 10)
        : parseTimestampToMs(notif.timestamp, idx);

      items.push({
        id: `sys-${notif.id}-${idx}`,
        category: 'system',
        title: notif.title,
        subtitle: notif.message,
        metaBadge: notif.type === 'sync_success' ? 'SINKRONISASI' : notif.type === 'task_submitted' ? 'AKTIVITAS DATA' : 'SISTEM LOG',
        timestamp: notif.timestamp || 'Baru saja',
        sortTime: exactMs,
        targetTab: notif.taskId ? 'tasks' : undefined,
      });
    });

    // 2. Web Task Submissions
    tasks.forEach((task, idx) => {
      const idTimestampMatch = task.id.match(/tsk-(\d+)/);
      const exactMs = idTimestampMatch
        ? parseInt(idTimestampMatch[1], 10)
        : parseTimestampToMs(task.submittedAt, idx + 10);

      const memberInfo =
        task.taskType === 'kelompok' && task.groupMembers && task.groupMembers.length > 0
          ? `${task.groupMembers.map((m) => m.name).join(', ')}`
          : task.studentName;

      items.push({
        id: `task-${task.id}-${idx}`,
        category: 'task',
        title: `Pengumpulan Karya Web: "${task.taskTitle || 'Proyek Web Siswa'}"`,
        subtitle: `Oleh ${memberInfo} (${task.className || 'Kelas'} • ${task.group || 'Individu'})`,
        metaBadge: task.className || 'KARYA WEB',
        statusBadge: task.status || 'Selesai',
        timestamp: task.submittedAt || 'Tercatat di Sheet',
        sortTime: exactMs,
        linkUrl: task.descriptionOrLink?.startsWith('http') ? task.descriptionOrLink : undefined,
        targetTab: 'tasks',
      });
    });

    // 3. Substitute Task Submissions
    substituteTasks.forEach((sub, idx) => {
      const exactMs = parseTimestampToMs(sub.submittedAt, idx + 100);
      items.push({
        id: `sub-${sub.id}-${idx}`,
        category: 'substitute',
        title: `Pengumpulan Tugas Pengganti KKA 2 — ${sub.studentName}`,
        subtitle: `Kelas ${sub.className} (No. Absen ${sub.attendanceNo || '-'}) mengumpulkan tautan video dokumentasi.`,
        metaBadge: sub.className || 'PENGGANTI KKA 2',
        statusBadge: sub.status || 'Terkirim',
        timestamp: sub.submittedAt || 'Tercatat di Sheet',
        sortTime: exactMs,
        linkUrl: sub.youtubeUrl?.startsWith('http') ? sub.youtubeUrl : undefined,
        targetTab: 'substitute_tasks',
      });
    });

    return items.sort((a, b) => b.sortTime - a.sortTime);
  }, [notifications, tasks, substituteTasks]);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((item) => {
      if (activeLogFilter !== 'all' && item.category !== activeLogFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          (item.metaBadge && item.metaBadge.toLowerCase().includes(q)) ||
          item.timestamp.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activityLogs, activeLogFilter, searchQuery]);

  const displayedLogs = filteredLogs.slice(0, visibleCount);

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

      {/* 1B. LIVE SESSION COUNTDOWN & WRITE PERMISSION MONITOR */}
      {sessionInfo && onRefreshSession && (
        <SessionCountdownPanel
          sessionInfo={sessionInfo}
          masterOpenSeconds={masterOpenSeconds}
          isLoggingIn={isLoggingIn}
          onRefreshSession={onRefreshSession}
          onLogout={onLogout}
          userEmail={userEmail}
          variant="full"
        />
      )}

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
            onClick={() => onNavigateTab('grades')}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-[#1a1a1a] px-3 py-1.5 text-xs font-bold border border-white/40 transition-all cursor-pointer"
          >
            <Calculator className="h-3.5 w-3.5" /> PEMETAAN NILAI
          </button>

          <button
            onClick={() => onNavigateTab('calculator')}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold border border-white/40 transition-all cursor-pointer"
          >
            <Calculator className="h-3.5 w-3.5" /> KALKULATOR AKADEMIK
          </button>

          <button
            onClick={() => onNavigateTab('master_quiz')}
            className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 text-xs font-bold border border-white/40 transition-all cursor-pointer"
          >
            <Activity className="h-3.5 w-3.5" /> STUDIO KUIS & ARENA
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
            KELAS 7E-7H & 8A-8H TERHUBUNG
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

      {/* 4. LOG AKTIVITAS (ACTIVITY LOG CARD BELOW METRIC CARDS) */}
      <div className="bg-white border-[1.5px] border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] font-mono-code">
        {/* Top Header Strip */}
        <div className="bg-[#1a1a1a] text-white px-4 py-3 border-b-[1.5px] border-[#1a1a1a] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#2e59e6] text-white border border-white/30">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  LOG AKTIVITAS KONTROL MASTER
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Riwayat real-time pengumpulan karya siswa, tugas pengganti, dan sinkronisasi sistem
                {lastSyncedAt ? ` • Sinkron terakhir: ${lastSyncedAt}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClearNotifications && notifications.length > 0 && (
              <button
                onClick={onClearNotifications}
                className="inline-flex items-center gap-1 bg-white/10 hover:bg-rose-600 text-white px-2.5 py-1 text-[10px] font-bold border border-white/20 transition-colors cursor-pointer"
                title="Bersihkan log notifikasi sistem"
              >
                <Trash2 className="h-3 w-3" /> BERSIHKAN LOG SISTEM
              </button>
            )}
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 bg-[#2e59e6] hover:bg-white hover:text-[#1a1a1a] text-white px-2.5 py-1 text-[10px] font-bold border border-white/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} /> PERBARUI LOG
            </button>
          </div>
        </div>

        {/* Filter & Search Sub-bar */}
        <div className="p-3 bg-[#F2EFEB] border-b-[1.5px] border-[#1a1a1a] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setActiveLogFilter('all');
                setVisibleCount(10);
              }}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase border border-[#1a1a1a] transition-all cursor-pointer ${
                activeLogFilter === 'all'
                  ? 'bg-[#1a1a1a] text-white shadow-[2px_2px_0px_#2e59e6]'
                  : 'bg-white text-[#1a1a1a] hover:bg-slate-100'
              }`}
            >
              SEMUA ({activityLogs.length})
            </button>
            <button
              onClick={() => {
                setActiveLogFilter('task');
                setVisibleCount(10);
              }}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase border border-[#1a1a1a] transition-all cursor-pointer ${
                activeLogFilter === 'task'
                  ? 'bg-[#2e59e6] text-white shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-white text-[#1a1a1a] hover:bg-slate-100'
              }`}
            >
              KARYA WEB ({tasks.length})
            </button>
            <button
              onClick={() => {
                setActiveLogFilter('substitute');
                setVisibleCount(10);
              }}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase border border-[#1a1a1a] transition-all cursor-pointer ${
                activeLogFilter === 'substitute'
                  ? 'bg-amber-500 text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-white text-[#1a1a1a] hover:bg-slate-100'
              }`}
            >
              TUGAS PENGGANTI ({substituteTasks.length})
            </button>
            <button
              onClick={() => {
                setActiveLogFilter('system');
                setVisibleCount(10);
              }}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase border border-[#1a1a1a] transition-all cursor-pointer ${
                activeLogFilter === 'system'
                  ? 'bg-emerald-700 text-white shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-white text-[#1a1a1a] hover:bg-slate-100'
              }`}
            >
              SISTEM & ADMIN ({notifications.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aktivitas, siswa, kelas..."
              className="w-full bg-white border border-[#1a1a1a] pl-8 pr-3 py-1 text-[11px] text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2e59e6]"
            />
          </div>
        </div>

        {/* Activity Feed List */}
        <div className="divide-y divide-[#1a1a1a]/20 max-h-[460px] overflow-y-auto">
          {displayedLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Layers className="h-7 w-7 mx-auto mb-2 text-slate-400 opacity-60" />
              <p className="text-xs font-bold text-[#1a1a1a] uppercase">
                BELUM ADA LOG AKTIVITAS YANG COCOK
              </p>
              <p className="text-[11px] mt-1">
                Semua aktivitas pengumpulan tugas dan sinkronisasi data akan otomatis tercatat di sini.
              </p>
            </div>
          ) : (
            displayedLogs.map((log) => {
              const isTask = log.category === 'task';
              const isSub = log.category === 'substitute';

              return (
                <div
                  key={log.id}
                  className="p-3.5 hover:bg-[#F2EFEB]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Category Icon Box */}
                    <div
                      className={`p-2 border border-[#1a1a1a] shrink-0 mt-0.5 ${
                        isTask
                          ? 'bg-[#2e59e6] text-white'
                          : isSub
                          ? 'bg-amber-400 text-[#1a1a1a]'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isTask ? (
                        <Globe className="h-3.5 w-3.5" />
                      ) : isSub ? (
                        <Video className="h-3.5 w-3.5" />
                      ) : (
                        <Bell className="h-3.5 w-3.5" />
                      )}
                    </div>

                    {/* Log Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border border-[#1a1a1a] ${
                            isTask
                              ? 'bg-blue-50 text-[#2e59e6]'
                              : isSub
                              ? 'bg-amber-50 text-amber-900'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {isTask ? 'KARYA WEB' : isSub ? 'TUGAS PENGGANTI' : 'SISTEM & ADMIN'}
                        </span>

                        {log.metaBadge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-[#F2EFEB] text-[#1a1a1a] border border-[#1a1a1a]/40">
                            {log.metaBadge}
                          </span>
                        )}

                        {log.statusBadge && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-700/30">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {log.statusBadge}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-[#1a1a1a] truncate">
                        {log.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed break-words">
                        {log.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right Side Timestamp & Quick Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pl-10 sm:pl-0">
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 border border-slate-300">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{log.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {log.linkUrl && (
                        <a
                          href={log.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2e59e6] hover:underline"
                        >
                          BUKA LINK <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      {log.targetTab && (
                        <button
                          onClick={() => onNavigateTab(log.targetTab!)}
                          className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#1a1a1a] hover:text-[#2e59e6] cursor-pointer"
                        >
                          DETAIL <ArrowUpRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Load More Bar */}
        <div className="px-4 py-2.5 bg-[#F2EFEB] border-t-[1.5px] border-[#1a1a1a] flex items-center justify-between text-[10px] font-bold text-slate-600">
          <span>
            MENAMPILKAN {displayedLogs.length} DARI {filteredLogs.length} AKTIVITAS TERCATAT
          </span>
          {visibleCount < filteredLogs.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 15)}
              className="px-3 py-1 bg-white hover:bg-[#1a1a1a] hover:text-white text-[#1a1a1a] border border-[#1a1a1a] transition-colors cursor-pointer uppercase"
            >
              TAMPILKAN LEBIH BANYAK (+15)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
