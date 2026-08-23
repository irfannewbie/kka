import { Student, TaskSubmission } from '../types';
import { ALL_255_STUDENTS } from '../data/students255';
import { clearAuthToken } from './firebaseAuth';

export const DEFAULT_SPREADSHEET_ID = '1JgBhQhZujQp_pTk1jO4oZIY8Er1Y4NcF0CTKFrRVgI4';
export const DEFAULT_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit?usp=sharing`;

const SHEET_NAMES = {
  TASKS: 'Tugas_Siswa',
  STUDENTS: 'Data_Siswa',
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

// Helper to ensure target sheet exists
export async function ensureSheetExists(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  headers: string[]
): Promise<boolean> {
  if (!accessToken) return false;
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (metaRes.status === 401) {
      clearAuthToken();
      return false;
    }

    if (!metaRes.ok) {
      console.warn(`Failed to fetch spreadsheet metadata (status ${metaRes.status})`);
      return false;
    }

    const meta = await metaRes.json();
    const existingSheets = meta.sheets || [];
    const sheetExists = existingSheets.some(
      (s: any) => s.properties?.title?.toLowerCase() === sheetTitle.toLowerCase()
    );

    if (!sheetExists) {
      // 1. Add sheet
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
                    gridProperties: { rowCount: 1000, columnCount: 20 },
                  },
                },
              },
            ],
          }),
        }
      );

      if (addRes.status === 401) {
        clearAuthToken();
        return false;
      }

      if (!addRes.ok) {
        console.warn('Failed to add sheet via batchUpdate:', await addRes.text());
      }

      // 2. Set headers
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:${String.fromCharCode(64 + headers.length)}1?valueInputOption=USER_ENTERED`,
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
    }
    return true;
  } catch (err) {
    console.warn(`Error ensuring sheet ${sheetTitle} exists:`, err);
    return false;
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
  for (const sheetName of sheetNamesToTry) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      const res = await fetch(url);
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
): Promise<{ success: boolean; isAuthError?: boolean; message: string }> {
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

    // Ensure Tugas_Siswa sheet tab exists
    await ensureSheetExists(accessToken, spreadsheetId, SHEET_NAMES.TASKS, taskHeaders);

    const row = [
      task.id,
      task.submittedAt,
      task.studentName,
      task.group,
      task.taskTitle,
      task.descriptionOrLink,
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAMES.TASKS)}!A:F:append?valueInputOption=USER_ENTERED`,
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

    if (res.status === 401) {
      clearAuthToken();
      return {
        success: false,
        isAuthError: true,
        message: 'Sesi akun Google Anda telah kedaluwarsa. Silakan login kembali dengan akun Google.',
      };
    }

    if (res.ok) {
      return {
        success: true,
        message: `Karya "${task.taskTitle}" berhasil ditambahkan ke tab '${SHEET_NAMES.TASKS}' di Google Spreadsheet!`,
      };
    } else {
      const errText = await res.text();
      return {
        success: false,
        message: `Gagal menyimpan ke Google Spreadsheet (${res.status}): ${errText}`,
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
): Promise<{ success: boolean; isAuthError?: boolean; count: number; message: string }> {
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

    await ensureSheetExists(accessToken, spreadsheetId, SHEET_NAMES.TASKS, headers);

    const rows = tasks.map((t) => [
      t.id,
      t.submittedAt,
      t.studentName,
      t.group,
      t.taskTitle,
      t.descriptionOrLink,
    ]);

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAMES.TASKS)}!A1:F${rows.length + 1}?valueInputOption=USER_ENTERED`,
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

    if (res.status === 401) {
      clearAuthToken();
      return {
        success: false,
        isAuthError: true,
        count: 0,
        message: 'Sesi akun Google Anda telah kedaluwarsa. Silakan login kembali.',
      };
    }

    if (res.ok) {
      return {
        success: true,
        count: tasks.length,
        message: `Berhasil menyinkronkan ${tasks.length} data karya ke tab '${SHEET_NAMES.TASKS}' di Google Spreadsheet!`,
      };
    } else {
      const errText = await res.text();
      return {
        success: false,
        count: 0,
        message: `Gagal memperbarui Google Spreadsheet (${res.status}): ${errText}`,
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
): Promise<{ success: boolean; isAuthError?: boolean; count: number; message: string }> {
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

    await ensureSheetExists(accessToken, spreadsheetId, SHEET_NAMES.STUDENTS, headers);

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
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAMES.STUDENTS)}!A1:H${rows.length + 1}?valueInputOption=USER_ENTERED`,
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

    if (res.status === 401) {
      clearAuthToken();
      return {
        success: false,
        isAuthError: true,
        count: 0,
        message: 'Sesi akun Google Anda telah kedaluwarsa. Silakan login kembali.',
      };
    }

    if (res.ok) {
      return {
        success: true,
        count: students.length,
        message: `Berhasil menyinkronkan ${students.length} data siswa ke tab '${SHEET_NAMES.STUDENTS}' di Google Spreadsheet!`,
      };
    } else {
      const errText = await res.text();
      return {
        success: false,
        count: 0,
        message: `Gagal memperbarui Google Spreadsheet: ${errText}`,
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
  studentGrades: StudentGradeItem[]
): Promise<{ success: boolean; isAuthError?: boolean; columnLetter?: string; message: string }> {
  if (!accessToken) {
    return {
      success: false,
      isAuthError: true,
      message: 'Silakan hubungkan akun Google Anda untuk menyinkronkan data nilai.',
    };
  }

  try {
    const rawClass = className.replace(/^Kelas\s*/i, '').trim(); // e.g. '8A' or '7B'
    
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
      return {
        success: false,
        message: `Gagal membaca spreadsheet: status ${metaRes.status}`,
      };
    }

    const meta = await metaRes.json();
    const sheetsList = meta.sheets || [];
    
    // Look for sheet matching '8A', 'Kelas 8A', or '8a'
    let targetSheet = sheetsList.find(
      (s: any) =>
        s.properties?.title?.toLowerCase() === rawClass.toLowerCase() ||
        s.properties?.title?.toLowerCase() === `kelas ${rawClass.toLowerCase()}`
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

      if (addRes.ok) {
        const addData = await addRes.json();
        sheetId = addData.replies?.[0]?.addSheet?.properties?.sheetId ?? null;
      }
    }

    // 2. Fetch existing rows to determine header row and columns
    const fetchRange = `${encodeURIComponent(sheetTitle)}!A1:Z50`;
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
    }

    // Determine header row index (default Row 5 / 0-indexed 4)
    let headerRowIndex = 4; // Row 5
    if (existingRows.length > 0) {
      // Find row containing 'NO' / 'NAMA' / 'NIPD' / 'ASPEK'
      const foundIdx = existingRows.findIndex((r) =>
        r.some((c: any) => /NAMA|NIPD|NIS|ASPEK|NILAI/i.test(String(c)))
      );
      if (foundIdx !== -1) {
        headerRowIndex = foundIdx;
      }
    }

    const headerRow = existingRows[headerRowIndex] || [];
    
    // Check if taskTitle already exists in header row (from col E / index 4 onwards)
    let targetColIdx = -1;
    for (let c = 4; c < headerRow.length; c++) {
      if (String(headerRow[c] || '').trim().toLowerCase() === taskTitle.trim().toLowerCase()) {
        targetColIdx = c;
        break;
      }
    }

    // If not found, place in first empty column after standard columns (at least Col E / index 4)
    if (targetColIdx === -1) {
      targetColIdx = Math.max(4, headerRow.length);
    }

    const targetColLetter = columnToLetter(targetColIdx);
    const startRowNumber = headerRowIndex + 1; // 1-indexed header row

    // Prepare values to write:
    // Header at header row
    // Student scores starting from startRowNumber + 1 (e.g. Row 6 for Absen 1, Row 7 for Absen 2, etc.)
    const sortedGrades = [...studentGrades].sort((a, b) => {
      const na = parseInt(a.attendanceNo || '0', 10);
      const nb = parseInt(b.attendanceNo || '0', 10);
      return na - nb;
    });

    const columnValues: (string | number)[][] = [[taskTitle]];
    for (const sg of sortedGrades) {
      columnValues.push([sg.score !== null && sg.score !== undefined ? sg.score : '']);
    }

    // Write column values
    const endRowNumber = startRowNumber + columnValues.length - 1;
    const writeRange = `${encodeURIComponent(sheetTitle)}!${targetColLetter}${startRowNumber}:${targetColLetter}${endRowNumber}`;

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
      return {
        success: false,
        message: `Gagal memperbarui sel nilai (${updateRes.status}): ${errText}`,
      };
    }

    // Auto-resize column width if sheetId is known
    if (sheetId !== null && sheetId !== undefined) {
      try {
        await fetch(
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
                  autoResizeDimensions: {
                    dimensions: {
                      sheetId: sheetId,
                      dimension: 'COLUMNS',
                      startIndex: targetColIdx,
                      endIndex: targetColIdx + 1,
                    },
                  },
                },
              ],
            }),
          }
        );
      } catch (resizeErr) {
        // Auto-resize is optional enhancement, non-blocking
      }
    }

    return {
      success: true,
      columnLetter: targetColLetter,
      message: `Berhasil menyinkronkan nilai "${taskTitle}" ke sheet '${sheetTitle}' pada Kolom ${targetColLetter}!`,
    };
  } catch (err: any) {
    console.error('Error syncing grades to class sheet:', err);
    return {
      success: false,
      message: `Error koneksi Google Sheets: ${err.message || err}`,
    };
  }
}

