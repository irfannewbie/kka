import { ExcelCellData, ExcelSheetData } from '../types/excelLab';

// Convert column letters (A, B, ..., Z, AA, AB, ...) to 0-based index
export function colLetterToIndex(colStr: string): number {
  const clean = colStr.toUpperCase().trim();
  let index = 0;
  for (let i = 0; i < clean.length; i++) {
    index = index * 26 + (clean.charCodeAt(i) - 64);
  }
  return index - 1;
}

// Convert 0-based index to column letters (0 -> "A", 25 -> "Z", 26 -> "AA")
export function colIndexToLetter(index: number): string {
  let temp = index + 1;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

// Parse cell reference "B5" -> { col: 1, row: 4, colStr: "B", rowStr: "5" }
export function cellToCoords(cellRef: string): { col: number; row: number; colStr: string; rowStr: string } | null {
  const match = cellRef.toUpperCase().trim().match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const colStr = match[1];
  const rowStr = match[2];
  const col = colLetterToIndex(colStr);
  const row = parseInt(rowStr, 10) - 1;
  return { col, row, colStr, rowStr };
}

// Convert { col: 1, row: 4 } -> "B5"
export function coordsToCell(col: number, row: number): string {
  return `${colIndexToLetter(col)}${row + 1}`;
}

// Expand range "A1:B3" -> ["A1", "B1", "A2", "B2", "A3", "B3"]
export function expandRange(rangeStr: string): string[] {
  const parts = rangeStr.toUpperCase().trim().split(':');
  if (parts.length === 1) return [parts[0]];
  const start = cellToCoords(parts[0]);
  const end = cellToCoords(parts[1]);
  if (!start || !end) return [parts[0]];

  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  const cells: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      cells.push(coordsToCell(c, r));
    }
  }
  return cells;
}

// Helper to format evaluated value according to cell format type
export function formatCellValue(value: any, format?: string): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';

  const num = typeof value === 'number' ? value : parseFloat(String(value));
  const isNum = !isNaN(num) && typeof value !== 'string';

  if (!isNum || isNaN(num)) {
    return String(value);
  }

  if (format === 'currency') {
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
  }
  if (format === 'percent') {
    return `${(num * (num <= 1 && num >= -1 ? 100 : 1)).toFixed(1).replace('.', ',')}%`;
  }
  if (format === 'number') {
    return num % 1 !== 0
      ? num.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
      : num.toLocaleString('id-ID');
  }

  // Default general
  if (num % 1 !== 0) {
    const rounded = Math.round(num * 100) / 100;
    return String(rounded).replace('.', ',');
  }
  return String(num);
}

// Evaluate criterion for COUNTIF / SUMIF (e.g. ">75", "<=50", ">=75", "<>Lulus", "Tuntas", 75)
function evaluateCriterion(cellVal: any, criterion: string | number): boolean {
  if (criterion === null || criterion === undefined) return cellVal === null || cellVal === undefined;
  const critStr = String(criterion).trim();
  const numCell = typeof cellVal === 'number' ? cellVal : parseFloat(String(cellVal));
  const isCellNum = !isNaN(numCell);

  const matchOp = critStr.match(/^([><]=?|<>|=)(.*)$/);
  if (matchOp) {
    const op = matchOp[1];
    const targetStr = matchOp[2].trim();
    const targetNum = parseFloat(targetStr);
    const isTargetNum = !isNaN(targetNum);

    if (isCellNum && isTargetNum) {
      if (op === '>') return numCell > targetNum;
      if (op === '>=') return numCell >= targetNum;
      if (op === '<') return numCell < targetNum;
      if (op === '<=') return numCell <= targetNum;
      if (op === '<>') return numCell !== targetNum;
      if (op === '=') return numCell === targetNum;
    } else {
      const cStr = String(cellVal || '').toLowerCase();
      const tStr = targetStr.toLowerCase();
      if (op === '<>') return cStr !== tStr;
      if (op === '=') return cStr === tStr;
    }
  }

  // Exact comparison
  if (isCellNum && !isNaN(parseFloat(critStr))) {
    return numCell === parseFloat(critStr);
  }
  return String(cellVal || '').trim().toLowerCase() === critStr.toLowerCase();
}

