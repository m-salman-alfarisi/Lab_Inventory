# 🖥️ SIMLAB — Laboratory Inventory & Borrowing Management System

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Website-black?style=for-the-badge&logo=vercel&logoColor=white)](https://simlab-inventory-three.vercel.app/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Website-blue?style=for-the-badge&logo=githubpages&logoColor=white)](https://m-salman-alfarisi.github.io/Lab_Inventory/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/m-salman-alfarisi/Lab_Inventory)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)](#)

Aplikasi web modern untuk manajemen inventaris peralatan laboratorium komputer serta pencatatan sirkulasi peminjaman dan pengembalian digital secara real-time. Dibangun dengan antarmuka yang bersih, responsif, dukungan **Dark/Light Mode**, sistem otorisasi multi-role (**Admin & Staff**), serta persistensi data ganda (**LocalStorage + Supabase Cloud Sync**).

Proyek ini dikembangkan untuk memenuhi ketentuan teknis **Coding Talent Challenge**.

---

## 📑 Daftar Isi
- [Tautan Publik & Akun Pengujian](#-tautan-publik--akun-pengujian)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Arsitektur Database & Penyimpanan](#-arsitektur-database--penyimpanan)
- [Fitur Utama Sistem](#-fitur-utama-sistem)
- [Matriks Hak Akses (RBAC)](#-matriks-hak-akses-rbac)
- [Data Awal Barang (Master Data)](#-data-awal-barang-master-data)
- [Cara Menjalankan Secara Lokal](#-cara-menjalankan-secara-lokal)
- [Struktur Direktori Proyek](#-struktur-direktori-proyek)
- [Format Pengumpulan Tugas](#-format-pengumpulan-tugas)

---

## 🌐 Tautan Publik & Akun Pengujian

| Komponen | Tautan / Nilai |
|---|---|
| **URL Aplikasi (Vercel Primary)** | [https://simlab-inventory-three.vercel.app/](https://simlab-inventory-three.vercel.app/) |
| **URL Mirror (GitHub Pages)** | [https://m-salman-alfarisi.github.io/Lab_Inventory/](https://m-salman-alfarisi.github.io/Lab_Inventory/) |
| **URL Repository GitHub** | [https://github.com/m-salman-alfarisi/Lab_Inventory](https://github.com/m-salman-alfarisi/Lab_Inventory) |
| **Kredensial Admin** | **Username / Email:** `admin` atau `admin.lab@univ.ac.id` \| **Password:** `password123` |
| **Kredensial Staff** | **Username / Email:** `staff` atau `siti.lab@univ.ac.id` \| **Password:** `password123` |

> 💡 **Catatan Penguji:** Halaman login juga dilengkapi dengan proteksi autentikasi aktif. Sesi login akan tetap tersimpan meski tab atau browser ditutup.

---

## 🛠️ Teknologi yang Digunakan

Aplikasi dirancang dengan pendekatan modular, cepat, tanpa dependensi build kompleks (*Zero-build step*):

* **Frontend & UI/UX:**
  * **HTML5 Semantic:** Struktur dokumen yang rapi, modular, dan ramah SEO/aksesibilitas.
  * **Tailwind CSS (v3 CDN):** Utility-first styling modern dengan dukungan tema Light & Dark Mode yang kontras dan nyaman di mata.
  * **Font Awesome 6:** Representasi ikon interaktif untuk status stok, role, tombol aksi, dan navigasi.
* **Client-Side Engine:**
  * **Vanilla JavaScript (ES6+):** Logika murni dengan arsitektur modular (`App` controller & `DB` storage manager).
  * **Reactive Real-time State:** Perhitungan mutasi stok otomatis tanpa refresh halaman.
* **Database & Persistence:**
  * **Browser LocalStorage API:** Engine database primer client-side dengan serialisasi JSON terstruktur.
  * **Supabase REST API (PostgreSQL):** Integrasi cloud database siap pakai untuk sinkronisasi multi-device.
* **Deployment Platform:**
  * **GitHub Pages (Production):** Hosting statis berkecepatan tinggi dengan sertifikat SSL/HTTPS aktif.

---

## 🗄️ Arsitektur Database & Penyimpanan

SIMLAB menerapkan strategi **Dual-Layer Persistence**:

```
+-------------------------------------------------------------+
|                 SIMLAB Application (Browser)                |
+-------------------------------------------------------------+
                               |
               +---------------+---------------+
               |                               |
               v                               v
    [ Primary Storage ]             [ Cloud Sync Layer ]
    HTML5 LocalStorage              Supabase REST API
    - Fast 0ms Latency              - PostgreSQL Cloud
    - Survives Refresh/Reopen       - Multi-device Realtime
    - Isolated Sandbox              - Remote Backup
```

1. **Primary: Browser LocalStorage (Default Active)**
   * Seluruh data barang, riwayat transaksi, mutasi stok, akun pengguna, dan log aktivitas otomatis tersimpan secara persisten pada browser lokal.
   * **Tidak memerlukan setup server database tambahan**, sehingga langsung aktif dan stabil saat diakses penguji.
   * Dilengkapi fitur **Export CSV** untuk laporan unduhan berkas fisik serta tombol **Reset Data** ke konfigurasi awal standar.
2. **Secondary: Supabase Cloud Database (PostgreSQL)**
   * Disediakan endpoint sinkronisasi cloud menggunakan tabel `lab_state`.
   * Pengguna Admin dapat mengaktifkan sinkronisasi kapan saja melalui menu popup **Penyimpanan Cloud** pada sidebar.

---

## 🚀 Fitur Utama Sistem

### 1. Autentikasi & Proteksi Akses (Multi-Role)
* Login berbasis verifikasi `Username` dan `Password`.
* Proteksi sesi aktif: Pengguna tidak perlu login ulang jika browser tidak sengaja ditutup.
* Pemblokiran otomatis terhadap akun Staff yang berstatus nonaktif.

### 2. Dashboard Analitik Real-time
* Kartu metrik: **Total Unit Terlacak**, **Stok Tersedia**, **Sedang Dipinjam**, dan **Total Riwayat Transaksi**.
* Widget monitoring stok cepat untuk mengecek ketersediaan perlengkapan secara instan.
* Log aktivitas sistem real-time (*Audit Trail*).

### 3. Manajemen Inventaris (CRUD Barang)
* **Tambah, Ubah, & Hapus Barang** (Khusus Admin).
* Validasi proteksi penghapusan: Barang yang sedang dalam status dipinjam tidak dapat dihapus.
* Filter multi-kriteria: Pencarian teks instan, filter kategori alat, dan status stok (*Tersedia*, *Menipis*, *Habis*).

### 4. Sirkulasi Peminjaman Digital
* Input peminjam lengkap: Nama Peminjam, Kontak/WA, Keperluan, Tanggal Pinjam, dan Jumlah Barang.
* Validasi kuota: Sistem secara otomatis menolak transaksi jika jumlah yang dipinjam melebihi sisa stok yang tersedia.
* Mutasi stok otomatis berkurang secara atomik saat transaksi disimpan.

### 5. Sirkulasi Pengembalian Barang
* Tab khusus untuk memantau seluruh barang yang sedang beredar di luar laboratorium.
* Tombol konfirmasi pengembalian instan dengan opsi pencatatan kondisi barang (*Baik*, *Rusak Ringan*, *Rusak Berat*).
* Stok barang otomatis bertambah kembali dan status transaksi berubah menjadi **Selesai**.

### 6. Manajemen Pengguna / Staf (Khusus Admin)
* Tambah akun petugas laboratorium baru.
* Fitur aktivasi & penonaktifan akun staf tanpa menghapus riwayat transaksi lampau staf tersebut.

### 7. Ekspor Laporan & Cetak Dokumen
* Unduh rekapitulasi data peminjaman dalam format **CSV (Excel Ready)**.
* Fitur cetak ramah printer (*Print Friendly Stylesheet*) untuk bukti fisik transaksi.

---

## 👥 Matriks Hak Akses (RBAC)

Sistem menerapkan pemisahan tugas ketat (*Separation of Duties*) antara Administrator dan Petugas Staf Operasional:

| Fitur / Modul | Administrator | Petugas Staff |
|---|:---:|:---:|
| Lihat Dashboard Analitik | ✅ | ✅ |
| Monitoring Stok Barang | ✅ | ✅ |
| Tambah / Edit / Hapus Master Barang | ✅ | ❌ |
| Mencatat Peminjaman Baru | ✅ | ✅ |
| Memproses Pengembalian Barang | ✅ | ✅ |
| Mengunduh Laporan CSV | ✅ | ✅ |
| Menambah & Mengelola Akun Staf | ✅ | ❌ |
| Mengaktifkan / Menonaktifkan Akun Staf | ✅ | ❌ |
| Konfigurasi Cloud Database | ✅ | ❌ |

---

## 📦 Data Awal Barang (Master Data)

Sistem telah diisi dengan data awal barang inventaris laboratorium komputer standar:

| Kode Barang | Nama Perangkat | Kategori | Stok Awal | Lokasi Rak |
|:---:|---|---|:---:|:---:|
| **BR001** | Laptop Lenovo | Laptop | 5 Unit | Rak A-01 |
| **BR002** | Mouse Logitech | Periferal | 10 Unit | Laci B-01 |
| **BR003** | Keyboard Mechanical | Periferal | 8 Unit | Laci B-02 |
| **BR004** | Proyektor Epson | Proyektor | 3 Unit | Lemari C-01 |
| **BR005** | Monitor LG | Monitor | 6 Unit | Rak A-02 |
| **BR006** | Router Mikrotik RB951Ui | Perangkat Jaringan | 7 Unit | Lemari Net-01 |
| **BR007** | Switch Cisco Catalyst 24-Port | Perangkat Jaringan | 4 Unit | Rak Server 01 |
| **BR008** | Crimping Tool & LAN Tester Set | Perangkat Jaringan | 12 Unit | Toolbox 02 |
| **BR009** | Kabel HDMI 5 Meter High Speed | Aksesoris | 14 Unit | Laci C-03 |
| **BR010** | Webcam Logitech C920 Pro HD | Periferal | 6 Unit | Lemari C-02 |
| **BR011** | Laptop ASUS ROG Zephyrus (Lab AI) | Laptop | 4 Unit | Safe Box A |
| **BR012** | Access Point Ubiquiti UniFi AP | Perangkat Jaringan | 5 Unit | Rak Net-02 |

---

## 💻 Cara Menjalankan Secara Lokal

Aplikasi tidak memerlukan kompilasi atau instalasi pustaka backend:

### Metode 1: Menggunakan Local Web Server (Laragon / XAMPP)
1. Salin atau clone repositori ini ke folder root web server:
   ```bash
   git clone https://github.com/m-salman-alfarisi/Lab_Inventory.git C:/laragon/www/lab-inventory
   ```
2. Pastikan web server (Apache) menyala.
3. Buka browser dan arahkan ke:
   ```
   http://localhost/lab-inventory/index.html
   ```

### Metode 2: Langsung Buka File (Tanpa Server)
1. Unduh repositori sebagai berkas ZIP dan ekstrak.
2. Klik ganda pada berkas [`index.html`](index.html) atau [`login.html`](login.html) untuk langsung membukanya di browser apa pun (Google Chrome, Edge, Firefox, Safari).

---

## 📂 Struktur Direktori Proyek

```text
Lab_Inventory/
├── index.html         # Landing page publik & showcase cek ketersediaan barang live
├── login.html         # Halaman autentikasi & dashboard utama aplikasi SIMLAB
├── README.md          # Dokumentasi teknis dan panduan pengumpulan proyek
├── css/
│   └── style.css      # Styling kustom tambahan & konfigurasi cetak (print stylesheet)
└── js/
    ├── app.js         # Pengendali aplikasi (UI logic, event handler, render tables)
    └── data.js        # Engine data storage (LocalStorage CRUD, seed data, Cloud sync)
```

---

## 📋 Format Pengumpulan Tugas

* **Nama Lengkap**: Muhammad Salman Alfarisi
* **URL Aplikasi (Hosting Vercel)**: [https://simlab-inventory-three.vercel.app/](https://simlab-inventory-three.vercel.app/)
* **URL Alternatif (GitHub Pages)**: [https://m-salman-alfarisi.github.io/Lab_Inventory/](https://m-salman-alfarisi.github.io/Lab_Inventory/)
* **URL Repository GitHub**: [https://github.com/m-salman-alfarisi/Lab_Inventory](https://github.com/m-salman-alfarisi/Lab_Inventory)
* **Akun Demo Admin**: `admin` (atau `admin.lab@univ.ac.id`) | Password: `password123`
* **Akun Demo Staff**: `staff` (atau `siti.lab@univ.ac.id`) | Password: `password123`
* **Teknologi yang Digunakan**: HTML5, Tailwind CSS, Vanilla JavaScript (ES6+), Font Awesome 6 Icons, LocalStorage Persistence + Supabase PostgreSQL Cloud Database, Vercel & GitHub Pages Hosting.
