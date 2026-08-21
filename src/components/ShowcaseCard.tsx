import React from 'react';
import { ArrowUpRight, Users } from 'lucide-react';
import { TaskSubmission, Student } from '../types';
import { WebPreview, getThemeIndex } from './WebPreview';
import { parseSubmissionDetails } from '../utils/studentResolver';

interface ShowcaseCardProps {
  task: TaskSubmission;
  students: Student[];
  onClick: () => void;
  index: number;
}

export const ShowcaseCard: React.FC<ShowcaseCardProps> = ({
  task,
  students,
  onClick,
  index,
}) => {
  const parsed = parseSubmissionDetails(task, students);
  const headerSubtitle = `${parsed.groupName} - ${parsed.className}`;

  // Deterministic theme selection based on task id/title/index
  const themeIndex = getThemeIndex(task.id || task.taskTitle, index);

  return (
    <div
      onClick={onClick}
      className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[6px_6px_0px_#1a1a1a] hover:-translate-y-0.5 transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
    >
      {/* Top Section: Website Mockup Screenshot with Centered Frosted Glass Overlay */}
      <div className="relative aspect-[16/11] sm:aspect-[4/3] w-full overflow-hidden bg-slate-900 flex items-center justify-center border-b-2 border-[#1a1a1a] select-none">
        {/* Background Web App Preview Graphic */}
        <WebPreview
          webUrl={parsed.linkWeb}
          pdfUrl={parsed.linkPdf}
          themeIndex={themeIndex}
          title={parsed.title}
          screenshotUrl={task.screenshotUrl}
        />

        {/* Centered Frosted Glass Rounded Overlay Badge */}
        <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 z-10 bg-black/25 transition-colors group-hover:bg-black/20">
          <div className="w-[92%] sm:w-[88%] bg-white/20 backdrop-blur-md border border-white/35 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-center shadow-lg transition-transform duration-200 group-hover:scale-[1.02]">
            {/* Sub-heading: Kelompok X - Kelas 8A */}
            <div className="text-white text-xs sm:text-sm font-sans font-medium tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-1">
              {headerSubtitle}
            </div>

            {/* Main Title */}
            <h3 className="text-white font-bold text-base sm:text-lg md:text-xl font-sans leading-tight mt-1 sm:mt-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] line-clamp-2">
              {parsed.title}
            </h3>

            {/* Attendance & Student Name Badge preview */}
            {parsed.attendanceNumbersText && parsed.attendanceNumbersText !== '-' && (
              <div className="mt-2 text-white/95 text-[10px] sm:text-[11px] font-mono-code flex items-center justify-center gap-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] bg-black/30 rounded-full py-0.5 px-2.5 mx-auto max-w-fit truncate">
                <Users className="h-3 w-3 shrink-0 text-emerald-300" />
                <span className="truncate">
                  Absen: {parsed.attendanceNumbersText}
                  {parsed.members.length > 0 && ` (${parsed.members[0].name}${parsed.members.length > 1 ? ` +${parsed.members.length - 1}` : ''})`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Section: Full-width Button */}
      <div className="p-3 sm:p-4 bg-white">
        <button
          type="button"
          className="w-full bg-white group-hover:bg-[#1a1a1a] group-hover:text-white border-2 border-[#1a1a1a] py-2.5 sm:py-3 px-4 text-center font-mono-code font-bold text-xs sm:text-sm text-[#1a1a1a] tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_#1a1a1a]"
        >
          <span>LIHAT DETAIL KARYA</span>
          <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </div>
  );
};
