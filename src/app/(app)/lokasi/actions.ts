"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { gedung, lantai, ruang, subLokasi } from "@/db/schema";

const locationLevels = ["gedung", "lantai", "ruang", "sub-lokasi"] as const;
export type LocationLevel = (typeof locationLevels)[number];

export type LocationFormState = { error: string } | { success: true } | null;

const saveSchema = z.object({
  level: z.enum(locationLevels),
  id: z.uuid().optional(),
  parentId: z.uuid().optional(),
  nama: z.string().trim().min(1, "Nama wajib diisi"),
});

export async function saveLocationAction(
  _prevState: LocationFormState,
  formData: FormData,
): Promise<LocationFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = saveSchema.safeParse({
    level: formData.get("level"),
    id: formData.get("id") || undefined,
    parentId: formData.get("parentId") || undefined,
    nama: formData.get("nama"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { level, id, parentId, nama } = parsed.data;
  const actorId = session.user.id;

  if (id) {
    const patch = { nama, updatedBy: actorId, updatedAt: new Date() };
    switch (level) {
      case "gedung":
        await db.update(gedung).set(patch).where(eq(gedung.id, id));
        break;
      case "lantai":
        await db.update(lantai).set(patch).where(eq(lantai.id, id));
        break;
      case "ruang":
        await db.update(ruang).set(patch).where(eq(ruang.id, id));
        break;
      case "sub-lokasi":
        await db.update(subLokasi).set(patch).where(eq(subLokasi.id, id));
        break;
    }
  } else {
    if (level !== "gedung" && !parentId) {
      return { error: "Lokasi induk tidak valid." };
    }
    const audit = { createdBy: actorId, updatedBy: actorId };
    switch (level) {
      case "gedung":
        await db.insert(gedung).values({ nama, ...audit });
        break;
      case "lantai":
        await db.insert(lantai).values({ nama, gedungId: parentId!, ...audit });
        break;
      case "ruang":
        await db.insert(ruang).values({ nama, lantaiId: parentId!, ...audit });
        break;
      case "sub-lokasi":
        await db.insert(subLokasi).values({ nama, ruangId: parentId!, ...audit });
        break;
    }
  }

  revalidatePath("/lokasi");
  return { success: true };
}

const deleteSchema = z.object({
  level: z.enum(locationLevels),
  id: z.uuid(),
});

export async function deleteLocationAction(
  _prevState: LocationFormState,
  formData: FormData,
): Promise<LocationFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = deleteSchema.safeParse({
    level: formData.get("level"),
    id: formData.get("id"),
  });
  if (!parsed.success) return { error: "Data tidak valid." };

  const { level, id } = parsed.data;
  switch (level) {
    case "gedung":
      await db.delete(gedung).where(eq(gedung.id, id));
      break;
    case "lantai":
      await db.delete(lantai).where(eq(lantai.id, id));
      break;
    case "ruang":
      await db.delete(ruang).where(eq(ruang.id, id));
      break;
    case "sub-lokasi":
      await db.delete(subLokasi).where(eq(subLokasi.id, id));
      break;
  }

  revalidatePath("/lokasi");
  return { success: true };
}
