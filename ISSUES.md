# CyAsset — Draft Issues (dari PRD.md)

Breakdown vertical-slice dari `PRD.md`, disusun berdasarkan urutan dependensi (blocker dulu). Semua slice berstatus **AFK** (bisa dikerjakan & merge tanpa keputusan manusia lebih lanjut) karena keputusan desain (varian dashboard, kop surat) sudah difinalkan di PRD.

Belum dipublish ke issue tracker manapun — draft ini siap disalin begitu tracker sudah terhubung (`gh issue create`, Linear, dsb). Tambahkan label `needs-triage` saat publish sesuai alur triage standar.

---

## Issue 1 — Scaffold Proyek + Login Admin Sarpras ✅ SELESAI

**Tipe:** AFK
**User stories:** #1

### What to build
Inisialisasi proyek Next.js (App Router) + Tailwind CSS + Drizzle ORM + koneksi PostgreSQL. Setup NextAuth.js (Auth.js) dengan Credentials Provider, password di-hash bcrypt. Middleware melindungi seluruh route dashboard. Halaman login sesuai mockup S1 (username/email + password, panel highlight fitur). Seed satu akun Admin Sarpras awal untuk keperluan development/testing.

### Acceptance criteria
- [x] Skema database awal (tabel users/staf minimal) tersedia lewat migrasi Drizzle
- [x] Login berhasil dengan akun seed yang valid, redirect ke `/dashboard`
- [x] Login gagal dengan kredensial salah menampilkan pesan error, tidak membuat sesi
- [x] Akses ke route dashboard tanpa sesi login me-redirect ke `/login`
- [x] Halaman login secara visual mengikuti struktur mockup S1 (form kiri, panel highlight kanan)
- [x] Tema gelap (default) & terang bisa ditoggle dan tersimpan preferensinya

### Blocked by
None — can start immediately

---

## Issue 2 — Akun Staf: CRUD & Jejak Audit ✅ SELESAI

**Tipe:** AFK
**User stories:** #2, #3, #4

### What to build
Halaman Akun Staf (mockup S12): daftar akun dengan status Aktif/Nonaktif dan aktivitas terakhir. Admin Sarpras bisa membuat akun staf baru dan menonaktifkan akun (bukan hapus). Pola `createdBy`/`updatedBy` diterapkan sebagai konvensi generik yang akan dipakai modul-modul berikutnya (Barang, Peminjaman, Laporan Kerusakan) untuk mencatat aktor.

### Acceptance criteria
- [x] Admin Sarpras bisa membuat akun staf baru (username, email, password) dan langsung bisa login dengan akun tsb
- [x] Admin Sarpras bisa menonaktifkan akun staf; akun nonaktif tidak bisa login lagi tapi datanya tetap ada
- [x] Daftar akun menampilkan status (Aktif/Nonaktif) dan aktivitas terakhir sesuai mockup S12
- [x] Konvensi `createdBy`/`updatedBy` (kolom + helper) terdokumentasi dan siap dipakai modul lain
- [x] Akun tidak bisa menonaktifkan dirinya sendiri (mencegah admin terkunci keluar sistem)

### Blocked by
- Issue 1

---

## Issue 3 — Lokasi Hierarki: CRUD & Tree View ✅ SELESAI

**Tipe:** AFK
**User stories:** #5, #6, #7, #8, #9

### What to build
CRUD untuk 4 tabel/level lokasi relasional: Gedung, Lantai, Ruang, Sub-lokasi (opsional). Halaman Kelola Lokasi (mockup S10) dengan tampilan pohon (tree) yang bisa diperluas/diciutkan, plus panel detail ruang terpilih (total unit, jenis barang, sub-lokasi).

### Acceptance criteria
- [x] Admin Sarpras bisa CRUD Gedung, Lantai (di dalam Gedung), Ruang (di dalam Lantai), Sub-lokasi (di dalam Ruang, opsional)
- [x] Halaman Lokasi menampilkan struktur pohon 4 tingkat yang bisa expand/collapse sesuai mockup S10
- [x] Memilih sebuah Ruang menampilkan panel detail (total unit, jumlah jenis barang, daftar sub-lokasi) — nilai agregat boleh 0 di tahap ini karena modul Barang belum ada
- [x] Data lokasi tersedia sebagai sumber untuk dropdown berjenjang di modul lain (Gedung → Lantai → Ruang → Sub-lokasi) — relasi Drizzle (`gedung`/`lantai`/`ruang`/`subLokasi` + `relations()`) siap di-query modul Barang

### Blocked by
- Issue 1

---

## Issue 4 — Pendataan Barang: Form Tambah dengan Lokasi, Kondisi & Foto ✅ SELESAI

**Tipe:** AFK
**User stories:** #10, #11, #12, #13, #14

### What to build
Form pendataan barang baru (mockup S5): identitas barang (Nama, Merk/Tipe, Kode/No. Seri manual dengan validasi unik, Kategori, Spesifikasi Teknis), lokasi lewat 4 dropdown berjenjang, input Jumlah Unit + breakdown kondisi (Baik/Rusak Ringan/Rusak Berat) dengan validasi real-time bahwa totalnya harus sama dengan Jumlah Unit, dan upload foto kondisi ke disk lokal VPS.

