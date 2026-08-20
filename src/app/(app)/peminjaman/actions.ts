"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { barang, barangUnit, peminjaman, peminjamanFoto, peminjamanItem } from "@/db/schema";
import { saveUploadedImage } from "@/lib/uploads";
import { generateNomorSurat } from "@/lib/nomor-surat";
import { getDipinjamUnitSet } from "@/lib/stok";

// Item Batch: pilih barang + jumlah (perilaku asli). Item Per-Unit: pilih satu
// unit fisik spesifik (barangUnitId), jumlah selalu 1 untuk baris ini — lihat
// Issue 16.
const itemSchema = z
  .array(
    z.union([
      z.object({ barangId: z.uuid(), jumlah: z.coerce.number().int().min(1) }),
      z.object({ barangId: z.uuid(), barangUnitId: z.uuid() }),
    ]),
  )
  .min(1, "Pilih minimal satu barang");

type ParsedItem = { barangId: string; jumlah: number } | { barangId: string; barangUnitId: string };

function parseItemsJson(formData: FormData): { items: ParsedItem[] } | { error: string } {
  try {
    const rawItems = JSON.parse(String(formData.get("itemsJson") || "[]"));
    const itemsParsed = itemSchema.safeParse(rawItems);
    if (!itemsParsed.success) {
      return { error: itemsParsed.error.issues[0]?.message ?? "Barang tidak valid." };
    }
    return { items: itemsParsed.data };
  } catch {
    return { error: "Barang tidak valid." };
  }
}

async function validateItemsStock(items: ParsedItem[]): Promise<string | null> {
  const unitItems = items.filter((item): item is { barangId: string; barangUnitId: string } => "barangUnitId" in item);
  if (new Set(unitItems.map((item) => item.barangUnitId)).size !== unitItems.length) {
    return "Ada unit yang dipilih lebih dari sekali.";
  }
  if (unitItems.length > 0) {
    const dipinjamUnitSet = await getDipinjamUnitSet();
    for (const item of unitItems) {
      const [unit] = await db.select().from(barangUnit).where(eq(barangUnit.id, item.barangUnitId)).limit(1);
      if (!unit || unit.barangId !== item.barangId) {
        return "Salah satu unit tidak ditemukan.";
      }
      if (unit.kondisi !== "baik") {
        return `Unit "${unit.subKode}" tidak berkondisi Baik, tidak bisa dipinjam.`;
      }
      if (dipinjamUnitSet.has(item.barangUnitId)) {
        return `Unit "${unit.subKode}" sedang dipinjam di peminjaman lain.`;
      }
    }
  }

  const batchItems = items.filter((item): item is { barangId: string; jumlah: number } => "jumlah" in item);
  for (const item of batchItems) {
    const [row] = await db.select().from(barang).where(eq(barang.id, item.barangId)).limit(1);
    if (!row || row.isArchived) {
      return "Salah satu barang tidak ditemukan atau sudah diarsipkan.";
    }
    const [{ dipinjam }] = await db
      .select({ dipinjam: sql<number>`coalesce(sum(${peminjamanItem.jumlah}), 0)::int` })
      .from(peminjamanItem)
      .innerJoin(peminjaman, eq(peminjamanItem.peminjamanId, peminjaman.id))
      .where(and(eq(peminjamanItem.barangId, item.barangId), eq(peminjaman.status, "dipinjam")));
    const tersedia = row.jumlahBaik - dipinjam;
    if (item.jumlah > tersedia) {
      return `Stok "${row.nama}" tersisa ${Math.max(0, tersedia)}, tidak cukup untuk ${item.jumlah}.`;
    }
  }
  return null;
}

