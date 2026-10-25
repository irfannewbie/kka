import React from 'react';
import { ArrowLeft, FileText, Info, Printer } from 'lucide-react';
import { InteractiveQuiz, QuizQuestion } from '../../services/quizStore';

interface PaperQuizSheetProps {
  quiz: InteractiveQuiz;
  className: string;
  studentName: string;
  attendanceNo: number;
  onBack: () => void;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Rotasi deterministik agar blok Parsons tidak tercetak dalam urutan jawaban. */
function rotateBlocks(question: QuizQuestion, attendanceNo: number): string[] {
  const blocks = question.parsonsBlocks || [];
  if (blocks.length <= 1) return blocks;
  const shift = (Math.abs(attendanceNo) % (blocks.length - 1)) + 1;
  return [...blocks.slice(shift), ...blocks.slice(0, shift)];
}

function questionTypeLabel(type: QuizQuestion['type']): string {
  if (type === 'pg' || type === 'code_output') return 'PILIHAN GANDA';
  if (type === 'matching') return 'MENJODOHKAN';
  if (type === 'parsons') return 'SUSUN URUTAN';
  return 'URAIAN';
}

function buildQuestionBlocks(quiz: InteractiveQuiz, attendanceNo: number): string {
  return quiz.questions
    .map((q, idx) => {
      const code = q.codeSnippet
        ? `<pre class="code">${escapeHtml(q.codeSnippet)}</pre>`
        : '';

      let body = '';
      if ((q.type === 'pg' || q.type === 'code_output') && q.options) {
        body = `<ol class="options" type="A">${q.options
          .map((opt) => `<li>${escapeHtml(opt)}</li>`)
          .join('')}</ol>`;
      } else if (q.type === 'matching' && q.matchingPairs) {
        body = `
          <table class="match">
            <thead><tr><th>Konsep (Kiri)</th><th>Pasangan (Kanan)</th></tr></thead>
            <tbody>
              ${q.matchingPairs
                .map(
                  (p) =>
                    `<tr><td>${escapeHtml(p.leftText)}</td><td>${escapeHtml(
                      p.rightText
                    )}</td></tr>`
                )
                .join('')}
            </tbody>
          </table>
          <p class="hint">Tulis pasangan huruf jawaban pada lembar jawaban.</p>`;
      } else if (q.type === 'parsons' && q.parsonsBlocks) {
        body = `<ol class="blocks" type="A">${rotateBlocks(q, attendanceNo)
          .map((block) => `<li>${escapeHtml(block)}</li>`)
          .join('')}</ol>
          <p class="hint">Tuliskan urutan huruf blok yang benar pada lembar jawaban.</p>`;
      } else if (q.type === 'essay') {
        body = `<div class="essay-lines">${'<span></span>'.repeat(5)}</div>`;
      }

      return `
        <article class="question">
          <div class="q-head">
            <span class="q-no">${idx + 1}</span>
            <span class="q-type">${questionTypeLabel(q.type)}</span>
          </div>
          <p class="q-text">${escapeHtml(q.questionText)}</p>
          ${code}
          ${body}
        </article>`;
    })
    .join('');
}

function buildPaperHtml(
  quiz: InteractiveQuiz,
  className: string,
  studentName: string,
  attendanceNo: number
): string {
  const answerRows = quiz.questions
    .map(
      (q, idx) => `
        <tr>
          <td class="center">${idx + 1}</td>
          <td class="center">${questionTypeLabel(q.type)}</td>
          <td class="answer-cell"></td>
        </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Lembar Kuis Kertas - ${escapeHtml(quiz.title)}</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #1a1a1a; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; }
  .sheet { max-width: 190mm; margin: 0 auto; }
  .head { border: 2px solid #1a1a1a; padding: 10px 12px; margin-bottom: 10px; }
  .eyebrow { font-family: 'Courier New', monospace; font-size: 8pt; font-weight: bold; letter-spacing: .08em; text-transform: uppercase; }
  h1 { font-size: 16pt; margin: 4px 0 2px; }
  .meta { font-family: 'Courier New', monospace; font-size: 9pt; }
  .identity { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0; }
  .identity div { border: 1px solid #1a1a1a; padding: 6px 8px; min-height: 28px; }
  .note { border: 1px solid #1a1a1a; background: #f3f1ed; padding: 6px 8px; font-size: 9pt; margin: 8px 0 12px; }
  .question { break-inside: avoid; border-top: 1px solid #1a1a1a; padding: 9px 0; }
  .q-head { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
  .q-no { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border: 1px solid #1a1a1a; font-weight: bold; font-size: 9pt; }
  .q-type { font-family: 'Courier New', monospace; font-size: 8pt; font-weight: bold; }
  .q-text { margin: 3px 0 5px; font-weight: bold; }
  .options { margin: 4px 0 2px 20px; padding: 0; }
  .options li { margin: 1px 0; }
  .blocks { margin: 4px 0 2px 20px; padding: 0; }
  .blocks li { margin: 2px 0; font-family: 'Courier New', monospace; font-size: 9.5pt; }
  .code { border: 1px solid #1a1a1a; background: #f7f7f7; padding: 6px; font-family: 'Courier New', monospace; font-size: 8.5pt; white-space: pre-wrap; }
  .match { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 9.5pt; }
  .match th, .match td { border: 1px solid #1a1a1a; padding: 4px 6px; text-align: left; vertical-align: top; }
  .hint { font-family: 'Courier New', monospace; font-size: 8pt; margin: 2px 0; }
  .essay-lines span { display: block; border-bottom: 1px solid #777; height: 18px; }
  .answer-sheet { break-before: page; border: 2px solid #1a1a1a; padding: 10px 12px; }
  .answer-sheet h2 { font-size: 14pt; margin: 0 0 6px; }
  .answer-table { width: 100%; border-collapse: collapse; }
  .answer-table th, .answer-table td { border: 1px solid #1a1a1a; padding: 5px 6px; }
  .answer-table th { background: #f3f1ed; font-size: 9pt; }
  .center { text-align: center; }
  .answer-cell { height: 24px; }
  .footer { margin-top: 10px; font-family: 'Courier New', monospace; font-size: 8pt; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <main class="sheet">
    <header class="head">
      <div class="eyebrow">SMP NEGERI 1 WEDI · MODE KERTAS · TANPA NILAI DIGITAL</div>
      <h1>${escapeHtml(quiz.title)}</h1>
      <div class="meta">PIN: ${escapeHtml(quiz.tokenPin)} · ${quiz.questions.length} SOAL · ${escapeHtml(
        quiz.subject === 'Koding' ? 'KKA' : 'Informatika'
      )} · ${escapeHtml(quiz.assessment)}</div>
    </header>

    <section class="identity">
      <div><strong>Nama:</strong> ${escapeHtml(studentName)}</div>
      <div><strong>Kelas:</strong> ${escapeHtml(className)}</div>
      <div><strong>No. Absen:</strong> ${escapeHtml(String(attendanceNo))}</div>
      <div><strong>Tanggal:</strong> ____________________</div>
    </section>

    <div class="note">
      <strong>Petunjuk:</strong> Kerjakan pada lembar jawaban di halaman terakhir. Mode kertas tidak
      mengirim jawaban ke server dan tidak mengubah Kalkulator Akademik. Guru menilai lembar jawaban
      secara manual atau memindai jawaban sesuai prosedur kelas.
    </div>

    ${buildQuestionBlocks(quiz, attendanceNo)}

    <section class="answer-sheet">
      <h2>LEMBAR JAWABAN</h2>
      <p class="hint">Tulis jawaban pilihan ganda (A/B/C/D), pasangan, urutan, atau uraian pada kolom yang tersedia.</p>
      <table class="answer-table">
        <thead><tr><th style="width:12%">No.</th><th style="width:30%">Jenis</th><th>Jawaban</th></tr></thead>
        <tbody>${answerRows}</tbody>
      </table>
      <div class="footer">
        <span>${escapeHtml(quiz.title)}</span>
        <span>PIN ${escapeHtml(quiz.tokenPin)} · ${escapeHtml(className)} · Absen ${escapeHtml(
          String(attendanceNo)
        )}</span>
      </div>
    </section>
  </main>
</body>
</html>`;
}

function printHtml(html: string): void {
  if (typeof document === 'undefined') return;
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.title = 'Pratinjau lembar kertas';
  frame.style.cssText =
    'position:fixed;left:-10000px;top:0;width:900px;height:1200px;border:0;background:#fff;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const trigger = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      window.setTimeout(() => frame.remove(), 60_000);
    }
  };
  frame.contentWindow?.addEventListener('afterprint', () => frame.remove(), { once: true });
  window.setTimeout(trigger, 350);
}