### Acceptance criteria
- [x] Form menyimpan barang baru dengan seluruh field identitas, lokasi (via dropdown berjenjang), dan breakdown kondisi
- [x] Kode/No. Seri divalidasi unik; input dengan kode yang sudah ada ditolak dengan pesan jelas
- [x] Validasi: submit ditolak jika Baik + Rusak Ringan + Rusak Berat ≠ Jumlah Unit, dengan indikator visual (seperti chip "Total cocok" di mockup S5)
- [x] Foto kondisi bisa di-upload (jpg/png, validasi tipe & ukuran maksimum), tersimpan di disk lokal VPS dan terhubung ke barang
- [x] Kategori tersimpan sebagai field terpisah untuk keperluan filter/pengelompokan di modul lain
- [x] Barang baru tercatat `createdBy` sesuai akun Admin Sarpras yang menginputnya

### Blocked by
- Issue 1
- Issue 3

---

## Issue 5 — Daftar Barang: Pencarian & Filter ✅ SELESAI

**Tipe:** AFK
**User stories:** #17

### What to build
Halaman Daftar Barang (mockup S3): tabel barang dengan kolom breakdown kondisi bergambar bar dan kolom "Tersedia", pencarian teks (nama/kode/merk), serta filter berdasarkan kategori, lokasi, dan status kondisi.

### Acceptance criteria
- [x] Tabel menampilkan seluruh barang non-arsip dengan kolom sesuai mockup S3 (nama+kode, kategori, lokasi, jumlah, breakdown kondisi, tersedia)
- [x] Pencarian teks memfilter berdasarkan nama, kode, atau merk barang
- [x] Filter kategori, lokasi, dan kondisi bisa dikombinasikan dan hasil ter-update sesuai
- [x] Paginasi berfungsi untuk daftar barang yang panjang

Catatan: kolom "Tersedia" saat ini = jumlah unit berkondisi Baik (belum ada Peminjaman untuk dikurangi — akan disesuaikan begitu Issue 7 memperkenalkan pelacakan unit dipinjam).

### Blocked by
- Issue 4

---

## Issue 6 — Detail Barang: Edit & Arsip ✅ SELESAI

**Tipe:** AFK
**User stories:** #15, #16

### What to build
Halaman Detail Barang (mockup S4, tanpa tab riwayat — menyusul di Issue 11): identitas lengkap, ringkasan kondisi terkini, foto, kemampuan edit data barang, dan arsip (soft delete, bukan hapus permanen).

### Acceptance criteria
- [x] Halaman detail menampilkan identitas, lokasi, spesifikasi, foto, dan ringkasan kondisi terkini sesuai mockup S4
- [x] Admin Sarpras bisa mengedit data barang (identitas, lokasi, breakdown kondisi dengan validasi total yang sama seperti Issue 4)
- [x] Admin Sarpras bisa mengarsipkan barang; barang arsip tidak lagi muncul di Daftar Barang (Issue 5) tapi datanya tetap ada di database
- [x] Barang yang diarsipkan tidak bisa dipilih untuk peminjaman baru — mekanisme (`isArchived`) sudah tersedia; query pemilihan barang di Issue 7 wajib memfilter `isArchived = false`
- [x] Setiap edit & arsip tercatat `updatedBy` sesuai akun Admin Sarpras yang melakukannya

### Blocked by
- Issue 4

---

## Issue 7 — Peminjaman Internal: Catat, Kembalikan, Deteksi Terlambat ✅ SELESAI

**Tipe:** AFK
**User stories:** #19, #20, #21, #22, #23, #24

### What to build
Entitas Peminjaman dengan field `jenis` (internal/eksternal, field eksternal nullable untuk saat ini). Form & alur peminjaman internal (mockup S6, S7-internal): input peminjam, barang & jumlah, tujuan, tanggal pinjam & rencana kembali — langsung berstatus "Dipinjam" tanpa approval. Stok "tersedia" berkurang otomatis. Foto kondisi awal opsional saat serah terima. Pencatatan pengembalian (tanggal aktual + foto kondisi akhir opsional) mengembalikan stok tersedia. Deteksi "Terlambat" dihitung on-the-fly dari `tanggalRencanaKembali` dibanding tanggal hari ini.

### Acceptance criteria
- [x] Mencatat peminjaman internal baru langsung berstatus "Dipinjam", mengurangi stok "tersedia" pada barang terkait sejumlah yang dipinjam
- [x] Foto kondisi awal opsional bisa di-upload saat pencatatan peminjaman
- [x] Tombol "Kembalikan" mencatat tanggal pengembalian aktual + foto kondisi akhir opsional, mengembalikan stok "tersedia"
- [x] Peminjaman dengan `tanggalRencanaKembali` terlewat dan belum dikembalikan otomatis tertandai "Terlambat" (dihitung saat request, bukan job terjadwal)
- [x] Halaman Peminjaman (mockup S6) menampilkan tab Semua/Internal/Eksternal/Terlambat dengan jumlah masing-masing
- [x] Barang dengan stok tersedia 0 tidak bisa dipilih untuk peminjaman baru
- [x] Pencatatan peminjaman & pengembalian tercatat `createdBy`/`updatedBy` sesuai akun Admin Sarpras yang melakukannya

