import { Student, TaskSubmission, SubstituteTaskSubmission, StudentSubstituteTarget } from '../types';
import { ALL_255_STUDENTS } from '../data/students255';
import { clearAuthToken } from './firebaseAuth';

export const DEFAULT_SPREADSHEET_ID = '1JgBhQhZujQp_pTk1jO4oZIY8Er1Y4NcF0CTKFrRVgI4';
export const DEFAULT_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit?usp=sharing`;

export const SUBSTITUTE_TASK_SHEET_NAME = 'Pengganti KKA 2';

const SHEET_NAMES = {
  TASKS: 'Tugas_Siswa',
  STUDENTS: 'Data_Siswa',
  SUBSTITUTE: 'Pengganti KKA 2',
};

const POSSIBLE_TASK_SHEET_NAMES = [
  'Tugas_Siswa',
  'Tugas Siswa',
  'Tugas',
  'Form Responses 1',
  'Respon Formulir 1',
  'Jawaban Formulir 1',
  'Submisi',
  'Sheet1',
  'Sheet 1',
];

const POSSIBLE_STUDENT_SHEET_NAMES = [
  'Data_Siswa',
  'Data Siswa',
  'Siswa',
  'Daftar Siswa',
  'Students',
  'Sheet2',
  'Sheet 2',
];

export const CLASS_SHEET_NAMES = ['8A', '8B', '8C', '8D', '8E', '8F', '8G', '8H'];

// Authentic 255-student database from Google Spreadsheet
export const INITIAL_STUDENTS_MOCK: Student[] = ALL_255_STUDENTS;

// Authentic Task Submissions with student web showcase projects (empty by default so only real spreadsheet submissions are displayed)
export const INITIAL_TASKS_MOCK: TaskSubmission[] = [];

// Helper to format GViz Date(YYYY,M,D,H,m,s)
export function formatGvizDate(dateVal: any): string {
  if (!dateVal) return new Date().toLocaleString('id-ID');
  if (typeof dateVal === 'string') {
    const match = dateVal.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10); // 0-indexed in JS
      const day = parseInt(match[3], 10);
      const hours = match[4] ? parseInt(match[4], 10) : 0;
      const minutes = match[5] ? parseInt(match[5], 10) : 0;
      const d = new Date(year, month, day, hours, minutes);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return dateVal;
  }
  return String(dateVal);
}

// Helper to parse Google API error responses
export function parseGoogleApiError(status: number, errText: string, actionDesc: string = 'operasi'): { isAuthError: boolean; isPermissionError: boolean; message: string } {
  let cleanMsg = '';
  let errorObj: any = null;
  try {
    errorObj = JSON.parse(errText);
    cleanMsg = errorObj.error?.message || '';
  } catch (e) {
    cleanMsg = errText || '';
  }

  const lowerMsg = cleanMsg.toLowerCase();

  if (status === 401) {
    clearAuthToken();
    return {
      isAuthError: true,
      isPermissionError: false,
      message: 'Sesi akun Google Anda telah kedaluwarsa. Silakan klik LOGIN GOOGLE di bilah atas untuk menyegarkan sesi.',
    };
  }

  if (status === 403 || lowerMsg.includes('permission') || lowerMsg.includes('caller does not have') || lowerMsg.includes('access denied')) {
    if (lowerMsg.includes('has not been used') || lowerMsg.includes('has not been enabled') || lowerMsg.includes('api disabled')) {
      return {
        isAuthError: false,
        isPermissionError: true,
        message: `Google Sheets API belum diaktifkan di Google Cloud Console untuk proyek ini. Buka console.cloud.google.com > APIs & Services > Library > cari 'Google Sheets API' > klik 'Enable'.`,
      };
    }
    if (lowerMsg.includes('insufficient') || lowerMsg.includes('scope')) {
      return {
        isAuthError: true,
        isPermissionError: false,
        message: `Izin akses Spreadsheet belum dicentang saat login. Silakan klik LOGOUT di bilah atas, lalu klik LOGIN GOOGLE kembali dan pastikan mencentang semua izin akses Google Sheets yang diminta.`,
      };
    }
    return {
      isAuthError: false,
      isPermissionError: true,
      message: `Izin Akses Ditolak (Error 403): Akun Google yang terhubung saat ini belum memiliki akses "Editor" (Penyunting) pada file Spreadsheet ini. Silakan buka Google Spreadsheet > klik tombol "Bagikan" (Share) > tambahkan email Anda sebagai Editor.`,
    };
  }

  if (status === 404) {
    return {
      isAuthError: false,
      isPermissionError: false,
      message: 'File Google Spreadsheet tidak ditemukan. Pastikan ID Spreadsheet valid.',
    };
  }

  return {
    isAuthError: false,
    isPermissionError: false,
    message: `Gagal ${actionDesc} (${status}): ${cleanMsg || 'Terjadi kesalahan pada Google Sheets API'}`,
  };
}

// Helper to ensure target sheet exists and return its resolved exact name
export async function ensureSheetExists(
  accessToken: string,
  spreadsheetId: string,
  preferredSheetTitle: string,
  headers: string[]
): Promise<{ success: boolean; resolvedTitle: string; isAuthError?: boolean; isPermissionError?: boolean; message?: string }> {
  if (!accessToken) {
    return { success: false, resolvedTitle: preferredSheetTitle, isAuthError: true, message: 'Autentikasi Google diperlukan.' };
  }
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (metaRes.status === 401) {
      clearAuthToken();
      return { success: false, resolvedTitle: preferredSheetTitle, isAuthError: true, message: 'Sesi Google kedaluwarsa.' };
    }

    if (metaRes.status === 403) {
      const errText = await metaRes.text();
      const parsed = parseGoogleApiError(403, errText, 'mengakses metadata spreadsheet');
      return { success: false, resolvedTitle: preferredSheetTitle, isPermissionError: true, message: parsed.message };
    }

    if (!metaRes.ok) {
      const errText = await metaRes.text();
      const parsed = parseGoogleApiError(metaRes.status, errText, 'membaca spreadsheet');
      return { success: false, resolvedTitle: preferredSheetTitle, message: parsed.message };
    }

    const meta = await metaRes.json();
    const existingSheets = meta.sheets || [];
    
    // Look for matching sheet title (e.g. 'Tugas_Siswa' vs 'Tugas Siswa')
    const cleanPreferred = preferredSheetTitle.replace(/[\s_]/g, '').toLowerCase();
    const matchingSheet = existingSheets.find((s: any) => {
      const t = String(s.properties?.title || '').replace(/[\s_]/g, '').toLowerCase();
      return t === cleanPreferred;
    });

    if (matchingSheet) {
      return { success: true, resolvedTitle: matchingSheet.properties.title };
    }

    // Sheet doesn't exist, create it
    const addRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: preferredSheetTitle,
                  gridProperties: { rowCount: 1000, columnCount: 20 },
                },
              },
            },
          ],
        }),
      }
    );

    if (!addRes.ok) {
      const errText = await addRes.text();
      console.warn('Failed to add sheet via batchUpdate:', errText);
    }

    // Set headers
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(preferredSheetTitle)}!A1:${String.fromCharCode(64 + headers.length)}1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [headers],
        }),
      }
    );

    return { success: true, resolvedTitle: preferredSheetTitle };
  } catch (err: any) {
    console.warn(`Error ensuring sheet ${preferredSheetTitle} exists:`, err);
    return { success: false, resolvedTitle: preferredSheetTitle, message: err.message || String(err) };
  }
}

// Initialize sheets if needed
export async function initializeSpreadsheetSheets(accessToken: string, spreadsheetId: string) {
  try {
    await ensureSheetExists(accessToken, spreadsheetId, SHEET_NAMES.TASKS, [
      'ID Tugas',
      'Waktu Pengumpulan',
      'Nama Siswa / Anggota',
      'Kelompok',
      'Judul Tugas',
      'Deskripsi / Link Web & PDF',
    ]);
  } catch (err) {
    console.warn('Initialization error:', err);
  }
}

// Fetch public Google Sheet data via GViz JSONP endpoint
export async function fetchPublicGvizData(
  spreadsheetId: string,
  sheetNamesToTry: string[]
): Promise<any[][] | null> {
  const nocache = Date.now();
  for (const sheetName of sheetNamesToTry) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&_nc=${nocache}`;
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) continue;

      const text = await res.text();
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) continue;

      const jsonStr = text.substring(firstBrace, lastBrace + 1);
      const data = JSON.parse(jsonStr);

      if (data.status === 'ok' && data.table && data.table.rows && data.table.rows.length > 0) {
        return parseGvizTable(data.table);
      }
    } catch (err) {
      // Continue to next sheet name
    }
  }
  return null;
}

// Helper to convert GViz Table structure to 2D Array
function parseGvizTable(table: any): any[][] {
  const rows: any[][] = [];
  for (const r of table.rows) {
    if (!r.c) continue;
    const rowVals: any[] = [];
    for (const cell of r.c) {
      rowVals.push(cell ? (cell.v !== null && cell.v !== undefined ? cell.v : cell.f || '') : '');
    }
    if (rowVals.some((v) => String(v).trim() !== '')) {
      rows.push(rowVals);
    }
  }
  return rows;
}

