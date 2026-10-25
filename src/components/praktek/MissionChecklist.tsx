import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';

export interface LabMission {
  title: string;
  desc: string;
}

interface MissionChecklistProps {
  storageKey: string;
  missions: LabMission[];
  accent: string;
}

type MissionProgress = Record<string, boolean>;

function loadProgress(storageKey: string): MissionProgress {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as MissionProgress) : {};
  } catch {
    return {};
  }
}

/** Checklist misi praktik yang tersimpan di localStorage. */
export const MissionChecklist: React.FC<MissionChecklistProps> = ({ storageKey, missions, accent }) => {
  const [progress, setProgress] = useState<MissionProgress>(() => loadProgress(storageKey));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // localStorage penuh/diblokir: checklist tetap bisa dipakai selama sesi.
    }
  }, [progress, storageKey]);

  const completed = useMemo(
    () => missions.filter((_, index) => progress[String(index)]).length,
    [missions, progress]
  );

  const percent = Math.round((completed / missions.length) * 100);

  const toggle = (index: number) => {
    setProgress((previous) => ({ ...previous, [String(index)]: !previous[String(index)] }));
  };

  return (
    <details className="mt-3 bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
      <summary className="cursor-pointer list-none p-3 flex items-center justify-between gap-2 font-mono-code text-xs font-bold text-[#1a1a1a]">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>MISI PRAKTIK</span>
          <span className="text-slate-500 font-normal">
            {completed}/{missions.length} selesai
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </summary>

      <div className="p-3 border-t-2 border-[#1a1a1a]">
        <div className="h-2 w-full bg-[#E5E0D8] border border-[#1a1a1a] overflow-hidden mb-3">
          <div
            className="h-full transition-all"
            style={{ width: `${percent}%`, backgroundColor: accent }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {missions.map((mission, index) => {
            const done = Boolean(progress[String(index)]);
            return (
              <button
                key={mission.title}
                type="button"
                onClick={() => toggle(index)}
                aria-pressed={done}
                className={`w-full text-left p-3 min-h-[56px] border transition-all cursor-pointer flex items-start gap-2.5 ${
                  done ? 'bg-emerald-50 border-emerald-500' : 'bg-[#FAF8F5] border-[#1a1a1a] hover:bg-white'
                }`}
              >
                <CheckCircle2
                  className={`h-5 w-5 shrink-0 mt-0.5 ${done ? 'text-emerald-600' : 'text-slate-400'}`}
                />
                <span className="min-w-0">
                  <span
                    className={`block font-mono-code text-xs font-bold ${
                      done ? 'text-emerald-900 line-through' : 'text-[#1a1a1a]'
                    }`}
                  >
                    {index + 1}. {mission.title}
                  </span>
                  <span className="block text-[11px] text-slate-600 leading-relaxed mt-0.5">
                    {mission.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
};
