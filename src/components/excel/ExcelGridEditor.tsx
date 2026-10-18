import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Download,
  Upload,
  Plus,
  Trash2,
  Undo2,
  Redo2,
  Sparkles,
  Percent,
  DollarSign,
  Hash,
  Palette,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ExcelCellData,
  ExcelSheetData,
  ExcelWorkbookData,
  CellFormatType,
  CellAlignment,
} from '../../types/excelLab';
import {
  colIndexToLetter,
  colLetterToIndex,
  cellToCoords,
  coordsToCell,
  recomputeSheet,
  formatCellValue,
  expandRange,
} from '../../services/excelFormulaEngine';
import { exportWorkbookToXlsx, importXlsxToWorkbook, createBlankSheet } from '../../services/excelLabStore';


interface ExcelGridEditorProps {
  workbook: ExcelWorkbookData;
  onChange: (updatedWorkbook: ExcelWorkbookData) => void;
  isReadOnly?: boolean;
  highlightCells?: Record<string, string>; // cellRef -> border or bg highlight class (e.g. target evaluation cells)
  onCellFocus?: (cellRef: string) => void;
  titleBarRightAction?: React.ReactNode;
}

export const ExcelGridEditor: React.FC<ExcelGridEditorProps> = ({
  workbook,
  onChange,
  isReadOnly = false,
  highlightCells = {},
  onCellFocus,
  titleBarRightAction,
}) => {
  // Current active sheet
  const activeSheet = useMemo(() => {
    return (
      workbook.sheets.find((s) => s.id === workbook.activeSheetId) ||
      workbook.sheets[0]
    );
  }, [workbook]);

  // Selected cell & range
  const [selectedCellRef, setSelectedCellRef] = useState<string>('A1');
  const [selectedRangeEnd, setSelectedRangeEnd] = useState<string | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editInputValue, setEditInputValue] = useState<string>('');

  // Undo / Redo history stack
  const [historyStack, setHistoryStack] = useState<ExcelWorkbookData[]>([]);
  const [redoStack, setRedoStack] = useState<ExcelWorkbookData[]>([]);

  // Input refs
  const formulaInputRef = useRef<HTMLInputElement>(null);
  const cellInputRef = useRef<HTMLInputElement>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  const activeCellData: ExcelCellData | undefined = activeSheet?.cells[selectedCellRef];

  // Keep formula bar in sync with selected cell
  useEffect(() => {
    if (!isEditing) {
      setEditInputValue(activeCellData?.raw || '');
    }
    onCellFocus?.(selectedCellRef);
  }, [selectedCellRef, activeSheet, isEditing]);

  // Push state to undo stack
  const pushHistory = (currentWb: ExcelWorkbookData) => {
    setHistoryStack((prev) => [currentWb, ...prev.slice(0, 19)]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0 || isReadOnly) return;
    const prev = historyStack[0];
    setHistoryStack((old) => old.slice(1));
    setRedoStack((old) => [workbook, ...old]);
    onChange(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || isReadOnly) return;
    const next = redoStack[0];
    setRedoStack((old) => old.slice(1));
    setHistoryStack((old) => [workbook, ...old]);
    onChange(next);
  };

  // Commit value change for a specific cell
  const commitCellValue = (targetRef: string, newRaw: string) => {
    if (isReadOnly || !activeSheet) return;
    pushHistory(workbook);

    const updatedCells = { ...activeSheet.cells };
    if (!newRaw || newRaw.trim() === '') {
      delete updatedCells[targetRef];
    } else {
      updatedCells[targetRef] = {
        ...(updatedCells[targetRef] || {}),
        raw: newRaw,
      };
    }

    const updatedSheet = recomputeSheet({
      ...activeSheet,
      cells: updatedCells,
    });

    const updatedSheets = workbook.sheets.map((s) =>
      s.id === updatedSheet.id ? updatedSheet : s
    );

    onChange({
      ...workbook,
      sheets: updatedSheets,
      lastModified: new Date().toLocaleString('id-ID'),
    });
  };

  // Update cell styling (format, bold, italic, alignment, bg)
  const updateCellStyle = (updates: Partial<ExcelCellData>) => {
    if (isReadOnly || !activeSheet) return;
    pushHistory(workbook);

    const targetCells = selectedRangeEnd
      ? expandRange(`${selectedCellRef}:${selectedRangeEnd}`)
      : [selectedCellRef];

    const updatedCells = { ...activeSheet.cells };
    targetCells.forEach((ref) => {
      const existing = updatedCells[ref] || { raw: '' };
      updatedCells[ref] = {
        ...existing,
        ...updates,
      };
    });

    const updatedSheet = {
      ...activeSheet,
      cells: updatedCells,
    };

    const updatedSheets = workbook.sheets.map((s) =>
      s.id === updatedSheet.id ? updatedSheet : s
    );

    onChange({
      ...workbook,
      sheets: updatedSheets,
    });
  };

  // Add Row
  const handleAddRow = () => {
    if (isReadOnly || !activeSheet) return;
    pushHistory(workbook);
    const updatedSheet = {
      ...activeSheet,
      rowCount: activeSheet.rowCount + 5,
    };
    const updatedSheets = workbook.sheets.map((s) =>
      s.id === updatedSheet.id ? updatedSheet : s
    );
    onChange({ ...workbook, sheets: updatedSheets });
  };

  // Add Column
  const handleAddCol = () => {
    if (isReadOnly || !activeSheet) return;
    pushHistory(workbook);
    const updatedSheet = {
      ...activeSheet,
      colCount: Math.min(26, activeSheet.colCount + 3),
    };
    const updatedSheets = workbook.sheets.map((s) =>
      s.id === updatedSheet.id ? updatedSheet : s
    );
    onChange({ ...workbook, sheets: updatedSheets });
  };

  // Sheet Tabs Management
  const handleAddSheet = () => {
    if (isReadOnly) return;
    pushHistory(workbook);
    const count = workbook.sheets.length + 1;
    const newSheet = recomputeSheet(createBlankSheet(`sheet-${Date.now()}`, `Sheet${count}`));
    onChange({
      ...workbook,
      sheets: [...workbook.sheets, newSheet],
      activeSheetId: newSheet.id,
    });
  };

  const handleSwitchSheet = (sheetId: string) => {
    setSelectedCellRef('A1');
    setSelectedRangeEnd(null);
    setIsEditing(false);
    onChange({
      ...workbook,
      activeSheetId: sheetId,
    });
  };

  // Selection statistics (Count, Average, Sum)
  const selectionStats = useMemo(() => {
    if (!activeSheet) return null;
    const cellsToInspect = selectedRangeEnd
      ? expandRange(`${selectedCellRef}:${selectedRangeEnd}`)
      : [selectedCellRef];

    let count = 0;
    let numericCount = 0;
    let sum = 0;

    cellsToInspect.forEach((ref) => {
      const c = activeSheet.cells[ref];
      if (c && c.raw && c.raw.trim() !== '') {
        count++;
        const num = typeof c.computed === 'number' ? c.computed : parseFloat(String(c.computed));
        if (!isNaN(num)) {
          numericCount++;
          sum += num;
        }
      }
    });

    if (count <= 1 && numericCount <= 0) return null;

    return {
      count,
      average: numericCount > 0 ? Math.round((sum / numericCount) * 100) / 100 : null,
      sum: numericCount > 0 ? Math.round(sum * 100) / 100 : null,
    };
  }, [activeSheet, selectedCellRef, selectedRangeEnd]);

  // File Upload (.xlsx / .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result as ArrayBuffer;
      if (data) {
        try {
          const importedWb = importXlsxToWorkbook(data, file.name.replace(/\.[^/.]+$/, ''));
          onChange(importedWb);
        } catch (err) {
          alert('Gagal membaca file Excel. Pastikan format file .xlsx atau .csv.');
        }
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const colCount = activeSheet?.colCount || 15;
  const rowCount = activeSheet?.rowCount || 30;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] select-none text-[#1a1a1a] font-sans overflow-hidden">
      {/* 1. TOP TITLE BAR (EXCEL STYLE GREEN / RETRO TECH) */}
      <div className="bg-[#107c41] text-white px-3 py-1.5 flex items-center justify-between border-b-2 border-[#1a1a1a] text-xs font-mono-code shrink-0">
        <div className="flex items-center space-x-2">
          <div className="bg-white text-[#107c41] font-black px-1.5 py-0.5 text-xs rounded-xs">
            XL
          </div>
          <span className="font-bold tracking-wide">{workbook.title}</span>
          {isReadOnly && (
            <span className="bg-amber-400 text-[#1a1a1a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              MODE LIHAT SAJA (READ ONLY)
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {titleBarRightAction}
          {!isReadOnly && (
            <>
              <input
                type="file"
                ref={fileUploadInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileUploadInputRef.current?.click()}
                className="px-2 py-1 bg-white/10 hover:bg-white hover:text-[#107c41] transition-colors font-bold text-[11px] flex items-center gap-1 cursor-pointer border border-white/20"
                title="Buka / Import File Excel (.xlsx)"
              >
                <Upload className="h-3 w-3" />
                <span className="hidden sm:inline">Import Excel</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => exportWorkbookToXlsx(workbook)}
            className="px-2.5 py-1 bg-white text-[#107c41] hover:bg-emerald-50 transition-colors font-bold text-[11px] flex items-center gap-1 cursor-pointer border border-[#1a1a1a] shadow-[1px_1px_0px_#000]"
            title="Download / Unduh ke File Excel (.xlsx)"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">Unduh .XLSX</span>
          </button>
        </div>
      </div>

      {/* 2. FORMATTING TOOLBAR */}
      {!isReadOnly && (
        <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-1.5 flex flex-wrap items-center gap-1 text-xs shrink-0 font-mono-code overflow-x-auto">
          {/* Undo / Redo */}
          <div className="flex items-center space-x-0.5 border-r border-slate-300 pr-1.5 mr-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className="p-1.5 hover:bg-slate-200 disabled:opacity-30 cursor-pointer rounded-xs"
              title="Undo (Kembalikan Perubahan)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 hover:bg-slate-200 disabled:opacity-30 cursor-pointer rounded-xs"
              title="Redo"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Typography Styles */}
          <div className="flex items-center space-x-0.5 border-r border-slate-300 pr-1.5 mr-1">
            <button
              type="button"
              onClick={() => updateCellStyle({ bold: !activeCellData?.bold })}
              className={`p-1.5 rounded-xs cursor-pointer ${
                activeCellData?.bold ? 'bg-[#2e59e6] text-white font-black' : 'hover:bg-slate-200'
              }`}
              title="Tebal (Bold)"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateCellStyle({ italic: !activeCellData?.italic })}
              className={`p-1.5 rounded-xs cursor-pointer ${
                activeCellData?.italic ? 'bg-[#2e59e6] text-white italic' : 'hover:bg-slate-200'
              }`}
              title="Miring (Italic)"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center space-x-0.5 border-r border-slate-300 pr-1.5 mr-1">
            <button
              type="button"
              onClick={() => updateCellStyle({ align: 'left' })}
              className={`p-1.5 rounded-xs cursor-pointer ${
                activeCellData?.align === 'left' ? 'bg-[#2e59e6] text-white' : 'hover:bg-slate-200'
              }`}
              title="Rata Kiri"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateCellStyle({ align: 'center' })}
              className={`p-1.5 rounded-xs cursor-pointer ${
                activeCellData?.align === 'center' ? 'bg-[#2e59e6] text-white' : 'hover:bg-slate-200'
              }`}
              title="Rata Tengah"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateCellStyle({ align: 'right' })}
              className={`p-1.5 rounded-xs cursor-pointer ${
                activeCellData?.align === 'right' ? 'bg-[#2e59e6] text-white' : 'hover:bg-slate-200'
              }`}
              title="Rata Kanan"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Number Formats */}
          <div className="flex items-center space-x-1 border-r border-slate-300 pr-1.5 mr-1">
            <button
              type="button"
              onClick={() => updateCellStyle({ format: 'currency' })}
              className={`px-2 py-1 text-[11px] font-bold rounded-xs cursor-pointer flex items-center gap-1 ${
                activeCellData?.format === 'currency' ? 'bg-[#107c41] text-white' : 'bg-white hover:bg-slate-200 border border-slate-300'
              }`}
              title="Format Mata Uang (Rp)"
            >
              <span>Rp</span>
            </button>
            <button
              type="button"
              onClick={() => updateCellStyle({ format: 'percent' })}
              className={`px-1.5 py-1 text-[11px] font-bold rounded-xs cursor-pointer ${
                activeCellData?.format === 'percent' ? 'bg-[#107c41] text-white' : 'bg-white hover:bg-slate-200 border border-slate-300'
              }`}
              title="Format Persentase (%)"
            >
              %
            </button>
            <button
              type="button"
              onClick={() => updateCellStyle({ format: 'general' })}
              className={`px-2 py-1 text-[11px] font-bold rounded-xs cursor-pointer ${
                !activeCellData?.format || activeCellData?.format === 'general' ? 'bg-slate-300' : 'bg-white hover:bg-slate-200 border border-slate-300'
              }`}
              title="Format Angka Standar (General)"
            >
              123
            </button>
          </div>

          {/* Background Colors */}
          <div className="flex items-center space-x-1 border-r border-slate-300 pr-1.5 mr-1">
            <button
              type="button"
              onClick={() => updateCellStyle({ bg: '#fef08a' })}
              className="w-5 h-5 bg-yellow-200 border border-slate-400 rounded-xs hover:scale-110 transition-transform cursor-pointer"
              title="Sorot Warna Kuning"
            />
            <button
              type="button"
              onClick={() => updateCellStyle({ bg: '#bbf7d0' })}
              className="w-5 h-5 bg-emerald-200 border border-slate-400 rounded-xs hover:scale-110 transition-transform cursor-pointer"
              title="Sorot Warna Hijau"
            />
            <button
              type="button"
              onClick={() => updateCellStyle({ bg: '#bfdbfe' })}
              className="w-5 h-5 bg-blue-200 border border-slate-400 rounded-xs hover:scale-110 transition-transform cursor-pointer"
              title="Sorot Warna Biru"
            />
            <button
              type="button"
              onClick={() => updateCellStyle({ bg: undefined })}
              className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-300 rounded-xs hover:bg-slate-100 cursor-pointer text-slate-600"
              title="Hapus Warna Latar"
            >
              Polos
            </button>
          </div>

          {/* Add Rows / Columns */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-300 text-[11px] font-bold rounded-xs cursor-pointer flex items-center gap-1"
              title="Tambah 5 Baris ke Bawah"
            >
              <Plus className="h-3 w-3" /> +Baris
            </button>
            <button
              type="button"
              onClick={handleAddCol}
              className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-300 text-[11px] font-bold rounded-xs cursor-pointer flex items-center gap-1"
              title="Tambah 3 Kolom ke Kanan"
            >
              <Plus className="h-3 w-3" /> +Kolom
            </button>
          </div>
        </div>
      )}

      {/* 3. FORMULA BAR */}
      <div className="bg-white border-b-2 border-[#1a1a1a] px-3 py-1.5 flex items-center space-x-2 shrink-0 font-mono-code text-xs">
        {/* Name Box (Active Cell Coordinate) */}
        <div className="w-16 px-2 py-1 bg-[#f1f5f9] border border-slate-300 font-bold text-center text-[#1a1a1a] tracking-wider shrink-0 shadow-inner">
          {selectedCellRef}
        </div>

        {/* fx formula icon */}
        <div className="text-slate-500 font-serif italic font-bold px-1 select-none">
          fx
        </div>

        {/* Formula Input Box */}
        <div className="flex-1 relative">
          <input
            ref={formulaInputRef}
            type="text"
            readOnly={isReadOnly}
            value={editInputValue}
            onChange={(e) => setEditInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitCellValue(selectedCellRef, editInputValue);
                formulaInputRef.current?.blur();
              } else if (e.key === 'Escape') {
                setEditInputValue(activeCellData?.raw || '');
                formulaInputRef.current?.blur();
              }
            }}
            onBlur={() => {
              if (editInputValue !== (activeCellData?.raw || '')) {
                commitCellValue(selectedCellRef, editInputValue);
              }
            }}
            placeholder={isReadOnly ? '' : 'Ketik angka, teks, atau rumus (awali tanda = seperti =SUM(A1:A5))'}
            className="w-full bg-[#f8fafc] focus:bg-white border border-slate-300 px-2.5 py-1 text-xs font-mono-code text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#107c41]"
          />
        </div>
      </div>

      {/* 4. MAIN INTERACTIVE SPREADSHEET GRID */}
      <div className="flex-1 overflow-auto relative bg-white">
        <table className="border-collapse table-fixed select-none text-xs font-mono-code">
          <thead>
            <tr>
              {/* Corner top-left cell */}
              <th className="sticky top-0 left-0 z-30 w-10 min-w-10 bg-[#e2e8f0] border-r-2 border-b-2 border-slate-400 text-slate-500 font-bold p-1 text-center">
                #
              </th>
              {/* Column Letters (A, B, C...) */}
              {Array.from({ length: colCount }).map((_, cIdx) => {
                const colLetter = colIndexToLetter(cIdx);
                const isColActive =
                  cellToCoords(selectedCellRef)?.col === cIdx;

                return (
                  <th
                    key={colLetter}
                    className={`sticky top-0 z-20 w-28 min-w-28 max-w-28 border-r border-b-2 border-slate-300 p-1 font-bold text-center transition-colors ${
                      isColActive ? 'bg-emerald-100 text-[#107c41] border-b-emerald-600' : 'bg-[#e2e8f0] text-slate-700'
                    }`}
                  >
                    {colLetter}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: rowCount }).map((_, rIdx) => {
              const rowNumber = rIdx + 1;
              const isRowActive =
                cellToCoords(selectedCellRef)?.row === rIdx;

              return (
                <tr key={rowNumber}>
                  {/* Sticky Row Number (1, 2, 3...) */}
                  <th
                    className={`sticky left-0 z-10 w-10 min-w-10 border-r-2 border-b border-slate-300 p-1 font-bold text-center ${
                      isRowActive ? 'bg-emerald-100 text-[#107c41]' : 'bg-[#e2e8f0] text-slate-700'
                    }`}
                  >
                    {rowNumber}
                  </th>

                  {/* Cell Blocks */}
                  {Array.from({ length: colCount }).map((_, cIdx) => {
                    const currentRef = coordsToCell(cIdx, rIdx);
                    const cellData = activeSheet?.cells[currentRef];
                    const isSelected = selectedCellRef === currentRef;
                    const isTargetHighlight = highlightCells[currentRef];

                    const displayValue = cellData
                      ? formatCellValue(cellData.computed !== undefined ? cellData.computed : cellData.raw, cellData.format)
                      : '';

                    const isCellError = cellData?.isError;

                    return (
                      <td
                        key={currentRef}
                        data-cell-ref={currentRef}
                        onClick={(e) => {
                          if (e.shiftKey) {
                            setSelectedRangeEnd(currentRef);
                          } else {
                            setSelectedCellRef(currentRef);
                            setSelectedRangeEnd(null);
                          }
                          setIsEditing(false);
                        }}
                        onDoubleClick={() => {
                          if (isReadOnly) return;
                          setSelectedCellRef(currentRef);
                          setIsEditing(true);
                          setEditInputValue(cellData?.raw || '');
                          setTimeout(() => {
                            cellInputRef.current?.focus();
                          }, 50);
                        }}
                        style={{
                          backgroundColor: cellData?.bg,
                          color: cellData?.color,
                        }}
                        className={`h-7 px-2 border-r border-b border-slate-200 truncate cursor-cell transition-all relative ${
                          cellData?.bold ? 'font-bold' : ''
                        } ${cellData?.italic ? 'italic' : ''} ${
                          cellData?.align === 'center'
                            ? 'text-center'
                            : cellData?.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        } ${
                          isCellError
                            ? 'bg-rose-50 text-rose-700 font-bold'
                            : ''
                        } ${
                          isTargetHighlight
                            ? 'ring-2 ring-amber-500 bg-amber-50/70'
                            : ''
                        } ${
                          isSelected
                            ? 'ring-2 ring-[#107c41] ring-inset z-10 bg-emerald-50/40'
                            : 'hover:bg-slate-50'
                        }`}
                        title={
                          cellData?.raw && cellData.raw.startsWith('=')
                            ? `${currentRef}: ${cellData.raw} = ${displayValue}`
                            : `${currentRef}: ${displayValue}`
                        }
                      >
                        {isEditing && isSelected ? (
                          <input
                            ref={cellInputRef}
                            type="text"
                            value={editInputValue}
                            onChange={(e) => setEditInputValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                commitCellValue(currentRef, editInputValue);
                                setIsEditing(false);
                              } else if (e.key === 'Escape') {
                                setIsEditing(false);
                              }
                            }}
                            onBlur={() => {
                              commitCellValue(currentRef, editInputValue);
                              setIsEditing(false);
                            }}
                            className="absolute inset-0 w-full h-full px-1.5 font-mono-code text-xs bg-white border-2 border-[#107c41] focus:outline-none z-20"
                            autoFocus
                          />
                        ) : (
                          displayValue
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. BOTTOM WORKSHEET TABS & STATUS BAR */}
      <div className="bg-[#e2e8f0] border-t-2 border-[#1a1a1a] px-3 py-1 flex flex-wrap items-center justify-between text-xs font-mono-code shrink-0">
        {/* Sheet Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto">
          {workbook.sheets.map((sheet) => {
            const isActive = sheet.id === workbook.activeSheetId;
            return (
              <button
                key={sheet.id}
                type="button"
                onClick={() => handleSwitchSheet(sheet.id)}
                className={`px-3 py-1 font-bold border-t-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-[#107c41] border-[#107c41] shadow-[1px_1px_0px_#000]'
                    : 'bg-slate-200 text-slate-600 border-transparent hover:bg-slate-300'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>{sheet.name}</span>
              </button>
            );
          })}

          {!isReadOnly && (
            <button
              type="button"
              onClick={handleAddSheet}
              className="p-1 hover:bg-slate-300 text-slate-700 transition-colors rounded-xs cursor-pointer"
              title="Tambah Lembar Kerja Baru"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Live Calculation Selection Status Bar */}
        {selectionStats && (
          <div className="flex items-center space-x-3 text-[11px] font-bold text-slate-700 bg-white/80 px-2.5 py-0.5 border border-slate-300">
            <span>Jumlah Sel: {selectionStats.count}</span>
            {selectionStats.average !== null && (
              <span>Rata-rata: {selectionStats.average}</span>
            )}
            {selectionStats.sum !== null && (
              <span className="text-[#107c41]">Total (SUM): {selectionStats.sum}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
