import React from 'react';
import {
  RefreshCw,
  Bell,
  Volume2,
  VolumeX,
  Menu,
  ArrowLeft,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ADMIN_EMAILS } from '../services/firebaseAuth';

interface HeaderProps {
  activeTab: 'showcase' | 'master' | 'tasks' | 'students' | 'grades' | 'spreadsheet' | 'cek';
  onNavigate: (tab: 'showcase' | 'master' | 'tasks' | 'students' | 'grades' | 'spreadsheet' | 'cek', path?: string) => void;
  user: User | null;
  token: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onSwitchAdminProfile?: (email: string) => void;
  isLoggingIn: boolean;
  isSyncing: boolean;
  onManualSync: () => void;
  lastSyncedAt: string | null;
  unreadCount: number;
  onToggleNotificationDrawer: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  spreadsheetUrl: string;
  onOpenMobileSidebar?: () => void;
  onOpenSubmitModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  user,
  token,
  onLogin,
  onLogout,
  onSwitchAdminProfile,
  isLoggingIn,
  isSyncing,
  onManualSync,
  lastSyncedAt,
  unreadCount,
  onToggleNotificationDrawer,
  soundEnabled,
  onToggleSound,
  spreadsheetUrl,
  onOpenMobileSidebar,
  onOpenSubmitModal,
}) => {
  const isMasterMode = activeTab !== 'showcase' && activeTab !== 'cek';
  const isCekMode = activeTab === 'cek';

  return (
    <header
      id="main-app-header"
      className="h-14 sm:h-16 bg-[#F2EFEB] border-b-[1.5px] border-[#1a1a1a] flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 select-none"
    >
      {/* Top Left Navigation Anchor */}
      <div className="flex items-center space-x-3 min-w-0">
        {isMasterMode && (
          <button
            id="btn-mobile-menu"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-1.5 text-[#1a1a1a] hover:bg-white border border-[#1a1a1a] transition-colors cursor-pointer"
            title="Buka Menu Master"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <div
          onClick={() => onNavigate('showcase', '/')}
          className="font-mono-code text-xs sm:text-sm font-bold tracking-wider text-[#1a1a1a] cursor-pointer hover:text-[#2e59e6] transition-colors flex items-center gap-2"
        >
          <span>[ SISWAHUB v2.0 ]</span>
          {!isMasterMode && !isCekMode && (
            <span className="hidden sm:inline-block text-[11px] font-normal text-slate-500 font-mono-code border-l border-[#1a1a1a] pl-2">
              SHOWCASE KARYA SISWA
            </span>
          )}
          {isCekMode && (
            <span className="hidden sm:inline-block text-[11px] font-bold text-[#2e59e6] font-mono-code border-l border-[#1a1a1a] pl-2">
              CEK STATUS TUGAS SISWA
            </span>
          )}
        </div>

        {/* Master View Navigation Tabs (Visible when inside /master) */}
        {isMasterMode && (
          <div className="hidden md:flex items-center space-x-1 pl-4 border-l border-[#1a1a1a]">
            <button
              onClick={() => onNavigate('showcase', '/')}
              className="font-mono-code text-xs px-2.5 py-1 border border-transparent hover:border-[#1a1a1a] text-slate-600 hover:text-[#1a1a1a] transition-all flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="h-3 w-3" /> KE SHOWCASE (/)
            </button>
            <button
              onClick={() => onNavigate('cek', '/cek')}
              className="font-mono-code text-xs px-2.5 py-1 border border-[#2e59e6] text-[#2e59e6] hover:bg-blue-50 transition-all font-bold cursor-pointer"
            >
              PORTAL CEK (/cek)
            </button>
            <button
              onClick={() => onNavigate('master', '/master')}
              className={`font-mono-code text-xs px-2.5 py-1 border transition-all cursor-pointer ${
                activeTab === 'master'
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] font-bold'
                  : 'text-[#1a1a1a] border-transparent hover:border-[#1a1a1a]'
              }`}
            >
              KONTROL MASTER
            </button>
            <button
              onClick={() => onNavigate('students', '/master/students')}
              className={`font-mono-code text-xs px-2.5 py-1 border transition-all cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] font-bold'
                  : 'text-[#1a1a1a] border-transparent hover:border-[#1a1a1a]'
              }`}
            >
              DAFTAR SISWA
            </button>
            <button
              onClick={() => onNavigate('grades', '/master/grades')}
              className={`font-mono-code text-xs px-2.5 py-1 border transition-all cursor-pointer ${
                activeTab === 'grades'
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] font-bold'
                  : 'text-[#1a1a1a] border-transparent hover:border-[#1a1a1a]'
              }`}
            >
              PEMETAAN NILAI
            </button>
            <button
              onClick={() => onNavigate('tasks', '/master/tasks')}
              className={`font-mono-code text-xs px-2.5 py-1 border transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] font-bold'
                  : 'text-[#1a1a1a] border-transparent hover:border-[#1a1a1a]'
              }`}
            >
              REKAP TABEL
            </button>
            <button
              onClick={() => onNavigate('spreadsheet', '/master/spreadsheet')}
              className={`font-mono-code text-xs px-2.5 py-1 border transition-all cursor-pointer ${
                activeTab === 'spreadsheet'
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] font-bold'
                  : 'text-[#1a1a1a] border-transparent hover:border-[#1a1a1a]'
              }`}
            >
              SPREADSHEET
            </button>
          </div>
        )}
      </div>

      {/* Top Right Navigation Anchor */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Sound Toggle & Notification Bell (Visible only in Master Mode) */}
        {isMasterMode && (
          <>
            {/* Sound Toggle */}
            <button
              id="btn-toggle-sound"
              onClick={onToggleSound}
              title={soundEnabled ? 'Audio Notifikasi: Aktif' : 'Audio Notifikasi: Hening'}
              className={`p-1.5 border border-[#1a1a1a] transition-all cursor-pointer ${
                soundEnabled ? 'bg-white text-[#2e59e6]' : 'bg-[#E5E0D8] text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>

            {/* Notification Bell */}
            <button
              id="btn-notification-bell"
              onClick={onToggleNotificationDrawer}
              className="relative p-1.5 bg-white border border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#E5E0D8] transition-colors cursor-pointer"
              title="Notifikasi"
            >
              <Bell className="h-3.5 w-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#2e59e6] text-white font-mono-code text-[9px] w-4 h-4 flex items-center justify-center font-bold border border-[#1a1a1a]">
                  {unreadCount}
                </span>
              )}
            </button>
          </>
        )}

        {/* Manual Sync Button */}
        <button
          id="btn-manual-sync"
          onClick={onManualSync}
          disabled={isSyncing}
          className="p-1.5 bg-white border border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#E5E0D8] transition-colors disabled:opacity-50 cursor-pointer"
          title="Sinkronkan Spreadsheet"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-[#2e59e6]' : ''}`} />
        </button>

        {/* Login / User Status Indicator */}
        {isMasterMode && (
          <div className="flex items-center gap-2 font-mono-code text-xs">
            {/* Active Admin Profile Switcher */}
            <div className="hidden sm:flex items-center bg-white border border-[#1a1a1a] px-2 py-1 gap-1.5">
              <span className={`w-2 h-2 rounded-full inline-block ${token ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></span>
              <select
                value={user?.email || ADMIN_EMAILS[0]}
                onChange={(e) => onSwitchAdminProfile && onSwitchAdminProfile(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-[#1a1a1a] border-none focus:outline-hidden cursor-pointer"
                title="Pilih akun admin aktif"
              >
                {ADMIN_EMAILS.map((adminEmail) => (
                  <option key={adminEmail} value={adminEmail}>
                    {adminEmail} {adminEmail === user?.email ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Google OAuth Connect / Logout Button */}
            {token ? (
              <button
                onClick={onLogout}
                className="font-mono-code text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 px-2.5 py-1 border border-rose-600 bg-white transition-colors cursor-pointer"
                title="Keluar / Putuskan Sesi Google"
              >
                LOGOUT
              </button>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="font-mono-code text-xs font-bold text-white bg-[#1a1a1a] hover:bg-[#2e59e6] px-3 py-1 border border-[#1a1a1a] transition-colors cursor-pointer flex items-center gap-1.5"
                title="Hubungkan akun Google langsung untuk sinkronisasi menulis ke Google Spreadsheet"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                {isLoggingIn ? 'MENGHUBUNGKAN...' : 'LOGIN GOOGLE'}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
