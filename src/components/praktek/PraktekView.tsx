import React, { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  BookOpen,
  Code2,
  FileSpreadsheet,
  FileText,
  MonitorSmartphone,
  Presentation,
} from 'lucide-react';
import { ExcelLabStudentWorkspace } from '../excel/ExcelLabStudentWorkspace';
import { StudioKodingPanel } from './StudioKodingPanel';
import { DocumentLabPanel } from './DocumentLabPanel';
import { PresentationLabPanel } from './PresentationLabPanel';

export type PraktekToolId = 'excel' | 'studio' | 'doc' | 'presentation';

interface PraktekViewProps {
  /** Diambil dari query `?tool=` saat halaman dibuka dari tautan lain. */
  initialTool?: string | null;
  /** Diambil dari query `?view=guide` untuk membuka panduan rumus Excel langsung. */
  initialView?: string | null;
  onNavigateMateri?: () => void;
  onNavigateHome?: () => void;
  onNavigateCek?: () => void;
  onNavigateKelas7?: () => void;
}

interface PraktekTool {
  id: PraktekToolId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  accentSoft: string;
  badge: string;
}

const TOOLS: PraktekTool[] = [
  {
    id: 'excel',
    label: 'Laboratorium Excel',
    shortLabel: 'Lab Excel',
    description: 'Spreadsheet interaktif, rumus, dan tugas praktik',
    icon: FileSpreadsheet,
    accent: '#107c41',
    accentSoft: '#dcfce7',
    badge: 'OFFLINE',
  },
  {
    id: 'studio',
    label: 'Studio Koding',
    shortLabel: 'Koding',
    description: 'Blockly, Blockly Games, dan Scratch 3.0',
    icon: Code2,
    accent: '#2e59e6',
    accentSoft: '#dbeafe',
    badge: 'INTERNET',
  },
  {
    id: 'doc',
    label: 'Dokumen',
    shortLabel: 'Dokumen',
    description: 'Pengolah kata lokal (.docx, PDF)',
    icon: FileText,
    accent: '#2b47b5',
    accentSoft: '#dbe4ff',
    badge: 'OFFLINE',
  },
  {
    id: 'presentation',
    label: 'Presentasi',
    shortLabel: 'Presentasi',
    description: 'Editor slide lokal (.pptx, PDF)',
    icon: Presentation,
    accent: '#b7410e',
    accentSoft: '#ffedd5',
    badge: 'OFFLINE',
  },
];

const normalizeTool = (raw?: string | null): PraktekToolId => {
  const value = (raw ?? '').toLowerCase().trim();
  if (value === 'studio' || value === 'koding' || value === 'blockly' || value === 'scratch') {
    return 'studio';
  }
  if (
    value === 'doc' ||
    value === 'dokumen' ||
    value === 'document' ||
    value === 'word' ||
    value === 'wordcraft'
  ) {
    return 'doc';
  }
  if (
    value === 'presentation' ||
    value === 'presentasi' ||
    value === 'deck' ||
    value === 'deckcraft' ||
    value === 'ppt' ||
    value === 'powerpoint' ||
    value === 'slide' ||
    value === 'slides'
  ) {
    return 'presentation';
  }
  // Spreadsheet tetap diarahkan ke Laboratorium Excel (offline).
  return 'excel';
};

const noop = () => undefined;

/**
 * Ruang Praktik: pusat seluruh alat praktik Informatika & KKA.
 * Mobile-first: tab alat dapat digeser di ponsel, sidebar penuh di desktop.
 */
