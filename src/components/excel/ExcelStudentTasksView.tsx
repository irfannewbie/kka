import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Award,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ExcelTask, ExcelSubmission } from '../../types/excelLab';
import { Student } from '../../types';

interface ExcelStudentTasksViewProps {
  tasks: ExcelTask[];
  submissions: ExcelSubmission[];
  currentStudent: Student | null;
  onSelectTaskToWork: (task: ExcelTask) => void;
  onViewSubmissionSnapshot: (submission: ExcelSubmission) => void;
}

export const ExcelStudentTasksView: React.FC<ExcelStudentTasksViewProps> = ({
  tasks,
  submissions,
  currentStudent,
  onSelectTaskToWork,
  onViewSubmissionSnapshot,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] p-5 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono-code text-xs text-[#107c41] font-bold uppercase mb-1">
              <FileSpreadsheet className="h-4 w-4" />
              <span>DAFTAR TUGAS LABORATORIUM EXCEL TERSTRUKTUR</span>
            </div>
            <h1 className="font-serif-display italic font-bold text-3xl sm:text-4xl text-[#1a1a1a]">
              Tugas & Proyek Spreadsheet
            </h1>
            <p className="font-sans text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Selesaikan tantangan kasus spreadsheet di bawah ini. Tuliskan rumus yang tepat untuk menghitung total, rata-rata, logika kelulusan, dan pencarian data tabel.
            </p>
          </div>

          {currentStudent && (
            <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3 font-mono-code text-xs shrink-0 shadow-[2px_2px_0px_#1a1a1a]">
              <span className="text-[10px] text-slate-500 uppercase block">Peserta Praktikum:</span>
              <strong className="text-[#107c41] font-bold text-sm block">{currentStudent.name}</strong>
              <span className="text-slate-600">
                {currentStudent.className} · Absen {currentStudent.attendanceNo}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tasks.map((task) => {
          // Find student's submission for this task
          const submission = currentStudent
            ? submissions.find(
                (s) =>
                  s.taskId === task.id &&
                  s.className === currentStudent.className &&
                  Number(s.attendanceNo) === Number(currentStudent.attendanceNo)
              )
            : null;

          const isSubmitted = !!submission;
          const isPassed = isSubmitted && submission.finalScore >= (task.kktp || 75);

          return (
            <div
              key={task.id}
              className={`bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 flex flex-col justify-between space-y-4 font-mono-code transition-all ${
                isPassed ? 'border-l-8 border-l-emerald-600' : isSubmitted ? 'border-l-8 border-l-amber-500' : ''
              }`}
            >
              <div>
                {/* Top Badges */}
                <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-200">
                  <span className="px-2 py-0.5 bg-slate-100 text-[#1a1a1a] text-[10px] font-bold uppercase border border-slate-300">
                    {task.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600">
                    KKTP: {task.kktp} Poin
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-base text-[#1a1a1a] font-sans mt-3">
                  {task.title}
                </h3>
                <p className="font-sans text-xs text-slate-600 mt-1 leading-relaxed">
                  {task.description}
                </p>

                {/* Target evaluations count */}
                <div className="mt-3 py-1.5 px-2 bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-center justify-between">
                  <span>Target Rumus Diuji:</span>
                  <strong className="text-[#107c41] font-bold">{task.targetEvaluations.length} Sel Target</strong>
                </div>

                {/* Submission Status Box */}
                {submission && (
                  <div
                    className={`mt-3 p-2.5 border text-xs font-sans ${
                      isPassed
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                        : 'bg-amber-50 border-amber-400 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono-code text-[11px] font-bold">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>SUDAH DIKUMPULKAN</span>
                      </span>
                      <span className="text-sm font-black">
                        NILAI: {submission.finalScore} / 100
                      </span>
                    </div>
                    <span className="text-[11px] block mt-0.5 text-slate-600">
                      Waktu kirim: {submission.submittedAt} (Percobaan ke-{submission.attemptNumber})
                    </span>
                    {submission.teacherFeedback && (
                      <p className="text-[11px] mt-1 text-slate-800 italic border-t border-slate-200 pt-1">
                        Ulasan Guru: "{submission.teacherFeedback}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={() => onSelectTaskToWork(task)}
                  className={`w-full py-2.5 px-3 text-xs font-black border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                    isSubmitted
                      ? 'bg-white hover:bg-slate-100 text-[#1a1a1a]'
                      : 'bg-[#107c41] hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isSubmitted ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Kerjakan Ulang / Perbaiki Rumus</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      <span>Buka Lembar Kerja & Kerjakan</span>
                    </>
                  )}
                </button>

                {submission && (
                  <button
                    type="button"
                    onClick={() => onViewSubmissionSnapshot(submission)}
                    className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border border-slate-300 cursor-pointer"
                  >
                    Lihat Snapshot Lembar Kerja Terkumpul
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