Catatan implementasi: "tersedia" dihitung on-the-fly (`jumlahBaik` barang dikurangi total unit pada peminjaman aktif via `getDipinjamMap`/query serupa) — Peminjaman tidak memutasi breakdown kondisi barang, hanya Laporan Kerusakan (Issue 10) yang melakukan itu. Kolom "Tersedia" di Daftar Barang & chip di Detail Barang (Issue 5 & 6) sudah disambungkan ke perhitungan real ini.

### Blocked by
- Issue 4

---

## Issue 8 — Peminjaman Eksternal: Generator Nomor Surat & Surat PDF Kop Klasik ✅ SELESAI

**Tipe:** AFK
**User stories:** #25, #26, #27, #28

### What to build
Perluasan Peminjaman untuk jalur eksternal (mockup S7-eksternal): field tambahan (Tujuan Peminjaman, Lokasi Pemanfaatan, Penanggung Jawab). Modul murni Generator Nomor Surat (format `{urut}/SARPRAS/CY/{bulan romawi}/{tahun}`, reset ke 001 tiap tahun baru, aman dari race condition lewat transaksi DB + unique constraint per tahun+urut). Komponen render Surat Peminjaman PDF kop klasik dinas (mockup S8a) via `@react-pdf/renderer`, dengan area tanda tangan tiga pihak kosong untuk cap basah. Alur ambil/kembali & dampak stok mengikuti pola yang sama dengan peminjaman internal (Issue 7).

### Acceptance criteria
- [x] Mencatat peminjaman eksternal menyimpan field tambahan (tujuan, lokasi pemanfaatan, penanggung jawab) dan otomatis generate nomor surat berurutan
- [x] Unit test Generator Nomor Surat mencakup: nomor pertama tahun baru = 001; increment benar dalam tahun yang sama; reset ke 001 saat pergantian tahun meski nomor tahun sebelumnya besar; format bulan romawi & padding angka benar
- [x] Dua peminjaman eksternal yang dicatat nyaris bersamaan tidak pernah menghasilkan nomor surat duplikat (diverifikasi dengan test konkurensi)
- [x] Surat Peminjaman PDF bisa diunduh/dicetak, mengikuti tata letak kop klasik dinas (mockup S8a): kop terpusat, nama yayasan & sekolah, tabel rincian barang, area TTD tiga pihak kosong
- [x] Stok "tersedia" berkurang/bertambah untuk peminjaman eksternal dengan logika yang sama seperti internal (Issue 7)
- [x] Nama Admin Sarpras yang menerbitkan surat (`createdBy` peminjaman) tampil sebagai "Petugas Sarpras" penandatangan di PDF

Catatan implementasi: generator nomor surat pakai `INSERT ... ON CONFLICT DO UPDATE` atomik (tabel `surat_counter`, 1 baris per tahun) — teruji aman lewat 8 unit test di `src/lib/nomor-surat.test.ts` (termasuk test konkurensi 25 panggilan paralel, semua urutan unik). PDF di-generate on-demand lewat route `GET /api/surat/[id]` (bukan disimpan sebagai file statis), sehingga "cetak ulang" (Issue 13) tinggal memanggil endpoint yang sama.

### Blocked by
- Issue 7

---

## Issue 9 — Laporan Kerusakan: Tiket & Papan Status Dasar ✅ SELESAI

**Tipe:** AFK
**User stories:** #29, #30, #34

### What to build
Entitas Laporan Kerusakan terhubung ke satu Barang, dengan status enum (Masuk, Diproses, Selesai, Ganti Unit). Form buat tiket (pilih barang dari daftar/pencarian, deskripsi keluhan, **jumlah unit terdampak**, **perkiraan tingkat kerusakan awal — Rusak Ringan/Rusak Berat**, upload foto bukti wajib) — jumlah & tingkat kerusakan diisi sekaligus saat tiket dibuat (status "Masuk"), bukan belakangan saat Diproses. Halaman papan status/board (mockup S9) dengan 4 kolom, serta filter status pada daftar tiket. Transisi status di slice ini murni mengubah status tiket — mutasi stok otomatis (Selesai/Ganti Unit) ditangani di Issue 10 menggunakan jumlah unit & tingkat kerusakan yang dicatat di sini.

### Acceptance criteria
- [x] Admin Sarpras bisa membuat tiket laporan kerusakan baru dengan barang, deskripsi, jumlah unit terdampak, tingkat kerusakan awal (Rusak Ringan/Rusak Berat), dan foto bukti (foto wajib, submit ditolak tanpa foto)
- [x] Jumlah unit terdampak divalidasi tidak melebihi jumlah unit barang yang berstatus Baik saat ini
- [x] Tiket baru berstatus "Masuk" secara default
- [x] Admin Sarpras bisa mengubah status tiket (Masuk → Diproses → Selesai / Ganti Unit) lewat papan/board sesuai mockup S9
- [x] Papan menampilkan tiket terkelompok per kolom status dengan jumlah tiket di tiap kolom, dan kartu tiket menampilkan jumlah unit + tingkat kerusakan (sesuai chip pada mockup S9, mis. "1 unit → Rusak Ringan")
- [x] Daftar/papan tiket bisa difilter berdasarkan status — papan itu sendiri sudah mengelompokkan per status; ditambah pencarian teks (kode tiket/nama barang/deskripsi)
- [x] Tiket baru tercatat `createdBy` sesuai akun Admin Sarpras yang membuatnya

