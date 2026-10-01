import React from 'react';
import {
  LayoutDashboard,
  Users,
  Award,
  PlusCircle,
  LogOut,
  X,
  FileSpreadsheet,
  CheckSquare,
  Square,
  BookOpen,
  ClipboardList,
  Database,
  Grid,
  ArrowLeft,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ADMIN_EMAILS, SessionTimerInfo, formatDurationMMSS } from '../services/firebaseAuth';

interface SidebarProps {
  activeTab: 'showcase' | 'master' | 'tasks' | 'students' | 'grades' | 'calculator' | 'spreadsheet' | 'cek' | 'kelas7' | 'pengganti' | 'substitute_tasks' | 'kuis' | 'master_quiz';
  onNavigate: (tab: 'showcase' | 'master' | 'tasks' | 'students' | 'grades' | 'calculator' | 'spreadsheet' | 'cek' | 'kelas7' | 'pengganti' | 'substitute_tasks' | 'kuis' | 'master_quiz', path?: string) => void;
  onOpenSubmitModal: () => void;
  user: User | null;
  token: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onSwitchAdminProfile?: (email: string) => void;
  isLoggingIn: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  spreadsheetUrl: string;
  sessionInfo?: SessionTimerInfo;
  masterOpenSeconds?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  onOpenSubmitModal,
  user,
  token,
  onLogin,
  onLogout,
  onSwitchAdminProfile,
  isLoggingIn,
  isOpenMobile,
  onCloseMobile,
  spreadsheetUrl,
  sessionInfo,
  masterOpenSeconds = 0,
}) => {
  interface NavItem {
    id: 'master' | 'students' | 'grades' | 'calculator' | 'tasks' | 'substitute_tasks' | 'spreadsheet' | 'master_quiz';
    label: string;
    code: string;
    path: string;
  }

  const navItems: NavItem[] = [
    {
      id: 'master',
      label: 'KONTROL MASTER',
      code: '01',
      path: '/master',
    },
    {
      id: 'grades',
      label: 'PEMETAAN & REKAP NILAI',
      code: '02',
      path: '/master/grades',
    },
    {
      id: 'calculator',
      label: 'KALKULATOR AKADEMIK',
      code: '03',
      path: '/master/calculator',
    },
    {
      id: 'master_quiz',
      label: 'STUDIO KUIS & ARENA',
      code: '04',
      path: '/master/quiz',
    },
    {
      id: 'spreadsheet',
      label: 'SPREADSHEET VIEWER',
      code: '05',
      path: '/master/spreadsheet',
    },
  ];

  const content = (
    <div className="h-full flex flex-col justify-between bg-[#1a1a1a] text-[#F2EFEB] select-none border-r-2 border-[#1a1a1a]">
      {/* Brand Header & Return Link */}
      <div>
        <div className="p-5 border-b border-white/20 flex items-center justify-between">
          <div>
            <div className="font-mono-code text-xs font-bold tracking-widest text-[#2e59e6] uppercase">
              [ MASTER ADMINISTRATOR ]
            </div>
            <h1 className="font-serif-display italic font-bold text-2xl text-white tracking-tight mt-1">
              Panel Master
            </h1>
            <p className="font-mono-code text-[9px] tracking-wider text-slate-400 mt-1 uppercase">
              SISTEM MANAJEMEN SISWA & TUGAS
            </p>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-white hover:text-[#2e59e6] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Public & Student Portal Links */}
        <div className="p-3 pb-1 space-y-1.5">
          <button
            onClick={() => {
              onNavigate('showcase', '/');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono-code font-bold bg-white/10 hover:bg-white hover:text-[#1a1a1a] text-white border border-white/20 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <ArrowLeft className="h-3 w-3" />
              <span>SHOWCASE SISWA</span>
            </span>
            <span className="text-[10px] text-slate-300 font-mono-code">/</span>
          </button>

          <button
            onClick={() => {
              onNavigate('cek', '/cek');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono-code font-bold bg-[#2e59e6]/20 hover:bg-[#2e59e6] hover:text-white text-blue-300 border border-blue-500/30 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <CheckSquare className="h-3 w-3 text-blue-400" />
              <span>PORTAL CEK KELAS 8</span>
            </span>
            <span className="text-[10px] text-blue-300 font-mono-code">/cek</span>
          </button>

          <button
            onClick={() => {
              onNavigate('kelas7', '/kelas7');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono-code font-bold bg-emerald-500/20 hover:bg-emerald-500 hover:text-[#1a1a1a] text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <CheckSquare className="h-3 w-3 text-emerald-400" />
              <span>PORTAL CEK KELAS 7</span>
            </span>
            <span className="text-[10px] text-emerald-300 font-mono-code">/kelas7</span>
          </button>

          <button
            onClick={() => {
              onNavigate('pengganti', '/pengganti');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono-code font-bold bg-amber-500/20 hover:bg-amber-400 hover:text-[#1a1a1a] text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3 w-3 text-amber-400" />
              <span>TUGAS PENGGANTI</span>
            </span>
            <span className="text-[10px] text-amber-300 font-mono-code">/pengganti</span>
          </button>

          <button
            onClick={() => {
              onNavigate('kuis', '/kuis');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono-code font-bold bg-purple-500/20 hover:bg-purple-400 hover:text-[#1a1a1a] text-purple-200 border border-purple-400/30 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Award className="h-3 w-3 text-purple-300" />
              <span>PORTAL KUIS SISWA</span>
            </span>
            <span className="text-[10px] text-purple-200 font-mono-code">/kuis</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 font-mono-code">
          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
            MENU MASTER DATA
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onNavigate(item.id, item.path);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 text-xs font-bold transition-all text-left border cursor-pointer ${
                  isActive
                    ? 'bg-[#2e59e6] text-white border-[#2e59e6] shadow-[3px_3px_0px_#000]'
                    : 'text-slate-300 border-transparent hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-400">[{item.code}]</span>
                  <span>{item.label}</span>
                </div>
                {isActive && <span className="text-white font-bold">→</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Admin User Profile & Google Authorization Box */}
      <div className="p-3.5 border-t border-white/20 bg-black/40 font-mono-code">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">AKUN ADMIN AKTIF</span>
          <span className={`w-2 h-2 rounded-full ${token ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
        </div>

        {/* Profile Switcher */}
        <div className="mb-2">
          <select
            value={user?.email || ADMIN_EMAILS[0]}
            onChange={(e) => onSwitchAdminProfile && onSwitchAdminProfile(e.target.value)}
            className="w-full bg-[#2a2a2a] text-white text-xs font-bold p-2 border border-white/20 rounded-none focus:outline-hidden cursor-pointer"
          >
            {ADMIN_EMAILS.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[10px] text-slate-400 mb-2 leading-tight">
          {token ? (
            <span className="text-emerald-400 font-semibold">✓ Terhubung Google Sheets API</span>
          ) : (
            <span>Mode Master Aktif (Akses Penuh)</span>
          )}
        </div>

        {/* Live Session Countdown Box in Sidebar */}
        {sessionInfo && (
          <div className="mb-2.5 p-2 bg-[#141414] border border-white/20 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 text-slate-400 font-bold">
                <Clock className="h-3 w-3 text-[#2e59e6]" />
                <span>SISA SESI EDIT</span>
              </span>
              <span
                className={`font-black text-xs tracking-wider ${
                  !sessionInfo.isActive
                    ? 'text-amber-400'
                    : sessionInfo.urgencyLevel === 'critical'
                    ? 'text-rose-400 animate-pulse'
                    : sessionInfo.urgencyLevel === 'warning'
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }`}
              >
                {sessionInfo.isActive ? sessionInfo.formattedRemaining : '00:00'}
              </span>
            </div>

            <div className="w-full h-1.5 bg-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  !sessionInfo.isActive
                    ? 'bg-slate-600'
                    : sessionInfo.urgencyLevel === 'critical'
                    ? 'bg-rose-500'
                    : sessionInfo.urgencyLevel === 'warning'
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${sessionInfo.isActive ? sessionInfo.progressPercent : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-400">
              <span>
                Berjalan: {sessionInfo.isActive ? sessionInfo.formattedElapsed : formatDurationMMSS(masterOpenSeconds)}
              </span>
              {sessionInfo.isActive && sessionInfo.formattedExpiryTime && (
                <span>Habis: {sessionInfo.formattedExpiryTime}</span>
              )}
            </div>
          </div>
        )}

        {token ? (
          <div className="space-y-1.5">
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#2e59e6] hover:bg-blue-600 text-white border border-blue-400 text-[11px] font-bold cursor-pointer disabled:opacity-50"
              title="Perpanjang sesi 60 menit penuh"
            >
              <RefreshCw className={`h-3 w-3 ${isLoggingIn ? 'animate-spin' : ''}`} />
              <span>{isLoggingIn ? 'MEMPERBARUI...' : 'PERPANJANG SESI (+60M)'}</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              <span>PUTUSKAN SESI</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#2e59e6] hover:bg-blue-600 text-white text-xs font-bold border border-blue-400 cursor-pointer disabled:opacity-50"
          >
            <span>{isLoggingIn ? 'MENGHUBUNGKAN...' : 'LOGIN GOOGLE (60M)'}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Only visible in Master views) */}
      <aside className="hidden md:block w-64 h-full shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-xs flex">
          <div className="w-72 h-full bg-[#1a1a1a]">{content}</div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
};
