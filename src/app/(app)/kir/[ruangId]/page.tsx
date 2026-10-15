import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { CetakKirForm } from "@/components/kir/cetak-kir-form";
import { getKirRuang } from "@/lib/kir-data";

export default async function KirDetailPage({ params }: { params: Promise<{ ruangId: string }> }) {
  const { ruangId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(ruangId)) notFound();

  const data = await getKirRuang(ruangId);
  if (!data) notFound();

  const { ruang, items } = data;
  const total = {
    unit: items.reduce((sum, item) => sum + item.jumlah, 0),
    baik: items.reduce((sum, item) => sum + item.baik, 0),
    kurangBaik: items.reduce((sum, item) => sum + item.kurangBaik, 0),
    rusakBerat: items.reduce((sum, item) => sum + item.rusakBerat, 0),
  };

  return (
    <>
      <div className="page-topbar sticky top-0 z-10 flex h-[66px] flex-none items-center gap-3 border-b border-border bg-surface px-6">
        <Link href="/kir" className="grid size-8 place-items-center rounded-lg text-muted hover:text-text">
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold text-text">{ruang.nama}</h2>
          <div className="mt-0.5 text-xs text-dim">Kartu Inventaris Ruangan / {ruang.kode ?? ruang.nama}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4.5 p-4 sm:p-6">
        <div className="grid grid-cols-1 items-start gap-4.5 xl:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-border bg-surface p-4.5">
            <div className="grid grid-cols-2 gap-3.5 text-sm md:grid-cols-4">
              <Field label="Lokasi" value={`${ruang.gedungNama} · ${ruang.lantaiNama}`} />
              <Field label="Kode ruang" value={ruang.kode ?? "—"} />
              <Field
                label="Penanggung jawab"
                value={ruang.penanggungJawabNama ?? "—"}
                hint={ruang.penanggungJawabNip ? `NIP. ${ruang.penanggungJawabNip}` : undefined}
              />
              <Field
                label="Ringkasan"
                value={`${items.length} jenis · ${total.unit} unit`}
                hint={`Baik ${total.baik} · Kurang Baik ${total.kurangBaik} · Rusak Berat ${total.rusakBerat}`}
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4.5">
            <CetakKirForm ruangId={ruang.id} compact />
          </div>
        </div>

        <div className="responsive-table-panel overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="data-table w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-dim">
                  <th className="py-3 pl-4.5 font-medium">No.</th>
                  <th className="py-3 font-medium">Nama Barang</th>
                  <th className="py-3 font-medium">Merk / Model</th>
                  <th className="py-3 font-medium">Kode</th>
                  <th className="py-3 font-medium">Tahun</th>
                  <th className="py-3 font-medium">Jenis Anggaran</th>
                  <th className="py-3 text-center font-medium">Jumlah</th>
                  <th className="py-3 text-center font-medium">Baik</th>
                  <th className="py-3 text-center font-medium">Kurang Baik</th>
                  <th className="py-3 text-center font-medium">Rusak Berat</th>
                  <th className="py-3 pr-4.5 font-medium">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-sm text-dim">
                      Tidak ada barang tercatat di ruang ini.
                    </td>
                  </tr>
                )}
                {items.map((item, index) => (
                  <tr key={item.barangId} className="border-b border-border last:border-0">
                    <td className="py-3 pl-4.5 text-dim">
                      <span className="md:hidden">#</span>
                      {index + 1}
                    </td>
                    <td data-label="Nama Barang" className="py-3">
                      <div>
                        <Link href={`/barang/${item.barangId}`} className="font-medium text-text hover:text-accent">
                          {item.nama}
                        </Link>
                        {item.kategori && <div className="text-[11px] text-dim">{item.kategori}</div>}
                      </div>
                    </td>
                    <td data-label="Merk / Model" className="py-3 text-muted">
                      <span>{item.merkTipe ?? "—"}</span>
                    </td>
                    <td data-label="Kode" className="py-3 font-mono text-xs text-muted">
                      <span>{item.kode}</span>
                    </td>
                    <td data-label="Tahun" className="py-3 text-muted">
                      <span>{item.tahunPembelian}</span>
                    </td>
                    <td data-label="Jenis Anggaran" className="py-3 text-muted">
                      <span>{item.jenisAnggaran}</span>
                    </td>
                    <td data-label="Jumlah" className="py-3 text-center font-semibold text-text">
                      <span>{item.jumlah}</span>
                    </td>
                    <td data-label="Baik" className="py-3 text-center text-good">
                      <span>{item.baik}</span>
                    </td>
                    <td data-label="Kurang Baik" className="py-3 text-center text-warn">
                      <span>{item.kurangBaik}</span>
                    </td>
                    <td data-label="Rusak Berat" className="py-3 text-center text-danger">
                      <span>{item.rusakBerat}</span>
                    </td>
                    <td data-label="Keterangan" className="py-3 pr-4.5 text-xs text-muted">
                      <span>{item.keterangan || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-0.5 text-[11px] text-dim">{label}</div>
      <div className="text-text">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-dim">{hint}</div>}
    </div>
  );
}
