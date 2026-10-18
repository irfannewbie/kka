import {
  loadLocalCalculatorDataset,
  saveCalculatorDatasetEverywhere,
} from './calculatorMasterStore';

export type QuizQuestionType =
  | 'pg'
  | 'matching'
  | 'essay'
  | 'parsons'
  | 'code_output';

export interface MatchingPairItem {
  id: string;
  leftText: string;
  rightText: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  questionText: string;
  codeSnippet?: string;
  liveHtmlPreview?: boolean;
  // For 'pg' and 'code_output'
  options?: string[];
  correctOptionIndex?: number;
  // For 'matching'
  matchingPairs?: MatchingPairItem[];
  // For 'parsons' (Susun Blok Algoritma / Kode)
  parsonsBlocks?: string[];
  // For 'essay'
  expectedKeywords?: string[];
  sampleAnswer?: string;
  // Max points for essay / parsons (default 10)
  maxPoints?: number;
}

export interface InteractiveQuiz {
  id: string;
  title: string;
  description: string;
  tokenPin: string;
  gradeLevel: '7' | '8' | 'ALL';
  targetClasses: string[];
  subject: 'Informatika' | 'Koding';
  assessment: 'ASTS Gasal' | 'ASAS Gasal' | 'ASTS Genap' | 'ASAS Genap / ASASGN';
  isRemedialQuiz: boolean;
  scoringScaleMode: 'PROPORSIONAL_100' | 'JUMLAH_MENTAH';
  durationMinutes: number;
  maxTabSwitches: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  isActive: boolean;
  isLiveArenaMode: boolean;
  kktp: number;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttemptSubmission {
  id: string;
  quizId: string;
  quizTitle: string;
  tokenPin: string;
  className: string;
  attendanceNo: number;
  studentName: string;
  nis: string;
  subject: 'Informatika' | 'Koding';
  assessment: 'ASTS Gasal' | 'ASAS Gasal' | 'ASTS Genap' | 'ASAS Genap / ASASGN';
  isRemedial: boolean;
  rawPGCorrect: number;
  rawPGTotal: number;
  rawMatchingCorrect: number;
  rawMatchingTotal: number;
  rawEssayAndLabPoints: number;
  rawEssayAndLabMax: number;
  calcBenarPG: number;
  calcBenarMJ: number;
  calcSkorUraian: number;
  finalScore: number;
  speedBonusPoints: number;
  arenaTotalPoints: number;
  maxStreak: number;
  durationSpentSeconds: number;
  tabSwitchCount: number;
  autoSubmittedByTimeout: boolean;
  autoSubmittedByTabLimit: boolean;
  answersDetail: Record<string, any>;
  submittedAt: string;
  syncedToCalculator: boolean;
}

export const DEFAULT_QUIZZES_SEED: InteractiveQuiz[] = [
  {
    id: 'quiz-kka-kelas8-main',
    title: 'Asesmen Interaktif KKA Kelas 8: Algoritma, Web & Kecerdasan Artifisial',
    description:
      'Kuis terpadu Koding & Kecerdasan Artifisial (Pilihan Ganda, Menjodohkan Tag HTML/AI, Susun Blok Algoritma, Tebak Output Kode, dan Uraian). Otomatis masuk ke Kalkulator Akademik.',
    tokenPin: 'KKA8',
    gradeLevel: '8',
    targetClasses: [
      'Kelas 8A',
      'Kelas 8B',
      'Kelas 8C',
      'Kelas 8D',
      'Kelas 8E',
      'Kelas 8F',
      'Kelas 8G',
      'Kelas 8H',
    ],
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
    createdAt: '01/10/2026 07:30',
    updatedAt: '01/10/2026 07:30',
    questions: [
      {
        id: 'q-kka8-1',
        type: 'pg',
        questionText:
          'Urutan langkah-langkah logis dan sistematis yang disusun untuk menyelesaikan suatu masalah dalam pemrograman disebut...',
        options: ['Algoritma', 'Kompilator', 'Variabel', 'Peramban (Browser)'],
        correctOptionIndex: 0,
      },
      {
        id: 'q-kka8-2',
        type: 'pg',
        questionText:
          'Dalam kecerdasan artifisial (AI), proses ketika komputer belajar mengenali pola dari data contoh tanpa diprogram satu per satu secara eksplisit disebut...',
        options: [
          'Machine Learning (Pembelajaran Mesin)',
          'Defragmentasi Disk',
          'Instalasi Sistem Operasi',
          'Kompresi File Statis',
        ],
        correctOptionIndex: 0,
      },
      {
        id: 'q-kka8-3',
        type: 'code_output',
        questionText:
          'Perhatikan potongan kode HTML & CSS pada panel di bawah ini! Apa warna teks judul dan teks paragraf yang tampil pada halaman web?',
        codeSnippet: `<div style="padding:12px; background:#f8fafc; border:2px solid #0f172a; font-family:sans-serif;">
  <h3 style="color:#2563eb; margin:0 0 6px 0;">Portal Karya KKA Kelas 8</h3>
  <p style="color:#059669; font-weight:bold; margin:0;">Status: Proyek Selesai</p>
</div>`,
        liveHtmlPreview: true,
        options: [
          'Judul berwarna Biru dan Paragraf berwarna Hijau tebal',
          'Judul berwarna Merah dan Paragraf berwarna Kuning',
          'Judul dan Paragraf keduanya berwarna Hitam polos',
          'Judul berwarna Hijau dan Paragraf berwarna Biru miring',
        ],
        correctOptionIndex: 0,
      },
      {
        id: 'q-kka8-4',
        type: 'pg',
        questionText:
          'Struktur percabangan dalam koding yang digunakan untuk menjalankan blok perintah hanya jika suatu kondisi bernilai BENAR (True) adalah...',
        options: ['IF ... THEN ... ELSE', 'FOR ... NEXT', 'IMPORT LIBRARY', 'PRINT OUTPUT'],
        correctOptionIndex: 0,
      },
      {
        id: 'q-kka8-5',
        type: 'code_output',
        questionText:
          'Perhatikan potongan pseudocode logika berikut! Jika nilai_siswa = 82 dan kktp = 75, apa output yang dihasilkan?',
        codeSnippet: `SET nilai_siswa = 82
SET kktp = 75

IF nilai_siswa >= kktp THEN
  CETAK "TUNTAS - LULUS KKTP"
ELSE
  CETAK "BELUM TUNTAS - IKUTI REMEDIAL"
END IF`,
        options: [
          'TUNTAS - LULUS KKTP',
          'BELUM TUNTAS - IKUTI REMEDIAL',
          '82 >= 75',
          'Error karena variabel tidak dikenali',
        ],
        correctOptionIndex: 0,
      },
      {
        id: 'q-kka8-6',
        type: 'matching',
        questionText:
          'Pasangkan elemen/konsep Koding & Kecerdasan Artifisial di sebelah kiri dengan fungsi yang tepat di sebelah kanan!',
        matchingPairs: [
          {
            id: 'mp-1',
            leftText: 'Tag <h1> ... </h1> pada HTML',
            rightText: 'Membuat judul utama (Heading 1) pada halaman web',
          },
          {
            id: 'mp-2',
            leftText: 'Tag <a href="..."> pada HTML',
            rightText: 'Membuat tautan (hyperlink) menuju halaman lain',
          },
          {
            id: 'mp-3',
            leftText: 'Prompt pada AI Generatif',
            rightText: 'Instruksi teks yang diberikan pengguna kepada model AI',
          },
          {
            id: 'mp-4',
            leftText: 'Debugging dalam Koding',
            rightText: 'Proses mencari dan memperbaiki kesalahan (bug) pada kode program',
          },
          {
            id: 'mp-5',
            leftText: 'Perulangan (Looping)',
            rightText: 'Menjalankan instruksi kode secara berulang selama kondisi terpenuhi',
          },
        ],
      },
      {
        id: 'q-kka8-7',
        type: 'parsons',
        questionText:
          'TANTANGAN ALGORITMA (PARSONS PUZZLE): Susunlah blok-blok langkah algoritma pembuatan program pengecekan kelulusan nilai siswa berikut dari urutan pertama (atas) hingga terakhir (bawah)!',
        parsonsBlocks: [
          '1. MULAI (Start Program)',
          '2. Input nama_siswa dan nilai_ujian',
          '3. Periksa kondisi: Apakah nilai_ujian >= 75?',
          '4. Jika YA cetak "Tuntas", jika TIDAK cetak "Remedial"',
          '5. SELESAI (End Program)',
        ],
        maxPoints: 15,
      },
      {
        id: 'q-kka8-8',
        type: 'essay',
        questionText:
          'Jelaskan dengan bahasamu sendiri mengapa kita perlu memeriksa kembali (verifikasi) jawaban yang diberikan oleh Kecerdasan Artifisial (AI) sebelum menggunakannya untuk tugas sekolah!',
        expectedKeywords: ['akurasi', 'salah', 'fakta', 'kebenaran', 'cek', 'halusinasi', 'kritis', 'sumber'],
        sampleAnswer:
          'Karena AI bisa menghasilkan informasi yang kurang akurat (halusinasi), sehingga kita perlu berpikir kritis dan mengecek kebenaran fakta serta sumbernya.',
        maxPoints: 10,
      },
    ],
  },
  {
    id: 'quiz-info-kelas7-main',
    title: 'Kuis Interaktif Informatika Kelas 7: Berpikir Komputasional & Sistem Komputer',
    description:
      'Evaluasi interaktif Kelas 7 (7E–7H) mencakup Dekomposisi, Pengenalan Pola, Perangkat Keras (Hardware), Perangkat Lunak, dan Urutan Kerja Komputer.',
    tokenPin: 'INFO7',
    gradeLevel: '7',
    targetClasses: ['Kelas 7E', 'Kelas 7F', 'Kelas 7G', 'Kelas 7H'],
    subject: 'Informatika',
    assessment: 'ASTS Gasal',
    isRemedialQuiz: false,
    scoringScaleMode: 'PROPORSIONAL_100',
    durationMinutes: 25,
    maxTabSwitches: 3,
    shuffleQuestions: true,
    shuffleOptions: true,
    isActive: false,
    isLiveArenaMode: false,
    kktp: 75,
    createdAt: '01/10/2026 07:30',
    updatedAt: '01/10/2026 07:30',
    questions: [
      {
        id: 'q-inf7-1',
        type: 'pg',
        questionText:
          'Dalam Berpikir Komputasional (Computational Thinking), memecah suatu masalah besar dan kompleks menjadi bagian-bagian yang lebih kecil agar mudah diselesaikan disebut...',
        options: ['Dekomposisi (Decomposition)', 'Abstraksi (Abstraction)', 'Kompilasi', 'Enkripsi Data'],
        correctOptionIndex: 0,
      },
      {
        id: 'q-inf7-2',
        type: 'pg',
        questionText:
          'Manakah di antara perangkat berikut yang termasuk ke dalam kelompok Perangkat Keras Masukan (Input Device)?',
        options: [
          'Keyboard, Mouse, dan Scanner',
          'Monitor, Proyektor, dan Speaker',
          'Printer, Plotter, dan Headset',
          'Microsoft Word dan Google Chrome',
        ],
        correctOptionIndex: 0,
      },
      {
        id: 'q-inf7-3',
        type: 'pg',
        questionText:
          'Otak dari komputer yang bertugas melakukan perhitungan aritmatika, logika, dan mengendalikan seluruh pemrosesan data adalah...',
        options: [
          'CPU (Central Processing Unit)',
          'Flashdisk USB',
          'Kabel LAN / RJ-45',
          'Casing Komputer',
        ],
        correctOptionIndex: 0,
      },
      {
        id: 'q-inf7-4',
        type: 'code_output',
        questionText:
          'Perhatikan pola deret angka berpikir komputasional berikut! Berapakah angka yang tepat untuk mengisi tanda tanya (?) pada urutan ke-5?',
        codeSnippet: `Deret Angka:  3  ,  6  ,  12  ,  24  ,  [ ? ]  ,  96
Aturan Pola: Setiap suku berikutnya dikalikan 2 dari suku sebelumnya.`,
        options: ['48', '36', '42', '60'],
        correctOptionIndex: 0,
      },
      {
        id: 'q-inf7-5',
        type: 'matching',
        questionText:
          'Jodohkan komponen Sistem Komputer di sebelah kiri dengan kategori/perannya yang tepat di sebelah kanan!',
        matchingPairs: [
          {
            id: 'mp7-1',
            leftText: 'RAM (Random Access Memory)',
            rightText: 'Penyimpanan sementara berkecepatan tinggi saat program berjalan',
          },
          {
            id: 'mp7-2',
            leftText: 'Sistem Operasi (Windows / Linux / Android)',
            rightText: 'Perangkat lunak utama penghubung pengguna dengan hardware',
          },
          {
            id: 'mp7-3',
            leftText: 'Monitor & Proyektor',
            rightText: 'Perangkat keluaran (Output Device) penampil visual',
          },
          {
            id: 'mp7-4',
            leftText: 'Brainware',
            rightText: 'Manusia / pengguna yang mengoperasikan sistem komputer',
          },
        ],
      },
      {
        id: 'q-inf7-6',
        type: 'parsons',
        questionText:
          'TANTANGAN LOGIKA: Susunlah siklus pengolahan data pada Sistem Komputer berikut dari tahap pertama hingga tahap terakhir!',
        parsonsBlocks: [
          '1. INPUT: Pengguna memasukkan data melalui Keyboard/Mouse',
          '2. PROCESS: CPU mengolah data sesuai instruksi program di RAM',
          '3. OUTPUT: Hasil olahan ditampilkan melalui layar Monitor/Speaker',
          '4. STORAGE: Data disimpan secara permanen ke dalam SSD/Harddisk',
        ],
        maxPoints: 15,
      },
      {
        id: 'q-inf7-7',
        type: 'essay',
        questionText:
          'Sebutkan perbedaan utama antara Perangkat Keras (Hardware) dan Perangkat Lunak (Software) beserta masing-masing 1 contohnya!',
        expectedKeywords: ['fisik', 'disentuh', 'program', 'aplikasi', 'keyboard', 'monitor', 'windows', 'browser'],
        sampleAnswer:
          'Hardware memiliki wujud fisik yang dapat dilihat dan disentuh (contoh: Keyboard, Monitor), sedangkan Software adalah program/instruksi digital di dalam komputer yang tidak berwujud fisik (contoh: Windows, Browser Chrome).',
        maxPoints: 10,
      },
    ],
  },
  {
    id: 'quiz-remedial-universal',
    title: 'Kuis Remedial Terpadu (Perbaikan Nilai Capaian KKTP)',
    description:
      'Kuis khusus perbaikan nilai bagi siswa Kelas 7 maupun Kelas 8 yang nilainya masih di bawah KKTP (75). Nilai hasil kuis ini otomatis mengisi kolom Nilai Remedial di Kalkulator Akademik.',
    tokenPin: 'REMED75',
    gradeLevel: 'ALL',
    targetClasses: [
      'Kelas 7E',
      'Kelas 7F',
      'Kelas 7G',
      'Kelas 7H',
      'Kelas 8A',
      'Kelas 8B',
      'Kelas 8C',
      'Kelas 8D',
      'Kelas 8E',
      'Kelas 8F',
      'Kelas 8G',
      'Kelas 8H',
    ],
    subject: 'Informatika',
    assessment: 'ASTS Gasal',
    isRemedialQuiz: true,
    scoringScaleMode: 'PROPORSIONAL_100',
    durationMinutes: 20,
    maxTabSwitches: 3,
    shuffleQuestions: true,
    shuffleOptions: true,
    isActive: false,
    isLiveArenaMode: false,
    kktp: 75,
    createdAt: '01/10/2026 07:30',
    updatedAt: '01/10/2026 07:30',
    questions: [
      {
        id: 'q-rem-1',
        type: 'pg',
        questionText:
          'Langkah pertama yang paling tepat ketika kita akan menyelesaikan masalah menggunakan pendekatan berpikir komputasional adalah...',
        options: [
          'Memahami masalah dan memecahnya menjadi bagian kecil (Dekomposisi)',
          'Langsung mematikan komputer',
          'Menghapus seluruh file di dalam penyimpanan',
          'Mengganti layar monitor dengan yang baru',
        ],
        correctOptionIndex: 0,
      },
      {
        id: 'q-rem-2',
        type: 'pg',
        questionText:
          'Manakah pasangan perangkat berikut yang merupakan perangkat masukan (Input) dan perangkat keluaran (Output) secara berurutan?',
        options: [
          'Mouse (Input) dan Monitor (Output)',
          'Speaker (Input) dan Keyboard (Output)',
          'Printer (Input) dan Proyektor (Output)',
          'Monitor (Input) dan Mouse (Output)',
        ],
        correctOptionIndex: 0,
      },
      {
        id: 'q-rem-3',
        type: 'matching',
        questionText:
          'Pasangkan istilah dasar Informatika & Koding di kiri dengan arti yang benar di kanan!',
        matchingPairs: [
          {
            id: 'mprem-1',
            leftText: 'Algoritma',
            rightText: 'Urutan langkah logis penyelesaian masalah',
          },
          {
            id: 'mprem-2',
            leftText: 'Browser (Peramban)',
            rightText: 'Aplikasi untuk membuka halaman situs web di internet',
          },
          {
            id: 'mprem-3',
            leftText: 'Keamanan Akun (Password)',
            rightText: 'Kombinasi rahasia untuk melindungi akses akun pengguna',
          },
        ],
      },
      {
        id: 'q-rem-4',
        type: 'parsons',
        questionText:
          'Susunlah langkah aman menggunakan komputer di laboratorium sekolah berikut secara berurutan!',
        parsonsBlocks: [
          '1. Menyalakan komputer sesuai prosedur dan login akun siswa',
          '2. Mengerjakan tugas/kuis pembelajaran dengan tertib',
          '3. Menyimpan seluruh pekerjaan dan menutup aplikasi',
          '4. Melakukan Shut Down komputer dan merapikan kursi',
        ],
        maxPoints: 15,
      },
      {
        id: 'q-rem-5',
        type: 'essay',
        questionText:
          'Tuliskan 2 manfaat utama mempelajari Informatika serta Koding & Kecerdasan Artifisial bagi siswa SMP!',
        expectedKeywords: ['logis', 'masalah', 'teknologi', 'kreatif', 'komputer', 'koding', 'masa depan', 'digital'],
        sampleAnswer:
          'Melatih cara berpikir logis/sistematis dalam memecahkan masalah dan membekali keterampilan teknologi digital di masa depan.',
        maxPoints: 10,
      },
    ],
  },
];

const QUIZZES_LOCAL_KEY = 'smpn1wedi_interactive_quizzes_v2';
const SUBMISSIONS_LOCAL_KEY = 'smpn1wedi_quiz_submissions_v2';

export function loadLocalQuizzes(): InteractiveQuiz[] {
  if (typeof window === 'undefined') return DEFAULT_QUIZZES_SEED;
  try {
    const raw = localStorage.getItem(QUIZZES_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_QUIZZES_SEED;
}

export function saveLocalQuizzes(quizzes: InteractiveQuiz[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUIZZES_LOCAL_KEY, JSON.stringify(quizzes));
  } catch {
    // ignore
  }
}

export function loadLocalQuizSubmissions(): QuizAttemptSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveLocalQuizSubmissions(subs: QuizAttemptSubmission[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SUBMISSIONS_LOCAL_KEY, JSON.stringify(subs));
  } catch {
    // ignore
  }
}

export async function fetchQuizzesAndSubmissionsFromServer(): Promise<{
  quizzes: InteractiveQuiz[];
  submissions: QuizAttemptSubmission[];
}> {
  try {
    const res = await fetch('/api/quizzes');
    if (res.ok) {
      const json = await res.json();
      const quizzes: InteractiveQuiz[] =
        Array.isArray(json.quizzes) && json.quizzes.length > 0
          ? json.quizzes
          : loadLocalQuizzes();
      const submissions: QuizAttemptSubmission[] = Array.isArray(json.submissions)
        ? json.submissions
        : loadLocalQuizSubmissions();
      saveLocalQuizzes(quizzes);
      saveLocalQuizSubmissions(submissions);
      return { quizzes, submissions };
    }
  } catch {
    // fallback to local
  }
  return {
    quizzes: loadLocalQuizzes(),
    submissions: loadLocalQuizSubmissions(),
  };
}

export async function saveQuizToServer(quiz: InteractiveQuiz): Promise<InteractiveQuiz[]> {
  const current = loadLocalQuizzes();
  const existsIdx = current.findIndex((q) => q.id === quiz.id);
  const updated =
    existsIdx >= 0
      ? current.map((q) => (q.id === quiz.id ? quiz : q))
      : [quiz, ...current];
  saveLocalQuizzes(updated);

  try {
    const res = await fetch('/api/quizzes/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz }),
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.quizzes)) {
        saveLocalQuizzes(json.quizzes);
        return json.quizzes;
      }
    }
  } catch {
    // ignore offline
  }
  return updated;
}

