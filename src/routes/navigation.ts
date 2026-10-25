/**
 * Pusat definisi routing aplikasi.
 *
 * Sebelumnya tipe union 15 tab ini diulang di banyak komponen (App, Header,
 * Sidebar, MasterDataView) dan routing manual berbasis window.history.
 * Seluruh definisi kini tinggal di satu berkas ini dan dikonsumsi oleh
 * React Router.
 */

import { TabId } from '../types';
export type { TabId };

/** Tab yang ditampilkan tanpa sidebar master (halaman publik / portal siswa). */
export const PUBLIC_TABS: TabId[] = ['showcase', 'cek', 'kelas7', 'pengganti', 'kuis', 'excel', 'materi', 'praktek'];

export function isPublicTab(tab: TabId): boolean {
  return PUBLIC_TABS.includes(tab);
}

/** Jalur URL kanonik untuk setiap tab. */
export const TAB_PATHS: Record<TabId, string> = {
  showcase: '/arsip-karya',
  master: '/master',
  tasks: '/master/tasks',
  students: '/master/students',
  grades: '/master/grades',
  calculator: '/master/calculator',
  spreadsheet: '/master/spreadsheet',
  cek: '/cek',
  kelas7: '/kelas7',
  pengganti: '/pengganti',
  substitute_tasks: '/master/substitute',
  kuis: '/kuis',
  master_quiz: '/master/quiz',
  excel: '/',
  master_excel: '/master/excel',
  materi: '/',
  praktek: '/praktek',
};

/**
 * Alias URL -> tab (dipertahankan agar tautan lama tetap berfungsi).
 * Halaman /materi sudah dihapus — materi kini menjadi beranda ("/"); tautan
 * lama jatuh ke fallback React Router yang juga merender MateriView.
 * Urutan tidak berpengaruh; React Router memilih kecocokan paling spesifik.
 */
export const PATH_ALIASES: Array<{ path: string; tab: TabId }> = [
  { path: '/arsip-karya', tab: 'showcase' },
  { path: '/showcase', tab: 'showcase' },
  { path: '/master/excel', tab: 'master_excel' },
  { path: '/master/lab-excel', tab: 'master_excel' },
  { path: '/kuis', tab: 'kuis' },
  { path: '/quiz', tab: 'kuis' },
  { path: '/ujian', tab: 'kuis' },
  { path: '/master/quiz', tab: 'master_quiz' },
  { path: '/master/kuis', tab: 'master_quiz' },
  { path: '/kelas7', tab: 'kelas7' },
  { path: '/kelas-7', tab: 'kelas7' },
  { path: '/cek-kelas7', tab: 'kelas7' },
  { path: '/cek7', tab: 'kelas7' },
  { path: '/cek', tab: 'cek' },
  { path: '/check', tab: 'cek' },
  { path: '/login-siswa', tab: 'cek' },
  { path: '/pengganti', tab: 'pengganti' },
  { path: '/tugas-pengganti', tab: 'pengganti' },
  { path: '/pengganti-kka2', tab: 'pengganti' },
  { path: '/kka2', tab: 'pengganti' },
  { path: '/master', tab: 'master' },
  { path: '/master/students', tab: 'students' },
  { path: '/students', tab: 'students' },
  { path: '/master/grades', tab: 'grades' },
  { path: '/grades', tab: 'grades' },
  { path: '/master/calculator', tab: 'calculator' },
  { path: '/calculator', tab: 'calculator' },
  { path: '/kalkulator', tab: 'calculator' },
  { path: '/master/tasks', tab: 'tasks' },
  { path: '/tasks', tab: 'tasks' },
  { path: '/master/substitute', tab: 'substitute_tasks' },
  { path: '/master/pengganti', tab: 'substitute_tasks' },
  { path: '/master/tugas-pengganti', tab: 'substitute_tasks' },
  { path: '/substitute', tab: 'substitute_tasks' },
  { path: '/master/spreadsheet', tab: 'spreadsheet' },
  { path: '/spreadsheet', tab: 'spreadsheet' },
  { path: '/praktek', tab: 'praktek' },
  { path: '/praktik', tab: 'praktek' },
];

/** Tentukan tab aktif dari sebuah pathname URL. */
export function getTabFromPath(path: string): TabId {
  const cleanPath = (path || '/').toLowerCase().replace(/\/$/, '') || '/';
  const alias = PATH_ALIASES.find((a) => a.path === cleanPath);
  if (alias) return alias.tab;
  // Default — termasuk "/" dan path lama yang tak dikenal — adalah beranda Materi.
  return 'materi';
}

/** Hitung URL tujuan untuk sebuah tab (dapat dipaksa via targetPath). */
export function resolveTabPath(tab: TabId, targetPath?: string): string {
  if (targetPath) return targetPath;
  // Tab 'excel' (Laboratorium) kini dipusatkan di MateriView
  const effectiveTab = tab === 'excel' ? 'materi' : tab;
  return TAB_PATHS[effectiveTab] || '/';
}
