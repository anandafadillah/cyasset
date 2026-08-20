# PRD: CyAsset — Aplikasi Manajemen Sarana Prasarana SMK Cyber Media

## Pernyataan Masalah

Petugas Sarana Prasarana (Sarpras) SMK Cyber Media saat ini mengelola data barang, peminjaman, dan laporan kerusakan secara manual (kertas/spreadsheet terpisah-pisah). Ini menyulitkan:

- Melacak lokasi & kondisi barang secara akurat (barang tersebar di banyak gedung/lantai/ruang/lemari).
- Mengetahui barang mana yang sedang dipinjam (di dalam maupun di luar sekolah) dan kapan harus kembali.
- Menerbitkan surat resmi untuk peminjaman ke luar sekolah secara cepat dan konsisten formatnya.
- Menindaklanjuti laporan kerusakan barang secara terstruktur (ada laporan masuk, tapi tidak jelas statusnya sampai mana).
- Menyediakan laporan rekap yang rapi untuk pimpinan (inventaris per ruang, riwayat peminjaman, riwayat perbaikan) tanpa harus rekap manual dari banyak sumber.

## Solusi

CyAsset adalah aplikasi web internal (Next.js + PostgreSQL) yang dioperasikan sepenuhnya oleh **Admin Sarpras** sebagai satu-satunya role berlogin di sistem. Guru, siswa, Kakomli, pihak luar sekolah, dan pimpinan **tidak memiliki akun** — mereka berinteraksi dengan Admin secara langsung/lisan/WhatsApp, dan Admin yang mencatatkan semuanya ke sistem. Ini menyederhanakan sistem menjadi alat pencatatan & pelaporan internal, bukan portal self-service multi-pihak.

Cakupan utama:

1. **Pendataan barang** berbasis form dengan hierarki lokasi 4 tingkat, foto, dan breakdown kondisi (Baik/Rusak Ringan/Rusak Berat) per jumlah unit (model batch/quantity, bukan per-unit individual).
2. **Peminjaman** dua jalur: internal (dalam sekolah) dan eksternal (luar sekolah, dengan generate Surat Peminjaman PDF resmi bernomor otomatis).
3. **Pelaporan kerusakan** berbasis tiket dengan alur status dan dampak otomatis ke stok kondisi barang.
4. **Dashboard & ekspor laporan** (LIR, rekap peminjaman, rekap perbaikan) untuk kebutuhan pimpinan.

## Desain Antarmuka (UI Mockup)

Mockup statis (`UI mockups untuk Cyasset.zip`) sudah dibuat untuk seluruh alur di atas dan menjadi acuan visual/IA untuk implementasi. Mockup mencakup 12 layar, dengan tema gelap (default) & terang yang bisa ditoggle, kepadatan *comfortable*, tipografi Inter, dan ikon Phosphor Icons.

**Struktur navigasi (sidebar kiri, persisten di semua layar):**
- **Dashboard** — ringkasan tunggal (bukan grup)
- **Inventaris** — Barang, Lokasi
- **Transaksi** — Peminjaman, Laporan Kerusakan (dengan badge jumlah tiket aktif)
- **Laporan** — Ekspor & LIR, Akun Staf

Topbar tiap halaman berisi judul + breadcrumb ringkas, kolom pencarian global, dan ikon notifikasi. Panel profil staf (avatar inisial + nama + role) ditempatkan di footer sidebar.

**Daftar layar mockup:**

| ID | Layar | Cakupan |
|----|-------|---------|
| S1 | Login | Form username/email + password (NextAuth Credentials), panel highlight fitur di sisi kanan |
| S2 | Dashboard Ringkasan | **Gaya editorial terpilih (2b):** angka total unit besar sebagai fokus utama, breakdown kondisi (Baik/Rusak Ringan/Rusak Berat) di bawahnya, grid kecil KPI (Sedang Dipinjam, Terlambat, Tiket Aktif, Surat Bulan Ini), lalu dua kolom "Butuh perhatian" (tiket & keterlambatan) dan "Peminjaman berjalan" |
| S3 | Daftar Barang | Tabel dengan pencarian + filter (kategori, lokasi, kondisi), kolom breakdown kondisi bergambar bar, kolom "Tersedia" |
| S4 | Detail Barang | Foto kondisi, ringkasan kondisi terkini, identitas lengkap, tab riwayat Peminjaman/Kerusakan |
| S5 | Form Pendataan Barang | Identitas, lokasi berjenjang 4 dropdown, input Jumlah & breakdown kondisi dengan validasi total real-time, upload foto |
| S6 | Peminjaman (list) | Tab Semua/Internal/Eksternal/Terlambat, baris terlambat ditandai visual, aksi cepat "Kembalikan" |
| S7 | Form Peminjaman Eksternal | Toggle Internal/Eksternal, field khusus eksternal, picker barang multi-item dengan stok tersedia, preview nomor surat otomatis sebelum diterbitkan |
| S8 | Surat Peminjaman (PDF) | **Gaya kop klasik dinas terpilih (8a):** kop terpusat dengan logo, nama yayasan & sekolah, font serif formal, tabel rincian barang, area tanda tangan tiga pihak (peminjam, petugas Sarpras, kepala sekolah) kosong untuk cap basah |
| S9 | Laporan Kerusakan | Papan/board 4 kolom sesuai status (Masuk → Diproses → Selesai / Ganti Unit), tiap kartu menampilkan dampak mutasi stok |
| S10 | Kelola Lokasi | Struktur pohon (tree) Gedung → Lantai → Ruang → Sub-lokasi yang bisa diperluas/diciutkan, panel detail ruang terpilih |
| S11 | Ekspor & LIR | Tiga kartu aksi (LIR per ruang, Rekap Peminjaman, Riwayat Perbaikan) dengan filter tanggal/ruang dan pilihan format PDF/Excel, tabel riwayat surat terbit dengan cetak ulang |
| S12 | Akun Staf | Tabel akun dengan status Aktif/Nonaktif, aktivitas terakhir, catatan bahwa aksi tercatat by createdBy/updatedBy |

