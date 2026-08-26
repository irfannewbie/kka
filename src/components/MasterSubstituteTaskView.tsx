import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  Play,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Video,
  User,
  School,
  Hash,
  Clock,
  BookOpen,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';
import { Student, SubstituteTaskSubmission } from '../types';
import {
  loadSubstituteTaskSubmissions,
  SUBSTITUTE_TASK_SHEET_NAME,
} from '../services/sheetsService';
import { AutoSyncConfigModal } from './AutoSyncConfigModal';

interface MasterSubstituteTaskViewProps {
  students: Student[];
  spreadsheetId: string;
  spreadsheetUrl: string;
  token: string | null;
  onLogin?: () => void;
}

const LOCAL_STORAGE_SUBSTITUTE_KEY = 'tugas_siswa_substitute_submissions_v1';

const CLASS_FILTER_OPTIONS = [
  'SEMUA KELAS',
  'Kelas 8A',
  'Kelas 8B',
  'Kelas 8C',
  'Kelas 8D',
  'Kelas 8E',
  'Kelas 8F',
  'Kelas 8G',
  'Kelas 8H',
  'Kelas 7A',
  'Kelas 7B',
  'Kelas 7C',
  'Kelas 7D',
  'Kelas 7E',
  'Kelas 7F',
  'Kelas 7G',
];

// Helper to extract YouTube Video ID
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  
  const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  
  const watchMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  const shortsMatch = cleanUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  const embedMatch = cleanUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  return null;
}

