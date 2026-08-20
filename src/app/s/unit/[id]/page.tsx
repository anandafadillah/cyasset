import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { DesktopTower, Prohibit } from "@phosphor-icons/react/dist/ssr";
import { PublicBadge, PublicField, PublicPanel } from "@/components/public/card-primitives";
import { db } from "@/db";
import { barangUnit, peminjaman, peminjamanItem } from "@/db/schema";

const kondisiTone = {
  baik: "good",
  rusak_ringan: "warn",
  rusak_berat: "danger",
  hilang: "muted",
  diganti: "muted",
} as const;

const kondisiLabel = {
  baik: "Baik",
  rusak_ringan: "Rusak Ringan",
  rusak_berat: "Rusak Berat",
  hilang: "Hilang",
  diganti: "Diganti",
} as const;

export default async function PublicUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const unit = await db.query.barangUnit.findFirst({
    where: eq(barangUnit.id, id),
    with: {
      barang: true,
      ruang: { with: { lantai: { with: { gedung: true } } } },
      subLokasi: true,
      foto: { orderBy: (table, { asc }) => asc(table.createdAt) },
    },
  });

  if (!unit || unit.barang.isArchived) notFound();

  if (unit.kondisi === "diganti") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-surface-3 text-faint">
          <Prohibit size={24} />
        </span>
        <h1 className="text-lg font-semibold text-text">Unit ini sudah tidak aktif</h1>
        <p className="max-w-xs text-sm text-muted">
          Unit fisik <span className="font-mono">{unit.subKode}</span> dari {unit.barang.nama} sudah diganti dan
          ditarik dari penggunaan. Data ini disimpan untuk keperluan audit.
        </p>
      </div>
    );
  }

  const [activePeminjaman] = await db
    .select({ id: peminjaman.id })
    .from(peminjamanItem)
    .innerJoin(peminjaman, eq(peminjamanItem.peminjamanId, peminjaman.id))
    .where(and(eq(peminjamanItem.barangUnitId, unit.id), eq(peminjaman.status, "dipinjam")))
    .limit(1);

  const statusPemakaian = activePeminjaman
    ? { label: "Sedang Dipinjam", tone: "accent" as const }
    : unit.kondisi === "baik"
      ? { label: "Tersedia", tone: "good" as const }
      : unit.kondisi === "hilang"
        ? { label: "Hilang", tone: "muted" as const }
        : { label: kondisiLabel[unit.kondisi], tone: kondisiTone[unit.kondisi] };

  const lokasiLabel = `${unit.ruang.lantai.gedung.nama} · ${unit.ruang.lantai.nama} · ${unit.ruang.nama}${
    unit.subLokasi ? ` · ${unit.subLokasi.nama}` : ""
  }`;

  const foto = unit.foto[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={foto.path}
          alt={unit.subKode}
          className="h-52 w-full rounded-xl border border-border object-cover"
        />
      ) : (
        <div className="grid h-40 place-items-center rounded-xl border border-dashed border-border bg-surface-2 text-faint">
          <DesktopTower size={32} />
        </div>
      )}

      <div>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          {unit.barang.kategori && <PublicBadge label={unit.barang.kategori} />}
          <PublicBadge label="Per-Unit" tone="accent" />
          <PublicBadge label={statusPemakaian.label} tone={statusPemakaian.tone} />
        </div>
        <h1 className="text-xl font-semibold text-text">{unit.barang.nama}</h1>
        <div className="font-mono text-xs text-dim">
          {unit.subKode}
          {unit.barang.merkTipe ? ` · ${unit.barang.merkTipe}` : ""}
        </div>
      </div>

      <PublicPanel title="Unit ini">
        <div className="grid grid-cols-1 gap-3.5 text-sm sm:grid-cols-2">
          <PublicField label="Kondisi" value={<PublicBadge label={kondisiLabel[unit.kondisi]} tone={kondisiTone[unit.kondisi]} />} />
          <PublicField label="Nomor Seri" value={unit.nomorSeri || "—"} />
          <PublicField label="Lokasi" value={lokasiLabel} className="sm:col-span-2" />
          {unit.catatan && <PublicField label="Catatan" value={unit.catatan} className="sm:col-span-2" />}
        </div>
      </PublicPanel>

      <PublicPanel title="Identitas Jenis Barang">
        <div className="grid grid-cols-1 gap-3.5 text-sm sm:grid-cols-2">
          <PublicField label="Kode Jenis" value={unit.barang.kode} />
          <PublicField label="Kategori" value={unit.barang.kategori || "—"} />
          <PublicField label="Spesifikasi Teknis" value={unit.barang.spesifikasi || "—"} className="sm:col-span-2" />
        </div>
      </PublicPanel>
    </div>
  );
}
