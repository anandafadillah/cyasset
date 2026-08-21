import Link from "next/link";
import { and, asc, eq, gt, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { DesktopTower, DownloadSimple, Plus } from "@phosphor-icons/react/dist/ssr";
import { Topbar } from "@/components/layout/topbar";
import { ConditionBar } from "@/components/barang/condition-bar";
import { BarangFilters, type LokasiOption } from "@/components/barang/barang-filters";
import { BarangRowMenu } from "@/components/barang/barang-row-menu";
import { BarangTableRow } from "@/components/barang/barang-table-row";
import { buildSortHref, SortableTh, type SortState } from "@/components/ui/sortable-th";
import { getLocationTree } from "@/lib/locations";
import { formatTanggalPendek } from "@/lib/prasarana-format";
import { getDipinjamMap } from "@/lib/stok";
import { db } from "@/db";
import { barang, barangLokasi } from "@/db/schema";

const PAGE_SIZE = 10;

const SORTABLE_COLUMNS = ["nama", "kategori", "jumlahUnit", "tanggalMasuk"] as const;

export default async function BarangPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const kategori = typeof params.kategori === "string" ? params.kategori : "";
  const lokasi = typeof params.lokasi === "string" ? params.lokasi : "";
  const kondisi = typeof params.kondisi === "string" ? params.kondisi : "";
  const tanggalMasukDari = typeof params.dari === "string" ? params.dari : "";
  const tanggalMasukSampai = typeof params.sampai === "string" ? params.sampai : "";
  const page = Math.max(1, Number(params.page) || 1);

  const sortParam = typeof params.sort === "string" ? params.sort : "";
  const sortState: SortState = {
    sort: (SORTABLE_COLUMNS as readonly string[]).includes(sortParam) ? sortParam : "",
    dir: params.dir === "asc" ? "asc" : "desc",
  };

  const conditions = [eq(barang.isArchived, false)];
  if (q) {
    conditions.push(
      or(ilike(barang.nama, `%${q}%`), ilike(barang.kode, `%${q}%`), ilike(barang.merkTipe, `%${q}%`))!,
    );
  }
  if (kategori) conditions.push(eq(barang.kategori, kategori));
  if (lokasi) {
    // barang.ruangId cuma lokasi "utama" (baris pertama) untuk barang batch
    // multi-lokasi — cocokkan juga barang_lokasi supaya barang yang cuma
    // punya SEBAGIAN di ruang ini tetap ketemu saat difilter per ruang.
    const barangDiRuangIni = db
      .select({ barangId: barangLokasi.barangId })
      .from(barangLokasi)
      .where(eq(barangLokasi.ruangId, lokasi));
    conditions.push(or(eq(barang.ruangId, lokasi), inArray(barang.id, barangDiRuangIni))!);
  }
  if (kondisi === "rusak-ringan") conditions.push(gt(barang.jumlahRusakRingan, 0));
  if (kondisi === "rusak-berat") conditions.push(gt(barang.jumlahRusakBerat, 0));
  if (kondisi === "baik-semua") conditions.push(sql`${barang.jumlahBaik} = ${barang.jumlahUnit}`);
  if (tanggalMasukDari) conditions.push(gte(barang.tanggalMasuk, tanggalMasukDari));
  if (tanggalMasukSampai) conditions.push(lte(barang.tanggalMasuk, tanggalMasukSampai));

  const where = and(...conditions);

  const [rows, [{ total }], [{ totalUnit }], gedungList, kategoriRows, dipinjamMap] = await Promise.all([
    db.query.barang.findMany({
      where,
      orderBy: (table, { asc, desc }) => {
        const dir = sortState.dir === "asc" ? asc : desc;
        switch (sortState.sort) {
          case "nama":
            return dir(table.nama);
          case "kategori":
            return dir(table.kategori);
          case "jumlahUnit":
            return dir(table.jumlahUnit);
          case "tanggalMasuk":
            return dir(table.tanggalMasuk);
          default:
            return desc(table.createdAt);
        }
      },
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      with: { ruang: { with: { lantai: { with: { gedung: true } } } }, subLokasi: true, lokasi: true },
    }),
    db.select({ total: sql<number>`count(*)::int` }).from(barang).where(where),
    db
      .select({ totalUnit: sql<number>`coalesce(sum(${barang.jumlahUnit}), 0)::int` })
      .from(barang)
      .where(eq(barang.isArchived, false)),
    getLocationTree(),
    db
      .selectDistinct({ kategori: barang.kategori })
      .from(barang)
      .where(and(eq(barang.isArchived, false), sql`${barang.kategori} is not null`))
      .orderBy(asc(barang.kategori)),
    getDipinjamMap(),
  ]);

  const lokasiOptions: LokasiOption[] = gedungList.flatMap((g) =>
    g.lantai.flatMap((l) => l.ruang.map((r) => ({ id: r.id, label: `${g.nama} · ${l.nama} · ${r.nama}` }))),
  );
  const kategoriOptions = kategoriRows.map((row) => row.kategori).filter((value): value is string => !!value);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Topbar
        title="Barang"
        breadcrumb={`${totalUnit} unit · ${total} jenis barang`}
        actions={
          <>
            <Link
              href="/laporan"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-text"
            >
              <DownloadSimple size={16} />
              Ekspor
            </Link>
            <Link
              href="/barang/baru"
              className="flex items-center gap-2 rounded-lg bg-accent-strong px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={16} weight="bold" />
              Tambah Barang
            </Link>
          </>
        }
      />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <BarangFilters kategoriOptions={kategoriOptions} lokasiOptions={lokasiOptions} />

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-dim">
                  <SortableTh
                    href={buildSortHref("/barang", params, sortState, "nama")}
                    active={sortState.sort === "nama"}
                    direction={sortState.dir}
                    className="pl-4.5"
                  >
                    Barang
                  </SortableTh>
                  <SortableTh
                    href={buildSortHref("/barang", params, sortState, "kategori")}
                    active={sortState.sort === "kategori"}
                    direction={sortState.dir}
                  >
                    Kategori
                  </SortableTh>
                  <th className="py-3 font-medium">Lokasi</th>
                  <SortableTh
                    href={buildSortHref("/barang", params, sortState, "jumlahUnit")}
                    active={sortState.sort === "jumlahUnit"}
                    direction={sortState.dir}
                  >
                    Jumlah
                  </SortableTh>
                  <th className="w-45 py-3 font-medium">Kondisi</th>
                  <th className="py-3 font-medium">Tersedia</th>
                  <SortableTh
                    href={buildSortHref("/barang", params, sortState, "tanggalMasuk")}
                    active={sortState.sort === "tanggalMasuk"}
                    direction={sortState.dir}
                  >
                    Tanggal Masuk
                  </SortableTh>
                  <th className="py-3 pr-4.5" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-dim">
                      Tidak ada barang yang cocok dengan pencarian/filter ini.
                    </td>
                  </tr>
                )}
                {rows.map((row) => {
                  const lokasiLabel = row.subLokasi
                    ? `${row.subLokasi.nama}`
                    : row.ruang.nama;
                  const gedungLantai = `Ged. ${row.ruang.lantai.gedung.nama} · Lt. ${row.ruang.lantai.nama}${
                    row.subLokasi ? ` · ${row.ruang.nama}` : ""
                  }`;
                  return (
                    <BarangTableRow key={row.id} id={row.id}>
                      <td className="py-3 pl-4.5">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 flex-none place-items-center rounded-lg bg-surface-3 text-muted">
                            <DesktopTower size={17} />
                          </span>
                          <div>
                            <div className="font-medium text-text">{row.nama}</div>
                            <div className="text-[11px] text-dim">
                              {row.kode}
                              {row.merkTipe ? ` · ${row.merkTipe}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        {row.kategori ? (
                          <span className="rounded-full bg-surface-3 px-2.5 py-1 text-xs text-muted">
                            {row.kategori}
                          </span>
                        ) : (
                          <span className="text-dim">—</span>
                        )}
                      </td>
                      <td className="py-3 text-text">
                        {row.lokasi.length > 1 ? (
                          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                            {row.lokasi.length} lokasi
                          </span>
                        ) : (
                          <>
                            {lokasiLabel}
                            <div className="text-[11px] text-dim">{gedungLantai}</div>
                          </>
                        )}
                      </td>
                      <td className="py-3 text-text">{row.jumlahUnit}</td>
                      <td className="py-3">
                        <ConditionBar
                          baik={row.jumlahBaik}
                          rusakRingan={row.jumlahRusakRingan}
                          rusakBerat={row.jumlahRusakBerat}
                        />
                      </td>
                      <td className="py-3 text-text">
                        {Math.max(0, row.jumlahBaik - (dipinjamMap.get(row.id) ?? 0))}
                      </td>
                      <td className="py-3 text-text">
                        {row.tanggalMasuk ? formatTanggalPendek(row.tanggalMasuk) : "—"}
                      </td>
                      <td className="py-3 pr-4.5 text-right">
                        <BarangRowMenu id={row.id} nama={row.nama} />
                      </td>
                    </BarangTableRow>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center border-t border-border px-4.5 py-3.5">
            <span className="text-xs text-dim">
              Menampilkan {rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {(page - 1) * PAGE_SIZE + rows.length} dari {total} jenis barang
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <PageLink page={page - 1} disabled={page <= 1} searchParams={params} label="‹" />
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                .map((p) => (
                  <PageLink key={p} page={p} active={p === page} searchParams={params} label={String(p)} />
                ))}
              <PageLink page={page + 1} disabled={page >= totalPages} searchParams={params} label="›" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PageLink({
  page,
  active,
  disabled,
  searchParams,
  label,
}: {
  page: number;
  active?: boolean;
  disabled?: boolean;
  searchParams: Record<string, string | string[] | undefined>;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="grid size-8 place-items-center rounded-lg border border-border text-xs text-faint">
        {label}
      </span>
    );
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || typeof value !== "string") continue;
    params.set(key, value);
  }
  params.set("page", String(page));
  return (
    <Link
      href={`/barang?${params.toString()}`}
      className={`grid size-8 place-items-center rounded-lg border text-xs font-medium ${
        active ? "border-accent-strong bg-accent-strong text-white" : "border-border text-muted hover:text-text"
      }`}
    >
      {label}
    </Link>
  );
}
