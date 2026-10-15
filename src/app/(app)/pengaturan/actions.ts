"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pengaturanSekolah } from "@/db/schema";

// String kosong disimpan sebagai null supaya PDF bisa membedakan "belum diisi"
// (cetak garis titik-titik) dari isian sungguhan.
const opsional = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);

const pengaturanSchema = z.object({
  namaSekolah: z.string().trim().min(1, "Nama sekolah wajib diisi"),
  provinsi: opsional,
  kabupatenKota: opsional,
  unit: opsional,
  kotaTandaTangan: opsional,
  kepalaSekolahNama: opsional,
  kepalaSekolahNip: opsional,
  pengurusBarangNama: opsional,
  pengurusBarangNip: opsional,
});

export type SavePengaturanState = { error: string } | { success: true } | null;

export async function savePengaturanSekolahAction(
  _prevState: SavePengaturanState,
  formData: FormData,
): Promise<SavePengaturanState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = pengaturanSchema.safeParse({
    namaSekolah: formData.get("namaSekolah"),
    provinsi: formData.get("provinsi") ?? undefined,
    kabupatenKota: formData.get("kabupatenKota") ?? undefined,
    unit: formData.get("unit") ?? undefined,
    kotaTandaTangan: formData.get("kotaTandaTangan") ?? undefined,
    kepalaSekolahNama: formData.get("kepalaSekolahNama") ?? undefined,
    kepalaSekolahNip: formData.get("kepalaSekolahNip") ?? undefined,
    pengurusBarangNama: formData.get("pengurusBarangNama") ?? undefined,
    pengurusBarangNip: formData.get("pengurusBarangNip") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  await db
    .insert(pengaturanSekolah)
    .values({ id: 1, ...parsed.data, createdBy: session.user.id, updatedBy: session.user.id })
    .onConflictDoUpdate({
      target: pengaturanSekolah.id,
      set: { ...parsed.data, updatedBy: session.user.id, updatedAt: new Date() },
    });

  revalidatePath("/pengaturan");
  return { success: true };
}