export const MasterSubstituteTaskView: React.FC<MasterSubstituteTaskViewProps> = ({
  students,
  spreadsheetId,
  spreadsheetUrl,
  token,
  onLogin,
}) => {
  const [submissions, setSubmissions] = useState<SubstituteTaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('SEMUA KELAS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Video Modal Preview State
  const [activeVideoModal, setActiveVideoModal] = useState<{
    url: string;
    studentName: string;
    className: string;
    attendanceNo: string;
  } | null>(null);
  const [isAutoSyncModalOpen, setIsAutoSyncModalOpen] = useState<boolean>(false);

  // Load submissions from LocalStorage and Google Sheets
  const fetchSubmissions = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. LocalStorage fallback
      let localData: SubstituteTaskSubmission[] = [];
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_SUBSTITUTE_KEY);
        if (raw) localData = JSON.parse(raw);
      } catch (e) {
        // ignore
      }

      // 2. Fetch directly from Google Sheets
      const sheetData = await loadSubstituteTaskSubmissions(spreadsheetId, token);

      // Merge (Google Sheet has priority)
      const mergedMap = new Map<string, SubstituteTaskSubmission>();
      localData.forEach((item) => {
        const key = `${item.className}-${item.attendanceNo}-${item.studentName}`.toUpperCase();
        mergedMap.set(key, item);
      });
      sheetData.forEach((item) => {
        const key = `${item.className}-${item.attendanceNo}-${item.studentName}`.toUpperCase();
        mergedMap.set(key, item);
      });

      const combined = Array.from(mergedMap.values()).sort((a, b) => {
        // Sort by class then attendance number
        if (a.className !== b.className) {
          return (a.className || '').localeCompare(b.className || '');
        }
        const na = parseInt(a.attendanceNo || '0', 10);
        const nb = parseInt(b.attendanceNo || '0', 10);
        return na - nb;
      });

      setSubmissions(combined);
    } catch (err: any) {
      console.error('Error loading substitute submissions:', err);
      setErrorMsg(`Gagal memuat data dari Spreadsheet: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [spreadsheetId, token]);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      // Class Filter
      if (selectedClassFilter !== 'SEMUA KELAS') {
        const itemClassNorm = (item.className || '').replace(/^Kelas\s*/i, '').trim().toUpperCase();
        const filterNorm = selectedClassFilter.replace(/^Kelas\s*/i, '').trim().toUpperCase();
        if (itemClassNorm !== filterNorm && !item.className?.toUpperCase().includes(filterNorm)) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (item.studentName || '').toLowerCase().includes(q);
        const absenMatch = (item.attendanceNo || '').toLowerCase().includes(q);
        const classMatch = (item.className || '').toLowerCase().includes(q);
        const notesMatch = (item.notes || '').toLowerCase().includes(q);
        if (!nameMatch && !absenMatch && !classMatch && !notesMatch) {
          return false;
        }
      }

      return true;
    });
  }, [submissions, selectedClassFilter, searchQuery]);

  // Stats calculations
  const totalSubmissions = submissions.length;
  const classesWithSubmissions = useMemo(() => {
    const set = new Set(submissions.map((s) => s.className).filter(Boolean));
    return set.size;
  }, [submissions]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Header Card */}
      <div className="bg-white border-2 border-[#1a1a1a] p-6 shadow-[5px_5px_0px_#1a1a1a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#1a1a1a] pb-5 mb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500 text-white font-mono-code text-xs font-bold tracking-widest uppercase">
                <Sparkles className="h-3.5 w-3.5 text-white" />
                <span>[ REKAPITULASI MASTER ]</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-500 text-amber-900 font-mono-code text-xs font-bold">
                <Clock className="h-3.5 w-3.5 text-rose-600" />
                <span>Deadline Siswa: 1 September 2026, 23.59 WIB</span>
              </div>
            </div>
            <h1 className="font-serif-display italic font-bold text-2xl sm:text-4xl text-[#1a1a1a] tracking-tight">
              Rekap Pengumpulan Tugas Pengganti KKA 2
            </h1>
            <p className="font-mono-code text-xs sm:text-sm text-slate-600 mt-1">
              Daftar pengumpulan video YouTube analisis algoritma & flowchart game teka-teki (Tab Sheet: '{SUBSTITUTE_TASK_SHEET_NAME}')
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAutoSyncModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 border-2 border-[#1a1a1a] text-[#1a1a1a] font-mono-code text-xs font-bold shadow-[2px_2px_0px_#1a1a1a] transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-700" />
              <span>⚙️ AUTO-SYNC SPREADSHEET</span>
            </button>

            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 border-2 border-[#1a1a1a] text-[#1a1a1a] font-mono-code text-xs font-bold shadow-[2px_2px_0px_#1a1a1a] transition-all cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
              <span>BUKA SPREADSHEET</span>
              <ExternalLink className="h-3 w-3 text-slate-600" />
            </a>

            <button
              onClick={fetchSubmissions}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF8F5] hover:bg-white border-2 border-[#1a1a1a] font-mono-code text-xs font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#2e59e6]' : ''}`} />
              <span>{isLoading ? 'MEMUAT...' : 'PERBARUI DATA'}</span>
            </button>
          </div>
        </div>

        {/* 2. Top Summary KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono-code">
          <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3.5 shadow-[3px_3px_0px_#1a1a1a]">
            <div className="text-[11px] font-bold text-slate-500 uppercase">TOTAL TUGAS PENGGANTI</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] mt-1">
              {totalSubmissions} <span className="text-xs text-slate-500 font-normal">Siswa</span>
            </div>
          </div>

          <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3.5 shadow-[3px_3px_0px_#1a1a1a]">
            <div className="text-[11px] font-bold text-slate-500 uppercase">KELAS TERLIBAT</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#2e59e6] mt-1">
              {classesWithSubmissions} <span className="text-xs text-slate-500 font-normal">Kelas</span>
            </div>
          </div>

          <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3.5 shadow-[3px_3px_0px_#1a1a1a]">
            <div className="text-[11px] font-bold text-slate-500 uppercase">SINKRONISASI GOOGLE SHEETS</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${token ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs font-bold text-[#1a1a1a]">
                {token ? 'Tab Sheet Aktif Terkoneksi' : 'Lokal / Mode Standby'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[4px_4px_0px_#1a1a1a] flex flex-col sm:flex-row gap-3 items-center justify-between font-mono-code">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa / absen..."
            className="w-full bg-[#FAF8F5] border-2 border-[#1a1a1a] pl-9 pr-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-hidden focus:bg-white shadow-[2px_2px_0px_#1a1a1a]"
          />
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-500 shrink-0" />
          <span className="text-xs font-bold text-slate-600 shrink-0">FILTER KELAS:</span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full sm:w-auto bg-[#FAF8F5] border-2 border-[#1a1a1a] px-3 py-2 text-xs font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] focus:outline-hidden cursor-pointer"
          >
            {CLASS_FILTER_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error notification if any */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border-2 border-rose-600 text-rose-800 font-mono-code text-xs flex items-center gap-2 shadow-[3px_3px_0px_#e11d48]">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. Submissions Table */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] overflow-hidden">
        <div className="p-4 border-b-2 border-[#1a1a1a] bg-[#FAF8F5] flex items-center justify-between font-mono-code">
          <div className="text-xs font-bold text-[#1a1a1a] flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#2e59e6]" />
            <span>DAFTAR PENGUMPULAN TUGAS ({filteredSubmissions.length} DATA DITEMUKAN)</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Tab Google Sheet: <span className="font-bold text-[#1a1a1a]">'{SUBSTITUTE_TASK_SHEET_NAME}'</span>
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center bg-white space-y-3 font-mono-code">
            <div className="inline-flex p-3 bg-slate-100 rounded-full border-2 border-[#1a1a1a]">
              <Video className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-[#1a1a1a]">
              Belum ada data pengumpulan tugas pengganti
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery || selectedClassFilter !== 'SEMUA KELAS'
                ? 'Tidak ada siswa yang cocok dengan filter atau kata kunci pencarian saat ini.'
                : 'Siswa dapat mengumpulkan video tugas pengganti melalui halaman /pengganti.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono-code text-xs">
              <thead>
                <tr className="bg-[#1a1a1a] text-white border-b-2 border-[#1a1a1a]">
                  <th className="py-3 px-3 text-center w-12 font-bold">NO</th>
                  <th className="py-3 px-3 text-center w-24 font-bold">KELAS</th>
                  <th className="py-3 px-3 text-center w-16 font-bold">ABSEN</th>
                  <th className="py-3 px-4 text-left font-bold">NAMA SISWA</th>
                  <th className="py-3 px-3 text-center font-bold">WAKTU PENGUMPULAN</th>
                  <th className="py-3 px-4 text-left font-bold">LINK VIDEO YOUTUBE</th>
                  <th className="py-3 px-4 text-left font-bold">CATATAN</th>
                  <th className="py-3 px-3 text-center w-28 font-bold">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#1a1a1a] bg-white">
                {filteredSubmissions.map((sub, idx) => {
                  const videoId = extractYouTubeVideoId(sub.youtubeUrl);

                  return (
                    <tr key={sub.id || idx} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-blue-100 text-[#2e59e6] border border-blue-600 font-bold text-[10px]">
                          {sub.className || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[#2e59e6]">
                        {sub.attendanceNo}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1a1a1a]">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{sub.studentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 text-[11px]">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{sub.submittedAt}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setActiveVideoModal({
                                url: sub.youtubeUrl,
                                studentName: sub.studentName,
                                className: sub.className,
                                attendanceNo: sub.attendanceNo,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] border border-[#1a1a1a] shadow-[1px_1px_0px_#1a1a1a] cursor-pointer shrink-0"
                            title="Tonton Preview Video"
                          >
                            <Play className="h-3 w-3 fill-white" />
                            <span>PLAY</span>
                          </button>

                          <a
                            href={sub.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-rose-600 font-mono-code text-[11px] truncate max-w-[180px] sm:max-w-xs hover:underline"
                            title={sub.youtubeUrl}
                          >
                            <span className="truncate">{sub.youtubeUrl}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                        {sub.notes || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-600 font-bold text-[10px]">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>TERKIRIM</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Video Preview Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#000] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-[#1a1a1a] text-white flex items-center justify-between font-mono-code">
              <div>
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  PREVIEW VIDEO TUGAS PENGGANTI
                </div>
                <div className="text-sm font-bold mt-0.5">
                  {activeVideoModal.studentName} ({activeVideoModal.className} - Absen {activeVideoModal.attendanceNo})
                </div>
              </div>

              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-1 text-white hover:text-rose-400 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="aspect-video w-full bg-black">
              {extractYouTubeVideoId(activeVideoModal.url) ? (
                <iframe
                  title={`Video Tugas ${activeVideoModal.studentName}`}
                  src={`https://www.youtube-nocookie.com/embed/${extractYouTubeVideoId(activeVideoModal.url)}?autoplay=1`}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white font-mono-code text-xs p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
                  <p>Link video YouTube tidak dapat diputar langsung di dalam modal.</p>
                  <a
                    href={activeVideoModal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 px-3 py-1.5 bg-rose-600 text-white font-bold border border-white inline-flex items-center gap-1.5"
                  >
                    <span>Buka di Tab Baru YouTube</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-[#FAF8F5] border-t-2 border-[#1a1a1a] flex items-center justify-between font-mono-code text-xs">
              <a
                href={activeVideoModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2e59e6] hover:underline flex items-center gap-1 font-bold truncate max-w-sm"
              >
                <span>{activeVideoModal.url}</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <button
                onClick={() => setActiveVideoModal(null)}
                className="px-4 py-1.5 bg-[#1a1a1a] text-white font-bold border border-[#1a1a1a] hover:bg-slate-800 cursor-pointer"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Auto-Sync Configuration Modal for Teacher */}
      <AutoSyncConfigModal
        isOpen={isAutoSyncModalOpen}
        onClose={() => setIsAutoSyncModalOpen(false)}
        spreadsheetId={spreadsheetId}
        spreadsheetUrl={spreadsheetUrl}
        token={token}
        onSuccessSync={() => {
          fetchSubmissions();
        }}
      />
    </div>
  );
};
