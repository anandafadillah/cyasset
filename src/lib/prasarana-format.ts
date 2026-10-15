export const jenisLabel: Record<string, string> = {
  pembangunan_baru: "Pembangunan Baru",
  perbaikan: "Perbaikan",
  pemeliharaan: "Pemeliharaan",
};

export const statusLabel: Record<string, string> = {
  direncanakan: "Direncanakan",
  proses: "Sedang Proses",
  selesai: "Selesai",
};

// Jenis anggaran barang & prasarana — nilai sama dengan enum
// barang_sumber_dana / prasarana_sumber_dana di schema.ts.
export const sumberDanaLabel: Record<string, string> = {
  bosp: "BOSP",
  ssg: "SSG",
  hibah: "Hibah",
  lainnya: "Lainnya",
};

export function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function formatTanggalPendek(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
