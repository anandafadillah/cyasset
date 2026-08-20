import Link from "next/link";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { ClockCountdown, FileText, HandArrowDown, HardHat, Warning, Wrench } from "@phosphor-icons/react/dist/ssr";
import { Topbar } from "@/components/layout/topbar";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { barang, gedung, laporanKerusakan, peminjaman, prasarana, ruang } from "@/db/schema";

function sapaan(jamSekarang: number) {
  if (jamSekarang < 11) return "Selamat pagi";
  if (jamSekarang < 15) return "Selamat siang";
  if (jamSekarang < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function DashboardPage() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const bulanIni = now.getMonth();
  const tahunIni = now.getFullYear();

  const [
    [barangAgg],
    [{ gedungCount }],
    [{ ruangCount }],
    dipinjamRows,
    laporanAktifRows,
    suratRows,
    prasaranaBerjalanRows,
    session,
  ] = await Promise.all([
    db
      .select({
        totalUnit: sql<number>`coalesce(sum(${barang.jumlahUnit}), 0)::int`,
        totalBaik: sql<number>`coalesce(sum(${barang.jumlahBaik}), 0)::int`,
        totalRingan: sql<number>`coalesce(sum(${barang.jumlahRusakRingan}), 0)::int`,
        totalBerat: sql<number>`coalesce(sum(${barang.jumlahRusakBerat}), 0)::int`,
        jenisBarang: sql<number>`count(*)::int`,
        kategoriCount: sql<number>`count(distinct ${barang.kategori})::int`,
      })
      .from(barang)
      .where(eq(barang.isArchived, false)),
    db.select({ gedungCount: sql<number>`count(*)::int` }).from(gedung),
    db.select({ ruangCount: sql<number>`count(*)::int` }).from(ruang),
    db.query.peminjaman.findMany({
      where: eq(peminjaman.status, "dipinjam"),
      orderBy: (table, { asc }) => asc(table.tanggalRencanaKembali),
      with: { items: { with: { barang: true } } },
    }),
    db.query.laporanKerusakan.findMany({
      where: inArray(laporanKerusakan.status, ["masuk", "diproses"]),
      orderBy: (table, { asc }) => asc(table.createdAt),
      with: { barang: { with: { ruang: true } } },
    }),
    db
      .select({ nomorSurat: peminjaman.nomorSurat, createdAt: peminjaman.createdAt })
      .from(peminjaman)
      .where(and(eq(peminjaman.jenis, "eksternal"), isNotNull(peminjaman.nomorSurat)))
      .orderBy(sql`${peminjaman.createdAt} desc`),
    db
      .select({ status: prasarana.status })
      .from(prasarana)
      .where(and(eq(prasarana.isArchived, false), inArray(prasarana.status, ["direncanakan", "proses"]))),
    auth(),
  ]);

  const namaDepan = (session?.user.name ?? session?.user.username ?? "Admin").split(" ")[0];

  const terlambatRows = dipinjamRows.filter((row) => row.tanggalRencanaKembali < todayStr);
  const internalCount = dipinjamRows.filter((row) => row.jenis === "internal").length;
  const eksternalCount = dipinjamRows.filter((row) => row.jenis === "eksternal").length;

  const tiketPrioritas = laporanAktifRows.filter((row) => row.tingkatKerusakan === "rusak_berat").length;

  const suratBulanIni = suratRows.filter((row) => {
    const created = row.createdAt;
    return created.getMonth() === bulanIni && created.getFullYear() === tahunIni;
  }).length;
  const suratTerakhir = suratRows[0]?.nomorSurat ?? null;

  const prasaranaDirencanakanCount = prasaranaBerjalanRows.filter((row) => row.status === "direncanakan").length;
  const prasaranaProsesCount = prasaranaBerjalanRows.filter((row) => row.status === "proses").length;

  const totalUnit = barangAgg.totalUnit;
  const persenBaik = totalUnit > 0 ? Math.round((barangAgg.totalBaik / totalUnit) * 100) : 0;

  const perhatianItems: { icon: React.ReactNode; title: string; subtitle: string; chip: React.ReactNode }[] = [
    ...terlambatRows.slice(0, 3).map((row) => ({
      icon: <ClockCountdown size={20} className="text-danger" />,
      title: row.items.map((item) => item.barang.nama).join(", ") || row.peminjamNama,
      subtitle: `${row.peminjamNama} · lewat ${daysBetween(row.tanggalRencanaKembali, todayStr)} hari`,
      chip: (
        <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger">Terlambat</span>
      ),
    })),
    ...laporanAktifRows.slice(0, 3).map((row) => ({
      icon: <Wrench size={20} className={row.status === "diproses" ? "text-warn" : "text-dim"} />,
      title: row.deskripsi,
      subtitle: `${row.barang.ruang.nama} · #${row.kodeTiket}`,
      chip:
        row.status === "diproses" ? (
          <span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs font-medium text-warn">Diproses</span>
        ) : (
          <span className="rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-muted">Masuk</span>
        ),
    })),
  ].slice(0, 5);

  const berjalanItems = dipinjamRows.slice(0, 5).map((row) => ({
    id: row.id,
    nama: row.items.map((item) => item.barang.nama).join(", ") || "-",
    peminjam: row.peminjamNama,
    kembali: formatTanggalPendek(row.tanggalRencanaKembali),
    jenis: row.jenis,
  }));

  return (
    <>
      <Topbar
        title={`${sapaan(now.getHours())}, ${namaDepan}`}
        breadcrumb={now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      />

      <div className="flex flex-1 flex-col gap-6.5 p-6">
        <div className="grid grid-cols-1 items-stretch gap-6.5 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-1.5 py-2">
            <div className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">
              Total unit terkelola
            </div>
            <div className="text-[56px] leading-none font-semibold tracking-tight text-text sm:text-[68px]">
              {totalUnit.toLocaleString("id-ID")}
            </div>
            <div className="mt-1 text-sm text-muted">
              tersebar di {gedungCount} gedung · {ruangCount} ruang · {barangAgg.kategoriCount} kategori
            </div>
            <div className="mt-5 flex h-3 max-w-115 overflow-hidden rounded-full bg-surface-3">
              {barangAgg.totalBaik > 0 && (
                <span className="bg-good" style={{ width: `${(barangAgg.totalBaik / totalUnit) * 100}%` }} />
              )}
              {barangAgg.totalRingan > 0 && (
                <span className="bg-warn" style={{ width: `${(barangAgg.totalRingan / totalUnit) * 100}%` }} />
              )}
              {barangAgg.totalBerat > 0 && (
                <span className="bg-danger" style={{ width: `${(barangAgg.totalBerat / totalUnit) * 100}%` }} />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-5 text-[13px] text-text">
              <span>
                <b className="text-good">{barangAgg.totalBaik.toLocaleString("id-ID")}</b> Baik ({persenBaik}%)
              </span>
              <span>
                <b className="text-warn">{barangAgg.totalRingan.toLocaleString("id-ID")}</b> Rusak Ringan
              </span>
              <span>
                <b className="text-danger">{barangAgg.totalBerat.toLocaleString("id-ID")}</b> Rusak Berat
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <KpiCard
              icon={<HandArrowDown size={16} />}
              label="Sedang Dipinjam"
              value={dipinjamRows.length}
              sub={`${internalCount} internal · ${eksternalCount} eksternal`}
            />
            <KpiCard
              icon={<ClockCountdown size={16} />}
              label="Terlambat"
              value={terlambatRows.length}
              sub="perlu tindak lanjut"
              valueClassName={terlambatRows.length > 0 ? "text-danger" : undefined}
            />
            <KpiCard
              icon={<Wrench size={16} />}
              label="Tiket Aktif"
              value={laporanAktifRows.length}
              sub={tiketPrioritas > 0 ? `${tiketPrioritas} rusak berat` : "tidak ada prioritas tinggi"}
            />
            <KpiCard
              icon={<FileText size={16} />}
              label="Surat Bulan Ini"
              value={suratBulanIni}
              sub={suratTerakhir ? `terakhir ${suratTerakhir}` : "belum ada surat"}
            />
            <KpiCard
              icon={<HardHat size={16} />}
              label="Prasarana Berjalan"
              value={prasaranaDirencanakanCount + prasaranaProsesCount}
              sub={`${prasaranaDirencanakanCount} direncanakan · ${prasaranaProsesCount} proses`}
              className="col-span-2"
            />
          </div>
        </div>

        <hr className="border-border" />

        <div className="grid grid-cols-1 gap-6.5 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center">
              <h3 className="flex items-center gap-1.5 text-[15px] font-semibold text-text">
                <Warning size={16} className="text-danger" />
                Butuh perhatian
              </h3>
              <Link href="/laporan-kerusakan" className="ml-auto text-xs font-medium text-accent">
                Buka tiket
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {perhatianItems.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-dim">
                  Tidak ada yang perlu perhatian saat ini.
                </div>
              )}
              {perhatianItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg bg-surface px-3.5 py-2.75">
                  {item.icon}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-text">{item.title}</div>
                    <div className="truncate text-[11px] text-dim">{item.subtitle}</div>
                  </div>
                  {item.chip}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center">
              <h3 className="text-[15px] font-semibold text-text">Peminjaman berjalan</h3>
              <Link href="/peminjaman" className="ml-auto text-xs font-medium text-accent">
                Lihat semua
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {berjalanItems.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-dim">
                  Tidak ada peminjaman berjalan.
                </div>
              )}
              {berjalanItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg bg-surface px-3.5 py-2.75">
                  <span className="grid size-8 flex-none place-items-center rounded-lg bg-surface-3 text-[11px] font-semibold text-text">
                    {initials(item.peminjam)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-text">{item.nama}</div>
                    <div className="truncate text-[11px] text-dim">
                      {item.peminjam} · kembali {item.kembali}
                    </div>
                  </div>
                  <span className="rounded-full bg-surface-3 px-2.5 py-1 text-xs text-muted">
                    {item.jenis === "eksternal" ? "Eksternal" : "Internal"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  valueClassName,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-4 ${className ?? ""}`}>
      <div className="flex items-center gap-1.5 text-xs text-dim">
        {icon}
        {label}
      </div>
      <div className={`mt-1.5 text-[28px] font-semibold text-text ${valueClassName ?? ""}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-dim">{sub}</div>
    </div>
  );
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function formatTanggalPendek(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function daysBetween(earlier: string, later: string) {
  const diff = new Date(`${later}T00:00:00`).getTime() - new Date(`${earlier}T00:00:00`).getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}
