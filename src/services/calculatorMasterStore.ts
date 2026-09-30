import { INITIAL_CALCULATOR_MASTER_SEED, SeedModeARecord } from '../data/calculatorMasterSeed';

export interface MasterModeARecord {
  benarPG: number | null;
  benarMJ: number | null;
  skorUraian: number | null;
  remedialScore: number | null;
  isManual?: boolean;
}

export interface MasterModeBRecord {
  rerataUH: number | null;
  nilaiASTS: number | null;
  nilaiASAS: number | null;
  isManual?: boolean;
}

export interface StoredCalculatorDataset {
  modeAData: Record<string, MasterModeARecord>;
  modeBData: Record<string, MasterModeBRecord>;
  standarData: Record<string, number | null>;
  updatedAt: string;
}

export const CALC_STORAGE_PREFIX = 'smpn1wedi_calc_permanent_v2';

export function getDatasetShortKey(
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

export function getFullStorageKey(
  className: string,
  subject: string = 'Informatika',
  assessment: string = 'ASTS Gasal'
): string {
  return `${CALC_STORAGE_PREFIX}_${getDatasetShortKey(className, subject, assessment)}`;
}

// Hanya simpan/gunakan record Mode A yang benar-benar diinput di Kalkulator Master (isManual === true)
// agar hasil dekomposisi otomatis lama (seperti 11, 10, 0) dibuang dan tidak menimpa data asli
export function sanitizeManualModeAData(
  rawModeA?: Record<string, MasterModeARecord> | null,
  seedMap?: Record<string, SeedModeARecord>
): Record<string, MasterModeARecord> {
  const result: Record<string, MasterModeARecord> = {};

  // 1. Masukkan data seed awal terlebih dahulu
  if (seedMap) {
    Object.entries(seedMap).forEach(([attNo, rec]) => {
      result[String(parseInt(attNo, 10))] = {
        benarPG: rec.benarPG,
        benarMJ: rec.benarMJ,
        skorUraian: rec.skorUraian,
        remedialScore: rec.remedialScore,
        isManual: true,
      };
    });
  }

  // 2. Timpa dengan data manual dari Kalkulator Master
  if (rawModeA && typeof rawModeA === 'object') {
    Object.entries(rawModeA).forEach(([attNo, rec]) => {
      if (!rec || typeof rec !== 'object') return;
      // Hanya ambil data yang diinput manual di Kalkulator Master (isManual === true)
      if (!rec.isManual) return;
      const hasVal =
        rec.benarPG !== null ||
        rec.benarMJ !== null ||
        rec.skorUraian !== null ||
        rec.remedialScore !== null;
      if (hasVal) {
        const cleanAtt = String(parseInt(attNo, 10) || attNo);
        result[cleanAtt] = {
          benarPG: rec.benarPG ?? null,
          benarMJ: rec.benarMJ ?? null,
          skorUraian: rec.skorUraian ?? null,
          remedialScore: rec.remedialScore ?? null,
          isManual: true,
        };
      }
    });
  }

  return result;
}

// Baca dataset Kalkulator Master dari localStorage + Seed
export function loadLocalCalculatorDataset(
  className: string,
  subject: string = 'Informatika',
  assessment: string = 'ASTS Gasal'
): StoredCalculatorDataset {
  const shortKey = getDatasetShortKey(className, subject, assessment);
  const fullKey = `${CALC_STORAGE_PREFIX}_${shortKey}`;
  const seedForKey = INITIAL_CALCULATOR_MASTER_SEED[shortKey];

  let parsed: any = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw) parsed = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  const sanitizedModeA = sanitizeManualModeAData(parsed?.modeAData, seedForKey);

  return {
    modeAData: sanitizedModeA,
    modeBData: parsed?.modeBData || {},
    standarData: parsed?.standarData || {},
    updatedAt: parsed?.updatedAt || '',
  };
}

