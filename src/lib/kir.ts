import { sumberDanaLabel } from "@/lib/prasarana-format";

// Logika murni penyusun baris Kartu Inventaris Ruangan (KIR) — tanpa akses DB
// supaya bisa diuji. Pengambil datanya ada di src/lib/kir-data.ts.

type InfoBarang = {
  barangId: string;
  nama: string;
  merkTipe: string | null;
  kode: string;
  kategori: string | null;
  tanggalMasuk: string | null;
  sumberDana: string | null;
  sumberDanaLainnya: string | null;
};

/** Satu baris barang_lokasi (barang mode batch) di ruang ini. */
export type SumberBatch = InfoBarang & {
  subLokasiNama: string | null;
  jumlah: number;
  jumlahBaik: number;
  jumlahRusakRingan: number;
  jumlahRusakBerat: number;
};

/** Satu unit fisik (barang mode unit) di ruang ini. */
export type SumberUnit = InfoBarang & {
  unitId: string;
  subKode: string;
  subLokasiNama: string | null;
  kondisi: "baik" | "rusak_ringan" | "rusak_berat" | "hilang" | "diganti";
};

export type KirUnit = { id: string; subKode: string; kondisi: SumberUnit["kondisi"] };

export type KirBaris = {
  barangId: string;
  mode: "batch" | "unit";
  nama: string;
  merkTipe: string | null;
  kode: string;
  kategori: string | null;
  /** Tahun dari tanggalMasuk, "-" bila belum diisi. */
  tahunPembelian: string;
  /** Label BOSP/SSG/Hibah/Lainnya (+ keterangan), "-" bila belum diisi. */
  jenisAnggaran: string;
  /** Baik + Kurang Baik + Rusak Berat — unit hilang/diganti tidak dihitung. */
  jumlah: number;
  baik: number;
  kurangBaik: number;
  rusakBerat: number;
  hilang: number;
  keterangan: string;
  /** Unit fisik di ruang ini (hanya barang mode unit, tanpa yang diganti). */
  units: KirUnit[];
};

const TANPA_SUB_LOKASI = "Tanpa sub-lokasi";

export function labelJenisAnggaran(sumberDana: string | null, sumberDanaLainnya: string | null): string {
  if (!sumberDana) return "-";
  const label = sumberDanaLabel[sumberDana] ?? sumberDana;
  return sumberDana === "lainnya" && sumberDanaLainnya ? `${label} (${sumberDanaLainnya})` : label;
}

function tahunDari(tanggal: string | null) {
  return tanggal ? tanggal.slice(0, 4) : "-";
}

type Akumulator = {
  baris: KirBaris;
  perSubLokasi: Map<string, number>;
};

function barisBaru(info: InfoBarang, mode: KirBaris["mode"]): Akumulator {
  return {
    baris: {
      barangId: info.barangId,
      mode,
      nama: info.nama,
      merkTipe: info.merkTipe,
      kode: info.kode,
      kategori: info.kategori,
      tahunPembelian: tahunDari(info.tanggalMasuk),
      jenisAnggaran: labelJenisAnggaran(info.sumberDana, info.sumberDanaLainnya),
      jumlah: 0,
      baik: 0,
      kurangBaik: 0,
      rusakBerat: 0,
      hilang: 0,
      keterangan: "",
      units: [],
    },
    perSubLokasi: new Map(),
  };
}

function tambahSubLokasi(acc: Akumulator, nama: string | null, jumlah: number) {
  if (jumlah <= 0) return;
  const key = nama ?? TANPA_SUB_LOKASI;
  acc.perSubLokasi.set(key, (acc.perSubLokasi.get(key) ?? 0) + jumlah);
}

