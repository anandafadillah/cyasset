import "dotenv/config";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { suratCounter } from "@/db/schema";
import { formatNomorSurat, getNextUrutSurat } from "@/lib/nomor-surat";

describe("formatNomorSurat (pure)", () => {
  it("memformat urutan, bulan romawi, dan tahun dengan benar", () => {
    expect(formatNomorSurat(12, new Date(2026, 7, 15))).toBe("012/SARPRAS/CY/VIII/2026");
  });

  it("mem-padding angka urut di bawah 100 dengan nol di depan", () => {
    expect(formatNomorSurat(1, new Date(2026, 0, 1))).toBe("001/SARPRAS/CY/I/2026");
    expect(formatNomorSurat(9, new Date(2026, 0, 1))).toBe("009/SARPRAS/CY/I/2026");
    expect(formatNomorSurat(99, new Date(2026, 0, 1))).toBe("099/SARPRAS/CY/I/2026");
  });

  it("tidak memotong angka urut 3 digit atau lebih", () => {
    expect(formatNomorSurat(123, new Date(2026, 0, 1))).toBe("123/SARPRAS/CY/I/2026");
    expect(formatNomorSurat(1000, new Date(2026, 0, 1))).toBe("1000/SARPRAS/CY/I/2026");
  });

  it("mengonversi tiap bulan ke angka romawi yang benar", () => {
    expect(formatNomorSurat(1, new Date(2026, 11, 1))).toBe("001/SARPRAS/CY/XII/2026");
    expect(formatNomorSurat(1, new Date(2026, 3, 1))).toBe("001/SARPRAS/CY/IV/2026");
  });
});

describe("getNextUrutSurat (integrasi DB, dilindungi tahun uji unik)", () => {
  // Tahun jauh di masa depan dipakai sebagai namespace uji agar tidak bentrok
  // dengan data nyata dan aman dibersihkan setelah selesai.
  const TAHUN_A = 8801;
  const TAHUN_B = 8802;

  beforeAll(async () => {
    await db.delete(suratCounter).where(eq(suratCounter.tahun, TAHUN_A));
    await db.delete(suratCounter).where(eq(suratCounter.tahun, TAHUN_B));
  });

  afterAll(async () => {
    await db.delete(suratCounter).where(eq(suratCounter.tahun, TAHUN_A));
    await db.delete(suratCounter).where(eq(suratCounter.tahun, TAHUN_B));
  });

  it("nomor pertama tahun baru dimulai dari 1", async () => {
    const urut = await getNextUrutSurat(TAHUN_A);
    expect(urut).toBe(1);
  });

  it("increment berurutan dalam tahun yang sama", async () => {
    const urut2 = await getNextUrutSurat(TAHUN_A);
    const urut3 = await getNextUrutSurat(TAHUN_A);
    expect(urut2).toBe(2);
    expect(urut3).toBe(3);
  });

  it("reset ke 1 saat tahun berbeda meski tahun lain sudah besar", async () => {
    // TAHUN_A sudah mencapai 3 dari test sebelumnya.
    const urutTahunBaru = await getNextUrutSurat(TAHUN_B);
    expect(urutTahunBaru).toBe(1);

    const urutTahunLama = await getNextUrutSurat(TAHUN_A);
    expect(urutTahunLama).toBe(4);
  });

  it("tidak pernah menghasilkan urutan duplikat saat dipanggil bersamaan (konkurensi)", async () => {
    const TAHUN_C = 8803;
    await db.delete(suratCounter).where(eq(suratCounter.tahun, TAHUN_C));

    const hasil = await Promise.all(Array.from({ length: 25 }, () => getNextUrutSurat(TAHUN_C)));
    const unik = new Set(hasil);

    expect(unik.size).toBe(25);
    expect(Math.max(...hasil)).toBe(25);
    expect(Math.min(...hasil)).toBe(1);

    await db.delete(suratCounter).where(eq(suratCounter.tahun, TAHUN_C));
  });
});
