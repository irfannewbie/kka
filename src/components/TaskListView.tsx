import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Trash2,
  Calendar,
  User,
  Users,
  PlusCircle,
  FileSpreadsheet,
  Globe,
  UploadCloud,
} from 'lucide-react';
import { TaskSubmission } from '../types';

interface TaskListViewProps {
  tasks: TaskSubmission[];
  onUpdateTask?: (task: TaskSubmission) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onOpenSubmitModal: () => void;
  groupsList: string[];
  onSyncAllTasksToSheet?: () => Promise<void>;
  isConnectedToSheet?: boolean;
  onLogin?: () => Promise<void>;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onOpenSubmitModal,
  groupsList,
  onSyncAllTasksToSheet,
  isConnectedToSheet,
  onLogin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'individu' | 'kelompok'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc'>('date-desc');
  const [isPushing, setIsPushing] = useState(false);

  const handlePushAllTasks = async () => {
    if (!isConnectedToSheet && onLogin) {
      await onLogin();
    }
    if (onSyncAllTasksToSheet) {
      setIsPushing(true);
      try {
        await onSyncAllTasksToSheet();
      } finally {
        setIsPushing(false);
      }
    }
  };

  // Filter tasks
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.studentNis && task.studentNis.includes(searchTerm)) ||
        (task.className && task.className.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.attendanceNo && task.attendanceNo.includes(searchTerm)) ||
        task.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.descriptionOrLink.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || task.taskType === typeFilter;
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesGroup = groupFilter === 'all' || task.group === groupFilter;

      return matchesSearch && matchesType && matchesStatus && matchesGroup;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') {
        return (b.id || '').localeCompare(a.id || '');
      }
      if (sortBy === 'date-asc') {
        return (a.id || '').localeCompare(b.id || '');
      }
      if (sortBy === 'name-asc') {
        return a.studentName.localeCompare(b.studentName);
      }
      return 0;
    });

  const isUrl = (str: string) => /^https?:\/\//i.test(str.trim());

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white border-[1.5px] border-[#1a1a1a] p-5 shadow-[4px_4px_0px_#1a1a1a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif-display italic font-bold text-2xl sm:text-3xl text-[#1a1a1a]">
              Daftar & Rekapitulasi Karya Siswa
            </h2>
            <span className="font-mono-code text-[11px] font-bold bg-[#2e59e6] text-white px-2 py-0.5 border border-[#1a1a1a]">
              {tasks.length} KARYA
            </span>
          </div>
          <p className="font-mono-code text-xs text-slate-500 mt-1">
            Data karya web dan proyek siswa yang tersinkronisasi dari Google Spreadsheet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSyncAllTasksToSheet && (
            <button
              onClick={handlePushAllTasks}
              disabled={isPushing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 font-mono-code text-xs font-bold text-white bg-[#2e59e6] hover:bg-[#1a1a1a] border border-[#1a1a1a] shadow-[3px_3px_0px_#000] transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className={`h-3.5 w-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
              <span>{isPushing ? 'MENYINKRONKAN...' : 'SINKRONKAN KE SPREADSHEET'}</span>
            </button>
          )}

          <button
            onClick={onOpenSubmitModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 font-mono-code text-xs font-bold text-white bg-[#1a1a1a] hover:bg-[#2e59e6] border border-[#1a1a1a] shadow-[3px_3px_0px_#000] transition-all cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>+ INPUT KARYA BARU</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-[1.5px] border-[#1a1a1a] p-4 shadow-[4px_4px_0px_#1a1a1a] flex flex-wrap gap-3 items-center justify-between font-mono-code text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#1a1a1a]" />
          <input
            type="text"
            placeholder="Cari judul, nama siswa, absen, atau tautan web..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-[#1a1a1a] bg-[#F2EFEB] focus:bg-white text-[#1a1a1a] focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Group Filter */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-[#1a1a1a] bg-white font-bold text-[#1a1a1a] focus:outline-hidden uppercase"
          >
            <option value="all">SEMUA UNIT KELOMPOK</option>
            {groupsList.map((g) => (
              <option key={g} value={g}>
                {g.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 border border-[#1a1a1a] bg-white font-bold text-[#1a1a1a] focus:outline-hidden"
          >
            <option value="date-desc">TERBARU</option>
            <option value="date-asc">TERLAMA</option>
            <option value="name-asc">NAMA SISWA (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border-[1.5px] border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1a1a1a] text-white font-mono-code text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3 border-b border-[#1a1a1a]">SISWA & NO. ABSEN</th>
                <th className="px-4 py-3 border-b border-[#1a1a1a]">JUDUL KARYA WEB</th>
                <th className="px-3 py-3 border-b border-[#1a1a1a]">KELOMPOK / KELAS</th>
                <th className="px-3 py-3 border-b border-[#1a1a1a]">TAUTAN KARYA / WEB</th>
                <th className="px-3 py-3 border-b border-[#1a1a1a] text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500 font-mono-code">
                    <FileSpreadsheet className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                    <p className="font-bold text-xs text-[#1a1a1a]">Tidak ada data karya ditemukan</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Silakan kirim karya baru atau periksa filter pencarian.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t, idx) => (
                  <tr key={`task-row-${t.id || ''}-${idx}`} className="hover:bg-[#F2EFEB] transition-colors">
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-sm text-[#1a1a1a]">{t.studentName}</div>
                      <div className="font-mono-code text-[10px] text-[#2e59e6] font-bold">
                        {t.studentNis ? `#${t.studentNis}` : t.attendanceNo ? `#Absen-${t.attendanceNo}` : '#-'}
                      </div>
                    </td>

                    {/* Task Title */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-xs text-[#1a1a1a]">{t.taskTitle}</div>
                      <div className="font-mono-code text-[10px] text-slate-500">{t.submittedAt}</div>
                    </td>

                    {/* Group & Class */}
                    <td className="px-3 py-3 font-mono-code">
                      <span className="inline-block px-1.5 py-0.5 border border-[#1a1a1a] bg-[#F2EFEB] text-[10px] font-bold">
                        {t.group} {t.className ? `• ${t.className}` : ''}
                      </span>
                    </td>

                    {/* Link */}
                    <td className="px-3 py-3 font-mono-code">
                      {isUrl(t.descriptionOrLink) ? (
                        <a
                          href={t.descriptionOrLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2e59e6] hover:underline font-bold flex items-center gap-1 max-w-[200px] truncate"
                        >
                          <Globe className="h-3 w-3 shrink-0" />
                          <span className="truncate">{t.descriptionOrLink}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-600 truncate max-w-[200px] block">
                          {t.descriptionOrLink || '-'}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-3 py-3 text-right space-x-1.5 whitespace-nowrap font-mono-code">
                      {isUrl(t.descriptionOrLink) && (
                        <a
                          href={t.descriptionOrLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 text-xs border border-[#1a1a1a] bg-white hover:bg-[#2e59e6] hover:text-white transition-colors inline-block"
                        >
                          BUKA WEB ↗
                        </a>
                      )}
                      <button
                        onClick={() => onDeleteTask(t.id)}
                        className="px-2 py-1 text-xs border border-rose-500 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                      >
                        HAPUS
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
