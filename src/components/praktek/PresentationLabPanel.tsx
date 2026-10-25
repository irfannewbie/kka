import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  Cloud,
  CloudOff,
  Copy,
  Download,
  FilePlus2,
  Image as ImageIcon,
  Info,
  LayoutTemplate,
  List,
  Play,
  Plus,
  Presentation,
  Trash2,
  X,
} from 'lucide-react';
import {
  DECK_THEMES,
  createDefaultDeck,
  createSlideId,
  loadDeck,
  saveDeck,
  type DeckThemeId,
  type PresentationDeck,
  type PresentationSlide,
  type SlideLayout,
} from './presentationTypes';
import { SlideCanvas } from './SlideCanvas';
import { MissionChecklist, type LabMission } from './MissionChecklist';
import { downloadBlob, escapeHtml, slugifyFilename } from './download';
import { readImageFile } from './image';
import { printHtmlDocument } from './print';
import { exportDeckToPptx } from './pptxExport';

const DECK_MISSIONS: LabMission[] = [
  {
    title: 'Deck pertama',
    desc: 'Buat presentasi baru, beri judul, dan isi slide pembuka dengan nama serta kelas.',
  },
  {
    title: 'Struktur 6 slide',
    desc: 'Susun minimal 6 slide: pembuka, agenda, 3 slide isi, dan penutup.',
  },
  {
    title: 'Tema & layout',
    desc: 'Pilih satu tema dan gunakan layout Judul/Isi secara konsisten.',
  },
  {
    title: 'Poin yang ringkas',
    desc: 'Maksimal 6 baris per slide dan 6 kata per baris. Detail masuk ke catatan pembicara.',
  },
  {
    title: 'Gambar pendukung',
    desc: 'Sisipkan satu gambar atau diagram yang benar-benar mendukung materi.',
  },
  {
    title: 'Presentasi & ekspor',
    desc: 'Latih mode Putar, lalu unduh .pptx dan buka kembali untuk memastikan rapi.',
  },
];

const formatTime = (timestamp: number | null): string => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const buildDeckPrintHtml = (deck: PresentationDeck): string => {
  const theme = DECK_THEMES[deck.theme];

  const slides = deck.slides
    .map((slide, index) => {
      const lines = slide.body
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const content =
        slide.layout === 'title'
          ? `<div class="title-layout"><h1>${escapeHtml(slide.title)}</h1>${
              slide.body.trim()
                ? `<p class="subtitle">${escapeHtml(slide.body).replace(/\n/g, '<br />')}</p>`
                : ''
            }${slide.image ? `<img class="image-center" src="${slide.image}" alt="" />` : ''}</div>`
          : `<h2>${escapeHtml(slide.title)}</h2><div class="content">${
              lines.length > 0
                ? `<ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`
                : ''
            }${slide.image ? `<img class="image-side" src="${slide.image}" alt="" />` : ''}</div>`;

      return (
        `<section class="slide" style="background:${theme.bg};color:${theme.fg}">` +
        `<div class="accent" style="background:${theme.accent}"></div>${content}` +
        `<div class="page-no" style="color:${theme.muted}">${index + 1} / ${deck.slides.length}</div>` +
        `</section>`
      );
    })
    .join('');

  return (
    '<!doctype html><html lang="id"><head><meta charset="utf-8" />' +
    `<title>${escapeHtml(deck.title)}</title><style>` +
    '@page { size: 13.333in 7.5in; margin: 0; }' +
    '* { box-sizing: border-box; }' +
    'body { margin: 0; font-family: Calibri, Arial, sans-serif; }' +
    '.slide { width: 13.333in; height: 7.5in; page-break-after: always; position: relative; overflow: hidden; padding: 0.6in 0.8in; }' +
    '.slide:last-child { page-break-after: auto; }' +
    '.accent { position: absolute; left: 0; top: 0; right: 0; height: 0.08in; }' +
    '.title-layout { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }' +
    '.title-layout h1 { font-size: 44pt; line-height: 1.05; margin: 0; }' +
    '.subtitle { font-size: 20pt; opacity: 0.8; margin: 0.35in 0 0; }' +
    `h2 { font-size: 30pt; margin: 0; padding-left: 0.15in; border-left: 0.08in solid ${theme.accent}; }` +
    '.content { display: flex; gap: 0.4in; margin-top: 0.35in; }' +
    'ul { flex: 1; margin: 0; padding-left: 0.3in; }' +
    'li { font-size: 20pt; line-height: 1.35; margin: 0 0 0.12in; }' +
    '.image-side { max-width: 3.2in; max-height: 4.2in; object-fit: contain; }' +
    '.image-center { max-width: 5in; max-height: 1.6in; object-fit: contain; margin-top: 0.3in; }' +
    '.page-no { position: absolute; right: 0.35in; bottom: 0.25in; font-size: 10pt; }' +
    '</style></head><body>' +
    slides +
    '</body></html>'
  );
};

