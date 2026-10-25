import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  BookOpen,
  Play,
  ClipboardList,
  History,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Download,
  Upload,
  RefreshCw,
  FolderOpen,
  Award,
  HelpCircle,
  Eye,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ExcelTask,
  ExcelSubmission,
  ExcelWorkbookData,
  LearningDatasetItem,
  ExcelCellCheckResult,
} from '../../types/excelLab';
import { Student } from '../../types';
import { ALL_STUDENTS_DATABASE } from '../../data/studentsAll';
import {
  createBlankWorkbook,
  DEFAULT_EXCEL_TASKS,
  DEFAULT_LEARNING_DATASETS,
  EXCEL_FREE_PRACTICE_DRAFT_KEY,
  exportWorkbookToXlsx,
  fetchExcelLabDataFromServer,
  loadLocalExcelSubmissions,
  loadLocalExcelTasks,
  submitExcelTaskToServer,
} from '../../services/excelLabStore';
import { ExcelGridEditor } from './ExcelGridEditor';
import { ExcelFormulaGuideView } from './ExcelFormulaGuideView';
import { ExcelStudentTasksView } from './ExcelStudentTasksView';
import { ExcelTaskGuidePanel } from './ExcelTaskGuidePanel';
import { playNotificationChime } from '../../services/sound';

type ExcelLabSubTab = 'home' | 'guide' | 'practice' | 'tasks' | 'history';

interface ExcelLabStudentWorkspaceProps {
  onNavigateHome: () => void;
  onNavigateCek?: () => void;
  onNavigateKelas7?: () => void;
  initialTaskToOpen?: ExcelTask | null;
  /** Sub-tab yang dibuka pertama kali (mis. `guide` dari tautan /praktek?tool=excel&view=guide). */
  initialSubTab?: ExcelLabSubTab;
}

