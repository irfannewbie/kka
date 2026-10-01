import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Zap,
  Clock,
  ShieldAlert,
  FileSpreadsheet,
  Copy,
  Code2,
  ListOrdered,
  HelpCircle,
  Layers,
  Award,
  Users,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Check,
} from 'lucide-react';
import {
  InteractiveQuiz,
  QuizQuestion,
  QuizQuestionType,
  QuizAttemptSubmission,
  fetchQuizzesAndSubmissionsFromServer,
  saveQuizToServer,
  deleteQuizFromServer,
  resetStudentQuizAttemptOnServer,
  applySubmissionToCalculatorMaster,
  submitQuizAttemptToServer,
} from '../services/quizStore';
import {
  GRADE_7_CLASSES,
  GRADE_8_CLASSES,
  ALL_CLASSES,
} from '../data/studentsAll';
import {
  syncCalculatorBreakdownToSheet,
  CALCULATOR_BREAKDOWN_SHEET_NAME,
} from '../services/sheetsService';
import { playNotificationChime } from '../services/sound';

interface MasterQuizManagerViewProps {
  spreadsheetId: string;
  spreadsheetUrl: string;
  token: string | null;
  onLogin: () => void;
  onNavigateToStudentQuiz: (pin?: string) => void;
  onShowAlert?: (title: string, message: string) => void;
}