interface IconButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({ label, onClick, children, disabled }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled}
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

/** Lab Presentasi: editor slide lokal + mode putar + ekspor .pptx/PDF. */
export const PresentationLabPanel: React.FC = () => {
  const [deck, setDeck] = useState<PresentationDeck>(() => loadDeck());
  const [selectedId, setSelectedId] = useState<string>(() => deck.slides[0]?.id ?? '');
  const [savedAt, setSavedAt] = useState<number | null>(deck.updatedAt || null);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [notice, setNotice] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [presentIndex, setPresentIndex] = useState(0);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const exportDetailsRef = useRef<HTMLDetailsElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  const theme = DECK_THEMES[deck.theme];
  const selectedIndex = Math.max(
    0,
    deck.slides.findIndex((slide) => slide.id === selectedId)
  );
  const selectedSlide: PresentationSlide = deck.slides[selectedIndex] ?? deck.slides[0];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        saveDeck(deck);
        setSavedAt(Date.now());
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [deck]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const slideCount = deck.slides.length;
  const totalSlides = slideCount;

  const goNext = () => setPresentIndex((index) => Math.min(index + 1, slideCount - 1));
  const goPrev = () => setPresentIndex((index) => Math.max(index - 1, 0));

  useEffect(() => {
    if (!presenting) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPresenting(false);
        return;
      }

      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault();
        setPresentIndex((index) => Math.min(index + 1, slideCount - 1));
      }

      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        setPresentIndex((index) => Math.max(index - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [presenting, slideCount]);

  const updateDeck = (updater: (previous: PresentationDeck) => PresentationDeck) => {
    setSaveState('saving');
    setDeck(updater);
  };

  const updateSelectedSlide = (patch: Partial<PresentationSlide>) => {
    updateDeck((previous) => ({
      ...previous,
      slides: previous.slides.map((slide) =>
        slide.id === selectedSlide.id ? { ...slide, ...patch } : slide
      ),
    }));
  };

  const addSlide = () => {
    const slide: PresentationSlide = {
      id: createSlideId(),
      layout: 'content',
      title: 'Slide Baru',
      body: 'Poin pertama\nPoin kedua',
      notes: '',
    };

    updateDeck((previous) => {
      const index = previous.slides.findIndex((item) => item.id === selectedId);
      const insertAt = index >= 0 ? index + 1 : previous.slides.length;
      const slides = [...previous.slides];
      slides.splice(insertAt, 0, slide);
      return { ...previous, slides };
    });

    setSelectedId(slide.id);
  };

  const duplicateSlide = () => {
    const copy: PresentationSlide = {
      ...selectedSlide,
      id: createSlideId(),
      title: `${selectedSlide.title} (salinan)`,
    };

    updateDeck((previous) => {
      const index = previous.slides.findIndex((item) => item.id === selectedSlide.id);
      const slides = [...previous.slides];
      slides.splice(index + 1, 0, copy);
      return { ...previous, slides };
    });

    setSelectedId(copy.id);
  };

  const deleteSlide = () => {
    if (slideCount <= 1) {
      setNotice('Minimal satu slide harus tetap ada.');
      return;
    }

    const index = selectedIndex;
    const slides = deck.slides.filter((slide) => slide.id !== selectedSlide.id);
    const nextSelected = slides[Math.min(index, slides.length - 1)];

    updateDeck((previous) => ({
      ...previous,
      slides: previous.slides.filter((slide) => slide.id !== selectedSlide.id),
    }));
    setSelectedId(nextSelected.id);
  };

  const moveSlide = (direction: -1 | 1) => {
    const target = selectedIndex + direction;
    if (target < 0 || target >= slideCount) return;

    updateDeck((previous) => {
      const slides = [...previous.slides];
      const [moved] = slides.splice(selectedIndex, 1);
      slides.splice(target, 0, moved);
      return { ...previous, slides };
    });
  };

  const startNewDeck = () => {
    const confirmed = window.confirm(
      'Mulai presentasi baru? Presentasi saat ini akan diganti. Unduh dulu jika masih diperlukan.'
    );
    if (!confirmed) return;

    const next = createDefaultDeck();
    updateDeck(() => next);
    setSelectedId(next.slides[0].id);
    setPresentIndex(0);
    setNotice('Presentasi baru dibuat.');
  };

  const handleImagePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const dataUrl = await readImageFile(file, 1280);
      updateSelectedSlide({ image: dataUrl });
      setNotice('Gambar ditambahkan ke slide ini.');
    } catch {
      setNotice('Gambar gagal dimuat. Coba berkas lain.');
    }
  };

  const closeExportMenu = () => {
    if (exportDetailsRef.current) exportDetailsRef.current.open = false;
  };

  const handleExportPptx = async () => {
    closeExportMenu();
    setIsExporting(true);
    try {
      await exportDeckToPptx(deck);
      setNotice('Presentasi .pptx berhasil diunduh.');
    } catch {
      setNotice('Gagal membuat .pptx. Coba ekspor PDF atau JSON.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    closeExportMenu();
    const ok = printHtmlDocument(buildDeckPrintHtml(deck));
    setNotice(ok ? 'Dialog cetak dibuka. Pilih “Save as PDF”.' : 'Cetak tidak didukung browser ini.');
  };

  const handleExportJson = () => {
    closeExportMenu();
    downloadBlob(
      new Blob([JSON.stringify(deck, null, 2)], { type: 'application/json;charset=utf-8' }),
      `${slugifyFilename(deck.title, 'presentasi')}.json`
    );
    setNotice('Cadangan .json berhasil diunduh.');
  };

  const currentPresentSlide = deck.slides[Math.min(presentIndex, slideCount - 1)] ?? deck.slides[0];

  const renderThumbnail = (slide: PresentationSlide, index: number) => (
    <button
      key={slide.id}
      type="button"
      onClick={() => setSelectedId(slide.id)}
      aria-label={`Pilih slide ${index + 1}`}
      aria-pressed={slide.id === selectedId}
      className={`relative w-full shrink-0 border-2 text-left transition-all cursor-pointer ${
        slide.id === selectedId
          ? 'border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]'
          : 'border-slate-300 hover:border-slate-500'
      }`}
    >
      <SlideCanvas slide={slide} theme={theme} index={index} total={slideCount} />
      <span className="absolute left-1 top-1 px-1.5 py-0.5 bg-[#1a1a1a] text-white font-mono-code text-[9px] font-bold">
        {index + 1}
      </span>
    </button>
  );

  return (
    <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-3.5 sm:p-5">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-3 pb-3 border-b-2 border-[#1a1a1a]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 font-mono-code text-[10px] font-bold uppercase mb-1">
              <span className="px-2 py-0.5 bg-[#1a1a1a] text-white">LAB PRESENTASI</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400">
                OFFLINE
              </span>
              <span className="px-2 py-0.5 bg-[#FAF8F5] text-slate-600 border border-slate-300">
                AUTOSAVE
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Presentation className="h-5 w-5 text-[#b7410e] shrink-0" />
              <input
                value={deck.title}
                onChange={(event) =>
                  updateDeck((previous) => ({ ...previous, title: event.target.value }))
                }
                aria-label="Judul presentasi"
                className="min-w-0 w-full max-w-xl bg-transparent border-b-2 border-transparent focus:border-[#1a1a1a] outline-none font-mono-code text-lg sm:text-2xl font-black text-[#1a1a1a] leading-tight"
              />
            </div>

            <p className="text-[11px] sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-2xl">
              Editor slide lokal: atur tema, tulis poin, tambah gambar, lalu putar layar penuh
              atau ekspor ke PowerPoint (.pptx) dan PDF. Tanpa akun, tanpa internet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startNewDeck}
              className="min-h-[40px] px-2.5 py-2 bg-white hover:bg-slate-100 border border-[#1a1a1a] font-mono-code text-[11px] font-bold text-[#1a1a1a] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              <span>Baru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPresentIndex(selectedIndex);
                setPresenting(true);
              }}
              className="min-h-[40px] px-2.5 py-2 bg-[#107c41] hover:brightness-110 border border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] font-mono-code text-[11px] font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Putar</span>
            </button>

            <details ref={exportDetailsRef} className="relative">
              <summary className="min-h-[40px] px-3 py-2 bg-[#b7410e] hover:brightness-110 border border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] font-mono-code text-[11px] font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <Download className="h-3.5 w-3.5" />
                <span>Unduh</span>
                <ChevronDown className="h-3 w-3" />
              </summary>
              <div className="absolute right-0 z-30 mt-1 w-60 bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-1.5">
                <ExportItem
                  label="PowerPoint (.pptx)"
                  hint="Slide asli, bisa dibuka di PowerPoint"
                  onClick={handleExportPptx}
                  disabled={isExporting}
                />
                <ExportItem
                  label="PDF (dialog cetak)"
                  hint="Satu slide per halaman"
                  onClick={handleExportPdf}
                  disabled={isExporting}
                />
                <ExportItem
                  label="Cadangan (.json)"
                  hint="Simpan untuk dipulihkan nanti"
                  onClick={handleExportJson}
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
      <div className="mt-3 bg-[#FAF8F5] border border-[#1a1a1a] p-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={addSlide}
          className="min-h-[36px] px-2.5 py-1.5 bg-[#1a1a1a] hover:bg-black border border-[#1a1a1a] font-mono-code text-[11px] font-bold text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Slide</span>
        </button>

        <IconButton label="Duplikat slide" onClick={duplicateSlide}>
          <Copy className="h-4 w-4" />
        </IconButton>
        <IconButton label="Naikkan slide" onClick={() => moveSlide(-1)} disabled={selectedIndex === 0}>
          <ArrowUp className="h-4 w-4" />
        </IconButton>
        <IconButton
          label="Turunkan slide"
          onClick={() => moveSlide(1)}
          disabled={selectedIndex >= slideCount - 1}
        >
          <ArrowDown className="h-4 w-4" />
        </IconButton>
        <IconButton label="Hapus slide" onClick={deleteSlide} disabled={slideCount <= 1}>
          <Trash2 className="h-4 w-4" />
        </IconButton>

        <span className="h-6 w-px bg-slate-300 mx-0.5" />

        <label className="flex items-center gap-1.5 font-mono-code text-[10px] font-bold text-slate-600">
          <span>TEMA</span>
          <select
            value={deck.theme}
            onChange={(event) =>
              updateDeck((previous) => ({
                ...previous,
                theme: event.target.value as DeckThemeId,
              }))
            }
            className="h-9 border border-slate-300 bg-white px-1.5 font-mono-code text-[11px] font-bold text-[#1a1a1a]"
          >
            {Object.values(DECK_THEMES).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <span className="ml-auto font-mono-code text-[10px] font-bold text-slate-500">
          {slideCount} slide • slide {selectedIndex + 1}
        </span>
      </div>

      {/* ================= WORKSPACE ================= */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[150px_minmax(0,1fr)] xl:grid-cols-[150px_minmax(0,1fr)_300px]">
        {/* Thumbnail desktop */}
        <aside className="hidden lg:flex lg:flex-col gap-2 max-h-[560px] overflow-y-auto pr-1">
          {deck.slides.map((slide, index) => renderThumbnail(slide, index))}
        </aside>

        {/* Pratinjau */}
        <div className="min-w-0">
          {/* Thumbnail mobile */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-2">
            {deck.slides.map((slide, index) => (
              <div key={slide.id} className="w-32 shrink-0">
                {renderThumbnail(slide, index)}
              </div>
            ))}
          </div>

          <div className="border-2 border-[#1a1a1a] bg-white p-1.5 shadow-[3px_3px_0px_#1a1a1a]">
            <SlideCanvas
              slide={selectedSlide}
              theme={theme}
              index={selectedIndex}
              total={totalSlides}
              className="border border-[#1a1a1a]"
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono-code text-[10px] font-bold text-slate-500">
              Pratinjau slide {selectedIndex + 1} dari {totalSlides}
            </span>
            <button
              type="button"
              onClick={() => {
                setPresentIndex(selectedIndex);
                setPresenting(true);
              }}
              className="min-h-[36px] px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-[#1a1a1a] font-mono-code text-[10px] font-bold text-[#1a1a1a] flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="h-3 w-3" />
              <span>Putar dari slide ini</span>
            </button>
          </div>

          {/* Form mobile: langsung di bawah pratinjau; desktop pindah ke kolom kanan */}
          <div className="xl:hidden mt-3">
            <SlideEditorForm
              slide={selectedSlide}
              onChange={updateSelectedSlide}
              onPickImage={() => imageInputRef.current?.click()}
              onRemoveImage={() => updateSelectedSlide({ image: undefined })}
            />
          </div>
        </div>

        {/* Form desktop */}
        <div className="hidden xl:block">
          <SlideEditorForm
            slide={selectedSlide}
            onChange={updateSelectedSlide}
            onPickImage={() => imageInputRef.current?.click()}
            onRemoveImage={() => updateSelectedSlide({ image: undefined })}
          />
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePick}
      />

      {/* ================= STATUS ================= */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 bg-white border border-[#1a1a1a] font-mono-code text-[10px] text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <span>{slideCount} slide</span>
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
        storageKey="praktek_deck_missions_v1"
        accent="#b7410e"
        missions={DECK_MISSIONS}
      />

      {/* ================= MODE PRESENTASI ================= */}
      {presenting && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Mode presentasi"
        >
          <div className="flex items-center justify-between gap-2 p-3 text-white">
            <span className="font-mono-code text-xs sm:text-sm font-bold truncate">
              {deck.title}
            </span>
            <button
              type="button"
              onClick={() => setPresenting(false)}
              aria-label="Keluar dari mode presentasi"
              className="h-10 w-10 shrink-0 border border-white/40 hover:bg-white/10 flex items-center justify-center cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="flex-1 min-h-0 flex items-center justify-center px-3 sm:px-8"
            onTouchStart={(event) => {
              touchStartXRef.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const start = touchStartXRef.current;
              const end = event.changedTouches[0]?.clientX;
              touchStartXRef.current = null;
              if (start == null || end == null) return;
              if (Math.abs(end - start) < 50) return;
              if (end < start) goNext();
              else goPrev();
            }}
          >
            <div className="w-full max-w-[1200px]">
              <SlideCanvas
                slide={currentPresentSlide}
                theme={theme}
                index={presentIndex}
                total={totalSlides}
                className="border border-white/20 shadow-2xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-3 text-white">
            <button
              type="button"
              onClick={goPrev}
              disabled={presentIndex === 0}
              aria-label="Slide sebelumnya"
              className="h-11 w-11 border border-white/40 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="font-mono-code text-xs font-bold min-w-[70px] text-center">
              {presentIndex + 1} / {totalSlides}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={presentIndex >= totalSlides - 1}
              aria-label="Slide berikutnya"
              className="h-11 w-11 border border-white/40 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center cursor-pointer"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          <p className="pb-3 text-center font-mono-code text-[10px] text-white/50">
            Panah kiri/kanan, spasi, atau geser untuk berpindah • Esc untuk keluar
          </p>
        </div>
      )}
    </div>
  );
};

interface SlideEditorFormProps {
  slide: PresentationSlide;
  onChange: (patch: Partial<PresentationSlide>) => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
}

const SlideEditorForm: React.FC<SlideEditorFormProps> = ({
  slide,
  onChange,
  onPickImage,
  onRemoveImage,
}) => {
  const layoutButton = (layout: SlideLayout, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => onChange({ layout })}
      aria-pressed={slide.layout === layout}
      className={`flex-1 min-h-[36px] px-2 py-1.5 border font-mono-code text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
        slide.layout === layout
          ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
          : 'bg-white text-[#1a1a1a] border-slate-300 hover:bg-slate-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="border-2 border-[#1a1a1a] bg-white p-3 sm:p-4 shadow-[3px_3px_0px_#1a1a1a]">
      <h3 className="font-mono-code text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-2">
        Edit slide
      </h3>

      <div className="flex gap-1.5 mb-3">
        {layoutButton('title', 'Judul', <LayoutTemplate className="h-3.5 w-3.5" />)}
        {layoutButton('content', 'Isi & Poin', <List className="h-3.5 w-3.5" />)}
      </div>

      <label className="block mb-2.5">
        <span className="block font-mono-code text-[10px] font-bold text-slate-600 uppercase mb-1">
          Judul slide
        </span>
        <input
          value={slide.title}
          onChange={(event) => onChange({ title: event.target.value })}
          className="w-full min-h-[40px] px-2.5 py-2 bg-[#FAF8F5] border border-[#1a1a1a] text-sm text-[#1a1a1a] outline-none focus:bg-white"
          placeholder="Judul slide"
        />
      </label>

      <label className="block mb-2.5">
        <span className="block font-mono-code text-[10px] font-bold text-slate-600 uppercase mb-1">
          {slide.layout === 'title' ? 'Subjudul / keterangan' : 'Poin-poin'}
        </span>
        <textarea
          value={slide.body}
          onChange={(event) => onChange({ body: event.target.value })}
          rows={slide.layout === 'title' ? 3 : 5}
          className="w-full px-2.5 py-2 bg-[#FAF8F5] border border-[#1a1a1a] text-sm text-[#1a1a1a] outline-none focus:bg-white resize-y"
          placeholder={
            slide.layout === 'title'
              ? 'Nama • Kelas • Mata Pelajaran'
              : 'Satu baris = satu poin\nContoh: Energi tidak dapat diciptakan'
          }
        />
        <span className="block text-[10px] text-slate-500 mt-1">
          {slide.layout === 'title'
            ? 'Teks pendukung di bawah judul.'
            : 'Satu baris = satu poin. Jaga maksimal 6 baris.'}
        </span>
      </label>

      <label className="block mb-2.5">
        <span className="block font-mono-code text-[10px] font-bold text-slate-600 uppercase mb-1">
          Catatan pembicara
        </span>
        <textarea
          value={slide.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          rows={3}
          className="w-full px-2.5 py-2 bg-[#FAF8F5] border border-[#1a1a1a] text-sm text-[#1a1a1a] outline-none focus:bg-white resize-y"
          placeholder="Hanya terlihat olehmu; ikut tersimpan di .pptx."
        />
      </label>

      <div>
        <span className="block font-mono-code text-[10px] font-bold text-slate-600 uppercase mb-1">
          Gambar pendukung
        </span>
        {slide.image ? (
          <div className="flex items-center gap-2">
            <img
              src={slide.image}
              alt="Gambar slide"
              className="h-16 w-24 object-cover border border-[#1a1a1a] bg-[#FAF8F5]"
            />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={onPickImage}
                className="min-h-[32px] px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 font-mono-code text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="h-3 w-3" />
                <span>Ganti</span>
              </button>
              <button
                type="button"
                onClick={onRemoveImage}
                className="min-h-[32px] px-2 py-1 bg-white hover:bg-red-50 border border-red-300 text-red-700 font-mono-code text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onPickImage}
            className="min-h-[40px] px-2.5 py-2 bg-[#FAF8F5] hover:bg-slate-100 border border-[#1a1a1a] font-mono-code text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Pilih gambar</span>
          </button>
        )}
      </div>
    </div>
  );
};
