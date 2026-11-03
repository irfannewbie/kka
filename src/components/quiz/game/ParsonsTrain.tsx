import React, { useEffect, useState } from 'react';
import { Train, ArrowUp, ArrowDown, CheckCircle2, Shuffle } from 'lucide-react';
import type { QuizQuestion } from '../../../services/quizStore';

/**
 * MODE ARCADE — TRAIN SORTING (PARSONS / SUSUN ALGORITMA)
 *
 * Versi vertikal: gerbong ditumpuk ke bawah sehingga nyaman dipakai di HP
 * tanpa scroll horizontal. Siswa menaik-turunkan gerbong sampai urut dari
 * langkah pertama sampai terakhir. Urutan tetap bisa diubah sampai dikirim,
 * karena Parsons tidak punya "satu pilihan" yang bisa dikunci.
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

      <div className="border-4 border-[#1a1a1a] bg-gradient-to-b from-emerald-800 to-emerald-950 p-3 sm:p-4">
        {/* Lokomotif di paling atas (langkah pertama) */}
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-red-600 border-2 border-[#1a1a1a] px-3 sm:px-4 py-2.5 rounded shadow-lg">
            <div className="text-white font-black text-[10px] sm:text-xs">
              🚂 LOKOMOTIF · LANGKAH PERTAMA
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          {blocks.map((block, idx) => (
            <React.Fragment key={`${idx}-${block.slice(0, 12)}`}>
              {/* Rel penghubung */}
              <div className="flex items-center gap-2 pl-5 h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400/70" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400/70" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400/70" />
              </div>

              <div className="relative bg-blue-600 border-2 border-[#1a1a1a] rounded shadow-[3px_3px_0px_rgba(0,0,0,0.4)] p-3 pr-14">
                <div className="absolute -top-2 left-3 bg-[#1a1a1a] text-amber-300 px-1.5 py-0.5 text-[9px] font-black rounded">
                  GERBONG #{idx + 1}
                </div>
                <div className="mt-1.5 font-mono-code text-[11px] sm:text-xs font-bold text-white break-words whitespace-pre-wrap leading-snug">
                  {block}
                </div>

                {!isAnswered && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveBlock(idx, 'up')}
                      disabled={idx === 0}
                      aria-label={`Naikkan gerbong ${idx + 1}`}
                      className="w-9 h-9 bg-amber-400 border-2 border-[#1a1a1a] rounded flex items-center justify-center hover:bg-amber-300 active:bg-amber-500 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(idx, 'down')}
                      disabled={idx === blocks.length - 1}
                      aria-label={`Turunkan gerbong ${idx + 1}`}
                      className="w-9 h-9 bg-amber-400 border-2 border-[#1a1a1a] rounded flex items-center justify-center hover:bg-amber-300 active:bg-amber-500 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}

          {/* Gerbong terakhir */}
          <div className="flex items-center gap-2 pl-5 h-4">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400/70" />
          </div>
          <div className="bg-slate-700 border-2 border-[#1a1a1a] px-3 py-1.5 rounded text-[9px] font-black text-slate-200 tracking-wider">
            🏁 LANGKAH TERAKHIR
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-[#1a1a1a] p-2.5 text-[11px] font-mono-code leading-snug">
        <strong>Cara main:</strong> naik-turunkan gerbong dengan tombol panah sampai urut dari
        langkah pertama (atas) ke terakhir (bawah). Urutan boleh diubah sampai kamu menekan
        tombol kirim jawaban.
      </div>

      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
        <Shuffle className="h-3.5 w-3.5" /> Blok diacak saat mulai supaya puzzle nyata.
      </div>

      {isAnswered && isCorrect && (
        <div className="border-2 border-[#1a1a1a] p-3 text-center bg-emerald-100">
          <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-emerald-700" />
          <div className="text-xs font-black text-emerald-900">
            ✅ KERETA SUDAH TERURUT BENAR
          </div>
        </div>
      )}
    </div>
  );
};
