export type BreakdownKondisi = {
  jumlahUnit: number;
  jumlahBaik: number;
  jumlahRusakRingan: number;
  jumlahRusakBerat: number;
};

export type TingkatKerusakan = "rusak_ringan" | "rusak_berat";
export type StatusTiket = "masuk" | "diproses" | "selesai" | "ganti_unit";

/**
 * Deep module murni: menerima breakdown kondisi barang saat ini + detail
 * tiket (jumlah unit terdampak, tingkat kerusakan) + status lama & baru
 * tiket, mengembalikan breakdown yang sudah dimutasi.
 *
 * - "selesai": pindahkan unit dari bucket Rusak (sesuai tingkat kerusakan
 *   tiket) kembali ke Baik.
 * - "ganti_unit": keluarkan unit dari bucket Rusak Berat sekaligus dari
 *   total unit (write-off) — kategori kondisi lain tidak tersentuh.
 * - Transisi lain (mis. ke "diproses") tidak memutasi apa pun.
 * - Jika statusLama === statusBaru (status di-set ulang ke nilai yang sama),
 *   tidak ada mutasi — mencegah penerapan ganda.
 * - Perpindahan selalu dibatasi (clamped) oleh jumlah yang benar-benar
 *   tersedia di bucket asal, sehingga hasil akhir tidak pernah minus atau
 *   melebihi jumlah unit asal.
 */
export function mutasiStokKerusakan(
  breakdown: BreakdownKondisi,
  jumlahUnitTerdampak: number,
  tingkatKerusakan: TingkatKerusakan,
  statusLama: StatusTiket,
  statusBaru: StatusTiket,
): BreakdownKondisi {
  if (statusLama === statusBaru) return breakdown;

  if (statusBaru === "selesai") {
    if (tingkatKerusakan === "rusak_ringan") {
      const pindah = Math.max(0, Math.min(jumlahUnitTerdampak, breakdown.jumlahRusakRingan));
      return {
        ...breakdown,
        jumlahRusakRingan: breakdown.jumlahRusakRingan - pindah,
        jumlahBaik: breakdown.jumlahBaik + pindah,
      };
    }
    const pindah = Math.max(0, Math.min(jumlahUnitTerdampak, breakdown.jumlahRusakBerat));
    return {
      ...breakdown,
      jumlahRusakBerat: breakdown.jumlahRusakBerat - pindah,
      jumlahBaik: breakdown.jumlahBaik + pindah,
    };
  }

  if (statusBaru === "ganti_unit") {
    const keluar = Math.max(0, Math.min(jumlahUnitTerdampak, breakdown.jumlahRusakBerat));
    return {
      ...breakdown,
      jumlahRusakBerat: breakdown.jumlahRusakBerat - keluar,
      jumlahUnit: breakdown.jumlahUnit - keluar,
    };
  }

  return breakdown;
}
