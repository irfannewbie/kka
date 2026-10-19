import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_CALCULATOR_MASTER_SEED } from '../src/data/calculatorMasterSeed';
import {
  DEFAULT_QUIZZES_SEED,
  InteractiveQuiz,
  QuizAttemptSubmission,
} from '../src/services/quizStore';
import { DEFAULT_EXCEL_TASKS, DEFAULT_LEARNING_DATASETS } from '../src/services/excelLabStore';
import {
  getDatasetShortKey,
  MasterModeARecord,
  MasterModeBRecord,
  StoredCalculatorDataset,
} from '../src/services/calculatorMasterStore';
import { ExcelTask, ExcelSubmission } from '../src/types/excelLab';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'calculator-master-db.json');
const QUIZ_DB_FILE = path.join(DATA_DIR, 'quizzes-db.json');
const EXCEL_LAB_DB_FILE = path.join(DATA_DIR, 'excel-lab-db.json');

export { getDatasetShortKey, DEFAULT_LEARNING_DATASETS };
export type {
  InteractiveQuiz,
  QuizAttemptSubmission,
  ExcelTask,
  ExcelSubmission,
  MasterModeARecord,
  MasterModeBRecord,
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(file: string, fallback: T): T | null {
  try {
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Failed to read ${path.basename(file)}:`, e);
    return null;
  }
}

function writeJsonFile(file: string, data: unknown): void {
  try {
    ensureDataDir();
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn(`Failed to write ${path.basename(file)}:`, e);
  }
}

// ---------------------------------------------------------------------------
// Excel Lab Database
// ---------------------------------------------------------------------------

export interface ExcelLabDatabaseSchema {
  tasks: ExcelTask[];
  submissions: ExcelSubmission[];
}

export function readExcelLabDb(): ExcelLabDatabaseSchema {
  ensureDataDir();
  const parsed = readJsonFile<Partial<ExcelLabDatabaseSchema>>(EXCEL_LAB_DB_FILE, {});
  if (parsed && Array.isArray(parsed.tasks)) {
    return {
      tasks: parsed.tasks.length > 0 ? parsed.tasks : DEFAULT_EXCEL_TASKS,
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
    };
  }
  return { tasks: DEFAULT_EXCEL_TASKS, submissions: [] };
}

export function writeExcelLabDb(data: ExcelLabDatabaseSchema): void {
  writeJsonFile(EXCEL_LAB_DB_FILE, data);
}

// ---------------------------------------------------------------------------
// Quiz Database
// ---------------------------------------------------------------------------

export interface QuizDatabaseSchema {
  quizzes: InteractiveQuiz[];
  submissions: QuizAttemptSubmission[];
}

export function readQuizDb(): QuizDatabaseSchema {
  ensureDataDir();
  const parsed = readJsonFile<Partial<QuizDatabaseSchema>>(QUIZ_DB_FILE, {});
  if (parsed && Array.isArray(parsed.quizzes)) {
    return {
      quizzes: parsed.quizzes.length > 0 ? parsed.quizzes : DEFAULT_QUIZZES_SEED,
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
    };
  }
  return { quizzes: DEFAULT_QUIZZES_SEED, submissions: [] };
}

export function writeQuizDb(data: QuizDatabaseSchema): void {
  writeJsonFile(QUIZ_DB_FILE, data);
}

// ---------------------------------------------------------------------------
// Calculator Master Database
// ---------------------------------------------------------------------------

export type CalculatorMasterDatabase = Record<string, StoredCalculatorDataset>;

export function readMasterDb(): CalculatorMasterDatabase {
  ensureDataDir();
  const db: CalculatorMasterDatabase = readJsonFile<CalculatorMasterDatabase>(DB_FILE, {}) || {};

  // Pastikan data seed awal selalu terintegrasi apabila belum ada perubahan manual
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
}

export function writeMasterDb(db: CalculatorMasterDatabase): void {
  writeJsonFile(DB_FILE, db);
}
