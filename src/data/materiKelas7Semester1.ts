export interface MateriPokokItem {
  id: string;
  letter: string;
  title: string;
  subtitle: string;
  content: string[];
  keyPoints?: string[];
  examples?: Array<{ title: string; desc: string }>;
  table?: {
    headers: string[];
    rows: string[][];
  };
  tip?: string;
  actionButton?: {
    label: string;
    subtabTarget: 'excel' | 'guide';
  };
}

export interface BabKelas7 {
  id: string;
  babNumber: number;
  title: string;
  subtitle: string;
  semester: number;
  badge: string;
  themeColor: {
    primary: string; // e.g. '#2e59e6'
    border: string;
    bgBadge: string;
    textBadge: string;
  };
  tujuanPembelajaran: string[];
  petaKonsep: {
    description: string;
    nodes: Array<{
      category: string;
      items: string[];
    }>;
  };
  dimensiProfilLulusan: Array<{
    name: string;
    description: string;
  }>;
  pertanyaanPemantik: string[];
  materiPokok: MateriPokokItem[];
  rangkumanMateri: string[];
  refleksiDiri: Array<{
    id: string;
    statement: string;
  }>;
}

export const MATERI_KELAS_7_SEMESTER_1: BabKelas7[] = [
  // ===========================================================================
  // BAB 1: BERPIKIR KOMPUTASIONAL UNTUK PENYELESAIAN MASALAH
  // ===========================================================================
  {
    id: 'bab1',
    babNumber: 1,
    title: 'Berpikir Komputasional untuk Penyelesaian Masalah',
    subtitle: 'Computational Thinking dalam Kehidupan Sehari-hari dan Dasar Algoritma',
    semester: 1,
    badge: 'BAB 1 • BK & ALGORITMA',
    themeColor: {
      primary: '#2e59e6',
      border: 'border-blue-600',
      bgBadge: 'bg-blue-100',
      textBadge: 'text-blue-900',
    },
    tujuanPembelajaran: [
      'Memahami hakikat Berpikir Komputasional (Computational Thinking) sebagai metode pemecahan masalah yang efektif dan sistematis.',
      'Mengidentifikasi dan menerapkan 4 fondasi utama berpikir komputasional: Dekomposisi, Pengenalan Pola, Abstraksi, dan Perancangan Algoritma.',
      'Mampu memecah masalah kompleks di kehidupan nyata menjadi komponen-komponen kecil yang lebih mudah diselesaikan (Dekomposisi).',
      'Mengenali keteraturan, kesamaan pola, atau kecenderungan dari suatu kumpulan data (Pengenalan Pola).',
      'Mampu menyaring informasi penting yang esensial serta mengabaikan detail yang tidak relevan (Abstraksi).',
      'Mampu menyusun langkah-langkah solusi terurut dan logis dalam bentuk algoritma deskriptif, diagram alir (flowchart), maupun pseudocode.',
      'Memahami tiga struktur kontrol dasar pemrograman: urutan (sekuensial), percabangan (kondisi if/else), dan perulangan (looping).',
    ],
    petaKonsep: {
      description: 'Struktur keterkaitan konsep Berpikir Komputasional menuju dasar algoritma dan pemrograman.',
      nodes: [
        {
          category: 'Fondasi Berpikir Komputasional',
          items: ['Dekomposisi', 'Pengenalan Pola (Pattern)', 'Abstraksi', 'Perancangan Algoritma'],
        },
        {
          category: 'Representasi Algoritma',
          items: ['Kalimat Deskriptif (Natural)', 'Diagram Alir (Flowchart)', 'Pseudocode'],
        },
        {
          category: 'Struktur Dasar Logika',
          items: ['Sekuensial (Urutan)', 'Percabangan (IF-ELSE)', 'Perulangan (Looping FOR/WHILE)'],
        },
      ],
    },
    dimensiProfilLulusan: [
      {
        name: 'Bernalar Kritis',
        description: 'Mampu menganalisis persoalan secara objektif, mengevaluasi bukti, dan memverifikasi kebenaran langkah penyelesaian.',
      },
      {
        name: 'Mandiri',
        description: 'Mampu merencanakan strategi pemecahan masalah secara mandiri dengan langkah-langkah terstruktur.',
      },
      {
        name: 'Kreatif',
        description: 'Menciptakan alternatif solusi baru yang lebih cepat dan efisien saat menghadapi hambatan logika.',
      },
      {
        name: 'Gotong Royong',
        description: 'Berkolaborasi membagi tugas dekomposisi masalah dalam kerja tim pemecahan proyek komputasi.',
      },
    ],
    pertanyaanPemantik: [
      'Bagaimana seorang koki profesional dapat menyiapkan hidangan lengkap bagi 100 orang dalam 30 menit tanpa ada pesanan yang tertukar atau terlambat?',
      'Pernahkah kamu menyadari bahwa saat merapikan isi tas sekolah atau mencari buku di perpustakaan, otakmu sedang menggunakan algoritma pencarian?',
      'Mengapa komputer yang memiliki kecepatan miliaran perhitungan per detik tetap tidak bisa bekerja tanpa instruksi terurut yang dibuat oleh manusia?',
    ],
    materiPokok: [
      {
        id: 'b1-a',
        letter: 'A',
        title: 'Berpikir Komputasional',
        subtitle: 'Pengertian dan 4 Pilar Fondasi Computational Thinking',
        content: [
          'Berpikir Komputasional (Computational Thinking / CT) adalah proses berpikir untuk memformulasikan masalah beserta solusinya, sedemikian rupa sehingga solusi tersebut dapat dieksekusi secara efektif oleh agen pemroses informasi (baik manusia, mesin, maupun kombinasi keduanya).',
          'Berpikir komputasional bukan berarti belajar berpikir kaku seperti robot, melainkan melatih cara berpikir ilmiah, runtut, logis, dan analitis dalam memecahkan persoalan sehari-hari.',
          'Terdapat empat fondasi utama dalam Berpikir Komputasional yang saling melengkapi:',
        ],
        keyPoints: [
          '1. Dekomposisi (Decomposition): Memecah masalah besar, rumit, atau kompleks menjadi bagian-bagian kecil yang mandiri agar lebih mudah dianalisis dan diselesaikan satu per satu.',
          '2. Pengenalan Pola (Pattern Recognition): Mengamati keteraturan, kemiripan bentuk, tren data, atau kesamaan sifat di antara masalah-masalah yang sedang dihadapi.',
          '3. Abstraksi (Abstraction): Memusatkan perhatian hanya pada informasi penting dan esensial, sekaligus mengabaikan detail-detail kecil yang tidak relevan dengan tujuan akhir.',
          '4. Perancangan Algoritma (Algorithm Design): Menyusun urutan langkah-langkah kerja atau instruksi yang tepat, bertahap, dan tidak ambigu untuk menyelesaikan masalah.',
        ],
        examples: [
          {
            title: 'Studi Kasus 1: Mengatur Perjalanan Wisata Kelas',
            desc: 'Dekomposisi membagi proyek menjadi: anggaran biaya, sewa bus, tiket masuk, dan konsumsi. Pengenalan Pola melihat jadwal libur sekolah dan jam rawan macet. Abstraksi fokus pada total biaya per siswa (mengabaikan warna cat bus atau jenis merek seragam). Algoritma menyusun jadwal rundown acara menit demi menit.',
          },
          {
            title: 'Studi Kasus 2: Robot Pembersih Lantai Otomatis (Vacuum Robot)',
            desc: 'Dekomposisi memecah tugas menyapu dan mengepel. Pengenalan Pola mendeteksi dinding dan tangga. Abstraksi mengabaikan warna ubin tetapi fokus pada koordinat debu. Algoritma mengarahkan robot berbelok 90 derajat saat sensor mendeteksi halangan.',
          },
        ],
        tip: 'Tips Belajar: Saat menghadapi soal cerita matematika atau masalah proyek, selalu mulai dengan Dekomposisi (apa saja komponen masalahnya?) lalu lakukan Abstraksi (angka mana yang benar-benar dibutuhkan?).',
      },
      {
        id: 'b1-b',
        letter: 'B',
        title: 'Algoritma dan Dasar Pemrograman',
        subtitle: 'Karakteristik Algoritma, Cara Penyajian, dan Struktur Kontrol',
        content: [
          'Algoritma adalah deretan instruksi bertahap yang tersusun secara logis dan terhingga untuk memecahkan suatu persoalan atau menjalankan tugas spesifik.',
          'Sebuah algoritma yang baik menurut ilmu komputer (Donald Knuth) wajib memenuhi lima kriteria penting: Masukan (Input), Keluaran (Output), Kepastian/Ketidaktergantungan (Definiteness), Keterhinggaan (Finiteness - harus berhenti setelah sejumlah langkah), dan Efektivitas (Effectiveness).',
          'Algoritma dapat dituliskan dan dikomunikasikan dalam 3 format utama:',
        ],
        keyPoints: [
          'Bahasa Alami (Natural Language): Disajikan dengan kalimat deskriptif sehari-hari (contoh: "Langkah 1: Siapkan wajan... Langkah 2: Masukkan minyak..."). Kelebihannya mudah dipahami orang awam, kelemahannya rentan salah tafsir (ambigu).',
          'Diagram Alir (Flowchart): Disajikan menggunakan bagan grafik geometris standar (Oval = Mulai/Selesai/Terminator, Jajar Genjang = Input/Output, Persegi Panjang = Proses/Perhitungan, Belah Ketupat = Keputusan/Decision/Percabangan, Garis Panah = Aliran Data).',
          'Pseudocode (Kode Semu): Menyerupai kode bahasa pemrograman nyata namun tetap mudah dibaca manusia (menggunakan kata kunci baku seperti IF, THEN, ELSE, FOR, WHILE, PRINT, READ).',
        ],
        table: {
          headers: ['Struktur Kontrol', 'Prinsip Kerja Logika', 'Contoh Nyata Sehari-hari'],
          rows: [
            ['Runtunan (Sequential)', 'Instruksi dijalankan berurutan satu per satu dari atas ke bawah tanpa lompatan.', 'Membuat teh manis: ambil cangkir -> masukkan teh -> tuang air panas -> aduk.'],
            ['Percabangan (Selection / IF-ELSE)', 'Instruksi dijalankan hanya jika suatu kondisi bernilai BENAR (True) atau SALAH (False).', 'Jika nilai >= 75 maka "Lulus", jika tidak maka "Remedial".'],
            ['Perulangan (Looping / Iterasi)', 'Instruksi dijalankan berulang kali selama kondisi pengulangan masih terpenuhi.', 'Aduk teh sebanyak 10 putaran, atau lari keliling lapangan selama belum mencapai 5 putaran.'],
          ],
        },
        tip: 'Ingat: Dalam diagram alir, simbol Belah Ketupat (Decision) selalu memiliki minimal 2 jalur keluar: "Ya / True" dan "Tidak / False".',
      },
    ],
    rangkumanMateri: [
      'Berpikir Komputasional (CT) adalah keterampilan esensial abad ke-21 untuk menyelesaikan masalah kompleks melalui 4 fondasi: Dekomposisi, Pengenalan Pola, Abstraksi, dan Perancangan Algoritma.',
      'Dekomposisi memecah masalah besar menjadi modul-modul kecil yang mandiri.',
      'Pengenalan Pola mencari kesamaan atau keteraturan untuk mempercepat pemecahan masalah serupa.',
      'Abstraksi menyaring hal krusial dan membuang detail yang tidak berpengaruh langsung.',
      'Algoritma harus memiliki instruksi yang pasti, tidak ambigu, memiliki input dan output yang jelas, serta wajib berhenti (finite).',
      'Algoritma dapat disajikan dalam bentuk kalimat deskriptif, diagram alir (flowchart), atau pseudocode.',
      'Tiga struktur kontrol logika dalam pemrograman adalah: Sekuensial (runtunan), Percabangan (seleksi/IF-ELSE), dan Perulangan (looping).',
    ],
    refleksiDiri: [
      { id: 'ref-b1-1', statement: 'Saya dapat menjelaskan pengertian Berpikir Komputasional dengan kata-kata saya sendiri.' },
      { id: 'ref-b1-2', statement: 'Saya dapat membedakan fungsi Dekomposisi, Pengenalan Pola, Abstraksi, dan Algoritma dalam studi kasus nyata.' },
      { id: 'ref-b1-3', statement: 'Saya mampu mengenali simbol-simbol standar dalam diagram alir (flowchart) seperti Terminator, Proses, Input/Output, dan Decision.' },
      { id: 'ref-b1-4', statement: 'Saya dapat membuat contoh algoritma sederhana yang menggunakan percabangan (IF-ELSE) dan perulangan (Loop).' },
    ],
  },

  // ===========================================================================
  // BAB 2: PENGOLAHAN DATA
  // ===========================================================================
  {
    id: 'bab2',
    babNumber: 2,
    title: 'Pengolahan Data',
    subtitle: 'Analisis Data Angka, Lembar Kerja (Spreadsheet), Formula & Visualisasi',
    semester: 1,
    badge: 'BAB 2 • EXCEL & ANALISIS DATA',
    themeColor: {
      primary: '#107c41',
      border: 'border-emerald-600',
      bgBadge: 'bg-emerald-100',
      textBadge: 'text-emerald-900',
    },
    tujuanPembelajaran: [
      'Memahami definisi data, perbedaan data dengan informasi, serta hierarki piramida DIKW (Data, Informasi, Pengetahuan, Kebijaksanaan).',
      'Mengidentifikasi tipe-tipe data digital dasar: teks/string, angka numerik, tanggal/waktu, dan nilai logika boolean.',
      'Mengenal antarmuka dan terminologi perkakas lembar kerja (spreadsheet): workbook, worksheet, sel, baris, kolom, dan rentang (range).',
      'Terampil melakukan entri data, format sel (angka, mata uang, persentase), serta pengurutan data (Sort) dan penyaringan (Filter).',
      'Mampu menerapkan rumus aritmatika dasar (+, -, *, /, ^) dan fungsi statistik agregasi standar: SUM, AVERAGE, MIN, MAX, COUNT, dan COUNTA.',
      'Menguasai pengolahan data lanjutan menggunakan fungsi logika IF (tunggal maupun majemuk) serta fungsi pencarian vertikal VLOOKUP.',
      'Mampu menyajikan data terolah ke dalam visualisasi diagram grafik (batang, garis, lingkaran) yang informatif dan komunikatif.',
    ],
    petaKonsep: {
      description: 'Peta alur pembelajaran pengolahan data dari pemahaman konsep hingga pengoperasian lembar kerja canggih.',
      nodes: [
        {
          category: 'Konsep Dasar Data',
          items: ['Data vs Informasi', 'Tipe Data (Teks, Angka, Tanggal)', 'Satuan Data Digital (Byte, KB, MB, GB)'],
        },
        {
          category: 'Perkakas Spreadsheet',
          items: ['Workbook & Sheet', 'Kolom (A, B) & Baris (1, 2)', 'Alamat Sel (B4)', 'Rentang/Range (A1:C10)'],
        },
        {
          category: 'Pengolahan Data Dasar',
          items: ['Operator (+, -, *, /)', 'Agregasi SUM, AVERAGE', 'Ekstremum MIN, MAX', 'Pencacah COUNT, COUNTA', 'Sort & Filter'],
        },
        {
          category: 'Pengolahan Data Lanjutan',
          items: ['Logika IF Tunggal & Majemuk', 'Pencarian Tabel VLOOKUP', 'Visualisasi Grafik (Bar, Line, Pie)'],
        },
      ],
    },
    dimensiProfilLulusan: [
      {
        name: 'Bernalar Kritis',
        description: 'Mampu menganalisis kumpulan angka mentah, mendeteksi kejanggalan data, dan menarik kesimpulan berbasis fakta.',
      },
      {
        name: 'Mandiri',
        description: 'Teliti dan mandiri dalam menyusun rumus formula serta memeriksa kebenaran hasil perhitungan.',
      },
      {
        name: 'Gotong Royong',
        description: 'Bekerja sama dalam tim untuk menghimpun data survei kelas dan menyajikan laporan spreadsheet bersama.',
      },
      {
        name: 'Kreatif',
        description: 'Merancang tata letak tabel yang rapi serta memilih jenis diagram grafik yang paling tepat untuk menyampaikan pesan data.',
      },
    ],
    pertanyaanPemantik: [
      'Jika ada 500 nilai ulangan siswa di sekolah, bagaimana cara guru menemukan nilai tertinggi, nilai terendah, dan rata-rata kelas hanya dalam 3 detik?',
      'Apakah ada perbedaan nyata antara kumpulan angka mentah 12, 14, 15 dengan informasi "rata-rata usia siswa kelas 7 adalah 13 tahun"?',
      'Bagaimana mesin kasir di minimarket dapat langsung memunculkan nama barang dan harga pas saat kasir memindai kode barcode?',
    ],
    materiPokok: [
      {
        id: 'b2-a',
        letter: 'A',
        title: 'Mengenal Data',
        subtitle: 'Definisi Data vs Informasi, Tipe Data, dan Satuan Kapasitas Digital',
        content: [
          'Data adalah kumpulan fakta mentah, angka, simbol, teks, gambar, atau pengamatan yang belum diolah dan belum memiliki konteks makna bagi pengambil keputusan.',
          'Informasi adalah data yang telah diproses, diorganisasikan, dan disajikan dalam konteks tertentu sehingga memiliki arti dan bermanfaat untuk pengambilan keputusan nyata.',
          'Hubungan data dan informasi digambarkan dalam Piramida DIKW: Data (fakta mentah) -> Informasi (data diproses) -> Knowledge/Pengetahuan (pemahaman pola) -> Wisdom/Kebijaksanaan (penerapan bijak).',
        ],
        keyPoints: [
          'Tipe Data Teks (String/Label): Kumpulan huruf atau karakter yang tidak dihitung secara matematis (contoh: "Budi", "Kelas 7A", "Jl. Merdeka No. 5"). Default rata kiri pada lembar kerja.',
          'Tipe Data Numerik (Angka/Number): Nilai kuantitatif bilangan bulat atau desimal yang dapat dikenai operasi matematika (contoh: 85, 175.5, 50000). Default rata kanan pada lembar kerja.',
          'Tipe Data Tanggal/Waktu (Date/Time): Format penanggalan yang dapat dihitung selisih harinya (contoh: 17/08/2026, 07:30 WIB).',
          'Tipe Data Logika (Boolean): Hanya bernilai TRUE (Benar) atau FALSE (Salah), merupakan hasil evaluasi perbandingan.',
        ],
        table: {
          headers: ['Satuan Data', 'Singkatan', 'Ukuran Konversi', 'Contoh Nyata Media Simpan'],
          rows: [
            ['Bit', 'b', '1 digit biner (0 atau 1)', 'Satuan terkecil komputasi'],
            ['Byte', 'B', '8 bit', '1 karakter huruf teks'],
            ['Kilobyte', 'KB', '1.024 Byte', '1 dokumen teks ringan'],
            ['Megabyte', 'MB', '1.024 KB (~1 juta byte)', '1 foto kamera HP / file lagu MP3'],
            ['Gigabyte', 'GB', '1.024 MB (~1 miliar byte)', '1 film video HD / kapasitas RAM HP'],
            ['Terabyte', 'TB', '1.024 GB (~1 triliun byte)', 'Kapasitas Harddisk komputer modern'],
          ],
        },
        tip: 'Tips: Jika kamu mengetik angka telepon atau NISN seperti "0812345" dan angka 0 di depan hilang, ubah format sel menjadi Text atau ketik tanda petik satu sebelum angka: \'0812345.',
      },
      {
        id: 'b2-b',
        letter: 'B',
        title: 'Mengenal Perkakas Lembar Kerja',
        subtitle: 'Anatomi Workbook, Sel, Baris, Kolom, Range, dan Format Tampilan',
        content: [
          'Perkakas lembar kerja (Spreadsheet) adalah aplikasi pengolah data angka berbasis kisi baris dan kolom yang dirancang untuk perhitungan, analisis, dan pembuatan visualisasi grafik (contoh populer: Microsoft Excel, Google Sheets, LibreOffice Calc).',
          'Dokumen spreadsheet disebut Buku Kerja (Workbook) yang di dalamnya dapat memuat satu atau lebih Lembar Kerja (Worksheet / Sheet).',
        ],
        keyPoints: [
          'Kolom (Column): Jalur vertikal yang diidentifikasi dengan huruf abjad (A, B, C, ... Z, AA, AB, dst).',
          'Baris (Row): Jalur horizontal yang diidentifikasi dengan nomor urut angka (1, 2, 3, dst).',
          'Sel (Cell): Titik potong (pertemuan) antara satu kolom dan satu baris. Contoh: Sel C4 adalah perpotongan kolom C dan baris 4.',
          'Rentang (Range): Kumpulan dua atau lebih sel yang membentuk area persegi. Ditulis dengan tanda titik dua `:`. Contoh: `A1:C5` berarti area dari sel A1 hingga sel C5.',
          'Kotak Nama (Name Box): Kotak di kiri atas yang menampilkan alamat sel aktif yang sedang dipilih.',
          'Bilah Rumus (Formula Bar): Kotak tempat mengetikkan rumus atau melihat isi asli sel di balik nilai tampilannya.',
        ],
        examples: [
          {
            title: 'Anatomi Alamat Rentang Sel',
            desc: 'Rentang B2:D6 mencakup 3 kolom (B, C, D) dan 5 baris (2, 3, 4, 5, 6), sehingga total sel yang dicakup adalah 3 x 5 = 15 sel.',
          },
        ],
        actionButton: {
          label: 'Buka Laboratorium Excel Interaktif',
          subtabTarget: 'excel',
        },
        tip: 'Gunakan tombol shortcut keyboard: Ctrl + Panah untuk melompat ke ujung tabel data, dan Ctrl + Z untuk membatalkan kesalahan.',
      },
      {
        id: 'b2-c',
        letter: 'C',
        title: 'Pengolahan Data Dasar',
        subtitle: 'Operator Matematika, Rumus Aritmatika, Fungsi Agregasi, Sort & Filter',
        content: [
          'Semua penulisan rumus atau formula pada aplikasi lembar kerja WAJIB diawali dengan tanda sama dengan (`=`). Jika tidak diawali tanda sama dengan, program akan menganggapnya sebagai teks biasa.',
          'Lembar kerja mendukung operator aritmatika baku: Penjumlahan (`+`), Pengurangan (`-`), Perkalian (`*`), Pembagian (`/`), dan Perpangkatan (`^`). Hirarki perhitungan mengikuti aturan matematika standar (tanda kurung dihitung paling awal).',
          'Fungsi agregasi statistik bawaan spreadsheet mempercepat kalkulasi ratusan baris data dalam sekejap:',
        ],
        keyPoints: [
          '=SUM(rentang): Menjumlahkan seluruh angka di dalam rentang yang dipilih. Contoh: =SUM(B2:B30)',
          '=AVERAGE(rentang): Menghitung rata-rata aritmatika dari rentang sel. Contoh: =AVERAGE(C2:C30)',
          '=MIN(rentang): Mencari nilai terkecil/minimum di dalam rentang. Contoh: =MIN(D2:D30)',
          '=MAX(rentang): Mencari nilai terbesar/maksimum di dalam rentang. Contoh: =MAX(D2:D30)',
          '=COUNT(rentang): Menghitung banyaknya sel yang HANYA memuat angka numerik.',
          '=COUNTA(rentang): Menghitung banyaknya sel yang TIDAK KOSONG (berisi angka maupun teks).',
          'Sort (Pengurutan): Menyusun data dari kecil ke besar (Ascending A-Z / 1-9) atau dari besar ke kecil (Descending Z-A / 9-1).',
          'Filter (Penyaringan): Menampilkan hanya baris-baris data yang memenuhi kriteria tertentu (misal hanya siswa Kelas 7B).',
        ],
        actionButton: {
          label: 'Pelajari Rumus di Panduan Sintaks',
          subtabTarget: 'guide',
        },
        examples: [
          {
            title: 'Contoh Formula Menghitung Nilai Akhir',
            desc: 'Jika Nilai Tugas di B2, Nilai UTS di C2, dan Nilai UAS di D2: Rumus rata-rata =AVERAGE(B2:D2) atau berbobot =(B2*0.3)+(C2*0.3)+(D2*0.4).',
          },
        ],
        tip: 'Gunakan fitur AutoFill (tarik kotak kecil di sudut kanan bawah sel aktif) untuk menyalin rumus ke baris-baris di bawahnya secara otomatis.',
      },
      {
        id: 'b2-d',
        letter: 'D',
        title: 'Pengolahan Data Lanjutan',
        subtitle: 'Logika IF, IF Bertingkat, Lookup VLOOKUP, dan Visualisasi Grafik',
        content: [
          'Setelah menguasai perhitungan dasar, pengolahan data lanjutan melibatkan pengambilan keputusan otomatis berbasis logika kondisi (IF) dan integrasi tabel referensi (VLOOKUP).',
          'Fungsi Logika IF: Memeriksa apakah suatu syarat/kondisi terpenuhi, lalu menghasilkan nilai tertentu jika BENAR, dan nilai lain jika SALAH.',
          'Sintaks Dasar: `=IF(uji_logika, nilai_jika_benar, nilai_jika_salah)`',
        ],
        keyPoints: [
          'Contoh IF Tunggal (Kelulusan): `=IF(C2>=75, "TUNTAS", "REMEDIAL")`. Jika nilai di C2 adalah 80, sel menghasilkan "TUNTAS". Jika 70, menghasilkan "REMEDIAL".',
          'Contoh IF Bertingkat (Predikat): `=IF(C2>=90, "A", IF(C2>=80, "B", IF(C2>=70, "C", "D")))`. Menguji bertingkat dari nilai tertinggi ke terendah.',
          'Fungsi VLOOKUP (Vertical Lookup): Mengambil data dari tabel acuan lain secara otomatis berdasarkan kata kunci unik di kolom pertama.',
          'Sintaks VLOOKUP: `=VLOOKUP(nilai_kunci, rentang_tabel_acuan, nomor_kolom_hasil, [persis_atau_mendekati])`. Contoh: `=VLOOKUP("A01", $F$2:$H$20, 2, FALSE)` mengambil nama barang untuk kode A01.',
          'Visualisasi Data (Grafik/Charts): Mengubah angka menjadi grafik agar mudah dipahami sekilas. Diagram Batang (Bar/Column) cocok untuk membandingkan kategori, Diagram Garis (Line) cocok untuk tren waktu, Diagram Lingkaran (Pie) cocok untuk melihat proporsi persentase dari total.',
        ],
        table: {
          headers: ['Jenis Grafik', 'Tujuan Penggunaan', 'Contoh Kasus Sekolah'],
          rows: [
            ['Diagram Batang (Column Chart)', 'Membandingkan nilai antar kelompok/kategori yang berbeda.', 'Jumlah siswa per kelas (7A, 7B, 7C, 7D).'],
            ['Diagram Garis (Line Chart)', 'Melihat tren naik/turun perkembangan data dari waktu ke waktu.', 'Perkembangan suhu harian selama seminggu atau nilai ulangan dari Bab 1 ke Bab 3.'],
            ['Diagram Lingkaran (Pie Chart)', 'Menunjukkan proporsi bagian terhadap keseluruhan (100%).', 'Persentase pilihan ekstrakurikuler siswa dalam satu angkatan.'],
          ],
        },
        actionButton: {
          label: 'Praktik Langsung di Lab Excel',
          subtabTarget: 'excel',
        },
        tip: 'Saat menggunakan VLOOKUP, selalu kunci tabel referensi menggunakan tanda dollar ($F$2:$H$20) agar alamat tabel tidak bergeser saat rumus disalin ke bawah.',
      },
    ],
    rangkumanMateri: [
      'Data adalah fakta mentah, sedangkan informasi adalah data yang telah diolah dan memiliki arti serta nilai guna.',
      'Tipe data utama dalam lembar kerja meliputi Teks (rata kiri), Numerik (rata kanan), Tanggal/Waktu, dan Boolean.',
      'Worksheet tersusun dari Kolom (huruf) dan Baris (angka). Sel adalah pertemuan kolom dan baris (contoh: C5), sedangkan rentang (range) adalah kumpulan sel (contoh: A1:D10).',
      'Penulisan rumus/formula di spreadsheet selalu diawali tanda sama dengan (`=`).',
      'Fungsi statistik dasar: SUM (jumlah), AVERAGE (rata-rata), MIN (terendah), MAX (tertinggi), COUNT (hitung sel berisi angka), COUNTA (hitung sel tidak kosong).',
      'Pengurutan (Sort) dan penyaringan (Filter) memudahkan pencarian data dalam tabel yang berukuran besar.',
      'Fungsi logika IF mengevaluasi kondisi True/False, sedangkan VLOOKUP mencari dan mencocokkan data dari tabel acuan lain secara vertikal.',
      'Grafik visual (batang, garis, lingkaran) mempermudah audiens memahami pesan data secara cepat dan menarik.',
    ],
    refleksiDiri: [
      { id: 'ref-b2-1', statement: 'Saya dapat menjelaskan perbedaan nyata antara data mentah dengan informasi terolah.' },
      { id: 'ref-b2-2', statement: 'Saya mampu mengenali alamat sel, baris, kolom, dan rentang pada lembar kerja spreadsheet.' },
      { id: 'ref-b2-3', statement: 'Saya dapat menuliskan rumus fungsi SUM, AVERAGE, MIN, dan MAX secara mandiri tanpa bantuan.' },
      { id: 'ref-b2-4', statement: 'Saya memahami cara kerja logika IF untuk menentukan status kelulusan nilai (TUNTAS / REMEDIAL).' },
      { id: 'ref-b2-5', statement: 'Saya mampu memilih jenis grafik yang tepat (batang, garis, lingkaran) untuk data yang sedang diolah.' },
    ],
  },

  // ===========================================================================
  // BAB 3: LITERASI INFORMASI
  // ===========================================================================
  {
    id: 'bab3',
    babNumber: 3,
    title: 'Literasi Informasi',
    subtitle: 'Kecakapan Mengakses, Mengevaluasi Sumber Digital, Pers, dan Melawan Hoaks',
    semester: 1,
    badge: 'BAB 3 • LITERASI DIGITAL & MEDIA',
    themeColor: {
      primary: '#d97706',
      border: 'border-amber-600',
      bgBadge: 'bg-amber-100',
      textBadge: 'text-amber-900',
    },
    tujuanPembelajaran: [
      'Memahami hakikat literasi informasi sebagai kemampuan mencari, mengevaluasi, mengelola, dan mengomunikasikan informasi secara bijak dan bertanggung jawab.',
      'Membedakan pengertian dan karakteristik data, informasi, dan konten digital dalam ekosistem media modern.',
      'Memahami siklus pengolahan konten digital serta menerapkan etika dan hukum digital dalam berinteraksi di ruang publik siber.',
      'Mengetahui strategi penyimpanan konten digital secara aman (penyimpanan lokal vs penyimpanan awan/Cloud Storage) dan prinsip pencadangan data (backup).',
      'Menguasai teknik penelusuran informasi yang efektif dan memahami faktor-faktor penentu relevansi hasil pencarian.',
      'Memahami cara kerja mesin pencari (search engine) termasuk crawling, indexing, ranking, serta pemanfaatan operator pencarian lanjutan.',
      'Mampu menguji dan menilai kredibilitas sumber informasi digital menggunakan metode uji standar (CRAAP Test).',
      'Memahami ekosistem media pers digital, peran kode etik jurnalistik, dan perbedaan media resmi dengan media sosial perseorangan.',
      'Mampu membedakan fakta, opini, dan hoaks, mengidentifikasi jenis-jenis gangguan informasi (misinformasi, disinformasi, malinformasi), serta terampil melakukan verifikasi cek fakta mandiri.',
    ],
    petaKonsep: {
      description: 'Peta komprehensif 8 sub-materi Literasi Informasi dalam membangun integritas digital pelajar.',
      nodes: [
        {
          category: 'Konten & Pengelolaan',
          items: ['A. Data, Informasi & Konten', 'B. Pengolahan Konten', 'C. Cara Menyimpan Konten'],
        },
        {
          category: 'Penelusuran Mesin Pencari',
          items: ['D. Relevansi Pencarian', 'E. Mesin Pencari di Internet (Operator Lanjutan)'],
        },
        {
          category: 'Evaluasi & Integritas Media',
          items: ['F. Kredibilitas Sumber Informasi', 'G. Ekosistem Media Pers Digital', 'H. Fakta, Opini, dan Hoaks'],
        },
      ],
    },
    dimensiProfilLulusan: [
      {
        name: 'Bernalar Kritis',
        description: 'Selalu skeptis yang sehat, memeriksa bukti, dan memverifikasi sumber sebelum mempercayai atau menyebarkan suatu informasi.',
      },
      {
        name: 'Berakhlak Mulia',
        description: 'Menjaga sopan santun digital (netiket), menghargai hak cipta intelektual orang lain, dan tidak menyebarkan kebencian atau fitnah.',
      },
      {
        name: 'Kebinekaan Global',
        description: 'Menghargai keragaman sudut pandang di internet serta berperan aktif menciptakan ruang digital yang aman dan inklusif.',
      },
      {
        name: 'Mandiri',
        description: 'Mampu menyortir kebutuhan informasi secara mandiri tanpa terpengaruh oleh arus hoaks atau clickbait.',
      },
    ],
    pertanyaanPemantik: [
      'Jika kamu menerima pesan berantai di WhatsApp bertuliskan "SEBARKAN INI KE 10 ORANG ATAU REKENINGMU DIBLOKIR!", apa yang sebaiknya kamu lakukan pertama kali?',
      'Bagaimana Google dapat memunculkan 12 juta halaman web dalam waktu kurang dari 0,4 detik saat kamu mengetikkan satu kata kunci?',
      'Apakah foto atau video viral di media sosial selalu merupakan fakta kejadian nyata, atau bisa saja dipotong konteksnya (out of context)?',
    ],
    materiPokok: [
      {
        id: 'b3-a',
        letter: 'A',
        title: 'Data, Informasi dan Konten',
        subtitle: 'Definisi Konten Digital, Format Media, dan Nilai Guna Informasi',
        content: [
          'Di era digital, data dan informasi diwujudkan dalam bentuk Konten Digital (Digital Content), yaitu segala bentuk materi atau pesan yang disimpan, diproses, dan disebarluaskan dalam format biner terkomputerisasi.',
          'Format konten digital mencakup: Teks (artikel, e-book), Grafis/Gambar (foto, diagram, infografis), Audio (podcast, rekaman suara), Video (animasi, vlog edukasi), dan Interaktif (game, simulasi web).',
          'Suatu konten informasi dikatakan berkualitas tinggi jika memenuhi empat syarat esensial:',
        ],
        keyPoints: [
          'Akurat (Accurate): Bebas dari kesalahan perhitungan atau pemutarbalikan fakta.',
          'Tepat Waktu (Timely): Masih mutakhir dan relevan dengan periode waktu saat informasi dibutuhkan.',
          'Relevan (Relevant): Sesuai dengan topik permasalahan dan kebutuhan spesifik pengguna.',
          'Lengkap (Complete): Menyajikan seluruh fakta penting tanpa ada bagian krusial yang sengaja disembunyikan.',
        ],
        tip: 'Ingat: Informasi yang tidak akurat dapat mengarahkan seseorang pada keputusan yang salah dan fatal.',
      },
      {
        id: 'b3-b',
        letter: 'B',
        title: 'Pengolahan Data, Informasi, dan Konten',
        subtitle: 'Siklus Hidup Konten, Etika Digital (Netiket), dan Hak Kekayaan Intelektual',
        content: [
          'Pengolahan konten digital mengikuti Siklus Hidup Informasi (Information Lifecycle): Pengumpulan Data (Gathering) -> Pemilahan & Validasi (Filtering) -> Pengolahan & Penyuntingan (Processing/Editing) -> Publikasi/Distribusi (Publishing) -> Pengarsipan (Archiving).',
          'Saat mengolah dan membagikan konten, setiap warganet wajib mematuhi Etika Berinternet (Netiket / Network Etiquette) serta menghormati Hak Cipta (Copyright / Hak Kekayaan Intelektual).',
        ],
        keyPoints: [
          'Atribusi Sumber: Selalu mencantumkan nama pembuat karya asli dan tautan sumber jika mengutip tulisan, gambar, atau musik karya orang lain.',
          'Lisensi Creative Commons (CC): Mengenal lisensi konten terbuka yang mengizinkan pemakaian karya secara legal dengan syarat tertentu (contoh: CC BY = wajib menyebutkan pencipta).',
          'Menghindari Plagiarisme: Tidak menjiplak karya orang lain seolah-olah karya pribadi.',
          'Menjaga Privasi & Jejak Digital: Tidak menyebarkan data pribadi sensitif (KTP, nomor telepon, alamat rumah, password) baik milik diri sendiri maupun orang lain (Doxing).',
        ],
        tip: 'Tips: Jejak digital (digital footprint) bersifat abadi. Apapun yang kamu unggah hari ini dapat dicari kembali bertahun-tahun kemudian.',
      },
      {
        id: 'b3-c',
        letter: 'C',
        title: 'Cara Menyimpan Konten',
        subtitle: 'Penyimpanan Lokal vs Cloud Storage, Keamanan Berkas, dan Aturan Backup 3-2-1',
        content: [
          'Menyimpan konten secara aman dan terorganisasi menjamin data tidak hilang saat perangkat rusak atau terinfeksi virus.',
          'Terdapat dua media penyimpanan utama: Penyimpanan Lokal (Local Storage) dan Penyimpanan Awan (Cloud Storage).',
        ],
        keyPoints: [
          'Penyimpanan Lokal: Harddisk Internal (HDD), Solid State Drive (SSD), Flashdisk USB, dan Kartu Memori (MicroSD). Kelebihan: dapat diakses tanpa koneksi internet dan kecepatan transfer tinggi. Kekurangan: rentan hilang, jatuh/rusak fisik, atau terserang ransomware.',
          'Penyimpanan Awan (Cloud Storage): Menyimpan file di peladen (server) internet milik penyedia layanan (contoh: Google Drive, Microsoft OneDrive, Dropbox, iCloud). Kelebihan: dapat diakses dari perangkat mana saja kapan pun, sinkronisasi otomatis, dan mudah dibagikan. Kekurangan: membutuhkan akses internet.',
          'Prinsip Backup Data 3-2-1 (Standar Keamanan Internasional):',
          '• Simpan minimal 3 salinan data (1 data utama + 2 data cadangan).',
          '• Gunakan 2 jenis media penyimpanan yang berbeda (misal: di laptop dan di harddisk eksternal).',
          '• Simpan 1 salinan cadangan di lokasi fisik terpisah / di Cloud Storage.',
        ],
        tip: 'Tips: Berikan nama file secara rapi dan konsisten, misalnya: TugasInformatika_Bab3_Ahmad_7B_v1.docx daripada nama acak seperti: tugasasdasd.docx.',
      },
      {
        id: 'b3-d',
        letter: 'D',
        title: 'Relevansi Hasil Pencarian',
        subtitle: 'Faktor Kesesuaian Kebutuhan, Kata Kunci Spesifik, dan Personalisasi Algoritma',
        content: [
          'Saat kita mencari informasi di internet, mesin pencari akan menyajikan ribuan hingga jutaan halaman web. Namun, tidak semua halaman tersebut relevan dengan apa yang sesungguhnya kita butuhkan.',
          'Relevansi adalah derajat kesesuaian antara isi materi pada dokumen yang ditemukan dengan kebutuhan informasi yang dimaksudkan oleh pengguna.',
        ],
        keyPoints: [
          'Faktor Penentu Relevansi: Kecocokan kata kunci (keywords), kesegaran/kemutakhiran waktu terbit artikel, reputasi domain situs, lokasi geografis pencari, dan riwayat penelusuran sebelumnya.',
          'Pemilihan Kata Kunci yang Tepat: Hindari kata kunci yang terlalu umum/luas. Contoh: Jangan hanya mengetik "komputer", gunakan kata kunci spesifik: "fungsi perangkat proses sistem komputer kelas 7".',
          'Fenomena Gelembung Filter (Filter Bubble): Algoritma mesin pencari dan media sosial cenderung menyodorkan konten yang serupa dengan kesukaan masa lalu kita, sehingga kita berisiko terjebak pada satu sudut pandang sempit.',
        ],
        tip: 'Gunakan mode penyamaran (Incognito / Private Window) jika kamu ingin melihat hasil pencarian murni tanpa pengaruh riwayat personal akunmu.',
      },
      {
        id: 'b3-e',
        letter: 'E',
        title: 'Mesin Pencari di Internet',
        subtitle: 'Cara Kerja Search Engine (Crawling, Indexing, Ranking) dan Operator Lanjutan',
        content: [
          'Mesin Pencari (Search Engine) seperti Google, Bing, atau DuckDuckGo bekerja tanpa henti mengarungi semesta internet melalui tiga tahapan kerja terprogram:',
          '1. Perayapan (Crawling): Robot perangkat lunak (disebut spider atau bot crawler) menjelajahi seluruh tautan (hyperlink) dari satu halaman web ke halaman web lain di seluruh dunia.',
          '2. Pengindeksan (Indexing): Seluruh teks, gambar, dan video yang ditemukan dianalisis dan disimpan dalam basis data raksasa (indeks) seperti daftar isi buku perpustakaan dunia.',
          '3. Pemeringkatan & Penyajian (Ranking & Serving): Saat kamu mengetik kata kunci, algoritma menghitung kecocokan dan mengurutkan situs web terbaik berdasarkan ratusan faktor kualitas (PageRank, kecepatan, keterbacaan).',
        ],
        keyPoints: [
          'Operator Tanda Kutip ("frasa persis"): Memaksa mesin pencari menemukan urutan kata yang persis sama. Contoh: "berpikir komputasional smp"',
          'Operator site:domain: Membatasi pencarian hanya pada situs atau akhiran domain tertentu. Contoh: informatika site:kemdikbud.go.id',
          'Operator filetype:ekstensi: Mencari berkas dengan tipe tertentu seperti dokumen presentasi atau buku PDF. Contoh: kurikulum merdeka informatika filetype:pdf',
          'Operator Tanda Minus (-kata): Mengecualikan hasil yang memuat kata tertentu. Contoh: apel -buah (mencari komputer Apple, bukan buah apel)',
          'Operator OR: Mencari dokumen yang memuat salah satu dari dua kata kunci. Contoh: robotika OR kecerdasan buatan',
        ],
        table: {
          headers: ['Sintaks Operator Pencarian', 'Tujuan / Fungsi', 'Contoh Masukan di Google'],
          rows: [
            ['"..." (Tanda Kutip)', 'Mencari frasa persis tanpa dipenggal', '"algoritma dan pemrograman"'],
            ['site:', 'Membatasi pada situs resmi pemerintah / sekolah', 'pengolahan data site:go.id'],
            ['filetype:', 'Mencari format file unduhan (.pdf, .pptx, .xlsx)', 'latihan soal excel filetype:xlsx'],
            ['- (Tanda Minus)', 'Menghilangkan kata yang tidak diinginkan', 'python -ular'],
            ['define:', 'Menampilkan definisi kamus resmi', 'define:algoritma'],
          ],
        },
        tip: 'Kombinasikan operator untuk hasil super presisi, misalnya: "pengolahan data" site:kemdikbud.go.id filetype:pdf',
      },
      {
        id: 'b3-f',
        letter: 'F',
        title: 'Kredibilitas Sumber Informasi',
        subtitle: 'Metode Pengujian CRAAP Test dan Identifikasi Domain Tepercaya',
        content: [
          'Di era internet di mana siapa saja dapat membuat dan menerbitkan tulisan secara bebas, kemampuan membedakan sumber kredibel (dapat dipercaya) dan sumber abal-abal adalah keterampilan bertahan hidup yang utama.',
          'Para ilmuwan informasi di dunia menggunakan metode CRAAP Test untuk menguji keabsahan sebuah sumber digital:',
        ],
        keyPoints: [
          'C - Currency (Kemutakhiran): Kapan informasi tersebut diterbitkan atau diperbarui? Apakah tautan link di dalamnya masih aktif? Untuk sains dan teknologi, utamakan artikel 3 tahun terakhir.',
          'R - Relevance (Relevansi): Apakah informasi ini menjawab kebutuhan tugasmu? Siapa sasaran pembacanya? Apakah pembahasannya berbobot atau terlalu dangkal?',
          'A - Authority (Otoritas): Siapa penulisnya? Apakah penulis memiliki latar belakang keahlian atau gelar di bidang tersebut? Apakah situs memiliki dewan redaksi resmi?',
          'A - Accuracy (Akurasi): Apakah pernyataan didukung data, riset, atau rujukan sumber lain? Apakah terdapat kesalahan ketik (typo) parah dan gaya bahasa emosional?',
          'P - Purpose (Tujuan): Apa tujuan situs dibuat? Apakah untuk mengedukasi (edukasi), memberitakan fakta (jurnalistik), menghibur (humor), atau menjual produk / propaganda politik terselubung?',
          'Pembedaan Ekstensi Domain Terpercaya: Domain resmi seperti .go.id (pemerintah RI), .sch.id (sekolah Indonesia), .ac.id (universitas) memiliki pengawasan ketat, berbeda dengan blog gratisan seperti .blogspot.com atau .wordpress.com.',
        ],
        tip: 'Waspadai situs berita palsu yang sengaja meniru nama domain situs berita terkenal dengan perbedaan 1-2 huruf tipuan (Typosquatting).',
      },
      {
        id: 'b3-g',
        letter: 'G',
        title: 'Ekosistem Media Pers Digital',
        subtitle: 'Perbedaan Media Pers Resmi vs Media Sosial, Kode Etik Jurnalistik & UU ITE',
        content: [
          'Media Pers Resmi dan Media Sosial memiliki sifat yang sangat berbeda dalam hal pertanggungjawaban hukum dan kebenaran konten.',
          'Media Pers Digital (seperti Kompas.com, Detik.com, Tempo.co, Antaranews) terikat oleh Undang-Undang Pers No. 40 Tahun 1999 dan diawasi oleh Dewan Pers. Setiap beritanya harus melalui proses verifikasi fakta oleh jurnalis profesional dan disetujui Pemimpin Redaksi.',
          'Media Sosial (seperti TikTok, Instagram, X, Facebook) merupakan media User-Generated Content di mana siapa saja bisa mengunggah opini tanpa proses kurasi atau verifikasi kebenaran.',
        ],
        keyPoints: [
          'Kode Etik Jurnalistik: Jurnalis wajib bersikap independen, menyajikan berita berimbang (cover both sides), tidak mencampuradukkan fakta dengan opini menghakimi, dan segera meralat jika ada kekeliruan berita.',
          'Jurnalisme Warga (Citizen Journalism): Warga biasa yang melaporkan peristiwa di sekitarnya. Sangat bermanfaat untuk kecepatan info lokal, namun pembaca harus tetap memverifikasi kebenarannya.',
          'Undang-Undang Informasi dan Transaksi Elektronik (UU ITE): Regulasi hukum di Indonesia yang mengatur larangan penyebaran konten melanggar hukum, seperti pencemaran nama baik, penyebaran ujaran kebencian SARA, ancaman kekerasan, dan penyebaran berita bohong yang merugikan publik.',
        ],
        tip: 'Sebelum membagikan ulang berita dari akun media sosial perseorangan, selalu cari apakah peristiwa tersebut sudah dikonfirmasi oleh minimal 2 media pers arus utama yang terverifikasi Dewan Pers.',
      },
      {
        id: 'b3-h',
        letter: 'H',
        title: 'Fakta, Opini, dan Hoaks',
        subtitle: 'Kategori Gangguan Informasi (Misinformasi, Disinformasi, Malinformasi) dan Cek Fakta',
        content: [
          'Mampu membedakan fakta dan opini adalah pertahanan awal agar tidak mudah dimanipulasi oleh informasi palsu di internet.',
          'Fakta adalah pernyataan tentang kenyataan objektif yang dapat dibuktikan kebenarannya secara empiris atau ilmiah dan disepakati secara umum (contoh: "Ibu kota Indonesia saat ini adalah Jakarta").',
          'Opini adalah sikap, pandangan, perasaan, atau penilaian subjektif seseorang mengenai suatu hal yang kebenarannya relatif dan belum tentu disepakati semua orang (contoh: "Pelajaran Informatika adalah pelajaran paling menyenangkan").',
        ],
        keyPoints: [
          'Tiga Kategori Gangguan Informasi (UNESCO):',
          '1. Misinformasi: Informasi yang salah atau keliru, tetapi disebarkan oleh orang yang TIDAK berniat jahat karena ia mengira informasi itu benar.',
          '2. Disinformasi: Informasi yang sengaja direkayasa, dipalsukan, atau dipelintir DENGAN NIAT JAHAT untuk mengelabui, meraup uang (klik iklan), atau memicu keresahan masyarakat.',
          '3. Malinformasi: Informasi yang bersumber dari fakta nyata, tetapi disebarluaskan dengan niat jahat untuk merusak reputasi seseorang atau kelompok (contoh: menyebarkan aib pribadi seseorang ke publik).',
          '5 Langkah Cek Fakta Mandiri Bagi Pelajar:',
          '• Waspadai Judul Sensasional / Provokatif: Judul yang menggunakan huruf kapital semua, kata "HEBOH", "VIRAL", atau menyuruh menyebarkan segera biasanya terindikasi hoaks.',
          '• Periksa Alamat URL Situs: Pastikan berasal dari domain terpercaya, bukan situs tiruan.',
          '• Periksa Gambar Menggunakan Reverse Image Search (Google Lens): Periksa apakah foto itu merupakan foto lama dari peristiwa berbeda yang diberi narasi baru.',
          '• Telusuri di Situs Cek Fakta Independen: Buka situs rujukan seperti turnbackhoax.id, cekfakta.com, atau rubrik Cek Fakta Kompas/Liputan6.',
          '• Saring Sebelum Sharing: Tanyakan pada diri sendiri: Apakah ini benar? Apakah ini bermanfaat? Apakah ini mendesak?',
        ],
        table: {
          headers: ['Aspek Pembeda', 'Fakta', 'Opini'],
          rows: [
            ['Sifat', 'Objektif (berlaku bagi semua orang)', 'Subjektif (tergantung sudut pandang orang)'],
            ['Pembuktian', 'Dapat dibuktikan dengan data, foto asli, atau dokumen resmi', 'Tidak dapat dibuktikan secara mutlak karena merupakan rasa/penilaian'],
            ['Kata Kunci Khas', 'Berdasarkan data, telah terjadi, berjumlah, menurut sensus', 'Menurut saya, sebaiknya, seharusnya, sangat indah, paling bagus'],
          ],
        },
        tip: 'Ingat Rumus "Saring Sebelum Sharing": Jika ragu terhadap kebenaran suatu informasi, langkah paling bijak dan aman adalah CUKUP BERHENTI DI KAMU dan jangan disebarkan!',
      },
    ],
    rangkumanMateri: [
      'Konten Digital mencakup beragam format: teks, gambar, audio, video, dan interaktif yang disimpan dalam bentuk biner.',
      'Informasi yang bermutu tinggi harus memenuhi kriteria: Akurat, Tepat Waktu, Relevan, dan Lengkap.',
      'Siklus pengolahan konten digital wajib mematuhi etika berinternet (netiket), mencantumkan atribusi sumber, dan mematuhi undang-undang hak cipta serta UU ITE.',
      'Strategi penyimpanan data digital menerapkan aturan Backup 3-2-1 dengan memadukan penyimpanan lokal (SSD/HDD) dan penyimpanan awan (Cloud Storage).',
      'Mesin pencari (Search Engine) bekerja melalui 3 tahap: Crawling (menjelajah), Indexing (mengkatalogkan), dan Ranking (memeringkat hasil).',
      'Operator pencarian lanjutan seperti tanda kutip `""`, `site:`, `filetype:`, dan `-` melipatgandakan kecepatan dan presisi penelusuran informasi.',
      'Kredibilitas sumber diuji dengan metode CRAAP (Currency, Relevance, Authority, Accuracy, Purpose) dan verifikasi ekstensi domain resmi.',
      'Media Pers Resmi terikat Dewan Pers dan Kode Etik Jurnalistik (cover both sides), sedangkan media sosial merupakan konten buatan pengguna tanpa jaminan kebenaran.',
      'Fakta bersifat objektif dan dapat dibuktikan; opini bersifat subjektif. Hoaks terdiri dari misinformasi, disinformasi, dan malinformasi.',
      'Lawan hoaks dengan 5 langkah cek fakta mandiri dan terapkan prinsip: "Saring Sebelum Sharing".',
    ],
    refleksiDiri: [
      { id: 'ref-b3-1', statement: 'Saya dapat membedakan data, informasi, dan konten digital beserta contoh formatnya.' },
      { id: 'ref-b3-2', statement: 'Saya mampu menerapkan operator pencarian lanjutan (tanda kutip, site:, filetype:) di mesin pencari Google.' },
      { id: 'ref-b3-3', statement: 'Saya dapat menilai kredibilitas suatu situs berita menggunakan prinsip pengujian CRAAP Test.' },
      { id: 'ref-b3-4', statement: 'Saya memahami perbedaan media pers resmi dengan media sosial perseorangan.' },
      { id: 'ref-b3-5', statement: 'Saya mampu membedakan fakta, opini, dan hoaks serta tahu cara memverifikasi kebenaran informasi sebelum membagikannya.' },
    ],
  },
];
