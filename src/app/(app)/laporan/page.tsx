import { and, eq, isNotNull } from "drizzle-orm";
import {
  ClipboardText,
  ClockCounterClockwise,
  FilePdf,
  FileXls,
  HandArrowDown,
  HardHat,
  Printer,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import { Topbar } from "@/components/layout/topbar";
import { getLocationTree } from "@/lib/locations";
import { db } from "@/db";
import { peminjaman } from "@/db/schema";

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function LaporanPage() {
  const now = new Date();
  const awalBulan = new Date(now.getFullYear(), now.getMonth(), 1);
  const akhirBulan = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [gedungList, suratRows] = await Promise.all([
    getLocationTree(),
    db.query.peminjaman.findMany({
      where: and(eq(peminjaman.jenis, "eksternal"), isNotNull(peminjaman.nomorSurat)),
      orderBy: (table, { desc }) => desc(table.createdAt),
    }),
  ]);

  const ruangOptions = gedungList.flatMap((g) =>
    g.lantai.flatMap((l) => l.ruang.map((r) => ({ id: r.id, label: `${g.nama} · ${l.nama} · ${r.nama}` }))),
  );

  return (
    <>
      <Topbar title="Laporan & Ekspor" breadcrumb="Untuk pimpinan & keperluan audit" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <IconBadge icon={<ClipboardText size={20} />} />
            <h3 className="mb-1 text-base font-semibold text-text">Laporan Inventaris Ruang</h3>
            <p className="mb-4 text-xs text-muted">Daftar barang + kondisi per ruang, siap tanda tangan.</p>
            <form action="/api/laporan/lir" method="get" target="_blank" className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ruangId" className="text-xs font-medium text-muted">
                  Ruang
                </label>
                <select
                  id="ruangId"
                  name="ruangId"
                  required
                  className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
                >
                  <option value="">Pilih ruang…</option>
                  {ruangOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-lg bg-accent-strong px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <FilePdf size={16} />
                Cetak LIR (PDF)
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <IconBadge icon={<HandArrowDown size={20} />} />
            <h3 className="mb-1 text-base font-semibold text-text">Rekap Peminjaman</h3>
            <p className="mb-4 text-xs text-muted">Internal &amp; eksternal dalam rentang tanggal.</p>
            <form action="/api/laporan/rekap-peminjaman" method="get" target="_blank" className="flex flex-col gap-3">
              <DateRangeFields dari={toDateInput(awalBulan)} sampai={toDateInput(akhirBulan)} />
              <div className="flex gap-2">
                <button
                  type="submit"
                  name="format"
                  value="pdf"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent-strong px-3 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <FilePdf size={16} />
                  PDF
                </button>
                <button
                  type="submit"
                  name="format"
                  value="excel"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted hover:text-text"
                >
                  <FileXls size={16} />
                  Excel
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <IconBadge icon={<Wrench size={20} />} />
            <h3 className="mb-1 text-base font-semibold text-text">Riwayat Perbaikan</h3>
            <p className="mb-4 text-xs text-muted">Seluruh tiket kerusakan &amp; hasil penanganannya.</p>
            <form action="/api/laporan/riwayat-perbaikan" method="get" target="_blank" className="flex flex-col gap-3">
              <DateRangeFields dari={toDateInput(awalBulan)} sampai={toDateInput(akhirBulan)} />
              <div className="flex gap-2">
                <button
                  type="submit"
                  name="format"
                  value="pdf"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent-strong px-3 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <FilePdf size={16} />
                  PDF
                </button>
                <button
                  type="submit"
                  name="format"
                  value="excel"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted hover:text-text"
                >
                  <FileXls size={16} />
                  Excel
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <IconBadge icon={<HardHat size={20} />} />
            <h3 className="mb-1 text-base font-semibold text-text">Rekap Prasarana</h3>
            <p className="mb-4 text-xs text-muted">Pekerjaan pembangunan &amp; perbaikan dalam rentang tanggal.</p>
            <form action="/api/laporan/rekap-prasarana" method="get" target="_blank" className="flex flex-col gap-3">
              <DateRangeFields dari={toDateInput(awalBulan)} sampai={toDateInput(akhirBulan)} />
              <div className="flex gap-2">
                <button
                  type="submit"
                  name="format"
                  value="pdf"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent-strong px-3 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <FilePdf size={16} />
                  PDF
                </button>
                <button
                  type="submit"
                  name="format"
                  value="excel"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted hover:text-text"
                >
                  <FileXls size={16} />
                  Excel
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2.5 border-b border-border px-4.5 py-3.5">
            <ClockCounterClockwise size={17} className="text-accent" />
            <h3 className="text-sm font-semibold text-text">Surat Peminjaman Terbit</h3>
            <span className="ml-auto text-xs text-dim">Dapat dicetak ulang bila salinan hilang</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-dim">
                  <th className="py-3 pl-4.5 font-medium">Nomor Surat</th>
                  <th className="py-3 font-medium">Peminjam</th>
                  <th className="py-3 font-medium">Tanggal</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 pr-4.5" />
                </tr>
              </thead>
              <tbody>
                {suratRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-dim">
                      Belum ada surat peminjaman eksternal yang terbit.
                    </td>
                  </tr>
                )}
                {suratRows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="py-3 pl-4.5 font-mono text-xs text-muted">{row.nomorSurat}</td>
                    <td className="py-3 text-text">{row.peminjamNama}</td>
                    <td className="py-3 text-text">
                      {row.createdAt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3">
                      {row.status === "dipinjam" ? (
                        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                          Berjalan
                        </span>
                      ) : (
                        <span className="rounded-full bg-good-soft px-2.5 py-1 text-xs font-medium text-good">
                          Selesai
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4.5 text-right">
                      <a
                        href={`/api/surat/${row.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-text"
                      >
                        <Printer size={13} />
                        Cetak ulang
                      </a>
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

function IconBadge({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="mb-3.5 grid size-10 place-items-center rounded-[10px] bg-accent-soft text-accent">{icon}</div>
  );
}

function DateRangeFields({ dari, sampai }: { dari: string; sampai: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dari" className="text-xs font-medium text-muted">
          Dari
        </label>
        <input
          id="dari"
          name="dari"
          type="date"
          required
          defaultValue={dari}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-sm text-text outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sampai" className="text-xs font-medium text-muted">
          Sampai
        </label>
        <input
          id="sampai"
          name="sampai"
          type="date"
          required
          defaultValue={sampai}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-sm text-text outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
