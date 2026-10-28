import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Cat,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  ExternalLink,
  Gamepad2,
  Maximize2,
  Minimize2,
  Puzzle,
  RotateCw,
  Sparkles,
  Wifi,
  Zap,
} from 'lucide-react';

type CodingToolId = 'blockly-code' | 'blockly-games' | 'scratch';

interface CodingTool {
  title: string;
  shortTitle: string;
  subtitle: string;
  url: string;
  /** URL opsional untuk tombol "Buka Tab Baru" bila berbeda dari sumber iframe. */
  openUrl?: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  externalUrl?: string;
  accent: string;
}

const CODING_TOOLS: Record<CodingToolId, CodingTool> = {
  'blockly-code': {
    title: 'Google Blockly Code Workspace',
    shortTitle: 'Google Blockly',
    subtitle: 'Blok visual → ekspor Python, JavaScript, PHP',
    url: 'https://blockly-demo.appspot.com/static/demos/code/index.html',
    badge: 'RESMI GOOGLE',
    description:
      'Susun balok logika visual (Logic, Loops, Math, Text, Variables, Functions) dan amati langsung bagaimana blok diterjemahkan ke kode bahasa pemrograman profesional secara real-time.',
    icon: Code2,
    accent: '#2e59e6',
  },
  'blockly-games': {
    title: 'Blockly Games (Labirin & Puzzle Logika)',
    shortTitle: 'Blockly Games',
    subtitle: 'Game edukasi algoritma interaktif',
    url: 'https://blockly.games/',
    badge: 'GAME EDUKASI',
    description:
      'Selesaikan tantangan labirin terprogram: kendalikan karakter dengan sekuensial langkah, percabangan jalan (if-else), dan perulangan (while) hingga garis akhir.',
    icon: Gamepad2,
    accent: '#7e22ce',
  },
  scratch: {
    title: 'Scratch 3.0 Studio (PenguinMod Editor)',
    shortTitle: 'Scratch 3.0',
    subtitle: 'Animasi & game dengan blok warna-warni',
    // TurboWarp menolak dimuat di dalam iframe ("Invalid TurboWarp Embed"),
    // jadi editor di halaman ini memakai PenguinMod (mod Scratch 3.0 yang kompatibel).
    url: 'https://studio.penguinmod.com/editor.html',
    openUrl: 'https://turbowarp.org/editor',
    badge: 'SCRATCH 3.0',
    description:
      'Workspace Scratch 3.0 yang langsung bisa dipakai di dalam halaman tanpa akun login (PenguinMod). Karena TurboWarp dan Scratch MIT tidak mengizinkan editor mereka disematkan di iframe, gunakan tombol "Buka Tab Baru" untuk membuka TurboWarp dengan performa maksimal.',
    icon: Puzzle,
    accent: '#d97706',
    externalUrl: 'https://scratch.mit.edu/create',
  },
};

// ─── DATA MISI KELAS 7 (80 menit, game Kucing & Tikus) ───────────────────────

interface Mission {
  title: string;
  waktu: string;
  colorBg: string;
  colorText: string;
  colorBadge: string;
  steps: string[];
  tip: string;
}

