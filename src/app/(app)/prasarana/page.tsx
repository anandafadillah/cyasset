import Link from "next/link";
import { sql } from "drizzle-orm";
import { HardHat, Plus } from "@phosphor-icons/react/dist/ssr";
import { Topbar } from "@/components/layout/topbar";
import { PrasaranaFilterBar } from "@/components/prasarana/prasarana-filter-bar";
import { PrasaranaRowMenu } from "@/components/prasarana/prasarana-row-menu";
import { PrasaranaStatusControl } from "@/components/prasarana/prasarana-status-control";
import { PrasaranaTableRow } from "@/components/prasarana/prasarana-table-row";
import { buildSortHref, SortableTh, type SortState } from "@/components/ui/sortable-th";
import { db } from "@/db";
import { prasarana } from "@/db/schema";
import { jenisLabel, sumberDanaLabel, formatRupiah, formatTanggalPendek } from "@/lib/prasarana-format";

const SORTABLE_COLUMNS = ["nama", "jenis", "tanggalMulai", "sumberDana", "nominalDana", "status"] as const;

function sortValue(row: typeof prasarana.$inferSelect, column: string): string | number | null {
  switch (column) {
    case "nama":
      return row.nama;
    case "jenis":
      return row.jenis;
    case "tanggalMulai":
      return row.tanggalMulai;
    case "sumberDana":
      return row.sumberDana;
    case "nominalDana":
      return row.nominalDana;
    case "status":
      return row.status;
    default:
      return null;
  }
}

function compareSortValues(a: string | number | null, b: string | number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
  return a < b ? -1 : a > b ? 1 : 0;
}

export default async function PrasaranaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tab = typeof params.tab === "string" ? params.tab : "semua";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const jenis = typeof params.jenis === "string" ? params.jenis : "";
  const sumberDana = typeof params.sumberDana === "string" ? params.sumberDana : "";
  const tanggalMulaiDari = typeof params.dari === "string" ? params.dari : "";
  const tanggalMulaiSampai = typeof params.sampai === "string" ? params.sampai : "";
  const sortParam = typeof params.sort === "string" ? params.sort : "";
  const sortState: SortState = {
    sort: (SORTABLE_COLUMNS as readonly string[]).includes(sortParam) ? sortParam : "",
    dir: params.dir === "asc" ? "asc" : "desc",
  };

  const allRows = await db.query.prasarana.findMany({
    where: sql`${prasarana.isArchived} = false`,
    orderBy: (table, { desc }) => desc(table.createdAt),
  });

  const counts = {
    semua: allRows.length,
    direncanakan: allRows.filter((r) => r.status === "direncanakan").length,
    proses: allRows.filter((r) => r.status === "proses").length,
    selesai: allRows.filter((r) => r.status === "selesai").length,
  };

  let rows = allRows;
  if (tab !== "semua") rows = rows.filter((r) => r.status === tab);
  if (jenis) rows = rows.filter((r) => r.jenis === jenis);
  if (sumberDana) rows = rows.filter((r) => r.sumberDana === sumberDana);
  if (tanggalMulaiDari) rows = rows.filter((r) => r.tanggalMulai >= tanggalMulaiDari);
  if (tanggalMulaiSampai) rows = rows.filter((r) => r.tanggalMulai <= tanggalMulaiSampai);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(
      (row) => row.nama.toLowerCase().includes(needle) || (row.lokasi ?? "").toLowerCase().includes(needle),
    );
  }
  if (sortState.sort) {
    const column = sortState.sort;
    rows = [...rows].sort((a, b) => {
      const result = compareSortValues(sortValue(a, column), sortValue(b, column));
      return sortState.dir === "asc" ? result : -result;
    });
  }

  return (
    <>
      <Topbar
        title="Prasarana"
        breadcrumb={`${counts.semua} pekerjaan · ${counts.proses} sedang proses`}
        actions={
          <Link
            href="/prasarana/baru"
            className="flex items-center gap-2 rounded-lg bg-accent-strong px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={16} weight="bold" />
            Tambah Pekerjaan
          </Link>
        }
      />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <PrasaranaFilterBar activeTab={tab} counts={counts} />

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-dim">
                  <SortableTh
                    href={buildSortHref("/prasarana", params, sortState, "nama")}
                    active={sortState.sort === "nama"}
                    direction={sortState.dir}
                    className="pl-4.5"
                  >
                    Pekerjaan
                  </SortableTh>
                  <SortableTh
                    href={buildSortHref("/prasarana", params, sortState, "jenis")}
                    active={sortState.sort === "jenis"}
                    direction={sortState.dir}
                  >
                    Jenis
                  </SortableTh>
                  <SortableTh
                    href={buildSortHref("/prasarana", params, sortState, "tanggalMulai")}
                    active={sortState.sort === "tanggalMulai"}
                    direction={sortState.dir}
                  >
                    Waktu
                  </SortableTh>
                  <SortableTh
                    href={buildSortHref("/prasarana", params, sortState, "sumberDana")}
                    active={sortState.sort === "sumberDana"}
                    direction={sortState.dir}
                  >
                    Sumber Dana
                  </SortableTh>
                  <SortableTh
                    href={buildSortHref("/prasarana", params, sortState, "nominalDana")}
                    active={sortState.sort === "nominalDana"}
                    direction={sortState.dir}
                  >
                    Nominal
                  </SortableTh>
                  <SortableTh
                    href={buildSortHref("/prasarana", params, sortState, "status")}
                    active={sortState.sort === "status"}
                    direction={sortState.dir}
                  >
                    Status
                  </SortableTh>
                  <th className="py-3 pr-4.5" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-dim">
                      Tidak ada pekerjaan prasarana yang cocok dengan pencarian/filter ini.
                    </td>
                  </tr>
                )}
                {rows.map((row) => (
                  <PrasaranaTableRow key={row.id} id={row.id}>
                    <td className="py-3 pl-4.5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 flex-none place-items-center rounded-lg bg-surface-3 text-muted">
                          <HardHat size={17} />
                        </span>
                        <div>
                          <div className="font-medium text-text">{row.nama}</div>
                          <div className="text-[11px] text-dim">{row.lokasi || "Lokasi tidak dicatat"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-surface-3 px-2.5 py-1 text-xs text-muted">
                        {jenisLabel[row.jenis]}
                      </span>
                    </td>
                    <td className="py-3 text-text">
                      {formatTanggalPendek(row.tanggalMulai)}
                      {" – "}
                      {row.tanggalSelesai ? formatTanggalPendek(row.tanggalSelesai) : "berjalan"}
                    </td>
                    <td className="py-3 text-text">
                      {sumberDanaLabel[row.sumberDana]}
                      {row.periodeDana && <div className="text-[11px] text-dim">{row.periodeDana}</div>}
                    </td>
                    <td className="py-3 text-text">{row.nominalDana != null ? formatRupiah(row.nominalDana) : "—"}</td>
                    <td className="py-3">
                      <PrasaranaStatusControl id={row.id} nama={row.nama} status={row.status} />
                    </td>
                    <td className="py-3 pr-4.5 text-right">
                      <PrasaranaRowMenu id={row.id} nama={row.nama} />
                    </td>
                  </PrasaranaTableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
