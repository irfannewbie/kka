import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Target, Zap, Crosshair } from 'lucide-react';
import type { QuizQuestion } from '../../../services/quizStore';
import type { ShuffledOptionItem } from '../../StudentQuizView';

/**
 * MODE ARCADE — DUCK HUNT (PILIHAN GANDA)
 *
 * Setiap pilihan jawaban digambar sebagai bebek yang terbang melintasi langit.
 * Siswa menembak (klik/ketuk) bebek yang dianggap benar.
 *
 * Catatan teknis:
 * - Animasi sepenuhnya di <canvas> memakai requestAnimationFrame + ref,
 *   sehingga React TIDAK re-render tiap frame (hemat CPU di HP siswa).
 * - Tombol jawaban biasa tetap disediakan di bawah kanvas sebagai fallback
 *   (aksesibilitas & jika siswa tidak nyaman dengan mekanik game).
 */

interface DuckHuntPGProps {
  question: QuizQuestion;
  displayOptions: ShuffledOptionItem[];
  onAnswer: (originalIndex: number) => void;
  currentAnswer?: number;
  isAnswered: boolean;
}

interface Duck {
  id: number;
  optionSlot: number; // indeks pada displayOptions
  originalIndex: number;
  letter: string;
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  wing: number;
  scale: number;
}

