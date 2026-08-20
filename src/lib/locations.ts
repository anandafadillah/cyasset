import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { barang } from "@/db/schema";
import type { GedungNode } from "@/components/lokasi/location-explorer";

export async function getLocationTree(): Promise<GedungNode[]> {
  const [tree, ruangAgregat] = await Promise.all([
    db.query.gedung.findMany({
      orderBy: (table, { asc }) => asc(table.createdAt),
      with: {
        lantai: {
          orderBy: (table, { asc }) => asc(table.createdAt),
          with: {
            ruang: {
              orderBy: (table, { asc }) => asc(table.createdAt),
              with: {
                subLokasi: {
                  orderBy: (table, { asc }) => asc(table.createdAt),
                },
              },
            },
          },
        },
      },
    }),
    db
      .select({
        ruangId: barang.ruangId,
        totalUnit: sql<number>`coalesce(sum(${barang.jumlahUnit}), 0)::int`,
        jenisBarang: sql<number>`count(*)::int`,
      })
      .from(barang)
      .where(eq(barang.isArchived, false))
      .groupBy(barang.ruangId),
  ]);

  const agregatMap = new Map(ruangAgregat.map((row) => [row.ruangId, row]));

  return tree.map((g) => ({
    ...g,
    lantai: g.lantai.map((l) => ({
      ...l,
      ruang: l.ruang.map((r) => ({
        ...r,
        totalUnit: agregatMap.get(r.id)?.totalUnit ?? 0,
        jenisBarang: agregatMap.get(r.id)?.jenisBarang ?? 0,
      })),
    })),
  }));
}