**Keputusan varian terpilih** (mockup menyediakan dua alternatif untuk dua layar, sudah diputuskan):
- Dashboard (S2): **gaya editorial (2b)** — fokus satu angka utama & narasi ringkas, bukan grid KPI padat (2a).
- Surat Peminjaman PDF (S8): **gaya kop klasik dinas (8a)** — kop terpusat, font serif, mengikuti konvensi surat dinas resmi, bukan gaya kop modern berwarna (8b).

Mockup ini bersifat acuan visual & IA (informasi arsitektur), bukan spesifikasi piksel-presisi — detail implementasi (spacing, breakpoint responsive, state kosong/error) mengikuti konvensi Tailwind CSS saat pengembangan.

## User Stories

### Autentikasi & Manajemen Akun
1. Sebagai Admin Sarpras, saya ingin login dengan username/email dan password, sehingga hanya staf berwenang yang bisa mengakses sistem.
2. Sebagai Admin Sarpras, saya ingin membuat akun staf Sarpras lain, sehingga tim yang terdiri lebih dari satu orang bisa memakai sistem secara bersamaan dengan akun masing-masing.
3. Sebagai Admin Sarpras, saya ingin menonaktifkan akun staf yang sudah tidak bertugas, sehingga akses ke sistem tetap terkendali.
4. Sebagai Admin Sarpras, saya ingin setiap aksi penting (input barang, proses peminjaman, proses laporan) tercatat oleh akun siapa yang melakukannya, sehingga ada jejak audit yang jelas.

### Hierarki Lokasi
5. Sebagai Admin Sarpras, saya ingin mengelola daftar Gedung, sehingga saya bisa merepresentasikan struktur fisik sekolah.
6. Sebagai Admin Sarpras, saya ingin mengelola daftar Lantai di dalam sebuah Gedung, sehingga hierarki lokasi lebih detail.
7. Sebagai Admin Sarpras, saya ingin mengelola daftar Ruang di dalam sebuah Lantai, sehingga saya bisa menentukan ruang spesifik tempat barang berada.
8. Sebagai Admin Sarpras, saya ingin mengelola Sub-lokasi (misal Lemari, Rak) di dalam sebuah Ruang secara opsional, sehingga posisi barang bisa lebih presisi tanpa harus diisi untuk semua barang.
9. Sebagai Admin Sarpras, saya ingin memilih lokasi barang lewat dropdown berjenjang (Gedung → Lantai → Ruang → Sub-lokasi), sehingga input lokasi cepat dan konsisten.

### Pendataan Barang
10. Sebagai Admin Sarpras, saya ingin mendata barang baru lewat form digital, sehingga semua identitas barang tercatat rapi.
11. Sebagai Admin Sarpras, saya ingin mengisi Nama Barang, Merk/Tipe, Kode/Nomor Seri (manual), Jumlah Unit, Kategori, dan Spesifikasi Teknis saat mendata barang, sehingga informasi barang lengkap.
12. Sebagai Admin Sarpras, saya ingin meng-upload foto kondisi fisik barang saat pendataan, sehingga ada bukti visual kondisi awal barang.
13. Sebagai Admin Sarpras, saya ingin menentukan lokasi barang lewat hierarki 4 tingkat, sehingga saya tahu persis di mana barang tersebut berada.
14. Sebagai Admin Sarpras, saya ingin mencatat kondisi barang sebagai breakdown angka (jumlah Baik, jumlah Rusak Ringan, jumlah Rusak Berat) yang totalnya harus sama dengan Jumlah Unit, sehingga kondisi barang massal tetap akurat direpresentasikan.
15. Sebagai Admin Sarpras, saya ingin mengedit data barang yang sudah ada, sehingga saya bisa memperbarui informasi jika ada perubahan.
16. Sebagai Admin Sarpras, saya ingin mengarsipkan (bukan menghapus permanen) barang yang sudah tidak ada/dipakai lagi, sehingga riwayat peminjaman dan laporan kerusakan yang terkait tetap utuh.
17. Sebagai Admin Sarpras, saya ingin mencari dan memfilter daftar barang (berdasarkan nama, kategori, lokasi, atau status kondisi), sehingga saya bisa cepat menemukan barang yang dicari.
18. Sebagai Admin Sarpras, saya ingin melihat detail satu barang beserta riwayat peminjaman dan riwayat laporan kerusakannya, sehingga saya punya gambaran lengkap riwayat barang tersebut.

