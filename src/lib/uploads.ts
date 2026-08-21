import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Simpan foto ke disk lokal (public/uploads/<subdir>) — bukan object storage
 * cloud, sesuai keputusan deploy VPS. Dipakai modul Barang, Peminjaman, dan
 * Laporan Kerusakan untuk foto kondisi/bukti.
 */
export async function saveUploadedImage(file: File, subdir: string): Promise<UploadResult> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return { ok: false, error: `File "${file.name}" harus berformat JPG atau PNG.` };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { ok: false, error: `File "${file.name}" melebihi ukuran maksimum 5 MB.` };
  }

  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return { ok: true, url: `/uploads/${subdir}/${filename}` };
}

/**
 * Hapus file foto dari disk berdasarkan url yang tersimpan di kolom `path`
 * (mis. "/uploads/barang/xxx.jpg"). Best-effort — kalau filenya sudah tidak
 * ada atau url-nya bukan di bawah uploads/, tidak dianggap error supaya
 * penghapusan baris DB tetap bisa lanjut.
 */
export async function deleteUploadedImage(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return;

  const filePath = path.join(UPLOAD_ROOT, url.slice("/uploads/".length));
  if (!filePath.startsWith(UPLOAD_ROOT + path.sep)) return;

  await unlink(filePath).catch(() => {});
}
