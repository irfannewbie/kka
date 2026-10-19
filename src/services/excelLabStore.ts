import * as XLSX from 'xlsx';
import { adminFetch } from '../config/adminToken';
import {
  ExcelCellData,
  ExcelSheetData,
  ExcelWorkbookData,
  ExcelTask,
  ExcelSubmission,
  ExcelFormulaGuideItem,
  LearningDatasetItem,
  ExcelCellCheckResult,
} from '../types/excelLab';
import { recomputeSheet, formatCellValue, cellToCoords } from './excelFormulaEngine';

export const EXCEL_TASKS_STORAGE_KEY = 'inforkoding_excel_tasks_v1';
export const EXCEL_SUBMISSIONS_STORAGE_KEY = 'inforkoding_excel_submissions_v1';
export const EXCEL_FREE_PRACTICE_DRAFT_KEY = 'inforkoding_excel_practice_draft_v1';

// Helper to create blank sheet
export function createBlankSheet(id: string = 'sheet-1', name: string = 'Sheet1', rowCount: number = 30, colCount: number = 15): ExcelSheetData {
  return {
    id,
    name,
    cells: {},
    rowCount,
    colCount,
  };
}

// Helper to create blank workbook
export function createBlankWorkbook(title: string = 'Workbook Baru'): ExcelWorkbookData {
  const sheet = createBlankSheet('sheet-1', 'Sheet1');
  return {
    id: `wb-${Date.now()}`,
    title,
    sheets: [sheet],
    activeSheetId: sheet.id,
    lastModified: new Date().toLocaleString('id-ID'),
  };
}

// Helper to set cell value easily in a sheet
export function setCell(
  sheet: ExcelSheetData,
  ref: string,
  raw: string,
  opts?: Partial<Omit<ExcelCellData, 'raw'>>
): void {
  const cleanRef = ref.toUpperCase().trim();
  sheet.cells[cleanRef] = {
    raw,
    computed: /^-?\d+(\.\d+)?$/.test(raw) ? parseFloat(raw) : raw,
    ...opts,
  };
}

// =========================================================================
// 1. DEFAULT SEED TASKS FOR SMP (INFORMATIKA & KKA)
// =========================================================================
function buildTask1Workbook(): ExcelWorkbookData {
  const sheet = createBlankSheet('s1', 'Rekap_Nilai', 20, 10);

  // Headers
  setCell(sheet, 'A1', 'REKAPITULASI NILAI UJIAN INFORMATIKA - KELAS 8', { bold: true, align: 'left' });
  setCell(sheet, 'A2', 'SMP NEGERI 1 WEDI - SEMESTER GENAP', { italic: true, align: 'left' });

  // Table Headers
  const thStyle: Partial<ExcelCellData> = { bold: true, align: 'center', bg: '#e2e8f0' };
  setCell(sheet, 'A3', 'NO', thStyle);
  setCell(sheet, 'B3', 'NAMA SISWA', thStyle);
  setCell(sheet, 'C3', 'TEORI (PG)', thStyle);
  setCell(sheet, 'D3', 'PRAKTEK KODING', thStyle);
  setCell(sheet, 'E3', 'TUGAS PROYEK', thStyle);
  setCell(sheet, 'F3', 'TOTAL NILAI', { ...thStyle, bg: '#dbeafe' });
  setCell(sheet, 'G3', 'RATA-RATA', { ...thStyle, bg: '#dbeafe' });
  setCell(sheet, 'H3', 'STATUS KKTP (?75)', { ...thStyle, bg: '#fef3c7' });

  // Data rows
  const students = [
    { no: 1, name: 'ADELLE DWI ALEXA', c: 80, d: 85, e: 90 },
    { no: 2, name: 'BAGAS SETIAWAN', c: 70, d: 65, e: 72 },
    { no: 3, name: 'CITRA LESTARI', c: 92, d: 88, e: 95 },
    { no: 4, name: 'DIMAS PRASETYO', c: 60, d: 70, e: 68 },
    { no: 5, name: 'ELVIRA MAHARANI', c: 85, d: 90, e: 84 },
  ];

  students.forEach((s, idx) => {
    const row = 4 + idx;
    setCell(sheet, `A${row}`, String(s.no), { align: 'center' });
    setCell(sheet, `B${row}`, s.name, { align: 'left' });
    setCell(sheet, `C${row}`, String(s.c), { align: 'right' });
    setCell(sheet, `D${row}`, String(s.d), { align: 'right' });
    setCell(sheet, `E${row}`, String(s.e), { align: 'right' });
    // F, G, H will be completed by the student!
  });

  // Summary labels
  const lblStyle: Partial<ExcelCellData> = { bold: true, align: 'left', bg: '#f1f5f9' };
  setCell(sheet, 'B9', 'RATA-RATA KELAS', lblStyle);
  setCell(sheet, 'B10', 'NILAI TERTINGGI', lblStyle);
  setCell(sheet, 'B11', 'NILAI TERENDAH', lblStyle);
  setCell(sheet, 'B12', 'JUMLAH SISWA LULUS', lblStyle);

  const recomputed = recomputeSheet(sheet);

  return {
    id: 'wb-task-1',
    title: 'Rekap Nilai Siswa',
    sheets: [recomputed],
    activeSheetId: recomputed.id,
  };
}

