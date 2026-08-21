import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Table,
  Layers,
  Sparkles,
  Info,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SpreadsheetIframeViewProps {
  spreadsheetId: string;
  spreadsheetUrl: string;
  onUpdateSpreadsheetId?: (newId: string) => void;
  lastSyncedAt: string | null;
  onManualSync: () => void;
  isSyncing: boolean;
  onSyncAllTasksToSheet?: () => Promise<void>;
  isConnectedToSheet?: boolean;
  onLogin?: () => Promise<void>;
  tasksCount?: number;
}

export const SpreadsheetIframeView: React.FC<SpreadsheetIframeViewProps> = ({
  spreadsheetId,
  spreadsheetUrl,
  onManualSync,
  isSyncing,
  onSyncAllTasksToSheet,
  isConnectedToSheet,
  onLogin,
  tasksCount = 0,
}) => {
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const [embedMode, setEmbedMode] = useState<'edit' | 'preview' | 'html'>('edit');
  const [isPushing, setIsPushing] = useState(false);

  const getEmbedUrl = () => {
    switch (embedMode) {
      case 'edit':
        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing&rm=minimal`;
      case 'preview':
        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/preview`;
      case 'html':
        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlembed?widget=true&headers=false`;
      default:
        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(spreadsheetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReloadIframe = () => {
    setIframeKey((prev) => prev + 1);
    onManualSync();
  };

  const handlePushAllTasks = async () => {
    if (!isConnectedToSheet && onLogin) {
      await onLogin();
    }
    if (onSyncAllTasksToSheet) {
      setIsPushing(true);
      try {
        await onSyncAllTasksToSheet();
        setIframeKey((prev) => prev + 1);
      } finally {
        setIsPushing(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner and controls */}
      <div className="bg-white border-[1.5px] border-[#1a1a1a] p-4 sm:p-5 shadow-[4px_4px_0px_#1a1a1a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif-display italic font-bold text-2xl sm:text-3xl text-[#1a1a1a]">
              Live Google Spreadsheet Viewer
            </h2>
            <span className="font-mono-code text-[11px] font-bold bg-[#2e59e6] text-white px-2 py-0.5 border border-[#1a1a1a]">
              REAL-TIME IFRAME
            </span>
          </div>
          <p className="font-mono-code text-xs text-slate-500 mt-1">
            Spreadsheet ID: <code className="text-[#2e59e6] bg-[#F2EFEB] px-1 py-0.5 font-bold">{spreadsheetId}</code>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 font-mono-code text-xs">
          {/* Push all tasks to sheet button */}
          {onSyncAllTasksToSheet && (
            <button
              onClick={handlePushAllTasks}
              disabled={isPushing || isSyncing}
              className="px-3.5 py-1.5 bg-[#2e59e6] hover:bg-[#1a1a1a] text-white border border-[#1a1a1a] shadow-[2px_2px_0px_#000] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className={`h-3.5 w-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
              <span>{isPushing ? 'MENULIS KE SPREADSHEET...' : `SINKRONKAN SEMUA KARYA (${tasksCount})`}</span>
            </button>
          )}

          {/* Mode Selector */}
          <div className="flex items-center bg-[#F2EFEB] p-1 border border-[#1a1a1a]">
            <button
              onClick={() => setEmbedMode('edit')}
              className={`px-2.5 py-1 text-xs font-bold transition-colors ${
                embedMode === 'edit'
                  ? 'bg-[#1a1a1a] text-white shadow-2xs'
                  : 'text-[#1a1a1a] hover:bg-white'
              }`}
            >
              EDITOR
            </button>
            <button
              onClick={() => setEmbedMode('preview')}
              className={`px-2.5 py-1 text-xs font-bold transition-colors ${
                embedMode === 'preview'
                  ? 'bg-[#1a1a1a] text-white shadow-2xs'
                  : 'text-[#1a1a1a] hover:bg-white'
              }`}
            >
              PREVIEW
            </button>
            <button
              onClick={() => setEmbedMode('html')}
              className={`px-2.5 py-1 text-xs font-bold transition-colors ${
                embedMode === 'html'
                  ? 'bg-[#1a1a1a] text-white shadow-2xs'
                  : 'text-[#1a1a1a] hover:bg-white'
              }`}
            >
              HTML
            </button>
          </div>

          <button
            onClick={handleReloadIframe}
            disabled={isSyncing}
            className="px-3 py-1.5 border border-[#1a1a1a] bg-white hover:bg-[#F2EFEB] font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-[#2e59e6]' : ''}`} />
            <span>RELOAD</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 border border-[#1a1a1a] bg-white hover:bg-[#F2EFEB] font-bold flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'TERSALIN' : 'SALIN URL'}</span>
          </button>

          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2e59e6] text-white border border-[#1a1a1a] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>BUKA SPREADSHEET</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Sync notice banner if not connected */}
      {!isConnectedToSheet && (
        <div className="bg-amber-50 border-[1.5px] border-amber-300 p-3.5 shadow-[3px_3px_0px_#f59e0b] font-mono-code text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-amber-900">
              <strong>Info Akses Tulis:</strong> Google OAuth diperlukan agar aplikasi web dapat menulis dan membuat baris baru di Google Spreadsheet akun <code>irfannewbie7@gmail.com</code>.
            </span>
          </div>
          {onLogin && (
            <button
              onClick={onLogin}
              className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2e59e6] text-white font-bold border border-[#1a1a1a] shrink-0 transition-colors cursor-pointer"
            >
              🔑 HUBUNGKAN GOOGLE SEKARANG
            </button>
          )}
        </div>
      )}

      {/* Embedded Iframe Container */}
      <div className="bg-white border-[1.5px] border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden">
        <div className="bg-[#F2EFEB] px-4 py-2 border-b border-[#1a1a1a] flex items-center justify-between font-mono-code text-[11px]">
          <span className="font-bold text-[#1a1a1a]">
            [ TAB TERHUBUNG: Data_Siswa & Tugas_Siswa / Penilaian_Kelompok ]
          </span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE STREAM
          </span>
        </div>

        <div className="relative w-full h-[650px] bg-slate-50">
          <iframe
            key={iframeKey}
            src={getEmbedUrl()}
            title="Google Spreadsheet Embed"
            className="w-full h-full border-none"
            allow="autoplay; clipboard-write; encrypted-media"
          />
        </div>
      </div>
    </div>
  );
};
