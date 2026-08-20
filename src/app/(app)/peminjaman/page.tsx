import Link from "next/link";
import { FileArrowDown, HandArrowDown } from "@phosphor-icons/react/dist/ssr";
import { Topbar } from "@/components/layout/topbar";
import { PeminjamanFilterBar } from "@/components/peminjaman/peminjaman-filter-bar";
import { ReturnPeminjamanButton } from "@/components/peminjaman/return-peminjaman-button";
import { db } from "@/db";

export default async function PeminjamanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tab = typeof params.tab === "string" ? params.tab : "semua";
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";

  const allRows = await db.query.peminjaman.findMany({
    orderBy: (table, { desc }) => desc(table.createdAt),
    with: { items: { with: { barang: true } } },
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const isTerlambat = (row: (typeof allRows)[number]) =>
    row.status === "dipinjam" && row.tanggalRencanaKembali < todayStr;

  const counts = {
    semua: allRows.length,
    internal: allRows.filter((r) => r.jenis === "internal").length,
    eksternal: allRows.filter((r) => r.jenis === "eksternal").length,
    terlambat: allRows.filter(isTerlambat).length,
  };

  let rows = allRows;
  if (tab === "internal") rows = rows.filter((r) => r.jenis === "internal");
  else if (tab === "eksternal") rows = rows.filter((r) => r.jenis === "eksternal");
  else if (tab === "terlambat") rows = rows.filter(isTerlambat);

  if (q) {
    rows = rows.filter(
      (row) =>
        row.peminjamNama.toLowerCase().includes(q) ||
        row.items.some(
          (item) => item.barang.nama.toLowerCase().includes(q) || item.barang.kode.toLowerCase().includes(q),
        ),
    );
  }

  return (
    <>
      <Topbar
        title="Peminjaman"
        breadcrumb={`${counts.semua - allRows.filter((r) => r.status === "dikembalikan").length} aktif · ${counts.terlambat} terlambat`}
        actions={
          <>
            <Link
              href="/peminjaman/internal/baru"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-text"
            >
              <HandArrowDown size={16} />
              Peminjaman Internal
            </Link>
            <Link
              href="/peminjaman/eksternal/baru"
              className="flex items-center gap-2 rounded-lg bg-accent-strong px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <FileArrowDown size={16} />
              Peminjaman Eksternal
            </Link>
          </>
        }
      />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <PeminjamanFilterBar activeTab={tab} counts={counts} />

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-dim">
                  <th className="py-3 pl-4.5 font-medium">Peminjam</th>
                  <th className="py-3 font-medium">Barang</th>
                  <th className="py-3 font-medium">Jenis</th>
                  <th className="py-3 font-medium">Pinjam</th>
                  <th className="py-3 font-medium">Rencana Kembali</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 pr-4.5" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-dim">
                      Belum ada peminjaman untuk filter ini.
                    </td>
                  </tr>
                )}
                {rows.map((row) => {
                  const terlambat = isTerlambat(row);
                  const barangLabel = row.items.map((item) => `${item.barang.nama} ×${item.jumlah}`).join(", ");
                  return (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="py-3 pl-4.5">
                        <div className="font-medium text-text">{row.peminjamNama}</div>
                        <div className="text-[11px] text-dim">
                          {row.jenis === "eksternal"
                            ? [row.penanggungJawab && `PJ: ${row.penanggungJawab}`, row.nomorSurat && `Surat ${row.nomorSurat}`]
                                .filter(Boolean)
                                .join(" · ")
                            : [row.peminjamKeterangan, row.peminjamKontak].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      <td className="max-w-70 py-3 text-text">{barangLabel}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            row.jenis === "eksternal" ? "bg-accent-soft text-accent" : "bg-surface-3 text-muted"
                          }`}
                        >
                          {row.jenis === "eksternal" ? "Eksternal" : "Internal"}
                        </span>
                      </td>
                      <td className="py-3 text-text">{formatTanggalPendek(row.tanggalPinjam)}</td>
                      <td className={`py-3 ${terlambat ? "text-danger" : "text-text"}`}>
                        {formatTanggalPendek(row.tanggalRencanaKembali)}
                      </td>
                      <td className="py-3">
                        <StatusChip
                          status={row.status}
                          terlambat={terlambat}
                          hariTerlambat={daysBetween(row.tanggalRencanaKembali, todayStr)}
                        />
                      </td>
                      <td className="py-3 pr-4.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {row.nomorSurat && (
                            <a
                              href={`/api/surat/${row.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-text"
                            >
                              Surat
                            </a>
                          )}
                          {row.status === "dipinjam" ? (
                            <ReturnPeminjamanButton id={row.id} peminjamNama={row.peminjamNama} />
                          ) : (
                            <span className="text-xs text-dim">Selesai</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function formatTanggalPendek(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function daysBetween(earlier: string, later: string) {
  const diff = new Date(`${later}T00:00:00`).getTime() - new Date(`${earlier}T00:00:00`).getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function StatusChip({
  status,
  terlambat,
  hariTerlambat,
}: {
  status: string;
  terlambat: boolean;
  hariTerlambat: number;
}) {
  if (status === "dikembalikan") {
    return <span className="rounded-full bg-good-soft px-2.5 py-1 text-xs font-medium text-good">Dikembalikan</span>;
  }
  if (terlambat) {
    return (
      <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger">
        Terlambat {hariTerlambat} hari
      </span>
    );
  }
  return <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">Dipinjam</span>;
}
