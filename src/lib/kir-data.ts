import { and, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { barang, barangLokasi, barangUnit, gedung, lantai, ruang, subLokasi } from "@/db/schema";
import { susunBarisKir, type KirBaris, type SumberBatch, type SumberUnit } from "@/lib/kir";

export type KirRuang = {
  id: string;
  nama: string;
  kode: string | null;
  penanggungJawabNama: string | null;
  penanggungJawabNip: string | null;
  lantaiId: string;
  lantaiNama: string;
  gedungId: string;
  gedungNama: string;
};

export type KirData = { ruang: KirRuang; items: KirBaris[] };

const infoBarang = {
  barangId: barang.id,
  nama: barang.nama,
  merkTipe: barang.merkTipe,
  kode: barang.kode,
  kategori: barang.kategori,
  tanggalMasuk: barang.tanggalMasuk,
  sumberDana: barang.sumberDana,
  sumberDanaLainnya: barang.sumberDanaLainnya,
};

function bandingkanNama(a: string, b: string) {
  return a.localeCompare(b, "id", { sensitivity: "base", numeric: true });
}

function kelompokkan<T extends { ruangId: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.ruangId) ?? [];
    list.push(row);
    map.set(row.ruangId, list);
  }
  return map;
}

/**
 * Isi Kartu Inventaris Ruangan untuk banyak ruang sekaligus (3 query, bukan
 * per ruang) — dipakai bersama oleh PDF KIR, halaman /kir, dan halaman publik
 * ruang. Barang batch diambil dari porsinya di barang_lokasi (bukan total
 * barang), barang unit dari unit fisik yang ruangId-nya ruang tsb; barang
 * arsip dikecualikan. Hasil urut Gedung → Lantai → Ruang (nama).
 */
export async function getKirBanyakRuang(filter: { ruangId?: string; gedungId?: string } = {}): Promise<KirData[]> {
  const kondisiRuang: SQL[] = [];
  if (filter.ruangId) kondisiRuang.push(eq(ruang.id, filter.ruangId));
  if (filter.gedungId) kondisiRuang.push(eq(gedung.id, filter.gedungId));

  const ruangRows = await db
    .select({
      id: ruang.id,
      nama: ruang.nama,
      kode: ruang.kode,
      penanggungJawabNama: ruang.penanggungJawabNama,
      penanggungJawabNip: ruang.penanggungJawabNip,
      lantaiId: lantai.id,
      lantaiNama: lantai.nama,
      gedungId: gedung.id,
      gedungNama: gedung.nama,
    })
    .from(ruang)
    .innerJoin(lantai, eq(ruang.lantaiId, lantai.id))
    .innerJoin(gedung, eq(lantai.gedungId, gedung.id))
    .where(and(...kondisiRuang));
  if (ruangRows.length === 0) return [];

  // Tanpa filter, ambil semua sekaligus — lebih murah daripada IN (semua id).
  const ruangIds = ruangRows.map((row) => row.id);
  const semua = !filter.ruangId && !filter.gedungId;

  const [batchRows, unitRows] = await Promise.all([
    db
      .select({
        ...infoBarang,
        ruangId: barangLokasi.ruangId,
        subLokasiNama: subLokasi.nama,
        jumlah: barangLokasi.jumlah,
        jumlahBaik: barangLokasi.jumlahBaik,
        jumlahRusakRingan: barangLokasi.jumlahRusakRingan,
        jumlahRusakBerat: barangLokasi.jumlahRusakBerat,
      })
      .from(barangLokasi)
      .innerJoin(barang, eq(barangLokasi.barangId, barang.id))
      .leftJoin(subLokasi, eq(barangLokasi.subLokasiId, subLokasi.id))
      .where(and(eq(barang.isArchived, false), semua ? undefined : inArray(barangLokasi.ruangId, ruangIds)))
      .orderBy(barangLokasi.urutan),
    db
      .select({
        ...infoBarang,
        ruangId: barangUnit.ruangId,
        unitId: barangUnit.id,
        subKode: barangUnit.subKode,
        subLokasiNama: subLokasi.nama,
        kondisi: barangUnit.kondisi,
      })
      .from(barangUnit)
      .innerJoin(barang, eq(barangUnit.barangId, barang.id))
      .leftJoin(subLokasi, eq(barangUnit.subLokasiId, subLokasi.id))
      .where(and(eq(barang.isArchived, false), semua ? undefined : inArray(barangUnit.ruangId, ruangIds))),
  ]);

  const batchPerRuang = kelompokkan<SumberBatch & { ruangId: string }>(batchRows);
  const unitPerRuang = kelompokkan<SumberUnit & { ruangId: string }>(unitRows);

  return ruangRows
    .sort(
      (a, b) =>
        bandingkanNama(a.gedungNama, b.gedungNama) ||
        bandingkanNama(a.lantaiNama, b.lantaiNama) ||
        bandingkanNama(a.nama, b.nama),
    )
    .map((row) => ({
      ruang: row,
      items: susunBarisKir(batchPerRuang.get(row.id) ?? [], unitPerRuang.get(row.id) ?? []),
    }));
}

export async function getKirRuang(ruangId: string): Promise<KirData | null> {
  const [data] = await getKirBanyakRuang({ ruangId });
  return data ?? null;
}
