import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Mail,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Check,
  X,
  Layers,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Student } from '../types';

interface StudentManagerViewProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  onUpdateStudent: (student: Student) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onSyncStudentsToSheet: () => Promise<void>;
  isSyncing: boolean;
  isConnectedToSheet: boolean;
}

export const StudentManagerView: React.FC<StudentManagerViewProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onSyncStudentsToSheet,
  isSyncing,
  isConnectedToSheet,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Add form fields
  const [nis, setNis] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('Kelas 8D');
  const [group, setGroup] = useState('Kelompok 1');
  const [attendanceNo, setAttendanceNo] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extract distinct classes and groups
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.className) set.add(s.className);
    });
    return Array.from(set).sort();
  }, [students]);

  // Group summary for active class filter
  const groupCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    students.forEach((s) => {
      if (classFilter === 'all' || s.className === classFilter) {
        const grp = s.group || 'Tanpa Kelompok';
        counts[grp] = (counts[grp] || 0) + 1;
      }
    });
    return counts;
  }, [students, classFilter]);

  const allGroups = useMemo(() => Object.keys(groupCounts).sort(), [groupCounts]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.attendanceNo && s.attendanceNo.includes(searchTerm)) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.group.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass = classFilter === 'all' || s.className === classFilter;
      const matchesGroup = groupFilter === 'all' || s.group === groupFilter;
      return matchesSearch && matchesClass && matchesGroup;
    });
  }, [students, searchTerm, classFilter, groupFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setNis(`115${Math.floor(10 + Math.random() * 90)}`);
    setName('');
    setClassName(classFilter !== 'all' ? classFilter : 'Kelas 8D');
    setGroup('Kelompok 1');
    setAttendanceNo('');
    setEmail('');
    setStatus('Aktif');
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setNis(s.nis);
    setName(s.name);
    setClassName(s.className);
    setGroup(s.group);
    setAttendanceNo(s.attendanceNo || '');
    setEmail(s.email || '');
    setStatus(s.status);
    setErrorMsg(null);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama siswa tidak boleh kosong');
      return;
    }
    if (!nis.trim()) {
      setErrorMsg('NIS siswa tidak boleh kosong');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddStudent({
        nis: nis.trim(),
        name: name.trim(),
        className: className.trim() || 'Kelas 8D',
        group: group.trim() || 'Kelompok 1',
        attendanceNo: attendanceNo.trim(),
        email: email.trim(),
        status,
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan data siswa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!name.trim() || !nis.trim()) {
      setErrorMsg('Nama dan NIS tidak boleh kosong');
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateStudent({
        ...editingStudent,
        nis: nis.trim(),
        name: name.trim(),
        className: className.trim(),
        group: group.trim(),
        attendanceNo: attendanceNo.trim(),
        email: email.trim(),
        status,
      });
      setEditingStudent(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui data siswa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and Actions */}
      <div className="bg-white border-[1.5px] border-[#1a1a1a] p-5 shadow-[4px_4px_0px_#1a1a1a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-serif-display italic font-bold text-2xl sm:text-3xl text-[#1a1a1a]">
              Daftar & Data Siswa
            </h2>
            <span className="font-mono-code text-[11px] font-bold bg-[#2e59e6] text-white px-2.5 py-0.5 border border-[#1a1a1a]">
              TOTAL {students.length} SISWA
            </span>
          </div>
          <p className="font-mono-code text-xs text-slate-500 mt-1">
            Data siswa terhubung lengkap dengan Google Spreadsheet across Kelas 8A hingga 8H.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto font-mono-code">
          {isConnectedToSheet && (
            <button
              onClick={onSyncStudentsToSheet}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#1a1a1a] bg-[#F2EFEB] hover:bg-white border border-[#1a1a1a] transition-all disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>SIMPAN KE SPREADSHEET</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1a1a1a] hover:bg-[#2e59e6] border border-[#1a1a1a] shadow-[3px_3px_0px_#000] transition-all w-full md:w-auto cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>+ TAMBAH SISWA</span>
          </button>
        </div>
      </div>

      {/* Class Quick Selection Tabs */}
      <div className="bg-white border-[1.5px] border-[#1a1a1a] p-2.5 shadow-[3px_3px_0px_#1a1a1a] overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max font-mono-code text-xs">
          <span className="text-[11px] font-bold text-slate-500 px-2 uppercase">KELAS:</span>
          <button
            onClick={() => {
              setClassFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 border font-bold transition-all cursor-pointer ${
              classFilter === 'all'
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'bg-[#F2EFEB] text-[#1a1a1a] border-transparent hover:border-[#1a1a1a]'
            }`}
          >
            SEMUA KELAS ({students.length})
          </button>

          {classList.map((cls) => {
            const count = students.filter((s) => s.className === cls).length;
            return (
              <button
                key={cls}
                onClick={() => {
                  setClassFilter(cls);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 border font-bold transition-all cursor-pointer ${
                  classFilter === cls
                    ? 'bg-[#2e59e6] text-white border-[#2e59e6]'
                    : 'bg-[#F2EFEB] text-[#1a1a1a] border-transparent hover:border-[#1a1a1a]'
                }`}
              >
                {cls.toUpperCase()} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border-[1.5px] border-[#1a1a1a] p-3.5 shadow-[4px_4px_0px_#1a1a1a] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full font-mono-code">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#1a1a1a]" />
          <input
            type="text"
            placeholder="Cari nama siswa, NIS, nomor absen, atau kelompok..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#1a1a1a] bg-[#F2EFEB] focus:bg-white focus:outline-hidden text-[#1a1a1a]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto font-mono-code">
          <select
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-3 py-1.5 text-xs font-bold border border-[#1a1a1a] bg-white text-[#1a1a1a] focus:outline-hidden"
          >
            <option value="all">SEMUA KELOMPOK ({filteredStudents.length})</option>
            {allGroups.map((grp) => (
              <option key={grp} value={grp}>
                {grp.toUpperCase()} ({groupCounts[grp]})
              </option>
            ))}
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 text-xs font-bold border border-[#1a1a1a] bg-white text-[#1a1a1a] focus:outline-hidden"
          >
            <option value={25}>25 / hal</option>
            <option value={50}>50 / hal</option>
            <option value={100}>100 / hal</option>
            <option value={300}>Semua ({students.length})</option>
          </select>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white border-[1.5px] border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1a1a1a] text-white font-mono-code text-[11px] uppercase tracking-wider">
                <th className="px-3 py-3 border-b border-[#1a1a1a] w-14 text-center">ABSEN</th>
                <th className="px-4 py-3 border-b border-[#1a1a1a]">NAMA SISWA & NIS</th>
                <th className="px-3 py-3 border-b border-[#1a1a1a]">KELAS</th>
                <th className="px-3 py-3 border-b border-[#1a1a1a]">KELOMPOK</th>
                <th className="px-3 py-3 border-b border-[#1a1a1a]">STATUS</th>
                <th className="px-3 py-3 border-b border-[#1a1a1a] text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 font-mono-code">
                    <FileSpreadsheet className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                    <p className="font-bold text-xs text-[#1a1a1a]">Tidak ada data siswa yang cocok dengan filter</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Coba ubah kata kunci pencarian atau pilih kelas lain.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((std, idx) => (
                  <tr key={`std-${std.id || ''}-${std.nis || ''}-${idx}`} className="hover:bg-[#F2EFEB] transition-colors">
                    {/* Attendance No */}
                    <td className="px-3 py-3 text-center font-mono-code font-bold text-slate-600">
                      <span className="inline-block px-1.5 py-0.5 bg-[#F2EFEB] border border-[#1a1a1a] text-[11px]">
                        {std.attendanceNo || '-'}
                      </span>
                    </td>

                    {/* Name & NIS */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-sm text-[#1a1a1a]">{std.name}</div>
                      <div className="font-mono-code text-[11px] text-[#2e59e6] font-bold">
                        NIS: #{std.nis}
                      </div>
                    </td>

                    {/* Class */}
                    <td className="px-3 py-3 font-mono-code font-bold">
                      <span className="bg-slate-100 border border-slate-300 px-2 py-0.5 text-[11px]">
                        {std.className}
                      </span>
                    </td>

                    {/* Group */}
                    <td className="px-3 py-3">
                      <span className="font-mono-code text-[10px] font-bold px-2 py-0.5 border border-[#1a1a1a] bg-[#F2EFEB] text-[#1a1a1a]">
                        {std.group}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 font-mono-code">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 border ${
                          std.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                            : 'bg-slate-100 text-slate-600 border-slate-400'
                        }`}
                      >
                        {std.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 text-right space-x-1.5 whitespace-nowrap font-mono-code">
                      <button
                        onClick={() => handleOpenEdit(std)}
                        className="px-2 py-1 text-xs border border-[#1a1a1a] hover:bg-[#2e59e6] hover:text-white transition-colors cursor-pointer"
                        title="Edit"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => onDeleteStudent(std.id)}
                        className="px-2 py-1 text-xs border border-rose-500 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        HAPUS
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="bg-[#F2EFEB] border-t border-[#1a1a1a] px-4 py-3 flex items-center justify-between font-mono-code text-xs">
            <span className="text-slate-600">
              Menampilkan {Math.min((currentPage - 1) * pageSize + 1, filteredStudents.length)} -{' '}
              {Math.min(currentPage * pageSize, filteredStudents.length)} dari {filteredStudents.length} siswa
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 border border-[#1a1a1a] bg-white disabled:opacity-40 hover:bg-[#2e59e6] hover:text-white cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-bold">
                Halaman {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 border border-[#1a1a1a] bg-white disabled:opacity-40 hover:bg-[#2e59e6] hover:text-white cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F2EFEB]/90 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border-2 border-[#1a1a1a] p-6 shadow-[8px_8px_0px_#1a1a1a] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
              <h3 className="font-serif-display italic font-bold text-2xl text-[#1a1a1a]">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="font-mono-code text-xs font-bold hover:text-[#2e59e6] cursor-pointer"
              >
                [ ✕ ]
              </button>
            </div>

            <form
              onSubmit={editingStudent ? handleSubmitEdit : handleSubmitAdd}
              className="space-y-3 font-mono-code text-xs"
            >
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-500 text-rose-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-[#1a1a1a] mb-1">NAMA SISWA *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap Siswa"
                  className="w-full p-2 border border-[#1a1a1a] bg-[#F2EFEB] focus:bg-white text-[#1a1a1a]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#1a1a1a] mb-1">NIS / NIPD *</label>
                  <input
                    type="text"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="11593"
                    className="w-full p-2 border border-[#1a1a1a] bg-[#F2EFEB] focus:bg-white text-[#1a1a1a]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1a1a1a] mb-1">NO. ABSEN</label>
                  <input
                    type="text"
                    value={attendanceNo}
                    onChange={(e) => setAttendanceNo(e.target.value)}
                    placeholder="3"
                    className="w-full p-2 border border-[#1a1a1a] bg-[#F2EFEB] focus:bg-white text-[#1a1a1a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#1a1a1a] mb-1">KELAS</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full p-2 border border-[#1a1a1a] bg-white text-[#1a1a1a]"
                  >
                    <option value="Kelas 8A">Kelas 8A</option>
                    <option value="Kelas 8B">Kelas 8B</option>
                    <option value="Kelas 8C">Kelas 8C</option>
                    <option value="Kelas 8D">Kelas 8D</option>
                    <option value="Kelas 8E">Kelas 8E</option>
                    <option value="Kelas 8F">Kelas 8F</option>
                    <option value="Kelas 8G">Kelas 8G</option>
                    <option value="Kelas 8H">Kelas 8H</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1a1a1a] mb-1">KELOMPOK</label>
                  <input
                    type="text"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    placeholder="Kelompok 1"
                    className="w-full p-2 border border-[#1a1a1a] bg-[#F2EFEB] focus:bg-white text-[#1a1a1a]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1a1a1a] mb-1">STATUS</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2 border border-[#1a1a1a] bg-white text-[#1a1a1a]"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1a1a1a]">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 border border-[#1a1a1a] hover:bg-slate-100 cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#1a1a1a] text-white hover:bg-[#2e59e6] font-bold disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'MENYIMPAN...' : editingStudent ? 'SIMPAN PERUBAHAN' : '+ TAMBAHKAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
