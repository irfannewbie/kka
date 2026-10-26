import React, { useEffect, useState } from 'react';
import { Train, ArrowUp, ArrowDown, CheckCircle2, Shuffle } from 'lucide-react';
import type { QuizQuestion } from '../../../services/quizStore';

/**
 * MODE ARCADE — TRAIN SORTING (PARSONS / SUSUN ALGORITMA)
 * Susun gerbong kereta dari langkah pertama ke langkah terakhir.
 */

interface ParsonsTrainProps {
  question: QuizQuestion;
  onAnswer: (blocks: string[]) => void;
  currentAnswer?: string[];
  isAnswered: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const ParsonsTrain: React.FC<ParsonsTrainProps> = ({
  question,
  onAnswer,
  currentAnswer,
  isAnswered,
}) => {
  const sourceBlocks = question.parsonsBlocks || [];
  const [blocks, setBlocks] = useState<string[]>([]);

  // Inisialisasi: jika belum pernah dijawab, acak biar bukan urutan benar.
  // Jika sudah dijawab, kembalikan urutan siswa.
  useEffect(() => {
    if (currentAnswer && currentAnswer.length > 0) {
      setBlocks(currentAnswer);
      return;
    }
    const shuffled = shuffleArray(sourceBlocks);
    setBlocks(shuffled);
    onAnswer(shuffled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (isAnswered) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const copy = [...blocks];
    [copy[index], copy[targetIndex]] = [copy[targetIndex], copy[index]];
    setBlocks(copy);
    onAnswer(copy);
  };

  const isCorrect =
    sourceBlocks.length > 0 &&
    blocks.length === sourceBlocks.length &&
    blocks.every((b, i) => b === sourceBlocks[i]);

  if (blocks.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1a1a1a] text-white px-3 py-2 border-2 border-[#1a1a1a] font-mono-code">
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <Train className="h-3.5 w-3.5 text-amber-300" />
          <span>TRAIN SORTING · SUSUN BLOK ALGORITMA</span>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
          Urutan {blocks.length} gerbong
        </span>
      </div>

      <div className="border-4 border-[#1a1a1a] bg-gradient-to-b from-emerald-800 to-emerald-950 p-4 sm:p-5 overflow-x-auto">
        <div className="min-w-[280px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative">
              <div className="bg-red-600 border-2 border-[#1a1a1a] px-4 sm:px-5 py-3 rounded shadow-lg">
                <div className="text-white font-black text-[10px] sm:text-xs">LOKOMOTIF</div>
              </div>
            </div>
            <div className="flex gap-1">
              <span className="w-3 h-3 rounded-full bg-[#1a1a1a]" />
              <span className="w-3 h-3 rounded-full bg-[#1a1a1a]" />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {blocks.map((block, idx) => (
              <React.Fragment key={idx}>
                <div className="relative bg-blue-600 border-2 border-[#1a1a1a] px-3 py-3 rounded shadow-[3px_3px_0px_rgba(0,0,0,0.4)] min-w-[200px] max-w-[320px]">
                  <div className="absolute -top-2 left-3 bg-[#1a1a1a] text-amber-300 px-1.5 py-0.5 text-[9px] font-black rounded">
                    GERBONG #{idx + 1}
                  </div>
                  <div className="mt-2 font-mono-code text-[10px] sm:text-xs font-bold text-white break-words whitespace-pre-wrap">
                    {block}
                  </div>
                  {!isAnswered && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, 'up')}
                        disabled={idx === 0}
                        aria-label="Pindahkan ke atas"
                        className="w-6 h-6 bg-amber-400 border border-[#1a1a1a] rounded-full flex items-center justify-center hover:bg-amber-300 disabled:opacity-25 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, 'down')}
                        disabled={idx === blocks.length - 1}
                        aria-label="Pindahkan ke bawah"
                        className="w-6 h-6 bg-amber-400 border border-[#1a1a1a] rounded-full flex items-center justify-center hover:bg-amber-300 disabled:opacity-25 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]" />
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-[#1a1a1a] p-2.5 text-[11px] font-mono-code leading-snug">
        <strong>Cara main:</strong> gerakkan gerbong dengan tombol panah agar urut dari depan
        (nomor 1) ke belakang. Urutan dikunci otomatis saat kamu pindahkan gerbong.
      </div>

      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
        <Shuffle className="h-3.5 w-3.5" /> Blok diacak saat mulai supaya puzzle nyata.
      </div>

      {isAnswered && (
        <div
          className={`border-2 border-[#1a1a1a] p-3 text-center ${
            isCorrect ? 'bg-emerald-100' : 'bg-rose-100'
          }`}
        >
          <CheckCircle2
            className={`h-6 w-6 mx-auto mb-1 ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}
          />
          <div className={`text-xs font-black ${isCorrect ? 'text-emerald-900' : 'text-rose-900'}`}>
            {isCorrect ? '✅ KERETA SUDAH TERURUT BENAR' : '❌ URUTAN BELUM TEPAT'}
          </div>
        </div>
      )}
    </div>
  );
};