const MISSIONS_KELAS7: Mission[] = [
  {
    title: 'MISI 1 — Orientasi & Eksplorasi',
    waktu: '±10 menit',
    colorBg: 'bg-blue-50',
    colorText: 'text-blue-800',
    colorBadge: 'bg-blue-600',
    steps: [
      'Buka Scratch via tombol "Tab Baru" di atas (TurboWarp) atau klik editor di bawah.',
      'Perhatikan 3 area utama: Panel Blok (kiri), Kanvas/Stage (tengah), Daftar Sprite (kanan bawah).',
      'Klik kategori Motion (biru) → seret blok "gerak 10 langkah" ke area skrip.',
      'Klik blok itu langsung → lihat si Kucing bergerak! Coba ubah angka 10 jadi 50.',
      'Eksplorasi bebas: seret blok apa saja, lihat apa yang terjadi.',
    ],
    tip: '💡 Tidak ada yang rusak di Scratch. Berani coba = belajar lebih cepat!',
  },
  {
    title: 'MISI 2 — Sprite Bergerak dengan Keyboard',
    waktu: '±20 menit',
    colorBg: 'bg-purple-50',
    colorText: 'text-purple-800',
    colorBadge: 'bg-purple-600',
    steps: [
      'Pastikan sprite Kucing terpilih (klik gambarnya di Daftar Sprite).',
      'Buka kategori Events (kuning) → seret "ketika tombol [spasi] ditekan" ke area skrip.',
      'Ubah "spasi" menjadi "panah kanan". Sambungkan blok Motion "gerak 10 langkah" di bawahnya.',
      'Buat 4 blok Events terpisah: panah kanan (+10), panah kiri (-10), panah atas (y +10), panah bawah (y -10).',
      'Untuk gerak kiri/bawah: gunakan blok "gerak 10 langkah" tapi isi -10 (minus).',
      'Uji coba: tekan tombol panah di keyboard — kucing harus bisa bergerak 4 arah!',
    ],
    tip: '💡 Blok "gerak X langkah" ke kiri = isi angka minus, contoh: -10.',
  },
  {
    title: 'MISI 3 — Tambah Sprite Target (Tikus)',
    waktu: '±20 menit',
    colorBg: 'bg-amber-50',
    colorText: 'text-amber-800',
    colorBadge: 'bg-amber-600',
    steps: [
      'Klik ikon + di Daftar Sprite → pilih sprite lain (Mouse/Tikus, Bola, Apel, terserah!)',
      'Pindah sprite baru ke pojok lain stage — ini adalah "target" yang harus dikejar kucing.',
      'Klik sprite Kucing lagi → tambahkan blok baru dari Events: "ketika bendera hijau diklik".',
      'Di bawahnya, sambungkan blok dari kategori Control: "selamanya" (forever loop).',
      'Di dalam "selamanya", masukkan blok Sensing: "menyentuh [nama sprite target]?".',
      'Sambungkan kondisi itu ke blok Control: "jika... maka..." → isi "maka"-nya dengan blok Looks: "katakan [Tertangkap!] selama 1 detik".',
      'Klik bendera hijau → coba gerakkan kucing sampai menyentuh sprite target!',
    ],
    tip: '💡 Blok berwarna ungu (Sensing) adalah "indra" sprite — bisa merasakan sentuhan & jarak.',
  },
  {
    title: 'MISI 4 — Variabel Skor & Game Jadi!',
    waktu: '±20 menit',
    colorBg: 'bg-emerald-50',
    colorText: 'text-emerald-800',
    colorBadge: 'bg-emerald-600',
    steps: [
      'Buka kategori Variables (oranye) → klik "Buat Variabel" → beri nama "Skor".',
      'Di blok Kucing (dalam loop "selamanya"), setelah deteksi sentuhan, tambahkan: "ubah [Skor] sebesar 1".',
      'Setelah skor bertambah, pindahkan sprite Target ke posisi acak: gunakan blok Motion "pergi ke posisi acak".',
      'Tambahkan blok dari Events: "ketika bendera hijau diklik" → sambungkan "atur [Skor] ke 0" (reset skor).',
      'Uji game: tekan bendera hijau → kejar target → lihat skor naik setiap kali berhasil!',
      'BONUS: Tambahkan blok Sound "mainkan suara" saat skor bertambah agar lebih seru!',
    ],
    tip: '🎉 Selamat! Kamu baru saja membuat game pertama dengan Scratch. Tunjukkan ke teman sebangkumu!',
  },
];

// ─── REFERENSI BLOK KODE ─────────────────────────────────────────────────────

interface BlockRef {
  kategori: string;
  warna: string;
  warnaText: string;
  bloks: { nama: string; fungsi: string }[];
}