export const MasterQuizManagerView: React.FC<MasterQuizManagerViewProps> = ({
  spreadsheetId,
  token,
  onLogin,
  onNavigateToStudentQuiz,
  onShowAlert,
}) => {
  const [quizzes, setQuizzes] = useState<InteractiveQuiz[]>([]);
  const [submissions, setSubmissions] = useState<QuizAttemptSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncingSheet, setIsSyncingSheet] = useState<boolean>(false);

  // Sub-navigation inside Master Quiz Manager
  const [activeSubTab, setActiveSubTab] = useState<
    'packages' | 'editor' | 'arena' | 'submissions'
  >('packages');

  // Selected quiz for Editing / Live Arena / Filtering Submissions
  const [selectedQuizId, setSelectedQuizId] = useState<string>('quiz-kka-kelas8-main');
  const [filterClass, setFilterClass] = useState<string>('ALL');

  // Bulk Paste Question Importer State
  const [bulkPasteText, setBulkPasteText] = useState<string>('');
  const [showBulkImporter, setShowBulkImporter] = useState<boolean>(false);

  // Manual Essay Score Override State
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [overrideUraianVal, setOverrideUraianVal] = useState<string>('');

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await fetchQuizzesAndSubmissionsFromServer();
      setQuizzes(data.quizzes);
      setSubmissions(data.submissions);
      if (data.quizzes.length > 0 && !data.quizzes.some((q) => q.id === selectedQuizId)) {
        setSelectedQuizId(data.quizzes[0].id);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => {
      loadData(true);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const selectedQuiz = useMemo(
    () => quizzes.find((q) => q.id === selectedQuizId) || quizzes[0] || null,
    [quizzes, selectedQuizId]
  );

  // Create a brand new quiz package
  const handleCreateNewQuiz = async () => {
    const randomPin = `KUIS${Math.floor(10 + Math.random() * 89)}`;
    const nowStr = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newQuiz: InteractiveQuiz = {
      id: `quiz-${Date.now()}`,
      title: 'Kuis Interaktif Baru (Informatika / KKA)',
      description:
        'Kerjakan seluruh butir soal Pilihan Ganda, Menjodohkan, Algoritma, dan Uraian dengan teliti.',
      tokenPin: randomPin,
      gradeLevel: '8',
      targetClasses: [...GRADE_8_CLASSES],
      subject: 'Koding',
      assessment: 'ASTS Genap',
      isRemedialQuiz: false,
      scoringScaleMode: 'PROPORSIONAL_100',
      durationMinutes: 25,
      maxTabSwitches: 3,
      shuffleQuestions: true,
      shuffleOptions: true,
      isActive: false,
      isLiveArenaMode: false,
      kktp: 75,
      createdAt: nowStr,
      updatedAt: nowStr,
      questions: [
        {
          id: `q-${Date.now()}-1`,
          type: 'pg',
          questionText: 'Contoh Soal Pilihan Ganda: Apa fungsi utama dari algoritma dalam pemrograman?',
          options: [
            'Menyusun langkah penyelesaian masalah secara logis dan berurutan',
            'Memperbesar kapasitas penyimpanan harddisk secara fisik',
            'Mengganti warna kabel jaringan internet',
            'Mematikan perangkat komputer secara paksa',
          ],
          correctOptionIndex: 0,
        },
      ],
    };

    const updated = await saveQuizToServer(newQuiz);
    setQuizzes(updated);
    setSelectedQuizId(newQuiz.id);
    setActiveSubTab('editor');
    onShowAlert?.(
      'Paket Kuis Baru Dibuat',
      `Kuis "${newQuiz.title}" dengan PIN [${newQuiz.tokenPin}] siap diedit.`
    );
  };

  // Save changes to the currently selected quiz
  const handleUpdateSelectedQuiz = async (updatedQuiz: InteractiveQuiz) => {
    const withTimestamp: InteractiveQuiz = {
      ...updatedQuiz,
      updatedAt: new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const list = await saveQuizToServer(withTimestamp);
    setQuizzes(list);
  };

  const handleToggleQuizActive = async (quiz: InteractiveQuiz) => {
    const next = { ...quiz, isActive: !quiz.isActive };
    const list = await saveQuizToServer(next);
    setQuizzes(list);
    onShowAlert?.(
      next.isActive ? 'Kuis Diaktifkan' : 'Kuis Dinonaktifkan',
      `Status kuis "${quiz.title}" (PIN: ${quiz.tokenPin}) kini ${
        next.isActive ? 'AKTIF dan dapat dikerjakan siswa' : 'NONAKTIF'
      }.`
    );
  };

  const handleDeleteQuiz = async (quiz: InteractiveQuiz) => {
    if (quizzes.length <= 1) {
      onShowAlert?.('Tidak Dapat Menghapus', 'Minimal harus ada 1 paket kuis tersimpan.');
      return;
    }
    const list = await deleteQuizFromServer(quiz.id);
    setQuizzes(list);
    if (selectedQuizId === quiz.id && list[0]) {
      setSelectedQuizId(list[0].id);
    }
    onShowAlert?.('Kuis Dihapus', `Paket kuis "${quiz.title}" telah dihapus.`);
  };

  // Add a new question to selectedQuiz
  const handleAddQuestion = async (type: QuizQuestionType) => {
    if (!selectedQuiz) return;
    const newQ: QuizQuestion =
      type === 'pg'
        ? {
            id: `q-${Date.now()}`,
            type: 'pg',
            questionText: 'Tuliskan pertanyaan Pilihan Ganda di sini...',
            options: ['Pilihan A (Jawaban Benar)', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
            correctOptionIndex: 0,
          }
        : type === 'code_output'
        ? {
            id: `q-${Date.now()}`,
            type: 'code_output',
            questionText: 'Perhatikan potongan kode berikut! Apa output atau hasil tampilannya?',
            codeSnippet: `<div style="padding:10px; background:#eff6ff; border:2px solid #1d4ed8;">\n  <b>Halo Siswa SMPN 1 Wedi!</b>\n</div>`,
            liveHtmlPreview: true,
            options: [
              'Kotak biru muda berisi teks tebal "Halo Siswa SMPN 1 Wedi!"',
              'Halaman kosong tanpa teks',
              'Pesan error sintaks',
              'Tabel berisi angka 1 sampai 10',
            ],
            correctOptionIndex: 0,
          }
        : type === 'matching'
        ? {
            id: `q-${Date.now()}`,
            type: 'matching',
            questionText: 'Pasangkan pernyataan di kiri dengan jawaban yang tepat di kanan!',
            matchingPairs: [
              { id: `mp-${Date.now()}-1`, leftText: 'Konsep / Tag 1', rightText: 'Pasangan Benar 1' },
              { id: `mp-${Date.now()}-2`, leftText: 'Konsep / Tag 2', rightText: 'Pasangan Benar 2' },
              { id: `mp-${Date.now()}-3`, leftText: 'Konsep / Tag 3', rightText: 'Pasangan Benar 3' },
            ],
          }
        : type === 'parsons'
        ? {
            id: `q-${Date.now()}`,
            type: 'parsons',
            questionText:
              'TANTANGAN ALGORITMA: Susunlah langkah-langkah berikut dari urutan pertama hingga terakhir!',
            parsonsBlocks: [
              '1. Langkah Pertama (Mulai)',
              '2. Langkah Kedua (Input Data)',
              '3. Langkah Ketiga (Proses & Output)',
              '4. Langkah Keempat (Selesai)',
            ],
            maxPoints: 15,
          }
        : {
            id: `q-${Date.now()}`,
            type: 'essay',
            questionText: 'Tuliskan pertanyaan Uraian / Esai singkat di sini...',
            expectedKeywords: ['algoritma', 'logis', 'komputer'],
            sampleAnswer: 'Contoh jawaban lengkap untuk acuan penilaian otomatis & guru.',
            maxPoints: 10,
          };

    await handleUpdateSelectedQuiz({
      ...selectedQuiz,
      questions: [...selectedQuiz.questions, newQ],
    });
  };

  // Smart Bulk Question Parser (Copy-Paste from Word / Google Docs / Excel)
  const handleRunBulkImport = async () => {
    if (!selectedQuiz || !bulkPasteText.trim()) return;
    const rawBlocks = bulkPasteText
      .trim()
      .split(/\n\s*\n+/)
      .map((b) => b.trim())
      .filter(Boolean);

    const parsedQuestions: QuizQuestion[] = [];

    rawBlocks.forEach((block, idx) => {
      const lines = block
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) return;

      const firstLine = lines[0].replace(/^\d+[\.\)]\s*/, '').trim();

      // Detect if it has A/B/C/D options
      const optLines = lines.slice(1).filter((l) => /^[A-Da-d][\.\)]\s+/.test(l));
      const keyLine = lines.find((l) => /^(kunci|jawaban|answer)\s*[:=]\s*([A-Da-d])/i.test(l));

      if (optLines.length >= 2) {
        const cleanOpts = optLines.map((l) => l.replace(/^[A-Da-d][\.\)]\s+/, '').trim());
        let correctIdx = 0;
        if (keyLine) {
          const m = keyLine.match(/([A-Da-d])\s*$/i);
          if (m) {
            const letter = m[1].toUpperCase();
            correctIdx = Math.max(0, ['A', 'B', 'C', 'D'].indexOf(letter));
          }
        }
        parsedQuestions.push({
          id: `q-bulk-${Date.now()}-${idx}`,
          type: 'pg',
          questionText: firstLine,
          options: cleanOpts,
          correctOptionIndex: Math.min(correctIdx, cleanOpts.length - 1),
        });
      } else if (lines.some((l) => l.includes('=') || l.includes('->'))) {
        // Matching pairs format: Kiri = Kanan or Kiri -> Kanan
        const pairLines = lines.slice(1).filter((l) => l.includes('=') || l.includes('->'));
        if (pairLines.length > 0) {
          const pairs = pairLines.map((pl, pIdx) => {
            const parts = pl.split(/\s*(?:->|=)\s*/);
            return {
              id: `mp-bulk-${Date.now()}-${idx}-${pIdx}`,
              leftText: parts[0] || `Item ${pIdx + 1}`,
              rightText: parts.slice(1).join(' = ') || `Pasangan ${pIdx + 1}`,
            };
          });
          parsedQuestions.push({
            id: `q-bulk-${Date.now()}-${idx}`,
            type: 'matching',
            questionText: firstLine,
            matchingPairs: pairs,
          });
        }
      } else {
        // Essay question fallback
        const kwLine = lines.find((l) => /^(kata\s*kunci|keywords?)\s*[:=]/i.test(l));
        const keywords = kwLine
          ? kwLine
              .replace(/^(kata\s*kunci|keywords?)\s*[:=]/i, '')
              .split(',')
              .map((k) => k.trim().toLowerCase())
              .filter(Boolean)
          : [];
        parsedQuestions.push({
          id: `q-bulk-${Date.now()}-${idx}`,
          type: 'essay',
          questionText: firstLine,
          expectedKeywords: keywords,
          maxPoints: 10,
        });
      }
    });

    if (parsedQuestions.length === 0) {
      onShowAlert?.(
        'Format Tidak Terdeteksi',
        'Pastikan setiap soal dipisahkan baris kosong. Contoh PG: baris pertama soal, diikuti A. ..., B. ..., C. ..., D. ..., dan Kunci: A.'
      );
      return;
    }

    await handleUpdateSelectedQuiz({
      ...selectedQuiz,
      questions: [...selectedQuiz.questions, ...parsedQuestions],
    });
    setBulkPasteText('');
    setShowBulkImporter(false);
    onShowAlert?.(
      'Import Soal Berhasil!',
      `${parsedQuestions.length} butir soal berhasil ditambahkan ke kuis "${selectedQuiz.title}".`
    );
  };

  // Sync all submissions to Calculator Master & Google Sheet 'Rincian_Kalkulator'
  const handleSyncQuizResultsToSheet = async () => {
    // First apply all submissions to local + server calculator store
    submissions.forEach((sub) => {
      applySubmissionToCalculatorMaster(sub);
    });

    if (!token) {
      onShowAlert?.(
        'Tersimpan di Kalkulator Akademik Server',
        `Seluruh nilai kuis (${submissions.length} siswa) telah masuk ke Kalkulator Akademik & halaman /cek. Klik LOGIN GOOGLE jika ingin sekaligus menulis ke Google Spreadsheet '${CALCULATOR_BREAKDOWN_SHEET_NAME}'.`
      );
      return;
    }

    setIsSyncingSheet(true);
    try {
      const res = await syncCalculatorBreakdownToSheet(token, spreadsheetId);
      if (res.success) {
        playNotificationChime();
        onShowAlert?.('Sinkronisasi Sheet Berhasil!', res.message);
      } else {
        onShowAlert?.('Info Sinkronisasi', res.message);
      }
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Manual override of student's essay/uraian score in submissions table
  const handleSaveManualEssayScore = async (sub: QuizAttemptSubmission) => {
    const newUraian = Math.min(25, Math.max(0, Number(overrideUraianVal) || 0));
    const pgScore = Math.min(50, sub.calcBenarPG * 2);
    const mjScore = Math.min(25, sub.calcBenarMJ * 2.5);
    const newFinal = Math.min(100, Math.round(pgScore + mjScore + newUraian));

    const updatedSub: QuizAttemptSubmission = {
      ...sub,
      calcSkorUraian: newUraian,
      finalScore: newFinal,
      arenaTotalPoints: newFinal * 100 + sub.speedBonusPoints,
    };

    const res = await submitQuizAttemptToServer(updatedSub);
    setSubmissions(res.submissions);
    setEditingSubmissionId(null);
    onShowAlert?.(
      'Skor Uraian Diperbarui',
      `Skor Uraian ${sub.studentName} (${sub.className}) diubah menjadi ${newUraian} (Nilai Akhir: ${newFinal}) dan disinkronkan ke Kalkulator Akademik.`
    );
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (selectedQuiz && s.quizId !== selectedQuiz.id) return false;
      if (filterClass !== 'ALL' && s.className !== filterClass) return false;
      return true;
    });
  }, [submissions, selectedQuiz, filterClass]);

  // Leaderboard sorted by arenaTotalPoints (or finalScore)
  const arenaLeaderboard = useMemo(() => {
    return [...filteredSubmissions].sort((a, b) => {
      if (b.arenaTotalPoints !== a.arenaTotalPoints) {
        return b.arenaTotalPoints - a.arenaTotalPoints;
      }
      return b.finalScore - a.finalScore;
    });
  }, [filteredSubmissions]);

  // Class performance comparison in Live Arena
  const classArenaStats = useMemo(() => {
    if (!selectedQuiz) return [];
    const classes = selectedQuiz.targetClasses || ALL_CLASSES;
    return classes
      .map((cls) => {
        const clsSubs = submissions.filter(
          (s) => s.quizId === selectedQuiz.id && s.className === cls
        );
        const count = clsSubs.length;
        const avgScore =
          count > 0
            ? Math.round(
                (clsSubs.reduce((acc, cur) => acc + cur.finalScore, 0) / count) * 10
              ) / 10
            : 0;
        const passed = clsSubs.filter((s) => s.finalScore >= (selectedQuiz.kktp || 75)).length;
        return {
          className: cls,
          shortClass: cls.replace(/^Kelas\s*/i, ''),
          count,
          avgScore,
          passed,
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore || b.count - a.count);
  }, [submissions, selectedQuiz]);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* 1. HEADER BANNER */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono-code text-slate-600 mb-1.5">
              <span className="font-bold text-[#2e59e6]">PUSAT KUIS & ASESMEN INTERAKTIF</span>
              <span>·</span>
              <span>SMP NEGERI 1 WEDI</span>
              <span>·</span>
              <span>TERHUBUNG KALKULATOR AKADEMIK & SPREADSHEET</span>
            </div>
            <h1 className="font-serif-display italic font-bold text-2xl sm:text-3xl text-[#1a1a1a] tracking-tight">
              Studio Kuis Interaktif, Mini-Lab Koding & Live Arena
            </h1>
            <p className="font-mono-code text-xs text-slate-600 mt-1 max-w-3xl">
              Buat kuis Pilihan Ganda, Menjodohkan, Susun Algoritma (Parsons Puzzle), Tebak Output Kode, dan Uraian. Nilai siswa otomatis masuk ke Kalkulator Akademik & halaman /cek.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 font-mono-code">
            <button
              type="button"
              onClick={() => onNavigateToStudentQuiz(selectedQuiz?.tokenPin)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] transition-all cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              <span>BUKA PORTAL KUIS SISWA (/kuis)</span>
            </button>

            <button
              type="button"
              onClick={handleCreateNewQuiz}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#2e59e6] hover:bg-blue-700 text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>BUAT PAKET KUIS BARU</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="mt-5 pt-4 border-t-2 border-[#1a1a1a] flex flex-wrap items-center justify-between gap-3 font-mono-code">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSubTab('packages')}
              className={`px-3.5 py-2 text-xs font-bold border-2 border-[#1a1a1a] transition-all cursor-pointer ${
                activeSubTab === 'packages'
                  ? 'bg-[#1a1a1a] text-white shadow-[2px_2px_0px_#2e59e6]'
                  : 'bg-[#F2EFEB] text-[#1a1a1a] hover:bg-white'
              }`}
            >
              01. PAKET KUIS ({quizzes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('editor')}
              className={`px-3.5 py-2 text-xs font-bold border-2 border-[#1a1a1a] transition-all cursor-pointer ${
                activeSubTab === 'editor'
                  ? 'bg-[#2e59e6] text-white shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] text-[#1a1a1a] hover:bg-white'
              }`}
            >
              02. EDITOR SOAL & IMPORT CEPAT ({selectedQuiz?.questions.length || 0} Soal)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('arena')}
              className={`px-3.5 py-2 text-xs font-bold border-2 border-[#1a1a1a] transition-all cursor-pointer ${
                activeSubTab === 'arena'
                  ? 'bg-amber-400 text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] text-[#1a1a1a] hover:bg-white'
              }`}
            >
              03. LIVE QUIZ ARENA & LEADERBOARD
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('submissions')}
              className={`px-3.5 py-2 text-xs font-bold border-2 border-[#1a1a1a] transition-all cursor-pointer ${
                activeSubTab === 'submissions'
                  ? 'bg-emerald-600 text-white shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] text-[#1a1a1a] hover:bg-white'
              }`}
            >
              04. REKAP NILAI & ANTI-CHEAT ({submissions.length} Kiriman)
            </button>
          </div>

          {/* Active Quiz Selector */}
          {quizzes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase">KUIS DIPILIH:</span>
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="bg-[#F2EFEB] border-2 border-[#1a1a1a] px-3 py-1.5 text-xs font-bold text-[#1a1a1a] cursor-pointer"
              >
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    [{q.tokenPin}] {q.title} ({q.questions.length} Soal)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          TAB 01: DAFTAR PAKET KUIS & KONFIGURASI CEPAT
         ===================================================================== */}
      {activeSubTab === 'packages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono-code">
          {quizzes.map((quiz) => {
            const isSelected = quiz.id === selectedQuizId;
            const quizSubs = submissions.filter((s) => s.quizId === quiz.id);
            const pgCount = quiz.questions.filter(
              (q) => q.type === 'pg' || q.type === 'code_output'
            ).length;
            const matchCount = quiz.questions.filter((q) => q.type === 'matching').length;
            const labEssayCount = quiz.questions.filter(
              (q) => q.type === 'parsons' || q.type === 'essay'
            ).length;

            return (
              <div
                key={quiz.id}
                className={`bg-white border-2 border-[#1a1a1a] p-5 flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'shadow-[5px_5px_0px_#2e59e6]'
                    : 'shadow-[4px_4px_0px_#1a1a1a]'
                }`}
              >
                <div>
                  {/* Top Meta Row */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#1a1a1a]/20">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="bg-[#1a1a1a] text-amber-300 px-2.5 py-1 border border-[#1a1a1a] tracking-widest">
                        PIN: {quiz.tokenPin}
                      </span>
                      <span className="text-slate-600">
                        {quiz.subject === 'Koding' ? 'KKA' : 'Informatika'} · {quiz.assessment}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleQuizActive(quiz)}
                      className={`px-2.5 py-1 text-[10px] font-bold border border-[#1a1a1a] cursor-pointer ${
                        quiz.isActive
                          ? 'bg-emerald-500 text-[#1a1a1a]'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {quiz.isActive ? '● AKTIF' : '○ NONAKTIF'}
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-sans font-bold text-base text-[#1a1a1a] mt-3 leading-snug">
                    {quiz.title}
                  </h3>
                  <p className="font-sans text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {quiz.description}
                  </p>

                  {/* Unboxed clean metadata lines */}
                  <div className="mt-4 pt-3 border-t border-[#1a1a1a]/15 space-y-1.5 text-[11px] text-slate-700">
                    <div>
                      <strong>Target Kelas:</strong>{' '}
                      {quiz.gradeLevel === '7'
                        ? 'Kelas 7 (7E–7H)'
                        : quiz.gradeLevel === '8'
                        ? 'Kelas 8 (8A–8H)'
                        : 'Semua Kelas (7E–7H & 8A–8H)'}
                    </div>
                    <div>
                      <strong>Komposisi Soal:</strong> {pgCount} PG/Kode · {matchCount} Menjodohkan ·{' '}
                      {labEssayCount} Algoritma/Uraian
                    </div>
                    <div>
                      <strong>Pengaturan Ujian:</strong> {quiz.durationMinutes} Menit · Maks{' '}
                      {quiz.maxTabSwitches}x Pindah Tab ·{' '}
                      {quiz.isRemedialQuiz ? 'Mode Remedial (< KKTP)' : 'Mode Asesmen Utama'}
                    </div>
                    <div className="text-[#2e59e6] font-bold">
                      {quizSubs.length} Siswa Telah Mengerjakan
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-3 border-t-2 border-[#1a1a1a] flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuizId(quiz.id);
                      setActiveSubTab('editor');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#2e59e6] hover:bg-blue-700 text-white border border-[#1a1a1a] cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>EDIT SOAL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuizId(quiz.id);
                      setActiveSubTab('arena');
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-[#1a1a1a] border border-[#1a1a1a] cursor-pointer"
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    <span>ARENA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToStudentQuiz(quiz.tokenPin)}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-[#1a1a1a] cursor-pointer"
                    title="Uji coba kerjakan sebagai siswa"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteQuiz(quiz)}
                    className="inline-flex items-center justify-center p-2 text-xs font-bold bg-white hover:bg-rose-600 hover:text-white text-rose-600 border border-[#1a1a1a] cursor-pointer"
                    title="Hapus paket kuis"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          TAB 02: EDITOR SOAL, MINI-LAB KODING & IMPORT CEPAT COPY-PASTE
         ===================================================================== */}
      {activeSubTab === 'editor' && selectedQuiz && (
        <div className="space-y-6 font-mono-code">
          {/* Quiz Metadata Configuration Box */}
          <div className="bg-[#F2EFEB] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#1a1a1a] pb-3">
              <h2 className="text-sm font-bold uppercase text-[#1a1a1a]">
                KONFIGURASI KUIS & INTEGRASI KALKULATOR AKADEMIK
              </h2>
              <span className="text-xs font-bold text-[#2e59e6]">
                PIN AKTIF: [{selectedQuiz.tokenPin}] · Terakhir disimpan: {selectedQuiz.updatedAt}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 space-y-1">
                <label className="block text-[11px] font-bold text-[#1a1a1a]">JUDUL KUIS:</label>
                <input
                  type="text"
                  value={selectedQuiz.title}
                  onChange={(e) =>
                    handleUpdateSelectedQuiz({ ...selectedQuiz, title: e.target.value })
                  }
                  className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-2 text-xs font-bold text-[#1a1a1a]"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-[11px] font-bold text-[#1a1a1a]">
                  TOKEN / PIN KUIS:
                </label>
                <input
                  type="text"
                  value={selectedQuiz.tokenPin}
                  onChange={(e) =>
                    handleUpdateSelectedQuiz({
                      ...selectedQuiz,
                      tokenPin: e.target.value.toUpperCase().replace(/\s+/g, ''),
                    })
                  }
                  className="w-full bg-amber-50 border-2 border-[#1a1a1a] px-3 py-2 text-xs font-black tracking-widest text-[#1a1a1a] uppercase"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-[11px] font-bold text-[#1a1a1a]">
                  MATA PELAJARAN:
                </label>
                <select
                  value={selectedQuiz.subject}
                  onChange={(e) =>
                    handleUpdateSelectedQuiz({
                      ...selectedQuiz,
                      subject: e.target.value as 'Informatika' | 'Koding',
                    })
                  }
                  className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-2 text-xs font-bold text-[#1a1a1a]"
                >
                  <option value="Informatika">Informatika</option>
                  <option value="Koding">Koding & AI (KKA)</option>
                </select>
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="block text-[11px] font-bold text-[#1a1a1a]">
                  TARGET ASESMEN KALKULATOR:
                </label>
                <select
                  value={selectedQuiz.assessment}
                  onChange={(e) =>
                    handleUpdateSelectedQuiz({
                      ...selectedQuiz,
                      assessment: e.target.value as any,
                    })
                  }
                  className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-2 text-xs font-bold text-[#1a1a1a]"
                >
                  <option value="ASTS Gasal">ASTS Gasal</option>
                  <option value="ASAS Gasal">ASAS Gasal</option>
                  <option value="ASTS Genap">ASTS Genap</option>
                  <option value="ASAS Genap / ASASGN">ASAS Genap / ASASGN</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700">
                  TARGET TINGKAT:
                </label>
                <select
                  value={selectedQuiz.gradeLevel}
                  onChange={(e) => {
                    const gl = e.target.value as '7' | '8' | 'ALL';
                    const classes =
                      gl === '7'
                        ? [...GRADE_7_CLASSES]
                        : gl === '8'
                        ? [...GRADE_8_CLASSES]
                        : [...ALL_CLASSES];
                    handleUpdateSelectedQuiz({
                      ...selectedQuiz,
                      gradeLevel: gl,
                      targetClasses: classes,
                    });
                  }}
                  className="w-full bg-white border border-[#1a1a1a] px-2 py-1.5 text-xs font-bold"
                >
                  <option value="8">Kelas 8 (8A–8H)</option>
                  <option value="7">Kelas 7 (7E–7H)</option>
                  <option value="ALL">Semua Kelas (7 & 8)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700">
                  DURASI (MENIT):
                </label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={selectedQuiz.durationMinutes}
                  onChange={(e) =>
                    handleUpdateSelectedQuiz({
                      ...selectedQuiz,
                      durationMinutes: Math.max(5, Number(e.target.value) || 20),
                    })
                  }
                  className="w-full bg-white border border-[#1a1a1a] px-2.5 py-1.5 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700">
                  BATAS PINDAH TAB:
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={selectedQuiz.maxTabSwitches}
                  onChange={(e) =>
                    handleUpdateSelectedQuiz({
                      ...selectedQuiz,
                      maxTabSwitches: Math.max(1, Number(e.target.value) || 3),
                    })
                  }
                  className="w-full bg-white border border-[#1a1a1a] px-2.5 py-1.5 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700">
                  JENIS NILAI MASUK:
                </label>
                <select
                  value={selectedQuiz.isRemedialQuiz ? 'REMEDIAL' : 'UTAMA'}
                  onChange={(e) =>
                    handleUpdateSelectedQuiz({
                      ...selectedQuiz,
                      isRemedialQuiz: e.target.value === 'REMEDIAL',
                    })
                  }
                  className="w-full bg-white border border-[#1a1a1a] px-2 py-1.5 text-xs font-bold"
                >
                  <option value="UTAMA">Nilai Utama (PG+MJ+Uraian)</option>
                  <option value="REMEDIAL">Nilai Remedial (&lt; KKTP)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700">
                  KONVERSI SKOR:
                </label>
                <select
                  value={selectedQuiz.scoringScaleMode}
                  onChange={(e) =>
                    handleUpdateSelectedQuiz({
                      ...selectedQuiz,
                      scoringScaleMode: e.target.value as any,
                    })
                  }
                  className="w-full bg-white border border-[#1a1a1a] px-2 py-1.5 text-xs font-bold"
                >
                  <option value="PROPORSIONAL_100">Proporsional (Skala 100)</option>
                  <option value="JUMLAH_MENTAH">Jumlah Mentah Asli</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700">
                  ACAK SOAL & OPSI:
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateSelectedQuiz({
                      ...selectedQuiz,
                      shuffleQuestions: !selectedQuiz.shuffleQuestions,
                      shuffleOptions: !selectedQuiz.shuffleOptions,
                    })
                  }
                  className={`w-full px-2 py-1.5 text-xs font-bold border border-[#1a1a1a] cursor-pointer ${
                    selectedQuiz.shuffleQuestions
                      ? 'bg-emerald-500 text-[#1a1a1a]'
                      : 'bg-white text-slate-600'
                  }`}
                >
                  {selectedQuiz.shuffleQuestions ? '✓ ACAK AKTIF' : 'URUTAN TETAP'}
                </button>
              </div>
            </div>
          </div>

          {/* Add Question & Smart Bulk Importer Toolbar */}
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase text-[#1a1a1a] mr-1">
                  + TAMBAH BUTIR SOAL:
                </span>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('pg')}
                  className="px-3 py-1.5 text-xs font-bold bg-[#2e59e6] text-white border border-[#1a1a1a] hover:bg-blue-700 cursor-pointer"
                >
                  + PILIHAN GANDA (PG)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('matching')}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white border border-[#1a1a1a] hover:bg-emerald-500 cursor-pointer"
                >
                  + MENJODOHKAN
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('parsons')}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-400 text-[#1a1a1a] border border-[#1a1a1a] hover:bg-amber-300 cursor-pointer"
                >
                  + SUSUN ALGORITMA (PARSONS)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('code_output')}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white border border-[#1a1a1a] hover:bg-slate-700 cursor-pointer"
                >
                  + TEBAK OUTPUT KODE / HTML
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('essay')}
                  className="px-3 py-1.5 text-xs font-bold bg-[#F2EFEB] text-[#1a1a1a] border border-[#1a1a1a] hover:bg-slate-200 cursor-pointer"
                >
                  + URAIAN SINGKAT
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowBulkImporter(!showBulkImporter)}
                className="px-3 py-1.5 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-[#1a1a1a] cursor-pointer"
              >
                {showBulkImporter
                  ? 'TUTUP IMPORT COPY-PASTE'
                  : '⚡ IMPORT SOAL CEPAT (COPY-PASTE WORD/DOCS)'}
              </button>
            </div>

            {showBulkImporter && (
              <div className="p-4 bg-[#F2EFEB] border-2 border-[#1a1a1a] space-y-3">
                <div className="text-xs font-bold text-[#1a1a1a]">
                  PASTE DAFTAR SOAL DARI WORD / GOOGLE DOCS (Pisahkan antar soal dengan 1 baris kosong):
                </div>
                <textarea
                  rows={7}
                  value={bulkPasteText}
                  onChange={(e) => setBulkPasteText(e.target.value)}
                  placeholder={`Contoh Format Pilihan Ganda:\n1. Tag HTML untuk membuat paragraf adalah...\nA. <p>\nB. <h1>\nC. <img>\nD. <table>\nKunci: A\n\nContoh Format Menjodohkan:\n2. Pasangkan perangkat komputer berikut!\nCPU = Otak pemrosesan komputer\nRAM = Memori penyimpanan sementara\n\nContoh Format Uraian:\n3. Jelaskan apa yang dimaksud dengan algoritma!\nKata Kunci: urutan, langkah, logis`}
                  className="w-full bg-white border-2 border-[#1a1a1a] p-3 text-xs font-mono-code text-[#1a1a1a]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleRunBulkImport}
                    className="px-4 py-2 text-xs font-bold bg-[#2e59e6] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] cursor-pointer"
                  >
                    PROSES & TAMBAHKAN KE KUIS
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Question Cards List */}
          <div className="space-y-4">
            {selectedQuiz.questions.map((q, qIdx) => {
              const updateQuestion = (patched: QuizQuestion) => {
                const nextQs = selectedQuiz.questions.map((item, idx) =>
                  idx === qIdx ? patched : item
                );
                handleUpdateSelectedQuiz({ ...selectedQuiz, questions: nextQs });
              };

              const removeQuestion = () => {
                const nextQs = selectedQuiz.questions.filter((_, idx) => idx !== qIdx);
                handleUpdateSelectedQuiz({ ...selectedQuiz, questions: nextQs });
              };

              return (
                <div
                  key={q.id}
                  className="bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-[#1a1a1a]/20 pb-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="bg-[#1a1a1a] text-white px-2 py-0.5">
                        SOAL #{qIdx + 1}
                      </span>
                      <span className="text-[#2e59e6] uppercase">
                        {q.type === 'pg'
                          ? 'Pilihan Ganda (Masuk Benar PG)'
                          : q.type === 'code_output'
                          ? 'Tebak Output Kode / Live HTML (Masuk Benar PG)'
                          : q.type === 'matching'
                          ? 'Menjodohkan Kartu (Masuk Benar Menjodohkan)'
                          : q.type === 'parsons'
                          ? 'Susun Blok Algoritma / Parsons Puzzle (Masuk Skor Uraian/Koding)'
                          : 'Uraian Singkat (Masuk Skor Uraian)'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={removeQuestion}
                      className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> HAPUS SOAL
                    </button>
                  </div>

                  {/* Question Prompt Input */}
                  <div>
                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) =>
                        updateQuestion({ ...q, questionText: e.target.value })
                      }
                      className="w-full bg-[#F2EFEB]/60 border border-[#1a1a1a] p-2.5 text-xs font-sans font-semibold text-[#1a1a1a]"
                      placeholder="Tuliskan teks pertanyaan..."
                    />
                  </div>

                  {/* Optional Code Snippet for code_output or pg */}
                  {(q.type === 'code_output' || q.codeSnippet !== undefined) && (
                    <div className="space-y-2 bg-slate-900 text-slate-100 p-3 border border-[#1a1a1a]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-300 font-bold">
                          POTONGAN KODE (HTML / CSS / PSEUDOCODE / PYTHON):
                        </span>
                        <label className="flex items-center gap-1.5 cursor-pointer text-emerald-300">
                          <input
                            type="checkbox"
                            checked={!!q.liveHtmlPreview}
                            onChange={(e) =>
                              updateQuestion({ ...q, liveHtmlPreview: e.target.checked })
                            }
                          />
                          <span>Tampilkan Simulasi Live Preview HTML ke Siswa</span>
                        </label>
                      </div>
                      <textarea
                        rows={3}
                        value={q.codeSnippet || ''}
                        onChange={(e) =>
                          updateQuestion({ ...q, codeSnippet: e.target.value })
                        }
                        className="w-full bg-black/50 border border-slate-700 p-2 text-xs font-mono-code text-emerald-300"
                      />
                    </div>
                  )}

                  {/* Options for PG & Code Output */}
                  {(q.type === 'pg' || q.type === 'code_output') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(q.options || ['', '', '', '']).map((opt, optIdx) => {
                        const isCorrect = (q.correctOptionIndex ?? 0) === optIdx;
                        const letter = ['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1);
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 p-2 border ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-600'
                                : 'bg-white border-[#1a1a1a]/40'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                updateQuestion({ ...q, correctOptionIndex: optIdx })
                              }
                              className={`px-2 py-1 text-xs font-bold border cursor-pointer ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white border-[#1a1a1a]'
                                  : 'bg-[#F2EFEB] text-[#1a1a1a] border-[#1a1a1a]'
                              }`}
                              title="Klik untuk menetapkan sebagai Kunci Jawaban Benar"
                            >
                              {letter} {isCorrect ? '✓' : ''}
                            </button>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const nextOpts = [...(q.options || ['', '', '', ''])];
                                nextOpts[optIdx] = e.target.value;
                                updateQuestion({ ...q, options: nextOpts });
                              }}
                              className="flex-1 bg-transparent text-xs font-sans text-[#1a1a1a] focus:outline-none"
                              placeholder={`Teks Pilihan ${letter}...`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Matching Pairs Editor */}
                  {q.type === 'matching' && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-600">
                        PASANGAN KARTU MENJODOHKAN (Otomatis diacak di layar siswa):
                      </div>
                      {(q.matchingPairs || []).map((pair, pIdx) => (
                        <div key={pair.id} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 w-6">
                            #{pIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={pair.leftText}
                            onChange={(e) => {
                              const nextPairs = (q.matchingPairs || []).map((p, i) =>
                                i === pIdx ? { ...p, leftText: e.target.value } : p
                              );
                              updateQuestion({ ...q, matchingPairs: nextPairs });
                            }}
                            placeholder="Pernyataan / Tag Kiri"
                            className="flex-1 bg-[#F2EFEB] border border-[#1a1a1a] px-2.5 py-1.5 text-xs font-sans"
                          />
                          <span className="text-xs font-bold">⇄</span>
                          <input
                            type="text"
                            value={pair.rightText}
                            onChange={(e) => {
                              const nextPairs = (q.matchingPairs || []).map((p, i) =>
                                i === pIdx ? { ...p, rightText: e.target.value } : p
                              );
                              updateQuestion({ ...q, matchingPairs: nextPairs });
                            }}
                            placeholder="Pasangan Jawaban Kanan"
                            className="flex-1 bg-emerald-50 border border-emerald-700 px-2.5 py-1.5 text-xs font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextPairs = (q.matchingPairs || []).filter(
                                (_, i) => i !== pIdx
                              );
                              updateQuestion({ ...q, matchingPairs: nextPairs });
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const nextPairs = [
                            ...(q.matchingPairs || []),
                            {
                              id: `mp-${Date.now()}`,
                              leftText: 'Konsep Baru',
                              rightText: 'Pasangan Jawaban',
                            },
                          ];
                          updateQuestion({ ...q, matchingPairs: nextPairs });
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-[#F2EFEB] border border-[#1a1a1a] hover:bg-slate-200 cursor-pointer"
                      >
                        + Tambah Baris Pasangan
                      </button>
                    </div>
                  )}

                  {/* Parsons Puzzle Blocks Editor */}
                  {q.type === 'parsons' && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-600">
                        URUTAN BLOK ALGORITMA YANG BENAR (Akan diacak otomatis saat ditampilkan ke siswa):
                      </div>
                      {(q.parsonsBlocks || []).map((blk, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-amber-300 border border-[#1a1a1a] text-[10px] font-bold">
                            Langkah {bIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={blk}
                            onChange={(e) => {
                              const nextBlocks = (q.parsonsBlocks || []).map((b, i) =>
                                i === bIdx ? e.target.value : b
                              );
                              updateQuestion({ ...q, parsonsBlocks: nextBlocks });
                            }}
                            className="flex-1 bg-[#F2EFEB] border border-[#1a1a1a] px-2.5 py-1.5 text-xs font-mono-code"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextBlocks = (q.parsonsBlocks || []).filter(
                                (_, i) => i !== bIdx
                              );
                              updateQuestion({ ...q, parsonsBlocks: nextBlocks });
                            }}
                            className="p-1.5 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const nextBlocks = [
                            ...(q.parsonsBlocks || []),
                            `${(q.parsonsBlocks?.length || 0) + 1}. Langkah berikutnya...`,
                          ];
                          updateQuestion({ ...q, parsonsBlocks: nextBlocks });
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-[#F2EFEB] border border-[#1a1a1a] cursor-pointer"
                      >
                        + Tambah Langkah Algoritma
                      </button>
                    </div>
                  )}

                  {/* Essay Keywords Editor */}
                  {q.type === 'essay' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#F2EFEB]/60 p-3 border border-[#1a1a1a]/30">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          KATA KUNCI PENILAIAN OTOMATIS (Pisahkan dengan koma):
                        </label>
                        <input
                          type="text"
                          value={(q.expectedKeywords || []).join(', ')}
                          onChange={(e) =>
                            updateQuestion({
                              ...q,
                              expectedKeywords: e.target.value
                                .split(',')
                                .map((k) => k.trim().toLowerCase())
                                .filter(Boolean),
                            })
                          }
                          placeholder="algoritma, langkah, logis, verifikasi"
                          className="w-full bg-white border border-[#1a1a1a] px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          CONTOH KUNCI JAWABAN ACUAN:
                        </label>
                        <input
                          type="text"
                          value={q.sampleAnswer || ''}
                          onChange={(e) =>
                            updateQuestion({ ...q, sampleAnswer: e.target.value })
                          }
                          className="w-full bg-white border border-[#1a1a1a] px-2.5 py-1.5 text-xs font-sans"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 03: LIVE QUIZ ARENA & LEADERBOARD (MODE PROYEKTOR KELAS)
         ===================================================================== */}
      {activeSubTab === 'arena' && selectedQuiz && (
        <div className="space-y-6 font-mono-code">
          {/* Projector Hero Bar */}
          <div className="bg-[#1a1a1a] text-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#2e59e6] p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="text-xs text-amber-300 font-bold uppercase tracking-widest">
                  LIVE QUIZ ARENA · MODE PROYEKTOR KELAS
                </div>
                <h2 className="font-serif-display italic font-bold text-3xl sm:text-4xl text-white">
                  {selectedQuiz.title}
                </h2>
                <p className="text-xs text-slate-300">
                  Siswa membuka halaman <strong>/kuis</strong> di perangkat masing-masing, memilih Kelas & Nomor Absen, lalu memasukkan PIN Kuis di samping.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <div className="bg-amber-400 text-[#1a1a1a] border-2 border-white px-5 py-3 text-center shadow-[3px_3px_0px_#fff]">
                  <div className="text-[10px] font-bold uppercase tracking-widest">
                    TOKEN / PIN KUIS
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-widest mt-0.5">
                    {selectedQuiz.tokenPin}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => loadData(false)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#2e59e6] hover:bg-blue-500 text-white border border-white cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>REFRESH KLASEMEN</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncQuizResultsToSheet}
                    disabled={isSyncingSheet}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#1a1a1a] border border-white cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>
                      {isSyncingSheet
                        ? 'MENYINKRONKAN...'
                        : 'SINKRONKAN KE KALKULATOR & SHEET'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Top Leaderboard Students */}
            <div className="lg:col-span-7 bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden">
              <div className="bg-[#1a1a1a] text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    KLASEMEN LIVE ARENA (SKOR + BONUS KECEPATAN & STREAK)
                  </span>
                </div>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="bg-[#2a2a2a] text-white text-xs font-bold px-2.5 py-1 border border-white/30"
                >
                  <option value="ALL">Semua Kelas ({filteredSubmissions.length})</option>
                  {(selectedQuiz.targetClasses || ALL_CLASSES).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {arenaLeaderboard.length === 0 ? (
                <div className="p-10 text-center text-slate-500 space-y-2">
                  <Trophy className="h-8 w-8 mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-[#1a1a1a] uppercase">
                    BELUM ADA SISWA YANG MENYELESAIKAN KUIS INI
                  </p>
                  <p className="text-[11px] font-sans">
                    Minta siswa membuka menu <strong>/kuis</strong> dan memasukkan PIN{' '}
                    <strong>{selectedQuiz.tokenPin}</strong>. Klasemen akan otomatis muncul secara real-time.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#1a1a1a]/15 max-h-[480px] overflow-y-auto">
                  {arenaLeaderboard.map((sub, idx) => {
                    const rank = idx + 1;
                    return (
                      <div
                        key={sub.id}
                        className={`px-4 py-3 flex items-center justify-between gap-3 ${
                          rank === 1
                            ? 'bg-amber-50'
                            : rank === 2
                            ? 'bg-slate-50'
                            : rank === 3
                            ? 'bg-orange-50/40'
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 flex items-center justify-center font-black text-xs border-2 border-[#1a1a1a] shrink-0 ${
                              rank === 1
                                ? 'bg-amber-400 text-[#1a1a1a]'
                                : rank === 2
                                ? 'bg-slate-300 text-[#1a1a1a]'
                                : rank === 3
                                ? 'bg-amber-600 text-white'
                                : 'bg-[#F2EFEB] text-[#1a1a1a]'
                            }`}
                          >
                            #{rank}
                          </div>
                          <div className="min-w-0">
                            <div className="font-sans font-bold text-sm text-[#1a1a1a] truncate">
                              {sub.studentName}
                            </div>
                            <div className="text-[11px] text-slate-600">
                              {sub.className} · Absen {sub.attendanceNo} · Streak {sub.maxStreak}x ·{' '}
                              {sub.durationSpentSeconds} dtk
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-black text-[#2e59e6] tabular-nums">
                            {sub.arenaTotalPoints.toLocaleString('id-ID')} PTS
                          </div>
                          <div className="text-[11px] font-bold text-emerald-800 tabular-nums">
                            Nilai Akademik: {sub.finalScore} / 100
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 5 Cols: Per-Class Live Performance Comparison */}
            <div className="lg:col-span-5 bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden">
              <div className="bg-[#1a1a1a] text-white px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">
                  PERBANDINGAN PERFORMA KELAS (REAL-TIME)
                </span>
                <span className="text-[10px] text-emerald-300 font-bold">
                  KKTP: {selectedQuiz.kktp}
                </span>
              </div>

              <div className="p-4 space-y-3">
                {classArenaStats.map((st) => (
                  <div
                    key={st.className}
                    className="p-3 bg-[#F2EFEB] border border-[#1a1a1a] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#1a1a1a]">
                        {st.className} ({st.count} Siswa Selesai)
                      </span>
                      <span className="text-[#2e59e6] tabular-nums">
                        Rata-rata: {st.avgScore}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white border border-[#1a1a1a] overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, st.avgScore)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-600 flex justify-between">
                      <span>Tuntas KKTP: {st.passed} Siswa</span>
                      <span>
                        Partisipasi:{' '}
                        {st.count > 0 ? `${st.count} kiriman masuk` : 'Menunggu siswa'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 04: REKAP NILAI, KOREKSI URAIAN & MONITOR ANTI-CHEAT
         ===================================================================== */}
      {activeSubTab === 'submissions' && (
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] font-mono-code overflow-hidden">
          <div className="bg-[#1a1a1a] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase">
                REKAPITULASI HASIL KUIS SISWA & LOG PENGAWASAN ANTI-CHEAT
              </h3>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Rincian Benar PG, Menjodohkan, dan Skor Uraian otomatis terhubung dengan Kalkulator Akademik & Halaman /cek.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="bg-[#2a2a2a] text-white text-xs font-bold px-3 py-1.5 border border-white/30"
              >
                <option value="ALL">Semua Kelas ({filteredSubmissions.length})</option>
                {ALL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleSyncQuizResultsToSheet}
                disabled={isSyncingSheet}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#1a1a1a] border border-white cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>SINKRONKAN KE SHEET &apos;{CALCULATOR_BREAKDOWN_SHEET_NAME}&apos;</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F2EFEB] border-b-2 border-[#1a1a1a] text-[10px] font-bold uppercase text-[#1a1a1a]">
                  <th className="p-3 border-r border-[#1a1a1a]/20">KELAS / ABSEN</th>
                  <th className="p-3 border-r border-[#1a1a1a]/20">NAMA SISWA</th>
                  <th className="p-3 border-r border-[#1a1a1a]/20 text-center">
                    BENAR PG (SKALA 25)
                  </th>
                  <th className="p-3 border-r border-[#1a1a1a]/20 text-center">
                    MENJODOHKAN (SKALA 10)
                  </th>
                  <th className="p-3 border-r border-[#1a1a1a]/20 text-center">
                    SKOR URAIAN & LAB (MAKS 25)
                  </th>
                  <th className="p-3 border-r border-[#1a1a1a]/20 text-center">
                    NILAI AKHIR
                  </th>
                  <th className="p-3 border-r border-[#1a1a1a]/20 text-center">
                    LOG ANTI-CHEAT
                  </th>
                  <th className="p-3 text-center">AKSI GURU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]/20">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Belum ada data pengerjaan siswa untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub) => {
                    const isEditing = editingSubmissionId === sub.id;
                    return (
                      <tr key={sub.id} className="hover:bg-[#F2EFEB]/50">
                        <td className="p-3 border-r border-[#1a1a1a]/20 font-bold">
                          {sub.className} · #{sub.attendanceNo}
                        </td>
                        <td className="p-3 border-r border-[#1a1a1a]/20 font-sans font-bold">
                          {sub.studentName}
                          <div className="text-[10px] font-mono-code font-normal text-slate-500">
                            {sub.submittedAt} · {sub.isRemedial ? 'Mode Remedial' : sub.assessment}
                          </div>
                        </td>
                        <td className="p-3 border-r border-[#1a1a1a]/20 text-center tabular-nums font-bold">
                          {sub.calcBenarPG} / 25
                          <div className="text-[10px] font-normal text-slate-500">
                            (Mentah: {sub.rawPGCorrect}/{sub.rawPGTotal})
                          </div>
                        </td>
                        <td className="p-3 border-r border-[#1a1a1a]/20 text-center tabular-nums font-bold">
                          {sub.calcBenarMJ} / 10
                          <div className="text-[10px] font-normal text-slate-500">
                            (Mentah: {sub.rawMatchingCorrect}/{sub.rawMatchingTotal})
                          </div>
                        </td>
                        <td className="p-3 border-r border-[#1a1a1a]/20 text-center tabular-nums">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={25}
                                value={overrideUraianVal}
                                onChange={(e) => setOverrideUraianVal(e.target.value)}
                                className="w-14 bg-white border border-[#1a1a1a] px-1.5 py-1 text-center font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveManualEssayScore(sub)}
                                className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                              >
                                SIMPAN
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="font-bold">{sub.calcSkorUraian} / 25</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubmissionId(sub.id);
                                  setOverrideUraianVal(String(sub.calcSkorUraian));
                                }}
                                className="text-[10px] text-[#2e59e6] hover:underline cursor-pointer"
                                title="Ubah skor uraian"
                              >
                                [Edit]
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-3 border-r border-[#1a1a1a]/20 text-center tabular-nums">
                          <span
                            className={`text-sm font-black ${
                              sub.finalScore >= 75 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {sub.finalScore}
                          </span>
                        </td>
                        <td className="p-3 border-r border-[#1a1a1a]/20 text-center">
                          <div
                            className={`text-[11px] font-bold ${
                              sub.tabSwitchCount > 0 ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {sub.tabSwitchCount > 0
                              ? `${sub.tabSwitchCount}x Pindah Tab`
                              : 'Aman (0 Pindah Tab)'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Waktu: {sub.durationSpentSeconds} dtk
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={async () => {
                              const next = await resetStudentQuizAttemptOnServer(
                                sub.quizId,
                                sub.className,
                                sub.attendanceNo
                              );
                              setSubmissions(next);
                              onShowAlert?.(
                                'Percobaan Siswa Direset',
                                `${sub.studentName} (${sub.className}) kini dapat mengerjakan ulang kuis.`
                              );
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-600 cursor-pointer"
                            title="Izinkan siswa mengerjakan ulang"
                          >
                            <RotateCcw className="h-3 w-3" /> RESET
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
