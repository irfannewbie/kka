import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_CALCULATOR_MASTER_SEED } from './src/data/calculatorMasterSeed';
import {
  DEFAULT_QUIZZES_SEED,
  InteractiveQuiz,
  QuizAttemptSubmission,
} from './src/services/quizStore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'calculator-master-db.json');
const QUIZ_DB_FILE = path.join(DATA_DIR, 'quizzes-db.json');

interface QuizDatabaseSchema {
  quizzes: InteractiveQuiz[];
  submissions: QuizAttemptSubmission[];
}

function getShortDatasetKeyServer(
  className: string,
  subject: string = 'Informatika',
  assessment: string = 'ASTS Gasal'
): string {
  const rawClass = className.replace(/^Kelas\s*/i, '').trim().toUpperCase();
  const cleanClass = `KELAS_${rawClass}`;
  const cleanSubj = subject.trim().toUpperCase();
  const cleanAssess = assessment.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  return `${cleanClass}_${cleanSubj}_${cleanAssess}`;
}

function readQuizDb(): QuizDatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(QUIZ_DB_FILE)) {
      const raw = fs.readFileSync(QUIZ_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.quizzes)) {
        return {
          quizzes: parsed.quizzes.length > 0 ? parsed.quizzes : DEFAULT_QUIZZES_SEED,
          submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
        };
      }
    }
  } catch (e) {
    console.warn('Failed to read quizzes-db.json:', e);
  }
  return {
    quizzes: DEFAULT_QUIZZES_SEED,
    submissions: [],
  };
}

function writeQuizDb(data: QuizDatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(QUIZ_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to write quizzes-db.json:', e);
  }
}

interface MasterModeARecord {
  benarPG: number | null;
  benarMJ: number | null;
  skorUraian: number | null;
  remedialScore: number | null;
  isManual?: boolean;
}

interface StoredCalculatorDataset {
  modeAData: Record<string, MasterModeARecord>;
  modeBData: Record<string, any>;
  standarData: Record<string, number | null>;
  updatedAt: string;
}

function readMasterDb(): Record<string, StoredCalculatorDataset> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let db: Record<string, StoredCalculatorDataset> = {};
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw) || {};
    }

    // Pastikan data seed awal selalu terintegrasi apabila belum ada perubahan manual untuk nomor absen tersebut
    Object.entries(INITIAL_CALCULATOR_MASTER_SEED).forEach(([shortKey, seedMap]) => {
      const existing = db[shortKey] || {
        modeAData: {},
        modeBData: {},
        standarData: {},
        updatedAt: '',
      };
      const mergedModeA: Record<string, MasterModeARecord> = {};
      Object.entries(seedMap).forEach(([att, rec]) => {
        mergedModeA[String(parseInt(att, 10) || att)] = { ...rec, isManual: true };
      });
      Object.entries(existing.modeAData || {}).forEach(([att, rec]) => {
        if (rec && rec.isManual) {
          mergedModeA[String(parseInt(att, 10) || att)] = { ...rec, isManual: true };
        }
      });
      db[shortKey] = {
        ...existing,
        modeAData: mergedModeA,
      };
    });

    return db;
  } catch (e) {
    console.warn('Failed to read calculator-master-db.json:', e);
    return {};
  }
}

