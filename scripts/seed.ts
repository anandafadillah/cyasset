import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/db";
import { staff } from "../src/db/schema";

async function main() {
  const username = "rian.sarpras";
  const email = "rian@smkcybermedia.sch.id";
  const password = "sarpras123";

  const passwordHash = await bcrypt.hash(password, 10);

  const inserted = await db
    .insert(staff)
    .values({
      name: "Rian Nugraha",
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
    console.log(`  Password : ${password} (ganti setelah login pertama)`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Gagal menjalankan seed:", error);
  process.exit(1);
});