Catatan: kode tiket (`#TK-0001`, dst) memakai generator berurutan global yang atomik (pola sama dengan nomor surat Issue 8). Kolom `mutasiDiterapkan` sudah disiapkan di skema untuk dipakai Issue 10 (idempotensi mutasi stok) — transisi status di issue ini belum memutasi breakdown kondisi barang sama sekali.

### Blocked by
- Issue 4

---

## Issue 10 — Logika Stok Laporan Kerusakan: Mutasi Otomatis & Unit Pengganti ✅ SELESAI

**Tipe:** AFK
**User stories:** #31, #32, #33

### What to build
Modul murni (deep module) "Logika Stok Laporan Kerusakan" yang menerima breakdown kondisi barang saat ini + jumlah unit terdampak & tingkat kerusakan yang dicatat pada tiket (Issue 9) + status baru tiket, dan mengembalikan breakdown yang sudah dimutasi. Diwire ke transisi status pada Issue 9: status "Selesai" memindahkan jumlah dari Rusak (Ringan/Berat, sesuai tingkat kerusakan tiket) kembali ke Baik; status "Ganti Unit" mengurangi Rusak Berat dari total unit (write-off). Pencatatan manual penambahan unit pengganti sebagai transaksi/penambahan qty terpisah setelah "Ganti Unit".

### Acceptance criteria
- [x] Unit test modul logika stok mencakup: transisi ke "Selesai" memindahkan jumlah dari Rusak ke Baik dengan benar; transisi ke "Ganti Unit" mengurangi Rusak Berat dari total unit tanpa memengaruhi kategori kondisi lain; total unit setelah mutasi tidak pernah minus atau melebihi jumlah asal; mutasi tidak dobel-terapkan jika status di-set ke nilai yang sama dua kali
- [x] Mengubah status tiket ke "Selesai" di UI (papan Issue 9) langsung terlihat memperbarui breakdown kondisi barang terkait sesuai jumlah unit & tingkat kerusakan yang tercatat di tiket (bisa diverifikasi di Detail Barang / Daftar Barang)
- [x] Mengubah status tiket ke "Ganti Unit" di UI langsung terlihat mengurangi Rusak Berat & total unit barang terkait
- [x] Admin Sarpras bisa mencatat penambahan unit pengganti secara manual sebagai entri qty baru setelah tiket berstatus "Ganti Unit", tercatat `createdBy`
- [x] Perubahan status tiket (dan mutasi stok yang menyertainya) tercatat `updatedBy` sesuai akun Admin Sarpras yang melakukannya

Catatan implementasi: modul murni `mutasiStokKerusakan` (`src/lib/logika-stok-kerusakan.ts`, 7 unit test) menerima `statusLama` & `statusBaru` secara eksplisit — pemanggil ("selesai"/"ganti_unit") hanya memutasi jika keduanya berbeda, sehingga "status di-set ke nilai sama dua kali" otomatis tidak bermutasi tanpa perlu flag tambahan di level pemanggil. `updateLaporanStatusAction` membaca breakdown barang saat ini, memanggil modul ini, lalu menulis hasilnya — diverifikasi end-to-end lewat skrip terhadap DB nyata (Selesai: Rusak Ringan → Baik; Ganti Unit: Rusak Berat & total unit berkurang; tambah unit pengganti menambah Jumlah Unit + Baik).

### Blocked by
- Issue 9

---

## Issue 11 — Detail Barang: Lengkapi Tab Riwayat Peminjaman & Kerusakan ✅ SELESAI

**Tipe:** AFK
**User stories:** #18

### What to build
Melengkapi halaman Detail Barang (Issue 6) dengan dua tab riwayat sesuai mockup S4: Riwayat Peminjaman (daftar peminjaman internal & eksternal atas barang ini) dan Riwayat Kerusakan (daftar tiket laporan kerusakan atas barang ini).

### Acceptance criteria
- [x] Tab "Riwayat Peminjaman" menampilkan seluruh peminjaman (internal & eksternal) yang melibatkan barang ini, dengan status masing-masing
- [x] Tab "Riwayat Kerusakan" menampilkan seluruh tiket laporan kerusakan atas barang ini, dengan status masing-masing
- [x] Kedua tab ter-update otomatis mengikuti data terbaru (tidak perlu cache manual) — data diambil langsung dari DB tiap render halaman (Server Component, tanpa cache manual)

### Blocked by
- Issue 6
- Issue 8
- Issue 10

---

## Issue 12 — Dashboard Ringkasan Gaya Editorial ✅ SELESAI

**Tipe:** AFK
**User stories:** #35

### What to build
Halaman Dashboard (mockup S2, varian editorial 2b): angka total unit besar sebagai fokus utama, breakdown kondisi di bawahnya, grid KPI ringkas (Sedang Dipinjam internal/eksternal, Terlambat, Tiket Aktif, Surat Bulan Ini), serta dua kolom "Butuh perhatian" (tiket & keterlambatan) dan "Peminjaman berjalan". Seluruhnya berbasis query agregasi read-only.

