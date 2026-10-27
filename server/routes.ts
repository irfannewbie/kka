import type { Express, Request, Response } from 'express';
import {
  readMasterDb,
  writeMasterDb,
  readQuizDb,
  writeQuizDb,
  readExcelLabDb,
  writeExcelLabDb,
  getDatasetShortKey,
  DEFAULT_LEARNING_DATASETS,
  MasterModeARecord,
  MasterModeBRecord,
} from './db';
import {
  ADMIN_TOKEN,
  asBoundedString,
  asFiniteNumber,
  asNonEmptyString,
  createRateLimiter,
  missingFields,
  requireAdminToken,
} from './security';
import { syncQuizSubmissionToGoogleSheet } from './googleSheets';

interface StoredCalculatorDatasetBody {
  modeAData?: Record<string, MasterModeARecord>;
  modeBData?: Record<string, MasterModeBRecord>;
  standarData?: Record<string, number | null>;
  updatedAt?: string;
}

/**
 * Daftarkan seluruh endpoint /api/* dengan lapisan keamanan:
 *  - Rate limiting (umum) + rate limit ketat untuk pengumpulan siswa
 *  - Token admin untuk endpoint yang mengubah/membaca data sensitif
 *  - Validasi payload minimum
 */
export function registerApiRoutes(app: Express): void {
  // Batas umum: 300 req/menit/IP; ketat: 20 req/5 menit/IP untuk submit siswa.
  const apiLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 300,
    keyPrefix: 'api',
  });
  const submitLimiter = createRateLimiter({
    windowMs: 5 * 60_000,
    max: 20,
    keyPrefix: 'submit',
  });

  app.use('/api', apiLimiter);

  // Kesehatan server (dipakai untuk pengecekan deploy/monitoring)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ success: true, status: 'ok', adminTokenConfigured: Boolean(ADMIN_TOKEN) });
  });

  // =========================================================================
  // KALKULATOR MASTER (data nilai sensitif -> admin only)
  // =========================================================================

  // 1. GET seluruh dataset Kalkulator Master
  app.get('/api/calculator-master', requireAdminToken, (_req: Request, res: Response) => {
    const db = readMasterDb();
    res.json({ success: true, datasets: db });
  });

  // 2. POST update satu dataset (saat guru mengedit di Kalkulator Akademik)
  app.post('/api/calculator-master', requireAdminToken, (req: Request, res: Response) => {
    const { datasetKey, dataset } = (req.body || {}) as {
      datasetKey?: string;
      dataset?: StoredCalculatorDatasetBody;
    };
    if (!datasetKey || !dataset) {
      res.status(400).json({ success: false, message: 'Missing datasetKey or dataset' });
      return;
    }

    const db = readMasterDb();
    const existing = db[datasetKey] || {
      modeAData: {},
      modeBData: {},
      standarData: {},
      updatedAt: '',
    };

    const mergedModeA: Record<string, MasterModeARecord> = { ...(existing.modeAData || {}) };
    Object.entries(dataset.modeAData || {}).forEach(([att, rec]) => {
      if (!rec) return;
      const cleanAtt = String(parseInt(att, 10) || att);
      if (rec.isManual) {
        const allNull =
          rec.benarPG === null &&
          rec.benarMJ === null &&
          rec.skorUraian === null &&
          rec.remedialScore === null;
        if (allNull) {
          delete mergedModeA[cleanAtt];
        } else {
          mergedModeA[cleanAtt] = { ...rec, isManual: true };
        }
      }
    });

    db[datasetKey] = {
      modeAData: mergedModeA,
      modeBData: { ...(existing.modeBData || {}), ...(dataset.modeBData || {}) },
      standarData: { ...(existing.standarData || {}), ...(dataset.standarData || {}) },
      updatedAt: dataset.updatedAt || new Date().toLocaleTimeString('id-ID'),
    };

    writeMasterDb(db);
    res.json({ success: true, dataset: db[datasetKey] });
  });

  // 3. POST bulk sync (menggabungkan seluruh data manual dari localStorage browser guru ke server)
  app.post('/api/calculator-master/bulk', requireAdminToken, (req: Request, res: Response) => {
    const { datasets } = (req.body || {}) as {
      datasets?: Record<string, StoredCalculatorDatasetBody>;
    };
    const db = readMasterDb();

    if (datasets && typeof datasets === 'object') {
      Object.entries(datasets).forEach(([shortKey, incoming]) => {
        if (!incoming || typeof incoming !== 'object') return;
        const existing = db[shortKey] || {
          modeAData: {},
          modeBData: {},
          standarData: {},
          updatedAt: '',
        };

        const mergedModeA: Record<string, MasterModeARecord> = {
          ...(existing.modeAData || {}),
        };
        Object.entries(incoming.modeAData || {}).forEach(([att, rec]) => {
          if (rec && rec.isManual) {
            const cleanAtt = String(parseInt(att, 10) || att);
            const hasAny =
              rec.benarPG !== null ||
              rec.benarMJ !== null ||
              rec.skorUraian !== null ||
              rec.remedialScore !== null;
            if (hasAny) {
              mergedModeA[cleanAtt] = { ...rec, isManual: true };
            }
          }
        });

        db[shortKey] = {
          modeAData: mergedModeA,
          modeBData: { ...(existing.modeBData || {}), ...(incoming.modeBData || {}) },
          standarData: { ...(existing.standarData || {}), ...(incoming.standarData || {}) },
          updatedAt: incoming.updatedAt || existing.updatedAt || '',
        };
      });
      writeMasterDb(db);
    }

    res.json({ success: true, datasets: db });
  });

  // =========================================================================
  // KUIS INTERAKTIF
  // =========================================================================

  // 4. GET daftar kuis interaktif & seluruh hasil pengerjaan siswa
  app.get('/api/quizzes', (_req: Request, res: Response) => {
    const qdb = readQuizDb();
    res.json({ success: true, quizzes: qdb.quizzes, submissions: qdb.submissions });
  });

  // 5. POST simpan / update kuis interaktif (guru)
  app.post('/api/quizzes/save', requireAdminToken, (req: Request, res: Response) => {
    const { quiz } = (req.body || {}) as { quiz?: { id?: string } & Record<string, unknown> };
    if (!quiz || typeof quiz.id !== 'string' || !quiz.id.trim()) {
      res.status(400).json({ success: false, message: 'Data kuis tidak valid' });
      return;
    }
    const qdb = readQuizDb();
    const idx = qdb.quizzes.findIndex((q) => q.id === quiz.id);
    if (idx >= 0) {
      qdb.quizzes[idx] = quiz as never;
    } else {
      qdb.quizzes.unshift(quiz as never);
    }
    writeQuizDb(qdb);
    res.json({ success: true, quizzes: qdb.quizzes });
  });

  // 6. DELETE hapus paket kuis interaktif (guru)
  app.delete('/api/quizzes/:quizId', requireAdminToken, (req: Request, res: Response) => {
    const { quizId } = req.params;
    const qdb = readQuizDb();
    qdb.quizzes = qdb.quizzes.filter((q) => q.id !== quizId);
    writeQuizDb(qdb);
    res.json({ success: true, quizzes: qdb.quizzes });
  });

  // 7. POST submit pengerjaan kuis siswa & sinkron otomatis ke database Kalkulator Akademik
  app.post('/api/quizzes/submit', submitLimiter, async (req: Request, res: Response) => {
    const raw = (req.body || {}).submission as Record<string, unknown> | undefined;
    const missing = missingFields(raw, ['quizId', 'className', 'attendanceNo', 'studentName']);
    const finalScore = raw ? asFiniteNumber(raw.finalScore) : null;
    if (!raw || missing.length > 0 || finalScore === null) {
      res.status(400).json({
        success: false,
        message: 'Data pengumpulan kuis tidak lengkap atau tidak valid',
        missingFields: missing,
      });
      return;
    }

    // Batasi panjang string yang disimpan agar database tidak bisa diisi limbah.
    const submission = {
      ...raw,
      quizId: asNonEmptyString(raw.quizId, 128) || '',
      quizTitle: asBoundedString(raw.quizTitle, 300) ?? '',
      className: asNonEmptyString(raw.className, 32) || '',
      studentName: asNonEmptyString(raw.studentName, 150) || '',
      attendanceNo: asFiniteNumber(raw.attendanceNo) ?? 0,
      subject: asBoundedString(raw.subject, 100) ?? '',
      assessment: asBoundedString(raw.assessment, 100) ?? '',
      tokenPin: asBoundedString(raw.tokenPin, 32) ?? '',
      finalScore,
    } as Parameters<typeof writeQuizDb>[0]['submissions'][number];

    const qdb = readQuizDb();
    const filtered = qdb.submissions.filter(
      (s) =>
        !(
          s.quizId === submission.quizId &&
          s.className === submission.className &&
          Number(s.attendanceNo) === Number(submission.attendanceNo)
        )
    );
    qdb.submissions = [submission, ...filtered];
    writeQuizDb(qdb);

    // Otomatis simpan juga ke calculator-master-db.json.
    // Mode Practice hanya untuk latihan, jadi tidak boleh mengubah nilai akademik.
    if (raw.mode !== 'practice') {
      try {
        const masterDb = readMasterDb();
      const shortKey = getDatasetShortKey(
        submission.className,
        submission.subject || 'Informatika',
        submission.assessment || 'ASTS Gasal'
      );
      const existing = masterDb[shortKey] || {
        modeAData: {},
        modeBData: {},
        standarData: {},
        updatedAt: '',
      };
      const attKey = String(
        parseInt(String(submission.attendanceNo), 10) || submission.attendanceNo
      );
      const prevRec = existing.modeAData?.[attKey] || {
        benarPG: null,
        benarMJ: null,
        skorUraian: null,
        remedialScore: null,
        isManual: true,
      };

      if (submission.isRemedial) {
        existing.modeAData[attKey] = {
          benarPG: prevRec.benarPG ?? asFiniteNumber(submission.calcBenarPG),
          benarMJ: prevRec.benarMJ ?? asFiniteNumber(submission.calcBenarMJ),
          skorUraian: prevRec.skorUraian ?? asFiniteNumber(submission.calcSkorUraian),
          remedialScore: Math.max(prevRec.remedialScore ?? 0, finalScore),
          isManual: true,
        };
      } else {
        existing.modeAData[attKey] = {
          benarPG: asFiniteNumber(submission.calcBenarPG),
          benarMJ: asFiniteNumber(submission.calcBenarMJ),
          skorUraian: asFiniteNumber(submission.calcSkorUraian),
          remedialScore: prevRec.remedialScore,
          isManual: true,
        };
      }
      existing.standarData = {
        ...(existing.standarData || {}),
        [attKey]: submission.isRemedial
          ? Math.max(existing.standarData?.[attKey] ?? 0, finalScore)
          : finalScore,
      };
      existing.updatedAt = new Date().toLocaleTimeString('id-ID');
      masterDb[shortKey] = existing;
      writeMasterDb(masterDb);
      } catch (err) {
        console.warn('Auto-sync quiz submission to masterDb warning:', err);
      }
    }

    // Auto-sync ke Google Spreadsheet (Service Account) hanya jika diminta (syncToSheet true).
    // Sesuai permintaan: setelah kuis selesai, baru bisa dimasukkan ke Google Spreadsheet.
    const shouldSyncSheet = (req.body as any)?.syncToSheet === true;
    if (shouldSyncSheet && raw.mode !== 'practice') {
      try {
        await syncQuizSubmissionToGoogleSheet({
          quizId: submission.quizId,
          quizTitle: submission.quizTitle,
          className: submission.className,
          subject: submission.subject,
          assessment: submission.assessment,
          attendanceNo: Number(submission.attendanceNo),
          studentName: submission.studentName,
          calcBenarPG: submission.calcBenarPG as number | null | undefined,
          calcBenarMJ: submission.calcBenarMJ as number | null | undefined,
          calcSkorUraian: submission.calcSkorUraian as number | null | undefined,
          isRemedial: submission.isRemedial,
          remedialScore: (submission as any).remedialScore ?? null,
          finalScore,
        });
      } catch (err) {
        console.warn('Auto-sync to Google Sheet failed:', err);
      }
    }

    res.json({ success: true, submissions: qdb.submissions });
  });

  // 8b. POST kirim nilai kuis yang sudah selesai ke Google Spreadsheet (manual oleh guru)
  app.post('/api/quizzes/sync-to-sheet', requireAdminToken, async (req: Request, res: Response) => {
    const { submissions } = (req.body || {}) as { submissions?: any[] };
    if (!Array.isArray(submissions) || submissions.length === 0) {
      res.status(400).json({ success: false, message: 'Tidak ada data nilai kuis untuk dikirim.' });
      return;
    }
    let successCount = 0;
    let failCount = 0;
    for (const sub of submissions) {
      if (sub?.mode === 'practice') continue;
      try {
        const r = await syncQuizSubmissionToGoogleSheet({
          quizId: sub.quizId,
          quizTitle: sub.quizTitle,
          className: sub.className,
          subject: sub.subject,
          assessment: sub.assessment,
          attendanceNo: Number(sub.attendanceNo),
          studentName: sub.studentName,
          calcBenarPG: sub.calcBenarPG,
          calcBenarMJ: sub.calcBenarMJ,
          calcSkorUraian: sub.calcSkorUraian,
          isRemedial: sub.isRemedial,
          remedialScore: sub.remedialScore ?? null,
          finalScore: sub.finalScore,
        });
        if (r.success) successCount += 1;
        else failCount += 1;
      } catch {
        failCount += 1;
      }
    }
    res.json({
      success: failCount === 0,
      message: `Berhasil mengirim ${successCount} nilai ke Google Spreadsheet Rincian_Kalkulator${failCount > 0 ? `, ${failCount} gagal` : ''}.`,
    });
  });

  // 8. POST reset percobaan kuis siswa (agar siswa bisa mengerjakan ulang)
  app.post('/api/quizzes/reset-attempt', requireAdminToken, (req: Request, res: Response) => {
    const { quizId, className, attendanceNo } = (req.body || {}) as Record<string, unknown>;
    const qdb = readQuizDb();
    qdb.submissions = qdb.submissions.filter(
      (s) =>
        !(
          s.quizId === quizId &&
          s.className === className &&
          Number(s.attendanceNo) === Number(attendanceNo)
        )
    );
    writeQuizDb(qdb);
    res.json({ success: true, submissions: qdb.submissions });
  });

  // =========================================================================
  // LAB EXCEL
  // =========================================================================

  // 9. GET Excel Lab tasks, submissions & datasets
  app.get('/api/excel-lab/data', (_req: Request, res: Response) => {
    const eldb = readExcelLabDb();
    res.json({
      success: true,
      tasks: eldb.tasks,
      submissions: eldb.submissions,
      datasets: DEFAULT_LEARNING_DATASETS,
    });
  });

  // 10. POST submit Excel Lab task by student
  app.post('/api/excel-lab/submit', submitLimiter, (req: Request, res: Response) => {
    const raw = (req.body || {}).submission as Record<string, unknown> | undefined;
    const missing = missingFields(raw, ['taskId', 'className', 'attendanceNo']);
    if (!raw || missing.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Data submission tidak lengkap',
        missingFields: missing,
      });
      return;
    }
    const submission = {
      ...raw,
      taskId: asNonEmptyString(raw.taskId, 128) || '',
      className: asNonEmptyString(raw.className, 32) || '',
      studentName: asBoundedString(raw.studentName, 150) ?? '',
    } as Parameters<typeof writeExcelLabDb>[0]['submissions'][number];

    const eldb = readExcelLabDb();
    const filtered = eldb.submissions.filter(
      (s) =>
        !(
          s.taskId === submission.taskId &&
          s.className === submission.className &&
          Number(s.attendanceNo) === Number(submission.attendanceNo)
        )
    );
    eldb.submissions = [submission, ...filtered];
    writeExcelLabDb(eldb);
    res.json({ success: true, submissions: eldb.submissions });
  });

  // 11. POST create or update Excel Lab task (guru)
  app.post('/api/excel-lab/tasks', requireAdminToken, (req: Request, res: Response) => {
    const { task } = (req.body || {}) as { task?: { id?: string } & Record<string, unknown> };
    if (!task || typeof task.id !== 'string' || !task.id.trim()) {
      res.status(400).json({ success: false, message: 'Data tugas Excel tidak valid' });
      return;
    }
    const eldb = readExcelLabDb();
    const idx = eldb.tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      eldb.tasks[idx] = task as never;
    } else {
      eldb.tasks.unshift(task as never);
    }
    writeExcelLabDb(eldb);
    res.json({ success: true, tasks: eldb.tasks });
  });

  // 12. DELETE Excel Lab task (guru)
  app.delete('/api/excel-lab/tasks/:taskId', requireAdminToken, (req: Request, res: Response) => {
    const { taskId } = req.params;
    const eldb = readExcelLabDb();
    eldb.tasks = eldb.tasks.filter((t) => t.id !== taskId);
    writeExcelLabDb(eldb);
    res.json({ success: true, tasks: eldb.tasks });
  });

  // 13. POST grade / feedback Excel Lab submission (guru)
  app.post('/api/excel-lab/grade', requireAdminToken, (req: Request, res: Response) => {
    const { submissionId, finalScore, teacherFeedback, gradedBy } = (req.body || {}) as Record<
      string,
      unknown
    >;
    const score = asFiniteNumber(finalScore);
    const id = asNonEmptyString(submissionId, 128);
    if (!id || score === null) {
      res.status(400).json({ success: false, message: 'submissionId / finalScore tidak valid' });
      return;
    }
    const eldb = readExcelLabDb();
    const target = eldb.submissions.find((s) => s.id === id);
    if (!target) {
      res.status(404).json({ success: false, message: 'Pengumpulan tidak ditemukan' });
      return;
    }
    target.finalScore = score;
    target.teacherFeedback = asBoundedString(teacherFeedback, 2000) ?? target.teacherFeedback;
    target.gradedAt = new Date().toLocaleString('id-ID');
    target.gradedBy = asNonEmptyString(gradedBy, 100) || 'Guru Informatika';
    target.isPassed = target.finalScore >= 75;
    writeExcelLabDb(eldb);
    res.json({ success: true, submissions: eldb.submissions });
  });

  // 14. POST reset Excel Lab submission (guru)
  app.post('/api/excel-lab/reset-submission', requireAdminToken, (req: Request, res: Response) => {
    const submissionId = asNonEmptyString((req.body || {}).submissionId, 128);
    if (!submissionId) {
      res.status(400).json({ success: false, message: 'submissionId tidak valid' });
      return;
    }
    const eldb = readExcelLabDb();
    eldb.submissions = eldb.submissions.filter((s) => s.id !== submissionId);
    writeExcelLabDb(eldb);
    res.json({ success: true, submissions: eldb.submissions });
  });

  // 404 untuk endpoint API yang tidak dikenal
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'Endpoint API tidak ditemukan' });
  });
}

/**
 * Error handler global API (dipasang setelah seluruh route).
 */
export function apiErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // Parameter `next` wajib ada agar Express mengenali ini sebagai error handler 4-arg.
  _next: unknown
): void {
  const message = err instanceof Error ? err.message : 'Terjadi kesalahan server';
  console.error('[API Error]', message);
  if (res.headersSent) return;
  res.status(500).json({ success: false, message: 'Kesalahan server internal', detail: message });
}
