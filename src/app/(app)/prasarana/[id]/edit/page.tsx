import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { PrasaranaForm, type PrasaranaFormInitial } from "@/components/prasarana/prasarana-form";
import { db } from "@/db";
import { prasarana } from "@/db/schema";

export default async function EditPrasaranaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const item = await db.query.prasarana.findFirst({ where: eq(prasarana.id, id), with: { foto: true } });
  if (!item) notFound();

  const initialData: PrasaranaFormInitial = {
    id: item.id,
    nama: item.nama,
    jenis: item.jenis,
    deskripsi: item.deskripsi,
    lokasi: item.lokasi,
    status: item.status,
    tanggalMulai: item.tanggalMulai,
    tanggalSelesai: item.tanggalSelesai,
    sumberDana: item.sumberDana,
    sumberDanaLainnya: item.sumberDanaLainnya,
    periodeDana: item.periodeDana,
    nominalDana: item.nominalDana,
    existingPhotos: item.foto.map((foto) => ({ id: foto.id, path: foto.path })),
  };

  return (
    <>
      <div className="sticky top-0 z-10 flex h-[66px] flex-none items-center gap-3 border-b border-border bg-surface px-6">
        <Link href="/prasarana" className="grid size-8 place-items-center rounded-lg text-muted hover:text-text">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-text">Ubah Pekerjaan Prasarana</h2>
          <div className="mt-0.5 text-xs text-dim">Prasarana / {item.nama} / Ubah</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <PrasaranaForm initialData={initialData} />
      </div>
    </>
  );
}