### Acceptance criteria
- [x] Angka total unit, breakdown kondisi, dan seluruh KPI menampilkan data agregat yang benar dari modul Barang, Peminjaman, dan Laporan Kerusakan
- [x] Kolom "Butuh perhatian" menampilkan tiket aktif & peminjaman terlambat, sesuai mockup S2b
- [x] Kolom "Peminjaman berjalan" menampilkan peminjaman yang sedang berjalan (internal & eksternal)
- [x] Layout mengikuti struktur editorial mockup S2b (bukan grid KPI padat 2a)

Diverifikasi dengan data seed (barang lintas kategori, peminjaman internal & eksternal aktif + terlambat, tiket aktif) — seluruh angka agregat (total unit, breakdown kondisi & persentase, jumlah gedung/ruang/kategori, KPI dipinjam/terlambat/tiket/surat) serta kedua daftar cocok dengan data di DB.

### Blocked by
- Issue 5
- Issue 8
- Issue 10

---

## Issue 13 — Ekspor Laporan, LIR & Cetak Ulang Surat ✅ SELESAI

**Tipe:** AFK
**User stories:** #36, #37, #38

### What to build
Halaman Ekspor & LIR (mockup S11): generator Laporan Inventaris Ruang (LIR) per ruang dalam PDF, generator Rekap Peminjaman dan Riwayat Perbaikan dalam PDF & Excel dengan filter rentang tanggal, serta tabel riwayat Surat Peminjaman Eksternal yang sudah terbit dengan opsi cetak ulang (reuse komponen PDF dari Issue 8).

### Acceptance criteria
- [x] Admin Sarpras bisa memilih Ruang dan mencetak LIR dalam format PDF berisi daftar barang + kondisi di ruang tersebut
- [x] Admin Sarpras bisa mengekspor Rekap Peminjaman untuk rentang tanggal tertentu dalam format PDF dan Excel
- [x] Admin Sarpras bisa mengekspor Riwayat Perbaikan untuk rentang tanggal tertentu dalam format PDF dan Excel
- [x] Tabel riwayat surat menampilkan seluruh surat peminjaman eksternal yang pernah terbit, dengan tombol "Cetak ulang" yang men-generate ulang PDF yang identik dengan aslinya — memakai ulang route `GET /api/surat/[id]` dari Issue 8 (bukan file statis), sehingga hasilnya selalu identik dengan surat asli

Catatan implementasi: Excel dibuat dengan `exceljs` (`src/lib/render-laporan-excel.ts`), PDF dengan `@react-pdf/renderer` lewat komponen tabel generik `LaporanTabelPdf` yang dipakai ulang untuk Rekap Peminjaman & Riwayat Perbaikan. Ketiga ekspor & tabel riwayat surat diverifikasi end-to-end (isi PDF dicek via `pdftotext`, isi Excel dicek via pembacaan ulang workbook) terhadap data seed nyata.

### Blocked by
- Issue 3
- Issue 5
- Issue 8
- Issue 10

---

## Issue 14 — Mode Pelacakan Barang: Skema Batch/Per-Unit & Form Tambah ✅ SELESAI

**Tipe:** AFK
**User stories:** #39, #40, #41 (sebagian — field unit disiapkan di sini, dikelola penuh di Issue 15)

### What to build
Tambah kolom `modePelacakan` (enum `batch`/`unit`) ke tabel `barang`, dan tabel baru `barang_unit` (sub-kode otomatis, nomor seri opsional, kondisi `baik`/`rusak_ringan`/`rusak_berat`/`hilang`/`diganti`, lokasi sendiri Gedung→Lantai→Ruang→Sub-lokasi, catatan) + `barang_unit_foto`. Form Tambah Barang (perluasan Issue 4) menambahkan pemilihan mode: mode Batch berperilaku identik dengan sekarang; mode Per-Unit menyembunyikan input breakdown manual, mengganti dengan input "jumlah unit awal" yang men-generate N baris `barang_unit` otomatis (kondisi awal `baik`, lokasi = lokasi form). Daftar Barang, Detail Barang (ringkasan), Dashboard, dan LIR dibuat menghitung breakdown kondisi barang mode Per-Unit secara on-the-fly dari agregat status unit, bukan dari kolom `jumlahBaik`/`jumlahRusakRingan`/`jumlahRusakBerat` yang dientri manual.

### Acceptance criteria
- [x] Form Tambah Barang punya pilihan mode Batch/Per-Unit; field breakdown manual tersembunyi & diganti input jumlah unit awal saat Per-Unit dipilih
- [x] Menyimpan barang Per-Unit menghasilkan N baris `barang_unit` dengan sub-kode berurutan (mis. `{kode}-U1`, `{kode}-U2`, ...), kondisi awal `baik`, lokasi sama dengan lokasi yang diisi di form
- [x] Mode barang terkunci setelah dibuat — field mode disabled saat edit (Issue 6)
- [x] Barang existing (dibuat sebelum fitur ini) di-backfill sebagai mode `batch` lewat migrasi, tidak ada perubahan perilaku untuk data lama
- [x] Breakdown kondisi (Baik/Rusak Ringan/Rusak Berat) yang ditampilkan di Daftar Barang, Detail Barang, Dashboard, dan LIR untuk barang mode Per-Unit dihitung otomatis dari agregat status `barang_unit` aktif (bukan `diganti`), konsisten dengan barang mode Batch yang tetap pakai kolom manual seperti sekarang

