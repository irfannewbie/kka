import React from 'react';
import {
  Clock,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Timer,
  LogOut,
  Zap,
} from 'lucide-react';
import { SessionTimerInfo, formatDurationMMSS } from '../services/firebaseAuth';

interface SessionCountdownPanelProps {
  sessionInfo: SessionTimerInfo;
  masterOpenSeconds: number;
  isLoggingIn: boolean;
  onRefreshSession: () => void;
  onLogout?: () => void;
  variant?: 'full' | 'compact-banner';
  userEmail?: string | null;
}

export const SessionCountdownPanel: React.FC<SessionCountdownPanelProps> = ({
  sessionInfo,
  masterOpenSeconds,
  isLoggingIn,
  onRefreshSession,
  onLogout,
  variant = 'full',
  userEmail,
}) => {
  const {
    isActive,
    remainingSeconds,
    elapsedSeconds,
    progressPercent,
    formattedRemaining,
    formattedElapsed,
    formattedStartTime,
    formattedExpiryTime,
    urgencyLevel,
  } = sessionInfo;

  const formattedMasterOpen = formatDurationMMSS(masterOpenSeconds);

  // Determine styling based on urgency level
  const getThemeClasses = () => {
    if (!isActive || urgencyLevel === 'expired') {
      return {
        border: 'border-[#1a1a1a]',
        shadow: 'shadow-[4px_4px_0px_#d97706]',
        headerBg: 'bg-amber-500 text-[#1a1a1a]',
        cardBg: 'bg-amber-50/90',
        timerBg: 'bg-[#1a1a1a] text-amber-400 border-[#1a1a1a]',
        barColor: 'bg-slate-400',
        badgeBg: 'bg-amber-200 text-amber-950 border-[#1a1a1a]',
        statusLabel: 'SESI EDIT SPREADSHEET BELUM AKTIF / HABIS',
        adviceText:
          'Aktifkan sesi Google (60 menit) sebelum mulai memasukkan atau mengedit data agar tidak tiba-tiba diminta login ulang saat menyimpan.',
      };
    }
    if (urgencyLevel === 'critical') {
      return {
        border: 'border-rose-700',
        shadow: 'shadow-[4px_4px_0px_#be123c]',
        headerBg: 'bg-rose-600 text-white',
        cardBg: 'bg-rose-50',
        timerBg: 'bg-rose-700 text-white border-[#1a1a1a] animate-pulse',
        barColor: 'bg-rose-600',
        badgeBg: 'bg-rose-200 text-rose-950 border-rose-800',
        statusLabel: 'KRITIS: SISA SESI < 5 MENIT!',
        adviceText:
          'Waktu sesi hampir habis! Segera klik "PERPANJANG SESI (+60 MENIT)" sekarang agar Anda tidak tiba-tiba login ulang saat mengedit data.',
      };
    }
    if (urgencyLevel === 'warning') {
      return {
        border: 'border-[#1a1a1a]',
        shadow: 'shadow-[4px_4px_0px_#f59e0b]',
        headerBg: 'bg-amber-500 text-[#1a1a1a]',
        cardBg: 'bg-amber-50/70',
        timerBg: 'bg-[#1a1a1a] text-amber-300 border-[#1a1a1a]',
        barColor: 'bg-amber-500',
        badgeBg: 'bg-amber-100 text-amber-900 border-[#1a1a1a]',
        statusLabel: 'PERHATIAN: SISA SESI < 15 MENIT',
        adviceText:
          'Jika Anda berencana memasukkan atau mengedit banyak nilai kelas, disarankan klik "PERPANJANG SESI" untuk mereset waktu kembali ke 60 menit.',
      };
    }
    return {
      border: 'border-[#1a1a1a]',
      shadow: 'shadow-[4px_4px_0px_#059669]',
      headerBg: 'bg-[#1a1a1a] text-white',
      cardBg: 'bg-white',
      timerBg: 'bg-emerald-950 text-emerald-300 border-[#1a1a1a]',
      barColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-700',
      statusLabel: 'SESI AKTIF & AMAN UNTUK INPUT / EDIT DATA',
      adviceText:
        'Sesi penulisan Google Spreadsheet sedang aktif. Anda dapat memasukkan dan mengedit nilai siswa dengan aman tanpa takut terputus.',
    };
  };

  const theme = getThemeClasses();

  if (variant === 'compact-banner') {
    return (
      <div
        className={`${theme.cardBg} border-2 ${theme.border} ${theme.shadow} px-4 py-3 font-mono-code transition-all`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Left: Timer & Status */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`px-3 py-1.5 border-2 ${theme.timerBg} flex items-center gap-2 shrink-0 shadow-[2px_2px_0px_#1a1a1a]`}
            >
              <Timer className="h-4 w-4 shrink-0" />
              <div>
                <div className="text-[9px] uppercase tracking-wider opacity-80 leading-none">
                  {isActive ? 'HITUNG MUNDUR SESI' : 'SESI EDIT GOOGLE'}
                </div>
                <div className="text-base sm:text-lg font-black tracking-widest leading-tight">
                  {isActive ? formattedRemaining : '00:00'}
                </div>
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase border ${theme.badgeBg}`}
                >
                  {isActive ? (
                    urgencyLevel === 'critical' ? (
                      <ShieldAlert className="h-3 w-3" />
                    ) : urgencyLevel === 'warning' ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <ShieldCheck className="h-3 w-3" />
                    )
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {theme.statusLabel}
                </span>

                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#F2EFEB] text-[#1a1a1a] border border-[#1a1a1a]/40">
                  DURASI SESI BERJALAN: {isActive ? formattedElapsed : formattedMasterOpen}
                </span>

                {isActive && formattedExpiryTime && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                    BERAKHIR PKL {formattedExpiryTime}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-700 leading-snug">{theme.adviceText}</p>
            </div>
          </div>

          {/* Right: Progress & Extend Action */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRefreshSession}
              disabled={isLoggingIn}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] transition-all cursor-pointer disabled:opacity-50 ${
                isActive
                  ? urgencyLevel === 'critical' || urgencyLevel === 'warning'
                    ? 'bg-amber-400 hover:bg-amber-300 text-[#1a1a1a]'
                    : 'bg-[#2e59e6] hover:bg-blue-700 text-white'
                  : 'bg-[#1a1a1a] hover:bg-[#2e59e6] text-white'
              }`}
              title="Perpanjang atau segarkan sesi Google OAuth selama 60 menit penuh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoggingIn ? 'animate-spin' : ''}`} />
              <span>
                {isLoggingIn
                  ? 'MEMPERPANJANG...'
                  : isActive
                  ? 'PERPANJANG SESI (+60 MENIT)'
                  : 'AKTIFKAN SESI EDIT (60 MENIT)'}
              </span>
            </button>
          </div>
        </div>

        {/* Slim Progress Bar */}
        <div className="mt-2.5 w-full h-2 bg-slate-200 border border-[#1a1a1a] overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${theme.barColor}`}
            style={{ width: `${isActive ? progressPercent : 0}%` }}
          />
        </div>
      </div>
    );
  }

  // Full variant for MasterDataView (/master)
  return (
    <div
      className={`${theme.cardBg} border-2 ${theme.border} ${theme.shadow} font-mono-code overflow-hidden`}
    >
      {/* Top Bar */}
      <div
        className={`${theme.headerBg} px-4 py-2.5 border-b-2 border-[#1a1a1a] flex flex-wrap items-center justify-between gap-2`}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">
            MONITOR & TIMER COUNTDOWN SESI INPUT / EDIT DATA MASTER
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold">
          {userEmail && (
            <span className="px-2 py-0.5 bg-black/20 border border-current/30">
              ADMIN: {userEmail}
            </span>
          )}
          <span className="px-2 py-0.5 bg-white text-[#1a1a1a] border border-[#1a1a1a]">
            DURASI BUKA PANEL: {formattedMasterOpen}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Countdown Digital Display Box */}
        <div className="lg:col-span-4 flex items-center gap-3.5 bg-[#F2EFEB] border-2 border-[#1a1a1a] p-3.5 shadow-[3px_3px_0px_#1a1a1a]">
          <div
            className={`px-3.5 py-2.5 border-2 ${theme.timerBg} text-center min-w-[110px] shadow-[2px_2px_0px_#1a1a1a]`}
          >
            <div className="text-[9px] font-bold uppercase tracking-widest opacity-80">
              {isActive ? 'SISA WAKTU SESI' : 'WAKTU SESI'}
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-wider mt-0.5">
              {isActive ? formattedRemaining : '00:00'}
            </div>
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase">
              SESI BERJALAN
            </div>
            <div className="text-sm sm:text-base font-black text-[#1a1a1a]">
              {isActive ? `${formattedElapsed} berjalan` : `${formattedMasterOpen} (Lokal)`}
            </div>
            <div className="text-[10px] text-slate-600 font-bold truncate">
              {isActive && formattedStartTime && formattedExpiryTime
                ? `${formattedStartTime} → ${formattedExpiryTime}`
                : 'Belum terhubung token tulis'}
            </div>
          </div>
        </div>

        {/* Middle: Status Description & Progress Bar */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-black uppercase border ${theme.badgeBg}`}
            >
              {isActive ? (
                urgencyLevel === 'critical' ? (
                  <ShieldAlert className="h-3.5 w-3.5" />
                ) : urgencyLevel === 'warning' ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {theme.statusLabel}
            </span>

            <span className="text-[11px] font-bold text-[#1a1a1a]">
              {isActive
                ? `${Math.ceil(remainingSeconds / 60)} Menit Tersisa (${Math.round(progressPercent)}%)`
                : '0% Tersisa'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-200 border-2 border-[#1a1a1a] p-0.5">
            <div
              className={`h-full transition-all duration-500 ${theme.barColor}`}
              style={{ width: `${isActive ? progressPercent : 0}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-700 leading-relaxed">{theme.adviceText}</p>
        </div>

        {/* Right: Action Buttons */}
        <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-2 justify-end">
          <button
            type="button"
            onClick={onRefreshSession}
            disabled={isLoggingIn}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] transition-all cursor-pointer disabled:opacity-50 ${
              isActive
                ? urgencyLevel === 'critical' || urgencyLevel === 'warning'
                  ? 'bg-amber-400 hover:bg-amber-300 text-[#1a1a1a]'
                  : 'bg-[#2e59e6] hover:bg-blue-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Zap className={`h-4 w-4 ${isLoggingIn ? 'animate-spin' : ''}`} />
            <span>
              {isLoggingIn
                ? 'MEMPERBARUI SESI...'
                : isActive
                ? 'PERPANJANG SESI (+60M)'
                : 'MULAI SESI GOOGLE (60M)'}
            </span>
          </button>

          {isActive && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-white hover:bg-rose-50 text-rose-700 border border-rose-700 transition-colors cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              <span>AKHIRI SESI EDIT</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
