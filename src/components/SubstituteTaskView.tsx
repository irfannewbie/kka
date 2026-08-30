import React, { useState, useEffect, useMemo } from "react";
import {
  Gamepad2,
  BookOpen,
  FileSpreadsheet,
  Youtube,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Maximize2,
  Minimize2,
  Check,
  Clock,
  Calendar,
  User,
  Hash,
  School,
  Sparkles,
  Play,
  Share2,
  Video,
  ListOrdered,
  HelpCircle,
  RefreshCw,
  Eye,
  Info,
} from "lucide-react";
import { Student, SubstituteTaskSubmission } from "../types";
import {
  syncSubstituteTaskToSheet,
  loadSubstituteTaskSubmissions,
  SUBSTITUTE_TASK_SHEET_NAME,
} from "../services/sheetsService";
import { AutoSyncConfigModal } from "./AutoSyncConfigModal";

interface SubstituteTaskViewProps {
  students: Student[];
  spreadsheetId: string;
  spreadsheetUrl: string;
  token: string | null;
  onLogin?: () => void;
  onNavigateShowcase?: () => void;
  onNavigateCek?: () => void;
  onNotifySubmission?: (
    studentName: string,
    className: string,
    attendanceNo: string,
  ) => void;
}

const CLASS_OPTIONS = [
  "Kelas 8A",
  "Kelas 8B",
  "Kelas 8C",
  "Kelas 8D",
  "Kelas 8E",
  "Kelas 8F",
  "Kelas 8G",
  "Kelas 8H",
];

const LOCAL_STORAGE_SUBSTITUTE_KEY = "tugas_siswa_substitute_submissions_v1";
const GOOGLE_FORM_URL_STORAGE_KEY = "tugas_siswa_google_form_url";
const DEFAULT_GOOGLE_FORM_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_GOOGLE_FORM_URL) ||
  "https://forms.gle/9NnFRP63ycBU1mMJ8";

// Helper to extract YouTube Video ID
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // Format youtu.be/<id>
  const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Format youtube.com/watch?v=<id>
  const watchMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Format youtube.com/shorts/<id>
  const shortsMatch = cleanUrl.match(
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  );
  if (shortsMatch) return shortsMatch[1];

  // Format youtube.com/embed/<id>
  const embedMatch = cleanUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // Direct 11 char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  return null;
}

