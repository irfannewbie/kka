import { describe, expect, it } from 'vitest';
import {
  colIndexToLetter,
  colLetterToIndex,
  coordsToCell,
  evaluateFormula,
  expandRange,
  cellToCoords,
  formatCellValue,
  recomputeSheet,
} from './excelFormulaEngine';
import type { ExcelSheetData } from '../types/excelLab';

/** Sheet kosong sederhana untuk tes. */
function makeSheet(cells: Record<string, { raw: string }>): ExcelSheetData {
  const fullCells: ExcelSheetData['cells'] = {};
  for (const [ref, cell] of Object.entries(cells)) {
    fullCells[ref] = { raw: cell.raw };
  }
  return { id: 's1', name: 'Sheet1', cells: fullCells, rowCount: 50, colCount: 26 };
}

describe('konversi kolom huruf <-> indeks', () => {
  it('A=0, Z=25, AA=26', () => {
    expect(colLetterToIndex('A')).toBe(0);
    expect(colLetterToIndex('Z')).toBe(25);
    expect(colLetterToIndex('AA')).toBe(26);
    expect(colLetterToIndex('a')).toBe(0); // case-insensitive
  });

  it('konversi balik identik', () => {
    expect(colIndexToLetter(0)).toBe('A');
    expect(colIndexToLetter(25)).toBe('Z');
    expect(colIndexToLetter(26)).toBe('AA');
    // roundtrip
    for (const col of ['A', 'M', 'Z', 'AA', 'AZ', 'BA']) {
      expect(colIndexToLetter(colLetterToIndex(col))).toBe(col);
    }
  });
});

describe('cellToCoords / coordsToCell', () => {
  it('parse referensi sel', () => {
    expect(cellToCoords('B5')).toEqual({ col: 1, row: 4, colStr: 'B', rowStr: '5' });
    expect(cellToCoords('b5')).toEqual({ col: 1, row: 4, colStr: 'B', rowStr: '5' });
  });

  it('menolak referensi tidak valid', () => {
    expect(cellToCoords('5B')).toBeNull();
    expect(cellToCoords('B')).toBeNull();
    expect(cellToCoords('')).toBeNull();
  });

  it('coordsToCell adalah invers cellToCoords', () => {
    expect(coordsToCell(1, 4)).toBe('B5');
    expect(coordsToCell(0, 0)).toBe('A1');
  });
});

describe('expandRange', () => {
  it('melebarkan rentang 2D', () => {
    expect(expandRange('A1:B3')).toEqual(['A1', 'B1', 'A2', 'B2', 'A3', 'B3']);
  });

  it('menangani rentang terbalik (end < start)', () => {
    expect(expandRange('B3:A1')).toEqual(['A1', 'B1', 'A2', 'B2', 'A3', 'B3']);
  });

  it('sel tunggal dikembalikan apa adanya', () => {
    expect(expandRange('C4')).toEqual(['C4']);
  });
});

describe('formatCellValue', () => {
  it('nilai kosong menjadi string kosong', () => {
    expect(formatCellValue(null)).toBe('');
    expect(formatCellValue(undefined)).toBe('');
    expect(formatCellValue('')).toBe('');
  });

  it('boolean menjadi TRUE/FALSE', () => {
    expect(formatCellValue(true)).toBe('TRUE');
    expect(formatCellValue(false)).toBe('FALSE');
  });

  it('format persen mengalikan 1 untuk desimal', () => {
    expect(formatCellValue(0.75, 'percent')).toBe('75,0%');
  });

  it('format rupiah membulatkan', () => {
    expect(formatCellValue(150000.4, 'currency')).toBe('Rp 150.000');
  });

  it('teks dikembalikan apa adanya', () => {
    expect(formatCellValue('Lulus')).toBe('Lulus');
  });
});

describe('evaluateFormula', () => {
  it('literal non-rumus diparse', () => {
    expect(evaluateFormula('123', makeSheet({}))).toBe(123);
    expect(evaluateFormula('abc', makeSheet({}))).toBe('abc');
  });

  it('SUM di atas literal', () => {
    expect(evaluateFormula('=SUM(1,2,3)', makeSheet({}))).toBe(6);
  });

  it('SUM di atas referensi sel', () => {
    const sheet = makeSheet({ A1: { raw: '10' }, A2: { raw: '20' }, A3: { raw: '30' } });
    expect(evaluateFormula('=SUM(A1:A3)', sheet)).toBe(60);
    expect(evaluateFormula('=SUM(A1,A3)', sheet)).toBe(40);
  });

  it('AVERAGE membulatkan 2 desimal', () => {
    const sheet = makeSheet({ A1: { raw: '10' }, A2: { raw: '20' }, A3: { raw: '4' } });
    expect(evaluateFormula('=AVERAGE(A1:A3)', sheet)).toBe(11.33);
  });

  it('COUNTIF dengan kriteria operator', () => {
    const sheet = makeSheet({ A1: { raw: '80' }, A2: { raw: '60' }, A3: { raw: '90' } });
    expect(evaluateFormula('=COUNTIF(A1:A3,">75")', sheet)).toBe(2);
  });

  it('aritmatika sederhana', () => {
    expect(evaluateFormula('=2+3*4', makeSheet({}))).toBe(14);
    expect(evaluateFormula('=(2+3)*4', makeSheet({}))).toBe(20);
  });

  it('referensi siklus menghasilkan #CIRCULAR!', () => {
    const sheet = makeSheet({ A1: { raw: '=A2' }, A2: { raw: '=A1' } });
    // Level atas mengembalikan string error, tidak melempar
    expect(evaluateFormula('=A1', sheet)).toBe('#CIRCULAR!');
  });
});

describe('recomputeSheet', () => {
  it('mengisi computed untuk sel literal dan rumus', () => {
    const sheet = makeSheet({ A1: { raw: '5' }, A2: { raw: '7' }, B1: { raw: '=SUM(A1:A2)' } });
    const result = recomputeSheet(sheet);

    expect(result.cells.A1.computed).toBe(5);
    expect(result.cells.A2.computed).toBe(7);
    expect(result.cells.B1.computed).toBe(12);
    expect(result.cells.B1.isError).toBeFalsy();
  });

  it('rumus rusak ditandai isError tanpa melempar', () => {
    const sheet = makeSheet({ A1: { raw: '=TIDAK_ADA_FUNGSI(1)' } });
    const result = recomputeSheet(sheet);
    expect(result.cells.A1.isError).toBe(true);
    expect(typeof result.cells.A1.computed).toBe('string');
  });

  it('tidak memutasi sheet asli', () => {
    const sheet = makeSheet({ A1: { raw: '5' } });
    recomputeSheet(sheet);
    expect(sheet.cells.A1.computed).toBeUndefined();
  });
});
