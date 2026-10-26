import React, { useEffect, useMemo, useState } from 'react';
import { GitBranch, CheckCircle2, Unlink } from 'lucide-react';
import type { QuizQuestion } from '../../../services/quizStore';

/**
 * MODE ARCADE — PIPE CONNECT (MENJODOHKAN)
 * Hubungkan konsep (kiri) dengan jawaban (kanan) layaknya pipa saluran.
 * Klik kiri → klik kanan untuk menghubungkan. Klik koneksi untuk memutus.
 */

interface MatchingConnectProps {
  question: QuizQuestion;
  onAnswer: (answerMap: Record<string, string>) => void;
  currentAnswer?: Record<string, string>;
  isAnswered: boolean;
}

export const MatchingConnect: React.FC<MatchingConnectProps> = ({
  question,
  onAnswer,
  currentAnswer = {},
  isAnswered,
}) => {
  const pairs = useMemo(() => question.matchingPairs || [], [question.matchingPairs]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [answerMap, setAnswerMap] = useState<Record<string, string>>(currentAnswer);

  // Sync saat berpindah soal
  useEffect(() => {
    setAnswerMap(currentAnswer || {});
    setSelectedLeft(null);
  }, [question.id, currentAnswer]);

  const shuffledRight = useMemo(() => {
    const items = pairs.map((p) => p.rightText);
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [pairs]);

  const commit = (map: Record<string, string>) => {
    setAnswerMap(map);
    onAnswer(map);
  };

  const handleLeftClick = (pairId: string) => {
    if (isAnswered) return;
    if (answerMap[pairId]) {
      const next = { ...answerMap };
      delete next[pairId];
      commit(next);
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft((prev) => (prev === pairId ? null : pairId));
  };

  const handleRightClick = (rightText: string) => {
    if (isAnswered || !selectedLeft) return;
    const next = { ...answerMap };
    // Lepaskan koneksi lama yang pakai jawaban ini
    for (const [leftId, val] of Object.entries(next)) {
      if (val === rightText && leftId !== selectedLeft) {
        delete next[leftId];
      }
    }
    next[selectedLeft] = rightText;
    commit(next);
    setSelectedLeft(null);
  };

  const connectedCount = Object.keys(answerMap).length;
  const total = pairs.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1a1a1a] text-white px-3 py-2 border-2 border-[#1a1a1a] font-mono-code">
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <GitBranch className="h-3.5 w-3.5 text-cyan-300" />
          <span>PIPE CONNECT · MENJODOHKAN</span>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
          Terhubung {connectedCount} / {total}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 p-3 sm:p-5 border-4 border-[#1a1a1a] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Kiri */}
        <div className="space-y-2">
          <div className="text-center text-[9px] font-black uppercase tracking-widest text-cyan-300">
            Konsep
          </div>
          {pairs.map((pair) => {
            const connected = !!answerMap[pair.id];
            const selected = selectedLeft === pair.id;
            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => handleLeftClick(pair.id)}
                disabled={isAnswered}
                className={`w-full text-left p-3 border-2 flex items-center gap-2.5 transition-all ${
                  isAnswered
                    ? 'opacity-70 cursor-not-allowed'
                    : connected
                    ? 'bg-emerald-900/40 border-emerald-400 text-white'
                    : selected
                    ? 'bg-cyan-900/50 border-cyan-300 text-white scale-[1.01]'
                    : 'bg-slate-700/50 border-slate-400 text-white hover:border-cyan-300'
                }`}
              >
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full border-2 font-black text-xs ${
                    connected
                      ? 'bg-emerald-400 text-[#1a1a1a] border-emerald-200'
                      : selected
                      ? 'bg-cyan-400 text-[#1a1a1a] border-cyan-200'
                      : 'bg-slate-500 text-white border-slate-300'
                  }`}
                >
                  {pairs.findIndex((p) => p.id === pair.id) + 1}
                </span>
                <span className="flex-1 text-xs sm:text-sm font-semibold leading-snug">{pair.leftText}</span>
                {connected && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {connected && !isAnswered && <Unlink className="h-3.5 w-3.5 text-emerald-200" />}
              </button>
            );
          })}
        </div>

        {/* Kanan */}
        <div className="space-y-2">
          <div className="text-center text-[9px] font-black uppercase tracking-widest text-amber-300">
            Jawaban
          </div>
          {shuffledRight.map((rightText, idx) => {
            const usedBy = Object.entries(answerMap).find(([, v]) => v === rightText);
            const used = !!usedBy;
            const usedByNum =
              usedBy !== undefined ? pairs.findIndex((p) => p.id === usedBy[0]) + 1 : null;
            const canConnect = !isAnswered && !!selectedLeft && !used;
            const canReassign = !isAnswered && !!selectedLeft && used && usedBy?.[0] !== selectedLeft;

            return (
              <button
                key={`${rightText}-${idx}`}
                type="button"
                onClick={() => handleRightClick(rightText)}
                disabled={isAnswered || (!selectedLeft && !used)}
                className={`w-full text-left p-3 border-2 flex items-center gap-2.5 transition-all ${
                  isAnswered
                    ? 'opacity-70 cursor-not-allowed bg-slate-700/40 border-slate-400 text-white'
                    : used
                    ? canReassign
                      ? 'bg-orange-900/40 border-orange-400 text-white hover:bg-orange-800/40'
                      : 'bg-emerald-900/40 border-emerald-400 text-white'
                    : canConnect
                    ? 'bg-slate-700/60 border-slate-300 text-white hover:border-amber-300 hover:bg-slate-600/60'
                    : 'bg-slate-700/40 border-slate-500 text-white/70'
                }`}
              >
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full border-2 ${
                    used ? 'bg-emerald-400 border-emerald-200' : 'bg-slate-600 border-slate-400'
                  }`}
                />
                <span className="flex-1 text-xs sm:text-sm font-semibold leading-snug">{rightText}</span>
                {used && usedByNum !== null && (
                  <span className="px-2 py-0.5 bg-emerald-400 text-[#1a1a1a] text-[10px] font-black rounded">
                    #{usedByNum}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-cyan-50 border-2 border-[#1a1a1a] p-2.5 text-[11px] font-mono-code leading-snug">
        <strong>Cara main:</strong> pilih satu baris di kiri → klik jawaban yang cocok di kanan untuk
        menghubungkan. Klik kembali baris yang terhubung untuk memutuskan.
      </div>

      {connectedCount === total && total > 0 && !isAnswered && (
        <div className="bg-emerald-100 border-2 border-emerald-700 p-3 text-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-700 mx-auto mb-1" />
          <div className="text-xs font-black text-emerald-900">SEMUA PASANGAN TERHUBUNG</div>
        </div>
      )}
    </div>
  );
};
