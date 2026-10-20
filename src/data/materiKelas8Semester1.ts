/**
 * Data materi Koding dan Kecerdasan Artifisial (KKA) Kelas 8 — Semester 1.
 * Terdiri dari 3 bab sesuai Kurikulum Merdeka:
 *   Bab 1 Algoritma, Bab 2 Pemrograman, Bab 3 Pengenalan Perangkat KA Sederhana.
 * Setiap bab memuat: Tujuan Pembelajaran, Peta Konsep Materi, Apersepsi,
 * Materi Pokok (sub-bab A, B, C, ...), Rangkuman Materi, dan Refleksi Diri.
 */

export interface MateriPokokItem8 {
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
  /** Tombol praktik menuju Studio Koding (Blockly/Scratch/PenguinMod). */
  actionButton?: {
    label: string;
  };
}

export interface BabKelas8KKA {
  id: string;
  babNumber: number;
  title: string;
  subtitle: string;
  semester: number;
  badge: string;
  /** Label singkat untuk tombol filter bab di tampilan. */
  filterLabel: string;
  /** Singkatan bab, mis. "ALG", "PRG", "KA". */
  filterAbbrev: string;
  themeColor: {
    primary: string;
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
  apersepsi: {
    /** Cerita/pemantik pembuka yang menghubungkan materi dengan kehidupan nyata. */
    story: string[];
    /** Pertanyaan pemantik untuk memicu rasa ingin tahu siswa. */
    questions: string[];
  };
  materiPokok: MateriPokokItem8[];
  rangkumanMateri: string[];
  refleksiDiri: Array<{
    id: string;
    statement: string;
  }>;
}

export const MATERI_KELAS_8_SEMESTER_1: BabKelas8KKA[] = [
  // ===========================================================================
  // BAB 1: ALGORITMA
  // ===========================================================================
  {
    id: 'kka-bab1',
    babNumber: 1,
    title: 'Algoritma',
    subtitle: 'Pengertian, Ciri, Komponen, Bentuk Representasi, dan Penerapan Algoritma',
    semester: 1,
    badge: 'BAB 1 • ALGORITMA',
    filterLabel: 'BAB 1: ALGORITMA',
    filterAbbrev: 'ALG',
    themeColor: {
      primary: '#0f766e',
      border: 'border-teal-700',
      bgBadge: 'bg-teal-100',
      textBadge: 'text-teal-900',
    },
    tujuanPembelajaran: [
      'Memahami pengertian algoritma sebagai serangkaian langkah logis dan berurutan untuk menyelesaikan suatu masalah.',
      'Mengidentifikasi ciri-ciri algoritma yang baik serta mampu menilai sebuah urutan langkah berdasarkan ciri tersebut.',
      'Memahami komponen utama algoritma: masukan (input), proses, dan keluaran (output).',
      'Mampu menyajikan algoritma dalam tiga bentuk representasi: kalimat deskriptif, diagram alir (flowchart), dan pseudocode.',
      'Membandingkan kelebihan dan keterbatasan ketiga bentuk representasi algoritma.',
      'Menerapkan algoritma dalam konteks kehidupan sehari-hari dan sebagai dasar penulisan program.',
      'Memahami hubungan logika dan struktur algoritma (urutan, percabangan, perulangan) dengan pemrograman komputer.',
    ],
    petaKonsep: {
      description:
        'Struktur keterkaitan konsep Algoritma: dari pengertian dan ciri, menuju komponen penyusun, bentuk penyajian, sampai penerapannya dalam kehidupan dan pemrograman.',
      nodes: [
        {
          category: 'Pengertian & Ciri',
          items: ['Definisi Algoritma', 'Asal Kata & Sejarah Singkat', 'Ciri-Ciri Algoritma yang Baik'],
        },
        {
          category: 'Komponen Utama',
          items: ['Masukan (Input)', 'Proses', 'Keluaran (Output)'],
        },
        {
          category: 'Bentuk Representasi',
          items: ['Kalimat Deskriptif', 'Diagram Alir (Flowchart)', 'Pseudocode'],
        },
        {
          category: 'Penerapan',
          items: ['Kehidupan Sehari-hari', 'Logika & Struktur dalam Pemrograman'],
        },
      ],
    },
    apersepsi: {
      story: [
        'Suatu pagi, Rani ingin membuat sarapan mie instan sebelum berangkat sekolah. Ia tidak asal menyalakan kompor. Ia menyiapkan air lebih dulu, merebusnya sampai mendidih, memasukkan mie dan bumbu, menunggu beberapa menit sampai matang, lalu menyajikannya ke dalam mangkuk. Jika urutannya tertukar, hasilnya tentu kacau: mie mentah, air dingin, atau bumbu tidak larut.',
        'Kegiatan sederhana tadi sebenarnya meniru cara kerja komputer. Komputer tidak pernah menebak; ia menjalankan langkah-langkah yang diberikan orang kepadanya secara urut, tepat, dan konsisten. Urutan langkah logis untuk menyelesaikan masalah seperti itulah yang disebut algoritma. Di bab ini kamu akan mengenal algoritma dari pengertian, ciri-cirinya, komponen penyusun, bentuk penyajian, sampai penerapannya dalam kehidupan sehari-hari dan dunia pemrograman.',
      ],
      questions: [
        'Pernahkah kamu membuat urutan langkah untuk mengajari teman melakukan sesuatu? Apa yang terjadi jika satu langkah dilewati atau tertukar?',
        'Menurutmu, apa persamaan cara kerja komputer dengan cara kamu mengikuti resep masakan atau petunjuk suatu permainan?',
        'Contoh kegiatan apa saja di sekolah atau di rumah yang sebenarnya mengikuti algoritma tertentu?',
      ],
    },
    materiPokok: [
      {
        id: 'kka-b1-a',
        letter: 'A',
        title: 'Pengertian Algoritma',
        subtitle: 'Apa itu algoritma dan dari mana asalnya',
        content: [
          'Algoritma adalah serangkaian langkah-langkah logis dan berurutan yang disusun untuk menyelesaikan suatu masalah atau menjalankan suatu tugas tertentu. Setiap langkah harus jelas, dapat dilakukan, dan menghasilkan hasil akhir yang diinginkan.',
          'Kata algoritma berasal dari nama ilmuwan muslim bernama Muhammad ibn Musa al-Khawarizmi (Al-Khawarizmi), ahli matematika dari abad ke-8 yang dikenal sebagai bapak ilmu hitung dan aljabar. Nama beliau juga menjadi asal kata "aljabar" (al-jabr). Dalam dunia informatika, karya Al-Khawarizmi menjadi inspirasi penamaan cara berpikir sistematis seperti ini.',
          'Dalam dunia komputer, algoritma menjadi rancangan awal sebelum seseorang menulis program ke dalam bahasa pemrograman. Komputer hanya menjalankan perintah yang diberikan kepadanya; algoritma yang menentukan perintah apa yang harus dijalankan, dalam urutan apa, dan bagaimana hasilnya. Algoritma yang baik akan menghasilkan program yang baik pula.',
        ],
        keyPoints: [
          'Algoritma = urutan langkah logis, sistematis, dan berurutan untuk menyelesaikan masalah.',
          'Asal kata: Al-Khawarizmi, ilmuwan yang dijuluki bapak aljabar.',
          'Algoritma menjadi rancangan dasar penulisan program komputer.',
          'Algoritma ada di mana-mana: resep masakan, petunjuk pemakaian, jadwal pelajaran, sampai cara kerja mesin.',
        ],
        tip: 'Kemampuan menyusun algoritma sama dengan kemampuan berpikir runtut. Latihannya sederhana: tulis langkah kegiatan harianmu seolah-olah pembacanya adalah orang yang tidak tahu apa-apa tentang kegiatan itu.',
      },
      {
        id: 'kka-b1-b',
        letter: 'B',
        title: 'Ciri-Ciri Algoritma Yang Baik',
        subtitle: 'Syarat sebuah urutan langkah layak disebut algoritma',
        content: [
          'Tidak semua urutan langkah layak disebut algoritma yang baik. Sebuah algoritma harus memenuhi sejumlah ciri agar mudah dipahami orang lain dan tidak menimbulkan kebingungan saat dijalankan, terutama oleh komputer yang hanya mengikuti perintah secara harfiah.',
          'Komputer sangat literal: kalimat "masukkan gula secukupnya" tidak bisa dijalankan komputer karena "secukupnya" berbeda maknanya bagi setiap orang. Algoritma yang baik harus sedemikian jelas sehingga siapa pun (atau komputer apa pun) yang menjalankannya akan menghasilkan hasil yang sama.',
        ],
        table: {
          headers: ['No', 'Ciri-Ciri', 'Penjelasan'],
          rows: [
            ['1', 'Urut (Terurut)', 'Langkah disusun berurutan dari awal sampai akhir; urutan yang salah dapat menghasilkan hasil yang keliru.'],
            ['2', 'Jelas & Tidak Bermakna Ganda', 'Setiap langkah ditulis dengan bahasa sederhana sehingga hanya memiliki satu pemahaman.'],
            ['3', 'Spesifik (Tepat Sasaran)', 'Langkah dijelaskan sedemikian rupa sehingga tidak menimbulkan tafsiran lain.'],
            ['4', 'Memiliki Masukan & Keluaran', 'Algoritma menerima data awal (masukan) dan menghasilkan hasil akhir (keluaran).'],
            ['5', 'Berhenti (Terhingga)', 'Algoritma harus memiliki akhir; tidak boleh berputar tanpa henti (infinite loop).'],
            ['6', 'Efektif & Rasional', 'Setiap langkah seharusnya dapat dilakukan secara nyata, tidak bertele-tele, dan masuk akal.'],
          ],
        },
        keyPoints: [
          'Ringkasnya: urut, jelas, spesifik, punya masukan-keluaran, berhenti, dan efektif.',
          'Contoh yang kurang spesifik: "masukkan gula secukupnya". Contoh yang baik: "masukkan satu sendok makan gula".',
          'Ciri "berhenti" mencegah algoritma (dan program) berjalan tanpa henti.',
        ],
        tip: 'Cara cepat menguji sebuah algoritma: bacakan langkahnya kepada temanmu tanpa penjelasan tambahan. Jika temanmu bisa menyelesaikan tugasnya dengan benar, algoritmu sudah cukup baik.',
      },
      {
        id: 'kka-b1-c',
        letter: 'C',
        title: 'Komponen Utama Algoritma',
        subtitle: 'Masukan (input), proses, dan keluaran (output)',
        content: [
          'Setiap algoritma, sederhana maupun kompleks, minimal memiliki tiga komponen utama yang saling terhubung: masukan (input), proses, dan keluaran (output). Ketiganya membentuk pola dasar cara kerja komputer: masukkan data, olah data, tampilkan hasil.',
          'Masukan (input) adalah data atau bahan awal yang diperlukan algoritma. Proses adalah serangkaian langkah pengolahan yang dilakukan terhadap masukan: menghitung, membandingkan, mengurutkan, memilih, dan lain-lain. Keluaran (output) adalah hasil akhir yang dihasilkan setelah proses selesai.',
        ],
        keyPoints: [
          'Masukan (Input): data awal yang dibutuhkan algoritma.',
          'Proses: langkah pengolahan yang dilakukan terhadap masukan.',
          'Keluaran (Output): hasil akhir yang bermanfaat bagi pengguna.',
        ],
        examples: [
          {
            title: 'Menghitung Nilai Rata-rata Ulangan',
            desc: 'Masukan: lima nilai ulangan (80, 85, 90, 75, 88). Proses: menjumlahkan kelima nilai lalu membaginya dengan 5. Keluaran: nilai rata-rata 83,6.',
          },
          {
            title: 'Mesin Cuci Otomatis',
            desc: 'Masukan: pakaian kotor dan tekanan tombol mode cuci. Proses: sikat, bilas, dan keringkan secara berurutan. Keluaran: pakaian bersih dan kering.',
          },
          {
            title: 'Transaksi di ATM',
            desc: 'Masukan: kartu ATM, PIN, dan nominal penarikan. Proses: memeriksa PIN dan saldo rekening. Keluaran: uang tunai dan sisa saldo.',
          },
        ],
        tip: 'Beberapa sumber menyebut komponen tambahan seperti kendali (control) dan umpan balik (feedback) untuk algoritma yang lebih kompleks, namun masukan-proses-keluaran tetap menjadi fondasi utamanya.',
      },
      {
        id: 'kka-b1-d',
        letter: 'D',
        title: 'Bentuk Representasi Algoritma',
        subtitle: 'Kalimat deskriptif, diagram alir (flowchart), dan pseudocode',
        content: [
          'Algoritma dapat disajikan atau "digambar" dalam tiga bentuk utama agar mudah dipahami orang lain. Pemilihan bentuk disesuaikan dengan tingkat kerumitan algoritma dan siapa yang akan membacanya.',
          'Bentuk pertama adalah kalimat deskriptif, yaitu penulisan langkah menggunakan bahasa sehari-hari secara berurutan. Bentuk ini paling mudah dipelajari pemula, tetapi menjadi panjang dan kurang praktis untuk algoritma yang rumit.',
          'Bentuk kedua adalah diagram alir (flowchart), yaitu gambaran alur langkah menggunakan simbol-simbol geometris yang dihubungkan dengan panah. Simbol yang umum digunakan: oval untuk mulai/selesai, persegi untuk proses, belah ketupat untuk keputusan, dan panah untuk arah alur.',
          'Bentuk ketiga adalah pseudocode, yaitu penulisan langkah yang meniru gaya bahasa pemrograman tetapi tidak terikat pada satu bahasa tertentu. Pseudocode menjadi jembatan antara algoritma dan kode program sungguhan.',
        ],
        keyPoints: [
          'Kalimat deskriptif: bahasa sehari-hari, mudah dipahami pemula.',
          'Diagram alir (flowchart): visual dengan simbol baku, alur terlihat sekilas.',
          'Pseudocode: gaya penulisan mirip kode program, dekat dengan bahasa pemrograman.',
        ],
        examples: [
          {
            title: 'Bentuk 1 — Kalimat Deskriptif: Membuat Secangkir Teh',
            desc: '1. Siapkan gelas dan teh celup. 2. Rebus air hingga mendidih. 3. Tuang air panas ke dalam gelas. 4. Masukkan teh celup dan satu sendok gula, aduk hingga rata. 5. Angkat teh celup, teh siap diminum.',
          },
          {
            title: 'Bentuk 2 — Diagram Alir (Flowchart)',
            desc: 'Mulai (oval) → Rebus air (proses) → "Apakah air mendidih?" (belah ketupat) → jika tidak, ulangi merebus; jika ya, tuang air ke gelas → masukkan teh dan gula → aduk → Selesai (oval). Setiap kotak dihubungkan panah menunjukkan arah alur.',
          },
          {
            title: 'Bentuk 3 — Pseudocode',
            desc: 'MULAI → rebus_air() → JIKA air_mendidih MAKA tuang(air, gelas); masukkan(teh, gula); aduk() → SELAINNYA ulangi_rebus() → AKHIR JIKA → SELESAI.',
          },
        ],
        tip: 'Belajar flowchart dimulai dari menghafalkan empat simbol utama: oval (mulai/selesai), persegi (proses), belah ketupat (keputusan), dan panah (arah alur). Setelah itu, latihlah membuat flowchart dari kegiatan sederhana di rumah.',
      },
      {
        id: 'kka-b1-e',
        letter: 'E',
        title: 'Perbandingan Ketiga Representasi Bentuk',
        subtitle: 'Kelebihan, keterbatasan, dan kapan memakai masing-masing bentuk',
        content: [
          'Ketiga bentuk representasi algoritma memiliki kelebihan dan keterbatasan masing-masing. Pemahaman atas perbandingan ini membantu kita memilih bentuk yang paling tepat sesuai situasi.',
          'Kalimat deskriptif paling mudah dipelajari dan tidak memerlukan alat khusus, tetapi menjadi panjang dan rawan tafsiran untuk algoritma yang rumit. Diagram alir paling visual: alur dan percabangan terlihat jelas sekilas, namun memerlukan ruang gambar yang luas dan merepotkan bila banyak perubahan. Pseudocode paling ringkas dan paling dekat dengan kode program sungguhan, sehingga paling membantu saat akan menulis program.',
        ],
        table: {
          headers: ['Aspek', 'Kalimat Deskriptif', 'Diagram Alir (Flowchart)', 'Pseudocode'],
          rows: [
            ['Kemudahan belajar', 'Paling mudah, memakai bahasa sehari-hari', 'Mudah, visual dan menarik', 'Sedang, perlu mengenal gaya penulisan kode'],
            ['Keterbacaan', 'Baik untuk langkah sederhana; panjang untuk algoritma rumit', 'Sangat baik; alur terlihat sekilas', 'Baik dan ringkas'],
            ['Ketepatan', 'Kurang baku; rawan tafsiran', 'Jelas; simbolnya bersifat baku', 'Mirip kode program; minim tafsiran'],
            ['Kegunaan', 'Penjelasan awal dan dokumentasi', 'Perencanaan alur dan diskusi tim', 'Perantara menuju kode program sungguhan'],
            ['Keterbatasan', 'Sulit untuk algoritma panjang', 'Memerluas ruang gambar; edit ulang merepotkan', 'Belum dapat dijalankan langsung oleh komputer'],
          ],
        },
        keyPoints: [
          'Pemilihan bentuk disesuaikan dengan kerumitan algoritma dan pembacanya.',
          'Urutan belajar yang umum: kalimat deskriptif → flowchart → pseudocode → bahasa pemrograman.',
        ],
        tip: 'Seorang programmer biasanya membuat flowchart atau pseudocode lebih dulu sebelum menulis kode. Kode yang langsung ditulis tanpa perencanaan algoritma sering berakhir berantakan dan penuh kesalahan.',
      },
      {
        id: 'kka-b1-f',
        letter: 'F',
        title: 'Penerapan Algoritma',
        subtitle: 'Algoritma dalam berbagai bidang kehidupan',
        content: [
          'Algoritma tidak hanya dipakai di dalam komputer; setiap bidang kehidupan menjalankan algoritma untuk berkerja secara tertib dan efisien. Di bidang transportasi, aplikasi pesan-antarmakan menjalankan algoritma pencarian driver terdekat, perhitungan ongkos, dan penentuan rute tercepat.',
          'Di bidang kesehatan, rumah sakit menjalankan algoritma pendaftaran dan triase pasien. Di bidang industri, robot perakitan mobil menjalankan urutan prosedur yang presisi berulang kali. Di bidang pertanian, penjadwalan panen dan penyiraman otomatis juga berbasis algoritma.',
        ],
        examples: [
          {
            title: 'Aplikasi Pesan-Makanan',
            desc: 'Algoritma: menerima pesanan → memeriksa ketersediaan menu → mencocokkan dengan penjual terdekat → menghitung ongkos kirim → mengirim notifikasi ke driver → memantau perjalanan sampai pesanan tiba.',
          },
          {
            title: 'Mesin Anjungan Tunai Mandiri (ATM)',
            desc: 'Algoritma: memeriksa kartu → meminta dan memverifikasi PIN → memeriksa saldo → memproses penarikan → menghitung uang → mencetak struk → mengeluarkan kartu.',
          },
          {
            title: 'Bel Sekolah Otomatis',
            desc: 'Algoritma: menyimpan jadwal pelajaran → membandingkan waktu sistem dengan jadwal → menyalakan bel saat waktunya tiba → menunggu jadwal berikutnya (perulangan).',
          },
        ],
        keyPoints: [
          'Transportasi online, kesehatan, industri, pertanian, dan pendidikan semuanya berjalan di atas algoritma.',
          'Algoritma membuat pekerjaan menjadi tertib, cepat, dan konsisten.',
        ],
      },
      {
        id: 'kka-b1-g',
        letter: 'G',
        title: 'Logika dan Struktur Algoritma dalam Pemrograman',
        subtitle: 'Urutan, percabangan, dan perulangan sebagai struktur kontrol dasar',
        content: [
          'Logika adalah cara berpikir yang runtut dan rasional untuk membedakan antara benar dan salah, ya dan tidak. Dalam algoritma, logika dituangkan dalam bentuk langkah-langkah yang tertib sehingga hasilnya dapat diprediksi.',
          'Saat aliterjemahkan algoritma ke dalam program komputer, langkah-langkahnya tersusun dalam tiga struktur kontrol dasar. Struktur urutan (sekuensial) menjalankan langkah atas-ke-bawah secara bergantian. Struktur percabangan (kondisi) menjalankan langkah tertentu hanya jika suatu syarat terpenuhi, misalnya "JIKA hujan MAKA bawa payung SELAINNYA tidak usah". Struktur perulangan (looping) mengulangi sebuah langkah berkali-kali sampai syarat berakhir, misalnya mengulangi langkah "jalan 10 langkah" sebanyak empat kali.',
          'Setiap program yang kamu temui, dari game sampai aplikasi belajar daring, sebagian besar dibangun dari kombinasi tiga struktur ini. Karena itu, memahami logika dan struktur algoritma berarti memahami dasar pemrograman.',
        ],
        keyPoints: [
          'Urutan (sekuensial): langkah dijalankan berurutan atas-ke-bawah.',
          'Percabangan (kondisi if-else): langkah dijalankan sesuai kondisi tertentu.',
          'Perulangan (looping): langkah diulang berkali-kali sampai syarat selesai.',
          'Logika algoritma menjadi "otak" program yang kamu tulis.',
        ],
        examples: [
          {
            title: 'Percabangan: Menentukan Kenaikan Kelas',
            desc: 'JIKA nilai_rata_rata >= 75 MAKA hasil = "NAIK KELAS" SELAINNYA hasil = "ULANG". Keputusan diambil berdasarkan perbandingan nilai dengan ambang ketuntasan.',
          },
          {
            title: 'Perulangan: Menghitung Total Belanja',
            desc: 'total = 0 → ULANGI untuk setiap barang dalam keranjang: total = total + harga_barang → tampilkan total. Langkah penjumlahan diulang otomatis untuk setiap barang.',
          },
        ],
        tip: 'Sebelum menulis kode program, cobalah tulis algoritmanya lebih dulu dalam bentuk pseudocode lengkap dengan percabangan dan perulangan. Kode akan jauh lebih mudah disusun jika rencananya sudah jelas.',
      },
      {
        id: 'kka-b1-h',
        letter: 'H',
        title: 'Penerapan Algoritma Dalam Kehidupan Sehari-hari',
        subtitle: 'Menyusun algoritma baru untuk kegiatan sehari-hari',
        content: [
          'Hampir setiap kegiatan rutin yang kamu lakukan mengikuti algoritma: bangun tidur dan bersiap sekolah, mengerjakan tugas secara berurutan, sampai membeli makanan di kantin. Kesadaran akan urutan langkah ini melatihmu berpikir sistematis.',
          'Kamu juga dapat menyusun algoritma baru untuk masalah baru. Langkah umumnya: (1) tentukan tujuan dan hasil yang diinginkan, (2) kumpulkan data atau bahan yang diperlukan, (3) pecah masalah besar menjadi langkah-langkah kecil, (4) susun langkah secara berurutan dan logis, (5) uji algoritma dan perbaiki bila ada langkah yang keliru.',
        ],
        keyPoints: [
          'Kegiatan rutin sehari-hari sebenarnya mengikuti algoritma tertentu.',
          'Langkah menyusun algoritma: tentukan tujuan → kumpulkan data → pecah masalah → susun langkah → uji dan perbaiki.',
          'Algoritma yang baik selalu diuji dan diperbaiki, bukan ditulis sempurna sejak awal.',
        ],
        examples: [
          {
            title: 'Berangkat Sekolah Tepat Waktu',
            desc: 'Tujuan: tiba di sekolah sebelum bel pertama. Algoritma: bangun 05.00 → cek jadwal hari ini → mandi dan berpakaian → sarapan → periksa kelengkapan tas (buku, alat tulis, kartu pelajar) → berangkat 06.30.',
          },
          {
            title: 'Mengerjakan Soal Ulangan Harian',
            desc: 'Algoritma: baca seluruh soal lebih dulu → kerjakan soal yang mudah → kembali ke soal sulit → periksa kembali jawaban sebelum mengumpulkan. Pemeriksaan akhir menjadi langkah wajib yang sering terlupakan.',
          },
        ],
      },
    ],
    rangkumanMateri: [
      'Algoritma adalah serangkaian langkah logis dan berurutan untuk menyelesaikan masalah; istilahnya berasal dari nama ilmuwan Al-Khawarizmi.',
      'Algoritma yang baik bersifat: urut, jelas, spesifik, memiliki masukan-keluaran, berhenti, dan efektif.',
      'Komponen utama algoritma adalah masukan (input), proses, dan keluaran (output).',
      'Algoritma dapat disajikan dalam tiga bentuk representasi: kalimat deskriptif, diagram alir (flowchart), dan pseudocode.',
      'Kalimat deskriptif paling mudah dipelajari, flowchart paling visual, dan pseudocode paling dekat dengan kode program.',
      'Dalam pemrograman, logika algoritma diwujudkan dalam tiga struktur kontrol dasar: urutan, percabangan, dan perulangan.',
      'Algoritma hadir di semua kegiatan sehari-hari; keterampilan menyusun algoritma adalah fondasi berpikir komputasional dan pemrograman.',
    ],
    refleksiDiri: [
      { id: 'kka-b1-r1', statement: 'Saya dapat menjelaskan pengertian algoritma dengan bahasa saya sendiri.' },
      { id: 'kka-b1-r2', statement: 'Saya mengenal ciri-ciri algoritma yang baik dan dapat menilai sebuah urutan langkah.' },
      { id: 'kka-b1-r3', statement: 'Saya memahami komponen masukan, proses, dan keluaran pada sebuah algoritma.' },
      { id: 'kka-b1-r4', statement: 'Saya mampu menulis algoritma sederhana dalam bentuk kalimat deskriptif.' },
      { id: 'kka-b1-r5', statement: 'Saya mengenal simbol-simbol dasar diagram alir (flowchart).' },
      { id: 'kka-b1-r6', statement: 'Saya memahami hubungan algoritma dengan struktur program: urutan, percabangan, dan perulangan.' },
    ],
  },

  // ===========================================================================
  // BAB 2: PEMROGRAMAN
  // ===========================================================================
  {
    id: 'kka-bab2',
    babNumber: 2,
    title: 'Pemrograman',
    subtitle: 'Konsep Dasar Pemrograman, Blockly, Scratch, dan Pengenalan Python',
    semester: 1,
    badge: 'BAB 2 • PEMROGRAMAN',
    filterLabel: 'BAB 2: PEMROGRAMAN',
    filterAbbrev: 'PRG',
    themeColor: {
      primary: '#2e59e6',
      border: 'border-blue-600',
      bgBadge: 'bg-blue-100',
      textBadge: 'text-blue-900',
    },
    tujuanPembelajaran: [
      'Memahami pengertian pemrograman serta peran programmer dan bahasa pemrograman.',
      'Mengenal jenis-jenis bahasa pemrograman beserta kegunaannya masing-masing.',
      'Memahami konsep dasar pemrograman: variabel, tipe data, operator, dan instruksi.',
      'Membedakan tiga struktur kontrol dasar program: urutan, percabangan, dan perulangan.',
      'Mampu menyusun instruksi sederhana menggunakan blok perintah pada Blockly.',
      'Mampu membuat program visual sederhana menggunakan Scratch.',
      'Mengenal sintaks dasar Python: perintah tampil, variabel, percabangan, dan perulangan.',
      'Menyadari penerapan pemrograman dalam kehidupan sehari-hari beserta peluang belajar lebih lanjut.',
    ],
    petaKonsep: {
      description:
        'Struktur keterkaitan konsep Pemrograman: dari pengertian dan jenis bahasa, menuju konsep inti dan struktur kontrol, dilengkapi alat praktik dari blok sampai bahasa teks.',
      nodes: [
        {
          category: 'Dasar Pemrograman',
          items: ['Pengertian Pemrograman & Program', 'Jenis Bahasa Pemrograman'],
        },
        {
          category: 'Konsep Inti',
          items: ['Variabel', 'Tipe Data', 'Operator', 'Instruksi'],
        },
        {
          category: 'Struktur Kontrol',
          items: ['Urutan (Sekuensial)', 'Percabangan (If-Else)', 'Perulangan (Looping)'],
        },
        {
          category: 'Alat Praktik',
          items: ['Blockly (Blok Perintah)', 'Scratch (Pemrograman Visual)', 'Python (Bahasa Teks)'],
        },
      ],
    },
    apersepsi: {
      story: [
        'Setiap kali kamu membuka game favorit, karakter di layar bergerak tepat saat kamu menekan tombol, musik berbunyi, dan skor bertambah. Di balik semuanya itu ada jutaan instruksi kecil yang disusun orang dan dijalankan komputer secara urut serta sangat cepat. Menyusun instruksi seperti itulah yang disebut pemrograman.',
        'Di bab ini kamu akan belajar pemrograman dari nol. Kita mulai dari pengertian dan jenis bahasa pemrograman, masuk ke konsep dasar seperti variabel dan tipe data, memahami struktur kontrol program, lalu praktik langsung dengan Blockly dan Scratch, serta mengenal Python sebagai bahasa teks yang banyak dipakai di dunia data dan kecerdasan artifisial.',
      ],
      questions: [
        'Menurutmu, siapa yang "memberi perintah" kepada komputer atau ponsel pintar sehingga aplikasi di dalamnya bisa berfungsi?',
        'Apa perbedaan bahasa Indonesia yang kamu gunakan sehari-hari dengan bahasa yang dimengerti oleh komputer?',
        'Program sederhana apa yang ingin kamu buat jika kamu bisa membuat aplikasi apa pun di komputer?',
      ],
    },
    materiPokok: [
      {
        id: 'kka-b2-a',
        letter: 'A',
        title: 'Pengertian Pemrograman',
        subtitle: 'Kegiatan menyusun instruksi untuk komputer',
        content: [
          'Pemrograman adalah kegiatan menyusun serangkaian instruksi atau perintah secara runtut dan logis menggunakan bahasa tertentu, agar komputer dapat menjalankan tugas yang diinginkan penggunanya. Instruksi yang telah disusun rapi dan tersimpan dalam berkas disebut program.',
          'Orang yang bekerja menyusun instruksi tersebut disebut programmer. Media yang digunakan untuk menulis instruksi disebut bahasa pemrograman, misalnya Python, JavaScript, PHP, Java, dan C++. Komputer hanya memahami bahasa mesin (angka 0 dan 1), sehingga instruksi dalam bahasa tinggi harus diterjemahkan lebih dulu oleh sistem sebelum dijalankan.',
          'Hubungannya dengan materi sebelumnya: algoritma adalah rancangan langkah (rencana), sedangkan pemrograman adalah kegiatan menerjemahkan algoritma tersebut ke dalam bahasa yang dimengerti komputer. Programmer yang baik menyusun algoritma lebih dulu, baru menulis programnya.',
        ],
        keyPoints: [
          'Pemrograman = menyusun instruksi runtut dan logis untuk komputer.',
          'Hasil kegiatan pemrograman disebut program; pelakunya disebut programmer.',
          'Media penulisan instruksi disebut bahasa pemrograman.',
          'Algoritma adalah rencana; pemrograman adalah penerjemahannya ke dalam kode program.',
        ],
        tip: 'Belajar pemrograman pada dasarnya melatih cara berpikir logis, bukan sekadar menghafal sintaks perintah. Karena itu kuasailah algoritma terlebih dahulu, maka menulis kode akan terasa jauh lebih mudah.',
      },
      {
        id: 'kka-b2-b',
        letter: 'B',
        title: 'Jenis-Jenis Bahasa Pemrograman',
        subtitle: 'Bahasa mesin, bahasa assembly, dan bahasa tinggi',
        content: [
          'Bahasa pemrograman dapat dikelompokkan berdasarkan beberapa kriteria. Berdasarkan tingkat kedekatan dengan bahasa mesin, terdapat bahasa mesin (bahasa biner 0 dan 1 yang hanya dimengerti prosesor), bahasa assembly (menggunakan simbol singkat, masih rumit bagi manusia), dan bahasa tinggi (mirip bahasa manusia, misalnya Python, JavaScript, Java, dan C++).',
          'Berdasarkan cara kerjanya, bahasa dibagi menjadi bahasa yang dikompilasi (seluruh program diterjemahkan sekaligus oleh kompilator sebelum dijalankan, misalnya C++ dan Java) dan bahasa yang diinterpretasi (program diterjemahkan baris demi baris saat dijalankan, misalnya Python dan JavaScript).',
          'Berdasarkan kegunaannya, bahasa pemrograman dipilih sesuai bidang: pengembangan web (HTML, CSS, JavaScript, PHP), perangkat bergerak (Kotlin untuk Android dan Swift untuk iOS), data dan kecerdasan artifisial (Python dan R), serta pengembangan game (C# dan C++).',
        ],
        table: {
          headers: ['Kategori', 'Contoh Bahasa', 'Kegunaan Utama'],
          rows: [
            ['Web (Front-end & Back-end)', 'HTML, CSS, JavaScript, PHP', 'Situs web dan layanan daring'],
            ['Perangkat Bergerak (Mobile)', 'Kotlin, Swift', 'Aplikasi Android dan iOS'],
            ['Data & Kecerdasan Artifisial', 'Python, R', 'Analisis data, machine learning, kecerdasan artifisial'],
            ['Pengembangan Game', 'C#, C++', 'Game 2D dan 3D'],
            ['Sistem & Perangkat Tertanam', 'C, C++', 'Sistem operasi dan perangkat elektronik'],
          ],
        },
        keyPoints: [
          'Tiga level bahasa: bahasa mesin, bahasa assembly, dan bahasa tinggi.',
          'Dua cara kerja: dikompilasi (serentak) dan diinterpretasi (baris demi baris).',
          'Pemilihan bahasa disesuaikan dengan bidang pekerjaan.',
        ],
        tip: 'Untuk pemula di era kecerdasan artifisial, Python sering dijadikan pilihan pertama karena sintaksnya ringkas dan pustakanya kaya untuk data serta kecerdasan artifisial.',
      },
      {
        id: 'kka-b2-c',
        letter: 'C',
        title: 'Konsep Dasar: Variabel, Tipe Data, dan Operator',
        subtitle: 'Bahan penyusun setiap program',
        content: [
          'Variabel adalah wadah bernama untuk menyimpan data yang nilainya dapat berubah selama program berjalan. Contohnya, variabel bernama "nilai" dapat menyimpan angka 78 pada awal ulangan dan berubah menjadi 85 setelah nilai baru diperbarui. Pemberian nama variabel punya aturan: diawali huruf, tanpa spasi, dan tidak boleh sama dengan kata kunci bahasa.',
          'Tipe data menentukan jenis data yang disimpan dalam variabel. Tipe yang umum dipakai: bilangan bulat (integer, misalnya 75), bilangan pecahan (float, misalnya 88,5), teks atau karakter (string, misalnya "Budi"), dan logika atau nilai kebenaran (boolean, berisi true atau false).',
          'Operator adalah simbol yang memberi tahu program operasi apa yang harus dilakukan. Operator aritmatika (+, -, x, /, %) untuk menghitung, operator perbandingan (>, <, >=, <=, ==, !=) untuk membandingkan dua nilai, dan operator logika (DAN, ATAU, TIDAK) untuk menggabungkan beberapa syarat.',
          'Instruksi adalah perintah yang dijalankan program, misalnya perintah menampilkan keluaran, menerima masukan, percabangan, dan perulangan. Gabungan variabel, tipe data, operator, dan instruksi inilah yang menyusun sebuah program.',
        ],
        keyPoints: [
          'Variabel: wadah bernama berisi data yang dapat berubah.',
          'Tipe data umum: integer (bulat), float (pecahan), string (teks), boolean (true/false).',
          'Operator: aritmatika (menghitung), perbandingan (membandingkan), logika (menggabungkan syarat).',
          'Instruksi: perintah yang dijalankan program, dari masukan-keluaran sampai percabangan.',
        ],
        examples: [
          {
            title: 'Variabel dalam Program',
            desc: 'nama = "Sinta" → menyimpan teks. nilai = 90 → menyimpan bilangan bulat. lulus = nilai >= 75 → menyimpan nilai logika true.',
          },
          {
            title: 'Operator dalam Kehidupan Nyata',
            desc: 'Perbandingan: "apakah nilai >= 75?" Aritmatika: "total = harga x jumlah". Logika: "boleh masuk lab JIKA membawa kartu DAN sudah mencuci tangan".',
          },
        ],
        tip: 'Berpikirlah variabel seperti kotak berlabel: labelnya bernama, isinya sebuah nilai, dan isinya boleh berganti. Menamai variabel dengan jelas membuat program mudah dipahami orang lain.',
      },
      {
        id: 'kka-b2-d',
        letter: 'D',
        title: 'Struktur Kontrol Program: Urutan, Percabangan, dan Perulangan',
        subtitle: 'Tiga struktur dasar yang membangun hampir semua program',
        content: [
          'Struktur urutan (sekuensial) menjalankan instruksi dari atas ke bawah secara bergantian tanpa loncat. Ini adalah struktur paling dasar: nilai awal diisi, perhitungan dijalankan, hasil ditampilkan.',
          'Struktur percabangan menjalankan instruksi tertentu hanya jika suatu kondisi terpenuhi. Bentuk umumnya if-else: "JIKA syarat MAKA jalankan A SELAINNYA jalankan B". Percabangan membuat program mampu mengambil keputusan, seperti menentukan "tuntas" atau "remedial" berdasarkan nilai.',
          'Struktur perulangan mengulangi instruksi berkali-kali sampai syarat berakhir. Bentuk umumnya perulangan dengan penghitung (for) dan perulangan bersyarat (while). Perulangan menghemat waktu dan mencegah penulisan kode yang berulang-ulang secara manual.',
        ],
        keyPoints: [
          'Urutan: instruksi dijalankan atas-ke-bawah secara bergantian.',
          'Percabangan (if-else): program mengambil keputusan sesuai kondisi.',
          'Perulangan (for/while): instruksi diulang sampai syarat selesai.',
        ],
        examples: [
          {
            title: 'Urutan: Menghitung Keliling Persegi Panjang',
            desc: '1. Baca panjang dan lebar. 2. Hitung keliling = 2 x (panjang + lebar). 3. Tampilkan keliling. Instruksi dijalankan berurutan tanpa percabangan.',
          },
          {
            title: 'Percabangan: Menentukan Predikat Kelulusan',
            desc: 'JIKA nilai_akhir >= 90 MAKA predikat = "A" SELAIN JIKA >= 80 MAKA predikat = "B" SELAIN JIKA >= 70 MAKA predikat = "C" SELAINNYA predikat = "D".',
          },
          {
            title: 'Perulangan: Menghitung Total Nilai Sekelas',
            desc: 'total = 0 → ULANGI untuk setiap siswa: total = total + nilai_siswa → tampilkan total. Satu langkah penjumlahan cukup ditulis sekali meski diulang untuk puluhan siswa.',
          },
        ],
        tip: 'Hampir 90 persen program yang kamu temui dibangun dari tiga struktur ini saja. Kuasai ketiganya dengan algoritma sederhana sebelum melangkah ke bahasa yang lebih rumit.',
      },
      {
        id: 'kka-b2-e',
        letter: 'E',
        title: 'Pemrograman Blok dengan Blockly',
        subtitle: 'Belajar logika program tanpa perlu menghafal sintaks',
        content: [
          'Blockly adalah bahasa pemrograman berbasis blok (block-based) yang dikembangkan oleh Google. Instruksi-program berupa balok warna-warni yang disusun dengan teknik seret-lepas (drag and drop); balok yang saling cocok akan menempel seperti puzzle, dan balok yang tidak cocok tidak dapat disambungkan.',
          'Blok-blok dalam Blockly dikelompokkan menurut fungsi: balok pemicu (event) untuk memulai program, balok gerak, balok kendali (percabangan dan perulangan), balok logika dan matematika, balok variabel, serta balok data. Siswa cukup menyusun logika program tanpa perlu menghafal sintaks atau memikirkan kesalahan penulisan.',
          'Karena pendekatannya yang ramah pemula, Blockly menjadi gerbang belajar pemrograman yang sangat efektif: fokus siswa tertuju pada alur logika dan algoritma, bukan pada teknis penulisan kode.',
        ],
        keyPoints: [
          'Blockly: pemrograman berbasis blok seret-lepas dari Google.',
          'Blok dikelompokkan: pemicu, gerak, kendali, logika, variabel, dan data.',
          'Cocok untuk pemula: tanpa menghafal sintaks, tanpa takut salah ketik.',
        ],
        examples: [
          {
            title: 'Contoh Alur: Robot Melewati Labirin',
            desc: 'Blok pemicu "saat tombol mulai diklik" → blok kendali "ulangi 4 kali" → dalamnya blok gerak "jalan 1 langkah". Tambahkan percabangan "jika di depan tembok, berbalik" agar robot tidak menabrak.',
          },
        ],
        tip: 'Ingin langsung mempraktikkan Blockly dan Scratch? Buka Studio Koding pada materi Informatika Kelas 8 melalui tombol "Buka Studio Koding" di halaman ini.',
        actionButton: {
          label: 'Buka Studio Koding (Blockly & Scratch)',
        },
      },
      {
        id: 'kka-b2-f',
        letter: 'F',
        title: 'Pemrograman Visual dengan Scratch',
        subtitle: 'Membuat program interaktif dengan balok warna-warni',
        content: [
          'Scratch adalah bahasa pemrograman visual yang dikembangkan oleh Massachusetts Institute of Technology (MIT). Program disusun dari balok-balok perintah berwarna yang dipasang pada sprite (tokoh) di atas panggung (stage) dengan latar belakang (backdrop) pilihan kita.',
          'Komponen utama Scratch: panggung (tampilan hasil program), sprite (tokoh yang bergerak atau berbicara), balok perintah yang dikelompokkan berdasarkan fungsi (event, tampilan, suara, gerak, kendali, sensor, operator, variabel), serta kostum dan latar belakang untuk mempercantik tampilan.',
          'Proyek sederhana yang umum dibuat pemula: kucing menari, mewarnai latar sesuai musim, kuis penjumlahan, atau permainan kejar-kejaran sederhana. Hasil karya Scratch dapat dibagikan ke komunitas Scratch sehingga teman-teman lain bisa memainkannya.',
        ],
        keyPoints: [
          'Scratch: pemrograman visual dari MIT dengan balok warna-warni.',
          'Komponen: panggung, sprite, balok perintah, kostum, dan latar belakang.',
          'Cocok untuk membuat game sederhana, animasi, dan kuis interaktif.',
        ],
        examples: [
          {
            title: 'Proyek: Kucing Menari',
            desc: 'Blok event "saat bendera hijau diklik" → blok kendali "ulangi 10 kali" → balok gerak "jalan 10 langkah", balok tampilan "ganti kostum berikutnya", blok kendali "tunggu 0,2 detik". Hasilnya: kucing bergeser sambil berganti-ganti kostum.',
          },
        ],
        tip: 'Punya proyek Scratch lama? Berkarya Scratch dapat dilanjutkan di Studio Koding kami (kompatibel Scratch dan PenguinMod) melalui tombol "Buka Studio Koding".',
        actionButton: {
          label: 'Buka Studio Koding (Blockly & Scratch)',
        },
      },
      {
        id: 'kka-b2-g',
        letter: 'G',
        title: 'Mengenal Python sebagai Bahasa Pemrograman Teks',
        subtitle: 'Langkah berikutnya setelah blok: sintaks yang bersih dan ringkas',
        content: [
          'Python adalah bahasa pemrograman teks yang dirilis pada tahun 1991 oleh Guido van Rossum. Python terkenal karena sintaksnya yang pendek, rapi, dan mudah dibaca, mirip dengan kalimat bahasa Inggris sederhana, sehingga menjadi salah satu bahasa pertama yang direkomendasikan untuk pemula.',
          'Contoh perintah dasar Python: perintah print("Halo, Informatika!") untuk menampilkan teks, penulisan variabel sederhana seperti umur = 13, percabangan if umur >= 13: untuk memeriksa syarat, serta perulangan for i in range(10): untuk mengulangi pekerjaan. Perhatikan bahwa Python memakai tanda titik dua (:) dan indentasi (pergeseran spasi) untuk menandai blok perintah.',
          'Python banyak dipakai dalam dunia data dan kecerdasan artifisial karena pustakanya yang lengkap dan komunitasnya yang besar. Kemampuan Python akan menjadi modal berharga bila kamu ingin mendalami bidang analisis data maupun kecerdasan artifisial di bab berikutnya.',
        ],
        keyPoints: [
          'Python: bahasa teks yang ringkas, rapi, dan mudah dibaca.',
          'Contoh sintaks dasar: print, variabel, if dengan titik dua, dan for dengan indentasi.',
          'Python sangat populer untuk data dan kecerdasan artifisial.',
        ],
        examples: [
          {
            title: 'Program Sederhana di Python',
            desc: 'print("Halo, Informatika!") → menampilkan teks. umur = 13 → if umur >= 13: print("Boleh masuk lab") → for i in range(3): print(i) → menampilkan angka 0, 1, 2.',
          },
        ],
        tip: 'Python adalah pilihan yang tepat untuk dilanjutkan setelah Blockly dan Scratch karena sintaksnya yang bersih. Bila tertarik, mulailah dari program kecil: kalkulator sederhana, kuis tebak angka, atau penghitung rata-rata nilai.',
      },
      {
        id: 'kka-b2-h',
        letter: 'H',
        title: 'Penerapan Pemrograman dalam Kehidupan Sehari-hari',
        subtitle: 'Di mana saja program bekerja dan bagaimana mulai belajar',
        content: [
          'Hampir semua perangkat yang kamu gunakan setiap hari berisi program: ponsel pintar, ATM, aplikasi pembayaran digital, GPS navigasi, jam pintar, televisi pintar, sampai permainan daring. Bahkan lift dan mesin cuci modern pun dijalankan oleh program kecil di dalam mikroprosesor.',
          'Di berbagai bidang, pemrograman menjadi tulang punggung layanan: rekam medis dan alat kesehatan di bidang kesehatan, sistem pembelajaran daring di bidang pendidikan, aplikasi pesan-antara dan ojek daring di bidang transportasi, serta sensor irigasi otomatis di bidang pertanian.',
          'Peluang karier yang terkait pemrograman sangat luas: programmer situs web, pengembang game, analis data, insinyur robotika, sampai pengembang kecerdasan artifisial. Kuncinya sama: kuasai logika dan algoritma, praktik secara rutin, dan selesaikan proyek nyata.',
        ],
        keyPoints: [
          'Pemrograman ada di hampir semua perangkat elektronik sehari-hari.',
          'Bidang kesehatan, pendidikan, transportasi, dan pertanian semuanya bergantung pada program.',
          'Peluang karier: web developer, game developer, data analyst, roboticist, dan AI engineer.',
        ],
        examples: [
          {
            title: 'Di Balik Layar Aplikasi Pesan-Antara',
            desc: 'Program di aplikasi memvalidasi pemesanan, memanggil API pembayaran, menghitung rute pengemudi, mengirim notifikasi, sampai merekam riwayat perjalanan. Ratusan bagian program bekerja bersama setiap kali kamu memesan perjalanan.',
          },
        ],
        tip: 'Langkah belajar terbaik: selesaikan satu proyek kecil sampai tuntas, lalu tambah fitur baru. Satu proyek selesai lebih berharga daripada banyak tutorial yang dibuka tapi tidak pernah selesai.',
      },
    ],
    rangkumanMateri: [
      'Pemrograman adalah kegiatan menyusun instruksi runtut dan logis untuk komputer; hasilnya disebut program dan pelakunya disebut programmer.',
      'Algoritma adalah rancangan langkah; pemrograman adalah penerjemahan algoritma ke dalam bahasa komputer.',
      'Bahasa pemrograman terdiri dari bahasa mesin, bahasa assembly, dan bahasa tinggi; cara kerjanya dikompilasi atau diinterpretasi.',
      'Konsep dasar pemrograman: variabel (wadah bernama), tipe data (integer, float, string, boolean), operator, dan instruksi.',
      'Struktur kontrol dasar program: urutan, percabangan (if-else), dan perulangan (for/while).',
      'Blockly dan Scratch adalah pemrograman blok/visual yang cocok untuk pemula; Python adalah bahasa teks populer untuk data dan kecerdasan artifisial.',
      'Pemrograman hadir di hampir semua perangkat dan bidang pekerjaan sehari-hari; kuncinya adalah logika, algoritma, dan latihan rutin.',
    ],
    refleksiDiri: [
      { id: 'kka-b2-r1', statement: 'Saya dapat menjelaskan pengertian pemrograman serta perbedaannya dengan algoritma.' },
      { id: 'kka-b2-r2', statement: 'Saya mengenal beberapa jenis bahasa pemrograman dan kegunaannya.' },
      { id: 'kka-b2-r3', statement: 'Saya memahami konsep variabel, tipe data, dan operator dasar.' },
      { id: 'kka-b2-r4', statement: 'Saya dapat membedakan struktur urutan, percabangan, dan perulangan.' },
      { id: 'kka-b2-r5', statement: 'Saya mampu menyusun instruksi sederhana dengan blok perintah (Blockly/Scratch).' },
      { id: 'kka-b2-r6', statement: 'Saya mengenal sintaks dasar Python: print, variabel, if, dan for.' },
    ],
  },

  // ===========================================================================
  // BAB 3: PENGENALAN PERANGKAT KECERDASAN ARTIFISIAL SEDERHANA
  // ===========================================================================
  {
    id: 'kka-bab3',
    babNumber: 3,
    title: 'Pengenalan Perangkat KA Sederhana',
    subtitle: 'Makna dan Esensi KA, Data dan Informasi, serta Cara Kerja Perangkat KA Sederhana',
    semester: 1,
    badge: 'BAB 3 • KECERDASAN ARTIFISIAL',
    filterLabel: 'BAB 3: PERANGKAT KA SEDERHANA',
    filterAbbrev: 'KA',
    themeColor: {
      primary: '#7c3aed',
      border: 'border-violet-600',
      bgBadge: 'bg-violet-100',
      textBadge: 'text-violet-900',
    },
    tujuanPembelajaran: [
      'Memahami makna dan esensi kecerdasan artifisial (KA) serta cara kerjanya yang meniru sebagian kegiatan manusia.',
      'Membedakan data dan informasi serta memahami peran keduanya bagi sistem kecerdasan artifisial.',
      'Mengenali contoh penerapan kecerdasan artifisial dalam kehidupan sehari-hari.',
      'Mengidentifikasi komponen dasar penyusun sistem kecerdasan artifisial sederhana.',
      'Memahami prinsip kerja sistem KA sederhana secara runtut: data, pola, keputusan, aksi, dan umpan balik.',
      'Menjelaskan hubungan algoritma dengan kecerdasan artifisial.',
      'Mengenali ciri-ciri perangkat kecerdasan artifisial sederhana di sekitar kita beserta keterbatasannya.',
    ],
    petaKonsep: {
      description:
        'Struktur keterkaitan konsep Perangkat KA Sederhana: dari makna dan data, menuju penerapan sehari-hari, komponen dan prinsip kerja, sampai kaitannya dengan algoritma.',
      nodes: [
        {
          category: 'Fondasi KA',
          items: ['Makna & Esensi Kecerdasan Buatan', 'Data & Informasi'],
        },
        {
          category: 'Penerapan Sehari-hari',
          items: ['Asisten Suara', 'Rekomendasi Konten', 'Kamera Pintar', 'Penerjemah Otomatis'],
        },
        {
          category: 'Sistem KA Sederhana',
          items: ['Komponen Dasar', 'Prinsip Kerja'],
        },
        {
          category: 'Kaitan Konsep',
          items: ['Algoritma sebagai Otak KA', 'Ciri & Keterbatasan Perangkat KA'],
        },
      ],
    },
    apersepsi: {
      story: [
        'Pada suatu sore, Andi pulang ke rumah dan mengucapkan, "Halo Asisten, nyalakan lampu." Lampu di ruang tamu pun menyala. Tidak ada orang yang menekan saklar; sebuah perangkat seolah "mendengar", "memahami", lalu "bertindak".',
        'Perangkat itu sebenarnya tidak memiliki akal seperti manusia. Ia hanya menjalankan data, algoritma, dan aturan yang diprogram orang lain dengan sangat cepat dan konsisten. Keypadatan kemampuannya itulah yang tampak seperti kecerdasan. Di bab ini kamu akan mempelajari kecerdasan artifisial dari sisi yang paling mendasar: maknanya, data yang menjadi "makanannya", komponen penyusunnya, cara kerjanya, sampai ciri-ciri perangkat KA sederhana yang ada di sekitarmu.',
      ],
      questions: [
        'Fitur kecerdasan buatan apa yang pernah kamu gunakan hari ini, misalnya kamera ponsel, rekomendasi video, penerjemah, atau asisten suara?',
        'Menurutmu, apa bedanya mesin yang menjalankan perintah dengan mesin yang tampak cerdas?',
        'Jika kamu bisa membuat satu perangkat pintar untuk membantu keluargamu, perangkat apa yang ingin kamu buat dan bagaimana cara kerjanya?',
      ],
    },
    materiPokok: [
      {
        id: 'kka-b3-a',
        letter: 'A',
        title: 'Makna dan Esensi Kecerdasan Buatan',
        subtitle: 'Apa sebenarnya KA dan bagaimana ia "meniru" manusia',
        content: [
          'Kecerdasan artifisial (KA), yang dalam bahasa Inggris dikenal sebagai artificial intelligence (AI), adalah cabang ilmu komputer yang membuat sistem komputer mampu melakukan tugas-tugas yang biasanya membutuhkan kecerdasan manusia. Tugas tersebut antara lain melihat dan mengenali gambar, mendengar serta memahami bahasa, belajar dari data, mengambil keputusan, dan memecahkan masalah.',
          'Esensi KA terletak pada kata "meniru": sistem komputer meniru sebagian kemampuan manusia secara sistematis berdasarkan data dan algoritma. Komputer tidak memiliki perasaan, niat, maupun kesadaran; ia hanya memproses data dengan aturan yang sangat canggih dan berjalan jauh lebih cepat daripada manusia.',
          'Dalam perkembangannya dikenal pula istilah pembelajaran mesin (machine learning), yaitu cara mesin belajar mengenali pola dari data tanpa diprogram langkah demi langkah secara manual. Istilah ini akan sering kamu temui ketika mendalami KA lebih jauh.',
        ],
        keyPoints: [
          'KA: sistem komputer yang mampu melakukan tugas yang biasanya membutuhkan kecerdasan manusia.',
          'Esensinya: meniru sebagian kemampuan manusia berdasarkan data dan algoritma.',
          'KA tidak memiliki kesadaran, perasaan, atau niat seperti manusia.',
          'Machine learning: cara mesin belajar mengenali pola dari data.',
        ],
        tip: 'Kata kunci saat berdiskusi tentang KA: "meniru", "berbasis data", dan "melakukan tugas yang biasa dilakukan manusia". Hindari anggapan bahwa KA "berpikir" atau "merasa" seperti manusia.',
      },
      {
        id: 'kka-b3-b',
        letter: 'B',
        title: 'Data dan Informasi',
        subtitle: 'Bahan mentah dan hasil olahan yang menjadi makanan KA',
        content: [
          'Data adalah fakta mentah berupa angka, huruf, gambar, suara, atau simbol yang belum memiliki makna. Informasi adalah data yang telah diolah sehingga bermakna dan dapat digunakan untuk mengambil keputusan. Contoh sederhana: kumpulan angka 78, 85, dan 90 adalah data; setelah dijumlahkan dan dibagi tiga, diperoleh informasi bahwa rata-rata nilai siswa tersebut adalah 84.',
          'Bagi sistem KA, data berperan sebagai "makanan". Semakin banyak dan semakin berkualitas data yang diberikan, semakin baik kemampuan sistem dalam mengenali pola dan membuat prediksi. Sebaliknya, data yang sedikit, kotor, atau bias (berat sebelah) akan menghasilkan sistem yang belajar secara keliru.',
          'Karena itu, menjaga kualitas dan kejujuran data menjadi bagian penting dari ilmu kecerdasan artifisial. Data yang menyesatkan akan melahirkan kesimpulan yang menyesatkan pula.',
        ],
        table: {
          headers: ['Data (Mentah)', 'Proses Pengolahan', 'Informasi (Bermakna)'],
          rows: [
            ['78, 85, 90 (nilai ulangan)', 'Dijumlahkan lalu dibagi 3', 'Rata-rata nilai 84 (tergolong tinggi)'],
            ['25 derajat celcius (suhu tubuh)', 'Dibandingkan dengan ambang normal', 'Suhu tubuh dalam keadaan normal'],
            ['Foto wajah pengguna ponsel', 'Dicocokkan dengan data wajah tersimpan', 'Pengguna terdaftar = pemilik ponsel'],
          ],
        },
        keyPoints: [
          'Data: fakta mentah yang belum bermakna.',
          'Informasi: data yang telah diolah sehingga bermakna dan berguna untuk mengambil keputusan.',
          'Bagi KA, data adalah "makanan": semakin berkualitas data, semakin baik hasil belajar sistem.',
        ],
        tip: 'Ingat selalu: data belum tentu informasi. Data baru menjadi informasi setelah diolah dengan cara yang tepat.',
      },
      {
        id: 'kka-b3-c',
        letter: 'C',
        title: 'Kecerdasan Buatan dalam Kehidupan Sehari-hari',
        subtitle: 'KA yang kamu gunakan setiap hari tanpa menyadarinya',
        content: [
          'Kecerdasan artifisial tidak hanya ada di laboratorium; ia telah menyatu dalam kegiatan sehari-hari. Asisten suara di ponsel mengenali ucapanmu dan mengubahnya menjadi perintah. Sistem rekomendasi di aplikasi video dan musik menganalisis riwayat tontonan untuk menebak selera kamu berikutnya.',
          'Fitur kunci mengunci wajah (face unlock) dan filter kamera mengenali ciri-ciri wajahmu. Layanan penerjemah otomatis menerjemahkan teks dan suara antar bahasa dalam hitungan detik. Layanan pelanggan banyak memakai chatbot untuk menjawab pertanyaan dasar. Aplikasi navigasi memprediksi waktu tiba dan menghindari kemacetan dengan menganalisis data lalu lintas.',
          'Email juga dilindungi penyaring spam yang belajar mengenali ciri-ciri pesan berbahaya. Semua contoh ini berjalan di atas prinsip yang sama: mengolah data untuk menghasilkan hasil yang berguna bagi manusia.',
        ],
        keyPoints: [
          'Asisten suara, rekomendasi konten, face unlock, penerjemah, chatbot, navigasi, dan penyaring spam adalah contoh KA sehari-hari.',
          'KA bekerja dengan mengolah data untuk menghasilkan hasil yang berguna.',
        ],
        examples: [
          {
            title: 'Rekomendasi Video',
            desc: 'Sistem mencatat video yang kamu tonton sampai selesai, lalu membandingkan polamu dengan jutaan pengguna lain untuk menebak video apa yang mungkin kamu sukai berikutnya.',
          },
          {
            title: 'Penerjemah Otomatis',
            desc: 'Sistem mengenali pola bahasa dari jutaan contoh teks terjemahan yang pernah dipelajari, lalu menerapkan pola tersebut untuk menerjemahkan kalimat baru.',
          },
          {
            title: 'Fitur Face Unlock',
            desc: 'Kamera mengambil gambar wajah, sistem mengekstrak ciri-ciri wajah menjadi data angka, lalu membandingkan dengan data wajah pemilik yang tersimpan. Cocok berarti ponsel terbuka.',
          },
        ],
      },
      {
        id: 'kka-b3-d',
        letter: 'D',
        title: 'Komponen Dasar dalam Sistem Kecerdasan Buatan Sederhana',
        subtitle: 'Penyusun sebuah sistem KA, dari masukan sampai umpan balik',
        content: [
          'Sistem kecerdasan artifisial sederhana tersusun dari sejumlah komponen yang saling bekerja sama, mirip dengan cara kerja manusia: indra untuk menerima masukan, otak untuk memproses, dan anggota badan untuk menghasilkan keluaran.',
          'Memahami komponen ini membuat kita menyadari bahwa "keajaiban" KA sesungguhnya adalah kerja sama yang teratur antar komponen: data masuk, disimpan, diolah dengan aturan dan model, menghasilkan keputusan, lalu hasilnya dievaluasi untuk perbaikan.',
        ],
        table: {
          headers: ['Komponen', 'Fungsi', 'Contoh Nyata'],
          rows: [
            ['Masukan (Input)', 'Menangkap data dari lingkungan atau pengguna', 'Mikrofon (suara), kamera (gambar), sensor suhu, ketikan pengguna'],
            ['Penyimpanan Data', 'Menyimpan data dan basis pengetahuan', 'Memori perangkat, kartu penyimpanan, penyimpanan awan'],
            ['Proses (Pemrosesan)', 'Menjalankan algoritma dan aturan', 'Prosesor komputer dan chip perangkat pintar'],
            ['Model & Basis Pengetahuan', 'Kumpulan aturan dan pola hasil pembelajaran', 'Model pengenalan wajah, kamus aturan tata bahasa'],
            ['Keluaran (Output)', 'Menyampaikan hasil kepada pengguna', 'Layar, suara, lampu, gerakan motor perangkat'],
            ['Umpan Balik (Feedback)', 'Menilai hasil dan memperbaiki kinerja', 'Tingkat akurasi pengenalan, koreksi kesalahan sistem'],
          ],
        },
        keyPoints: [
          'Sistem KA sederhana = masukan + penyimpanan + proses + model + keluaran, dilengkapi umpan balik.',
          'Komponennya meniru cara kerja manusia: indra, otak, dan anggota badan.',
        ],
        tip: 'Analogi manusia membantu mengingat komponen KA: sensor adalah indra, prosesor dan model adalah otak, keluaran adalah suara atau gerakan, dan umpan balik adalah kemampuan mengevaluasi diri.',
      },
      {
        id: 'kka-b3-e',
        letter: 'E',
        title: 'Prinsip Kerja Sistem KA Sederhana',
        subtitle: 'Lima tahap kerja sebuah sistem KA dari awal sampai perbaikan',
        content: [
          'Sistem KA sederhana bekerja mengikuti lima tahap yang berurutan. Pertama, kumpulkan data melalui masukan seperti sensor, mikrofon, atau ketikan pengguna. Kedua, olah data dan kenali pola di dalamnya: angka yang sering muncul, suara yang mirip ucapan, atau ciri wajah yang khas.',
          'Ketiga, ambil keputusan berdasarkan aturan atau model yang telah dipelajari: "jika suhu ruangan di atas 28 derajat, nyalakan kipas". Keempat, lakukan aksi atau tampilkan hasil melalui keluaran. Kelima, evaluasi hasil kerja dan gunakan umpan balik untuk memperbaiki kinerja pada kesempatan berikutnya.',
          'Urutan tahap ini berlaku pada hampir semua perangkat pintar, dari lampu jalan otomatis sampai asisten suara berteknologi tinggi; yang membedakan hanyalah jumlah data dan tingkat kerumitan model yang digunakan.',
        ],
        keyPoints: [
          'Tahap 1: kumpulkan data (masukan).',
          'Tahap 2: olah data dan kenali pola.',
          'Tahap 3: ambil keputusan berdasarkan aturan atau model.',
          'Tahap 4: lakukan aksi atau tampilkan hasil (keluaran).',
          'Tahap 5: evaluasi melalui umpan balik untuk perbaikan.',
        ],
        examples: [
          {
            title: 'Lampu Jalan Otomatis',
            desc: 'Masukan: sensor cahaya. Tahap kerja: baca intensitas cahaya → bandingkan dengan ambang gelap → keputusan: gelap berarti lampu menyala → aksi: nyalakan lampu → umpan balik: cek apakah lampu benar-benyar menyala.',
          },
          {
            title: 'Alat Penyiram Tanaman Otomatis',
            desc: 'Masukan: sensor kelembapan tanah. Tahap kerja: baca kadar air → bandingkan ambang kering → keputusan: tanah kering berarti siram → aksi: buka katup air selama 2 menit → umpan balik: ukur ulang kelembapan.',
          },
        ],
      },
      {
        id: 'kka-b3-f',
        letter: 'F',
        title: 'Hubungan antara Algoritma dan Kecerdasan Buatan',
        subtitle: 'Algoritma sebagai "otak" yang menggerakkan KA',
        content: [
          'Kembali ke Bab 1: algoritma adalah urutan langkah logis untuk menyelesaikan masalah. Kecerdasan artifisial pada dasarnya adalah sistem yang menjalankan algoritma yang sangat rumit di atas kumpulan data yang sangat besar, dengan kecepatan dan konsistensi yang tidak mungkin dicapai manusia.',
          'Dalam KA dikenal dua peran algoritma. Algoritma pembelajaran (training) mengolah data untuk menghasilkan model, sedangkan algoritma penerapan (inference) menggunakan model tersebut untuk mengenali atau memprediksi hal baru. Tanpa algoritma, KA tidak bergerak sama sekali.',
          'Karena itu, materi algoritma pada Bab 1 dan pemrograman pada Bab 2 adalah fondasi yang harus dikuasai sebelum mendalami KA lebih jauh. Kemampuanmu menyusun langkah logis hari ini adalah bekal menjadi pengembang KA di masa depan.',
        ],
        keyPoints: [
          'KA = algoritma kompleks yang bekerja di atas data besar.',
          'Algoritma training menghasilkan model; algoritma inference memakai model untuk prediksi.',
          'Algoritma (Bab 1) dan pemrograman (Bab 2) adalah fondasi kecerdasan artifisial.',
        ],
        tip: 'Bila kamu sudah mahir menyusun algoritma dan memahami variabel serta percabangan, kamu telah menguasai separuh jalan memahami cara kerja kecerdasan artifisial.',
      },
      {
        id: 'kka-b3-g',
        letter: 'G',
        title: 'Ciri-Ciri Perangkat Kecerdasan Buatan Sederhana',
        subtitle: 'Mengenali perangkat KA dari ciri-cirinya',
        content: [
          'Perangkat kecerdasan artifisial sederhana dapat dikenali dari sejumlah ciri khas. Perangkat tersebut menerima masukan berupa data atau perintah, memprosesnya dengan aturan atau model, mengambil keputusan secara otomatis tanpa perintah manual, dan menghasilkan keluaran berupa aksi atau informasi.',
          'Sebagian perangkat KA juga mampu menyesuaikan diri dan belajar dari data baru, misalnya penyaring spam yang makin akurat seiring waktu. Namun perlu diingat, perangkat KA memiliki keterbatasan: ia tidak memiliki nalar umum seperti manusia dan dapat melakukan kesalahan, misalnya gagal mengenali wajah saat pencahayaan buruk.',
          'Mengenali ciri dan keterbatasan ini penting agar kita menggunakan perangkat KA secara tepat dan bijak, bukan secara berlebihan atau buta percaya.',
        ],
        table: {
          headers: ['Ciri Perangkat KA', 'Penjelasan', 'Contoh'],
          rows: [
            ['Menerima masukan data', 'Menangkap data lewat sensor, mikrofon, atau ketikan', 'Robot penyapu mendeteksi ruangan dan rintangan'],
            ['Memproses dengan aturan/model', 'Mengolah data dengan aturan atau model hasil pembelajaran', 'Dispenser menghitung takaran air yang keluar'],
            ['Mengambil keputusan otomatis', 'Bertindak tanpa perintah manual dari manusia', 'Lampu menyala sendiri saat ruangan gelap'],
            ['Menghasilkan keluaran berupa aksi', 'Meneruskan hasil berupa suara, gambar, atau gerakan', 'Asisten suara menjawab pertanyaan pengguna'],
            ['Mampu menyesuaikan diri (sebagian)', 'Belajar dari data baru untuk memperbaiki kinerja', 'Penyaring spam makin akurat seiring waktu'],
            ['Memiliki keterbatasan', 'Tanpa nalar umum manusia; bisa salah', 'Gagal mengenali wajah saat pencahayaan buruk'],
          ],
        },
        keyPoints: [
          'Ciri utama: menerima data, memproses, memutuskan otomatis, dan menghasilkan aksi.',
          'Sebagian perangkat KA mampu belajar dari data baru.',
          'Setiap perangkat KA memiliki keterbatasan dan berpotensi keliru.',
        ],
        tip: 'Tanda sebuah perangkat "pintar": ia mengambil keputusan sendiri berdasarkan data dari sensornya, bukan sekadar menjalankan tombol yang kamu tekan.',
      },
      {
        id: 'kka-b3-h',
        letter: 'H',
        title: 'Kesimpulan : Esensi dari Kecerdasan Buatan Sederhana',
        subtitle: 'Rangkai seluruh konsep menjadi pemahaman utuh',
        content: [
          'Kecerdasan artifisial bukan "otak tambahan" yang berpikir seperti manusia. Esensinya adalah kemampuan sistem komputer meniru sebagian tugas kecerdasan manusia dengan cara memproses data melalui algoritma secara cepat dan sistematis.',
          'Sistem KA sederhana tersusun dari masukan, penyimpanan data, proses, model, keluaran, serta umpan balik; dan bekerja melalui lima tahap: mengumpulkan data, mengenali pola, memutuskan, bertindak, lalu mengevaluasi. Di balik semuanya itu tetap ada algoritma yang disusun manusia melalui kegiatan pemrograman.',
          'Sebagai pengguna yang bijak, kita wajib menjaga privasi data pribadi, bersikap kritis terhadap hasil KA (misalnya memeriksa kebenaran informasi), dan menggunakan teknologi ini sebagai alat bantu belajar dan berkarya secara bertanggung jawab.',
        ],
        keyPoints: [
          'Esensi KA: data + algoritma + komputasi cepat untuk meniru tugas kecerdasan manusia.',
          'KA tidak memiliki kesadaran; ia menjalankan hasil rancangan manusia.',
          'Gunakan KA secara bijak: jaga privasi data dan selalu periksa kebenaran hasilnya.',
          'Keterampilan algoritma dan pemrograman adalah modal menjadi pengembang KA.',
        ],
        tip: 'Tutup bab ini dengan satu kalimat ciptaanmu sendiri: "Bagiku, kecerdasan artifisial adalah ...". Menyusun definisi dengan bahasa sendiri adalah cara terbaik mengukur pemahamanmu.',
      },
    ],
    rangkumanMateri: [
      'Kecerdasan artifisial (KA) adalah sistem komputer yang mampu melakukan tugas yang biasanya membutuhkan kecerdasan manusia; esensinya meniru manusia berbasis data dan algoritma.',
      'KA tidak memiliki kesadaran, perasaan, atau niat; ia hanya memproses data dengan aturan yang canggih dan cepat.',
      'Data adalah fakta mentah; informasi adalah data yang telah diolah sehingga bermakna. Bagi KA, data adalah "makanan" utamanya.',
      'Penerapan KA sehari-hari: asisten suara, rekomendasi konten, face unlock, penerjemah otomatis, chatbot, navigasi, dan penyaring spam.',
      'Komponen sistem KA sederhana: masukan, penyimpanan data, proses, model dan basis pengetahuan, keluaran, serta umpan balik.',
      'Prinsip kerja KA sederhana: kumpulkan data, kenali pola, ambil keputusan, lakukan aksi, evaluasi dengan umpan balik.',
      'KA berdiri di atas algoritma: tanpa algoritma, KA tidak bergerak; karenanya algoritma dan pemrograman adalah fondasinya.',
      'Perangkat KA memiliki keterbatasan, sehingga penggunaannya harus disertai kewaspadaan, pemeriksaan fakta, dan tanggung jawab.',
    ],
    refleksiDiri: [
      { id: 'kka-b3-r1', statement: 'Saya dapat menjelaskan makna dan esensi kecerdasan artifisial dengan bahasa saya sendiri.' },
      { id: 'kka-b3-r2', statement: 'Saya dapat membedakan data dan informasi beserta perannya bagi sistem KA.' },
      { id: 'kka-b3-r3', statement: 'Saya menyebutkan beberapa contoh penerapan KA dalam kehidupan sehari-hari.' },
      { id: 'kka-b3-r4', statement: 'Saya mengenal komponen dasar penyusun sistem KA sederhana.' },
      { id: 'kka-b3-r5', statement: 'Saya memahami lima tahap prinsip kerja sistem KA sederhana.' },
      { id: 'kka-b3-r6', statement: 'Saya memahami hubungan algoritma dengan kecerdasan artifisial serta keterbatasan perangkat KA.' },
    ],
  },
];