// Parse class sheet rows (e.g. from tab '8A', '8B', etc.)
function parseClassSheetRows(rawRows: any[][], className: string): Student[] {
  if (!rawRows || rawRows.length === 0) return [];
  const students: Student[] = [];
  const cleanClass = className.startsWith('Kelas') ? className : `Kelas ${className}`;
  const normClass = cleanClass.toUpperCase().replace(/^KELAS\s*/i, '').replace(/[^0-9A-Z]/g, '');

  for (const row of rawRows) {
    if (!row || row.length === 0) continue;

    // Detect attendance number column
    let noVal = row[0];
    let nipdVal = row[1];
    let genderVal = row[2];
    let nameVal = row[3];

    let noNum = parseInt(String(noVal).trim(), 10);
    if (isNaN(noNum) || noNum <= 0 || noNum > 50) {
      // Check if columns are shifted by 1 column
      const shiftedNoNum = parseInt(String(row[1]).trim(), 10);
      if (!isNaN(shiftedNoNum) && shiftedNoNum > 0 && shiftedNoNum <= 50) {
        noVal = row[1];
        nipdVal = row[2];
        genderVal = row[3];
        nameVal = row[4];
        noNum = shiftedNoNum;
      } else {
        // Not a student data row (header, title, blank, etc.)
        continue;
      }
    }

    let cleanName = String(nameVal || '').trim();
    const cleanUpper = cleanName.toUpperCase();

    // Check if name is corrupted with header text like 'ASPEK', 'NAMA', etc.
    const isInvalidHeader =
      !cleanName ||
      cleanUpper.includes('ASPEK') ||
      cleanUpper.includes('NAMA') ||
      cleanUpper.includes('DAFTAR') ||
      cleanUpper.includes('NILAI') ||
      cleanUpper.includes('SUMATIF') ||
      cleanUpper.includes('FORMATIF') ||
      cleanUpper.includes('KELAS') ||
      cleanUpper.includes('SEMESTER') ||
      cleanUpper === 'L' ||
      cleanUpper === 'P' ||
      cleanUpper === 'L/P';

    const attendanceNo = String(noNum);

    // If name is an invalid header or ASPEK, recover from authentic 255 students roster
    if (isInvalidHeader) {
      const fallbackStudent = ALL_255_STUDENTS.find(
        (s) =>
          s.className.toUpperCase().replace(/^KELAS\s*/i, '').replace(/[^0-9A-Z]/g, '') === normClass &&
          String(s.attendanceNo) === attendanceNo
      );

      if (fallbackStudent) {
        cleanName = fallbackStudent.name;
        nipdVal = fallbackStudent.nis;
        genderVal = fallbackStudent.gender || genderVal;
      } else {
        continue;
      }
    }

    const groupNum = Math.ceil(noNum / 4);
    const cleanNis = String(nipdVal || '').trim() || `${cleanClass.replace(/\D/g, '')}${String(attendanceNo).padStart(2, '0')}`;

    students.push({
      id: `std-${cleanClass.toLowerCase().replace(/[^a-z0-9]/g, '')}-${attendanceNo}`,
      name: cleanName,
      nis: cleanNis,
      className: cleanClass,
      group: `Kelompok ${groupNum}`,
      attendanceNo,
      gender: String(genderVal || '').trim(),
      status: 'Aktif',
    });
  }

  return students;
}

// Fetch all data from connected Google Spreadsheet
export async function loadSpreadsheetData(
  accessToken: string | null,
  spreadsheetId: string
): Promise<{
  tasks: TaskSubmission[];
  students: Student[];
}> {
  // 1. Fetch Class sheets in parallel across 8A through 8H
  try {
    const classFetchPromises = CLASS_SHEET_NAMES.map(async (c) => {
      const rows = await fetchPublicGvizData(spreadsheetId, [c, `Kelas ${c}`, `KELAS ${c}`]);
      if (rows && rows.length > 0) {
        return parseClassSheetRows(rows, `Kelas ${c}`);
      }
      return [];
    });

    const parsedClassResults = await Promise.all(classFetchPromises);
    const combinedStudents = parsedClassResults.flat();

    let finalStudents = combinedStudents.length >= 200 ? combinedStudents : ALL_255_STUDENTS;

    // 2. Fetch Tasks from Tugas_Siswa or public gviz
    let tasks: TaskSubmission[] = [];
    const publicTaskRows = await fetchPublicGvizData(spreadsheetId, POSSIBLE_TASK_SHEET_NAMES);

    if (publicTaskRows && publicTaskRows.length > 0) {
      const col0 = String(publicTaskRows[0][0] || '').trim().toLowerCase();
      const col1 = String(publicTaskRows[0][1] || '').trim().toLowerCase();
      const isTaskHeader =
        !col0.startsWith('tsk-') &&
        !col0.startsWith('task-') &&
        !/^\d+$/.test(col0) &&
        (col0.includes('id') || col0.includes('tugas') || col1.includes('waktu'));
      const startIdx = isTaskHeader ? 1 : 0;

      tasks = publicTaskRows
        .slice(startIdx)
        .filter((row: any[]) => row && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ''))
        .map((row: any[], index: number) => {
          const id = row[0] ? String(row[0]) : `tsk-${Date.now()}-${index}`;
          const submittedAt = formatGvizDate(row[1]);
          let studentName = row[2] ? String(row[2]).trim() : 'Siswa';
          let groupVal = 'Kelompok 1';
          let taskTitle = 'Tugas';
          let descText = '';
          let studentNis = '';

          // Support both 6-column (new without NIS & Status) and 8-column (legacy) layouts
          const col3Str = row[3] ? String(row[3]).trim() : '';
          const isLegacyWithNis = /^\d{4,8}$/.test(col3Str) && row.length >= 6;

          if (isLegacyWithNis) {
            studentNis = col3Str;
            groupVal = row[4] ? String(row[4]).trim() : 'Kelompok 1';
            taskTitle = row[5] ? String(row[5]).trim() : 'Tugas';
            descText = row[6] ? String(row[6]).trim() : '';
          } else {
            groupVal = row[3] ? String(row[3]).trim() : 'Kelompok 1';
            taskTitle = row[4] ? String(row[4]).trim() : 'Tugas';
            descText = row[5] ? String(row[5]).trim() : '';
          }

          // Clean up "ASPEK" if encountered from previous spreadsheet submissions
          if (studentName.toUpperCase().includes('ASPEK')) {
            let inferredClass = '8F';
            if (studentName.toUpperCase().includes('NIZAM') || studentName.toUpperCase().includes('NARENDRA') || descText.includes('17')) {
              inferredClass = '8F';
            } else if (descText.match(/8[A-Ha-h]/i)) {
              inferredClass = descText.match(/8[A-Ha-h]/i)![0].toUpperCase();
            }
            const realName =
              inferredClass === '8F'
                ? 'ABIB SEPTIYANTO'
                : inferredClass === '8E'
                ? 'AFIKA CAHYA KIRANA'
                : inferredClass === '8G'
                ? 'ADELIA RAHMA'
                : 'ABIB SEPTIYANTO';
            studentName = studentName.replace(/ASPEK\s*(\(No\.?\s*1\))?/gi, `${realName} (No.1)`);
          }

          // Determine task type (kelompok vs individu)
          const isGroup =
            groupVal.toLowerCase().includes('kelompok') ||
            studentName.includes(',') ||
            studentName.includes('No.') ||
            descText.toLowerCase().includes('absen');

          // Extract or infer class
          const classMatch = descText.match(/Kelas\s*([0-9A-Za-z]+)/i);
          let resolvedClass = classMatch ? `Kelas ${classMatch[1].toUpperCase()}` : '';
          if (!resolvedClass && groupVal.match(/8[A-Ha-h]/i)) {
            resolvedClass = `Kelas ${groupVal.match(/8[A-Ha-h]/i)![0].toUpperCase()}`;
          }
          if (!resolvedClass && taskTitle.match(/8[A-Ha-h]/i)) {
            resolvedClass = `Kelas ${taskTitle.match(/8[A-Ha-h]/i)![0].toUpperCase()}`;
          }
          if (!resolvedClass) {
            // Find student in authentic roster
            const firstPerson = studentName.split(/[,;\n]/)[0].replace(/\(.*?\)/g, '').trim();
            if (firstPerson) {
              const matchStd = ALL_255_STUDENTS.find(
                (s) =>
                  s.name.toUpperCase().includes(firstPerson.toUpperCase()) ||
                  firstPerson.toUpperCase().includes(s.name.toUpperCase())
              );
              if (matchStd) {
                resolvedClass = matchStd.className;
              }
            }
          }
          if (!resolvedClass) {
            resolvedClass = 'Kelas 8A';
          }

          // Sanitize groupVal if literally written as "tutor"
          if (/tutor/i.test(groupVal)) {
            if (resolvedClass.includes('8D')) {
              groupVal = 'Kelompok 8';
            }
          }

          return {
            id,
            submittedAt,
            taskType: isGroup ? 'kelompok' : 'individu',
            className: resolvedClass,
            studentName,
            studentNis,
            group: groupVal,
            taskTitle,
            descriptionOrLink: descText,
            status: 'Selesai' as any,
          };
        });
    }

    return { tasks, students: finalStudents };
  } catch (err) {
    console.warn('Error loading spreadsheet data, using authentic dataset fallback:', err);
    return { tasks: [], students: ALL_255_STUDENTS };
  }
}

