import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_CALCULATOR_MASTER_SEED } from './src/data/calculatorMasterSeed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'calculator-master-db.json');

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