Catatan implementasi: breakdown mode Per-Unit tidak dihitung ulang di setiap baca (on-the-fly), melainkan disinkronkan & ditulis balik ke kolom `barang.jumlahUnit/jumlahBaik/jumlahRusakRingan/jumlahRusakBerat` lewat `syncBarangBreakdownFromUnits` (`src/lib/barang-unit.ts`) setiap kali unit dibuat/berubah — sehingga Daftar Barang, Detail Barang, Dashboard, dan LIR tidak perlu diubah sama sekali (tetap baca kolom yang sama seperti mode Batch). Trade-off ini dipilih karena banyak read path existing melakukan filter/agregasi SQL langsung di atas kolom tsb (mis. filter kondisi di Daftar Barang). Diverifikasi end-to-end lewat browser (buat barang mode Batch & Per-Unit, cek breakdown di Daftar Barang, buka halaman Edit untuk pastikan mode terkunci & breakdown tidak berubah setelah simpan) serta query langsung ke `barang_unit` di database.

### Blocked by
- Issue 4
- Issue 6

---

## Issue 15 — Detail Barang: Kelola Unit Individual (Mode Per-Unit) ✅ SELESAI

**Tipe:** AFK
**User stories:** #41

### What to build
Perluasan halaman Detail Barang (Issue 6) khusus barang mode Per-Unit: tabel/daftar seluruh unit fisik milik jenis barang tersebut (sub-kode, nomor seri, kondisi, lokasi, status, thumbnail foto), dengan kemampuan edit per unit (nomor seri, kondisi, lokasi Gedung/Lantai/Ruang/Sub-lokasi sendiri, upload foto individual, catatan bebas), termasuk menandai unit sebagai "Hilang" secara manual.

### Acceptance criteria
- [x] Detail Barang mode Per-Unit menampilkan daftar seluruh unit aktif (bukan `diganti`) dengan kolom sub-kode, nomor seri, kondisi, lokasi, status
- [x] Admin bisa mengedit nomor seri, kondisi, lokasi (4 dropdown berjenjang independen dari lokasi jenis barang), foto, dan catatan tiap unit secara individual
- [x] Admin bisa menandai unit sebagai "Hilang" secara manual dari halaman ini
- [x] Unit yang berstatus `diganti` (hasil alur Ganti Unit di Issue 17) tetap terlihat di daftar dengan penanda visual nonaktif, untuk keperluan audit histori
- [x] Setiap perubahan pada unit tercatat `updatedBy`

Catatan implementasi: `updateBarangUnitAction` (`src/app/(app)/barang/unit-actions.ts`) sengaja tidak mengizinkan kondisi `diganti` diset manual dari form ini — status itu cuma boleh terjadi lewat alur Ganti Unit di Laporan Kerusakan (Issue 17). Setiap perubahan kondisi memanggil ulang `syncBarangBreakdownFromUnits` dari Issue 14 supaya breakdown & "tersedia" di header Detail Barang selalu ikut ter-update. UI berupa expandable row (`src/components/barang/barang-unit-list.tsx`, satu unit diedit dalam satu waktu) yang reuse `LocationCascadeFields` & `PhotoUploadField` dari form Barang biasa. Foto unit disimpan di `public/uploads/barang/unit/` (nested di bawah subdir "barang") supaya otomatis ikut tercakup pengecualian publik `/uploads/barang/*` yang akan dibuat di Issue 18. Diverifikasi end-to-end lewat browser: buat barang Per-Unit via seed manual, buka Detail Barang, edit satu unit ke Rusak Ringan, breakdown "Kondisi terkini" & badge "tersedia" langsung ter-update sesuai.

### Blocked by
- Issue 14

---

## Issue 16 — Peminjaman: Pilih Unit Spesifik untuk Barang Mode Per-Unit ✅ SELESAI

**Tipe:** AFK
**User stories:** #42

### What to build
Perluasan skema `peminjaman_item` dengan kolom nullable `barangUnitId`. Form Peminjaman (internal & eksternal, Issue 7–8) menyesuaikan otomatis berdasarkan mode barang yang dipilih: barang Batch tetap input jumlah seperti sekarang; barang Per-Unit menampilkan multi-select unit (hanya unit berkondisi `baik` yang belum ada di peminjaman aktif manapun). Alur kembalikan tetap sama, unit yang dikembalikan kembali muncul sebagai pilihan tersedia.

### Acceptance criteria
- [x] Form Peminjaman untuk barang Per-Unit menampilkan daftar unit yang bisa dipilih (bukan input jumlah), hanya unit `baik` & belum dipinjam yang muncul
- [x] Satu unit tidak bisa muncul di lebih dari satu peminjaman aktif sekaligus
- [x] Mengembalikan peminjaman yang berisi unit Per-Unit membuat unit itu kembali tersedia untuk dipinjam
- [x] Barang mode Batch tidak berubah perilakunya (tetap input jumlah, logika Issue 7–8 utuh)
- [x] Riwayat Peminjaman di Detail Barang (Issue 11) & Detail unit (Issue 15) menampilkan peminjaman yang melibatkan unit tersebut

