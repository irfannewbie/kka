import { describe, expect, it } from 'vitest';
import { normalizeClass, normalizeGroupDigit, resolveStudentByAttendance } from './studentResolver';
import type { Student } from '../types';

describe('normalizeClass', () => {
  it('menangani kosong/undefined dengan default 8A', () => {
    expect(normalizeClass()).toBe('8A');
    expect(normalizeClass('')).toBe('8A');
    expect(normalizeClass('   ')).toBe('8A');
  });

  it('membuang prefix "Kelas"', () => {
    expect(normalizeClass('Kelas 8A')).toBe('8A');
    expect(normalizeClass('kelas 8b')).toBe('8B');
  });

  it('mengenali angka romawi', () => {
    expect(normalizeClass('VIII A')).toBe('8A');
    expect(normalizeClass('VII C')).toBe('7C');
  });

  it('membuang pemisah seperti strip dan titik', () => {
    expect(normalizeClass('8-A')).toBe('8A');
    expect(normalizeClass('8.D')).toBe('8D');
  });
});

describe('normalizeGroupDigit', () => {
  it('angka langsung', () => {
    expect(normalizeGroupDigit('5')).toBe(5);
    expect(normalizeGroupDigit(' 12 ')).toBe(12);
  });

  it('di luar rentang 1-16 ditolak', () => {
    expect(normalizeGroupDigit('0')).toBeNull();
    expect(normalizeGroupDigit('17')).toBeNull();
  });

  it('angka romawi', () => {
    expect(normalizeGroupDigit('III')).toBe(3);
    expect(normalizeGroupDigit('iv')).toBe(4);
  });

  it('kata bilangan Indonesia', () => {
    expect(normalizeGroupDigit('empat')).toBe(4);
    expect(normalizeGroupDigit('Sepuluh')).toBe(10);
  });

  it('input tak dikenal', () => {
    expect(normalizeGroupDigit('')).toBeNull();
    expect(normalizeGroupDigit('abc')).toBeNull();
  });
});

describe('resolveStudentByAttendance', () => {
  const students: Student[] = [
    {
      id: 's1',
      name: 'Budi Santoso',
      className: 'Kelas 8A',
      attendanceNo: '3',
      nis: '22001',
      group: 'Kelompok 1',
      status: 'Aktif',
    },
    {
      // nama korup header sheet — tidak boleh dipakai
      id: 's2',
      name: 'ASPEK PENILAIAN',
      className: '8A',
      attendanceNo: '4',
      nis: '22002',
      group: 'Kelompok 1',
      status: 'Aktif',
    },
  ];

  it('menemukan siswa dari daftar yang diberikan', () => {
    const r = resolveStudentByAttendance('3', '8A', students);
    expect(r.name).toBe('Budi Santoso');
    expect(r.attendanceNo).toBe('3');
    expect(r.nis).toBe('22001');
  });

  it('abaikan leading zero pada nomor absen', () => {
    const r = resolveStudentByAttendance('03', '8A', students);
    expect(r.name).toBe('Budi Santoso');
    expect(r.attendanceNo).toBe('3');
  });

  it('menolak nama korup dan jatuh ke roster autentik', () => {
    const r = resolveStudentByAttendance('4', '8A', students);
    // Tidak memakai nama korup dari daftar, melainkan roster autentik
    expect(r.name).not.toBe('ASPEK PENILAIAN');
    expect(r.name.length).toBeGreaterThan(0);
  });

  it('fallback untuk absen yang tidak dikenal', () => {
    const r = resolveStudentByAttendance('99', '8H', students);
    expect(r.attendanceNo).toBe('99');
    expect(r.name).toContain('8H');
  });
});