function buildTask2Workbook(): ExcelWorkbookData {
  const sheet = createBlankSheet('s2', 'Koperasi_Sekolah', 20, 10);

  setCell(sheet, 'A1', 'LAPORAN TRANSAKSI HARIAN KOPERASI SISWA', { bold: true });
  setCell(sheet, 'A2', 'SMP NEGERI 1 WEDI', { italic: true });

  const thStyle: Partial<ExcelCellData> = { bold: true, align: 'center', bg: '#dcfce7' };
  setCell(sheet, 'A3', 'NO', thStyle);
  setCell(sheet, 'B3', 'NAMA BARANG', thStyle);
  setCell(sheet, 'C3', 'KATEGORI', thStyle);
  setCell(sheet, 'D3', 'HARGA SATUAN', thStyle);
  setCell(sheet, 'E3', 'TERJUAL (QTY)', thStyle);
  setCell(sheet, 'F3', 'TOTAL PENDAPATAN', { ...thStyle, bg: '#bbf7d0' });

  const items = [
    { no: 1, name: 'Buku Tulis Sinar 38Lbr', cat: 'Alat Tulis', price: 4000, qty: 25 },
    { no: 2, name: 'Bolpoin Gel Hitam', cat: 'Alat Tulis', price: 3000, qty: 40 },
    { no: 3, name: 'Roti Coklat Manis', cat: 'Makanan', price: 2500, qty: 30 },
    { no: 4, name: 'Air Mineral Botol 600ml', cat: 'Minuman', price: 3500, qty: 50 },
    { no: 5, name: 'Penggaris Besi 30cm', cat: 'Alat Tulis', price: 5000, qty: 15 },
    { no: 6, name: 'Susu Kotak Coklat', cat: 'Minuman', price: 4500, qty: 20 },
  ];

  items.forEach((item, idx) => {
    const row = 4 + idx;
    setCell(sheet, `A${row}`, String(item.no), { align: 'center' });
    setCell(sheet, `B${row}`, item.name);
    setCell(sheet, `C${row}`, item.cat, { align: 'center' });
    setCell(sheet, `D${row}`, String(item.price), { align: 'right', format: 'currency' });
    setCell(sheet, `E${row}`, String(item.qty), { align: 'right' });
    // F row is target cell for formula =D*E
  });

  const sumStyle: Partial<ExcelCellData> = { bold: true, bg: '#f8fafc' };
  setCell(sheet, 'B10', 'TOTAL SELURUH PENDAPATAN', sumStyle);
  setCell(sheet, 'B11', 'TOTAL PENDAPATAN ALAT TULIS (SUMIF)', sumStyle);
  setCell(sheet, 'B12', 'JUMLAH TRANSAKSI ALAT TULIS (COUNTIF)', sumStyle);

  const recomputed = recomputeSheet(sheet);

  return {
    id: 'wb-task-2',
    title: 'Laporan Koperasi',
    sheets: [recomputed],
    activeSheetId: recomputed.id,
  };
}

function buildTask3Workbook(): ExcelWorkbookData {
  const sheet = createBlankSheet('s3', 'Inventaris_VLOOKUP', 25, 10);

  setCell(sheet, 'A1', 'SISTEM PENCARIAN DATA INVENTARIS LAB KOMPUTER (VLOOKUP)', { bold: true });
  setCell(sheet, 'A2', 'Tabel Referensi Master Komponen Laboratorium:', { italic: true });

  const thRefStyle: Partial<ExcelCellData> = { bold: true, align: 'center', bg: '#fef08a' };
  setCell(sheet, 'A4', 'KODE BARANG', thRefStyle);
  setCell(sheet, 'B4', 'NAMA PERANGKAT', thRefStyle);
  setCell(sheet, 'C4', 'JENIS HARDWARE', thRefStyle);
  setCell(sheet, 'D4', 'HARGA ESTIMASI', thRefStyle);

  const inventory = [
    { code: 'HW-01', name: 'Monitor LED 24 Inch', type: 'Output Device', price: 1350000 },
    { code: 'HW-02', name: 'Keyboard Mekanikal USB', type: 'Input Device', price: 250000 },
    { code: 'HW-03', name: 'Mouse Optik RGB', type: 'Input Device', price: 120000 },
    { code: 'HW-04', name: 'Headset Gaming Mic', type: 'Output Device', price: 180000 },
    { code: 'HW-05', name: 'Webcam Full HD 1080p', type: 'Input Device', price: 320000 },
  ];

  inventory.forEach((inv, idx) => {
    const row = 5 + idx;
    setCell(sheet, `A${row}`, inv.code, { align: 'center', bold: true });
    setCell(sheet, `B${row}`, inv.name);
    setCell(sheet, `C${row}`, inv.type, { align: 'center' });
    setCell(sheet, `D${row}`, String(inv.price), { align: 'right', format: 'currency' });
  });

  // Search box panel
  setCell(sheet, 'A12', 'FORM PENCARIAN BARANG (Gunakan VLOOKUP):', { bold: true, bg: '#e0e7ff' });
  setCell(sheet, 'A13', 'Ketik Kode Barang Dicari:');
  setCell(sheet, 'B13', 'HW-03', { bold: true, bg: '#fef3c7', align: 'center' }); // input cell

  setCell(sheet, 'A14', 'Nama Perangkat Ditemukan (VLOOKUP):', { bold: true });
  setCell(sheet, 'A15', 'Jenis Hardware Ditemukan (VLOOKUP):', { bold: true });
  setCell(sheet, 'A16', 'Harga Estimasi Ditemukan (VLOOKUP):', { bold: true });

  const recomputed = recomputeSheet(sheet);

  return {
    id: 'wb-task-3',
    title: 'Inventaris VLOOKUP',
    sheets: [recomputed],
    activeSheetId: recomputed.id,
  };
}