// Append new Task to Google Sheets (6 Columns: ID Tugas, Waktu, Nama, Kelompok, Judul, Deskripsi)
export async function syncNewTaskToSheet(
  accessToken: string,
  spreadsheetId: string,
  task: TaskSubmission
): Promise<{ success: boolean; isAuthError?: boolean; isPermissionError?: boolean; message: string }> {
  if (!accessToken) {
    return {
      success: false,
      isAuthError: true,
      message: 'Silakan hubungkan akun Google Anda untuk menyimpan data ke Spreadsheet.',
    };
  }

  try {
    const taskHeaders = [
      'ID Tugas',
      'Waktu Pengumpulan',
      'Nama Siswa / Anggota',
      'Kelompok',
      'Judul Tugas',
      'Deskripsi / Link Web & PDF',
    ];

    // Ensure Tugas_Siswa sheet tab exists & get exact name (e.g. Tugas_Siswa or Tugas Siswa)
    const sheetEnsure = await ensureSheetExists(accessToken, spreadsheetId, SHEET_NAMES.TASKS, taskHeaders);
    if (sheetEnsure.isPermissionError) {
      return {
        success: false,
        isPermissionError: true,
        message: sheetEnsure.message || 'Izin Editor pada Spreadsheet diperlukan.',
      };
    }
    if (sheetEnsure.isAuthError) {
      return {
        success: false,
        isAuthError: true,
        message: sheetEnsure.message || 'Sesi Google kedaluwarsa.',
      };
    }

    const targetSheetTitle = sheetEnsure.resolvedTitle || SHEET_NAMES.TASKS;

    const row = [
      task.id,
      task.submittedAt,
      task.studentName,
      task.group,
      task.taskTitle,
      task.descriptionOrLink,
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetSheetTitle)}!A:F:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [row],
        }),
      }
    );

    if (res.ok) {
      return {
        success: true,
        message: `Karya "${task.taskTitle}" berhasil ditambahkan ke tab '${targetSheetTitle}' di Google Spreadsheet!`,
      };
    } else {
      const errText = await res.text();
      const parsed = parseGoogleApiError(res.status, errText, 'menambahkan karya ke Google Spreadsheet');
      return {
        success: false,
        isAuthError: parsed.isAuthError,
        isPermissionError: parsed.isPermissionError,
        message: parsed.message,
      };
    }
  } catch (err: any) {
    console.error('Error syncing new task to Google Sheets:', err);
    return {
      success: false,
      message: `Error koneksi Google Sheets: ${err.message || err}`,
    };
  }
}

// Bulk update Tasks (6 Columns)
export async function syncAllTasksToSheet(
  accessToken: string,
  spreadsheetId: string,
  tasks: TaskSubmission[]
): Promise<{ success: boolean; isAuthError?: boolean; isPermissionError?: boolean; count: number; message: string }> {
  if (!accessToken) {
    return {
      success: false,
      isAuthError: true,
      count: 0,
      message: 'Silakan hubungkan akun Google Anda untuk menyinkronkan data.',
    };
  }

  try {
    const headers = [
      'ID Tugas',
      'Waktu Pengumpulan',
      'Nama Siswa / Anggota',
      'Kelompok',
      'Judul Tugas',
      'Deskripsi / Link Web & PDF',
    ];

    const sheetEnsure = await ensureSheetExists(accessToken, spreadsheetId, SHEET_NAMES.TASKS, headers);
    if (sheetEnsure.isPermissionError) {
      return {
        success: false,
        isPermissionError: true,
        count: 0,
        message: sheetEnsure.message || 'Izin Editor pada Spreadsheet diperlukan.',
      };
    }
    if (sheetEnsure.isAuthError) {
      return {
        success: false,
        isAuthError: true,
        count: 0,
        message: sheetEnsure.message || 'Sesi Google kedaluwarsa.',
      };
    }

    const targetSheetTitle = sheetEnsure.resolvedTitle || SHEET_NAMES.TASKS;

    const rows = tasks.map((t) => [
      t.id,
      t.submittedAt,
      t.studentName,
      t.group,
      t.taskTitle,
      t.descriptionOrLink,
    ]);

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetSheetTitle)}!A1:F${rows.length + 1}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [headers, ...rows],
        }),
      }
    );

    if (res.ok) {
      return {
        success: true,
        count: tasks.length,
        message: `Berhasil menyinkronkan ${tasks.length} data karya ke tab '${targetSheetTitle}' di Google Spreadsheet!`,
      };
    } else {
      const errText = await res.text();
      const parsed = parseGoogleApiError(res.status, errText, 'memperbarui data karya di Google Spreadsheet');
      return {
        success: false,
        isAuthError: parsed.isAuthError,
        isPermissionError: parsed.isPermissionError,
        count: 0,
        message: parsed.message,
      };
    }
  } catch (err: any) {
    console.error('Error batch syncing tasks to Google Sheets:', err);
    return {
      success: false,
      count: 0,
      message: `Error koneksi Google Sheets: ${err.message || err}`,
    };
  }
}

// Bulk update Students
export async function syncAllStudentsToSheet(
  accessToken: string,
  spreadsheetId: string,
  students: Student[]
): Promise<{ success: boolean; isAuthError?: boolean; isPermissionError?: boolean; count: number; message: string }> {
  if (!accessToken) {
    return {
      success: false,
      isAuthError: true,
      count: 0,
      message: 'Silakan hubungkan akun Google Anda untuk menyinkronkan daftar siswa.',
    };
  }

  try {
    const headers = [
      'ID Siswa',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Kelompok',
      'Nomor Absen',
      'Email',
      'Status',
    ];

    const sheetEnsure = await ensureSheetExists(accessToken, spreadsheetId, SHEET_NAMES.STUDENTS, headers);
    if (sheetEnsure.isPermissionError) {
      return {
        success: false,
        isPermissionError: true,
        count: 0,
        message: sheetEnsure.message || 'Izin Editor pada Spreadsheet diperlukan.',
      };
    }
    if (sheetEnsure.isAuthError) {
      return {
        success: false,
        isAuthError: true,
        count: 0,
        message: sheetEnsure.message || 'Sesi Google kedaluwarsa.',
      };
    }

    const targetSheetTitle = sheetEnsure.resolvedTitle || SHEET_NAMES.STUDENTS;

    const rows = students.map((s) => [
      s.id,
      s.nis,
      s.name,
      s.className,
      s.group,
      s.attendanceNo || '',
      s.email || '',
      s.status,
    ]);

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetSheetTitle)}!A1:H${rows.length + 1}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [headers, ...rows],
        }),
      }
    );

    if (res.ok) {
      return {
        success: true,
        count: students.length,
        message: `Berhasil menyinkronkan ${students.length} data siswa ke tab '${targetSheetTitle}' di Google Spreadsheet!`,
      };
    } else {
      const errText = await res.text();
      const parsed = parseGoogleApiError(res.status, errText, 'memperbarui data siswa di Google Spreadsheet');
      return {
        success: false,
        isAuthError: parsed.isAuthError,
        isPermissionError: parsed.isPermissionError,
        count: 0,
        message: parsed.message,
      };
    }
  } catch (err: any) {
    console.error('Error updating students in Google Sheets:', err);
    return {
      success: false,
      count: 0,
      message: `Error koneksi Google Sheets: ${err.message || err}`,
    };
  }
}

// Convert column index (0-based) to Sheets A1 notation (e.g. 0 -> A, 4 -> E, 26 -> AA)
export function columnToLetter(column: number): string {
  let temp: number;
  let letter = '';
  let col = column + 1;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}

// Interface for grade item mapping
export interface StudentGradeItem {
  attendanceNo: string;
  nis: string;
  name: string;
  gender?: string;
  score: number | null; // null if not graded / pending
}

