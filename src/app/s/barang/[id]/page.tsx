import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { DesktopTower } from "@phosphor-icons/react/dist/ssr";
import { PublicBadge, PublicField, PublicPanel } from "@/components/public/card-primitives";
import { db } from "@/db";
import { barang } from "@/db/schema";

export default async function PublicBarangPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const item = await db.query.barang.findFirst({
    where: eq(barang.id, id),
    with: {
      ruang: { with: { lantai: { with: { gedung: true } } } },
      subLokasi: true,
      foto: { orderBy: (table, { asc }) => asc(table.createdAt) },
    },
  });

  if (!item || item.isArchived) notFound();

  const lokasiLabel = `${item.ruang.lantai.gedung.nama} · ${item.ruang.lantai.nama} · ${item.ruang.nama}${
    item.subLokasi ? ` · ${item.subLokasi.nama}` : ""
  }`;

  return (
    <div className="flex flex-col gap-4">
      {item.foto[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.foto[0].path}
          alt={item.nama}
          className="h-52 w-full rounded-xl border border-border object-cover"
        />
      ) : (
        <div className="grid h-40 place-items-center rounded-xl border border-dashed border-border bg-surface-2 text-faint">
          <DesktopTower size={32} />
        </div>
      )}

      <div>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          {item.kategori && <PublicBadge label={item.kategori} />}
          <PublicBadge label="Batch" tone="accent" />
        </div>
        <h1 className="text-xl font-semibold text-text">{item.nama}</h1>
        <div className="text-xs text-dim">
          {item.kode}
          {item.merkTipe ? ` · ${item.merkTipe}` : ""}
        </div>
      </div>

      <PublicPanel title="Kondisi">
        <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-surface-3">
          {item.jumlahBaik > 0 && (
            <span className="bg-good" style={{ width: `${(item.jumlahBaik / item.jumlahUnit) * 100}%` }} />
          )}
          {item.jumlahRusakRingan > 0 && (
            <span className="bg-warn" style={{ width: `${(item.jumlahRusakRingan / item.jumlahUnit) * 100}%` }} />
          )}
          {item.jumlahRusakBerat > 0 && (
            <span className="bg-danger" style={{ width: `${(item.jumlahRusakBerat / item.jumlahUnit) * 100}%` }} />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <PublicField label="Baik" value={item.jumlahBaik} />
          <PublicField label="Rusak Ringan" value={item.jumlahRusakRingan} />
          <PublicField label="Rusak Berat" value={item.jumlahRusakBerat} />
          <PublicField label="Total Unit" value={item.jumlahUnit} />
        </div>
      </PublicPanel>

      <PublicPanel title="Detail">
        <div className="grid grid-cols-1 gap-3.5 text-sm sm:grid-cols-2">
          <PublicField label="Lokasi" value={lokasiLabel} className="sm:col-span-2" />
          <PublicField label="Spesifikasi Teknis" value={item.spesifikasi || "—"} className="sm:col-span-2" />
        </div>
      </PublicPanel>
    </div>
  );
}
