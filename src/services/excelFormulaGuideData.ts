import { ExcelFormulaGuideItem, ExcelWorkbookData, ExcelSheetData, ExcelCellData } from '../types/excelLab';
import { recomputeSheet } from './excelFormulaEngine';

// Helper to create blank sheet for guide samples
function createGuideSheet(id: string, name: string, rowCount: number = 12, colCount: number = 8): ExcelSheetData {
  return {
    id,
    name,
    cells: {},
    rowCount,
    colCount,
  };
}

// Helper to set cell in guide sheet
function setGuideCell(
  sheet: ExcelSheetData,
  ref: string,
  raw: string,
  opts?: Partial<Omit<ExcelCellData, 'raw'>>
): void {
  const cleanRef = ref.toUpperCase().trim();
  sheet.cells[cleanRef] = {
    raw,
    computed: /^-?\d+(\.\d+)?$/.test(raw) ? parseFloat(raw) : raw,
    ...opts,
  };
}

function wrapGuideWorkbook(id: string, title: string, sheet: ExcelSheetData): ExcelWorkbookData {
  const recomputed = recomputeSheet(sheet);
  return {
    id,
    title,
    sheets: [recomputed],
    activeSheetId: recomputed.id,
  };
}

export const DEFAULT_FORMULA_GUIDES: ExcelFormulaGuideItem[] = [
  // =========================================================================
  // 1. FUNGSI DASAR & ARITMATIKA
  // =========================================================================
  {
    id: 'guide-sum',
    name: 'SUM',
    category: 'Aritmatika & Dasar',
    syntax: '=SUM(range_atau_angka1, [angka2], ...)',
    description: 'Menjumlahkan seluruh nilai numerik di dalam sekumpulan sel atau rentang sel yang dipilih.',
    parameters: [
      { name: 'range_atau_angka1', desc: 'Rentang sel berisi angka yang akan dijumlahkan, misal B2:B5 atau 10, 20, 30' },
      { name: '[angka2]', desc: 'Argumen rentang tambahan opsional yang ingin ikut dijumlahkan' },
    ],
    exampleFormula: '=SUM(B2:B5)',
    exampleOutput: '320',
    schoolUseCase: 'Menghitung total perolehan nilai tugas siswa, akumulasi saldo kas kelas, atau total jam praktikum.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-sum', 'Contoh_SUM');
      setGuideCell(s, 'A1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Nilai Harian', { bold: true });
      setGuideCell(s, 'A2', 'Ahmad Dani'); setGuideCell(s, 'B2', '80');
      setGuideCell(s, 'A3', 'Budi Santoso'); setGuideCell(s, 'B3', '75');
      setGuideCell(s, 'A4', 'Citra Lestari'); setGuideCell(s, 'B4', '90');
      setGuideCell(s, 'A5', 'Dewi Rahayu'); setGuideCell(s, 'B5', '75');
      setGuideCell(s, 'A6', 'TOTAL KESELURUHAN', { bold: true });
      setGuideCell(s, 'B6', '=SUM(B2:B5)', { bold: true, bg: '#dbeafe' });
      return wrapGuideWorkbook('wb-g-sum', 'Contoh SUM', s);
    })(),
  },
  {
    id: 'guide-count',
    name: 'COUNT',
    category: 'Aritmatika & Dasar',
    syntax: '=COUNT(range_atau_nilai1, [nilai2], ...)',
    description: 'Menghitung berapa banyak sel yang HANYA berisi data angka (numerik). Sel kosong atau teks diabaikan.',
    parameters: [
      { name: 'range', desc: 'Rentang sel yang diperiksa keberadaan nilai angkanya, misal C2:C10' },
    ],
    exampleFormula: '=COUNT(B2:B6)',
    exampleOutput: '4',
    schoolUseCase: 'Mengetahui berapa siswa yang sudah memiliki nilai angka ulangan (siswa yang belum ujian bernilai kosong/teks "Sakit" tidak dihitung).',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-count', 'Contoh_COUNT');
      setGuideCell(s, 'A1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Nilai Ujian', { bold: true });
      setGuideCell(s, 'A2', 'Farhan'); setGuideCell(s, 'B2', '85');
      setGuideCell(s, 'A3', 'Gita'); setGuideCell(s, 'B3', 'Belum Ikut');
      setGuideCell(s, 'A4', 'Hendra'); setGuideCell(s, 'B4', '78');
      setGuideCell(s, 'A5', 'Indah'); setGuideCell(s, 'B5', '92');
      setGuideCell(s, 'A6', 'Joko'); setGuideCell(s, 'B6', '88');
      setGuideCell(s, 'A7', 'SISWA SUDAH BERANGKA', { bold: true });
      setGuideCell(s, 'B7', '=COUNT(B2:B6)', { bold: true, bg: '#dbeafe' });
      return wrapGuideWorkbook('wb-g-count', 'Contoh COUNT', s);
    })(),
  },
  {
    id: 'guide-counta',
    name: 'COUNTA',
    category: 'Aritmatika & Dasar',
    syntax: '=COUNTA(range_sel)',
    description: 'Menghitung seluruh sel yang terisi (tidak kosong), baik berupa angka, teks, maupun simbol.',
    parameters: [
      { name: 'range_sel', desc: 'Rentang sel yang diperiksa apakah memiliki isi apa pun, misal A2:A20' },
    ],
    exampleFormula: '=COUNTA(A2:A6)',
    exampleOutput: '5',
    schoolUseCase: 'Menghitung total siswa yang terdaftar dalam daftar absensi kelas tanpa membedakan tipe data.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-counta', 'Contoh_COUNTA');
      setGuideCell(s, 'A1', 'No Urut', { bold: true });
      setGuideCell(s, 'B1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'A2', '1'); setGuideCell(s, 'B2', 'Aisyah');
      setGuideCell(s, 'A3', '2'); setGuideCell(s, 'B3', 'Bambang');
      setGuideCell(s, 'A4', '3'); setGuideCell(s, 'B4', 'Chandra');
      setGuideCell(s, 'A5', '4'); setGuideCell(s, 'B5', 'Dian');
      setGuideCell(s, 'A6', 'TOTAL SISWA TERISI', { bold: true });
      setGuideCell(s, 'B6', '=COUNTA(B2:B5)', { bold: true, bg: '#dcfce7' });
      return wrapGuideWorkbook('wb-g-counta', 'Contoh COUNTA', s);
    })(),
  },
  {
    id: 'guide-sumif',
    name: 'SUMIF',
    category: 'Aritmatika & Dasar',
    syntax: '=SUMIF(range_kriteria, kriteria, [range_penjumlahan])',
    description: 'Menjumlahkan nilai angka pada sel-sel tertentu hanya jika sel acuan memenuhi syarat atau kriteria khusus.',
    parameters: [
      { name: 'range_kriteria', desc: 'Rentang sel yang diuji kriterianya, misal B2:B10' },
      { name: 'kriteria', desc: 'Syarat pemfilteran, misal "Alat Tulis", "L", atau ">75"' },
      { name: '[range_penjumlahan]', desc: 'Rentang sel berisi angka yang sebenarnya dijumlahkan, misal D2:D10' },
    ],
    exampleFormula: '=SUMIF(B2:B6, "Makanan", C2:C6)',
    exampleOutput: '5500',
    schoolUseCase: 'Menghitung total pemasukan kas koperasi sekolah khusus untuk kategori makanan.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-sumif', 'Contoh_SUMIF');
      setGuideCell(s, 'A1', 'Nama Barang', { bold: true });
      setGuideCell(s, 'B1', 'Kategori', { bold: true });
      setGuideCell(s, 'C1', 'Pendapatan', { bold: true });
      setGuideCell(s, 'A2', 'Roti Bakar'); setGuideCell(s, 'B2', 'Makanan'); setGuideCell(s, 'C2', '3000');
      setGuideCell(s, 'A3', 'Pensil 2B'); setGuideCell(s, 'B3', 'Alat Tulis'); setGuideCell(s, 'C3', '2000');
      setGuideCell(s, 'A4', 'Biskuit Coklat'); setGuideCell(s, 'B4', 'Makanan'); setGuideCell(s, 'C4', '2500');
      setGuideCell(s, 'A5', 'Penghapus'); setGuideCell(s, 'B5', 'Alat Tulis'); setGuideCell(s, 'C5', '1000');
      setGuideCell(s, 'A6', 'TOTAL KHUSUS MAKANAN', { bold: true });
      setGuideCell(s, 'C6', '=SUMIF(B2:B5, "Makanan", C2:C5)', { bold: true, bg: '#fef3c7' });
      return wrapGuideWorkbook('wb-g-sumif', 'Contoh SUMIF', s);
    })(),
  },
  {
    id: 'guide-countif',
    name: 'COUNTIF',
    category: 'Aritmatika & Dasar',
    syntax: '=COUNTIF(range, kriteria)',
    description: 'Menghitung berapa banyak sel dalam rentang yang memenuhi syarat kriteria tertentu (misal teks atau perbandingan angka).',
    parameters: [
      { name: 'range', desc: 'Rentang sel yang dihitung, misal C2:C10' },
      { name: 'kriteria', desc: 'Syarat pencocokan, misal "Tuntas", "Hadir", atau ">=75"' },
    ],
    exampleFormula: '=COUNTIF(B2:B6, "Hadir")',
    exampleOutput: '4',
    schoolUseCase: 'Menghitung jumlah siswa yang hadir pada presensi harian atau berapa siswa yang tuntas KKTP.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-countif', 'Contoh_COUNTIF');
      setGuideCell(s, 'A1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Kehadiran', { bold: true });
      setGuideCell(s, 'A2', 'Rina'); setGuideCell(s, 'B2', 'Hadir');
      setGuideCell(s, 'A3', 'Surya'); setGuideCell(s, 'B3', 'Sakit');
      setGuideCell(s, 'A4', 'Taufik'); setGuideCell(s, 'B4', 'Hadir');
      setGuideCell(s, 'A5', 'Ulfa'); setGuideCell(s, 'B5', 'Hadir');
      setGuideCell(s, 'A6', 'Vina'); setGuideCell(s, 'B6', 'Hadir');
      setGuideCell(s, 'A7', 'JUMLAH SISWA HADIR', { bold: true });
      setGuideCell(s, 'B7', '=COUNTIF(B2:B6, "Hadir")', { bold: true, bg: '#dcfce7' });
      return wrapGuideWorkbook('wb-g-countif', 'Contoh COUNTIF', s);
    })(),
  },
  {
    id: 'guide-arithmetic',
    name: 'Operator Aritmatika (+, -, *, /, ^, %)',
    category: 'Aritmatika & Dasar',
    syntax: '=(sel1 + sel2) * sel3 / sel4 ^ sel5',
    description: 'Melakukan operasi matematika dasar: Penjumlahan (+), Pengurangan (-), Perkalian (*), Pembagian (/), Pemangkatan (^), Persentase (%), dan Kurung () untuk mengatur prioritas urutan hitung.',
    parameters: [
      { name: '+ dan -', desc: 'Operasi tambah dan kurang nilai angka' },
      { name: '* dan /', desc: 'Operasi kali dan bagi nilai angka' },
      { name: '^ dan %', desc: 'Pemangkatan angka (misal 2^3 = 8) dan persentase (misal 10% = 0.1)' },
      { name: '( )', desc: 'Tanda kurung untuk mendahulukan operasi perhitungan' },
    ],
    exampleFormula: '=(B2 * C2) - (B2 * C2 * 10%)',
    exampleOutput: '45000',
    schoolUseCase: 'Menghitung total harga belanja peralatan lab komputer dikurangi potongan diskon 10%.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-arith', 'Operator_Aritmatika');
      setGuideCell(s, 'A1', 'Nama Barang', { bold: true });
      setGuideCell(s, 'B1', 'Harga Satuan', { bold: true });
      setGuideCell(s, 'C1', 'Jumlah (Qty)', { bold: true });
      setGuideCell(s, 'D1', 'Total Bersih Diskon 10%', { bold: true });
      setGuideCell(s, 'A2', 'Kabel LAN Cat6');
      setGuideCell(s, 'B2', '50000');
      setGuideCell(s, 'C2', '1');
      setGuideCell(s, 'D2', '=(B2 * C2) - (B2 * C2 * 10%)', { bold: true, bg: '#dbeafe' });
      setGuideCell(s, 'A3', 'Konektor RJ45 (Pack)');
      setGuideCell(s, 'B3', '30000');
      setGuideCell(s, 'C3', '2');
      setGuideCell(s, 'D3', '=(B3 * C3) - (B3 * C3 * 10%)', { bold: true, bg: '#dbeafe' });
      return wrapGuideWorkbook('wb-g-arith', 'Operator Aritmatika', s);
    })(),
  },

  // =========================================================================
  // 2. FUNGSI STATISTIK DASAR
  // =========================================================================
  {
    id: 'guide-average',
    name: 'AVERAGE',
    category: 'Statistik',
    syntax: '=AVERAGE(range_angka)',
    description: 'Menghitung nilai rata-rata hitung (mean) dari sekumpulan angka di dalam rentang sel yang dipilih.',
    parameters: [
      { name: 'range_angka', desc: 'Rentang sel angka yang dicari nilai rata-ratanya, misal B2:D2' },
    ],
    exampleFormula: '=AVERAGE(B2:D2)',
    exampleOutput: '85',
    schoolUseCase: 'Menghitung nilai rata-rata rapor semester dari nilai Tugas, UTS, dan UAS siswa.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-avg', 'Contoh_AVERAGE');
      setGuideCell(s, 'A1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Tugas', { bold: true });
      setGuideCell(s, 'C1', 'UTS', { bold: true });
      setGuideCell(s, 'D1', 'UAS', { bold: true });
      setGuideCell(s, 'E1', 'RATA-RATA', { bold: true });
      setGuideCell(s, 'A2', 'Adinda Putri'); setGuideCell(s, 'B2', '80'); setGuideCell(s, 'C2', '85'); setGuideCell(s, 'D2', '90');
      setGuideCell(s, 'E2', '=AVERAGE(B2:D2)', { bold: true, bg: '#dbeafe' });
      setGuideCell(s, 'A3', 'Bagas Pratama'); setGuideCell(s, 'B3', '70'); setGuideCell(s, 'C3', '75'); setGuideCell(s, 'D3', '80');
      setGuideCell(s, 'E3', '=AVERAGE(B3:D3)', { bold: true, bg: '#dbeafe' });
      return wrapGuideWorkbook('wb-g-avg', 'Contoh AVERAGE', s);
    })(),
  },
  {
    id: 'guide-median',
    name: 'MEDIAN',
    category: 'Statistik',
    syntax: '=MEDIAN(range_angka)',
    description: 'Mencari nilai tengah dari sekumpulan data angka yang diurutkan dari yang terkecil hingga terbesar.',
    parameters: [
      { name: 'range_angka', desc: 'Rentang sel data angka yang akan dicari nilai mediannya, misal B2:B8' },
    ],
    exampleFormula: '=MEDIAN(B2:B6)',
    exampleOutput: '80',
    schoolUseCase: 'Menemukan titik tengah perolehan nilai ulangan informatika kelas untuk analisis sebaran capaian belajar.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-med', 'Contoh_MEDIAN');
      setGuideCell(s, 'A1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Nilai Harian', { bold: true });
      setGuideCell(s, 'A2', 'Siswa A'); setGuideCell(s, 'B2', '65');
      setGuideCell(s, 'A3', 'Siswa B'); setGuideCell(s, 'B3', '75');
      setGuideCell(s, 'A4', 'Siswa C'); setGuideCell(s, 'B4', '80');
      setGuideCell(s, 'A5', 'Siswa D'); setGuideCell(s, 'B5', '90');
      setGuideCell(s, 'A6', 'Siswa E'); setGuideCell(s, 'B6', '95');
      setGuideCell(s, 'A7', 'NILAI TENGAH (MEDIAN)', { bold: true });
      setGuideCell(s, 'B7', '=MEDIAN(B2:B6)', { bold: true, bg: '#fef3c7' });
      return wrapGuideWorkbook('wb-g-med', 'Contoh MEDIAN', s);
    })(),
  },
  {
    id: 'guide-max',
    name: 'MAX',
    category: 'Statistik',
    syntax: '=MAX(range_angka)',
    description: 'Mengambil nilai numerik paling tinggi (maksimum) dari sekumpulan data di dalam lembar kerja.',
    parameters: [
      { name: 'range_angka', desc: 'Rentang sel yang diperiksa nilai tertingginya, misal B2:B20' },
    ],
    exampleFormula: '=MAX(B2:B6)',
    exampleOutput: '95',
    schoolUseCase: 'Menentukan nilai ujian tertinggi siswa di satu kelas untuk apresiasi peringkat 1.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-max', 'Contoh_MAX');
      setGuideCell(s, 'A1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Skor Akhir', { bold: true });
      setGuideCell(s, 'A2', 'Citra'); setGuideCell(s, 'B2', '78');
      setGuideCell(s, 'A3', 'Dimas'); setGuideCell(s, 'B3', '95');
      setGuideCell(s, 'A4', 'Edo'); setGuideCell(s, 'B4', '82');
      setGuideCell(s, 'A5', 'Fani'); setGuideCell(s, 'B5', '88');
      setGuideCell(s, 'A6', 'NILAI TERTINGGI (MAX)', { bold: true });
      setGuideCell(s, 'B6', '=MAX(B2:B5)', { bold: true, bg: '#dcfce7' });
      return wrapGuideWorkbook('wb-g-max', 'Contoh MAX', s);
    })(),
  },
  {
    id: 'guide-min',
    name: 'MIN',
    category: 'Statistik',
    syntax: '=MIN(range_angka)',
    description: 'Mengambil nilai numerik paling rendah (minimum) dari sekumpulan data di dalam lembar kerja.',
    parameters: [
      { name: 'range_angka', desc: 'Rentang sel yang diperiksa nilai terendahnya, misal B2:B20' },
    ],
    exampleFormula: '=MIN(B2:B6)',
    exampleOutput: '68',
    schoolUseCase: 'Mendeteksi perolehan nilai terendah di kelas untuk memetakan siswa yang memerlukan bimbingan remedial.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-min', 'Contoh_MIN');
      setGuideCell(s, 'A1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Skor Akhir', { bold: true });
      setGuideCell(s, 'A2', 'Galih'); setGuideCell(s, 'B2', '74');
      setGuideCell(s, 'A3', 'Hani'); setGuideCell(s, 'B3', '68');
      setGuideCell(s, 'A4', 'Irfan'); setGuideCell(s, 'B4', '85');
      setGuideCell(s, 'A5', 'Julia'); setGuideCell(s, 'B5', '90');
      setGuideCell(s, 'A6', 'NILAI TERENDAH (MIN)', { bold: true });
      setGuideCell(s, 'B6', '=MIN(B2:B5)', { bold: true, bg: '#fee2e2' });
      return wrapGuideWorkbook('wb-g-min', 'Contoh MIN', s);
    })(),
  },
  {
    id: 'guide-large',
    name: 'LARGE',
    category: 'Statistik',
    syntax: '=LARGE(array_rentang, peringkat_k)',
    description: 'Mengambil nilai terbesar urutan ke-k dari sekumpulan data (misal: mencari nilai terbesar ke-2 atau ke-3).',
    parameters: [
      { name: 'array_rentang', desc: 'Rentang sel data angka yang diperiksa, misal B2:B10' },
      { name: 'peringkat_k', desc: 'Urutan peringkat terbesar yang diinginkan (angka 1, 2, 3...)' },
    ],
    exampleFormula: '=LARGE(B2:B6, 2)',
    exampleOutput: '90',
    schoolUseCase: 'Menentukan nilai peraih Juara 2 atau Juara 3 lomba olimpiade komputer tingkat sekolah.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-large', 'Contoh_LARGE');
      setGuideCell(s, 'A1', 'Nama Peserta', { bold: true });
      setGuideCell(s, 'B1', 'Skor Lomba', { bold: true });
      setGuideCell(s, 'A2', 'Peserta 1'); setGuideCell(s, 'B2', '82');
      setGuideCell(s, 'A3', 'Peserta 2'); setGuideCell(s, 'B3', '95');
      setGuideCell(s, 'A4', 'Peserta 3'); setGuideCell(s, 'B4', '78');
      setGuideCell(s, 'A5', 'Peserta 4'); setGuideCell(s, 'B5', '90');
      setGuideCell(s, 'A6', 'Peserta 5'); setGuideCell(s, 'B5', '88');
      setGuideCell(s, 'A7', 'SKOR TERBESAR KE-2 (JUARA 2)', { bold: true });
      setGuideCell(s, 'B7', '=LARGE(B2:B5, 2)', { bold: true, bg: '#fef3c7' });
      return wrapGuideWorkbook('wb-g-large', 'Contoh LARGE', s);
    })(),
  },
  {
    id: 'guide-small',
    name: 'SMALL',
    category: 'Statistik',
    syntax: '=SMALL(array_rentang, peringkat_k)',
    description: 'Mengambil nilai terkecil urutan ke-k dari sekumpulan data (misal: mencari nilai terkecil ke-1 atau ke-2).',
    parameters: [
      { name: 'array_rentang', desc: 'Rentang sel data angka yang diperiksa, misal B2:B10' },
      { name: 'peringkat_k', desc: 'Urutan peringkat terkecil yang diinginkan (angka 1, 2, 3...)' },
    ],
    exampleFormula: '=SMALL(B2:B6, 1)',
    exampleOutput: '65',
    schoolUseCase: 'Mencari catatan waktu lari tercepat (skor angka detik terkecil) pada ujian olahraga lari 100 meter.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-small', 'Contoh_SMALL');
      setGuideCell(s, 'A1', 'Nama Pelari', { bold: true });
      setGuideCell(s, 'B1', 'Waktu (Detik)', { bold: true });
      setGuideCell(s, 'A2', 'Pelari 1'); setGuideCell(s, 'B2', '14.5');
      setGuideCell(s, 'A3', 'Pelari 2'); setGuideCell(s, 'B3', '13.2');
      setGuideCell(s, 'A4', 'Pelari 3'); setGuideCell(s, 'B4', '15.0');
      setGuideCell(s, 'A5', 'Pelari 4'); setGuideCell(s, 'B5', '13.8');
      setGuideCell(s, 'A6', 'WAKTU TERCEPAT KE-1', { bold: true });
      setGuideCell(s, 'B6', '=SMALL(B2:B5, 1)', { bold: true, bg: '#dcfce7' });
      return wrapGuideWorkbook('wb-g-small', 'Contoh SMALL', s);
    })(),
  },

  // =========================================================================
  // 3. FUNGSI LOGIKA & CONDITIONAL
  // =========================================================================
  {
    id: 'guide-if',
    name: 'IF (Kondisional Tunggal & Bertingkat)',
    category: 'Logika & Kondisional',
    syntax: '=IF(kondisi_logika, nilai_jika_benar, [nilai_jika_salah])',
    description: 'Memeriksa kebenaran suatu pernyataan logika. Menghasilkan suatu nilai jika bernilai TRUE dan nilai lain jika bernilai FALSE. Dapat ditumpuk (nested IF) untuk memeriksa banyak syarat.',
    parameters: [
      { name: 'kondisi_logika', desc: 'Pernyataan uji perbandingan, misal B2>=75 atau C2="L"' },
      { name: 'nilai_jika_benar', desc: 'Output jika syarat terpenuhi, misal "TUNTAS"' },
      { name: '[nilai_jika_salah]', desc: 'Output jika syarat tidak terpenuhi, misal "REMEDIAL"' },
    ],
    exampleFormula: '=IF(B2>=75, "TUNTAS", "REMEDIAL")',
    exampleOutput: 'TUNTAS',
    schoolUseCase: 'Menentukan status Ketercapaian Tujuan Pembelajaran (KKTP) siswa secara otomatis berdasarkan KKM sekolah (?75).',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-if', 'Contoh_IF');
      setGuideCell(s, 'A1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Nilai Ujian', { bold: true });
      setGuideCell(s, 'C1', 'Status KKTP (?75)', { bold: true });
      setGuideCell(s, 'A2', 'Farhan'); setGuideCell(s, 'B2', '82'); setGuideCell(s, 'C2', '=IF(B2>=75, "TUNTAS", "REMEDIAL")', { bold: true });
      setGuideCell(s, 'A3', 'Gita'); setGuideCell(s, 'B3', '68'); setGuideCell(s, 'C3', '=IF(B3>=75, "TUNTAS", "REMEDIAL")', { bold: true });
      setGuideCell(s, 'A4', 'Hafizh'); setGuideCell(s, 'B4', '90'); setGuideCell(s, 'C4', '=IF(B4>=75, "TUNTAS", "REMEDIAL")', { bold: true });
      return wrapGuideWorkbook('wb-g-if', 'Contoh IF', s);
    })(),
  },
  {
    id: 'guide-and',
    name: 'AND',
    category: 'Logika & Kondisional',
    syntax: '=AND(kondisi1, kondisi2, ...)',
    description: 'Menghasilkan nilai logika TRUE jika SELURUH kondisi yang dimasukkan bernilai benar. Jika ada satu saja yang salah, menghasilkan FALSE.',
    parameters: [
      { name: 'kondisi1', desc: 'Syarat logika pertama yang diuji, misal B2>=75' },
      { name: 'kondisi2', desc: 'Syarat logika kedua yang diuji, misal C2>=80' },
    ],
    exampleFormula: '=AND(B2>=75, C2>=80)',
    exampleOutput: 'TRUE',
    schoolUseCase: 'Menentukan syarat penerima beasiswa prestasi: nilai rata-rata ? 85 DAN absensi kehadiran ? 95%.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-and', 'Contoh_AND');
      setGuideCell(s, 'A1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Nilai Teori', { bold: true });
      setGuideCell(s, 'C1', 'Nilai Praktek', { bold: true });
      setGuideCell(s, 'D1', 'Lolos Keduanya (AND)', { bold: true });
      setGuideCell(s, 'A2', 'Akbar'); setGuideCell(s, 'B2', '85'); setGuideCell(s, 'C2', '88');
      setGuideCell(s, 'D2', '=AND(B2>=75, C2>=75)', { bold: true, bg: '#dcfce7' });
      setGuideCell(s, 'A3', 'Bima'); setGuideCell(s, 'B3', '80'); setGuideCell(s, 'C3', '70');
      setGuideCell(s, 'D3', '=AND(B3>=75, C3>=75)', { bold: true, bg: '#fee2e2' });
      return wrapGuideWorkbook('wb-g-and', 'Contoh AND', s);
    })(),
  },
  {
    id: 'guide-or',
    name: 'OR',
    category: 'Logika & Kondisional',
    syntax: '=OR(kondisi1, kondisi2, ...)',
    description: 'Menghasilkan nilai logika TRUE jika SALAH SATU atau lebih kondisi yang dimasukkan bernilai benar. Hanya menghasilkan FALSE jika seluruhnya salah.',
    parameters: [
      { name: 'kondisi1', desc: 'Syarat logika pertama yang diuji, misal B2="Juara 1"' },
      { name: 'kondisi2', desc: 'Syarat logika kedua yang diuji, misal C2>=90' },
    ],
    exampleFormula: '=OR(B2="Juara", C2>=90)',
    exampleOutput: 'TRUE',
    schoolUseCase: 'Menentukan dispensasi siswa: jika pernah meraih juara lomba ATAU nilai akademik ? 90.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-or', 'Contoh_OR');
      setGuideCell(s, 'A1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Prestasi Ekskul', { bold: true });
      setGuideCell(s, 'C1', 'Nilai Akademik', { bold: true });
      setGuideCell(s, 'D1', 'Dapat Piagam (OR)', { bold: true });
      setGuideCell(s, 'A2', 'Clara'); setGuideCell(s, 'B2', 'Juara 1'); setGuideCell(s, 'C2', '75');
      setGuideCell(s, 'D2', '=OR(B2="Juara 1", C2>=90)', { bold: true, bg: '#dcfce7' });
      setGuideCell(s, 'A3', 'Dodi'); setGuideCell(s, 'B3', 'Peserta'); setGuideCell(s, 'C3', '80');
      setGuideCell(s, 'D3', '=OR(B3="Juara 1", C3>=90)', { bold: true, bg: '#fee2e2' });
      return wrapGuideWorkbook('wb-g-or', 'Contoh OR', s);
    })(),
  },
  {
    id: 'guide-not',
    name: 'NOT',
    category: 'Logika & Kondisional',
    syntax: '=NOT(kondisi)',
    description: 'Membalikkan hasil kebenaran logika. Jika kondisi bernilai TRUE, rumus mengubahnya menjadi FALSE, begitu pun sebaliknya.',
    parameters: [
      { name: 'kondisi', desc: 'Kondisi logika yang ingin dibalikkan nilainya, misal B2="Alpha"' },
    ],
    exampleFormula: '=NOT(B2="Alpha")',
    exampleOutput: 'TRUE',
    schoolUseCase: 'Memastikan siswa TIDAK memiliki catatan Alpha / bolos untuk kelayakan mengikuti rekreasi sekolah.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-not', 'Contoh_NOT');
      setGuideCell(s, 'A1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Catatan Presensi', { bold: true });
      setGuideCell(s, 'C1', 'Bebas Alpha (NOT)', { bold: true });
      setGuideCell(s, 'A2', 'Eka'); setGuideCell(s, 'B2', 'Hadir');
      setGuideCell(s, 'C2', '=NOT(B2="Alpha")', { bold: true, bg: '#dcfce7' });
      setGuideCell(s, 'A3', 'Fahri'); setGuideCell(s, 'B3', 'Alpha');
      setGuideCell(s, 'C3', '=NOT(B3="Alpha")', { bold: true, bg: '#fee2e2' });
      return wrapGuideWorkbook('wb-g-not', 'Contoh NOT', s);
    })(),
  },
  {
    id: 'guide-comparison',
    name: 'Operator Perbandingan (=, <>, >, <, >=, <=)',
    category: 'Logika & Kondisional',
    syntax: '=sel1 >= sel2   atau   =sel1 <> sel2',
    description: 'Operator pembanding nilai langsung: = (sama dengan), <> (tidak sama dengan), > (lebih besar), < (lebih kecil), >= (lebih besar sama dengan), <= (lebih kecil sama dengan). Menghasilkan TRUE atau FALSE.',
    parameters: [
      { name: '=', desc: 'Memeriksa kesamaan persis dua nilai (misal =A1="7E")' },
      { name: '<>', desc: 'Memeriksa apakah dua nilai tidak sama / berbeda' },
      { name: '> dan <', desc: 'Membandingkan apakah nilai kiri lebih besar atau lebih kecil dari nilai kanan' },
      { name: '>= dan <=', desc: 'Membandingkan lebih besar sama dengan atau lebih kecil sama dengan' },
    ],
    exampleFormula: '=B2 >= 75',
    exampleOutput: 'TRUE',
    schoolUseCase: 'Melakukan pengecekan validasi cepat batas kelulusan KKM mata pelajaran secara langsung di sel.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-comp', 'Operator_Perbandingan');
      setGuideCell(s, 'A1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Nilai', { bold: true });
      setGuideCell(s, 'C1', 'Apakah ? 75?', { bold: true });
      setGuideCell(s, 'D1', 'Apakah = 100?', { bold: true });
      setGuideCell(s, 'A2', 'Gani'); setGuideCell(s, 'B2', '80');
      setGuideCell(s, 'C2', '=B2 >= 75', { bold: true, bg: '#dcfce7' });
      setGuideCell(s, 'D2', '=B2 = 100', { bold: true });
      setGuideCell(s, 'A3', 'Hesti'); setGuideCell(s, 'B3', '100');
      setGuideCell(s, 'C3', '=B3 >= 75', { bold: true, bg: '#dcfce7' });
      setGuideCell(s, 'D3', '=B3 = 100', { bold: true, bg: '#fef3c7' });
      return wrapGuideWorkbook('wb-g-comp', 'Operator Perbandingan', s);
    })(),
  },

  // =========================================================================
  // 4. DATE & TIME (WAKTU & TANGGAL)
  // =========================================================================
  {
    id: 'guide-year',
    name: 'YEAR',
    category: 'Waktu & Tanggal',
    syntax: '=YEAR(serial_number_atau_tanggal)',
    description: 'Mengambil angka tahun (4 digit, misalnya 2026) dari data tanggal di dalam lembar kerja.',
    parameters: [
      { name: 'serial_number_atau_tanggal', desc: 'Sel berisi tanggal atau teks tanggal, misal "2026-10-18" atau "18/10/2026"' },
    ],
    exampleFormula: '=YEAR(A2)',
    exampleOutput: '2026',
    schoolUseCase: 'Mengekstrak tahun kelahiran siswa dari data tanggal lahir di buku induk untuk menghitung usia.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-year', 'Contoh_YEAR');
      setGuideCell(s, 'A1', 'Tanggal Lahir Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Tahun Kelahiran (=YEAR)', { bold: true });
      setGuideCell(s, 'A2', '15/05/2012');
      setGuideCell(s, 'B2', '=YEAR(A2)', { bold: true, bg: '#dbeafe' });
      setGuideCell(s, 'A3', '20/11/2011');
      setGuideCell(s, 'B3', '=YEAR(A3)', { bold: true, bg: '#dbeafe' });
      return wrapGuideWorkbook('wb-g-year', 'Contoh YEAR', s);
    })(),
  },
  {
    id: 'guide-month',
    name: 'MONTH',
    category: 'Waktu & Tanggal',
    syntax: '=MONTH(serial_number_atau_tanggal)',
    description: 'Mengambil angka urutan bulan (angka 1 sampai 12) dari data tanggal yang dipilih.',
    parameters: [
      { name: 'serial_number_atau_tanggal', desc: 'Sel berisi tanggal atau teks tanggal, misal "18/10/2026"' },
    ],
    exampleFormula: '=MONTH(A2)',
    exampleOutput: '10',
    schoolUseCase: 'Mengelompokkan data tagihan pembayaran SPP atau peminjaman buku perpustakaan berdasarkan bulan.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-month', 'Contoh_MONTH');
      setGuideCell(s, 'A1', 'Tanggal Transaksi', { bold: true });
      setGuideCell(s, 'B1', 'Bulan (1-12)', { bold: true });
      setGuideCell(s, 'A2', '18/10/2026');
      setGuideCell(s, 'B2', '=MONTH(A2)', { bold: true, bg: '#fef3c7' });
      setGuideCell(s, 'A3', '05/01/2026');
      setGuideCell(s, 'B3', '=MONTH(A3)', { bold: true, bg: '#fef3c7' });
      return wrapGuideWorkbook('wb-g-month', 'Contoh MONTH', s);
    })(),
  },
  {
    id: 'guide-day',
    name: 'DAY',
    category: 'Waktu & Tanggal',
    syntax: '=DAY(serial_number_atau_tanggal)',
    description: 'Mengambil angka hari/tanggal (angka 1 sampai 31) dari data tanggal.',
    parameters: [
      { name: 'serial_number_atau_tanggal', desc: 'Sel berisi data tanggal, misal "25/12/2026"' },
    ],
    exampleFormula: '=DAY(A2)',
    exampleOutput: '25',
    schoolUseCase: 'Mengambil tanggal pengumpulan tugas proyek untuk memeriksa ketepatan waktu deadline.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-day', 'Contoh_DAY');
      setGuideCell(s, 'A1', 'Jadwal Ujian', { bold: true });
      setGuideCell(s, 'B1', 'Tanggal Hari (=DAY)', { bold: true });
      setGuideCell(s, 'A2', '25/12/2026');
      setGuideCell(s, 'B2', '=DAY(A2)', { bold: true, bg: '#dcfce7' });
      return wrapGuideWorkbook('wb-g-day', 'Contoh DAY', s);
    })(),
  },
  {
    id: 'guide-hour',
    name: 'HOUR',
    category: 'Waktu & Tanggal',
    syntax: '=HOUR(serial_number_atau_waktu)',
    description: 'Mengambil angka jam (format 24 jam, angka 0 sampai 23) dari format waktu atau jam kegiatan.',
    parameters: [
      { name: 'serial_number_atau_waktu', desc: 'Sel berisi jam atau teks waktu, misal "07:30:00" atau "14:15:00"' },
    ],
    exampleFormula: '=HOUR(A2)',
    exampleOutput: '7',
    schoolUseCase: 'Mengekstrak jam kedatangan siswa pada presensi barcode untuk mendeteksi apakah datang sebelum jam 07:00.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-hour', 'Contoh_HOUR');
      setGuideCell(s, 'A1', 'Jam Masuk Presensi', { bold: true });
      setGuideCell(s, 'B1', 'Angka Jam (=HOUR)', { bold: true });
      setGuideCell(s, 'A2', '07:30:00');
      setGuideCell(s, 'B2', '=HOUR(A2)', { bold: true, bg: '#dbeafe' });
      setGuideCell(s, 'A3', '13:45:00');
      setGuideCell(s, 'B3', '=HOUR(A3)', { bold: true, bg: '#dbeafe' });
      return wrapGuideWorkbook('wb-g-hour', 'Contoh HOUR', s);
    })(),
  },
  {
    id: 'guide-minute',
    name: 'MINUTE',
    category: 'Waktu & Tanggal',
    syntax: '=MINUTE(serial_number_atau_waktu)',
    description: 'Mengambil angka menit (angka 0 sampai 59) dari format waktu yang tercatat.',
    parameters: [
      { name: 'serial_number_atau_waktu', desc: 'Sel berisi format waktu, misal "07:45:20"' },
    ],
    exampleFormula: '=MINUTE(A2)',
    exampleOutput: '45',
    schoolUseCase: 'Menghitung durasi keterlambatan siswa dalam satuan menit.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-min-time', 'Contoh_MINUTE');
      setGuideCell(s, 'A1', 'Jam Ketukan Masuk', { bold: true });
      setGuideCell(s, 'B1', 'Menit Ke- (=MINUTE)', { bold: true });
      setGuideCell(s, 'A2', '07:45:20');
      setGuideCell(s, 'B2', '=MINUTE(A2)', { bold: true, bg: '#fef3c7' });
      return wrapGuideWorkbook('wb-g-min-time', 'Contoh MINUTE', s);
    })(),
  },
  {
    id: 'guide-second',
    name: 'SECOND',
    category: 'Waktu & Tanggal',
    syntax: '=SECOND(serial_number_atau_waktu)',
    description: 'Mengambil angka detik (angka 0 sampai 59) dari data waktu.',
    parameters: [
      { name: 'serial_number_atau_waktu', desc: 'Sel berisi format waktu dengan detik, misal "10:20:45"' },
    ],
    exampleFormula: '=SECOND(A2)',
    exampleOutput: '45',
    schoolUseCase: 'Mencatat presisi detik pada simulasi waktu penyelesaian tugas pengetikan siswa di lab.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-sec', 'Contoh_SECOND');
      setGuideCell(s, 'A1', 'Catatan Waktu Lab', { bold: true });
      setGuideCell(s, 'B1', 'Detik (=SECOND)', { bold: true });
      setGuideCell(s, 'A2', '10:20:45');
      setGuideCell(s, 'B2', '=SECOND(A2)', { bold: true, bg: '#dcfce7' });
      return wrapGuideWorkbook('wb-g-sec', 'Contoh SECOND', s);
    })(),
  },
  {
    id: 'guide-time',
    name: 'TIME',
    category: 'Waktu & Tanggal',
    syntax: '=TIME(jam, menit, detik)',
    description: 'Menggabungkan 3 komponen angka numerik jam, menit, dan detik menjadi format waktu standar (HH:MM:SS).',
    parameters: [
      { name: 'jam', desc: 'Angka jam dari 0 sampai 23' },
      { name: 'menit', desc: 'Angka menit dari 0 sampai 59' },
      { name: 'detik', desc: 'Angka detik dari 0 sampai 59' },
    ],
    exampleFormula: '=TIME(7, 30, 0)',
    exampleOutput: '07:30:00',
    schoolUseCase: 'Menyusun jadwal mata pelajaran atau jam mulai praktikum lab komputer dari kolom jam terpisah.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-time', 'Contoh_TIME');
      setGuideCell(s, 'A1', 'Jam', { bold: true });
      setGuideCell(s, 'B1', 'Menit', { bold: true });
      setGuideCell(s, 'C1', 'Detik', { bold: true });
      setGuideCell(s, 'D1', 'Format Waktu Lengkap (=TIME)', { bold: true });
      setGuideCell(s, 'A2', '7'); setGuideCell(s, 'B2', '30'); setGuideCell(s, 'C2', '0');
      setGuideCell(s, 'D2', '=TIME(A2, B2, C2)', { bold: true, bg: '#dbeafe' });
      setGuideCell(s, 'A3', '12'); setGuideCell(s, 'B3', '15'); setGuideCell(s, 'C3', '0');
      setGuideCell(s, 'D3', '=TIME(A3, B3, C3)', { bold: true, bg: '#dbeafe' });
      return wrapGuideWorkbook('wb-g-time', 'Contoh TIME', s);
    })(),
  },
  {
    id: 'guide-today-now',
    name: 'TODAY & NOW',
    category: 'Waktu & Tanggal',
    syntax: '=TODAY()   dan   =NOW()',
    description: 'Rumus dinamis tanpa argumen: TODAY() menghasilkan tanggal hari ini secara otomatis, sedangkan NOW() menghasilkan tanggal sekaligus jam saat ini.',
    parameters: [
      { name: 'tanpa argumen', desc: 'Cukup ketik kurung buka dan tutup () tanpa isi apa pun' },
    ],
    exampleFormula: '=TODAY()',
    exampleOutput: '18/10/2026',
    schoolUseCase: 'Membuat kop surat atau tanda tangan dokumen laporan nilai yang selalu otomatis mengikuti tanggal hari ini.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-now', 'Contoh_TODAY_NOW');
      setGuideCell(s, 'A1', 'Fungsi Tanggal & Waktu', { bold: true });
      setGuideCell(s, 'B1', 'Hasil Otomatis', { bold: true });
      setGuideCell(s, 'A2', 'Tanggal Hari Ini (=TODAY())');
      setGuideCell(s, 'B2', '=TODAY()', { bold: true, bg: '#dcfce7' });
      setGuideCell(s, 'A3', 'Waktu Lengkap Sekarang (=NOW())');
      setGuideCell(s, 'B3', '=NOW()', { bold: true, bg: '#fef3c7' });
      return wrapGuideWorkbook('wb-g-now', 'Contoh TODAY & NOW', s);
    })(),
  },
  {
    id: 'guide-date',
    name: 'DATE',
    category: 'Waktu & Tanggal',
    syntax: '=DATE(tahun, bulan, hari)',
    description: 'Membentuk data tanggal standar dari 3 angka terpisah: tahun (YYYY), bulan (MM), dan hari (DD).',
    parameters: [
      { name: 'tahun', desc: 'Angka tahun 4 digit, misal 2026' },
      { name: 'bulan', desc: 'Angka bulan 1 sampai 12' },
      { name: 'hari', desc: 'Angka tanggal 1 sampai 31' },
    ],
    exampleFormula: '=DATE(2026, 10, 18)',
    exampleOutput: '18/10/2026',
    schoolUseCase: 'Membuat tanggal resmi kelulusan siswa dari kolom tahun angkatan, bulan kelulusan, dan tanggal SK Kepala Sekolah.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-date', 'Contoh_DATE');
      setGuideCell(s, 'A1', 'Tahun', { bold: true });
      setGuideCell(s, 'B1', 'Bulan', { bold: true });
      setGuideCell(s, 'C1', 'Hari', { bold: true });
      setGuideCell(s, 'D1', 'Format Tanggal Terbentuk (=DATE)', { bold: true });
      setGuideCell(s, 'A2', '2026'); setGuideCell(s, 'B2', '10'); setGuideCell(s, 'C2', '18');
      setGuideCell(s, 'D2', '=DATE(A2, B2, C2)', { bold: true, bg: '#dbeafe' });
      return wrapGuideWorkbook('wb-g-date', 'Contoh DATE', s);
    })(),
  },

  // =========================================================================
  // 5. TEKS & KARAKTER (TEXT PROCESSING)
  // =========================================================================
  {
    id: 'guide-lower',
    name: 'LOWER',
    category: 'Teks & Karakter',
    syntax: '=LOWER(teks)',
    description: 'Mengubah semua karakter huruf di dalam teks menjadi huruf kecil (lowercase). Angka dan simbol tanda baca tidak terpengaruh.',
    parameters: [
      { name: 'teks', desc: 'Sel berisi teks atau string kalimat yang ingin diubah menjadi huruf kecil, misal A2' },
    ],
    exampleFormula: '=LOWER(A2)',
    exampleOutput: 'ahmad dahlan',
    schoolUseCase: 'Menstandarkan format alamat email siswa akun belajar.id menjadi huruf kecil semua.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-lower', 'Contoh_LOWER');
      setGuideCell(s, 'A1', 'Nama Asli Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Format Huruf Kecil (=LOWER)', { bold: true });
      setGuideCell(s, 'A2', 'AHMAD DAHLAN');
      setGuideCell(s, 'B2', '=LOWER(A2)', { bold: true, bg: '#dbeafe' });
      setGuideCell(s, 'A3', 'Siti NURHALIZA');
      setGuideCell(s, 'B3', '=LOWER(A3)', { bold: true, bg: '#dbeafe' });
      return wrapGuideWorkbook('wb-g-lower', 'Contoh LOWER', s);
    })(),
  },
  {
    id: 'guide-upper',
    name: 'UPPER',
    category: 'Teks & Karakter',
    syntax: '=UPPER(teks)',
    description: 'Mengubah seluruh karakter huruf dalam teks menjadi huruf kapital besar (UPPERCASE).',
    parameters: [
      { name: 'teks', desc: 'Sel berisi teks yang ingin diubah menjadi huruf kapital besar, misal A2' },
    ],
    exampleFormula: '=UPPER(A2)',
    exampleOutput: 'KARTU PELAJAR',
    schoolUseCase: 'Membuat format cetak nama siswa pada ijazah atau sertifikat kelulusan yang mewajibkan huruf kapital.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-upper', 'Contoh_UPPER');
      setGuideCell(s, 'A1', 'Nama Inputan', { bold: true });
      setGuideCell(s, 'B1', 'Format Huruf Besar (=UPPER)', { bold: true });
      setGuideCell(s, 'A2', 'kartu pelajar');
      setGuideCell(s, 'B2', '=UPPER(A2)', { bold: true, bg: '#dcfce7' });
      setGuideCell(s, 'A3', 'smp negeri 1 wedi');
      setGuideCell(s, 'B3', '=UPPER(A3)', { bold: true, bg: '#dcfce7' });
      return wrapGuideWorkbook('wb-g-upper', 'Contoh UPPER', s);
    })(),
  },
  {
    id: 'guide-proper',
    name: 'PROPER',
    category: 'Teks & Karakter',
    syntax: '=PROPER(teks)',
    description: 'Mengubah huruf pertama dari setiap kata menjadi huruf kapital dan huruf berikutnya menjadi huruf kecil (Title Case).',
    parameters: [
      { name: 'teks', desc: 'Sel teks yang ingin dirapikan huruf awal kapitalnya, misal A2' },
    ],
    exampleFormula: '=PROPER(A2)',
    exampleOutput: 'Budi Santoso',
    schoolUseCase: 'Merapikan penulisan nama lengkap siswa yang tidak rapi (seperti "bUdI saNTOso" menjadi "Budi Santoso").',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-proper', 'Contoh_PROPER');
      setGuideCell(s, 'A1', 'Data Asal (Kurang Rapi)', { bold: true });
      setGuideCell(s, 'B1', 'Format Rapi (=PROPER)', { bold: true });
      setGuideCell(s, 'A2', 'bUdI saNTOso');
      setGuideCell(s, 'B2', '=PROPER(A2)', { bold: true, bg: '#fef3c7' });
      setGuideCell(s, 'A3', 'cITRA lESTARI pUTRI');
      setGuideCell(s, 'B3', '=PROPER(A3)', { bold: true, bg: '#fef3c7' });
      return wrapGuideWorkbook('wb-g-proper', 'Contoh PROPER', s);
    })(),
  },
  {
    id: 'guide-concatenate',
    name: 'CONCATENATE & Operator &',
    category: 'Teks & Karakter',
    syntax: '=CONCATENATE(teks1, [teks2], ...)   atau   =teks1 & " " & teks2',
    description: 'Menggabungkan beberapa bagian teks atau nilai dari sel yang berbeda menjadi satu kalimat/kata yang utuh.',
    parameters: [
      { name: 'teks1', desc: 'Bagian teks pertama yang digabungkan' },
      { name: '[teks2]', desc: 'Bagian teks kedua atau teks sambung spasi (misal " ")' },
    ],
    exampleFormula: '=A2 & " - " & B2',
    exampleOutput: '8A - Adelle Alexa',
    schoolUseCase: 'Menggabungkan kelas dan nama siswa, atau membuat kode unik siswa (misal Kelas + NIS).',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-concat', 'Contoh_CONCATENATE');
      setGuideCell(s, 'A1', 'Kelas', { bold: true });
      setGuideCell(s, 'B1', 'Nama Siswa', { bold: true });
      setGuideCell(s, 'C1', 'Format Gabung (CONCAT)', { bold: true });
      setGuideCell(s, 'A2', '7E'); setGuideCell(s, 'B2', 'Akbar Ghibran');
      setGuideCell(s, 'C2', '=CONCATENATE(A2, " - ", B2)', { bold: true, bg: '#dbeafe' });
      setGuideCell(s, 'A3', '8A'); setGuideCell(s, 'B3', 'Bagas Setiawan');
      setGuideCell(s, 'C3', '=A3 & " - " & B3', { bold: true, bg: '#dbeafe' });
      return wrapGuideWorkbook('wb-g-concat', 'Contoh CONCATENATE', s);
    })(),
  },
  {
    id: 'guide-left',
    name: 'LEFT',
    category: 'Teks & Karakter',
    syntax: '=LEFT(teks, [jumlah_karakter])',
    description: 'Mengambil sejumlah karakter dari sisi paling kiri (awal) sebuah teks.',
    parameters: [
      { name: 'teks', desc: 'Sel berisi teks yang ingin dipotong dari kiri, misal A2' },
      { name: '[jumlah_karakter]', desc: 'Berapa banyak karakter yang ingin diambil (default: 1)' },
    ],
    exampleFormula: '=LEFT(A2, 2)',
    exampleOutput: '8A',
    schoolUseCase: 'Mengambil 2 digit pertama kode pendaftaran untuk mengetahui jenjang kelas siswa.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-left', 'Contoh_LEFT');
      setGuideCell(s, 'A1', 'Kode Registrasi', { bold: true });
      setGuideCell(s, 'B1', 'Kode Kelas (=LEFT(A2, 2))', { bold: true });
      setGuideCell(s, 'A2', '7E-2026-001');
      setGuideCell(s, 'B2', '=LEFT(A2, 2)', { bold: true, bg: '#dcfce7' });
      setGuideCell(s, 'A3', '8H-2026-042');
      setGuideCell(s, 'B3', '=LEFT(A3, 2)', { bold: true, bg: '#dcfce7' });
      return wrapGuideWorkbook('wb-g-left', 'Contoh LEFT', s);
    })(),
  },
  {
    id: 'guide-right',
    name: 'RIGHT',
    category: 'Teks & Karakter',
    syntax: '=RIGHT(teks, [jumlah_karakter])',
    description: 'Mengambil sejumlah karakter dari sisi paling kanan (akhir) sebuah teks.',
    parameters: [
      { name: 'teks', desc: 'Sel berisi teks yang ingin dipotong dari kanan, misal A2' },
      { name: '[jumlah_karakter]', desc: 'Berapa banyak karakter yang ingin diambil dari ujung akhir' },
    ],
    exampleFormula: '=RIGHT(A2, 3)',
    exampleOutput: '001',
    schoolUseCase: 'Mengambil nomor urut siswa dari akhir kode induk (misal: "REG-8A-025" diambil 3 karakter terakhir "025").',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-right', 'Contoh_RIGHT');
      setGuideCell(s, 'A1', 'Kode Siswa', { bold: true });
      setGuideCell(s, 'B1', 'No Urut Akhir (=RIGHT(A2, 3))', { bold: true });
      setGuideCell(s, 'A2', 'SISWA-SMP1-001');
      setGuideCell(s, 'B2', '=RIGHT(A2, 3)', { bold: true, bg: '#fef3c7' });
      setGuideCell(s, 'A3', 'SISWA-SMP1-032');
      setGuideCell(s, 'B3', '=RIGHT(A3, 3)', { bold: true, bg: '#fef3c7' });
      return wrapGuideWorkbook('wb-g-right', 'Contoh RIGHT', s);
    })(),
  },
  {
    id: 'guide-mid',
    name: 'MID',
    category: 'Teks & Karakter',
    syntax: '=MID(teks, posisi_mulai, jumlah_karakter)',
    description: 'Mengambil sejumlah karakter dari bagian tengah teks, dimulai dari nomor karakter yang ditentukan.',
    parameters: [
      { name: 'teks', desc: 'Sel sumber teks yang ingin dipotong di tengah' },
      { name: 'posisi_mulai', desc: 'Nomor karakter awal pemotongan (karakter ke-1, ke-2, ke-3...)' },
      { name: 'jumlah_karakter', desc: 'Panjang karakter yang ingin diambil' },
    ],
    exampleFormula: '=MID(A2, 4, 4)',
    exampleOutput: '2026',
    schoolUseCase: 'Mengekstrak tahun angkatan dari bagian tengah Nomor Induk Siswa Nasional (NISN) atau kode inventaris lab.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-mid', 'Contoh_MID');
      setGuideCell(s, 'A1', 'Kode Inventaris Lab', { bold: true });
      setGuideCell(s, 'B1', 'Tahun Beli (=MID(A2, 4, 4))', { bold: true });
      setGuideCell(s, 'A2', 'PC-2026-LAB1');
      setGuideCell(s, 'B2', '=MID(A2, 4, 4)', { bold: true, bg: '#dbeafe' });
      setGuideCell(s, 'A3', 'PC-2024-LAB2');
      setGuideCell(s, 'B3', '=MID(A3, 4, 4)', { bold: true, bg: '#dbeafe' });
      return wrapGuideWorkbook('wb-g-mid', 'Contoh MID', s);
    })(),
  },
  {
    id: 'guide-len',
    name: 'LEN',
    category: 'Teks & Karakter',
    syntax: '=LEN(teks)',
    description: 'Menghitung jumlah total panjang karakter (termasuk huruf, angka, simbol, dan spasi) yang ada di dalam sel.',
    parameters: [
      { name: 'teks', desc: 'Sel berisi teks yang ingin dihitung jumlah karakternya, misal A2' },
    ],
    exampleFormula: '=LEN(A2)',
    exampleOutput: '10',
    schoolUseCase: 'Memvalidasi apakah Nomor Induk Siswa Nasional (NISN) sudah tepat berjumlah 10 digit angka.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-len', 'Contoh_LEN');
      setGuideCell(s, 'A1', 'Nomor NISN Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Jumlah Digit (=LEN)', { bold: true });
      setGuideCell(s, 'A2', '0081234567');
      setGuideCell(s, 'B2', '=LEN(A2)', { bold: true, bg: '#dcfce7' });
      setGuideCell(s, 'A3', '00812345');
      setGuideCell(s, 'B3', '=LEN(A3)', { bold: true, bg: '#fee2e2' });
      return wrapGuideWorkbook('wb-g-len', 'Contoh LEN', s);
    })(),
  },
  {
    id: 'guide-find',
    name: 'FIND',
    category: 'Teks & Karakter',
    syntax: '=FIND(teks_yang_dicari, teks_sumber, [posisi_mulai])',
    description: 'Mencari letak nomor indeks karakter atau kata di dalam teks (bersifat case-sensitive / peka huruf besar-kecil). Menghasilkan nomor posisi urutan karakter.',
    parameters: [
      { name: 'teks_yang_dicari', desc: 'Karakter atau kata yang ingin dicari posisinya, misal "@" atau "-"' },
      { name: 'teks_sumber', desc: 'Sel tempat pencarian teks, misal A2' },
      { name: '[posisi_mulai]', desc: 'Nomor karakter tempat mulai mencari (default: 1)' },
    ],
    exampleFormula: '=FIND("@", A2)',
    exampleOutput: '7',
    schoolUseCase: 'Mencari posisi tanda "@" pada email sekolah untuk memisahkan username siswa dengan nama domain.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-find', 'Contoh_FIND');
      setGuideCell(s, 'A1', 'Alamat Email Siswa', { bold: true });
      setGuideCell(s, 'B1', 'Letak Karakter "@" (=FIND)', { bold: true });
      setGuideCell(s, 'A2', 'farhan@smp1.sch.id');
      setGuideCell(s, 'B2', '=FIND("@", A2)', { bold: true, bg: '#fef3c7' });
      setGuideCell(s, 'A3', 'dewi.lestari@smp1.sch.id');
      setGuideCell(s, 'B3', '=FIND("@", A3)', { bold: true, bg: '#fef3c7' });
      return wrapGuideWorkbook('wb-g-find', 'Contoh FIND', s);
    })(),
  },
  {
    id: 'guide-substitute',
    name: 'SUBSTITUTE (Penggantian Teks)',
    category: 'Teks & Karakter',
    syntax: '=SUBSTITUTE(teks, teks_lama, teks_baru, [kemunculan_ke])',
    description: 'Mengganti bagian teks tertentu dengan teks baru. Sangat berguna untuk mengganti simbol separator atau memperbaiki kesalahan pengetikan massal.',
    parameters: [
      { name: 'teks', desc: 'Sel berisi teks asli yang akan diubah' },
      { name: 'teks_lama', desc: 'Kata atau simbol yang ingin diganti, misal "-" atau "Lab 1"' },
      { name: 'teks_baru', desc: 'Kata atau simbol pengganti baru, misal "/" atau "Lab 2"' },
      { name: '[kemunculan_ke]', desc: 'Mengganti hanya pada kemunculan urutan ke berapa (jika dikosongkan, semua diganti)' },
    ],
    exampleFormula: '=SUBSTITUTE(A2, "-", "/")',
    exampleOutput: '2026/10/18',
    schoolUseCase: 'Mengubah tanda pemisah tanggal dari strip (-) menjadi garis miring (/) atau mengganti kata nama ruang kelas secara massal.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-sub', 'Contoh_SUBSTITUTE');
      setGuideCell(s, 'A1', 'Format Kode Lama', { bold: true });
      setGuideCell(s, 'B1', 'Format Baru (=SUBSTITUTE)', { bold: true });
      setGuideCell(s, 'A2', 'SMP-WEDI-2026');
      setGuideCell(s, 'B2', '=SUBSTITUTE(A2, "-", "/")', { bold: true, bg: '#dbeafe' });
      setGuideCell(s, 'A3', 'Ruang Lab 1');
      setGuideCell(s, 'B3', '=SUBSTITUTE(A3, "Lab 1", "Lab Multimedia")', { bold: true, bg: '#dbeafe' });
      return wrapGuideWorkbook('wb-g-sub', 'Contoh SUBSTITUTE', s);
    })(),
  },

  // =========================================================================
  // 6. PENCARIAN (LOOKUP)
  // =========================================================================
  {
    id: 'guide-vlookup',
    name: 'VLOOKUP',
    category: 'Pencarian (Lookup)',
    syntax: '=VLOOKUP(nilai_kunci, tabel_referensi, nomor_kolom, [pencarian_tepat])',
    description: 'Mencari nilai pada kolom pertama tabel referensi secara vertikal ke bawah, lalu mengambil data dari kolom di sebelahnya pada baris yang cocok.',
    parameters: [
      { name: 'nilai_kunci', desc: 'Nilai yang ingin dicari, misal kode siswa A10' },
      { name: 'tabel_referensi', desc: 'Rentang tabel acuan, misal A2:C6' },
      { name: 'nomor_kolom', desc: 'Nomor urut kolom yang datanya ingin diambil (1, 2, 3...)' },
      { name: 'pencarian_tepat', desc: 'FALSE untuk pencarian persis / exact match' },
    ],
    exampleFormula: '=VLOOKUP(B7, A2:C4, 2, FALSE)',
    exampleOutput: 'Aldric Aqila',
    schoolUseCase: 'Mencari nama siswa dan kelas secara otomatis hanya dengan memasukkan Nomor Induk Siswa (NIS).',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-vlookup', 'Contoh_VLOOKUP');
      setGuideCell(s, 'A1', 'NIS', { bold: true }); setGuideCell(s, 'B1', 'Nama Siswa', { bold: true }); setGuideCell(s, 'C1', 'Kelas', { bold: true });
      setGuideCell(s, 'A2', '11881'); setGuideCell(s, 'B2', 'Akbar Ghibran'); setGuideCell(s, 'C2', '7E');
      setGuideCell(s, 'A3', '11882'); setGuideCell(s, 'B3', 'Aldric Aqila'); setGuideCell(s, 'C3', '7E');
      setGuideCell(s, 'A4', '11883'); setGuideCell(s, 'B4', 'Alma Rosida'); setGuideCell(s, 'C4', '7E');
      setGuideCell(s, 'A7', 'CARI NIS:'); setGuideCell(s, 'B7', '11882', { bold: true, bg: '#fef3c7' });
      setGuideCell(s, 'A8', 'NAMA HASIL VLOOKUP:'); setGuideCell(s, 'B8', '=VLOOKUP(B7, A2:C4, 2, FALSE)', { bold: true, bg: '#dbeafe' });
      return wrapGuideWorkbook('wb-g-vlookup', 'Contoh VLOOKUP', s);
    })(),
  },
  {
    id: 'guide-hlookup',
    name: 'HLOOKUP',
    category: 'Pencarian (Lookup)',
    syntax: '=HLOOKUP(nilai_kunci, tabel_referensi, nomor_baris, [pencarian_tepat])',
    description: 'Mencari nilai pada baris pertama tabel referensi secara horizontal ke kanan, lalu mengambil data dari baris di bawahnya pada kolom yang cocok.',
    parameters: [
      { name: 'nilai_kunci', desc: 'Nilai yang ingin dicari di baris pertama tabel acuan' },
      { name: 'tabel_referensi', desc: 'Rentang tabel acuan horizontal, misal B1:E3' },
      { name: 'nomor_baris', desc: 'Nomor urut baris yang datanya ingin diambil (1, 2, 3...)' },
      { name: 'pencarian_tepat', desc: 'FALSE untuk pencarian persis / exact match' },
    ],
    exampleFormula: '=HLOOKUP(B5, B1:D3, 2, FALSE)',
    exampleOutput: 'Lab Komputer 1',
    schoolUseCase: 'Mencari jadwal penggunaan ruangan berdasarkan nama hari yang disusun mendatar ke samping.',
    sampleWorkbook: (() => {
      const s = createGuideSheet('g-hlookup', 'Contoh_HLOOKUP');
      setGuideCell(s, 'A1', 'HARI', { bold: true }); setGuideCell(s, 'B1', 'Senin'); setGuideCell(s, 'C1', 'Selasa'); setGuideCell(s, 'D1', 'Rabu');
      setGuideCell(s, 'A2', 'RUANG LAB', { bold: true }); setGuideCell(s, 'B2', 'Lab Komputer 1'); setGuideCell(s, 'C2', 'Lab Komputer 2'); setGuideCell(s, 'D2', 'Lab Multimedia');
      setGuideCell(s, 'A3', 'GURU PIKET', { bold: true }); setGuideCell(s, 'B3', 'Pak Irfan'); setGuideCell(s, 'C3', 'Bu Retno'); setGuideCell(s, 'D3', 'Pak Joko');
      setGuideCell(s, 'A5', 'PILIH HARI:'); setGuideCell(s, 'B5', 'Senin', { bold: true, bg: '#fef3c7' });
      setGuideCell(s, 'A6', 'LOKASI LAB (=HLOOKUP):'); setGuideCell(s, 'B6', '=HLOOKUP(B5, B1:D3, 2, FALSE)', { bold: true, bg: '#dcfce7' });
      return wrapGuideWorkbook('wb-g-hlookup', 'Contoh HLOOKUP', s);
    })(),
  },
];
