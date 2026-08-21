"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { barang, barangFoto, barangUnit, subLokasi } from "@/db/schema";
import { deleteUploadedImage, saveUploadedImage } from "@/lib/uploads";
import { syncBarangBreakdownFromUnits } from "@/lib/barang-unit";

export type CreateBarangState = { error: string } | null;

const barangBaseFieldsSchema = z.object({
  nama: z.string().trim().min(1, "Nama barang wajib diisi"),
  merkTipe: z.string().trim().optional(),
  kode: z.string().trim().min(1, "Kode / No. Seri wajib diisi"),
  kategori: z.string().trim().optional(),
  spesifikasi: z.string().trim().optional(),
  ruangId: z.uuid("Ruang wajib dipilih"),
  subLokasiId: z.uuid().optional(),
  modePelacakan: z.enum(["batch", "unit"]).default("batch"),
  jumlahUnit: z.coerce.number().int().min(1, "Jumlah unit minimal 1"),
  jumlahBaik: z.coerce.number().int().min(0).default(0),
  jumlahRusakRingan: z.coerce.number().int().min(0).default(0),
  jumlahRusakBerat: z.coerce.number().int().min(0).default(0),
});

// Breakdown manual (Baik+RusakRingan+RusakBerat = JumlahUnit) hanya berlaku
// untuk mode Batch — mode Per-Unit menghitungnya otomatis dari barang_unit
// (lihat syncBarangBreakdownFromUnits), admin cuma isi jumlah unit awal.
const createBarangSchema = barangBaseFieldsSchema.superRefine((data, ctx) => {
  if (
    data.modePelacakan === "batch" &&
    data.jumlahBaik + data.jumlahRusakRingan + data.jumlahRusakBerat !== data.jumlahUnit
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Jumlah Baik + Rusak Ringan + Rusak Berat harus sama dengan Jumlah Unit.",
      path: ["jumlahUnit"],
    });
  }
});

function readBarangFormFields(formData: FormData) {
  return {
    nama: formData.get("nama"),
    merkTipe: formData.get("merkTipe") || undefined,
    kode: formData.get("kode"),
    kategori: formData.get("kategori") || undefined,
    spesifikasi: formData.get("spesifikasi") || undefined,
    ruangId: formData.get("ruangId") || undefined,
    subLokasiId: formData.get("subLokasiId") || undefined,
    modePelacakan: formData.get("modePelacakan") || undefined,
    jumlahUnit: formData.get("jumlahUnit"),
    jumlahBaik: formData.get("jumlahBaik") || 0,
    jumlahRusakRingan: formData.get("jumlahRusakRingan") || 0,
    jumlahRusakBerat: formData.get("jumlahRusakBerat") || 0,
  };
}

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

export async function createBarangAction(
  _prevState: CreateBarangState,
  formData: FormData,
): Promise<CreateBarangState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = createBarangSchema.safeParse(readBarangFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const data = parsed.data;

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

  let newBarangId: string;
  try {
    newBarangId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(barang)
        .values({
          nama: data.nama,
          merkTipe: data.merkTipe || null,
          kode: data.kode,
          kategori: data.kategori || null,
          spesifikasi: data.spesifikasi || null,
          ruangId: data.ruangId,
          subLokasiId: data.subLokasiId ?? null,
          modePelacakan: data.modePelacakan,
          jumlahUnit: data.jumlahUnit,
          jumlahBaik: data.jumlahBaik,
          jumlahRusakRingan: data.jumlahRusakRingan,
          jumlahRusakBerat: data.jumlahRusakBerat,
          createdBy: actorId,
          updatedBy: actorId,
        })
        .returning({ id: barang.id });

      if (data.modePelacakan === "unit") {
        await tx.insert(barangUnit).values(
          Array.from({ length: data.jumlahUnit }, (_, i) => ({
            barangId: created.id,
            subKode: `${data.kode}-U${i + 1}`,
            ruangId: data.ruangId,
            subLokasiId: data.subLokasiId ?? null,
            createdBy: actorId,
            updatedBy: actorId,
          })),
        );
        await syncBarangBreakdownFromUnits(created.id, tx);
      }

      return created.id;
    });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    if ((cause as { code?: string } | undefined)?.code === "23505") {
      return { error: "Kode / No. Seri sudah dipakai barang lain." };
    }
    throw error;
  }

  for (const file of photoFiles) {
    const result = await saveUploadedImage(file, "barang");
    if (result.ok) {
      await db.insert(barangFoto).values({ barangId: newBarangId, path: result.url });
    }
  }

  revalidatePath("/barang");
  redirect("/barang");
}

