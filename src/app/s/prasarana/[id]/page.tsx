import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Buildings } from "@phosphor-icons/react/dist/ssr";
import { PublicBadge, PublicField, PublicPanel } from "@/components/public/card-primitives";
import { db } from "@/db";
import { prasarana } from "@/db/schema";

const jenisLabel: Record<string, string> = {
  pembangunan_baru: "Pembangunan Baru",
  perbaikan: "Perbaikan",
  pemeliharaan: "Pemeliharaan",
};

const statusLabel: Record<string, { label: string; tone: "muted" | "warn" | "good" }> = {
  direncanakan: { label: "Direncanakan", tone: "muted" },
  proses: { label: "Dalam Proses", tone: "warn" },
  selesai: { label: "Selesai", tone: "good" },
};

function formatTanggal(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function PublicPrasaranaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const item = await db.query.prasarana.findFirst({
    where: eq(prasarana.id, id),
    with: { foto: { orderBy: (table, { asc }) => asc(table.createdAt) } },
  });

  if (!item || item.isArchived) notFound();

  const status = statusLabel[item.status] ?? statusLabel.direncanakan;

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
          <Buildings size={32} />
        </div>
      )}

      <div>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <PublicBadge label={jenisLabel[item.jenis] ?? item.jenis} />
          <PublicBadge label={status.label} tone={status.tone} />
        </div>
        <h1 className="text-xl font-semibold text-text">{item.nama}</h1>
        {item.lokasi && <div className="text-xs text-dim">{item.lokasi}</div>}
      </div>

      <PublicPanel title="Detail Pekerjaan">
        <div className="grid grid-cols-1 gap-3.5 text-sm sm:grid-cols-2">
          <PublicField label="Tanggal Mulai" value={formatTanggal(item.tanggalMulai)} />
          <PublicField label="Tanggal Selesai" value={item.tanggalSelesai ? formatTanggal(item.tanggalSelesai) : "—"} />
          <PublicField label="Deskripsi" value={item.deskripsi || "—"} className="sm:col-span-2" />
        </div>
      </PublicPanel>
    </div>
  );
}