Catatan implementasi: `peminjaman_item.barangUnitId` nullable (migrasi `0009_curly_tony_stark.sql`); item Per-Unit selalu `jumlah=1`. `PeminjamanItemPicker` (dipakai bersama oleh form internal & eksternal) menampilkan sub-picker unit untuk barang mode Per-Unit, tanpa mengubah alur barang mode Batch. `getBarangOptions()` (`src/lib/stok.ts`) jadi satu sumber kebenaran barang yang bisa dipilih di kedua form, menggantikan duplikasi query yang sebelumnya ada di masing-masing halaman `baru/page.tsx`. `getDipinjamUnitSet()` menyaring unit yang sedang dipinjam baik di picker maupun validasi server-side (`validateItemsStock`), termasuk cek race condition sederhana (unit dipilih dobel dalam satu submit). Detail Barang menambahkan badge "Dipinjam" per unit dan kolom "Jumlah / Unit" di tab Riwayat Peminjaman. **Bug ditemukan & diperbaiki selama verifikasi:** query Riwayat Peminjaman di Detail Barang sebelumnya memakai `peminjaman.id` sebagai React key — begitu satu peminjaman punya lebih dari satu item dari barang yang sama (baru mungkin terjadi sejak fitur unit ini), muncul duplicate-key warning; diperbaiki dengan memakai `peminjamanItem.id` sebagai key. Diverifikasi end-to-end lewat browser: pinjam 2 unit sekaligus dalam satu peminjaman, cek locking (unit hilang dari picker & badge Dipinjam tampil), kembalikan, cek unit tersedia lagi; regresi barang mode Batch (input jumlah) dicoba ulang dan tetap normal.

### Blocked by
- Issue 7
- Issue 8
- Issue 14
- Issue 15

---

## Issue 17 — Laporan Kerusakan per Unit & Alur Ganti Unit ✅ SELESAI

**Tipe:** AFK
**User stories:** #43

### What to build
Form Laporan Kerusakan (Issue 9) untuk barang Per-Unit mengganti input "jumlah unit terdampak" dengan pilihan tepat satu unit spesifik. Transisi status "Selesai" mengubah kondisi unit terkait menjadi `baik` (perluasan modul `mutasiStokKerusakan` dari Issue 10, sekarang menerima jalur per-unit selain per-agregat). Transisi status "Ganti Unit" mengubah kondisi unit menjadi `diganti` (write-off, nonaktif tapi datanya tetap tersimpan) dan menyediakan aksi "Tambah Unit Pengganti" yang membuat satu baris `barang_unit` baru (sub-kode lanjut) — satu-satunya jalur penambahan unit ke barang Per-Unit yang sudah ada di luar pembuatan awal (Issue 14).

### Acceptance criteria
- [x] Form Laporan Kerusakan untuk barang Per-Unit mewajibkan pilih tepat satu unit (bukan jumlah unit terdampak); barang Batch tidak berubah (tetap seperti Issue 9)
- [x] Mengubah status tiket ke "Selesai" mengubah kondisi unit terkait menjadi `baik`, terlihat langsung di Detail Barang/unit (Issue 15)
- [x] Mengubah status tiket ke "Ganti Unit" mengubah kondisi unit terkait menjadi `diganti`, unit itu keluar dari hitungan stok aktif & pilihan peminjaman (Issue 16), tapi tetap terlihat di daftar unit dengan penanda nonaktif
- [x] Admin bisa menambahkan unit pengganti setelah "Ganti Unit" lewat aksi terpisah, tercatat `createdBy`, dengan sub-kode lanjut dari unit terakhir
- [x] Mutasi tidak dobel-terapkan jika status di-set ke nilai yang sama dua kali (konsisten dengan unit test modul `mutasiStokKerusakan` di Issue 10)

Catatan implementasi: `laporan_kerusakan.barangUnitId` nullable (migrasi `0010_romantic_klaw.sql`). Untuk tiket Per-Unit, `updateLaporanStatusAction` bercabang lewat `tiket.barangUnitId` — bukan memanggil `mutasiStokKerusakan` (murni untuk agregat mode Batch), melainkan langsung set `barangUnit.kondisi` ("selesai" → `baik`, "ganti_unit" → `diganti`) lalu memanggil `syncBarangBreakdownFromUnits` (Issue 14) supaya breakdown `barang` ikut ter-update. Guard `statusLama === statusBaru` di awal fungsi (sudah ada dari Issue 9/10) otomatis mencegah dobel-mutasi untuk kedua mode tanpa perlu logika tambahan. `nextSubKode()` (`src/lib/barang-unit.ts`) menghitung sub-kode berikutnya dari suffix numerik tertinggi yang ada (termasuk unit `diganti`, supaya tidak pernah tabrakan), dipakai `tambahUnitPenggantiAction` saat `tiket.barangUnitId` terisi — jalur ini menambah tepat 1 unit baru (bukan increment count seperti mode Batch). `BarangPicker` & `LaporanForm` di-refactor jadi controlled component (value/onChange dari parent) supaya form bisa menampilkan dropdown "Unit" & menyembunyikan "Jumlah Unit Terdampak" begitu barang mode Per-Unit dipilih. Diverifikasi end-to-end lewat browser: buat tiket untuk 1 unit → ubah ke Selesai (unit kembali Baik) → buat tiket kedua untuk unit lain → ubah ke Ganti Unit (unit jadi `diganti`, breakdown & Total Unit ikut berkurang lalu bertambah lagi) → tambah unit pengganti (sub-kode lanjut otomatis, muncul di Detail Barang) → cek unit `diganti` tampil dengan penanda "Diganti (nonaktif)" tanpa tombol Edit (dari Issue 15).