### Peminjaman Internal (Jalur A)
19. Sebagai Admin Sarpras, saya ingin mencatat pengajuan peminjaman internal (nama peminjam, jabatan/kelas, no. HP, barang & jumlah yang dipinjam, tujuan, tanggal pinjam & rencana kembali), sehingga peminjaman dalam sekolah terdokumentasi.
20. Sebagai Admin Sarpras, saya ingin peminjaman internal langsung berstatus "Dipinjam" begitu saya input (tanpa tahap approval terpisah), sehingga alurnya singkat sesuai kebiasaan operasional sekolah.
21. Sebagai Admin Sarpras, saya ingin sistem otomatis mengurangi jumlah "tersedia" pada barang terkait saat peminjaman dicatat, sehingga stok yang bisa dipinjam selalu akurat.
22. Sebagai Admin Sarpras, saya ingin meng-upload foto kondisi awal barang secara opsional saat serah terima (terutama untuk barang bernilai/elektronik), sehingga ada bukti kondisi sebelum dipinjam untuk barang yang berisiko tinggi.
23. Sebagai Admin Sarpras, saya ingin mencatat pengembalian barang (tanggal aktual & foto kondisi akhir opsional), sehingga siklus peminjaman internal selesai dan stok tersedia bertambah kembali.
24. Sebagai Admin Sarpras, saya ingin sistem menandai peminjaman yang melewati tanggal rencana kembali tapi belum dikembalikan sebagai "Terlambat", sehingga saya bisa menindaklanjuti tanpa perlu mengecek manual satu per satu.

### Peminjaman Eksternal (Jalur B) & Surat Peminjaman
25. Sebagai Admin Sarpras, saya ingin mencatat pengajuan peminjaman eksternal dengan data tambahan (Tujuan Peminjaman, Lokasi Pemanfaatan, Tanggal Mulai & Kembali, Penanggung Jawab), sehingga kebutuhan administratif peminjaman ke luar sekolah terpenuhi.
26. Sebagai Admin Sarpras, saya ingin sistem otomatis membuatkan nomor surat berurutan (format resmi, reset tiap tahun) saat peminjaman eksternal dicatat, sehingga penomoran surat konsisten dan tidak ada duplikasi.
27. Sebagai Admin Sarpras, saya ingin mengunduh/mencetak Surat Peminjaman Barang dalam format PDF dengan kop klasik dinas (logo & nama yayasan/sekolah terpusat, font serif formal, mengikuti konvensi surat dinas resmi — lihat mockup S8a), sehingga surat siap dicetak dan ditandatangani manual (cap basah) sebagai bukti sah peminjaman ke luar.
28. Sebagai Admin Sarpras, saya ingin alur ambil/kembali & dampak ke stok pada peminjaman eksternal berlaku sama seperti peminjaman internal, sehingga konsistensi data terjaga di kedua jalur.

### Pelaporan Kerusakan & Pemeliharaan
29. Sebagai Admin Sarpras, saya ingin mencatat laporan kerusakan barang (memilih barang dari daftar/pencarian, deskripsi keluhan, upload foto bukti wajib), sehingga laporan yang diterima secara lisan/WA dari guru/siswa terdokumentasi di sistem.
30. Sebagai Admin Sarpras, saya ingin setiap laporan kerusakan memiliki status tiket (Laporan Masuk → Diproses/Diperbaiki → Selesai / Ganti Unit), sehingga saya bisa melacak progres penanganan.
31. Sebagai Admin Sarpras, saya ingin saat laporan berstatus "Selesai", jumlah pada breakdown kondisi barang terkait berpindah dari Rusak (Ringan/Berat) kembali ke Baik, sehingga data kondisi barang otomatis termutakhirkan.
32. Sebagai Admin Sarpras, saya ingin saat laporan berstatus "Ganti Unit", jumlah pada breakdown Rusak Berat barang terkait dikurangi dari total unit (write-off), sehingga barang yang benar-benar sudah tidak bisa dipakai keluar dari perhitungan stok aktif.
33. Sebagai Admin Sarpras, saya ingin mencatat penambahan unit pengganti secara manual (sebagai transaksi/​penambahan qty terpisah) setelah "Ganti Unit", sehingga stok barang pengganti tercatat sebagai entri baru yang jelas.
34. Sebagai Admin Sarpras, saya ingin melihat daftar semua tiket laporan kerusakan dengan filter status, sehingga saya bisa memprioritaskan penanganan.

