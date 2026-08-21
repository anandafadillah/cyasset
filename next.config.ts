import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CATATAN: sengaja TIDAK pakai output: "standalone". Server standalone
  // Next.js menyajikan public/ dari manifest yang dihitung saat build —
  // file baru yang ditambahkan ke public/uploads SETELAH build (yaitu semua
  // foto yang di-upload user saat aplikasi jalan) akan 404 walau filenya
  // benar-benar ada di disk. Ditemukan lewat verifikasi Docker sebelum
  // deploy — lihat DEPLOYMENT.md. `next start` biasa (dipakai Dockerfile)
  // menyajikan public/ langsung dari disk tiap request, jadi upload baru
  // langsung bisa diakses.
  experimental: {
    serverActions: {
      // Default 1MB terlalu kecil — form Barang/Prasarana/Laporan Kerusakan
      // mengirim foto (maks 5MB per file, lihat validatePhotoFiles) lewat
      // Server Action yang sama dengan field lain, jadi limitnya harus
      // menampung beberapa foto sekaligus.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
