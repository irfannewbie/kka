import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Terminal, Play, Pause, CornerDownLeft, Target, RotateCcw } from 'lucide-react';
import type { QuizQuestion } from '../../../services/quizStore';
import type { ShuffledOptionItem } from '../../StudentQuizView';

/**
 * MODE ARCADE — TERMINAL RUNNER (OUTPUT KODE)
 *
 * Tema lebih dekat ke materi: layar terminal menampilkan potongan kode, lalu
 * kandidat output berjalan bergantian dengan penanda kursor. Siswa menekan
 * "KUNCI" (atau klik langsung) untuk memilih output yang dianggap benar.
 *
 * Penilaian tetap sah: pilihan apa pun (benar/salah) langsung mengunci jawaban.
 * Tersedia fallback tombol biasa untuk aksesibilitas / perangkat lambat.
 */

interface CodeTerminalRunnerProps {
  question: QuizQuestion;
  displayOptions: ShuffledOptionItem[];
  onAnswer: (originalIndex: number) => void;
  currentAnswer?: number;
  isAnswered: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const CodeTerminalRunner: React.FC<CodeTerminalRunnerProps> = ({
  question,
  displayOptions,
  onAnswer,
  currentAnswer,
  isAnswered,
}) => {
  const [cursor, setCursor] = useState(0);
  const [running, setRunning] = useState(true);
  const lockedRef = useRef(isAnswered);

  useEffect(() => {
    lockedRef.current = isAnswered;
    if (isAnswered) setRunning(false);
  }, [isAnswered]);

  // Reset saat soal berganti.
  useEffect(() => {
    setCursor(0);
    setRunning(true);
  }, [question.id]);

  // Kursor berjalan otomatis selama belum dikunci.
  useEffect(() => {
    if (!running || isAnswered || displayOptions.length === 0) return;
    const timer = window.setInterval(() => {
      setCursor((prev) => (prev + 1) % displayOptions.length);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [running, isAnswered, displayOptions.length, question.id]);

  const pick = (originalIndex: number) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setRunning(false);
    onAnswer(originalIndex);
  };

  const confirmCursor = () => {
    const option = displayOptions[cursor];
    if (!option) return;
    pick(option.originalIndex);
  };

  // Pintasan keyboard: Spasi / Enter untuk mengunci pilihan kursor.
  useEffect(() => {
    if (isAnswered) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      event.preventDefault();
      const option = displayOptions[cursor];
      if (!option) return;
      lockedRef.current = true;
      setRunning(false);
      onAnswer(option.originalIndex);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAnswered, question.id, cursor, displayOptions, onAnswer]);

  const correctLetter = LETTERS[question.correctOptionIndex ?? 0] || 'A';
  const correctText = useMemo(
    () => displayOptions.find((o) => o.originalIndex === question.correctOptionIndex)?.text ?? '-',
    [displayOptions, question.correctOptionIndex]
  );

  const isCorrectAnswer = currentAnswer === question.correctOptionIndex;
  const feedback = isAnswered && currentAnswer !== undefined;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1a1a1a] text-white px-3 py-2 border-2 border-[#1a1a1a] font-mono-code">
        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-300">
          <Terminal className="h-3.5 w-3.5" />
          <span>TERMINAL RUNNER · TEBAK OUTPUT KODE</span>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
          {displayOptions.length} output kandidat
        </span>
      </div>

      {/* Jendela terminal */}
      <div className="border-4 border-[#1a1a1a] bg-[#0b0f14] shadow-[4px_4px_0px_#1a1a1a]">
        <div className="flex items-center gap-1.5 bg-[#1a1a1a] px-3 py-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="ml-2 text-[10px] font-mono-code text-slate-400">
            runner@kka:~/soal-output
          </span>
        </div>

        <div className="p-3 sm:p-4 font-mono-code text-[11px] sm:text-xs leading-relaxed">
          <div className="text-emerald-400">$ baca kode_sumber</div>
          <pre className="mt-1 whitespace-pre-wrap break-words text-slate-200 bg-black/40 border border-white/10 p-2.5 max-h-44 overflow-y-auto">
            {question.codeSnippet?.trim() || '(kode tidak tersedia — baca soal di atas)'}
          </pre>

          <div className="mt-3 text-emerald-400">$ jalankan --pilih-satu-output</div>
          <div className="mt-2 space-y-1.5">
            {displayOptions.map((item, idx) => {
              const letter = LETTERS[idx] || String(idx + 1);
              const active = cursor === idx;
              const selected = currentAnswer === item.originalIndex;
              return (
                <button
                  key={item.originalIndex}
                  type="button"
                  onClick={() => pick(item.originalIndex)}
                  disabled={isAnswered}
                  className={`w-full text-left flex items-start gap-2 border px-2.5 py-2 transition-colors cursor-pointer disabled:cursor-default ${
                    selected
                      ? 'bg-[#2e59e6] border-white text-white'
                      : active && !isAnswered
                        ? 'bg-emerald-900/60 border-emerald-400 text-emerald-50'
                        : 'bg-black/30 border-white/15 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`shrink-0 w-6 h-6 flex items-center justify-center border font-black text-[10px] ${
                      active && !isAnswered
                        ? 'bg-emerald-400 text-[#0b0f14] border-emerald-200'
                        : 'bg-transparent text-slate-300 border-white/30'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-words">
                    <span className="text-slate-500">&gt; </span>
                    {item.text}
                  </span>
                  {active && !isAnswered && (
                    <span className="shrink-0 text-[9px] font-black text-emerald-300 self-center">
                      ◀ KURSOR
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 text-emerald-400 flex items-center gap-1.5">
            <span className="inline-block w-2 h-3.5 bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-[10px]">
              kursor bergerak otomatis · tekan SPASI / ENTER untuk mengunci
            </span>
          </div>
        </div>
      </div>

      {/* Kontrol */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRunning((prev) => !prev)}
          disabled={isAnswered}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-black bg-[#1a1a1a] text-white border-2 border-[#1a1a1a] disabled:opacity-40 cursor-pointer"
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {running ? 'JEDA KURSOR' : 'JALANKAN KURSOR'}
        </button>
        <button
          type="button"
          onClick={() => setCursor((prev) => (prev + 1) % Math.max(1, displayOptions.length))}
          disabled={isAnswered}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-black bg-white text-[#1a1a1a] border-2 border-[#1a1a1a] disabled:opacity-40 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" /> GANTI PILIHAN
        </button>
        <button
          type="button"
          onClick={confirmCursor}
          disabled={isAnswered || displayOptions.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-black bg-emerald-500 hover:bg-emerald-400 text-[#1a1a1a] border-2 border-[#1a1a1a] disabled:opacity-40 cursor-pointer"
        >
          <CornerDownLeft className="h-3.5 w-3.5" /> KUNCI PILIHAN KURSOR
        </button>
        <span className="inline-flex items-center gap-1 px-2 py-2 text-[10px] font-bold text-slate-500">
          <Target className="h-3.5 w-3.5" /> Jawaban terkunci setelah dipilih
        </span>
      </div>

      {feedback && (
        <div
          className={`border-2 border-[#1a1a1a] p-4 text-center font-mono-code ${
            isCorrectAnswer ? 'bg-emerald-100' : 'bg-rose-100'
          }`}
        >
          <div className="text-sm font-black">
            {isCorrectAnswer ? '✅ OUTPUT TEPAT' : '❌ OUTPUT BELUM TEPAT'}
          </div>
          <div className="text-xs font-bold text-slate-700 mt-1">
            Output benar: {correctLetter}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5 whitespace-pre-wrap break-words">
            {correctText}
          </div>
        </div>
      )}

      <div className="bg-amber-50 border-2 border-[#1a1a1a] p-2.5 text-[11px] font-mono-code leading-snug">
        <strong>Cara main:</strong> kandidat output bergiliran dengan penanda kursor. Tekan{' '}
        <strong>KUNCI PILIHAN KURSOR</strong>, klik langsung salah satu output, atau tekan{' '}
        <strong>SPASI</strong> saat kursor berada di jawaban yang kamu yakini.
      </div>

      <details className="border-2 border-[#1a1a1a] bg-white">
        <summary className="px-3 py-2 text-[11px] font-black uppercase cursor-pointer select-none">
          Tidak bisa memakai game? Pilih jawaban lewat tombol
        </summary>
        <div className="p-2.5 space-y-2 border-t-2 border-[#1a1a1a]">
          {displayOptions.map((item, dispIdx) => {
            const letter = LETTERS[dispIdx] || String(dispIdx + 1);
            const isSelected = currentAnswer === item.originalIndex;
            return (
              <button
                key={item.originalIndex}
                type="button"
                disabled={isAnswered}
                onClick={() => onAnswer(item.originalIndex)}
                className={`w-full text-left p-3 border-2 flex items-center gap-3 text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'bg-[#2e59e6] text-white border-[#1a1a1a]'
                    : 'bg-[#F2EFEB]/70 hover:bg-[#F2EFEB] text-[#1a1a1a] border-[#1a1a1a]'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <span className="w-7 h-7 flex items-center justify-center font-mono-code font-black border-2 bg-white text-[#1a1a1a] border-[#1a1a1a] shrink-0">
                  {letter}
                </span>
                <span className="whitespace-pre-wrap break-words">{item.text}</span>
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
};
