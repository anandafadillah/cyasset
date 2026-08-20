import { sql } from "drizzle-orm";
import { db } from "@/db";
import { suratCounter } from "@/db/schema";

const BULAN_ROMAWI = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function formatNomorSurat(urut: number, date: Date): string {
  const urutPadded = String(urut).padStart(3, "0");
  const bulanRomawi = BULAN_ROMAWI[date.getMonth()];
  const tahun = date.getFullYear();
  return `${urutPadded}/SARPRAS/CY/${bulanRomawi}/${tahun}`;
}

/**
 * Ambil urutan berikutnya untuk tahun tertentu secara atomik lewat
 * INSERT ... ON CONFLICT DO UPDATE — Postgres mengunci baris counter tahun
 * tsb sehingga dua panggilan bersamaan tidak pernah mendapat urutan sama.
 */
export async function getNextUrutSurat(tahun: number): Promise<number> {
  const [row] = await db
    .insert(suratCounter)
    .values({ tahun, urutTerakhir: 1 })
    .onConflictDoUpdate({
      target: suratCounter.tahun,
      set: { urutTerakhir: sql`${suratCounter.urutTerakhir} + 1` },
    })
    .returning({ urutTerakhir: suratCounter.urutTerakhir });
  return row.urutTerakhir;
}

export async function generateNomorSurat(date: Date = new Date()): Promise<string> {
  const tahun = date.getFullYear();
  const urut = await getNextUrutSurat(tahun);
  return formatNomorSurat(urut, date);
}
