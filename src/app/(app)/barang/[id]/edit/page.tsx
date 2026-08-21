import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { BarangForm, type BarangFormInitial } from "@/components/barang/barang-form";
import { getLocationTree } from "@/lib/locations";
import { db } from "@/db";
import { barang } from "@/db/schema";

export default async function EditBarangPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [item, gedungList] = await Promise.all([
    db.query.barang.findFirst({
      where: eq(barang.id, id),
      with: { foto: true, lokasi: { orderBy: (table, { asc }) => asc(table.urutan) } },
    }),
    getLocationTree(),
  ]);

  if (!item) notFound();

  const initialData: BarangFormInitial = {
    id: item.id,
    nama: item.nama,
    merkTipe: item.merkTipe,
    kode: item.kode,
    kategori: item.kategori,
    spesifikasi: item.spesifikasi,
    modePelacakan: item.modePelacakan,
    jumlahUnit: item.jumlahUnit,
    jumlahBaik: item.jumlahBaik,
    jumlahRusakRingan: item.jumlahRusakRingan,
    jumlahRusakBerat: item.jumlahRusakBerat,
    tanggalMasuk: item.tanggalMasuk,
    sumberDana: item.sumberDana,
    sumberDanaLainnya: item.sumberDanaLainnya,
    periodeDana: item.periodeDana,
    nominalDana: item.nominalDana,
    lokasi: {
      ruangId: item.ruangId,
      subLokasiId: item.subLokasiId ?? "",
    },
    lokasiList: item.lokasi.map((row) => ({
      ruangId: row.ruangId,
      subLokasiId: row.subLokasiId ?? "",
      jumlah: row.jumlah,
      jumlahBaik: row.jumlahBaik,
      jumlahRusakRingan: row.jumlahRusakRingan,
      jumlahRusakBerat: row.jumlahRusakBerat,
    })),
    existingPhotos: item.foto.map((foto) => ({ id: foto.id, path: foto.path })),
  };

  return (
    <>
      <div className="sticky top-0 z-10 flex h-[66px] flex-none items-center gap-3 border-b border-border bg-surface px-6">
        <Link
          href={`/barang/${item.id}`}
          className="grid size-8 place-items-center rounded-lg text-muted hover:text-text"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-text">Ubah Barang</h2>
          <div className="mt-0.5 text-xs text-dim">Barang / {item.kode} / Ubah</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <BarangForm gedungList={gedungList} initialData={initialData} />
      </div>
    </>
  );
}