### Dashboard & Pelaporan Pimpinan
35. Sebagai Admin Sarpras, saya ingin melihat dashboard ringkasan bergaya editorial — total unit barang sebagai angka utama beserta breakdown kondisi, KPI ringkas (sedang dipinjam internal/eksternal, terlambat, tiket perbaikan aktif, surat terbit bulan ini), serta daftar "Butuh perhatian" (tiket & keterlambatan) dan "Peminjaman berjalan" (lihat mockup S2b), sehingga saya punya gambaran kondisi sarpras secara sekilas tanpa perlu menelusuri tiap modul.
36. Sebagai Admin Sarpras, saya ingin mencetak Laporan Inventaris Ruang (LIR) dalam format PDF per ruang, sehingga saya bisa menyerahkan laporan inventaris ke pimpinan atau untuk keperluan audit.
37. Sebagai Admin Sarpras, saya ingin mencetak/ekspor Rekap Peminjaman dan Riwayat Perbaikan dalam format PDF dan Excel, sehingga data bisa diserahkan ke pimpinan dalam format yang sesuai kebutuhan (cetak vs olah data lanjut).
38. Sebagai Admin Sarpras, saya ingin mencetak ulang Surat Peminjaman Luar Sekolah yang sudah pernah diterbitkan, sehingga saya tidak perlu membuat ulang jika salinan fisik hilang.

### QR Code & Mode Pelacakan Per-Unit (lihat [detail addendum](#qr-code--mode-pelacakan-per-unit))
39. Sebagai Admin Sarpras, saya ingin memilih mode pelacakan (Batch atau Per-Unit) saat mendata barang baru, sehingga barang massal (kursi, ATK) cukup 1 QR per jenis sementara barang krusial (laptop, elektronik) bisa dilacak per unit fisik.
40. Sebagai Admin Sarpras, saya ingin sistem otomatis membuat baris unit fisik (dengan sub-kode masing-masing) saat saya input jumlah awal barang mode Per-Unit, sehingga saya tidak perlu membuat unit satu-satu secara manual.
41. Sebagai Admin Sarpras, saya ingin mencatat kondisi, lokasi, nomor seri, foto, dan catatan untuk tiap unit fisik secara individual (mode Per-Unit), sehingga tracking barang krusial akurat sampai level unit.
42. Sebagai Admin Sarpras, saya ingin memilih unit fisik spesifik (bukan sekadar jumlah) saat mencatat peminjaman barang mode Per-Unit, dan unit itu tidak bisa dipilih lagi sampai dikembalikan, sehingga saya tahu persis unit mana yang sedang dipinjam.
43. Sebagai Admin Sarpras, saya ingin membuat tiket Laporan Kerusakan yang menunjuk ke satu unit fisik spesifik (mode Per-Unit), dan status "Ganti Unit" menandai unit lama nonaktif serta memungkinkan saya menambahkan unit pengganti, sehingga histori tiap unit fisik tetap jelas dan akurat.
44. Sebagai siapapun (guru, siswa, pimpinan, pihak luar) tanpa perlu login, saya ingin men-scan QR Code yang tertempel di barang/unit/prasarana dan langsung melihat halaman card berisi keterangan, spesifikasi, kondisi, lokasi, dan foto (jika ada), sehingga informasi barang mudah diakses & dimonitor siapapun di lapangan.
45. Sebagai Admin Sarpras, saya ingin mencetak QR Code untuk barang, unit fisik, atau prasarana dari halaman detailnya, sehingga saya bisa menempelkan stiker QR fisik ke barang/prasarana yang bersangkutan.

## Keputusan Implementasi

