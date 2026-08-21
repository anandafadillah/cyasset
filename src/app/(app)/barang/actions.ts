"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { barang, barangFoto, barangLokasi, barangUnit, subLokasi } from "@/db/schema";
import { deleteUploadedImage, saveUploadedImage } from "@/lib/uploads";
import { syncBarangBreakdownFromUnits } from "@/lib/barang-unit";
import { syncBarangBreakdownFromLokasi } from "@/lib/barang-lokasi";

export type CreateBarangState = { error: string } | null;

// Field umum, tidak tergantung mode pelacakan. Lokasi & jumlah/kondisi
// ditangani terpisah di bawah karena bentuknya beda total antar mode:
// Unit pakai 1 ruangId/subLokasiId/jumlahUnit tunggal (breakdown dihitung
// dari barang_unit), Batch pakai daftar baris lokasi (breakdown dihitung
// dari barang_lokasi, lihat parseLokasiBaris & syncBarangBreakdownFromLokasi).
const barangBaseFieldsSchema = z
  .object({
    nama: z.string().trim().min(1, "Nama barang wajib diisi"),
    merkTipe: z.string().trim().optional(),
    kode: z.string().trim().min(1, "Kode / No. Seri wajib diisi"),
    kategori: z.string().trim().optional(),
    spesifikasi: z.string().trim().optional(),
    modePelacakan: z.enum(["batch", "unit"]).default("batch"),
    tanggalMasuk: z.string().min(1, "Tanggal masuk wajib diisi"),
    sumberDana: z.enum(["ssg", "bos", "komite_sekolah", "mandiri_yayasan", "lainnya"], "Sumber dana wajib dipilih"),
    sumberDanaLainnya: z.string().trim().optional(),
    periodeDana: z.string().trim().optional(),
    nominalDana: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => data.sumberDana !== "lainnya" || !!data.sumberDanaLainnya, {
    message: "Keterangan sumber dana wajib diisi untuk sumber dana \"Lainnya\".",
    path: ["sumberDanaLainnya"],
  });

const unitModeLocationSchema = z.object({
  ruangId: z.uuid("Ruang wajib dipilih"),
  subLokasiId: z.uuid().optional(),
  jumlahUnit: z.coerce.number().int().min(1, "Jumlah unit minimal 1"),
});

function readBarangFormFields(formData: FormData) {
  return {
    nama: formData.get("nama"),
    merkTipe: formData.get("merkTipe") || undefined,
    kode: formData.get("kode"),
    kategori: formData.get("kategori") || undefined,
    spesifikasi: formData.get("spesifikasi") || undefined,
    modePelacakan: formData.get("modePelacakan") || undefined,
    tanggalMasuk: formData.get("tanggalMasuk"),
    sumberDana: formData.get("sumberDana"),
    sumberDanaLainnya: formData.get("sumberDanaLainnya") || undefined,
    periodeDana: formData.get("periodeDana") || undefined,
    nominalDana: formData.get("nominalDana") || undefined,
  };
}

type LokasiBaris = {
  ruangId: string;
  subLokasiId: string | null;
  jumlah: number;
  jumlahBaik: number;
  jumlahRusakRingan: number;
  jumlahRusakBerat: number;
};

/**
 * Baris lokasi mode Batch dikirim sebagai field berulang (satu <input> per
 * baris per kolom, nama field sama — lihat BarangForm) karena FormData tidak
 * punya notasi array/objek asli. Di-zip berdasarkan index yang sama.
 */
function parseLokasiBaris(formData: FormData): { data: LokasiBaris[] } | { error: string } {
  const ruangIds = formData.getAll("lokasiRuangId").map(String);
  const subLokasiIds = formData.getAll("lokasiSubLokasiId").map(String);
  const jumlahs = formData.getAll("lokasiJumlah").map(String);
  const baiks = formData.getAll("lokasiBaik").map(String);
  const rusakRingans = formData.getAll("lokasiRusakRingan").map(String);
  const rusakBerats = formData.getAll("lokasiRusakBerat").map(String);

  if (ruangIds.length === 0) return { error: "Minimal 1 lokasi wajib diisi." };

  const rows: LokasiBaris[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < ruangIds.length; i++) {
    const label = `Lokasi baris ${i + 1}`;
    const ruangId = ruangIds[i];
    if (!z.uuid().safeParse(ruangId).success) return { error: `${label}: Ruang wajib dipilih.` };

    const subLokasiId = subLokasiIds[i] || null;
    if (subLokasiId && !z.uuid().safeParse(subLokasiId).success) {
      return { error: `${label}: Sub-lokasi tidak valid.` };
    }

    const jumlah = Number(jumlahs[i]);
    const jumlahBaik = Number(baiks[i] || 0);
    const jumlahRusakRingan = Number(rusakRingans[i] || 0);
    const jumlahRusakBerat = Number(rusakBerats[i] || 0);

    if (!Number.isInteger(jumlah) || jumlah < 1) return { error: `${label}: Jumlah minimal 1.` };
    if (
      !Number.isInteger(jumlahBaik) ||
      jumlahBaik < 0 ||
      !Number.isInteger(jumlahRusakRingan) ||
      jumlahRusakRingan < 0 ||
      !Number.isInteger(jumlahRusakBerat) ||
      jumlahRusakBerat < 0
    ) {
      return { error: `${label}: Jumlah kondisi tidak valid.` };
    }
    if (jumlahBaik + jumlahRusakRingan + jumlahRusakBerat !== jumlah) {
      return { error: `${label}: Baik + Rusak Ringan + Rusak Berat harus sama dengan Jumlah.` };
    }

    const key = `${ruangId}::${subLokasiId ?? ""}`;
    if (seen.has(key)) return { error: `${label}: lokasi ini sudah dipakai di baris lain.` };
    seen.add(key);

    rows.push({ ruangId, subLokasiId, jumlah, jumlahBaik, jumlahRusakRingan, jumlahRusakBerat });
  }

  return { data: rows };
}

async function validateLokasiBarisSubLokasi(rows: LokasiBaris[]): Promise<string | null> {
  for (const [i, row] of rows.entries()) {
    if (!row.subLokasiId) continue;
    const [sub] = await db.select().from(subLokasi).where(eq(subLokasi.id, row.subLokasiId)).limit(1);
    if (!sub || sub.ruangId !== row.ruangId) {
      return `Lokasi baris ${i + 1}: Sub-lokasi tidak sesuai dengan Ruang yang dipilih.`;
    }
  }
  return null;
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

async function savePhotos(barangId: string, photoFiles: File[]) {
  for (const file of photoFiles) {
    const result = await saveUploadedImage(file, "barang");
    if (result.ok) {
      await db.insert(barangFoto).values({ barangId, path: result.url });
    }
  }
}

const DUPLICATE_KODE_ERROR = "Kode / No. Seri sudah dipakai barang lain.";

async function runOrDuplicateKodeError<T>(
  fn: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    if ((cause as { code?: string } | undefined)?.code === "23505") {
      return { ok: false, error: DUPLICATE_KODE_ERROR };
    }
    throw error;
  }
}

export async function createBarangAction(
  _prevState: CreateBarangState,
  formData: FormData,
): Promise<CreateBarangState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = barangBaseFieldsSchema.safeParse(readBarangFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const data = parsed.data;

  const photoFiles = readPhotoFiles(formData);
  const photoError = validatePhotoFiles(photoFiles);
  if (photoError) return { error: photoError };

  const actorId = session.user.id;
  const commonValues = {
    nama: data.nama,
    merkTipe: data.merkTipe || null,
    kode: data.kode,
    kategori: data.kategori || null,
    spesifikasi: data.spesifikasi || null,
    tanggalMasuk: data.tanggalMasuk,
    sumberDana: data.sumberDana,
    sumberDanaLainnya: data.sumberDana === "lainnya" ? data.sumberDanaLainnya || null : null,
    periodeDana: data.periodeDana || null,
    nominalDana: data.nominalDana ?? null,
    createdBy: actorId,
    updatedBy: actorId,
  };

  let newBarangId: string;

  if (data.modePelacakan === "unit") {
    const unitParsed = unitModeLocationSchema.safeParse({
      ruangId: formData.get("ruangId") || undefined,
      subLokasiId: formData.get("subLokasiId") || undefined,
      jumlahUnit: formData.get("jumlahUnit"),
    });
    if (!unitParsed.success) {
      return { error: unitParsed.error.issues[0]?.message ?? "Data tidak valid." };
    }
    const unitData = unitParsed.data;

    if (unitData.subLokasiId) {
      const [sub] = await db.select().from(subLokasi).where(eq(subLokasi.id, unitData.subLokasiId)).limit(1);
      if (!sub || sub.ruangId !== unitData.ruangId) {
        return { error: "Sub-lokasi tidak sesuai dengan Ruang yang dipilih." };
      }
    }

    const result = await runOrDuplicateKodeError(() =>
      db.transaction(async (tx) => {
        const [created] = await tx
          .insert(barang)
          .values({
            ...commonValues,
            ruangId: unitData.ruangId,
            subLokasiId: unitData.subLokasiId ?? null,
            modePelacakan: "unit",
            jumlahUnit: unitData.jumlahUnit,
            jumlahBaik: 0,
            jumlahRusakRingan: 0,
            jumlahRusakBerat: 0,
          })
          .returning({ id: barang.id });

        await tx.insert(barangUnit).values(
          Array.from({ length: unitData.jumlahUnit }, (_, i) => ({
            barangId: created.id,
            subKode: `${data.kode}-U${i + 1}`,
            ruangId: unitData.ruangId,
            subLokasiId: unitData.subLokasiId ?? null,
            createdBy: actorId,
            updatedBy: actorId,
          })),
        );
        await syncBarangBreakdownFromUnits(created.id, tx);
        return created.id;
      }),
    );
    if (!result.ok) return { error: result.error };
    newBarangId = result.value;
  } else {
    const lokasiParsed = parseLokasiBaris(formData);
    if ("error" in lokasiParsed) return { error: lokasiParsed.error };
    const subLokasiError = await validateLokasiBarisSubLokasi(lokasiParsed.data);
    if (subLokasiError) return { error: subLokasiError };

    const result = await runOrDuplicateKodeError(() =>
      db.transaction(async (tx) => {
        const [created] = await tx
          .insert(barang)
          .values({
            ...commonValues,
            // Sementara — langsung ditimpa oleh syncBarangBreakdownFromLokasi
            // di bawah begitu baris barang_lokasi-nya ada.
            ruangId: lokasiParsed.data[0].ruangId,
            subLokasiId: lokasiParsed.data[0].subLokasiId,
            modePelacakan: "batch",
            jumlahUnit: 0,
            jumlahBaik: 0,
            jumlahRusakRingan: 0,
            jumlahRusakBerat: 0,
          })
          .returning({ id: barang.id });

        await tx.insert(barangLokasi).values(
          lokasiParsed.data.map((row, i) => ({
            barangId: created.id,
            ruangId: row.ruangId,
            subLokasiId: row.subLokasiId,
            urutan: i,
            jumlah: row.jumlah,
            jumlahBaik: row.jumlahBaik,
            jumlahRusakRingan: row.jumlahRusakRingan,
            jumlahRusakBerat: row.jumlahRusakBerat,
            createdBy: actorId,
            updatedBy: actorId,
          })),
        );
        await syncBarangBreakdownFromLokasi(created.id, tx);
        return created.id;
      }),
    );
    if (!result.ok) return { error: result.error };
    newBarangId = result.value;
  }

  await savePhotos(newBarangId, photoFiles);

  revalidatePath("/barang");
  redirect("/barang");
}

export type UpdateBarangState = { error: string } | null;

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

  const parsed = barangBaseFieldsSchema.safeParse(readBarangFormFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const data = parsed.data;

  const photoFiles = readPhotoFiles(formData);
  const photoError = validatePhotoFiles(photoFiles);
  if (photoError) return { error: photoError };

  const actorId = session.user.id;
  const commonSet = {
    nama: data.nama,
    merkTipe: data.merkTipe || null,
    kode: data.kode,
    kategori: data.kategori || null,
    spesifikasi: data.spesifikasi || null,
    tanggalMasuk: data.tanggalMasuk,
    sumberDana: data.sumberDana,
    sumberDanaLainnya: data.sumberDana === "lainnya" ? data.sumberDanaLainnya || null : null,
    periodeDana: data.periodeDana || null,
    nominalDana: data.nominalDana ?? null,
    updatedBy: actorId,
    updatedAt: new Date(),
  };

  // Mode terkunci setelah barang dibuat — apapun yang dikirim form diabaikan,
  // mode selalu ikut data existing di database.
  if (existing.modePelacakan === "unit") {
    const unitParsed = unitModeLocationSchema.pick({ ruangId: true, subLokasiId: true }).safeParse({
      ruangId: formData.get("ruangId") || undefined,
      subLokasiId: formData.get("subLokasiId") || undefined,
    });
    if (!unitParsed.success) {
      return { error: unitParsed.error.issues[0]?.message ?? "Data tidak valid." };
    }

    if (unitParsed.data.subLokasiId) {
      const [sub] = await db.select().from(subLokasi).where(eq(subLokasi.id, unitParsed.data.subLokasiId)).limit(1);
      if (!sub || sub.ruangId !== unitParsed.data.ruangId) {
        return { error: "Sub-lokasi tidak sesuai dengan Ruang yang dipilih." };
      }
    }

    const result = await runOrDuplicateKodeError(() =>
      db
        .update(barang)
        .set({
          ...commonSet,
          ruangId: unitParsed.data.ruangId,
          subLokasiId: unitParsed.data.subLokasiId ?? null,
        })
        .where(eq(barang.id, id)),
    );
    if (!result.ok) return { error: result.error };
  } else {
    const lokasiParsed = parseLokasiBaris(formData);
    if ("error" in lokasiParsed) return { error: lokasiParsed.error };
    const subLokasiError = await validateLokasiBarisSubLokasi(lokasiParsed.data);
    if (subLokasiError) return { error: subLokasiError };

    const result = await runOrDuplicateKodeError(() =>
      db.transaction(async (tx) => {
        await tx.update(barang).set(commonSet).where(eq(barang.id, id));
        await tx.delete(barangLokasi).where(eq(barangLokasi.barangId, id));
        await tx.insert(barangLokasi).values(
          lokasiParsed.data.map((row, i) => ({
            barangId: id,
            ruangId: row.ruangId,
            subLokasiId: row.subLokasiId,
            urutan: i,
            jumlah: row.jumlah,
            jumlahBaik: row.jumlahBaik,
            jumlahRusakRingan: row.jumlahRusakRingan,
            jumlahRusakBerat: row.jumlahRusakBerat,
            createdBy: actorId,
            updatedBy: actorId,
          })),
        );
        await syncBarangBreakdownFromLokasi(id, tx);
      }),
    );
    if (!result.ok) return { error: result.error };
  }

  await savePhotos(id, photoFiles);

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
