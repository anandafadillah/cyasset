import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { barang, peminjaman, peminjamanItem } from "@/db/schema";
import type { BarangOption } from "@/components/peminjaman/peminjaman-item-picker";

/**
 * Peta barangId → total unit yang sedang dipinjam (status "dipinjam").
 * "Tersedia" = jumlahBaik barang dikurangi angka ini — Peminjaman tidak
 * memutasi breakdown kondisi barang, hanya Laporan Kerusakan yang melakukan itu.
 */
export async function getDipinjamMap(): Promise<Map<string, number>> {
  const rows = await db
    .select({ barangId: peminjamanItem.barangId, total: sql<number>`sum(${peminjamanItem.jumlah})::int` })
    .from(peminjamanItem)
    .innerJoin(peminjaman, eq(peminjamanItem.peminjamanId, peminjaman.id))
    .where(eq(peminjaman.status, "dipinjam"))
    .groupBy(peminjamanItem.barangId);

  return new Map(rows.map((row) => [row.barangId, row.total]));
}

/**
 * Set berisi barangUnitId yang sedang dipinjam (peminjaman status "dipinjam").
 * Dipakai untuk menyaring unit yang bisa dipilih di form Peminjaman (Issue 16)
 * — satu unit fisik cuma boleh ada di satu peminjaman aktif dalam satu waktu.
 */
export async function getDipinjamUnitSet(): Promise<Set<string>> {
  const rows = await db
    .select({ barangUnitId: peminjamanItem.barangUnitId })
    .from(peminjamanItem)
    .innerJoin(peminjaman, eq(peminjamanItem.peminjamanId, peminjaman.id))
    .where(and(eq(peminjaman.status, "dipinjam"), isNotNull(peminjamanItem.barangUnitId)));

  return new Set(rows.map((row) => row.barangUnitId as string));
}

/**
 * Daftar barang yang bisa dipilih di form Peminjaman, sudah tersaring stok
 * kosong/unit tidak tersedia. Barang mode Batch tampil dengan `tersedia`
 * (jumlah), barang mode Unit tampil dengan daftar unit berkondisi "baik" yang
 * belum dipinjam di peminjaman aktif manapun (lihat Issue 16).
 */
export async function getBarangOptions(): Promise<BarangOption[]> {
  const [batchRows, unitBarangRows, dipinjamMap, dipinjamUnitSet] = await Promise.all([
    db.query.barang.findMany({
      where: and(eq(barang.isArchived, false), eq(barang.modePelacakan, "batch")),
    }),
    db.query.barang.findMany({
      where: and(eq(barang.isArchived, false), eq(barang.modePelacakan, "unit")),
      with: { units: true },
    }),
    getDipinjamMap(),
    getDipinjamUnitSet(),
  ]);

  const batchOptions: BarangOption[] = batchRows
    .map((row) => ({
      id: row.id,
      nama: row.nama,
      kode: row.kode,
      modePelacakan: "batch" as const,
      tersedia: Math.max(0, row.jumlahBaik - (dipinjamMap.get(row.id) ?? 0)),
    }))
    .filter((option) => option.tersedia > 0);

  const unitOptions: BarangOption[] = unitBarangRows
    .map((row) => ({
      id: row.id,
      nama: row.nama,
      kode: row.kode,
      modePelacakan: "unit" as const,
      units: row.units
        .filter((unit) => unit.kondisi === "baik" && !dipinjamUnitSet.has(unit.id))
        .map((unit) => ({ id: unit.id, subKode: unit.subKode })),
    }))
    .filter((option) => option.units.length > 0);

  return [...batchOptions, ...unitOptions];
}
