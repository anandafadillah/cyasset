"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { barang, barangUnit, laporanKerusakan, laporanKerusakanFoto, laporanKerusakanStatusEnum } from "@/db/schema";
import { saveUploadedImage } from "@/lib/uploads";
import { generateKodeTiket } from "@/lib/kode-tiket";
import { mutasiStokKerusakan } from "@/lib/logika-stok-kerusakan";
import { nextSubKode, syncBarangBreakdownFromUnits } from "@/lib/barang-unit";

const createLaporanSchema = z.object({
  barangId: z.uuid("Barang wajib dipilih"),
  // Diisi untuk barang mode Per-Unit alih-alih jumlahUnitTerdampak (dipaksa 1
  // di server) — lihat Issue 17.
  barangUnitId: z.uuid().optional(),
  deskripsi: z.string().trim().min(1, "Deskripsi keluhan wajib diisi"),
  pelapor: z.string().trim().optional(),
  jumlahUnitTerdampak: z.coerce.number().int().min(1, "Jumlah unit terdampak minimal 1").optional(),
  tingkatKerusakan: z.enum(["rusak_ringan", "rusak_berat"], { error: "Tingkat kerusakan wajib dipilih" }),
});

export type CreateLaporanState = { error: string } | null;

export async function createLaporanAction(
  _prevState: CreateLaporanState,
  formData: FormData,
): Promise<CreateLaporanState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = createLaporanSchema.safeParse({
    barangId: formData.get("barangId"),
    barangUnitId: formData.get("barangUnitId") || undefined,
    deskripsi: formData.get("deskripsi"),
    pelapor: formData.get("pelapor") || undefined,
    jumlahUnitTerdampak: formData.get("jumlahUnitTerdampak") || undefined,
    tingkatKerusakan: formData.get("tingkatKerusakan"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const photoFiles = formData.getAll("foto").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (photoFiles.length === 0) {
    return { error: "Foto bukti wajib diunggah." };
  }
  for (const file of photoFiles) {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return { error: `File "${file.name}" harus berformat JPG atau PNG.` };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { error: `File "${file.name}" melebihi ukuran maksimum 5 MB.` };
    }
  }

  const data = parsed.data;

  const [barangRow] = await db.select().from(barang).where(eq(barang.id, data.barangId)).limit(1);
  if (!barangRow || barangRow.isArchived) {
    return { error: "Barang tidak ditemukan atau sudah diarsipkan." };
  }

  let jumlahUnitTerdampak: number;
  if (barangRow.modePelacakan === "unit") {
    if (!data.barangUnitId) return { error: "Unit wajib dipilih." };
    const [unitRow] = await db.select().from(barangUnit).where(eq(barangUnit.id, data.barangUnitId)).limit(1);
    if (!unitRow || unitRow.barangId !== data.barangId) {
      return { error: "Unit tidak ditemukan." };
    }
    if (unitRow.kondisi !== "baik") {
      return { error: `Unit "${unitRow.subKode}" tidak berkondisi Baik, tidak bisa dibuatkan tiket baru.` };
    }
    jumlahUnitTerdampak = 1;
  } else {
    if (!data.jumlahUnitTerdampak) return { error: "Jumlah unit terdampak wajib diisi." };
    if (data.jumlahUnitTerdampak > barangRow.jumlahBaik) {
      return {
        error: `Jumlah unit terdampak melebihi unit berkondisi Baik saat ini (${barangRow.jumlahBaik}).`,
      };
    }
    jumlahUnitTerdampak = data.jumlahUnitTerdampak;
  }

  const actorId = session.user.id;
  const kodeTiket = await generateKodeTiket();

  const [created] = await db
    .insert(laporanKerusakan)
    .values({
      kodeTiket,
      barangId: data.barangId,
      barangUnitId: barangRow.modePelacakan === "unit" ? data.barangUnitId : null,
      deskripsi: data.deskripsi,
      pelapor: data.pelapor || null,
      jumlahUnitTerdampak,
      tingkatKerusakan: data.tingkatKerusakan,
      status: "masuk",
      createdBy: actorId,
      updatedBy: actorId,
    })
    .returning({ id: laporanKerusakan.id });

  for (const file of photoFiles) {
    const result = await saveUploadedImage(file, "laporan-kerusakan");
    if (result.ok) {
      await db.insert(laporanKerusakanFoto).values({ laporanId: created.id, path: result.url });
    }
  }

  revalidatePath("/laporan-kerusakan");
  redirect("/laporan-kerusakan");
}

const updateStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(laporanKerusakanStatusEnum.enumValues),
});

export type UpdateStatusState = { error: string } | { success: true } | null;