interface Splash {
  x: number;
  y: number;
  start: number;
  correct: boolean;
  label: string;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const DuckHuntPG: React.FC<DuckHuntPGProps> = ({
  question,
  displayOptions,
  onAnswer,
  currentAnswer,
  isAnswered,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const ducksRef = useRef<Duck[]>([]);
  const splashRef = useRef<Splash | null>(null);
  const rafRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number>(0);
  const duckIdRef = useRef<number>(0);
  const answeredRef = useRef<boolean>(isAnswered);
  const submitRef = useRef(onAnswer);

  const [hits, setHits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(
    currentAnswer !== undefined
      ? currentAnswer === question.correctOptionIndex
        ? 'correct'
        : 'wrong'
      : null
  );

  useEffect(() => {
    submitRef.current = onAnswer;
  }, [onAnswer]);

  useEffect(() => {
    answeredRef.current = isAnswered;
  }, [isAnswered]);

  const spawnDuck = useCallback(
    (slot: number, canvasW: number, canvasH: number) => {
      const option = displayOptions[slot];
      if (!option) return;
      const fromLeft = Math.random() > 0.5;
      const scale = 0.85 + Math.random() * 0.25;
      ducksRef.current.push({
        id: duckIdRef.current++,
        optionSlot: slot,
        originalIndex: option.originalIndex,
        letter: LETTERS[slot] || String(slot + 1),
        text: option.text,
        x: fromLeft ? -140 : canvasW + 140,
        y: 60 + Math.random() * Math.max(80, canvasH - 200),
        vx: (fromLeft ? 1 : -1) * (1.6 + Math.random() * 1.2),
        vy: (Math.random() - 0.5) * 0.8,
        wing: Math.random() * Math.PI * 2,
        scale,
      });
    },
    [displayOptions]
  );

  // Muat ulang bebek saat soal/opsi berubah
  useEffect(() => {
    ducksRef.current = [];
    splashRef.current = null;
    duckIdRef.current = 0;
    spawnTimerRef.current = 0;
    setHits(0);
    setCombo(0);
    setMisses(0);
    setFeedback(null);
  }, [question.id]);

  /** Tembak berdasarkan koordinat kanvas. */
  const shootAt = useCallback(
    (px: number, py: number) => {
      if (answeredRef.current) return;

      let target: Duck | null = null;
      let bestDist = Infinity;
      for (const duck of ducksRef.current) {
        // Area klik: badan + label teks jawaban di bawah bebek
        const inBody = Math.hypot(px - duck.x, py - duck.y) < 62 * duck.scale;
        const inLabel =
          px >= duck.x - 120 && px <= duck.x + 120 && py >= duck.y + 24 && py <= duck.y + 58;
        if (inBody || inLabel) {
          const dist = Math.hypot(px - duck.x, py - duck.y);
          if (dist < bestDist) {
            bestDist = dist;
            target = duck;
          }
        }
      }

      if (!target) {
        // Tembakan meleset ke langit: hanya efek visual, tidak mengunci jawaban.
        splashRef.current = {
          x: px,
          y: py,
          start: performance.now(),
          correct: false,
          label: 'MELESET',
        };
        setMisses((m) => m + 1);
        setCombo(0);
        return;
      }

      const isCorrect = target.originalIndex === (question.correctOptionIndex ?? 0);
      splashRef.current = {
        x: target.x,
        y: target.y,
        start: performance.now(),
        correct: isCorrect,
        label: isCorrect ? 'KENA!' : 'SALAH',
      };
      ducksRef.current = ducksRef.current.filter((d) => d.id !== target!.id);

      if (isCorrect) {
        setHits((h) => h + 1);
        setCombo((c) => c + 1);
      } else {
        setMisses((m) => m + 1);
        setCombo(0);
      }

      // Jawaban langsung dikunci (benar maupun salah) agar penilaian tetap sah.
      answeredRef.current = true;
      setFeedback(isCorrect ? 'correct' : 'wrong');
      submitRef.current(target.originalIndex);
    },
    [question.correctOptionIndex]
  );

  // Loop animasi + render kanvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cssW = 0;
    let cssH = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      cssW = Math.max(280, rect.width);
      cssH = rect.height || 360;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let last = performance.now();

    const drawCloud = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.9, cy + r * 0.15, r * 1.15, 0, Math.PI * 2);
      ctx.arc(cx + r * 1.9, cy, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawDuck = (duck: Duck) => {
      ctx.save();
      ctx.translate(duck.x, duck.y);
      ctx.scale(duck.scale, duck.scale);
      if (duck.vx < 0) ctx.scale(-1, 1);

      // Badan
      ctx.fillStyle = '#8B5A2B';
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 21, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Kepala
      ctx.fillStyle = '#2f7d32';
      ctx.beginPath();
      ctx.arc(26, -8, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Paruh
      ctx.fillStyle = '#F5A623';
      ctx.beginPath();
      ctx.moveTo(38, -8);
      ctx.lineTo(52, -5);
      ctx.lineTo(38, -1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Mata
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(30, -13, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(31, -13, 2, 0, Math.PI * 2);
      ctx.fill();

      // Sayap mengepak
      const flap = Math.sin(duck.wing) * 9;
      ctx.fillStyle = '#5c3a17';
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.lineTo(-30, -10 - flap);
      ctx.lineTo(-4, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ekor
      ctx.beginPath();
      ctx.moveTo(-30, -2);
      ctx.lineTo(-44, -8);
      ctx.lineTo(-30, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Huruf pilihan (badge) di badan bebek
      ctx.save();
      ctx.translate(duck.x, duck.y);
      ctx.fillStyle = '#FFD54F';
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-16, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 14px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(duck.letter, -16, 0);
      ctx.restore();

      // Label teks jawaban
      const maxW = 232;
      const label = duck.text.length > 42 ? `${duck.text.slice(0, 40)}…` : duck.text;
      ctx.font = 'bold 12px system-ui, sans-serif';
      const textW = Math.min(ctx.measureText(label).width + 20, maxW);
      const bx = duck.x - textW / 2;
      const by = duck.y + 26;

      ctx.fillStyle = 'rgba(26, 26, 26, 0.88)';
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 2;
      const r = 6;
      ctx.beginPath();
      ctx.moveTo(bx + r, by);
      ctx.arcTo(bx + textW, by, bx + textW, by + 30, r);
      ctx.arcTo(bx + textW, by + 30, bx, by + 30, r);
      ctx.arcTo(bx, by + 30, bx, by, r);
      ctx.arcTo(bx, by, bx + textW, by, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, duck.x, by + 15, textW - 18);
    };

    const frame = (now: number) => {
      const dt = Math.min(48, now - last) / 16.6667;
      last = now;

      ctx.clearRect(0, 0, cssW, cssH);

      // Langit
      const sky = ctx.createLinearGradient(0, 0, 0, cssH);
      sky.addColorStop(0, '#7ec8e3');
      sky.addColorStop(1, '#d6f0f7');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, cssW, cssH);

      // Awan
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      const cloudShift = (now / 90) % (cssW + 260);
      drawCloud(cssW - cloudShift, 46, 20);
      drawCloud(((cssW * 0.55 - cloudShift * 0.7) % (cssW + 260)) + 40, 92, 14);

      // Rumput
      ctx.fillStyle = '#5b8f3a';
      ctx.fillRect(0, cssH - 42, cssW, 42);
      ctx.fillStyle = '#4a7a2f';
      for (let i = 0; i < cssW; i += 26) {
        ctx.beginPath();
        ctx.moveTo(i, cssH - 42);
        ctx.lineTo(i + 10, cssH - 58);
        ctx.lineTo(i + 20, cssH - 42);
        ctx.closePath();
        ctx.fill();
      }

      if (!answeredRef.current) {
        // Spawn: tiap opsi mendapat jatah bebek, berputar terus.
        spawnTimerRef.current += dt * 16.6667;
        if (spawnTimerRef.current > 700) {
          spawnTimerRef.current = 0;
          const slot = duckIdRef.current % Math.max(1, displayOptions.length);
          spawnDuck(slot, cssW, cssH);
        }
      }

      // Update posisi
      for (const duck of ducksRef.current) {
        duck.x += duck.vx * dt;
        duck.y += duck.vy * dt;
        duck.wing += 0.22 * dt;
        if (duck.y < 70) {
          duck.y = 70;
          duck.vy = Math.abs(duck.vy);
        }
        if (duck.y > cssH - 100) {
          duck.y = cssH - 100;
          duck.vy = -Math.abs(duck.vy);
        }
      }

      // Buang bebek yang keluar layar (nanti di-spawn ulang)
      ducksRef.current = ducksRef.current.filter(
        (d) => d.x > -260 && d.x < cssW + 260
      );

      ducksRef.current.forEach(drawDuck);

      // Efek tembakan
      const splash = splashRef.current;
      if (splash) {
        const age = now - splash.start;
        if (age > 700) {
          splashRef.current = null;
        } else {
          const a = 1 - age / 700;
          ctx.globalAlpha = a;
          ctx.strokeStyle = splash.correct ? '#16a34a' : '#dc2626';
          ctx.lineWidth = 3;
          const r1 = 12 + age * 0.06;
          const r2 = 26 + age * 0.09;
          ctx.beginPath();
          ctx.arc(splash.x, splash.y, r1, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(splash.x, splash.y, r2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = splash.correct ? '#15803d' : '#b91c1c';
          ctx.font = 'bold 16px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(splash.label, splash.x, splash.y - 34);
          ctx.globalAlpha = 1;
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      ro.disconnect();
    };
  }, [displayOptions.length, question.id, spawnDuck]);

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    shootAt(e.clientX - rect.left, e.clientY - rect.top);
  };

  const correctLetter = LETTERS[question.correctOptionIndex ?? 0] || 'A';

  return (
    <div className="space-y-3">
      {/* Papan skor */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1a1a1a] text-white px-3 py-2 border-2 border-[#1a1a1a] font-mono-code">
        <div className="flex items-center gap-4 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <Target className="h-3.5 w-3.5" /> KENA {hits}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-300">
            <Zap className="h-3.5 w-3.5" /> COMBO {combo}x
          </span>
          <span className="inline-flex items-center gap-1 text-rose-300">
            <Crosshair className="h-3.5 w-3.5" /> MELESET {misses}
          </span>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
          Duck Hunt · Pilihan Ganda
        </span>
      </div>

      {/* Arena */}
      <div
        ref={wrapRef}
        className="relative w-full h-[320px] sm:h-[360px] border-4 border-[#1a1a1a] overflow-hidden bg-sky-200"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointer}
          className="block w-full h-full touch-manipulation cursor-crosshair"
        />
        {feedback && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-[#1a1a1a] p-5 text-center max-w-sm w-full">
              <div className="text-2xl font-black mb-1">
                {feedback === 'correct' ? '🎯 TEPAT SASARAN!' : '💥 BELUM TEPAT'}
              </div>
              <div className="font-mono-code text-xs font-bold text-slate-700">
                Jawaban benar: {correctLetter}
              </div>
              <div className="mt-2 text-[11px] text-slate-600">
                Jawabanmu:{' '}
                {displayOptions.find((o) => o.originalIndex === currentAnswer)?.text ?? '-'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border-2 border-[#1a1a1a] p-2.5 text-[11px] font-mono-code leading-snug">
        <strong>Cara main:</strong> tembak (klik/ketuk) bebek yang membawa jawaban benar. Bebek terbang
        terus melintasi langit — sekali jawaban dipilih, jawaban langsung dikunci.
      </div>

      {/* Fallback aksesibilitas: jawaban biasa */}
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
    </div>
  );
};