export type UpdateBarangState = { error: string } | null;

// Breakdown manual (jumlahUnit/Baik/RusakRingan/RusakBerat) dari form hanya
// divalidasi longgar di sini (tanpa cek total) — cek total = jumlahUnit
// dilakukan manual di bawah, hanya kalau barang existing bermode Batch, karena
// untuk mode Unit nilai-nilai itu diabaikan sepenuhnya (dikelola via barang_unit).
const updateBarangSchema = barangBaseFieldsSchema;

export async function updateBarangAction(
  _prevState: UpdateBarangState,
  formData: FormData,
): Promise<UpdateBarangState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Barang tidak ditemukan." };

  const [existing] = await db.select().from(barang).where(eq(barang.id, id)).limit(1);
  if (!existing) return { error: "Barang tidak ditemukan." };

  const parsed = updateBarangSchema.safeParse(readBarangFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const data = parsed.data;

  // Mode terkunci setelah barang dibuat — apapun yang dikirim form diabaikan,
  // mode selalu ikut data existing di database.
  if (existing.modePelacakan === "batch" && data.jumlahBaik + data.jumlahRusakRingan + data.jumlahRusakBerat !== data.jumlahUnit) {
    return { error: "Jumlah Baik + Rusak Ringan + Rusak Berat harus sama dengan Jumlah Unit." };
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

  try {
    await db
      .update(barang)
      .set({
        nama: data.nama,
        merkTipe: data.merkTipe || null,
        kode: data.kode,
        kategori: data.kategori || null,
        spesifikasi: data.spesifikasi || null,
        ruangId: data.ruangId,
        subLokasiId: data.subLokasiId ?? null,
        // Breakdown mode "unit" dikelola lewat barang_unit (Issue 15/17), bukan
        // form ini — nilai existing di database dipertahankan apa adanya.
        ...(existing.modePelacakan === "batch"
          ? {
              jumlahUnit: data.jumlahUnit,
              jumlahBaik: data.jumlahBaik,
              jumlahRusakRingan: data.jumlahRusakRingan,
              jumlahRusakBerat: data.jumlahRusakBerat,
            }
          : {}),
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(barang.id, id));
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    if ((cause as { code?: string } | undefined)?.code === "23505") {
      return { error: "Kode / No. Seri sudah dipakai barang lain." };
    }
    throw error;
  }

  for (const file of photoFiles) {
    const result = await saveUploadedImage(file, "barang");
    if (result.ok) {
      await db.insert(barangFoto).values({ barangId: id, path: result.url });
    }
  }

  revalidatePath("/barang");
  revalidatePath(`/barang/${id}`);
  redirect(`/barang/${id}`);
}

export type DeleteBarangFotoState = { error: string } | { success: true } | null;

export async function deleteBarangFotoAction(
  _prevState: DeleteBarangFotoState,
  formData: FormData,
): Promise<DeleteBarangFotoState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const fotoId = formData.get("fotoId");
  if (typeof fotoId !== "string" || !fotoId) return { error: "Foto tidak ditemukan." };

  const [foto] = await db.select().from(barangFoto).where(eq(barangFoto.id, fotoId)).limit(1);
  if (!foto) return { error: "Foto tidak ditemukan." };

  await db.delete(barangFoto).where(eq(barangFoto.id, fotoId));
  await deleteUploadedImage(foto.path);

  revalidatePath("/barang");
  revalidatePath(`/barang/${foto.barangId}`);
  revalidatePath(`/barang/${foto.barangId}/edit`);
  return { success: true };
}

export type ArchiveBarangState = { error: string } | { success: true } | null;

export async function archiveBarangAction(
  _prevState: ArchiveBarangState,
  formData: FormData,
): Promise<ArchiveBarangState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Barang tidak ditemukan." };

  await db
    .update(barang)
    .set({ isArchived: true, updatedBy: session.user.id, updatedAt: new Date() })
    .where(eq(barang.id, id));

  revalidatePath("/barang");
  revalidatePath(`/barang/${id}`);
  return { success: true };
}