const BLOCK_REFS: BlockRef[] = [
  {
    kategori: 'Motion',
    warna: 'bg-blue-500',
    warnaText: 'text-blue-700',
    bloks: [
      { nama: 'gerak 10 langkah', fungsi: 'Pindahkan sprite maju sejauh X piksel ke arah yang dihadapinya.' },
      { nama: 'pergi ke x: _ y: _', fungsi: 'Teleport sprite ke koordinat tertentu di stage.' },
      { nama: 'pergi ke [posisi acak]', fungsi: 'Pindahkan sprite ke posisi acak di stage.' },
      { nama: 'pantulkan dari tepi', fungsi: 'Balik arah sprite otomatis jika menyentuh tepi stage.' },
    ],
  },
  {
    kategori: 'Events',
    warna: 'bg-yellow-400',
    warnaText: 'text-yellow-700',
    bloks: [
      { nama: 'ketika 🚩 diklik', fungsi: 'Jalankan skrip ini saat tombol bendera hijau ditekan — titik awal program.' },
      { nama: 'ketika tombol [spasi] ditekan', fungsi: 'Jalankan skrip saat tombol keyboard tertentu ditekan.' },
      { nama: 'ketika sprite ini diklik', fungsi: 'Jalankan skrip saat sprite diklik dengan mouse.' },
    ],
  },
  {
    kategori: 'Control',
    warna: 'bg-orange-400',
    warnaText: 'text-orange-700',
    bloks: [
      { nama: 'selamanya', fungsi: 'Ulangi blok di dalamnya terus-menerus selama program berjalan (loop tak terbatas).' },
      { nama: 'ulangi 10', fungsi: 'Ulangi blok di dalamnya sebanyak X kali lalu berhenti.' },
      { nama: 'jika <> maka', fungsi: 'Jalankan blok di dalamnya HANYA jika kondisi di <> bernilai benar (true).' },
      { nama: 'tunggu 1 detik', fungsi: 'Jeda program selama X detik sebelum melanjutkan ke blok berikutnya.' },
    ],
  },
  {
    kategori: 'Sensing',
    warna: 'bg-cyan-500',
    warnaText: 'text-cyan-700',
    bloks: [
      { nama: 'menyentuh [sprite]?', fungsi: 'Bernilai BENAR jika sprite ini sedang menyentuh sprite/tepi/warna lain.' },
      { nama: 'jarak ke [sprite]', fungsi: 'Menghasilkan angka jarak (piksel) antara sprite ini dengan objek lain.' },
      { nama: 'tombol [spasi] ditekan?', fungsi: 'Bernilai BENAR jika tombol keyboard tertentu sedang ditekan.' },
    ],
  },
  {
    kategori: 'Variables',
    warna: 'bg-orange-600',
    warnaText: 'text-orange-800',
    bloks: [
      { nama: 'atur [Skor] ke 0', fungsi: 'Set nilai variabel ke angka tertentu — biasanya dipakai untuk reset.' },
      { nama: 'ubah [Skor] sebesar 1', fungsi: 'Tambah/kurangi nilai variabel sebesar X — pakai untuk sistem skor.' },
    ],
  },
  {
    kategori: 'Looks',
    warna: 'bg-purple-500',
    warnaText: 'text-purple-700',
    bloks: [
      { nama: 'katakan [Halo!] selama 2 detik', fungsi: 'Tampilkan gelembung teks di atas sprite selama X detik.' },
      { nama: 'ganti kostum ke [kostum2]', fungsi: 'Ubah tampilan sprite ke kostum/gambar lain yang sudah disiapkan.' },
    ],
  },
];

// ─── KOMPONEN UTAMA ───────────────────────────────────────────────────────────