function susunKeterangan(acc: Akumulator) {
  const bagian: string[] = [];
  if (acc.baris.hilang > 0) bagian.push(`${acc.baris.hilang} unit hilang`);
  // Rincian sub-lokasi cuma berguna kalau minimal satu porsinya memang punya
  // sub-lokasi — barang yang seluruhnya "di ruang" saja tidak perlu dirinci.
  const adaSubLokasi = [...acc.perSubLokasi.keys()].some((nama) => nama !== TANPA_SUB_LOKASI);
  if (adaSubLokasi) {
    bagian.push([...acc.perSubLokasi].map(([nama, jumlah]) => `${nama} (${jumlah})`).join(", "));
  }
  return bagian.join("; ");
}

function bandingkanBaris(a: KirBaris, b: KirBaris) {
  // Kategori kosong ditaruh paling akhir, lalu urut nama barang.
  if (a.kategori !== b.kategori) {
    if (!a.kategori) return 1;
    if (!b.kategori) return -1;
    const byKategori = a.kategori.localeCompare(b.kategori, "id", { sensitivity: "base" });
    if (byKategori !== 0) return byKategori;
  }
  return (
    a.nama.localeCompare(b.nama, "id", { sensitivity: "base", numeric: true }) ||
    a.kode.localeCompare(b.kode, "id", { numeric: true })
  );
}

/**
 * Gabungkan sumber batch & unit menjadi satu baris per jenis barang:
 * - baris batch dengan sub-lokasi berbeda di ruang yang sama dijumlahkan
 * - unit `diganti` diabaikan, unit `hilang` tidak masuk Jumlah tapi dicatat di Keterangan
 * - Keterangan memuat rincian sub-lokasi bila ada
 * - urut kategori lalu nama barang
 */
export function susunBarisKir(batch: SumberBatch[], unit: SumberUnit[]): KirBaris[] {
  const map = new Map<string, Akumulator>();

  for (const row of batch) {
    const acc = map.get(row.barangId) ?? barisBaru(row, "batch");
    map.set(row.barangId, acc);
    acc.baris.baik += row.jumlahBaik;
    acc.baris.kurangBaik += row.jumlahRusakRingan;
    acc.baris.rusakBerat += row.jumlahRusakBerat;
    tambahSubLokasi(acc, row.subLokasiNama, row.jumlahBaik + row.jumlahRusakRingan + row.jumlahRusakBerat);
  }

  for (const row of unit) {
    if (row.kondisi === "diganti") continue;
    const acc = map.get(row.barangId) ?? barisBaru(row, "unit");
    map.set(row.barangId, acc);
    acc.baris.units.push({ id: row.unitId, subKode: row.subKode, kondisi: row.kondisi });
    switch (row.kondisi) {
      case "baik":
        acc.baris.baik += 1;
        break;
      case "rusak_ringan":
        acc.baris.kurangBaik += 1;
        break;
      case "rusak_berat":
        acc.baris.rusakBerat += 1;
        break;
      case "hilang":
        acc.baris.hilang += 1;
        continue;
    }
    tambahSubLokasi(acc, row.subLokasiNama, 1);
  }

  const hasil = [...map.values()].map((acc) => {
    acc.baris.jumlah = acc.baris.baik + acc.baris.kurangBaik + acc.baris.rusakBerat;
    acc.baris.keterangan = susunKeterangan(acc);
    acc.baris.units.sort((a, b) => a.subKode.localeCompare(b.subKode, "id", { numeric: true }));
    return acc.baris;
  });

  return hasil.sort(bandingkanBaris);
}

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** "2026-10-15" → "15 Oktober 2026" (tanpa konversi zona waktu). */
export function formatTanggalDokumen(tanggal: string): string {
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);
  return `${hari} ${BULAN[bulan - 1]} ${tahun}`;
}

/** Validasi ?tanggal=YYYY-MM-DD; selain itu pakai hari ini (zona Asia/Jakarta). */
export function tanggalDokumenDari(param: string | null, sekarang = new Date()): string {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    const [tahun, bulan, hari] = param.split("-").map(Number);
    const date = new Date(Date.UTC(tahun, bulan - 1, hari));
    if (date.getUTCFullYear() === tahun && date.getUTCMonth() === bulan - 1 && date.getUTCDate() === hari) {
      return param;
    }
  }
  return sekarang.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}