// Split function arguments taking nested parentheses and quotes into account
function splitArguments(argsStr: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let inQuotes = false;
  let quoteChar = '';
  let current = '';

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    if ((char === '"' || char === "'") && (i === 0 || argsStr[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
      }
    }

    if (!inQuotes) {
      if (char === '(' || char === '[') depth++;
      else if (char === ')' || char === ']') depth--;
      else if ((char === ',' || char === ';') && depth === 0) {
        result.push(current.trim());
        current = '';
        continue;
      }
    }
    current += char;
  }

  if (current.trim().length > 0) {
    result.push(current.trim());
  }
  return result;
}

// Helper to parse date or time string into a Date object
function parseDateTime(val: any): Date | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const s = String(val).trim();

  // Pattern DD/MM/YYYY or DD-MM-YYYY (optional HH:MM:SS)
  const dmyMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    const d = new Date(year, month, day, hour, min, sec);
    if (!isNaN(d.getTime())) return d;
  }

  // Pattern YYYY-MM-DD (optional HH:MM:SS)
  const ymdMatch = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const hour = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
    const min = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
    const sec = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0;
    const d = new Date(year, month, day, hour, min, sec);
    if (!isNaN(d.getTime())) return d;
  }

  // Time-only string "HH:MM:SS" or "HH:MM"
  const timeMatch = s.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (timeMatch) {
    const now = new Date();
    const hour = parseInt(timeMatch[1], 10);
    const min = parseInt(timeMatch[2], 10);
    const sec = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, min, sec);
  }

  const standard = new Date(s);
  if (!isNaN(standard.getTime())) return standard;

  return null;
}

