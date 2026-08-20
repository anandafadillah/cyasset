import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/db";
import { staff } from "../src/db/schema";

// Nilai default cocok untuk dev lokal. Untuk produksi, override lewat env var
// (ADMIN_USERNAME/ADMIN_EMAIL/ADMIN_NAME/ADMIN_PASSWORD) supaya password
// asli tidak pernah masuk ke source code/git — lihat DEPLOYMENT.md.
const name = process.env.ADMIN_NAME || "Rian Nugraha";
const username = process.env.ADMIN_USERNAME || "rian.sarpras";
const email = process.env.ADMIN_EMAIL || "rian@smkcybermedia.sch.id";
const password = process.env.ADMIN_PASSWORD || "sarpras123";

async function main() {
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      "Peringatan: ADMIN_PASSWORD tidak di-set, memakai password contoh (hanya untuk dev lokal). " +
        "Untuk produksi, jalankan ulang dengan ADMIN_USERNAME/ADMIN_EMAIL/ADMIN_PASSWORD ter-set.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const inserted = await db
    .insert(staff)
    .values({
      name,
      username,
      email,
      passwordHash,
    })
    .onConflictDoNothing({ target: staff.username })
    .returning({ id: staff.id });

  if (inserted.length === 0) {
    console.log(`Akun "${username}" sudah ada, tidak ada perubahan.`);
  } else {
    console.log("Akun Admin Sarpras awal berhasil dibuat:");
    console.log(`  Username : ${username}`);
    console.log(`  Email    : ${email}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`  Password : ${password} (ganti setelah login pertama — belum ada fitur ubah password di UI)`);
    }
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Gagal menjalankan seed:", error);
  process.exit(1);
});
