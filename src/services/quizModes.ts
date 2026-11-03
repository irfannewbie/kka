/**
 * Katalog mode kuis lokal (reimplementasi gaya Wayground, tanpa koneksi premium).
 *
 * Desain 2026: mode = preset niat pedagogis (5 mode inti), sedangkan variasi
 * seperti tim, auto-lanjut, tinjau jawaban, target akurasi, dan game arcade
 * disimpan sebagai PENGATURAN (QuizSettings). Dengan begitu guru tidak lagi
 * dihadapkan pada 9 mode yang tumpang tindih.
 */

/** 5 mode inti yang dipakai di UI guru dan siswa. */
export type QuizModeId = 'latihan' | 'kelas' | 'ujian' | 'remedial' | 'kertas';

/**
 * Id mode lama (data tersimpan sebelum konsolidasi 9 -> 5).
 * Hanya dipakai untuk migrasi; jangan dipakai untuk kode baru.
 */
export type LegacyQuizModeId =
  | 'classic'
  | 'team'
  | 'test'
  | 'mastery'
  | 'instructor'
  | 'paper'
  | 'practice'
  | 'accuracy'
  | 'testing';

/** Semua id mode yang mungkin muncul dari data lama maupun baru. */
export type AnyQuizModeId = QuizModeId | LegacyQuizModeId;

export type QuizModeCategory = 'live' | 'homework' | 'device-free';

/**
 * Saklar pengaturan per kuis. Semua bersifat opsional saat disimpan agar data
 * lama tetap valid; gunakan `getQuizSettings()` untuk membaca nilai final.
 */
export interface QuizSettings {
  /** Skor digabung per tim (4 tim otomatis dari nomor absen). */
  team: boolean;
  /** Auto-lanjut soal setelah hitung mundur per soal habis. */
  autoAdvance: boolean;
  /** Durasi hitung mundur per soal (detik) saat autoAdvance aktif. */
  autoAdvanceSeconds: number;
  /** Siswa boleh meninjau seluruh jawaban sebelum mengirim. */
  reviewBeforeSubmit: boolean;
  /** Target akurasi (0-100). Non-null berarti soal salah wajib diulang. */
  accuracyTarget: number | null;
  /** Power-Up 50:50 / Freeze / Shield. */
  powerUps: boolean;
  /** Game arcade per tipe soal. */
  arcade: boolean;
  /** Strike & Shield (gamifikasi bonus kecepatan). */
  strikeShield: boolean;
}

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  team: false,
  autoAdvance: false,
  autoAdvanceSeconds: 30,
  reviewBeforeSubmit: false,
  accuracyTarget: null,
  powerUps: true,
  arcade: false,
  strikeShield: false,
};

export interface QuizModeDefinition {
  id: QuizModeId;
  name: string;
  shortName: string;
  category: QuizModeCategory;
  /** Kelompok tampilan di UI guru. */
  group: 'kelas' | 'mandiri';
  tagline: string;
  description: string;
  bestFor: string;
  features: string[];
  icon:
    | 'play'
    | 'users'
    | 'clipboard'
    | 'mountain'
    | 'presentation'
    | 'printer'
    | 'book'
    | 'target'
    | 'shield';
  /** Timer keseluruhan sesi. */
  usesOverallTimer: boolean;
  allowsBackNavigation: boolean;
  /** Default: siswa boleh meninjau sebelum kirim. Bisa ditimpa setting. */
  allowsReviewBeforeSubmit: boolean;
  instantFeedback: boolean;
  showLeaderboard: boolean;
  powerUps: boolean;
  formalAssessment: boolean;
  /** Nilai bawaan mode ini; digabung dengan `quiz.settings`. */
  defaults: Partial<QuizSettings>;
  /** Mode latihan tidak boleh masuk ke Kalkulator Akademik. */
  practiceOnly?: boolean;
  /** Game arcade tidak boleh dinyalakan pada mode formal. */
  arcadeLocked?: boolean;
}

