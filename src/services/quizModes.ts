/**
 * Katalog mode kuis yang mengacu pada mode sesi Wayground (2026):
 * - Live: Classic, Team, Test, Mastery Peak, Instructor-Paced, Paper.
 * - Tugas/asinkron: Practice, Accuracy, Testing.
 *
 * Catatan: mode di sini adalah hasil reimplementasi lokal. Tidak ada koneksi
 * ke server Wayground dan tidak ada data akun premium yang diambil.
 */

export type QuizModeId =
  | 'classic'
  | 'team'
  | 'test'
  | 'mastery'
  | 'instructor'
  | 'paper'
  | 'practice'
  | 'accuracy'
  | 'testing';

export type QuizModeCategory = 'live' | 'homework' | 'device-free';

export interface QuizModeDefinition {
  id: QuizModeId;
  name: string;
  shortName: string;
  category: QuizModeCategory;
  tagline: string;
  description: string;
  bestFor: string;
  features: string[];
  icon: 'play' | 'users' | 'clipboard' | 'mountain' | 'presentation' | 'printer' | 'book' | 'target' | 'shield';
  /**
   * Timer keseluruhan sesi. Mode tugas seperti Practice/Accuracy tidak memakai
   * hitung mundur keseluruhan agar siswa bisa berpikir tanpa tekanan waktu.
   */
  usesOverallTimer: boolean;
  allowsBackNavigation: boolean;
  allowsReviewBeforeSubmit: boolean;
  instantFeedback: boolean;
  showLeaderboard: boolean;
  powerUps: boolean;
  formalAssessment: boolean;
  /** Target akurasi untuk Mastery Peak / Accuracy Mode. */
  targetAccuracy?: number;
  /** Hitung mundur per soal untuk Instructor-Paced. */
  autoAdvanceSeconds?: number;
  /** Mode latihan tidak boleh masuk ke Kalkulator Akademik. */
  practiceOnly?: boolean;
  premiumNote?: string;
}