export async function deleteQuizFromServer(quizId: string): Promise<InteractiveQuiz[]> {
  const current = loadLocalQuizzes().filter((q) => q.id !== quizId);
  saveLocalQuizzes(current);

  try {
    const res = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.quizzes)) {
        saveLocalQuizzes(json.quizzes);
        return json.quizzes;
      }
    }
  } catch {
    // ignore
  }
  return current;
}

// Terapkan hasil kuis siswa langsung ke Kalkulator Akademik (Local + Server)
export function applySubmissionToCalculatorMaster(sub: QuizAttemptSubmission): void {
  const cleanClass = sub.className.startsWith('Kelas ')
    ? sub.className
    : `Kelas ${sub.className}`;
  const attKey = String(sub.attendanceNo);

  const existingDataset = loadLocalCalculatorDataset(
    cleanClass,
    sub.subject,
    sub.assessment
  );
  const prevRecord = existingDataset.modeAData[attKey] || {
    benarPG: null,
    benarMJ: null,
    skorUraian: null,
    remedialScore: null,
    isManual: true,
  };

  let updatedRecord = { ...prevRecord, isManual: true };

  if (sub.isRemedial) {
    // Jika kuis remedial, isi nilai remedialScore (dan jika nilai utama masih kosong, isi juga rinciannya)
    updatedRecord = {
      benarPG: prevRecord.benarPG ?? sub.calcBenarPG,
      benarMJ: prevRecord.benarMJ ?? sub.calcBenarMJ,
      skorUraian: prevRecord.skorUraian ?? sub.calcSkorUraian,
      remedialScore: Math.max(prevRecord.remedialScore ?? 0, sub.finalScore),
      isManual: true,
    };
  } else {
    updatedRecord = {
      benarPG: sub.calcBenarPG,
      benarMJ: sub.calcBenarMJ,
      skorUraian: sub.calcSkorUraian,
      remedialScore: prevRecord.remedialScore,
      isManual: true,
    };
  }

  saveCalculatorDatasetEverywhere(cleanClass, sub.subject, sub.assessment, {
    modeAData: {
      ...existingDataset.modeAData,
      [attKey]: updatedRecord,
    },
    modeBData: existingDataset.modeBData || {},
    standarData: {
      ...(existingDataset.standarData || {}),
      [attKey]: sub.isRemedial
        ? Math.max(existingDataset.standarData?.[attKey] ?? 0, sub.finalScore)
        : sub.finalScore,
    },
  });
}