// Direct Sync of Grades to Specific Class Sheet Tab (e.g. '8A', '7A') without creating new duplicate tabs
export async function syncGradesToClassSheet(
  accessToken: string,
  spreadsheetId: string,
  className: string,
  taskTitle: string,
  studentGrades: StudentGradeItem[],
  targetColumn: string = 'AUTO' // 'AUTO', 'E', 'F', 'G', 'H', ...
): Promise<{ success: boolean; isAuthError?: boolean; columnLetter?: string; startCell?: string; message: string }> {
  if (!accessToken) {
    return {
      success: false,
      isAuthError: true,
      message: 'Silakan hubungkan akun Google Anda untuk menyinkronkan data nilai.',
    };
  }

  try {
    const rawClass = className.replace(/^Kelas\s*/i, '').trim(); // e.g. '8A' or '8G'
    
    // 1. Fetch metadata to find matching sheet tab name & sheetId
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (metaRes.status === 401) {
      clearAuthToken();
      return {
        success: false,
        isAuthError: true,
        message: 'Sesi Google Anda kedaluwarsa. Silakan login kembali.',
      };
    }

    if (!metaRes.ok) {
      const errText = await metaRes.text();
      const parsed = parseGoogleApiError(metaRes.status, errText, 'membaca spreadsheet');
      return {
        success: false,
        isAuthError: parsed.isAuthError,
        message: parsed.message,
      };
    }

    const meta = await metaRes.json();
    const sheetsList = meta.sheets || [];
    
    // Look for sheet matching '8G', 'Kelas 8G', '8A', etc.
    let targetSheet = sheetsList.find(
      (s: any) =>
        s.properties?.title?.toLowerCase().trim() === rawClass.toLowerCase().trim() ||
        s.properties?.title?.toLowerCase().trim() === `kelas ${rawClass.toLowerCase().trim()}`
    );

    let sheetTitle = targetSheet ? targetSheet.properties.title : rawClass;
    let sheetId = targetSheet ? targetSheet.properties.sheetId : null;

    // If sheet doesn't exist, create it with standard school layout
    if (!targetSheet) {
      const addRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetTitle,
                    gridProperties: { rowCount: 100, columnCount: 30 },
                  },
                },
              },
            ],
          }),
        }
      );

      if (!addRes.ok) {
        const errText = await addRes.text();
        const parsed = parseGoogleApiError(addRes.status, errText, `membuat sheet '${sheetTitle}'`);
        return {
          success: false,
          isAuthError: parsed.isAuthError,
          message: parsed.message,
        };
      }

      const addData = await addRes.json();
      sheetId = addData.replies?.[0]?.addSheet?.properties?.sheetId ?? null;
    }

    // 2. Fetch existing rows to determine structure and preserve existing grades (inspect A1 to Z45)
    const fetchRange = `${encodeURIComponent(sheetTitle)}!A1:Z45`;
    const dataRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${fetchRange}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    let existingRows: any[][] = [];
    if (dataRes.ok) {
      const dataJson = await dataRes.json();
      existingRows = dataJson.values || [];
    } else {
      const errText = await dataRes.text();
      const parsed = parseGoogleApiError(dataRes.status, errText, `mengambil data sheet '${sheetTitle}'`);
      return {
        success: false,
        isAuthError: parsed.isAuthError,
        message: parsed.message,
      };
    }

    // Standard school template structure:
    // Row 4 (index 3): NO | NIPD | L/P | NAMA SISWA | ASPEK (merged E4:R4)
    // Row 5 (index 4): Aspect headers (E5: Tugas 1, F5: Tugas 2, G5: Tugas 3, ...)
    // Row 6 (index 5): Student Absen 1 (Adelia Rahma, etc.) -> Cell E6 is Absen 1's score
    // Row 7 (index 6): Student Absen 2 -> Cell E7
    // ...
    // Row 37 (index 36): Student Absen 32 -> Cell E37

    let targetColIdx = 4; // Default to Column E (index 4)

    const normalizedTarget = (targetColumn || 'AUTO').toUpperCase().trim();
    if (normalizedTarget !== 'AUTO' && /^[A-Z]{1,2}$/.test(normalizedTarget)) {
      // User or UI specified an explicit column letter (e.g. 'E', 'F', 'G', 'H')
      targetColIdx = letterToColumn(normalizedTarget);
    } else {
      // AUTO detection:
      // Locate Row 5 (index 4) and Row 4 (index 3)
      const row5 = existingRows[4] || [];
      let foundExactCol = -1;

      const cleanTitle = (taskTitle || '').trim().toLowerCase();
      // Only match if the title is EXACTLY identical (case-insensitive) to prevent accidental overwrites
      for (let c = 4; c <= 17; c++) {
        const val5 = String(row5[c] || '').trim().toLowerCase();
        if (cleanTitle && val5 && val5 === cleanTitle) {
          foundExactCol = c;
          break;
        }
      }

      if (foundExactCol !== -1) {
        targetColIdx = foundExactCol;
      } else {
        // Find the first unoccupied column starting from Column E (idx 4) to R (idx 17)
        // A column is occupied if it has a non-empty header in Row 5 (not ASPEK or class code) OR has student scores
        let firstAvailableCol = -1;
        for (let c = 4; c <= 17; c++) {
          const headerVal = String(row5[c] || '').trim();
          const hasHeader =
            headerVal !== '' &&
            headerVal !== '-' &&
            headerVal.toUpperCase() !== 'ASPEK' &&
            headerVal.toUpperCase() !== rawClass.toUpperCase() &&
            !/^\d+$/.test(headerVal);

          let hasScores = false;
          for (let r = 5; r < Math.min(existingRows.length, 38); r++) {
            const rowData = existingRows[r] || [];
            const cellVal = String(rowData[c] || '').trim();
            if (cellVal !== '' && cellVal !== '-' && cellVal !== '0') {
              hasScores = true;
              break;
            }
          }

          if (!hasHeader && !hasScores) {
            firstAvailableCol = c;
            break;
          }
        }

        if (firstAvailableCol !== -1) {
          targetColIdx = firstAvailableCol;
        } else {
          // If all E..R are occupied, use Column S (idx 18)
          targetColIdx = 18;
        }
      }
    }

    const targetColLetter = columnToLetter(targetColIdx);
    
    // Determine start row for students:
    // Standard template has student 1 at Row 6, with header at Row 5
    let headerRowNumber = 5;
    let studentStartRowNumber = 6;

    // Check if we can locate Absen 1 in Column A (index 0)
    for (let r = 0; r < existingRows.length; r++) {
      const colA = String(existingRows[r]?.[0] || '').trim();
      if (colA === '1') {
        studentStartRowNumber = r + 1; // 1-indexed row number
        headerRowNumber = Math.max(1, studentStartRowNumber - 1);
        break;
      }
    }

    // Sort student grades by attendance number
    const sortedGrades = [...studentGrades].sort((a, b) => {
      const na = parseInt(a.attendanceNo || '0', 10);
      const nb = parseInt(b.attendanceNo || '0', 10);
      return na - nb;
    });

    // Check if header row already has a custom title in this column
    const existingHeader = String(existingRows[headerRowNumber - 1]?.[targetColIdx] || '').trim();
    const finalHeaderTitle = (taskTitle && taskTitle.trim()) || existingHeader || `Tugas Kolom ${targetColLetter}`;

    // Build the column values array starting with Header at Row 5
    const columnValues: (string | number)[][] = [
      [finalHeaderTitle]
    ];

    // MERGE LOGIC: Safely preserve existing student scores in this column if not updated in this session
    let updatedCount = 0;
    let preservedCount = 0;

    for (let i = 0; i < sortedGrades.length; i++) {
      const sg = sortedGrades[i];
      const studentRowIndex = (studentStartRowNumber - 1) + i;
      const existingRow = existingRows[studentRowIndex] || [];
      const existingCellVal = existingRow[targetColIdx];
      
      let finalScore: string | number = '';
      if (sg.score !== null && sg.score !== undefined) {
        finalScore = sg.score;
        updatedCount++;
      } else if (
        existingCellVal !== undefined &&
        existingCellVal !== null &&
        String(existingCellVal).trim() !== '' &&
        String(existingCellVal).trim() !== '-'
      ) {
        // Keep previously stored grade from spreadsheet so it is NEVER lost
        const parsedExisting = parseFloat(String(existingCellVal).replace(',', '.'));
        finalScore = !isNaN(parsedExisting) ? parsedExisting : existingCellVal;
        preservedCount++;
      }

      columnValues.push([finalScore]);
    }

    // Write range: e.g. '8G'!E5:E37
    const endRowNumber = headerRowNumber + columnValues.length - 1;
    const writeRange = `${encodeURIComponent(sheetTitle)}!${targetColLetter}${headerRowNumber}:${targetColLetter}${endRowNumber}`;

    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: columnValues,
        }),
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      const parsed = parseGoogleApiError(updateRes.status, errText, 'memperbarui sel nilai di spreadsheet');
      return {
        success: false,
        isAuthError: parsed.isAuthError,
        message: parsed.message,
      };
    }

    const startStudentCell = `${targetColLetter}${studentStartRowNumber}`;

    return {
      success: true,
      columnLetter: targetColLetter,
      startCell: startStudentCell,
      message: `Sukses! Nilai "${finalHeaderTitle}" berhasil disimpan ke sheet '${sheetTitle}' pada Kolom ${targetColLetter} (${updatedCount} nilai diperbarui, ${preservedCount} nilai tersimpan dipertahankan).`,
    };
  } catch (err: any) {
    console.error('Error syncing grades to class sheet:', err);
    return {
      success: false,
      message: `Error koneksi Google Sheets: ${err.message || err}`,
    };
  }
}