export const DEFAULT_EXCEL_TASKS: ExcelTask[] = [
  {
    id: 'task-excel-1',
    title: 'Tugas 1: Rekap Nilai Ujian & Status KKTP Siswa',
    category: 'Statistik',
    gradeLevel: 'ALL',
    targetClasses: ['Kelas 8A', 'Kelas 8B', 'Kelas 8C', 'Kelas 8D', 'Kelas 8E', 'Kelas 8F', 'Kelas 8G', 'Kelas 8H', 'Kelas 7E', 'Kelas 7F', 'Kelas 7G', 'Kelas 7H'],
    description: 'Praktik penggunaan rumus matematika, agregasi statistik dasar (SUM, AVERAGE, MIN, MAX) serta logika IF untuk penentuan kelulusan KKTP 75.',
    instructions: [
      'Gunakan rumus =SUM(C4:E4) pada kolom F (Total Nilai) untuk setiap siswa (baris 4 sampai 8).',
      'Gunakan rumus =AVERAGE(C4:E4) pada kolom G (Rata-rata Nilai) untuk setiap siswa (baris 4 sampai 8).',
      'Gunakan rumus =IF(G4>=75, "LULUS", "REMEDIAL") pada kolom H (Status KKTP).',
      'Hitung Rata-Rata Kelas Teori pada sel C9 dengan =AVERAGE(C4:C8).',
      'Cari Nilai Tertinggi Teori pada sel C10 dengan =MAX(C4:C8).',
      'Cari Nilai Terendah Teori pada sel C11 dengan =MIN(C4:C8).',
      'Hitung Jumlah Siswa Lulus pada sel H12 dengan =COUNTIF(H4:H8, "LULUS").',
    ],
    starterWorkbook: buildTask1Workbook(),
    targetEvaluations: [
      {
        id: 'eval-1-1',
        sheetName: 'Rekap_Nilai',
        cellRef: 'F4',
        description: 'Total Nilai Siswa 1 (Rumus SUM)',
        expectedFormulaPatterns: ['^=SUM\\(', 'C4:E4'],
        expectedValue: 255,
        points: 15,
        hint: 'Gunakan =SUM(C4:E4)',
      },
      {
        id: 'eval-1-2',
        sheetName: 'Rekap_Nilai',
        cellRef: 'G4',
        description: 'Rata-rata Nilai Siswa 1 (Rumus AVERAGE)',
        expectedFormulaPatterns: ['^=AVERAGE\\(', 'C4:E4'],
        expectedValue: 85,
        points: 15,
        hint: 'Gunakan =AVERAGE(C4:E4)',
      },
      {
        id: 'eval-1-3',
        sheetName: 'Rekap_Nilai',
        cellRef: 'H4',
        description: 'Status Kelulusan Siswa 1 (Rumus IF)',
        expectedFormulaPatterns: ['^=IF\\(', '75', 'LULUS'],
        expectedValue: 'LULUS',
        points: 20,
        hint: 'Gunakan =IF(G4>=75, "LULUS", "REMEDIAL")',
      },
      {
        id: 'eval-1-4',
        sheetName: 'Rekap_Nilai',
        cellRef: 'C9',
        description: 'Rata-rata Nilai Teori Kelas (Rumus AVERAGE)',
        expectedFormulaPatterns: ['^=AVERAGE\\(', 'C4:C8'],
        expectedValue: 77.4,
        tolerance: 0.5,
        points: 15,
        hint: 'Gunakan =AVERAGE(C4:C8)',
      },
      {
        id: 'eval-1-5',
        sheetName: 'Rekap_Nilai',
        cellRef: 'C10',
        description: 'Nilai Tertinggi Teori (Rumus MAX)',
        expectedFormulaPatterns: ['^=MAX\\(', 'C4:C8'],
        expectedValue: 92,
        points: 15,
        hint: 'Gunakan =MAX(C4:C8)',
      },
      {
        id: 'eval-1-6',
        sheetName: 'Rekap_Nilai',
        cellRef: 'C11',
        description: 'Nilai Terendah Teori (Rumus MIN)',
        expectedFormulaPatterns: ['^=MIN\\(', 'C4:C8'],
        expectedValue: 60,
        points: 10,
        hint: 'Gunakan =MIN(C4:C8)',
      },
      {
        id: 'eval-1-7',
        sheetName: 'Rekap_Nilai',
        cellRef: 'H12',
        description: 'Jumlah Siswa Lulus (Rumus COUNTIF)',
        expectedFormulaPatterns: ['^=COUNTIF\\(', 'LULUS'],
        expectedValue: 3,
        points: 10,
        hint: 'Gunakan =COUNTIF(H4:H8, "LULUS")',
      },
    ],
    maxScore: 100,
    kktp: 75,
    isActive: true,
    allowResubmission: true,
    createdAt: '18/10/2026',
    updatedAt: '18/10/2026',
  },
  {
    id: 'task-excel-2',
    title: 'Tugas 2: Laporan Transaksi Keuangan Koperasi Sekolah',
    category: 'Statistik',
    gradeLevel: 'ALL',
    targetClasses: ['Kelas 8A', 'Kelas 8B', 'Kelas 8C', 'Kelas 8D', 'Kelas 8E', 'Kelas 8F', 'Kelas 8G', 'Kelas 8H', 'Kelas 7E', 'Kelas 7F', 'Kelas 7G', 'Kelas 7H'],
    description: 'Penerapan rumus perkalian kolom, penjumlahan total dengan SUM, dan kalkulasi bersyarat kategori menggunakan SUMIF & COUNTIF.',
    instructions: [
      'Hitung Total Pendapatan barang pertama pada sel F4 dengan perkalian harga dan jumlah terjual (=D4*E4).',
      'Terapkan rumus yang sama untuk baris 5 sampai 9.',
      'Hitung Total Seluruh Pendapatan pada sel F10 dengan rumus =SUM(F4:F9).',
      'Hitung Total Pendapatan kategori Alat Tulis pada sel F11 dengan rumus =SUMIF(C4:C9, "Alat Tulis", F4:F9).',
      'Hitung Jumlah Transaksi kategori Alat Tulis pada sel F12 dengan rumus =COUNTIF(C4:C9, "Alat Tulis").',
    ],
    starterWorkbook: buildTask2Workbook(),
    targetEvaluations: [
      {
        id: 'eval-2-1',
        sheetName: 'Koperasi_Sekolah',
        cellRef: 'F4',
        description: 'Perkalian Harga x Qty Barang 1',
        expectedFormulaPatterns: ['D4.*E4|E4.*D4'],
        expectedValue: 100000,
        points: 25,
        hint: 'Gunakan =D4*E4',
      },
      {
        id: 'eval-2-2',
        sheetName: 'Koperasi_Sekolah',
        cellRef: 'F10',
        description: 'Total Pendapatan Seluruh Barang (=SUM)',
        expectedFormulaPatterns: ['^=SUM\\(', 'F4:F9'],
        expectedValue: 635000,
        points: 25,
        hint: 'Gunakan =SUM(F4:F9)',
      },
      {
        id: 'eval-2-3',
        sheetName: 'Koperasi_Sekolah',
        cellRef: 'F11',
        description: 'Total Pendapatan Alat Tulis (=SUMIF)',
        expectedFormulaPatterns: ['^=SUMIF\\(', 'Alat Tulis', 'F4:F9'],
        expectedValue: 295000,
        points: 25,
        hint: 'Gunakan =SUMIF(C4:C9, "Alat Tulis", F4:F9)',
      },
      {
        id: 'eval-2-4',
        sheetName: 'Koperasi_Sekolah',
        cellRef: 'F12',
        description: 'Jumlah Transaksi Alat Tulis (=COUNTIF)',
        expectedFormulaPatterns: ['^=COUNTIF\\(', 'Alat Tulis'],
        expectedValue: 3,
        points: 25,
        hint: 'Gunakan =COUNTIF(C4:C9, "Alat Tulis")',
      },
    ],
    maxScore: 100,
    kktp: 75,
    isActive: true,
    allowResubmission: true,
    createdAt: '18/10/2026',
    updatedAt: '18/10/2026',
  },
  {
    id: 'task-excel-3',
    title: 'Tugas 3: Pencarian Data Inventaris Lab dengan VLOOKUP',
    category: 'Lookup',
    gradeLevel: '8',
    targetClasses: ['Kelas 8A', 'Kelas 8B', 'Kelas 8C', 'Kelas 8D', 'Kelas 8E', 'Kelas 8F', 'Kelas 8G', 'Kelas 8H'],
    description: 'Mempelajari cara kerja rumus pencarian vertikal VLOOKUP berdasarkan kode referensi untuk mengambil informasi perangkat komputer secara otomatis.',
    instructions: [
      'Pada sel B14 (Nama Perangkat), gunakan rumus =VLOOKUP(B13, A5:D9, 2, FALSE) untuk mencari nama perangkat sesuai kode di sel B13.',
      'Pada sel B15 (Jenis Hardware), gunakan rumus =VLOOKUP(B13, A5:D9, 3, FALSE) untuk mengambil kolom jenis hardware.',
      'Pada sel B16 (Harga Estimasi), gunakan rumus =VLOOKUP(B13, A5:D9, 4, FALSE) untuk mengambil kolom harga perangkat.',
    ],
    starterWorkbook: buildTask3Workbook(),
    targetEvaluations: [
      {
        id: 'eval-3-1',
        sheetName: 'Inventaris_VLOOKUP',
        cellRef: 'B14',
        description: 'VLOOKUP Nama Perangkat (Kolom 2)',
        expectedFormulaPatterns: ['^=VLOOKUP\\(', 'B13', 'A5:D9', '2'],
        expectedValue: 'Mouse Optik RGB',
        points: 35,
        hint: 'Gunakan =VLOOKUP(B13, A5:D9, 2, FALSE)',
      },
      {
        id: 'eval-3-2',
        sheetName: 'Inventaris_VLOOKUP',
        cellRef: 'B15',
        description: 'VLOOKUP Jenis Hardware (Kolom 3)',
        expectedFormulaPatterns: ['^=VLOOKUP\\(', 'B13', 'A5:D9', '3'],
        expectedValue: 'Input Device',
        points: 35,
        hint: 'Gunakan =VLOOKUP(B13, A5:D9, 3, FALSE)',
      },
      {
        id: 'eval-3-3',
        sheetName: 'Inventaris_VLOOKUP',
        cellRef: 'B16',
        description: 'VLOOKUP Harga Estimasi (Kolom 4)',
        expectedFormulaPatterns: ['^=VLOOKUP\\(', 'B13', 'A5:D9', '4'],
        expectedValue: 120000,
        points: 30,
        hint: 'Gunakan =VLOOKUP(B13, A5:D9, 4, FALSE)',
      },
    ],
    maxScore: 100,
    kktp: 75,
    isActive: true,
    allowResubmission: true,
    createdAt: '18/10/2026',
    updatedAt: '18/10/2026',
  },
];
// =========================================================================
// =========================================================================
// 2. FORMULA GUIDE LIBRARY FOR STUDENTS
// =========================================================================
export { DEFAULT_FORMULA_GUIDES } from './excelFormulaGuideData';

