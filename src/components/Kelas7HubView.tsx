import React from 'react';
import { Student } from '../types';
import { StudentCheckView } from './StudentCheckView';

interface Kelas7HubViewProps {
  students: Student[];
  spreadsheetId: string;
  spreadsheetUrl: string;
  initialSubTab?: string;
  onNavigateHome: () => void;
  onNavigateCek: () => void;
  onNavigateMateri?: () => void;
}

export const Kelas7HubView: React.FC<Kelas7HubViewProps> = ({
  students,
  spreadsheetId,
  spreadsheetUrl,
  onNavigateHome,
  onNavigateCek,
  onNavigateMateri,
}) => {
  return (
    <div className="space-y-4">
      {/* Halaman /kelas7 didedikasikan murni untuk Portal Cek Nilai & Pengerjaan Tugas Siswa (Kelas 7E - 7H) */}
      <StudentCheckView
        key="cek-kelas7-hub"
        gradeLevel="7"
        students={students}
        spreadsheetId={spreadsheetId}
        spreadsheetUrl={spreadsheetUrl}
        onNavigateHome={onNavigateHome}
        onNavigateCek={onNavigateCek}
        onNavigateExcel={onNavigateMateri}
      />
    </div>
  );
};
