import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Trophy,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Code2,
  AlertTriangle,
  ArrowLeft,
  Check,
  Send,
  BookOpen,
  Zap,
  Award,
  RefreshCw,
} from 'lucide-react';
import {
  InteractiveQuiz,
  QuizQuestion,
  QuizAttemptSubmission,
  fetchQuizzesAndSubmissionsFromServer,
  submitQuizAttemptToServer,
} from '../services/quizStore';
import {
  ALL_CLASSES,
  GRADE_7_CLASSES,
  GRADE_8_CLASSES,
  getStudentsByClass,
} from '../data/studentsAll';
import { formatDurationMMSS } from '../services/firebaseAuth';
import { playNotificationChime } from '../services/sound';

interface StudentQuizViewProps {
  initialPin?: string;
  initialClassName?: string;
  initialAttendanceNo?: number;
  onNavigateHome: () => void;
  onNavigateCek: (gradeLevel: '7' | '8') => void;
}

interface ShuffledOptionItem {
  originalIndex: number;
  text: string;
}

// Deterministic simple seeded shuffle so options don't re-shuffle on every re-render
function seededShuffle<T>(arr: T[], seedStr: string): T[] {
  const copy = [...arr];
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) | 0;
    const j = Math.abs(hash) % (i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export const StudentQuizView: React.FC<StudentQuizViewProps> = ({
  initialPin = '',
  initialClassName = 'Kelas 8A',
  initialAttendanceNo = 1,
  onNavigateHome,
  onNavigateCek,
}) => {
  const [quizzes, setQuizzes] = useState<InteractiveQuiz[]>([]);
  const [submissions, setSubmissions] = useState<QuizAttemptSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Student Selection & PIN State
  const [selectedClass, setSelectedClass] = useState<string>(
    initialClassName.startsWith('Kelas ') ? initialClassName : `Kelas ${initialClassName}`
  );
  const [selectedAttendanceNo, setSelectedAttendanceNo] = useState<number>(
    initialAttendanceNo || 1
  );
  const [pinInput, setPinInput] = useState<string>(initialPin.toUpperCase());
  const [entryError, setEntryError] = useState<string | null>(null);

  // Active Exam Session State
  const [activeQuiz, setActiveQuiz] = useState<InteractiveQuiz | null>(null);
  const [isExamRunning, setIsExamRunning] = useState<boolean>(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Anti-cheat tab switch tracking
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [tabWarningBanner, setTabWarningBanner] = useState<string | null>(null);

  // Student Answers State
  // pgAnswers: questionId -> originalOptionIndex
  const [pgAnswers, setPgAnswers] = useState<Record<string, number>>({});
  // matchingAnswers: questionId -> { pairId: selectedRightText }
  const [matchingAnswers, setMatchingAnswers] = useState<
    Record<string, Record<string, string>>
  >({});
  // Active left card selection for 2-click matching
  const [selectedLeftPairId, setSelectedLeftPairId] = useState<string | null>(null);
  // parsonsAnswers: questionId -> string[] (ordered blocks)
  const [parsonsAnswers, setParsonsAnswers] = useState<Record<string, string[]>>({});
  // essayAnswers: questionId -> string
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});

  // Completed / Submitted Result State
  const [completedSubmission, setCompletedSubmission] =
    useState<QuizAttemptSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitLockRef = useRef<boolean>(false);

  // Load quizzes and submissions from server
  useEffect(() => {
    let mounted = true;
    async function initLoad() {
      setIsLoading(true);
      try {
        const res = await fetchQuizzesAndSubmissionsFromServer();
        if (mounted) {
          setQuizzes(res.quizzes);
          setSubmissions(res.submissions);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    initLoad();
    return () => {
      mounted = false;
    };
  }, []);

  // Update URL search params if initialPin provided
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qPin = params.get('pin');
    const qClass = params.get('kelas');
    const qAbsen = params.get('absen');
    if (qPin) setPinInput(qPin.toUpperCase());
    if (qClass) {
      const norm = qClass.startsWith('Kelas ') ? qClass : `Kelas ${qClass}`;
      if (ALL_CLASSES.includes(norm)) setSelectedClass(norm);
    }
    if (qAbsen && !isNaN(Number(qAbsen))) {
      setSelectedAttendanceNo(Number(qAbsen));
    }
  }, []);

  const classStudents = useMemo(
    () => getStudentsByClass(selectedClass),
    [selectedClass]
  );

  const currentStudent = useMemo(
    () =>
      classStudents.find((s) => s.attendanceNo === selectedAttendanceNo) ||
      classStudents[0] ||
      null,
    [classStudents, selectedAttendanceNo]
  );

  // Active quizzes available for the selected class
  const availableQuizzesForClass = useMemo(() => {
    return quizzes.filter(
      (q) =>
        q.isActive &&
        (q.gradeLevel === 'ALL' ||
          q.targetClasses.includes(selectedClass) ||
          (selectedClass.includes('7') && q.gradeLevel === '7') ||
          (selectedClass.includes('8') && q.gradeLevel === '8'))
    );
  }, [quizzes, selectedClass]);

  // Prepare shuffled questions for the student when activeQuiz starts
  const preparedQuestions = useMemo<QuizQuestion[]>(() => {
    if (!activeQuiz || !currentStudent) return [];
    const seedKey = `${activeQuiz.id}-${selectedClass}-${currentStudent.attendanceNo}`;
    if (activeQuiz.shuffleQuestions) {
      return seededShuffle(activeQuiz.questions, seedKey);
    }
    return activeQuiz.questions;
  }, [activeQuiz, currentStudent, selectedClass]);

  // Start Quiz Handler
  const handleStartQuiz = (targetQuiz?: InteractiveQuiz) => {
    setEntryError(null);
    const cleanPin = (targetQuiz?.tokenPin || pinInput).trim().toUpperCase();
    if (!cleanPin) {
      setEntryError('Masukkan Token / PIN Kuis atau klik salah satu paket kuis aktif di bawah.');
      return;
    }

    const foundQuiz =
      targetQuiz ||
      quizzes.find((q) => q.tokenPin.toUpperCase() === cleanPin && q.isActive);

    if (!foundQuiz) {
      setEntryError(
        `Token / PIN Kuis "${cleanPin}" tidak ditemukan atau sedang dinonaktifkan oleh Guru.`
      );
      return;
    }

    if (!currentStudent) {
      setEntryError('Pilih Kelas dan Nama Siswa terlebih dahulu.');
      return;
    }

    // Check if student already submitted this quiz
    const existingAttempt = submissions.find(
      (s) =>
        s.quizId === foundQuiz.id &&
        s.className === selectedClass &&
        Number(s.attendanceNo) === Number(currentStudent.attendanceNo)
    );

    if (existingAttempt) {
      setActiveQuiz(foundQuiz);
      setCompletedSubmission(existingAttempt);
      setIsExamRunning(false);
      return;
    }

    // Initialize Parsons Puzzle blocks in shuffled order
    const initParsons: Record<string, string[]> = {};
    foundQuiz.questions.forEach((q) => {
      if (q.type === 'parsons' && q.parsonsBlocks && q.parsonsBlocks.length > 0) {
        const seed = `${foundQuiz.id}-${q.id}-${currentStudent.attendanceNo}`;
        let shuf: string[] = seededShuffle<string>(q.parsonsBlocks, seed);
        if (
          shuf.length > 1 &&
          shuf.every((val, idx) => val === q.parsonsBlocks![idx])
        ) {
          shuf = [...shuf.slice(1), shuf[0]];
        }
        initParsons[q.id] = shuf;
      }
    });

    submitLockRef.current = false;
    setPgAnswers({});
    setMatchingAnswers({});
    setParsonsAnswers(initParsons);
    setEssayAnswers({});
    setTabSwitchCount(0);
    setTabWarningBanner(null);
    setCurrentQuestionIdx(0);
    setCompletedSubmission(null);
    setActiveQuiz(foundQuiz);
    setRemainingSeconds((foundQuiz.durationMinutes || 20) * 60);
    setElapsedSeconds(0);
    setIsExamRunning(true);
  };

  // 1-Second Exam Countdown Timer
  useEffect(() => {
    if (!isExamRunning || !activeQuiz) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishAndSubmit(true, false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamRunning, activeQuiz]);

  // Anti-Cheat: Detect Tab Switch / Window Blur while exam is running
  useEffect(() => {
    if (!isExamRunning || !activeQuiz) return;

    const handleVisibilityOrBlur = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const nextCount = prev + 1;
          const maxAllowed = activeQuiz.maxTabSwitches || 3;
          if (nextCount >= maxAllowed) {
            setTabWarningBanner(
              `Batas pindah tab (${maxAllowed}x) terlampaui! Jawaban Anda dikirimkan secara otomatis.`
            );
            setTimeout(() => {
              handleFinishAndSubmit(false, true, nextCount);
            }, 400);
          } else {
            setTabWarningBanner(
              `PERINGATAN ANTI-CHEAT (${nextCount}/${maxAllowed}): Anda terdeteksi keluar dari halaman kuis. Jangan berpindah tab agar kuis tidak terkunci otomatis!`
            );
          }
          return nextCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrBlur);
    };
  }, [isExamRunning, activeQuiz]);

  // Grade & Submit Quiz Attempt
  const handleFinishAndSubmit = async (
    byTimeout = false,
    byTabLimit = false,
    overrideTabCount?: number
  ) => {
    if (submitLockRef.current || !activeQuiz || !currentStudent) return;
    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      let rawPGCorrect = 0;
      let rawPGTotal = 0;
      let rawMatchingCorrect = 0;
      let rawMatchingTotal = 0;
      let rawEssayAndLabPoints = 0;
      let rawEssayAndLabMax = 0;

      let currentStreak = 0;
      let maxStreak = 0;

      activeQuiz.questions.forEach((q) => {
        if (q.type === 'pg' || q.type === 'code_output') {
          rawPGTotal += 1;
          const chosen = pgAnswers[q.id];
          const isCorrect = chosen !== undefined && chosen === (q.correctOptionIndex ?? 0);
          if (isCorrect) {
            rawPGCorrect += 1;
            currentStreak += 1;
            if (currentStreak > maxStreak) maxStreak = currentStreak;
          } else {
            currentStreak = 0;
          }
        } else if (q.type === 'matching') {
          const pairs = q.matchingPairs || [];
          rawMatchingTotal += pairs.length;
          const studentMap = matchingAnswers[q.id] || {};
          let allPairsRight = true;
          pairs.forEach((p) => {
            if (studentMap[p.id] === p.rightText) {
              rawMatchingCorrect += 1;
            } else {
              allPairsRight = false;
            }
          });
          if (allPairsRight && pairs.length > 0) {
            currentStreak += 1;
            if (currentStreak > maxStreak) maxStreak = currentStreak;
          }
        } else if (q.type === 'parsons') {
          const maxPts = q.maxPoints || 15;
          rawEssayAndLabMax += maxPts;
          const targetBlocks = q.parsonsBlocks || [];
          const studentBlocks = parsonsAnswers[q.id] || [];
          if (targetBlocks.length > 0) {
            let correctPositions = 0;
            targetBlocks.forEach((blk, idx) => {
              if (studentBlocks[idx] === blk) correctPositions += 1;
            });
            const earned = Math.round((correctPositions / targetBlocks.length) * maxPts);
            rawEssayAndLabPoints += earned;
            if (correctPositions === targetBlocks.length) {
              currentStreak += 1;
              if (currentStreak > maxStreak) maxStreak = currentStreak;
            }
          }
        } else if (q.type === 'essay') {
          const maxPts = q.maxPoints || 10;
          rawEssayAndLabMax += maxPts;
          const ansText = (essayAnswers[q.id] || '').trim().toLowerCase();
          if (ansText.length >= 5) {
            const kws = q.expectedKeywords || [];
            if (kws.length === 0) {
              rawEssayAndLabPoints += maxPts;
            } else {
              const matchedCount = kws.filter((kw) => ansText.includes(kw.toLowerCase())).length;
              // Base points for writing a thoughtful sentence + keyword accuracy
              const kwRatio = Math.min(1, matchedCount / Math.max(1, Math.min(3, kws.length)));
              const lengthBonus = ansText.length >= 25 ? 0.35 : 0.15;
              const finalRatio = Math.min(1, kwRatio * 0.75 + lengthBonus);
              rawEssayAndLabPoints += Math.round(finalRatio * maxPts);
            }
          }
        }
      });

      // Convert to Calculator Academic Scale (Benar PG max 25, Benar MJ max 10, Skor Uraian max 25)
      let calcBenarPG = rawPGCorrect;
      let calcBenarMJ = rawMatchingCorrect;
      let calcSkorUraian = Math.min(25, rawEssayAndLabPoints);

      if (activeQuiz.scoringScaleMode === 'PROPORSIONAL_100') {
        calcBenarPG =
          rawPGTotal > 0 ? Math.round((rawPGCorrect / rawPGTotal) * 25) : 0;
        calcBenarMJ =
          rawMatchingTotal > 0
            ? Math.round((rawMatchingCorrect / rawMatchingTotal) * 10)
            : 0;
        calcSkorUraian =
          rawEssayAndLabMax > 0
            ? Math.round((rawEssayAndLabPoints / rawEssayAndLabMax) * 25)
            : 0;
      }

      const pgPoints = Math.min(50, calcBenarPG * 2);
      const mjPoints = Math.min(25, calcBenarMJ * 2.5);
      const finalScore = Math.min(100, Math.round(pgPoints + mjPoints + calcSkorUraian));

      // Calculate Live Arena Speed & Streak Bonus Points
      const totalAllowedSec = (activeQuiz.durationMinutes || 20) * 60;
      const speedRatio = Math.max(
        0,
        (totalAllowedSec - elapsedSeconds) / Math.max(1, totalAllowedSec)
      );
      const speedBonusPoints =
        finalScore >= 50
          ? Math.round(speedRatio * 1200) + maxStreak * 250
          : maxStreak * 100;
      const arenaTotalPoints = finalScore * 100 + speedBonusPoints;

      const submissionPayload: QuizAttemptSubmission = {
        id: `qsub-${Date.now()}-${currentStudent.attendanceNo}`,
        quizId: activeQuiz.id,
        quizTitle: activeQuiz.title,
        tokenPin: activeQuiz.tokenPin,
        className: selectedClass,
        attendanceNo: currentStudent.attendanceNo,
        studentName: currentStudent.name,
        nis: currentStudent.nis,
        subject: activeQuiz.subject,
        assessment: activeQuiz.assessment,
        isRemedial: activeQuiz.isRemedialQuiz,
        rawPGCorrect,
        rawPGTotal,
        rawMatchingCorrect,
        rawMatchingTotal,
        rawEssayAndLabPoints,
        rawEssayAndLabMax,
        calcBenarPG,
        calcBenarMJ,
        calcSkorUraian,
        finalScore,
        speedBonusPoints,
        arenaTotalPoints,
        maxStreak,
        durationSpentSeconds: elapsedSeconds,
        tabSwitchCount: overrideTabCount ?? tabSwitchCount,
        autoSubmittedByTimeout: byTimeout,
        autoSubmittedByTabLimit: byTabLimit,
        answersDetail: {
          pgAnswers,
          matchingAnswers,
          parsonsAnswers,
          essayAnswers,
        },
        submittedAt: new Date().toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        syncedToCalculator: true,
      };

      const res = await submitQuizAttemptToServer(submissionPayload);
      setSubmissions(res.submissions);
      setCompletedSubmission(submissionPayload);
      setIsExamRunning(false);
      playNotificationChime();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Current active question
  const currentQuestion = preparedQuestions[currentQuestionIdx] || null;

  // Check if a question is answered
  const isQuestionAnswered = (q: QuizQuestion): boolean => {
    if (q.type === 'pg' || q.type === 'code_output') {
      return pgAnswers[q.id] !== undefined;
    }
    if (q.type === 'matching') {
      const pairs = q.matchingPairs || [];
      const ans = matchingAnswers[q.id] || {};
      return pairs.length > 0 && pairs.every((p) => !!ans[p.id]);
    }
    if (q.type === 'parsons') {
      return (parsonsAnswers[q.id] || []).length > 0;
    }
    if (q.type === 'essay') {
      return (essayAnswers[q.id] || '').trim().length > 0;
    }
    return false;
  };

  // Leaderboard for the completed quiz
  const currentQuizLeaderboard = useMemo(() => {
    if (!activeQuiz) return [];
    return submissions
      .filter((s) => s.quizId === activeQuiz.id)
      .sort((a, b) => b.arenaTotalPoints - a.arenaTotalPoints || b.finalScore - a.finalScore);
  }, [submissions, activeQuiz]);

  // =========================================================================
  // VIEW 1: EXAM RUNNING WORKSPACE
  // =========================================================================
  if (isExamRunning && activeQuiz && currentStudent && currentQuestion) {
    const seedForOptions = `${activeQuiz.id}-${currentQuestion.id}-${currentStudent.attendanceNo}`;
    const displayOptions: ShuffledOptionItem[] =
      currentQuestion.type === 'pg' || currentQuestion.type === 'code_output'
        ? (() => {
            const base = (currentQuestion.options || []).map((text, idx) => ({
              originalIndex: idx,
              text,
            }));
            return activeQuiz.shuffleOptions
              ? seededShuffle(base, seedForOptions)
              : base;
          })()
        : [];

    const shuffledRightMatchingChoices: string[] =
      currentQuestion.type === 'matching'
        ? seededShuffle(
            (currentQuestion.matchingPairs || []).map((p) => p.rightText),
            seedForOptions
          )
        : [];

    const answeredCount = preparedQuestions.filter((q) => isQuestionAnswered(q)).length;

    return (
      <div className="space-y-5 pb-16 font-sans">
        {/* Sticky Exam Top Header */}
        <div className="bg-[#1a1a1a] text-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#2e59e6] p-4 font-mono-code">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                UJIAN / KUIS INTERAKTIF BERLANGSUNG · PIN: {activeQuiz.tokenPin}
              </div>
              <h2 className="font-sans font-bold text-base sm:text-lg text-white">
                {currentStudent.name} ({selectedClass} · No. Absen {currentStudent.attendanceNo})
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Anti-Cheat Tab Switch Status */}
              <div
                className={`px-3 py-1.5 text-xs font-bold border ${
                  tabSwitchCount > 0
                    ? 'bg-rose-600 text-white border-white animate-pulse'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                }`}
              >
                PENGAWAS TAB: {tabSwitchCount} / {activeQuiz.maxTabSwitches}x
              </div>

              {/* Countdown Timer */}
              <div
                className={`px-3.5 py-1.5 text-sm sm:text-base font-black border-2 border-white flex items-center gap-2 tabular-nums ${
                  remainingSeconds <= 180
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-amber-400 text-[#1a1a1a]'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>{formatDurationMMSS(remainingSeconds)}</span>
              </div>

              <button
                type="button"
                onClick={() => handleFinishAndSubmit(false, false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-[#1a1a1a] border-2 border-white cursor-pointer"
              >
                {isSubmitting ? 'MENGIRIM...' : 'SELESAI & KIRIM'}
              </button>
            </div>
          </div>

          {/* Question Number Navigation Bar */}
          <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {preparedQuestions.map((q, idx) => {
                const isCurr = idx === currentQuestionIdx;
                const isDone = isQuestionAnswered(q);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setSelectedLeftPairId(null);
                      setCurrentQuestionIdx(idx);
                    }}
                    className={`w-8 h-8 text-xs font-bold border transition-all cursor-pointer tabular-nums ${
                      isCurr
                        ? 'bg-[#2e59e6] text-white border-white shadow-[2px_2px_0px_#fff]'
                        : isDone
                        ? 'bg-emerald-500 text-[#1a1a1a] border-emerald-300'
                        : 'bg-white/10 text-slate-300 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-300 font-bold">
              Terjawab: {answeredCount} / {preparedQuestions.length} Soal
            </div>
          </div>
        </div>

        {/* Anti-Cheat Warning Banner if triggered */}
        {tabWarningBanner && (
          <div className="bg-rose-600 text-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-3.5 font-mono-code text-xs font-bold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{tabWarningBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setTabWarningBanner(null)}
              className="px-2 py-1 bg-black/30 text-white text-[10px] cursor-pointer"
            >
              MENGERTI
            </button>
          </div>
        )}

        {/* Active Question Card */}
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] p-5 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#1a1a1a] pb-3 font-mono-code">
            <div className="text-xs font-bold text-[#2e59e6] uppercase">
              SOAL {currentQuestionIdx + 1} DARI {preparedQuestions.length} ·{' '}
              {currentQuestion.type === 'pg'
                ? 'PILIHAN GANDA'
                : currentQuestion.type === 'code_output'
                ? 'TEBAK OUTPUT KODE & LIVE PREVIEW'
                : currentQuestion.type === 'matching'
                ? 'MENJODOHKAN PASANGAN KONSEP'
                : currentQuestion.type === 'parsons'
                ? 'MINI-LAB: SUSUN BLOK ALGORITMA (PARSONS PUZZLE)'
                : 'URAIAN SINGKAT / PENALARAN'}
            </div>
            <div className="text-xs text-slate-500">
              {activeQuiz.subject === 'Koding' ? 'Mapel KKA' : 'Mapel Informatika'}
            </div>
          </div>

          {/* Question Text */}
          <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] leading-relaxed">
            {currentQuestion.questionText}
          </h3>

          {/* Optional Code Snippet & Live HTML Preview */}
          {currentQuestion.codeSnippet && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div
                className={
                  currentQuestion.liveHtmlPreview ? 'lg:col-span-7' : 'lg:col-span-12'
                }
              >
                <div className="bg-slate-900 text-emerald-300 border-2 border-[#1a1a1a] p-4 font-mono-code text-xs overflow-x-auto">
                  <div className="text-[10px] text-slate-400 uppercase mb-2 pb-1 border-b border-slate-700">
                    BLOK KODE PROGRAM / ALGORITMA:
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {currentQuestion.codeSnippet}
                  </pre>
                </div>
              </div>

              {currentQuestion.liveHtmlPreview && (
                <div className="lg:col-span-5">
                  <div className="bg-[#F2EFEB] border-2 border-[#1a1a1a] p-3 h-full flex flex-col">
                    <div className="font-mono-code text-[10px] font-bold text-[#1a1a1a] uppercase mb-2 pb-1 border-b border-[#1a1a1a]/20">
                      SIMULASI TAMPILAN BROWSER (LIVE PREVIEW):
                    </div>
                    <div
                      className="bg-white border border-[#1a1a1a] p-3 flex-1"
                      dangerouslySetInnerHTML={{ __html: currentQuestion.codeSnippet }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 1. INTERACTION FOR PG & CODE OUTPUT */}
          {(currentQuestion.type === 'pg' || currentQuestion.type === 'code_output') && (
            <div className="grid grid-cols-1 gap-3 pt-2">
              {displayOptions.map((item, dispIdx) => {
                const letter = ['A', 'B', 'C', 'D'][dispIdx] || String(dispIdx + 1);
                const isSelected = pgAnswers[currentQuestion.id] === item.originalIndex;
                return (
                  <button
                    key={item.originalIndex}
                    type="button"
                    onClick={() =>
                      setPgAnswers((prev) => ({
                        ...prev,
                        [currentQuestion.id]: item.originalIndex,
                      }))
                    }
                    className={`w-full text-left p-4 border-2 transition-all flex items-center gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2e59e6] text-white border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]'
                        : 'bg-[#F2EFEB]/60 hover:bg-[#F2EFEB] text-[#1a1a1a] border-[#1a1a1a]'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 flex items-center justify-center font-mono-code font-black text-xs border-2 shrink-0 ${
                        isSelected
                          ? 'bg-amber-400 text-[#1a1a1a] border-[#1a1a1a]'
                          : 'bg-white text-[#1a1a1a] border-[#1a1a1a]'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-sm font-semibold leading-snug">{item.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. INTERACTION FOR MATCHING (PASANGKAN KARTU KIRI & KANAN) */}
          {currentQuestion.type === 'matching' && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-blue-50 border border-[#1a1a1a] text-xs font-mono-code text-slate-700">
                <strong>Cara Menjodohkan:</strong> Klik salah satu kartu di kolom{' '}
                <strong>KIRI</strong>, lalu klik pasangan yang tepat di kolom{' '}
                <strong>KANAN</strong> (atau pilih langsung melalui menu dropdown pada tiap baris).
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column Items */}
                <div className="space-y-2.5">
                  <div className="font-mono-code text-xs font-bold uppercase text-[#1a1a1a]">
                    KOLOM KIRI (KONSEP / PERNYATAAN):
                  </div>
                  {(currentQuestion.matchingPairs || []).map((pair, idx) => {
                    const currentMatchedRight =
                      matchingAnswers[currentQuestion.id]?.[pair.id] || '';
                    const isLeftActive = selectedLeftPairId === pair.id;

                    return (
                      <div
                        key={pair.id}
                        onClick={() =>
                          setSelectedLeftPairId(isLeftActive ? null : pair.id)
                        }
                        className={`p-3.5 border-2 transition-all cursor-pointer space-y-2 ${
                          isLeftActive
                            ? 'bg-amber-100 border-[#1a1a1a] shadow-[3px_3px_0px_#2e59e6]'
                            : currentMatchedRight
                            ? 'bg-emerald-50 border-[#1a1a1a]'
                            : 'bg-[#F2EFEB] border-[#1a1a1a]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1a1a1a]">
                            {idx + 1}. {pair.leftText}
                          </span>
                          <span className="font-mono-code text-[10px] font-bold text-[#2e59e6]">
                            {isLeftActive ? '[PILIH KANAN →]' : ''}
                          </span>
                        </div>

                        {/* Direct Dropdown Fallback / Selector */}
                        <select
                          value={currentMatchedRight}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMatchingAnswers((prev) => ({
                              ...prev,
                              [currentQuestion.id]: {
                                ...(prev[currentQuestion.id] || {}),
                                [pair.id]: val,
                              },
                            }));
                            setSelectedLeftPairId(null);
                          }}
                          className="w-full bg-white border border-[#1a1a1a] px-2.5 py-1.5 text-xs font-semibold text-[#1a1a1a]"
                        >
                          <option value="">-- Pilih Pasangan Jawaban --</option>
                          {shuffledRightMatchingChoices.map((rText, rIdx) => (
                            <option key={rIdx} value={rText}>
                              {rText}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column Cards (Click to pair with selectedLeftPairId) */}
                <div className="space-y-2.5">
                  <div className="font-mono-code text-xs font-bold uppercase text-[#1a1a1a]">
                    KOLOM KANAN (KLIK UNTUK MEMASANGKAN):
                  </div>
                  {shuffledRightMatchingChoices.map((rText, rIdx) => {
                    const usedByPair = (currentQuestion.matchingPairs || []).find(
                      (p) => matchingAnswers[currentQuestion.id]?.[p.id] === rText
                    );

                    return (
                      <button
                        key={rIdx}
                        type="button"
                        onClick={() => {
                          if (!selectedLeftPairId) return;
                          setMatchingAnswers((prev) => ({
                            ...prev,
                            [currentQuestion.id]: {
                              ...(prev[currentQuestion.id] || {}),
                              [selectedLeftPairId]: rText,
                            },
                          }));
                          setSelectedLeftPairId(null);
                        }}
                        className={`w-full text-left p-3.5 border-2 transition-all cursor-pointer ${
                          selectedLeftPairId
                            ? 'bg-white hover:bg-[#2e59e6] hover:text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                            : usedByPair
                            ? 'bg-emerald-100 text-emerald-950 border-[#1a1a1a]'
                            : 'bg-white text-[#1a1a1a] border-[#1a1a1a]/60'
                        }`}
                      >
                        <div className="text-xs font-semibold">{rText}</div>
                        {usedByPair && (
                          <div className="font-mono-code text-[10px] font-bold text-emerald-800 mt-1">
                            ✓ Terpasang ke: {usedByPair.leftText}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. INTERACTION FOR PARSONS PUZZLE (SUSUN BLOK ALGORITMA) */}
          {currentQuestion.type === 'parsons' && (
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-amber-50 border border-[#1a1a1a] text-xs font-mono-code text-amber-950">
                Gunakan tombol <strong>[↑ NAIKKAN]</strong> dan <strong>[↓ TURUNKAN]</strong> untuk menyusun blok algoritma di bawah ini agar berurutan dengan benar dari langkah pertama hingga terakhir!
              </div>

              <div className="space-y-2">
                {(parsonsAnswers[currentQuestion.id] || currentQuestion.parsonsBlocks || []).map(
                  (blockText, bIdx, arr) => (
                    <div
                      key={bIdx}
                      className="bg-[#F2EFEB] border-2 border-[#1a1a1a] p-3 flex items-center justify-between gap-3 shadow-[2px_2px_0px_#1a1a1a]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2.5 py-1 bg-[#1a1a1a] text-amber-300 font-mono-code text-xs font-bold shrink-0">
                          URUTAN #{bIdx + 1}
                        </span>
                        <span className="font-mono-code text-xs sm:text-sm font-bold text-[#1a1a1a]">
                          {blockText}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 font-mono-code">
                        <button
                          type="button"
                          disabled={bIdx === 0}
                          onClick={() => {
                            const copy = [...arr];
                            const temp = copy[bIdx - 1];
                            copy[bIdx - 1] = copy[bIdx];
                            copy[bIdx] = temp;
                            setParsonsAnswers((prev) => ({
                              ...prev,
                              [currentQuestion.id]: copy,
                            }));
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-[#2e59e6] hover:text-white text-[#1a1a1a] border border-[#1a1a1a] text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
                        >
                          <ArrowUp className="h-3.5 w-3.5" /> NAIK
                        </button>
                        <button
                          type="button"
                          disabled={bIdx === arr.length - 1}
                          onClick={() => {
                            const copy = [...arr];
                            const temp = copy[bIdx + 1];
                            copy[bIdx + 1] = copy[bIdx];
                            copy[bIdx] = temp;
                            setParsonsAnswers((prev) => ({
                              ...prev,
                              [currentQuestion.id]: copy,
                            }));
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-[#2e59e6] hover:text-white text-[#1a1a1a] border border-[#1a1a1a] text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
                        >
                          <ArrowDown className="h-3.5 w-3.5" /> TURUN
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* 4. INTERACTION FOR ESSAY / URAIAN SINGKAT */}
          {currentQuestion.type === 'essay' && (
            <div className="space-y-2 pt-2">
              <label className="block font-mono-code text-xs font-bold text-slate-700 uppercase">
                TULISKAN JAWABAN URAIAN ANDA SECARA JELAS & LENGKAP:
              </label>
              <textarea
                rows={5}
                value={essayAnswers[currentQuestion.id] || ''}
                onChange={(e) =>
                  setEssayAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: e.target.value,
                  }))
                }
                placeholder="Ketik jawaban uraianmu di sini..."
                className="w-full bg-[#F2EFEB]/60 border-2 border-[#1a1a1a] p-3.5 text-sm font-sans text-[#1a1a1a] focus:bg-white focus:outline-none"
              />
            </div>
          )}

          {/* Bottom Prev / Next / Submit Navigation */}
          <div className="pt-4 border-t-2 border-[#1a1a1a] flex items-center justify-between gap-3 font-mono-code">
            <button
              type="button"
              disabled={currentQuestionIdx === 0}
              onClick={() => {
                setSelectedLeftPairId(null);
                setCurrentQuestionIdx((prev) => Math.max(0, prev - 1));
              }}
              className="px-4 py-2.5 text-xs font-bold bg-[#F2EFEB] hover:bg-slate-200 text-[#1a1a1a] border-2 border-[#1a1a1a] disabled:opacity-40 cursor-pointer"
            >
              ← SOAL SEBELUMNYA
            </button>

            {currentQuestionIdx < preparedQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedLeftPairId(null);
                  setCurrentQuestionIdx((prev) =>
                    Math.min(preparedQuestions.length - 1, prev + 1)
                  );
                }}
                className="px-5 py-2.5 text-xs font-bold bg-[#2e59e6] hover:bg-blue-700 text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] cursor-pointer"
              >
                SOAL BERIKUTNYA →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinishAndSubmit(false, false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] cursor-pointer"
              >
                ✓ KIRIM JAWABAN KUIS SEKARANG
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: COMPLETED QUIZ RESULT & LIVE ARENA LEADERBOARD
  // =========================================================================
  if (completedSubmission && activeQuiz) {
    const isGrade7 = completedSubmission.className.includes('7');

    return (
      <div className="space-y-6 pb-16 font-sans">
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-2 border-[#1a1a1a] pb-5">
            <div>
              <div className="font-mono-code text-xs font-bold text-emerald-700 uppercase">
                ✓ JAWABAN KUIS TERSIMPAN & MASUK KE KALKULATOR AKADEMIK
              </div>
              <h1 className="font-serif-display italic font-bold text-3xl sm:text-4xl text-[#1a1a1a] mt-1">
                Hasil Kuis: {completedSubmission.studentName}
              </h1>
              <p className="font-mono-code text-xs text-slate-600 mt-1">
                {completedSubmission.className} · No. Absen {completedSubmission.attendanceNo} ·{' '}
                {completedSubmission.quizTitle}
              </p>
            </div>

            <div className="bg-[#1a1a1a] text-white border-2 border-[#1a1a1a] px-6 py-4 text-center font-mono-code shadow-[3px_3px_0px_#2e59e6]">
              <div className="text-[10px] font-bold text-amber-300 uppercase">
                {completedSubmission.isRemedial ? 'NILAI REMEDIAL' : 'TOTAL NILAI AKADEMIK'}
              </div>
              <div className="text-4xl font-black tabular-nums mt-0.5">
                {completedSubmission.finalScore}
              </div>
              <div className="text-[10px] text-emerald-400 font-bold mt-1">
                {completedSubmission.arenaTotalPoints.toLocaleString('id-ID')} Poin Arena
              </div>
            </div>
          </div>

          {/* Breakdown Grid matching Calculator Master */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono-code">
            <div className="bg-[#F2EFEB] border-2 border-[#1a1a1a] p-4">
              <div className="text-[10px] font-bold text-slate-600 uppercase">
                RINCIAN PILIHAN GANDA & KODE
              </div>
              <div className="text-2xl font-black text-[#1a1a1a] mt-1 tabular-nums">
                {completedSubmission.calcBenarPG} / 25
              </div>
              <div className="text-[11px] text-[#2e59e6] font-bold mt-0.5">
                Skor PG: {Math.min(50, completedSubmission.calcBenarPG * 2)} Poin
              </div>
            </div>

            <div className="bg-[#F2EFEB] border-2 border-[#1a1a1a] p-4">
              <div className="text-[10px] font-bold text-slate-600 uppercase">
                RINCIAN MENJODOHKAN
              </div>
              <div className="text-2xl font-black text-[#1a1a1a] mt-1 tabular-nums">
                {completedSubmission.calcBenarMJ} / 10
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                Skor Menjodohkan: {Math.min(25, completedSubmission.calcBenarMJ * 2.5)} Poin
              </div>
            </div>

            <div className="bg-[#F2EFEB] border-2 border-[#1a1a1a] p-4">
              <div className="text-[10px] font-bold text-slate-600 uppercase">
                SKOR URAIAN & ALGORITMA
              </div>
              <div className="text-2xl font-black text-[#1a1a1a] mt-1 tabular-nums">
                {completedSubmission.calcSkorUraian} / 25
              </div>
              <div className="text-[11px] text-amber-800 font-bold mt-0.5">
                Streak Maks: {completedSubmission.maxStreak}x Beruntun
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 font-mono-code">
            <button
              type="button"
              onClick={() => {
                setCompletedSubmission(null);
                setActiveQuiz(null);
              }}
              className="px-4 py-2.5 text-xs font-bold bg-[#F2EFEB] hover:bg-slate-200 text-[#1a1a1a] border-2 border-[#1a1a1a] cursor-pointer"
            >
              ← KEMBALI KE DAFTAR KUIS
            </button>

            <button
              type="button"
              onClick={() => onNavigateCek(isGrade7 ? '7' : '8')}
              className="px-5 py-2.5 text-xs font-bold bg-[#2e59e6] hover:bg-blue-700 text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] cursor-pointer"
            >
              LIHAT RINCIAN NILAI DI HALAMAN CEK ({isGrade7 ? '/kelas7' : '/cek'}) →
            </button>
          </div>
        </div>

        {/* Live Leaderboard Card */}
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] font-mono-code overflow-hidden">
          <div className="bg-[#1a1a1a] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold uppercase">
                KLASEMEN LIVE ARENA ({activeQuiz.title})
              </span>
            </div>
            <span className="text-[11px] text-amber-300 font-bold">
              {currentQuizLeaderboard.length} Peserta
            </span>
          </div>

          <div className="divide-y divide-[#1a1a1a]/15 max-h-[380px] overflow-y-auto">
            {currentQuizLeaderboard.slice(0, 15).map((sub, idx) => {
              const isMe = sub.id === completedSubmission.id;
              return (
                <div
                  key={sub.id}
                  className={`px-4 py-3 flex items-center justify-between ${
                    isMe ? 'bg-blue-50 font-bold' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 flex items-center justify-center text-xs font-black bg-[#F2EFEB] border border-[#1a1a1a]">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-sans text-xs sm:text-sm font-bold text-[#1a1a1a]">
                        {sub.studentName} {isMe ? '(Anda)' : ''}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {sub.className} · Absen {sub.attendanceNo}
                      </div>
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <div className="text-xs font-black text-[#2e59e6]">
                      {sub.arenaTotalPoints.toLocaleString('id-ID')} PTS
                    </div>
                    <div className="text-[10px] text-emerald-800 font-bold">
                      Nilai: {sub.finalScore}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: PORTAL ENTRY & QUIZ SELECTION
  // =========================================================================
  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header Banner */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono-code text-xs text-slate-600 mb-1">
              <span className="font-bold text-[#2e59e6]">PORTAL KUIS INTERAKTIF SISWA</span>
              <span>·</span>
              <span>SMP NEGERI 1 WEDI</span>
              <span>·</span>
              <span>INFORMATIKA & KKA</span>
            </div>
            <h1 className="font-serif-display italic font-bold text-3xl sm:text-4xl text-[#1a1a1a]">
              Arena Kuis & Tantangan Koding Siswa
            </h1>
            <p className="font-mono-code text-xs text-slate-600 mt-1">
              Pilih Kelas & Nama Anda, lalu masukkan PIN Kuis dari Guru atau pilih paket kuis yang sedang aktif di bawah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono-code shrink-0">
            <button
              type="button"
              onClick={onNavigateHome}
              className="px-3 py-2 text-xs font-bold bg-[#F2EFEB] hover:bg-slate-200 text-[#1a1a1a] border-2 border-[#1a1a1a] cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> BERANDA
            </button>
            <button
              type="button"
              onClick={() =>
                onNavigateCek(selectedClass.includes('7') ? '7' : '8')
              }
              className="px-3.5 py-2 text-xs font-bold bg-[#2e59e6] hover:bg-blue-700 text-white border-2 border-[#1a1a1a] cursor-pointer"
            >
              CEK NILAI SAYA
            </button>
          </div>
        </div>
      </div>

      {/* Student Identity & PIN Entry Box */}
      <div className="bg-[#F2EFEB] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 sm:p-6 font-mono-code space-y-4">
        <h2 className="text-sm font-bold uppercase text-[#1a1a1a] border-b-2 border-[#1a1a1a] pb-2.5">
          01. IDENTITAS PESERTA & TOKEN KUIS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Class Selector */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-bold text-[#1a1a1a]">PILIH KELAS:</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedAttendanceNo(1);
              }}
              className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-2.5 text-xs font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
            >
              <optgroup label="Kelas 7 (Informatika)">
                {GRADE_7_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Kelas 8 (KKA & Informatika)">
                {GRADE_8_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Student Name / Attendance Selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-[#1a1a1a]">
              PILIH NOMOR ABSEN & NAMA SISWA:
            </label>
            <select
              value={selectedAttendanceNo}
              onChange={(e) => setSelectedAttendanceNo(Number(e.target.value))}
              className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-2.5 text-xs font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
            >
              {classStudents.map((std) => (
                <option key={std.id} value={std.attendanceNo}>
                  Absen {String(std.attendanceNo).padStart(2, '0')} — {std.name} ({std.nis})
                </option>
              ))}
            </select>
          </div>

          {/* Token PIN Input */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-[#1a1a1a]">PIN KUIS:</label>
            <input
              type="text"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.toUpperCase())}
              placeholder="Misal: KKA8"
              className="w-full bg-amber-50 border-2 border-[#1a1a1a] px-3 py-2.5 text-xs font-black tracking-widest text-[#1a1a1a] uppercase shadow-[2px_2px_0px_#1a1a1a]"
            />
          </div>

          {/* Start Button */}
          <div className="md:col-span-2 flex items-end">
            <button
              type="button"
              onClick={() => handleStartQuiz()}
              className="w-full py-2.5 px-4 bg-[#2e59e6] hover:bg-blue-700 text-white font-black text-xs border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5" /> MULAI KUIS
            </button>
          </div>
        </div>

        {entryError && (
          <div className="p-3 bg-rose-100 border-2 border-rose-700 text-xs font-bold text-rose-900">
            {entryError}
          </div>
        )}
      </div>

      {/* Active Quizzes List for Selected Class */}
      <div className="space-y-3 font-mono-code">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase text-[#1a1a1a]">
            02. DAFTAR KUIS AKTIF UNTUK {selectedClass.toUpperCase()} ({availableQuizzesForClass.length})
          </h2>
        </div>

        {availableQuizzesForClass.length === 0 ? (
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-6 sm:p-8 text-center space-y-2">
            <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 border border-amber-500 text-xs font-bold uppercase">
              STATUS KUIS: BELUM DIAKTIFKAN (NONAKTIF)
            </div>
            <h3 className="font-sans font-bold text-base sm:text-lg text-[#1a1a1a]">
              Saat Ini Belum Ada Sesi Kuis Interaktif yang Dibuka oleh Guru
            </h3>
            <p className="font-sans text-xs text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Pelaksanaan remedial untuk mata pelajaran <strong>Informatika</strong> saat ini dilakukan secara <strong>offline</strong>, sedangkan untuk mata pelajaran <strong>Koding dan Kecerdasan Artifisial (KKA)</strong> belum diadakan remedial. Silakan cek nilai dan status tugas Anda melalui halaman Cek Nilai.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableQuizzesForClass.map((quiz) => {
              const alreadyDone =
                currentStudent &&
                submissions.find(
                  (s) =>
                    s.quizId === quiz.id &&
                    s.className === selectedClass &&
                    Number(s.attendanceNo) === Number(currentStudent.attendanceNo)
                );

              return (
                <div
                  key={quiz.id}
                  className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#1a1a1a]/20 text-xs font-bold">
                      <span className="bg-[#1a1a1a] text-amber-300 px-2.5 py-0.5">
                        PIN: {quiz.tokenPin}
                      </span>
                      <span className="text-slate-600">
                        {quiz.durationMinutes} Menit · {quiz.questions.length} Soal
                      </span>
                    </div>

                    <h3 className="font-sans font-bold text-base text-[#1a1a1a] mt-3">
                      {quiz.title}
                    </h3>
                    <p className="font-sans text-xs text-slate-600 mt-1 leading-relaxed">
                      {quiz.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1a1a1a]/20">
                    <button
                      type="button"
                      onClick={() => {
                        setPinInput(quiz.tokenPin);
                        handleStartQuiz(quiz);
                      }}
                      className={`w-full py-2.5 px-4 text-xs font-black border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] cursor-pointer flex items-center justify-center gap-1.5 ${
                        alreadyDone
                          ? 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200'
                          : quiz.isRemedialQuiz
                          ? 'bg-amber-400 hover:bg-amber-300 text-[#1a1a1a]'
                          : 'bg-[#2e59e6] hover:bg-blue-700 text-white'
                      }`}
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>
                        {alreadyDone
                          ? `LIHAT HASIL SAYA (NILAI: ${alreadyDone.finalScore})`
                          : quiz.isRemedialQuiz
                          ? 'KERJAKAN KUIS REMEDIAL'
                          : 'KERJAKAN KUIS SEKARANG'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
