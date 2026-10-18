import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Zap,
  UploadCloud,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  testAppsScriptConnection,
  syncAllLocalSubstituteTasks,
  ensureSheetExists,
  SUBSTITUTE_TASK_SHEET_NAME,
  SUBSTITUTE_TASK_HEADERS,
} from '../services/sheetsService';

interface AutoSyncConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId: string;
  spreadsheetUrl: string;
  token?: string | null;
  onSuccessSync?: () => void;
}

const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = data.sheetName || 'Pengganti KKA 2';
    var sheet = ss.getSheetByName(sheetName);

    // 1. Otomatis buat tab sheet jika belum ada di posisi PALING KANAN (setelah Tugas_Siswa)
    if (!sheet) {
      var totalSheets = ss.getNumSheets();
      sheet = ss.insertSheet(sheetName, totalSheets);
      sheet.appendRow([
        'No',
        'Waktu Pengumpulan',
        'Nama Lengkap Siswa',
        'Kelas',
        'No. Absen',
        'NIS / NIPD',
        'Link Video YouTube',
        'Catatan / Keterangan',
        'Status'
      ]);
    } else {
      // 2. Jika tab sheet sudah ada (misal di antara kelas), pindahkan ke posisi PALING KANAN
      var totalSheets = ss.getNumSheets();
      var currentIdx = sheet.getIndex(); // 1-based index
      if (currentIdx !== totalSheets) {
        ss.setActiveSheet(sheet);
        ss.moveActiveSheet(totalSheets);
      }
    }

    // Jika ini pengujian koneksi dan posisi tab
    if (data.action === 'testConnection') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Koneksi berhasil! Tab Sheet "' + sheetName + '" telah diposisikan di sebelah paling kanan (setelah Tugas_Siswa).'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = Math.max(1, sheet.getLastRow());
    var nextNo = lastRow;

    // Tambahkan baris data pengumpulan siswa
    sheet.appendRow([
      nextNo,
      data.submittedAt || new Date().toLocaleString('id-ID'),
      data.studentName || '-',
      data.className || '-',
      data.attendanceNo || '-',
      data.nis || '-',
      data.youtubeUrl || '-',
      data.notes || '-',
      data.status || 'Terkirim'
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data ' + (data.studentName || '') + ' berhasil disimpan ke Google Spreadsheet'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const AutoSyncConfigModal: React.FC<AutoSyncConfigModalProps> = ({
  isOpen,
  onClose,
  spreadsheetId,
  spreadsheetUrl,
  token,
  onSuccessSync,
}) => {
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [isCreatingViaToken, setIsCreatingViaToken] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [localCount, setLocalCount] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      const saved =
        localStorage.getItem('tugas_siswa_apps_script_url') ||
        (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_APPS_SCRIPT_URL) ||
        'https://script.google.com/macros/s/AKfycbxWyVWh9iHf4Rt2HOloutDTye9X89kK_PNzFnVIDIbXt76WQAd3nqkuCIniodsaJi9sew/exec';
      setAppsScriptUrl(saved);
      if (!localStorage.getItem('tugas_siswa_apps_script_url')) {
        localStorage.setItem('tugas_siswa_apps_script_url', saved);
      }

      try {
        const raw = localStorage.getItem('tugas_siswa_substitute_submissions_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          setLocalCount(Array.isArray(parsed) ? parsed.length : 0);
        } else {
          setLocalCount(0);
        }
      } catch {
        setLocalCount(0);
      }
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    const cleanUrl = appsScriptUrl.trim();
    localStorage.setItem('tugas_siswa_apps_script_url', cleanUrl);
    setStatusMessage({
      type: 'success',
      text: cleanUrl
        ? 'URL Google Apps Script Web App berhasil disimpan ke konfigurasi sistem!'
        : 'Konfigurasi URL Web App dikosongkan.',
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleTestConnection = async () => {
    if (!appsScriptUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Masukkan URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setIsTesting(true);
    setStatusMessage({ type: 'info', text: 'Menguji koneksi dan memverifikasi tab sheet di Google Spreadsheet...' });

    // Save first
    localStorage.setItem('tugas_siswa_apps_script_url', appsScriptUrl.trim());

    const result = await testAppsScriptConnection(appsScriptUrl.trim(), spreadsheetId);
    setIsTesting(false);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: result.message || 'Koneksi berhasil! Tab sheet "Pengganti KKA 2" telah diverifikasi di Google Spreadsheet Anda.',
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message || 'Gagal menghubungi Web App. Pastikan Deployment diatur ke "Anyone / Siapa Saja".',
      });
    }
  };

  const handleSyncAllLocal = async () => {
    setIsSyncingAll(true);
    setStatusMessage({ type: 'info', text: 'Sedang mengirim semua data tugas pengganti yang tersimpan di sistem lokal...' });

    const res = await syncAllLocalSubstituteTasks(spreadsheetId, token, appsScriptUrl.trim());
    setIsSyncingAll(false);

    if (res.totalSynced > 0) {
      setStatusMessage({
        type: 'success',
        text: res.message,
      });
      if (onSuccessSync) onSuccessSync();
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message || 'Tidak ada data yang berhasil dikirim. Periksa URL Apps Script atau login Google Anda.',
      });
    }
  };

  const handleCreateSheetViaToken = async () => {
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Akun Google Guru belum terhubung dengan token OAuth. Gunakan URL Apps Script di bawah agar otomatis.',
      });
      return;
    }

    setIsCreatingViaToken(true);
    setStatusMessage({ type: 'info', text: 'Membuat tab sheet "Pengganti KKA 2" langsung via API Google...' });

    const res = await ensureSheetExists(token, spreadsheetId, SUBSTITUTE_TASK_SHEET_NAME, SUBSTITUTE_TASK_HEADERS);
    setIsCreatingViaToken(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Tab sheet '${SUBSTITUTE_TASK_SHEET_NAME}' berhasil diverifikasi/dibuat di Google Spreadsheet!`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message || 'Gagal membuat tab sheet.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF8F5] border-3 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] w-full max-w-2xl max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="bg-[#1a1a1a] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#2e59e6] text-white border border-white/20">
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-mono-code font-bold text-sm sm:text-base tracking-wide">
                PENGATURAN AUTO-SYNC SPREADSHEET (TANPA LOGIN SISWA)
              </h2>
              <p className="text-[11px] text-slate-300 font-mono-code">
                Agar setiap siswa yang mengirim di /pengganti otomatis masuk ke Google Spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-[#1a1a1a] font-sans">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 border-2 font-mono-code text-xs flex items-start gap-2.5 shadow-[2px_2px_0px_#1a1a1a] ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-600 text-rose-950'
                  : 'bg-blue-50 border-blue-600 text-blue-950'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="h-4 w-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
              )}
              <div>{statusMessage.text}</div>
            </div>
          )}

          {/* Section 1: URL Web App Google Apps Script */}
          <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-mono-code font-bold text-xs uppercase flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-[#2e59e6]" />
                <span>URL Web App Google Apps Script:</span>
              </label>
              {appsScriptUrl ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-500 font-mono-code text-[10px] font-bold">
                  TERHUBUNG
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-500 font-mono-code text-[10px] font-bold">
                  BELUM DIKONFIGURASI
                </span>
              )}
            </div>

            <input
              type="url"
              value={appsScriptUrl}
              onChange={(e) => setAppsScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full bg-[#FAF8F5] border-2 border-[#1a1a1a] px-3.5 py-2 font-mono-code text-xs text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] focus:outline-hidden focus:bg-white"
            />

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#2e59e6] text-white font-mono-code text-xs font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                SIMPAN URL
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-[#1a1a1a] font-mono-code text-xs font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>{isTesting ? 'MENGUJI...' : 'TES & BUAT TAB SPREADSHEET'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Sync Pending Local Data */}
          {localCount > 0 && (
            <div className="bg-amber-50 border-2 border-amber-600 p-4 shadow-[3px_3px_0px_#d97706] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono-code font-bold text-xs text-amber-950 uppercase flex items-center gap-1.5">
                  <UploadCloud className="h-4 w-4 text-amber-700" />
                  <span>DATA TUGAS PENGGANTI TERSIMPAN DI LOKAL: {localCount} DATA</span>
                </span>
              </div>
              <p className="text-xs text-amber-900 font-mono-code">
                Ada {localCount} pengumpulan siswa (misal Arjuna Zafif Athaillah) yang tercatat di sistem ini. Anda dapat menyinkronkannya sekaligus ke Spreadsheet sekarang:
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSyncAllLocal}
                  disabled={isSyncingAll}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono-code text-xs font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>{isSyncingAll ? 'MENYINKRONKAN...' : `SINKRONKAN ${localCount} DATA KE GOOGLE SPREADSHEET`}</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Cara Cepat Pasang Google Apps Script */}
          <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a] space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-mono-code font-bold text-xs uppercase flex items-center gap-1.5">
                <Info className="h-4 w-4 text-[#2e59e6]" />
                <span>PANDUAN PEMASANGAN (HANYA 1 MENIT):</span>
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-slate-200 border border-[#1a1a1a] font-mono-code text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-700" />}
                <span>{copied ? 'TERSALIN!' : 'SALIN KODE SCRIPT'}</span>
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs font-mono-code text-slate-700">
              <li>
                Buka Spreadsheet Anda:{' '}
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2e59e6] underline inline-flex items-center gap-0.5 font-bold"
                >
                  Buka Spreadsheet <ExternalLink className="h-3 w-3 inline" />
                </a>
              </li>
              <li>
                Di menu Spreadsheet, klik <strong>Ekstensi (Extensions)</strong> $\rightarrow$ <strong>Apps Script</strong>.
              </li>
              <li>
                Ganti kode lama dengan kode baru di atas (sudah diatur agar tab otomatis dibuat dan diposisikan di <strong>sebelah paling kanan setelah Tugas_Siswa</strong>), lalu klik ikon <strong>Simpan (Save / Ctrl+S)</strong>.
              </li>
              <li>
                Klik <strong>Deploy (Terapkan)</strong> $\rightarrow$ <strong>Manage deployments (Kelola penerapan)</strong> $\rightarrow$ klik ikon pensil <strong>Edit</strong> $\rightarrow$ pada Versi pilih <strong>New version (Versi baru)</strong> $\rightarrow$ klik <strong>Deploy</strong>.
              </li>
              <li>
                Kembali ke aplikasi ini dan klik tombol <strong>"TES & BUAT TAB SPREADSHEET"</strong> di atas. Tab <code>Pengganti KKA 2</code> akan langsung berpindah ke sebelah paling kanan.
              </li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAF8F5] px-5 py-3 border-t-2 border-[#1a1a1a] flex items-center justify-between shrink-0 font-mono-code text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Aman & Otomatis: Siswa tidak perlu akun Google atau login</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1a1a1a] hover:bg-slate-800 text-white font-bold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] cursor-pointer"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