### Blocked by
- Issue 9
- Issue 10
- Issue 14
- Issue 15

---

## Issue 18 — QR Code Publik: Card Barang/Unit/Prasarana & Cetak ✅ SELESAI

**Tipe:** AFK
**User stories:** #44, #45

### What to build
Route publik read-only tanpa login: `/s/barang/[id]` (jenis barang mode Batch), `/s/unit/[id]` (unit fisik mode Per-Unit), `/s/prasarana/[id]` (catatan prasarana) — masing-masing menampilkan halaman card berisi identitas, spesifikasi, kondisi, lokasi lengkap, dan foto (fallback ke foto jenis barang jika unit belum punya foto sendiri); tanpa riwayat peminjaman/kerusakan (privasi) dan tanpa field finansial pada prasarana (sumber dana, periode dana, nominal dana). Unit mode Per-Unit menampilkan status pemakaian (Tersedia/Sedang Dipinjam/Hilang/kondisi rusak) tanpa nama peminjam. Barang/prasarana `isArchived` menampilkan 404; unit `diganti` menampilkan halaman "tidak aktif" (bukan 404). Tambah env var `APP_URL` sebagai basis encode URL QR, tambah library QR Code generation server-side, dan perluas matcher `src/proxy.ts` agar `/s/*`, `/uploads/barang/*`, dan `/uploads/prasarana/*` dikecualikan dari wajib-login (`/uploads/peminjaman/*` & `/uploads/laporan-kerusakan/*` tetap terproteksi). Tombol "Cetak QR" (satu label per klik, lewat `window.print()`) ditambahkan di Detail Barang (Batch), tiap baris unit di Detail Barang (Per-Unit, Issue 15), dan Detail Prasarana.

### Acceptance criteria
- [x] Scan QR barang mode Batch membuka `/s/barang/[id]` tanpa perlu login, menampilkan identitas, spesifikasi, kondisi agregat, lokasi lengkap, dan foto
- [x] Scan QR unit mode Per-Unit membuka `/s/unit/[id]` tanpa perlu login, menampilkan identitas jenis + data unit individual (sub-kode, nomor seri, kondisi, lokasi, foto, catatan) + status pemakaian (tanpa nama/kontak peminjam)
- [x] Scan QR prasarana membuka `/s/prasarana/[id]` tanpa perlu login, menampilkan data non-finansial + foto
- [x] Barang/prasarana yang diarsipkan menampilkan halaman tidak ditemukan (404) saat di-scan; unit berstatus `diganti` menampilkan halaman "sudah tidak aktif" (tetap 200, bukan 404)
- [x] Foto barang & prasarana (termasuk foto unit) bisa dimuat di halaman publik tanpa login; foto peminjaman & laporan kerusakan tetap tidak bisa diakses tanpa login (regression check pada `src/proxy.ts`)
- [x] Tombol "Cetak QR" di Detail Barang/unit/Prasarana men-generate & menampilkan QR yang siap dicetak (via dialog print browser), berisi QR + nama + kode
- [x] `APP_URL` dipakai sebagai basis URL yang di-encode ke QR, terdokumentasi di `.env.example`

Catatan implementasi: `src/lib/qr.ts` (pakai library `qrcode` — ditambahkan ke `package.json`) membangun URL publik dari `APP_URL` lalu meng-encode-nya jadi data URL PNG, dipakai langsung di halaman cetak (server component, tanpa route API terpisah). Tiga halaman publik di `src/app/s/{barang,unit,prasarana}/[id]/page.tsx` berbagi satu layout tanpa sidebar (`src/app/s/layout.tsx`) dan primitif kartu (`src/components/public/card-primitives.tsx`). `src/proxy.ts` matcher diperluas mengecualikan `s/`, `uploads/barang/`, `uploads/prasarana/` dari wajib-login — diverifikasi lewat `curl` tanpa cookie sama sekali (200 utk ketiga rute publik, 404 utk id tidak ada, 307/redirect-login tetap utk `/dashboard` dan `/uploads/peminjaman|laporan-kerusakan`, jadi regresi foto internal terjaga). Halaman "Cetak QR" (`/barang/[id]/cetak-qr?unit=`, `/prasarana/[id]/cetak-qr`) tetap di balik login (admin-only) dan pakai `window.print()` browser + CSS `@media print` (`aside` & `.print-hide` disembunyikan) — bukan PDF generator terpisah, sesuai keputusan "satu label per klik, tanpa cetak massal". Tombol "Cetak QR" muncul di header Detail Barang hanya utk mode Batch, dan per baris di tabel Unit Fisik utk mode Per-Unit (unit `diganti` tidak dapat tombol karena sudah nonaktif); "Cetak QR" juga ditambahkan ke row-menu Prasarana. Diverifikasi end-to-end: card publik tampil benar via browser (termasuk badge status pemakaian unit), field finansial prasarana dipastikan tidak muncul di HTML respons (`curl | grep` tidak menemukan istilah sumber dana/nominal), dan halaman cetak QR menampilkan QR + label sesuai kode/sub-kode.

### Blocked by
- Issue 6
- Issue 14
- Issue 15
- Modul Prasarana (sudah terimplementasi di working tree saat ini, di luar Issue 1–13 yang tercatat sebelumnya di dokumen ini)