export const QUIZ_MODES: QuizModeDefinition[] = [
  {
    id: 'classic',
    name: 'Classic',
    shortName: 'Classic',
    category: 'live',
    tagline: 'Papan peringkat langsung, kecepatan & streak.',
    description:
      'Siswa bergerak sesuai ritme sendiri. Papan peringkat diperbarui dari jawaban dan bonus kecepatan.',
    bestFor: 'Review cepat, kuis harian, dan kompetisi kelas.',
    features: ['Papan peringkat', 'Bonus kecepatan', 'Power-Up', 'Strike & Shield'],
    icon: 'play',
    usesOverallTimer: true,
    allowsBackNavigation: true,
    allowsReviewBeforeSubmit: true,
    instantFeedback: false,
    showLeaderboard: true,
    powerUps: true,
    formalAssessment: false,
    premiumNote: 'Strike & Shield adalah fitur gamifikasi premium di Classic.',
  },
  {
    id: 'team',
    name: 'Team',
    shortName: 'Team',
    category: 'live',
    tagline: 'Skor individu digabung menjadi skor tim.',
    description:
      'Setiap siswa tetap menjawab sendiri, tetapi poin masuk ke total tim. Tim dibagi otomatis dari nomor absen.',
    bestFor: 'Kerja sama, turnamen kelas, dan review kelompok.',
    features: ['4 tim otomatis', 'Skor kolektif', 'Power-Up', 'Papan tim'],
    icon: 'users',
    usesOverallTimer: true,
    allowsBackNavigation: true,
    allowsReviewBeforeSubmit: true,
    instantFeedback: false,
    showLeaderboard: true,
    powerUps: true,
    formalAssessment: false,
  },
  {
    id: 'test',
    name: 'Test',
    shortName: 'Test',
    category: 'live',
    tagline: 'Ujian formal, tanpa gangguan permainan.',
    description:
      'Tampilan minimal, tanpa Power-Up dan tanpa papan peringkat. Nilai akademik menjadi fokus utama.',
    bestFor: 'Ulangan, asesmen sumatif, dan ujian kelas.',
    features: ['Tanpa Power-Up', 'Tanpa leaderboard', 'Timer ujian', 'Nilai akademik'],
    icon: 'clipboard',
    usesOverallTimer: true,
    allowsBackNavigation: true,
    allowsReviewBeforeSubmit: true,
    instantFeedback: false,
    showLeaderboard: false,
    powerUps: false,
    formalAssessment: true,
  },
  {
    id: 'mastery',
    name: 'Mastery Peak',
    shortName: 'Mastery',
    category: 'live',
    tagline: 'Naik ke puncak dengan mengulang soal yang salah.',
    description:
      'Setelah putaran pertama, siswa melihat puncak gunung dan mengulang soal yang salah sampai target akurasi tercapai.',
    bestFor: 'Penguasaan materi dan remedial mandiri.',
    features: ['Target akurasi 80%', 'Putaran ulang', 'Power-Up', 'Progres gunung'],
    icon: 'mountain',
    usesOverallTimer: true,
    allowsBackNavigation: true,
    allowsReviewBeforeSubmit: false,
    instantFeedback: false,
    showLeaderboard: true,
    powerUps: true,
    formalAssessment: false,
    targetAccuracy: 80,
  },
  {
    id: 'instructor',
    name: 'Instructor-Paced',
    shortName: 'Guru',
    category: 'live',
    tagline: 'Soal berganti otomatis seperti dipandu guru.',
    description:
      'Satu soal tampil dalam satu waktu dengan hitung mundur 30 detik. Soal otomatis lanjut dan tidak bisa kembali.',
    bestFor: 'Pembelajaran terbimbing dan kuis proyektor.',
    features: ['30 detik per soal', 'Auto-lanjut', 'Tanpa kembali', 'Fokus satu soal'],
    icon: 'presentation',
    usesOverallTimer: true,
    allowsBackNavigation: false,
    allowsReviewBeforeSubmit: false,
    instantFeedback: false,
    showLeaderboard: false,
    powerUps: false,
    formalAssessment: false,
    autoAdvanceSeconds: 30,
  },
  {
    id: 'paper',
    name: 'Paper',
    shortName: 'Kertas',
    category: 'device-free',
    tagline: 'Lembar soal cetak untuk kelas tanpa perangkat.',
    description:
      'Soal disusun menjadi lembar cetak beserta lembar jawaban. Cocok untuk kelas yang tidak memakai HP atau laptop.',
    bestFor: 'Kelas tanpa perangkat dan asesmen offline.',
    features: ['Lembar soal cetak', 'Lembar jawaban', 'Tanpa nilai digital', 'Tanpa timer'],
    icon: 'printer',
    usesOverallTimer: false,
    allowsBackNavigation: false,
    allowsReviewBeforeSubmit: false,
    instantFeedback: false,
    showLeaderboard: false,
    powerUps: false,
    formalAssessment: true,
  },
  {
    id: 'practice',
    name: 'Practice',
    shortName: 'Latihan',
    category: 'homework',
    tagline: 'Latihan mandiri dengan umpan balik langsung.',
    description:
      'Tanpa batas waktu keseluruhan. Setelah menjawab, siswa dapat memeriksa jawaban dan mencoba lagi. Nilai tidak masuk Kalkulator Akademik.',
    bestFor: 'Belajar mandiri dan persiapan sebelum kuis.',
    features: ['Umpan balik langsung', 'Tanpa timer', 'Bisa diulang', 'Tidak masuk nilai'],
    icon: 'book',
    usesOverallTimer: false,
    allowsBackNavigation: true,
    allowsReviewBeforeSubmit: true,
    instantFeedback: true,
    showLeaderboard: false,
    powerUps: false,
    formalAssessment: false,
    practiceOnly: true,
  },
  {
    id: 'accuracy',
    name: 'Accuracy',
    shortName: 'Akurasi',
    category: 'homework',
    tagline: 'Kejar target akurasi dengan mengulang kesalahan.',
    description:
      'Siswa fokus pada ketepatan, bukan kecepatan. Soal yang salah diulang sampai target akurasi 80% tercapai.',
    bestFor: 'Perbaikan pemahaman dan latihan mandiri.',
    features: ['Target 80%', 'Tanpa timer', 'Ulang soal salah', 'Tanpa leaderboard'],
    icon: 'target',
    usesOverallTimer: false,
    allowsBackNavigation: true,
    allowsReviewBeforeSubmit: false,
    instantFeedback: false,
    showLeaderboard: false,
    powerUps: false,
    formalAssessment: false,
    targetAccuracy: 80,
  },
  {
    id: 'testing',
    name: 'Testing',
    shortName: 'Testing',
    category: 'homework',
    tagline: 'Ujian asinkron dengan tinjau jawaban sebelum kirim.',
    description:
      'Ujian formal yang dikerjakan mandiri. Siswa dapat meninjau seluruh jawaban sebelum mengirim, tanpa Power-Up dan leaderboard.',
    bestFor: 'Ujian rumah dan asesmen asinkron.',
    features: ['Timer ujian', 'Tinjau jawaban', 'Tanpa Power-Up', 'Nilai akademik'],
    icon: 'shield',
    usesOverallTimer: true,
    allowsBackNavigation: true,
    allowsReviewBeforeSubmit: true,
    instantFeedback: false,
    showLeaderboard: false,
    powerUps: false,
    formalAssessment: true,
  },
];

