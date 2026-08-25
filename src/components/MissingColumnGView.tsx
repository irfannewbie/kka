import React, { useEffect, useState } from 'react';
import { loadStudentsMissingColumnG } from '../services/sheetsService';

interface Props {
  spreadsheetId?: string;
  token?: string | null;
  spreadsheetUrl?: string;
  onLogin?: () => void;
}

interface MissingItem {
  id: string;
  studentName: string;
  className: string;
  attendanceNo: string;
  nis?: string;
  hasColumnGScore: boolean;
  hasSubmittedSubstitute: boolean;
  substituteSubmission?: any;
}

export const MissingColumnGView: React.FC<Props> = ({ spreadsheetId, token, spreadsheetUrl, onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MissingItem[]>([]);
  const [stats, setStats] = useState({ totalChecked: 0, totalMissing: 0, totalSubmitted: 0, totalUnsubmitted: 0 });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loadStudentsMissingColumnG(spreadsheetId || '', token || null);
      const missing = (res?.missingStudents || []) as MissingItem[];
      setItems(missing);
      setStats({
        totalChecked: res?.totalChecked || 0,
        totalMissing: res?.totalMissing || missing.length,
        totalSubmitted: res?.totalSubmitted || 0,
        totalUnsubmitted: res?.totalUnsubmitted || 0,
      });
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreadsheetId, token]);

  return (
    <div className="space-y-4 pb-8">
      <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[4px_4px_0px_#1a1a1a]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif-display font-bold text-lg">Siswa Belum Ada Nilai — Kolom G (Tugas 2)</h2>
            <p className="text-sm text-slate-600">Menampilkan siswa dari semua kelas yang belum memiliki nilai pada Kolom G (Tugas 2 - KKA - Algoritma Web).</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData()}
              className="px-3 py-2 bg-white border-2 border-[#1a1a1a] font-mono-code text-xs font-bold"
              disabled={isLoading}
            >
              {isLoading ? 'Memuat...' : 'Perbarui Data'}
            </button>
            <a href={spreadsheetUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-emerald-100 border-2 border-[#1a1a1a] text-xs font-bold">
              Buka Spreadsheet
            </a>
            {!token && (
              <button onClick={onLogin} className="px-3 py-2 bg-amber-100 border-2 border-[#1a1a1a] text-xs font-bold">
                Login Google
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3">
          <div className="text-xs text-slate-500 font-bold">Total Dicek</div>
          <div className="text-2xl font-bold">{stats.totalChecked}</div>
        </div>
        <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3">
          <div className="text-xs text-slate-500 font-bold">Belum Nilai (Kolom G)</div>
          <div className="text-2xl font-bold">{stats.totalMissing}</div>
        </div>
        <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3">
          <div className="text-xs text-slate-500 font-bold">Sudah Submit (Video)</div>
          <div className="text-2xl font-bold">{stats.totalSubmitted}</div>
        </div>
        <div className="bg-[#FAF8F5] border-2 border-[#1a1a1a] p-3">
          <div className="text-xs text-slate-500 font-bold">Belum Submit</div>
          <div className="text-2xl font-bold">{stats.totalUnsubmitted}</div>
        </div>
      </div>

      <div className="bg-white border-2 border-[#1a1a1a] p-4 shadow-[3px_3px_0px_#1a1a1a]">
        {error && <div className="text-rose-700 mb-3">Error: {error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-code text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-[#1a1a1a] text-slate-700 uppercase text-[11px]">
                <th className="py-2 px-3 border-r">No</th>
                <th className="py-2 px-3 border-r">Nama Siswa</th>
                <th className="py-2 px-3 border-r">Kelas</th>
                <th className="py-2 px-3 border-r">Absen</th>
                <th className="py-2 px-3 border-r">NIS</th>
                <th className="py-2 px-3">Status Submit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">{isLoading ? 'Memuat data...' : 'Tidak ada siswa kosong di Kolom G.'}</td>
                </tr>
              ) : (
                items.map((it, idx) => (
                  <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 border-r text-center font-bold">{idx + 1}</td>
                    <td className="py-2 px-3 border-r">{it.studentName}</td>
                    <td className="py-2 px-3 border-r">{it.className}</td>
                    <td className="py-2 px-3 border-r text-center">{it.attendanceNo}</td>
                    <td className="py-2 px-3 border-r">{it.nis || '-'}</td>
                    <td className="py-2 px-3">
                      {it.hasSubmittedSubstitute && it.substituteSubmission ? (
                        <a
                          href={it.substituteSubmission.youtubeUrl || it.substituteSubmission.link || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block px-3 py-1 bg-emerald-100 border-2 border-emerald-600 text-emerald-800 font-bold text-xs"
                        >
                          ✅ Sudah Submit
                        </a>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-rose-100 border-2 border-rose-600 text-rose-800 font-bold text-xs">Belum</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MissingColumnGView;