function toPeminjamanItemValues(items: ParsedItem[]) {
  return items.map((item) =>
    "barangUnitId" in item
      ? { barangId: item.barangId, barangUnitId: item.barangUnitId, jumlah: 1 }
      : { barangId: item.barangId, jumlah: item.jumlah },
  );
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

const createInternalSchema = z
  .object({
    peminjamNama: z.string().trim().min(1, "Nama peminjam wajib diisi"),
    peminjamKontak: z.string().trim().optional(),
    peminjamKeterangan: z.string().trim().optional(),
    tujuan: z.string().trim().min(1, "Tujuan peminjaman wajib diisi"),
    tanggalPinjam: z.string().min(1, "Tanggal pinjam wajib diisi"),
    tanggalRencanaKembali: z.string().min(1, "Rencana kembali wajib diisi"),
  })
  .refine((data) => data.tanggalRencanaKembali >= data.tanggalPinjam, {
    message: "Rencana kembali tidak boleh sebelum tanggal pinjam.",
    path: ["tanggalRencanaKembali"],
  });

export type CreatePeminjamanState = { error: string } | null;

export async function createPeminjamanInternalAction(
  _prevState: CreatePeminjamanState,
  formData: FormData,
): Promise<CreatePeminjamanState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = createInternalSchema.safeParse({
    peminjamNama: formData.get("peminjamNama"),
    peminjamKontak: formData.get("peminjamKontak") || undefined,
    peminjamKeterangan: formData.get("peminjamKeterangan") || undefined,
    tujuan: formData.get("tujuan"),
    tanggalPinjam: formData.get("tanggalPinjam"),
    tanggalRencanaKembali: formData.get("tanggalRencanaKembali"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const itemsResult = parseItemsJson(formData);
  if ("error" in itemsResult) return { error: itemsResult.error };
  const { items } = itemsResult;

  const stockError = await validateItemsStock(items);
  if (stockError) return { error: stockError };

  const photoFiles = readPhotoFiles(formData);
  const photoError = validatePhotoFiles(photoFiles);
  if (photoError) return { error: photoError };

  const data = parsed.data;
  const actorId = session.user.id;

  const [created] = await db
    .insert(peminjaman)
    .values({
      jenis: "internal",
      peminjamNama: data.peminjamNama,
      peminjamKontak: data.peminjamKontak || null,
      peminjamKeterangan: data.peminjamKeterangan || null,
      tujuan: data.tujuan,
      tanggalPinjam: data.tanggalPinjam,
      tanggalRencanaKembali: data.tanggalRencanaKembali,
      status: "dipinjam",
      createdBy: actorId,
      updatedBy: actorId,
    })
    .returning({ id: peminjaman.id });

  await db.insert(peminjamanItem).values(toPeminjamanItemValues(items).map((item) => ({ peminjamanId: created.id, ...item })));

  for (const file of photoFiles) {
    const result = await saveUploadedImage(file, "peminjaman");
    if (result.ok) {
      await db.insert(peminjamanFoto).values({ peminjamanId: created.id, tipe: "awal", path: result.url });
    }
  }

  revalidatePath("/peminjaman");
  redirect("/peminjaman");
}

const createEksternalSchema = z
  .object({
    peminjamNama: z.string().trim().min(1, "Nama peminjam/instansi wajib diisi"),
    penanggungJawab: z.string().trim().min(1, "Penanggung jawab wajib diisi"),
    peminjamKontak: z.string().trim().optional(),
    lokasiPemanfaatan: z.string().trim().min(1, "Lokasi pemanfaatan wajib diisi"),
    tujuan: z.string().trim().min(1, "Tujuan peminjaman wajib diisi"),
    tanggalPinjam: z.string().min(1, "Tanggal mulai wajib diisi"),
    tanggalRencanaKembali: z.string().min(1, "Rencana kembali wajib diisi"),
  })
  .refine((data) => data.tanggalRencanaKembali >= data.tanggalPinjam, {
    message: "Rencana kembali tidak boleh sebelum tanggal mulai.",
    path: ["tanggalRencanaKembali"],
  });

export async function createPeminjamanEksternalAction(
  _prevState: CreatePeminjamanState,
  formData: FormData,
): Promise<CreatePeminjamanState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = createEksternalSchema.safeParse({
    peminjamNama: formData.get("peminjamNama"),
    penanggungJawab: formData.get("penanggungJawab"),
    peminjamKontak: formData.get("peminjamKontak") || undefined,
    lokasiPemanfaatan: formData.get("lokasiPemanfaatan"),
    tujuan: formData.get("tujuan"),
    tanggalPinjam: formData.get("tanggalPinjam"),
    tanggalRencanaKembali: formData.get("tanggalRencanaKembali"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const itemsResult = parseItemsJson(formData);
  if ("error" in itemsResult) return { error: itemsResult.error };
  const { items } = itemsResult;

  const stockError = await validateItemsStock(items);
  if (stockError) return { error: stockError };

  const photoFiles = readPhotoFiles(formData);
  const photoError = validatePhotoFiles(photoFiles);
  if (photoError) return { error: photoError };

  const data = parsed.data;
  const actorId = session.user.id;
  const nomorSurat = await generateNomorSurat();

  const [created] = await db
    .insert(peminjaman)
    .values({
      jenis: "eksternal",
      peminjamNama: data.peminjamNama,
      penanggungJawab: data.penanggungJawab,
      peminjamKontak: data.peminjamKontak || null,
      lokasiPemanfaatan: data.lokasiPemanfaatan,
      nomorSurat,
      tujuan: data.tujuan,
      tanggalPinjam: data.tanggalPinjam,
      tanggalRencanaKembali: data.tanggalRencanaKembali,
      status: "dipinjam",
      createdBy: actorId,
      updatedBy: actorId,
    })
    .returning({ id: peminjaman.id });

  await db.insert(peminjamanItem).values(toPeminjamanItemValues(items).map((item) => ({ peminjamanId: created.id, ...item })));

  for (const file of photoFiles) {
    const result = await saveUploadedImage(file, "peminjaman");
    if (result.ok) {
      await db.insert(peminjamanFoto).values({ peminjamanId: created.id, tipe: "awal", path: result.url });
    }
  }

  revalidatePath("/peminjaman");
  redirect(`/api/surat/${created.id}`);
}

export type ReturnPeminjamanState = { error: string } | { success: true } | null;

export async function returnPeminjamanAction(
  _prevState: ReturnPeminjamanState,
  formData: FormData,
): Promise<ReturnPeminjamanState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Peminjaman tidak ditemukan." };

  const [row] = await db.select().from(peminjaman).where(eq(peminjaman.id, id)).limit(1);
  if (!row) return { error: "Peminjaman tidak ditemukan." };
  if (row.status === "dikembalikan") return { error: "Peminjaman ini sudah dikembalikan." };

  const photoFiles = readPhotoFiles(formData);
  const photoError = validatePhotoFiles(photoFiles);
  if (photoError) return { error: photoError };

  const today = new Date().toISOString().slice(0, 10);

  await db
    .update(peminjaman)
    .set({
      status: "dikembalikan",
      tanggalKembaliAktual: today,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(peminjaman.id, id));

  for (const file of photoFiles) {
    const result = await saveUploadedImage(file, "peminjaman");
    if (result.ok) {
      await db.insert(peminjamanFoto).values({ peminjamanId: id, tipe: "akhir", path: result.url });
    }
  }

  revalidatePath("/peminjaman");
  return { success: true };
}
