import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { barang, barangUnit } from "@/db/schema";

type DbOrTx = Pick<typeof db, "select" | "update">;

/**
 * Hitung ulang breakdown kondisi (jumlahUnit/jumlahBaik/jumlahRusakRingan/
 * jumlahRusakBerat) pada baris `barang` bermode "unit" dari agregat status
 * `barang_unit`-nya, lalu tulis balik ke `barang`. Dipanggil setiap kali unit
 * dibuat/statusnya berubah (lihat Issue 15/17) — breakdown barang mode "unit"
 * tidak pernah diisi manual.
 *
 * Unit berstatus "diganti" (write-off) dikeluarkan dari jumlahUnit. Unit
 * berstatus "hilang" tetap dihitung di jumlahUnit tapi tidak masuk salah satu
 * dari Baik/Rusak Ringan/Rusak Berat (tidak ada kolom "hilang" di `barang`).
 */
export async function syncBarangBreakdownFromUnits(barangId: string, executor: DbOrTx = db) {
  const [agregat] = await executor
    .select({
      total: sql<number>`count(*) filter (where ${barangUnit.kondisi} != 'diganti')::int`,
      baik: sql<number>`count(*) filter (where ${barangUnit.kondisi} = 'baik')::int`,
      rusakRingan: sql<number>`count(*) filter (where ${barangUnit.kondisi} = 'rusak_ringan')::int`,
      rusakBerat: sql<number>`count(*) filter (where ${barangUnit.kondisi} = 'rusak_berat')::int`,
    })
    .from(barangUnit)
    .where(eq(barangUnit.barangId, barangId));

  await executor
    .update(barang)
    .set({
      jumlahUnit: agregat.total,
      jumlahBaik: agregat.baik,
      jumlahRusakRingan: agregat.rusakRingan,
      jumlahRusakBerat: agregat.rusakBerat,
      updatedAt: new Date(),
    })
    .where(eq(barang.id, barangId));
}

/**
 * Sub-kode berikutnya untuk unit baru dari jenis barang tertentu (mis.
 * `LTP-ASUS-01-U6` kalau unit tertinggi saat ini `-U5`). Dipakai saat
 * menambahkan unit pengganti setelah alur Ganti Unit (Issue 17) — satu-
 * satunya jalur penambahan unit ke barang mode "unit" yang sudah ada di
 * luar pembuatan awal (Issue 14, yang menomori langsung 1..N tanpa perlu
 * query karena belum ada unit sama sekali).
 */
export async function nextSubKode(barangId: string, executor: Pick<typeof db, "select"> = db): Promise<string> {
  const [barangRow] = await executor.select({ kode: barang.kode }).from(barang).where(eq(barang.id, barangId)).limit(1);
  if (!barangRow) throw new Error("Barang tidak ditemukan.");

  const units = await executor.select({ subKode: barangUnit.subKode }).from(barangUnit).where(eq(barangUnit.barangId, barangId));

  const prefix = `${barangRow.kode}-U`;
  let maxN = 0;
  for (const unit of units) {
    if (!unit.subKode.startsWith(prefix)) continue;
    const n = Number(unit.subKode.slice(prefix.length));
    if (Number.isInteger(n) && n > maxN) maxN = n;
  }
  return `${prefix}${maxN + 1}`;
}