// Simpan dataset Kalkulator Master ke localStorage DAN sinkronkan ke server (/api/calculator-master)
export function saveCalculatorDatasetEverywhere(
  className: string,
  subject: string,
  assessment: string,
  data: {
    modeAData: Record<string, MasterModeARecord>;
    modeBData: Record<string, MasterModeBRecord>;
    standarData: Record<string, number | null>;
  }
): string {
  const shortKey = getDatasetShortKey(className, subject, assessment);
  const fullKey = `${CALC_STORAGE_PREFIX}_${shortKey}`;
  const seedForKey = INITIAL_CALCULATOR_MASTER_SEED[shortKey];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const cleanModeA = sanitizeManualModeAData(data.modeAData, seedForKey);

  const payload: StoredCalculatorDataset = {
    modeAData: cleanModeA,
    modeBData: data.modeBData || {},
    standarData: data.standarData || {},
    updatedAt: timeStr,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(fullKey, JSON.stringify(payload));
    } catch {
      // ignore
    }

    // Kirim secara asynchronous ke server agar tab lain (/cek, ais-dev, ais-pre, HP siswa) langsung mendapat data terbaru
    fetch('/api/calculator-master', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetKey: shortKey,
        dataset: payload,
      }),
    }).catch(() => {
      // ignore if offline
    });
  }

  return timeStr;
}