// =========================================================================
// 3. AUTO-EVALUATION ENGINE FOR STUDENT SUBMISSIONS
// =========================================================================
export function evaluateStudentWorkbook(
  workbook: ExcelWorkbookData,
  task: ExcelTask
): {
  results: ExcelCellCheckResult[];
  autoScore: number;
  isPassed: boolean;
} {
  const results: ExcelCellCheckResult[] = [];
  let totalEarned = 0;
  let totalPossible = 0;

  task.targetEvaluations.forEach((evalItem) => {
    totalPossible += evalItem.points;
    const sheet = workbook.sheets.find((s) => s.name.toLowerCase() === evalItem.sheetName.toLowerCase()) || workbook.sheets[0];

    if (!sheet) {
      results.push({
        evaluationId: evalItem.id,
        cellRef: evalItem.cellRef,
        sheetName: evalItem.sheetName,
        description: evalItem.description,
        formulaUsed: '',
        computedValue: null,
        isFormulaValid: false,
        isValueValid: false,
        pointsEarned: 0,
        maxPoints: evalItem.points,
        feedback: `Lembar kerja '${evalItem.sheetName}' tidak ditemukan.`,
      });
      return;
    }

    const cell = sheet.cells[evalItem.cellRef.toUpperCase().trim()];
    const rawFormula = cell?.raw || '';
    const computedVal = cell?.computed;

    // Check 1: Must be a formula (starts with '=') unless the task only expects manual value
    const isFormula = rawFormula.startsWith('=');
    let isFormulaPatternMatched = isFormula;

    if (evalItem.expectedFormulaPatterns && evalItem.expectedFormulaPatterns.length > 0) {
      if (!isFormula) {
        isFormulaPatternMatched = false;
      } else {
        const cleanFormula = rawFormula.replace(/\s+/g, '').toUpperCase();
        isFormulaPatternMatched = evalItem.expectedFormulaPatterns.every((pattern) => {
          const reg = new RegExp(pattern.replace(/\s+/g, ''), 'i');
          return reg.test(cleanFormula);
        });
      }
    }

    // Check 2: Computed Value matches expected value
    let isValueMatched: boolean;
    if (evalItem.expectedValue !== undefined && evalItem.expectedValue !== null) {
      if (typeof evalItem.expectedValue === 'number') {
        const computedNum = parseFloat(String(computedVal));
        const tolerance = evalItem.tolerance ?? 0.05;
        isValueMatched = !isNaN(computedNum) && Math.abs(computedNum - evalItem.expectedValue) <= tolerance;
      } else {
        const strExpected = String(evalItem.expectedValue).trim().toLowerCase();
        const strComputed = String(computedVal ?? '').trim().toLowerCase();
        isValueMatched = strExpected === strComputed;
      }
    } else {
      isValueMatched = !String(computedVal).startsWith('#');
    }

    let pointsEarned: number;
    let feedback: string;

    if (isFormulaPatternMatched && isValueMatched) {
      pointsEarned = evalItem.points;
      feedback = 'Sempurna! Rumus dan hasil perhitungan sel tepat.';
    } else if (!isFormula && isValueMatched) {
      // Wrote the correct answer manually without a formula
      pointsEarned = Math.round(evalItem.points * 0.4);
      feedback = 'Nilai hasil benar, namun Anda belum menggunakan rumus Excel (awali dengan tanda =).';
    } else if (isFormulaPatternMatched && !isValueMatched) {
      // Used the right formula type but wrong ranges or inputs
      pointsEarned = Math.round(evalItem.points * 0.5);
      feedback = 'Struktur rumus sudah benar, namun hasil perhitungannya belum tepat. Periksa kembali rentang sel yang dipilih.';
    } else {
      pointsEarned = 0;
      feedback = evalItem.hint
        ? `Belum tepat. Petunjuk: ${evalItem.hint}`
        : 'Perhitungan sel belum sesuai dengan instruksi tugas.';
    }

    totalEarned += pointsEarned;

    results.push({
      evaluationId: evalItem.id,
      cellRef: evalItem.cellRef,
      sheetName: evalItem.sheetName,
      description: evalItem.description,
      formulaUsed: rawFormula,
      computedValue: computedVal,
      isFormulaValid: isFormulaPatternMatched,
      isValueValid: isValueMatched,
      pointsEarned,
      maxPoints: evalItem.points,
      feedback,
    });
  });

  const scaledScore = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
  const isPassed = scaledScore >= (task.kktp || 75);

  return {
    results,
    autoScore: scaledScore,
    isPassed,
  };
}