// Clear a specific column in a class sheet (e.g. to clean up column R)
export async function clearColumnInClassSheet(
  accessToken: string,
  spreadsheetId: string,
  className: string,
  columnLetter: string
): Promise<{ success: boolean; isAuthError?: boolean; isPermissionError?: boolean; message: string }> {
  if (!accessToken) {
    return { success: false, isAuthError: true, message: 'Autentikasi Google diperlukan.' };
  }

  try {
    const rawClass = className.replace(/^Kelas\s*/i, '').trim();
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!metaRes.ok) {
      const errText = await metaRes.text();
      const parsed = parseGoogleApiError(metaRes.status, errText, 'membaca spreadsheet');
      return { success: false, isAuthError: parsed.isAuthError, isPermissionError: parsed.isPermissionError, message: parsed.message };
    }

    const meta = await metaRes.json();
    const sheetsList = meta.sheets || [];
    const targetSheet = sheetsList.find(
      (s: any) =>
        s.properties?.title?.toLowerCase().trim() === rawClass.toLowerCase().trim() ||
        s.properties?.title?.toLowerCase().trim() === `kelas ${rawClass.toLowerCase().trim()}`
    );
    const sheetTitle = targetSheet ? targetSheet.properties.title : rawClass;

    const clearRange = `${encodeURIComponent(sheetTitle)}!${columnLetter}5:${columnLetter}45`;
    const clearRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (clearRes.ok) {
      return { success: true, message: `Kolom ${columnLetter} pada sheet '${sheetTitle}' berhasil dibersihkan.` };
    } else {
      const errText = await clearRes.text();
      const parsed = parseGoogleApiError(clearRes.status, errText, `membersihkan Kolom ${columnLetter}`);
      return { success: false, isAuthError: parsed.isAuthError, isPermissionError: parsed.isPermissionError, message: parsed.message };
    }
  } catch (err: any) {
    return { success: false, message: `Error: ${err.message || err}` };
  }
}

// Helper to convert letter like 'A' -> 0, 'E' -> 4, 'R' -> 17
function letterToColumn(letter: string): number {
  let column = 0;
  const str = letter.toUpperCase();
  for (let i = 0; i < str.length; i++) {
    column = column * 26 + (str.charCodeAt(i) - 64);
  }
  return Math.max(0, column - 1);
}

export interface StudentTaskCheckItem {
  id: string;
  category: 'Koding / KKA' | 'Informatika' | 'Projek Web';
  taskName: string;
  columnLetter?: string;
  isCompleted: boolean; // true = 'v', false = 'x'
  score?: number | string | null;
  submittedAt?: string;
  linkOrDescription?: string;
  notes?: string;
}

// Standard Task Titles mapped to columns E, F, G
export const STANDARD_TASK_TITLES: { [colLetter: string]: string } = {
  E: 'Tugas 1 - KKA - Algoritma',
  F: 'Tugas 1 - Informatika - Analisis Data',
  G: 'Tugas 2 - KKA - Algoritma Web',
  H: 'Tugas 4',
  I: 'Tugas 5',
};

// Fetch all task/grade completion status for an individual student directly from Spreadsheet
export async function fetchStudentAssignmentStatus(
  spreadsheetId: string,
  className: string,
  attendanceNo: string,
  studentNis: string,
  studentName?: string
): Promise<{
  success: boolean;
  tasks: StudentTaskCheckItem[];
  message?: string;
}> {
  try {
    const rawClass = className.replace(/^Kelas\s*/i, '').trim(); // e.g. '8G' or '8A'
    const targetSpreadsheetId = spreadsheetId || DEFAULT_SPREADSHEET_ID;
    const nocache = Date.now();

    // Fetch full GViz json
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(rawClass)}&_nc=${nocache}`;
    const res = await fetch(sheetUrl, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Gagal menghubungi Google Spreadsheet (Status: ${res.status})`);
    }

    const text = await res.text();
    const fb = text.indexOf('{');
    const lb = text.lastIndexOf('}');
    if (fb === -1 || lb === -1) {
      throw new Error('Format data Google Spreadsheet tidak valid.');
    }

    const gData = JSON.parse(text.substring(fb, lb + 1));
    if (gData.status !== 'ok' || !gData.table || !gData.table.rows) {
      throw new Error('Tabel spreadsheet kelas tidak ditemukan.');
    }

    const cols = gData.table.cols || [];
    const rawRows = gData.table.rows || [];

    // 1. Extract task titles from GViz cols label and non-student header rows
    const taskHeaders: { [colIdx: number]: string } = {};

    // Check table cols labels
    cols.forEach((col: any, idx: number) => {
      if (idx >= 4 && col && col.label) {
        let l = String(col.label).trim().replace(/^ASPEK\s*/i, '').trim();
        if (
          l &&
          l !== '-' &&
          l.toUpperCase() !== 'ASPEK' &&
          l.toUpperCase() !== rawClass.toUpperCase() &&
          !/^\d+$/.test(l) &&
          !l.includes('Guru Mapel') &&
          !l.includes('Wedi')
        ) {
          taskHeaders[idx] = l;
        }
      }
    });

    // Check first 6 rows for header cell titles
    for (let rIdx = 0; rIdx < Math.min(6, rawRows.length); rIdx++) {
      const r = rawRows[rIdx];
      if (!r || !r.c) continue;
      const firstVal = r.c[0] ? String(r.c[0].v || '').trim() : '';
      const isStudentNum = !isNaN(parseInt(firstVal, 10)) && parseInt(firstVal, 10) >= 1 && parseInt(firstVal, 10) <= 50;
      if (!isStudentNum) {
        r.c.forEach((cell: any, cIdx: number) => {
          if (cIdx >= 4 && cell && cell.v) {
            let val = String(cell.v).trim().replace(/^ASPEK\s*/i, '').trim();
            if (
              val &&
              val !== '-' &&
              val.toUpperCase() !== 'ASPEK' &&
              val.toUpperCase() !== rawClass.toUpperCase() &&
              !/^\d+$/.test(val) &&
              !val.includes('Guru Mapel') &&
              !val.includes('Wedi')
            ) {
              if (!taskHeaders[cIdx] || val.length > taskHeaders[cIdx].length) {
                taskHeaders[cIdx] = val;
              }
            }
          }
        });
      }
    }

    // 2. Parse all student rows from sheet
    const studentRows: {
      attNum: number;
      nis: string;
      name: string;
      cells: any[];
      colOffset: number;
    }[] = [];

    for (const r of rawRows) {
      if (!r || !r.c) continue;
      let colOffset = 0;
      let attNum = parseInt(String(r.c[0]?.v || '').trim(), 10);
      let nisVal = String(r.c[1]?.v || '').trim();
      let nameVal = String(r.c[3]?.v || '').trim();

      // Check shifted column (if absen is at index 1)
      if (isNaN(attNum) || attNum < 1 || attNum > 50) {
        const shifted = parseInt(String(r.c[1]?.v || '').trim(), 10);
        if (!isNaN(shifted) && shifted >= 1 && shifted <= 50) {
          attNum = shifted;
          nisVal = String(r.c[2]?.v || '').trim();
          nameVal = String(r.c[4]?.v || '').trim();
          colOffset = 1;
        }
      }

      if (
        !isNaN(attNum) &&
        attNum >= 1 &&
        attNum <= 50 &&
        nameVal &&
        !nameVal.toUpperCase().includes('ASPEK') &&
        !nameVal.toUpperCase().includes('NAMA')
      ) {
        studentRows.push({
          attNum,
          nis: nisVal,
          name: nameVal,
          cells: r.c,
          colOffset,
        });
      }
    }

    // 3. Detect task columns: Always include E (4), F (5), G (6) plus any column up to idx 10 with scores/header
    const maxCols = Math.min(rawRows.reduce((m: number, r: any) => Math.max(m, r.c ? r.c.length : 0), 0), 10);
    const activeColumns: { colIdx: number; colLetter: string; title: string }[] = [];

    for (let cIdx = 4; cIdx <= Math.max(6, maxCols - 1); cIdx++) {
      const colLetter = columnToLetter(cIdx);
      const title = taskHeaders[cIdx] || STANDARD_TASK_TITLES[colLetter] || `Tugas Kolom ${colLetter}`;

      const hasScores = studentRows.some((s) => {
        const cell = s.cells[cIdx + s.colOffset];
        if (!cell || cell.v === null || cell.v === undefined) return false;
        const str = String(cell.v).trim();
        return str !== '' && str !== '-' && str !== '0';
      });

      // Always include E, F, G, or any column with header or score
      if (cIdx <= 6 || taskHeaders[cIdx] || hasScores) {
        activeColumns.push({
          colIdx: cIdx,
          colLetter,
          title,
        });
      }
    }

    // 4. Find the matching student row
    const targetAttNum = parseInt(attendanceNo, 10);
    const cleanNis = String(studentNis || '').trim();
    const cleanName = String(studentName || '').trim().toLowerCase();

    const matchedStudent = studentRows.find((s) => {
      if (!isNaN(targetAttNum) && targetAttNum > 0 && s.attNum === targetAttNum) {
        return true;
      }
      if (cleanNis && s.nis && s.nis === cleanNis) {
        return true;
      }
      if (cleanName && s.name) {
        const sLower = s.name.toLowerCase();
        return sLower.includes(cleanName) || cleanName.includes(sLower);
      }
      return false;
    });

    // 5. Construct task completion items
    const taskItems: StudentTaskCheckItem[] = [];

    for (const taskCol of activeColumns) {
      let cellScore: any = null;
      let isDone = false;

      if (matchedStudent) {
        const cell = matchedStudent.cells[taskCol.colIdx + matchedStudent.colOffset];
        if (cell && cell.v !== null && cell.v !== undefined) {
          const strVal = String(cell.v).trim();
          if (strVal !== '' && strVal !== '-' && strVal !== '0') {
            const numVal = Number(strVal.replace(',', '.'));
            if (!isNaN(numVal) && numVal > 0) {
              cellScore = numVal;
              isDone = true;
            } else if (
              strVal.toLowerCase() === 'v' ||
              strVal.toLowerCase() === 'ya' ||
              strVal.toLowerCase() === 'selesai' ||
              strVal.toLowerCase() === 'sudah' ||
              strVal.length > 0
            ) {
              cellScore = strVal;
              isDone = true;
            }
          }
        }
      }

      taskItems.push({
        id: `task-col-${taskCol.colLetter.toLowerCase()}`,
        category: 'Koding / KKA',
        taskName: taskCol.title,
        columnLetter: taskCol.colLetter,
        isCompleted: isDone,
        score: cellScore,
        notes: isDone
          ? cellScore && typeof cellScore === 'number'
            ? `Sudah Mengerjakan (Nilai: ${cellScore})`
            : 'Sudah Mengerjakan'
          : 'Belum Mengerjakan',
      });
    }

    return {
      success: true,
      tasks: taskItems,
    };
  } catch (err: any) {
    console.error('Error fetching student assignment status:', err);
    return {
      success: false,
      tasks: [],
      message: err?.message || 'Gagal memuat status tugas dari spreadsheet.',
    };
  }
}

