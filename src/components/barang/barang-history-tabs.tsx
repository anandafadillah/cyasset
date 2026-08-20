"use client";

import { useState } from "react";

export type RiwayatPeminjamanRow = {
  id: string;
  peminjamNama: string;
  jenis: string;
  jumlah: number;
  tanggalPinjam: string;
  tanggalRencanaKembali: string;
  status: string;
  unitSubKode?: string | null;
};

export type RiwayatKerusakanRow = {
  id: string;
  kodeTiket: string;
  deskripsi: string;
  jumlahUnitTerdampak: number;
  tingkatKerusakan: string;
  status: string;
  createdAt: string;
};

const statusPeminjamanLabel: Record<string, { label: string; className: string }> = {
  dipinjam: { label: "Dipinjam", className: "bg-accent-soft text-accent" },
  dikembalikan: { label: "Dikembalikan", className: "bg-good-soft text-good" },
};

const statusKerusakanLabel: Record<string, { label: string; className: string }> = {
  masuk: { label: "Masuk", className: "bg-surface-3 text-muted" },
  diproses: { label: "Diproses", className: "bg-warn-soft text-warn" },
  selesai: { label: "Selesai", className: "bg-good-soft text-good" },
  ganti_unit: { label: "Ganti Unit", className: "bg-danger-soft text-danger" },
};

function formatTanggal(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function BarangHistoryTabs({
  peminjaman,
  kerusakan,
}: {
  peminjaman: RiwayatPeminjamanRow[];
  kerusakan: RiwayatKerusakanRow[];
}) {
  const [tab, setTab] = useState<"peminjaman" | "kerusakan">("peminjaman");

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-5 border-b border-border px-4.5">
        <button
          type="button"
          onClick={() => setTab("peminjaman")}
          className={`border-b-2 py-3 text-sm font-medium ${
            tab === "peminjaman" ? "border-accent text-accent" : "border-transparent text-muted hover:text-text"
          }`}
        >
          Riwayat Peminjaman
        </button>
        <button
          type="button"
          onClick={() => setTab("kerusakan")}
          className={`border-b-2 py-3 text-sm font-medium ${
            tab === "kerusakan" ? "border-accent text-accent" : "border-transparent text-muted hover:text-text"
          }`}
        >
          Riwayat Kerusakan
        </button>
      </div>

      {tab === "peminjaman" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-xs text-dim">
                <th className="py-2.5 pl-4.5 font-medium">Peminjam</th>
                <th className="py-2.5 font-medium">Jenis</th>
                <th className="py-2.5 font-medium">Jumlah / Unit</th>
                <th className="py-2.5 font-medium">Pinjam</th>
                <th className="py-2.5 font-medium">Rencana Kembali</th>
                <th className="py-2.5 pr-4.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {peminjaman.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-dim">
                    Belum ada riwayat peminjaman untuk barang ini.
                  </td>
                </tr>
              )}
              {peminjaman.map((row) => {
                const status = statusPeminjamanLabel[row.status] ?? statusPeminjamanLabel.dipinjam;
                return (
                  <tr key={row.id} className="border-t border-border">
                    <td className="py-2.5 pl-4.5 text-text">{row.peminjamNama}</td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs text-muted">
                        {row.jenis === "eksternal" ? "Eksternal" : "Internal"}
                      </span>
                    </td>
                    <td className="py-2.5 text-text">{row.unitSubKode ? `Unit ${row.unitSubKode}` : row.jumlah}</td>
                    <td className="py-2.5 text-text">{formatTanggal(row.tanggalPinjam)}</td>
                    <td className="py-2.5 text-text">{formatTanggal(row.tanggalRencanaKembali)}</td>
                    <td className="py-2.5 pr-4.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-xs text-dim">
                <th className="py-2.5 pl-4.5 font-medium">Tiket</th>
                <th className="py-2.5 font-medium">Deskripsi</th>
                <th className="py-2.5 font-medium">Unit Terdampak</th>
                <th className="py-2.5 font-medium">Tanggal</th>
                <th className="py-2.5 pr-4.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {kerusakan.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-dim">
                    Belum ada riwayat laporan kerusakan untuk barang ini.
                  </td>
                </tr>
              )}
              {kerusakan.map((row) => {
                const status = statusKerusakanLabel[row.status] ?? statusKerusakanLabel.masuk;
                return (
                  <tr key={row.id} className="border-t border-border">
                    <td className="py-2.5 pl-4.5 font-mono text-xs text-muted">#{row.kodeTiket}</td>
                    <td className="max-w-70 truncate py-2.5 text-text">{row.deskripsi}</td>
                    <td className="py-2.5 text-text">
                      {row.jumlahUnitTerdampak} ·{" "}
                      {row.tingkatKerusakan === "rusak_ringan" ? "Rusak Ringan" : "Rusak Berat"}
                    </td>
                    <td className="py-2.5 text-text">{formatTanggal(row.createdAt.slice(0, 10))}</td>
                    <td className="py-2.5 pr-4.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