export const QUIZ_MODE_GROUPS: Array<{
  id: 'live' | 'homework';
  label: string;
  description: string;
  modes: QuizModeDefinition[];
}> = [
  {
    id: 'live',
    label: 'MODE LIVE',
    description: 'Dikerjakan bersama di kelas. Paper termasuk mode tanpa perangkat.',
    modes: QUIZ_MODES.filter((m) => m.category === 'live' || m.category === 'device-free'),
  },
  {
    id: 'homework',
    label: 'MODE TUGAS / ASINKRON',
    description: 'Dikerjakan mandiri, bisa kapan saja.',
    modes: QUIZ_MODES.filter((m) => m.category === 'homework'),
  },
];

export interface QuizTeam {
  id: string;
  name: string;
  mascot: string;
  badgeClass: string;
  textClass: string;
  borderClass: string;
}

export const QUIZ_TEAMS: QuizTeam[] = [
  {
    id: 'garuda',
    name: 'Tim Garuda',
    mascot: '🦅',
    badgeClass: 'bg-rose-600 text-white',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-600',
  },
  {
    id: 'elang',
    name: 'Tim Elang',
    mascot: '🛡️',
    badgeClass: 'bg-blue-600 text-white',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-600',
  },
  {
    id: 'harimau',
    name: 'Tim Harimau',
    mascot: '🐯',
    badgeClass: 'bg-amber-400 text-[#1a1a1a]',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-500',
  },
  {
    id: 'naga',
    name: 'Tim Naga',
    mascot: '🐉',
    badgeClass: 'bg-emerald-600 text-white',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-600',
  },
];

export function getQuizMode(modeId: QuizModeId): QuizModeDefinition {
  return QUIZ_MODES.find((m) => m.id === modeId) || QUIZ_MODES[0];
}

export function getTeamForAttendance(attendanceNo: number): QuizTeam {
  const safeNo = Number.isFinite(attendanceNo) ? Math.max(1, Math.floor(attendanceNo)) : 1;
  return QUIZ_TEAMS[(safeNo - 1) % QUIZ_TEAMS.length];
}

export function teamFromName(name?: string): QuizTeam {
  return QUIZ_TEAMS.find((t) => t.name === name) || getTeamForAttendance(1);
}

export function calculateAccuracy(correct: number, total: number): number {
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((correct / total) * 100)));
}

export function accuracyLabel(correct: number, total: number): string {
  return `${calculateAccuracy(correct, total)}%`;
}

export function getMasteryStage(accuracy: number): {
  label: string;
  emoji: string;
  hint: string;
} {
  if (accuracy >= 100) {
    return { label: 'Puncak Tertinggi', emoji: '🏔️', hint: 'Sempurna! Kamu mencapai puncak.' };
  }
  if (accuracy >= 80) {
    return { label: 'Puncak Tercapai', emoji: '⛰️', hint: 'Target mastery tercapai.' };
  }
  if (accuracy >= 60) {
    return { label: 'Camp 2', emoji: '⛺', hint: 'Sedikit lagi menuju puncak.' };
  }
  if (accuracy >= 40) {
    return { label: 'Camp 1', emoji: '🥾', hint: 'Terus ulangi soal yang salah.' };
  }
  return { label: 'Garis Awal', emoji: '🌄', hint: 'Mulai mendaki dari dasar gunung.' };
}

export const POWER_UP_DEFINITIONS = [
  {
    id: 'fifty',
    name: '50:50',
    shortName: '50:50',
    description: 'Sembunyikan dua pilihan jawaban yang salah.',
    icon: 'scissors',
  },
  {
    id: 'freeze',
    name: 'Bekukan Waktu',
    shortName: '+30 dtk',
    description: 'Tambahkan 30 detik ke timer kuis.',
    icon: 'clock',
  },
  {
    id: 'shield',
    name: 'Perisai',
    shortName: 'Perisai',
    description: 'Tambah satu perisai untuk menahan serangan.',
    icon: 'shield',
  },
] as const;

export type PowerUpId = (typeof POWER_UP_DEFINITIONS)[number]['id'];
