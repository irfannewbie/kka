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
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ADMIN_EMAILS } from '../services/firebaseAuth';

interface SidebarProps {
  activeTab: 'showcase' | 'master' | 'tasks' | 'students' | 'grades' | 'spreadsheet' | 'cek';
  onNavigate: (tab: 'showcase' | 'master' | 'tasks' | 'students' | 'grades' | 'spreadsheet' | 'cek', path?: string) => void;
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
}) => {
  interface NavItem {
    id: 'master' | 'students' | 'grades' | 'tasks' | 'spreadsheet';
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
      id: 'students',
      label: 'DAFTAR SISWA',
      code: '02',
      path: '/master/students',
    },
    {
      id: 'grades',
      label: 'PEMETAAN & REKAP NILAI',
      code: '03',
      path: '/master/grades',
    },
    {
      id: 'tasks',
      label: 'REKAPITULASI TABEL',
      code: '04',
      path: '/master/tasks',
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

        {/* Back to Public Showcase button */}
        <div className="p-3 pb-1">
          <button
            onClick={() => {
              onNavigate('showcase', '/');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono-code font-bold bg-white/10 hover:bg-white hover:text-[#1a1a1a] text-white border border-white/20 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>KEMBALI KE SHOWCASE</span>
            </span>
            <span className="text-[10px] text-slate-300 font-mono-code">/</span>
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

        {token ? (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold cursor-pointer"
          >
            <LogOut className="h-3 w-3" />
            <span>PUTUSKAN SESI</span>
          </button>
        ) : (
          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#2e59e6] hover:bg-blue-600 text-white text-xs font-bold border border-blue-400 cursor-pointer disabled:opacity-50"
          >
            <span>{isLoggingIn ? 'MENGHUBUNGKAN...' : 'LOGIN GOOGLE'}</span>
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