export async function submitQuizAttemptToServer(
  submission: QuizAttemptSubmission
): Promise<{ success: boolean; submissions: QuizAttemptSubmission[] }> {
  // 1. Update local submissions
  const current = loadLocalQuizSubmissions();
  const filtered = current.filter(
    (s) =>
      !(
        s.quizId === submission.quizId &&
        s.className === submission.className &&
        Number(s.attendanceNo) === Number(submission.attendanceNo)
      )
  );
  const updated = [submission, ...filtered];
  saveLocalQuizSubmissions(updated);

  // 2. Langsung masukkan ke Kalkulator Akademik (Local + Server /api/calculator-master)
  applySubmissionToCalculatorMaster(submission);

  // 3. Simpan ke /api/quizzes/submit di server
  try {
    const res = await fetch('/api/quizzes/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission }),
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.submissions)) {
        saveLocalQuizSubmissions(json.submissions);
        return { success: true, submissions: json.submissions };
      }
    }
  } catch {
    // ignore offline
  }

  return { success: true, submissions: updated };
}

export async function resetStudentQuizAttemptOnServer(
  quizId: string,
  className: string,
  attendanceNo: number
): Promise<QuizAttemptSubmission[]> {
  const current = loadLocalQuizSubmissions().filter(
    (s) =>
      !(
        s.quizId === quizId &&
        s.className === className &&
        Number(s.attendanceNo) === Number(attendanceNo)
      )
  );
  saveLocalQuizSubmissions(current);

  try {
    const res = await fetch('/api/quizzes/reset-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, className, attendanceNo }),
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.submissions)) {
        saveLocalQuizSubmissions(json.submissions);
        return json.submissions;
      }
    }
  } catch {
    // ignore
  }
  return current;
}
