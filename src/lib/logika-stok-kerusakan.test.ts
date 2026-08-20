import { describe, expect, it } from "vitest";
import { mutasiStokKerusakan, type BreakdownKondisi } from "@/lib/logika-stok-kerusakan";

function breakdown(overrides: Partial<BreakdownKondisi> = {}): BreakdownKondisi {
  return { jumlahUnit: 10, jumlahBaik: 6, jumlahRusakRingan: 3, jumlahRusakBerat: 1, ...overrides };
}

describe("mutasiStokKerusakan", () => {
  it('transisi ke "selesai" memindahkan jumlah dari Rusak Ringan ke Baik dengan benar', () => {
    const hasil = mutasiStokKerusakan(breakdown(), 2, "rusak_ringan", "diproses", "selesai");
    expect(hasil.jumlahRusakRingan).toBe(1);
    expect(hasil.jumlahBaik).toBe(8);
    expect(hasil.jumlahRusakBerat).toBe(1);
    expect(hasil.jumlahUnit).toBe(10);
  });

  it('transisi ke "selesai" memindahkan jumlah dari Rusak Berat ke Baik dengan benar', () => {
    const hasil = mutasiStokKerusakan(breakdown(), 1, "rusak_berat", "diproses", "selesai");
    expect(hasil.jumlahRusakBerat).toBe(0);
    expect(hasil.jumlahBaik).toBe(7);
  });

  it('transisi ke "ganti_unit" mengurangi Rusak Berat dari total unit (write-off) tanpa memengaruhi kategori lain', () => {
    const hasil = mutasiStokKerusakan(breakdown(), 1, "rusak_berat", "diproses", "ganti_unit");
    expect(hasil.jumlahRusakBerat).toBe(0);
    expect(hasil.jumlahUnit).toBe(9);
    expect(hasil.jumlahBaik).toBe(6);
    expect(hasil.jumlahRusakRingan).toBe(3);
  });

  it("total unit setelah mutasi tidak pernah minus meski jumlah terdampak melebihi bucket rusak", () => {
    const hasilSelesai = mutasiStokKerusakan(breakdown({ jumlahRusakRingan: 2 }), 5, "rusak_ringan", "diproses", "selesai");
    expect(hasilSelesai.jumlahRusakRingan).toBe(0);
    expect(hasilSelesai.jumlahBaik).toBe(8); // hanya 2 yang benar-benar berpindah, bukan 5

    const hasilGanti = mutasiStokKerusakan(breakdown({ jumlahRusakBerat: 1 }), 5, "rusak_berat", "diproses", "ganti_unit");
    expect(hasilGanti.jumlahRusakBerat).toBe(0);
    expect(hasilGanti.jumlahUnit).toBe(9); // hanya 1 yang keluar, bukan 5
  });

  it("tidak pernah melebihi jumlah unit asal (kategori lain tetap konsisten)", () => {
    const awal = breakdown();
    const hasil = mutasiStokKerusakan(awal, 3, "rusak_ringan", "diproses", "selesai");
    const totalSetelah = hasil.jumlahBaik + hasil.jumlahRusakRingan + hasil.jumlahRusakBerat;
    const totalSebelum = awal.jumlahBaik + awal.jumlahRusakRingan + awal.jumlahRusakBerat;
    expect(totalSetelah).toBe(totalSebelum);
  });

  it("mutasi tidak diterapkan ganda jika status di-set ke nilai yang sama dua kali", () => {
    const setelahSelesai = mutasiStokKerusakan(breakdown(), 2, "rusak_ringan", "diproses", "selesai");
    // Mengulang "selesai" -> "selesai" (statusLama === statusBaru) tidak boleh memindahkan lagi.
    const diulang = mutasiStokKerusakan(setelahSelesai, 2, "rusak_ringan", "selesai", "selesai");
    expect(diulang).toEqual(setelahSelesai);
  });

  it("transisi ke status non-mutatif (mis. diproses) tidak mengubah breakdown", () => {
    const awal = breakdown();
    const hasil = mutasiStokKerusakan(awal, 2, "rusak_ringan", "masuk", "diproses");
    expect(hasil).toEqual(awal);
  });
});
