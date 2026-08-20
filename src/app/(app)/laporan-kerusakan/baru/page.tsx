import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { LaporanForm } from "@/components/laporan-kerusakan/laporan-form";
import type { BarangPickerOption } from "@/components/laporan-kerusakan/barang-picker";
import { db } from "@/db";
import { barang } from "@/db/schema";

export default async function LaporanKerusakanBaruPage() {
  const [batchRows, unitBarangRows] = await Promise.all([
    db.query.barang.findMany({
      where: and(eq(barang.isArchived, false), eq(barang.modePelacakan, "batch")),
    }),
    db.query.barang.findMany({
      where: and(eq(barang.isArchived, false), eq(barang.modePelacakan, "unit")),
      with: { units: true },
    }),
  ]);

  const batchOptions: BarangPickerOption[] = batchRows
    .filter((row) => row.jumlahBaik > 0)
    .map((row) => ({ id: row.id, nama: row.nama, kode: row.kode, modePelacakan: "batch" as const, jumlahBaik: row.jumlahBaik }));

  const unitOptions: BarangPickerOption[] = unitBarangRows
    .map((row) => ({
      id: row.id,
      nama: row.nama,
      kode: row.kode,
      modePelacakan: "unit" as const,
      units: row.units.filter((unit) => unit.kondisi === "baik").map((unit) => ({ id: unit.id, subKode: unit.subKode })),
    }))
    .filter((option) => option.units.length > 0);

  const barangOptions: BarangPickerOption[] = [...batchOptions, ...unitOptions];

  return (
    <>
      <div className="sticky top-0 z-10 flex h-[66px] flex-none items-center gap-3 border-b border-border bg-surface px-6">
        <Link
          href="/laporan-kerusakan"
          className="grid size-8 place-items-center rounded-lg text-muted hover:text-text"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-text">Tiket Baru</h2>
          <div className="mt-0.5 text-xs text-dim">Laporan Kerusakan / Baru</div>
        </div>
      </div>
      <div className="flex-1 p-6">
        <LaporanForm barangOptions={barangOptions} />
      </div>
    </>
  );
}
