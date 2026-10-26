import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Trophy,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Zap,
  Users,
  ClipboardCheck,
  Mountain,
  Presentation,
  Printer,
  Target,
  Shield,
  Scissors,
  Snowflake,
  Timer,
  Flame,
  Info,
} from 'lucide-react';
import {
  InteractiveQuiz,
  QuizQuestion,
  QuizAttemptSubmission,
  fetchQuizzesAndSubmissionsFromServer,
  submitQuizAttemptToServer,
} from '../services/quizStore';
import {
  POWER_UP_DEFINITIONS,
  QUIZ_MODES,
  QUIZ_TEAMS,
  QuizModeId,
  calculateAccuracy,
  getMasteryStage,
  getQuizMode,
  getTeamForAttendance,
  type PowerUpId,
} from '../services/quizModes';
import { PaperQuizSheet } from './quiz/PaperQuizSheet';
import { DuckHuntPG } from './quiz/game/DuckHuntPG';
import { MatchingConnect } from './quiz/game/MatchingConnect';
import { ParsonsTrain } from './quiz/game/ParsonsTrain';
import { CodeWhackAMole } from './quiz/game/CodeWhackAMole';
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

export interface ShuffledOptionItem {
  originalIndex: number;
  text: string;
}

interface MasteryGateState {
  wrongQuestionIds: string[];
  firstPassCorrect: number;
  total: number;
  firstPassAccuracy: number;
  goal: number;
}

interface PracticeFeedback {
  correct: boolean;
  detail: string;
  correctAnswer?: string;
}

const MODE_ICONS: Record<
  ReturnType<typeof getQuizMode>['icon'],
  React.ComponentType<{ className?: string }>