export const PraktekView: React.FC<PraktekViewProps> = ({
  initialTool,
  initialView,
  onNavigateMateri,
  onNavigateHome,
  onNavigateCek,
  onNavigateKelas7,
}) => {
  const [activeTool, setActiveTool] = useState<PraktekToolId>(() => normalizeTool(initialTool));

  // Simpan pilihan alat ke URL agar bisa di-bookmark / dibagikan.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.pathname = '/praktek';
    url.searchParams.set('tool', activeTool);
    if (activeTool !== 'excel') url.searchParams.delete('view');
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
  }, [activeTool]);

  const active = useMemo(
    () => TOOLS.find((tool) => tool.id === activeTool) ?? TOOLS[0],
    [activeTool]
  );

  const excelInitialTab = initialView === 'guide' ? 'guide' : 'home';

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* ================= HERO (mobile-first) ================= */}
      <section className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-3.5 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5 font-mono-code text-[10px] font-bold">
              <span className="px-2 py-0.5 bg-[#1a1a1a] text-white">RUANG PRAKTIK</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-400">
                4 ALAT
              </span>
              <span className="px-2 py-0.5 bg-[#FAF8F5] text-slate-600 border border-slate-300">
                GRATIS
              </span>
              <span className="hidden sm:inline px-2 py-0.5 bg-[#FAF8F5] text-slate-600 border border-slate-300">
                INFORMATIKA &amp; KKA
              </span>
            </div>
            <h1 className="font-mono-code text-lg sm:text-2xl font-black tracking-tight text-[#1a1a1a]">
              Praktek Informatika &amp; KKA
            </h1>
            <p className="text-[11px] sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-3xl">
              Satu tempat untuk semua praktik: <strong>Laboratorium Excel</strong>,{' '}
              <strong>Studio Koding</strong> (Blockly &amp; Scratch), serta{' '}
              <strong>Dokumen</strong> dan <strong>Presentasi</strong>. Dokumen dan Presentasi
              adalah editor lokal yang tersimpan otomatis di browser — tanpa akun, tanpa
              langganan, dan bisa diekspor ke Word/PowerPoint atau PDF. Nyaman dari ponsel, lebih
              lapang di desktop.
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateMateri}
            className="shrink-0 min-h-[44px] px-2.5 sm:px-3 py-2 bg-[#FAF8F5] hover:bg-slate-200 border border-[#1a1a1a] text-[#1a1a1a] font-mono-code text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#1a1a1a]"
            title="Kembali ke halaman Materi"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Materi</span>
          </button>
        </div>
      </section>

      {/* ================= TAB ALAT — MOBILE (sticky) ================= */}
      <nav
        aria-label="Pilih alat praktik"
        className="md:hidden sticky top-0 z-20 -mx-3.5 px-3.5 py-2 bg-[#F2EFEB]/95 backdrop-blur border-y border-[#1a1a1a]"
      >
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'thin' }}>
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = tool.id === activeTool;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                aria-pressed={isActive}
                style={
                  isActive ? { backgroundColor: tool.accent, borderColor: tool.accent } : undefined
                }
                className={`shrink-0 min-h-[44px] px-3 py-2 border-2 font-mono-code text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'text-white shadow-[2px_2px_0px_#1a1a1a]'
                    : 'bg-white text-slate-700 border-[#1a1a1a]/30'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tool.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="md:grid md:grid-cols-[244px_minmax(0,1fr)] md:gap-4 md:items-start">
        {/* ================= SIDEBAR — DESKTOP ================= */}
        <aside className="hidden md:block md:sticky md:top-2 space-y-2">
          <div className="bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] p-2">
            <div className="font-mono-code text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1.5 py-1">
              Pilih Alat Praktik
            </div>
            <div className="space-y-1.5 mt-1">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = tool.id === activeTool;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveTool(tool.id)}
                    aria-pressed={isActive}
                    style={
                      isActive
                        ? { backgroundColor: tool.accent, borderColor: tool.accent }
                        : undefined
                    }
                    className={`w-full text-left px-2.5 py-2.5 border-2 transition-all cursor-pointer flex items-start gap-2 ${
                      isActive
                        ? 'text-white shadow-[2px_2px_0px_#1a1a1a]'
                        : 'bg-[#FAF8F5] hover:bg-white text-slate-800 border-[#1a1a1a]/25'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="min-w-0">
                      <span className="block font-mono-code text-xs font-bold leading-tight">
                        {tool.label}
                      </span>
                      <span
                        className={`block text-[10px] leading-snug mt-0.5 ${
                          isActive ? 'text-white/85' : 'text-slate-500'
                        }`}
                      >
                        {tool.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#FAF8F5] border border-[#1a1a1a] p-3 space-y-2">
            <div className="font-mono-code text-[10px] font-bold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5">
              <MonitorSmartphone className="h-3.5 w-3.5" />
              <span>Catatan Praktik</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Lab Excel, Dokumen, dan Presentasi bisa dipakai tanpa internet serta tersimpan
              otomatis di browser. Studio Koding membutuhkan internet. Semua alat gratis dan
              tidak memerlukan akun.
            </p>
            {onNavigateMateri && (
              <button
                type="button"
                onClick={onNavigateMateri}
                className="w-full min-h-[40px] px-2 py-2 bg-white hover:bg-slate-100 border border-[#1a1a1a] font-mono-code text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Kembali ke Materi</span>
              </button>
            )}
          </div>
        </aside>

        {/* ================= AREA KERJA ================= */}
        <section className="min-w-0" aria-label={`Alat praktik: ${active.label}`}>
          {activeTool === 'excel' && (
            <ExcelLabStudentWorkspace
              onNavigateHome={onNavigateMateri ?? onNavigateHome ?? noop}
              onNavigateCek={onNavigateCek}
              onNavigateKelas7={onNavigateKelas7}
              initialSubTab={excelInitialTab}
            />
          )}

          {activeTool === 'studio' && <StudioKodingPanel />}

          {activeTool === 'doc' && <DocumentLabPanel />}

          {activeTool === 'presentation' && <PresentationLabPanel />}
        </section>
      </div>
    </div>
  );
};
