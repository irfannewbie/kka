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
  BarChart3,
  Trophy,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Student } from '../types';
import { ALL_255_STUDENTS } from '../data/students255';
import { KELAS_7_STUDENTS } from '../data/studentsAll';
import {
  fetchStudentAssignmentStatus,
  fetchClassAverageStatistics,
  StudentTaskCheckItem,
  ClassPerformanceStat,
  DEFAULT_SPREADSHEET_URL,
} from '../services/sheetsService';

interface StudentCheckViewProps {
  students: Student[];
  spreadsheetId: string;
  spreadsheetUrl?: string;
  gradeLevel?: '7' | '8';
  onNavigateHome: () => void;
  onNavigatePengganti?: () => void;
  onNavigateKelas7?: () => void;
  onNavigateCek?: () => void;
}

const STORAGE_KEY_STUDENT_SESSION_8 = 'siswa_logged_in_session_v1';
const STORAGE_KEY_STUDENT_SESSION_7 = 'siswa_logged_in_session_kelas7_v1';

const KELAS_8_CLASS_LIST = ['8A', '8B', '8C', '8D', '8E', '8F', '8G', '8H'];
const KELAS_7_CLASS_LIST = ['7E', '7F', '7G', '7H'];

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
  gradeLevel = '8',
  onNavigateHome,
  onNavigatePengganti,
  onNavigateKelas7,
  onNavigateCek,
}) => {
  const isGrade7Mode = gradeLevel === '7';
  const sessionStorageKey = isGrade7Mode
    ? STORAGE_KEY_STUDENT_SESSION_7
    : STORAGE_KEY_STUDENT_SESSION_8;
  const allowedClasses = isGrade7Mode ? KELAS_7_CLASS_LIST : KELAS_8_CLASS_LIST;

  // Authentication states
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Active Logged-in Student (strictly validated against current page's grade level)
  const [activeStudent, setActiveStudent] = useState<Student | null>(() => {
    try {
      const saved = localStorage.getItem(sessionStorageKey);
      if (saved) {
        const parsed: Student = JSON.parse(saved);
        const normC = normalizeClass(parsed?.className);
        if (isGrade7Mode && KELAS_7_CLASS_LIST.includes(normC)) {
          return parsed;
        }
        if (!isGrade7Mode && KELAS_8_CLASS_LIST.includes(normC)) {
          return parsed;
        }
        localStorage.removeItem(sessionStorageKey);
      }
    } catch (e) {
      // ignore
    }
    return null;
  });

  // Task list and sheet sync states
  const [taskList, setTaskList] = useState<StudentTaskCheckItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [quickClassSelect, setQuickClassSelect] = useState<string>(
    isGrade7Mode ? '7E' : '8G'
  );
  const [quickAbsenSelect, setQuickAbsenSelect] = useState<string>('1');

  // Class average statistics states
  const [classStats, setClassStats] = useState<ClassPerformanceStat[]>([]);
  const [isLoadingClassStats, setIsLoadingClassStats] = useState<boolean>(false);
  const [selectedStatMetric, setSelectedStatMetric] = useState<
    'overall' | 'informatika' | 'kka' | 'tugas'
  >('overall');

  // Filter student pool strictly for this page's grade level (Kelas 7E-7H vs Kelas 8A-8H)
  const currentGradePool = React.useMemo(() => {
    const basePool =
      students && students.length >= 200
        ? students.filter((s) =>
            allowedClasses.includes(normalizeClass(s.className))
          )
        : [];
    if (basePool.length > 0) return basePool;
    return isGrade7Mode ? KELAS_7_STUDENTS : ALL_255_STUDENTS;
  }, [students, isGrade7Mode, allowedClasses]);

  const otherGradePool = React.useMemo(() => {
    return isGrade7Mode ? ALL_255_STUDENTS : KELAS_7_STUDENTS;
  }, [isGrade7Mode]);

  // Load class average statistics on mount and gradeLevel/spreadsheetId change
  useEffect(() => {
    loadClassStatistics();
  }, [spreadsheetId, gradeLevel]);

  // Load task status when student is logged in
  useEffect(() => {
    if (activeStudent) {
      loadStudentTasks(activeStudent);
    }
  }, [activeStudent, spreadsheetId]);

  const loadClassStatistics = async () => {
    setIsLoadingClassStats(true);
    try {
      const res = await fetchClassAverageStatistics(spreadsheetId, gradeLevel === '7' ? '7' : '8');
      if (res.success) {
        setClassStats(res.stats || []);
      }
    } catch (err) {
      console.warn('Failed to load class average statistics:', err);
    } finally {
      setIsLoadingClassStats(false);
    }
  };

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

    // 1. Search student by parsed Absen and Class in current page's grade pool
    let foundStudent: Student | undefined = undefined;

    if (parsedAbsen && parsedClass) {
      foundStudent = currentGradePool.find((s) => {
        const sNormClass = normalizeClass(s.className);
        const sAtt = String(parseInt(s.attendanceNo || '0', 10));
        return sNormClass === parsedClass && sAtt === parsedAbsen;
      });
    }

    // 2. Fallback search by NIPD / NIS directly in current page's grade pool
    if (!foundStudent) {
      foundStudent = currentGradePool.find(
        (s) => s.nis && s.nis.trim() === rawPass.trim()
      );
    }

    // Check if the student actually belongs to the OTHER grade level (e.g. Kelas 7 trying on /cek or Kelas 8 trying on /kelas7)
    if (!foundStudent) {
      const matchedOtherGrade = otherGradePool.find((s) => {
        const sNormClass = normalizeClass(s.className);
        const sAtt = String(parseInt(s.attendanceNo || '0', 10));
        if (parsedAbsen && parsedClass && sNormClass === parsedClass && sAtt === parsedAbsen) {
          return true;
        }
        if (s.nis && s.nis.trim() === rawPass.trim()) {
          return true;
        }
        return false;
      });

      if (matchedOtherGrade) {
        if (isGrade7Mode) {
          setAuthError(
            `Halaman ini khusus untuk pengecekan nilai Kelas 7E sampai dengan Kelas 7H. Siswa ${matchedOtherGrade.className} silakan melakukan pengecekan melalui halaman /cek.`
          );
        } else {
          setAuthError(
            `Pengecekan nilai untuk Kelas 7E sampai dengan Kelas 7H telah dipisahkan ke halaman kelas7 (/kelas7). Silakan buka halaman /kelas7.`
          );
        }
        setIsLoggingIn(false);
        return;
      }

      setAuthError(
        isGrade7Mode
          ? `Data siswa Kelas 7 (7E - 7H) tidak ditemukan untuk username "${rawUser}". Pastikan format: No Absen - Kelas (contoh: 01 - 7E atau 15 - 7G).`
          : `Data siswa Kelas 8 (8A - 8H) tidak ditemukan untuk username "${rawUser}". Pastikan format: No Absen - Kelas (contoh: 01 - 8G atau 1 - 8A).`
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
    localStorage.setItem(sessionStorageKey, JSON.stringify(foundStudent));
    setIsLoggingIn(false);
  };

  // Handle Student Logout
  const handleLogout = () => {
    setActiveStudent(null);
    localStorage.removeItem(sessionStorageKey);
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
    const match = currentGradePool.find(
      (s) =>
        normalizeClass(s.className) === normC &&
        String(parseInt(s.attendanceNo || '0', 10)) === String(parseInt(quickAbsenSelect, 10))
    );
    if (match && match.nis) {
      setPasswordInput(match.nis);
    }
  };

  // Separate ASTS evaluation from regular assignments (Nilai Tugas)
  // Pastikan card Informatika tampil paling atas dan card Koding dan Kecerdasan Artifisial (KKA) tampil tepat di bawahnya
  const astsInformatikaTasks = taskList
    .filter(
      (t) =>
        t.showNumericScore ||
        t.taskName.toUpperCase().includes('ASTS')
    )
    .sort((a, b) => {
      const aIsKka =
        a.astsSubject === 'KKA' ||
        a.taskName.toUpperCase().includes('KKA') ||
        a.taskName.toUpperCase().includes('KODING');
      const bIsKka =
        b.astsSubject === 'KKA' ||
        b.taskName.toUpperCase().includes('KKA') ||
        b.taskName.toUpperCase().includes('KODING');
      if (aIsKka === bIsKka) return 0;
      return aIsKka ? 1 : -1;
    });
  const regularTasks = taskList.filter(
    (t) =>
      !t.showNumericScore &&
      !t.taskName.toUpperCase().includes('ASTS')
  );

  // Stats calculation (exclusively for regular tasks, excluding ASTS Gasal)
  const totalTasks = regularTasks.length;
  const completedTasks = regularTasks.filter((t) => t.isCompleted).length;
  const incompleteTasks = totalTasks - completedTasks;
  const kktpAsts = 75;

  // Helper to get active metric value for a class stat item
  const getMetricValue = (stat: ClassPerformanceStat): number | null => {
    if (selectedStatMetric === 'informatika') return stat.astsInformatikaAvg;
    if (selectedStatMetric === 'kka') return stat.astsKkaAvg;
    if (selectedStatMetric === 'tugas') return stat.taskCompletionRate;
    return stat.averageScore;
  };

  // Compute rank map by selected metric (highest to lowest)
  const rankedClassStats = React.useMemo(() => {
    const withVal = classStats
      .map((s) => ({ stat: s, val: getMetricValue(s) }))
      .filter((x) => x.val !== null && !isNaN(Number(x.val)) && Number(x.val) > 0)
      .sort((a, b) => Number(b.val) - Number(a.val));

    const rankMap = new Map<string, number>();
    withVal.forEach((item, idx) => {
      rankMap.set(item.stat.classCode, idx + 1);
    });

    const validValues = withVal.map((x) => Number(x.val));
    const overallMetricAvg =
      validValues.length > 0
        ? Math.round((validValues.reduce((a, b) => a + b, 0) / validValues.length) * 10) / 10
        : null;

    const topClass = withVal.length > 0 ? withVal[0] : null;
    const totalGradedAcrossClasses = classStats.reduce((acc, s) => {
      if (selectedStatMetric === 'informatika') return acc + s.astsInformatikaCount;
      if (selectedStatMetric === 'kka') return acc + s.astsKkaCount;
      return acc + s.gradedCount;
    }, 0);
    const totalStudentsAcrossClasses = classStats.reduce((acc, s) => acc + s.totalStudents, 0);

    return {
      rankMap,
      overallMetricAvg,
      topClass,
      totalGradedAcrossClasses,
      totalStudentsAcrossClasses,
    };
  }, [classStats, selectedStatMetric]);

  // Student's own score for comparison against their class average
  const activeStudentComparison = React.useMemo(() => {
    if (!activeStudent) return null;
    const normStuClass = normalizeClass(activeStudent.className);
    const myClassStat = classStats.find((s) => s.classCode === normStuClass);
    if (!myClassStat) return null;

    const classMetricVal = getMetricValue(myClassStat);
    const classRank = rankedClassStats.rankMap.get(normStuClass) || null;

    // Find student's own score matching selectedStatMetric
    let studentOwnVal: number | null = null;
    if (selectedStatMetric === 'tugas') {
      studentOwnVal =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : null;
    } else if (selectedStatMetric === 'kka') {
      const kkaTask = astsInformatikaTasks.find(
        (t) =>
          t.astsSubject === 'KKA' ||
          t.taskName.toUpperCase().includes('KKA') ||
          t.taskName.toUpperCase().includes('KODING')
      );
      if (kkaTask && kkaTask.isCompleted && kkaTask.score !== null && kkaTask.score !== undefined && kkaTask.score !== '') {
        const n = Number(kkaTask.score);
        if (!isNaN(n)) studentOwnVal = n;
      }
    } else {
      // 'overall' or 'informatika'
      const infTask = astsInformatikaTasks.find(
        (t) =>
          t.astsSubject === 'Informatika' ||
          (!t.taskName.toUpperCase().includes('KKA') &&
            !t.taskName.toUpperCase().includes('KODING'))
      );
      if (infTask && infTask.isCompleted && infTask.score !== null && infTask.score !== undefined && infTask.score !== '') {
        const n = Number(infTask.score);
        if (!isNaN(n)) studentOwnVal = n;
      }
    }

    const diffFromClass =
      studentOwnVal !== null && classMetricVal !== null
        ? Math.round((studentOwnVal - classMetricVal) * 10) / 10
        : null;

    return {
      myClassStat,
      classMetricVal,
      classRank,
      studentOwnVal,
      diffFromClass,
    };
  }, [activeStudent, classStats, selectedStatMetric, astsInformatikaTasks, totalTasks, completedTasks, rankedClassStats]);

  // Render Reusable Class Performance Comparison Section
  const renderClassComparisonSection = () => {
    const isPercentMetric = selectedStatMetric === 'tugas';
    const unitSuffix = isPercentMetric ? '%' : '';
    const activeStudentClassCode = activeStudent ? normalizeClass(activeStudent.className) : '';

    return (
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] overflow-hidden font-mono-code">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-[#1a1a1a] text-white border-b-2 border-[#1a1a1a] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-[#2e59e6] text-white border border-white/40 shrink-0">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  STATISTIK RINGKASAN NILAI RATA-RATA PER KELAS ({isGrade7Mode ? 'KELAS 7E – 7H' : 'KELAS 8A – 8H'})
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold uppercase">
                  LIVE PERFORMA KELAS
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Perbandingan rata-rata nilai evaluasi, ketuntasan KKTP ({kktpAsts}), dan penyelesaian tugas antar kelas secara keseluruhan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadClassStatistics}
            disabled={isLoadingClassStats}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white hover:text-[#1a1a1a] text-white text-[11px] font-bold border border-white/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingClassStats ? 'animate-spin' : ''}`} />
            <span>{isLoadingClassStats ? 'MEMUAT STATISTIK...' : 'SEGARKAN STATISTIK'}</span>
          </button>
        </div>

        {/* Category Filter Sub-bar */}
        <div className="p-3 sm:px-5 bg-[#F2EFEB] border-b-2 border-[#1a1a1a] flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-[#1a1a1a] uppercase">
            PILIH KATEGORI PERBANDINGAN:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedStatMetric('overall')}
              className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase border border-[#1a1a1a] transition-all cursor-pointer ${
                selectedStatMetric === 'overall'
                  ? 'bg-[#2e59e6] text-white shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-white text-[#1a1a1a] hover:bg-slate-100'
              }`}
            >
              RATA-RATA UTAMA
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatMetric('informatika')}
              className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase border border-[#1a1a1a] transition-all cursor-pointer ${
                selectedStatMetric === 'informatika'
                  ? 'bg-[#2e59e6] text-white shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-white text-[#1a1a1a] hover:bg-slate-100'
              }`}
            >
              ASTS INFORMATIKA
            </button>
            {!isGrade7Mode && (
              <button
                type="button"
                onClick={() => setSelectedStatMetric('kka')}
                className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase border border-[#1a1a1a] transition-all cursor-pointer ${
                  selectedStatMetric === 'kka'
                    ? 'bg-[#2e59e6] text-white shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-white text-[#1a1a1a] hover:bg-slate-100'
                }`}
              >
                ASTS KODING / KKA
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedStatMetric('tugas')}
              className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase border border-[#1a1a1a] transition-all cursor-pointer ${
                selectedStatMetric === 'tugas'
                  ? 'bg-[#2e59e6] text-white shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-white text-[#1a1a1a] hover:bg-slate-100'
              }`}
            >
              KETUNTASAN TUGAS (%)
            </button>
          </div>
        </div>

        {/* Top Summary KPI Cards */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5] border-b-2 border-[#1a1a1a] grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Overall Average across all classes */}
          <div className="bg-white border-2 border-[#1a1a1a] p-3.5 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                RATA-RATA SELURUH KELAS ({isGrade7Mode ? 'KELAS 7' : 'KELAS 8'})
              </span>
              <TrendingUp className="h-4 w-4 text-[#2e59e6]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1a1a1a]">
                {rankedClassStats.overallMetricAvg !== null
                  ? `${rankedClassStats.overallMetricAvg}${unitSuffix}`
                  : '-'}
              </span>
              {!isPercentMetric && rankedClassStats.overallMetricAvg !== null && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 border ${
                    rankedClassStats.overallMetricAvg >= kktpAsts
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-500'
                      : 'bg-amber-100 text-amber-900 border-amber-500'
                  }`}
                >
                  {rankedClassStats.overallMetricAvg >= kktpAsts
                    ? `≥ KKTP (${kktpAsts})`
                    : `< KKTP (${kktpAsts})`}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Dari {allowedClasses.length} kelas paralel ({isGrade7Mode ? '7E s.d. 7H' : '8A s.d. 8H'})
            </p>
          </div>

          {/* Card 2: Highest Performing Class */}
          <div className="bg-white border-2 border-[#1a1a1a] p-3.5 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                RATA-RATA KELAS TERTINGGI
              </span>
              <Trophy className="h-4 w-4 text-amber-500" />
            </div>
            {rankedClassStats.topClass ? (
              <>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black text-[#2e59e6]">
                    {rankedClassStats.topClass.stat.className}
                  </span>
                  <span className="text-sm font-black bg-amber-100 text-amber-900 px-2 py-0.5 border border-amber-500">
                    {rankedClassStats.topClass.val}
                    {unitSuffix}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Peringkat #1 performa rata-rata tertinggi saat ini
                </p>
              </>
            ) : (
              <div className="mt-2 text-xs font-bold text-slate-400">
                Belum ada data nilai pada kategori ini
              </div>
            )}
          </div>

          {/* Card 3: Student's Own Class Position (if logged in) OR Total Students Evaluated */}
          {activeStudent && activeStudentComparison ? (
            <div className="bg-blue-50/80 border-2 border-[#2e59e6] p-3.5 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#2e59e6] uppercase">
                  POSISI {activeStudent.className.toUpperCase()} ANDA
                </span>
                {activeStudentComparison.classRank && (
                  <span className="px-2 py-0.5 bg-[#2e59e6] text-white text-[10px] font-bold">
                    PERINGKAT #{activeStudentComparison.classRank}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#1a1a1a]">
                  {activeStudentComparison.classMetricVal !== null
                    ? `${activeStudentComparison.classMetricVal}${unitSuffix}`
                    : 'Belum Ada'}
                </span>
                <span className="text-[11px] font-bold text-slate-600">
                  (Rata-rata Kelas)
                </span>
              </div>
              <div className="text-[10px] font-bold mt-1">
                {activeStudentComparison.diffFromClass !== null ? (
                  activeStudentComparison.diffFromClass >= 0 ? (
                    <span className="text-emerald-700">
                      ✓ Nilai Anda +{activeStudentComparison.diffFromClass}
                      {unitSuffix} di atas rata-rata {activeStudent.className}
                    </span>
                  ) : (
                    <span className="text-rose-700">
                      • Nilai Anda {activeStudentComparison.diffFromClass}
                      {unitSuffix} dari rata-rata {activeStudent.className}
                    </span>
                  )
                ) : (
                  <span className="text-slate-600">
                    Membandingkan performa {activeStudent.className} dengan kelas lain
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-[#1a1a1a] p-3.5 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  CAKUPAN DATA SISWA TERNILAI
                </span>
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#1a1a1a]">
                  {rankedClassStats.totalGradedAcrossClasses}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  / {rankedClassStats.totalStudentsAcrossClasses || (isGrade7Mode ? 127 : 255)} Siswa
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Masuk dengan akun siswa untuk melihat perbandingan nilai Anda terhadap kelas
              </p>
            </div>
          )}
        </div>

        {/* Per-Class Bar Comparison & Stats Grid */}
        <div className="p-4 sm:p-5 space-y-3">
          {isLoadingClassStats && classStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-[#2e59e6]" />
              <span>Sedang menghitung statistik rata-rata seluruh kelas...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {classStats.map((stat) => {
                const metricVal = getMetricValue(stat);
                const hasVal = metricVal !== null && !isNaN(Number(metricVal)) && Number(metricVal) > 0;
                const numVal = hasVal ? Number(metricVal) : 0;
                const barWidth = Math.min(100, Math.max(0, numVal));
                const isMyClass = activeStudentClassCode === stat.classCode;
                const rank = rankedClassStats.rankMap.get(stat.classCode);
                const isAboveKktp = numVal >= kktpAsts;

                const subHighest =
                  selectedStatMetric === 'informatika'
                    ? stat.astsInformatikaHighest
                    : selectedStatMetric === 'kka'
                    ? stat.astsKkaHighest
                    : stat.highestScore;
                const subLowest =
                  selectedStatMetric === 'informatika'
                    ? stat.astsInformatikaLowest
                    : selectedStatMetric === 'kka'
                    ? stat.astsKkaLowest
                    : stat.lowestScore;
                const subCount =
                  selectedStatMetric === 'informatika'
                    ? stat.astsInformatikaCount
                    : selectedStatMetric === 'kka'
                    ? stat.astsKkaCount
                    : stat.gradedCount;
                const subTuntas =
                  selectedStatMetric === 'informatika'
                    ? stat.astsInformatikaTuntasCount
                    : selectedStatMetric === 'kka'
                    ? stat.astsKkaTuntasCount
                    : stat.tuntasCount;

                return (
                  <div
                    key={stat.classCode}
                    className={`p-3.5 border-2 transition-all ${
                      isMyClass
                        ? 'bg-blue-50/50 border-[#2e59e6] shadow-[3px_3px_0px_#2e59e6]'
                        : 'bg-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                    }`}
                  >
                    {/* Top Row: Class Name + Rank + Average Value */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-black border border-[#1a1a1a] ${
                            isMyClass
                              ? 'bg-[#2e59e6] text-white'
                              : 'bg-[#F2EFEB] text-[#1a1a1a]'
                          }`}
                        >
                          {stat.className}
                        </span>
                        {isMyClass && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-600 text-[9px] font-black uppercase">
                            KELAS ANDA
                          </span>
                        )}
                        {rank && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                              rank === 1
                                ? 'bg-amber-100 text-amber-900 border-amber-500'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            #{rank}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        {hasVal ? (
                          <div className="flex items-baseline gap-1 justify-end">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">
                              RATA-RATA:
                            </span>
                            <span
                              className={`text-lg font-black ${
                                isAboveKktp ? 'text-emerald-700' : 'text-[#2e59e6]'
                              }`}
                            >
                              {numVal}
                              {unitSuffix}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            BELUM ADA NILAI
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Visual Progress Bar with KKTP 75 Marker */}
                    <div className="relative h-3.5 w-full bg-slate-100 border border-[#1a1a1a] overflow-hidden mb-2.5">
                      {/* KKTP 75 Vertical Line Marker */}
                      <div
                        className="absolute top-0 bottom-0 border-r border-dashed border-rose-600 z-10"
                        style={{ left: `${kktpAsts}%` }}
                        title={`Batas KKTP: ${kktpAsts}`}
                      />
                      <div
                        className={`h-full transition-all duration-500 ${
                          !hasVal
                            ? 'bg-slate-200'
                            : isAboveKktp
                            ? 'bg-emerald-500'
                            : 'bg-[#2e59e6]'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    {/* Bottom Metadata Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600 pt-1 border-t border-dashed border-slate-200">
                      {isPercentMetric ? (
                        <>
                          <span>
                            Siswa: <strong>{stat.totalStudents} Anak</strong>
                          </span>
                          <span>
                            Rata-Rata Nilai Evaluasi:{' '}
                            <strong>{stat.averageScore !== null ? stat.averageScore : '-'}</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            Tertinggi: <strong className="text-emerald-700">{subHighest ?? '-'}</strong> • Terendah:{' '}
                            <strong className="text-rose-700">{subLowest ?? '-'}</strong>
                          </span>
                          <span>
                            Tuntas ≥{kktpAsts}:{' '}
                            <strong>
                              {subTuntas}/{subCount || stat.totalStudents} Siswa
                            </strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend & Explanation Footer */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 border border-[#1a1a1a] inline-block" />
                Rata-rata ≥ KKTP ({kktpAsts})
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#2e59e6] border border-[#1a1a1a] inline-block" />
                Rata-rata &lt; KKTP ({kktpAsts})
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-3 border-r border-dashed border-rose-600 inline-block" />
                Garis Batas KKTP ({kktpAsts})
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. LOGIN SCREEN (IF NOT LOGGED IN) */}
      {/* ========================================================================= */}
      {!activeStudent ? (
        <div className="space-y-6">
          <div className="max-w-xl mx-auto space-y-5">
            {/* Main Login Box */}
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-6 sm:p-8">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b-2 border-[#1a1a1a]">
              <div className="p-2.5 bg-[#2e59e6] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-mono-code text-lg sm:text-xl font-bold text-[#1a1a1a] uppercase tracking-wide">
                  {isGrade7Mode
                    ? 'Masuk Akun Siswa Kelas 7 (7E - 7H)'
                    : 'Masuk Akun Siswa (Kelas 8A - 8H)'}
                </h2>
                <p className="font-mono-code text-xs text-slate-600 mt-0.5">
                  {isGrade7Mode
                    ? 'Cek hasil nilai & status pengerjaan tugas Informatika Kelas 7E s.d. 7H'
                    : 'Cek status pengerjaan tugas Koding/KKA & Informatika Kelas 8'}
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
                    placeholder={
                      isGrade7Mode
                        ? 'Contoh: 01 - 7E atau 15 - 7G'
                        : 'Contoh: 01 - 8G atau 1 - 8A'
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-[#1a1a1a] font-mono-code text-sm text-[#1a1a1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e59e6]"
                  />
                </div>
                <p className="font-mono-code text-[11px] text-slate-500 mt-1">
                  *Format: <span className="font-bold text-[#1a1a1a]">[No Absen] - [Kelas]</span>{' '}
                  {isGrade7Mode ? (
                    <>
                      (contoh: <code className="bg-slate-100 px-1 py-0.5 border">01 - 7E</code>,{' '}
                      <code className="bg-slate-100 px-1 py-0.5 border">10 - 7F</code>,{' '}
                      <code className="bg-slate-100 px-1 py-0.5 border">15 - 7G</code>,{' '}
                      <code className="bg-slate-100 px-1 py-0.5 border">20 - 7H</code>)
                    </>
                  ) : (
                    <>
                      (contoh: <code className="bg-slate-100 px-1 py-0.5 border">01 - 8G</code>,{' '}
                      <code className="bg-slate-100 px-1 py-0.5 border">1 - 8A</code>,{' '}
                      <code className="bg-slate-100 px-1 py-0.5 border">10 - 8C</code>)
                    </>
                  )}
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
                    placeholder={
                      isGrade7Mode
                        ? 'Masukkan NIPD Anda (contoh: 11929)'
                        : 'Masukkan NIPD Anda (contoh: 11690)'
                    }
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
                <span>
                  Bantuan Cepat Pilihan Siswa ({isGrade7Mode ? 'Kelas 7E - 7H' : 'Kelas 8A - 8H'}):
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase mb-1">Pilih Kelas:</label>
                  <select
                    value={quickClassSelect}
                    onChange={(e) => setQuickClassSelect(e.target.value)}
                    className="w-full p-2 bg-white border border-[#1a1a1a] font-mono-code text-xs"
                  >
                    {allowedClasses.map((c) => (
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
                    {Array.from(
                      { length: quickClassSelect === '7H' ? 31 : 32 },
                      (_, i) => String(i + 1)
                    ).map((num) => (
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
              <span>Petunjuk Akses Akun Siswa {isGrade7Mode ? 'Kelas 7 (7E - 7H)' : 'Kelas 8 (8A - 8H)'}:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
              <li>
                <strong>Username</strong>: Gabungan Nomor Absen dan Kelas dengan tanda strip (misal:{' '}
                {isGrade7Mode ? (
                  <>
                    <span className="font-bold text-[#2e59e6]">01 - 7E</span>,{' '}
                    <span className="font-bold text-[#2e59e6]">02 - 7F</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-[#2e59e6]">01 - 8G</span>,{' '}
                    <span className="font-bold text-[#2e59e6]">02 - 8A</span>
                  </>
                )}
                ).
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

        {/* Statistik Ringkasan Nilai Rata-Rata Per Kelas (Tampil juga di halaman awal /cek) */}
        {renderClassComparisonSection()}
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

          {/* Hasil Nilai ASTS Gasal - Informatika & Koding dan Kecerdasan Artifisial (KKA) (2026/2027) */}
          {astsInformatikaTasks.length > 0 &&
            astsInformatikaTasks.map((astsTask, astsIdx) => {
              const rawScore = astsTask.score;
              const numScore =
                rawScore !== null && rawScore !== undefined && rawScore !== ''
                  ? Number(rawScore)
                  : NaN;
              const hasValidScore = astsTask.isCompleted && !isNaN(numScore);
              const isTuntas = hasValidScore && numScore >= kktpAsts;
              const isKkaCard =
                astsTask.astsSubject === 'KKA' ||
                astsTask.taskName.toUpperCase().includes('KKA') ||
                astsTask.taskName.toUpperCase().includes('KODING');
              // Data rincian PG, Menjodohkan, dan Uraian diambil murni dari Halaman Kalkulator Master
              const breakdown = astsTask.astsBreakdown || null;

              return (
                <div
                  key={astsTask.id || astsIdx}
                  className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#2e59e6] p-4 sm:p-5 font-mono-code space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-block px-2 py-0.5 bg-[#2e59e6] text-white text-[10px] font-bold uppercase tracking-wider border border-[#1a1a1a]">
                          HASIL EVALUASI TENGAH SEMESTER
                        </span>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-[#1a1a1a] text-[10px] font-bold uppercase border border-[#1a1a1a]">
                          {isKkaCard ? 'MAPEL: KKA' : 'MAPEL: INFORMATIKA'}
                        </span>
                        <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold uppercase border border-amber-500">
                          KKTP: {kktpAsts}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-[#1a1a1a]">
                        {astsTask.taskName}
                      </h3>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Hasil nilai asesmen untuk <strong>{activeStudent.name}</strong> ({activeStudent.className} • Absen {activeStudent.attendanceNo})
                      </p>
                    </div>

                    <div className="flex flex-wrap items-stretch gap-3">
                      {hasValidScore ? (
                        <>
                          {/* Box Nilai Anda */}
                          <div className="px-5 py-2.5 bg-[#FAF8F5] border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-center flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              NILAI ANDA
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-[#2e59e6]">
                              {numScore}
                            </span>
                          </div>

                          {/* Box Keterangan (TUNTAS >=75 / REMEDIAL <75) */}
                          <div className="px-4 py-2.5 bg-[#FAF8F5] border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-center flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                              KETERANGAN
                            </span>
                            {isTuntas ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border-2 border-emerald-600 text-xs font-black uppercase tracking-wide">
                                TUNTAS (≥{kktpAsts})
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-rose-100 text-rose-900 border-2 border-rose-600 text-xs font-black uppercase tracking-wide">
                                REMEDIAL (&lt;{kktpAsts})
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="px-4 py-2 bg-rose-50 border-2 border-rose-600 text-rose-900 font-bold text-xs flex items-center gap-1.5">
                          <XCircle className="h-4 w-4 text-rose-600" />
                          <span>BELUM ADA NILAI</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rincian Jumlah Benar PG, Menjodohkan, Uraian & Perhitungan Penilaian (Dari Kalkulator Master) */}
                  {hasValidScore && (
                    <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3.5 sm:p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 pb-2">
                        <span className="text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider">
                          RINCIAN PEROLEHAN NILAI & BOBOT PENILAIAN (DATA KALKULATOR MASTER):
                        </span>
                        <span className="text-[10px] font-bold text-[#2e59e6] bg-blue-50 px-2 py-0.5 border border-blue-300">
                          Rumus: (Benar PG × 2) + (Menjodohkan × 2,5) + Skor Uraian
                        </span>
                      </div>

                      {breakdown ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          {/* 1. Pilihan Ganda (PG) */}
                          <div className="bg-white border-2 border-[#1a1a1a] p-3 shadow-[2px_2px_0px_#1a1a1a] flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-slate-600 uppercase">
                                  1. PILIHAN GANDA (PG)
                                </span>
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 border border-slate-300">
                                  Maks 25 Soal
                                </span>
                              </div>
                              <div className="text-lg font-black text-[#1a1a1a]">
                                {breakdown.benarPG}{' '}
                                <span className="text-xs font-bold text-slate-500">
                                  / 25 Benar
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-dashed border-slate-200 text-[11px]">
                              <div className="text-slate-500">
                                Penilaian: <strong>Benar × 2</strong> (Maks 50)
                              </div>
                              <div className="font-bold text-[#2e59e6] mt-0.5">
                                Skor: {breakdown.benarPG} × 2 = {breakdown.skorPG} Poin
                              </div>
                            </div>
                          </div>

                          {/* 2. Menjodohkan */}
                          <div className="bg-white border-2 border-[#1a1a1a] p-3 shadow-[2px_2px_0px_#1a1a1a] flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-slate-600 uppercase">
                                  2. MENJODOHKAN
                                </span>
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 border border-slate-300">
                                  Maks 10 Soal
                                </span>
                              </div>
                              <div className="text-lg font-black text-[#1a1a1a]">
                                {breakdown.benarMJ}{' '}
                                <span className="text-xs font-bold text-slate-500">
                                  / 10 Benar
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-dashed border-slate-200 text-[11px]">
                              <div className="text-slate-500">
                                Penilaian: <strong>Benar × 2,5</strong> (Maks 25)
                              </div>
                              <div className="font-bold text-[#2e59e6] mt-0.5">
                                Skor: {breakdown.benarMJ} × 2,5 = {breakdown.skorMJ} Poin
                              </div>
                            </div>
                          </div>

                          {/* 3. Uraian */}
                          <div className="bg-white border-2 border-[#1a1a1a] p-3 shadow-[2px_2px_0px_#1a1a1a] flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-slate-600 uppercase">
                                  3. SKOR URAIAN
                                </span>
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 border border-slate-300">
                                  Maks 25 Poin
                                </span>
                              </div>
                              <div className="text-lg font-black text-[#1a1a1a]">
                                {breakdown.skorUraian}{' '}
                                <span className="text-xs font-bold text-slate-500">
                                  / 25 Poin
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-dashed border-slate-200 text-[11px]">
                              <div className="text-slate-500">
                                Penilaian: <strong>Skor Uraian Langsung</strong>
                              </div>
                              <div className="font-bold text-[#2e59e6] mt-0.5">
                                Skor: {breakdown.skorUraian} Poin
                              </div>
                            </div>
                          </div>

                          {/* 4. Total Perhitungan Nilai */}
                          <div className="bg-blue-50/70 border-2 border-[#2e59e6] p-3 shadow-[2px_2px_0px_#1a1a1a] flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-[#2e59e6] uppercase">
                                  4. TOTAL NILAI AKHIR
                                </span>
                                <span className="text-[9px] font-bold bg-[#2e59e6] text-white px-1.5 py-0.5">
                                  Skala 0-100
                                </span>
                              </div>
                              <div className="text-lg font-black text-[#2e59e6]">
                                {numScore}{' '}
                                <span className="text-[11px] font-bold text-slate-600">
                                  (Bulat: {breakdown.rawTotal})
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-dashed border-blue-300 text-[11px]">
                              <div className="text-slate-600">
                                Hitungan: <strong>{breakdown.skorPG} + {breakdown.skorMJ} + {breakdown.skorUraian}</strong>
                              </div>
                              <div className="font-bold text-[#1a1a1a] mt-0.5">
                                Total Akhir = {numScore}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-white border border-slate-300 text-xs text-slate-600">
                          Rincian jumlah benar Pilihan Ganda (PG), Menjodohkan, dan Skor Uraian untuk siswa ini belum diinput pada halaman <strong>Kalkulator Master</strong> (saat ini baru tersedia nilai akhir <strong>{numScore}</strong> dari Google Spreadsheets).
                        </div>
                      )}

                      {/* Keterangan Status Pelaksanaan Remedial (Tanpa Tombol Kuis Online) */}
                      {!isTuntas && (
                        <div
                          className={`p-3 border-2 text-xs flex items-start gap-2.5 ${
                            isKkaCard
                              ? 'bg-amber-50 border-amber-500 text-amber-950'
                              : 'bg-slate-100 border-[#1a1a1a] text-[#1a1a1a]'
                          }`}
                        >
                          <AlertCircle
                            className={`h-4 w-4 shrink-0 mt-0.5 ${
                              isKkaCard ? 'text-amber-700' : 'text-[#2e59e6]'
                            }`}
                          />
                          <div>
                            {isKkaCard ? (
                              <>
                                <span className="font-bold uppercase">
                                  Informasi Remedial Koding &amp; Kecerdasan Artifisial (KKA):{' '}
                                </span>
                                <span>
                                  Untuk mata pelajaran Koding dan Kecerdasan Artifisial (KKA), saat ini <strong>belum diadakan pelaksanaan remedial</strong>.
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="font-bold uppercase">
                                  Informasi Remedial Informatika:{' '}
                                </span>
                                <span>
                                  Pelaksanaan remedial untuk mata pelajaran Informatika saat ini dilakukan secara <strong>offline (tatap muka langsung)</strong> sesuai jadwal guru mata pelajaran.
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

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
                    <th className="py-3 px-4 w-64 text-center">STATUS PENGERJAAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {regularTasks.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-500 font-mono-code text-xs">
                        {isLoadingTasks
                          ? 'Sedang memuat data tugas langsung dari Google Spreadsheet...'
                          : 'Belum ada tugas yang terdaftar pada Google Spreadsheet untuk kelas ini.'}
                      </td>
                    </tr>
                  ) : (
                    regularTasks.map((task, idx) => (
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
                          <span className="font-bold text-[#1a1a1a] text-xs">
                            {task.taskName}
                          </span>
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