> = {
  play: Play,
  users: Users,
  clipboard: ClipboardCheck,
  mountain: Mountain,
  presentation: Presentation,
  printer: Printer,
  book: BookOpen,
  target: Target,
  shield: Shield,
};

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

  // Mode sesi & fitur gamifikasi (mode ditetapkan guru lewat /master)
  const [activeMode, setActiveMode] = useState<QuizModeId>('classic');
  const [strikeShieldEnabled, setStrikeShieldEnabled] = useState<boolean>(false);
  const [paperQuiz, setPaperQuiz] = useState<InteractiveQuiz | null>(null);
  const [questionRemainingSeconds, setQuestionRemainingSeconds] = useState<number>(30);
  const [powerUpsUsed, setPowerUpsUsed] = useState<PowerUpId[]>([]);
  const [hiddenOptionIndexes, setHiddenOptionIndexes] = useState<
    Record<string, number[]>
  >({});
  const [strikeShieldCharges, setStrikeShieldCharges] = useState<number>(0);
  const [strikeCount, setStrikeCount] = useState<number>(0);
  const [shieldCount, setShieldCount] = useState<number>(0);
  const [rivalScore, setRivalScore] = useState<number>(1000);
  const [awardedQuestionIds, setAwardedQuestionIds] = useState<string[]>([]);
  const [practiceFeedback, setPracticeFeedback] = useState<
    Record<string, PracticeFeedback>
  >({});

  // Mastery Peak / Accuracy gate
  const [masteryGate, setMasteryGate] = useState<MasteryGateState | null>(null);
  const [masteryRound, setMasteryRound] = useState<number>(1);
  const [masteryQuestionIds, setMasteryQuestionIds] = useState<string[] | null>(null);
  const [masteryFirstPassCorrect, setMasteryFirstPassCorrect] = useState<number>(0);
  const [masteryFirstPassTotal, setMasteryFirstPassTotal] = useState<number>(0);

  // Testing mode review
  const [testingReviewOpen, setTestingReviewOpen] = useState<boolean>(false);

  const instructorAdvanceRef = useRef<() => void>(() => {});
  const finishRef = useRef<
    (
      byTimeout?: boolean,
      byTabLimit?: boolean,
      overrideTabCount?: number,
      skipTestingReview?: boolean
    ) => void
  >(() => {});

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
      // `attendanceNo` disimpan sebagai string di data siswa, sedangkan state
      // ini bertipe number — dibandingkan secara numerik agar cocok.
      classStudents.find((s) => Number(s.attendanceNo) === selectedAttendanceNo) ||
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
    const baseQuestions = masteryQuestionIds
      ? (masteryQuestionIds
          .map((id) => activeQuiz.questions.find((q) => q.id === id))
          .filter(Boolean) as QuizQuestion[])
      : activeQuiz.questions;
    // Putaran ulang mastery mempertahankan urutan soal yang salah.
    if (activeQuiz.shuffleQuestions && !masteryQuestionIds) {
      return seededShuffle(baseQuestions, seedKey);
    }
    return baseQuestions;
  }, [activeQuiz, currentStudent, selectedClass, masteryQuestionIds]);

  const currentMode = getQuizMode(activeMode);
  const myTeam = useMemo(
    () => getTeamForAttendance(Number(currentStudent?.attendanceNo ?? 1)),
    [currentStudent]
  );

  /**
   * Evaluasi satu soal dari jawaban saat ini. Dipakai untuk gerbang Mastery
   * Peak, umpan balik Practice, dan pengecekan Strike & Shield.
   */
  const evaluateQuestion = (q: QuizQuestion): PracticeFeedback => {
    if (q.type === 'pg' || q.type === 'code_output') {
      const chosen = pgAnswers[q.id];
      const correctAnswer = q.options?.[q.correctOptionIndex ?? 0] || '';
      const correct = chosen !== undefined && chosen === (q.correctOptionIndex ?? 0);
      return {
        correct,
        detail: correct
          ? 'Jawaban benar.'
          : chosen === undefined
          ? 'Belum dijawab.'
          : `Jawaban yang benar: ${correctAnswer}`,
        correctAnswer,
      };
    }

    if (q.type === 'matching') {
      const pairs = q.matchingPairs || [];
      const studentMap = matchingAnswers[q.id] || {};
      const correctPairs = pairs.filter((p) => studentMap[p.id] === p.rightText).length;
      const correct = pairs.length > 0 && correctPairs === pairs.length;
      return {
        correct,
        detail: `${correctPairs} dari ${pairs.length} pasangan benar.`,
      };
    }

    if (q.type === 'parsons') {
      const targetBlocks = q.parsonsBlocks || [];
      const studentBlocks = parsonsAnswers[q.id] || [];
      let correctPositions = 0;
      targetBlocks.forEach((blk, idx) => {
        if (studentBlocks[idx] === blk) correctPositions += 1;
      });
      return {
        correct: targetBlocks.length > 0 && correctPositions === targetBlocks.length,
        detail: `${correctPositions} dari ${targetBlocks.length} posisi blok benar.`,
      };
    }

    if (q.type === 'essay') {
      const maxPts = q.maxPoints || 10;
      const ansText = (essayAnswers[q.id] || '').trim().toLowerCase();
      if (ansText.length < 5) {
        return { correct: false, detail: 'Jawaban uraian belum diisi.' };
      }
      const kws = q.expectedKeywords || [];
      if (kws.length === 0) {
        return { correct: true, detail: 'Jawaban uraian diterima.' };
      }
      const matched = kws.filter((kw) => ansText.includes(kw.toLowerCase())).length;
      const kwRatio = Math.min(1, matched / Math.max(1, Math.min(3, kws.length)));
      const lengthBonus = ansText.length >= 25 ? 0.35 : 0.15;
      const ratio = Math.min(1, kwRatio * 0.75 + lengthBonus);
      return {
        correct: ratio >= 0.6,
        detail: `Kecocokan kata kunci: ${matched}/${kws.length}. Skor perkiraan ${Math.round(
          ratio * maxPts
        )}/${maxPts}.`,
      };
    }

    return { correct: false, detail: 'Jenis soal tidak dikenali.' };
  };

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

    // Mode ditetapkan guru di halaman /master. Siswa tidak memilih mode.
    const teacherMode: QuizModeId = (foundQuiz.liveMode as QuizModeId) || 'classic';
    setStrikeShieldEnabled(teacherMode === 'classic');

    // Mode kertas langsung membuka lembar cetak, tidak membuat attempt digital.
    if (teacherMode === 'paper') {
      setActiveQuiz(foundQuiz);
      setPaperQuiz(foundQuiz);
      setCompletedSubmission(null);
      setIsExamRunning(false);
      return;
    }

    // Check if student already submitted this quiz.
    // Practice tetap boleh diulang karena tidak masuk nilai akademik.
    const existingAttempt = submissions.find(
      (s) =>
        s.quizId === foundQuiz.id &&
        s.className === selectedClass &&
        Number(s.attendanceNo) === Number(currentStudent.attendanceNo)
    );

    if (existingAttempt && teacherMode !== 'practice') {
      setActiveQuiz(foundQuiz);
      setActiveMode(existingAttempt.mode || teacherMode);
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
    setActiveMode(teacherMode);
    setPgAnswers({});
    setMatchingAnswers({});
    setParsonsAnswers(initParsons);
    setEssayAnswers({});
    setTabSwitchCount(0);
    setTabWarningBanner(null);
    setCurrentQuestionIdx(0);
    setCompletedSubmission(null);
    setPaperQuiz(null);
    setActiveQuiz(foundQuiz);
    setPowerUpsUsed([]);
    setHiddenOptionIndexes({});
    setStrikeShieldCharges(0);
    setStrikeCount(0);
    setShieldCount(0);
    setRivalScore(1000);
    setAwardedQuestionIds([]);
    setPracticeFeedback({});
    setMasteryGate(null);
    setMasteryRound(1);
    setMasteryQuestionIds(null);
    setMasteryFirstPassCorrect(0);
    setMasteryFirstPassTotal(0);
    setTestingReviewOpen(false);
    setQuestionRemainingSeconds(getQuizMode(teacherMode).autoAdvanceSeconds || 30);
    setRemainingSeconds(
      getQuizMode(teacherMode).usesOverallTimer
        ? (foundQuiz.durationMinutes || 20) * 60
        : 0
    );
    setElapsedSeconds(0);
    setIsExamRunning(true);
  };

  // 1-Second Exam Countdown Timer (hanya mode yang memakai timer keseluruhan)
  useEffect(() => {
    if (!isExamRunning || !activeQuiz) return;
    const usesTimer = getQuizMode(activeMode).usesOverallTimer;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      if (!usesTimer) return;
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishRef.current(true, false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamRunning, activeQuiz, activeMode]);

  // Instructor-Paced: hitung mundur per soal, lalu auto-lanjut.
  useEffect(() => {
    if (!isExamRunning || !activeQuiz || activeMode !== 'instructor') return;
    const timer = setInterval(() => {
      setQuestionRemainingSeconds((prev) => {
        if (prev <= 1) {
          instructorAdvanceRef.current();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExamRunning, activeQuiz, activeMode, currentQuestionIdx]);

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
              finishRef.current(false, true, nextCount);
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

  const evaluateCurrentRound = () => {
    const evaluated = preparedQuestions.map((q) => ({
      question: q,
      result: evaluateQuestion(q),
    }));
    const roundCorrect = evaluated.filter((item) => item.result.correct).length;
    return {
      roundCorrect,
      roundTotal: evaluated.length,
      wrongQuestionIds: evaluated
        .filter((item) => !item.result.correct)
        .map((item) => item.question.id),
    };
  };

  const finalizeSubmission = async (meta: {
    accuracyFirstPass?: number;
    accuracyFinal?: number;
    masteryRounds?: number;
    masteryGoalAchieved?: boolean;
    byTimeout?: boolean;
    byTabLimit?: boolean;
    overrideTabCount?: number;
  }) => {
    if (submitLockRef.current || !activeQuiz || !currentStudent) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setTestingReviewOpen(false);

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
              const kwRatio = Math.min(1, matchedCount / Math.max(1, Math.min(3, kws.length)));
              const lengthBonus = ansText.length >= 25 ? 0.35 : 0.15;
              const finalRatio = Math.min(1, kwRatio * 0.75 + lengthBonus);
              rawEssayAndLabPoints += Math.round(finalRatio * maxPts);
            }
          }
        }
      });

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

      const modeDef = getQuizMode(activeMode);
      const totalAllowedSec = (activeQuiz.durationMinutes || 20) * 60;
      const speedRatio = Math.max(
        0,
        (totalAllowedSec - elapsedSeconds) / Math.max(1, totalAllowedSec)
      );
      const speedBonusPoints =
        modeDef.formalAssessment || activeMode === 'practice' || activeMode === 'instructor'
          ? 0
          : finalScore >= 50
          ? Math.round(speedRatio * 1200) + maxStreak * 250
          : maxStreak * 100;
      const arenaTotalPoints =
        finalScore * 100 +
        speedBonusPoints +
        strikeCount * 150 +
        shieldCount * 100 +
        (meta.masteryGoalAchieved ? 500 : 0);

      const submissionPayload: QuizAttemptSubmission = {
        id: `qsub-${Date.now()}-${currentStudent.attendanceNo}`,
        quizId: activeQuiz.id,
        quizTitle: activeQuiz.title,
        tokenPin: activeQuiz.tokenPin,
        className: selectedClass,
        attendanceNo: Number(currentStudent.attendanceNo ?? 0),
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
        tabSwitchCount: meta.overrideTabCount ?? tabSwitchCount,
        autoSubmittedByTimeout: meta.byTimeout ?? false,
        autoSubmittedByTabLimit: meta.byTabLimit ?? false,
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
        syncedToCalculator: activeMode !== 'practice',
        mode: activeMode,
        teamId: activeMode === 'team' ? myTeam.id : undefined,
        teamName: activeMode === 'team' ? myTeam.name : undefined,
        masteryGoal: modeDef.targetAccuracy,
        masteryRounds: meta.masteryRounds,
        accuracyFirstPass: meta.accuracyFirstPass,
        accuracyFinal: meta.accuracyFinal,
        masteryGoalAchieved: meta.masteryGoalAchieved,
        powerUpsUsed,
        strikeShieldEnabled,
        strikeCount,
        shieldCount,
      };

      // Mode Practice tidak masuk server/Kalkulator Akademik.
      if (activeMode === 'practice') {
        setCompletedSubmission(submissionPayload);
        setIsExamRunning(false);
        playNotificationChime();
        return;
      }

      const res = await submitQuizAttemptToServer(submissionPayload);
      setSubmissions(res.submissions);
      setCompletedSubmission(submissionPayload);
      setIsExamRunning(false);
      playNotificationChime();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndSubmit = async (
    byTimeout = false,
    byTabLimit = false,
    overrideTabCount?: number,
    skipTestingReview = false
  ) => {
    if (isSubmitting || !activeQuiz || !currentStudent) return;
    const modeDef = getQuizMode(activeMode);

    // Testing Mode: tinjau semua jawaban sebelum mengirim.
    if (modeDef.id === 'testing' && !skipTestingReview && !testingReviewOpen) {
      setTestingReviewOpen(true);
      setIsExamRunning(false);
      return;
    }

    const round = evaluateCurrentRound();
    const goal = modeDef.targetAccuracy || 80;

    if ((activeMode === 'mastery' || activeMode === 'accuracy') && masteryRound === 1) {
      const firstPassAccuracy = calculateAccuracy(round.roundCorrect, round.roundTotal);
      if (firstPassAccuracy < goal && round.wrongQuestionIds.length > 0) {
        setMasteryFirstPassCorrect(round.roundCorrect);
        setMasteryFirstPassTotal(round.roundTotal);
        setMasteryGate({
          wrongQuestionIds: round.wrongQuestionIds,
          firstPassCorrect: round.roundCorrect,
          total: round.roundTotal,
          firstPassAccuracy,
          goal,
        });
        setIsExamRunning(false);
        return;
      }
      await finalizeSubmission({
        accuracyFirstPass: firstPassAccuracy,
        accuracyFinal: firstPassAccuracy,
        masteryRounds: 1,
        masteryGoalAchieved: firstPassAccuracy >= goal,
        byTimeout,
        byTabLimit,
        overrideTabCount,
      });
      return;
    }

    const total = masteryRound > 1 ? masteryFirstPassTotal : round.roundTotal;
    const firstPassCorrect =
      masteryRound > 1 ? masteryFirstPassCorrect : round.roundCorrect;
    const finalCorrect =
      masteryRound > 1 ? masteryFirstPassCorrect + round.roundCorrect : round.roundCorrect;
    const accuracyFinal = calculateAccuracy(finalCorrect, total);

    await finalizeSubmission({
      accuracyFirstPass: calculateAccuracy(firstPassCorrect, total),
      accuracyFinal,
      masteryRounds: masteryRound,
      masteryGoalAchieved:
        activeMode === 'mastery' || activeMode === 'accuracy'
          ? accuracyFinal >= goal
          : undefined,
      byTimeout,
      byTabLimit,
      overrideTabCount,
    });
  };

  // Sinkronkan callback ke ref agar timer tidak memanggil fungsi basi.
  useEffect(() => {
    finishRef.current = handleFinishAndSubmit;
    instructorAdvanceRef.current = () => {
      if (!isExamRunning || activeMode !== 'instructor') return;
      if (currentQuestionIdx < preparedQuestions.length - 1) {
        setSelectedLeftPairId(null);
        setCurrentQuestionIdx((prev) => prev + 1);
        setQuestionRemainingSeconds(30);
      } else {
        void handleFinishAndSubmit(false, false);
      }
    };
  });

  const handleRetryMastery = () => {
    if (!masteryGate || !activeQuiz || !currentStudent) return;
    const wrongIds = masteryGate.wrongQuestionIds;
    setMasteryFirstPassCorrect(masteryGate.firstPassCorrect);
    setMasteryFirstPassTotal(masteryGate.total);
    setMasteryQuestionIds(wrongIds);
    setMasteryRound(2);
    setMasteryGate(null);
    setCurrentQuestionIdx(0);
    setSelectedLeftPairId(null);
    setCompletedSubmission(null);
    setTestingReviewOpen(false);

    const seedBase = `${activeQuiz.id}-${currentStudent.attendanceNo}`;
    setPgAnswers((prev) => {
      const copy = { ...prev };
      wrongIds.forEach((id) => delete copy[id]);
      return copy;
    });
    setMatchingAnswers((prev) => {
      const copy = { ...prev };
      wrongIds.forEach((id) => delete copy[id]);
      return copy;
    });
    setEssayAnswers((prev) => {
      const copy = { ...prev };
      wrongIds.forEach((id) => delete copy[id]);
      return copy;
    });
    setParsonsAnswers((prev) => {
      const copy = { ...prev };
      wrongIds.forEach((id) => {
        const q = activeQuiz.questions.find((item) => item.id === id);
        if (q?.parsonsBlocks?.length) {
          copy[id] = seededShuffle(
            q.parsonsBlocks,
            `${seedBase}-${q.id}-retry`
          );
        }
      });
      return copy;
    });
    setPracticeFeedback({});
    setIsExamRunning(true);
  };

  const handleSkipMastery = () => {
    if (!masteryGate) return;
    const gate = masteryGate;
    setMasteryGate(null);
    setMasteryQuestionIds(null);
    setMasteryRound(2);
    setMasteryFirstPassCorrect(gate.firstPassCorrect);
    setMasteryFirstPassTotal(gate.total);
    void finalizeSubmission({
      accuracyFirstPass: gate.firstPassAccuracy,
      accuracyFinal: gate.firstPassAccuracy,
      masteryRounds: 1,
      masteryGoalAchieved: false,
    });
  };

  const handleCheckPractice = () => {
    const q = preparedQuestions[currentQuestionIdx];
    if (!q) return;
    setPracticeFeedback((prev) => ({ ...prev, [q.id]: evaluateQuestion(q) }));
  };

  const handleClearCurrentAnswer = () => {
    const q = preparedQuestions[currentQuestionIdx];
    if (!q || !activeQuiz || !currentStudent) return;
    setPgAnswers((prev) => {
      const copy = { ...prev };
      delete copy[q.id];
      return copy;
    });
    setMatchingAnswers((prev) => {
      const copy = { ...prev };
      delete copy[q.id];
      return copy;
    });
    setEssayAnswers((prev) => {
      const copy = { ...prev };
      delete copy[q.id];
      return copy;
    });
    setParsonsAnswers((prev) => {
      const copy = { ...prev };
      if (q.parsonsBlocks?.length) {
        copy[q.id] = seededShuffle(
          q.parsonsBlocks,
          `${activeQuiz.id}-${q.id}-${currentStudent.attendanceNo}-retry`
        );
      }
      return copy;
    });
    setPracticeFeedback((prev) => {
      const copy = { ...prev };
      delete copy[q.id];
      return copy;
    });
    setSelectedLeftPairId(null);
  };

  const activatePowerUp = (id: PowerUpId) => {
    if (!currentMode.powerUps || powerUpsUsed.includes(id)) return;
    const q = preparedQuestions[currentQuestionIdx];
    if (id === 'fifty') {
      if (!q || (q.type !== 'pg' && q.type !== 'code_output') || !q.options) return;
      const correct = q.correctOptionIndex ?? 0;
      const wrongIndexes = q.options
        .map((_, idx) => idx)
        .filter((idx) => idx !== correct);
      if (wrongIndexes.length < 2) return;
      setHiddenOptionIndexes((prev) => ({
        ...prev,
        [q.id]: wrongIndexes.slice(0, 2),
      }));
    } else if (id === 'freeze') {
      if (!currentMode.usesOverallTimer) return;
      setRemainingSeconds((prev) => prev + 30);
    } else if (id === 'shield') {
      if (!strikeShieldEnabled) return;
      setShieldCount((prev) => Math.min(3, prev + 1));
    }
    setPowerUpsUsed((prev) => [...prev, id]);
  };

  const handleStrike = () => {
    if (!strikeShieldEnabled || strikeShieldCharges <= 0) return;
    setStrikeShieldCharges((prev) => prev - 1);
    setStrikeCount((prev) => prev + 1);
    setRivalScore((prev) => Math.max(0, prev - 150));
  };

  const handleShield = () => {
    if (!strikeShieldEnabled || strikeShieldCharges <= 0 || shieldCount >= 3) return;
    setStrikeShieldCharges((prev) => prev - 1);
    setShieldCount((prev) => Math.min(3, prev + 1));
  };

  const handleAwardStrikeCharge = (q: QuizQuestion) => {
    if (!strikeShieldEnabled || activeMode !== 'classic') return;
    if (awardedQuestionIds.includes(q.id)) return;
    if (evaluateQuestion(q).correct) {
      setAwardedQuestionIds((prev) => [...prev, q.id]);
      setStrikeShieldCharges((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    const q = preparedQuestions[currentQuestionIdx];
    if (q) handleAwardStrikeCharge(q);
    setSelectedLeftPairId(null);
    if (currentQuestionIdx < preparedQuestions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      if (activeMode === 'instructor') setQuestionRemainingSeconds(30);
    } else {
      void handleFinishAndSubmit(false, false);
    }
  };

  const handlePreviousQuestion = () => {
    if (!currentMode.allowsBackNavigation) return;
    setSelectedLeftPairId(null);
    setCurrentQuestionIdx((prev) => Math.max(0, prev - 1));
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

  // Klasemen tim untuk mode Team.
  const currentTeamLeaderboard = useMemo(() => {
    if (!activeQuiz) return [];
    const map = new Map<
      string,
      { teamId: string; teamName: string; points: number; members: number; totalScore: number }
    >();
    submissions
      .filter((s) => s.quizId === activeQuiz.id)
      .forEach((s) => {
        const team = getTeamForAttendance(Number(s.attendanceNo || 1));
        const key = s.teamId || team.id;
        const current =
          map.get(key) || {
            teamId: team.id,
            teamName: s.teamName || team.name,
            points: 0,
            members: 0,
            totalScore: 0,
          };
        current.points += Number(s.arenaTotalPoints || 0);
        current.totalScore += Number(s.finalScore || 0);
        current.members += 1;
        map.set(key, current);
      });
    return Array.from(map.values()).sort((a, b) => b.points - a.points);
  }, [submissions, activeQuiz]);

  // =========================================================================
  // VIEW 0A: PAPER MODE (LEMBAR CETAK, TANPA NILAI DIGITAL)
  // =========================================================================
  if (paperQuiz && currentStudent) {
    return (
      <PaperQuizSheet
        quiz={paperQuiz}
        className={selectedClass}
        studentName={currentStudent.name}
        attendanceNo={Number(currentStudent.attendanceNo ?? 1)}
        onBack={() => setPaperQuiz(null)}
      />
    );
  }

  // =========================================================================
  // VIEW 0B: MASTERY PEAK / ACCURACY GATE
  // =========================================================================
  if (masteryGate && activeQuiz && currentStudent) {
    const gateMode = getQuizMode(activeMode);
    const stage = getMasteryStage(masteryGate.firstPassAccuracy);
    return (
      <div className="space-y-5 pb-16 font-sans">
        <div className="bg-[#1a1a1a] text-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#2e59e6] p-4 sm:p-6">
          <div className="font-mono-code text-[10px] font-bold text-amber-300 uppercase tracking-wider">
            {gateMode.name.toUpperCase()} · EVALUASI PUTARAN 1 · TIMER DIJEDA
          </div>
          <h2 className="font-serif-display italic font-bold text-2xl sm:text-3xl mt-1">
            {stage.emoji} {stage.label}
          </h2>
          <p className="font-mono-code text-xs text-slate-300 mt-1">
            {gateMode.id === 'mastery'
              ? 'Naik ke puncak dengan mengulang soal yang belum tepat.'
              : 'Kejar target akurasi sebelum jawaban dikirim.'}
          </p>
        </div>

        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] p-5 sm:p-7 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#1a1a1a] pb-4">
            <div>
              <div className="font-mono-code text-[10px] font-bold text-slate-500 uppercase">
                AKURASI PUTARAN 1
              </div>
              <div className="font-black text-4xl tabular-nums text-[#1a1a1a]">
                {masteryGate.firstPassAccuracy}%
              </div>
              <div className="font-mono-code text-xs text-slate-600">
                {masteryGate.firstPassCorrect} benar dari {masteryGate.total} soal
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono-code text-[10px] font-bold text-slate-500 uppercase">
                TARGET
              </div>
              <div className="font-black text-2xl text-[#2e59e6] tabular-nums">
                {masteryGate.goal}%
              </div>
            </div>
          </div>

          <div>
            <div className="h-5 bg-[#F2EFEB] border-2 border-[#1a1a1a] overflow-hidden">
              <div
                className="h-full bg-[#2e59e6]"
                style={{ width: `${Math.min(100, masteryGate.firstPassAccuracy)}%` }}
              />
            </div>
            <div className="flex justify-between font-mono-code text-[10px] text-slate-500 mt-1">
              <span>0%</span>
              <span>{stage.hint}</span>
              <span>100%</span>
            </div>
          </div>

          <div className="bg-amber-50 border-2 border-[#1a1a1a] p-3.5 font-mono-code text-xs text-amber-950">
            <strong>{masteryGate.wrongQuestionIds.length} soal</strong> perlu diulang. Jawaban
            benar pada putaran ulang akan menaikkan akurasi akhir. Putaran ulang hanya memuat soal
            yang salah.
          </div>

          <div className="flex flex-col sm:flex-row gap-2 font-mono-code">
            <button
              type="button"
              onClick={handleRetryMastery}
              className="flex-1 px-5 py-3 text-xs font-black bg-[#2e59e6] hover:bg-blue-700 text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] cursor-pointer"
            >
              ULANGI {masteryGate.wrongQuestionIds.length} SOAL SALAH →
            </button>
            <button
              type="button"
              onClick={handleSkipMastery}
              disabled={isSubmitting}
              className="px-5 py-3 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border-2 border-[#1a1a1a] disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? 'MENYELESAIKAN...' : 'LEWATI & LIHAT HASIL'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 0C: TESTING MODE REVIEW
  // =========================================================================
  if (testingReviewOpen && activeQuiz && currentStudent) {
    return (
      <div className="space-y-5 pb-16 font-sans">
        <div className="bg-[#1a1a1a] text-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#2e59e6] p-4 sm:p-6">
          <div className="font-mono-code text-[10px] font-bold text-amber-300 uppercase tracking-wider">
            TESTING MODE · REVIEW &amp; SUBMIT · TIMER DIJEDA
          </div>
          <h2 className="font-serif-display italic font-bold text-2xl sm:text-3xl mt-1">
            Tinjau Jawaban Sebelum Kirim
          </h2>
          <p className="font-mono-code text-xs text-slate-300 mt-1">
            {currentStudent.name} · {selectedClass} · {activeQuiz.title}
          </p>
        </div>

        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] p-4 sm:p-6 space-y-3">
          <div className="font-mono-code text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Info className="h-4 w-4" /> Setelah dikirim, jawaban tidak bisa diubah.
          </div>
          <div className="divide-y-2 divide-[#1a1a1a]/10 border-2 border-[#1a1a1a]">
            {preparedQuestions.map((q, idx) => {
              const done = isQuestionAnswered(q);
              let answerPreview = 'Belum dijawab';
              if (q.type === 'pg' || q.type === 'code_output') {
                const chosen = pgAnswers[q.id];
                answerPreview =
                  chosen !== undefined ? q.options?.[chosen] || `Pilihan ${chosen + 1}` : answerPreview;
              } else if (q.type === 'matching') {
                const pairs = q.matchingPairs || [];
                const map = matchingAnswers[q.id] || {};
                const count = pairs.filter((p) => map[p.id] === p.rightText).length;
                answerPreview = `${count}/${pairs.length} pasangan terisi`;
              } else if (q.type === 'parsons') {
                answerPreview = `${(parsonsAnswers[q.id] || []).length} blok tersusun`;
              } else if (q.type === 'essay') {
                const text = (essayAnswers[q.id] || '').trim();
                answerPreview = text ? `${text.slice(0, 80)}${text.length > 80 ? '…' : ''}` : answerPreview;
              }
              return (
                <div key={q.id} className="p-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono-code text-[10px] font-bold text-[#2e59e6]">
                      SOAL {idx + 1} · {q.type.toUpperCase()}
                    </div>
                    <div className="text-sm font-semibold text-[#1a1a1a] line-clamp-2">
                      {q.questionText}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{answerPreview}</div>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-1 font-mono-code text-[10px] font-black border ${
                      done
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-600'
                        : 'bg-rose-50 text-rose-800 border-rose-600'
                    }`}
                  >
                    {done ? 'TERJAWAB' : 'KOSONG'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 font-mono-code pt-2">
            <button
              type="button"
              onClick={() => {
                setTestingReviewOpen(false);
                setIsExamRunning(true);
              }}
              className="flex-1 px-5 py-3 text-xs font-bold bg-[#F2EFEB] hover:bg-slate-200 text-[#1a1a1a] border-2 border-[#1a1a1a] cursor-pointer"
            >
              ← KEMBALI MENGERJAKAN
            </button>
            <button
              type="button"
              onClick={() => handleFinishAndSubmit(false, false, undefined, true)}
              disabled={isSubmitting}
              className="flex-1 px-5 py-3 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? 'MENGIRIM...' : 'KIRIM JAWABAN FINAL →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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

    const hiddenForQuestion = hiddenOptionIndexes[currentQuestion.id] || [];
    const visibleOptions = displayOptions.filter(
      (item) =>
        !hiddenForQuestion.includes(item.originalIndex) ||
        pgAnswers[currentQuestion.id] === item.originalIndex
    );

    const answeredCount = preparedQuestions.filter((q) => isQuestionAnswered(q)).length;
    const currentFeedback = practiceFeedback[currentQuestion.id];
    const masteryStage = getMasteryStage(
      calculateAccuracy(
        masteryRound > 1 ? masteryFirstPassCorrect : 0,
        masteryRound > 1 ? masteryFirstPassTotal : Math.max(1, preparedQuestions.length)
      )
    );

    return (
      <div className="space-y-5 pb-16 font-sans">
        {/* Sticky Exam Top Header */}
        <div className="bg-[#1a1a1a] text-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#2e59e6] p-4 font-mono-code">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                  {currentMode.formalAssessment ? 'UJIAN FORMAL' : 'KUIS INTERAKTIF'} · {currentMode.name.toUpperCase()} · PIN: {activeQuiz.tokenPin}
                </span>
                <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-600 text-white">
                  MODE DARI GURU
                </span>
                {activeQuiz.useArcadeMode && (
                  <span className="px-2 py-0.5 text-[9px] font-black bg-fuchsia-600 text-white">
                    ARCADE
                  </span>
                )}
                {activeMode === 'team' && (
                  <span className={`px-2 py-0.5 text-[10px] font-black ${myTeam.badgeClass}`}>
                    {myTeam.mascot} {myTeam.name.toUpperCase()}
                  </span>
                )}
                {strikeShieldEnabled && activeMode === 'classic' && (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-fuchsia-500 text-white">
                    PREMIUM · STRIKE &amp; SHIELD
                  </span>
                )}
              </div>
              <h2 className="font-sans font-bold text-base sm:text-lg text-white">
                {currentStudent.name} ({selectedClass} · No. Absen {currentStudent.attendanceNo})
              </h2>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {currentMode.tagline}
                {masteryRound > 1 ? ` · Putaran mastery ${masteryRound}` : ''}
              </div>
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

              {/* Countdown Timer / Mode tanpa timer */}
              {currentMode.usesOverallTimer ? (
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
              ) : (
                <div className="px-3 py-1.5 text-xs font-bold border border-white/40 bg-white/10 text-white flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> TANPA TIMER
                </div>
              )}

              {activeMode === 'instructor' && (
                <div className="px-3 py-1.5 text-xs font-black border-2 border-white bg-[#2e59e6] text-white flex items-center gap-1.5 tabular-nums">
                  <Timer className="h-4 w-4" /> SOAL: {questionRemainingSeconds} dtk
                </div>
              )}

              {(activeMode === 'mastery' || activeMode === 'accuracy') && (
                <div className="px-3 py-1.5 text-xs font-bold border border-white/40 bg-white/10 text-white flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> TARGET {currentMode.targetAccuracy || 80}%
                </div>
              )}

              <button
                type="button"
                onClick={() => handleFinishAndSubmit(false, false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-[#1a1a1a] border-2 border-white cursor-pointer"
              >
                {isSubmitting ? 'MENGIRIM...' : activeMode === 'testing' ? 'TINJAU & KIRIM' : 'SELESAI & KIRIM'}
              </button>
            </div>
          </div>

          {/* Question Number Navigation Bar */}
          <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-2">
            {activeMode === 'instructor' ? (
              <div className="font-mono-code text-[11px] text-slate-300 flex items-center gap-2">
                <Presentation className="h-3.5 w-3.5 text-amber-300" />
                MODE GURU: soal berganti otomatis setiap 30 detik. Tidak bisa kembali.
              </div>
            ) : (
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
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-bold">
              {activeMode === 'mastery' || activeMode === 'accuracy' ? (
                <span className="px-2 py-1 bg-white/10 border border-white/20">
                  {masteryStage.emoji} {masteryStage.label}
                </span>
              ) : null}
              <span>Terjawab: {answeredCount} / {preparedQuestions.length} Soal</span>
            </div>
          </div>
        </div>

        {/* Power-Up & fitur premium */}
        {currentMode.powerUps && (
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-3 font-mono-code">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> POWER-UP · FITUR GAMIFIKASI PREMIUM
              </div>
              <div className="text-[10px] text-slate-500">
                Sisa: {POWER_UP_DEFINITIONS.length - powerUpsUsed.length}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              {POWER_UP_DEFINITIONS.map((pu) => {
                const used = powerUpsUsed.includes(pu.id as PowerUpId);
                const Icon = pu.id === 'fifty' ? Scissors : pu.id === 'freeze' ? Snowflake : Shield;
                const disabled =
                  used ||
                  (pu.id === 'fifty' &&
                    (currentQuestion.type !== 'pg' && currentQuestion.type !== 'code_output')) ||
                  (pu.id === 'freeze' && !currentMode.usesOverallTimer) ||
                  (pu.id === 'shield' && !strikeShieldEnabled);
                return (
                  <button
                    key={pu.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => activatePowerUp(pu.id as PowerUpId)}
                    className={`text-left p-2.5 border-2 transition-all cursor-pointer disabled:cursor-not-allowed ${
                      used
                        ? 'bg-slate-100 text-slate-400 border-slate-300'
                        : disabled
                        ? 'bg-slate-50 text-slate-400 border-slate-300'
                        : 'bg-amber-50 hover:bg-amber-100 text-[#1a1a1a] border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black">
                      <Icon className="h-3.5 w-3.5" /> {pu.name}
                    </div>
                    <div className="text-[10px] mt-0.5 leading-snug">{pu.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {strikeShieldEnabled && activeMode === 'classic' && (
          <div className="bg-fuchsia-50 border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#a21caf] p-3.5 font-mono-code">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-fuchsia-700">
                  STRIKE &amp; SHIELD · PREMIUM · LAWAN: BOT WAYGROUND
                </div>
                <div className="text-xs text-slate-700 mt-1">
                  Energi serangan: <strong>{strikeShieldCharges}</strong> · Skor lawan:{' '}
                  <strong>{rivalScore}</strong> · Perisai: <strong>{shieldCount}/3</strong>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={strikeShieldCharges <= 0}
                  onClick={handleStrike}
                  className="px-3 py-2 text-[11px] font-black bg-fuchsia-700 hover:bg-fuchsia-600 text-white border-2 border-[#1a1a1a] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <Flame className="h-3.5 w-3.5" /> STRIKE -150
                </button>
                <button
                  type="button"
                  disabled={strikeShieldCharges <= 0 || shieldCount >= 3}
                  onClick={handleShield}
                  className="px-3 py-2 text-[11px] font-black bg-white hover:bg-fuchsia-100 text-fuchsia-900 border-2 border-[#1a1a1a] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <Shield className="h-3.5 w-3.5" /> SHIELD
                </button>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5">
              Dapatkan 1 energi setiap jawaban benar. Serangan mengurangi skor lawan; perisai menambah bonus akhir.
            </div>
          </div>
        )}

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
            <>
              {activeQuiz.useArcadeMode && currentQuestion.type === 'pg' ? (
                <div className="pt-2">
                  <DuckHuntPG
                    question={currentQuestion}
                    displayOptions={visibleOptions}
                    onAnswer={(originalIndex) =>
                      setPgAnswers((prev) => ({
                        ...prev,
                        [currentQuestion.id]: originalIndex,
                      }))
                    }
                    currentAnswer={pgAnswers[currentQuestion.id]}
                    isAnswered={pgAnswers[currentQuestion.id] !== undefined}
                  />
                </div>
              ) : activeQuiz.useArcadeMode && currentQuestion.type === 'code_output' ? (
                <div className="pt-2">
                  <CodeWhackAMole
                    question={currentQuestion}
                    displayOptions={visibleOptions}
                    onAnswer={(originalIndex) =>
                      setPgAnswers((prev) => ({
                        ...prev,
                        [currentQuestion.id]: originalIndex,
                      }))
                    }
                    currentAnswer={pgAnswers[currentQuestion.id]}
                    isAnswered={pgAnswers[currentQuestion.id] !== undefined}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {visibleOptions.map((item, dispIdx) => {
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
            </>
          )}

          {/* 2. INTERACTION FOR MATCHING (PASANGKAN KARTU KIRI & KANAN) */}
          {currentQuestion.type === 'matching' && (
            <>
              {activeQuiz.useArcadeMode ? (
                <div className="pt-2">
                  <MatchingConnect
                    question={currentQuestion}
                    onAnswer={(answerMap) =>
                      setMatchingAnswers((prev) => ({
                        ...prev,
                        [currentQuestion.id]: answerMap,
                      }))
                    }
                    currentAnswer={matchingAnswers[currentQuestion.id] || {}}
                    isAnswered={isQuestionAnswered(currentQuestion)}
                  />
                </div>
              ) : (
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
            </>
          )}

          {/* 3. INTERACTION FOR PARSONS PUZZLE (SUSUN BLOK ALGORITMA) */}
          {currentQuestion.type === 'parsons' && (
            <>
              {activeQuiz.useArcadeMode ? (
                <div className="pt-2">
                  <ParsonsTrain
                    question={currentQuestion}
                    onAnswer={(blocks) =>
                      setParsonsAnswers((prev) => ({
                        ...prev,
                        [currentQuestion.id]: blocks,
                      }))
                    }
                    currentAnswer={parsonsAnswers[currentQuestion.id]}
                    isAnswered={isQuestionAnswered(currentQuestion)}
                  />
                </div>
              ) : (
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
            </>
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

          {/* Umpan balik langsung untuk Practice Mode */}
          {currentFeedback && activeMode === 'practice' && (
            <div
              className={`border-2 border-[#1a1a1a] p-3.5 font-mono-code text-xs ${
                currentFeedback.correct
                  ? 'bg-emerald-50 text-emerald-900'
                  : 'bg-rose-50 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-black uppercase">
                {currentFeedback.correct ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {currentFeedback.correct ? 'BENAR!' : 'BELUM TEPAT'}
              </div>
              <p className="mt-1">{currentFeedback.detail}</p>
            </div>
          )}

          {/* Bottom Prev / Next / Submit Navigation */}
          <div className="pt-4 border-t-2 border-[#1a1a1a] flex flex-wrap items-center justify-between gap-3 font-mono-code">
            <button
              type="button"
              disabled={currentQuestionIdx === 0 || !currentMode.allowsBackNavigation}
              onClick={handlePreviousQuestion}
              className="px-4 py-2.5 text-xs font-bold bg-[#F2EFEB] hover:bg-slate-200 text-[#1a1a1a] border-2 border-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ← SOAL SEBELUMNYA
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {activeMode === 'practice' && !currentFeedback && (
                <button
                  type="button"
                  onClick={handleCheckPractice}
                  disabled={!isQuestionAnswered(currentQuestion)}
                  className="px-4 py-2.5 text-xs font-black bg-amber-400 hover:bg-amber-300 text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] disabled:opacity-40 cursor-pointer"
                >
                  CEK JAWABAN
                </button>
              )}

              {activeMode === 'practice' && currentFeedback && (
                <button
                  type="button"
                  onClick={handleClearCurrentAnswer}
                  className="px-4 py-2.5 text-xs font-bold bg-white hover:bg-rose-50 text-rose-800 border-2 border-[#1a1a1a] cursor-pointer"
                >
                  COBA LAGI
                </button>
              )}

              {currentQuestionIdx < preparedQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 text-xs font-bold bg-[#2e59e6] hover:bg-blue-700 text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] cursor-pointer"
                >
                  {activeMode === 'instructor' ? 'LANJUT SEKARANG →' : 'SOAL BERIKUTNYA →'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFinishAndSubmit(false, false)}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] cursor-pointer"
                >
                  {isSubmitting
                    ? 'MENGIRIM...'
                    : activeMode === 'testing'
                    ? 'TINJAU JAWABAN →'
                    : activeMode === 'mastery' || activeMode === 'accuracy'
                    ? 'SELESAIKAN PUTARAN →'
                    : 'KIRIM JAWABAN KUIS SEKARANG'}
                </button>
              )}
            </div>
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
    const completedMode = getQuizMode(completedSubmission.mode || 'classic');
    const isPracticeResult = completedSubmission.mode === 'practice';
    const isTeamResult = completedSubmission.mode === 'team';
    const isFormalResult = completedMode.formalAssessment;
    const completedAccuracy =
      completedSubmission.accuracyFinal ?? completedSubmission.accuracyFirstPass;

    return (
      <div className="space-y-6 pb-16 font-sans">
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-2 border-[#1a1a1a] pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 font-mono-code text-[10px] font-bold uppercase">
                <span className="px-2 py-1 bg-[#1a1a1a] text-amber-300">
                  {completedMode.name}
                </span>
                <span
                  className={`px-2 py-1 border ${
                    isPracticeResult
                      ? 'bg-amber-50 text-amber-800 border-amber-600'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-600'
                  }`}
                >
                  {isPracticeResult
                    ? 'LATIHAN · TIDAK MASUK NILAI'
                    : 'TERSIMPAN · MASUK KALKULATOR AKADEMIK'}
                </span>
                {isTeamResult && completedSubmission.teamName && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-800 border border-blue-600">
                    {completedSubmission.teamName}
                  </span>
                )}
              </div>
              <h1 className="font-serif-display italic font-bold text-3xl sm:text-4xl text-[#1a1a1a] mt-2">
                Hasil Kuis: {completedSubmission.studentName}
              </h1>
              <p className="font-mono-code text-xs text-slate-600 mt-1">
                {completedSubmission.className} · No. Absen {completedSubmission.attendanceNo} ·{' '}
                {completedSubmission.quizTitle}
              </p>
              <p className="font-mono-code text-[11px] text-slate-500 mt-1">
                {completedMode.tagline}
                {isPracticeResult
                  ? ' Mode latihan boleh diulang dan tidak mengubah nilai akademik.'
                  : isFormalResult
                  ? ' Mode formal: poin arena dan bonus kecepatan tidak dipakai.'
                  : ''}
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
                {isFormalResult
                  ? 'MODE FORMAL · TANPA POIN ARENA'
                  : isPracticeResult
                  ? 'MODE LATIHAN'
                  : `${completedSubmission.arenaTotalPoints.toLocaleString('id-ID')} Poin Arena`}
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

          {/* Statistik khusus mode */}
          {(completedMode.id === 'mastery' || completedMode.id === 'accuracy') &&
            completedAccuracy !== undefined && (
              <div className="bg-blue-50 border-2 border-[#1a1a1a] p-4 font-mono-code">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase text-blue-800">
                      {completedMode.id === 'mastery' ? 'MASTERY PEAK' : 'ACCURACY MODE'} ·{' '}
                      {completedSubmission.masteryGoalAchieved ? 'TARGET TERCAPAI' : 'TARGET BELUM TERCAPAI'}
                    </div>
                    <div className="font-black text-2xl text-[#1a1a1a] tabular-nums mt-0.5">
                      {getMasteryStage(completedAccuracy).emoji}{' '}
                      {getMasteryStage(completedAccuracy).label} · {completedAccuracy}%
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <div>Awal: {completedSubmission.accuracyFirstPass ?? 0}%</div>
                    <div>Target: {completedSubmission.masteryGoal ?? completedMode.targetAccuracy ?? 80}%</div>
                    <div>Putaran: {completedSubmission.masteryRounds ?? 1}</div>
                  </div>
                </div>
                <div className="h-3 bg-white border border-[#1a1a1a] mt-2 overflow-hidden">
                  <div
                    className="h-full bg-[#2e59e6]"
                    style={{ width: `${Math.min(100, completedAccuracy)}%` }}
                  />
                </div>
              </div>
            )}

          {isTeamResult && (
            <div className="bg-emerald-50 border-2 border-[#1a1a1a] p-4 font-mono-code">
              <div className="text-[10px] font-black uppercase text-emerald-800">
                KONTRIBUSI TIM
              </div>
              <div className="text-lg font-black text-[#1a1a1a] mt-0.5">
                {completedSubmission.teamName || myTeam.name} ·{' '}
                {completedSubmission.arenaTotalPoints.toLocaleString('id-ID')} poin
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Poin individu otomatis digabung ke klasemen tim pada panel di bawah.
              </p>
            </div>
          )}

          {((completedSubmission.powerUpsUsed?.length || 0) > 0 ||
            completedSubmission.strikeShieldEnabled) && (
            <div className="bg-fuchsia-50 border-2 border-[#1a1a1a] p-4 font-mono-code text-xs">
              <div className="text-[10px] font-black uppercase text-fuchsia-800">
                FITUR GAMIFIKASI PREMIUM
              </div>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {(completedSubmission.powerUpsUsed || []).map((pu) => (
                  <span key={pu} className="px-2 py-1 bg-white border border-fuchsia-600 text-fuchsia-900">
                    Power-Up: {pu}
                  </span>
                ))}
                {completedSubmission.strikeShieldEnabled && (
                  <>
                    <span className="px-2 py-1 bg-white border border-fuchsia-600 text-fuchsia-900">
                      Strike: {completedSubmission.strikeCount ?? 0}
                    </span>
                    <span className="px-2 py-1 bg-white border border-fuchsia-600 text-fuchsia-900">
                      Shield: {completedSubmission.shieldCount ?? 0}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

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

        {/* Leaderboard: tim, individu, atau tidak ada sesuai mode */}
        {completedMode.showLeaderboard ? (
          isTeamResult ? (
            <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] font-mono-code overflow-hidden">
              <div className="bg-[#1a1a1a] text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase">
                    KLASEMEN TIM ({activeQuiz.title})
                  </span>
                </div>
                <span className="text-[11px] text-amber-300 font-bold">
                  {currentTeamLeaderboard.length} Tim
                </span>
              </div>
              <div className="divide-y divide-[#1a1a1a]/15 max-h-[380px] overflow-y-auto">
                {currentTeamLeaderboard.map((team, idx) => {
                  const teamInfo =
                    QUIZ_TEAMS.find((item) => item.id === team.teamId) ||
                    getTeamForAttendance(1);
                  const isMyTeam = team.teamId === completedSubmission.teamId;
                  return (
                    <div
                      key={team.teamId}
                      className={`px-4 py-3 flex items-center justify-between ${
                        isMyTeam ? 'bg-blue-50 font-bold' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 flex items-center justify-center text-xs font-black bg-[#F2EFEB] border border-[#1a1a1a]">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-sans text-xs sm:text-sm font-bold text-[#1a1a1a]">
                            {teamInfo.mascot} {team.teamName} {isMyTeam ? '(Tim Anda)' : ''}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {team.members} anggota · rata-rata nilai{' '}
                            {Math.round(team.totalScore / Math.max(1, team.members))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="text-xs font-black text-[#2e59e6]">
                          {team.points.toLocaleString('id-ID')} PTS
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
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
          )
        ) : (
          <div className="bg-slate-50 border-2 border-[#1a1a1a] p-4 font-mono-code text-xs text-slate-700 flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-slate-500" />
            Mode {completedMode.name} tidak menampilkan leaderboard. Fokus mode ini adalah{' '}
            {isPracticeResult ? 'latihan dan umpan balik.' : 'hasil akademik masing-masing siswa.'}
          </div>
        )}
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
              className="w-full py-2.5 px-3 bg-[#2e59e6] hover:bg-blue-700 text-white font-black text-[10px] border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5" /> GABUNG &amp; MULAI KUIS
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
            03. DAFTAR KUIS AKTIF UNTUK {selectedClass.toUpperCase()} ({availableQuizzesForClass.length})
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
              const quizModeDef = getQuizMode((quiz.liveMode as QuizModeId) || 'classic');
              const hasFinalAttempt = Boolean(alreadyDone) && quizModeDef.id !== 'practice';

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

                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span className="px-2 py-0.5 bg-[#2e59e6] text-white text-[10px] font-black uppercase">
                        MODE: {quizModeDef.name}
                      </span>
                      {quiz.useArcadeMode && (
                        <span className="px-2 py-0.5 bg-fuchsia-600 text-white text-[10px] font-black uppercase">
                          ARCADE GAME
                        </span>
                      )}
                      {quiz.isRemedialQuiz && (
                        <span className="px-2 py-0.5 bg-amber-300 text-[#1a1a1a] text-[10px] font-black uppercase">
                          REMEDIAL
                        </span>
                      )}
                    </div>

                    <h3 className="font-sans font-bold text-base text-[#1a1a1a] mt-2">
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
                        hasFinalAttempt
                          ? 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200'
                          : quiz.isRemedialQuiz
                          ? 'bg-amber-400 hover:bg-amber-300 text-[#1a1a1a]'
                          : 'bg-[#2e59e6] hover:bg-blue-700 text-white'
                      }`}
                    >
                      {quizModeDef.id === 'paper' ? (
                        <Printer className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {hasFinalAttempt
                          ? `LIHAT HASIL SAYA (NILAI: ${alreadyDone?.finalScore ?? 0})`
                          : quizModeDef.id === 'paper'
                          ? 'BUKA LEMBAR KERTAS'
                          : quiz.isRemedialQuiz
                          ? `KERJAKAN REMEDIAL • ${quizModeDef.shortName.toUpperCase()}`
                          : `GABUNG & KERJAKAN • ${quizModeDef.shortName.toUpperCase()}`}
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
