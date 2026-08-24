import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  KeyRound,
  GraduationCap,
  Sparkles,
  RefreshCw,
  LogOut,
  BookOpen,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Student } from '../types';
import { ALL_255_STUDENTS } from '../data/students255';
import { KELAS_7_STUDENTS } from '../data/studentsAll';
import {
  fetchStudentAssignmentStatus,
  StudentTaskCheckItem,
  DEFAULT_SPREADSHEET_URL,
} from '../services/sheetsService';

interface StudentCheckViewProps {
  students: Student[];
  spreadsheetId: string;
  spreadsheetUrl?: string;
  onNavigateHome: () => void;
}

const STORAGE_KEY_STUDENT_SESSION = 'siswa_logged_in_session_v1';

// Combined database for fast local validation (Kelas 7 & 8)
const ALL_STUDENT_RECORDS = [...ALL_255_STUDENTS, ...KELAS_7_STUDENTS];

// Helper to normalize class string
function normalizeClass(c?: string): string {
  if (!c) return '';
  return c
    .toUpperCase()
    .replace(/^KELAS\s*/i, '')
    .replace(/^VIII\s*/i, '8')
    .replace(/^VII\s*/i, '7')
    .replace(/[^0-9A-Z]/g, '');
}

export const StudentCheckView: React.FC<StudentCheckViewProps> = ({
  students,
  spreadsheetId,
  spreadsheetUrl = DEFAULT_SPREADSHEET_URL,
  onNavigateHome,
}) => {
  // Authentication states
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Active Logged-in Student
  const [activeStudent, setActiveStudent] = useState<Student | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENT_SESSION);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  });

  // Task list and sheet sync states
  const [taskList, setTaskList] = useState<StudentTaskCheckItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [quickClassSelect, setQuickClassSelect] = useState<string>('8G');
  const [quickAbsenSelect, setQuickAbsenSelect] = useState<string>('1');

  // Load task status when student is logged in
  useEffect(() => {
    if (activeStudent) {
      loadStudentTasks(activeStudent);
    }
  }, [activeStudent, spreadsheetId]);

  // Fetch tasks status from spreadsheet
  const loadStudentTasks = async (student: Student) => {
    setIsLoadingTasks(true);
    try {
      const res = await fetchStudentAssignmentStatus(
        spreadsheetId,
        student.className,
        student.attendanceNo || '1',
        student.nis,
        student.name
      );

      if (res.success) {
        setTaskList(res.tasks || []);
      } else {
        setTaskList([]);
      }
      const now = new Date();
      setLastRefreshedAt(
        `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}`
      );
    } catch (err) {
      console.warn('Failed to load student tasks:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Handle Student Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    const rawUser = usernameInput.trim();
    const rawPass = passwordInput.trim();

    if (!rawUser || !rawPass) {
      setAuthError('Silakan masukkan Username (No Absen - Kelas) dan Kata Sandi (NIPD).');
      setIsLoggingIn(false);
      return;
    }

    // Parse username: Supports formats like "01 - 8G", "1 - 8G", "1-8G", "1 8G", "8G - 01", "Kelas 8G - 1"
    let parsedAbsen: string | null = null;
    let parsedClass: string | null = null;

    // Remove any "Kelas" prefix
    const cleaned = rawUser.replace(/^kelas\s*/i, '').trim();

    // Check if format is "absen - class" or "absen class"
    const match1 = cleaned.match(/^(\d{1,2})\s*[-_\/,\s]\s*([0-9a-zA-Z]+)$/);
    const match2 = cleaned.match(/^([0-9a-zA-Z]+)\s*[-_\/,\s]\s*(\d{1,2})$/);

    if (match1) {
      parsedAbsen = String(parseInt(match1[1], 10));
      parsedClass = normalizeClass(match1[2]);
    } else if (match2) {
      parsedClass = normalizeClass(match2[1]);
      parsedAbsen = String(parseInt(match2[2], 10));
    } else {
      // Try single token detection if format is like "1-8G" or "018G"
      const match3 = cleaned.match(/^(\d{1,2})([a-zA-Z]{1,2})$/);
      if (match3) {
        parsedAbsen = String(parseInt(match3[1], 10));
        parsedClass = normalizeClass(match3[2]);
      }
    }

    // Dataset pool to search from
    const pool = students && students.length >= 200 ? students : ALL_STUDENT_RECORDS;

    // 1. Search student by parsed Absen and Class
    let foundStudent: Student | undefined = undefined;

    if (parsedAbsen && parsedClass) {
      foundStudent = pool.find((s) => {
        const sNormClass = normalizeClass(s.className);
        const sAtt = String(parseInt(s.attendanceNo || '0', 10));
        return sNormClass === parsedClass && sAtt === parsedAbsen;
      });
    }

    // 2. Fallback search by NIPD / NIS directly
    if (!foundStudent) {
      foundStudent = pool.find(
        (s) => s.nis && s.nis.trim() === rawPass.trim()
      );
    }

    if (!foundStudent) {
      setAuthError(
        `Data siswa tidak ditemukan untuk username "${rawUser}". Pastikan format: No Absen - Kelas (contoh: 01 - 8G atau 1 - 8A).`
      );
      setIsLoggingIn(false);
      return;
    }

    // Verify Password against student's NIPD (NIS)
    const expectedNipd = String(foundStudent.nis || '').trim();
    if (expectedNipd !== rawPass.trim()) {
      setAuthError(
        `Kata sandi (NIPD) tidak sesuai untuk ${foundStudent.name} (Absen ${foundStudent.attendanceNo} - ${foundStudent.className}).`
      );
      setIsLoggingIn(false);
      return;
    }

    // Login successful
    setActiveStudent(foundStudent);
    localStorage.setItem(STORAGE_KEY_STUDENT_SESSION, JSON.stringify(foundStudent));
    setIsLoggingIn(false);
  };

  // Handle Student Logout
  const handleLogout = () => {
    setActiveStudent(null);
    localStorage.removeItem(STORAGE_KEY_STUDENT_SESSION);
    setUsernameInput('');
    setPasswordInput('');
    setTaskList([]);
  };

  // Quick fill helper
  const handleQuickFill = () => {
    const formattedUser = `${quickAbsenSelect.padStart(2, '0')} - ${quickClassSelect}`;
    setUsernameInput(formattedUser);

    // Auto-fill NIPD from student roster for seamless user convenience
    const normC = normalizeClass(quickClassSelect);
    const pool = students && students.length >= 200 ? students : ALL_STUDENT_RECORDS;
    const match = pool.find(
      (s) =>
        normalizeClass(s.className) === normC &&
        String(parseInt(s.attendanceNo || '0', 10)) === String(parseInt(quickAbsenSelect, 10))
    );
    if (match && match.nis) {
      setPasswordInput(match.nis);
    }
  };

  // Stats calculation
  const totalTasks = taskList.length;
  const completedTasks = taskList.filter((t) => t.isCompleted).length;
  const incompleteTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. LOGIN SCREEN (IF NOT LOGGED IN) */}
      {/* ========================================================================= */}
      {!activeStudent ? (
        <div className="max-w-xl mx-auto space-y-5">
          {/* Main Login Box */}
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-6 sm:p-8">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b-2 border-[#1a1a1a]">
              <div className="p-2.5 bg-[#2e59e6] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-mono-code text-lg sm:text-xl font-bold text-[#1a1a1a] uppercase tracking-wide">
                  Masuk Akun Siswa
                </h2>
                <p className="font-mono-code text-xs text-slate-600 mt-0.5">
                  Cek status pengerjaan tugas Koding/KKA & Informatika
                </p>
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mb-5 p-3 bg-rose-50 border-2 border-rose-600 text-rose-800 font-mono-code text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Gagal Masuk: </span>
                  {authError}
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block font-mono-code text-xs font-bold text-[#1a1a1a] uppercase mb-1.5">
                  Username (No Absen - Kelas):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Contoh: 01 - 8G atau 1 - 8A"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-[#1a1a1a] font-mono-code text-sm text-[#1a1a1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e59e6]"
                  />
                </div>
                <p className="font-mono-code text-[11px] text-slate-500 mt-1">
                  *Format: <span className="font-bold text-[#1a1a1a]">[No Absen] - [Kelas]</span> (contoh: <code className="bg-slate-100 px-1 py-0.5 border">01 - 8G</code>, <code className="bg-slate-100 px-1 py-0.5 border">1 - 8A</code>, <code className="bg-slate-100 px-1 py-0.5 border">15 - 7B</code>)
                </p>
              </div>

              <div>
                <label className="block font-mono-code text-xs font-bold text-[#1a1a1a] uppercase mb-1.5">
                  Kata Sandi (NIPD / NIS):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Masukkan NIPD Anda (contoh: 11690)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-[#1a1a1a] font-mono-code text-sm text-[#1a1a1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e59e6]"
                  />
                  <div className="absolute right-3 top-3 text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                </div>
                <p className="font-mono-code text-[11px] text-slate-500 mt-1">
                  *Kata sandi adalah nomor induk peserta didik (NIPD) masing-masing anak.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 py-3 bg-[#2e59e6] hover:bg-blue-700 text-white font-mono-code text-xs font-bold border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>MEMVALIDASI DATA SISWA...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>MASUK & CEK STATUS TUGAS</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Picker Shortcut */}
            <div className="mt-6 pt-5 border-t border-dashed border-slate-300 font-mono-code">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
                <Sparkles className="h-3.5 w-3.5 text-[#2e59e6]" />
                <span>Bantuan Cepat Pilihan Siswa:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase mb-1">Pilih Kelas:</label>
                  <select
                    value={quickClassSelect}
                    onChange={(e) => setQuickClassSelect(e.target.value)}
                    className="w-full p-2 bg-white border border-[#1a1a1a] font-mono-code text-xs"
                  >
                    {['8A', '8B', '8C', '8D', '8E', '8F', '8G', '8H', '7A', '7B', '7C', '7D', '7E', '7F', '7G', '7H'].map((c) => (
                      <option key={c} value={c}>
                        Kelas {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase mb-1">No. Absen:</label>
                  <select
                    value={quickAbsenSelect}
                    onChange={(e) => setQuickAbsenSelect(e.target.value)}
                    className="w-full p-2 bg-white border border-[#1a1a1a] font-mono-code text-xs"
                  >
                    {Array.from({ length: 32 }, (_, i) => String(i + 1)).map((num) => (
                      <option key={num} value={num}>
                        Absen {num.padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="mt-2.5 w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-300 transition-colors cursor-pointer"
              >
                Gunakan Pilihan Ini ({quickAbsenSelect.padStart(2, '0')} - {quickClassSelect})
              </button>
            </div>
          </div>

          {/* Guidance Info Card */}
          <div className="bg-[#F2EFEB] border-2 border-[#1a1a1a] p-4 font-mono-code text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#1a1a1a]">
              <HelpCircle className="h-4 w-4 text-[#2e59e6]" />
              <span>Petunjuk Akses Akun Siswa:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
              <li>
                <strong>Username</strong>: Gabungan Nomor Absen dan Kelas dengan tanda strip (misal:{' '}
                <span className="font-bold text-[#2e59e6]">01 - 8G</span>,{' '}
                <span className="font-bold text-[#2e59e6]">02 - 8A</span>).
              </li>
              <li>
                <strong>Kata Sandi</strong>: NIPD resmi Anda yang terdaftar pada buku induk dan Google Spreadsheet sekolah.
              </li>
              <li>
                Sistem secara otomatis membaca data status pengerjaan tugas langsung dari Google Spreadsheet guru.
              </li>
            </ul>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. STUDENT DASHBOARD (LOGGED IN) */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Student Profile Card */}
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b-2 border-[#1a1a1a]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-[#2e59e6] text-white flex items-center justify-center font-mono-code font-bold text-lg border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
                  {activeStudent.attendanceNo ? activeStudent.attendanceNo.padStart(2, '0') : '01'}
                </div>
                <div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-400 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                    SESI SISWA TERAUTENTIKASI
                  </span>
                  <h2 className="font-mono-code text-lg sm:text-xl font-bold text-[#1a1a1a] mt-0.5">
                    {activeStudent.name}
                  </h2>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-mono-code text-xs font-bold border border-rose-400 transition-colors cursor-pointer"
                title="Keluar dari akun siswa"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>KELUAR / GANTI AKUN</span>
              </button>
            </div>

            {/* Student Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 font-mono-code text-xs">
              <div className="p-3 bg-[#F2EFEB] border border-[#1a1a1a]">
                <span className="text-[10px] text-slate-500 uppercase block">NIPD / NIS:</span>
                <span className="text-sm font-bold text-[#1a1a1a]">{activeStudent.nis || '-'}</span>
              </div>
              <div className="p-3 bg-[#F2EFEB] border border-[#1a1a1a]">
                <span className="text-[10px] text-slate-500 uppercase block">KELAS:</span>
                <span className="text-sm font-bold text-[#2e59e6]">{activeStudent.className}</span>
              </div>
              <div className="p-3 bg-[#F2EFEB] border border-[#1a1a1a]">
                <span className="text-[10px] text-slate-500 uppercase block">NO. ABSEN:</span>
                <span className="text-sm font-bold text-[#1a1a1a]">
                  Absen {activeStudent.attendanceNo || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Progress Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono-code">
            <div className="bg-white p-3.5 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">TOTAL TUGAS</span>
              <div className="text-2xl font-bold text-[#1a1a1a] mt-1">{totalTasks} Tugas</div>
            </div>

            <div className="bg-white p-3.5 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                SUDAH MENGERJAKAN (v)
              </span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{completedTasks} Tugas</div>
            </div>

            <div className="bg-white p-3.5 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
              <span className="text-[10px] text-rose-700 font-bold uppercase block flex items-center gap-1">
                <XCircle className="h-3 w-3 text-rose-600" />
                BELUM MENGERJAKAN (x)
              </span>
              <div className="text-2xl font-bold text-rose-700 mt-1">{incompleteTasks} Tugas</div>
            </div>
          </div>

          {/* Tasks Status Table */}
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] overflow-hidden">
            {/* Table Header Controls */}
            <div className="p-4 bg-[#F2EFEB] border-b-2 border-[#1a1a1a] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-mono-code text-sm font-bold text-[#1a1a1a] uppercase flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#2e59e6]" />
                  <span>STATUS PENGERJAAN TUGAS SISWA</span>
                </h3>
                <p className="font-mono-code text-[11px] text-slate-600 mt-0.5">
                  Tanda <span className="font-bold text-emerald-700">v</span> = Sudah Mengerjakan • Tanda{' '}
                  <span className="font-bold text-rose-700">x</span> = Belum Mengerjakan
                </p>
              </div>

              <div className="flex items-center gap-2">
                {lastRefreshedAt && (
                  <span className="hidden md:inline-block font-mono-code text-[10px] text-slate-500">
                    Sinkron: {lastRefreshedAt}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => loadStudentTasks(activeStudent)}
                  disabled={isLoadingTasks}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-[#1a1a1a] font-mono-code text-xs font-bold border border-[#1a1a1a] transition-all cursor-pointer disabled:opacity-50"
                  title="Perbarui data tugas dari Spreadsheet"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingTasks ? 'animate-spin text-[#2e59e6]' : ''}`} />
                  <span>{isLoadingTasks ? 'MEMUAT...' : 'PERBARUI DATA'}</span>
                </button>
              </div>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono-code text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-[#1a1a1a] text-slate-700 text-[11px] uppercase">
                    <th className="py-3 px-4 border-r border-[#1a1a1a] w-16 text-center">NO</th>
                    <th className="py-3 px-4 border-r border-[#1a1a1a]">NAMA TUGAS</th>
                    <th className="py-3 px-4 w-56 text-center">STATUS PENGERJAAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {taskList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-500 font-mono-code text-xs">
                        {isLoadingTasks
                          ? 'Sedang memuat data tugas langsung dari Google Spreadsheet...'
                          : 'Belum ada tugas yang terdaftar pada Google Spreadsheet untuk kelas ini.'}
                      </td>
                    </tr>
                  ) : (
                    taskList.map((task, idx) => (
                      <tr
                        key={task.id || idx}
                        className={`hover:bg-slate-50 transition-colors ${
                          task.isCompleted ? 'bg-emerald-50/20' : 'bg-rose-50/20'
                        }`}
                      >
                        {/* No */}
                        <td className="py-3.5 px-4 border-r border-[#1a1a1a] text-center font-bold text-slate-700">
                          {idx + 1}
                        </td>

                        {/* Task Title */}
                        <td className="py-3.5 px-4 border-r border-[#1a1a1a]">
                          <div className="font-bold text-[#1a1a1a] text-xs">
                            {task.taskName}
                          </div>
                        </td>

                        {/* Status (v or x) */}
                        <td className="py-3.5 px-4 text-center">
                          {task.isCompleted ? (
                            <div className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1 bg-emerald-100 text-emerald-900 border-2 border-emerald-600 font-bold text-xs shadow-[1.5px_1.5px_0px_#047857]">
                              <CheckCircle2 className="h-4 w-4 text-emerald-700 stroke-[2.5]" />
                              <span>v (SUDAH)</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1 bg-rose-100 text-rose-900 border-2 border-rose-600 font-bold text-xs shadow-[1.5px_1.5px_0px_#be123c]">
                              <XCircle className="h-4 w-4 text-rose-700 stroke-[2.5]" />
                              <span>x (BELUM)</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Helper */}
            <div className="p-3 bg-[#F2EFEB] border-t border-[#1a1a1a] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-code text-slate-600">
              <span>
                *Status tugas tersinkron langsung dengan tab sheet kelas{' '}
                <strong>'{activeStudent.className.replace(/^Kelas\s*/i, '')}'</strong> pada Google Spreadsheet.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
