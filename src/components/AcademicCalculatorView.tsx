import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  FileSpreadsheet,
  Copy,
  Download,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  RefreshCw,
  Search,
  BookOpen,
  GraduationCap,
  ExternalLink,
  RotateCcw,
  Table,
  FileText,
  Award,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  GRADE_7_CLASSES,
  GRADE_8_CLASSES,
  getStudentsByClass,
} from '../data/studentsAll';
import {
  syncGradesToClassSheet,
  detectClassTaskColumns,
  ClassColumnDetectionResult,
  DetectedColumnDetail,
  StudentGradeItem,
} from '../services/sheetsService';
import {
  loadLocalCalculatorDataset,
  saveCalculatorDatasetEverywhere,
  syncAllCalculatorMasterWithServer,
  getDatasetShortKey,
} from '../services/calculatorMasterStore';

interface AcademicCalculatorViewProps {
  spreadsheetId: string;
  spreadsheetUrl: string;
  token: string | null;
  onLogin: () => void;
  onShowAlert?: (title: string, message: string) => void;
}

export type SubjectOptionType = 'Informatika' | 'Koding';

export type AssessmentOptionType =
  | 'ASTS Gasal'
  | 'ASAS Gasal'
  | 'ASTS Genap'
  | 'ASAS Genap / ASASGN';

export const ASSESSMENT_OPTIONS: {
  id: AssessmentOptionType;
  label: string;
  shortLabel: string;
  semester: 'Gasal' | 'Genap';
}[] = [
  {
    id: 'ASTS Gasal',
    label: '1. Asesmen Sumatif Tengah Semester Gasal (ASTS Gasal)',
    shortLabel: 'ASTS Gasal',
    semester: 'Gasal',
  },
  {
    id: 'ASAS Gasal',
    label: '2. Asesmen Sumatif Akhir Semester Gasal (ASAS Gasal)',
    shortLabel: 'ASAS Gasal',
    semester: 'Gasal',
  },
  {
    id: 'ASTS Genap',
    label: '3. Asesmen Sumatif Tengah Semester Genap (ASTS Genap)',
    shortLabel: 'ASTS Genap',
    semester: 'Genap',
  },
  {
    id: 'ASAS Genap / ASASGN',
    label: '4. Asesmen Sumatif Akhir Semester Genap (ASAS Genap / ASASGN)',
    shortLabel: 'ASAS Genap / ASASGN',
    semester: 'Genap',
  },
];

export type CalculationMode = 'MODE_A' | 'MODE_B' | 'MODE_STANDAR';
export type OutputFormatType = 'FORMAT_A' | 'FORMAT_B' | 'FORMAT_C';

export interface ModeAStudentRecord {
  benarPG: number | null; // Maks 25 soal, x 2 = Maks 50
  benarMJ: number | null; // Maks 10 soal, x 2.5 = Maks 25
  skorUraian: number | null; // Maks 25
  remedialScore: number | null; // Diisi jika Total < KKTP
  isManual?: boolean; // True jika diisi/diedit langsung oleh guru agar tidak pernah tertimpa
}

export interface ModeBStudentRecord {
  rerataUH: number | null; // Bobot 2x
  nilaiASTS: number | null; // Bobot 1x
  nilaiASAS: number | null; // Bobot 1x
  isManual?: boolean;
}

const CALC_UI_STATE_KEY = 'smpn1wedi_calc_ui_state_v2';

function loadStoredDataset(
  className: string,
  subject: SubjectOptionType,
  assessment: AssessmentOptionType
) {
  return loadLocalCalculatorDataset(className, subject, assessment);
}

function saveStoredDataset(
  className: string,
  subject: SubjectOptionType,
  assessment: AssessmentOptionType,
  data: {
    modeAData: Record<string, ModeAStudentRecord>;
    modeBData: Record<string, ModeBStudentRecord>;
    standarData: Record<string, number | null>;
  }
): string {
  return saveCalculatorDatasetEverywhere(className, subject, assessment, data);
}

// Helper: Check if a spreadsheet column title belongs to Koding (KKA) vs Informatika
function isColumnMatchingSubject(headerTitle: string, subject: SubjectOptionType, isGrade7: boolean): boolean {
  if (isGrade7) return true; // Kelas 7 hanya untuk Informatika
  const upper = (headerTitle || '').toUpperCase();
  const isKodingCol =
    upper.includes('KKA') ||
    upper.includes('KODING') ||
    upper.includes('KECERDASAN ARTIFISIAL') ||
    upper.includes('ALGORITMA') ||
    upper.includes('FLOWCHART');
  const isInformatikaCol =
    upper.includes('INFORMATIKA') ||
    upper.includes('ANALISIS DATA') ||
    upper.includes('SISTEM BILANGAN');

  if (subject === 'Koding') {
    return isKodingCol;
  } else {
    // Informatika
    if (isInformatikaCol) return true;
    if (isKodingCol) return false;
    return true;
  }
}