export interface DetectedColumnDetail {
  colIdx: number;
  colLetter: string;
  headerTitle: string;
  hasScores: boolean;
  isOccupied: boolean;
  scoreCount: number;
  gradesMap: { [attendanceNo: string]: number | null };
}

export interface ClassColumnDetectionResult {
  success: boolean;
  className: string;
  columns: DetectedColumnDetail[];
  occupiedColumns: DetectedColumnDetail[];
  nextAvailableColumn: string; // e.g. 'F'
  nextTaskNumber: number; // e.g. 2
  lastTaskTitle?: string;
  message?: string;
}

// Detect existing task columns and find the next available column for a class sheet
export async function detectClassTaskColumns(
  spreadsheetId: string,
  className: string,
  token?: string | null
): Promise<ClassColumnDetectionResult> {
  const rawClass = className.replace(/^Kelas\s*/i, '').trim();
  const targetSpreadsheetId = spreadsheetId || DEFAULT_SPREADSHEET_ID;
  const nocache = Date.now();

  // 1. Try Google Sheets v4 API first if token is provided
  if (token) {
    try {
      const fetchRange = `${encodeURIComponent(rawClass)}!A1:Z45`;
      const apiRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${targetSpreadsheetId}/values/${fetchRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (apiRes.ok) {
        const dataJson = await apiRes.json();
        const rows: any[][] = dataJson.values || [];

        if (rows.length > 0) {
          const row5 = rows[4] || [];
          const row4 = rows[3] || [];
          const taskHeaders: { [colIdx: number]: string } = {};

          for (let c = 4; c <= 17; c++) {
            const val5 = String(row5[c] || '').trim();
            const val4 = String(row4[c] || '').trim();
            let header = val5 || val4;
            if (
              header &&
              header !== '-' &&
              header.toUpperCase() !== 'ASPEK' &&
              header.toUpperCase() !== rawClass.toUpperCase() &&
              !/^\d+$/.test(header) &&
              !header.includes('Guru Mapel') &&
              !header.includes('Wedi')
            ) {
              taskHeaders[c] = header;
            }
          }

          // Locate student start row
          let studentStartRow = 5; // index 5 = row 6
          for (let r = 0; r < rows.length; r++) {
            if (String(rows[r]?.[0] || '').trim() === '1') {
              studentStartRow = r;
              break;
            }
          }

          const columns: DetectedColumnDetail[] = [];
          for (let c = 4; c <= 17; c++) {
            const colLetter = columnToLetter(c);
            let scoreCount = 0;
            const colGradesMap: { [attendanceNo: string]: number | null } = {};

            for (let r = studentStartRow; r < Math.min(rows.length, studentStartRow + 40); r++) {
              const row = rows[r] || [];
              const attNo = String(r - studentStartRow + 1);
              const cellVal = row[c];
              if (
                cellVal !== undefined &&
                cellVal !== null &&
                String(cellVal).trim() !== '' &&
                String(cellVal).trim() !== '-' &&
                String(cellVal).trim() !== '0'
              ) {
                const parsed = parseFloat(String(cellVal).replace(',', '.'));
                if (!isNaN(parsed)) {
                  colGradesMap[attNo] = parsed;
                  scoreCount++;
                } else {
                  colGradesMap[attNo] = null;
                }
              } else {
                colGradesMap[attNo] = null;
              }
            }

            const hasScores = scoreCount > 0;
            const isOccupied = !!taskHeaders[c] || hasScores;

            columns.push({
              colIdx: c,
              colLetter,
              headerTitle: taskHeaders[c] || (hasScores ? STANDARD_TASK_TITLES[colLetter] || '' : ''),
              hasScores,
              isOccupied,
              scoreCount,
              gradesMap: colGradesMap,
            });
          }

          const occupiedColumns = columns.filter((c) => c.isOccupied);
          const nextCol = columns.find((c) => !c.isOccupied) || {
            colIdx: 18,
            colLetter: 'S',
            headerTitle: '',
            hasScores: false,
            isOccupied: false,
            scoreCount: 0,
            gradesMap: {},
          };
          const lastOccupied = occupiedColumns[occupiedColumns.length - 1];

          return {
            success: true,
            className: rawClass,
            columns,
            occupiedColumns,
            nextAvailableColumn: nextCol.colLetter,
            nextTaskNumber: occupiedColumns.length + 1,
            lastTaskTitle: lastOccupied?.headerTitle || (lastOccupied ? `Tugas Kolom ${lastOccupied.colLetter}` : undefined),
          };
        }
      }
    } catch (apiErr) {
      console.warn('API detect columns failed, falling back to GViz:', apiErr);
    }
  }

  // 2. Fallback to GViz public endpoint
  try {
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(rawClass)}&_nc=${nocache}`;
    const res = await fetch(sheetUrl, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Gagal membaca sheet kelas ${rawClass}`);
    }

    const text = await res.text();
    const fb = text.indexOf('{');
    const lb = text.lastIndexOf('}');
    if (fb === -1 || lb === -1) {
      throw new Error('Data spreadsheet tidak valid.');
    }

    const gData = JSON.parse(text.substring(fb, lb + 1));
    const cols = gData?.table?.cols || [];
    const rawRows = gData?.table?.rows || [];

    // 1. Extract task titles from cols label and header rows
    const taskHeaders: { [colIdx: number]: string } = {};

    cols.forEach((col: any, idx: number) => {
      if (idx >= 4 && col && col.label) {
        let l = String(col.label).trim().replace(/^ASPEK\s*/i, '').trim();
        if (
          l &&
          l !== '-' &&
          l.toUpperCase() !== 'ASPEK' &&
          l.toUpperCase() !== rawClass.toUpperCase() &&
          !/^\d+$/.test(l) &&
          !l.includes('Guru Mapel') &&
          !l.includes('Wedi')
        ) {
          taskHeaders[idx] = l;
        }
      }
    });

    for (let rIdx = 0; rIdx < Math.min(6, rawRows.length); rIdx++) {
      const r = rawRows[rIdx];
      if (!r || !r.c) continue;
      const firstVal = r.c[0] ? String(r.c[0].v || '').trim() : '';
      const isStudentNum = !isNaN(parseInt(firstVal, 10)) && parseInt(firstVal, 10) >= 1 && parseInt(firstVal, 10) <= 50;
      if (!isStudentNum) {
        r.c.forEach((cell: any, cIdx: number) => {
          if (cIdx >= 4 && cell && cell.v) {
            let val = String(cell.v).trim().replace(/^ASPEK\s*/i, '').trim();
            if (
              val &&
              val !== '-' &&
              val.toUpperCase() !== 'ASPEK' &&
              val.toUpperCase() !== rawClass.toUpperCase() &&
              !/^\d+$/.test(val) &&
              !val.includes('Guru Mapel') &&
              !val.includes('Wedi')
            ) {
              if (!taskHeaders[cIdx] || val.length > taskHeaders[cIdx].length) {
                taskHeaders[cIdx] = val;
              }
            }
          }
        });
      }
    }

    // 2. Parse student rows
    const studentRows: { attNum: number; cells: any[]; colOffset: number }[] = [];
    for (const r of rawRows) {
      if (!r || !r.c) continue;
      let colOffset = 0;
      let attNum = parseInt(String(r.c[0]?.v || '').trim(), 10);

      if (isNaN(attNum) || attNum < 1 || attNum > 50) {
        const shifted = parseInt(String(r.c[1]?.v || '').trim(), 10);
        if (!isNaN(shifted) && shifted >= 1 && shifted <= 50) {
          attNum = shifted;
          colOffset = 1;
        }
      }

      if (!isNaN(attNum) && attNum >= 1 && attNum <= 50) {
        studentRows.push({ attNum, cells: r.c, colOffset });
      }
    }

    const columns: DetectedColumnDetail[] = [];

    // Scan aspect task columns E (idx 4) through R (idx 17)
    for (let c = 4; c <= 17; c++) {
      const colLetter = columnToLetter(c);
      let headerTitle = taskHeaders[c] || STANDARD_TASK_TITLES[colLetter] || '';
      if (
        headerTitle.toUpperCase() === 'ASPEK' ||
        headerTitle.toUpperCase() === rawClass.toUpperCase() ||
        /^\d+$/.test(headerTitle)
      ) {
        headerTitle = '';
      }

      let scoreCount = 0;
      const colGradesMap: { [attendanceNo: string]: number | null } = {};

      for (const s of studentRows) {
        const attNo = String(s.attNum);
        const cell = s.cells[c + s.colOffset];
        const v = cell ? cell.v : null;
        if (v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '-' && String(v).trim() !== '0') {
          const num = parseFloat(String(v).replace(',', '.'));
          if (!isNaN(num)) {
            colGradesMap[attNo] = num;
            scoreCount++;
          } else {
            colGradesMap[attNo] = null;
          }
        } else {
          colGradesMap[attNo] = null;
        }
      }

      const hasScores = scoreCount > 0;
      const isOccupied = !!taskHeaders[c] || hasScores;

      columns.push({
        colIdx: c,
        colLetter,
        headerTitle: taskHeaders[c] || (hasScores ? STANDARD_TASK_TITLES[colLetter] || '' : ''),
        hasScores,
        isOccupied,
        scoreCount,
        gradesMap: colGradesMap,
      });
    }

    const occupiedColumns = columns.filter((c) => c.isOccupied);
    const nextCol = columns.find((c) => !c.isOccupied) || {
      colIdx: 18,
      colLetter: 'S',
      headerTitle: '',
      hasScores: false,
      isOccupied: false,
      scoreCount: 0,
      gradesMap: {},
    };
    const lastOccupied = occupiedColumns[occupiedColumns.length - 1];

    return {
      success: true,
      className: rawClass,
      columns,
      occupiedColumns,
      nextAvailableColumn: nextCol.colLetter,
      nextTaskNumber: occupiedColumns.length + 1,
      lastTaskTitle: lastOccupied?.headerTitle || (lastOccupied ? `Tugas Kolom ${lastOccupied.colLetter}` : undefined),
    };
  } catch (err: any) {
    console.error('Error detecting class task columns:', err);
    return {
      success: false,
      className: rawClass,
      columns: [],
      occupiedColumns: [],
      nextAvailableColumn: 'E',
      nextTaskNumber: 1,
      message: err?.message || 'Gagal mendeteksi kolom spreadsheet.',
    };
  }
}

