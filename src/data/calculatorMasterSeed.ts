export interface SeedModeARecord {
  benarPG: number | null;
  benarMJ: number | null;
  skorUraian: number | null;
  remedialScore: number | null;
  isManual?: boolean;
}

// Data awal Kalkulator Master yang telah diinput oleh Guru (tetap dapat diedit kapan saja di Kalkulator Akademik)
export const INITIAL_CALCULATOR_MASTER_SEED: Record<
  string,
  Record<string, SeedModeARecord>
> = {
  KELAS_8C_INFORMATIKA_ASTS_GASAL: {
    '1': { benarPG: 21, benarMJ: 10, skorUraian: 15, remedialScore: null, isManual: true },
    '2': { benarPG: 23, benarMJ: 10, skorUraian: 22, remedialScore: null, isManual: true },
    '3': { benarPG: 14, benarMJ: 9, skorUraian: 21, remedialScore: null, isManual: true },
    '4': { benarPG: 17, benarMJ: 10, skorUraian: 22, remedialScore: null, isManual: true },
    '5': { benarPG: 6, benarMJ: 0, skorUraian: 15, remedialScore: null, isManual: true },
    '6': { benarPG: 14, benarMJ: 10, skorUraian: 17, remedialScore: null, isManual: true },
    '7': { benarPG: 9, benarMJ: 10, skorUraian: 24, remedialScore: null, isManual: true },
    '8': { benarPG: 21, benarMJ: 9, skorUraian: 21, remedialScore: null, isManual: true },
    '9': { benarPG: 24, benarMJ: 10, skorUraian: 12, remedialScore: null, isManual: true },
    '10': { benarPG: 11, benarMJ: 4, skorUraian: 15, remedialScore: null, isManual: true },
  },
};
