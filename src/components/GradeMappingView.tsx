import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  FileSpreadsheet,
  Copy,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  BookOpen,
  Layers,
  GraduationCap,
  ExternalLink,
  Plus,
  Minus,
  Check,
  RotateCcw,
  Zap,
  Info,
  ChevronDown,
  Award,
  BarChart3,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student } from '../types';
import {
  ALL_STUDENTS_DATABASE,
  GRADE_7_CLASSES,
  GRADE_8_CLASSES,
  ALL_CLASSES,
  getStudentsByClass,
} from '../data/studentsAll';
import {
  syncGradesToClassSheet,
  clearColumnInClassSheet,
  StudentGradeItem,
  detectClassTaskColumns,
  ClassColumnDetectionResult,
} from '../services/sheetsService';

interface GradeMappingViewProps {
  spreadsheetId: string;
  spreadsheetUrl: string;
  token: string | null;
  onLogin: () => void;
  onShowAlert?: (title: string, message: string) => void;
}

export const GradeMappingView: React.FC<GradeMappingViewProps> = ({
  spreadsheetId,
  spreadsheetUrl,
  token,
  onLogin,
  onShowAlert,
}) => {
  // 1. Grade & Class State
  const [selectedGrade, setSelectedGrade] = useState<'7' | '8'>('8');
  const [selectedClass, setSelectedClass] = useState<string>('Kelas 8B');
  const [taskTitle, setTaskTitle] = useState<string>('Tugas 1 - KKA - Algoritma');
  const [targetColumn, setTargetColumn] = useState<string>('AUTO');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('AUTO');
  const [kkm, setKkm] = useState<number>(75);
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Column auto-detection state from Google Sheets
  const [columnDetection, setColumnDetection] = useState<ClassColumnDetectionResult | null>(null);
  const [isDetectingCols, setIsDetectingCols] = useState<boolean>(false);

  // Fetch / detect occupied columns and next available column for selected class
  const loadClassColumns = async (className: string, preserveSelection = false) => {
    setIsDetectingCols(true);
    try {
      const res = await detectClassTaskColumns(spreadsheetId, className, token);
      setColumnDetection(res);

      if (preserveSelection && selectedTaskId !== 'NEW' && selectedTaskId !== 'AUTO') {
        const found = res.columns?.find((c) => c.colLetter === selectedTaskId);
        if (found) {
          setTargetColumn(found.colLetter);
          setTaskTitle(found.headerTitle || `Tugas Kolom ${found.colLetter}`);
          setGradesMap(found.gradesMap || {});
          return;
        }
      }

      // Default to "NEW" (Tambah Tugas Baru ke kolom kosong berikutnya)
      // agar tidak menimpa tugas yang sudah ada di sheet!
      setSelectedTaskId('NEW');
      setTargetColumn('AUTO');
      const nextNum = res.nextTaskNumber || ((res.occupiedColumns?.length || 0) + 1);
      setTaskTitle(`Tugas ${nextNum} - Informatika`);
    } catch (err) {
      console.warn('Failed to detect columns:', err);
    } finally {
      setIsDetectingCols(false);
    }
  };

  useEffect(() => {
    loadClassColumns(selectedClass, false);
  }, [selectedClass, spreadsheetId, token]);

  // Handler when user chooses a task from the spreadsheet task dropdown
  const handleSelectTaskFromSpreadsheet = (taskKey: string) => {
    setSelectedTaskId(taskKey);
    if (taskKey === 'NEW') {
      setTargetColumn('AUTO');
      const nextNum = columnDetection?.nextTaskNumber || ((columnDetection?.occupiedColumns?.length || 0) + 1);
      setTaskTitle(`Tugas ${nextNum} - Informatika`);
      setGradesMap({});
      setRawInputText('');
    } else {
      const found = columnDetection?.columns?.find((c) => c.colLetter === taskKey);
      if (found) {
        setTargetColumn(found.colLetter);
        setTaskTitle(found.headerTitle || `Tugas Kolom ${found.colLetter}`);
        setGradesMap(found.gradesMap || {});
        setRawInputText('');
      }
    }
  };

  // Determine effective column letter
  const effectiveColLetter = useMemo(() => {
    if (targetColumn === 'AUTO') {
      return columnDetection?.nextAvailableColumn || 'E';
    }
    return targetColumn;
  }, [targetColumn, columnDetection]);

  // 2. Parser Input State (starts clean/empty)
  const [rawInputText, setRawInputText] = useState<string>('');

  // 3. Parsed / Active Grades Map: { [attendanceNo: string]: number | null }
  const [gradesMap, setGradesMap] = useState<{ [attendanceNo: string]: number | null }>({});

  // 4. UI & Filtering State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sudah' | 'belum' | 'tuntas' | 'remidi' | 'pending'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'L' | 'P'>('all');
  const [isSyncingToSheet, setIsSyncingToSheet] = useState<boolean>(false);
  const [isClearingColR, setIsClearingColR] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Active roster of students for current class
  const classStudents = useMemo(() => {
    return getStudentsByClass(selectedClass);
  }, [selectedClass]);

  // Smart Parser Engine: Parses various formats into AttendanceNo -> Score
  const parseRawInput = (text: string): { [attNo: string]: number } => {
    const result: { [attNo: string]: number } = {};
    if (!text || !text.trim()) return result;

    const lines = text.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Pattern 1: Delimited by =, :, -, ., tab, or space
      // Examples: "1 = 85", "1. 90", "1: 78", "1 - 80", "1 88", "1\t95", "1, 85"
      const match = line.match(/^(\d{1,2})\s*(?:[=:\-.,/\t]\s*|\s+)\s*(\d{1,3}(?:[.,]\d+)?)$/);
      if (match) {
        const attNo = String(parseInt(match[1], 10));
        const score = parseFloat(match[2].replace(',', '.'));
        if (!isNaN(score) && score >= 0 && score <= 100) {
          result[attNo] = Math.round(score * 10) / 10;
        }
        continue;
      }

      // Pattern 2: Two tokens separated by any whitespace or comma (e.g. "Absen 1 85" or "1 85")
      const tokens = line.split(/[\s,;=:\-]+/).filter(Boolean);
      if (tokens.length >= 2) {
        const firstNum = parseInt(tokens[0].replace(/\D/g, ''), 10);
        const lastNum = parseFloat(tokens[tokens.length - 1].replace(',', '.'));
        if (!isNaN(firstNum) && firstNum > 0 && firstNum <= 50 && !isNaN(lastNum) && lastNum >= 0 && lastNum <= 100) {
          result[String(firstNum)] = Math.round(lastNum * 10) / 10;
        }
      }
    }
    return result;
  };

  // Preview count of valid lines in parser
  const parsedPreviewCount = useMemo(() => {
    return Object.keys(parseRawInput(rawInputText)).length;
  }, [rawInputText]);

  // Initial load / Apply parser to current class
  const handleApplyParser = () => {
    const parsed = parseRawInput(rawInputText);
    const parsedCount = Object.keys(parsed).length;

    if (parsedCount === 0) {
      onShowAlert?.(
        'Input Kosong',
        'Silakan ketik atau tempelkan daftar nilai terlebih dahulu di kolom penulisan sebelum menerapkan.'
      );
      return;
    }

    const newMap: { [attNo: string]: number | null } = { ...gradesMap };

    // Update students with parsed score
    let appliedCount = 0;
    classStudents.forEach((s) => {
      const att = s.attendanceNo || '0';
      if (parsed[att] !== undefined) {
        newMap[att] = parsed[att];
        appliedCount++;
      }
    });

    setGradesMap(newMap);
    
    // Otomatis kosongkan kolom penulisan nilai setelah diterapkan ke tabel
    setRawInputText('');

    onShowAlert?.(
      'Nilai Berhasil Diterapkan',
      `Berhasil menerapkan nilai untuk ${appliedCount} siswa (${selectedClass}). Kolom penulisan nilai telah dikosongkan.`
    );
  };

  // Reset or apply when class switches
  useEffect(() => {
    if (rawInputText.trim()) {
      const parsed = parseRawInput(rawInputText);
      const newMap: { [attNo: string]: number | null } = {};
      classStudents.forEach((s) => {
        const att = s.attendanceNo || '0';
        newMap[att] = parsed[att] !== undefined ? parsed[att] : null;
      });
      setGradesMap(newMap);
    }
  }, [selectedClass]);

  // Manual inline score update for an individual student
  const handleScoreChange = (attendanceNo: string, valStr: string) => {
    const trimmed = valStr.trim();
    setGradesMap((prev) => {
      if (trimmed === '' || trimmed === '-') {
        return { ...prev, [attendanceNo]: null };
      }
      const num = parseFloat(trimmed.replace(',', '.'));
      if (!isNaN(num)) {
        const clamped = Math.min(100, Math.max(0, Math.round(num * 10) / 10));
        return { ...prev, [attendanceNo]: clamped };
      }
      return prev;
    });
  };

  // Adjust score by +/- delta
  const handleScoreAdjust = (attendanceNo: string, delta: number) => {
    setGradesMap((prev) => {
      const curr = prev[attendanceNo] ?? kkm;
      const next = Math.min(100, Math.max(0, curr + delta));
      return { ...prev, [attendanceNo]: next };
    });
  };

  // Quick preset actions
  const handleSetAllKKM = () => {
    const newMap: { [attNo: string]: number | null } = {};
    classStudents.forEach((s) => {
      newMap[s.attendanceNo || '0'] = kkm;
    });
    setGradesMap(newMap);
    onShowAlert?.('Nilai Diperbarui', `Semua siswa ${selectedClass} diberi nilai default KKM (${kkm}).`);
  };

  const handleClearAllGrades = () => {
    const newMap: { [attNo: string]: number | null } = {};
    classStudents.forEach((s) => {
      newMap[s.attendanceNo || '0'] = null;
    });
    setGradesMap(newMap);
  };

  const handleSimulateRandomGrades = () => {
    const sampleScores: string[] = [];
    const newMap: { [attNo: string]: number | null } = {};

    classStudents.forEach((s, idx) => {
      const att = s.attendanceNo || String(idx + 1);
      // 80% passing, 15% remedial, 5% unrated
      const rand = Math.random();
      if (rand < 0.1) {
        newMap[att] = null;
      } else if (rand < 0.25) {
        const score = Math.floor(Math.random() * (kkm - 55)) + 55; // 55 to KKM-1
        newMap[att] = score;
        sampleScores.push(`${att} = ${score}`);
      } else {
        const score = Math.floor(Math.random() * (100 - kkm + 1)) + kkm; // KKM to 100
        newMap[att] = score;
        sampleScores.push(`${att} = ${score}`);
      }
    });

    setRawInputText(sampleScores.join('\n'));
    setGradesMap(newMap);
    onShowAlert?.('Simulasi Selesai', `Data nilai acak berhasil dimuat untuk ${selectedClass}.`);
  };

  const handleLoadSampleFormat = () => {
    const demo = [
      '1 = 88',
      '2. 92',
      '3: 78',
      '4 - 85',
      '5 90',
      '6 = 72',
      '7. 84',
      '8: 96',
      '9 - 68',
      '10 85',
      '11 = 92',
      '12. 75',
      '13: 89',
      '14 - 95',
      '15 80',
      '16 = 74',
      '17. 88',
      '18: 91',
      '19 - 86',
      '20 70',
      '21 = 94',
      '22. 82',
      '23: 76',
      '24 - 88',
      '25 90',
    ].join('\n');
    setRawInputText(demo);
  };

  // 5. Statistical Calculations
  const stats = useMemo(() => {
    let totalScore = 0;
    let gradedCount = 0;
    let maxScore = -1;
    let maxStudent: Student | null = null;
    let minScore = 101;
    let minStudent: Student | null = null;
    let tuntasCount = 0;
    let remidiCount = 0;
    let pendingCount = 0;

    const gradeRanges = {
      A: 0, // >= 90
      B: 0, // 80 - 89
      C: 0, // KKM - 79
      D: 0, // < KKM
    };

    classStudents.forEach((student) => {
      const att = student.attendanceNo || '0';
      const score = gradesMap[att];

      if (score === null || score === undefined) {
        pendingCount++;
      } else {
        gradedCount++;
        totalScore += score;

        if (score > maxScore) {
          maxScore = score;
          maxStudent = student;
        }
        if (score < minScore) {
          minScore = score;
          minStudent = student;
        }

        if (score >= kkm) {
          tuntasCount++;
        } else {
          remidiCount++;
        }

        if (score >= 90) gradeRanges.A++;
        else if (score >= 80) gradeRanges.B++;
        else if (score >= kkm) gradeRanges.C++;
        else gradeRanges.D++;
      }
    });

    const average = gradedCount > 0 ? Math.round((totalScore / gradedCount) * 10) / 10 : 0;
    const totalStudents = classStudents.length;
    const tuntasPercent = totalStudents > 0 ? Math.round((tuntasCount / totalStudents) * 100) : 0;
    const remidiPercent = totalStudents > 0 ? Math.round((remidiCount / totalStudents) * 100) : 0;
    const pendingPercent = totalStudents > 0 ? Math.round((pendingCount / totalStudents) * 100) : 0;

    return {
      totalStudents,
      gradedCount,
      pendingCount,
      tuntasCount,
      remidiCount,
      average,
      maxScore: maxScore >= 0 ? maxScore : null,
      maxStudent,
      minScore: minScore <= 100 ? minScore : null,
      minStudent,
      tuntasPercent,
      remidiPercent,
      pendingPercent,
      gradeRanges,
    };
  }, [classStudents, gradesMap, kkm]);

  // 6. Filtered Table Rows
  const filteredStudents = useMemo(() => {
    return classStudents.filter((s) => {
      const att = s.attendanceNo || '0';
      const score = gradesMap[att];
      const hasScore = score !== null && score !== undefined;

      // Status check
      let status: 'tuntas' | 'remidi' | 'pending' = 'pending';
      if (hasScore) {
        status = score >= kkm ? 'tuntas' : 'remidi';
      }

      if (statusFilter === 'sudah' && !hasScore) return false;
      if (statusFilter === 'belum' && hasScore) return false;
      if (statusFilter === 'pending' && hasScore) return false;
      if (statusFilter === 'tuntas' && status !== 'tuntas') return false;
      if (statusFilter === 'remidi' && status !== 'remidi') return false;

      if (genderFilter !== 'all' && s.gender !== genderFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = s.name.toLowerCase().includes(query);
        const matchNis = s.nis.toLowerCase().includes(query);
        const matchAtt = (s.attendanceNo || '').includes(query);
        if (!matchName && !matchNis && !matchAtt) return false;
      }

      return true;
    });
  }, [classStudents, gradesMap, kkm, statusFilter, genderFilter, searchTerm]);

  // 7. Clipboard Exporters
  const handleCopyUnfinishedStudents = () => {
    const unfinished = classStudents.filter((s) => {
      const att = s.attendanceNo || '0';
      const score = gradesMap[att];
      return score === null || score === undefined;
    });

    if (unfinished.length === 0) {
      onShowAlert?.(
        'Semua Siswa Sudah Mengerjakan',
        `Luar biasa! Seluruh ${classStudents.length} siswa di ${selectedClass} sudah menyelesaikan tugas "${taskTitle}".`
      );
      return;
    }

    const lines = [
      `📢 DAFTAR SISWA BELUM MENGERJAKAN TUGAS`,
      `====================================`,
      `📚 Tugas  : ${taskTitle}`,
      `🏫 Kelas  : ${selectedClass}`,
      `📅 Tanggal: ${assessmentDate}`,
      `👥 Total Belum : ${unfinished.length} dari ${classStudents.length} Siswa`,
      `------------------------------------`,
      ...unfinished.map((s, idx) => `${idx + 1}. Absen ${s.attendanceNo} - ${s.name} (${s.nis})`),
      `====================================`,
      `Mohon segera menyelesaikan tugas tersebut. Terima kasih! 🙏`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopyFeedback(`Daftar ${unfinished.length} siswa belum mengerjakan berhasil disalin!`);
    setTimeout(() => setCopyFeedback(null), 4000);
    onShowAlert?.('Disalin ke Clipboard', `Daftar ${unfinished.length} siswa yang belum mengerjakan berhasil disalin.`);
  };

  const handleCopyScoresOnly = () => {
    // Copy only the scores in ascending order of attendanceNo (TSV)
    const sorted = [...classStudents].sort((a, b) => {
      return parseInt(a.attendanceNo || '0', 10) - parseInt(b.attendanceNo || '0', 10);
    });

    const lines = sorted.map((s) => {
      const score = gradesMap[s.attendanceNo || '0'];
      return score !== null && score !== undefined ? String(score) : '';
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopyFeedback('Kolom nilai berhasil disalin! Silakan paste (Ctrl+V) langsung ke spreadsheet.');
    setTimeout(() => setCopyFeedback(null), 4000);
    onShowAlert?.('Disalin ke Clipboard', 'Daftar nilai berhasil disalin dalam format kolom.');
  };

  const handleCopyFullTable = () => {
    const headers = ['NO', 'NIPD/NIS', 'NAMA LENGKAP SISWA', 'L/P', 'KELAS', 'NILAI', 'STATUS'];
    const sorted = [...classStudents].sort((a, b) => {
      return parseInt(a.attendanceNo || '0', 10) - parseInt(b.attendanceNo || '0', 10);
    });

    const rows = sorted.map((s) => {
      const score = gradesMap[s.attendanceNo || '0'];
      const statusStr =
        score === null || score === undefined
          ? 'Belum Dinilai'
          : score >= kkm
          ? 'TUNTAS'
          : 'REMIDI';
      return [
        s.attendanceNo || '',
        s.nis,
        s.name,
        s.gender || '',
        s.className,
        score !== null && score !== undefined ? String(score) : '',
        statusStr,
      ].join('\t');
    });

    const tsvContent = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(tsvContent);
    setCopyFeedback('Tabel rekap lengkap berhasil disalin ke clipboard!');
    setTimeout(() => setCopyFeedback(null), 4000);
    onShowAlert?.('Disalin ke Clipboard', 'Tabel rekapitulasi lengkap disalin ke clipboard.');
  };

  // 8. Excel Exporter (.xlsx)
  const handleExportExcel = () => {
    try {
      const sorted = [...classStudents].sort((a, b) => {
        return parseInt(a.attendanceNo || '0', 10) - parseInt(b.attendanceNo || '0', 10);
      });

      const worksheetData = [
        ['SMP NEGERI 1 WEDI - DAFTAR REKAPITULASI & PEMETAAN NILAI SISWA'],
        [`Kelas: ${selectedClass} | Aspek/Tugas: ${taskTitle} | Tanggal: ${assessmentDate} | KKM: ${kkm}`],
        [`Statistik: Rata-Rata: ${stats.average} | Tuntas: ${stats.tuntasCount} (${stats.tuntasPercent}%) | Remidi: ${stats.remidiCount} (${stats.remidiPercent}%) | Pending: ${stats.pendingCount}`],
        [],
        ['No. Absen', 'NIPD / NIS', 'Nama Lengkap Siswa', 'L/P', 'Kelas', 'Kelompok', 'Nilai', 'Status Kelulusan'],
      ];

      sorted.forEach((s) => {
        const score = gradesMap[s.attendanceNo || '0'];
        const statusStr =
          score === null || score === undefined
            ? 'Belum Dinilai'
            : score >= kkm
            ? 'TUNTAS'
            : 'REMIDI';

        worksheetData.push([
          s.attendanceNo || '',
          s.nis,
          s.name,
          s.gender || '',
          s.className,
          s.group,
          score !== null && score !== undefined ? score : '',
          statusStr,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Auto width columns
      ws['!cols'] = [
        { wch: 10 }, // No
        { wch: 14 }, // NIS
        { wch: 32 }, // Nama
        { wch: 6 },  // L/P
        { wch: 12 }, // Kelas
        { wch: 14 }, // Kelompok
        { wch: 10 }, // Nilai
        { wch: 18 }, // Status
      ];

      const wb = XLSX.utils.book_new();
      const sheetName = selectedClass.replace(/^Kelas\s*/i, '') || 'Nilai';
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const fileName = `Rekap_Nilai_${selectedClass.replace(/\s+/g, '_')}_${taskTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}.xlsx`;
      XLSX.writeFile(wb, fileName);

      onShowAlert?.('Unduh Berhasil', `File spreadsheet ${fileName} berhasil diunduh.`);
    } catch (err: any) {
      console.error('Error exporting excel:', err);
      onShowAlert?.('Gagal Ekspor', 'Terjadi kesalahan saat membuat file Excel.');
    }
  };

  // 9. Direct Sync to Google Sheets
  const handleDirectSyncToGoogleSheets = async () => {
    if (!token) {
      onShowAlert?.('Autentikasi Diperlukan', 'Silakan hubungkan akun Google Anda untuk melakukan sinkronisasi langsung.');
      onLogin();
      return;
    }

    const colToUse = targetColumn === 'AUTO' ? effectiveColLetter : targetColumn;
    setIsSyncingToSheet(true);
    setSyncStatusMsg(`Menyinkronkan "${taskTitle}" ke sheet '${selectedClass.replace(/^Kelas\s*/i, '')}' (Kolom ${colToUse})...`);

    try {
      const items: StudentGradeItem[] = classStudents.map((s) => ({
        attendanceNo: s.attendanceNo || '0',
        nis: s.nis,
        name: s.name,
        gender: s.gender,
        score: gradesMap[s.attendanceNo || '0'] ?? null,
      }));

      const res = await syncGradesToClassSheet(
        token,
        spreadsheetId,
        selectedClass,
        taskTitle,
        items,
        colToUse
      );

      if (res.success) {
        setSyncStatusMsg(`Sukses! Nilai tertulis pada Kolom ${res.columnLetter || ''} (Mulai ${res.startCell || 'E6'}).`);
        // Kosongkan kolom penulisan nilai setelah berhasil tersinkronisasi
        setRawInputText('');
        onShowAlert?.('Sinkronisasi Google Sheets Berhasil', res.message);
        
        // Refresh deteksi kolom agar penambahan tugas berikutnya langsung otomatis bergeser ke kolom di sebelahnya
        loadClassColumns(selectedClass);
      } else {
        setSyncStatusMsg(`Gagal: ${res.message}`);
        onShowAlert?.('Sinkronisasi Gagal', res.message);
      }
    } catch (err: any) {
      setSyncStatusMsg(`Error: ${err.message || err}`);
      onShowAlert?.('Error Koneksi', 'Gagal menghubungi Google Sheets API.');
    } finally {
      setIsSyncingToSheet(false);
    }
  };

  // 10. Clean up stray Column R
  const handleClearMisplacedColumnR = async () => {
    if (!token) {
      onShowAlert?.('Autentikasi Diperlukan', 'Silakan hubungkan akun Google Anda terlebih dahulu.');
      onLogin();
      return;
    }

    if (!window.confirm(`Bersihkan semua nilai di Kolom R pada sheet '${selectedClass.replace(/^Kelas\s*/i, '')}'?`)) {
      return;
    }

    setIsClearingColR(true);
    try {
      const res = await clearColumnInClassSheet(token, spreadsheetId, selectedClass, 'R');
      if (res.success) {
        onShowAlert?.('Kolom R Dibersihkan', res.message);
        setSyncStatusMsg('Kolom R berhasil dibersihkan.');
      } else {
        onShowAlert?.('Gagal Membersihkan', res.message);
      }
    } catch (err: any) {
      onShowAlert?.('Error', `Gagal membersihkan Kolom R: ${err.message || err}`);
    } finally {
      setIsClearingColR(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono-code text-[11px] font-bold uppercase tracking-widest bg-[#2e59e6] text-white px-2.5 py-0.5 border border-[#1a1a1a]">
                SMP NEGERI 1 WEDI
              </span>
              <span className="font-mono-code text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 border border-amber-300">
                [ SMART GRADE PARSER & MAPPER ]
              </span>
              <span className="font-mono-code text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 border border-slate-300">
                TAHUN AJARAN 2025/2026
              </span>
            </div>
            <h1 className="font-serif-display font-bold text-2xl sm:text-3xl text-[#1a1a1a] tracking-tight">
              Dashboard Rekap & Pemetaan Nilai Siswa
            </h1>
            <p className="font-mono-code text-xs text-slate-600 mt-1 max-w-3xl">
              Input cepat berbasis nomor absen dengan Smart Multi-Format Parser, perhitungan statistik otomatis, dan sinkronisasi langsung ke Google Spreadsheet kelas.
            </p>
          </div>

          {/* Quick Info & Action Pill */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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

      {/* Control Panel: Class Selector & Task Metadata */}
      <div className="bg-[#F2EFEB] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5">
        <div className="space-y-4">
          {/* Grade Level Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1a1a1a] pb-3.5">
            <div className="flex items-center gap-2 font-mono-code text-xs font-bold">
              <span className="text-slate-600 uppercase tracking-wider">PILIH TINGKAT:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setSelectedGrade('7');
                    setSelectedClass('Kelas 7A');
                  }}
                  className={`px-4 py-1.5 text-xs font-bold font-mono-code border-2 transition-all cursor-pointer ${
                    selectedGrade === '7'
                      ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#2e59e6]'
                      : 'bg-white text-slate-700 border-[#1a1a1a] hover:bg-slate-100'
                  }`}
                >
                  KELAS 7 (7A - 7H)
                </button>
                <button
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
                  KELAS 8 (8A - 8H)
                </button>
              </div>
            </div>

            <div className="font-mono-code text-xs text-slate-600 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4 text-[#2e59e6]" />
                Total: <strong>{classStudents.length} Siswa</strong> di {selectedClass}
              </span>
            </div>
          </div>

          {/* Individual Class Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {(selectedGrade === '7' ? GRADE_7_CLASSES : GRADE_8_CLASSES).map((cls) => {
              const isActive = selectedClass === cls;
              const shortCode = cls.replace(/^Kelas\s*/i, '');
              return (
                <button
                  key={cls}
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

          {/* Spreadsheet Task Selector Dropdown Banner */}
          <div className="bg-amber-50/80 border-2 border-[#1a1a1a] p-3 shadow-[2px_2px_0px_#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 space-y-1">
              <label className="block font-mono-code text-xs font-black text-[#1a1a1a] uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-[#2e59e6]" />
                  <span>DAFTAR TUGAS DI SPREADSHEET ({selectedClass}):</span>
                </div>
                {isDetectingCols && (
                  <span className="text-[10px] text-[#2e59e6] font-normal animate-pulse">Memeriksa spreadsheet...</span>
                )}
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => handleSelectTaskFromSpreadsheet(e.target.value)}
                className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-2 text-xs font-mono-code font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] focus:outline-hidden focus:ring-2 focus:ring-[#2e59e6] cursor-pointer"
              >
                {columnDetection?.occupiedColumns && columnDetection.occupiedColumns.length > 0 ? (
                  <>
                    <optgroup label="📋 Tugas yang Ada di Spreadsheet:">
                      {columnDetection.occupiedColumns.map((col) => {
                        const count = col.scoreCount;
                        const pct = classStudents.length > 0 ? Math.round((count / classStudents.length) * 100) : 0;
                        return (
                          <option key={col.colLetter} value={col.colLetter}>
                            📌 Kolom {col.colLetter}: {col.headerTitle || `Tugas Kolom ${col.colLetter}`} ({count}/{classStudents.length} Siswa Mengerjakan - {pct}%)
                          </option>
                        );
                      })}
                    </optgroup>
                    <optgroup label="➕ Penambahan Tugas Baru:">
                      <option value="NEW">
                        ➕ Buat Tugas Baru (Otomatis ke Kolom Kosong {columnDetection.nextAvailableColumn})
                      </option>
                    </optgroup>
                  </>
                ) : (
                  <option value="NEW">
                    ➕ Belum ada tugas di sheet (Mulai dari Kolom {columnDetection?.nextAvailableColumn || 'E'})
                  </option>
                )}
              </select>
            </div>

            {/* Quick Summary Pill for Selected Task */}
            <div className="flex items-center gap-2 shrink-0 pt-1 md:pt-0">
              <div className="bg-white border border-[#1a1a1a] px-3 py-1.5 font-mono-code text-xs shadow-[1px_1px_0px_#1a1a1a]">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Status Pengerjaan Siswa:</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-emerald-700 font-black">
                    ✓ {stats.gradedCount} Sudah
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-amber-700 font-black">
                    ⏳ {stats.pendingCount} Belum
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Task Title, Target Column & KKM Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-1">
            <div className="md:col-span-4 space-y-1">
              <label className="block font-mono-code text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                NAMA TUGAS / ASPEK PENILAIAN:
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Contoh: Tugas 1"
                className="w-full bg-white border-2 border-[#1a1a1a] px-3.5 py-2 text-xs font-mono-code font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] focus:outline-hidden focus:ring-2 focus:ring-[#2e59e6]"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="block font-mono-code text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>KOLOM TARGET SPREADSHEET:</span>
                <span className="text-[#2e59e6] font-black">SEL {effectiveColLetter}6</span>
              </label>
              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-2 text-xs font-mono-code font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] focus:outline-hidden focus:ring-2 focus:ring-[#2e59e6] cursor-pointer"
              >
                <option value="AUTO">
                  🎯 Otomatis: Bergeser ke Kolom {columnDetection?.nextAvailableColumn || 'E'} {columnDetection?.occupiedColumns && columnDetection.occupiedColumns.length > 0 ? `(Kolom sebelumnya terisi)` : '(Kolom awal)'}
                </option>
                {['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'].map((letter) => {
                  const colInfo = columnDetection?.columns?.find((c) => c.colLetter === letter);
                  const isNext = columnDetection?.nextAvailableColumn === letter;
                  const isOccupied = colInfo?.isOccupied;
                  let label = `Kolom ${letter}`;
                  if (isOccupied) {
                    label += ` • Terisi: "${colInfo?.headerTitle || 'Tugas Sebelumnya'}"`;
                  } else if (isNext) {
                    label += ` • KOSONG (Sasaran Tugas Baru Otomatis) ⭐`;
                  } else {
                    label += ` • Kosong [Mulai ${letter}6]`;
                  }
                  return (
                    <option key={letter} value={letter}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="block font-mono-code text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                BATAS KKM (KETUNTASAN):
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={kkm}
                  onChange={(e) => setKkm(Math.max(50, Math.min(100, parseInt(e.target.value || '75', 10))))}
                  className="w-full bg-white border-2 border-[#1a1a1a] px-3 py-2 text-xs font-mono-code font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setKkm(75)}
                  className="px-2 py-2 text-[10px] font-mono-code font-bold bg-white hover:bg-slate-100 border-2 border-[#1a1a1a] shrink-0"
                  title="Reset ke KKM Standar 75"
                >
                  75
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="block font-mono-code text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                TANGGAL:
              </label>
              <input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="w-full bg-white border-2 border-[#1a1a1a] px-2.5 py-2 text-xs font-mono-code font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Coordinate Target Visual Indicator & Auto-Shift Feedback */}
          <div className="mt-3 bg-blue-50 border-2 border-[#2e59e6] p-3 text-xs font-mono-code text-[#1a1a1a] flex flex-col gap-2.5 shadow-[2px_2px_0px_#1a1a1a]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#2e59e6] text-white px-2 py-0.5 font-bold text-[10px] tracking-wider uppercase">
                  TARGET CELL SHEET
                </span>
                <span>
                  Tab Sheet: <strong>'{selectedClass.replace(/^Kelas\s*/i, '')}'</strong> | Kolom:{' '}
                  <strong>
                    Kolom {effectiveColLetter}{' '}
                    {targetColumn === 'AUTO' ? '(Otomatis Bergeser)' : '(Pilihan Manual)'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[11px] text-slate-700 bg-white/90 px-2.5 py-1 border border-blue-200 font-bold">
                  🎯 Judul di <strong>{effectiveColLetter}5</strong> • Absen 1 di <strong>{effectiveColLetter}6</strong> s.d. Absen{' '}
                  {classStudents.length} di <strong>{effectiveColLetter}{5 + classStudents.length}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => loadClassColumns(selectedClass)}
                  disabled={isDetectingCols}
                  className="px-2 py-1 text-[10px] font-mono-code font-bold bg-white hover:bg-slate-100 border border-[#1a1a1a] shadow-[1px_1px_0px_#1a1a1a] flex items-center gap-1 cursor-pointer"
                  title="Deteksi ulang kolom spreadsheet"
                >
                  <RefreshCw className={`h-3 w-3 ${isDetectingCols ? 'animate-spin' : ''}`} />
                  <span>{isDetectingCols ? 'Mengecek...' : 'Cek Kolom'}</span>
                </button>
              </div>
            </div>

            {/* Auto-shift explanatory detail badge */}
            {columnDetection?.occupiedColumns && columnDetection.occupiedColumns.length > 0 && (
              <div className="bg-white/80 border border-blue-200 p-2 text-[11px] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 border border-emerald-300">
                    AUTO-SHIFT AKTIF
                  </span>
                  <span className="text-slate-700">
                    Tugas sebelumnya di{' '}
                    <strong>
                      Kolom {columnDetection.occupiedColumns[columnDetection.occupiedColumns.length - 1].colLetter} (
                      {columnDetection.occupiedColumns[columnDetection.occupiedColumns.length - 1].headerTitle || 'Tugas Terisi'})
                    </strong>{' '}
                    ➜ Penambahan tugas baru otomatis bergeser ke{' '}
                    <strong className="text-[#2e59e6]">Kolom {columnDetection.nextAvailableColumn}</strong>.
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold shrink-0">
                  Total {columnDetection.occupiedColumns.length} Tugas di Sheet
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-width Smart Multi-Format Parser Box with Integrated Sync & Export Buttons */}
      <div className="w-full">
        <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 sm:p-6">
          <div className="flex items-center justify-between border-b-2 border-[#1a1a1a] pb-3 mb-3.5">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#2e59e6]" />
              <h2 className="font-serif-display font-bold text-lg sm:text-xl text-[#1a1a1a]">
                Smart Parser Input Nilai
              </h2>
            </div>
            <span className="font-mono-code text-[11px] font-bold bg-blue-50 text-[#2e59e6] px-2.5 py-1 border border-blue-200 shadow-[1px_1px_0px_#1a1a1a]">
              {parsedPreviewCount} Baris Terdeteksi
            </span>
          </div>

          <p className="font-mono-code text-xs text-slate-600 mb-2.5">
            Masukkan nilai per nomor absen dalam jumlah banyak sekaligus. Parser otomatis mendukung berbagai format penulisan:
          </p>

          {/* Supported Format Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5 font-mono-code text-[11px]">
            <div className="bg-slate-50 border border-slate-300 p-2 shadow-[1px_1px_0px_#1a1a1a]">
              <span className="text-slate-500 font-bold block text-[10px]">Sama Dengan</span>
              <code className="text-[#2e59e6] font-bold text-xs">1 = 85</code>
            </div>
            <div className="bg-slate-50 border border-slate-300 p-2 shadow-[1px_1px_0px_#1a1a1a]">
              <span className="text-slate-500 font-bold block text-[10px]">Titik</span>
              <code className="text-[#2e59e6] font-bold text-xs">1. 90</code>
            </div>
            <div className="bg-slate-50 border border-slate-300 p-2 shadow-[1px_1px_0px_#1a1a1a]">
              <span className="text-slate-500 font-bold block text-[10px]">Titik Dua / Strip</span>
              <code className="text-[#2e59e6] font-bold text-xs">1: 78 | 1 - 80</code>
            </div>
            <div className="bg-slate-50 border border-slate-300 p-2 shadow-[1px_1px_0px_#1a1a1a]">
              <span className="text-slate-500 font-bold block text-[10px]">Spasi / Tab</span>
              <code className="text-[#2e59e6] font-bold text-xs">1 88 | 1&#9;95</code>
            </div>
          </div>

          {/* Multi-line Textarea */}
          <div className="relative mb-4">
            <textarea
              rows={7}
              value={rawInputText}
              onChange={(e) => setRawInputText(e.target.value)}
              placeholder="Contoh penulisan:&#10;1 = 88&#10;2. 92&#10;3: 78&#10;4 - 85&#10;5 90&#10;..."
              className="w-full bg-[#faf9f6] border-2 border-[#1a1a1a] p-3.5 font-mono-code text-xs font-semibold text-[#1a1a1a] shadow-inner focus:outline-hidden focus:ring-2 focus:ring-[#2e59e6] leading-relaxed resize-y"
            />
          </div>

          {/* Parser Control Actions */}
          <div className="space-y-3 pt-3 border-t-2 border-[#1a1a1a]">
            {/* Primary Apply Button */}
            <button
              onClick={handleApplyParser}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#2e59e6] hover:bg-blue-700 text-white font-mono-code text-xs sm:text-sm font-bold border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>TERAPKAN NILAI KE TABEL SISWA ({selectedClass})</span>
            </button>

            {/* Helper Quick Fill Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono-code text-[11px] pb-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleLoadSampleFormat}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-[#1a1a1a] font-bold shadow-[1px_1px_0px_#1a1a1a] cursor-pointer"
                  title="Muat contoh format"
                >
                  Format Contoh
                </button>
                <button
                  type="button"
                  onClick={handleSimulateRandomGrades}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-400 font-bold shadow-[1px_1px_0px_#1a1a1a] cursor-pointer"
                  title="Isi nilai acak untuk demo"
                >
                  Simulasi Acak
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSetAllKKM}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-[#1a1a1a] font-bold shadow-[1px_1px_0px_#1a1a1a] cursor-pointer"
                  title="Beri semua nilai KKM"
                >
                  Set Semua KKM ({kkm})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRawInputText('');
                    handleClearAllGrades();
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold shadow-[1px_1px_0px_#1a1a1a] cursor-pointer"
                  title="Kosongkan nilai"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* INTEGRATED EXPORT & SPREADSHEET SYNC BUTTONS (Matches exact requested buttons) */}
            <div className="pt-3 border-t-2 border-[#1a1a1a] space-y-2.5">
              {/* Row 1: Copy TSV & Download Excel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyScoresOnly}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-100 text-[#1a1a1a] font-mono-code text-xs font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] transition-all cursor-pointer"
                >
                  <Copy className="h-4 w-4 text-[#2e59e6]" />
                  <span>SALIN TSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#059669] hover:bg-[#047857] text-white font-mono-code text-xs font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>UNDUH EXCEL</span>
                </button>
              </div>

              {/* Row 2: Sync to Sheet (Black button with emerald cloud icon and blue shadow) */}
              <button
                type="button"
                onClick={handleDirectSyncToGoogleSheets}
                disabled={isSyncingToSheet}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#1a1a1a] hover:bg-black text-white font-mono-code text-xs sm:text-sm font-bold border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#2e59e6] transition-all cursor-pointer disabled:opacity-60"
              >
                {isSyncingToSheet ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-[#2e59e6]" />
                    <span>MENYINKRONKAN KE SHEET '{selectedClass.replace(/^Kelas\s*/i, '')}' (KOLOM {effectiveColLetter})...</span>
                  </>
                ) : selectedTaskId === 'NEW' ? (
                  <>
                    <UploadCloud className="h-4 w-4 text-emerald-400" />
                    <span>➕ SINKRONKAN TUGAS BARU KE SHEET '{selectedClass.replace(/^Kelas\s*/i, '')}' [KOLOM {effectiveColLetter} (MULAI {effectiveColLetter}6)]</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 text-amber-400" />
                    <span>🔄 PERBARUI NILAI TUGAS "{taskTitle}" [KOLOM {effectiveColLetter}]</span>
                  </>
                )}
              </button>

              {/* Row 3: Clear stray Column R button */}
              <button
                type="button"
                onClick={handleClearMisplacedColumnR}
                disabled={isClearingColR}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#9f1239] font-mono-code text-xs font-bold border border-[#fecdd3] transition-all cursor-pointer disabled:opacity-50"
                title="Hapus nilai nyasar di Kolom R jika sebelumnya salah kolom"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>{isClearingColR ? 'Membersihkan Kolom R...' : `🧹 Bersihkan Nilai di Kolom R pada Sheet '${selectedClass.replace(/^Kelas\s*/i, '')}'`}</span>
              </button>

              {/* Feedback Notifications */}
              {syncStatusMsg && (
                <div className="font-mono-code text-xs text-center text-slate-700 bg-slate-100 border border-slate-300 p-2 font-bold shadow-[1px_1px_0px_#1a1a1a]">
                  {syncStatusMsg}
                </div>
              )}

              {copyFeedback && (
                <div className="font-mono-code text-xs text-center text-emerald-800 bg-emerald-50 border border-emerald-300 p-2 font-bold shadow-[1px_1px_0px_#1a1a1a] animate-in fade-in">
                  ✓ {copyFeedback}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Table Section: Rekapitulasi, Analisis Statistik & Pemetaan Nilai Siswa */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b-2 border-[#1a1a1a] bg-[#faf9f6]">
          <div className="flex flex-col gap-4">
            {/* Top Bar: Title & In-Place Spreadsheet Task Selector */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-200 pb-3.5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <BookOpen className="h-5 w-5 text-[#2e59e6]" />
                  <h3 className="font-serif-display font-bold text-xl text-[#1a1a1a]">
                    Tabel Pemetaan Nilai & Status Pengerjaan: {selectedClass}
                  </h3>
                  <span className="bg-[#2e59e6] text-white text-[10px] font-mono-code font-bold px-2 py-0.5 shadow-[1px_1px_0px_#1a1a1a]">
                    KOLOM {effectiveColLetter}
                  </span>
                </div>
                <p className="font-mono-code text-xs text-slate-600 mt-0.5">
                  Tugas Aktif: <strong>"{taskTitle}"</strong> • KKM: <strong>{kkm}</strong> • Total Siswa: <strong>{classStudents.length}</strong>
                </p>
              </div>

              {/* In-table Spreadsheet Task Dropdown */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 font-mono-code text-xs font-bold text-slate-700">
                  <FileSpreadsheet className="h-4 w-4 text-[#2e59e6]" />
                  <span className="hidden sm:inline">PILIH TUGAS:</span>
                </div>
                <select
                  value={selectedTaskId}
                  onChange={(e) => handleSelectTaskFromSpreadsheet(e.target.value)}
                  className="bg-white border-2 border-[#1a1a1a] px-3 py-1.5 text-xs font-mono-code font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] focus:outline-hidden focus:ring-2 focus:ring-[#2e59e6] cursor-pointer max-w-xs sm:max-w-md"
                >
                  {columnDetection?.occupiedColumns && columnDetection.occupiedColumns.length > 0 ? (
                    <>
                      <optgroup label="📋 Tugas Terdaftar di Spreadsheet:">
                        {columnDetection.occupiedColumns.map((col) => {
                          const count = col.scoreCount;
                          const pct = classStudents.length > 0 ? Math.round((count / classStudents.length) * 100) : 0;
                          return (
                            <option key={col.colLetter} value={col.colLetter}>
                              📌 Kolom {col.colLetter}: {col.headerTitle || `Tugas Kolom ${col.colLetter}`} ({count}/{classStudents.length} Siswa Mengerjakan - {pct}%)
                            </option>
                          );
                        })}
                      </optgroup>
                      <optgroup label="➕ Tugas Baru:">
                        <option value="NEW">
                          ➕ Input Tugas Baru (Kolom {columnDetection.nextAvailableColumn})
                        </option>
                      </optgroup>
                    </>
                  ) : (
                    <option value="NEW">
                      ➕ Input Tugas Baru (Kolom {columnDetection?.nextAvailableColumn || 'E'})
                    </option>
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => loadClassColumns(selectedClass, false)}
                  disabled={isDetectingCols}
                  className="p-1.5 bg-white hover:bg-slate-100 border-2 border-[#1a1a1a] text-slate-700 shadow-[1px_1px_0px_#1a1a1a] cursor-pointer"
                  title="Segarkan daftar tugas dari Google Sheets"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isDetectingCols ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* INTEGRATED STATISTIK & ANALISIS KELAS PANEL (Matches exact requested visual card design) */}
            <div className="bg-white border-2 border-[#1a1a1a] p-4 sm:p-5 shadow-[3px_3px_0px_#1a1a1a]">
              <div className="flex items-center justify-between border-b-2 border-[#1a1a1a] pb-2.5 mb-3.5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#2e59e6]" />
                  <h4 className="font-serif-display font-bold text-lg text-[#1a1a1a]">
                    Statistik & Analisis Kelas
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-code text-[11px] font-bold bg-[#edf2f7] text-[#1a1a1a] px-2.5 py-1 border border-[#1a1a1a]">
                    {selectedClass} ({stats.totalStudents} Siswa)
                  </span>
                </div>
              </div>

              {/* 4 Core Metric Cards (2x2 Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
                {/* 1. Rata-Rata Kelas */}
                <div className="bg-white border-2 border-[#1a1a1a] p-3.5 shadow-[2px_2px_0px_#1a1a1a] flex flex-col justify-between">
                  <div>
                    <span className="font-mono-code text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      RATA-RATA KELAS
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="font-mono-code text-3xl font-black text-[#1a1a1a]">
                        {stats.average > 0 ? stats.average : '-'}
                      </span>
                      <span
                        className={`font-mono-code text-[11px] font-bold px-2 py-0.5 border ${
                          stats.average >= kkm
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                            : stats.average > 0
                            ? 'bg-rose-100 text-rose-900 border-rose-400'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {stats.average >= kkm ? '≥ KKM' : stats.average > 0 ? '< KKM' : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="font-mono-code text-[10px] text-slate-600 mt-1.5">
                    Dari {stats.gradedCount} siswa telah dinilai
                  </div>
                </div>

                {/* 2. Tertinggi / Terendah */}
                <div className="bg-white border-2 border-[#1a1a1a] p-3.5 shadow-[2px_2px_0px_#1a1a1a] flex flex-col justify-between">
                  <div>
                    <span className="font-mono-code text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      TERTINGGI / TERENDAH
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-mono-code text-3xl font-black text-[#2e59e6]">
                        {stats.maxScore !== null ? stats.maxScore : '-'}
                      </span>
                      <span className="font-mono-code text-base font-bold text-slate-600">
                        / Min: {stats.minScore !== null ? stats.minScore : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="font-mono-code text-[10px] text-slate-600 truncate mt-1.5" title={stats.maxStudent?.name}>
                    Top: {stats.maxStudent ? `${stats.maxStudent.name.split(' ')[0]} (Absen ${stats.maxStudent.attendanceNo})` : '-'}
                  </div>
                </div>

                {/* 3. Siswa Tuntas */}
                <div className="bg-[#f0fdf4] border-2 border-[#047857] p-3.5 shadow-[2px_2px_0px_#1a1a1a] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono-code text-[11px] font-bold text-[#065f46] uppercase tracking-wider">
                        SISWA TUNTAS (≥{kkm})
                      </span>
                      <span className="font-mono-code text-[11px] font-bold text-[#065f46] bg-[#a7f3d0] px-2 py-0.5 border border-[#059669]">
                        {stats.tuntasPercent}%
                      </span>
                    </div>
                    <div className="font-mono-code text-3xl font-black text-[#065f46] mt-1">
                      {stats.tuntasCount}{' '}
                      <span className="text-sm font-semibold text-[#047857]">/ {stats.totalStudents} Siswa</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#a7f3d0] h-2 mt-2 rounded-xs overflow-hidden border border-[#059669]/30">
                    <div
                      className="bg-[#059669] h-full transition-all duration-300"
                      style={{ width: `${stats.tuntasPercent}%` }}
                    />
                  </div>
                </div>

                {/* 4. Remidi / Pending */}
                <div className="bg-[#fff1f2] border-2 border-[#be123c] p-3.5 shadow-[2px_2px_0px_#1a1a1a] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono-code text-[11px] font-bold text-[#9f1239] uppercase tracking-wider">
                        REMIDI (&lt;{kkm}) / PENDING
                      </span>
                      <span className="font-mono-code text-[11px] font-bold text-[#9f1239] bg-[#fecdd3] px-2 py-0.5 border border-[#e11d48]">
                        {stats.remidiPercent}%
                      </span>
                    </div>
                    <div className="font-mono-code text-3xl font-black text-[#9f1239] mt-1 flex items-baseline justify-between">
                      <span>
                        {stats.remidiCount}{' '}
                        <span className="text-sm font-semibold text-[#be123c]">Remidi</span>
                      </span>
                      <span className="text-sm font-mono-code font-bold text-slate-600">
                        {stats.pendingCount} Pending
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-[#fecdd3] h-2 mt-2 rounded-xs overflow-hidden border border-[#e11d48]/30">
                    <div
                      className="bg-[#e11d48] h-full transition-all duration-300"
                      style={{ width: `${stats.remidiPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 5. Distribution Breakdown Bar */}
              <div className="bg-white border-2 border-[#1a1a1a] p-3 font-mono-code text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 uppercase mb-2">
                  <span>SEBARAN RENTANG NILAI:</span>
                  <span>KKM: {kkm}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
                  <div className="bg-[#dcfce7] text-[#14532d] border-2 border-[#15803d] p-2">
                    <span className="block text-[10px] text-[#166534] font-semibold">A (90-100)</span>
                    <span className="text-base font-black">{stats.gradeRanges.A} Siswa</span>
                  </div>
                  <div className="bg-[#dbeafe] text-[#1e3a8a] border-2 border-[#1d4ed8] p-2">
                    <span className="block text-[10px] text-[#1e40af] font-semibold">B (80-89)</span>
                    <span className="text-base font-black">{stats.gradeRanges.B} Siswa</span>
                  </div>
                  <div className="bg-[#fef3c7] text-[#78350f] border-2 border-[#d97706] p-2">
                    <span className="block text-[10px] text-[#92400e] font-semibold">C ({kkm}-79)</span>
                    <span className="text-base font-black">{stats.gradeRanges.C} Siswa</span>
                  </div>
                  <div className="bg-[#ffe4e6] text-[#881337] border-2 border-[#e11d48] p-2">
                    <span className="block text-[10px] text-[#9f1239] font-semibold">D (&lt;{kkm})</span>
                    <span className="text-base font-black">{stats.gradeRanges.D} Siswa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar: Search, Completion Status Filters & Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama / NIS / absen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border-2 border-[#1a1a1a] text-xs font-mono-code text-[#1a1a1a] focus:outline-hidden w-48 sm:w-56 shadow-[1px_1px_0px_#1a1a1a]"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center flex-wrap border-2 border-[#1a1a1a] bg-white font-mono-code text-xs font-bold divide-x divide-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1.5 cursor-pointer transition-colors ${
                    statusFilter === 'all' ? 'bg-[#1a1a1a] text-white' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Lihat seluruh siswa di kelas"
                >
                  Semua ({classStudents.length})
                </button>
                <button
                  onClick={() => setStatusFilter('sudah')}
                  className={`px-2.5 py-1.5 cursor-pointer transition-colors ${
                    statusFilter === 'sudah' ? 'bg-emerald-700 text-white' : 'hover:bg-slate-100 text-emerald-800'
                  }`}
                  title="Siswa yang sudah memiliki nilai pada tugas ini"
                >
                  ✓ Sudah ({stats.gradedCount})
                </button>
                <button
                  onClick={() => setStatusFilter('belum')}
                  className={`px-2.5 py-1.5 cursor-pointer transition-colors ${
                    statusFilter === 'belum' || statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'hover:bg-slate-100 text-amber-800'
                  }`}
                  title="Siswa yang belum mengumpulkan / belum dinilai"
                >
                  ⏳ Belum ({stats.pendingCount})
                </button>
                <button
                  onClick={() => setStatusFilter('tuntas')}
                  className={`px-2.5 py-1.5 cursor-pointer transition-colors ${
                    statusFilter === 'tuntas' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-blue-800'
                  }`}
                  title={`Nilai >= KKM (${kkm})`}
                >
                  Tuntas ({stats.tuntasCount})
                </button>
                <button
                  onClick={() => setStatusFilter('remidi')}
                  className={`px-2.5 py-1.5 cursor-pointer transition-colors ${
                    statusFilter === 'remidi' ? 'bg-rose-600 text-white' : 'hover:bg-slate-100 text-rose-800'
                  }`}
                  title={`Nilai < KKM (${kkm})`}
                >
                  Remidi ({stats.remidiCount})
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Copy Unfinished Students Button for WA/Telegram */}
                <button
                  type="button"
                  onClick={handleCopyUnfinishedStudents}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-[#1a1a1a] font-mono-code text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a] cursor-pointer"
                  title="Salin daftar siswa yang belum mengerjakan untuk dibagikan ke WhatsApp"
                >
                  <Clock className="h-3.5 w-3.5 text-amber-700" />
                  <span>Salin Siswa Belum ({stats.pendingCount})</span>
                </button>

                {/* Copy Full Table button */}
                <button
                  type="button"
                  onClick={handleCopyFullTable}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#1a1a1a] border-2 border-[#1a1a1a] font-mono-code text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a] cursor-pointer"
                  title="Salin seluruh tabel ke clipboard"
                >
                  <Copy className="h-3 w-3" />
                  <span>Salin Tabel</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono-code text-xs">
            <thead>
              <tr className="bg-[#1a1a1a] text-white border-b-2 border-[#1a1a1a] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-16 border-r border-white/20">NO</th>
                <th className="py-3 px-3 w-24 border-r border-white/20">NIPD / NIS</th>
                <th className="py-3 px-4 border-r border-white/20">NAMA LENGKAP SISWA</th>
                <th className="py-3 px-3 text-center w-14 border-r border-white/20">L/P</th>
                <th className="py-3 px-4 w-40 text-center border-r border-white/20 bg-[#2e59e6]">
                  NILAI SISWA
                </th>
                <th className="py-3 px-4 w-48 text-center border-r border-white/20">STATUS PENGERJAAN</th>
                <th className="py-3 px-3 w-28 text-center">AKSI CEPAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono-code">
                    Tidak ada data siswa yang cocok dengan filter ({statusFilter.toUpperCase()}).
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const att = student.attendanceNo || String(index + 1);
                  const score = gradesMap[att];
                  const hasScore = score !== null && score !== undefined;
                  const isTuntas = hasScore && score >= kkm;
                  const isRemidi = hasScore && score < kkm;

                  return (
                    <tr
                      key={student.id || att}
                      className={`hover:bg-blue-50/50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-[#faf9f6]'
                      }`}
                    >
                      {/* Attendance Number */}
                      <td className="py-2.5 px-3 text-center font-bold text-[#1a1a1a] border-r border-slate-200">
                        {att}
                      </td>

                      {/* NIS / NIPD */}
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 font-medium">
                        {student.nis}
                      </td>

                      {/* Student Name */}
                      <td className="py-2.5 px-4 font-bold text-[#1a1a1a] border-r border-slate-200">
                        <div className="flex items-center justify-between">
                          <span>{student.name}</span>
                          {score !== null && score === stats.maxScore && stats.maxScore > 0 && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-400 px-1.5 py-0.2 font-bold flex items-center gap-0.5">
                              <Award className="h-2.5 w-2.5" /> TOP
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Gender L/P */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-bold">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[10px] ${
                            student.gender === 'L'
                              ? 'text-blue-700 bg-blue-50 border border-blue-200'
                              : 'text-rose-700 bg-rose-50 border border-rose-200'
                          }`}
                        >
                          {student.gender || '-'}
                        </span>
                      </td>

                      {/* Inline Editable Score Cell */}
                      <td className="py-2 px-3 text-center border-r border-slate-200 bg-blue-50/30">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            placeholder="-"
                            value={score !== null && score !== undefined ? score : ''}
                            onChange={(e) => handleScoreChange(att, e.target.value)}
                            className={`w-20 text-center font-mono-code font-black text-sm py-1.5 px-2 border-2 transition-all focus:outline-hidden focus:ring-2 focus:ring-[#2e59e6] ${
                              !hasScore
                                ? 'bg-white border-slate-300 text-slate-400 placeholder:text-slate-300'
                                : isTuntas
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                                : 'bg-rose-50 border-rose-600 text-rose-900'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-4 text-center border-r border-slate-200">
                        {!hasScore ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-amber-50 text-amber-900 px-2 py-1 border border-amber-300">
                            <Clock className="h-3 w-3 text-amber-600" /> BELUM MENGERJAKAN
                          </span>
                        ) : isTuntas ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-[10px] bg-emerald-50 text-emerald-900 px-2 py-1 border border-emerald-400">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>SUDAH ({score})</span>
                            <span className="bg-emerald-600 text-white text-[9px] px-1 py-0.2 rounded-xs font-mono-code">TUNTAS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-bold text-[10px] bg-rose-50 text-rose-900 px-2 py-1 border border-rose-400">
                            <AlertTriangle className="h-3 w-3 text-rose-600" />
                            <span>SUDAH ({score})</span>
                            <span className="bg-rose-600 text-white text-[9px] px-1 py-0.2 rounded-xs font-mono-code">REMIDI</span>
                          </span>
                        )}
                      </td>

                      {/* Quick Adjust Buttons */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleScoreAdjust(att, 5)}
                            className="p-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 cursor-pointer"
                            title="Tambah +5 poin"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleScoreAdjust(att, -5)}
                            className="p-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 cursor-pointer"
                            title="Kurang -5 poin"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleScoreChange(att, String(kkm))}
                            className="px-1.5 py-1 text-[9px] font-bold bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 cursor-pointer"
                            title={`Set nilai ${kkm}`}
                          >
                            KKM
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary Bar */}
        <div className="p-4 bg-[#faf9f6] border-t-2 border-[#1a1a1a] flex flex-wrap items-center justify-between gap-3 font-mono-code text-xs">
          <div className="flex items-center gap-4 text-slate-700">
            <span>
              Menampilkan <strong>{filteredStudents.length}</strong> dari <strong>{classStudents.length}</strong> siswa
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-700 font-bold">
              Tuntas: {stats.tuntasCount} ({stats.tuntasPercent}%)
            </span>
            <span className="text-rose-700 font-bold">
              Remidi: {stats.remidiCount} ({stats.remidiPercent}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#1a1a1a] font-bold cursor-pointer"
            >
              ↑ Kembali ke Atas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
