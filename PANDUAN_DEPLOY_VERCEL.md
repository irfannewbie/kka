# Panduan Lengkap Deploy ke Vercel (https://ifkka.vercel.app / inforkoding.vercel.app)

Aplikasi ini telah dikonfigurasi secara optimal untuk dideploy ke **Vercel** sebagai Single Page Application (SPA) berbasis Vite & React dengan sistem ketahanan rute berlapis (*multi-layer route resilience*).

---

## 🔍 Mengapa `https://ifkka.vercel.app/master` Sempat 404 (Not Found)?

Ketika Anda mencoba membuka `https://ifkka.vercel.app/master` atau `https://ifkka.vercel.app/kelas7`, server Vercel sempat merespons:
```
404: NOT_FOUND
Code: NOT_FOUND
```

**Penyebabnya adalah:**
1. **Sifat Standar Static Host Vercel**: Secara default, server Vercel mencari folder fisik `dist/master/index.html`. Jika folder tersebut belum dibuat saat build dan file rewrite belum ter-deploy, Vercel langsung mengembalikan status error 404.
2. **Perubahan di AI Studio Belum Ter-push ke Vercel**: Kode yang saat ini berjalan di `https://ifkka.vercel.app/` merupakan hasil build lama sebelum konfigurasi `vercel.json` dan perbaikan navigasi dibuat di AI Studio.
3. **Ketiadaan Menu Navigasi di Halaman Utama**: Pada versi lama, pengunjung yang masuk ke root `/` (Galeri Karya) tidak memiliki tombol klik untuk berpindah ke `/master` atau `/kelas7`.

---

## 🛠️ Solusi & Proteksi yang Telah Diterapkan di Proyek Ini

Kami telah menerapkan **4 lapis proteksi** agar semua rute (`/master`, `/kelas7`, `/cek`, `/kuis`, `/pengganti`, dsb.) dijamin berjalan 100%:

1. **Static Route Generator Otomatis (`vite.config.ts`)**:
   Saat perintah `npm run build` dijalankan oleh Vercel, plugin Vite secara otomatis membuat folder fisik dan menyalin `index.html` ke setiap rute:
   - `dist/master/index.html`
   - `dist/kelas7/index.html`
   - `dist/cek/index.html`
   - `dist/kuis/index.html`
   - `dist/pengganti/index.html`
   - `dist/excel/index.html`
   - `dist/master/students/index.html`
   - `dist/master/grades/index.html`
   - `dist/master/calculator/index.html`
   - `dist/master/tasks/index.html`
   - `dist/master/quiz/index.html`
   - `dist/master/excel/index.html`
   - `dist/404.html` (fallback resmi Vercel)
   
   *Hasilnya: Vercel langsung menemukan file fisik yang diminta, sehingga HTTP 200 OK langsung tersaji tanpa pernah 404!*

2. **File Konfigurasi Vercel Standar (`vercel.json`)**:
   Aturan rewrite global `/(.*) -> /index.html` untuk menangani routing SPA di level edge server.

3. **Bilah Navigasi Universal di Header & Beranda**:
   - Di bilah atas (Header) kini selalu tampil tombol:
     - `📊 KELAS 7 (LAB EXCEL)`
     - `🔍 CEK NILAI (KELAS 8)`
     - `💡 KUIS`
     - `📝 PENGGANTI KKA`
     - `🖼️ ARSIP KARYA`
     - `🔐 PANEL MASTER`
   - Di halaman beranda (`/`), ditambahkan banner pintasan langsung sehingga pengunjung tidak perlu mengetik alamat URL secara manual.

4. **Dukungan Routing Hash Fallback (`/#/master` dan `/#/kelas7`)**:
   Aplikasi juga mendukung format hash (`#/master`, `#/kelas7`), sehingga jika sewaktu-waktu diakses melalui platform mana pun, halaman tetap langsung terbuka.

---

## 🚀 Langkah Memperbarui (Redeploy) ke Vercel

Agar perubahan terbaru ini aktif di domain Anda (`https://ifkka.vercel.app`):

### Cara A: Melalui GitHub (Jika terhubung ke Git Repository)
1. **Commit & Push** seluruh perubahan terbaru (terutama file `vite.config.ts`, `vercel.json`, `src/App.tsx`, `src/components/Header.tsx`, dan `src/components/ShowcaseView.tsx`) ke repository GitHub Anda:
   ```bash
   git add .
   git commit -m "feat: tambahkan navigasi universal dan generator rute statis Vercel"
   git push origin main
   ```
2. Vercel akan secara otomatis mendeteksi commit baru dan melakukan **Auto-Deploy** dalam kurun waktu 1-2 menit.

### Cara B: Menggunakan Vercel CLI (Deploy Langsung dari Komputer)
1. Buka terminal di folder proyek Anda.
2. Jalankan:
   ```bash
   vercel --prod
   ```
3. Tunggu hingga proses build selesai.

### Cara C: Redeploy Manual di Dashboard Vercel
1. Buka [vercel.com](https://vercel.com) > Pilih project `ifkka`.
2. Masuk ke tab **Deployments**.
3. Klik titik tiga (`...`) di samping deployment terbaru > Pilih **Redeploy**.
4. Centang opsi *“Redeploy with existing build cache”* di-uncheck (jangan dicentang) agar Vercel mengunduh dan mengompilasi ulang seluruh file terbaru.

---

## 📋 Daftar Rute yang Dapat Langsung Dibuka

Setelah deployment terbaru selesai:
- **Panel Master Guru**: `https://ifkka.vercel.app/master`
- **Laboratorium Excel Kelas 7**: `https://ifkka.vercel.app/kelas7`
- **Cek Nilai Siswa Kelas 8**: `https://ifkka.vercel.app/cek`
- **Portal Kuis Interaktif**: `https://ifkka.vercel.app/kuis`
- **Tugas Pengganti KKA 2**: `https://ifkka.vercel.app/pengganti`
- **Arsip Karya / Beranda**: `https://ifkka.vercel.app/`
