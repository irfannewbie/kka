import React from 'react';
import {
  ExternalLink,
  Globe,
} from 'lucide-react';
import { TaskSubmission, Student } from '../types';
import { WebPreview, getThemeIndex } from './WebPreview';
import { parseSubmissionDetails } from '../utils/studentResolver';

interface ProjectDetailModalProps {
  task: TaskSubmission | null;
  students: Student[];
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  task,
  students,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !task) return null;

  const parsed = parseSubmissionDetails(task, students);
  const themeIndex = getThemeIndex(task.id || task.taskTitle);

  return (
    <div
      id="modal-project-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#FBF9F5] border-2 sm:border-[2.5px] border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] my-auto overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b-2 border-[#1a1a1a] bg-[#F2EFEB] select-none">
          <span className="font-mono-code text-xs sm:text-sm font-bold tracking-wider text-[#1a1a1a]">
            [ PROJECT SHOWCASE DETAILS ]
          </span>
          <button
            onClick={onClose}
            className="font-mono-code text-xs sm:text-sm font-bold text-[#1a1a1a] hover:text-[#2e59e6] transition-colors tracking-wider flex items-center gap-1 cursor-pointer"
          >
            [ CLOSE ✕ ]
          </button>
        </div>

        {/* 2-Column Content Layout */}
        <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Project Title, Author, Attendance & Links */}
          <div className="space-y-5">
            {/* Title & Group Header */}
            <div>
              <h2 className="font-serif italic font-normal text-3xl sm:text-4xl text-[#1a1a1a] leading-tight">
                {parsed.title || 'Tugas'}
              </h2>

              <div className="font-mono-code text-xs sm:text-sm font-bold text-[#1a1a1a] mt-2 flex items-center gap-1">
                <span className="text-[#2e59e6]">BY:</span>
                <span>
                  {parsed.groupName} - {parsed.className}
                </span>
              </div>
            </div>

            {/* List Details matching screenshot structure */}
            <div className="space-y-3.5 font-sans text-sm sm:text-[15px] text-[#1a1a1a] leading-relaxed">
              {/* Absen & Names integrated from Spreadsheet */}
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="font-medium text-slate-900">Absen :</span>
                  <span className="font-mono-code text-sm font-semibold text-slate-800">
                    {parsed.attendanceNumbersText}
                  </span>
                </div>

                {/* Integrated Student Names Tags */}
                {parsed.members.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {parsed.members.map((m, idx) => (
                      <span
                        key={`member-${m.attendanceNo || ''}-${m.nis || ''}-${idx}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono-code bg-white text-slate-800 border border-[#1a1a1a] px-2 py-0.5 shadow-[1.5px_1.5px_0px_#1a1a1a]"
                        title={`Siswa No Absen ${m.attendanceNo}`}
                      >
                        <span className="font-bold text-[#2e59e6]">#{m.attendanceNo}</span>
                        <span className="font-sans font-medium text-slate-900">{m.name}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Link YouTube */}
              <div className="flex items-baseline gap-1.5">
                <span className="font-medium text-slate-900 shrink-0">Link yt :</span>
                {parsed.linkYt && parsed.linkYt !== '-' ? (
                  <a
                    href={parsed.linkYt}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2e59e6] underline break-all hover:text-[#1a1a1a] transition-colors"
                  >
                    {parsed.linkYt}
                  </a>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>

              {/* Link Web */}
              <div className="flex items-baseline gap-1.5">
                <span className="font-medium text-slate-900 shrink-0">Link web :</span>
                {parsed.linkWeb ? (
                  <a
                    href={parsed.linkWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2e59e6] underline break-all hover:text-[#1a1a1a] transition-colors inline-flex items-center gap-1 font-semibold"
                  >
                    <span>{parsed.linkWeb}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>

              {/* Link Canva */}
              <div className="flex items-baseline gap-1.5">
                <span className="font-medium text-slate-900 shrink-0">Link canva :</span>
                {parsed.linkCanva && parsed.linkCanva !== '-' ? (
                  <a
                    href={parsed.linkCanva}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2e59e6] underline break-all hover:text-[#1a1a1a] transition-colors"
                  >
                    {parsed.linkCanva}
                  </a>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>

              {/* Pdf Drive Link */}
              <div className="flex items-baseline gap-1.5">
                <span className="font-medium text-slate-900 shrink-0">Pdf :</span>
                {parsed.linkPdf && parsed.linkPdf !== '-' ? (
                  <a
                    href={parsed.linkPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2e59e6] underline break-all hover:text-[#1a1a1a] transition-colors"
                  >
                    {parsed.linkPdf}
                  </a>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: PREVIEW WEB SISWA */}
          <div className="flex flex-col space-y-2">
            <div className="font-mono-code text-xs font-bold uppercase tracking-wider text-slate-500 select-none">
              PREVIEW WEB SISWA
            </div>

            {/* Browser Window Mockup Frame */}
            <div className="w-full bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden flex flex-col">
              {/* Browser Title Bar / Address Bar */}
              <div className="bg-[#1a1a1a] text-white px-3 py-2 flex items-center gap-2 select-none border-b border-[#1a1a1a]">
                {/* 3 traffic light buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                </div>

                {/* Address Bar */}
                <div className="flex-1 bg-white/10 text-slate-200 font-mono-code text-[10px] px-2.5 py-1 rounded flex items-center justify-between gap-1.5 truncate border border-white/15">
                  <div className="flex items-center gap-1.5 truncate">
                    <Globe className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{parsed.linkWeb || parsed.linkPdf || 'https://kantin-mesya.netlify.app/'}</span>
                  </div>
                </div>
              </div>

              {/* Web Content Canvas */}
              <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[340px]">
                <WebPreview
                  webUrl={parsed.linkWeb}
                  pdfUrl={parsed.linkPdf}
                  themeIndex={themeIndex}
                  title={parsed.title || task.taskTitle}
                  screenshotUrl={task.screenshotUrl}
                  interactive={true}
                />
              </div>

              {/* Bottom Quick Visit Link Bar */}
              {parsed.linkWeb && (
                <div className="p-3 bg-[#F2EFEB] border-t-2 border-[#1a1a1a] flex items-center justify-end">
                  <a
                    href={parsed.linkWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#2e59e6] hover:bg-[#1a1a1a] text-white font-mono-code text-xs font-bold px-4 py-2 transition-colors border border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] cursor-pointer"
                  >
                    <span>BUKA WEB ASLI</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