**Stack & Infrastruktur**
- Next.js (App Router) + Tailwind CSS untuk frontend & backend (route handlers/server actions).
- PostgreSQL sebagai database, diakses lewat Drizzle ORM.
- Deploy ke VPS; foto/file disimpan di local disk server (bukan object storage cloud).
- Auth: NextAuth.js (Auth.js) dengan Credentials Provider, password di-hash (bcrypt). Middleware melindungi seluruh route dashboard — hanya Admin Sarpras yang bisa mengakses.
- PDF: `@react-pdf/renderer`. Excel: `exceljs`. QR Code: library server-side (ditambahkan saat implementasi addendum [QR Code & Mode Pelacakan Per-Unit](#qr-code--mode-pelacakan-per-unit)).
- UI: tipografi Inter, ikon Phosphor Icons, sidebar-layout dengan tema gelap (default) & terang yang bisa ditoggle (lihat [Desain Antarmuka (UI Mockup)](#desain-antarmuka-ui-mockup)). Implementasi dark/light mengikuti pendekatan token warna CSS custom property agar konsisten dengan mockup.

**Model Peran**
- Satu-satunya role berlogin: **Admin Sarpras** (multi-akun). Tidak ada role Kakomli, Guru, Siswa, atau Pimpinan sebagai entitas login di sistem — mereka hanya muncul sebagai data (nama, kontak) di dalam record peminjaman/laporan yang diinput Admin.
- Tidak ada form publik/self-service — seluruh *input* (peminjaman, laporan kerusakan) tetap dilakukan oleh Admin Sarpras dari dashboard. Pengecualian tunggal: halaman **card publik hasil scan QR Code** (lihat [QR Code & Mode Pelacakan Per-Unit](#qr-code--mode-pelacakan-per-unit)) bersifat *read-only* dan tidak memerlukan login — siapapun bisa melihatnya, tapi tidak ada aksi tulis/input yang bisa dilakukan dari halaman itu.

**Modul Utama**
1. **Auth & User Management** — login, CRUD akun staf Sarpras, pencatatan aktor pada setiap aksi (createdBy/updatedBy).
2. **Lokasi Hierarki** — 4 tabel/level relasional: Gedung, Lantai, Ruang, Sub-lokasi (opsional/nullable pada barang).
3. **Barang (Inventaris)** — model batch/quantity: satu baris data = satu jenis barang dengan Jumlah Unit total dan breakdown (Jumlah Baik, Jumlah Rusak Ringan, Jumlah Rusak Berat) yang harus selalu berjumlah sama dengan total. Kode barang input manual dengan validasi unik. Kategori sebagai field tambahan untuk filter/pengelompokan laporan. Status arsip (soft delete) alih-alih hard delete.
4. **Peminjaman** — satu entitas Peminjaman dengan field `jenis` (internal/eksternal) yang membedakan jalur; field khusus eksternal (tujuan, lokasi pemanfaatan, penanggung jawab, nomor surat) bersifat nullable untuk peminjaman internal. Tidak ada status approval — status langsung berjalan dari "Dipinjam" → "Dikembalikan". Field `tanggalRencanaKembali` dipakai untuk deteksi keterlambatan (dihitung on-the-fly dibanding tanggal hari ini, bukan job terjadwal).
5. **Generator Nomor Surat** — modul murni (deep module) yang menerima tahun berjalan & nomor terakhir yang dipakai pada tahun tersebut, mengembalikan nomor urut berikutnya dengan format resmi (`{urut}/SARPRAS/CY/{bulan romawi}/{tahun}`). Reset ke 001 saat tahun berganti. Dipanggil sinkron saat peminjaman eksternal dibuat (butuh strategi mencegah race condition duplikat nomor, misal transaksi database dengan lock/unique constraint per tahun+urut).
6. **Surat Peminjaman PDF** — komponen render terpisah dari logika generator nomor, menerima data peminjaman + nomor surat yang sudah digenerate, menghasilkan PDF berkop/logo sekolah dengan area tanda tangan kosong (TTD manual/cap basah, bukan TTD digital).
7. **Laporan Kerusakan (Ticketing)** — entitas Laporan terhubung ke satu Barang, dengan status enum (Masuk, Diproses, Selesai, Ganti Unit). Perubahan status memicu **Logika Stok Laporan Kerusakan** (deep module terpisah, lihat Keputusan Testing) yang memutasi breakdown kondisi barang terkait.
8. **Dashboard & Ringkasan** — kumpulan query agregasi read-only di atas data Barang, Peminjaman, dan Laporan.
9. **Export Laporan** — generator LIR per ruang (join Barang + Lokasi), generator rekap peminjaman/perbaikan (PDF via react-pdf, Excel via exceljs) dengan filter rentang tanggal.
10. **Upload Foto/File** — modul penyimpanan file ke disk lokal VPS dengan validasi tipe (jpg/png) dan ukuran maksimum; dipakai oleh modul Barang, Peminjaman (foto kondisi), dan Laporan Kerusakan (foto bukti).
11. **QR Code & Mode Pelacakan Per-Unit** — lihat detail lengkap di [QR Code & Mode Pelacakan Per-Unit](#qr-code--mode-pelacakan-per-unit).

**Kategori Barang**: field tambahan (di luar spesifikasi awal) untuk mendukung filter & pengelompokan pada dashboard/LIR — dikonfirmasi sebagai penambahan yang diterima user.

## Keputusan Testing

Test yang baik menguji **perilaku eksternal** modul (input → output/efek), bukan detail implementasi internal (query SQL spesifik, struktur internal state). Untuk proyek greenfield ini belum ada prior art di codebase — pola testing akan mengikuti konvensi standar Next.js/TypeScript (test runner: Vitest, dijalankan terhadap fungsi murni tanpa mock database bila memungkinkan).

Dua modul yang akan dites unit secara eksplisit karena keduanya adalah *deep module* dengan logika murni yang krusial dan rawan bug jika tidak diverifikasi:

1. **Generator Nomor Surat**
   - Input: tahun berjalan, nomor urut terakhir pada tahun tersebut (atau tidak ada/null jika tahun baru).
   - Output: nomor urut berikutnya + string nomor surat terformat.
   - Kasus yang harus dicakup: nomor pertama di tahun baru dimulai dari 001; nomor berikutnya di tahun yang sama increment benar; pergantian tahun mereset counter ke 001 meskipun nomor terakhir tahun sebelumnya besar; format bulan romawi & padding angka benar (misal 001 bukan 1).

2. **Logika Stok Laporan Kerusakan**
   - Input: breakdown kondisi barang saat ini (Baik/Rusak Ringan/Rusak Berat), jumlah yang dilaporkan rusak, status baru tiket (Diproses/Selesai/Ganti Unit).
   - Output: breakdown kondisi barang yang sudah dimutasi.
   - Kasus yang harus dicakup: transisi ke "Selesai" memindahkan jumlah dari Rusak kembali ke Baik dengan benar; transisi ke "Ganti Unit" mengurangi Rusak Berat dari total unit (write-off) tanpa memengaruhi kategori kondisi lain; total unit setelah mutasi tetap konsisten (tidak minus, tidak melebihi jumlah asal); mutasi tidak boleh dobel-terapkan jika status di-set ke nilai yang sama dua kali.

Modul lain (CRUD barang, peminjaman, auth, PDF/Excel rendering, upload file) akan diverifikasi lewat pengujian manual/integrasi saat implementasi, tidak dites unit secara eksplisit dalam PRD ini.

## Di Luar Cakupan

- Login/akun untuk Kakomli, Guru, Siswa, pihak luar sekolah, atau Pimpinan — semua interaksi mereka terjadi di luar sistem (lisan/WA) dan dicatatkan oleh Admin.
- Form publik/self-service untuk pengajuan peminjaman atau laporan kerusakan.
- Notifikasi otomatis (WhatsApp/email/push) untuk status approval, keterlambatan, atau progres laporan — hanya highlight visual di dashboard.
- Tanda tangan digital/e-signature pada Surat Peminjaman — tetap manual/cap basah.
- Pelacakan barang per-unit individual (serial number per unit fisik) sebagai model **wajib/tunggal** — sistem tetap memakai model batch/quantity sebagai default. **Update:** sejak addendum [QR Code & Mode Pelacakan Per-Unit](#qr-code--mode-pelacakan-per-unit), pelacakan per-unit kini tersedia sebagai **mode opsional** yang dipilih admin per jenis barang (mis. laptop/elektronik krusial), bukan menggantikan model batch untuk seluruh barang.
- Integrasi dengan sistem BMN/BMD pemerintah atau standar penomoran aset resmi eksternal.
- Object storage cloud (S3/Supabase/R2) — foto disimpan di disk lokal VPS.
- Aplikasi mobile native — hanya web responsive.
- ~~QR Code untuk pelaporan kerusakan (spesifikasi awal secara eksplisit menyatakan tanpa QR Code).~~ **Disupersede** oleh addendum [QR Code & Mode Pelacakan Per-Unit](#qr-code--mode-pelacakan-per-unit) — QR Code kini bagian dari cakupan, dengan tujuan tracking/monitoring (bukan pelaporan kerusakan; pembuatan tiket laporan kerusakan tetap dilakukan Admin dari dashboard, bukan dari halaman card publik).
- Form publik/self-service untuk **menulis/mengubah** data (pengajuan peminjaman, laporan kerusakan, edit apapun) lewat halaman card publik — halaman itu murni tampilan baca (read-only).
- Cetak QR Code massal (banyak barang/unit sekaligus dalam satu lembar) — cetak tetap satu per satu dari halaman detail masing-masing barang/unit/prasarana.

## QR Code & Mode Pelacakan Per-Unit

**Addendum ini digali lewat sesi `/grill-me` pada 2026-08-20** dan menyupersede dua item di [Di Luar Cakupan](#di-luar-cakupan) (QR Code, dan pelacakan per-unit sebagai model tunggal). Ditulis sebagai penambahan resmi ke PRD, bukan dokumen terpisah, karena mengubah skema & alur modul yang sudah selesai (Peminjaman & Laporan Kerusakan, Issue 7–10).

### Latar belakang & tujuan

Admin Sarpras ingin barang & prasarana bisa ditempel QR Code fisik, sehingga siapapun (guru, siswa, pimpinan, pihak luar) bisa scan dan langsung melihat keterangan/spesifikasi barang tanpa perlu login — memudahkan monitoring & tracking barang di lapangan. Untuk barang bernilai/krusial (elektronik seperti laptop), tracking perlu granular per unit fisik (bukan per jenis/batch) karena penting mengetahui persis unit mana yang rusak/dipinjam. Untuk barang massal (kursi, ATK), granularitas per unit tidak praktis (tidak mungkin tempel 1 stiker per kursi) — cukup 1 QR per jenis barang.

### Model Batch vs Per-Unit

Field baru `barang.modePelacakan` (enum `batch` | `unit`), dipilih admin saat membuat barang baru dan **terkunci setelah dibuat** (tidak bisa diubah — kalau salah pilih, arsipkan & input ulang). Barang existing (dibuat sebelum addendum ini) di-backfill sebagai `batch`.

- **Mode Batch** (default, perilaku sama seperti sekarang / Issue 4–6): satu baris `barang` mewakili satu jenis dengan `jumlahUnit` & breakdown kondisi (Baik/Rusak Ringan/Rusak Berat) diisi manual, totalnya harus sama dengan `jumlahUnit`. Satu QR Code mewakili seluruh unit dalam jenis itu.
- **Mode Per-Unit** (baru): setiap unit fisik jadi baris tersendiri di tabel baru `barang_unit` (child dari `barang`), dengan identitas & QR Code masing-masing. Field per unit:
  - Sub-kode otomatis (turunan dari `barang.kode`, mis. `LTP-ASUS-01-U1`, `-U2`, dst) — identitas & target QR.
  - Nomor seri manual opsional (nomor seri pabrik/tag inventaris fisik yang sudah ada).
  - Kondisi: `baik` | `rusak_ringan` | `rusak_berat` | `hilang` | `diganti` (status `diganti` = write-off, unit nonaktif, tetap tersimpan untuk audit — lihat alur Ganti Unit di bawah).
  - Foto individual (terpisah dari foto umum jenis barang), catatan bebas.
  - Lokasi sendiri (Gedung/Lantai/Ruang/Sub-lokasi) — **berbeda dari mode Batch**, karena unit fisik dalam jenis yang sama bisa tersebar di ruang berbeda.
  - Saat barang Per-Unit dibuat, admin input jumlah unit awal → sistem generate N baris unit otomatis (kondisi awal `baik`, lokasi awal = lokasi yang diisi di form). Breakdown kondisi di level jenis barang (Baik/Rusak Ringan/Rusak Berat yang ditampilkan di Daftar/Detail Barang, Dashboard, LIR) **dihitung otomatis (on-the-fly)** dari agregat status unit — tidak diisi manual, tidak mungkin ter-desinkron.
  - Pembelian tambahan unit sejenis di kemudian hari dicatat sebagai **baris `barang` baru** (bukan menambah unit ke barang lama) — kecuali dalam alur Ganti Unit (lihat di bawah), yang merupakan pengecualian sempit untuk mengganti unit yang write-off.

### Dampak ke Peminjaman (Issue 7–8)

Form Peminjaman menyesuaikan otomatis berdasarkan mode barang yang dipilih:
- Barang **Batch**: tetap seperti sekarang, input jumlah.
- Barang **Per-Unit**: pilih unit spesifik (multi-select dari unit berstatus `baik` yang belum dipinjam) alih-alih input jumlah. Satu unit hanya bisa ada di satu peminjaman aktif dalam satu waktu — begitu dipinjam, unit itu hilang dari daftar pilihan sampai dikembalikan (analog dengan pengurangan stok "tersedia" di mode Batch).
- Skema `peminjaman_item` mendapat kolom baru nullable `barangUnitId` (diisi untuk item Per-Unit; `jumlah` tetap dipakai untuk item Batch).

### Dampak ke Laporan Kerusakan (Issue 9–10)

- Barang **Batch**: tetap seperti sekarang (`jumlahUnitTerdampak` + `tingkatKerusakan`, memutasi breakdown agregat via modul `mutasiStokKerusakan`).
- Barang **Per-Unit**: form mewajibkan pilih **tepat satu unit** per tiket (field jumlah unit terdampak diganti dropdown pilih unit) — satu insiden yang mengenai beberapa unit dicatat sebagai beberapa tiket terpisah.
  - Transisi status "Selesai": kondisi unit terkait → `baik`.
  - Transisi status "Ganti Unit": kondisi unit terkait → `diganti` (nonaktif/write-off, tetap ada datanya untuk audit & histori tiket). Admin lalu menambahkan **1 unit pengganti baru** secara manual (sub-kode lanjut, mis. `-U6`) — satu-satunya kondisi di mana unit boleh ditambahkan ke barang Per-Unit yang sudah ada di luar pembuatan awal. Unit pengganti perlu QR baru dicetak & ditempel ulang secara fisik.

### Halaman Card Publik (hasil scan QR)

Tiga jenis target QR, masing-masing dengan route publik sendiri (di luar proteksi login `src/proxy.ts`):
- `/s/barang/{barang.id}` — jenis barang mode Batch.
- `/s/unit/{barangUnit.id}` — unit fisik individual mode Per-Unit.
- `/s/prasarana/{prasarana.id}` — catatan prasarana.

Isi card (murni baca, tanpa aksi tulis apapun):
- **Barang (Batch)**: nama, merk/tipe, kode, kategori, spesifikasi, lokasi lengkap (Gedung→Lantai→Ruang→Sub-lokasi), breakdown kondisi, foto. Tidak ada riwayat peminjaman/kerusakan (menghindari bocornya nama/kontak peminjam ke publik).
- **Unit (Per-Unit)**: identitas jenis (nama, merk, kategori, spesifikasi induk), sub-kode & nomor seri unit, kondisi & catatan unit, lokasi unit, foto unit (fallback ke foto jenis jika unit belum punya foto sendiri), dan **status pemakaian saat ini** (Tersedia / Sedang Dipinjam / Hilang / Rusak Ringan / Rusak Berat) — tanpa nama/kontak peminjam.
- **Prasarana**: nama, jenis pekerjaan, deskripsi, lokasi, status, tanggal mulai/selesai, foto. Field finansial (sumber dana, periode dana, nominal dana) **disembunyikan** dari card publik.
- **Barang/Prasarana diarsipkan** (`isArchived = true`): card menampilkan halaman "tidak ditemukan" (404), bukan datanya.
- **Unit berstatus `diganti`**: card tetap terbuka menampilkan status "Unit ini sudah diganti/tidak aktif" (bukan 404) — berguna untuk audit fisik saat stiker lama masih tertempel.

### Cetak QR Code

Tombol "Cetak QR" di halaman Detail Barang (mode Batch), tiap baris unit di halaman Detail Barang (mode Per-Unit), dan halaman Detail Prasarana — mencetak satu label (QR + nama + kode) langsung dari browser (`window.print()`). Tidak ada cetak massal/grid banyak label sekaligus (lihat [Di Luar Cakupan](#di-luar-cakupan)).

### Keputusan teknis pendukung

- QR meng-encode URL publik lengkap memakai UUID `id` yang sudah ada sebagai primary key (v4, tidak bisa ditebak/di-enumerasi) — tidak perlu kolom token terpisah.
- Env var baru `APP_URL` (mis. `http://localhost:3000` untuk dev, domain resmi sekolah untuk production) sebagai basis URL yang di-encode ke QR — dipilih di atas deteksi otomatis dari header `Host` supaya konsisten meski app diakses lewat beberapa alamat (IP VPS vs domain).
- `src/proxy.ts` (middleware auth) perlu matcher tambahan yang mengecualikan `/s/*` (halaman card publik) serta `/uploads/barang/*` dan `/uploads/prasarana/*` (foto barang & prasarana, termasuk foto unit) dari wajib-login. `/uploads/peminjaman/*` dan `/uploads/laporan-kerusakan/*` **tetap** wajib login seperti sekarang — tidak ikut dibuka ke publik.
- Library QR Code generation di sisi server (belum ada di `package.json`, perlu ditambahkan saat implementasi).

## Catatan Tambahan

- Karena tidak ada tahap approval, kolom `status` pada Peminjaman lebih sederhana dari desain birokrasi khas instansi pemerintah — ini keputusan sadar untuk menyesuaikan dengan alur kerja riil Admin Sarpras yang sudah menerima konfirmasi verbal sebelum input ke sistem.
- Keputusan model batch/quantity sebagai default (bukan per-unit untuk semua barang) berarti riwayat peminjaman/kerusakan pada barang mode Batch tetap terikat ke *jenis barang*, bukan ke unit fisik spesifik. Untuk barang bernilai yang butuh pelacakan per-unit (mis. laptop), lihat mode Per-Unit di [QR Code & Mode Pelacakan Per-Unit](#qr-code--mode-pelacakan-per-unit) — pelacakan per-unit kini tersedia sebagai pilihan per jenis barang, bukan lagi perubahan skema besar yang ditunda ke PRD terpisah.
- Race condition pada Generator Nomor Surat perlu penanganan konkuren yang hati-hati (dua peminjaman eksternal dicatat nyaris bersamaan) — didetailkan sebagai bagian dari implementasi modul, bukan hanya test logika angkanya saja.
