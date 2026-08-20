"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { prasarana, prasaranaFoto } from "@/db/schema";
import { saveUploadedImage } from "@/lib/uploads";

const prasaranaFieldsSchema = z
  .object({
    nama: z.string().trim().min(1, "Nama pekerjaan wajib diisi"),
    jenis: z.enum(["pembangunan_baru", "perbaikan", "pemeliharaan"], "Jenis pekerjaan wajib dipilih"),
    deskripsi: z.string().trim().optional(),
    lokasi: z.string().trim().optional(),
    status: z.enum(["direncanakan", "proses", "selesai"]),
    tanggalMulai: z.string().min(1, "Tanggal mulai wajib diisi"),
    tanggalSelesai: z.string().optional(),
    sumberDana: z.enum(["ssg", "bos", "komite_sekolah", "mandiri_yayasan", "lainnya"], "Sumber dana wajib dipilih"),
    sumberDanaLainnya: z.string().trim().optional(),
    periodeDana: z.string().trim().optional(),
    nominalDana: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => data.status !== "selesai" || !!data.tanggalSelesai, {
    message: "Tanggal selesai wajib diisi jika status Selesai.",
    path: ["tanggalSelesai"],
  })
  .refine((data) => data.sumberDana !== "lainnya" || !!data.sumberDanaLainnya, {
    message: "Keterangan sumber dana wajib diisi untuk sumber dana \"Lainnya\".",
    path: ["sumberDanaLainnya"],
  });

function readPrasaranaFormFields(formData: FormData) {
  return {
    nama: formData.get("nama"),
    jenis: formData.get("jenis"),
    deskripsi: formData.get("deskripsi") || undefined,
    lokasi: formData.get("lokasi") || undefined,
    status: formData.get("status") || "direncanakan",
    tanggalMulai: formData.get("tanggalMulai"),
    tanggalSelesai: formData.get("tanggalSelesai") || undefined,
    sumberDana: formData.get("sumberDana"),
    sumberDanaLainnya: formData.get("sumberDanaLainnya") || undefined,
    periodeDana: formData.get("periodeDana") || undefined,
    nominalDana: formData.get("nominalDana") || undefined,
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

export type CreatePrasaranaState = { error: string } | null;

export async function createPrasaranaAction(
  _prevState: CreatePrasaranaState,
  formData: FormData,
): Promise<CreatePrasaranaState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = prasaranaFieldsSchema.safeParse(readPrasaranaFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const data = parsed.data;

  const photoFiles = readPhotoFiles(formData);
  const photoError = validatePhotoFiles(photoFiles);
  if (photoError) return { error: photoError };

  const actorId = session.user.id;

  const [created] = await db
    .insert(prasarana)
    .values({
      nama: data.nama,
      jenis: data.jenis,
      deskripsi: data.deskripsi || null,
      lokasi: data.lokasi || null,
      status: data.status,
      tanggalMulai: data.tanggalMulai,
      tanggalSelesai: data.tanggalSelesai || null,
      sumberDana: data.sumberDana,
      sumberDanaLainnya: data.sumberDana === "lainnya" ? data.sumberDanaLainnya || null : null,
      periodeDana: data.periodeDana || null,
      nominalDana: data.nominalDana ?? null,
      createdBy: actorId,
      updatedBy: actorId,
    })
    .returning({ id: prasarana.id });

  for (const file of photoFiles) {
    const result = await saveUploadedImage(file, "prasarana");
    if (result.ok) {
      await db.insert(prasaranaFoto).values({ prasaranaId: created.id, path: result.url });
    }
  }

  revalidatePath("/prasarana");
  redirect("/prasarana");
}

export type UpdatePrasaranaState = { error: string } | null;

export async function updatePrasaranaAction(
  _prevState: UpdatePrasaranaState,
  formData: FormData,
): Promise<UpdatePrasaranaState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Data pekerjaan tidak ditemukan." };

  const parsed = prasaranaFieldsSchema.safeParse(readPrasaranaFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const data = parsed.data;

  const photoFiles = readPhotoFiles(formData);
  const photoError = validatePhotoFiles(photoFiles);
  if (photoError) return { error: photoError };

  const actorId = session.user.id;

  await db
    .update(prasarana)
    .set({
      nama: data.nama,
      jenis: data.jenis,
      deskripsi: data.deskripsi || null,
      lokasi: data.lokasi || null,
      status: data.status,
      tanggalMulai: data.tanggalMulai,
      tanggalSelesai: data.tanggalSelesai || null,
      sumberDana: data.sumberDana,
      sumberDanaLainnya: data.sumberDana === "lainnya" ? data.sumberDanaLainnya || null : null,
      periodeDana: data.periodeDana || null,
      nominalDana: data.nominalDana ?? null,
      updatedBy: actorId,
      updatedAt: new Date(),
    })
    .where(eq(prasarana.id, id));

  for (const file of photoFiles) {
    const result = await saveUploadedImage(file, "prasarana");
    if (result.ok) {
      await db.insert(prasaranaFoto).values({ prasaranaId: id, path: result.url });
    }
  }

  revalidatePath("/prasarana");
  redirect("/prasarana");
}

export type UpdateStatusState = { error: string } | { success: true } | null;

const updateStatusSchema = z
  .object({
    id: z.uuid(),
    status: z.enum(["direncanakan", "proses", "selesai"]),
    tanggalSelesai: z.string().optional(),
  })
  .refine((data) => data.status !== "selesai" || !!data.tanggalSelesai, {
    message: "Tanggal selesai wajib diisi.",
    path: ["tanggalSelesai"],
  });

export async function updatePrasaranaStatusAction(
  _prevState: UpdateStatusState,
  formData: FormData,
): Promise<UpdateStatusState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = updateStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    tanggalSelesai: formData.get("tanggalSelesai") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const data = parsed.data;

  await db
    .update(prasarana)
    .set({
      status: data.status,
      tanggalSelesai: data.status === "selesai" ? data.tanggalSelesai : null,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(prasarana.id, data.id));

  revalidatePath("/prasarana");
  return { success: true };
}

export type ArchivePrasaranaState = { error: string } | { success: true } | null;

export async function archivePrasaranaAction(
  _prevState: ArchivePrasaranaState,
  formData: FormData,
): Promise<ArchivePrasaranaState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Data pekerjaan tidak ditemukan." };

  await db
    .update(prasarana)
    .set({ isArchived: true, updatedBy: session.user.id, updatedAt: new Date() })
    .where(eq(prasarana.id, id));

  revalidatePath("/prasarana");
  return { success: true };
}