export async function updateLaporanStatusAction(
  _prevState: UpdateStatusState,
  formData: FormData,
): Promise<UpdateStatusState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = updateStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: "Data tidak valid." };

  const [tiket] = await db.select().from(laporanKerusakan).where(eq(laporanKerusakan.id, parsed.data.id)).limit(1);
  if (!tiket) return { error: "Tiket tidak ditemukan." };

  const statusLama = tiket.status;
  const statusBaru = parsed.data.status;
  const actorId = session.user.id;

  if (statusLama === statusBaru) {
    return { success: true };
  }

  const [barangRow] = await db.select().from(barang).where(eq(barang.id, tiket.barangId)).limit(1);
  if (!barangRow) return { error: "Barang terkait tidak ditemukan." };

  let mutasiTerjadi = false;

  if (tiket.barangUnitId) {
    // Mode Per-Unit: transisi mengubah kondisi unit itu sendiri secara
    // langsung (bukan breakdown agregat) — lihat Issue 17. "Selesai" & "Ganti
    // Unit" adalah satu-satunya transisi yang bermutasi, sama seperti mode Batch.
    const kondisiBaru = statusBaru === "selesai" ? "baik" : statusBaru === "ganti_unit" ? "diganti" : null;
    if (kondisiBaru) {
      await db
        .update(barangUnit)
        .set({ kondisi: kondisiBaru, updatedBy: actorId, updatedAt: new Date() })
        .where(eq(barangUnit.id, tiket.barangUnitId));
      await syncBarangBreakdownFromUnits(barangRow.id);
      mutasiTerjadi = true;
    }
  } else {
    const breakdownBaru = mutasiStokKerusakan(
      {
        jumlahUnit: barangRow.jumlahUnit,
        jumlahBaik: barangRow.jumlahBaik,
        jumlahRusakRingan: barangRow.jumlahRusakRingan,
        jumlahRusakBerat: barangRow.jumlahRusakBerat,
      },
      tiket.jumlahUnitTerdampak,
      tiket.tingkatKerusakan,
      statusLama,
      statusBaru,
    );

    mutasiTerjadi =
      breakdownBaru.jumlahBaik !== barangRow.jumlahBaik ||
      breakdownBaru.jumlahRusakRingan !== barangRow.jumlahRusakRingan ||
      breakdownBaru.jumlahRusakBerat !== barangRow.jumlahRusakBerat ||
      breakdownBaru.jumlahUnit !== barangRow.jumlahUnit;

    if (mutasiTerjadi) {
      await db
        .update(barang)
        .set({ ...breakdownBaru, updatedBy: actorId, updatedAt: new Date() })
        .where(eq(barang.id, barangRow.id));
    }
  }

  await db
    .update(laporanKerusakan)
    .set({
      status: statusBaru,
      mutasiDiterapkan: tiket.mutasiDiterapkan || mutasiTerjadi,
      updatedBy: actorId,
      updatedAt: new Date(),
    })
    .where(eq(laporanKerusakan.id, parsed.data.id));

  revalidatePath("/laporan-kerusakan");
  revalidatePath("/barang");
  revalidatePath(`/barang/${barangRow.id}`);
  return { success: true };
}

const tambahUnitPenggantiSchema = z.object({
  laporanId: z.uuid(),
  // Hanya relevan untuk tiket mode Batch — mode Per-Unit selalu menambah
  // tepat 1 unit baru (lihat di bawah), field ini diabaikan untuk tiket itu.
  jumlah: z.coerce.number().int().min(1, "Jumlah unit pengganti minimal 1").optional(),
});

export type TambahUnitPenggantiState = { error: string } | { success: true } | null;

export async function tambahUnitPenggantiAction(
  _prevState: TambahUnitPenggantiState,
  formData: FormData,
): Promise<TambahUnitPenggantiState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = tambahUnitPenggantiSchema.safeParse({
    laporanId: formData.get("laporanId"),
    jumlah: formData.get("jumlah") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const [tiket] = await db.select().from(laporanKerusakan).where(eq(laporanKerusakan.id, parsed.data.laporanId)).limit(1);
  if (!tiket) return { error: "Tiket tidak ditemukan." };
  if (tiket.status !== "ganti_unit") {
    return { error: "Unit pengganti hanya bisa dicatat untuk tiket berstatus Ganti Unit." };
  }

  const actorId = session.user.id;

  if (tiket.barangUnitId) {
    const [unitLama] = await db.select().from(barangUnit).where(eq(barangUnit.id, tiket.barangUnitId)).limit(1);
    if (!unitLama) return { error: "Unit lama tidak ditemukan." };

    const subKode = await nextSubKode(unitLama.barangId);
    await db.insert(barangUnit).values({
      barangId: unitLama.barangId,
      subKode,
      ruangId: unitLama.ruangId,
      subLokasiId: unitLama.subLokasiId,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await syncBarangBreakdownFromUnits(unitLama.barangId);
  } else {
    if (!parsed.data.jumlah) return { error: "Jumlah unit pengganti wajib diisi." };
    await db
      .update(barang)
      .set({
        jumlahUnit: sql`${barang.jumlahUnit} + ${parsed.data.jumlah}`,
        jumlahBaik: sql`${barang.jumlahBaik} + ${parsed.data.jumlah}`,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(barang.id, tiket.barangId));
  }

  revalidatePath("/laporan-kerusakan");
  revalidatePath("/barang");
  revalidatePath(`/barang/${tiket.barangId}`);
  return { success: true };
}
