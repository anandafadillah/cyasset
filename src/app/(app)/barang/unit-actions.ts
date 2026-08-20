"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { barangUnit, barangUnitFoto, subLokasi } from "@/db/schema";
import { saveUploadedImage } from "@/lib/uploads";
import { syncBarangBreakdownFromUnits } from "@/lib/barang-unit";

export type UpdateBarangUnitState = { error: string } | { success: true } | null;

// "diganti" sengaja tidak termasuk di sini — status itu cuma boleh terjadi
// lewat alur Ganti Unit di Laporan Kerusakan (Issue 17), bukan diedit manual
// dari halaman Detail Barang.
const editableKondisi = ["baik", "rusak_ringan", "rusak_berat", "hilang"] as const;

const updateUnitSchema = z.object({
  unitId: z.uuid(),
  nomorSeri: z.string().trim().optional(),
  kondisi: z.enum(editableKondisi),
  ruangId: z.uuid("Ruang wajib dipilih"),
  subLokasiId: z.uuid().optional(),
  catatan: z.string().trim().optional(),
});

function readPhotoFiles(formData: FormData): File[] {
  return formData.getAll("foto").filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function validatePhotoFiles(files: File[]): string | null {
  for (const file of files) {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return `File "${file.name}" harus berformat JPG atau PNG.`;
    }
    if (file.size > 5 * 1024 * 1024) {
      return `File "${file.name}" melebihi ukuran maksimum 5 MB.`;
    }
  }
  return null;
}

export async function updateBarangUnitAction(
  _prevState: UpdateBarangUnitState,
  formData: FormData,
): Promise<UpdateBarangUnitState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = updateUnitSchema.safeParse({
    unitId: formData.get("unitId"),
    nomorSeri: formData.get("nomorSeri") || undefined,
    kondisi: formData.get("kondisi"),
    ruangId: formData.get("ruangId") || undefined,
    subLokasiId: formData.get("subLokasiId") || undefined,
    catatan: formData.get("catatan") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const data = parsed.data;

  const [existingUnit] = await db.select().from(barangUnit).where(eq(barangUnit.id, data.unitId)).limit(1);
  if (!existingUnit) return { error: "Unit tidak ditemukan." };
  if (existingUnit.kondisi === "diganti") {
    return { error: "Unit yang sudah diganti tidak bisa diedit." };
  }

  if (data.subLokasiId) {
    const [sub] = await db.select().from(subLokasi).where(eq(subLokasi.id, data.subLokasiId)).limit(1);
    if (!sub || sub.ruangId !== data.ruangId) {
      return { error: "Sub-lokasi tidak sesuai dengan Ruang yang dipilih." };
    }
  }

  const photoFiles = readPhotoFiles(formData);
  const photoError = validatePhotoFiles(photoFiles);
  if (photoError) return { error: photoError };

  const actorId = session.user.id;

  await db
    .update(barangUnit)
    .set({
      nomorSeri: data.nomorSeri || null,
      kondisi: data.kondisi,
      ruangId: data.ruangId,
      subLokasiId: data.subLokasiId ?? null,
      catatan: data.catatan || null,
      updatedBy: actorId,
      updatedAt: new Date(),
    })
    .where(eq(barangUnit.id, data.unitId));

  for (const file of photoFiles) {
    const result = await saveUploadedImage(file, "barang/unit");
    if (result.ok) {
      await db.insert(barangUnitFoto).values({ barangUnitId: data.unitId, path: result.url });
    }
  }

  if (existingUnit.kondisi !== data.kondisi) {
    await syncBarangBreakdownFromUnits(existingUnit.barangId);
  }

  revalidatePath(`/barang/${existingUnit.barangId}`);
  return { success: true };
}
