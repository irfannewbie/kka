import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  Cloud,
  CloudOff,
  Download,
  FilePlus2,
  FileText,
  Highlighter,
  Image as ImageIcon,
  Info,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Table2,
  Underline,
  Undo2,
  Upload,
} from 'lucide-react';
import { downloadBlob, escapeHtml, slugifyFilename } from './download';
import { countWords, htmlToPlainText, sanitizeEditorHtml } from './htmlUtils';
import { readImageFile } from './image';
import { printHtmlDocument } from './print';
import { buildDocxBlob } from './docxExport';
import { MissionChecklist, type LabMission } from './MissionChecklist';

const STORAGE_KEY = 'praktek_document_v1';
const DEFAULT_TITLE = 'Dokumen Baru';
const DEFAULT_HTML =
  '<h1>Dokumen Baru</h1>' +
  '<p>Mulai menulis di sini. Gunakan toolbar di atas untuk mengubah format teks, menambah tabel, atau menyisipkan gambar.</p>' +
  '<p><br></p>';

/** Hitung tag gambar untuk mendeteksi gambar remote yang dibuang saat sanitasi. */
function countImageTags(html: string): number {
  return (html.match(/<img\b/gi) ?? []).length;
}

interface DocumentDraft {
  title: string;
  html: string;
  updatedAt: number;
}

function loadDraft(): DocumentDraft {
  if (typeof window === 'undefined') {
    return { title: DEFAULT_TITLE, html: DEFAULT_HTML, updatedAt: 0 };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { title: DEFAULT_TITLE, html: DEFAULT_HTML, updatedAt: 0 };

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return { title: DEFAULT_TITLE, html: DEFAULT_HTML, updatedAt: 0 };
    }

    const record = parsed as Record<string, unknown>;
    return {
      title: typeof record.title === 'string' && record.title.trim() ? record.title : DEFAULT_TITLE,
      html: typeof record.html === 'string' ? record.html : DEFAULT_HTML,
      updatedAt: typeof record.updatedAt === 'number' ? record.updatedAt : 0,
    };
  } catch {
    return { title: DEFAULT_TITLE, html: DEFAULT_HTML, updatedAt: 0 };
  }
}

const DOC_MISSIONS: LabMission[] = [
  {
    title: 'Identitas dokumen',
    desc: 'Tulis judul, nama, kelas, dan nomor absen di bagian atas dokumen.',
  },
  {
    title: 'Format teks',
    desc: 'Buat judul tebal rata tengah, isi 12–14 pt, dan jarak baris yang nyaman dibaca.',
  },
  {
    title: 'Daftar & tabel',
    desc: 'Tambahkan daftar berisi minimal 3 poin dan tabel 3 kolom untuk data.',
  },
  {
    title: 'Gambar',
    desc: 'Sisipkan satu gambar pendukung, lalu atur ukurannya agar tidak melebihi halaman.',
  },
  {
    title: 'Ekspor .docx',
    desc: 'Unduh sebagai Word (.docx), buka kembali, dan pastikan teks serta tabel tetap rapi.',
  },
  {
    title: 'Simpan & lanjutkan',
    desc: 'Muat ulang halaman dan pastikan dokumen tersimpan otomatis di browser.',
  },
];

const EXPORT_CSS = `
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: #111827; }
  .doc-page { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
  .doc-page h1 { font-size: 20pt; line-height: 1.2; margin: 0 0 10pt; }
  .doc-page h2 { font-size: 16pt; line-height: 1.25; margin: 14pt 0 8pt; }
  .doc-page h3 { font-size: 13.5pt; line-height: 1.3; margin: 12pt 0 6pt; }
  .doc-page p { margin: 0 0 8pt; }
  .doc-page ul { list-style: disc; padding-left: 20pt; margin: 0 0 8pt; }
  .doc-page ol { list-style: decimal; padding-left: 20pt; margin: 0 0 8pt; }
  .doc-page li { margin: 3pt 0; }
  .doc-page blockquote { border-left: 3px solid #94a3b8; padding-left: 10pt; color: #475569; margin: 8pt 0; }
  .doc-page table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
  .doc-page th, .doc-page td { border: 1px solid #111827; padding: 5pt 7pt; vertical-align: top; }
  .doc-page img { max-width: 100%; height: auto; }
  .doc-page a { color: #1d4ed8; text-decoration: underline; }
  .doc-page hr { border: 0; border-top: 1px solid #111827; margin: 12pt 0; }
`;