function writeMasterDb(db: Record<string, StoredCalculatorDataset>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to write calculator-master-db.json:', e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // 1. GET seluruh dataset Kalkulator Master
  app.get('/api/calculator-master', (_req, res) => {
    const db = readMasterDb();
    res.json({ success: true, datasets: db });
  });

  // 2. POST update satu dataset (saat guru mengedit di Kalkulator Akademik)
  app.post('/api/calculator-master', (req, res) => {
    const { datasetKey, dataset } = req.body || {};
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
    Object.entries((dataset.modeAData || {}) as Record<string, MasterModeARecord>).forEach(
      ([att, rec]) => {
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
      }
    );

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
  app.post('/api/calculator-master/bulk', (req, res) => {
    const { datasets } = req.body || {};
    const db = readMasterDb();

    if (datasets && typeof datasets === 'object') {
      Object.entries(datasets as Record<string, StoredCalculatorDataset>).forEach(
        ([shortKey, incoming]) => {
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
        }
      );
      writeMasterDb(db);
    }

    res.json({ success: true, datasets: db });
  });

  // 4. GET daftar kuis interaktif & seluruh hasil pengerjaan siswa
  app.get('/api/quizzes', (_req, res) => {
    const qdb = readQuizDb();
    res.json({ success: true, quizzes: qdb.quizzes, submissions: qdb.submissions });
  });

  // 5. POST simpan / update kuis interaktif
  app.post('/api/quizzes/save', (req, res) => {
    const { quiz } = req.body || {};
    if (!quiz || !quiz.id) {
      res.status(400).json({ success: false, message: 'Data kuis tidak valid' });
      return;
    }
    const qdb = readQuizDb();
    const idx = qdb.quizzes.findIndex((q) => q.id === quiz.id);
    if (idx >= 0) {
      qdb.quizzes[idx] = quiz;
    } else {
      qdb.quizzes.unshift(quiz);
    }
    writeQuizDb(qdb);
    res.json({ success: true, quizzes: qdb.quizzes });
  });

  // 6. DELETE hapus paket kuis interaktif
  app.delete('/api/quizzes/:quizId', (req, res) => {
    const { quizId } = req.params;
    const qdb = readQuizDb();
    qdb.quizzes = qdb.quizzes.filter((q) => q.id !== quizId);
    writeQuizDb(qdb);
    res.json({ success: true, quizzes: qdb.quizzes });
  });

  // 7. POST submit pengerjaan kuis siswa & sinkron otomatis ke database Kalkulator Akademik
  app.post('/api/quizzes/submit', (req, res) => {
    const { submission } = req.body || {};
    if (!submission || !submission.quizId || !submission.className || !submission.attendanceNo) {
      res.status(400).json({ success: false, message: 'Data pengumpulan kuis tidak lengkap' });
      return;
    }

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

    // Otomatis simpan juga ke calculator-master-db.json
    try {
      const masterDb = readMasterDb();
      const shortKey = getShortDatasetKeyServer(
        submission.className,
        submission.subject,
        submission.assessment
      );
      const existing = masterDb[shortKey] || {
        modeAData: {},
        modeBData: {},
        standarData: {},
        updatedAt: '',
      };
      const attKey = String(parseInt(String(submission.attendanceNo), 10) || submission.attendanceNo);
      const prevRec = existing.modeAData?.[attKey] || {
        benarPG: null,
        benarMJ: null,
        skorUraian: null,
        remedialScore: null,
        isManual: true,
      };

      if (submission.isRemedial) {
        existing.modeAData[attKey] = {
          benarPG: prevRec.benarPG ?? submission.calcBenarPG,
          benarMJ: prevRec.benarMJ ?? submission.calcBenarMJ,
          skorUraian: prevRec.skorUraian ?? submission.calcSkorUraian,
          remedialScore: Math.max(prevRec.remedialScore ?? 0, submission.finalScore),
          isManual: true,
        };
      } else {
        existing.modeAData[attKey] = {
          benarPG: submission.calcBenarPG,
          benarMJ: submission.calcBenarMJ,
          skorUraian: submission.calcSkorUraian,
          remedialScore: prevRec.remedialScore,
          isManual: true,
        };
      }
      existing.standarData = {
        ...(existing.standarData || {}),
        [attKey]: submission.isRemedial
          ? Math.max(existing.standarData?.[attKey] ?? 0, submission.finalScore)
          : submission.finalScore,
      };
      existing.updatedAt = new Date().toLocaleTimeString('id-ID');
      masterDb[shortKey] = existing;
      writeMasterDb(masterDb);
    } catch (err) {
      console.warn('Auto-sync quiz submission to masterDb warning:', err);
    }

    res.json({ success: true, submissions: qdb.submissions });
  });

  // 8. POST reset percobaan kuis siswa (agar siswa bisa mengerjakan ulang)
  app.post('/api/quizzes/reset-attempt', (req, res) => {
    const { quizId, className, attendanceNo } = req.body || {};
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

  // Vite middleware untuk development atau static dist untuk production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