export const SubstituteTaskView: React.FC<SubstituteTaskViewProps> = ({
  students,
  spreadsheetId,
  spreadsheetUrl,
  token,
  onLogin,
  onNavigateShowcase,
  onNavigateCek,
  onNotifySubmission,
}) => {
  // Form State
  const [selectedClass, setSelectedClass] = useState<string>("Kelas 8A");
  const [selectedAttendanceNo, setSelectedAttendanceNo] = useState<string>("1");
  const [studentName, setStudentName] = useState<string>("");
  const [nis, setNis] = useState<string>("");
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // UI / Status State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);
  const [isGameFullscreen, setIsGameFullscreen] = useState<boolean>(false);
  const [gameKey, setGameKey] = useState<number>(Date.now());
  const [submissionsList, setSubmissionsList] = useState<
    SubstituteTaskSubmission[]
  >([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] =
    useState<boolean>(false);
  const [isAutoSyncModalOpen, setIsAutoSyncModalOpen] =
    useState<boolean>(false);
  const [googleFormUrl, setGoogleFormUrl] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_GOOGLE_FORM_URL;
    const saved = localStorage.getItem(GOOGLE_FORM_URL_STORAGE_KEY);
    return saved || DEFAULT_GOOGLE_FORM_URL;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        GOOGLE_FORM_URL_STORAGE_KEY,
        DEFAULT_GOOGLE_FORM_URL,
      );
    }
  }, []);

  // Check if Webhook / Apps Script is configured
  const [hasAppsScriptUrl, setHasAppsScriptUrl] = useState<boolean>(() => {
    return Boolean(
      (typeof window !== "undefined" &&
        localStorage.getItem("tugas_siswa_apps_script_url")) ||
      (typeof import.meta !== "undefined" &&
        (import.meta as any).env?.VITE_APPS_SCRIPT_URL),
    );
  });

  // Filter students by selected class
  const classStudents = useMemo(() => {
    const rawClass = selectedClass
      .replace(/^Kelas\s*/i, "")
      .trim()
      .toUpperCase();
    return students
      .filter((s) => {
        const sc = (s.className || "")
          .replace(/^Kelas\s*/i, "")
          .trim()
          .toUpperCase();
        return sc === rawClass || s.className?.toUpperCase().includes(rawClass);
      })
      .sort((a, b) => {
        const na = parseInt(a.attendanceNo || "0", 10);
        const nb = parseInt(b.attendanceNo || "0", 10);
        return na - nb;
      });
  }, [students, selectedClass]);

  // Auto-fill student name & NIS when class or attendance number changes
  useEffect(() => {
    if (classStudents.length > 0) {
      const match = classStudents.find(
        (s) => s.attendanceNo === selectedAttendanceNo,
      );
      if (match) {
        setStudentName(match.name);
        setNis(match.nis || "");
      } else {
        const first = classStudents[0];
        if (first) {
          setSelectedAttendanceNo(first.attendanceNo || "1");
          setStudentName(first.name);
          setNis(first.nis || "");
        }
      }
    }
  }, [selectedClass, selectedAttendanceNo, classStudents]);

  // Load existing submissions from LocalStorage + Spreadsheet
  const loadSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      // 1. Read local storage
      let localSubmissions: SubstituteTaskSubmission[] = [];
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_SUBSTITUTE_KEY);
        if (raw) localSubmissions = JSON.parse(raw);
      } catch (e) {
        // ignore
      }

      // 2. Fetch from Google Spreadsheet
      const sheetSubmissions = await loadSubstituteTaskSubmissions(
        spreadsheetId,
        token,
      );

      // Merge (sheet has higher truth, fallback to local)
      const mergedMap = new Map<string, SubstituteTaskSubmission>();
      localSubmissions.forEach((s) =>
        mergedMap.set(`${s.className}-${s.attendanceNo}-${s.studentName}`, s),
      );
      sheetSubmissions.forEach((s) =>
        mergedMap.set(`${s.className}-${s.attendanceNo}-${s.studentName}`, s),
      );

      const merged = Array.from(mergedMap.values());
      setSubmissionsList(merged);
    } catch (err) {
      console.warn("Failed to load substitute submissions:", err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [spreadsheetId, token]);

  // YouTube ID & Validation
  const videoId = useMemo(
    () => extractYouTubeVideoId(youtubeUrl),
    [youtubeUrl],
  );

  // Handle Form Submission
  const handleOpenGoogleForm = () => {
    if (!googleFormUrl) {
      setSubmitErrorMsg(
        "URL Google Form belum diatur. Silakan isi URL Formulir di konfigurasi sistem.",
      );
      return;
    }

    window.open(googleFormUrl, "_blank", "noopener,noreferrer");
    setSubmitSuccessMsg(
      "Anda akan dialihkan ke Google Form pengumpulan tugas. Isi formulir dengan data yang sama seperti form di halaman ini.",
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccessMsg(null);
    setSubmitErrorMsg(null);

    if (googleFormUrl) {
      handleOpenGoogleForm();
      return;
    }

    const cleanName = studentName.trim();
    const cleanUrl = youtubeUrl.trim();

    if (!cleanName) {
      setSubmitErrorMsg("Silakan isi Nama Siswa dengan lengkap.");
      return;
    }

    if (!cleanUrl) {
      setSubmitErrorMsg("Silakan masukkan Link Video YouTube presentasi Anda.");
      return;
    }

    if (!videoId) {
      setSubmitErrorMsg(
        "Format link YouTube tidak valid. Contoh yang benar: https://youtu.be/xxxx atau https://www.youtube.com/watch?v=xxxx",
      );
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, "0")}/${String(
      now.getMonth() + 1,
    ).padStart(
      2,
      "0",
    )}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const newSubmission: SubstituteTaskSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      submittedAt: formattedDate,
      studentName: cleanName,
      attendanceNo: selectedAttendanceNo,
      className: selectedClass,
      nis: nis.trim() || "-",
      youtubeUrl: cleanUrl,
      notes:
        notes.trim() ||
        "Tugas Pengganti KKA 2 - Algoritma & Flowchart Game Teka-Teki",
      status: "Terkirim",
    };

    // Save to LocalStorage immediately
    try {
      const existing = [...submissionsList];
      const filtered = existing.filter(
        (s) =>
          !(
            s.className === newSubmission.className &&
            s.attendanceNo === newSubmission.attendanceNo
          ),
      );
      const updated = [newSubmission, ...filtered];
      setSubmissionsList(updated);
      localStorage.setItem(
        LOCAL_STORAGE_SUBSTITUTE_KEY,
        JSON.stringify(updated),
      );
    } catch (err) {
      console.warn("LocalStorage save error:", err);
    }

    // Attempt sync to Google Spreadsheet (via Apps Script Webhook or direct Sheets API)
    try {
      const syncRes = await syncSubstituteTaskToSheet(
        token,
        spreadsheetId,
        newSubmission,
      );
      if (syncRes.success) {
        setSubmitSuccessMsg(
          `Selamat ${cleanName} (${selectedClass} - Absen ${selectedAttendanceNo})! Tugas Pengganti Anda telah berhasil dikirim dan tersimpan di Google Spreadsheet.`,
        );
      } else if (token) {
        setSubmitSuccessMsg(
          `Tugas Pengganti ${cleanName} berhasil tersimpan di sistem lokal! (${syncRes.message})`,
        );
      } else {
        setSubmitSuccessMsg(
          `Tugas Pengganti ${cleanName} (${selectedClass} - Absen ${selectedAttendanceNo}) berhasil dicatat di sistem lokal!`,
        );
      }

      // Notify parent
      if (onNotifySubmission) {
        onNotifySubmission(cleanName, selectedClass, selectedAttendanceNo);
      }

      // Clear YouTube URL after successful submission
      setYoutubeUrl("");
      setNotes("");
    } catch (err: any) {
      console.error("Error submitting substitute task:", err);
      setSubmitErrorMsg(
        `Gagal mengirim ke spreadsheet: ${err.message || String(err)}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submissions for currently selected class
  const classSubmissions = useMemo(() => {
    const rawClass = selectedClass
      .replace(/^Kelas\s*/i, "")
      .trim()
      .toUpperCase();
    return submissionsList.filter((s) => {
      const sc = (s.className || "")
        .replace(/^Kelas\s*/i, "")
        .trim()
        .toUpperCase();
      return sc === rawClass || s.className?.toUpperCase().includes(rawClass);
    });
  }, [submissionsList, selectedClass]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* 1. EDITORIAL HEADER & TITLE */}
      <header className="bg-white border-2 border-[#1a1a1a] p-6 sm:p-8 shadow-[5px_5px_0px_#1a1a1a] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#1a1a1a] pb-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] text-white font-mono-code text-xs font-bold tracking-widest uppercase mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>[ TUGAS PENGGANTI KKA 2 ]</span>
            </div>
            <h1 className="font-serif-display italic font-bold text-3xl sm:text-5xl text-[#1a1a1a] tracking-tight leading-tight">
              Tugas Pengganti KKA 2
            </h1>
            <p className="font-mono-code text-xs sm:text-sm font-bold text-[#2e59e6] mt-2">
              ANALISIS ALGORITMA, INPUT-PROSES-OUTPUT & FLOWCHART GAME TEKA-TEKI
            </p>
          </div>

          {/* DEADLINE BADGE */}
          <div className="shrink-0 bg-amber-50 border-2 border-[#1a1a1a] p-3.5 sm:p-4 shadow-[3px_3px_0px_#1a1a1a] font-mono-code">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-1">
              <Clock className="h-4 w-4 text-rose-600 animate-pulse" />
              <span>BATAS WAKTU PENGUMPULAN:</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-[#1a1a1a] flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#2e59e6]" />
              <span>Selasa, 1 September 2026</span>
            </div>
            <div className="text-xs font-bold text-rose-700 mt-0.5">
              Pukul 23.59 WIB
            </div>
          </div>
        </div>

        {/* 2. PETUNJUK & PERINTAH PENGERJAAN TUGAS (1 - 5) */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ListOrdered className="h-5 w-5 text-[#2e59e6]" />
            <h2 className="font-mono-code text-sm font-bold uppercase tracking-wider text-[#1a1a1a]">
              INSTRUKSI & LANGKAH-LANGKAH PENGERJAAN TUGAS:
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 font-sans">
            {/* Step 1 */}
            <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-code text-xs font-bold px-2 py-0.5 bg-[#1a1a1a] text-white">
                    LANGKAH 01
                  </span>
                  <Gamepad2 className="h-5 w-5 text-[#2e59e6]" />
                </div>
                <h3 className="font-bold text-sm text-[#1a1a1a] mb-1">
                  Mainkan Permainan Teka-Teki
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Mainkan permainan pada arena game di bawah ini secara seksama
                  dan amati alur dari setiap langkah permainannya dari awal
                  hingga selesai.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-code text-xs font-bold px-2 py-0.5 bg-[#1a1a1a] text-white">
                    LANGKAH 02
                  </span>
                  <BookOpen className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-bold text-sm text-[#1a1a1a] mb-1">
                  Tentukan Input, Proses & Output
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Tentukan apa saja <strong>Input</strong> (masukan pemain),{" "}
                  <strong>Proses</strong> (logika & aturan game), dan{" "}
                  <strong>Output</strong> (hasil/status permainan) di buku tulis
                  kalian.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-code text-xs font-bold px-2 py-0.5 bg-[#1a1a1a] text-white">
                    LANGKAH 03
                  </span>
                  <Share2 className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-sm text-[#1a1a1a] mb-1">
                  Gambarkan Flowchart (Diagram Alir)
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Gambarkan <strong>Flowchart</strong> (diagram simbol alur
                  program) pada buku tulis kalian menggunakan simbol baku
                  diagram alir dengan rapi.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between md:col-span-2 lg:col-span-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-code text-xs font-bold px-2 py-0.5 bg-rose-600 text-white">
                    LANGKAH 04
                  </span>
                  <Video className="h-5 w-5 text-rose-600" />
                </div>
                <h3 className="font-bold text-sm text-[#1a1a1a] mb-1">
                  Buat Video Presentasi & Upload ke YouTube
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Buatlah <strong>video presentasi</strong> penjelasan algoritma
                  dari permainan di bawah ini. Jelaskan dengan menampilkan
                  tulisan <strong>input-proses-output</strong> dan{" "}
                  <strong>flowchart</strong> yang ada di buku kalian, setelah
                  itu{" "}
                  <strong>upload videonya di akun YouTube masing-masing</strong>{" "}
                  (bisa disetel Publik atau Tidak Publik / Unlisted).
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] flex flex-col justify-between md:col-span-2 lg:col-span-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-code text-xs font-bold px-2 py-0.5 bg-[#2e59e6] text-white">
                    LANGKAH 05
                  </span>
                  <Send className="h-5 w-5 text-[#2e59e6]" />
                </div>
                <h3 className="font-bold text-sm text-[#1a1a1a] mb-1">
                  Kirimkan Link Video YouTube
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Salin tautan video YouTube kalian, lalu isikan data{" "}
                  <strong>Nama, No. Absen, Kelas</strong>, dan{" "}
                  <strong>Link YouTube</strong> pada formulir di bawah. Data
                  otomatis tersimpan ke Google Spreadsheet!
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. GAME IFRAME SECTION (https://tekatekigame.netlify.app/) */}
      <section className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] overflow-hidden">
        {/* Game Title Bar & Action Controls */}
        <div className="bg-[#1a1a1a] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-amber-400" />
            <span className="font-mono-code text-xs sm:text-sm font-bold tracking-wider uppercase">
              ARENA PERMAINAN TEKA-TEKI (IFRAME)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Reload Game Frame */}
            <button
              onClick={() => setGameKey(Date.now())}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white font-mono-code text-xs border border-white/30 transition-colors cursor-pointer"
              title="Muat Ulang Permainan"
            >
              <RotateCcw className="h-3 w-3" />
              <span>RESTART GAME</span>
            </button>

            {/* Toggle Fullscreen / Expand */}
            <button
              onClick={() => setIsGameFullscreen(!isGameFullscreen)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white font-mono-code text-xs border border-white/30 transition-colors cursor-pointer"
              title={isGameFullscreen ? "Kecilkan Frame" : "Perbesar Frame"}
            >
              {isGameFullscreen ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
              <span>{isGameFullscreen ? "KECILKAN" : "PERBESAR"}</span>
            </button>

            {/* Open in new tab */}
            <a
              href="https://tekatekigame.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400 text-[#1a1a1a] font-mono-code text-xs font-bold hover:bg-amber-300 transition-colors cursor-pointer"
              title="Buka Permainan di Tab Baru"
            >
              <ExternalLink className="h-3 w-3" />
              <span>TAB BARU</span>
            </a>
          </div>
        </div>

        {/* Embedded Iframe */}
        <div
          className={`relative w-full bg-slate-900 transition-all duration-300 ${
            isGameFullscreen ? "h-[750px]" : "h-[520px] sm:h-[600px]"
          }`}
        >
          <iframe
            key={gameKey}
            id="tekateki-game-iframe"
            title="Permainan Teka-Teki KKA 2"
            src="https://tekatekigame.netlify.app/"
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>

        {/* Game Instruction Footer */}
        <div className="bg-[#FAF8F5] p-3 border-t-2 border-[#1a1a1a] flex items-center justify-between text-xs font-mono-code text-slate-700">
          <span className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-[#2e59e6]" />
            Jika game tidak muncul atau terkendala koneksi, klik tombol{" "}
            <strong>TAB BARU</strong> di pojok kanan atas.
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            https://tekatekigame.netlify.app/
          </span>
        </div>
      </section>

      {/* 4. FORMULIR PENGUMPULAN TUGAS PENGGANTI */}
      <section className="bg-white border-2 border-[#1a1a1a] p-6 sm:p-8 shadow-[5px_5px_0px_#1a1a1a]">
        <div className="flex items-center justify-between border-b-2 border-[#1a1a1a] pb-4 mb-6 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600 text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
              <Youtube className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif-display italic font-bold text-2xl text-[#1a1a1a]">
                Formulir Pengumpulan Link YouTube
              </h2>
            </div>
          </div>
        </div>

        <div className="min-h-[200px] flex items-center justify-center">
          <button
            type="button"
            onClick={handleOpenGoogleForm}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1d4ed8] text-white border-2 border-[#1a1a1a] font-mono-code text-[11px] sm:text-xs font-bold shadow-[4px_4px_0px_#1a1a1a] transition-all cursor-pointer hover:bg-[#1e3a8a]"
          >
            <ExternalLink className="h-5 w-5" />
            <span>BUKA GOOGLE FORM</span>
          </button>
        </div>
      </section>

      {/* Auto-Sync Configuration Modal for Teacher */}
      <AutoSyncConfigModal
        isOpen={isAutoSyncModalOpen}
        onClose={() => {
          setIsAutoSyncModalOpen(false);
          setHasAppsScriptUrl(
            Boolean(
              (typeof window !== "undefined" &&
                localStorage.getItem("tugas_siswa_apps_script_url")) ||
              (typeof import.meta !== "undefined" &&
                (import.meta as any).env?.VITE_APPS_SCRIPT_URL),
            ),
          );
        }}
        spreadsheetId={spreadsheetId}
        spreadsheetUrl={spreadsheetUrl}
        token={token}
        onSuccessSync={() => {
          loadSubmissions();
        }}
      />
    </div>
  );
};
