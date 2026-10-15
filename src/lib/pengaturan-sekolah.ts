import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pengaturanSekolah } from "@/db/schema";

export const DEFAULT_NAMA_SEKOLAH = "SMK CYBER MEDIA";

export type PengaturanSekolah = {
  namaSekolah: string;
  provinsi: string | null;
  kabupatenKota: string | null;
  unit: string | null;
  kotaTandaTangan: string | null;
  kepalaSekolahNama: string | null;
  kepalaSekolahNip: string | null;
  pengurusBarangNama: string | null;
  pengurusBarangNip: string | null;
};

/** Selalu mengembalikan nilai — default dipakai bila baris belum pernah disimpan. */
export async function getPengaturanSekolah(): Promise<PengaturanSekolah> {
  const row = await db.query.pengaturanSekolah.findFirst({ where: eq(pengaturanSekolah.id, 1) });
  return {
    namaSekolah: row?.namaSekolah || DEFAULT_NAMA_SEKOLAH,
    provinsi: row?.provinsi ?? null,
    kabupatenKota: row?.kabupatenKota ?? null,
    unit: row?.unit ?? null,
    kotaTandaTangan: row?.kotaTandaTangan ?? null,
    kepalaSekolahNama: row?.kepalaSekolahNama ?? null,
    kepalaSekolahNip: row?.kepalaSekolahNip ?? null,
    pengurusBarangNama: row?.pengurusBarangNama ?? null,
    pengurusBarangNip: row?.pengurusBarangNip ?? null,
  };
}