export const StudioKodingPanel: React.FC = () => {
  const [activeTool, setActiveTool] = useState<CodingToolId>('blockly-code');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [expandedMission, setExpandedMission] = useState<number | null>(null);
  const [expandedRef, setExpandedRef] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTool = CODING_TOOLS[activeTool];

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => setIsFullscreen((prev) => !prev));
    } else {
      document
        .exitFullscreen?.()
        .then(() => setIsFullscreen(false))
        .catch(() => setIsFullscreen(false));
    }
  };

  const toggleMission = (idx: number) => {
    setExpandedMission((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-3.5 sm:p-5">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 pb-3 border-b-2 border-[#1a1a1a]">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 font-mono-code text-[10px] font-bold uppercase mb-1">
            <span className="px-2 py-0.5 bg-[#2e59e6] text-white">STUDIO KODING</span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400">
              3 EDITOR INTERAKTIF
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <Wifi className="h-2.5 w-2.5" />
              BUTUH INTERNET
            </span>
          </div>
          <h2 className="font-mono-code text-lg sm:text-2xl font-black text-[#1a1a1a]">
            Studio Koding (Blockly &amp; Scratch)
          </h2>
          <p className="text-[11px] sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Eksplorasi logika koding blok visual, percabangan (if-else), perulangan (loops), dan
            konversi kode ke Python &amp; JavaScript melalui 3 studio interaktif.
          </p>
        </div>

        {/* Actions — tombol besar & sejajar di ponsel */}
        <div className="grid grid-cols-3 gap-1.5 font-mono-code text-[11px] sm:flex sm:items-center">
          <button
            type="button"
            onClick={() => setIframeKey((prev) => prev + 1)}
            className="min-h-[44px] px-2 py-2 bg-white hover:bg-slate-100 border border-[#1a1a1a] text-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-[1px_1px_0px_#1a1a1a]"
            title="Muat ulang workspace"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Muat Ulang</span>
          </button>
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="min-h-[44px] px-2 py-2 bg-white hover:bg-slate-100 border border-[#1a1a1a] text-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-[1px_1px_0px_#1a1a1a]"
            title="Toggle mode layar penuh"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Kecilkan</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Layar Penuh</span>
              </>
            )}
          </button>
          <a
            href={currentTool.openUrl ?? currentTool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-2 py-2 bg-[#1a1a1a] hover:bg-[#2e59e6] text-white font-bold border border-[#1a1a1a] transition-all flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a]"
            title="Buka di tab baru untuk area kerja maksimal"
          >
            <span>Tab Baru</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* ── Engine selector ── */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {(Object.keys(CODING_TOOLS) as CodingToolId[]).map((id) => {
          const tool = CODING_TOOLS[id];
          const Icon = tool.icon;
          const active = activeTool === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTool(id)}
              style={
                active ? { backgroundColor: tool.accent, borderColor: tool.accent } : undefined
              }
              className={`w-full min-h-[52px] px-3 py-2.5 font-mono-code text-xs font-bold border-2 transition-all cursor-pointer flex items-center justify-between gap-2 text-left ${
                active
                  ? 'text-white shadow-[3px_3px_0px_#1a1a1a]'
                  : 'bg-[#F2EFEB] hover:bg-white text-slate-700 border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{tool.shortTitle}</span>
              </span>
              <span
                className={`text-[9px] px-1 py-0.5 shrink-0 ${
                  active ? 'bg-white/25 text-white' : 'bg-white text-slate-600'
                }`}
              >
                {tool.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Info bar ── */}
      <div className="mt-3 p-3 bg-[#FAF8F5] border border-[#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono-code text-[11px] sm:text-xs">
        <div>
          <span className="font-bold text-[#1a1a1a]">{currentTool.title}:</span>{' '}
          <span className="text-slate-600">{currentTool.description}</span>
        </div>
        {activeTool === 'scratch' && currentTool.externalUrl && (
          <a
            href={currentTool.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-800 font-bold hover:underline shrink-0 flex items-center gap-1"
          >
            <span>Buka Scratch Resmi (MIT) &rarr;</span>
          </a>
        )}
      </div>

      {/* ── Workspace iframe ── */}
      <div
        ref={containerRef}
        className={`mt-3 bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden transition-all relative ${
          isFullscreen ? 'fixed inset-0 z-50 p-2 bg-[#F2EFEB] flex flex-col h-screen w-screen' : ''
        }`}
      >
        {isFullscreen && (
          <div className="p-2 bg-[#1a1a1a] text-white flex items-center justify-between gap-2 font-mono-code text-[11px] sm:text-xs mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="font-bold truncate">{currentTool.title} (Layar Penuh)</span>
            </div>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="px-2.5 py-1.5 min-h-[40px] bg-white text-[#1a1a1a] font-bold border border-white hover:bg-slate-200 shrink-0"
            >
              Kembali ✕
            </button>
          </div>
        )}

        <iframe
          key={`${activeTool}-${iframeKey}`}
          src={currentTool.url}
          title={currentTool.title}
          className="w-full h-[58vh] min-h-[400px] sm:h-[620px] lg:h-[760px] border-none bg-white"
          allow="camera; microphone; accelerometer; gyroscope; fullscreen"
          loading="lazy"
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          PANDUAN SCRATCH KELAS 7 — Game Kucing & Tikus (80 Menit)
          ════════════════════════════════════════════════════════════ */}
      <div className="mt-6 pt-5 border-t-2 border-[#1a1a1a] space-y-4">

        {/* ── Judul Panduan ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 font-mono-code text-[10px] font-bold uppercase mb-1">
              <span className="px-2 py-0.5 bg-amber-500 text-white flex items-center gap-1">
                <Cat className="h-3 w-3" /> KELAS 7
              </span>
              <span className="px-2 py-0.5 bg-[#1a1a1a] text-white flex items-center gap-1">
                <Clock className="h-3 w-3" /> 80 MENIT
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-400">
                PEMULA — TANPA PENGALAMAN
              </span>
            </div>
            <h3 className="font-mono-code text-base sm:text-lg font-black text-[#1a1a1a] flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-amber-500 shrink-0" />
              Proyek: Game "Kucing &amp; Tikus" 🐱🐭
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono-code">
              Buat game pertamamu! Gerakkan kucing untuk mengejar tikus &amp; kumpulkan skor sebanyak mungkin.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 font-mono-code text-[10px]">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-slate-600 font-bold">4 MISI BERTAHAP</span>
          </div>
        </div>

        {/* ── Misi Cards — accordion ── */}
        <div className="space-y-2">
          {MISSIONS_KELAS7.map((misi, idx) => {
            const isOpen = expandedMission === idx;
            return (
              <div
                key={misi.title}
                className="border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] overflow-hidden"
              >
                {/* Accordion header */}
                <button
                  type="button"
                  onClick={() => toggleMission(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                    isOpen ? misi.colorBg : 'bg-[#FAF8F5] hover:bg-white'
                  }`}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`shrink-0 font-mono-code text-[9px] font-bold px-2 py-0.5 text-white ${misi.colorBadge}`}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className={`font-mono-code text-xs sm:text-sm font-black truncate ${
                        isOpen ? misi.colorText : 'text-[#1a1a1a]'
                      }`}
                    >
                      {misi.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:flex items-center gap-1 font-mono-code text-[10px] text-slate-500">
                      <Clock className="h-3 w-3" />
                      {misi.waktu}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Accordion body */}
                {isOpen && (
                  <div className={`px-4 pb-4 pt-3 ${misi.colorBg} border-t border-[#1a1a1a]/20`}>
                    <div className="flex items-center gap-1.5 font-mono-code text-[10px] text-slate-500 mb-3 sm:hidden">
                      <Clock className="h-3 w-3" />
                      <span>{misi.waktu}</span>
                    </div>
                    <ol className="space-y-2">
                      {misi.steps.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2.5">
                          <span
                            className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5 ${misi.colorBadge}`}
                          >
                            {sIdx + 1}
                          </span>
                          <span className="text-[12px] sm:text-[13px] text-slate-700 leading-relaxed">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <div
                      className={`mt-3 p-2.5 rounded border ${misi.colorText} bg-white/70 font-mono-code text-[11px] font-bold`}
                    >
                      {misi.tip}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Referensi Blok Kode ── */}
        <div className="border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] overflow-hidden">
          <button
            type="button"
            onClick={() => setExpandedRef((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[#1a1a1a] hover:bg-[#2e59e6] text-white transition-colors cursor-pointer"
            aria-expanded={expandedRef}
          >
            <span className="flex items-center gap-2 font-mono-code text-xs font-black">
              <BookOpen className="h-4 w-4" />
              <span>📘 Referensi Blok Kode — Panduan Cepat</span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:block font-mono-code text-[10px] text-white/70">
                6 kategori blok &amp; fungsinya
              </span>
              {expandedRef ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
          </button>

          {expandedRef && (
            <div className="p-4 bg-[#FAF8F5]">
              <p className="font-mono-code text-[11px] text-slate-500 mb-3">
                Blok Scratch dikelompokkan berdasarkan warna kategori. Berikut blok-blok yang dipakai di proyek hari ini:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {BLOCK_REFS.map((ref) => (
                  <div
                    key={ref.kategori}
                    className="bg-white border border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] overflow-hidden"
                  >
                    {/* Kategori header */}
                    <div className={`${ref.warna} px-3 py-1.5 flex items-center gap-1.5`}>
                      <span className="font-mono-code text-[11px] font-black text-white">
                        {ref.kategori}
                      </span>
                    </div>
                    {/* Blok list */}
                    <div className="divide-y divide-slate-100">
                      {ref.bloks.map((blok) => (
                        <div key={blok.nama} className="px-3 py-2">
                          <div
                            className={`font-mono-code text-[10px] font-bold ${ref.warnaText} mb-0.5`}
                          >
                            {blok.nama}
                          </div>
                          <div className="text-[11px] text-slate-600 leading-snug">
                            {blok.fungsi}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Peta warna kategori */}
              <div className="mt-4 p-3 bg-white border border-[#1a1a1a]">
                <div className="font-mono-code text-[10px] font-bold text-[#1a1a1a] uppercase mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Peta Warna Kategori Scratch
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { warna: 'bg-blue-500', label: 'Motion — Gerakan' },
                    { warna: 'bg-purple-500', label: 'Looks — Tampilan' },
                    { warna: 'bg-pink-400', label: 'Sound — Suara' },
                    { warna: 'bg-yellow-400', label: 'Events — Pemicu' },
                    { warna: 'bg-orange-400', label: 'Control — Kendali' },
                    { warna: 'bg-cyan-500', label: 'Sensing — Indra' },
                    { warna: 'bg-green-500', label: 'Operators — Logika' },
                    { warna: 'bg-orange-600', label: 'Variables — Variabel' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <span className={`w-3 h-3 rounded-sm shrink-0 ${item.warna}`} />
                      <span className="font-mono-code text-[10px] text-slate-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Checklist Progress Cepat ── */}
        <div className="bg-[#1a1a1a] p-3.5 sm:p-4">
          <div className="font-mono-code text-[10px] font-bold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Checklist — Sudah selesai?
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono-code text-[11px]">
            {[
              'Sprite Kucing bisa bergerak dengan tombol panah keyboard',
              'Ada sprite kedua (target/tikus) di stage',
              'Program bisa mendeteksi sentuhan antar sprite',
              'Variabel Skor muncul di layar dan bertambah saat sentuhan',
              'Skor reset ke 0 saat bendera hijau diklik',
              '(BONUS) Ada efek suara atau sprite target berpindah acak',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-white/80">
                <span className="shrink-0 mt-0.5 w-4 h-4 border border-white/30 flex items-center justify-center text-[9px] text-white/40">
                  {i + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
