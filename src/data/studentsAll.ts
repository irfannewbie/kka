import { Student } from '../types';
import { ALL_255_STUDENTS } from './students255';

// Database Siswa Kelas 7 (7E s.d. 7H) - SMP Negeri 1 Wedi
// Data autentik tersinkronisasi langsung dengan tab sheet 7E, 7F, 7G, dan 7H pada Google Spreadsheet (Total 128 Siswa: 32 Siswa per Kelas 7E-7H)
export const KELAS_7_STUDENTS: Student[] = [
  // === KELAS 7E (32 Siswa) ===
  { id: 'std-7e-1', nis: '11881', name: 'AKBAR GHIBRAN HERSEANDO', className: 'Kelas 7E', group: 'Kelompok 1', attendanceNo: '1', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-2', nis: '11882', name: 'ALDRIC AQILA PRATISTA', className: 'Kelas 7E', group: 'Kelompok 1', attendanceNo: '2', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-3', nis: '11883', name: 'ALMA ROSIDA', className: 'Kelas 7E', group: 'Kelompok 1', attendanceNo: '3', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-4', nis: '11884', name: 'ALVIN WAHYU SAPUTRA', className: 'Kelas 7E', group: 'Kelompok 1', attendanceNo: '4', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-5', nis: '11885', name: 'APRILIO AZHAR AUFA', className: 'Kelas 7E', group: 'Kelompok 2', attendanceNo: '5', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-6', nis: '11886', name: 'ARYA NANDA ALEX PRADANA', className: 'Kelas 7E', group: 'Kelompok 2', attendanceNo: '6', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-7', nis: '11887', name: 'ARYANI ULFAH RIFAI', className: 'Kelas 7E', group: 'Kelompok 2', attendanceNo: '7', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-8', nis: '11888', name: 'AZAQIO ARUM HANDARIANO', className: 'Kelas 7E', group: 'Kelompok 2', attendanceNo: '8', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-9', nis: '11889', name: 'BRAMASTA ALIFIANDRA BAIHAQI', className: 'Kelas 7E', group: 'Kelompok 3', attendanceNo: '9', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-10', nis: '11890', name: 'DAFFA ATALLAH', className: 'Kelas 7E', group: 'Kelompok 3', attendanceNo: '10', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-11', nis: '11891', name: 'FAISHAL HIBATULLAH', className: 'Kelas 7E', group: 'Kelompok 3', attendanceNo: '11', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-12', nis: '11892', name: 'FARIZ NAUFAL HANDOKO', className: 'Kelas 7E', group: 'Kelompok 3', attendanceNo: '12', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-13', nis: '11893', name: 'GELEGAR LANANG RIENANDA FEBRANO PURNOMO', className: 'Kelas 7E', group: 'Kelompok 4', attendanceNo: '13', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-14', nis: '11894', name: 'HANURA DEWA MAHADIKA', className: 'Kelas 7E', group: 'Kelompok 4', attendanceNo: '14', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-15', nis: '11895', name: 'INDAH LESTARI', className: 'Kelas 7E', group: 'Kelompok 4', attendanceNo: '15', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-16', nis: '11896', name: 'KANAYA ALMALIKA', className: 'Kelas 7E', group: 'Kelompok 4', attendanceNo: '16', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-17', nis: '11897', name: 'KHUMAIRA AQILLA PUTRI', className: 'Kelas 7E', group: 'Kelompok 5', attendanceNo: '17', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-18', nis: '11898', name: 'MUHAMMAD AL GHOZALI', className: 'Kelas 7E', group: 'Kelompok 5', attendanceNo: '18', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-19', nis: '11899', name: 'MUHAMMAD NUR ALVIANSYAH', className: 'Kelas 7E', group: 'Kelompok 5', attendanceNo: '19', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-20', nis: '11900', name: 'NAJWA KHAIRA WILDA', className: 'Kelas 7E', group: 'Kelompok 5', attendanceNo: '20', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-21', nis: '11901', name: 'NAURA ZAHRA TUNIDA', className: 'Kelas 7E', group: 'Kelompok 6', attendanceNo: '21', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-22', nis: '11902', name: 'NAVISA MEILINDA PRASETYANI', className: 'Kelas 7E', group: 'Kelompok 6', attendanceNo: '22', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-23', nis: '11903', name: 'NOVIANA WINANDA PUTRI', className: 'Kelas 7E', group: 'Kelompok 6', attendanceNo: '23', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-24', nis: '11904', name: 'NUZULUL ISNADIA', className: 'Kelas 7E', group: 'Kelompok 6', attendanceNo: '24', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-25', nis: '11905', name: 'RANGGA BINTANG PRAYUDHA', className: 'Kelas 7E', group: 'Kelompok 7', attendanceNo: '25', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-26', nis: '11906', name: 'SALSABILA AYU HANIFA', className: 'Kelas 7E', group: 'Kelompok 7', attendanceNo: '26', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-27', nis: '11907', name: 'SILVI SINTIA SARI', className: 'Kelas 7E', group: 'Kelompok 7', attendanceNo: '27', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-28', nis: '11908', name: 'SYAQILA AL MUTHAQIA', className: 'Kelas 7E', group: 'Kelompok 7', attendanceNo: '28', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-29', nis: '11909', name: 'UMAMAH QORI HUDAFILATIFA', className: 'Kelas 7E', group: 'Kelompok 8', attendanceNo: '29', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-30', nis: '11910', name: 'VIVI AULIA PUTRI', className: 'Kelas 7E', group: 'Kelompok 8', attendanceNo: '30', gender: 'P', status: 'Aktif' },
  { id: 'std-7e-31', nis: '11911', name: 'WAHYU FAJAR ADITYA', className: 'Kelas 7E', group: 'Kelompok 8', attendanceNo: '31', gender: 'L', status: 'Aktif' },
  { id: 'std-7e-32', nis: '11912', name: 'ZULVIA RISKIKA SAHVARA', className: 'Kelas 7E', group: 'Kelompok 8', attendanceNo: '32', gender: 'P', status: 'Aktif' },

  // === KELAS 7F (32 Siswa) ===
  { id: 'std-7f-1', nis: '11913', name: 'ABRIZAN ALFARISI SETIYAWAN', className: 'Kelas 7F', group: 'Kelompok 1', attendanceNo: '1', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-2', nis: '11914', name: 'ADINDA NAJWA AZ-ZAHRA', className: 'Kelas 7F', group: 'Kelompok 1', attendanceNo: '2', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-3', nis: '11915', name: 'AHMAD WONNIE YULFAQOR', className: 'Kelas 7F', group: 'Kelompok 1', attendanceNo: '3', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-4', nis: '11916', name: 'AHNAF BINTANG AL FAHREZI', className: 'Kelas 7F', group: 'Kelompok 1', attendanceNo: '4', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-5', nis: '11917', name: 'AILA ATIKA ASHARI', className: 'Kelas 7F', group: 'Kelompok 2', attendanceNo: '5', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-6', nis: '11918', name: 'ALIF AJI HIMAWAN', className: 'Kelas 7F', group: 'Kelompok 2', attendanceNo: '6', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-7', nis: '11919', name: 'ANISA SYAFA ISLAMIAH', className: 'Kelas 7F', group: 'Kelompok 2', attendanceNo: '7', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-8', nis: '11920', name: 'AQILA CITRA NUR FADHIN', className: 'Kelas 7F', group: 'Kelompok 2', attendanceNo: '8', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-9', nis: '11921', name: 'ASA WIDIANO', className: 'Kelas 7F', group: 'Kelompok 3', attendanceNo: '9', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-10', nis: '11922', name: 'ASYRAF HIZBULLAH', className: 'Kelas 7F', group: 'Kelompok 3', attendanceNo: '10', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-11', nis: '11923', name: 'AYDI AKMALA AFLAHA', className: 'Kelas 7F', group: 'Kelompok 3', attendanceNo: '11', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-12', nis: '11924', name: 'BILQIS AFIQA NUR FAEYZA', className: 'Kelas 7F', group: 'Kelompok 3', attendanceNo: '12', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-13', nis: '11925', name: 'CANIA AYU NOVELITA', className: 'Kelas 7F', group: 'Kelompok 4', attendanceNo: '13', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-14', nis: '11926', name: 'DIAZ AHMAD RAMADHAN', className: 'Kelas 7F', group: 'Kelompok 4', attendanceNo: '14', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-15', nis: '11927', name: 'FADLAN RAMADHAN BAHAR', className: 'Kelas 7F', group: 'Kelompok 4', attendanceNo: '15', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-16', nis: '11928', name: 'JALERKU AIRKAYYA RAFA DEWA', className: 'Kelas 7F', group: 'Kelompok 4', attendanceNo: '16', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-17', nis: '11929', name: 'KAYLA ATHAYA PRABOWO', className: 'Kelas 7F', group: 'Kelompok 5', attendanceNo: '17', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-18', nis: '11930', name: 'MUHAMMAD BAYU RAMADIKA', className: 'Kelas 7F', group: 'Kelompok 5', attendanceNo: '18', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-19', nis: '11931', name: 'MUHAMMAD FADLAN SAPUTRA', className: 'Kelas 7F', group: 'Kelompok 5', attendanceNo: '19', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-20', nis: '11932', name: 'MUHAMMAD HAFIZH ARZIKY', className: 'Kelas 7F', group: 'Kelompok 5', attendanceNo: '20', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-21', nis: '11933', name: 'MUHAMMAD KHAERUL AZZAM', className: 'Kelas 7F', group: 'Kelompok 6', attendanceNo: '21', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-22', nis: '11934', name: 'MUHAMMAD RISKI PRATAMA', className: 'Kelas 7F', group: 'Kelompok 6', attendanceNo: '22', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-23', nis: '11935', name: 'NAZWA YUSTINA NUR AZZAHRA', className: 'Kelas 7F', group: 'Kelompok 6', attendanceNo: '23', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-24', nis: '11936', name: 'NIA RAHMADHANI AL KASIH', className: 'Kelas 7F', group: 'Kelompok 6', attendanceNo: '24', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-25', nis: '11937', name: 'NICKO PAUNDRA CAHYA', className: 'Kelas 7F', group: 'Kelompok 7', attendanceNo: '25', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-26', nis: '11938', name: 'RAISHA ANINDITA', className: 'Kelas 7F', group: 'Kelompok 7', attendanceNo: '26', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-27', nis: '11939', name: 'RAIYA BILQIS NURFAIZAH', className: 'Kelas 7F', group: 'Kelompok 7', attendanceNo: '27', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-28', nis: '11940', name: 'RAUF IKHSAN MAULANA NUGROHO', className: 'Kelas 7F', group: 'Kelompok 7', attendanceNo: '28', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-29', nis: '11941', name: 'REAGAN FADHIL NASHRULLAH', className: 'Kelas 7F', group: 'Kelompok 8', attendanceNo: '29', gender: 'L', status: 'Aktif' },
  { id: 'std-7f-30', nis: '11942', name: 'SABRINA OLIFIA LAILI RAMADHANI', className: 'Kelas 7F', group: 'Kelompok 8', attendanceNo: '30', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-31', nis: '11943', name: 'SEPTI AULIA HAPSARI', className: 'Kelas 7F', group: 'Kelompok 8', attendanceNo: '31', gender: 'P', status: 'Aktif' },
  { id: 'std-7f-32', nis: '11944', name: 'YAZID RIZQI APRIYANTO', className: 'Kelas 7F', group: 'Kelompok 8', attendanceNo: '32', gender: 'L', status: 'Aktif' },

  // === KELAS 7G (32 Siswa) ===
  { id: 'std-7g-1', nis: '11945', name: 'ADIEL FATHUR RAHMAN', className: 'Kelas 7G', group: 'Kelompok 1', attendanceNo: '1', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-2', nis: '11946', name: 'AFIQ AFANDI', className: 'Kelas 7G', group: 'Kelompok 1', attendanceNo: '2', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-3', nis: '11947', name: 'AMELIA SETYA AZZAHRA', className: 'Kelas 7G', group: 'Kelompok 1', attendanceNo: '3', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-4', nis: '11948', name: 'ANANDA KEYSHA', className: 'Kelas 7G', group: 'Kelompok 1', attendanceNo: '4', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-5', nis: '11949', name: 'ARAWINDA LESTIA SARI', className: 'Kelas 7G', group: 'Kelompok 2', attendanceNo: '5', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-6', nis: '11950', name: 'AWALIA NURBAITI RAHAYU', className: 'Kelas 7G', group: 'Kelompok 2', attendanceNo: '6', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-7', nis: '11951', name: 'BAGAS WIDI ANJAR', className: 'Kelas 7G', group: 'Kelompok 2', attendanceNo: '7', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-8', nis: '11952', name: 'BAGUS PUTRA PAMUNGKAS', className: 'Kelas 7G', group: 'Kelompok 2', attendanceNo: '8', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-9', nis: '11953', name: 'CIVAS PUTRA PRADANA', className: 'Kelas 7G', group: 'Kelompok 3', attendanceNo: '9', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-10', nis: '11954', name: 'DANANG ADI PAMUNGKAS', className: 'Kelas 7G', group: 'Kelompok 3', attendanceNo: '10', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-11', nis: '11955', name: 'DENISA YUNITA FITRIYANTI', className: 'Kelas 7G', group: 'Kelompok 3', attendanceNo: '11', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-12', nis: '11956', name: 'DESTA ADELIA', className: 'Kelas 7G', group: 'Kelompok 3', attendanceNo: '12', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-13', nis: '11957', name: 'DIMAS NUR IKHSAN', className: 'Kelas 7G', group: 'Kelompok 4', attendanceNo: '13', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-14', nis: '11958', name: 'DINTA AGUSTIN', className: 'Kelas 7G', group: 'Kelompok 4', attendanceNo: '14', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-15', nis: '11959', name: 'HABIBI NUR ILHAM', className: 'Kelas 7G', group: 'Kelompok 4', attendanceNo: '15', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-16', nis: '11960', name: 'INDRA WIJAYA ROHMADHANI', className: 'Kelas 7G', group: 'Kelompok 4', attendanceNo: '16', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-17', nis: '11961', name: 'IVAN NAYOTTAMA', className: 'Kelas 7G', group: 'Kelompok 5', attendanceNo: '17', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-18', nis: '11962', name: 'JULIA ERMA', className: 'Kelas 7G', group: 'Kelompok 5', attendanceNo: '18', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-19', nis: '11963', name: 'KEANDRE RASENDRIYA PRATAMA', className: 'Kelas 7G', group: 'Kelompok 5', attendanceNo: '19', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-20', nis: '11964', name: 'KEYRA FADILA NUR RAMADHANI', className: 'Kelas 7G', group: 'Kelompok 5', attendanceNo: '20', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-21', nis: '11965', name: 'MAWAR ADELIA PUTRI', className: 'Kelas 7G', group: 'Kelompok 6', attendanceNo: '21', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-22', nis: '11966', name: 'MUHAMMAD DIMAS PRASETYO', className: 'Kelas 7G', group: 'Kelompok 6', attendanceNo: '22', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-23', nis: '11967', name: 'MUHAMMAD GURUH ALL DZIQRI', className: 'Kelas 7G', group: 'Kelompok 6', attendanceNo: '23', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-24', nis: '11968', name: 'MUHAMMAD WISNU PRABOWO', className: 'Kelas 7G', group: 'Kelompok 6', attendanceNo: '24', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-25', nis: '11969', name: 'MUTIARA ANUGRAHINI', className: 'Kelas 7G', group: 'Kelompok 7', attendanceNo: '25', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-26', nis: '11970', name: 'NAGASTHA PUTRA ANUGRAH', className: 'Kelas 7G', group: 'Kelompok 7', attendanceNo: '26', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-27', nis: '11971', name: 'NAJWA SELLA NAVINZKY', className: 'Kelas 7G', group: 'Kelompok 7', attendanceNo: '27', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-28', nis: '11972', name: 'OLIVIA NUR AZIZAH', className: 'Kelas 7G', group: 'Kelompok 7', attendanceNo: '28', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-29', nis: '11973', name: 'QAIREEN ALYA AZZALEA', className: 'Kelas 7G', group: 'Kelompok 8', attendanceNo: '29', gender: 'P', status: 'Aktif' },
  { id: 'std-7g-30', nis: '11974', name: 'RAHMAT NUR KHAIRI', className: 'Kelas 7G', group: 'Kelompok 8', attendanceNo: '30', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-31', nis: '11975', name: 'YUNUS YUDHISTIRA', className: 'Kelas 7G', group: 'Kelompok 8', attendanceNo: '31', gender: 'L', status: 'Aktif' },
  { id: 'std-7g-32', nis: '11976', name: 'ZIAN ALVINZA REVANO', className: 'Kelas 7G', group: 'Kelompok 8', attendanceNo: '32', gender: 'L', status: 'Aktif' },

  // === KELAS 7H (32 Siswa) ===
  { id: 'std-7h-1', nis: '11977', name: 'AFIFAH LABIBAH HUSNA', className: 'Kelas 7H', group: 'Kelompok 1', attendanceNo: '1', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-2', nis: '11978', name: 'ALIF SETYA SAPUTRA', className: 'Kelas 7H', group: 'Kelompok 1', attendanceNo: '2', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-3', nis: '11979', name: 'ALIYYA FARISZA', className: 'Kelas 7H', group: 'Kelompok 1', attendanceNo: '3', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-4', nis: '11980', name: 'ANGGITO ABIMANYU', className: 'Kelas 7H', group: 'Kelompok 1', attendanceNo: '4', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-5', nis: '11981', name: 'ANGGRA DWI CAHYATI', className: 'Kelas 7H', group: 'Kelompok 2', attendanceNo: '5', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-6', nis: '11982', name: 'ARDIAN PUTRA FIRMANSYAH', className: 'Kelas 7H', group: 'Kelompok 2', attendanceNo: '6', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-7', nis: '11983', name: 'ARJUNA RAZKA SHANUM BUDIARSA', className: 'Kelas 7H', group: 'Kelompok 2', attendanceNo: '7', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-8', nis: '11984', name: 'ARSYELA KHANZA PUTRI', className: 'Kelas 7H', group: 'Kelompok 2', attendanceNo: '8', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-9', nis: '11985', name: 'ASKARI GANJAR ARIYANTO', className: 'Kelas 7H', group: 'Kelompok 3', attendanceNo: '9', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-10', nis: '11986', name: 'BELLVANIA TSAQIB PURNAMA', className: 'Kelas 7H', group: 'Kelompok 3', attendanceNo: '10', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-11', nis: '11987', name: 'BILQIS AINA TALITA ZAHRON', className: 'Kelas 7H', group: 'Kelompok 3', attendanceNo: '11', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-12', nis: '11988', name: 'CHAIRUL IHSAN MAULANA', className: 'Kelas 7H', group: 'Kelompok 3', attendanceNo: '12', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-13', nis: '11989', name: 'DEA PUTRI NAJWA AQILA', className: 'Kelas 7H', group: 'Kelompok 4', attendanceNo: '13', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-14', nis: '11990', name: 'FABIAN BIHARU MUSTOFA', className: 'Kelas 7H', group: 'Kelompok 4', attendanceNo: '14', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-15', nis: '11991', name: 'HASYA KALILA RAYSYAPUTRI', className: 'Kelas 7H', group: 'Kelompok 4', attendanceNo: '15', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-16', nis: '11992', name: 'HERLANGGA PRASETYO', className: 'Kelas 7H', group: 'Kelompok 4', attendanceNo: '16', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-17', nis: '11993', name: 'HUDA YANRISTA', className: 'Kelas 7H', group: 'Kelompok 5', attendanceNo: '17', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-18', nis: '11994', name: 'KHANSA AQILA HANIFA', className: 'Kelas 7H', group: 'Kelompok 5', attendanceNo: '18', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-19', nis: '11995', name: 'LATIFA NUR AINI', className: 'Kelas 7H', group: 'Kelompok 5', attendanceNo: '19', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-20', nis: '11996', name: 'LATIFAH TRI ANANTA', className: 'Kelas 7H', group: 'Kelompok 5', attendanceNo: '20', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-21', nis: '11997', name: 'LUKMANUL HAKIM', className: 'Kelas 7H', group: 'Kelompok 6', attendanceNo: '21', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-22', nis: '11998', name: 'MARCELLO DZIKRI IVANDER WIDODO', className: 'Kelas 7H', group: 'Kelompok 6', attendanceNo: '22', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-23', nis: '11999', name: 'NAFEEZA ARSYFA KHALILA DEBI', className: 'Kelas 7H', group: 'Kelompok 6', attendanceNo: '23', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-24', nis: '12000', name: 'NATIGA RAMADHANDYA WINATA', className: 'Kelas 7H', group: 'Kelompok 6', attendanceNo: '24', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-25', nis: '12001', name: 'NAUVAL ZIKRI HADY', className: 'Kelas 7H', group: 'Kelompok 7', attendanceNo: '25', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-26', nis: '12002', name: 'OSCAR LATEEF ADINATA', className: 'Kelas 7H', group: 'Kelompok 7', attendanceNo: '26', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-27', nis: '12003', name: 'PUTRA TRIDO MURTI', className: 'Kelas 7H', group: 'Kelompok 7', attendanceNo: '27', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-28', nis: '12004', name: "RAHMAD SINAR RIFA'I", className: 'Kelas 7H', group: 'Kelompok 7', attendanceNo: '28', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-29', nis: '12005', name: 'TIARA RAMADHANI', className: 'Kelas 7H', group: 'Kelompok 8', attendanceNo: '29', gender: 'P', status: 'Aktif' },
  { id: 'std-7h-30', nis: '12006', name: 'VINCENT ADITYA PUTRA', className: 'Kelas 7H', group: 'Kelompok 8', attendanceNo: '30', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-31', nis: '12007', name: 'YUDISTIRA ALIFYA NOVANDRA RISCHI', className: 'Kelas 7H', group: 'Kelompok 8', attendanceNo: '31', gender: 'L', status: 'Aktif' },
  { id: 'std-7h-32', nis: '12008', name: 'YUTAKA ALFARIDZI ARDHI PRAWOTO', className: 'Kelas 7H', group: 'Kelompok 8', attendanceNo: '32', gender: 'L', status: 'Aktif' },
];

// Gabungan database lengkap seluruh siswa Kelas 7E-7H & Kelas 8A-8H SMP Negeri 1 Wedi (Total 383 Siswa: 128 Siswa Kelas 7E-7H & 255 Siswa Kelas 8A-8H)
export const ALL_STUDENTS_DATABASE: Student[] = [
  ...ALL_255_STUDENTS,
  ...KELAS_7_STUDENTS,
];

export const GRADE_7_CLASSES = ['Kelas 7E', 'Kelas 7F', 'Kelas 7G', 'Kelas 7H'];
export const GRADE_8_CLASSES = ['Kelas 8A', 'Kelas 8B', 'Kelas 8C', 'Kelas 8D', 'Kelas 8E', 'Kelas 8F', 'Kelas 8G', 'Kelas 8H'];
export const ALL_CLASSES = [...GRADE_7_CLASSES, ...GRADE_8_CLASSES];

export function getStudentsByClass(className: string): Student[] {
  const norm = className.replace(/^Kelas\s*/i, '').trim().toUpperCase();
  return ALL_STUDENTS_DATABASE.filter((s) => {
    const sNorm = s.className.replace(/^Kelas\s*/i, '').trim().toUpperCase();
    return sNorm === norm;
  }).sort((a, b) => {
    const noA = parseInt(a.attendanceNo || '0', 10);
    const noB = parseInt(b.attendanceNo || '0', 10);
    return noA - noB;
  });
}
