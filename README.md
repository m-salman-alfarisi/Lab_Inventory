# SIMLAB — Laboratory Inventory & Borrowing Management System

Aplikasi web pengelolaan inventaris peralatan laboratorium komputer serta pencatatan transaksi peminjaman dan pengembalian secara digital untuk **Coding Talent Challenge**.

---

## A. Fitur Utama yang Diimplementasikan

1. **Authentication & Authorization (Multi-Role)**
   - Login menggunakan username & password (dilengkapi tombol **Quick Demo Login** untuk kemudahan pengujian dosen).
   - Pembatasan hak akses ketat berdasarkan role (**ADMIN** vs **STAFF**).
   - Sesi login & seluruh perubahan data tetap tersimpan meskipun browser ditutup (`LocalStorage` + dukungan sinkronisasi **Supabase Cloud**).
2. **Dashboard**
   - Menampilkan **Total Barang**, **Jumlah Barang Tersedia**, **Jumlah Barang Dipinjam**, **Total Transaksi Peminjaman**, dan **Ringkasan Aktivitas Terbaru** secara real-time.
3. **Manajemen Barang (Inventaris)**
   - **Admin**: Tambah barang, Edit barang, Hapus barang (dengan proteksi barang yang sedang dipinjam).
   - **Admin & Staff**: Pencarian barang, filter berdasarkan kategori & status stok, serta informasi lengkap kode, nama, kategori, lokasi, dan stok.
4. **Manajemen Peminjaman (Admin & Staff)**
   - Input nama peminjam, kontak, keperluan, pilih barang (hanya barang dengan stok > 0), input jumlah barang (validasi otomatis terhadap sisa stok), tanggal peminjaman, simpan transaksi, dan pemantauan status transaksi (`Dipinjam` / `Selesai`).
   - Stok barang otomatis berkurang saat transaksi disimpan.
5. **Pengembalian Barang (Admin & Staff)**
   - Melihat daftar barang yang sedang dipinjam, memproses pengembalian dengan konfirmasi kondisi barang, otomatis memperbarui (menambah kembali) jumlah stok barang, dan mengubah status transaksi menjadi `Selesai`.
6. **Manajemen Pengguna (Khusus Admin)**
   - Menambah akun Staff baru, melihat daftar pengguna, mengubah data pengguna, serta mengaktifkan atau menonaktifkan akun Staff (akun Staff yang nonaktif otomatis ditolak saat mencoba login).

---

## B. Data Awal Barang

| Kode  | Nama Barang                         | Kategori           | Stok Awal |
|-------|-------------------------------------|--------------------|-----------|
| BR001 | Laptop Lenovo                       | Laptop             | 5         |
| BR002 | Mouse Logitech                      | Periferal          | 10        |
| BR003 | Keyboard Mechanical                 | Periferal          | 8         |
| BR004 | Proyektor Epson                     | Proyektor          | 3         |
| BR005 | Monitor LG                          | Monitor            | 6         |
| BR006 | Router Mikrotik RB951Ui             | Perangkat Jaringan | 7         |
| BR007 | Switch Cisco Catalyst 24-Port       | Perangkat Jaringan | 4         |
| BR008 | Crimping Tool & LAN Tester Set      | Perangkat Jaringan | 12        |
| BR009 | Kabel HDMI 5 Meter High Speed       | Aksesoris          | 14        |
| BR010 | Webcam Logitech C920 Pro HD         | Periferal          | 6         |
| BR011 | Laptop ASUS ROG Zephyrus (Lab AI)   | Laptop             | 4         |
| BR012 | Access Point Ubiquiti UniFi AP      | Perangkat Jaringan | 5         |

---

## C. Akun Demo Pengujian

| Role  | Username | Password      | Status   | Hak Akses                                                                 |
|-------|----------|---------------|----------|---------------------------------------------------------------------------|
| ADMIN | `admin`  | `password123` | Aktif    | Akses penuh (Dashboard, CRUD Barang, Peminjaman, Pengembalian, Manage Staff) |
| STAFF | `staff`  | `password123` | Aktif    | Operasional (Dashboard, Lihat Barang, Peminjaman, Pengembalian, Riwayat)  |
| STAFF | `siti`   | `password123` | Aktif    | Operasional Staff                                                         |
| STAFF | `budi`   | `password123` | Nonaktif | Contoh akun Staff yang dinonaktifkan (tidak dapat login)                  |

---

## D. Panduan Hosting Publik (Vercel / Netlify)

### Opsi 1: Deploy ke Netlify (Paling Cepat - Drag & Drop / CLI)
1. Buka [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Tarik (drag & drop) folder `lab-inventory` ke halaman tersebut.
3. Aplikasi langsung online dengan URL publik `https://nama-aplikasi.netlify.app`.

### Opsi 2: Deploy ke Vercel (Via GitHub atau Vercel CLI)
1. Push folder `lab-inventory` ke repository GitHub Anda.
2. Buka [https://vercel.com/new](https://vercel.com/new) dan import repository tersebut.
3. Klik **Deploy** — aplikasi langsung online.

---

## E. Format Pengumpulan (Bagian G)

1. **Nama Lengkap**: `[Isi Nama Lengkap Anda]`
2. **NIM**: `[Isi NIM Anda]`
3. **URL Aplikasi (Hosting)**: `[Isi URL Vercel / Netlify Anda]`
4. **URL Repository GitHub**: `[Isi URL GitHub Anda]`
5. **Akun Demo Admin**: Username: `admin` | Password: `password123`
6. **Akun Demo Staff**: Username: `staff` | Password: `password123`
7. **Teknologi yang Digunakan**: HTML5, Tailwind CSS, Vanilla JavaScript (ES6+), FontAwesome Icons, LocalStorage Persistence + Supabase REST API Cloud Sync, Vercel/Netlify Hosting.
