import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Link,
  BookOpen,
  User,
  Users,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
  Globe,
  Youtube,
  FileText,
  Palette,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, TaskSubmission, TaskStatus, TaskType, GroupMember } from '../types';
import { resolveStudentByAttendance, normalizeClass } from '../utils/studentResolver';

interface TaskSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSubmitTask: (task: Omit<TaskSubmission, 'id'>) => Promise<void>;
  isSyncing: boolean;
  isConnectedToSheet: boolean;
  onLogin?: () => Promise<void>;
}

const COMMON_TASKS_SUGGESTIONS = [
  'Tugas',
  'Proyek Akhir Web Pre-Order Cantin',
  'Tugas 1: Perancangan ERD & Skema SQL',
  'Tugas 2: Implementasi REST API Express',
  'Tugas 3: Integrasi Frontend React Tailwind',
];

const DEFAULT_CLASSES = [
  'Kelas 8D',
  'Kelas 8A',
  'Kelas 8B',
  'Kelas 8C',
  'Kelas 8E',
  'Kelas 8F',
  'Kelas 7A',
  'Kelas 7B',
  'Kelas 9A',
  'Kelas 9B',
];

const DEFAULT_GROUPS = [
  'Kelompok 5',
  'Kelompok 1',
  'Kelompok 2',
  'Kelompok 3',
  'Kelompok 4',
  'Kelompok 6',
  'Kelompok 7',
  'Kelompok 8',
];

