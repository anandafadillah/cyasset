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

export const sumberDanaLabel: Record<string, string> = {
  ssg: "SSG",
  bos: "BOS",
  komite_sekolah: "Komite Sekolah",
  mandiri_yayasan: "Mandiri Yayasan",
  lainnya: "Lainnya",
};

export function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function formatTanggalPendek(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
