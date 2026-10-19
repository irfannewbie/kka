import React from 'react';
import {
  RefreshCw,
  Bell,
  Volume2,
  VolumeX,
  Menu,
  Clock,
  Zap,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ADMIN_EMAILS, SessionTimerInfo, formatDurationMMSS } from '../services/firebaseAuth';

interface HeaderProps {
  activeTab: 'showcase' | 'master' | 'tasks' | 'students' | 'grades' | 'calculator' | 'spreadsheet' | 'cek' | 'kelas7' | 'pengganti' | 'substitute_tasks' | 'kuis' | 'master_quiz' | 'excel' | 'master_excel';
  onNavigate: (tab: 'showcase' | 'master' | 'tasks' | 'students' | 'grades' | 'calculator' | 'spreadsheet' | 'cek' | 'kelas7' | 'pengganti' | 'substitute_tasks' | 'kuis' | 'master_quiz' | 'excel' | 'master_excel', path?: string) => void;
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
  sessionInfo?: SessionTimerInfo;
  masterOpenSeconds?: number;
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
  sessionInfo,
  masterOpenSeconds = 0,
}) => {
  const isMasterMode =
    activeTab !== 'showcase' &&
    activeTab !== 'cek' &&
    activeTab !== 'kelas7' &&
    activeTab !== 'pengganti' &&
    activeTab !== 'kuis' &&
    activeTab !== 'excel';
  const isCekMode = activeTab === 'cek';
  const isKelas7Mode = activeTab === 'kelas7';
  const isPenggantiMode = activeTab === 'pengganti';
  const isKuisMode = activeTab === 'kuis';
  const isExcelMode = activeTab === 'excel';
  const isMasterExcelMode = activeTab === 'master_excel';

  return (
    <div className="flex flex-col shrink-0 z-20 select-none">
      <header
        id="main-app-header"
        className="h-14 sm:h-16 bg-[#F2EFEB] border-b-[1.5px] border-[#1a1a1a] flex items-center justify-between px-3 sm:px-6 shrink-0"
      >
        {/* Top Left Navigation Anchor */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
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
            className="font-mono-code text-xs sm:text-sm font-bold tracking-wider text-[#1a1a1a] cursor-pointer hover:text-[#2e59e6] transition-colors flex items-center gap-1.5 sm:gap-2 shrink-0"
          >
            <span>[ SISWAHUB v2.0 ]</span>
            {!isMasterMode && !isCekMode && !isKelas7Mode && !isPenggantiMode && !isKuisMode && !isExcelMode && !isMasterExcelMode && (
              <span className="hidden sm:inline-block text-[11px] font-normal text-slate-500 font-mono-code border-l border-[#1a1a1a] pl-2">
                SHOWCASE KARYA SISWA
              </span>
            )}
            {isCekMode && (
              <span className="hidden sm:inline-block text-[11px] font-bold text-[#2e59e6] font-mono-code border-l border-[#1a1a1a] pl-2">
                CEK STATUS TUGAS SISWA (KELAS 8)
              </span>
            )}
            {isKelas7Mode && (
              <span className="hidden sm:inline-block text-[11px] font-bold text-[#107c41] font-mono-code border-l border-[#1a1a1a] pl-2">
                KELAS 7: LABORATORIUM EXCEL & CEK NILAI
              </span>
            )}
            {isPenggantiMode && (
              <span className="hidden sm:inline-block text-[11px] font-bold text-amber-700 font-mono-code border-l border-[#1a1a1a] pl-2">
                TUGAS PENGGANTI KKA 2
              </span>
            )}
            {isKuisMode && (
              <span className="hidden sm:inline-block text-[11px] font-bold text-emerald-800 font-mono-code border-l border-[#1a1a1a] pl-2">
                PORTAL KUIS & LAB KODING INTERAKTIF
              </span>
            )}
            {isExcelMode && (
              <span className="hidden sm:inline-block text-[11px] font-bold text-[#107c41] font-mono-code border-l border-[#1a1a1a] pl-2">
                LABORATORIUM EXCEL & SPREADSHEET
              </span>
            )}
            {isMasterExcelMode && (
              <span className="hidden sm:inline-block text-[11px] font-bold text-[#107c41] font-mono-code border-l border-[#1a1a1a] pl-2">
                PANEL MASTER - LABORATORIUM EXCEL
              </span>
            )}
          </div>
        </div>

        {/* Top Right Navigation Anchor */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Quick links to public views when in Master Mode */}
          {isMasterMode && (
            <div className="hidden sm:flex items-center gap-1.5 mr-1 font-mono-code">
              <button
                onClick={() => onNavigate('kelas7', '/kelas7')}
                className="px-2 py-1 font-bold border border-[#1a1a1a] bg-[#107c41] hover:bg-[#0c5c30] text-white text-[10px] transition-all flex items-center gap-1 cursor-pointer shadow-[1px_1px_0px_#1a1a1a]"
                title="Lihat Laboratorium Excel Kelas 7"
              >
                <span>📊 LAB EXCEL</span>
              </button>
              <button
                onClick={() => onNavigate('showcase', '/')}
                className="px-2 py-1 font-bold border border-[#1a1a1a] bg-white hover:bg-slate-100 text-[#1a1a1a] text-[10px] transition-all flex items-center gap-1 cursor-pointer shadow-[1px_1px_0px_#1a1a1a]"
                title="Kembali ke Web Publik / Showcase"
              >
                <span>🌐 WEB PUBLIK</span>
              </button>
            </div>
          )}

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

          {/* Login / User Status Indicator (Only in Master mode, hidden on Homepage and /cek) */}
          {isMasterMode && (
            <div className="flex items-center gap-1.5 sm:gap-2 font-mono-code text-xs">
              {/* Live Session Countdown Badge */}
              {sessionInfo && (
                <div
                  className={`flex items-center border border-[#1a1a1a] px-2 py-1 gap-1.5 text-[10px] sm:text-[11px] font-bold ${
                    !sessionInfo.isActive
                      ? 'bg-amber-100 text-amber-950'
                      : sessionInfo.urgencyLevel === 'critical'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : sessionInfo.urgencyLevel === 'warning'
                      ? 'bg-amber-300 text-[#1a1a1a]'
                      : 'bg-emerald-100 text-emerald-950'
                  }`}
                  title={
                    sessionInfo.isActive
                      ? `Sisa waktu sesi tulis Google: ${sessionInfo.formattedRemaining} (Berjalan: ${sessionInfo.formattedElapsed}${
                          sessionInfo.formattedExpiryTime ? ` • Habis pkl ${sessionInfo.formattedExpiryTime}` : ''
                        })`
                      : `Sesi tulis Google belum aktif. Durasi buka panel Master: ${formatDurationMMSS(masterOpenSeconds)}`
                  }
                >
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden md:inline">
                    {sessionInfo.isActive ? 'SESI:' : 'SESI EDIT:'}
                  </span>
                  <span className="font-black tracking-wider">
                    {sessionInfo.isActive ? sessionInfo.formattedRemaining : '00:00'}
                  </span>
                  {sessionInfo.isActive && (
                    <button
                      type="button"
                      onClick={onLogin}
                      disabled={isLoggingIn}
                      className="ml-0.5 px-1.5 py-0.5 bg-[#1a1a1a] hover:bg-[#2e59e6] text-white text-[9px] font-bold uppercase transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-0.5"
                      title="Perpanjang sesi Google 60 menit agar tidak login ulang saat mengedit data"
                    >
                      <Zap className="h-2.5 w-2.5 text-amber-300" />
                      <span className="hidden xl:inline">+60M</span>
                    </button>
                  )}
                </div>
              )}

              {/* Active Admin Profile Switcher */}
              <div className="hidden lg:flex items-center bg-white border border-[#1a1a1a] px-2 py-1 gap-1.5">
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
                  className="font-mono-code text-[11px] sm:text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 px-2.5 py-1 border border-rose-600 bg-white transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Keluar / Putuskan Sesi Google"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  LOGOUT
                </button>
              ) : (
                <button
                  onClick={onLogin}
                  disabled={isLoggingIn}
                  className="font-mono-code text-[11px] sm:text-xs font-bold text-white bg-[#1a1a1a] hover:bg-[#2e59e6] px-2.5 sm:px-3 py-1 border border-[#1a1a1a] transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Hubungkan akun Google langsung untuk sinkronisasi menulis ke Google Spreadsheet"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-ping"></span>
                  {isLoggingIn ? 'MENGHUBUNGKAN...' : 'LOGIN GOOGLE'}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Universal Quick Navigation Bar for Public Views (Always visible when not in Master Mode) */}
      {!isMasterMode && (
        <div className="bg-[#E5E0D8] border-b-[1.5px] border-[#1a1a1a] px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 overflow-x-auto select-none font-mono-code text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-700 uppercase hidden md:inline mr-1">
              NAVIGASI:
            </span>
            <button
              onClick={() => onNavigate('kelas7', '/kelas7')}
              className={`px-2.5 py-1 font-bold border border-[#1a1a1a] transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#1a1a1a] ${
                isKelas7Mode || isExcelMode
                  ? 'bg-[#107c41] text-white'
                  : 'bg-white hover:bg-emerald-50 text-[#1a1a1a]'
              }`}
              title="Buka Laboratorium Excel & Cek Nilai Siswa Kelas 7"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>📊 KELAS 7 (LAB EXCEL)</span>
            </button>

            <button
              onClick={() => onNavigate('cek', '/cek')}
              className={`px-2.5 py-1 font-bold border border-[#1a1a1a] transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#1a1a1a] ${
                isCekMode
                  ? 'bg-[#2e59e6] text-white'
                  : 'bg-white hover:bg-blue-50 text-[#1a1a1a]'
              }`}
              title="Buka Cek Status Tugas & Nilai Kelas 8"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>🔍 CEK NILAI (KELAS 8)</span>
            </button>

            <button
              onClick={() => onNavigate('kuis', '/kuis')}
              className={`px-2.5 py-1 font-bold border border-[#1a1a1a] transition-all flex items-center gap-1 cursor-pointer shadow-[2px_2px_0px_#1a1a1a] ${
                isKuisMode
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white hover:bg-emerald-50 text-[#1a1a1a]'
              }`}
              title="Buka Portal Kuis Interaktif"
            >
              <span>💡 KUIS</span>
            </button>

            <button
              onClick={() => onNavigate('pengganti', '/pengganti')}
              className={`px-2.5 py-1 font-bold border border-[#1a1a1a] transition-all flex items-center gap-1 cursor-pointer shadow-[2px_2px_0px_#1a1a1a] ${
                isPenggantiMode
                  ? 'bg-amber-600 text-white'
                  : 'bg-white hover:bg-amber-50 text-[#1a1a1a]'
              }`}
              title="Buka Pengumpulan Tugas Pengganti KKA 2"
            >
              <span>📝 PENGGANTI KKA</span>
            </button>

            <button
              onClick={() => onNavigate('showcase', '/')}
              className={`px-2.5 py-1 font-bold border border-[#1a1a1a] transition-all flex items-center gap-1 cursor-pointer shadow-[2px_2px_0px_#1a1a1a] ${
                activeTab === 'showcase'
                  ? 'bg-[#1a1a1a] text-white'
                  : 'bg-white hover:bg-slate-100 text-[#1a1a1a]'
              }`}
              title="Buka Galeri Karya Siswa"
            >
              <span>🖼️ ARSIP KARYA</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('master', '/master')}
              className="px-2.5 py-1 font-bold border border-[#1a1a1a] bg-[#1a1a1a] hover:bg-[#2e59e6] text-white text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#1a1a1a]"
              title="Masuk ke Panel Guru / Master"
            >
              <span>🔐 PANEL MASTER</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