// Core Formula Evaluator
export function evaluateFormula(
  formula: string,
  sheet: ExcelSheetData,
  visitingCells: Set<string> = new Set()
): any {
  if (!formula || typeof formula !== 'string') return formula;
  const trimmed = formula.trim();

  // If not starting with '=', return parsed number or literal
  if (!trimmed.startsWith('=')) {
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return parseFloat(trimmed);
    }
    return trimmed;
  }

  const expr = trimmed.substring(1).trim();

  // Helper to get raw cell computed value
  const getCellValue = (ref: string): any => {
    const cleanRef = ref.toUpperCase().trim();
    if (visitingCells.has(cleanRef)) {
      throw new Error('#CIRCULAR!');
    }
    const cell = sheet.cells[cleanRef];
    if (!cell) return 0;
    if (cell.raw && cell.raw.startsWith('=')) {
      const nextVisiting = new Set(visitingCells);
      nextVisiting.add(cleanRef);
      return evaluateFormula(cell.raw, sheet, nextVisiting);
    }
    if (cell.computed !== undefined && cell.computed !== null) {
      return cell.computed;
    }
    if (/^-?\d+(\.\d+)?$/.test(cell.raw)) {
      return parseFloat(cell.raw);
    }
    return cell.raw ?? 0;
  };

  // Helper to extract values from range or single cell or array
  const resolveValues = (token: string): any[] => {
    const cleanToken = token.trim();
    if (cleanToken.includes(':')) {
      const rangeCells = expandRange(cleanToken);
      return rangeCells.map((c) => getCellValue(c));
    }
    if (/^[A-Za-z]+\d+$/.test(cleanToken)) {
      return [getCellValue(cleanToken)];
    }
    const evaluated = evaluateExpression(cleanToken);
    return [evaluated];
  };

  // Evaluate Expression helper
  function evaluateExpression(subExpr: string): any {
    const s = subExpr.trim();
    if (!s) return '';

    // Handle quoted string literal
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }

    // Handle matched outer parentheses, e.g. ((A1+B1)) or (A1+B1)
    if (s.startsWith('(') && s.endsWith(')')) {
      let depth = 0;
      let matched = false;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') depth++;
        else if (s[i] === ')') depth--;
        if (depth === 0 && i === s.length - 1) matched = true;
        if (depth === 0 && i < s.length - 1) break;
      }
      if (matched) {
        return evaluateExpression(s.slice(1, -1));
      }
    }

    // Handle trailing percentage operator, e.g. 20% or (B2*10)%
    if (s.endsWith('%')) {
      const inner = evaluateExpression(s.slice(0, -1));
      const n = parseFloat(inner);
      if (!isNaN(n)) return n / 100;
    }

    // Function call detection: NAME(...)
    const funcMatch = s.match(/^([A-Za-z_]+)\((.*)\)$/s);
    if (funcMatch) {
      const funcName = funcMatch[1].toUpperCase();
      const rawArgs = funcMatch[2];
      const args = splitArguments(rawArgs);

      switch (funcName) {
        case 'SUM': {
          let total = 0;
          args.forEach((arg) => {
            const vals = resolveValues(arg);
            vals.forEach((v) => {
              const n = parseFloat(v);
              if (!isNaN(n)) total += n;
            });
          });
          return total;
        }

        case 'AVERAGE': {
          let total = 0;
          let count = 0;
          args.forEach((arg) => {
            const vals = resolveValues(arg);
            vals.forEach((v) => {
              const n = parseFloat(v);
              if (!isNaN(n)) {
                total += n;
                count++;
              }
            });
          });
          return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
        }

        case 'MIN': {
          let minVal: number | null = null;
          args.forEach((arg) => {
            const vals = resolveValues(arg);
            vals.forEach((v) => {
              const n = parseFloat(v);
              if (!isNaN(n)) {
                if (minVal === null || n < minVal) minVal = n;
              }
            });
          });
          return minVal !== null ? minVal : 0;
        }

        case 'MAX': {
          let maxVal: number | null = null;
          args.forEach((arg) => {
            const vals = resolveValues(arg);
            vals.forEach((v) => {
              const n = parseFloat(v);
              if (!isNaN(n)) {
                if (maxVal === null || n > maxVal) maxVal = n;
              }
            });
          });
          return maxVal !== null ? maxVal : 0;
        }

        case 'MEDIAN': {
          const numbers: number[] = [];
          args.forEach((arg) => {
            const vals = resolveValues(arg);
            vals.forEach((v) => {
              const n = parseFloat(v);
              if (!isNaN(n)) numbers.push(n);
            });
          });
          if (numbers.length === 0) return 0;
          numbers.sort((a, b) => a - b);
          const mid = Math.floor(numbers.length / 2);
          if (numbers.length % 2 !== 0) {
            return numbers[mid];
          } else {
            return Math.round(((numbers[mid - 1] + numbers[mid]) / 2) * 100) / 100;
          }
        }

        case 'LARGE': {
          if (args.length < 2) return '#VALUE!';
          const vals = resolveValues(args[0]);
          const k = parseInt(evaluateExpression(args[1]), 10);
          const numbers: number[] = [];
          vals.forEach((v) => {
            const n = parseFloat(v);
            if (!isNaN(n)) numbers.push(n);
          });
          if (isNaN(k) || k < 1 || k > numbers.length) return '#NUM!';
          numbers.sort((a, b) => b - a);
          return numbers[k - 1];
        }

        case 'SMALL': {
          if (args.length < 2) return '#VALUE!';
          const vals = resolveValues(args[0]);
          const k = parseInt(evaluateExpression(args[1]), 10);
          const numbers: number[] = [];
          vals.forEach((v) => {
            const n = parseFloat(v);
            if (!isNaN(n)) numbers.push(n);
          });
          if (isNaN(k) || k < 1 || k > numbers.length) return '#NUM!';
          numbers.sort((a, b) => a - b);
          return numbers[k - 1];
        }

        case 'COUNT': {
          let count = 0;
          args.forEach((arg) => {
            const vals = resolveValues(arg);
            vals.forEach((v) => {
              if (v !== '' && v !== null && !isNaN(parseFloat(v))) count++;
            });
          });
          return count;
        }

        case 'COUNTA': {
          let count = 0;
          args.forEach((arg) => {
            const vals = resolveValues(arg);
            vals.forEach((v) => {
              if (v !== '' && v !== null && v !== undefined) count++;
            });
          });
          return count;
        }

        case 'COUNTIF': {
          if (args.length < 2) return 0;
          const rangeCells = expandRange(args[0]);
          const criterion = evaluateExpression(args[1]);
          let matchCount = 0;
          rangeCells.forEach((c) => {
            const val = getCellValue(c);
            if (evaluateCriterion(val, criterion)) matchCount++;
          });
          return matchCount;
        }

        case 'SUMIF': {
          if (args.length < 2) return 0;
          const rangeCells = expandRange(args[0]);
          const criterion = evaluateExpression(args[1]);
          const sumCells = args[2] ? expandRange(args[2]) : rangeCells;

          let sumTotal = 0;
          rangeCells.forEach((c, idx) => {
            const condVal = getCellValue(c);
            if (evaluateCriterion(condVal, criterion)) {
              const targetCell = sumCells[idx] || c;
              const n = parseFloat(getCellValue(targetCell));
              if (!isNaN(n)) sumTotal += n;
            }
          });
          return sumTotal;
        }

        case 'IF': {
          if (args.length < 2) return '#VALUE!';
          const condition = evaluateExpression(args[0]);
          const isTrue = condition === true || (typeof condition === 'number' && condition !== 0) || String(condition).toUpperCase() === 'TRUE';
          if (isTrue) {
            return evaluateExpression(args[1]);
          } else {
            return args.length >= 3 ? evaluateExpression(args[2]) : false;
          }
        }

        case 'AND': {
          if (args.length === 0) return true;
          return args.every((arg) => {
            const res = evaluateExpression(arg);
            return res === true || (typeof res === 'number' && res !== 0) || String(res).toUpperCase() === 'TRUE';
          });
        }

        case 'OR': {
          if (args.length === 0) return false;
          return args.some((arg) => {
            const res = evaluateExpression(arg);
            return res === true || (typeof res === 'number' && res !== 0) || String(res).toUpperCase() === 'TRUE';
          });
        }

        case 'NOT': {
          if (args.length === 0) return true;
          const res = evaluateExpression(args[0]);
          const bool = res === true || (typeof res === 'number' && res !== 0) || String(res).toUpperCase() === 'TRUE';
          return !bool;
        }

        case 'VLOOKUP': {
          // VLOOKUP(lookup_value, table_array, col_index, [range_lookup])
          if (args.length < 3) return '#N/A';
          const lookupVal = evaluateExpression(args[0]);
          const tableParts = args[1].toUpperCase().split(':');
          if (tableParts.length !== 2) return '#REF!';
          const start = cellToCoords(tableParts[0]);
          const end = cellToCoords(tableParts[1]);
          if (!start || !end) return '#REF!';

          const colOffset = parseInt(evaluateExpression(args[2]), 10) - 1;
          const exactMatch = args.length >= 4 ? !evaluateExpression(args[3]) : true;

          const minRow = Math.min(start.row, end.row);
          const maxRow = Math.max(start.row, end.row);
          const firstCol = Math.min(start.col, end.col);
          const targetCol = firstCol + colOffset;

          const lStr = String(lookupVal).trim().toLowerCase();

          for (let r = minRow; r <= maxRow; r++) {
            const keyVal = getCellValue(coordsToCell(firstCol, r));
            const kStr = String(keyVal).trim().toLowerCase();
            const isMatch = exactMatch ? kStr === lStr : kStr.startsWith(lStr);
            if (isMatch) {
              return getCellValue(coordsToCell(targetCol, r));
            }
          }
          return '#N/A';
        }

        case 'HLOOKUP': {
          // HLOOKUP(lookup_value, table_array, row_index, [range_lookup])
          if (args.length < 3) return '#N/A';
          const lookupVal = evaluateExpression(args[0]);
          const tableParts = args[1].toUpperCase().split(':');
          if (tableParts.length !== 2) return '#REF!';
          const start = cellToCoords(tableParts[0]);
          const end = cellToCoords(tableParts[1]);
          if (!start || !end) return '#REF!';

          const rowOffset = parseInt(evaluateExpression(args[2]), 10) - 1;
          const minCol = Math.min(start.col, end.col);
          const maxCol = Math.max(start.col, end.col);
          const firstRow = Math.min(start.row, end.row);
          const targetRow = firstRow + rowOffset;

          const lStr = String(lookupVal).trim().toLowerCase();

          for (let c = minCol; c <= maxCol; c++) {
            const keyVal = getCellValue(coordsToCell(c, firstRow));
            const kStr = String(keyVal).trim().toLowerCase();
            if (kStr === lStr) {
              return getCellValue(coordsToCell(c, targetRow));
            }
          }
          return '#N/A';
        }

        case 'CONCATENATE':
        case 'CONCAT': {
          let textRes = '';
          args.forEach((arg) => {
            textRes += String(evaluateExpression(arg) ?? '');
          });
          return textRes;
        }

        case 'LEFT': {
          if (args.length === 0) return '';
          const str = String(evaluateExpression(args[0]) ?? '');
          const count = args.length > 1 ? parseInt(evaluateExpression(args[1]), 10) : 1;
          return str.slice(0, Math.max(0, count));
        }

        case 'RIGHT': {
          if (args.length === 0) return '';
          const str = String(evaluateExpression(args[0]) ?? '');
          const count = args.length > 1 ? parseInt(evaluateExpression(args[1]), 10) : 1;
          return str.slice(Math.max(0, str.length - count));
        }

        case 'MID': {
          if (args.length < 3) return '';
          const str = String(evaluateExpression(args[0]) ?? '');
          const start = Math.max(0, parseInt(evaluateExpression(args[1]), 10) - 1);
          const count = parseInt(evaluateExpression(args[2]), 10);
          return str.slice(start, start + count);
        }

        case 'LEN': {
          return String(evaluateExpression(args[0]) ?? '').length;
        }

        case 'UPPER': {
          return String(evaluateExpression(args[0]) ?? '').toUpperCase();
        }

        case 'LOWER': {
          return String(evaluateExpression(args[0]) ?? '').toLowerCase();
        }

        case 'PROPER': {
          if (args.length === 0) return '';
          const str = String(evaluateExpression(args[0]) ?? '').toLowerCase();
          return str.replace(/\b\w/g, (c) => c.toUpperCase());
        }

        case 'FIND': {
          if (args.length < 2) return '#VALUE!';
          const findText = String(evaluateExpression(args[0]) ?? '');
          const withinText = String(evaluateExpression(args[1]) ?? '');
          const startNum = args.length >= 3 ? Math.max(1, parseInt(evaluateExpression(args[2]), 10)) : 1;
          const idx = withinText.indexOf(findText, startNum - 1);
          if (idx === -1) return '#VALUE!';
          return idx + 1;
        }

        case 'SUBTITUTE':
        case 'SUBSTITUTE': {
          if (args.length < 3) return '#VALUE!';
          const text = String(evaluateExpression(args[0]) ?? '');
          const oldText = String(evaluateExpression(args[1]) ?? '');
          const newText = String(evaluateExpression(args[2]) ?? '');
          if (args.length >= 4) {
            const instanceNum = parseInt(evaluateExpression(args[3]), 10);
            if (isNaN(instanceNum) || instanceNum <= 0) return text;
            let current = 0;
            let pos = 0;
            while ((pos = text.indexOf(oldText, pos)) !== -1) {
              current++;
              if (current === instanceNum) {
                return text.slice(0, pos) + newText + text.slice(pos + oldText.length);
              }
              pos += oldText.length;
            }
            return text;
          }
          return text.split(oldText).join(newText);
        }

        case 'TRIM': {
          return String(evaluateExpression(args[0]) ?? '').trim().replace(/\s+/g, ' ');
        }

        case 'ROUND': {
          const num = parseFloat(evaluateExpression(args[0]));
          const dec = args.length > 1 ? parseInt(evaluateExpression(args[1]), 10) : 0;
          if (isNaN(num)) return '#VALUE!';
          const factor = Math.pow(10, dec);
          return Math.round(num * factor) / factor;
        }

        case 'ROUNDUP': {
          const num = parseFloat(evaluateExpression(args[0]));
          const dec = args.length > 1 ? parseInt(evaluateExpression(args[1]), 10) : 0;
          if (isNaN(num)) return '#VALUE!';
          const factor = Math.pow(10, dec);
          return Math.ceil(num * factor) / factor;
        }

        case 'ROUNDDOWN': {
          const num = parseFloat(evaluateExpression(args[0]));
          const dec = args.length > 1 ? parseInt(evaluateExpression(args[1]), 10) : 0;
          if (isNaN(num)) return '#VALUE!';
          const factor = Math.pow(10, dec);
          return Math.floor(num * factor) / factor;
        }

        case 'TODAY': {
          const now = new Date();
          const d = String(now.getDate()).padStart(2, '0');
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const y = now.getFullYear();
          return `${d}/${m}/${y}`;
        }

        case 'NOW': {
          const now = new Date();
          const d = String(now.getDate()).padStart(2, '0');
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const y = now.getFullYear();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          const ss = String(now.getSeconds()).padStart(2, '0');
          return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
        }

        case 'DATE': {
          if (args.length < 3) return '#VALUE!';
          const y = parseInt(evaluateExpression(args[0]), 10);
          const m = parseInt(evaluateExpression(args[1]), 10);
          const d = parseInt(evaluateExpression(args[2]), 10);
          if (isNaN(y) || isNaN(m) || isNaN(d)) return '#VALUE!';
          return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
        }

        case 'TIME': {
          if (args.length < 3) return '#VALUE!';
          const hh = parseInt(evaluateExpression(args[0]), 10);
          const mm = parseInt(evaluateExpression(args[1]), 10);
          const ss = parseInt(evaluateExpression(args[2]), 10);
          if (isNaN(hh) || isNaN(mm) || isNaN(ss)) return '#VALUE!';
          return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
        }

        case 'YEAR': {
          if (args.length === 0) return '#VALUE!';
          const val = evaluateExpression(args[0]);
          const dt = parseDateTime(val);
          return dt ? dt.getFullYear() : '#VALUE!';
        }

        case 'MONTH': {
          if (args.length === 0) return '#VALUE!';
          const val = evaluateExpression(args[0]);
          const dt = parseDateTime(val);
          return dt ? dt.getMonth() + 1 : '#VALUE!';
        }

        case 'DAY': {
          if (args.length === 0) return '#VALUE!';
          const val = evaluateExpression(args[0]);
          const dt = parseDateTime(val);
          return dt ? dt.getDate() : '#VALUE!';
        }

        case 'HOUR': {
          if (args.length === 0) return '#VALUE!';
          const val = evaluateExpression(args[0]);
          const dt = parseDateTime(val);
          return dt ? dt.getHours() : '#VALUE!';
        }

        case 'MINUTE': {
          if (args.length === 0) return '#VALUE!';
          const val = evaluateExpression(args[0]);
          const dt = parseDateTime(val);
          return dt ? dt.getMinutes() : '#VALUE!';
        }

        case 'SECOND': {
          if (args.length === 0) return '#VALUE!';
          const val = evaluateExpression(args[0]);
          const dt = parseDateTime(val);
          return dt ? dt.getSeconds() : '#VALUE!';
        }

        default:
          return `#NAME? (${funcName})`;
      }
    }

    // Binary comparison operators: =, <>, <=, >=, <, >
    // Only check outside quotes/parentheses
    const compOps = ['<>', '<=', '>=', '=', '<', '>'];
    for (const op of compOps) {
      const idx = findOperatorOutside(s, op);
      if (idx > 0) {
        const left = evaluateExpression(s.slice(0, idx));
        const right = evaluateExpression(s.slice(idx + op.length));
        return evaluateBinaryOp(left, op, right);
      }
    }

    // String Concatenation operator: &
    const ampIdx = findOperatorOutside(s, '&');
    if (ampIdx > 0) {
      const left = evaluateExpression(s.slice(0, ampIdx));
      const right = evaluateExpression(s.slice(ampIdx + 1));
      return `${left ?? ''}${right ?? ''}`;
    }

    // Addition / Subtraction: +, -
    const addSubIdx = findLastOperatorOutside(s, ['+', '-']);
    if (addSubIdx > 0) {
      const op = s[addSubIdx];
      const left = evaluateExpression(s.slice(0, addSubIdx));
      const right = evaluateExpression(s.slice(addSubIdx + 1));
      const n1 = parseFloat(left);
      const n2 = parseFloat(right);
      if (isNaN(n1) || isNaN(n2)) return '#VALUE!';
      return op === '+' ? n1 + n2 : n1 - n2;
    }

    // Multiplication / Division: *, /
    const mulDivIdx = findLastOperatorOutside(s, ['*', '/']);
    if (mulDivIdx > 0) {
      const op = s[mulDivIdx];
      const left = evaluateExpression(s.slice(0, mulDivIdx));
      const right = evaluateExpression(s.slice(mulDivIdx + 1));
      const n1 = parseFloat(left);
      const n2 = parseFloat(right);
      if (isNaN(n1) || isNaN(n2)) return '#VALUE!';
      if (op === '/' && n2 === 0) return '#DIV/0!';
      return op === '*' ? n1 * n2 : n1 / n2;
    }

    // Power: ^
    const powIdx = findOperatorOutside(s, '^');
    if (powIdx > 0) {
      const left = evaluateExpression(s.slice(0, powIdx));
      const right = evaluateExpression(s.slice(powIdx + 1));
      const n1 = parseFloat(left);
      const n2 = parseFloat(right);
      if (isNaN(n1) || isNaN(n2)) return '#VALUE!';
      return Math.pow(n1, n2);
    }

    // Single Cell Reference: B4
    if (/^[A-Za-z]+\d+$/.test(s)) {
      return getCellValue(s);
    }

    // Numeric Literal
    if (/^-?\d+(\.\d+)?$/.test(s)) {
      return parseFloat(s);
    }

    return s;
  }

  try {
    return evaluateExpression(expr);
  } catch (err: any) {
    return err?.message || '#ERROR!';
  }
}