export const PaperQuizSheet: React.FC<PaperQuizSheetProps> = ({
  quiz,
  className,
  studentName,
  attendanceNo,
  onBack,
}) => {
  const paperHtml = buildPaperHtml(quiz, className, studentName, attendanceNo);

  return (
    <div className="space-y-5 pb-16 font-sans">
      <div className="bg-[#1a1a1a] text-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#f59e0b] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-mono-code text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              MODE KERTAS · PAPER MODE · TANPA NILAI DIGITAL
            </div>
            <h2 className="font-serif-display italic font-bold text-2xl sm:text-3xl">
              Lembar Soal Cetak
            </h2>
            <p className="font-mono-code text-xs text-slate-300 mt-1">
              {quiz.title} · {quiz.questions.length} soal · PIN {quiz.tokenPin}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 font-mono-code">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/40 cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> KEMBALI
            </button>
            <button
              type="button"
              onClick={() => printHtml(paperHtml)}
              className="px-3.5 py-2 text-xs font-black bg-amber-400 hover:bg-amber-300 text-[#1a1a1a] border-2 border-white cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" /> CETAK LEMBAR SOAL
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border-2 border-[#1a1a1a] p-4 font-mono-code text-xs text-slate-700 flex gap-2">
        <Info className="h-4 w-4 shrink-0 text-blue-700" />
        <p>
          Mode Kertas cocok untuk kelas tanpa perangkat. Soal dan lembar jawaban dicetak, lalu
          dinilai manual oleh guru. Halaman ini tidak mengirim jawaban dan tidak mengubah nilai
          akademik.
        </p>
      </div>

      <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-3 sm:p-5">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b-2 border-[#1a1a1a] font-mono-code text-xs font-bold">
          <FileText className="h-4 w-4 text-[#2e59e6]" />
          PRATINJAU LEMBAR (A4)
        </div>
        <iframe
          title={`Pratinjau lembar kertas ${quiz.title}`}
          srcDoc={paperHtml}
          sandbox=""
          className="w-full h-[70vh] bg-white border border-[#1a1a1a]"
        />
      </div>
    </div>
  );
};