export const ExcelLabStudentWorkspace: React.FC<ExcelLabStudentWorkspaceProps> = ({
  onNavigateHome,
  onNavigateCek,
  onNavigateKelas7,
  initialTaskToOpen,
  initialSubTab = 'home',
}) => {
  // Navigation sub-tabs
  type TabType = ExcelLabSubTab;
  const [activeSubTab, setActiveSubTab] = useState<TabType>(initialSubTab);

  // Tasks & submissions state
  const [tasks, setTasks] = useState<ExcelTask[]>(() => loadLocalExcelTasks());
  const [submissions, setSubmissions] = useState<ExcelSubmission[]>(() => loadLocalExcelSubmissions());
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Student Identity state (Class & Attendance)
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    return localStorage.getItem('inforkoding_student_class') || 'Kelas 7E';
  });
  const [selectedAttendanceNo, setSelectedAttendanceNo] = useState<number>(() => {
    const raw = localStorage.getItem('inforkoding_student_attendance');
    return raw ? parseInt(raw, 10) : 1;
  });

  // Resolve authentic student from database
  const currentStudent: Student | null = useMemo(() => {
    const found = ALL_STUDENTS_DATABASE.find(
      (s) =>
        s.className.toUpperCase() === selectedClass.toUpperCase() &&
        Number(s.attendanceNo) === Number(selectedAttendanceNo)
    );
    return found || null;
  }, [selectedClass, selectedAttendanceNo]);

  // Save selected student to local storage for convenience
  useEffect(() => {
    localStorage.setItem('inforkoding_student_class', selectedClass);
    localStorage.setItem('inforkoding_student_attendance', String(selectedAttendanceNo));
  }, [selectedClass, selectedAttendanceNo]);

  // Practice workbook state
  const [practiceWorkbook, setPracticeWorkbook] = useState<ExcelWorkbookData>(() => {
    try {
      const draft = localStorage.getItem(EXCEL_FREE_PRACTICE_DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && Array.isArray(parsed.sheets) && parsed.sheets.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return createBlankWorkbook('Lembar Kerja Praktik Bebas');
  });

  // Auto-save practice workbook draft
  useEffect(() => {
    try {
      localStorage.setItem(EXCEL_FREE_PRACTICE_DRAFT_KEY, JSON.stringify(practiceWorkbook));
    } catch {
      // ignore
    }
  }, [practiceWorkbook]);

  // Active Task Working State
  const [activeWorkingTask, setActiveWorkingTask] = useState<ExcelTask | null>(initialTaskToOpen || null);
  const [taskWorkbook, setTaskWorkbook] = useState<ExcelWorkbookData | null>(
    initialTaskToOpen ? initialTaskToOpen.starterWorkbook : null
  );
  const [isSubmittingTask, setIsSubmittingTask] = useState<boolean>(false);

  // Snapshot Inspection Modal state (for History tab)
  const [inspectedSubmission, setInspectedSubmission] = useState<ExcelSubmission | null>(null);

  // Learning Dataset Selector Modal
  const [showDatasetModal, setShowDatasetModal] = useState<boolean>(false);

  // Fetch updated data from server on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingData(true);
    fetchExcelLabDataFromServer()
      .then((data) => {
        if (isMounted) {
          if (data.tasks.length > 0) setTasks(data.tasks);
          setSubmissions(data.submissions);
          setIsLoadingData(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter student's submissions
  const studentSubmissions = useMemo(() => {
    if (!currentStudent) return [];
    return submissions.filter(
      (s) =>
        s.className.toUpperCase() === currentStudent.className.toUpperCase() &&
        Number(s.attendanceNo) === Number(currentStudent.attendanceNo)
    );
  }, [submissions, currentStudent]);

  // Compute stats for student
  const studentStats = useMemo(() => {
    const totalAssigned = tasks.filter((t) => t.isActive).length;
    const completedCount = studentSubmissions.length;
    const passedCount = studentSubmissions.filter((s) => s.isPassed).length;
    const avgScore =
      completedCount > 0
        ? Math.round(studentSubmissions.reduce((acc, s) => acc + s.finalScore, 0) / completedCount)
        : 0;

    return { totalAssigned, completedCount, passedCount, avgScore };
  }, [tasks, studentSubmissions]);

  // Available classes (Kelas 7 at the top for primary Kelas 7 hub)
  const availableClasses = [
    'Kelas 7E', 'Kelas 7F', 'Kelas 7G', 'Kelas 7H',
    'Kelas 8A', 'Kelas 8B', 'Kelas 8C', 'Kelas 8D',
    'Kelas 8E', 'Kelas 8F', 'Kelas 8G', 'Kelas 8H',
  ];

  // Max attendance in selected class
  const maxAttendance = useMemo(() => {
    const classStudents = ALL_STUDENTS_DATABASE.filter(
      (s) => s.className.toUpperCase() === selectedClass.toUpperCase()
    );
    return Math.max(classStudents.length, 32);
  }, [selectedClass]);

  // Handle start working on a task
  const handleSelectTaskToWork = (task: ExcelTask) => {
    // Check if student has previous submission draft or starter
    const prevSub = submissions.find(
      (s) =>
        s.taskId === task.id &&
        s.className === currentStudent?.className &&
        Number(s.attendanceNo) === Number(currentStudent?.attendanceNo)
    );

    setActiveWorkingTask(task);
    setTaskWorkbook(prevSub ? prevSub.workbookSnapshot : task.starterWorkbook);
    setActiveSubTab('tasks');
  };

  // Handle task submission
  const handleSubmitTask = async (score: number, results: ExcelCellCheckResult[]) => {
    if (!activeWorkingTask || !taskWorkbook || !currentStudent) return;
    setIsSubmittingTask(true);

    const prevSubmissionsForThisTask = submissions.filter(
      (s) =>
        s.taskId === activeWorkingTask.id &&
        s.className === currentStudent.className &&
        Number(s.attendanceNo) === Number(currentStudent.attendanceNo)
    );

    const submission: ExcelSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      taskId: activeWorkingTask.id,
      taskTitle: activeWorkingTask.title,
      className: currentStudent.className,
      attendanceNo: Number(currentStudent.attendanceNo),
      studentName: currentStudent.name,
      nis: currentStudent.nis,
      submittedAt: new Date().toLocaleString('id-ID'),
      workbookSnapshot: taskWorkbook,
      evaluationResults: results,
      autoScore: score,
      finalScore: score,
      isPassed: score >= (activeWorkingTask.kktp || 75),
      attemptNumber: prevSubmissionsForThisTask.length + 1,
    };

    const res = await submitExcelTaskToServer(submission);
    setSubmissions(res.submissions);
    setIsSubmittingTask(false);
    setActiveWorkingTask(null);
    setTaskWorkbook(null);
    setActiveSubTab('history');
  };

  // Handle load dataset into practice editor
  const handleLoadDataset = (dataset: LearningDatasetItem) => {
    setPracticeWorkbook(dataset.workbook);
    setShowDatasetModal(false);
    setActiveSubTab('practice');
    playNotificationChime();
  };

  // Handle try formula guide in practice editor
  const handleTryFormulaInPractice = (sampleWb: ExcelWorkbookData) => {
    setPracticeWorkbook(sampleWb);
    setActiveSubTab('practice');
  };

  return (
    <div className="min-h-screen bg-[#F2EFEB] flex flex-col font-sans select-none pb-12">
      {/* Top Header Navigation */}
      <header className="bg-white border-b-2 border-[#1a1a1a] px-4 sm:px-6 py-3 shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Module Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#107c41] border border-[#1a1a1a] flex items-center justify-center text-white font-bold shadow-[2px_2px_0px_#1a1a1a]">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <div className="font-mono-code text-[10px] font-bold tracking-widest text-[#107c41] uppercase">
                  [ LABORATORIUM SPREADSHEET ]
                </div>
                <h1 className="font-serif-display italic font-bold text-xl sm:text-2xl text-[#1a1a1a] leading-none">
                  Laboratorium Excel
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Navigation Subtabs */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-200 flex items-center overflow-x-auto gap-1 font-mono-code text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveWorkingTask(null);
              setActiveSubTab('home');
            }}
            className={`px-3.5 py-1.5 font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
              activeSubTab === 'home' && !activeWorkingTask
                ? 'bg-[#107c41] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Beranda Laboratorium</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveWorkingTask(null);
              setActiveSubTab('guide');
            }}
            className={`px-3.5 py-1.5 font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
              activeSubTab === 'guide'
                ? 'bg-[#107c41] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Materi & Panduan Rumus</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveWorkingTask(null);
              setActiveSubTab('practice');
            }}
            className={`px-3.5 py-1.5 font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
              activeSubTab === 'practice'
                ? 'bg-[#107c41] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            <span>Praktik Bebas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tasks')}
            className={`px-3.5 py-1.5 font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
              activeSubTab === 'tasks'
                ? 'bg-[#107c41] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Tugas Laboratorium</span>
            {tasks.length > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-xs font-mono-code font-bold ${
                activeSubTab === 'tasks' ? 'bg-white text-[#107c41]' : 'bg-slate-200 text-slate-800'
              }`}>
                {tasks.length}
              </span>
            )}
          </button>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {/* ==================================================================== */}
        {/* SUBTAB 1: BERANDA LABORATURIUM                                      */}
        {/* ==================================================================== */}
        {activeSubTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Hero Welcome Banner */}
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 font-mono-code text-xs text-[#107c41] font-bold uppercase mb-1">
                    <Sparkles className="h-4 w-4" />
                    <span>MODUL INTERAKTIF SPREADSHEET TINGKAT SMP</span>
                  </div>
                  <h2 className="font-serif-display italic font-bold text-3xl sm:text-5xl text-[#1a1a1a]">
                    Selamat Datang di Laboratorium Excel
                  </h2>
                  <p className="font-sans text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
                    Kuasai keterampilan pengolahan data angka, kalkulasi formula otomatis (SUM, AVERAGE, MIN, MAX), logika IF, serta pencarian VLOOKUP secara langsung melalui spreadsheet interaktif standar kurikulum Informatika & Koding SMP.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 font-mono-code text-xs">
              {/* Card 1: Praktik Bebas */}
              <div
                onClick={() => setActiveSubTab('practice')}
                className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 hover:translate-y-[-2px] transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 border border-[#1a1a1a] flex items-center justify-center font-bold mb-3 shadow-[2px_2px_0px_#000]">
                    <Play className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base text-[#1a1a1a] font-sans group-hover:text-[#107c41] transition-colors">
                    Praktik Bebas Spreadsheet
                  </h3>
                  <p className="font-sans text-xs text-slate-600 mt-2 leading-relaxed">
                    Buka lembar kerja spreadsheet kosong untuk menulis formula, memformat tabel angka, atau mengimpor data file .xlsx dari komputermu.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[#107c41] font-bold">
                  <span>Buka Editor Bebas</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* Card 2: Tugas Laboratorium */}
              <div
                onClick={() => setActiveSubTab('tasks')}
                className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 hover:translate-y-[-2px] transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-800 border border-[#1a1a1a] flex items-center justify-center font-bold mb-3 shadow-[2px_2px_0px_#000]">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base text-[#1a1a1a] font-sans group-hover:text-[#107c41] transition-colors">
                    Tugas & Tantangan Lab
                  </h3>
                  <p className="font-sans text-xs text-slate-600 mt-2 leading-relaxed">
                    Selesaikan paket tugas praktikum terstruktur dengan instruksi langkah-demi-langkah dan validasi penilaian otomatis.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[#107c41] font-bold">
                  <span>Lihat {tasks.length} Paket Tugas</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* Card 3: Materi Panduan Rumus */}
              <div
                onClick={() => setActiveSubTab('guide')}
                className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 hover:translate-y-[-2px] transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 bg-amber-100 text-amber-800 border border-[#1a1a1a] flex items-center justify-center font-bold mb-3 shadow-[2px_2px_0px_#000]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base text-[#1a1a1a] font-sans group-hover:text-[#107c41] transition-colors">
                    Ensiklopedia Rumus Excel
                  </h3>
                  <p className="font-sans text-xs text-slate-600 mt-2 leading-relaxed">
                    Pelajari aturan sintaks parameter, contoh rumus siap pakai, dan tips praktis penggunaan fungsi spreadsheet sekolah.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[#107c41] font-bold">
                  <span>Buka Panduan Rumus</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* Card 4: Dataset Pembelajaran */}
              <div
                onClick={() => setShowDatasetModal(true)}
                className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 hover:translate-y-[-2px] transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 bg-purple-100 text-purple-800 border border-[#1a1a1a] flex items-center justify-center font-bold mb-3 shadow-[2px_2px_0px_#000]">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base text-[#1a1a1a] font-sans group-hover:text-[#107c41] transition-colors">
                    Dataset Pembelajaran
                  </h3>
                  <p className="font-sans text-xs text-slate-600 mt-2 leading-relaxed">
                    Eksplorasi kumpulan data autentik sekolah: Kas Koperasi, Rekap Nilai Siswa, Inventaris Hardware Lab, dan Presensi Kelas.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[#107c41] font-bold">
                  <span>Pilih Dataset</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Formula Cheat-Sheet Bar */}
            <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-5 shadow-[4px_4px_0px_#1a1a1a] font-mono-code">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-xs uppercase text-slate-700 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-[#107c41]" />
                  <span>Kamus Cepat Rumus Excel Populer (SMP):</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('guide')}
                  className="text-xs text-[#107c41] font-bold hover:underline cursor-pointer"
                >
                  Lihat Selengkapnya →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-white border border-slate-300">
                  <strong className="text-[#107c41] block">=SUM(rentang)</strong>
                  <span className="text-slate-600 text-[11px] font-sans">Menjumlahkan total seluruh angka pada rentang sel.</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-300">
                  <strong className="text-[#107c41] block">=AVERAGE(rentang)</strong>
                  <span className="text-slate-600 text-[11px] font-sans">Menghitung nilai rata-rata aritmatika dari rentang sel.</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-300">
                  <strong className="text-[#107c41] block">=IF(kondisi, jika_benar, jika_salah)</strong>
                  <span className="text-slate-600 text-[11px] font-sans">Uji kelulusan, misal =IF(G4&gt;=75, "LULUS", "REMEDIAL").</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-300">
                  <strong className="text-[#107c41] block">=COUNTIF(rentang, kriteria)</strong>
                  <span className="text-slate-600 text-[11px] font-sans">Menghitung jumlah sel yang memenuhi syarat, misal "LULUS".</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-300">
                  <strong className="text-[#107c41] block">=SUMIF(rentang_syarat, kriteria, rentang_jumlah)</strong>
                  <span className="text-slate-600 text-[11px] font-sans">Menjumlahkan hanya sel yang memenuhi kategori tertentu.</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-300">
                  <strong className="text-[#107c41] block">=VLOOKUP(kunci, tabel, kolom, FALSE)</strong>
                  <span className="text-slate-600 text-[11px] font-sans">Mencari data vertikal berdasarkan kode referensi.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SUBTAB 2: MATERI & PANDUAN RUMUS                                     */}
        {/* ==================================================================== */}
        {activeSubTab === 'guide' && (
          <ExcelFormulaGuideView onTryFormulaInPlayground={handleTryFormulaInPractice} />
        )}

        {/* ==================================================================== */}
        {/* SUBTAB 3: PRAKTIK BEBAS (FULL-WIDTH SPREADSHEET EDITOR)              */}
        {/* ==================================================================== */}
        {activeSubTab === 'practice' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header info bar */}
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono-code text-xs">
              <div className="flex items-center space-x-2">
                <Play className="h-4 w-4 text-[#107c41]" />
                <span className="font-bold text-[#1a1a1a] uppercase text-sm">
                  Lembar Kerja Praktik Bebas
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-[#107c41] border border-emerald-300 text-[10px] font-bold">
                  Draf Tersimpan Otomatis
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDatasetModal(true)}
                  className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-slate-200 text-[#1a1a1a] font-bold border border-[#1a1a1a] flex items-center gap-1 cursor-pointer"
                  title="Muat dataset pembelajaran siap pakai"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-purple-700" />
                  <span>Buka Dataset</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin mengosongkan lembar kerja dan memulai baru?')) {
                      setPracticeWorkbook(createBlankWorkbook('Lembar Kerja Baru'));
                    }
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 font-bold border border-rose-300 flex items-center gap-1 cursor-pointer"
                  title="Mulai lembar kerja kosong baru"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Dedicated full-width interactive spreadsheet */}
            <div className="h-[750px] bg-white border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] overflow-hidden">
              <ExcelGridEditor
                workbook={practiceWorkbook}
                onChange={setPracticeWorkbook}
              />
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SUBTAB 4: TUGAS LABORATORIUM                                         */}
        {/* ==================================================================== */}
        {activeSubTab === 'tasks' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* If NO task is currently open for working: Show Tasks List */}
            {!activeWorkingTask && (
              <ExcelStudentTasksView
                tasks={tasks.filter((t) => t.isActive)}
                submissions={submissions}
                currentStudent={currentStudent}
                onSelectTaskToWork={handleSelectTaskToWork}
                onViewSubmissionSnapshot={(sub) => {
                  setInspectedSubmission(sub);
                  setActiveSubTab('history');
                }}
              />
            )}

            {/* If a Task IS active: Render Dedicated Workspace + Guide/Evaluation Panel */}
            {activeWorkingTask && taskWorkbook && (
              <div className="space-y-3">
                {/* Task Working Header Bar */}
                <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-3 sm:p-4 flex items-center justify-between gap-3 font-mono-code text-xs">
                  <div className="flex items-center space-x-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Keluar dari pengerjaan tugas? Progres pengerjaan tersimpan di lembar kerja ini.')) {
                          setActiveWorkingTask(null);
                          setTaskWorkbook(null);
                        }
                      }}
                      className="p-1.5 bg-[#FAF8F5] hover:bg-slate-200 border border-[#1a1a1a] text-[#1a1a1a] cursor-pointer shrink-0"
                      title="Kembali ke Daftar Tugas"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="min-w-0 truncate">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">SEDANG MENGERJAKAN:</span>
                      <h2 className="font-bold text-sm sm:text-base text-[#1a1a1a] font-sans truncate">
                        {activeWorkingTask.title}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[11px] hidden sm:inline-block">
                      KKTP: {activeWorkingTask.kktp} Poin
                    </span>
                  </div>
                </div>

                {/* Full-width Workspace with Embedded Guide Panel */}
                <div className="h-[750px] bg-white border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] flex overflow-hidden">
                  {/* Grid Editor (takes remaining space) */}
                  <div className="flex-1 h-full min-w-0">
                    <ExcelGridEditor
                      workbook={taskWorkbook}
                      onChange={setTaskWorkbook}
                      highlightCells={(() => {
                        const highlights: Record<string, string> = {};
                        activeWorkingTask.targetEvaluations.forEach((item) => {
                          highlights[item.cellRef.toUpperCase()] = 'ring-2 ring-blue-500 bg-blue-50/50';
                        });
                        return highlights;
                      })()}
                    />
                  </div>

                  {/* Task Evaluation Guide Panel */}
                  <ExcelTaskGuidePanel
                    task={activeWorkingTask}
                    workbook={taskWorkbook}
                    onSubmit={handleSubmitTask}
                    isSubmitting={isSubmittingTask}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* SUBTAB 5: RIWAYAT NILAI & UMPAN BALIK                                */}
        {/* ==================================================================== */}
        {activeSubTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] p-5 sm:p-7">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-mono-code text-xs text-[#107c41] font-bold uppercase mb-1">
                    <History className="h-4 w-4" />
                    <span>DOKUMENTASI NILAI & ARSIP PENGERJAAN SISWA</span>
                  </div>
                  <h2 className="font-serif-display italic font-bold text-3xl sm:text-4xl text-[#1a1a1a]">
                    Riwayat Nilai & Umpan Balik Guru
                  </h2>
                  <p className="font-sans text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Periksa rekap nilai tugas yang telah Anda kumpulkan, ulasan dan catatan guru, serta rincian validasi setiap rumus yang telah diuji.
                  </p>
                </div>

                {currentStudent && (
                  <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3 font-mono-code text-xs shrink-0 shadow-[2px_2px_0px_#1a1a1a]">
                    <span className="text-[10px] text-slate-500 uppercase block">Peserta:</span>
                    <strong className="text-[#107c41] font-bold text-sm block">{currentStudent.name}</strong>
                    <span className="text-slate-600">
                      {currentStudent.className} · Absen {currentStudent.attendanceNo}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Submissions List */}
            {studentSubmissions.length === 0 ? (
              <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-12 text-center font-mono-code space-y-3">
                <AlertCircle className="h-10 w-10 text-slate-400 mx-auto" />
                <h3 className="font-bold text-base text-[#1a1a1a]">Belum Ada Tugas yang Dikumpulkan</h3>
                <p className="font-sans text-xs text-slate-600 max-w-md mx-auto">
                  Anda belum menyelesaikan atau mengumpulkan tugas laboratorium Excel. Pilih tugas di tab <strong>"Tugas Laboratorium"</strong> untuk mulai mengerjakan.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('tasks')}
                  className="px-4 py-2 bg-[#107c41] hover:bg-emerald-700 text-white font-bold text-xs border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#000] cursor-pointer transition-all inline-flex items-center gap-1.5"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>Lihat Daftar Tugas Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {studentSubmissions.map((sub) => {
                  const matchingTask = tasks.find((t) => t.id === sub.taskId);
                  const isPassed = sub.finalScore >= (matchingTask?.kktp || 75);

                  return (
                    <div
                      key={sub.id}
                      className={`bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 font-mono-code transition-all ${
                        isPassed ? 'border-l-8 border-l-emerald-600' : 'border-l-8 border-l-amber-500'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold uppercase border border-slate-300">
                              {sub.className} · Absen {sub.attendanceNo}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Waktu Pengumpulan: {sub.submittedAt} (Percobaan ke-{sub.attemptNumber})
                            </span>
                          </div>

                          <h3 className="font-bold text-lg text-[#1a1a1a] font-sans">
                            {sub.taskTitle}
                          </h3>

                          {/* Evaluation Breakdown pills */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-bold text-slate-600 mr-1">Hasil Evaluasi Sel:</span>
                            {sub.evaluationResults.map((evalRes) => (
                              <span
                                key={evalRes.evaluationId}
                                className={`px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1 ${
                                  evalRes.pointsEarned === evalRes.maxPoints
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                    : evalRes.pointsEarned > 0
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : 'bg-rose-50 text-rose-900 border-rose-300'
                                }`}
                              >
                                <span>{evalRes.cellRef}:</span>
                                <span>{evalRes.pointsEarned}/{evalRes.maxPoints} Poin</span>
                              </span>
                            ))}
                          </div>

                          {/* Teacher feedback note if available */}
                          {sub.teacherFeedback && (
                            <div className="p-3 bg-blue-50 border border-blue-200 text-xs font-sans text-blue-950 mt-2">
                              <span className="font-bold font-mono-code text-[11px] text-blue-800 block">
                                Catatan / Ulasan Guru ({sub.gradedBy || 'Guru Informatika'}):
                              </span>
                              <p className="mt-0.5 italic leading-relaxed">"{sub.teacherFeedback}"</p>
                              {sub.gradedAt && (
                                <span className="text-[10px] text-blue-700 block mt-1">
                                  Diperiksa pada: {sub.gradedAt}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Score Badge and Action buttons */}
                        <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase font-bold">NILAI AKHIR:</div>
                            <div className={`text-3xl font-black ${isPassed ? 'text-emerald-700' : 'text-amber-600'}`}>
                              {sub.finalScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
                            </div>
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase mt-1 ${
                              isPassed ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {isPassed ? 'TUNTAS KKTP' : 'PERLU PERBAIKAN'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setInspectedSubmission(sub)}
                              className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-slate-200 text-[#1a1a1a] font-bold text-xs border border-[#1a1a1a] flex items-center gap-1 cursor-pointer transition-all shadow-[2px_2px_0px_#000]"
                              title="Buka snapshot lembar kerja yang dikumpulkan"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Lihat Snapshot</span>
                            </button>

                            {matchingTask && matchingTask.allowResubmission && (
                              <button
                                type="button"
                                onClick={() => handleSelectTaskToWork(matchingTask)}
                                className="px-3 py-1.5 bg-[#107c41] hover:bg-emerald-700 text-white font-bold text-xs border border-[#1a1a1a] flex items-center gap-1 cursor-pointer transition-all shadow-[2px_2px_0px_#000]"
                                title="Kerjakan ulang tugas untuk memperbaiki nilai"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Kerjakan Ulang</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* MODAL: INSPECT SUBMISSION SNAPSHOT (READ-ONLY)                       */}
      {/* ==================================================================== */}
      {inspectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#000] w-full max-w-6xl h-[85vh] flex flex-col font-mono-code">
            {/* Modal Header */}
            <div className="bg-[#1a1a1a] text-white p-3 sm:p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                    [ ARSIP IMMUTABLE ] SNAPSHOT LEMBAR KERJA SISWA
                  </span>
                  <h3 className="font-bold text-base font-sans">{inspectedSubmission.taskTitle}</h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-bold hidden sm:inline">
                  Nilai: {inspectedSubmission.finalScore}/100
                </span>
                <button
                  type="button"
                  onClick={() => setInspectedSubmission(null)}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white hover:text-[#1a1a1a] text-white text-xs font-bold border border-white/40 cursor-pointer transition-all"
                >
                  TUTUP [ESC]
                </button>
              </div>
            </div>

            {/* Modal Subheader info */}
            <div className="p-3 bg-[#FAF8F5] border-b border-slate-300 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
              <span className="text-slate-700">
                Siswa: <strong>{inspectedSubmission.studentName}</strong> ({inspectedSubmission.className} · Absen {inspectedSubmission.attendanceNo})
              </span>
              <span className="text-slate-500">
                Dikumpulkan pada: {inspectedSubmission.submittedAt} (Percobaan ke-{inspectedSubmission.attemptNumber})
              </span>
            </div>

            {/* Grid Snapshot (Read-Only) */}
            <div className="flex-1 overflow-hidden min-h-0">
              <ExcelGridEditor
                workbook={inspectedSubmission.workbookSnapshot}
                onChange={() => {}}
                isReadOnly={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: LEARNING DATASETS CHOOSER                                     */}
      {/* ==================================================================== */}
      {showDatasetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#000] w-full max-w-3xl max-h-[85vh] flex flex-col font-mono-code">
            {/* Modal Header */}
            <div className="p-4 bg-[#107c41] text-white flex items-center justify-between shrink-0 border-b-2 border-[#1a1a1a]">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5" />
                <h3 className="font-bold text-base font-sans uppercase">
                  Pilih Dataset Pembelajaran Siap Pakai
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDatasetModal(false)}
                className="text-white hover:bg-white/20 px-2 py-1 text-xs font-bold cursor-pointer"
              >
                ✕ TUTUP
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <p className="font-sans text-xs text-slate-600 leading-relaxed">
                Pilih salah satu dataset autentik sekolah di bawah ini untuk langsung dimuat ke lembar kerja <strong>Praktik Bebas</strong>. Anda dapat mencoba menghitung rumus, memfilter, atau menganalisis data tabel.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEFAULT_LEARNING_DATASETS.map((ds) => (
                  <div
                    key={ds.id}
                    className="p-4 bg-[#FAF8F5] border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold mb-1">
                        <span>{ds.category}</span>
                        <span>{ds.rowCount} Baris · {ds.colCount} Kolom</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#1a1a1a] font-sans">{ds.title}</h4>
                      <p className="font-sans text-xs text-slate-600 mt-1 leading-relaxed">
                        {ds.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLoadDataset(ds)}
                      className="w-full py-2 px-3 bg-[#107c41] hover:bg-emerald-700 text-white font-bold text-xs border border-[#1a1a1a] shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Muat Dataset ke Lembar Kerja</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