// Find operator outside parens and quotes
function findOperatorOutside(str: string, op: string): number {
  let depth = 0;
  let inQuotes = false;
  for (let i = 0; i <= str.length - op.length; i++) {
    const char = str[i];
    if (char === '"' || char === "'") inQuotes = !inQuotes;
    if (!inQuotes) {
      if (char === '(' || char === '[') depth++;
      else if (char === ')' || char === ']') depth--;
      else if (depth === 0 && str.substring(i, i + op.length) === op) {
        return i;
      }
    }
  }
  return -1;
}

// Find last operator outside (for left-to-right math precedence)
function findLastOperatorOutside(str: string, ops: string[]): number {
  let depth = 0;
  let inQuotes = false;
  for (let i = str.length - 1; i >= 0; i--) {
    const char = str[i];
    if (char === '"' || char === "'") inQuotes = !inQuotes;
    if (!inQuotes) {
      if (char === ')' || char === ']') depth++;
      else if (char === '(' || char === '[') depth--;
      else if (depth === 0 && ops.includes(char)) {
        // Ensure not a unary negative at start or after another operator
        if (char === '-' && (i === 0 || /[-+*/^&([=]\s*$/.test(str.slice(0, i)))) {
          continue;
        }
        return i;
      }
    }
  }
  return -1;
}

function evaluateBinaryOp(left: any, op: string, right: any): boolean {
  const n1 = typeof left === 'number' ? left : parseFloat(String(left));
  const n2 = typeof right === 'number' ? right : parseFloat(String(right));
  const bothNum = !isNaN(n1) && !isNaN(n2);

  if (bothNum) {
    if (op === '=') return n1 === n2;
    if (op === '<>') return n1 !== n2;
    if (op === '>') return n1 > n2;
    if (op === '>=') return n1 >= n2;
    if (op === '<') return n1 < n2;
    if (op === '<=') return n1 <= n2;
  }

  const s1 = String(left ?? '').toLowerCase();
  const s2 = String(right ?? '').toLowerCase();
  if (op === '=') return s1 === s2;
  if (op === '<>') return s1 !== s2;
  if (op === '>') return s1 > s2;
  if (op === '>=') return s1 >= s2;
  if (op === '<') return s1 < s2;
  if (op === '<=') return s1 <= s2;
  return false;
}

// Recompute all cells in sheet, updating their .computed property
export function recomputeSheet(sheet: ExcelSheetData): ExcelSheetData {
  const newCells: Record<string, ExcelCellData> = {};
  const cellRefs = Object.keys(sheet.cells);

  // First pass: copy and evaluate non-formulas
  cellRefs.forEach((ref) => {
    const cell = sheet.cells[ref];
    if (!cell) return;
    if (!cell.raw.startsWith('=')) {
      newCells[ref] = {
        ...cell,
        computed: /^-?\d+(\.\d+)?$/.test(cell.raw.trim()) ? parseFloat(cell.raw.trim()) : cell.raw,
      };
    }
  });

  // Second pass: evaluate formulas
  const tempSheet: ExcelSheetData = {
    ...sheet,
    cells: { ...sheet.cells, ...newCells },
  };

  cellRefs.forEach((ref) => {
    const cell = sheet.cells[ref];
    if (!cell) return;
    if (cell.raw.startsWith('=')) {
      try {
        const computedVal = evaluateFormula(cell.raw, tempSheet);
        const isErr = typeof computedVal === 'string' && computedVal.startsWith('#');
        newCells[ref] = {
          ...cell,
          computed: computedVal,
          isError: isErr,
          errorMessage: isErr ? computedVal : undefined,
        };
      } catch (err: any) {
        newCells[ref] = {
          ...cell,
          computed: '#ERROR!',
          isError: true,
          errorMessage: err?.message || 'Error formula',
        };
      }
    }
  });

  return {
    ...sheet,
    cells: newCells,
  };
}
