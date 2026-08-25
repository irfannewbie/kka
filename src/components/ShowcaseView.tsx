import React, { useState } from 'react';
import {
  Search,
  FileSpreadsheet,
  Globe,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowUpRight,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { Student, TaskSubmission } from '../types';
import { ProjectDetailModal } from './ProjectDetailModal';
import { ShowcaseCard } from './ShowcaseCard';
import { sortTasksByClassAndGroup } from '../utils/studentResolver';

interface ShowcaseViewProps {
  students: Student[];
  tasks: TaskSubmission[];
  spreadsheetUrl: string;
}

const CLASS_OPTIONS = [
  'Semua Kelas',
  'Kelas 8A',
  'Kelas 8B',
  'Kelas 8C',
  'Kelas 8D',
  'Kelas 8E',
  'Kelas 8F',
  'Kelas 8G',
  'Kelas 8H',
];

// Helper to normalize class string (e.g. "Kelas 8A" -> "8A", "8-A" -> "8A", "VIII A" -> "8A")
function normalizeClass(c?: string): string {
  if (!c) return '';
  return c
    .toUpperCase()
    .replace(/^KELAS\s*/i, '')
    .replace(/^VIII\s*/i, '8')
    .replace(/[^0-9A-Z]/g, '');
}

export const ShowcaseView: React.FC<ShowcaseViewProps> = ({
  students,
  tasks,
  spreadsheetUrl,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('Semua Kelas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<TaskSubmission | null>(null);

  // Check if a task belongs to the selected class
  const isTaskInClass = (task: TaskSubmission, classFilter: string): boolean => {
    if (classFilter === 'Semua Kelas') return true;
    const targetCode = normalizeClass(classFilter);
    if (!targetCode) return true;

    // 1. Direct class property on task
    if (task.className && (normalizeClass(task.className) === targetCode || task.className.toUpperCase().includes(targetCode))) {
      return true;
    }

    // 2. Lookup student from student database
    const matchingStudent = students.find((s) => {
      if (task.studentNis && s.nis && s.nis.trim() === task.studentNis.trim()) return true;
      if (task.studentName && s.name && s.name.trim().toLowerCase() === task.studentName.trim().toLowerCase()) return true;
      return false;
    });

    if (matchingStudent && matchingStudent.className) {
      if (
        normalizeClass(matchingStudent.className) === targetCode ||
        matchingStudent.className.toUpperCase().includes(targetCode)
      ) {
        return true;
      }
    }

    // 3. Check group / task title if it specifies class (e.g. "Kelompok 1 8A")
    if (task.group && normalizeClass(task.group).includes(targetCode)) {
      return true;
    }
    if (task.taskTitle && normalizeClass(task.taskTitle).includes(targetCode)) {
      return true;
    }

    return false;
  };

  // Compute task count per class for the dropdown
  const getClassCount = (clsOption: string): number => {
    if (clsOption === 'Semua Kelas') return tasks.length;
    return tasks.filter((t) => isTaskInClass(t, clsOption)).length;
  };

  // Filter and sort tasks based on selected class, search query, and sequential class/group order
  const filteredTasks = sortTasksByClassAndGroup(
    tasks.filter((task) => {
      const matchesClass = isTaskInClass(task, selectedClassFilter);

      const matchesSearch =
        !searchQuery ||
        task.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.taskTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.group?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.className && task.className.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.studentNis && task.studentNis.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.attendanceNo && task.attendanceNo.includes(searchQuery));

      return matchesClass && matchesSearch;
    }),
    students
  );

  return (
    <div className="space-y-6">
      {/* 1. CENTERED EDITORIAL HERO HEADER (WITHOUT ANY INPUT BUTTONS) */}
      <header className="text-center py-8 sm:py-12 border-b-[1.5px] border-[#1a1a1a] bg-white/40 -mx-3.5 sm:-mx-5 px-4 shadow-2xs">
        <div className="inline-block px-3 py-1 bg-[#1a1a1a] text-white font-mono-code text-[10px] font-bold tracking-widest uppercase mb-3">
          [ SHOWCASE WEB ]
        </div>
        <h1 className="font-serif-display italic font-bold text-4xl sm:text-6xl md:text-7xl text-[#1a1a1a] tracking-tight leading-none">
          Arsip Karya Siswa
        </h1>
        <span className="font-mono-code text-[11px] sm:text-xs font-bold text-slate-600 mt-2.5 block tracking-wider uppercase">
          TUGAS MAPEL KODING DAN KECERDASAN ARTIFISIAL
        </span>
      </header>

      {/* 2. CLASS FILTER DROPDOWN & SEARCH BAR */}
      <div className="bg-white border-[1.5px] border-[#1a1a1a] p-3.5 sm:p-4 shadow-[4px_4px_0px_#1a1a1a]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Class Filter Dropdown */}
          <div className="flex items-center gap-2.5">
            <label
              htmlFor="class-select-dropdown"
              className="font-mono-code text-xs font-bold text-[#1a1a1a] uppercase whitespace-nowrap flex items-center gap-1.5"
            >
              <Filter className="h-3.5 w-3.5 text-[#2e59e6]" />
              <span>FILTER KELAS:</span>
            </label>
            <div className="relative min-w-[200px] sm:min-w-[230px]">
              <select
                id="class-select-dropdown"
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="w-full appearance-none bg-[#F2EFEB] hover:bg-white border-[1.5px] border-[#1a1a1a] px-3.5 py-2 pr-8 font-mono-code text-xs font-bold text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] transition-colors cursor-pointer focus:outline-hidden focus:bg-white"
              >
                {CLASS_OPTIONS.map((cls) => {
                  const count = getClassCount(cls);
                  return (
                    <option key={cls} value={cls} className="font-mono-code text-xs py-1 text-[#1a1a1a]">
                      {cls.toUpperCase()} ({count})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a1a1a] pointer-events-none" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[220px] sm:min-w-[280px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#1a1a1a]" />
            <input
              type="text"
              placeholder="Cari karya / siswa / NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F2EFEB] border-[1.5px] border-[#1a1a1a] pl-9 pr-3 py-2 font-mono-code text-xs text-[#1a1a1a] placeholder:text-slate-500 focus:outline-hidden focus:bg-white shadow-[2px_2px_0px_#1a1a1a]"
            />
          </div>
        </div>
      </div>

      {/* 4. MAIN SHOWCASE GRID (PURE KARYA DISPLAY — NO INPUT BUTTONS) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="font-mono-code text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
            KATALOG KARYA WEB ({filteredTasks.length} ITEMS)
          </span>
          <span className="font-mono-code text-[11px] text-slate-500">
            KLIK KARTU UNTUK MELIHAT PREVIEW & DETAIL
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="bg-white border-[1.5px] border-[#1a1a1a] p-12 text-center shadow-[4px_4px_0px_#1a1a1a] space-y-3">
            <FileSpreadsheet className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="font-serif-display italic font-bold text-2xl text-[#1a1a1a]">
              Belum Ada Karya Ditemukan
            </h3>
            <p className="font-mono-code text-xs text-slate-500 max-w-md mx-auto">
              Tidak ada karya siswa yang cocok dengan filter atau kata kunci saat ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task, index) => (
              <ShowcaseCard
                key={`showcase-task-${task.id || ''}-${index}`}
                task={task}
                students={students}
                index={index}
                onClick={() => setSelectedTaskForModal(task)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. PROJECT DETAIL MODAL */}
      <ProjectDetailModal
        task={selectedTaskForModal}
        students={students}
        isOpen={!!selectedTaskForModal}
        onClose={() => setSelectedTaskForModal(null)}
      />
    </div>
  );
};
