export interface Student {
  id: string;
  nis: string;
  name: string;
  className: string;
  group: string; // e.g. 'Kelompok 1'
  attendanceNo?: string; // No Absen (1..40)
  gender?: string; // L / P
  email?: string;
  status: 'Aktif' | 'Nonaktif';
  createdAt?: string;
}

export type TaskType = 'individu' | 'kelompok';

export interface GroupMember {
  name: string;
  attendanceNo: string; // No Absen
}

export type TaskStatus = 'Selesai' | 'Dalam Peninjauan' | 'Perlu Revisi';

export interface TaskSubmission {
  id: string;
  submittedAt: string; // ISO or 'DD/MM/YYYY HH:mm'
  taskType: TaskType; // 'individu' | 'kelompok'
  className: string; // Kelas e.g. 'Kelas 8D' or 'Kelas 8A'
  
  // Field untuk Tugas Individu
  studentName: string;
  attendanceNo?: string; // No Absen
  studentNis?: string;

  // Field untuk Tugas Kelompok
  group: string; // e.g. 'Kelompok 1' / 'Kelompok 5'
  groupMembers?: GroupMember[]; // Anggota kelompok & No Absen masing-masing
  
  // Detail Karya / Web
  taskTitle: string;
  descriptionOrLink: string;
  screenshotUrl?: string;
  status: TaskStatus;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'task_submitted' | 'sync_success' | 'info';
  read: boolean;
  taskId?: string;
}

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  lastSyncedAt: string | null;
  autoSyncIntervalSec: number;
}
