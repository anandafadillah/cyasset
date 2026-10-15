import { describe, expect, it } from "vitest";
import {
  formatTanggalDokumen,
  labelJenisAnggaran,
  susunBarisKir,
  tanggalDokumenDari,
  type SumberBatch,
  type SumberUnit,
} from "@/lib/kir";

const infoDasar = {
  merkTipe: null,
  kategori: null,
  tanggalMasuk: null,
  sumberDana: null,
  sumberDanaLainnya: null,
};

function batch(overrides: Partial<SumberBatch> = {}): SumberBatch {
  return {
    ...infoDasar,
    barangId: "kursi",
    nama: "Kursi Kelas",
    kode: "KRS-01",
    subLokasiNama: null,
    jumlah: 10,
    jumlahBaik: 10,
    jumlahRusakRingan: 0,
    jumlahRusakBerat: 0,
    ...overrides,
  };
}

function unit(overrides: Partial<SumberUnit> = {}): SumberUnit {
  return {
    ...infoDasar,
    barangId: "laptop",
    nama: "Laptop",
    kode: "LPT-01",
    unitId: `u-${Math.random()}`,
    subKode: "LPT-01-001",
    subLokasiNama: null,
    kondisi: "baik",
    ...overrides,
  };
}

describe("susunBarisKir", () => {
  it("menggabungkan baris batch barang yang sama di sub-lokasi berbeda", () => {
    const [baris, ...sisa] = susunBarisKir(
      [
        batch({ subLokasiNama: "Meja Depan", jumlah: 20, jumlahBaik: 18, jumlahRusakRingan: 2 }),
        batch({ subLokasiNama: "Gudang Belakang", jumlah: 10, jumlahBaik: 7, jumlahRusakBerat: 3 }),
      ],
      [],
    );
    expect(sisa).toHaveLength(0);
    expect(baris).toMatchObject({ mode: "batch", jumlah: 30, baik: 25, kurangBaik: 2, rusakBerat: 3 });
    expect(baris.keterangan).toBe("Meja Depan (20), Gudang Belakang (10)");
  });

  it("tidak merinci sub-lokasi bila seluruh barang tanpa sub-lokasi", () => {
    const [baris] = susunBarisKir([batch()], []);
    expect(baris.keterangan).toBe("");
  });

  it("mencatat porsi tanpa sub-lokasi bila sebagian lain punya sub-lokasi", () => {
    const [baris] = susunBarisKir(
      [batch({ subLokasiNama: "Lemari", jumlah: 4, jumlahBaik: 4 }), batch({ jumlah: 6, jumlahBaik: 6 })],
      [],
    );
    expect(baris.keterangan).toBe("Lemari (4), Tanpa sub-lokasi (6)");
  });

  it("mengagregasi unit per barang: diganti diabaikan, hilang tidak masuk Jumlah tapi dicatat", () => {
    const [baris] = susunBarisKir(
      [],
      [
        unit({ subKode: "LPT-01-002", kondisi: "baik" }),
        unit({ subKode: "LPT-01-001", kondisi: "rusak_ringan" }),
        unit({ subKode: "LPT-01-003", kondisi: "rusak_berat" }),
        unit({ subKode: "LPT-01-004", kondisi: "hilang" }),
        unit({ subKode: "LPT-01-005", kondisi: "diganti" }),
      ],
    );
    expect(baris).toMatchObject({ mode: "unit", jumlah: 3, baik: 1, kurangBaik: 1, rusakBerat: 1, hilang: 1 });
    expect(baris.keterangan).toBe("1 unit hilang");
    expect(baris.units.map((u) => u.subKode)).toEqual(["LPT-01-001", "LPT-01-002", "LPT-01-003", "LPT-01-004"]);
  });

  it("menggabungkan keterangan unit hilang dan sub-lokasi", () => {
    const [baris] = susunBarisKir(
      [],
      [
        unit({ subLokasiNama: "Meja Guru" }),
        unit({ subLokasiNama: "Meja Guru" }),
        unit({ subLokasiNama: "Lemari", kondisi: "hilang" }),
      ],
    );
    expect(baris.keterangan).toBe("1 unit hilang; Meja Guru (2)");
  });

  it("mengurutkan berdasarkan kategori lalu nama, kategori kosong paling akhir", () => {
    const hasil = susunBarisKir(
      [
        batch({ barangId: "a", nama: "Meja", kategori: "Mebel" }),
        batch({ barangId: "b", nama: "Tempat Sampah", kategori: null }),
        batch({ barangId: "c", nama: "Kursi", kategori: "Mebel" }),
      ],
      [unit({ barangId: "d", nama: "Proyektor", kategori: "Elektronik" })],
    );
    expect(hasil.map((b) => b.nama)).toEqual(["Proyektor", "Kursi", "Meja", "Tempat Sampah"]);
  });

  it("mengisi tahun pembelian dan jenis anggaran", () => {
    const [baris] = susunBarisKir(
      [batch({ tanggalMasuk: "2024-07-15", sumberDana: "bosp" })],
      [],
    );
    expect(baris.tahunPembelian).toBe("2024");
    expect(baris.jenisAnggaran).toBe("BOSP");
  });

  it("menghasilkan daftar kosong untuk ruang tanpa barang", () => {
    expect(susunBarisKir([], [])).toEqual([]);
  });
});

describe("labelJenisAnggaran", () => {
  it("menampilkan keterangan untuk Lainnya dan '-' bila kosong", () => {
    expect(labelJenisAnggaran("lainnya", "Komite Sekolah")).toBe("Lainnya (Komite Sekolah)");
    expect(labelJenisAnggaran("lainnya", null)).toBe("Lainnya");
    expect(labelJenisAnggaran("hibah", null)).toBe("Hibah");
    expect(labelJenisAnggaran(null, null)).toBe("-");
  });
});

describe("tanggal dokumen", () => {
  it("memformat tanggal ISO ke bahasa Indonesia", () => {
    expect(formatTanggalDokumen("2026-10-05")).toBe("5 Oktober 2026");
  });

  it("menerima tanggal valid dan menolak yang tidak valid", () => {
    const sekarang = new Date("2026-10-15T20:00:00Z"); // 16 Okt di Asia/Jakarta
    expect(tanggalDokumenDari("2026-02-28", sekarang)).toBe("2026-02-28");
    expect(tanggalDokumenDari("2026-02-30", sekarang)).toBe("2026-10-16");
    expect(tanggalDokumenDari("kemarin", sekarang)).toBe("2026-10-16");
    expect(tanggalDokumenDari(null, sekarang)).toBe("2026-10-16");
  });
});