export const TaskSubmissionModal: React.FC<TaskSubmissionModalProps> = ({
  isOpen,
  onClose,
  students,
  onSubmitTask,
  isSyncing,
  isConnectedToSheet,
  onLogin,
}) => {
  const [taskType, setTaskType] = useState<TaskType>('kelompok');
  const [className, setClassName] = useState<string>('Kelas 8D');
  const [group, setGroup] = useState<string>('Kelompok 5');
  const [taskTitle, setTaskTitle] = useState<string>('Tugas');

  // Attendance Numbers (comma-separated e.g. "3, 13, 23, 27")
  const [attendanceInput, setAttendanceInput] = useState<string>('3, 13, 23, 27');

  // Detailed Link Fields (matching user prompt example)
  const [linkYt, setLinkYt] = useState<string>('-');
  const [linkWeb, setLinkWeb] = useState<string>('https://leafy-marigold-5cbbd3.netlify.app/');
  const [linkCanva, setLinkCanva] = useState<string>('-');
  const [linkPdf, setLinkPdf] = useState<string>(
    'https://drive.google.com/file/d/1nDr-84sHN8wJlp2LL8dH3-I7OVRhYFDP/view?usp=sharing'
  );

  // Status
  const [status, setStatus] = useState<TaskStatus>('Dalam Peninjauan');

  // Fields Khusus Individu
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [studentNis, setStudentNis] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Computed resolved members from attendance input + spreadsheet
  const attendanceList = attendanceInput
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));

  const resolvedMembers = attendanceList.map((num) =>
    resolveStudentByAttendance(num, className, students)
  );

  if (!isOpen) return null;

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    if (studentId === 'custom' || !studentId) {
      setStudentName('');
      setStudentNis('');
      return;
    }
    const found = students.find((s) => s.id === studentId);
    if (found) {
      setStudentName(found.name);
      setStudentNis(found.nis || '');
      setGroup(found.group || 'Kelompok 1');
      setClassName(found.className || 'Kelas 8D');
      if (found.attendanceNo) {
        setAttendanceInput(found.attendanceNo);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!taskTitle.trim()) {
      setErrorMsg('Judul tugas wajib diisi');
      return;
    }

    // Assemble description formatted text according to system specification
    const formattedDesc = [
      `Absen : ${attendanceInput.trim() || '-'}`,
      `Link yt : ${linkYt.trim() || '-'}`,
      `Link web : ${linkWeb.trim() || '-'}`,
      `Link canva : ${linkCanva.trim() || '-'}`,
      `Pdf : ${linkPdf.trim() || '-'}`,
    ].join('\n');

    let finalStudentName = '';
    let finalNis = studentNis.trim();
    let finalAttendance = attendanceInput.trim();

    if (taskType === 'individu') {
      if (!studentName.trim()) {
        setErrorMsg('Nama siswa wajib dipilih atau diisi');
        return;
      }
      finalStudentName = studentName.trim();
    } else {
      if (resolvedMembers.length === 0) {
        setErrorMsg('Masukkan minimal 1 nomor absen atau nama anggota');
        return;
      }
      finalStudentName = resolvedMembers
        .map((m) => `${m.name} (No.${m.attendanceNo})`)
        .join(', ');
      finalAttendance = resolvedMembers.map((m) => m.attendanceNo).join(', ');
    }

    try {
      setIsSubmitting(true);

      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      await onSubmitTask({
        studentName: finalStudentName,
        taskTitle: taskTitle.trim(),
        group: group || 'Kelompok 5',
        descriptionOrLink: formattedDesc,
        status,
        submittedAt: formattedDate,
        className: className.trim() || 'Kelas 8D',
        studentNis: finalNis || '8400',
        attendanceNo: finalAttendance,
        taskType,
        score: null,
        feedback: '',
        members:
          taskType === 'kelompok'
            ? resolvedMembers.map((m) => ({ name: m.name, attendanceNo: m.attendanceNo }))
            : undefined,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim tugas');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-task-submit-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FBF9F5] border-2 sm:border-[2.5px] border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] my-auto overflow-hidden animate-in zoom-in-95 duration-200 font-mono-code text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b-2 border-[#1a1a1a] bg-[#F2EFEB]">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-[#2e59e6] uppercase block">
              [ FORMULIR SUBMISI SPREADSHEET ]
            </span>
            <h2 className="font-serif italic font-normal text-2xl sm:text-3xl text-[#1a1a1a] leading-none mt-0.5">
              Input Tugas / Karya Baru
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold hover:text-[#2e59e6] px-2 py-1 border border-transparent hover:border-[#1a1a1a] transition-all cursor-pointer"
          >
            [ ✕ ]
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Google Sheets Sync Status Card */}
          {isConnectedToSheet ? (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Google Spreadsheet Terkoneksi: Karya akan langsung di-append ke tab &apos;Tugas_Siswa&apos;.</span>
              </div>
              <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.5 text-[10px] uppercase font-bold border border-emerald-400">
                LIVE SYNC ON
              </span>
            </div>
          ) : (
            <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-mono-code flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <span className="font-bold">Otorisasi Google Belum Terhubung:</span>
                  <p className="text-[10px] text-amber-750 font-normal">
                    Untuk langsung memasukkan baris baru ke file Google Spreadsheet Anda, hubungkan akun Google.
                  </p>
                </div>
              </div>
              {onLogin && (
                <button
                  type="button"
                  onClick={async () => {
                    await onLogin();
                  }}
                  className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#2e59e6] text-white text-[10px] font-bold shrink-0 border border-[#1a1a1a] transition-all cursor-pointer"
                >
                  🔑 HUBUNGKAN GOOGLE
                </button>
              )}
            </div>
          )}

          {/* Toggle Type: Individu vs Kelompok */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-700 block mb-1.5">
              TIPE PENGERJAAN
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTaskType('individu')}
                className={`py-2 px-3 border-2 transition-all text-center font-bold cursor-pointer ${
                  taskType === 'individu'
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#000]'
                    : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-slate-100'
                }`}
              >
                TUGAS INDIVIDU
              </button>
              <button
                type="button"
                onClick={() => setTaskType('kelompok')}
                className={`py-2 px-3 border-2 transition-all text-center font-bold cursor-pointer ${
                  taskType === 'kelompok'
                    ? 'bg-[#2e59e6] text-white border-[#2e59e6] shadow-[2px_2px_0px_#000]'
                    : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-slate-100'
                }`}
              >
                TUGAS KELOMPOK
              </button>
            </div>
          </div>

          {/* Grid: Kelas & Kelompok */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-800 block mb-1">
                KELAS *
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-[#F2EFEB] border border-[#1a1a1a] px-3 py-1.5 text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-hidden"
              >
                {DEFAULT_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-800 block mb-1">
                {taskType === 'kelompok' ? 'NAMA KELOMPOK *' : 'UNIT KELOMPOK'}
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full bg-[#F2EFEB] border border-[#1a1a1a] px-3 py-1.5 text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-hidden"
              >
                {DEFAULT_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Individual Mode Student Selector */}
          {taskType === 'individu' && (
            <div className="space-y-3 p-3.5 bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-700 block mb-1">
                  PILIH SISWA DARI DATABASE SPREADSHEET
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full bg-[#F2EFEB] border border-[#1a1a1a] px-3 py-1.5 text-xs text-[#1a1a1a] focus:bg-white focus:outline-hidden"
                >
                  <option value="">-- Pilih dari Database Siswa ({className}) --</option>
                  {students
                    .filter((s) => normalizeClass(s.className) === normalizeClass(className))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.attendanceNo ? `Absen ${s.attendanceNo} - ` : ''}
                        {s.name} ({s.nis || 'Tanpa NIS'})
                      </option>
                    ))}
                  <option value="custom">-- Input Manual --</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-700 block mb-1">
                    NAMA SISWA *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap siswa"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-[#F2EFEB] border border-[#1a1a1a] px-3 py-1.5 text-xs text-[#1a1a1a] focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-700 block mb-1">
                    NIS / NO INDUK
                  </label>
                  <input
                    type="text"
                    placeholder="8401"
                    value={studentNis}
                    onChange={(e) => setStudentNis(e.target.value)}
                    className="w-full bg-[#F2EFEB] border border-[#1a1a1a] px-3 py-1.5 text-xs text-[#1a1a1a] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Group Absen & Student Name Integrations */}
          <div className="p-3.5 bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase text-slate-800 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#2e59e6]" />
                NOMOR ABSEN SISWA *
              </label>
              <span className="text-[10px] text-slate-500">
                Pisahkan dengan koma (contoh: <strong>3, 13, 23, 27</strong>)
              </span>
            </div>

            <input
              type="text"
              required
              placeholder="Contoh: 3, 13, 23, 27"
              value={attendanceInput}
              onChange={(e) => setAttendanceInput(e.target.value)}
              className="w-full bg-[#F2EFEB] border border-[#1a1a1a] px-3 py-2 text-xs font-bold font-mono-code text-[#1a1a1a] focus:bg-white focus:outline-hidden tracking-wider"
            />

            {/* Dynamic Student Name Resolution Preview from Spreadsheet */}
            <div className="pt-1">
              <div className="text-[10px] font-bold uppercase text-slate-600 mb-1.5">
                Nama Siswa Terdeteksi ({className}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {resolvedMembers.length > 0 ? (
                  resolvedMembers.map((m, idx) => (
                    <span
                      key={`resolved-${m.attendanceNo || ''}-${m.nis || ''}-${idx}`}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono-code bg-[#F2EFEB] text-slate-900 border border-[#1a1a1a] px-2 py-0.5 shadow-[1.5px_1.5px_0px_#1a1a1a]"
                    >
                      <span className="font-bold text-[#2e59e6]">#{m.attendanceNo}</span>
                      <span className="font-sans font-medium">{m.name}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-[11px] italic">
                    Ketik nomor absen untuk mendeteksi nama siswa otomatis...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Task Title */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-700 block mb-1">
              JUDUL TUGAS / KARYA *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Tugas / Proyek Akhir Web"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-[#F2EFEB] border-2 border-[#1a1a1a] px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-hidden"
            />
            {/* Quick Title Chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {COMMON_TASKS_SUGGESTIONS.map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => setTaskTitle(sugg)}
                  className="text-[9px] bg-white hover:bg-slate-200 border border-slate-300 px-2 py-0.5 cursor-pointer font-sans"
                >
                  + {sugg}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Link Fields Section (YouTube, Web, Canva, PDF) */}
          <div className="p-3.5 bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] space-y-3">
            <div className="text-[10px] font-bold uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Link className="h-3.5 w-3.5 text-[#2e59e6]" />
              RINCIAN TAUTAN PROYEK & DOKUMEN
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Link YouTube */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-700 block mb-1 flex items-center gap-1">
                  <Youtube className="h-3 w-3 text-red-600" />
                  LINK YT :
                </label>
                <input
                  type="text"
                  placeholder="-"
                  value={linkYt}
                  onChange={(e) => setLinkYt(e.target.value)}
                  className="w-full bg-[#F2EFEB] border border-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#1a1a1a] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Link Web */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-700 block mb-1 flex items-center gap-1">
                  <Globe className="h-3 w-3 text-emerald-600" />
                  LINK WEB :
                </label>
                <input
                  type="text"
                  placeholder="https://leafy-marigold-5cbbd3.netlify.app/"
                  value={linkWeb}
                  onChange={(e) => setLinkWeb(e.target.value)}
                  className="w-full bg-[#F2EFEB] border border-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#1a1a1a] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Link Canva */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-700 block mb-1 flex items-center gap-1">
                  <Palette className="h-3 w-3 text-cyan-600" />
                  LINK CANVA :
                </label>
                <input
                  type="text"
                  placeholder="-"
                  value={linkCanva}
                  onChange={(e) => setLinkCanva(e.target.value)}
                  className="w-full bg-[#F2EFEB] border border-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#1a1a1a] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Link PDF Google Drive */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-700 block mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-amber-600" />
                  PDF (GOOGLE DRIVE) :
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/d/.../view"
                  value={linkPdf}
                  onChange={(e) => setLinkPdf(e.target.value)}
                  className="w-full bg-[#F2EFEB] border border-[#1a1a1a] px-2.5 py-1.5 text-xs text-[#1a1a1a] focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-3 border-t-2 border-[#1a1a1a] flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 border-2 border-[#1a1a1a] bg-[#F2EFEB] hover:bg-[#E5E0D8] font-bold transition-colors cursor-pointer text-center"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-2.5 bg-[#1a1a1a] hover:bg-[#2e59e6] text-white font-bold transition-all border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>MENYIMPAN KE SPREADSHEET...</span>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>✓ KIRIM KE SPREADSHEET</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
