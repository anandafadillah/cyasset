import Link from "next/link";
import { Plus, User, Wrench } from "@phosphor-icons/react/dist/ssr";
import { Topbar } from "@/components/layout/topbar";
import { LaporanSearchBox } from "@/components/laporan-kerusakan/laporan-search-box";
import { LaporanStatusSelect } from "@/components/laporan-kerusakan/laporan-status-select";
import { TambahUnitPenggantiButton } from "@/components/laporan-kerusakan/tambah-unit-pengganti-button";
import { db } from "@/db";

const columns = [
  { status: "masuk", label: "Laporan Masuk", dotClass: "bg-muted" },
  { status: "diproses", label: "Diproses / Diperbaiki", dotClass: "bg-warn" },
  { status: "selesai", label: "Selesai", dotClass: "bg-good" },
  { status: "ganti_unit", label: "Ganti Unit", dotClass: "bg-danger" },
] as const;

const tingkatLabel: Record<string, string> = {
  rusak_ringan: "Rusak Ringan",
  rusak_berat: "Rusak Berat",
};

export default async function LaporanKerusakanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";

  const allRows = await db.query.laporanKerusakan.findMany({
    orderBy: (table, { desc }) => desc(table.createdAt),
    with: { barang: { with: { ruang: true } }, barangUnit: true },
  });

  const rows = q
    ? allRows.filter(
        (row) =>
          row.kodeTiket.toLowerCase().includes(q) ||
          row.barang.nama.toLowerCase().includes(q) ||
          row.deskripsi.toLowerCase().includes(q),
      )
    : allRows;

  const activeCount = allRows.filter((r) => r.status === "masuk" || r.status === "diproses").length;

  return (
    <>
      <Topbar
        title="Laporan Kerusakan"
        breadcrumb={`${activeCount} tiket aktif`}
        actions={
          <>
            <LaporanSearchBox />
            <Link
              href="/laporan-kerusakan/baru"
              className="flex items-center gap-2 rounded-lg bg-accent-strong px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={16} weight="bold" />
              Tiket Baru
            </Link>
          </>
        }
      />
      <div className="flex-1 overflow-x-auto p-6">
        <div className="grid min-w-225 grid-cols-4 items-start gap-3.5">
          {columns.map((col) => {
            const colRows = rows.filter((row) => row.status === col.status);
            return (
              <div key={col.status}>
                <div className="mb-3 flex items-center gap-2 px-0.5">
                  <span className={`size-2 flex-none rounded-full ${col.dotClass}`} />
                  <span className="text-[13px] font-semibold text-text">{col.label}</span>
                  <span className="ml-auto text-xs text-dim">{colRows.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {colRows.map((row) => (
                    <div key={row.id} className="rounded-xl border border-border bg-surface p-3.5">
                      <div className="flex gap-2.5">
                        <span className="grid size-9.5 flex-none place-items-center rounded-lg bg-surface-3 text-muted">
                          <Wrench size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium text-text">{row.deskripsi}</div>
                          <div className="truncate text-[11px] text-dim">
                            {row.barang.nama} · {row.barang.ruang.nama}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                        <span className="rounded-full bg-surface-3 px-2 py-0.5 font-mono text-dim">
                          #{row.kodeTiket}
                        </span>
                        <span className="ml-auto text-dim">
                          {row.barangUnit
                            ? `Unit ${row.barangUnit.subKode}`
                            : `${row.jumlahUnitTerdampak} unit`}{" "}
                          → {tingkatLabel[row.tingkatKerusakan]}
                        </span>
                      </div>
                      {row.pelapor && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-dim">
                          <User size={11} />
                          Dilaporkan: {row.pelapor}
                        </div>
                      )}
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <LaporanStatusSelect id={row.id} status={row.status} />
                        {row.status === "ganti_unit" && (
                          <TambahUnitPenggantiButton
                            laporanId={row.id}
                            barangNama={row.barang.nama}
                            isUnitMode={!!row.barangUnit}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {colRows.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-dim">
                      Tidak ada tiket
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
