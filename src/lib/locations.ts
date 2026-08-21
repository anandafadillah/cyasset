import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { barang, barangLokasi, barangUnit } from "@/db/schema";
import type { GedungNode } from "@/components/lokasi/location-explorer";

export async function getLocationTree(): Promise<GedungNode[]> {
  const [tree, batchAgregat, unitAgregat] = await Promise.all([
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
    // Barang mode batch: sebar per lokasi lewat barang_lokasi — bukan cuma
    // ruangId "utama" di barang, supaya barang yang sebagian ada di ruang
    // ini tetap terhitung di ruang itu.
    db
      .select({
        ruangId: barangLokasi.ruangId,
        totalUnit: sql<number>`coalesce(sum(${barangLokasi.jumlah}), 0)::int`,
        jenisBarang: sql<number>`count(distinct ${barangLokasi.barangId})::int`,
      })
      .from(barangLokasi)
      .innerJoin(barang, eq(barangLokasi.barangId, barang.id))
      .where(eq(barang.isArchived, false))
      .groupBy(barangLokasi.ruangId),
    // Barang mode unit: tiap unit fisik punya ruangId sendiri di barang_unit
    // (bisa pindah dari lokasi awal barang-nya) — hitung dari situ, bukan
    // dari ruangId barang induk yang cuma lokasi awal.
    db
      .select({
        ruangId: barangUnit.ruangId,
        totalUnit: sql<number>`count(*) filter (where ${barangUnit.kondisi} != 'diganti')::int`,
        jenisBarang: sql<number>`count(distinct ${barangUnit.barangId})::int`,
      })
      .from(barangUnit)
      .innerJoin(barang, eq(barangUnit.barangId, barang.id))
      .where(eq(barang.isArchived, false))
      .groupBy(barangUnit.ruangId),
  ]);

  const agregatMap = new Map<string, { totalUnit: number; jenisBarang: number }>();
  for (const row of [...batchAgregat, ...unitAgregat]) {
    const prev = agregatMap.get(row.ruangId) ?? { totalUnit: 0, jenisBarang: 0 };
    agregatMap.set(row.ruangId, {
      totalUnit: prev.totalUnit + row.totalUnit,
      jenisBarang: prev.jenisBarang + row.jenisBarang,
    });
  }

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