// =========================================================================
// 4. XLSX IMPORT & EXPORT UTILITIES
// =========================================================================
export function exportWorkbookToXlsx(workbook: ExcelWorkbookData, filename?: string): void {
  const wb = XLSX.utils.book_new();

  workbook.sheets.forEach((sheet) => {
    const sheetData: any[][] = [];

    // Find bounds
    let maxR = 0;
    let maxC = 0;
    Object.keys(sheet.cells).forEach((ref) => {
      const coords = cellToCoords(ref);
      if (coords) {
        if (coords.row > maxR) maxR = coords.row;
        if (coords.col > maxC) maxC = coords.col;
      }
    });

    maxR = Math.max(maxR, 10);
    maxC = Math.max(maxC, 5);

    for (let r = 0; r <= maxR; r++) {
      const rowArr: any[] = [];
      for (let c = 0; c <= maxC; c++) {
        const ref = `${String.fromCharCode(65 + c)}${r + 1}`;
        const cell = sheet.cells[ref];
        if (cell) {
          rowArr.push(cell.computed !== undefined ? cell.computed : cell.raw);
        } else {
          rowArr.push('');
        }
      }
      sheetData.push(rowArr);
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  });

  const name = filename || `${workbook.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, name);
}

export function importXlsxToWorkbook(fileData: ArrayBuffer, title: string = 'Imported Workbook'): ExcelWorkbookData {
  const wb = XLSX.read(fileData, { type: 'array' });
  const sheets: ExcelSheetData[] = [];

  wb.SheetNames.forEach((sheetName, sIdx) => {
    const ws = wb.Sheets[sheetName];
    const cells: Record<string, ExcelCellData> = {};

    let maxRow = 20;
    let maxCol = 10;

    Object.keys(ws).forEach((cellKey) => {
      if (cellKey.startsWith('!')) return;
      const cellObj = ws[cellKey];
      const coords = cellToCoords(cellKey);
      if (coords) {
        if (coords.row + 1 > maxRow) maxRow = coords.row + 1;
        if (coords.col + 1 > maxCol) maxCol = coords.col + 1;
      }

      let rawVal = '';
      if (cellObj.f) {
        rawVal = `=${cellObj.f}`;
      } else if (cellObj.v !== undefined) {
        rawVal = String(cellObj.v);
      }

      cells[cellKey.toUpperCase()] = {
        raw: rawVal,
        computed: cellObj.v,
        align: typeof cellObj.v === 'number' ? 'right' : 'left',
      };
    });

    const sheetData: ExcelSheetData = {
      id: `sheet-${sIdx + 1}`,
      name: sheetName,
      cells,
      rowCount: Math.max(maxRow + 5, 30),
      colCount: Math.max(maxCol + 3, 15),
    };

    sheets.push(recomputeSheet(sheetData));
  });

  return {
    id: `wb-import-${Date.now()}`,
    title,
    sheets: sheets.length > 0 ? sheets : [createBlankSheet()],
    activeSheetId: sheets[0]?.id || 'sheet-1',
    lastModified: new Date().toLocaleString('id-ID'),
  };
}

// =========================================================================
// 5. LOCAL STORAGE & BACKEND PERSISTENCE
// =========================================================================
export function loadLocalExcelTasks(): ExcelTask[] {
  if (typeof window === 'undefined') return DEFAULT_EXCEL_TASKS;
  try {
    const raw = localStorage.getItem(EXCEL_TASKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_EXCEL_TASKS;
}

export function saveLocalExcelTasks(tasks: ExcelTask[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EXCEL_TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // ignore
  }
}

export function loadLocalExcelSubmissions(): ExcelSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(EXCEL_SUBMISSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveLocalExcelSubmissions(submissions: ExcelSubmission[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EXCEL_SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
  } catch {
    // ignore
  }
}

// Fetch tasks and submissions with server fallback
export async function fetchExcelLabDataFromServer(): Promise<{
  tasks: ExcelTask[];
  submissions: ExcelSubmission[];
}> {
  try {
    const res = await fetch('/api/excel-lab/data');
    if (res.ok) {
      const json = await res.json();
      const tasks = Array.isArray(json.tasks) && json.tasks.length > 0 ? json.tasks : loadLocalExcelTasks();
      const submissions = Array.isArray(json.submissions) ? json.submissions : loadLocalExcelSubmissions();
      return { tasks, submissions };
    }
  } catch (err) {
    console.warn('Server excel-lab fetch failed, using local storage fallback:', err);
  }
  return {
    tasks: loadLocalExcelTasks(),
    submissions: loadLocalExcelSubmissions(),
  };
}

export async function submitExcelTaskToServer(submission: ExcelSubmission): Promise<{
  success: boolean;
  submissions: ExcelSubmission[];
}> {
  const localSubs = loadLocalExcelSubmissions();
  const updated = [submission, ...localSubs];
  saveLocalExcelSubmissions(updated);

  try {
    const res = await fetch('/api/excel-lab/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission }),
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.submissions)) {
        saveLocalExcelSubmissions(json.submissions);
        return { success: true, submissions: json.submissions };
      }
    }
  } catch (err) {
    console.warn('Server excel-lab submit warning:', err);
  }

  return { success: true, submissions: updated };
}

export async function saveExcelTaskToServer(task: ExcelTask): Promise<ExcelTask[]> {
  const current = loadLocalExcelTasks();
  const idx = current.findIndex((t) => t.id === task.id);
  let updated: ExcelTask[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = task;
  } else {
    updated = [task, ...current];
  }
  saveLocalExcelTasks(updated);

  try {
    const res = await adminFetch('/api/excel-lab/tasks', {
      method: 'POST',
      body: JSON.stringify({ task }),
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.tasks)) {
        saveLocalExcelTasks(json.tasks);
        return json.tasks;
      }
    }
  } catch (err) {
    console.warn('Server excel-lab task save warning:', err);
  }

  return updated;
}

export async function deleteExcelTaskOnServer(taskId: string): Promise<ExcelTask[]> {
  const current = loadLocalExcelTasks();
  const updated = current.filter((t) => t.id !== taskId);
  saveLocalExcelTasks(updated);

  try {
    const res = await adminFetch(`/api/excel-lab/tasks/${taskId}`, { method: 'DELETE' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.tasks)) {
        saveLocalExcelTasks(json.tasks);
        return json.tasks;
      }
    }
  } catch (err) {
    console.warn('Server excel-lab task delete warning:', err);
  }

  return updated;
}

export async function gradeExcelSubmissionOnServer(
  submissionId: string,
  finalScore: number,
  teacherFeedback: string,
  gradedBy: string = 'Guru Informatika'
): Promise<ExcelSubmission[]> {
  const current = loadLocalExcelSubmissions();
  const updated = current.map((sub) =>
    sub.id === submissionId
      ? {
          ...sub,
          finalScore,
          teacherFeedback,
          gradedAt: new Date().toLocaleString('id-ID'),
          gradedBy,
          isPassed: finalScore >= 75,
        }
      : sub
  );
  saveLocalExcelSubmissions(updated);

  try {
    const res = await adminFetch('/api/excel-lab/grade', {
      method: 'POST',
      body: JSON.stringify({ submissionId, finalScore, teacherFeedback, gradedBy }),
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.submissions)) {
        saveLocalExcelSubmissions(json.submissions);
        return json.submissions;
      }
    }
  } catch (err) {
    console.warn('Server excel-lab grade warning:', err);
  }

  return updated;
}

export async function resetExcelSubmissionOnServer(submissionId: string): Promise<ExcelSubmission[]> {
  const current = loadLocalExcelSubmissions();
  const updated = current.filter((s) => s.id !== submissionId);
  saveLocalExcelSubmissions(updated);

  try {
    const res = await adminFetch('/api/excel-lab/reset-submission', {
      method: 'POST',
      body: JSON.stringify({ submissionId }),
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.submissions)) {
        saveLocalExcelSubmissions(json.submissions);
        return json.submissions;
      }
    }
  } catch (err) {
    console.warn('Server excel-lab reset warning:', err);
  }

  return updated;
}

// =========================================================================
// 6. DEFAULT CURATED LEARNING DATASETS
// =========================================================================
export const DEFAULT_LEARNING_DATASETS: LearningDatasetItem[] = [
  {
    id: 'dataset-rekap-nilai',
    title: 'Rekapitulasi Nilai Asesmen Sumatif Siswa',
    category: 'Pendidikan & Akademik',
    description: 'Data lengkap nilai Teori PG, Menjodohkan, Uraian, dan Praktikum Informatika untuk latihan rumus SUM, AVERAGE, MIN, MAX, dan IF.',
    rowCount: 25,
    colCount: 10,
    workbook: (() => {
      const s = createBlankSheet('ds-nilai', 'Nilai_Informatika', 25, 10);
      setCell(s, 'A1', 'REKAPITULASI NILAI ASESMEN INFORMATIKA - SMPN 1 WEDI', { bold: true });
      setCell(s, 'A2', 'Tahun Ajaran 2025/2026 - Kelas 8', { italic: true });
      const thStyle: Partial<ExcelCellData> = { bold: true, align: 'center', bg: '#e2e8f0' };
      setCell(s, 'A4', 'NO', thStyle);
      setCell(s, 'B4', 'NIS', thStyle);
      setCell(s, 'C4', 'NAMA SISWA', thStyle);
      setCell(s, 'D4', 'PG (40%)', thStyle);
      setCell(s, 'E4', 'MENJODOHKAN (20%)', thStyle);
      setCell(s, 'F4', 'PRAKTEK KODING (40%)', thStyle);
      setCell(s, 'G4', 'NILAI AKHIR', { ...thStyle, bg: '#dbeafe' });
      setCell(s, 'H4', 'STATUS KKTP (?75)', { ...thStyle, bg: '#fef3c7' });

      const data = [
        { no: 1, nis: '11581', name: 'ADELLE DWI ALEXA', d: 85, e: 90, f: 88 },
        { no: 2, nis: '11582', name: 'AFRIZA ADITYA PRATAMA', d: 70, e: 60, f: 75 },
        { no: 3, nis: '11583', name: 'AGIL CAHYO UTOMO', d: 95, e: 90, f: 92 },
        { no: 4, nis: '11584', name: 'AHMAD RIZKY MAULANA', d: 65, e: 70, f: 68 },
        { no: 5, nis: '11585', name: 'AISYAH NUR CAHYANI', d: 88, e: 85, f: 90 },
        { no: 6, nis: '11586', name: 'ALIFIA PUTRI RAHMADHANI', d: 92, e: 95, f: 88 },
        { no: 7, nis: '11587', name: 'ANANDA FEBRIAN PRATAMA', d: 72, e: 70, f: 74 },
        { no: 8, nis: '11588', name: 'ANGGITA RIZQI SAPUTRI', d: 80, e: 85, f: 82 },
      ];

      data.forEach((item, idx) => {
        const r = 5 + idx;
        setCell(s, `A${r}`, String(item.no), { align: 'center' });
        setCell(s, `B${r}`, item.nis, { align: 'center' });
        setCell(s, `C${r}`, item.name);
        setCell(s, `D${r}`, String(item.d), { align: 'right' });
        setCell(s, `E${r}`, String(item.e), { align: 'right' });
        setCell(s, `F${r}`, String(item.f), { align: 'right' });
        setCell(s, `G${r}`, `=(D${r}*0.4)+(E${r}*0.2)+(F${r}*0.4)`, { align: 'right', bold: true, format: 'number' });
        setCell(s, `H${r}`, `=IF(G${r}>=75, "TUNTAS", "REMEDIAL")`, { align: 'center', bold: true });
      });

      const statStyle: Partial<ExcelCellData> = { bold: true, bg: '#f1f5f9' };
      setCell(s, 'C14', 'RATA-RATA KELAS', statStyle);
      setCell(s, 'G14', '=AVERAGE(G5:G12)', { bold: true, format: 'number', bg: '#dbeafe' });
      setCell(s, 'C15', 'NILAI TERTINGGI', statStyle);
      setCell(s, 'G15', '=MAX(G5:G12)', { bold: true, format: 'number' });
      setCell(s, 'C16', 'NILAI TERENDAH', statStyle);
      setCell(s, 'G16', '=MIN(G5:G12)', { bold: true, format: 'number' });
      setCell(s, 'C17', 'JUMLAH SISWA TUNTAS', statStyle);
      setCell(s, 'H17', '=COUNTIF(H5:H12, "TUNTAS")', { bold: true, align: 'center', bg: '#dcfce7' });

      return { id: 'wb-ds-nilai', title: 'Dataset Nilai Informatika', sheets: [recomputeSheet(s)], activeSheetId: s.id };
    })(),
  },
  {
    id: 'dataset-koperasi',
    title: 'Laporan Penjualan & Keuangan Koperasi Sekolah',
    category: 'Administrasi & Keuangan',
    description: 'Catatan transaksi harian perlengkapan sekolah dan konsumsi kantin koperasi untuk latihan perkalian, SUMIF, COUNTIF, dan format mata uang.',
    rowCount: 20,
    colCount: 8,
    workbook: (() => {
      const s = createBlankSheet('ds-kop', 'Kas_Koperasi', 20, 8);
      setCell(s, 'A1', 'BUKU KAS HARIAN KOPERASI SISWA SMP NEGERI 1 WEDI', { bold: true });
      const thStyle: Partial<ExcelCellData> = { bold: true, align: 'center', bg: '#dcfce7' };
      setCell(s, 'A3', 'NO', thStyle);
      setCell(s, 'B3', 'NAMA ITEM / PRODUK', thStyle);
      setCell(s, 'C3', 'KATEGORI', thStyle);
      setCell(s, 'D3', 'HARGA JUAL', thStyle);
      setCell(s, 'E3', 'TERJUAL (QTY)', thStyle);
      setCell(s, 'F3', 'SUBTOTAL', { ...thStyle, bg: '#bbf7d0' });

      const items = [
        { no: 1, name: 'Buku Tulis 38 Lbr', cat: 'Alat Tulis', price: 4000, qty: 35 },
        { no: 2, name: 'Bolpoin Gel Hitam 0.5', cat: 'Alat Tulis', price: 3500, qty: 50 },
        { no: 3, name: 'Penggaris Segitiga Set', cat: 'Alat Tulis', price: 6000, qty: 12 },
        { no: 4, name: 'Roti Bakar Coklat', cat: 'Konsumsi', price: 3000, qty: 45 },
        { no: 5, name: 'Air Mineral Botol 600ml', cat: 'Konsumsi', price: 3500, qty: 60 },
        { no: 6, name: 'Penghapus Karet Putih', cat: 'Alat Tulis', price: 2000, qty: 25 },
        { no: 7, name: 'Susu Kotak Coklat', cat: 'Konsumsi', price: 4500, qty: 30 },
      ];

      items.forEach((item, idx) => {
        const r = 4 + idx;
        setCell(s, `A${r}`, String(item.no), { align: 'center' });
        setCell(s, `B${r}`, item.name);
        setCell(s, `C${r}`, item.cat, { align: 'center' });
        setCell(s, `D${r}`, String(item.price), { align: 'right', format: 'currency' });
        setCell(s, `E${r}`, String(item.qty), { align: 'right' });
        setCell(s, `F${r}`, `=D${r}*E${r}`, { align: 'right', bold: true, format: 'currency' });
      });

      const sumStyle: Partial<ExcelCellData> = { bold: true, bg: '#f8fafc' };
      setCell(s, 'B12', 'TOTAL PENJUALAN KESELURUHAN', sumStyle);
      setCell(s, 'F12', '=SUM(F4:F10)', { bold: true, format: 'currency', bg: '#bbf7d0' });
      setCell(s, 'B13', 'TOTAL PENDAPATAN ALAT TULIS', sumStyle);
      setCell(s, 'F13', '=SUMIF(C4:C10, "Alat Tulis", F4:F10)', { bold: true, format: 'currency' });
      setCell(s, 'B14', 'TOTAL PENDAPATAN KONSUMSI', sumStyle);
      setCell(s, 'F14', '=SUMIF(C4:C10, "Konsumsi", F4:F10)', { bold: true, format: 'currency' });
      setCell(s, 'B15', 'JUMLAH TRANSAKSI KONSUMSI', sumStyle);
      setCell(s, 'F15', '=COUNTIF(C4:C10, "Konsumsi")', { bold: true, align: 'center' });

      return { id: 'wb-ds-koperasi', title: 'Dataset Kas Koperasi', sheets: [recomputeSheet(s)], activeSheetId: s.id };
    })(),
  },
  {
    id: 'dataset-inventaris-lab',
    title: 'Inventaris & Database Perangkat Lab Komputer',
    category: 'Teknologi & Hardware',
    description: 'Daftar kode perangkat komputer, nama unit, kategori, kondisi, dan lokasi lab untuk melatih fungsi VLOOKUP, HLOOKUP, dan pencarian data.',
    rowCount: 20,
    colCount: 8,
    workbook: (() => {
      const s = createBlankSheet('ds-lab', 'Inventaris_Hardware', 20, 8);
      setCell(s, 'A1', 'DATABASE INVENTARIS LAB KOMPUTER & MULTIMEDIA', { bold: true });
      const thStyle: Partial<ExcelCellData> = { bold: true, align: 'center', bg: '#fef08a' };
      setCell(s, 'A3', 'KODE', thStyle);
      setCell(s, 'B3', 'NAMA PERANGKAT', thStyle);
      setCell(s, 'C3', 'KATEGORI', thStyle);
      setCell(s, 'D3', 'JUMLAH UNIT', thStyle);
      setCell(s, 'E3', 'KONDISI', thStyle);
      setCell(s, 'F3', 'HARGA ESTIMASI', thStyle);

      const items = [
        { code: 'PC-01', name: 'PC Dekstop Core i5 16GB', cat: 'Unit Komputer', qty: 32, cond: 'Baik', price: 7500000 },
        { code: 'PC-02', name: 'PC Server Xeon 32GB', cat: 'Server Lab', qty: 2, cond: 'Baik', price: 18000000 },
        { code: 'MON-01', name: 'Monitor LED 24 Inch HDMI', cat: 'Display', qty: 34, cond: 'Baik', price: 1400000 },
        { code: 'NET-01', name: 'Switch Gigabit 48 Port', cat: 'Jaringan', qty: 2, cond: 'Baik', price: 3200000 },
        { code: 'PRT-01', name: 'Printer Laser Multifungsi', cat: 'Printer/Scanner', qty: 1, cond: 'Perlu Servis', price: 4200000 },
        { code: 'PROJ-01', name: 'Proyektor LCD 3600 Lumens', cat: 'Display', qty: 2, cond: 'Baik', price: 5800000 },
      ];

      items.forEach((item, idx) => {
        const r = 4 + idx;
        setCell(s, `A${r}`, item.code, { align: 'center', bold: true });
        setCell(s, `B${r}`, item.name);
        setCell(s, `C${r}`, item.cat, { align: 'center' });
        setCell(s, `D${r}`, String(item.qty), { align: 'right' });
        setCell(s, `E${r}`, item.cond, { align: 'center' });
        setCell(s, `F${r}`, String(item.price), { align: 'right', format: 'currency' });
      });

      // Quick lookup form
      setCell(s, 'A12', 'FORM PENCARIAN OTOMATIS (VLOOKUP):', { bold: true, bg: '#e0e7ff' });
      setCell(s, 'A13', 'KODE DICARI:');
      setCell(s, 'B13', 'MON-01', { bold: true, bg: '#fef3c7', align: 'center' });
      setCell(s, 'A14', 'NAMA UNIT:');
      setCell(s, 'B14', '=VLOOKUP(B13, A4:F9, 2, FALSE)', { bold: true, bg: '#dbeafe' });
      setCell(s, 'A15', 'KATEGORI:');
      setCell(s, 'B15', '=VLOOKUP(B13, A4:F9, 3, FALSE)', { bold: true });
      setCell(s, 'A16', 'HARGA ESTIMASI:');
      setCell(s, 'B16', '=VLOOKUP(B13, A4:F9, 6, FALSE)', { bold: true, format: 'currency' });

      return { id: 'wb-ds-inventaris', title: 'Dataset Inventaris Lab', sheets: [recomputeSheet(s)], activeSheetId: s.id };
    })(),
  },
  {
    id: 'dataset-presensi-siswa',
    title: 'Rekap Presensi & Kehadiran Siswa',
    category: 'Administrasi Kesiswaan',
    description: 'Catatan presensi harian (Hadir, Sakit, Izin, Alpa) dan persentase kehadiran menggunakan fungsi COUNTIF dan persentase formula.',
    rowCount: 20,
    colCount: 9,
    workbook: (() => {
      const s = createBlankSheet('ds-presensi', 'Presensi_Kelas', 20, 9);
      setCell(s, 'A1', 'REKAPITULASI KEHADIRAN SISWA - KELAS 7E', { bold: true });
      const thStyle: Partial<ExcelCellData> = { bold: true, align: 'center', bg: '#fce7f3' };
      setCell(s, 'A3', 'NO', thStyle);
      setCell(s, 'B3', 'NAMA SISWA', thStyle);
      setCell(s, 'C3', 'SENIN', thStyle);
      setCell(s, 'D3', 'SELASA', thStyle);
      setCell(s, 'E3', 'RABU', thStyle);
      setCell(s, 'F3', 'KAMIS', thStyle);
      setCell(s, 'G3', 'JUMAT', thStyle);
      setCell(s, 'H3', 'JML HADIR', { ...thStyle, bg: '#dcfce7' });
      setCell(s, 'I3', '% HADIR', { ...thStyle, bg: '#dbeafe' });

      const presensi = [
        { no: 1, name: 'AKBAR GHIBRAN HERSEANDO', days: ['H', 'H', 'H', 'H', 'H'] },
        { no: 2, name: 'ALDRIC AQILA PRATISTA', days: ['H', 'S', 'H', 'H', 'H'] },
        { no: 3, name: 'ALMA ROSIDA', days: ['H', 'H', 'H', 'I', 'H'] },
        { no: 4, name: 'ANDRA SATRIA WIBAWA', days: ['H', 'H', 'H', 'H', 'H'] },
        { no: 5, name: 'ANNISA NUR ROZZAQ', days: ['H', 'H', 'S', 'H', 'H'] },
        { no: 6, name: 'ARJUNA RADITYA PRATAMA', days: ['H', 'H', 'H', 'H', 'H'] },
      ];

      presensi.forEach((p, idx) => {
        const r = 4 + idx;
        setCell(s, `A${r}`, String(p.no), { align: 'center' });
        setCell(s, `B${r}`, p.name);
        p.days.forEach((d, dIdx) => {
          const colLetter = String.fromCharCode(67 + dIdx); // C, D, E, F, G
          setCell(s, `${colLetter}${r}`, d, { align: 'center', bold: d !== 'H' });
        });
        setCell(s, `H${r}`, `=COUNTIF(C${r}:G${r}, "H")`, { align: 'center', bold: true });
        setCell(s, `I${r}`, `=H${r}/5`, { align: 'right', format: 'percent' });
      });

      return { id: 'wb-ds-presensi', title: 'Dataset Presensi Siswa', sheets: [recomputeSheet(s)], activeSheetId: s.id };
    })(),
  },
];