const TABLE_HTML =
  '<table style="border-collapse:collapse;width:100%;margin:8px 0">' +
  '<tbody>' +
  '<tr>' +
  '<td style="border:1px solid #1a1a1a;padding:6px 8px">Sel 1</td>' +
  '<td style="border:1px solid #1a1a1a;padding:6px 8px">Sel 2</td>' +
  '<td style="border:1px solid #1a1a1a;padding:6px 8px">Sel 3</td>' +
  '</tr>' +
  '<tr>' +
  '<td style="border:1px solid #1a1a1a;padding:6px 8px">&nbsp;</td>' +
  '<td style="border:1px solid #1a1a1a;padding:6px 8px">&nbsp;</td>' +
  '<td style="border:1px solid #1a1a1a;padding:6px 8px">&nbsp;</td>' +
  '</tr>' +
  '</tbody></table><p><br></p>';

const FONT_SIZES = ['12', '14', '16', '18', '24', '32'];

const formatTime = (timestamp: number | null): string => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

interface ToolButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({ label, onClick, children, disabled }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    className="h-9 w-9 shrink-0 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-300 text-[#1a1a1a] flex items-center justify-center transition-colors cursor-pointer"
  >
    {children}
  </button>
);

interface ExportItemProps {
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}

const ExportItem: React.FC<ExportItemProps> = ({ label, hint, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full text-left px-2.5 py-2 hover:bg-[#FAF8F5] disabled:opacity-50 cursor-pointer"
  >
    <span className="block font-mono-code text-[11px] font-bold text-[#1a1a1a]">{label}</span>
    <span className="block text-[10px] text-slate-500 mt-0.5">{hint}</span>
  </button>
);

/** Lab Dokumen: pengolah kata lokal (contentEditable + ekspor .docx/PDF). */
export const DocumentLabPanel: React.FC = () => {
  const [initialDraft] = useState<DocumentDraft>(() => loadDraft());
  const [title, setTitle] = useState(initialDraft.title);
  const [html, setHtml] = useState(initialDraft.html);
  const [savedAt, setSavedAt] = useState<number | null>(initialDraft.updatedAt || null);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [notice, setNotice] = useState<string | null>(null);
  const [block, setBlock] = useState('p');
  const [isExporting, setIsExporting] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const exportDetailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialDraft.html;
    }
  }, [initialDraft.html]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
        const currentBlock = document.queryCommandValue('formatBlock');
        if (currentBlock) {
          const normalizedBlock = currentBlock.toLowerCase().replace(/[<>]/g, '');
          if (['p', 'h1', 'h2', 'h3'].includes(normalizedBlock)) {
            setBlock(normalizedBlock);
          } else {
            setBlock('p');
          }
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ title, html, updatedAt: Date.now() })
        );
        setSavedAt(Date.now());
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [title, html]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const plainText = useMemo(() => htmlToPlainText(html), [html]);
  const wordCount = useMemo(() => countWords(html), [html]);

  const syncFromEditor = () => {
    if (editorRef.current) {
      setSaveState('saving');
      setHtml(editorRef.current.innerHTML);
    }
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const range = savedRangeRef.current;
    if (range && editor.contains(range.commonAncestorContainer)) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  const runCommand = (command: string, value?: string) => {
    restoreSelection();
    document.execCommand(command, false, value);
    syncFromEditor();
  };

  const applyBlock = (value: string) => {
    setBlock(value);
    runCommand('formatBlock', `<${value}>`);
  };

  const applyFontSize = (size: string) => {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = `${size}px`;

    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);

      const nextRange = document.createRange();
      nextRange.selectNodeContents(span);
      nextRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(nextRange);
      savedRangeRef.current = nextRange.cloneRange();
      syncFromEditor();
    } catch {
      document.execCommand('fontSize', false, '4');
      syncFromEditor();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedHtml = event.clipboardData.getData('text/html');
    if (!pastedHtml) return;

    event.preventDefault();
    const sanitized = sanitizeEditorHtml(pastedHtml);
    document.execCommand('insertHTML', false, sanitized);
    syncFromEditor();
    if (countImageTags(pastedHtml) > countImageTags(sanitized)) {
      setNotice('Gambar dari internet tidak disalin. Gunakan tombol gambar agar tersimpan lokal.');
    }
  };

  const handleImagePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const dataUrl = await readImageFile(file, 1000);
      restoreSelection();
      document.execCommand(
        'insertHTML',
        false,
        `<img src="${dataUrl}" alt="${escapeHtml(file.name)}" style="max-width:100%;height:auto;margin:8px 0" />`
      );
      syncFromEditor();
      setNotice('Gambar disisipkan. Atur ukurannya dengan klik gambar.');
    } catch {
      setNotice('Gambar gagal dimuat. Coba berkas lain.');
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const isHtml = /\.html?$/i.test(file.name) || file.type === 'text/html';
      const nextHtml = isHtml
        ? sanitizeEditorHtml(text)
        : `<p>${escapeHtml(text).replace(/\n/g, '<br />')}</p>`;

      setTitle(file.name.replace(/\.[^.]+$/, '') || DEFAULT_TITLE);
      setHtml(nextHtml);
      setSaveState('saving');
      if (editorRef.current) editorRef.current.innerHTML = nextHtml;
      if (isHtml && countImageTags(text) > countImageTags(nextHtml)) {
        setNotice('Berkas diimpor. Gambar dari internet tidak disalin; gunakan tombol gambar.');
      } else {
        setNotice('Berkas berhasil diimpor ke editor.');
      }
    } catch {
      setNotice('Berkas gagal dibaca. Gunakan .html, .txt, atau .md.');
    }
  };

  const startNewDocument = () => {
    const confirmed = window.confirm(
      'Mulai dokumen baru? Dokumen saat ini akan diganti. Unduh dulu jika masih diperlukan.'
    );
    if (!confirmed) return;

    setTitle(DEFAULT_TITLE);
    setHtml(DEFAULT_HTML);
    setSaveState('saving');
    if (editorRef.current) editorRef.current.innerHTML = DEFAULT_HTML;
    setNotice('Dokumen baru dibuat.');
  };

  const closeExportMenu = () => {
    if (exportDetailsRef.current) exportDetailsRef.current.open = false;
  };

  const buildDocumentHtml = (forWord: boolean): string => {
    const body = editorRef.current?.innerHTML ?? html;
    const wordNamespace = forWord
      ? ' xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"'
      : '';

    return (
      `<!doctype html><html lang="id"${wordNamespace}><head><meta charset="utf-8" />` +
      `<title>${escapeHtml(title)}</title><style>${EXPORT_CSS}</style></head>` +
      `<body><article class="doc-page">${body}</article></body></html>`
    );
  };

  const exportDocx = async () => {
    closeExportMenu();
    setIsExporting(true);
    try {
      const blob = await buildDocxBlob(editorRef.current?.innerHTML ?? html, title);
      downloadBlob(blob, `${slugifyFilename(title, 'dokumen')}.docx`);
      setNotice('Dokumen .docx berhasil diunduh.');
    } catch {
      setNotice('Gagal membuat .docx. Coba ekspor .doc atau PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportDoc = () => {
    closeExportMenu();
    downloadBlob(
      new Blob(['\ufeff', buildDocumentHtml(true)], { type: 'application/msword;charset=utf-8' }),
      `${slugifyFilename(title, 'dokumen')}.doc`
    );
    setNotice('Dokumen .doc berhasil diunduh.');
  };

  const exportHtml = () => {
    closeExportMenu();
    downloadBlob(
      new Blob([buildDocumentHtml(false)], { type: 'text/html;charset=utf-8' }),
      `${slugifyFilename(title, 'dokumen')}.html`
    );
    setNotice('Dokumen .html berhasil diunduh.');
  };

  const exportPdf = () => {
    closeExportMenu();
    const ok = printHtmlDocument(buildDocumentHtml(false));
    setNotice(ok ? 'Dialog cetak dibuka. Pilih “Save as PDF”.' : 'Cetak tidak didukung browser ini.');
  };

  return (
    <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-3.5 sm:p-5">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-3 pb-3 border-b-2 border-[#1a1a1a]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 font-mono-code text-[10px] font-bold uppercase mb-1">
              <span className="px-2 py-0.5 bg-[#1a1a1a] text-white">LAB DOKUMEN</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400">
                OFFLINE
              </span>
              <span className="px-2 py-0.5 bg-[#FAF8F5] text-slate-600 border border-slate-300">
                AUTOSAVE
              </span>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#2b47b5] shrink-0" />
              <input
                value={title}
                onChange={(event) => {
                  setSaveState('saving');
                  setTitle(event.target.value);
                }}
                aria-label="Judul dokumen"
                className="min-w-0 w-full max-w-xl bg-transparent border-b-2 border-transparent focus:border-[#1a1a1a] outline-none font-mono-code text-lg sm:text-2xl font-black text-[#1a1a1a] leading-tight"
              />
            </div>

            <p className="text-[11px] sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-2xl">
              Pengolah kata lokal: mengetik, format, tabel, gambar, lalu ekspor ke Word
              (.docx), HTML, atau PDF. Tidak perlu akun dan tetap bekerja tanpa internet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startNewDocument}
              className="min-h-[40px] px-2.5 py-2 bg-white hover:bg-slate-100 border border-[#1a1a1a] font-mono-code text-[11px] font-bold text-[#1a1a1a] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              <span>Baru</span>
            </button>

            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="min-h-[40px] px-2.5 py-2 bg-white hover:bg-slate-100 border border-[#1a1a1a] font-mono-code text-[11px] font-bold text-[#1a1a1a] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Impor</span>
            </button>

            <details ref={exportDetailsRef} className="relative">
              <summary className="min-h-[40px] px-3 py-2 bg-[#2b47b5] hover:brightness-110 border border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] font-mono-code text-[11px] font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <Download className="h-3.5 w-3.5" />
                <span>Unduh</span>
                <ChevronDown className="h-3 w-3" />
              </summary>
              <div className="absolute right-0 z-30 mt-1 w-60 bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-1.5">
                <ExportItem
                  label="Word (.docx)"
                  hint="Paling kompatibel dengan Microsoft Word"
                  onClick={exportDocx}
                  disabled={isExporting}
                />
                <ExportItem
                  label="Word 97-2003 (.doc)"
                  hint="Cadangan untuk aplikasi lama"
                  onClick={exportDoc}
                  disabled={isExporting}
                />
                <ExportItem
                  label="HTML (.html)"
                  hint="Bisa dibuka di browser mana pun"
                  onClick={exportHtml}
                  disabled={isExporting}
                />
                <ExportItem
                  label="PDF (dialog cetak)"
                  hint="Pilih “Save as PDF” di dialog"
                  onClick={exportPdf}
                  disabled={isExporting}
                />
              </div>
            </details>
          </div>
        </div>

        {notice && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-300 text-[11px] text-blue-950">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="mt-3 bg-[#FAF8F5] border border-[#1a1a1a] p-2">
        <div className="flex items-center gap-1.5 overflow-x-auto lg:flex-wrap lg:overflow-visible pb-1 lg:pb-0">
          <select
            aria-label="Gaya paragraf"
            value={block}
            onChange={(event) => applyBlock(event.target.value)}
            className="h-9 shrink-0 border border-slate-300 bg-white px-1.5 font-mono-code text-[11px] font-bold text-[#1a1a1a]"
          >
            <option value="p">Teks biasa</option>
            <option value="h1">Judul 1</option>
            <option value="h2">Judul 2</option>
            <option value="h3">Judul 3</option>
          </select>

          <select
            aria-label="Ukuran huruf"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) applyFontSize(event.target.value);
              event.target.value = '';
            }}
            className="h-9 shrink-0 border border-slate-300 bg-white px-1.5 font-mono-code text-[11px] font-bold text-[#1a1a1a]"
          >
            <option value="" disabled>
              Ukuran
            </option>
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} px
              </option>
            ))}
          </select>

          <span className="h-6 w-px bg-slate-300 shrink-0" />

          <ToolButton label="Tebal (Ctrl+B)" onClick={() => runCommand('bold')}>
            <Bold className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Miring (Ctrl+I)" onClick={() => runCommand('italic')}>
            <Italic className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Garis bawah (Ctrl+U)" onClick={() => runCommand('underline')}>
            <Underline className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Coret" onClick={() => runCommand('strikeThrough')}>
            <Strikethrough className="h-4 w-4" />
          </ToolButton>

          <label
            title="Warna teks"
            className="relative h-9 w-9 shrink-0 bg-white border border-slate-300 flex items-center justify-center cursor-pointer"
          >
            <Palette className="h-4 w-4" />
            <input
              type="color"
              defaultValue="#1a1a1a"
              aria-label="Warna teks"
              onChange={(event) => runCommand('foreColor', event.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>

          <ToolButton label="Sorot kuning" onClick={() => runCommand('hiliteColor', '#fef08a')}>
            <Highlighter className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Hapus format" onClick={() => runCommand('removeFormat')}>
            <RemoveFormatting className="h-4 w-4" />
          </ToolButton>

          <span className="h-6 w-px bg-slate-300 shrink-0" />

          <ToolButton label="Rata kiri" onClick={() => runCommand('justifyLeft')}>
            <AlignLeft className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Rata tengah" onClick={() => runCommand('justifyCenter')}>
            <AlignCenter className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Rata kanan" onClick={() => runCommand('justifyRight')}>
            <AlignRight className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Rata penuh" onClick={() => runCommand('justifyFull')}>
            <AlignJustify className="h-4 w-4" />
          </ToolButton>

          <span className="h-6 w-px bg-slate-300 shrink-0" />

          <ToolButton label="Daftar poin" onClick={() => runCommand('insertUnorderedList')}>
            <List className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Daftar bernomor" onClick={() => runCommand('insertOrderedList')}>
            <ListOrdered className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Sisipkan tautan" onClick={() => {
            const url = window.prompt('Alamat tautan (contoh: https://...):');
            if (!url) return;
            const trimmed = url.trim();
            if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)) {
              runCommand('createLink', trimmed);
            } else {
              setNotice('Tautan harus diawali https://, http://, mailto:, tel:, atau /.');
            }
          }}>
            <Link2 className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Sisipkan gambar" onClick={() => imageInputRef.current?.click()}>
            <ImageIcon className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Sisipkan tabel" onClick={() => runCommand('insertHTML', TABLE_HTML)}>
            <Table2 className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Garis pemisah" onClick={() => runCommand('insertHorizontalRule')}>
            <Minus className="h-4 w-4" />
          </ToolButton>

          <span className="h-6 w-px bg-slate-300 shrink-0" />

          <ToolButton label="Urungkan (Ctrl+Z)" onClick={() => runCommand('undo')}>
            <Undo2 className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Ulangi (Ctrl+Y)" onClick={() => runCommand('redo')}>
            <Redo2 className="h-4 w-4" />
          </ToolButton>
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePick}
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".html,.htm,.txt,.md,text/html,text/plain,text/markdown"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* ================= HALAMAN ================= */}
      <div className="mt-3 bg-[#E5E0D8] border-2 border-[#1a1a1a] p-2 sm:p-5">
        <div className="mx-auto w-full max-w-[210mm] min-h-[520px] sm:min-h-[297mm] bg-white border border-slate-300 shadow-[3px_3px_0px_rgba(26,26,26,0.18)] px-4 py-5 sm:px-12 sm:py-12">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            role="textbox"
            aria-multiline="true"
            aria-label="Isi dokumen"
            onInput={syncFromEditor}
            onBlur={saveSelection}
            onPaste={handlePaste}
            className="doc-page outline-none min-h-[460px] sm:min-h-[250mm]"
          />
        </div>
      </div>

      {/* ================= STATUS ================= */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 bg-white border border-[#1a1a1a] font-mono-code text-[10px] text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <span>{wordCount} kata</span>
          <span>{plainText.length} karakter</span>
          <span className="hidden sm:inline">Penyimpanan lokal browser</span>
        </div>
        <span
          className={`flex items-center gap-1.5 font-bold ${
            saveState === 'error' ? 'text-red-600' : 'text-slate-600'
          }`}
        >
          {saveState === 'saving' ? (
            <Cloud className="h-3.5 w-3.5 animate-pulse" />
          ) : saveState === 'error' ? (
            <CloudOff className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          )}
          {saveState === 'saving'
            ? 'Menyimpan…'
            : saveState === 'error'
              ? 'Gagal menyimpan (penyimpanan penuh?)'
              : savedAt
                ? `Tersimpan ${formatTime(savedAt)}`
                : 'Tersimpan lokal'}
        </span>
      </div>

      <MissionChecklist
        storageKey="praktek_doc_missions_v1"
        accent="#2b47b5"
        missions={DOC_MISSIONS}
      />
    </div>
  );
};