// -------------------------------------------------------------
// TUGAS PENGGANTI KKA 2 INTEGRATION
// Automatically ensures the 'Pengganti KKA 2' tab exists in Google Sheets
// and appends new student submissions directly into the spreadsheet.
// -------------------------------------------------------------

export const SUBSTITUTE_TASK_HEADERS = [
  'No',
  'Waktu Pengumpulan',
  'Nama Siswa',
  'Kelas',
  'No. Absen',
  'NIS / NIPD',
  'Link Video YouTube',
  'Catatan / Judul',
  'Status',
];

export async function syncSubstituteTaskToSheet(
  accessToken: string | null,
  spreadsheetId: string,
  submission: SubstituteTaskSubmission
): Promise<{
  success: boolean;
  isAuthError?: boolean;
  isPermissionError?: boolean;
  sheetCreated?: boolean;
  message: string;
}> {
  const targetSpreadsheetId = spreadsheetId || DEFAULT_SPREADSHEET_ID;

  if (!accessToken) {
    return {
      success: false,
      isAuthError: true,
      message: 'Token otentikasi Google belum tersedia. Login Google diperlukan untuk menulis ke spreadsheet.',
    };
  }

  try {
    // 1. Ensure 'Pengganti KKA 2' sheet exists (create if not found)
    const ensureResult = await ensureSheetExists(
      accessToken,
      targetSpreadsheetId,
      SUBSTITUTE_TASK_SHEET_NAME,
      SUBSTITUTE_TASK_HEADERS
    );

    if (ensureResult.isPermissionError) {
      return {
        success: false,
        isPermissionError: true,
        message: ensureResult.message || 'Izin Editor pada Spreadsheet diperlukan.',
      };
    }
    if (ensureResult.isAuthError) {
      return {
        success: false,
        isAuthError: true,
        message: ensureResult.message || 'Sesi login Google kedaluwarsa.',
      };
    }

    const resolvedTitle = ensureResult.resolvedTitle || SUBSTITUTE_TASK_SHEET_NAME;

    // 2. Query existing rows in sheet to calculate sequence number
    let nextIndex = 1;
    try {
      const getRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${targetSpreadsheetId}/values/${encodeURIComponent(resolvedTitle)}!A:A`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (getRes.ok) {
        const getData = await getRes.json();
        const existingValues = getData.values || [];
        // Subtract header row
        nextIndex = Math.max(1, existingValues.length);
      }
    } catch (e) {
      // ignore
    }

    // 3. Prepare row data
    const row = [
      nextIndex,
      submission.submittedAt,
      submission.studentName,
      submission.className,
      submission.attendanceNo,
      submission.nis || '-',
      submission.youtubeUrl,
      submission.notes || 'Tugas Pengganti KKA 2 - Algoritma & Flowchart Game Teka-Teki',
      submission.status || 'Terkirim',
    ];

    // 4. Append row to 'Pengganti KKA 2'
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${targetSpreadsheetId}/values/${encodeURIComponent(resolvedTitle)}!A:I:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [row],
        }),
      }
    );

    if (appendRes.ok) {
      return {
        success: true,
        sheetCreated: true,
        message: `Tugas Pengganti berhasil dikirim dan tersimpan di tab sheet '${resolvedTitle}' pada baris #${nextIndex}!`,
      };
    } else {
      const errText = await appendRes.text();
      const parsed = parseGoogleApiError(appendRes.status, errText, `menambahkan ke sheet '${resolvedTitle}'`);
      return {
        success: false,
        isAuthError: parsed.isAuthError,
        isPermissionError: parsed.isPermissionError,
        message: parsed.message,
      };
    }
  } catch (err: any) {
    console.error('Error syncing substitute task to sheet:', err);
    return {
      success: false,
      message: err.message || 'Terjadi kesalahan saat menyimpan ke spreadsheet.',
    };
  }
}

