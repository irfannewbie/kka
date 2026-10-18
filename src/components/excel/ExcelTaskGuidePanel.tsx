import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Send,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Award,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ExcelTask,
  ExcelWorkbookData,
  ExcelCellCheckResult,
} from '../../types/excelLab';
import { evaluateStudentWorkbook } from '../../services/excelLabStore';
import { playNotificationChime } from '../../services/sound';

interface ExcelTaskGuidePanelProps {
  task: ExcelTask;
  workbook: ExcelWorkbookData;
  onSubmit: (score: number, results: ExcelCellCheckResult[]) => Promise<void>;
  onFocusCell?: (cellRef: string) => void;
  isSubmitting?: boolean;
}

export const ExcelTaskGuidePanel: React.FC<ExcelTaskGuidePanelProps> = ({
  task,
  workbook,
  onSubmit,
  onFocusCell,
  isSubmitting = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [lastCheckResults, setLastCheckResults] = useState<ExcelCellCheckResult[] | null>(null);
  const [lastCheckScore, setLastCheckScore] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const handleRunCheck = () => {
    setIsChecking(true);
    setTimeout(() => {
      const { results, autoScore, isPassed } = evaluateStudentWorkbook(workbook, task);
      setLastCheckResults(results);
      setLastCheckScore(autoScore);
      setIsChecking(false);
      if (isPassed && autoScore >= 80) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      }
    }, 250);
  };

  const handleConfirmSubmit = async () => {
    const { results, autoScore } = evaluateStudentWorkbook(workbook, task);
    await onSubmit(autoScore, results);
    setShowConfirmModal(false);
    playNotificationChime();
    if (autoScore >= (task.kktp || 75)) {
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    }
  };

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-12 right-4 z-40 bg-[#107c41] text-white p-3 border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:scale-105 transition-all font-mono-code text-xs font-bold flex items-center gap-2 cursor-pointer"
        title="Buka Petunjuk & Cek Tugas"
      >
        <BookOpen className="h-4 w-4" />
        <span>PANDUAN TUGAS</span>
        <ChevronLeft className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="w-80 sm:w-96 bg-[#FAF8F5] border-l-2 border-[#1a1a1a] flex flex-col h-full font-mono-code text-xs shrink-0 select-none shadow-lg z-20">
      {/* Top Header */}
      <div className="bg-[#1a1a1a] text-white p-3 flex items-center justify-between border-b-2 border-[#1a1a1a]">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <span className="font-bold uppercase tracking-wider">PANDUAN & TARGET RUMUS</span>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="text-slate-400 hover:text-white p-1 cursor-pointer"
          title="Tutup Panel Panduan"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Task Summary Banner */}
      <div className="p-3.5 bg-emerald-50 border-b-2 border-[#1a1a1a]">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="px-2 py-0.5 bg-[#107c41] text-white text-[10px] font-bold uppercase">
            {task.category}
          </span>
          <span className="text-[10px] font-bold text-slate-600">
            KKTP: <strong>{task.kktp} Poin</strong>
          </span>
        </div>
        <h3 className="font-bold text-sm text-[#1a1a1a] font-sans">{task.title}</h3>
        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-sans">{task.description}</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Step-by-Step Instructions */}
        <div className="space-y-1.5">
          <h4 className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#107c41] inline-block" />
            <span>LANGKAH PENGERJAAN:</span>
          </h4>
          <ol className="list-decimal pl-5 space-y-1 text-[11px] text-slate-700 font-sans leading-relaxed">
            {task.instructions.map((inst, idx) => (
              <li key={idx}>{inst}</li>
            ))}
          </ol>
        </div>

        {/* Live Target Cells Checklist */}
        <div className="space-y-2 pt-2 border-t border-slate-300">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-600 inline-block" />
              <span>DAFTAR SEL TARGET ({task.targetEvaluations.length}):</span>
            </h4>
            <span className="text-[10px] text-slate-500">Klik untuk lompat</span>
          </div>

          <div className="space-y-1.5">
            {task.targetEvaluations.map((item) => {
              const checkResult = lastCheckResults?.find((r) => r.evaluationId === item.id);
              const isChecked = !!checkResult;
              const isPerfect = checkResult?.isFormulaValid && checkResult?.isValueValid;

              return (
                <div
                  key={item.id}
                  onClick={() => onFocusCell?.(item.cellRef)}
                  className={`p-2 border cursor-pointer transition-all ${
                    isPerfect
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                      : isChecked
                      ? 'bg-amber-50 border-amber-500 text-amber-950'
                      : 'bg-white border-slate-300 hover:border-[#107c41]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-xs text-[#107c41] bg-emerald-100 px-1.5 py-0.5 border border-emerald-300">
                      Sel {item.cellRef}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">
                      {checkResult ? `${checkResult.pointsEarned} / ${item.points} Poin` : `${item.points} Poin`}
                    </span>
                  </div>
                  <div className="text-[11px] font-sans font-medium text-slate-700 mt-1">
                    {item.description}
                  </div>
                  {checkResult && (
                    <div className="text-[10px] mt-1 pt-1 border-t border-dashed border-slate-300 flex items-start gap-1 font-sans">
                      {isPerfect ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <span>{checkResult.feedback}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Evaluation Score Result (If checked) */}
        {lastCheckScore !== null && (
          <div className="p-3 bg-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              ESTIMASI NILAI AKURASI RUMUS:
            </span>
            <div className="text-3xl font-black text-[#107c41]">{lastCheckScore} / 100</div>
            <span
              className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase border ${
                lastCheckScore >= (task.kktp || 75)
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-500'
                  : 'bg-amber-100 text-amber-900 border-amber-500'
              }`}
            >
              {lastCheckScore >= (task.kktp || 75) ? 'MEMENUHI KKTP' : 'BELUM TUNTAS KKTP'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="p-3 bg-white border-t-2 border-[#1a1a1a] space-y-2">
        <button
          type="button"
          onClick={handleRunCheck}
          disabled={isChecking}
          className="w-full py-2 px-3 bg-[#e0e7ff] hover:bg-blue-100 text-[#1e40af] border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'MEMERIKSA RUMUS...' : 'CEK AKURASI RUMUS'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          disabled={isSubmitting}
          className="w-full py-2.5 px-3 bg-[#107c41] hover:bg-emerald-700 text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          <span>{isSubmitting ? 'MENGIRIMKAN...' : 'KIRIM TUGAS KE GURU'}</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-300">
              <Award className="h-5 w-5 text-[#107c41]" />
              <h3 className="font-bold text-sm text-[#1a1a1a] uppercase">Kirim Lembar Kerja Tugas?</h3>
            </div>
            <p className="text-xs text-slate-700 font-sans leading-relaxed">
              Snapshot pengerjaan rumus spreadsheet Anda akan dikirimkan secara permanen ke guru untuk dinilai.
              {lastCheckScore !== null && (
                <span className="block mt-2 font-mono-code font-bold text-[#107c41]">
                  Skor Akurasi Saat Ini: {lastCheckScore}/100
                </span>
              )}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 cursor-pointer"
              >
                Cek Ulang
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-[#107c41] hover:bg-emerald-700 text-white text-xs font-black border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
