import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { barang, barangLokasi } from "@/db/schema";

type DbOrTx = Pick<typeof db, "select" | "update">;

/**
 * Hitung ulang ruangId/subLokasiId/jumlahUnit/jumlahBaik/jumlahRusakRingan/
 * jumlahRusakBerat pada baris `barang` bermode "batch" dari baris-baris
 * `barang_lokasi`-nya, lalu tulis balik ke `barang`. ruangId/subLokasiId ikut
 * baris dengan `urutan` terkecil (baris pertama di form); jumlah* ikut total
 * semua baris. Dipanggil setiap kali barang_lokasi diganti (create/update
 * barang mode batch) — breakdown & lokasi barang mode batch tidak pernah
 * diisi manual lagi begitu ada >0 baris barang_lokasi.
 */
export async function syncBarangBreakdownFromLokasi(barangId: string, executor: DbOrTx = db) {
  const [utama] = await executor
    .select({ ruangId: barangLokasi.ruangId, subLokasiId: barangLokasi.subLokasiId })
    .from(barangLokasi)
    .where(eq(barangLokasi.barangId, barangId))
    .orderBy(asc(barangLokasi.urutan))
    .limit(1);

  if (!utama) throw new Error("Barang batch harus punya minimal 1 lokasi.");

  const [agregat] = await executor
    .select({
      jumlah: sql<number>`coalesce(sum(${barangLokasi.jumlah}), 0)::int`,
      baik: sql<number>`coalesce(sum(${barangLokasi.jumlahBaik}), 0)::int`,
      rusakRingan: sql<number>`coalesce(sum(${barangLokasi.jumlahRusakRingan}), 0)::int`,
      rusakBerat: sql<number>`coalesce(sum(${barangLokasi.jumlahRusakBerat}), 0)::int`,
    })
    .from(barangLokasi)
    .where(eq(barangLokasi.barangId, barangId));

  await executor
    .update(barang)
    .set({
      ruangId: utama.ruangId,
      subLokasiId: utama.subLokasiId,
      jumlahUnit: agregat.jumlah,
      jumlahBaik: agregat.baik,
      jumlahRusakRingan: agregat.rusakRingan,
      jumlahRusakBerat: agregat.rusakBerat,
      updatedAt: new Date(),
    })
    .where(eq(barang.id, barangId));
}