export const QUIZ_MODES: QuizModeDefinition[] = [
  {
    id: 'latihan',
    name: 'Latihan',
    shortName: 'Latihan',
    category: 'homework',
    group: 'mandiri',
    tagline: 'Latihan mandiri dengan umpan balik langsung.',
    description:
      'Tanpa batas waktu keseluruhan. Setelah menjawab, siswa langsung melihat benar/salah dan boleh mengulang. Nilai tidak masuk Kalkulator Akademik.',
    bestFor: 'Belajar mandiri, PR, dan persiapan sebelum kuis.',
    features: ['Umpan balik langsung', 'Tanpa timer', 'Bisa diulang', 'Tidak masuk nilai'],
    icon: 'book',
    usesOverallTimer: false,
    allowsBackNavigation: true,
    allowsReviewBeforeSubmit: true,
    instantFeedback: true,
    showLeaderboard: false,
    powerUps: false,
    formalAssessment: false,
    defaults: {
      arcade: false,
      powerUps: false,
      reviewBeforeSubmit: true,
    },
    practiceOnly: true,
  },
  {
    id: 'kelas',
    name: 'Kuis Kelas',
    shortName: 'Kelas',
    category: 'live',
    group: 'kelas',
    tagline: 'Papan peringkat langsung, kecepatan & streak.',
    description:
      'Siswa bergerak sesuai ritme sendiri. Papan peringkat diperbarui dari jawaban dan bonus kecepatan. Cocok untuk review harian dan kompetisi kelas.',
    bestFor: 'Review cepat, kuis harian, dan ice breaking.',
    features: ['Papan peringkat', 'Bonus kecepatan', 'Power-Up', 'Strike & Shield'],
    icon: 'play',
    usesOverallTimer: true,
    allowsBackNavigation: true,
    allowsReviewBeforeSubmit: true,
    instantFeedback: false,
    showLeaderboard: true,
    powerUps: true,
    formalAssessment: false,
    defaults: {
      arcade: false,
      powerUps: true,
      strikeShield: true,
    },
  },
  {
    id: 'ujian',
    name: 'Ujian',
    shortName: 'Ujian',
    category: 'live',
    group: 'kelas',
    tagline: 'Ujian formal, tanpa gangguan permainan.',
    description:
      'Tampilan minimal, tanpa Power-Up dan tanpa papan peringkat. Nilai akademik menjadi fokus utama. Siswa dapat meninjau jawaban sebelum mengirim.',
    bestFor: 'ASTS, ASAS, ulangan, dan asesmen sumatif.',
    features: ['Tanpa Power-Up', 'Tanpa leaderboard', 'Timer ujian', 'Nilai akademik'],
    icon: 'clipboard',
    usesOverallTimer: true,
    allowsBackNavigation: true,
    allowsReviewBeforeSubmit: true,
    instantFeedback: false,
    showLeaderboard: false,
    powerUps: false,
    formalAssessment: true,
    defaults: {
      arcade: false,
      powerUps: false,
      reviewBeforeSubmit: true,
      strikeShield: false,
    },
    arcadeLocked: true,
  },
  {
    id: 'remedial',
    name: 'Remedial',
    shortName: 'Remedial',
    category: 'homework',
    group: 'mandiri',
    tagline: 'Naik ke puncak dengan mengulang soal yang salah.',
    description:
      'Setelah putaran pertama, siswa melihat capaian lalu mengulang soal yang salah sampai target akurasi tercapai. Nilai remedial tetap dihitung terpisah.',
    bestFor: 'Penguasaan materi dan perbaikan nilai.',
    features: ['Target akurasi 80%', 'Ulang soal salah', 'Tahapan puncak', 'Nilai remedial'],
    icon: 'mountain',
    usesOverallTimer: false,
    allowsBackNavigation: true,
    allowsReviewBeforeSubmit: false,
    instantFeedback: true,
    showLeaderboard: false,
    powerUps: true,
    formalAssessment: false,
    defaults: {
      arcade: false,
      accuracyTarget: 80,
      powerUps: true,
      reviewBeforeSubmit: false,
    },
  },
  {
    id: 'kertas',
    name: 'Kertas',
    shortName: 'Kertas',
    category: 'device-free',
    group: 'kelas',
    tagline: 'Lembar soal cetak untuk kelas tanpa perangkat.',
    description:
      'Guru mencetak lembar soal dan lembar jawaban. Tidak ada timer dan tidak ada nilai digital otomatis; penilaian dilakukan manual.',
    bestFor: 'Kelas tanpa HP/laptop dan ujian cadangan.',
    features: ['Lembar soal cetak', 'Lembar jawaban', 'Tanpa nilai digital', 'Tanpa timer'],
    icon: 'printer',
    usesOverallTimer: false,
    allowsBackNavigation: false,
    allowsReviewBeforeSubmit: false,
    instantFeedback: false,
    showLeaderboard: false,
    powerUps: false,
    formalAssessment: true,
    defaults: {
      arcade: false,
      powerUps: false,
      reviewBeforeSubmit: false,
      strikeShield: false,
    },
    arcadeLocked: true,
  },
];

