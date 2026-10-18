export type CellFormatType = 'general' | 'number' | 'currency' | 'percent' | 'text';
export type CellAlignment = 'left' | 'center' | 'right';

export interface ExcelCellData {
  raw: string; // The formula or text entered, e.g. "=SUM(B2:B5)" or "150000" or "Lulus"
  computed?: string | number | boolean | null; // Evaluated value
  format?: CellFormatType;
  bold?: boolean;
  italic?: boolean;
  align?: CellAlignment;
  bg?: string; // Hex color or Tailwind class
  color?: string; // Text color
  isError?: boolean;
  errorMessage?: string;
}

export interface ExcelSheetData {
  id: string;
  name: string;
  cells: Record<string, ExcelCellData>; // Keyed by cell ref like "A1", "B2", "AA10"
  rowCount: number; // default 50
  colCount: number; // default 26 (A-Z)
}

export interface ExcelWorkbookData {
  id: string;
  title: string;
  sheets: ExcelSheetData[];
  activeSheetId: string;
  lastModified?: string;
}

export interface ExcelTargetEvaluation {
  id: string;
  sheetName: string;
  cellRef: string; // e.g. "E4"
  description: string; // e.g. "Hitung total nilai menggunakan rumus =SUM(...)"
  expectedFormulaPatterns?: string[]; // Regex or string patterns that formula must match, e.g. ["^=SUM\\(", "B4:D4"]
  expectedValue?: any; // The expected computed result, e.g. 265
  tolerance?: number; // Numeric tolerance if decimal, default 0.05
  points: number; // e.g. 10
  hint?: string; // Hint shown if student asks for guidance
}

export interface ExcelTask {
  id: string;
  title: string;
  category: 'Dasar' | 'Statistik' | 'Logika IF' | 'Lookup' | 'Teks' | 'Ujian Praktek';
  gradeLevel: '7' | '8' | 'ALL';
  targetClasses: string[];
  description: string;
  instructions: string[];
  starterWorkbook: ExcelWorkbookData;
  targetEvaluations: ExcelTargetEvaluation[];
  maxScore: number;
  kktp: number; // default 75
  isActive: boolean;
  allowResubmission: boolean;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExcelCellCheckResult {
  evaluationId: string;
  cellRef: string;
  sheetName: string;
  description: string;
  formulaUsed: string;
  computedValue: any;
  isFormulaValid: boolean;
  isValueValid: boolean;
  pointsEarned: number;
  maxPoints: number;
  feedback: string;
}

export interface ExcelSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  className: string;
  attendanceNo: number;
  studentName: string;
  nis: string;
  submittedAt: string;
  workbookSnapshot: ExcelWorkbookData;
  evaluationResults: ExcelCellCheckResult[];
  autoScore: number;
  finalScore: number;
  isPassed: boolean;
  teacherFeedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  attemptNumber: number;
}

export interface ExcelFormulaGuideItem {
  id: string;
  name: string;
  category: 'Aritmatika & Dasar' | 'Statistik' | 'Logika & Kondisional' | 'Pencarian (Lookup)' | 'Teks & Karakter' | 'Waktu & Tanggal';
  syntax: string;
  description: string;
  parameters: { name: string; desc: string }[];
  exampleFormula: string;
  exampleOutput: string;
  schoolUseCase: string;
  sampleWorkbook: ExcelWorkbookData;
}

export interface LearningDatasetItem {
  id: string;
  title: string;
  category: string;
  description: string;
  rowCount: number;
  colCount: number;
  workbook: ExcelWorkbookData;
}
