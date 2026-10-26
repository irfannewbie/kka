import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export const DEFAULT_SPREADSHEET_ID = '1JgBhQhZujQp_pTk1jO4oZIY8Er1Y4NcF0CTKFrRVgI4';
export const CALCULATOR_BREAKDOWN_SHEET_NAME = 'Rincian_Kalkulator';
export const CALCULATOR_BREAKDOWN_HEADERS = [
  'KODE_DATA',
  'KELAS',
  'MATA_PELAJARAN',
  'JENIS_ASESMEN',
  'NO_ABSEN',
  'NIPD',
  'NAMA_SISWA',
  'BENAR_PG',
  'BENAR_MENJODOHKAN',
  'SKOR_URAIAN',
  'TOTAL_NILAI',
  'NILAI_REMEDIAL',
  'WAKTU_UPDATE',
] as const;

interface QuizSubmissionForSheet {
  quizId: string;
  quizTitle?: string;
  className: string;
  subject?: string;
  assessment?: string;
  attendanceNo: number;
  studentName: string;
  calcBenarPG?: number | null;
  calcBenarMJ?: number | null;
  calcSkorUraian?: number | null;
  remedialScore?: number | null;
  finalScore?: number;
  isRemedial?: boolean;
}

function getServiceAccountAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !privateKey) {
    return null;
  }

  // Handle escaped newlines if passed via env
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // If base64 encoded
  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    try {
      const decoded = Buffer.from(privateKey, 'base64').toString('utf8');
      if (decoded.includes('BEGIN PRIVATE KEY')) {
        privateKey = decoded;
      }
    } catch {
      // ignore
    }
  }

  const jwtClient = new JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return jwtClient;
}

function getKodeData(className: string, subject: string, assessment: string) {
  const subjectCode = subject?.toLowerCase().includes('koding') ? 'KKA' : 'INF';
  const asmCode = assessment?.toLowerCase().includes('genap') ? 'GN' : 'GS';
  const cls = className.replace(/\s+/g, '').toUpperCase();
  return `${subjectCode}-${cls}-${asmCode}`;
}

function sanitizeNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return n;
}

export async function syncQuizSubmissionToGoogleSheet(submission: QuizSubmissionForSheet): Promise<{
  success: boolean;
  message: string;
}> {
  const auth = getServiceAccountAuth();
  if (!auth) {
    return { success: false, message: 'Service account belum dikonfigurasi (GOOGLE_SERVICE_ACCOUNT_EMAIL/PRIVATE_KEY)' };
  }

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    // Get sheet metadata
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = meta.data.sheets || [];
    let sheetTitle = CALCULATOR_BREAKDOWN_SHEET_NAME;

    const exists = sheetsList.find(
      (s) =>
        String(s.properties?.title || '').replace(/[\s_]/g, '').toLowerCase() ===
        CALCULATOR_BREAKDOWN_SHEET_NAME.replace(/[\s_]/g, '').toLowerCase()
    );

    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: sheetTitle },
              },
            },
          ],
        },
      });
    } else if (exists.properties?.title) {
      sheetTitle = exists.properties.title;
    }

    // Ensure headers
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A1:M1`,
    });
    const headerRow = headerRes.data.values?.[0] || [];

    const headersMatch =
      headerRow.length === CALCULATOR_BREAKDOWN_HEADERS.length &&
      CALCULATOR_BREAKDOWN_HEADERS.every((h, i) => headerRow[i] === h);

    if (!headersMatch) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A1:M1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [CALCULATOR_BREAKDOWN_HEADERS as unknown as string[]],
        },
      });
    }

    // Read all data
    const dataRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A2:M`,
    });
    const rows = dataRes.data.values || [];

    const className = submission.className;
    const subject = submission.subject || 'Informatika';
    const assessment = submission.assessment || 'ASTS Gasal';
    const kodeData = getKodeData(className, subject, assessment);
    const absen = sanitizeNumber(submission.attendanceNo);
    const nipd = '';
    const nama = submission.studentName || '';

    const pg = sanitizeNumber(submission.calcBenarPG);
    const mj = sanitizeNumber(submission.calcBenarMJ);
    const uraian = sanitizeNumber(submission.calcSkorUraian);
    const pgScore = Math.min(50, pg * 2);
    const mjScore = Math.min(25, mj * 2.5);
    const total = submission.isRemedial
      ? Math.min(100, Math.max(pgScore + mjScore + uraian, sanitizeNumber(submission.remedialScore)))
      : Math.min(100, Math.round(pgScore + mjScore + uraian));
    const remedial = submission.isRemedial ? sanitizeNumber(submission.remedialScore ?? total) : 0;
    const waktu = new Date().toLocaleString('id-ID');

    const newRow = [
      kodeData,
      className,
      subject,
      assessment,
      absen,
      nipd,
      nama,
      pg,
      mj,
      uraian,
      total,
      remedial,
      waktu,
    ];

    // Find existing row by KODE_DATA + NO_ABSEN
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      if (String(r[0] || '').toUpperCase() === kodeData.toUpperCase() && sanitizeNumber(r[4]) === absen) {
        rowIndex = i + 2; // 1-based + header
        break;
      }
    }

    if (rowIndex === -1) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetTitle}!A:M`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [newRow],
        },
      });
    } else {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A${rowIndex}:M${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [newRow],
        },
      });
    }

    return { success: true, message: `Tersinkron ke Google Sheet ${sheetTitle}` };
  } catch (err) {
    console.error('Auto-sync quiz to Google Sheet error:', err);
    return { success: false, message: err instanceof Error ? err.message : 'Gagal sync ke Google Sheet' };
  }
}
