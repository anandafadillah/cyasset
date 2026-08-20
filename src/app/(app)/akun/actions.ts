"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { staff } from "@/db/schema";

const createStaffSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi"),
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter")
    .regex(/^[a-z0-9._-]+$/i, "Username hanya boleh huruf, angka, titik, garis bawah, atau strip"),
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export type CreateStaffState = { error: string } | { success: true } | null;

export async function createStaffAction(
  _prevState: CreateStaffState,
  formData: FormData,
): Promise<CreateStaffState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const parsed = createStaffSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { name, username, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.insert(staff).values({
      name,
      username,
      email,
      passwordHash,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    if ((cause as { code?: string } | undefined)?.code === "23505") {
      return { error: "Username atau email sudah dipakai akun lain." };
    }
    throw error;
  }

  revalidatePath("/akun");
  return { success: true };
}

export type DeactivateStaffState = { error: string } | { success: true } | null;

export async function deactivateStaffAction(
  _prevState: DeactivateStaffState,
  formData: FormData,
): Promise<DeactivateStaffState> {
  const session = await auth();
  if (!session?.user) return { error: "Sesi tidak valid." };

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    return { error: "Data tidak valid." };
  }

  if (id === session.user.id) {
    return { error: "Anda tidak bisa menonaktifkan akun sendiri." };
  }

  await db
    .update(staff)
    .set({ isActive: false, updatedBy: session.user.id, updatedAt: new Date() })
    .where(eq(staff.id, id));

  revalidatePath("/akun");
  return { success: true };
}
