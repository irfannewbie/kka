# Panduan Lengkap Deploy ke Vercel (inforkoding.vercel.app)

Aplikasi ini telah dikonfigurasi secara optimal untuk dideploy ke **Vercel** sebagai Single Page Application (SPA) berbasis Vite & React.

---

## 1. File Konfigurasi Otomatis (`vercel.json`)

File `vercel.json` di root repository sudah dikonfigurasi dengan:
- **Framework Preset**: `vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **SPA Rewrites**: Semua rute (`/kelas7`, `/excel`, `/master`, `/cek`, `/kuis`, `/pengganti`, dsb.) otomatis diarahkan ke `/index.html` sehingga **tidak akan terjadi error 404 (Not Found)** saat halaman dimuat langsung atau direfresh.
- **Cache Optimization**: Header `Cache-Control` optimal untuk file build di folder `/assets` (1 tahun immutable).

---

## 2. Langkah-Langkah Deploy ke Vercel

### Cara A: Melalui Dashboard Vercel (Metode Direkomendasikan)

1. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik tombol **"Add New..."** > **"Project"**.
3. Pilih repository GitHub proyek ini, lalu klik **"Import"**.
4. Di bagian **Configure Project**:
   - **Project Name**: `inforkoding` (agar mendapatkan domain `inforkoding.vercel.app`).
   - **Framework Preset**: Pilih **Vite** (biasanya terdeteksi otomatis).
   - **Root Directory**: Biarkan `./` (default).
   - **Build and Output Settings**:
     - *Build Command*: `npm run build` (atau `vite build`)
     - *Output Directory*: `dist`
     - *Install Command*: `npm install`
5. (Opsional) Jika menggunakan API Google Sheets / Firebase / Gemini, masukkan variabel lingkungan di bagian **Environment Variables** (lihat file `.env.example`).
6. Klik tombol **"Deploy"**.
7. Tunggu proses build selesai (~1 menit). Aplikasi Anda akan langsung aktif di `https://inforkoding.vercel.app`!

---

### Cara B: Menggunakan Vercel CLI

Jika Anda menggunakan terminal / command line:
1. Pastikan Vercel CLI sudah terinstal:
   ```bash
   npm i -g vercel
   ```
2. Login ke akun Vercel:
   ```bash
   vercel login
   ```
3. Deploy langsung dari folder proyek:
   ```bash
   vercel --prod
   ```

---

## 3. Menghubungkan Domain Kustom atau Subdomain

Untuk memastikan alamat domain aktif di `inforkoding.vercel.app`:
1. Masuk ke dashboard proyek di Vercel: **Project** > **Settings** > **Domains**.
2. Masukkan `inforkoding.vercel.app`.
3. Vercel akan otomatis mengarahkan domain dan mengaktifkan sertifikat SSL (HTTPS).

---

## 4. Memverifikasi Rute Penting

Setelah proses deployment berhasil, Anda dapat langsung menguji URL berikut:
- **Beranda / Showcase**: `https://inforkoding.vercel.app/`
- **Laboratorium Excel & Cek Nilai**: `https://inforkoding.vercel.app/kelas7`
- **Pengalihan Otomatis Excel**: `https://inforkoding.vercel.app/excel` (otomatis redirect ke `/kelas7`)
- **Kuis Interaktif**: `https://inforkoding.vercel.app/kuis`
- **Panel Guru / Master**: `https://inforkoding.vercel.app/master`
