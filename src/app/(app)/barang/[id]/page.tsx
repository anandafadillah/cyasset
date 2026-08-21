import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { ArrowLeft, PencilSimple, QrCode } from "@phosphor-icons/react/dist/ssr";
import { ArchiveBarangButton } from "@/components/barang/archive-barang-button";
import { BarangHistoryTabs } from "@/components/barang/barang-history-tabs";
import { BarangUnitList, type BarangUnitRow } from "@/components/barang/barang-unit-list";
import { PhotoGallery } from "@/components/barang/photo-gallery";
import { getLocationTree } from "@/lib/locations";
import { formatRupiah, formatTanggalPendek, sumberDanaLabel } from "@/lib/prasarana-format";
import { getDipinjamUnitSet } from "@/lib/stok";
import { db } from "@/db";
import { barang, barangUnit, laporanKerusakan, peminjaman, peminjamanItem, staff } from "@/db/schema";

export default async function BarangDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const item = await db.query.barang.findFirst({
    where: eq(barang.id, id),
    with: {
      ruang: { with: { lantai: { with: { gedung: true } } } },
      subLokasi: true,
      foto: { orderBy: (table, { asc }) => asc(table.createdAt) },
      lokasi: {
        orderBy: (table, { asc }) => asc(table.urutan),
        with: { ruang: { with: { lantai: { with: { gedung: true } } } }, subLokasi: true },
      },
    },
  });

  if (!item) notFound();

  const [creator] = item.createdBy
    ? await db.select({ name: staff.name }).from(staff).where(eq(staff.id, item.createdBy)).limit(1)
    : [];

  const [{ dipinjam }] = await db
    .select({ dipinjam: sql<number>`coalesce(sum(${peminjamanItem.jumlah}), 0)::int` })
    .from(peminjamanItem)
    .innerJoin(peminjaman, eq(peminjamanItem.peminjamanId, peminjaman.id))
    .where(and(eq(peminjamanItem.barangId, item.id), eq(peminjaman.status, "dipinjam")));
  const tersedia = Math.max(0, item.jumlahBaik - dipinjam);

  const isUnitMode = item.modePelacakan === "unit";
  const [unitRows, gedungList, dipinjamUnitSet] = await Promise.all([
    isUnitMode
      ? db.query.barangUnit.findMany({
          where: eq(barangUnit.barangId, item.id),
          with: {
            ruang: { with: { lantai: { with: { gedung: true } } } },
            subLokasi: true,
            foto: { orderBy: (table, { asc }) => asc(table.createdAt) },
          },
          orderBy: (table, { asc }) => asc(table.subKode),
        })
      : Promise.resolve([]),
    isUnitMode ? getLocationTree() : Promise.resolve([]),
    isUnitMode ? getDipinjamUnitSet() : Promise.resolve(new Set<string>()),
  ]);
  const units: BarangUnitRow[] = unitRows.map((unit) => ({
    id: unit.id,
    subKode: unit.subKode,
    nomorSeri: unit.nomorSeri,
    kondisi: unit.kondisi,
    catatan: unit.catatan,
    lokasi: { ruangId: unit.ruangId, subLokasiId: unit.subLokasiId ?? "" },
    lokasiLabel: `${unit.ruang.lantai.gedung.nama} · ${unit.ruang.lantai.nama} · ${unit.ruang.nama}${
      unit.subLokasi ? ` · ${unit.subLokasi.nama}` : ""
    }`,
    foto: unit.foto.map((f) => ({ id: f.id, path: f.path })),
    sedangDipinjam: dipinjamUnitSet.has(unit.id),
  }));

  const [riwayatPeminjamanRows, riwayatKerusakanRows] = await Promise.all([
    db
      .select({
        // peminjamanItem.id (bukan peminjaman.id) — satu peminjaman bisa
        // punya beberapa item unit dari barang yang sama, id harus unik per
        // baris tabel di bawah (lihat BarangHistoryTabs).
        id: peminjamanItem.id,
        peminjamNama: peminjaman.peminjamNama,
        jenis: peminjaman.jenis,
        jumlah: peminjamanItem.jumlah,
        tanggalPinjam: peminjaman.tanggalPinjam,
        tanggalRencanaKembali: peminjaman.tanggalRencanaKembali,
        status: peminjaman.status,
        unitSubKode: barangUnit.subKode,
      })
      .from(peminjamanItem)
      .innerJoin(peminjaman, eq(peminjamanItem.peminjamanId, peminjaman.id))
      .leftJoin(barangUnit, eq(peminjamanItem.barangUnitId, barangUnit.id))
      .where(eq(peminjamanItem.barangId, item.id))
      .orderBy(sql`${peminjaman.createdAt} desc`),
    db
      .select()
      .from(laporanKerusakan)
      .where(eq(laporanKerusakan.barangId, item.id))
      .orderBy(sql`${laporanKerusakan.createdAt} desc`),
  ]);

  const isMultiLokasi = !isUnitMode && item.lokasi.length > 1;
  const lokasiLabel = isMultiLokasi
    ? `${item.lokasi.length} lokasi — lihat rincian di bawah`
    : `${item.ruang.lantai.gedung.nama} · ${item.ruang.lantai.nama} · ${item.ruang.nama}${
        item.subLokasi ? ` · ${item.subLokasi.nama}` : ""
      }`;
  const tanggalDitambahkan = item.createdAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const tanggalMasukLabel = item.tanggalMasuk ? formatTanggalPendek(item.tanggalMasuk) : "—";
  const sumberDanaText = item.sumberDana
    ? `${sumberDanaLabel[item.sumberDana]}${item.sumberDana === "lainnya" && item.sumberDanaLainnya ? ` (${item.sumberDanaLainnya})` : ""}${item.periodeDana ? ` · ${item.periodeDana}` : ""}`
    : "—";
  const nominalDanaLabel = item.nominalDana != null ? formatRupiah(item.nominalDana) : "—";

  return (
    <>
      <div className="sticky top-0 z-10 flex h-[66px] flex-none items-center gap-3 border-b border-border bg-surface px-6">
        <Link href="/barang" className="grid size-8 place-items-center rounded-lg text-muted hover:text-text">
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold text-text">{item.nama}</h2>
          <div className="mt-0.5 text-xs text-dim">Barang / {item.kode}</div>
        </div>
        {isUnitMode && (
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">Per-Unit</span>
        )}
        {item.isArchived && (
          <span className="rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-dim">Diarsipkan</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {!isUnitMode && (
            <Link
              href={`/barang/${item.id}/cetak-qr`}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-text"
            >
              <QrCode size={16} />
              Cetak QR
            </Link>
          )}
          {!item.isArchived && <ArchiveBarangButton id={item.id} nama={item.nama} />}
          <Link
            href={`/barang/${item.id}/edit`}
            className="flex items-center gap-2 rounded-lg bg-accent-strong px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PencilSimple size={16} />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5.5 p-6 lg:grid-cols-[340px_1fr]">
        <div className="flex flex-col gap-4">
          <PhotoGallery photos={item.foto} alt={`Foto kondisi ${item.nama}`} />

          <div className="rounded-xl border border-border bg-surface p-4.5">
            <h3 className="mb-3 text-sm font-semibold text-text">Kondisi terkini</h3>
            <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-surface-3">
              {item.jumlahBaik > 0 && (
                <span className="bg-good" style={{ width: `${(item.jumlahBaik / item.jumlahUnit) * 100}%` }} />
              )}
              {item.jumlahRusakRingan > 0 && (
                <span
                  className="bg-warn"
                  style={{ width: `${(item.jumlahRusakRingan / item.jumlahUnit) * 100}%` }}
                />
              )}
              {item.jumlahRusakBerat > 0 && (
                <span
                  className="bg-danger"
                  style={{ width: `${(item.jumlahRusakBerat / item.jumlahUnit) * 100}%` }}
                />
              )}
            </div>
            <dl className="flex flex-col gap-2 text-[13px]">
              <div className="flex">
                <dt className="text-text">Baik</dt>
                <dd className="ml-auto font-semibold text-good">{item.jumlahBaik}</dd>
              </div>
              <div className="flex">
                <dt className="text-text">Rusak Ringan</dt>
                <dd className="ml-auto font-semibold text-warn">{item.jumlahRusakRingan}</dd>
              </div>
              <div className="flex">
                <dt className="text-text">Rusak Berat</dt>
                <dd className="ml-auto font-semibold text-danger">{item.jumlahRusakBerat}</dd>
              </div>
              <div className="flex border-t border-border pt-2">
                <dt className="font-medium text-text">Total Unit</dt>
                <dd className="ml-auto font-semibold text-text">{item.jumlahUnit}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4.5">
          <div className="mb-4 flex flex-wrap gap-2">
            {item.kategori && (
              <span className="rounded-full bg-surface-3 px-2.5 py-1 text-xs text-muted">{item.kategori}</span>
            )}
            <span className="rounded-full bg-good-soft px-2.5 py-1 text-xs font-medium text-good">
              {tersedia} tersedia
            </span>
            {dipinjam > 0 && (
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                {dipinjam} dipinjam
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <Field label="Merk / Tipe" value={item.merkTipe || "—"} />
            <Field label="Kode Barang" value={item.kode} />
            <Field label="Kategori" value={item.kategori || "—"} />
            <Field label="Lokasi" value={lokasiLabel} className="sm:col-span-2" />
            <Field label="Ditambahkan" value={`${tanggalDitambahkan}${creator ? ` · ${creator.name}` : ""}`} />
            <Field label="Tanggal Masuk" value={tanggalMasukLabel} />
            <Field label="Sumber Dana" value={sumberDanaText} />
            <Field label="Nominal Dana" value={nominalDanaLabel} />
            <Field label="Spesifikasi Teknis" value={item.spesifikasi || "—"} className="sm:col-span-3" />
          </div>
        </div>
      </div>

      {isUnitMode && (
        <div className="px-6 pb-6">
          <h3 className="mb-3 text-sm font-semibold text-text">Unit Fisik ({units.length})</h3>
          <BarangUnitList barangId={item.id} units={units} gedungList={gedungList} />
        </div>
      )}

      {isMultiLokasi && (
        <div className="px-6 pb-6">
          <h3 className="mb-3 text-sm font-semibold text-text">Lokasi & Kondisi ({item.lokasi.length})</h3>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-dim">
                    <th className="py-3 pl-4.5 font-medium">Lokasi</th>
                    <th className="py-3 font-medium">Jumlah</th>
                    <th className="py-3 font-medium">Baik</th>
                    <th className="py-3 font-medium">Rusak Ringan</th>
                    <th className="py-3 pr-4.5 font-medium">Rusak Berat</th>
                  </tr>
                </thead>
                <tbody>
                  {item.lokasi.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="py-3 pl-4.5 text-text">
                        {row.ruang.nama}
                        {row.subLokasi ? ` · ${row.subLokasi.nama}` : ""}
                        <div className="text-[11px] text-dim">
                          Ged. {row.ruang.lantai.gedung.nama} · Lt. {row.ruang.lantai.nama}
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-text">{row.jumlah}</td>
                      <td className="py-3 text-good">{row.jumlahBaik}</td>
                      <td className="py-3 text-warn">{row.jumlahRusakRingan}</td>
                      <td className="py-3 pr-4.5 text-danger">{row.jumlahRusakBerat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pb-6">
        <BarangHistoryTabs
          peminjaman={riwayatPeminjamanRows}
          kerusakan={riwayatKerusakanRows.map((row) => ({
            id: row.id,
            kodeTiket: row.kodeTiket,
            deskripsi: row.deskripsi,
            jumlahUnitTerdampak: row.jumlahUnitTerdampak,
            tingkatKerusakan: row.tingkatKerusakan,
            status: row.status,
            createdAt: row.createdAt.toISOString(),
          }))}
        />
      </div>
    </>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-0.5 text-[11px] text-dim">{label}</div>
      <div className="text-text">{value}</div>
    </div>
  );
}