export const AcademicCalculatorView: React.FC<AcademicCalculatorViewProps> = ({
  spreadsheetId,
  spreadsheetUrl,
  token,
  onLogin,
  onShowAlert,
}) => {
  // Konfigurasi Default sesuai spesifikasi SMP Negeri 1 Wedi (Disimpan permanen di localStorage)
  const savedUiState = useMemo(() => {
    try {
      const raw = localStorage.getItem(CALC_UI_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [tahunAjaran, setTahunAjaran] = useState<string>(savedUiState?.tahunAjaran || '2026/2027');
  const [satuanPendidikan] = useState<string>('SMP Negeri 1 Wedi');
  const [kktp, setKktp] = useState<number>(savedUiState?.kktp ?? 75);

  // Pilihan Evaluasi / Asesmen (Dropdown)
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentOptionType>(
    savedUiState?.selectedAssessment || 'ASTS Gasal'
  );

  // Pilihan Tingkat & Kelas (Kelas 7E-7H & Kelas 8A-8H)
  const [selectedGrade, setSelectedGrade] = useState<'7' | '8'>(savedUiState?.selectedGrade || '8');
  const [selectedClass, setSelectedClass] = useState<string>(savedUiState?.selectedClass || 'Kelas 8A');

  // Pilihan Mata Pelajaran:
  // Kelas 8: Informatika dan Koding
  // Kelas 7: Hanya Informatika
  const [selectedSubject, setSelectedSubject] = useState<SubjectOptionType>(
    savedUiState?.selectedSubject || 'Informatika'
  );

  // Simpan preferensi filter UI ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        CALC_UI_STATE_KEY,
        JSON.stringify({
          tahunAjaran,
          kktp,
          selectedAssessment,
          selectedGrade,
          selectedClass,
          selectedSubject,
        })
      );
    } catch {
      // ignore
    }
  }, [tahunAjaran, kktp, selectedAssessment, selectedGrade, selectedClass, selectedSubject]);

  // Pastikan jika tingkat Kelas 7 dipilih, mata pelajaran otomatis menjadi Informatika
  useEffect(() => {
    if (selectedGrade === '7' || selectedClass.includes('7')) {
      if (selectedSubject !== 'Informatika') {
        setSelectedSubject('Informatika');
      }
    }
  }, [selectedGrade, selectedClass, selectedSubject]);

  // Daftar opsi Mata Pelajaran sesuai tingkat kelas aktif
  const availableSubjects: { id: SubjectOptionType; label: string }[] = useMemo(() => {
    if (selectedGrade === '7' || selectedClass.includes('7')) {
      return [{ id: 'Informatika', label: 'Informatika (Khusus Kelas 7)' }];
    }
    return [
      { id: 'Informatika', label: 'Informatika' },
      { id: 'Koding', label: 'Koding dan Kecerdasan Artifisial (KKA)' },
    ];
  }, [selectedGrade, selectedClass]);

  // Pilihan Mode Formula & Format Kolom Output
  const [calcMode, setCalcMode] = useState<CalculationMode>('MODE_A');
  const [outputFormat, setOutputFormat] = useState<OutputFormatType>('FORMAT_B');
  const [emptyValueSymbol, setEmptyValueSymbol] = useState<'-' | ''>('-');

  // State Data Siswa per Mode (Key: Nomor Absen string '1'..'32') - Dimuat awal dari localStorage
  const initialStored = useMemo(
    () => loadStoredDataset(selectedClass, selectedSubject, selectedAssessment),
    []
  );
  const [modeAData, setModeAData] = useState<Record<string, ModeAStudentRecord>>(
    () => initialStored?.modeAData || {}
  );
  const [modeBData, setModeBData] = useState<Record<string, ModeBStudentRecord>>(
    () => initialStored?.modeBData || {}
  );
  const [standarData, setStandarData] = useState<Record<string, number | null>>(
    () => initialStored?.standarData || {}
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    () => initialStored?.updatedAt || null
  );

  // Deteksi & Import Kolom dari Google Spreadsheets
  const [sheetDetection, setSheetDetection] = useState<ClassColumnDetectionResult | null>(null);
  const [selectedImportColumn, setSelectedImportColumn] = useState<string>('AUTO');
  const [isImportingSheet, setIsImportingSheet] = useState<boolean>(false);
  const [lastImportedInfo, setLastImportedInfo] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isSyncingSheet, setIsSyncingSheet] = useState<boolean>(false);

  // Daftar siswa kelas aktif dari database (7E-7H atau 8A-8H)
  const classStudents = useMemo(() => {
    return getStudentsByClass(selectedClass);
  }, [selectedClass]);

  // Sinkronkan tab Format Output saat Mode berubah
  const handleSelectMode = (mode: CalculationMode) => {
    setCalcMode(mode);
    if (mode === 'MODE_A') setOutputFormat('FORMAT_B');
    else if (mode === 'MODE_B') setOutputFormat('FORMAT_C');
    else setOutputFormat('FORMAT_A');
  };

  // Pilih kolom terbaik dari Google Spreadsheet berdasarkan Mata Pelajaran & Jenis Asesmen
  const findBestMatchingColumn = (
    occupied: DetectedColumnDetail[],
    subject: SubjectOptionType,
    assessment: AssessmentOptionType,
    isGrade7: boolean
  ): DetectedColumnDetail | null => {
    const withScores = occupied.filter((c) => c.hasScores && c.scoreCount > 0);
    if (withScores.length === 0) return null;

    const assessKey = assessment.split(' ')[0].toUpperCase(); // 'ASTS' atau 'ASAS'

    // 1. Cari yang cocok dengan jenis asesmen (mis. ASTS / ASAS) DAN mata pelajaran
    const exactAssessmentAndSubject = withScores.find((c) => {
      const h = (c.headerTitle || '').toUpperCase();
      return h.includes(assessKey) && isColumnMatchingSubject(h, subject, isGrade7);
    });
    if (exactAssessmentAndSubject) return exactAssessmentAndSubject;

    // Jika untuk Koding (KKA) belum ada kolom ASTS/ASAS di Google Spreadsheet, jangan mengambil nilai tugas harian atau nilai Informatika
    if (subject === 'Koding') {
      return null;
    }

    // 2. Cari kolom yang cocok dengan mata pelajaran Informatika
    const subjectColumns = withScores.filter((c) =>
      isColumnMatchingSubject(c.headerTitle || '', subject, isGrade7)
    );
    if (subjectColumns.length > 0) {
      return subjectColumns[subjectColumns.length - 1];
    }

    return null;
  };

  // Terapkan data dari hasil deteksi Google Spreadsheet ke dalam state Mode A, Mode B, dan Mode Standar
  // PENTING: Jangan pernah menimpa rincian (Benar PG, Menjodohkan, Skor Uraian, Remedial) yang sudah diisi & disimpan di localStorage!
  const applySheetDataToCalculator = (
    detection: ClassColumnDetectionResult,
    targetColKey: string,
    subject: SubjectOptionType,
    assessment: AssessmentOptionType,
    showNotification: boolean,
    forceOverwriteManual: boolean = false
  ) => {
    const isGrade7 = selectedGrade === '7' || selectedClass.includes('7');
    const occupied = detection.occupiedColumns || [];

    let chosenCol: DetectedColumnDetail | null = null;
    if (targetColKey !== 'AUTO') {
      chosenCol =
        (detection.columns || []).find((c) => c.colLetter === targetColKey) || null;
    }
    if (!chosenCol) {
      chosenCol = findBestMatchingColumn(occupied, subject, assessment, isGrade7);
    }

    // Muat data permanen yang sudah tersimpan di browser untuk kelas + mapel + asesmen ini
    const savedLocal = loadStoredDataset(selectedClass, subject, assessment);
    const prevModeA = savedLocal?.modeAData || {};
    const prevModeB = savedLocal?.modeBData || {};
    const prevStandar = savedLocal?.standarData || {};

    const nextStandar: Record<string, number | null> = { ...prevStandar };
    const nextModeA: Record<string, ModeAStudentRecord> = { ...prevModeA };
    const nextModeB: Record<string, ModeBStudentRecord> = { ...prevModeB };

    // Identifikasi kolom UH/Tugas, ASTS, dan ASAS sesuai mata pelajaran untuk Mode B (Nilai Akhir Rapor)
    const subjectOccupiedCols = occupied.filter(
      (c) => c.hasScores && isColumnMatchingSubject(c.headerTitle || '', subject, isGrade7)
    );
    const uhCols = subjectOccupiedCols.filter((c) => {
      const h = (c.headerTitle || '').toUpperCase();
      return !h.includes('ASTS') && !h.includes('ASAS');
    });
    const astsCol =
      occupied.find((c) => (c.headerTitle || '').toUpperCase().includes('ASTS') && c.hasScores) ||
      null;
    const asasCol =
      occupied.find((c) => (c.headerTitle || '').toUpperCase().includes('ASAS') && c.hasScores) ||
      null;

    let importedCount = 0;
    let preservedManualCount = 0;

    classStudents.forEach((student, idx) => {
      const attNo = student.attendanceNo || String(idx + 1);
      const rawScore = chosenCol?.gradesMap?.[attNo] ?? null;
      const existingA = prevModeA[attNo];
      const hasExistingAData =
        existingA &&
        (existingA.benarPG !== null ||
          existingA.benarMJ !== null ||
          existingA.skorUraian !== null ||
          existingA.remedialScore !== null);

      if (rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore))) {
        const roundedScore = Math.min(100, Math.max(0, Math.round(Number(rawScore))));
        nextStandar[attNo] = roundedScore;
        importedCount++;

        // PENTING: Google Spreadsheets hanya menyimpan nilai akhir bulat, bukan rincian PG/Menjodohkan/Uraian.
        // Rincian Mode A (Benar PG, Menjodohkan, Skor Uraian) HANYA diambil dari input Kalkulator Master!
        if (hasExistingAData && existingA?.isManual) {
          nextModeA[attNo] = existingA;
          preservedManualCount++;
        }
      }

      // Hitung komponen Mode B (Rerata UH, ASTS, ASAS) dari kolom-kolom spreadsheet jika belum dikunci manual
      const existingB = prevModeB[attNo];
      if (existingB?.isManual && !forceOverwriteManual) {
        nextModeB[attNo] = existingB;
      } else {
        const studentUhScores: number[] = [];
        uhCols.forEach((col) => {
          const val = col.gradesMap?.[attNo];
          if (val !== null && val !== undefined && !isNaN(Number(val))) {
            studentUhScores.push(Number(val));
          }
        });

        const computedUh =
          studentUhScores.length > 0
            ? Math.round(
                (studentUhScores.reduce((a, b) => a + b, 0) / studentUhScores.length) * 10
              ) / 10
            : rawScore !== null && rawScore !== undefined
            ? Math.round(Number(rawScore))
            : null;

        const sheetAsts =
          astsCol?.gradesMap?.[attNo] !== undefined && astsCol?.gradesMap?.[attNo] !== null
            ? Number(astsCol.gradesMap[attNo])
            : rawScore !== null && rawScore !== undefined
            ? Math.round(Number(rawScore))
            : null;

        const sheetAsas =
          asasCol?.gradesMap?.[attNo] !== undefined && asasCol?.gradesMap?.[attNo] !== null
            ? Number(asasCol.gradesMap[attNo])
            : sheetAsts !== null
            ? sheetAsts
            : computedUh;

        if (computedUh !== null || sheetAsts !== null || sheetAsas !== null) {
          nextModeB[attNo] = {
            rerataUH: computedUh,
            nilaiASTS: sheetAsts,
            nilaiASAS: sheetAsas,
          };
        }
      }
    });

    setStandarData(nextStandar);
    setModeAData(nextModeA);
    setModeBData(nextModeB);
    const savedTime = saveStoredDataset(selectedClass, subject, assessment, {
      modeAData: nextModeA,
      modeBData: nextModeB,
      standarData: nextStandar,
    });
    setLastSavedAt(savedTime);

    if (chosenCol && importedCount > 0) {
      const colLabel = chosenCol.headerTitle
        ? `Kolom ${chosenCol.colLetter} (${chosenCol.headerTitle})`
        : `Kolom ${chosenCol.colLetter}`;
      setLastImportedInfo(
        `${colLabel} • ${importedCount}/${classStudents.length} Siswa Terisi`
      );
      if (showNotification) {
        onShowAlert?.(
          'Import Data Google Spreadsheet Berhasil',
          `Berhasil memuat ${importedCount} data nilai siswa ${selectedClass} (Mapel: ${subject} — ${colLabel}).${
            preservedManualCount > 0
              ? ` ${preservedManualCount} rincian butir soal yang Anda isi manual tetap dipertahankan.`
              : ''
          }`
        );
      }
    } else {
      setLastImportedInfo(`Belum ada nilai tersimpan pada sheet ${selectedClass}`);
      if (showNotification) {
        onShowAlert?.(
          'Data Spreadsheet Kosong',
          `Belum ditemukan nilai pada tab sheet ${selectedClass} untuk diimport.`
        );
      }
    }
  };

  // Fungsi Import Data dari Google Spreadsheets
  const handleImportFromSpreadsheet = async (
    customColKey?: string,
    showNotification = true
  ) => {
    setIsImportingSheet(true);
    try {
      const res = await detectClassTaskColumns(spreadsheetId, selectedClass, token);
      setSheetDetection(res);
      const effectiveCol = customColKey !== undefined ? customColKey : selectedImportColumn;
      applySheetDataToCalculator(
        res,
        effectiveCol,
        selectedSubject,
        selectedAssessment,
        showNotification,
        false
      );
    } catch (err: any) {
      if (showNotification) {
        onShowAlert?.(
          'Gagal Mengimport Data',
          err?.message || 'Tidak dapat memuat data dari Google Spreadsheet.'
        );
      }
    } finally {
      setIsImportingSheet(false);
    }
  };

  // Saat Kelas, Mata Pelajaran, atau Jenis Asesmen berubah:
  // 1. Muat langsung data permanen dari Kalkulator Master (localStorage + Server)
  // 2. Deteksi kolom Google Spreadsheet di latar belakang untuk melengkapi nilai akhir Mode Standar & Mode B
  useEffect(() => {
    let isMounted = true;
    const stored = loadStoredDataset(selectedClass, selectedSubject, selectedAssessment);
    setModeAData(stored.modeAData || {});
    setModeBData(stored.modeBData || {});
    setStandarData(stored.standarData || {});
    setLastSavedAt(stored.updatedAt || null);

    syncAllCalculatorMasterWithServer().then((allServerDatasets) => {
      if (!isMounted) return;
      const shortKey = getDatasetShortKey(selectedClass, selectedSubject, selectedAssessment);
      const serverDs = allServerDatasets[shortKey];
      if (serverDs) {
        setModeAData(serverDs.modeAData || {});
        setModeBData((prev) => ({ ...prev, ...(serverDs.modeBData || {}) }));
        setStandarData((prev) => ({ ...prev, ...(serverDs.standarData || {}) }));
        if (serverDs.updatedAt) setLastSavedAt(serverDs.updatedAt);
      }
    });

    setSelectedImportColumn('AUTO');
    handleImportFromSpreadsheet('AUTO', false);
    return () => {
      isMounted = false;
    };
  }, [selectedClass, selectedSubject, selectedAssessment, spreadsheetId, token]);

  // Fungsi Perhitungan Mode A (Skor Asesmen & Remedial)
  // Rumus: (Benar PG × 2) + (Benar Menjodohkan × 2.5) + Skor Uraian -> Bulatkan ke bilangan bulat terdekat
  const computeModeARow = (rec?: ModeAStudentRecord) => {
    if (!rec) {
      return {
        hasData: false,
        pg: null,
        mj: null,
        uraian: null,
        skorPG: null,
        skorMJ: null,
        totalNilai: null,
        isTuntas: false,
        remedialDisplay: '-',
      };
    }

    const hasAny =
      rec.benarPG !== null || rec.benarMJ !== null || rec.skorUraian !== null;
    if (!hasAny) {
      return {
        hasData: false,
        pg: null,
        mj: null,
        uraian: null,
        skorPG: null,
        skorMJ: null,
        totalNilai: null,
        isTuntas: false,
        remedialDisplay: '-',
      };
    }

    const pg = Math.min(25, Math.max(0, rec.benarPG ?? 0));
    const mj = Math.min(10, Math.max(0, rec.benarMJ ?? 0));
    const uraian = Math.min(25, Math.max(0, rec.skorUraian ?? 0));

    const skorPG = pg * 2;
    const skorMJ = mj * 2.5;
    const rawTotal = skorPG + skorMJ + uraian;
    const totalNilai = Math.min(100, Math.max(0, Math.round(rawTotal)));
    const isTuntas = totalNilai >= kktp;

    let remedialDisplay = '-';
    if (!isTuntas) {
      if (rec.remedialScore !== null && rec.remedialScore !== undefined) {
        remedialDisplay = String(Math.min(100, Math.max(0, Math.round(rec.remedialScore))));
      } else {
        remedialDisplay = '-';
      }
    }

    return {
      hasData: true,
      pg,
      mj,
      uraian,
      skorPG,
      skorMJ,
      totalNilai,
      isTuntas,
      remedialDisplay,
    };
  };

  // Fungsi Perhitungan Mode B (Nilai Akhir Rapor)
  // Rumus: [(2 × UH) + ASTS + ASAS] / 4 -> Bulatkan ke bilangan bulat terdekat
  const computeModeBRow = (rec?: ModeBStudentRecord) => {
    if (!rec) {
      return {
        hasData: false,
        uh: null,
        twoUH: null,
        asts: null,
        asas: null,
        nilaiAkhir: null,
        isTuntas: false,
      };
    }

    const hasAny =
      rec.rerataUH !== null || rec.nilaiASTS !== null || rec.nilaiASAS !== null;
    if (!hasAny) {
      return {
        hasData: false,
        uh: null,
        twoUH: null,
        asts: null,
        asas: null,
        nilaiAkhir: null,
        isTuntas: false,
      };
    }

    const uh = Math.min(100, Math.max(0, rec.rerataUH ?? 0));
    const twoUH = Math.round(uh * 2 * 10) / 10;
    const asts = Math.min(100, Math.max(0, rec.nilaiASTS ?? 0));
    const asas = Math.min(100, Math.max(0, rec.nilaiASAS ?? 0));

    const rawFinal = (2 * uh + asts + asas) / 4;
    const nilaiAkhir = Math.min(100, Math.max(0, Math.round(rawFinal)));
    const isTuntas = nilaiAkhir >= kktp;

    return {
      hasData: true,
      uh: Math.round(uh * 10) / 10,
      twoUH,
      asts: Math.round(asts * 10) / 10,
      asas: Math.round(asas * 10) / 10,
      nilaiAkhir,
      isTuntas,
    };
  };

  // Reset Data Kelas Aktif
  const handleClearData = () => {
    let nextA = modeAData;
    let nextB = modeBData;
    let nextS = standarData;
    if (calcMode === 'MODE_A') {
      nextA = {};
      setModeAData({});
    } else if (calcMode === 'MODE_B') {
      nextB = {};
      setModeBData({});
    } else {
      nextS = {};
      setStandarData({});
    }
    const savedTime = saveStoredDataset(selectedClass, selectedSubject, selectedAssessment, {
      modeAData: nextA,
      modeBData: nextB,
      standarData: nextS,
    });
    setLastSavedAt(savedTime);
    setLastImportedInfo(null);
  };

  // Handler Perubahan Inline pada Tabel Mode A (Langsung tersimpan permanen & dikunci isManual: true)
  const handleModeAChange = (
    attNo: string,
    field: keyof ModeAStudentRecord,
    valueStr: string
  ) => {
    const trimmed = valueStr.trim();
    setModeAData((prev) => {
      const existing = prev[attNo] || {
        benarPG: null,
        benarMJ: null,
        skorUraian: null,
        remedialScore: null,
      };

      let updatedRecord: ModeAStudentRecord;
      if (trimmed === '' || trimmed === '-') {
        updatedRecord = {
          ...existing,
          [field]: null,
          isManual: true,
        };
      } else {
        const num = parseFloat(trimmed.replace(',', '.'));
        if (isNaN(num)) return prev;

        let clamped = num;
        if (field === 'benarPG') clamped = Math.min(25, Math.max(0, num));
        if (field === 'benarMJ') clamped = Math.min(10, Math.max(0, num));
        if (field === 'skorUraian') clamped = Math.min(25, Math.max(0, num));
        if (field === 'remedialScore') clamped = Math.min(100, Math.max(0, num));

        updatedRecord = {
          ...existing,
          [field]: clamped,
          isManual: true,
        };
      }

      const next = {
        ...prev,
        [attNo]: updatedRecord,
      };
      const savedTime = saveStoredDataset(selectedClass, selectedSubject, selectedAssessment, {
        modeAData: next,
        modeBData,
        standarData,
      });
      setLastSavedAt(savedTime);
      return next;
    });
  };

  // Handler Perubahan Inline pada Tabel Mode B (Langsung tersimpan permanen & dikunci isManual: true)
  const handleModeBChange = (
    attNo: string,
    field: keyof ModeBStudentRecord,
    valueStr: string
  ) => {
    const trimmed = valueStr.trim();
    setModeBData((prev) => {
      const existing = prev[attNo] || {
        rerataUH: null,
        nilaiASTS: null,
        nilaiASAS: null,
      };

      let updatedRecord: ModeBStudentRecord;
      if (trimmed === '' || trimmed === '-') {
        updatedRecord = {
          ...existing,
          [field]: null,
          isManual: true,
        };
      } else {
        const num = parseFloat(trimmed.replace(',', '.'));
        if (isNaN(num)) return prev;
        const clamped = Math.min(100, Math.max(0, num));
        updatedRecord = {
          ...existing,
          [field]: clamped,
          isManual: true,
        };
      }

      const next = {
        ...prev,
        [attNo]: updatedRecord,
      };
      const savedTime = saveStoredDataset(selectedClass, selectedSubject, selectedAssessment, {
        modeAData,
        modeBData: next,
        standarData,
      });
      setLastSavedAt(savedTime);
      return next;
    });
  };

  // Handler Perubahan Inline pada Mode Standar (Langsung tersimpan permanen)
  const handleStandarChange = (attNo: string, valueStr: string) => {
    const trimmed = valueStr.trim();
    setStandarData((prev) => {
      let nextScore: number | null = null;
      if (trimmed !== '' && trimmed !== '-') {
        const num = parseFloat(trimmed.replace(',', '.'));
        if (isNaN(num)) return prev;
        nextScore = Math.min(100, Math.max(0, Math.round(num)));
      }
      const next = {
        ...prev,
        [attNo]: nextScore,
      };
      const savedTime = saveStoredDataset(selectedClass, selectedSubject, selectedAssessment, {
        modeAData,
        modeBData,
        standarData: next,
      });
      setLastSavedAt(savedTime);
      return next;
    });
  };

  // Baris Data Terkomputasi Lengkap untuk Seluruh Siswa Kelas Aktif
  const processedRows = useMemo(() => {
    return classStudents.map((student, idx) => {
      const attNo = student.attendanceNo || String(idx + 1);
      const modeARes = computeModeARow(modeAData[attNo]);
      const modeBRes = computeModeBRow(modeBData[attNo]);
      const stdScore = standarData[attNo] ?? null;

      // Nilai utama untuk Format A (mengambil dari mode yang sedang aktif)
      let primaryScore: number | null = null;
      if (calcMode === 'MODE_A') primaryScore = modeARes.totalNilai;
      else if (calcMode === 'MODE_B') primaryScore = modeBRes.nilaiAkhir;
      else primaryScore = stdScore;

      return {
        student,
        attNo,
        nipd: student.nis || '-',
        name: student.name,
        modeA: modeARes,
        modeB: modeBRes,
        standarScore: stdScore,
        primaryScore,
      };
    });
  }, [classStudents, modeAData, modeBData, standarData, calcMode, kktp]);

  // Filter Pencarian Tabel
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return processedRows;
    const q = searchTerm.toLowerCase();
    return processedRows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.nipd.toLowerCase().includes(q) ||
        r.attNo.includes(q)
    );
  }, [processedRows, searchTerm]);

  // Statistik Ringkas Kelas
  const stats = useMemo(() => {
    let graded = 0;
    let total = 0;
    let tuntas = 0;
    let remedial = 0;
    let maxVal = -1;
    let minVal = 101;

    processedRows.forEach((r) => {
      const s = r.primaryScore;
      if (s !== null && s !== undefined) {
        graded++;
        total += s;
        if (s >= kktp) tuntas++;
        else remedial++;
        if (s > maxVal) maxVal = s;
        if (s < minVal) minVal = s;
      }
    });

    const avg = graded > 0 ? Math.round((total / graded) * 10) / 10 : 0;
    return {
      totalStudents: processedRows.length,
      graded,
      ungraded: processedRows.length - graded,
      avg,
      tuntas,
      remedial,
      maxVal: maxVal >= 0 ? maxVal : null,
      minVal: minVal <= 100 ? minVal : null,
    };
  }, [processedRows, kktp]);

  // Pembangkit Matriks Kolom Output (Format A, Format B, Format C)
  const outputTableMatrix = useMemo(() => {
    const emptyStr = emptyValueSymbol;

    if (outputFormat === 'FORMAT_A') {
      const headers = ['No Absen', 'NIPD', 'Nama Siswa', 'Nilai'];
      const rows = processedRows.map((r) => [
        r.attNo,
        r.nipd,
        r.name,
        r.primaryScore !== null ? String(r.primaryScore) : emptyStr,
      ]);
      return { headers, rows };
    }

    if (outputFormat === 'FORMAT_B') {
      const headers = [
        'No Absen',
        'NIPD',
        'Nama Siswa',
        'Benar PG',
        'Benar Menjodohkan',
        'Skor Uraian',
        'Total Nilai',
        'Nilai Remedial',
      ];
      const rows = processedRows.map((r) => {
        const m = r.modeA;
        if (!m.hasData) {
          return [
            r.attNo,
            r.nipd,
            r.name,
            emptyStr,
            emptyStr,
            emptyStr,
            emptyStr,
            emptyStr,
          ];
        }
        return [
          r.attNo,
          r.nipd,
          r.name,
          String(m.pg ?? emptyStr),
          String(m.mj ?? emptyStr),
          String(m.uraian ?? emptyStr),
          String(m.totalNilai ?? emptyStr),
          m.remedialDisplay,
        ];
      });
      return { headers, rows };
    }

    // FORMAT_C: Rincian Nilai Akhir Rapor
    const headers = [
      'No Absen',
      'NIPD',
      'Nama Siswa',
      'Rerata UH',
      '2x UH',
      'ASTS',
      'ASAS',
      'Nilai Akhir Rapor',
    ];
    const rows = processedRows.map((r) => {
      const m = r.modeB;
      if (!m.hasData) {
        return [
          r.attNo,
          r.nipd,
          r.name,
          emptyStr,
          emptyStr,
          emptyStr,
          emptyStr,
          emptyStr,
        ];
      }
      return [
        r.attNo,
        r.nipd,
        r.name,
        String(m.uh ?? emptyStr),
        String(m.twoUH ?? emptyStr),
        String(m.asts ?? emptyStr),
        String(m.asas ?? emptyStr),
        String(m.nilaiAkhir ?? emptyStr),
      ];
    });
    return { headers, rows };
  }, [outputFormat, processedRows, emptyValueSymbol]);

  // Teks TSV dan CSV untuk Preview & Copy-Paste
  const tsvOutputText = useMemo(() => {
    const lines = [
      outputTableMatrix.headers.join('\t'),
      ...outputTableMatrix.rows.map((row) => row.join('\t')),
    ];
    return lines.join('\n');
  }, [outputTableMatrix]);

  const csvOutputText = useMemo(() => {
    const escapeCsv = (val: string) =>
      val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    const lines = [
      outputTableMatrix.headers.map(escapeCsv).join(','),
      ...outputTableMatrix.rows.map((row) => row.map(escapeCsv).join(',')),
    ];
    return lines.join('\n');
  }, [outputTableMatrix]);

  // Salin Tabel TSV (Siap Paste ke Google Sheets / Excel)
  const handleCopyTSV = (includeHeaders = true) => {
    const content = includeHeaders
      ? tsvOutputText
      : outputTableMatrix.rows.map((row) => row.join('\t')).join('\n');
    navigator.clipboard.writeText(content);
    const msg = includeHeaders
      ? `Tabel TSV (${outputFormat.replace('_', ' ')}) lengkap dengan header berhasil disalin! Siap paste (Ctrl+V) ke Google Sheets / Excel.`
      : `Baris data TSV tanpa header berhasil disalin!`;
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 4000);
    onShowAlert?.('Disalin ke Clipboard (TSV)', msg);
  };

  // Salin Format CSV
  const handleCopyCSV = () => {
    navigator.clipboard.writeText(csvOutputText);
    const msg = `Tabel format CSV (${outputFormat.replace('_', ' ')}) berhasil disalin ke clipboard!`;
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 4000);
    onShowAlert?.('Disalin ke Clipboard (CSV)', msg);
  };

  // Salin Kolom Nilai Akhir Saja
  const handleCopyScoresOnly = () => {
    const lines = processedRows.map((r) =>
      r.primaryScore !== null ? String(r.primaryScore) : emptyValueSymbol
    );
    navigator.clipboard.writeText(lines.join('\n'));
    const msg = `Kolom nilai (${processedRows.length} baris) berhasil disalin! Siap ditempel langsung ke kolom nilai Google Sheets.`;
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 4000);
    onShowAlert?.('Kolom Nilai Disalin', msg);
  };

  // Unduh File Excel (.xlsx)
  const handleDownloadExcel = () => {
    const metadataHeader = [
      [`${satuanPendidikan.toUpperCase()} - REKAPITULASI & KALKULATOR AKADEMIK`],
      [
        `Mata Pelajaran: ${selectedSubject} | Jenis Asesmen: ${selectedAssessment} | Kelas: ${selectedClass} | Tahun Ajaran: ${tahunAjaran} | KKTP: ${kktp}`,
      ],
      [],
      outputTableMatrix.headers,
      ...outputTableMatrix.rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(metadataHeader);
    const wb = XLSX.utils.book_new();
    const sheetName = selectedClass.replace(/^Kelas\s*/i, '') || 'Rekap';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const safeAssessment = selectedAssessment.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Nilai_${sheetName}_${selectedSubject}_${safeAssessment}_${tahunAjaran.replace('/', '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    onShowAlert?.('Unduh Excel Berhasil', `File ${fileName} berhasil diunduh.`);
  };

  // Sinkronkan Nilai Hasil Perhitungan ke Tab Kelas di Google Sheets
  const handleSyncToClassSheet = async () => {
    if (!token) {
      onShowAlert?.(
        'Autentikasi Diperlukan',
        'Silakan klik LOGIN GOOGLE terlebih dahulu untuk menyinkronkan nilai langsung ke Google Spreadsheet.'
      );
      onLogin();
      return;
    }

    setIsSyncingSheet(true);
    try {
      const items: StudentGradeItem[] = processedRows.map((r) => ({
        attendanceNo: r.attNo,
        nis: r.nipd,
        name: r.name,
        gender: r.student.gender,
        score: r.primaryScore,
        benarPG: r.modeA.pg,
        benarMJ: r.modeA.mj,
        skorUraian: r.modeA.uraian,
        remedialScore: modeAData[r.attNo]?.remedialScore ?? null,
      }));

      const subjectTitleLabel =
        selectedSubject === 'Koding'
          ? 'Koding dan Kecerdasan Artifisial (KKA)'
          : selectedSubject;
      const taskTitle = `${selectedAssessment} - ${subjectTitleLabel} (${tahunAjaran})`;
      const targetCol = selectedImportColumn !== 'AUTO' ? selectedImportColumn : 'AUTO';
      const res = await syncGradesToClassSheet(
        token,
        spreadsheetId,
        selectedClass,
        taskTitle,
        items,
        targetCol
      );

      if (res.success) {
        onShowAlert?.('Sinkronisasi Spreadsheet Berhasil', res.message);
        // Perbarui metadata daftar kolom sheet tanpa menimpa rincian PG/Menjodohkan/Uraian yang baru saja diketik
        const updatedDetection = await detectClassTaskColumns(spreadsheetId, selectedClass, token);
        setSheetDetection(updatedDetection);
      } else {
        onShowAlert?.('Gagal Sinkronisasi', res.message);
      }
    } catch (err: any) {
      onShowAlert?.('Error Koneksi', err?.message || 'Gagal menghubungi Google Sheets API.');
    } finally {
      setIsSyncingSheet(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* 1. HEADER UTAMA & IDENTITAS SATUAN PENDIDIKAN */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono-code text-[11px] font-bold uppercase tracking-widest bg-[#2e59e6] text-white px-2.5 py-0.5 border border-[#1a1a1a]">
                {satuanPendidikan.toUpperCase()}
              </span>
              <span className="font-mono-code text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 border border-amber-400">
                [ MAPEL: {selectedSubject === 'Koding' ? 'KODING DAN KECERDASAN ARTIFISIAL (KKA)' : selectedSubject.toUpperCase()} ]
              </span>
              <span className="font-mono-code text-[11px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 border border-emerald-400">
                TAHUN AJARAN {tahunAjaran} • KKTP: {kktp}
              </span>
            </div>
            <h1 className="font-serif-display italic font-bold text-2xl sm:text-3xl text-[#1a1a1a] tracking-tight">
              Kalkulator Akademik & Pengolah Nilai Asesmen / Rapor
            </h1>
            <p className="font-mono-code text-xs text-slate-600 mt-1 max-w-3xl">
              Pemetaan otomatis berbasis Nomor Absen ke Nama Siswa & NIPD resmi ({selectedClass} • Mapel {selectedSubject}) terhubung langsung dengan Google Spreadsheet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleImportFromSpreadsheet(selectedImportColumn, true)}
              disabled={isImportingSheet}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono-code font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] transition-all cursor-pointer disabled:opacity-50"
            >
              <DownloadCloud className={`h-4 w-4 ${isImportingSheet ? 'animate-bounce' : ''}`} />
              <span>
                {isImportingSheet ? 'MENGIMPORT DATA...' : 'IMPORT DATA GOOGLE SPREADSHEET'}
              </span>
            </button>

            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono-code font-bold bg-white hover:bg-slate-50 text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] transition-all cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>BUKA GOOGLE SHEET</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. PANEL KONFIGURASI: DROPDOWN MATA PELAJARAN, ASESMEN, KELAS & MODE FORMULA */}
      <div className="bg-[#F2EFEB] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 space-y-4">
        {/* Baris 1: Dropdown Mata Pelajaran, Pilihan Evaluasi / Asesmen & Konfigurasi Default */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white border-2 border-[#1a1a1a] p-4 shadow-[2px_2px_0px_#1a1a1a]">
          {/* Dropdown Mata Pelajaran */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="block font-mono-code text-xs font-black text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#2e59e6]" />
              <span>MATA PELAJARAN:</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as SubjectOptionType)}
              className="w-full bg-[#FAF8F5] border-2 border-[#1a1a1a] px-3 py-2.5 text-xs font-mono-code font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] focus:outline-hidden focus:ring-2 focus:ring-[#2e59e6] cursor-pointer"
            >
              {availableSubjects.map((subj) => (
                <option key={subj.id} value={subj.id}>
                  {subj.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Pilihan Evaluasi / Asesmen */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="block font-mono-code text-xs font-black text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#2e59e6]" />
              <span>PILIHAN EVALUASI / ASESMEN:</span>
            </label>
            <select
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value as AssessmentOptionType)}
              className="w-full bg-[#FAF8F5] border-2 border-[#1a1a1a] px-3 py-2.5 text-xs font-mono-code font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] focus:outline-hidden focus:ring-2 focus:ring-[#2e59e6] cursor-pointer"
            >
              {ASSESSMENT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 space-y-1.5">
            <label className="block font-mono-code text-[11px] font-bold text-slate-700 uppercase">
              TAHUN AJARAN:
            </label>
            <input
              type="text"
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-2 text-xs font-mono-code font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
            />
          </div>

          <div className="lg:col-span-1 space-y-1.5">
            <label className="block font-mono-code text-[11px] font-bold text-slate-700 uppercase">
              KKTP:
            </label>
            <input
              type="number"
              min={50}
              max={100}
              value={kktp}
              onChange={(e) =>
                setKktp(Math.min(100, Math.max(50, parseInt(e.target.value || '75', 10))))
              }
              className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-2 text-xs font-mono-code font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
            />
          </div>

          <div className="lg:col-span-2 space-y-1.5">
            <label className="block font-mono-code text-[11px] font-bold text-slate-700 uppercase">
              NILAI KOSONG:
            </label>
            <select
              value={emptyValueSymbol}
              onChange={(e) => setEmptyValueSymbol(e.target.value as '-' | '')}
              className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-2 text-xs font-mono-code font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] cursor-pointer"
            >
              <option value="-">Tanda Strip (-)</option>
              <option value="">Kosongkan Sel</option>
            </select>
          </div>
        </div>

        {/* Baris 2: Pilihan Tingkat & Kelas (7E-7H dan 8A-8H) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1a1a1a] pb-3.5">
          <div className="flex items-center gap-2 font-mono-code text-xs font-bold flex-wrap">
            <span className="text-slate-600 uppercase tracking-wider">PILIH TINGKAT KELAS:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedGrade('7');
                  setSelectedClass('Kelas 7E');
                  setSelectedSubject('Informatika');
                }}
                className={`px-4 py-1.5 text-xs font-bold font-mono-code border-2 transition-all cursor-pointer ${
                  selectedGrade === '7'
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#2e59e6]'
                    : 'bg-white text-slate-700 border-[#1a1a1a] hover:bg-slate-100'
                }`}
              >
                KELAS 7 (7E - 7H) • INFORMATIKA
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedGrade('8');
                  setSelectedClass('Kelas 8A');
                }}
                className={`px-4 py-1.5 text-xs font-bold font-mono-code border-2 transition-all cursor-pointer ${
                  selectedGrade === '8'
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#2e59e6]'
                    : 'bg-white text-slate-700 border-[#1a1a1a] hover:bg-slate-100'
                }`}
              >
                KELAS 8 (8A - 8H) • INFORMATIKA &amp; KKA
              </button>
            </div>
          </div>

          <div className="font-mono-code text-xs text-slate-700 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[#2e59e6]" />
            <span>
              Database Kelas Aktif: <strong>{selectedClass}</strong> ({classStudents.length} Siswa) • Mapel: <strong>{selectedSubject}</strong>
            </span>
          </div>
        </div>

        {/* Tombol Kelas Individual */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(selectedGrade === '7' ? GRADE_7_CLASSES : GRADE_8_CLASSES).map((cls) => {
            const isActive = selectedClass === cls;
            const shortCode = cls.replace(/^Kelas\s*/i, '');
            return (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`px-3.5 py-2 font-mono-code text-xs font-bold shrink-0 border-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2e59e6] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-slate-100'
                }`}
              >
                {shortCode}
              </button>
            );
          })}
        </div>

        {/* Baris 3: Pilihan Mode Formula & Perhitungan Nilai */}
        <div className="pt-2">
          <div className="font-mono-code text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
            PILIH MODE FORMULA & PERHITUNGAN NILAI:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Mode A */}
            <button
              type="button"
              onClick={() => handleSelectMode('MODE_A')}
              className={`p-3.5 text-left border-2 transition-all cursor-pointer ${
                calcMode === 'MODE_A'
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[3px_3px_0px_#2e59e6]'
                  : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between font-mono-code text-xs font-bold mb-1">
                <span className="text-amber-400">[ MODE A ]</span>
                {calcMode === 'MODE_A' && (
                  <span className="px-1.5 py-0.5 bg-[#2e59e6] text-white text-[10px]">AKTIF</span>
                )}
              </div>
              <div className="font-mono-code text-xs font-bold uppercase">
                Skor Asesmen & Remedial
              </div>
              <p
                className={`font-mono-code text-[11px] mt-1 leading-relaxed ${
                  calcMode === 'MODE_A' ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Rumus: (PG × 2) + (Menjodohkan × 2.5) + Skor Uraian. Pembulatan bulat terdekat & Remedial (&lt;{kktp}).
              </p>
            </button>

            {/* Mode B */}
            <button
              type="button"
              onClick={() => handleSelectMode('MODE_B')}
              className={`p-3.5 text-left border-2 transition-all cursor-pointer ${
                calcMode === 'MODE_B'
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[3px_3px_0px_#2e59e6]'
                  : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between font-mono-code text-xs font-bold mb-1">
                <span className="text-emerald-400">[ MODE B ]</span>
                {calcMode === 'MODE_B' && (
                  <span className="px-1.5 py-0.5 bg-[#2e59e6] text-white text-[10px]">AKTIF</span>
                )}
              </div>
              <div className="font-mono-code text-xs font-bold uppercase">
                Nilai Akhir Rapor (Gasal / Genap)
              </div>
              <p
                className={`font-mono-code text-[11px] mt-1 leading-relaxed ${
                  calcMode === 'MODE_B' ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Rumus: [(2 × Rerata UH) + ASTS + ASAS] / 4. Dibulatkan ke bilangan bulat terdekat.
              </p>
            </button>

            {/* Mode Standar */}
            <button
              type="button"
              onClick={() => handleSelectMode('MODE_STANDAR')}
              className={`p-3.5 text-left border-2 transition-all cursor-pointer ${
                calcMode === 'MODE_STANDAR'
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[3px_3px_0px_#2e59e6]'
                  : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between font-mono-code text-xs font-bold mb-1">
                <span className="text-blue-400">[ MODE STANDAR ]</span>
                {calcMode === 'MODE_STANDAR' && (
                  <span className="px-1.5 py-0.5 bg-[#2e59e6] text-white text-[10px]">AKTIF</span>
                )}
              </div>
              <div className="font-mono-code text-xs font-bold uppercase">
                Format Cepat / Rekap Nilai
              </div>
              <p
                className={`font-mono-code text-[11px] mt-1 leading-relaxed ${
                  calcMode === 'MODE_STANDAR' ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Pemetaan langsung [No Absen] | [NIPD] | [Nama Siswa] | [Nilai] tanpa rincian butir.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* 3. SPESIFIKASI FORMULA, STATISTIK & IMPORT / SINKRONISASI GOOGLE SPREADSHEETS */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1a1a1a] pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Calculator className="h-5 w-5 text-[#2e59e6]" />
            <h3 className="font-serif-display font-bold text-lg text-[#1a1a1a]">
              Spesifikasi Formula & Statistik
            </h3>
            <span className="font-mono-code text-[10px] font-bold bg-[#2e59e6] text-white px-2 py-0.5 border border-[#1a1a1a]">
              MAPEL: {selectedSubject.toUpperCase()}
            </span>
            {lastImportedInfo && (
              <span className="font-mono-code text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 border border-emerald-500">
                SUMBER SHEET: {lastImportedInfo}
              </span>
            )}
          </div>
          <span className="font-mono-code text-[10px] font-bold bg-[#1a1a1a] text-white px-2.5 py-1">
            KKTP = {kktp}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Kiri: Aturan Mode Aktif */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            {calcMode === 'MODE_A' ? (
              <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3.5 font-mono-code text-xs space-y-1.5 h-full">
                <div className="font-bold text-[#2e59e6] uppercase">
                  ATURAN MODE A (SKOR ASESMEN & REMEDIAL):
                </div>
                <ul className="space-y-1 text-[11px] text-slate-700 list-disc pl-4">
                  <li>
                    <strong>Pilihan Ganda (PG)</strong>: Benar × 2 (Maks 25 soal &rarr; Skor Maks: 50)
                  </li>
                  <li>
                    <strong>Menjodohkan</strong>: Benar × 2.5 (Maks 10 soal &rarr; Skor Maks: 25)
                  </li>
                  <li>
                    <strong>Uraian</strong>: Skor Uraian langsung (Skor Maks: 25)
                  </li>
                  <li>
                    <strong>Total Skor</strong>: <code>(PG × 2) + (MJ × 2.5) + Uraian</code> (Dibulatkan)
                  </li>
                  <li>
                    <strong>Remedial</strong>: Jika Total &lt; {kktp}, berhak Remedial (Maks 100) atau <code>"-"</code> jika tuntas.
                  </li>
                </ul>
              </div>
            ) : calcMode === 'MODE_B' ? (
              <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3.5 font-mono-code text-xs space-y-1.5 h-full">
                <div className="font-bold text-emerald-700 uppercase">
                  ATURAN MODE B (NILAI AKHIR RAPOR):
                </div>
                <ul className="space-y-1 text-[11px] text-slate-700 list-disc pl-4">
                  <li>
                    <strong>Rerata Ulangan Harian (UH)</strong> berbobot 2x: <code>(2 × UH)</code>
                  </li>
                  <li>
                    <strong>Nilai ASTS (Tengah Semester)</strong> berbobot 1x: <code>(1 × ASTS)</code>
                  </li>
                  <li>
                    <strong>Nilai ASAS (Akhir Semester)</strong> berbobot 1x: <code>(1 × ASAS)</code>
                  </li>
                  <li>
                    <strong>Nilai Akhir Rapor</strong>: <code>[(2 × UH) + ASTS + ASAS] / 4</code> (Dibulatkan)
                  </li>
                </ul>
              </div>
            ) : (
              <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3.5 font-mono-code text-xs space-y-1.5 h-full">
                <div className="font-bold text-[#2e59e6] uppercase">
                  ATURAN FORMAT STANDAR (REKAP CEPAT):
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Memetakan Nomor Absen langsung ke NIPD dan Nama Siswa sesuai urutan buku induk {selectedClass}. Absen tanpa nilai otomatis diberi tanda <code>"{emptyValueSymbol || 'kosong'}"</code>.
                </p>
              </div>
            )}
          </div>

          {/* Kanan: 4 Kartu Statistik */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-2.5 font-mono-code">
            <div className="p-3 bg-[#FAF8F5] border-2 border-[#1a1a1a]">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                TERISI / TOTAL SISWA
              </span>
              <span className="text-xl font-black text-[#1a1a1a]">
                {stats.graded} / {stats.totalStudents}
              </span>
            </div>
            <div className="p-3 bg-[#FAF8F5] border-2 border-[#1a1a1a]">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                RATA-RATA KELAS
              </span>
              <span className="text-xl font-black text-[#2e59e6]">
                {stats.avg > 0 ? stats.avg : '-'}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 border-2 border-emerald-700">
              <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                TUNTAS (≥ {kktp})
              </span>
              <span className="text-xl font-black text-emerald-800">
                {stats.tuntas} Siswa
              </span>
            </div>
            <div className="p-3 bg-rose-50 border-2 border-rose-700">
              <span className="text-[10px] text-rose-800 font-bold uppercase block">
                REMEDIAL (&lt; {kktp})
              </span>
              <span className="text-xl font-black text-rose-800">
                {stats.remedial} Siswa
              </span>
            </div>
          </div>
        </div>

        {/* Baris Kontrol Import & Sinkronisasi Google Spreadsheets */}
        <div className="pt-3 border-t-2 border-[#1a1a1a] grid grid-cols-1 lg:grid-cols-12 gap-3 items-center font-mono-code text-xs">
          {/* Pilihan Kolom Spreadsheet yang akan Diimport */}
          <div className="lg:col-span-4 flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-600 uppercase shrink-0">
              KOLOM SHEET:
            </label>
            <select
              value={selectedImportColumn}
              onChange={(e) => {
                const colVal = e.target.value;
                setSelectedImportColumn(colVal);
                if (sheetDetection) {
                  applySheetDataToCalculator(
                    sheetDetection,
                    colVal,
                    selectedSubject,
                    selectedAssessment,
                    true
                  );
                } else {
                  handleImportFromSpreadsheet(colVal, true);
                }
              }}
              className="w-full bg-[#FAF8F5] border-2 border-[#1a1a1a] px-2.5 py-2 text-xs font-bold text-[#1a1a1a] cursor-pointer"
            >
              <option value="AUTO">
                Otomatis (Sesuai Mapel {selectedSubject} & {selectedAssessment})
              </option>
              {(sheetDetection?.occupiedColumns || []).map((col) => (
                <option key={col.colLetter} value={col.colLetter}>
                  Kolom {col.colLetter}: {col.headerTitle || `Tugas Kolom ${col.colLetter}`} ({col.scoreCount} nilai)
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Import Data dari Google Spreadsheets */}
          <div className="lg:col-span-4">
            <button
              type="button"
              onClick={() => handleImportFromSpreadsheet(selectedImportColumn, true)}
              disabled={isImportingSheet}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isImportingSheet ? 'animate-spin' : ''}`} />
              <span>
                {isImportingSheet
                  ? 'MENGAMBIL DATA SPREADSHEET...'
                  : `IMPORT DATA DARI SHEET '${selectedClass.replace(/^Kelas\s*/i, '')}'`}
              </span>
            </button>
          </div>

          {/* Tombol Sinkronisasi Langsung ke Google Sheets */}
          <div className="lg:col-span-4">
            <button
              type="button"
              onClick={handleSyncToClassSheet}
              disabled={isSyncingSheet}
              className="w-full py-2.5 px-3 bg-[#1a1a1a] hover:bg-[#2e59e6] text-white font-bold border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#2e59e6] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="h-4 w-4 text-emerald-400" />
              <span>
                {isSyncingSheet
                  ? 'MENYINKRONKAN KE SPREADSHEET...'
                  : `SINKRONKAN KE SHEET '${selectedClass.replace(/^Kelas\s*/i, '')}' (${selectedSubject})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. TABEL INTERAKTIF PERHITUNGAN & PEMETAAN DATA SISWA */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
        <div className="p-4 sm:p-5 bg-[#FAF8F5] border-b-2 border-[#1a1a1a] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <BookOpen className="h-5 w-5 text-[#2e59e6]" />
              <h3 className="font-serif-display font-bold text-xl text-[#1a1a1a]">
                Tabel Pengolahan Nilai Siswa — {selectedClass}
              </h3>
              <span className="font-mono-code text-[11px] font-bold bg-[#2e59e6] text-white px-2.5 py-0.5 border border-[#1a1a1a]">
                {selectedAssessment}
              </span>
              <span className="font-mono-code text-[11px] font-bold bg-amber-100 text-amber-950 px-2.5 py-0.5 border border-[#1a1a1a]">
                Mapel: {selectedSubject}
              </span>
              <span className="font-mono-code text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 border border-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                <span>
                  TERSIMPAN OTOMATIS PERMANEN{lastSavedAt ? ` (${lastSavedAt})` : ''}
                </span>
              </span>
            </div>
            <p className="font-mono-code text-xs text-slate-600 mt-0.5">
              Setiap angka yang Anda ketik pada kolom di bawah otomatis tersimpan permanen dan terkunci (tidak akan berubah/tertimpa).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleClearData}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-500 font-mono-code text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Kosongkan nilai pada tabel tampilan ini"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Tabel</span>
            </button>

            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari absen / NIPD / nama..."
                className="pl-8 pr-3 py-1.5 bg-white border-2 border-[#1a1a1a] font-mono-code text-xs text-[#1a1a1a] w-52 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono-code text-xs">
            <thead>
              {calcMode === 'MODE_A' && (
                <tr className="bg-[#1a1a1a] text-white border-b-2 border-[#1a1a1a] text-[11px] uppercase">
                  <th className="py-3 px-3 text-center w-16 border-r border-white/20">NO ABSEN</th>
                  <th className="py-3 px-3 w-24 border-r border-white/20">NIPD</th>
                  <th className="py-3 px-4 border-r border-white/20">NAMA SISWA</th>
                  <th className="py-3 px-3 text-center w-28 border-r border-white/20 bg-slate-800">
                    BENAR PG
                    <span className="block text-[9px] text-amber-300 font-normal">Maks 25 (×2)</span>
                  </th>
                  <th className="py-3 px-3 text-center w-32 border-r border-white/20 bg-slate-800">
                    MENJODOHKAN
                    <span className="block text-[9px] text-amber-300 font-normal">Maks 10 (×2.5)</span>
                  </th>
                  <th className="py-3 px-3 text-center w-28 border-r border-white/20 bg-slate-800">
                    SKOR URAIAN
                    <span className="block text-[9px] text-amber-300 font-normal">Maks 25</span>
                  </th>
                  <th className="py-3 px-3 text-center w-28 border-r border-white/20 bg-[#2e59e6]">
                    TOTAL NILAI
                    <span className="block text-[9px] text-blue-100 font-normal">Bulat (0-100)</span>
                  </th>
                  <th className="py-3 px-3 text-center w-32">
                    NILAI REMEDIAL
                    <span className="block text-[9px] text-slate-300 font-normal">&lt;{kktp} / "-"</span>
                  </th>
                </tr>
              )}

              {calcMode === 'MODE_B' && (
                <tr className="bg-[#1a1a1a] text-white border-b-2 border-[#1a1a1a] text-[11px] uppercase">
                  <th className="py-3 px-3 text-center w-16 border-r border-white/20">NO ABSEN</th>
                  <th className="py-3 px-3 w-24 border-r border-white/20">NIPD</th>
                  <th className="py-3 px-4 border-r border-white/20">NAMA SISWA</th>
                  <th className="py-3 px-3 text-center w-28 border-r border-white/20 bg-slate-800">
                    RERATA UH
                    <span className="block text-[9px] text-emerald-300 font-normal">Bobot 2x</span>
                  </th>
                  <th className="py-3 px-3 text-center w-24 border-r border-white/20 bg-slate-900">
                    2 × UH
                    <span className="block text-[9px] text-slate-400 font-normal">Otomatis</span>
                  </th>
                  <th className="py-3 px-3 text-center w-28 border-r border-white/20 bg-slate-800">
                    ASTS
                    <span className="block text-[9px] text-emerald-300 font-normal">Bobot 1x</span>
                  </th>
                  <th className="py-3 px-3 text-center w-28 border-r border-white/20 bg-slate-800">
                    ASAS
                    <span className="block text-[9px] text-emerald-300 font-normal">Bobot 1x</span>
                  </th>
                  <th className="py-3 px-3 text-center w-36 bg-[#2e59e6]">
                    NILAI AKHIR RAPOR
                    <span className="block text-[9px] text-blue-100 font-normal">[(2×UH)+ASTS+ASAS]/4</span>
                  </th>
                </tr>
              )}

              {calcMode === 'MODE_STANDAR' && (
                <tr className="bg-[#1a1a1a] text-white border-b-2 border-[#1a1a1a] text-[11px] uppercase">
                  <th className="py-3 px-3 text-center w-20 border-r border-white/20">NO ABSEN</th>
                  <th className="py-3 px-4 w-32 border-r border-white/20">NIPD</th>
                  <th className="py-3 px-4 border-r border-white/20">NAMA SISWA</th>
                  <th className="py-3 px-4 text-center w-40 bg-[#2e59e6]">NILAI</th>
                  <th className="py-3 px-4 text-center w-40">KETERANGAN</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredRows.map((row, idx) => {
                const { attNo, nipd, name, modeA, modeB, standarScore } = row;
                const rawA = modeAData[attNo];
                const rawB = modeBData[attNo];

                if (calcMode === 'MODE_A') {
                  return (
                    <tr
                      key={row.student.id || attNo}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]'}
                    >
                      <td className="py-2 px-3 text-center font-bold border-r border-slate-200">
                        {attNo}
                      </td>
                      <td className="py-2 px-3 text-slate-600 border-r border-slate-200">
                        {nipd}
                      </td>
                      <td className="py-2 px-4 font-bold text-[#1a1a1a] border-r border-slate-200">
                        {name}
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min={0}
                          max={25}
                          step="1"
                          placeholder="-"
                          value={rawA?.benarPG ?? ''}
                          onChange={(e) => handleModeAChange(attNo, 'benarPG', e.target.value)}
                          className="w-20 text-center py-1 px-1.5 bg-white border border-[#1a1a1a] font-bold text-xs focus:ring-2 focus:ring-[#2e59e6] focus:outline-hidden"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step="1"
                          placeholder="-"
                          value={rawA?.benarMJ ?? ''}
                          onChange={(e) => handleModeAChange(attNo, 'benarMJ', e.target.value)}
                          className="w-20 text-center py-1 px-1.5 bg-white border border-[#1a1a1a] font-bold text-xs focus:ring-2 focus:ring-[#2e59e6] focus:outline-hidden"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min={0}
                          max={25}
                          step="0.5"
                          placeholder="-"
                          value={rawA?.skorUraian ?? ''}
                          onChange={(e) => handleModeAChange(attNo, 'skorUraian', e.target.value)}
                          className="w-20 text-center py-1 px-1.5 bg-white border border-[#1a1a1a] font-bold text-xs focus:ring-2 focus:ring-[#2e59e6] focus:outline-hidden"
                        />
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200 bg-blue-50/40">
                        {modeA.hasData ? (
                          <span
                            className={`inline-block px-2.5 py-1 font-black text-xs border ${
                              modeA.isTuntas
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-600'
                                : 'bg-rose-100 text-rose-900 border-rose-600'
                            }`}
                          >
                            {modeA.totalNilai}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">{emptyValueSymbol}</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        {modeA.hasData && !modeA.isTuntas ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="Remedial"
                            value={rawA?.remedialScore ?? ''}
                            onChange={(e) =>
                              handleModeAChange(attNo, 'remedialScore', e.target.value)
                            }
                            className="w-24 text-center py-1 px-2 bg-amber-50 border-2 border-amber-500 font-bold text-xs text-amber-950 focus:outline-hidden"
                          />
                        ) : (
                          <span className="text-slate-400 font-bold">-</span>
                        )}
                      </td>
                    </tr>
                  );
                }

                if (calcMode === 'MODE_B') {
                  return (
                    <tr
                      key={row.student.id || attNo}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]'}
                    >
                      <td className="py-2 px-3 text-center font-bold border-r border-slate-200">
                        {attNo}
                      </td>
                      <td className="py-2 px-3 text-slate-600 border-r border-slate-200">
                        {nipd}
                      </td>
                      <td className="py-2 px-4 font-bold text-[#1a1a1a] border-r border-slate-200">
                        {name}
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          placeholder="-"
                          value={rawB?.rerataUH ?? ''}
                          onChange={(e) => handleModeBChange(attNo, 'rerataUH', e.target.value)}
                          className="w-20 text-center py-1 px-1.5 bg-white border border-[#1a1a1a] font-bold text-xs focus:ring-2 focus:ring-[#2e59e6] focus:outline-hidden"
                        />
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-200 bg-slate-100/70">
                        {modeB.hasData ? modeB.twoUH : emptyValueSymbol}
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          placeholder="-"
                          value={rawB?.nilaiASTS ?? ''}
                          onChange={(e) => handleModeBChange(attNo, 'nilaiASTS', e.target.value)}
                          className="w-20 text-center py-1 px-1.5 bg-white border border-[#1a1a1a] font-bold text-xs focus:ring-2 focus:ring-[#2e59e6] focus:outline-hidden"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          placeholder="-"
                          value={rawB?.nilaiASAS ?? ''}
                          onChange={(e) => handleModeBChange(attNo, 'nilaiASAS', e.target.value)}
                          className="w-20 text-center py-1 px-1.5 bg-white border border-[#1a1a1a] font-bold text-xs focus:ring-2 focus:ring-[#2e59e6] focus:outline-hidden"
                        />
                      </td>
                      <td className="py-2 px-3 text-center bg-blue-50/40">
                        {modeB.hasData ? (
                          <span
                            className={`inline-block px-2.5 py-1 font-black text-xs border ${
                              modeB.isTuntas
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-600'
                                : 'bg-rose-100 text-rose-900 border-rose-600'
                            }`}
                          >
                            {modeB.nilaiAkhir}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">{emptyValueSymbol}</span>
                        )}
                      </td>
                    </tr>
                  );
                }

                // MODE_STANDAR
                const hasStd = standarScore !== null && standarScore !== undefined;
                const isStdTuntas = hasStd && standarScore >= kktp;
                return (
                  <tr
                    key={row.student.id || attNo}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]'}
                  >
                    <td className="py-2 px-3 text-center font-bold border-r border-slate-200">
                      {attNo}
                    </td>
                    <td className="py-2 px-4 text-slate-600 border-r border-slate-200">
                      {nipd}
                    </td>
                    <td className="py-2 px-4 font-bold text-[#1a1a1a] border-r border-slate-200">
                      {name}
                    </td>
                    <td className="py-1.5 px-3 text-center border-r border-slate-200 bg-blue-50/30">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="-"
                        value={standarScore ?? ''}
                        onChange={(e) => handleStandarChange(attNo, e.target.value)}
                        className="w-24 text-center py-1 px-2 bg-white border border-[#1a1a1a] font-bold text-xs focus:ring-2 focus:ring-[#2e59e6] focus:outline-hidden"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      {!hasStd ? (
                        <span className="text-slate-400 font-bold">-</span>
                      ) : isStdTuntas ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-500 text-[10px] font-bold">
                          TUNTAS (≥{kktp})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-500 text-[10px] font-bold">
                          REMEDIAL (&lt;{kktp})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. PANEL OUTPUT TABEL CSV / TSV SIAP COPY-PASTE KE GOOGLE SHEETS / EXCEL */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b-2 border-[#1a1a1a] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Table className="h-5 w-5 text-[#2e59e6]" />
              <h3 className="font-serif-display font-bold text-xl text-[#1a1a1a]">
                Output Tabel Terstruktur (CSV / TSV) — Siap Copy-Paste ke Google Sheets & Excel
              </h3>
            </div>
            <p className="font-mono-code text-xs text-slate-600 mt-0.5">
              Pilih salah satu dari 3 Format Kolom Output standar di bawah ini:
            </p>
          </div>

          {/* Pilihan Format Kolom Output A, B, C */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono-code text-xs">
            <button
              type="button"
              onClick={() => setOutputFormat('FORMAT_A')}
              className={`px-3 py-2 font-bold border-2 transition-all cursor-pointer ${
                outputFormat === 'FORMAT_A'
                  ? 'bg-[#2e59e6] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-[#FAF8F5] text-[#1a1a1a] border-[#1a1a1a] hover:bg-slate-100'
              }`}
            >
              A. Format Standar (Cepat / Rekap)
            </button>
            <button
              type="button"
              onClick={() => setOutputFormat('FORMAT_B')}
              className={`px-3 py-2 font-bold border-2 transition-all cursor-pointer ${
                outputFormat === 'FORMAT_B'
                  ? 'bg-[#2e59e6] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-[#FAF8F5] text-[#1a1a1a] border-[#1a1a1a] hover:bg-slate-100'
              }`}
            >
              B. Format Rincian Asesmen Ujian
            </button>
            <button
              type="button"
              onClick={() => setOutputFormat('FORMAT_C')}
              className={`px-3 py-2 font-bold border-2 transition-all cursor-pointer ${
                outputFormat === 'FORMAT_C'
                  ? 'bg-[#2e59e6] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-[#FAF8F5] text-[#1a1a1a] border-[#1a1a1a] hover:bg-slate-100'
              }`}
            >
              C. Format Rincian Nilai Akhir Rapor
            </button>
          </div>
        </div>

        {/* Informasi Struktur Kolom Aktif */}
        <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3 font-mono-code text-xs flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-600 uppercase mr-2">STRUKTUR KOLOM OUTPUT:</span>
            <code className="font-bold text-[#2e59e6]">
              {outputTableMatrix.headers.map((h) => `[${h}]`).join(' | ')}
            </code>
          </div>
          <span className="text-[11px] font-bold text-slate-600">
            {selectedClass} • Mapel {selectedSubject} • {selectedAssessment}
          </span>
        </div>

        {/* Tombol Salin & Ekspor */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono-code text-xs">
          <button
            type="button"
            onClick={() => handleCopyTSV(true)}
            className="px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#2e59e6] text-white font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#2e59e6] flex items-center gap-2 cursor-pointer"
          >
            <Copy className="h-4 w-4 text-amber-400" />
            <span>SALIN TABEL TSV (LENGKAP HEADER)</span>
          </button>

          <button
            type="button"
            onClick={() => handleCopyTSV(false)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-[#1a1a1a] font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5 text-[#2e59e6]" />
            <span>SALIN DATA TSV (TANPA HEADER)</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCSV}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-[#1a1a1a] font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-emerald-700" />
            <span>SALIN FORMAT CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCopyScoresOnly}
            className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5 text-amber-700" />
            <span>SALIN KOLOM NILAI SAJA</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadExcel}
            className="px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>UNDUH EXCEL (.XLSX)</span>
          </button>
        </div>

        {copyFeedback && (
          <div className="p-3 bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-mono-code text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{copyFeedback}</span>
          </div>
        )}

        {/* Area Teks TSV / CSV Siap Salin */}
        <div>
          <label className="block font-mono-code text-[11px] font-bold text-slate-600 uppercase mb-1">
            PRATINJAU OUTPUT TABEL TSV (SIAP COPY-PASTE KE GOOGLE SHEETS / EXCEL):
          </label>
          <textarea
            readOnly
            rows={10}
            value={tsvOutputText}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            className="w-full bg-[#1a1a1a] text-emerald-300 border-2 border-[#1a1a1a] p-3.5 font-mono-code text-xs leading-relaxed focus:outline-hidden"
          />
        </div>
      </div>
    </div>
  );
};
