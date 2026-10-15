import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { PublicBadge, PublicField, PublicPanel } from "@/components/public/card-primitives";
import { getKirRuang } from "@/lib/kir-data";
import type { KirBaris } from "@/lib/kir";

const kondisiUnit = {
  baik: { label: "Baik", tone: "good" },
  rusak_ringan: { label: "Kurang Baik", tone: "warn" },
  rusak_berat: { label: "Rusak Berat", tone: "danger" },
  hilang: { label: "Hilang", tone: "muted" },
  diganti: { label: "Diganti", tone: "muted" },
} as const;

// Halaman publik hasil scan QR ruang — sengaja TIDAK menampilkan jenis
// anggaran, tahun pembelian, nominal, maupun NIP (data itu hanya di PDF KIR
// & halaman /kir yang wajib login).
export default async function PublicRuangPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const data = await getKirRuang(id);
  if (!data) notFound();

  const { ruang, items } = data;
  const total = {
    unit: items.reduce((sum, item) => sum + item.jumlah, 0),
    baik: items.reduce((sum, item) => sum + item.baik, 0),
    kurangBaik: items.reduce((sum, item) => sum + item.kurangBaik, 0),
    rusakBerat: items.reduce((sum, item) => sum + item.rusakBerat, 0),
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <PublicBadge label="Kartu Inventaris Ruangan" tone="accent" />
          {ruang.kode && <PublicBadge label={ruang.kode} />}
        </div>
        <h1 className="text-xl font-semibold text-text">{ruang.nama}</h1>
        <div className="text-xs text-dim">
          {ruang.gedungNama} · {ruang.lantaiNama}
        </div>
      </div>

      <PublicPanel title="Ringkasan">
        {total.unit > 0 && (
          <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-surface-3">
            {total.baik > 0 && <span className="bg-good" style={{ width: `${(total.baik / total.unit) * 100}%` }} />}
            {total.kurangBaik > 0 && (
              <span className="bg-warn" style={{ width: `${(total.kurangBaik / total.unit) * 100}%` }} />
            )}
            {total.rusakBerat > 0 && (
              <span className="bg-danger" style={{ width: `${(total.rusakBerat / total.unit) * 100}%` }} />
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <PublicField label="Jenis barang" value={items.length} />
          <PublicField label="Total unit" value={total.unit} />
          <PublicField
            label="Penanggung jawab"
            value={ruang.penanggungJawabNama ?? "—"}
            className="col-span-2 sm:col-span-1"
          />
          <PublicField label="Baik" value={total.baik} />
          <PublicField label="Kurang Baik" value={total.kurangBaik} />
          <PublicField label="Rusak Berat" value={total.rusakBerat} />
        </div>
      </PublicPanel>

      <PublicPanel title="Daftar Barang">
        {items.length === 0 ? (
          <p className="text-sm text-dim">Tidak ada barang tercatat di ruang ini.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((item) => (
              <li key={item.barangId} className="py-3 first:pt-0 last:pb-0">
                {item.mode === "batch" ? (
                  <Link href={`/s/barang/${item.barangId}`} className="group flex items-start gap-3">
                    <BarangInfo item={item} />
                    <CaretRight size={16} className="mt-1 flex-none text-dim group-hover:text-text" />
                  </Link>
                ) : (
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
                      <BarangInfo item={item} />
                      <CaretRight
                        size={16}
                        className="mt-1 flex-none text-dim transition-transform group-open:rotate-90"
                      />
                    </summary>
                    <ul className="mt-2.5 flex flex-col gap-1.5 rounded-lg bg-surface-2 p-2">
                      {item.units.map((unit) => (
                        <li key={unit.id}>
                          <Link
                            href={`/s/unit/${unit.id}`}
                            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-surface-3"
                          >
                            <span className="font-mono text-muted">{unit.subKode}</span>
                            <PublicBadge
                              label={kondisiUnit[unit.kondisi].label}
                              tone={kondisiUnit[unit.kondisi].tone}
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </PublicPanel>
    </div>
  );
}

function BarangInfo({ item }: { item: KirBaris }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-text">{item.nama}</span>
        <span className="flex-none text-sm font-semibold text-text">{item.jumlah} unit</span>
      </div>
      <div className="text-xs text-dim">
        {item.kode}
        {item.merkTipe ? ` · ${item.merkTipe}` : ""}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px]">
        <span className="text-good">Baik {item.baik}</span>
        <span className="text-warn">Kurang Baik {item.kurangBaik}</span>
        <span className="text-danger">Rusak Berat {item.rusakBerat}</span>
        {item.hilang > 0 && <span className="text-dim">Hilang {item.hilang}</span>}
      </div>
    </div>
  );
}