/** Pemetaan mode lama -> mode baru untuk membaca data tersimpan. */
const LEGACY_MODE_MAP: Record<LegacyQuizModeId, QuizModeId> = {
  classic: 'kelas',
  team: 'kelas',
  test: 'ujian',
  mastery: 'remedial',
  instructor: 'kelas',
  paper: 'kertas',
  practice: 'latihan',
  accuracy: 'remedial',
  testing: 'ujian',
};

const NEW_MODE_IDS: QuizModeId[] = ['latihan', 'kelas', 'ujian', 'remedial', 'kertas'];

export function isQuizModeId(value: unknown): value is QuizModeId {
  return typeof value === 'string' && (NEW_MODE_IDS as string[]).includes(value);
}

/**
 * Ubah id mode apa pun (termasuk id lama) menjadi salah satu dari 5 mode inti.
 * Default `kelas` bila kosong/tidak dikenal.
 */
export function normalizeModeId(modeId?: AnyQuizModeId | string | null): QuizModeId {
  if (isQuizModeId(modeId)) return modeId;
  if (typeof modeId === 'string' && modeId in LEGACY_MODE_MAP) {
    return LEGACY_MODE_MAP[modeId as LegacyQuizModeId];
  }
  return 'kelas';
}

/** True untuk mode yang nilainya tidak boleh masuk Kalkulator Akademik. */
export function isPracticeMode(modeId?: AnyQuizModeId | string | null): boolean {
  return normalizeModeId(modeId) === 'latihan';
}

/** True untuk mode asesmen formal (arcade selalu dimatikan). */
export function isFormalMode(modeId?: AnyQuizModeId | string | null): boolean {
  const id = normalizeModeId(modeId);
  return id === 'ujian' || id === 'kertas';
}

export interface QuizSettingsSource {
  liveMode?: AnyQuizModeId | string | null;
  settings?: Partial<QuizSettings> | null;
  /** Field lama (sebelum ada `settings`). */
  useArcadeMode?: boolean | null;
}

/**
 * Hitung pengaturan final sebuah kuis: default global -> default mode ->
 * pengaturan tersimpan -> migrasi field lama. Arcade dipaksa mati untuk mode
 * formal agar nilai asesmen tetap sah.
 */
export function getQuizSettings(quiz?: QuizSettingsSource | null): QuizSettings {
  const modeId = normalizeModeId(quiz?.liveMode);
  const modeDef = getQuizMode(modeId);

  const merged: QuizSettings = {
    ...DEFAULT_QUIZ_SETTINGS,
    ...modeDef.defaults,
    ...(quiz?.settings || {}),
  };

  // Kompatibilitas data lama.
  const legacy = quiz?.liveMode as LegacyQuizModeId | undefined;
  if (legacy === 'team') merged.team = true;
  if (legacy === 'instructor') merged.autoAdvance = true;
  if (legacy === 'testing') merged.reviewBeforeSubmit = true;
  if (legacy === 'accuracy' || legacy === 'mastery') merged.accuracyTarget = 80;

  // Field lama `useArcadeMode` hanya dipakai bila `settings.arcade` belum ada.
  if (quiz?.settings?.arcade === undefined && typeof quiz?.useArcadeMode === 'boolean') {
    merged.arcade = quiz.useArcadeMode;
  }

  // Pengaman: game tidak boleh dipakai pada asesmen formal.
  if (modeDef.arcadeLocked) merged.arcade = false;
  merged.accuracyTarget =
    merged.accuracyTarget === null || merged.accuracyTarget === undefined
      ? null
      : Math.max(1, Math.min(100, Math.round(merged.accuracyTarget)));

  return merged;
}

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

export function getQuizMode(modeId?: AnyQuizModeId | string | null): QuizModeDefinition {
  const id = normalizeModeId(modeId);
  return QUIZ_MODES.find((m) => m.id === id) || QUIZ_MODES[1];
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

/**
 * Rekomendasi mode otomatis berdasarkan sifat kuis. Dipakai di UI guru untuk
 * menyorot pilihan yang paling sesuai.
 */
export function recommendMode(quiz?: {
  isRemedialQuiz?: boolean | null;
  assessmentType?: string | null;
  assessment?: string | null;
  useArcadeMode?: boolean | null;
} | null): QuizModeId {
  if (quiz?.isRemedialQuiz) return 'remedial';
  const type = (quiz?.assessmentType || quiz?.assessment || '').toUpperCase();
  if (type.includes('ASAS') || type.includes('ASTS') || type.includes('SUMATIF')) {
    return 'ujian';
  }
  return 'kelas';
}
