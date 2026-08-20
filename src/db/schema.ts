import { relations } from "drizzle-orm";
import { boolean, date, integer, pgEnum, pgTable, text, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";

export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdBy: uuid("created_by").references((): AnyPgColumn => staff.id),
  updatedBy: uuid("updated_by").references((): AnyPgColumn => staff.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;

/**
 * Konvensi jejak audit dipakai di seluruh modul (Barang, Peminjaman, Laporan
 * Kerusakan, dst): setiap tabel yang menyimpan aksi seorang Admin Sarpras
 * menyertakan dua kolom ini via spread, contoh:
 *
 *   export const barang = pgTable("barang", {
 *     ...
 *     ...auditColumns,
 *   });
 *
 * Isi keduanya dengan `session.user.id` pada server action terkait —
 * `createdBy` sekali saat insert, `updatedBy` di setiap insert & update.
 */
export const auditColumns = {
  createdBy: uuid("created_by").references((): AnyPgColumn => staff.id),
  updatedBy: uuid("updated_by").references((): AnyPgColumn => staff.id),
};

// ── Lokasi hierarki: Gedung → Lantai → Ruang → Sub-lokasi (opsional) ──

export const gedung = pgTable("gedung", {
  id: uuid("id").primaryKey().defaultRandom(),
  nama: text("nama").notNull(),
  ...auditColumns,
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lantai = pgTable("lantai", {
  id: uuid("id").primaryKey().defaultRandom(),
  gedungId: uuid("gedung_id")
    .notNull()
    .references(() => gedung.id, { onDelete: "cascade" }),
  nama: text("nama").notNull(),
  ...auditColumns,
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ruang = pgTable("ruang", {
  id: uuid("id").primaryKey().defaultRandom(),
  lantaiId: uuid("lantai_id")
    .notNull()
    .references(() => lantai.id, { onDelete: "cascade" }),
  nama: text("nama").notNull(),
  ...auditColumns,
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subLokasi = pgTable("sub_lokasi", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruangId: uuid("ruang_id")
    .notNull()
    .references(() => ruang.id, { onDelete: "cascade" }),
  nama: text("nama").notNull(),
  ...auditColumns,
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gedungRelations = relations(gedung, ({ many }) => ({
  lantai: many(lantai),
}));

export const lantaiRelations = relations(lantai, ({ one, many }) => ({
  gedung: one(gedung, { fields: [lantai.gedungId], references: [gedung.id] }),
  ruang: many(ruang),
}));

export const ruangRelations = relations(ruang, ({ one, many }) => ({
  lantai: one(lantai, { fields: [ruang.lantaiId], references: [lantai.id] }),
  subLokasi: many(subLokasi),
}));

export const subLokasiRelations = relations(subLokasi, ({ one }) => ({
  ruang: one(ruang, { fields: [subLokasi.ruangId], references: [ruang.id] }),
}));

export type Gedung = typeof gedung.$inferSelect;
export type Lantai = typeof lantai.$inferSelect;
export type Ruang = typeof ruang.$inferSelect;
export type SubLokasi = typeof subLokasi.$inferSelect;

// ── Barang (Inventaris) — model batch/quantity, atau unit (per-unit) ──
// modePelacakan menentukan granularitas satu baris `barang`:
// - "batch": breakdown kondisi (jumlahBaik/RusakRingan/RusakBerat) diisi manual,
//   satu QR Code mewakili seluruh unit dalam jenis ini (perilaku asli/default).
// - "unit": setiap unit fisik jadi baris tersendiri di `barang_unit` (identitas,
//   lokasi, kondisi, foto sendiri-sendiri); breakdown di baris `barang` ini
//   dihitung otomatis dari agregat `barang_unit` (lihat syncBarangBreakdownFromUnits
//   di src/lib/barang-unit.ts), tidak pernah diisi manual. Mode terkunci setelah
//   barang dibuat (lihat createBarangAction/updateBarangAction).

export const barangModeEnum = pgEnum("barang_mode", ["batch", "unit"]);
export const barangUnitKondisiEnum = pgEnum("barang_unit_kondisi", [
  "baik",
  "rusak_ringan",
  "rusak_berat",
  "hilang",
  "diganti",
]);

export const barang = pgTable("barang", {
  id: uuid("id").primaryKey().defaultRandom(),
  nama: text("nama").notNull(),
  merkTipe: text("merk_tipe"),
  kode: text("kode").notNull().unique(),
  kategori: text("kategori"),
  spesifikasi: text("spesifikasi"),
  ruangId: uuid("ruang_id")
    .notNull()
    .references(() => ruang.id, { onDelete: "restrict" }),
  subLokasiId: uuid("sub_lokasi_id").references(() => subLokasi.id, { onDelete: "set null" }),
  modePelacakan: barangModeEnum("mode_pelacakan").notNull().default("batch"),
  jumlahUnit: integer("jumlah_unit").notNull(),
  jumlahBaik: integer("jumlah_baik").notNull(),
  jumlahRusakRingan: integer("jumlah_rusak_ringan").notNull(),
  jumlahRusakBerat: integer("jumlah_rusak_berat").notNull(),
  isArchived: boolean("is_archived").notNull().default(false),
  ...auditColumns,
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const barangFoto = pgTable("barang_foto", {
  id: uuid("id").primaryKey().defaultRandom(),
  barangId: uuid("barang_id")
    .notNull()
    .references(() => barang.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Unit fisik individual milik barang bermode "unit" — lihat catatan di atas.
export const barangUnit = pgTable("barang_unit", {
  id: uuid("id").primaryKey().defaultRandom(),
  barangId: uuid("barang_id")
    .notNull()
    .references(() => barang.id, { onDelete: "cascade" }),
  subKode: text("sub_kode").notNull().unique(),
  nomorSeri: text("nomor_seri"),
  kondisi: barangUnitKondisiEnum("kondisi").notNull().default("baik"),
  ruangId: uuid("ruang_id")
    .notNull()
    .references(() => ruang.id, { onDelete: "restrict" }),
  subLokasiId: uuid("sub_lokasi_id").references(() => subLokasi.id, { onDelete: "set null" }),
  catatan: text("catatan"),
  ...auditColumns,
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const barangUnitFoto = pgTable("barang_unit_foto", {
  id: uuid("id").primaryKey().defaultRandom(),
  barangUnitId: uuid("barang_unit_id")
    .notNull()
    .references(() => barangUnit.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const barangRelations = relations(barang, ({ one, many }) => ({
  ruang: one(ruang, { fields: [barang.ruangId], references: [ruang.id] }),
  subLokasi: one(subLokasi, { fields: [barang.subLokasiId], references: [subLokasi.id] }),
  foto: many(barangFoto),
  units: many(barangUnit),
}));

export const barangFotoRelations = relations(barangFoto, ({ one }) => ({
  barang: one(barang, { fields: [barangFoto.barangId], references: [barang.id] }),
}));

export const barangUnitRelations = relations(barangUnit, ({ one, many }) => ({
  barang: one(barang, { fields: [barangUnit.barangId], references: [barang.id] }),
  ruang: one(ruang, { fields: [barangUnit.ruangId], references: [ruang.id] }),
  subLokasi: one(subLokasi, { fields: [barangUnit.subLokasiId], references: [subLokasi.id] }),
  foto: many(barangUnitFoto),
}));

export const barangUnitFotoRelations = relations(barangUnitFoto, ({ one }) => ({
  barangUnit: one(barangUnit, { fields: [barangUnitFoto.barangUnitId], references: [barangUnit.id] }),
}));

export type Barang = typeof barang.$inferSelect;
export type NewBarang = typeof barang.$inferInsert;
export type BarangFoto = typeof barangFoto.$inferSelect;
export type BarangUnit = typeof barangUnit.$inferSelect;
export type NewBarangUnit = typeof barangUnit.$inferInsert;
export type BarangUnitFoto = typeof barangUnitFoto.$inferSelect;

// ── Peminjaman (internal & eksternal) ──

export const peminjamanJenisEnum = pgEnum("peminjaman_jenis", ["internal", "eksternal"]);
export const peminjamanStatusEnum = pgEnum("peminjaman_status", ["dipinjam", "dikembalikan"]);
export const peminjamanFotoTipeEnum = pgEnum("peminjaman_foto_tipe", ["awal", "akhir"]);

export const peminjaman = pgTable("peminjaman", {
  id: uuid("id").primaryKey().defaultRandom(),
  jenis: peminjamanJenisEnum("jenis").notNull().default("internal"),
  peminjamNama: text("peminjam_nama").notNull(),
  peminjamKontak: text("peminjam_kontak"),
  peminjamKeterangan: text("peminjam_keterangan"),
  // Khusus jalur eksternal (Issue 8) — nullable di jalur internal.
  penanggungJawab: text("penanggung_jawab"),
  lokasiPemanfaatan: text("lokasi_pemanfaatan"),
  nomorSurat: text("nomor_surat").unique(),
  tujuan: text("tujuan").notNull(),
  tanggalPinjam: date("tanggal_pinjam").notNull(),
  tanggalRencanaKembali: date("tanggal_rencana_kembali").notNull(),
  tanggalKembaliAktual: date("tanggal_kembali_aktual"),
  status: peminjamanStatusEnum("status").notNull().default("dipinjam"),
  ...auditColumns,
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const peminjamanItem = pgTable("peminjaman_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  peminjamanId: uuid("peminjaman_id")
    .notNull()
    .references(() => peminjaman.id, { onDelete: "cascade" }),
  barangId: uuid("barang_id")
    .notNull()
    .references(() => barang.id, { onDelete: "restrict" }),
  jumlah: integer("jumlah").notNull(),
  // Diisi hanya untuk barang mode "unit" — menunjuk unit fisik spesifik yang
  // dipinjam (jumlah selalu 1 untuk baris ini). Nullable karena barang mode
  // "batch" tidak memakainya (lihat Issue 16).
  barangUnitId: uuid("barang_unit_id").references(() => barangUnit.id, { onDelete: "restrict" }),
});

export const peminjamanFoto = pgTable("peminjaman_foto", {
  id: uuid("id").primaryKey().defaultRandom(),
  peminjamanId: uuid("peminjaman_id")
    .notNull()
    .references(() => peminjaman.id, { onDelete: "cascade" }),
  tipe: peminjamanFotoTipeEnum("tipe").notNull(),
  path: text("path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const peminjamanRelations = relations(peminjaman, ({ many }) => ({
  items: many(peminjamanItem),
  foto: many(peminjamanFoto),
}));

export const peminjamanItemRelations = relations(peminjamanItem, ({ one }) => ({
  peminjaman: one(peminjaman, { fields: [peminjamanItem.peminjamanId], references: [peminjaman.id] }),
  barang: one(barang, { fields: [peminjamanItem.barangId], references: [barang.id] }),
  barangUnit: one(barangUnit, { fields: [peminjamanItem.barangUnitId], references: [barangUnit.id] }),
}));

export const peminjamanFotoRelations = relations(peminjamanFoto, ({ one }) => ({
  peminjaman: one(peminjaman, { fields: [peminjamanFoto.peminjamanId], references: [peminjaman.id] }),
}));

export type Peminjaman = typeof peminjaman.$inferSelect;
export type NewPeminjaman = typeof peminjaman.$inferInsert;
export type PeminjamanItem = typeof peminjamanItem.$inferSelect;
export type PeminjamanFoto = typeof peminjamanFoto.$inferSelect;

// ── Generator Nomor Surat (peminjaman eksternal) ──
// Satu baris per tahun; increment via UPSERT atomik agar aman dari race condition.

export const suratCounter = pgTable("surat_counter", {
  tahun: integer("tahun").primaryKey(),
  urutTerakhir: integer("urut_terakhir").notNull().default(0),
});

// ── Laporan Kerusakan (ticketing) ──

export const laporanKerusakanStatusEnum = pgEnum("laporan_kerusakan_status", [
  "masuk",
  "diproses",
  "selesai",
  "ganti_unit",
]);
export const laporanKerusakanTingkatEnum = pgEnum("laporan_kerusakan_tingkat", ["rusak_ringan", "rusak_berat"]);

export const laporanKerusakan = pgTable("laporan_kerusakan", {
  id: uuid("id").primaryKey().defaultRandom(),
  kodeTiket: text("kode_tiket").notNull().unique(),
  barangId: uuid("barang_id")
    .notNull()
    .references(() => barang.id, { onDelete: "restrict" }),
  deskripsi: text("deskripsi").notNull(),
  pelapor: text("pelapor"),
  jumlahUnitTerdampak: integer("jumlah_unit_terdampak").notNull(),
  tingkatKerusakan: laporanKerusakanTingkatEnum("tingkat_kerusakan").notNull(),
  // Diisi hanya untuk barang mode "unit" — menunjuk unit fisik spesifik yang
  // dilaporkan rusak (jumlahUnitTerdampak selalu 1 untuk tiket ini). Nullable
  // karena barang mode "batch" tidak memakainya (lihat Issue 17).
  barangUnitId: uuid("barang_unit_id").references(() => barangUnit.id, { onDelete: "restrict" }),
  status: laporanKerusakanStatusEnum("status").notNull().default("masuk"),
  mutasiDiterapkan: boolean("mutasi_diterapkan").notNull().default(false),
  ...auditColumns,
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const laporanKerusakanFoto = pgTable("laporan_kerusakan_foto", {
  id: uuid("id").primaryKey().defaultRandom(),
  laporanId: uuid("laporan_id")
    .notNull()
    .references(() => laporanKerusakan.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const laporanKerusakanRelations = relations(laporanKerusakan, ({ one, many }) => ({
  barang: one(barang, { fields: [laporanKerusakan.barangId], references: [barang.id] }),
  barangUnit: one(barangUnit, { fields: [laporanKerusakan.barangUnitId], references: [barangUnit.id] }),
  foto: many(laporanKerusakanFoto),
}));

export const laporanKerusakanFotoRelations = relations(laporanKerusakanFoto, ({ one }) => ({
  laporan: one(laporanKerusakan, { fields: [laporanKerusakanFoto.laporanId], references: [laporanKerusakan.id] }),
}));

export type LaporanKerusakan = typeof laporanKerusakan.$inferSelect;
export type NewLaporanKerusakan = typeof laporanKerusakan.$inferInsert;
export type LaporanKerusakanFoto = typeof laporanKerusakanFoto.$inferSelect;

// Singleton counter (satu baris, id=1) untuk kode tiket berurutan global (#TK-0001, dst).
export const tiketCounter = pgTable("tiket_counter", {
  id: integer("id").primaryKey().default(1),
  urutTerakhir: integer("urut_terakhir").notNull().default(0),
});

// ── Prasarana — audit pekerjaan pembangunan/perbaikan/pemeliharaan fasilitas fisik sekolah ──

export const prasaranaJenisEnum = pgEnum("prasarana_jenis", [
  "pembangunan_baru",
  "perbaikan",
  "pemeliharaan",
]);
export const prasaranaStatusEnum = pgEnum("prasarana_status", ["direncanakan", "proses", "selesai"]);
export const prasaranaSumberDanaEnum = pgEnum("prasarana_sumber_dana", [
  "ssg",
  "bos",
  "komite_sekolah",
  "mandiri_yayasan",
  "lainnya",
]);

export const prasarana = pgTable("prasarana", {
  id: uuid("id").primaryKey().defaultRandom(),
  nama: text("nama").notNull(),
  jenis: prasaranaJenisEnum("jenis").notNull(),
  deskripsi: text("deskripsi"),
  lokasi: text("lokasi"),
  status: prasaranaStatusEnum("status").notNull().default("direncanakan"),
  tanggalMulai: date("tanggal_mulai").notNull(),
  tanggalSelesai: date("tanggal_selesai"),
  sumberDana: prasaranaSumberDanaEnum("sumber_dana").notNull(),
  sumberDanaLainnya: text("sumber_dana_lainnya"),
  periodeDana: text("periode_dana"),
  nominalDana: integer("nominal_dana"),
  isArchived: boolean("is_archived").notNull().default(false),
  ...auditColumns,
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prasaranaFoto = pgTable("prasarana_foto", {
  id: uuid("id").primaryKey().defaultRandom(),
  prasaranaId: uuid("prasarana_id")
    .notNull()
    .references(() => prasarana.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prasaranaRelations = relations(prasarana, ({ many }) => ({
  foto: many(prasaranaFoto),
}));

export const prasaranaFotoRelations = relations(prasaranaFoto, ({ one }) => ({
  prasarana: one(prasarana, { fields: [prasaranaFoto.prasaranaId], references: [prasarana.id] }),
}));

export type Prasarana = typeof prasarana.$inferSelect;
export type NewPrasarana = typeof prasarana.$inferInsert;
export type PrasaranaFoto = typeof prasaranaFoto.$inferSelect;
