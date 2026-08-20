import { sql } from "drizzle-orm";
import { db } from "@/db";
import { tiketCounter } from "@/db/schema";

/**
 * Kode tiket global berurutan (#TK-0001, dst) lewat UPSERT atomik pada satu
 * baris counter — pola sama seperti generator nomor surat.
 */
export async function generateKodeTiket(): Promise<string> {
  const [row] = await db
    .insert(tiketCounter)
    .values({ id: 1, urutTerakhir: 1 })
    .onConflictDoUpdate({
      target: tiketCounter.id,
      set: { urutTerakhir: sql`${tiketCounter.urutTerakhir} + 1` },
    })
    .returning({ urutTerakhir: tiketCounter.urutTerakhir });

  return `TK-${String(row.urutTerakhir).padStart(4, "0")}`;
}