// Fetch submissions for substitute task from GViz or API
export async function loadSubstituteTaskSubmissions(
  spreadsheetId: string,
  accessToken?: string | null
): Promise<SubstituteTaskSubmission[]> {
  const targetSpreadsheetId = spreadsheetId || DEFAULT_SPREADSHEET_ID;
  const submissions: SubstituteTaskSubmission[] = [];

  // Helper to validate that a row is actually a substitute submission row (not a class grade row)
  const isValidSubstituteRow = (r: any[]) => {
    if (!r || r.length < 5) return false;
    const col2 = String(r[2] || '').trim(); // Student Name
    const col3 = String(r[3] || '').trim(); // Class (e.g. Kelas 8A or 8A)
    const col4 = String(r[4] || '').trim(); // Absen (1..32)
    const col6 = String(r[6] || '').trim(); // YouTube URL

    // If col2 is empty or header or 'L'/'P', it's not a substitute row
    if (!col2 || col2 === '-' || col2.toUpperCase() === 'L' || col2.toUpperCase() === 'P' || col2.toUpperCase().includes('NAMA')) {
      return false;
    }

    // Check if col6 contains youtube or video URL
    const hasYoutubeLink = /youtube\.com|youtu\.be/i.test(col6) || /youtube\.com|youtu\.be/i.test(String(r[5] || '')) || /youtube\.com|youtu\.be/i.test(String(r[7] || ''));
    const isClassPattern = /^(Kelas\s*)?[789][A-Ha-h]/i.test(col3) || /^(Kelas\s*)?[789][A-Ha-h]/i.test(col2);
    const hasValidAbsen = /^\d{1,2}$/.test(col4);

    return hasYoutubeLink || (isClassPattern && hasValidAbsen);
  };

  // Try API first if token is available
  if (accessToken) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${targetSpreadsheetId}/values/${encodeURIComponent(SUBSTITUTE_TASK_SHEET_NAME)}!A2:I500`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (res.ok) {
        const json = await res.json();
        const rows: any[][] = json.values || [];
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!isValidSubstituteRow(r)) continue;
          submissions.push({
            id: `sub-${i + 1}-${r[1] || Date.now()}`,
            submittedAt: String(r[1] || ''),
            studentName: String(r[2] || '').trim(),
            className: String(r[3] || '').trim(),
            attendanceNo: String(r[4] || '').trim(),
            nis: String(r[5] || '').trim(),
            youtubeUrl: String(r[6] || '').trim(),
            notes: String(r[7] || '').trim(),
            status: (r[8] as any) || 'Terkirim',
          });
        }
        if (submissions.length > 0) return submissions;
      }
    } catch (e) {
      console.warn('Failed to load substitute tasks via API:', e);
    }
  }

  // Fallback to GViz
  try {
    const rawRows = await fetchPublicGvizData(targetSpreadsheetId, [
      SUBSTITUTE_TASK_SHEET_NAME,
      'Tugas_Pengganti_KKA2',
      'Pengganti_KKA2',
      'Pengganti',
    ]);
    if (rawRows && rawRows.length > 1) {
      // Check if row 0 has headers like 'Pengganti' or 'Link Video' or 'Waktu'
      const firstRowStr = rawRows[0].join(' ').toLowerCase();
      const isLikelySubstituteSheet = firstRowStr.includes('video') || firstRowStr.includes('youtube') || firstRowStr.includes('pengganti') || firstRowStr.includes('catatan');

      if (isLikelySubstituteSheet) {
        for (let i = 1; i < rawRows.length; i++) {
          const r = rawRows[i];
          if (!isValidSubstituteRow(r)) continue;
          const studentName = String(r[2] || '').trim();
          submissions.push({
            id: `sub-gviz-${i}-${r[1] || Date.now()}`,
            submittedAt: formatGvizDate(r[1]),
            studentName,
            className: String(r[3] || '').trim(),
            attendanceNo: String(r[4] || '').trim(),
            nis: String(r[5] || '').trim(),
            youtubeUrl: String(r[6] || '').trim(),
            notes: String(r[7] || '').trim(),
            status: 'Terkirim',
          });
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch substitute tasks from GViz:', err);
  }

  return submissions;
}

// -------------------------------------------------------------
// LOAD STUDENTS MISSING COLUMN G (Tugas 2 - KKA - Algoritma Web)
// Fetches all classes (8A..8H) and filters students who have no grade in Column G.
// -------------------------------------------------------------
export async function loadStudentsMissingColumnG(
  spreadsheetId: string,
  accessToken?: string | null
): Promise<{
  allStudentsWithGradeStatus: StudentSubstituteTarget[];
  missingStudents: StudentSubstituteTarget[];
  totalChecked: number;
  totalMissing: number;
  totalSubmitted: number;
  totalUnsubmitted: number;
}> {
  const targetSpreadsheetId = spreadsheetId || DEFAULT_SPREADSHEET_ID;

  // 1. Fetch substitute task submissions (Sheet + LocalStorage)
  let sheetSubmissions: SubstituteTaskSubmission[] = [];
  try {
    sheetSubmissions = await loadSubstituteTaskSubmissions(targetSpreadsheetId, accessToken);
  } catch (e) {
    console.warn('Error loading substitute submissions:', e);
  }

  let localSubmissions: SubstituteTaskSubmission[] = [];
  try {
    const raw = localStorage.getItem('tugas_siswa_substitute_submissions_v1');
    if (raw) localSubmissions = JSON.parse(raw);
  } catch (e) {
    // ignore
  }

  // Build a lookup map of submissions by [CLASS_NORM + ATT_NO] and [CLASS_NORM + STUDENT_NAME]
  const subMap = new Map<string, SubstituteTaskSubmission>();
  const subNameMap = new Map<string, SubstituteTaskSubmission>();

  [...localSubmissions, ...sheetSubmissions].forEach((sub) => {
    if (!sub || !sub.studentName) return;
    const cleanClass = (sub.className || '').toUpperCase().replace(/^KELAS\s*/i, '').replace(/[^0-9A-Z]/g, '');
    const cleanAtt = String(sub.attendanceNo || '').trim();
    const cleanName = sub.studentName.toUpperCase().trim();

    if (cleanClass && cleanAtt) {
      subMap.set(`${cleanClass}_${cleanAtt}`, sub);
    }
    if (cleanClass && cleanName) {
      subNameMap.set(`${cleanClass}_${cleanName}`, sub);
    }
  });

  // 2. Fetch class sheets in parallel across 8A through 8H
  const allResults: StudentSubstituteTarget[] = [];

  const classFetchPromises = CLASS_SHEET_NAMES.map(async (rawClass) => {
    const cleanClassName = `Kelas ${rawClass}`;
    const normClass = rawClass.toUpperCase().replace(/[^0-9A-Z]/g, '');

    let classRows: any[][] | null = null;

    // Try API if token available
    if (accessToken) {
      try {
        const apiRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${targetSpreadsheetId}/values/${encodeURIComponent(rawClass)}!A1:Z45`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (apiRes.ok) {
          const json = await apiRes.json();
          classRows = json.values || null;
        }
      } catch (e) {
        // ignore
      }
    }

    // Try GViz fallback
    if (!classRows || classRows.length === 0) {
      classRows = await fetchPublicGvizData(targetSpreadsheetId, [rawClass, cleanClassName, `KELAS ${rawClass}`]);
    }

    // If sheet rows exist, parse each student and inspect Column G (Index 6)
    if (classRows && classRows.length > 0) {
      // Find row start index and column offset
      for (const row of classRows) {
        if (!row || row.length === 0) continue;
        let noVal = row[0];
        let nipdVal = row[1];
        let genderVal = row[2];
        let nameVal = row[3];
        let colOffset = 0;

        let noNum = parseInt(String(noVal).trim(), 10);
        if (isNaN(noNum) || noNum <= 0 || noNum > 32) {
          // Check shifted column (index 1)
          const shiftedNoNum = parseInt(String(row[1]).trim(), 10);
          if (!isNaN(shiftedNoNum) && shiftedNoNum > 0 && shiftedNoNum <= 32) {
            noVal = row[1];
            nipdVal = row[2];
            genderVal = row[3];
            nameVal = row[4];
            noNum = shiftedNoNum;
            colOffset = 1;
          } else {
            continue; // Header row or blank
          }
        }

        let cleanName = String(nameVal || '').trim();
        if (
          !cleanName ||
          cleanName.toUpperCase().includes('ASPEK') ||
          cleanName.toUpperCase().includes('NAMA') ||
          cleanName.toUpperCase().includes('DAFTAR') ||
          cleanName.toUpperCase() === 'L' ||
          cleanName.toUpperCase() === 'P'
        ) {
          // Recover from authentic 255 roster if header text
          const fallback = ALL_255_STUDENTS.find(
            (s) =>
              s.className.toUpperCase().replace(/^KELAS\s*/i, '').replace(/[^0-9A-Z]/g, '') === normClass &&
              s.attendanceNo === String(noNum)
          );
          if (fallback) {
            cleanName = fallback.name;
            nipdVal = fallback.nis;
            genderVal = fallback.gender || genderVal;
          } else {
            continue;
          }
        }

        const attNoStr = String(noNum);

        // Check Column G: Index 6 (A=0, B=1, C=2, D=3, E=4, F=5, G=6)
        const colGIndex = 6 + colOffset;
        const rawColGVal = row[colGIndex];

        let hasScore = false;
        let parsedScore: number | string | null = null;

        if (rawColGVal !== undefined && rawColGVal !== null) {
          const strG = String(rawColGVal).trim();
          if (strG !== '' && strG !== '-' && strG !== '0') {
            const numG = parseFloat(strG.replace(',', '.'));
            if (!isNaN(numG) && numG > 0) {
              hasScore = true;
              parsedScore = numG;
            } else if (strG.length > 0) {
              hasScore = true;
              parsedScore = strG;
            }
          }
        }

        // Match with substitute submission
        const matchedSub =
          subMap.get(`${normClass}_${attNoStr}`) ||
          subNameMap.get(`${normClass}_${cleanName.toUpperCase()}`) ||
          undefined;

        const hasSubmitted = !!matchedSub;

        return {
          id: `std-${rawClass.toLowerCase()}-${attNoStr}`,
          studentName: cleanName,
          className: cleanClassName,
          attendanceNo: attNoStr,
          nis: String(nipdVal || '').trim(),
          gender: String(genderVal || '').trim(),
          columnGScore: parsedScore,
          hasColumnGScore: hasScore,
          hasSubmittedSubstitute: hasSubmitted,
          substituteSubmission: matchedSub,
        };
      }
    }

    // Fallback: If class sheet couldn't be parsed, use ALL_255_STUDENTS for this class
    const fallbackClassStudents = ALL_255_STUDENTS.filter(
      (s) => s.className.toUpperCase().replace(/^KELAS\s*/i, '').replace(/[^0-9A-Z]/g, '') === normClass
    );

    return fallbackClassStudents.map((s) => {
      const attNoStr = String(s.attendanceNo || '');
      const matchedSub =
        subMap.get(`${normClass}_${attNoStr}`) ||
        subNameMap.get(`${normClass}_${s.name.toUpperCase()}`) ||
        undefined;

      return {
        id: `std-${rawClass.toLowerCase()}-${attNoStr}`,
        studentName: s.name,
        className: cleanClassName,
        attendanceNo: attNoStr,
        nis: s.nis,
        gender: s.gender,
        columnGScore: null,
        hasColumnGScore: false,
        hasSubmittedSubstitute: !!matchedSub,
        substituteSubmission: matchedSub,
      };
    });
  });

  const parsedBatches = await Promise.all(classFetchPromises);
  const flattened = parsedBatches.flat();

  // Sort by Class name then Attendance Number
  flattened.sort((a, b) => {
    if (a.className !== b.className) {
      return a.className.localeCompare(b.className);
    }
    const na = parseInt(a.attendanceNo || '0', 10);
    const nb = parseInt(b.attendanceNo || '0', 10);
    return na - nb;
  });

  const missingStudents = flattened.filter((s) => !s.hasColumnGScore);
  const totalSubmitted = missingStudents.filter((s) => s.hasSubmittedSubstitute).length;
  const totalUnsubmitted = missingStudents.filter((s) => !s.hasSubmittedSubstitute).length;

  return {
    allStudentsWithGradeStatus: flattened,
    missingStudents,
    totalChecked: flattened.length,
    totalMissing: missingStudents.length,
    totalSubmitted,
    totalUnsubmitted,
  };
}