export function getAllLocalCalculatorDatasets(): Record<string, StoredCalculatorDataset> {
  const localBulk: Record<string, StoredCalculatorDataset> = {};

  // 1. Masukkan data seed awal terlebih dahulu
  Object.entries(INITIAL_CALCULATOR_MASTER_SEED).forEach(([shortKey, seedMap]) => {
    localBulk[shortKey] = {
      modeAData: sanitizeManualModeAData(null, seedMap),
      modeBData: {},
      standarData: {},
      updatedAt: '',
    };
  });

  // 2. Kumpulkan seluruh data manual yang ada di localStorage browser ini
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`${CALC_STORAGE_PREFIX}_`)) {
          const shortKey = k.replace(`${CALC_STORAGE_PREFIX}_`, '');
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            const cleanA = sanitizeManualModeAData(
              parsed?.modeAData,
              INITIAL_CALCULATOR_MASTER_SEED[shortKey]
            );
            if (
              Object.keys(cleanA).length > 0 ||
              Object.keys(parsed?.modeBData || {}).length > 0 ||
              Object.keys(parsed?.standarData || {}).length > 0
            ) {
              localBulk[shortKey] = {
                modeAData: {
                  ...(localBulk[shortKey]?.modeAData || {}),
                  ...cleanA,
                },
                modeBData: parsed?.modeBData || {},
                standarData: parsed?.standarData || {},
                updatedAt: parsed?.updatedAt || '',
              };
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return localBulk;
}

// Gabungkan data rincian dari Google Sheet khusus (Rincian_Kalkulator) ke dalam localStorage & Server
export function mergeSheetBreakdownsIntoLocalStore(
  sheetDatasets: Record<string, Record<string, MasterModeARecord>>,
  preferSheet: boolean = false
): void {
  if (typeof window === 'undefined' || !sheetDatasets) return;

  const bulkToSync: Record<string, StoredCalculatorDataset> = {};

  Object.entries(sheetDatasets).forEach(([shortKey, sheetModeAMap]) => {
    if (!sheetModeAMap || Object.keys(sheetModeAMap).length === 0) return;
    const fullKey = `${CALC_STORAGE_PREFIX}_${shortKey}`;
    let existing: StoredCalculatorDataset = {
      modeAData: sanitizeManualModeAData(null, INITIAL_CALCULATOR_MASTER_SEED[shortKey]),
      modeBData: {},
      standarData: {},
      updatedAt: '',
    };

    try {
      const raw = localStorage.getItem(fullKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        existing = {
          modeAData: sanitizeManualModeAData(
            parsed?.modeAData,
            INITIAL_CALCULATOR_MASTER_SEED[shortKey]
          ),
          modeBData: parsed?.modeBData || {},
          standarData: parsed?.standarData || {},
          updatedAt: parsed?.updatedAt || '',
        };
      }
    } catch {
      // ignore
    }

    const mergedModeA: Record<string, MasterModeARecord> = preferSheet
      ? { ...existing.modeAData, ...sheetModeAMap }
      : { ...sheetModeAMap, ...existing.modeAData };

    const updated: StoredCalculatorDataset = {
      ...existing,
      modeAData: mergedModeA,
      updatedAt: existing.updatedAt || new Date().toLocaleTimeString('id-ID'),
    };

    try {
      localStorage.setItem(fullKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
    bulkToSync[shortKey] = updated;
  });

  if (Object.keys(bulkToSync).length > 0) {
    fetch('/api/calculator-master/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasets: bulkToSync }),
    }).catch(() => {
      // ignore
    });
  }
}

// Tarik seluruh data Kalkulator Master dari server & sinkronkan dengan localStorage browser
export async function syncAllCalculatorMasterWithServer(): Promise<
  Record<string, StoredCalculatorDataset>
> {
  const localBulk = getAllLocalCalculatorDatasets();

  try {
    const res = await fetch('/api/calculator-master/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasets: localBulk }),
    });
    if (res.ok) {
      const json = await res.json();
      const serverDatasets: Record<string, StoredCalculatorDataset> = json.datasets || {};
      const mergedResult: Record<string, StoredCalculatorDataset> = { ...localBulk };

      // Simpan kembali gabungan data server + lokal ke localStorage tanpa pernah menghapus input lokal terbaru
      if (typeof window !== 'undefined') {
        Object.entries(serverDatasets).forEach(([shortKey, ds]) => {
          const currentLocal = getAllLocalCalculatorDatasets()[shortKey];
          const mergedModeA: Record<string, MasterModeARecord> = {
            ...(ds?.modeAData || {}),
            ...(currentLocal?.modeAData || {}),
          };
          const mergedDs: StoredCalculatorDataset = {
            modeAData: mergedModeA,
            modeBData: {
              ...(ds?.modeBData || {}),
              ...(currentLocal?.modeBData || {}),
            },
            standarData: {
              ...(ds?.standarData || {}),
              ...(currentLocal?.standarData || {}),
            },
            updatedAt: currentLocal?.updatedAt || ds?.updatedAt || '',
          };
          mergedResult[shortKey] = mergedDs;
          try {
            localStorage.setItem(`${CALC_STORAGE_PREFIX}_${shortKey}`, JSON.stringify(mergedDs));
          } catch {
            // ignore
          }
        });
      }
      return mergedResult;
    }
  } catch {
    // ignore network error
  }

  return localBulk;
}

// Ambil data Mode A seorang siswa untuk kelas tertentu langsung dari Kalkulator Master (Server + LocalStorage + Seed)
export async function fetchStudentMasterCalculatorRecord(
  className: string,
  attendanceNo: string,
  subject: string = 'Informatika',
  assessment: string = 'ASTS Gasal'
): Promise<MasterModeARecord | null> {
  const shortKey = getDatasetShortKey(className, subject, assessment);
  const attKey = String(parseInt(attendanceNo, 10) || attendanceNo);

  // 1. Cek server + sinkronkan localStorage terlebih dahulu agar selalu mendapat data Kalkulator Master terbaru
  const allDatasets = await syncAllCalculatorMasterWithServer();
  const dsFromServer = allDatasets[shortKey];
  if (dsFromServer?.modeAData?.[attKey]) {
    const rec = dsFromServer.modeAData[attKey];
    if (rec.benarPG !== null || rec.benarMJ !== null || rec.skorUraian !== null) {
      return rec;
    }
  }

  // 2. Fallback ke pembacaan localStorage + seed langsung
  const localDs = loadLocalCalculatorDataset(className, subject, assessment);
  const localRec = localDs.modeAData?.[attKey];
  if (
    localRec &&
    (localRec.benarPG !== null || localRec.benarMJ !== null || localRec.skorUraian !== null)
  ) {
    return localRec;
  }

  return null;
}
