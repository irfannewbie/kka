import React, { useState } from "react";
import {
  RefreshCw,
  Plus,
  UserPlus,
  FileSpreadsheet,
  Database,
  Calculator,
  Archive,
} from "lucide-react";
import {
  Student,
  TaskSubmission,
  AppNotification,
  SubstituteTaskSubmission,
} from "../types";

interface MasterDataViewProps {
  students: Student[];
  tasks: TaskSubmission[];
  notifications: AppNotification[];
  spreadsheetUrl: string;
  spreadsheetId: string;
  isSyncing: boolean;
  onManualSync: () => void;
  onQuickAddStudent?: (student: Omit<Student, "id">) => Promise<void>;
  onOpenSubmitModal: () => void;
  onNavigateTab: (
    tab:
      | "showcase"
      | "master"
      | "tasks"
      | "students"
      | "grades"
      | "spreadsheet",
  ) => void;
  isSubstitutePageArchived: boolean;
  onToggleSubstitutePageArchive: () => void;
  archiveAt: string | null;
  archiveReason: string;
  onSaveArchiveSchedule: (archiveAt: string, reason: string) => void;
  onBackupConfiguration: () => void;
  onRestoreConfiguration: () => void;
  submissions: SubstituteTaskSubmission[];
  connectionSecondsRemaining: number | null;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  students,
  tasks,
  spreadsheetUrl,
  isSyncing,
  onManualSync,
  onOpenSubmitModal,
  onNavigateTab,
  isSubstitutePageArchived,
  onToggleSubstitutePageArchive,
  archiveAt,
  archiveReason,
  onSaveArchiveSchedule,
  onBackupConfiguration,
  onRestoreConfiguration,
  submissions,
  connectionSecondsRemaining,
}) => {
  // Calculate live statistics - in sync with submitted works from spreadsheet
  const totalStudentsCount = students.length;
  const totalTasksCount = tasks.length;
  const activeGroupsCount = totalTasksCount;
  const [classFilter, setClassFilter] = useState("SEMUA KELAS");
  const [statusFilter, setStatusFilter] = useState("SEMUA STATUS");
  const filteredSubmissions = submissions.filter(
    (submission) =>
      (classFilter === "SEMUA KELAS" || submission.className === classFilter) &&
      (statusFilter === "SEMUA STATUS" || submission.status === statusFilter),
  );
  const submittedClasses = new Set(
    filteredSubmissions.map((submission) => submission.className),
  ).size;
  const latestSubmission = filteredSubmissions[0]?.submittedAt || "Belum ada";
  const scheduleValue = archiveAt
    ? new Date(archiveAt).toISOString().slice(0, 16)
    : "";
  const submissionsByClass = filteredSubmissions.reduce(
    (counts: Record<string, number>, submission) => {
      counts[submission.className] = (counts[submission.className] || 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );
  const exportSubmissions = () => {
    const headers = [
      "Waktu",
      "Nama Siswa",
      "Kelas",
      "No Absen",
      "NIS",
      "Link YouTube",
      "Status",
      "Catatan",
    ];
    const rows = filteredSubmissions.map((submission) => [
      submission.submittedAt,
      submission.studentName,
      submission.className,
      submission.attendanceNo,
      submission.nis || "",
      submission.youtubeUrl,
      submission.status,
      submission.notes || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    link.download = `monitoring-pengumpulan-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

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
            onClick={() => onNavigateTab("students")}
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white hover:text-[#1a1a1a] text-white px-3 py-1.5 text-xs font-bold border border-white/20 transition-all cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" /> KELOLA DAFTAR SISWA
          </button>

          <button
            onClick={() => onNavigateTab("grades")}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-[#1a1a1a] px-3 py-1.5 text-xs font-bold border border-white/40 transition-all cursor-pointer"
          >
            <Calculator className="h-3.5 w-3.5" /> PEMETAAN NILAI
          </button>

          <button
            onClick={() => onNavigateTab("tasks")}
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white hover:text-[#1a1a1a] text-white px-3 py-1.5 text-xs font-bold border border-white/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> REKAP TABEL
          </button>

          <button
            onClick={onManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white hover:text-[#1a1a1a] text-white px-3 py-1.5 text-xs font-bold border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
            />{" "}
            SINKRONKAN
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
            {totalStudentsCount} SISWA TERHUBUNG
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
            {activeGroupsCount}{" "}
            <span className="text-xs text-slate-400">KELOMPOK</span>
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

      {/* 4. PUBLIC PAGE ARCHIVE CONTROLS */}
      <section className="bg-white border-[1.5px] border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a]">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-2.5">
            <div className="bg-amber-400 text-[#1a1a1a] p-2 border border-[#1a1a1a]">
              <Archive className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-mono-code text-sm font-bold uppercase">
                ARSIP HALAMAN PUBLIK
              </h2>
              <p className="font-mono-code text-[10px] text-slate-500 mt-1 max-w-xl">
                Tutup akses halaman yang sudah melewati deadline. Halaman yang
                diarsipkan tidak dapat dibuka atau digunakan siswa.
              </p>
            </div>
          </div>
          <span className="font-mono-code text-[10px] font-bold px-2 py-1 border border-[#1a1a1a] bg-[#F2EFEB]">
            {isSubstitutePageArchived
              ? "1 HALAMAN DIARSIPKAN"
              : "TIDAK ADA ARSIP AKTIF"}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1a1a1a] pt-3">
          <div>
            <div className="font-mono-code text-xs font-bold">
              TUGAS PENGGANTI KKA 2
            </div>
            <div className="font-mono-code text-[10px] text-slate-500 mt-1">
              /pengganti · Form pengumpulan video siswa
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleSubstitutePageArchive}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1a1a1a] font-mono-code text-[11px] font-bold transition-colors cursor-pointer ${
              isSubstitutePageArchived
                ? "bg-emerald-500 text-[#1a1a1a] hover:bg-emerald-400"
                : "bg-rose-600 text-white hover:bg-rose-700"
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            {isSubstitutePageArchived
              ? "BUKA KEMBALI HALAMAN"
              : "ARSIPKAN HALAMAN"}
          </button>
        </div>

        <div className="mt-4 border-t border-[#1a1a1a] pt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end">
          <label className="font-mono-code text-[10px] font-bold uppercase">
            Jadwalkan waktu arsip
            <input
              type="datetime-local"
              defaultValue={scheduleValue}
              id="archive-schedule-input"
              className="mt-1 block w-full border border-[#1a1a1a] bg-[#F2EFEB] px-2 py-1.5 text-xs font-normal"
            />
          </label>
          <label className="font-mono-code text-[10px] font-bold uppercase">
            Alasan arsip
            <input
              type="text"
              defaultValue={archiveReason}
              id="archive-reason-input"
              placeholder="Contoh: deadline tugas berakhir"
              className="mt-1 block w-full border border-[#1a1a1a] bg-[#F2EFEB] px-2 py-1.5 text-xs font-normal"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              onSaveArchiveSchedule(
                (
                  document.getElementById(
                    "archive-schedule-input",
                  ) as HTMLInputElement
                )?.value || "",
                (
                  document.getElementById(
                    "archive-reason-input",
                  ) as HTMLInputElement
                )?.value || "",
              )
            }
            className="px-3 py-1.5 border border-[#1a1a1a] bg-[#2e59e6] text-white font-mono-code text-[11px] font-bold hover:bg-[#1a1a1a] cursor-pointer"
          >
            SIMPAN JADWAL
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBackupConfiguration}
            className="px-3 py-1.5 border border-[#1a1a1a] bg-white font-mono-code text-[11px] font-bold hover:bg-[#F2EFEB] cursor-pointer"
          >
            BACKUP KONFIGURASI
          </button>
          <button
            type="button"
            onClick={onRestoreConfiguration}
            className="px-3 py-1.5 border border-[#1a1a1a] bg-white font-mono-code text-[11px] font-bold hover:bg-[#F2EFEB] cursor-pointer"
          >
            PULIHKAN BACKUP TERAKHIR
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border-[1.5px] border-[#1a1a1a] p-3 shadow-[3px_3px_0px_#1a1a1a]">
          <div className="font-mono-code text-[10px] font-bold text-slate-500">
            PENGUMPULAN PENGGANTI
          </div>
          <div className="text-2xl font-bold font-mono-code mt-1">
            {submissions.length}
          </div>
          <div className="font-mono-code text-[10px] text-emerald-700">
            SUBMISSION MASUK
          </div>
        </div>
        <div className="bg-white border-[1.5px] border-[#1a1a1a] p-3 shadow-[3px_3px_0px_#1a1a1a]">
          <div className="font-mono-code text-[10px] font-bold text-slate-500">
            KELAS TERJANGKAU
          </div>
          <div className="text-2xl font-bold font-mono-code mt-1">
            {submittedClasses}
          </div>
          <div className="font-mono-code text-[10px] text-[#2e59e6]">
            DARI DATA MASUK
          </div>
        </div>
        <div className="bg-white border-[1.5px] border-[#1a1a1a] p-3 shadow-[3px_3px_0px_#1a1a1a]">
          <div className="font-mono-code text-[10px] font-bold text-slate-500">
            TERAKHIR MASUK
          </div>
          <div className="text-xs font-bold font-mono-code mt-2 truncate">
            {latestSubmission}
          </div>
          <div className="font-mono-code text-[10px] text-slate-500 mt-1">
            WAKTU PENGUMPULAN
          </div>
        </div>
        <div className="bg-white border-[1.5px] border-[#1a1a1a] p-3 shadow-[3px_3px_0px_#1a1a1a]">
          <div className="font-mono-code text-[10px] font-bold text-slate-500">
            KONEKSI GOOGLE
          </div>
          <div
            className={`text-xl font-bold font-mono-code mt-1 ${connectionSecondsRemaining !== null && connectionSecondsRemaining <= 300 ? "text-amber-600" : "text-emerald-700"}`}
          >
            {connectionSecondsRemaining === null
              ? "TERPUTUS"
              : `${Math.floor(connectionSecondsRemaining / 60)} MENIT`}
          </div>
          <div className="font-mono-code text-[10px] text-slate-500">
            SISA SESI AKSES
          </div>
        </div>
      </section>

      <section className="bg-white border-[1.5px] border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-mono-code text-sm font-bold uppercase">
            MONITORING PENGUMPULAN PER KELAS
          </h2>
          <button
            type="button"
            onClick={exportSubmissions}
            className="px-2.5 py-1 border border-[#1a1a1a] bg-[#2e59e6] text-white font-mono-code text-[10px] font-bold hover:bg-[#1a1a1a] cursor-pointer"
          >
            EKSPOR CSV
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="border border-[#1a1a1a] bg-[#F2EFEB] px-2 py-1.5 font-mono-code text-[10px]"
          >
            <option>SEMUA KELAS</option>
            {Array.from(
              new Set(submissions.map((submission) => submission.className)),
            )
              .sort()
              .map((className) => (
                <option key={className}>{className}</option>
              ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-[#1a1a1a] bg-[#F2EFEB] px-2 py-1.5 font-mono-code text-[10px]"
          >
            <option>SEMUA STATUS</option>
            <option>Terkirim</option>
            <option>Ditinjau</option>
            <option>Selesai</option>
          </select>
          <span className="font-mono-code text-[10px] text-slate-500 self-center">
            {filteredSubmissions.length} DATA TERPILIH
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {Object.entries(submissionsByClass)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([className, count]) => (
              <div
                key={className}
                className="border border-[#1a1a1a] bg-[#F2EFEB] p-2"
              >
                <div className="font-mono-code text-[10px] font-bold truncate">
                  {className}
                </div>
                <div className="font-mono-code text-lg font-bold text-[#2e59e6]">
                  {count}
                </div>
                <div className="font-mono-code text-[9px] text-slate-500">
                  SUBMISSION
                </div>
              </div>
            ))}
          {Object.keys(submissionsByClass).length === 0 && (
            <div className="col-span-full font-mono-code text-xs text-slate-500">
              Belum ada data pengumpulan.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
