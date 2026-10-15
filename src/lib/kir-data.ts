import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { barang, barangLokasi, barangUnit, ruang, subLokasi } from "@/db/schema";
import { susunBarisKir, type KirBaris } from "@/lib/kir";

export type KirRuang = {
  id: string;
  nama: string;
  kode: string | null;
  penanggungJawabNama: string | null;
  penanggungJawabNip: string | null;
  lantaiNama: string;
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

/**
 * Isi Kartu Inventaris Ruangan untuk satu ruang — dipakai bersama oleh PDF
 * KIR, halaman /kir, dan halaman publik ruang. Barang batch diambil dari
 * porsinya di barang_lokasi (bukan total barang), barang unit dari unit-unit
 * fisik yang ruangId-nya ruang ini; barang arsip dikecualikan.
 */
export async function getKirRuang(ruangId: string): Promise<KirData | null> {
  const ruangRow = await db.query.ruang.findFirst({
    where: eq(ruang.id, ruangId),
    with: { lantai: { with: { gedung: true } } },
  });
  if (!ruangRow) return null;

  const [batchRows, unitRows] = await Promise.all([
    db
      .select({
        ...infoBarang,
        subLokasiNama: subLokasi.nama,
        jumlah: barangLokasi.jumlah,
        jumlahBaik: barangLokasi.jumlahBaik,
        jumlahRusakRingan: barangLokasi.jumlahRusakRingan,
        jumlahRusakBerat: barangLokasi.jumlahRusakBerat,
      })
      .from(barangLokasi)
      .innerJoin(barang, eq(barangLokasi.barangId, barang.id))
      .leftJoin(subLokasi, eq(barangLokasi.subLokasiId, subLokasi.id))
      .where(and(eq(barangLokasi.ruangId, ruangId), eq(barang.isArchived, false)))
      .orderBy(barangLokasi.urutan),
    db
      .select({
        ...infoBarang,
        unitId: barangUnit.id,
        subKode: barangUnit.subKode,
        subLokasiNama: subLokasi.nama,
        kondisi: barangUnit.kondisi,
      })
      .from(barangUnit)
      .innerJoin(barang, eq(barangUnit.barangId, barang.id))
      .leftJoin(subLokasi, eq(barangUnit.subLokasiId, subLokasi.id))
      .where(and(eq(barangUnit.ruangId, ruangId), eq(barang.isArchived, false))),
  ]);

  return {
    ruang: {
      id: ruangRow.id,
      nama: ruangRow.nama,
      kode: ruangRow.kode,
      penanggungJawabNama: ruangRow.penanggungJawabNama,
      penanggungJawabNip: ruangRow.penanggungJawabNip,
      lantaiNama: ruangRow.lantai.nama,
      gedungNama: ruangRow.lantai.gedung.nama,
    },
    items: susunBarisKir(batchRows, unitRows),
  };
}
