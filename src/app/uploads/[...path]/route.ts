import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

// Next.js men-snapshot isi folder public/ SEKALI saat server boot (lihat
// node_modules/next/dist/server/lib/router-utils/filesystem.js) — file yang
// ditambahkan setelah itu (semua foto upload runtime) tidak dikenali sebagai
// file statis dan berakhir 404 lewat App Router. Route handler ini baca
// langsung dari disk tiap request supaya upload baru selalu ke-serve.
export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  const ext = path.extname(segments[segments.length - 1] ?? "").toLowerCase();
  const contentType = MIME_TYPES[ext];
  if (!contentType) {
    return new NextResponse(null, { status: 404 });
  }

  const filePath = path.join(UPLOADS_ROOT, ...segments);
  if (!filePath.startsWith(UPLOADS_ROOT + path.sep)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
