import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Award,
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  RefreshCw,
  FolderOpen,
  BookOpen,
  Calendar,
  Save,
  X,
  Play,
  RotateCcw,
  BarChart3,
  Check,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  ExcelTask,
  ExcelSubmission,
  ExcelWorkbookData,
  LearningDatasetItem,
  ExcelTargetEvaluation,
} from '../../types/excelLab';
import {
  createBlankWorkbook,
  createBlankSheet,
  DEFAULT_EXCEL_TASKS,
  DEFAULT_LEARNING_DATASETS,
  exportWorkbookToXlsx,
  fetchExcelLabDataFromServer,
  gradeExcelSubmissionOnServer,
  loadLocalExcelSubmissions,
  loadLocalExcelTasks,
  resetExcelSubmissionOnServer,
  saveExcelTaskToServer,
  deleteExcelTaskOnServer,
} from '../../services/excelLabStore';
import { ALL_STUDENTS_DATABASE } from '../../data/studentsAll';
import { ExcelGridEditor } from './ExcelGridEditor';
import { playNotificationChime } from '../../services/sound';

interface ExcelLabMasterViewProps {
  onNavigateTab?: (tab: any, path?: string) => void;
  spreadsheetUrl?: string;
}

export const ExcelLabMasterView: React.FC<ExcelLabMasterViewProps> = ({
  onNavigateTab,
  spreadsheetUrl,
}) => {
  // Navigation tabs for Master View
  type MasterTab = 'manage' | 'bank' | 'datasets' | 'review' | 'analytics';
  const [activeTab, setActiveTab] = useState<MasterTab>('manage');

  // Tasks & submissions state
  const [tasks, setTasks] = useState<ExcelTask[]>(() => loadLocalExcelTasks());
  const [submissions, setSubmissions] = useState<ExcelSubmission[]>(() => loadLocalExcelSubmissions());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filter states
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('Semua Kelas');
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('Semua Tugas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected submission to review / inspect
  const [reviewingSubmission, setReviewingSubmission] = useState<ExcelSubmission | null>(null);
  const [manualScoreInput, setManualScoreInput] = useState<number>(0);
  const [teacherFeedbackInput, setTeacherFeedbackInput] = useState<string>('');
  const [isSavingGrade, setIsSavingGrade] = useState<boolean>(false);

  // Task editor modal state (for Bank Soal)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<ExcelTask | null>(null);

  // Dataset preview modal state
  const [previewingDataset, setPreviewingDataset] = useState<LearningDatasetItem | null>(null);

  // Fetch from server on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchExcelLabDataFromServer()
      .then((data) => {
        if (isMounted) {
          if (data.tasks.length > 0) setTasks(data.tasks);
          setSubmissions(data.submissions);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update reviewing form when reviewingSubmission changes
  useEffect(() => {
    if (reviewingSubmission) {
      setManualScoreInput(reviewingSubmission.finalScore);
      setTeacherFeedbackInput(reviewingSubmission.teacherFeedback || '');
    }
  }, [reviewingSubmission]);

  // Available classes for filter
  const allClasses = [
    'Semua Kelas',
    'Kelas 8A', 'Kelas 8B', 'Kelas 8C', 'Kelas 8D',
    'Kelas 8E', 'Kelas 8F', 'Kelas 8G', 'Kelas 8H',
    'Kelas 7E', 'Kelas 7F', 'Kelas 7G', 'Kelas 7H',
  ];

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchClass =
        selectedClassFilter === 'Semua Kelas' ||
        sub.className.toUpperCase() === selectedClassFilter.toUpperCase();
      const matchTask =
        selectedTaskFilter === 'Semua Tugas' || sub.taskId === selectedTaskFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        sub.studentName.toLowerCase().includes(q) ||
        sub.nis.includes(q) ||
        sub.className.toLowerCase().includes(q) ||
        String(sub.attendanceNo).includes(q);

      return matchClass && matchTask && matchQuery;
    });
  }, [submissions, selectedClassFilter, selectedTaskFilter, searchQuery]);

  // Overall analytics stats
  const analyticsStats = useMemo(() => {
    const totalSubmissions = submissions.length;
    const avgScore =
      totalSubmissions > 0
        ? Math.round(submissions.reduce((acc, s) => acc + s.finalScore, 0) / totalSubmissions)
        : 0;
    const passedCount = submissions.filter((s) => s.isPassed).length;
    const passPercentage =
      totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;
    const highestScore =
      totalSubmissions > 0 ? Math.max(...submissions.map((s) => s.finalScore)) : 0;
    const lowestScore =
      totalSubmissions > 0 ? Math.min(...submissions.map((s) => s.finalScore)) : 0;

    return {
      totalSubmissions,
      avgScore,
      passedCount,
      passPercentage,
      highestScore,
      lowestScore,
    };
  }, [submissions]);

  // Class by class statistics
  const classBreakdown = useMemo(() => {
    const classList = [
      'Kelas 8A', 'Kelas 8B', 'Kelas 8C', 'Kelas 8D',
      'Kelas 8E', 'Kelas 8F', 'Kelas 8G', 'Kelas 8H',
      'Kelas 7E', 'Kelas 7F', 'Kelas 7G', 'Kelas 7H',
    ];

    return classList.map((cls) => {
      const classSubs = submissions.filter(
        (s) => s.className.toUpperCase() === cls.toUpperCase()
      );
      const subCount = classSubs.length;
      const avg =
        subCount > 0
          ? Math.round(classSubs.reduce((acc, s) => acc + s.finalScore, 0) / subCount)
          : 0;
      const passed = classSubs.filter((s) => s.isPassed).length;
      const rate = subCount > 0 ? Math.round((passed / subCount) * 100) : 0;

      return {
        className: cls,
        submissionCount: subCount,
        avgScore: avg,
        passedCount: passed,
        passRate: rate,
      };
    });
  }, [submissions]);

  // Toggle task active state
  const handleToggleTaskActive = async (task: ExcelTask) => {
    const updated = { ...task, isActive: !task.isActive, updatedAt: new Date().toLocaleDateString('id-ID') };
    const res = await saveExcelTaskToServer(updated);
    setTasks(res);
  };

  // Toggle task resubmission
  const handleToggleResubmission = async (task: ExcelTask) => {
    const updated = { ...task, allowResubmission: !task.allowResubmission, updatedAt: new Date().toLocaleDateString('id-ID') };
    const res = await saveExcelTaskToServer(updated);
    setTasks(res);
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
      const res = await deleteExcelTaskOnServer(taskId);
      setTasks(res);
    }
  };

  // Save reviewed grade & teacher feedback
  const handleSaveReviewedGrade = async () => {
    if (!reviewingSubmission) return;
    setIsSavingGrade(true);
    const updated = await gradeExcelSubmissionOnServer(
      reviewingSubmission.id,
      manualScoreInput,
      teacherFeedbackInput,
      'Guru Informatika (Panel Master)'
    );
    setSubmissions(updated);
    setIsSavingGrade(false);
    setReviewingSubmission(null);
    playNotificationChime();
  };

  // Reset student submission (allow resubmit)
  const handleResetStudentSubmission = async (submissionId: string) => {
    if (confirm('Izinkan siswa mengerjakan ulang? Rekaman pengumpulan saat ini akan diarsipkan/dibersihkan.')) {
      const updated = await resetExcelSubmissionOnServer(submissionId);
      setSubmissions(updated);
      setReviewingSubmission(null);
    }
  };

  // Export full grade recap to Excel file (.xlsx)
  const handleExportGradeRecapToXlsx = () => {
    const wb = XLSX.utils.book_new();

    // 1. Sheet Rekap Nilai Siswa
    const rows: any[][] = [
      ['REKAPITULASI NILAI TUGAS LABORATORIUM EXCEL - SMP NEGERI 1 WEDI'],
      ['Tanggal Unduh: ' + new Date().toLocaleString('id-ID')],
      [],
      [
        'NO',
        'KELAS',
        'ABSEN',
        'NIS',
        'NAMA SISWA',
        'JUDUL TUGAS',
        'NILAI OTOMATIS',
        'NILAI AKHIR',
        'STATUS KKTP (?75)',
        'WAKTU PENGUMPULAN',
        'CATATAN GURU',
      ],
    ];

    submissions.forEach((sub, idx) => {
      rows.push([
        idx + 1,
        sub.className,
        sub.attendanceNo,
        sub.nis,
        sub.studentName,
        sub.taskTitle,
        sub.autoScore,
        sub.finalScore,
        sub.finalScore >= 75 ? 'TUNTAS' : 'REMEDIAL',
        sub.submittedAt,
        sub.teacherFeedback || '-',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Nilai_Siswa');

    // 2. Sheet Analisis Kelas
    const classRows: any[][] = [
      ['ANALISIS CAPAIAN NILAI PER KELAS - LABORATORIUM EXCEL'],
      [],
      ['KELAS', 'TOTAL SISWA KUMPUL', 'RATA-RATA NILAI', 'JUMLAH TUNTAS', 'PERSENTASE KELULUSAN (%)'],
    ];

    classBreakdown.forEach((cb) => {
      classRows.push([
        cb.className,
        cb.submissionCount,
        cb.avgScore,
        cb.passedCount,
        `${cb.passRate}%`,
      ]);
    });

    const wsClass = XLSX.utils.aoa_to_sheet(classRows);
    XLSX.utils.book_append_sheet(wb, wsClass, 'Analisis_Per_Kelas');

    XLSX.writeFile(wb, `Rekap_Nilai_Lab_Excel_SMPN1Wedi_${Date.now()}.xlsx`);
  };

  // Open modal to create new task
  const handleOpenCreateTask = () => {
    const newTask: ExcelTask = {
      id: `task-excel-${Date.now()}`,
      title: 'Tugas Baru: Analisis Data Spreadsheet',
      category: 'Dasar',
      gradeLevel: 'ALL',
      targetClasses: [
        'Kelas 8A', 'Kelas 8B', 'Kelas 8C', 'Kelas 8D',
        'Kelas 8E', 'Kelas 8F', 'Kelas 8G', 'Kelas 8H',
        'Kelas 7E', 'Kelas 7F', 'Kelas 7G', 'Kelas 7H',
      ],
      description: 'Latihan pengolahan data angka dan penggunaan formula dasar spreadsheet.',
      instructions: [
        'Lengkapi tabel data sesuai petunjuk kolom.',
        'Gunakan rumus =SUM(...) untuk menghitung total.',
        'Gunakan rumus =AVERAGE(...) untuk menghitung rata-rata.',
      ],
      starterWorkbook: createBlankWorkbook('Starter Task'),
      targetEvaluations: [
        {
          id: `eval-${Date.now()}-1`,
          sheetName: 'Sheet1',
          cellRef: 'D10',
          description: 'Hitung total kolom D dengan =SUM(...)',
          expectedFormulaPatterns: ['^=SUM\\('],
          expectedValue: 100,
          points: 50,
          hint: 'Gunakan =SUM(...)',
        },
      ],
      maxScore: 100,
      kktp: 75,
      isActive: true,
      allowResubmission: true,
      createdAt: new Date().toLocaleDateString('id-ID'),
      updatedAt: new Date().toLocaleDateString('id-ID'),
    };
    setEditingTask(newTask);
    setIsTaskModalOpen(true);
  };

  // Open modal to edit existing task
  const handleOpenEditTask = (task: ExcelTask) => {
    setEditingTask({ ...task });
    setIsTaskModalOpen(true);
  };

  // Save task from modal
  const handleSaveTaskFromModal = async () => {
    if (!editingTask) return;
    const res = await saveExcelTaskToServer(editingTask);
    setTasks(res);
    setIsTaskModalOpen(false);
    setEditingTask(null);
    playNotificationChime();
  };

  return (
    <div className="space-y-6 font-mono-code text-xs select-none animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] p-5 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#107c41] font-bold uppercase mb-1">
              <FileSpreadsheet className="h-4 w-4" />
              <span>[ PANEL MASTER ADMINISTRATOR ] MODUL LABORATORIUM EXCEL</span>
            </div>
            <h1 className="font-serif-display italic font-bold text-3xl sm:text-4xl text-[#1a1a1a]">
              Pusat Kendali Laboratorium Excel
            </h1>
            <p className="font-sans text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Kelola penugasan lembar kerja interaktif, bank soal, dataset pembelajaran sekolah, pemeriksaan jawaban siswa beserta rekapitulasi penilaian otomatis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportGradeRecapToXlsx}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#000] cursor-pointer flex items-center gap-1.5 transition-all"
              title="Unduh seluruh rekap nilai siswa ke format Microsoft Excel (.xlsx)"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Rekap Nilai (.XLSX)</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateTask}
              className="px-3.5 py-2 bg-[#2e59e6] hover:bg-blue-700 text-white font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#000] cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Buat Tugas Baru</span>
            </button>
          </div>
        </div>

        {/* Master Navigation Sub-tabs */}
        <div className="mt-5 pt-3 border-t border-slate-200 flex items-center overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`px-3.5 py-2 font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
              activeTab === 'manage'
                ? 'bg-[#107c41] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                : 'bg-[#FAF8F5] text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>[01] Kelola Tugas Lab</span>
            <span className="px-1.5 py-0.2 bg-black/20 text-white text-[10px] rounded-xs">
              {tasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`px-3.5 py-2 font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
              activeTab === 'bank'
                ? 'bg-[#107c41] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                : 'bg-[#FAF8F5] text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>[02] Bank Soal & Target Rumus</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('datasets')}
            className={`px-3.5 py-2 font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
              activeTab === 'datasets'
                ? 'bg-[#107c41] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                : 'bg-[#FAF8F5] text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>[03] Dataset Pembelajaran</span>
            <span className="px-1.5 py-0.2 bg-black/20 text-white text-[10px] rounded-xs">
              {DEFAULT_LEARNING_DATASETS.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`px-3.5 py-2 font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
              activeTab === 'review'
                ? 'bg-[#107c41] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                : 'bg-[#FAF8F5] text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>[04] Pemeriksaan Jawaban Siswa</span>
            {submissions.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[10px] rounded-xs font-bold">
                {submissions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
              activeTab === 'analytics'
                ? 'bg-[#107c41] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                : 'bg-[#FAF8F5] text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>[05] Rekap & Analisis Nilai</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: KELOLA TUGAS LABORATORIUM                                    */}
      {/* ==================================================================== */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tasks.map((task) => {
              const taskSubmissions = submissions.filter((s) => s.taskId === task.id);
              const passedSubmissions = taskSubmissions.filter((s) => s.isPassed);

              return (
                <div
                  key={task.id}
                  className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Top Status Badges */}
                    <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-200">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold uppercase border border-slate-300">
                        {task.category}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase ${
                        task.isActive
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                          : 'bg-slate-100 text-slate-500 border-slate-300'
                      }`}>
                        {task.isActive ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-[#1a1a1a] font-sans mt-3">
                      {task.title}
                    </h3>
                    <p className="font-sans text-xs text-slate-600 mt-1 leading-relaxed">
                      {task.description}
                    </p>

                    {/* Stats */}
                    <div className="mt-3 p-2 bg-[#FAF8F5] border border-slate-300 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Target Sel Diuji:</span>
                        <strong className="text-[#107c41]">{task.targetEvaluations.length} Sel Rumus</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Siswa Mengumpulkan:</span>
                        <strong>{taskSubmissions.length} Siswa</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Tuntas KKTP (?{task.kktp}):</span>
                        <strong className="text-blue-700">{passedSubmissions.length} Siswa</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Izinkan Resubmit:</span>
                        <strong className={task.allowResubmission ? 'text-emerald-700' : 'text-slate-500'}>
                          {task.allowResubmission ? 'Ya' : 'Tidak'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskActive(task)}
                        className={`py-1.5 px-2 font-bold border border-[#1a1a1a] text-center cursor-pointer transition-all ${
                          task.isActive
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-950'
                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950'
                        }`}
                      >
                        {task.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleResubmission(task)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-[#1a1a1a] text-center cursor-pointer transition-all"
                        title="Atur izin pengerjaan ulang siswa"
                      >
                        {task.allowResubmission ? 'Kunci Resubmit' : 'Buka Resubmit'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTask(task)}
                        className="py-1.5 px-2 bg-white hover:bg-slate-100 text-[#1a1a1a] font-bold border border-[#1a1a1a] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit Soal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="py-1.5 px-2 bg-white hover:bg-rose-50 text-rose-700 font-bold border border-rose-300 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: BANK SOAL & TARGET EVALUASI RUMUS                            */}
      {/* ==================================================================== */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#1a1a1a] uppercase">
                Bank Soal Praktikum & Aturan Validasi Formula
              </h3>
              <p className="font-sans text-xs text-slate-600 mt-0.5">
                Setiap tugas memiliki sel target, pola rumus yang diizinkan (regex), nilai perhitungan ekspektasi, dan bobot poin otomatis.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateTask}
              className="px-3 py-1.5 bg-[#107c41] hover:bg-emerald-700 text-white font-bold border border-[#1a1a1a] flex items-center gap-1 cursor-pointer shadow-[2px_2px_0px_#000]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Paket Soal</span>
            </button>
          </div>

          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{task.category} ? KKTP {task.kktp}</span>
                    <h3 className="font-bold text-base text-[#1a1a1a] font-sans">{task.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEditTask(task)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-[#1a1a1a] font-bold text-xs flex items-center gap-1 cursor-pointer self-start"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Konfigurasi Target Soal</span>
                  </button>
                </div>

                {/* Instructions */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Instruksi Pengerjaan Siswa:
                  </span>
                  <ul className="list-disc pl-5 font-sans text-xs text-slate-700 space-y-1">
                    {task.instructions.map((inst, idx) => (
                      <li key={idx}>{inst}</li>
                    ))}
                  </ul>
                </div>

                {/* Target evaluations table */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Daftar Sel Target & Rumus Diuji ({task.targetEvaluations.length}):
                  </span>
                  <div className="border border-slate-300 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#FAF8F5] border-b border-slate-300">
                          <th className="p-2 border-r border-slate-300">Sel</th>
                          <th className="p-2 border-r border-slate-300">Deskripsi Uji</th>
                          <th className="p-2 border-r border-slate-300">Pola Rumus Diuji (Regex)</th>
                          <th className="p-2 border-r border-slate-300">Nilai Diharapkan</th>
                          <th className="p-2 border-r border-slate-300">Bobot</th>
                          <th className="p-2">Petunjuk (Hint)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {task.targetEvaluations.map((evalItem) => (
                          <tr key={evalItem.id} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="p-2 font-bold text-[#107c41] border-r border-slate-200">
                              {evalItem.cellRef}
                            </td>
                            <td className="p-2 font-sans border-r border-slate-200">
                              {evalItem.description}
                            </td>
                            <td className="p-2 font-mono-code text-blue-800 border-r border-slate-200">
                              {evalItem.expectedFormulaPatterns?.join(', ') || 'Semua Formula'}
                            </td>
                            <td className="p-2 font-bold border-r border-slate-200">
                              {String(evalItem.expectedValue ?? '-')}
                            </td>
                            <td className="p-2 font-bold text-[#107c41] border-r border-slate-200">
                              {evalItem.points} Poin
                            </td>
                            <td className="p-2 text-slate-500 font-sans text-[11px]">
                              {evalItem.hint || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: DATASET PEMBELAJARAN                                         */}
      {/* ==================================================================== */}
      {activeTab === 'datasets' && (
        <div className="space-y-4">
          <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a]">
            <h3 className="font-bold text-sm text-[#1a1a1a] uppercase">
              Katalog Dataset Autentik Sekolah untuk Praktik Siswa
            </h3>
            <p className="font-sans text-xs text-slate-600 mt-0.5">
              Guru dapat menguji dataset ini langsung di lembar kerja atau mengunduh template spreadsheet .xlsx untuk arsip materi kelas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {DEFAULT_LEARNING_DATASETS.map((ds) => (
              <div
                key={ds.id}
                className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold pb-2 border-b border-slate-200">
                    <span>{ds.category}</span>
                    <span>{ds.rowCount} Baris ? {ds.colCount} Kolom</span>
                  </div>
                  <h4 className="font-bold text-base text-[#1a1a1a] font-sans mt-3">{ds.title}</h4>
                  <p className="font-sans text-xs text-slate-600 mt-1 leading-relaxed">
                    {ds.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewingDataset(ds)}
                    className="flex-1 py-2 px-3 bg-[#107c41] hover:bg-emerald-700 text-white font-bold text-xs border border-[#1a1a1a] shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Uji & Periksa Lembar Kerja</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportWorkbookToXlsx(ds.workbook, `${ds.title}.xlsx`)}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-[#1a1a1a] font-bold text-xs border border-[#1a1a1a] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    title="Unduh file .xlsx"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Unduh XLSX</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: PEMERIKSAAN JAWABAN SISWA                                    */}
      {/* ==================================================================== */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700 uppercase">Filter:</span>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="bg-white border border-[#1a1a1a] px-2.5 py-1.5 font-bold cursor-pointer"
              >
                {allClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>

              <select
                value={selectedTaskFilter}
                onChange={(e) => setSelectedTaskFilter(e.target.value)}
                className="bg-white border border-[#1a1a1a] px-2.5 py-1.5 font-bold cursor-pointer max-w-[220px] truncate"
              >
                <option value="Semua Tugas">Semua Tugas</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, kelas, atau absen..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#1a1a1a] text-xs font-mono-code focus:outline-none"
              />
            </div>
          </div>

          {/* Submissions Table */}
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white border-2 border-[#1a1a1a] p-12 text-center text-slate-500 font-bold">
              Tidak ada data pengumpulan tugas siswa yang sesuai dengan filter.
            </div>
          ) : (
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b-2 border-[#1a1a1a]">
                    <th className="p-3 border-r border-slate-300">NO</th>
                    <th className="p-3 border-r border-slate-300">KELAS & ABSEN</th>
                    <th className="p-3 border-r border-slate-300">NAMA SISWA</th>
                    <th className="p-3 border-r border-slate-300">TUGAS</th>
                    <th className="p-3 border-r border-slate-300">NILAI OTOMATIS</th>
                    <th className="p-3 border-r border-slate-300">NILAI AKHIR</th>
                    <th className="p-3 border-r border-slate-300">STATUS</th>
                    <th className="p-3 border-r border-slate-300">WAKTU</th>
                    <th className="p-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((sub, idx) => {
                    const isPassed = sub.finalScore >= 75;

                    return (
                      <tr key={sub.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-3 border-r border-slate-200 text-slate-500">{idx + 1}</td>
                        <td className="p-3 border-r border-slate-200 font-bold whitespace-nowrap">
                          {sub.className} ? No. {sub.attendanceNo}
                        </td>
                        <td className="p-3 border-r border-slate-200 font-sans font-bold whitespace-nowrap">
                          {sub.studentName}
                        </td>
                        <td className="p-3 border-r border-slate-200 font-sans max-w-[200px] truncate" title={sub.taskTitle}>
                          {sub.taskTitle}
                        </td>
                        <td className="p-3 border-r border-slate-200 text-center font-bold">
                          {sub.autoScore}
                        </td>
                        <td className={`p-3 border-r border-slate-200 text-center font-black text-sm ${
                          isPassed ? 'text-emerald-700' : 'text-amber-600'
                        }`}>
                          {sub.finalScore}
                        </td>
                        <td className="p-3 border-r border-slate-200 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}>
                            {isPassed ? 'TUNTAS' : 'REMEDIAL'}
                          </span>
                        </td>
                        <td className="p-3 border-r border-slate-200 text-[11px] text-slate-500 whitespace-nowrap">
                          {sub.submittedAt}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setReviewingSubmission(sub)}
                            className="px-2.5 py-1 bg-[#107c41] hover:bg-emerald-700 text-white font-bold text-xs border border-[#1a1a1a] shadow-[1px_1px_0px_#000] cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Periksa</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: REKAP DAN ANALISIS NILAI                                      */}
      {/* ==================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono-code">
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Pengumpulan</span>
              <div className="text-3xl font-black text-[#1a1a1a] mt-1">{analyticsStats.totalSubmissions}</div>
              <span className="text-[10px] text-slate-500">Lembar Jawaban Siswa</span>
            </div>

            <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Rata-Rata Nilai</span>
              <div className="text-3xl font-black text-[#107c41] mt-1">{analyticsStats.avgScore}</div>
              <span className="text-[10px] text-slate-500">Dari Skala 100</span>
            </div>

            <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Tingkat Kelulusan (?75)</span>
              <div className="text-3xl font-black text-blue-700 mt-1">{analyticsStats.passPercentage}%</div>
              <span className="text-[10px] text-slate-500">{analyticsStats.passedCount} Siswa Tuntas</span>
            </div>

            <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Rentang Skor</span>
              <div className="text-2xl font-black text-purple-700 mt-1">
                {analyticsStats.lowestScore} - {analyticsStats.highestScore}
              </div>
              <span className="text-[10px] text-slate-500">Terendah / Tertinggi</span>
            </div>
          </div>

          {/* Class Breakdown Table */}
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-[#1a1a1a] uppercase">
                Analisis Capaian Nilai Berdasarkan Rombel Kelas
              </h3>
              <button
                type="button"
                onClick={handleExportGradeRecapToXlsx}
                className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-slate-200 text-[#1a1a1a] font-bold border border-[#1a1a1a] cursor-pointer flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                <span>Unduh Laporan Kelas (.XLSX)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-slate-300">
                    <th className="p-3 border-r border-slate-300">Rombel Kelas</th>
                    <th className="p-3 border-r border-slate-300">Siswa Kumpul</th>
                    <th className="p-3 border-r border-slate-300">Rata-Rata Nilai</th>
                    <th className="p-3 border-r border-slate-300">Jumlah Tuntas</th>
                    <th className="p-3">Persentase Tuntas</th>
                  </tr>
                </thead>
                <tbody>
                  {classBreakdown.map((cb) => (
                    <tr key={cb.className} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-3 border-r border-slate-200 font-bold">{cb.className}</td>
                      <td className="p-3 border-r border-slate-200">{cb.submissionCount} Siswa</td>
                      <td className="p-3 border-r border-slate-200 font-black text-[#107c41]">{cb.avgScore}</td>
                      <td className="p-3 border-r border-slate-200 text-blue-700 font-bold">{cb.passedCount} Siswa</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 h-3 border border-slate-400">
                            <div
                              className="bg-[#107c41] h-full"
                              style={{ width: `${Math.min(cb.passRate, 100)}%` }}
                            />
                          </div>
                          <span className="font-bold">{cb.passRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: REVIEW STUDENT SUBMISSION (TEACHER AUDIT & GRADING)          */}
      {/* ==================================================================== */}
      {reviewingSubmission && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#000] w-full max-w-7xl h-[92vh] flex flex-col font-mono-code">
            {/* Modal Header */}
            <div className="bg-[#1a1a1a] text-white p-3 sm:p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                    PEMERIKSAAN JAWABAN SISWA (SNAPSHOT WORKBOOK)
                  </span>
                  <h3 className="font-bold text-base font-sans">
                    {reviewingSubmission.studentName} ? {reviewingSubmission.className} (Absen {reviewingSubmission.attendanceNo})
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleResetStudentSubmission(reviewingSubmission.id)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold border border-black cursor-pointer transition-all"
                  title="Hapus rekaman ini agar siswa dapat mengumpulkan ulang"
                >
                  Izinkan Kerjakan Ulang
                </button>
                <button
                  type="button"
                  onClick={() => setReviewingSubmission(null)}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white hover:text-[#1a1a1a] text-white text-xs font-bold border border-white/40 cursor-pointer transition-all"
                >
                  TUTUP [ESC]
                </button>
              </div>
            </div>

            {/* Main Split: Left Grid Viewer / Right Grading Panel */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              {/* Left: Frozen Workbook Snapshot */}
              <div className="flex-1 h-full min-w-0 border-r border-slate-300 overflow-hidden">
                <ExcelGridEditor
                  workbook={reviewingSubmission.workbookSnapshot}
                  onChange={() => {}}
                  isReadOnly={true}
                />
              </div>

              {/* Right: Teacher Grading Sidebar */}
              <div className="w-full lg:w-96 bg-[#FAF8F5] p-4 overflow-y-auto space-y-4 shrink-0 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-[#1a1a1a] uppercase border-b border-slate-300 pb-2">
                      Audit Hasil Penilaian Rumus
                    </h4>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Waktu Kirim: {reviewingSubmission.submittedAt} (Percobaan ke-{reviewingSubmission.attemptNumber})
                    </span>
                  </div>

                  {/* Checklist of formula checks */}
                  <div className="space-y-2">
                    {reviewingSubmission.evaluationResults.map((evalRes) => (
                      <div
                        key={evalRes.evaluationId}
                        className="p-2.5 bg-white border border-slate-300 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#107c41]">{evalRes.cellRef}</span>
                          <span className="font-bold text-xs">
                            {evalRes.pointsEarned} / {evalRes.maxPoints} Poin
                          </span>
                        </div>
                        <p className="font-sans text-[11px] text-slate-700">{evalRes.description}</p>
                        <div className="text-[11px] font-mono-code bg-slate-50 p-1 border border-slate-200 text-blue-900 truncate">
                          Rumus: <code>{evalRes.formulaUsed || '(Kosong / Manual)'}</code>
                        </div>
                        <span className="text-[10px] text-slate-600 block italic">{evalRes.feedback}</span>
                      </div>
                    ))}
                  </div>

                  {/* Manual Score Adjustment */}
                  <div className="p-3 bg-white border border-slate-300 space-y-2">
                    <label className="font-bold uppercase text-[11px] text-slate-700 block">
                      Penyesuaian Nilai Akhir (Skala 100):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={manualScoreInput}
                        onChange={(e) => setManualScoreInput(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                        className="w-24 p-2 bg-[#FAF8F5] border border-[#1a1a1a] font-bold text-lg text-center"
                      />
                      <span className="text-slate-500 font-sans text-xs">
                        Nilai Otomatis: <strong>{reviewingSubmission.autoScore}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Teacher Feedback Textarea */}
                  <div className="p-3 bg-white border border-slate-300 space-y-2">
                    <label className="font-bold uppercase text-[11px] text-slate-700 block">
                      Catatan & Umpan Balik Guru:
                    </label>
                    <textarea
                      rows={3}
                      value={teacherFeedbackInput}
                      onChange={(e) => setTeacherFeedbackInput(e.target.value)}
                      placeholder="Tuliskan umpan balik perbaikan atau apresiasi hasil kerja siswa..."
                      className="w-full p-2 bg-[#FAF8F5] border border-[#1a1a1a] font-sans text-xs text-[#1a1a1a] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Save Grading Button */}
                <button
                  type="button"
                  onClick={handleSaveReviewedGrade}
                  disabled={isSavingGrade}
                  className="w-full py-2.5 bg-[#107c41] hover:bg-emerald-700 text-white font-bold text-xs border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSavingGrade ? 'Menyimpan...' : 'Simpan Nilai & Umpan Balik'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: TASK CREATOR & EDITOR                                         */}
      {/* ==================================================================== */}
      {isTaskModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#000] w-full max-w-4xl max-h-[90vh] flex flex-col font-mono-code">
            {/* Header */}
            <div className="p-4 bg-[#107c41] text-white flex items-center justify-between border-b-2 border-[#1a1a1a] shrink-0">
              <h3 className="font-bold text-base font-sans uppercase">
                Konfigurasi Paket Tugas Laboratorium Excel
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsTaskModalOpen(false);
                  setEditingTask(null);
                }}
                className="text-white hover:bg-white/20 px-2 py-1 text-xs font-bold cursor-pointer"
              >
                ? TUTUP
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Judul Tugas:</label>
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="w-full p-2 bg-[#FAF8F5] border border-[#1a1a1a] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori:</label>
                  <select
                    value={editingTask.category}
                    onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as any })}
                    className="w-full p-2 bg-[#FAF8F5] border border-[#1a1a1a] text-xs font-bold"
                  >
                    <option value="Dasar">Dasar</option>
                    <option value="Statistik">Statistik</option>
                    <option value="Logika IF">Logika IF</option>
                    <option value="Lookup">Lookup (VLOOKUP/HLOOKUP)</option>
                    <option value="Teks">Teks & Karakter</option>
                    <option value="Ujian Praktek">Ujian Praktek</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsi Singkat:</label>
                <textarea
                  rows={2}
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full p-2 bg-[#FAF8F5] border border-[#1a1a1a] text-xs font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Kelas:</label>
                  <select
                    value={editingTask.gradeLevel}
                    onChange={(e) => setEditingTask({ ...editingTask, gradeLevel: e.target.value as any })}
                    className="w-full p-2 bg-[#FAF8F5] border border-[#1a1a1a] text-xs font-bold"
                  >
                    <option value="ALL">Semua Kelas (7 & 8)</option>
                    <option value="7">Khusus Kelas 7</option>
                    <option value="8">Khusus Kelas 8</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Batas Nilai KKTP:</label>
                  <input
                    type="number"
                    value={editingTask.kktp}
                    onChange={(e) => setEditingTask({ ...editingTask, kktp: parseInt(e.target.value, 10) || 75 })}
                    className="w-full p-2 bg-[#FAF8F5] border border-[#1a1a1a] text-xs font-bold"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={editingTask.isActive}
                      onChange={(e) => setEditingTask({ ...editingTask, isActive: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Aktifkan Tugas</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={editingTask.allowResubmission}
                      onChange={(e) => setEditingTask({ ...editingTask, allowResubmission: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Izinkan Resubmit</span>
                  </label>
                </div>
              </div>

              {/* Instructions list editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Langkah Instruksi Pengerjaan:</label>
                  <button
                    type="button"
                    onClick={() => setEditingTask({
                      ...editingTask,
                      instructions: [...editingTask.instructions, 'Instruksi baru...'],
                    })}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[10px] font-bold"
                  >
                    + Tambah Langkah
                  </button>
                </div>
                {editingTask.instructions.map((inst, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 text-slate-400 font-bold">{idx + 1}.</span>
                    <input
                      type="text"
                      value={inst}
                      onChange={(e) => {
                        const updated = [...editingTask.instructions];
                        updated[idx] = e.target.value;
                        setEditingTask({ ...editingTask, instructions: updated });
                      }}
                      className="flex-1 p-1.5 bg-[#FAF8F5] border border-slate-300 text-xs font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingTask.instructions.filter((_, i) => i !== idx);
                        setEditingTask({ ...editingTask, instructions: updated });
                      }}
                      className="p-1 text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#FAF8F5] border-t-2 border-[#1a1a1a] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsTaskModalOpen(false);
                  setEditingTask(null);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-[#1a1a1a] font-bold border border-[#1a1a1a] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveTaskFromModal}
                className="px-5 py-2 bg-[#107c41] hover:bg-emerald-700 text-white font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                Simpan Tugas ke Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: PREVIEW DATASET                                               */}
      {/* ==================================================================== */}
      {previewingDataset && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#000] w-full max-w-6xl h-[85vh] flex flex-col font-mono-code">
            <div className="bg-[#107c41] text-white p-3 sm:p-4 flex items-center justify-between shrink-0 border-b-2 border-[#1a1a1a]">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5" />
                <h3 className="font-bold text-base font-sans">{previewingDataset.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingDataset(null)}
                className="px-2.5 py-1 bg-white/20 hover:bg-white hover:text-black text-white text-xs font-bold cursor-pointer"
              >
                TUTUP [ESC]
              </button>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
              <ExcelGridEditor
                workbook={previewingDataset.workbook}
                onChange={() => {}}
                isReadOnly={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
