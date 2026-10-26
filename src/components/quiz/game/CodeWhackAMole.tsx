import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Hammer, Target, RotateCcw } from 'lucide-react';
import type { QuizQuestion } from '../../../services/quizStore';
import type { ShuffledOptionItem } from '../../StudentQuizView';

/**
 * MODE ARCADE — WHACK-A-MOLE (OUTPUT KODE)
 *
 * Pilihan jawaban muncul sebagai tikus yang keluar-masuk lubang.
 * Siswa "memukul" tikus yang membawa jawaban benar.
 *
 * Penilaian tetap sah: pukulan apa pun (benar/salah) langsung mengunci jawaban.
 * Tersedia juga tombol jawaban biasa sebagai fallback aksesibilitas.
 */

interface CodeWhackAMoleProps {
  question: QuizQuestion;
  displayOptions: ShuffledOptionItem[];
  onAnswer: (originalIndex: number) => void;
  currentAnswer?: number;
  isAnswered: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface MoleState {
  slot: number | null; // indeks displayOptions yang sedang muncul
  popping: boolean;
}

export const CodeWhackAMole: React.FC<CodeWhackAMoleProps> = ({
  question,
  displayOptions,
  onAnswer,
  currentAnswer,
  isAnswered,
}) => {
  const [holes, setHoles] = useState<MoleState[]>(() =>
    Array.from({ length: Math.max(2, displayOptions.length) }, () => ({
      slot: null,
      popping: false,
    }))
  );
  const [whacked, setWhacked] = useState<number | null>(null);
  const [wrongWhacks, setWrongWhacks] = useState(0);
  const lockedRef = useRef(isAnswered);
  const tickRef = useRef(0);

  const isCorrectAnswer = currentAnswer === question.correctOptionIndex;
  const feedback = whacked !== null || (isAnswered && currentAnswer !== undefined);

  useEffect(() => {
    lockedRef.current = isAnswered;
  }, [isAnswered]);

  // Reset saat soal berganti
  useEffect(() => {
    setHoles(
      Array.from({ length: Math.max(2, displayOptions.length) }, () => ({
        slot: null,
        popping: false,
      }))
    );
    setWhacked(null);
    setWrongWhacks(0);
    tickRef.current = 0;
  }, [question.id, displayOptions.length]);

  // Siklus tikus: acak, tapi selalu ada minimal 2 tikus yang naik.
  useEffect(() => {
    if (isAnswered) return;

    const shuffleHoles = () => {
      tickRef.current += 1;
      const count = Math.max(2, displayOptions.length);
      const slots = displayOptions.map((_, i) => i);
      // Putar urutan agar tiap opsi kebagian tampil
      const offset = tickRef.current % Math.max(1, slots.length);
      const rotated = [...slots.slice(offset), ...slots.slice(0, offset)];

      setHoles(
        Array.from({ length: count }, (_, holeIdx) => {
          const show = holeIdx < rotated.length && Math.random() > 0.18;
          return {
            slot: show ? rotated[holeIdx] : null,
            popping: show,
          };
        })
      );
    };

    shuffleHoles();
    const timer = window.setInterval(shuffleHoles, 1500);
    return () => window.clearInterval(timer);
  }, [isAnswered, question.id, displayOptions]);

  const whack = (holeIdx: number) => {
    if (lockedRef.current) return;
    const hole = holes[holeIdx];
    if (hole.slot === null) return;
    const option = displayOptions[hole.slot];
    if (!option) return;

    lockedRef.current = true;
    setWhacked(option.originalIndex);
    if (option.originalIndex !== question.correctOptionIndex) {
      setWrongWhacks((w) => w + 1);
    }
    onAnswer(option.originalIndex);
  };

  const correctLetter = LETTERS[question.correctOptionIndex ?? 0] || 'A';
  const correctText = useMemo(
    () => displayOptions.find((o) => o.originalIndex === question.correctOptionIndex)?.text ?? '-',
    [displayOptions, question.correctOptionIndex]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1a1a1a] text-white px-3 py-2 border-2 border-[#1a1a1a] font-mono-code">
        <div className="flex items-center gap-4 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1 text-amber-300">
            <Hammer className="h-3.5 w-3.5" /> PUKULAN SALAH {wrongWhacks}
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <Target className="h-3.5 w-3.5" /> {displayOptions.length} PILIHAN
          </span>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
          Whack-a-Mole · Output Kode
        </span>
      </div>

      <div className="relative border-4 border-[#1a1a1a] bg-gradient-to-b from-lime-700 to-lime-900 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          {holes.map((hole, holeIdx) => {
            const option = hole.slot !== null ? displayOptions[hole.slot] : null;
            const letter = hole.slot !== null ? LETTERS[hole.slot] : '';
            return (
              <button
                key={holeIdx}
                type="button"
                onClick={() => whack(holeIdx)}
                disabled={isAnswered || !option}
                aria-label={option ? `Pukul tikus jawaban ${letter}: ${option.text}` : 'Lubang kosong'}
                className="relative h-28 sm:h-32 rounded-full bg-[#1a1a1a]/70 border-4 border-[#3f2d1a] overflow-hidden cursor-pointer disabled:cursor-default focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
              >
                <div className="absolute bottom-0 w-full h-10 bg-[#5b3d1f]" />
                {option && (
                  <div className="absolute inset-x-0 bottom-4 flex flex-col items-center animate-[moleUp_180ms_ease-out]">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#8d6e63] border-4 border-[#4e342e] flex items-center justify-center shadow-lg">
                      <span className="text-[10px] sm:text-xs font-black text-amber-200 absolute -top-2 -left-1 bg-[#1a1a1a] border border-amber-300 rounded-full w-6 h-6 flex items-center justify-center">
                        {letter}
                      </span>
                      <div className="text-xs sm:text-sm text-[#2b1a12] font-black">
                        <span className="block w-2 h-2 bg-[#1a1a1a] rounded-full mx-auto mb-1" />
                        <span className="block w-4 h-1 bg-[#1a1a1a] rounded-full mx-auto" />
                      </div>
                    </div>
                    <div className="mt-1 max-w-[130px] text-center text-[9px] sm:text-[10px] font-bold text-white bg-[#1a1a1a]/85 px-1.5 py-0.5 rounded leading-tight line-clamp-2">
                      {option.text}
                    </div>
                  </div>
                )}
                {!option && (
                  <span className="absolute inset-x-0 bottom-3 text-center text-[9px] font-bold text-lime-200/70 uppercase">
                    kosong
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-[#1a1a1a] p-5 text-center max-w-sm w-full">
              <div className="text-xl font-black mb-1">
                {isCorrectAnswer ? '🔨 TEPAT!' : '💥 SALAH PUKUL'}
              </div>
              <div className="font-mono-code text-xs font-bold text-slate-700">
                Jawaban benar: {correctLetter}
              </div>
              <div className="mt-1 text-[11px] text-slate-600">{correctText}</div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes moleUp {
          from { transform: translateY(60%); opacity: 0.4; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="bg-amber-50 border-2 border-[#1a1a1a] p-2.5 text-[11px] font-mono-code leading-snug">
        <strong>Cara main:</strong> tikus membawa pilihan jawaban dan keluar-masuk lubang. Pukul tikus
        yang membawa jawaban benar — jawaban langsung dikunci setelah dipukul.
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
                {item.text}
              </button>
            );
          })}
        </div>
      </details>

      {isAnswered && !feedback && (
        <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
          <RotateCcw className="h-3 w-3" /> Jawaban sudah terkunci.
        </div>
      )}
    </div>
  );
};
