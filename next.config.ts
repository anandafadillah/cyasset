import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CATATAN: sengaja TIDAK pakai output: "standalone" (alasan historis, lihat
  // DEPLOYMENT.md). Tapi baik standalone maupun `next start` biasa SAMA-SAMA
  // men-snapshot isi public/ sekali saat server boot (lihat
  // node_modules/next/dist/server/lib/router-utils/filesystem.js) — file yang
  // ditambahkan ke public/uploads SETELAH boot (semua foto upload runtime)
  // tetap 404 lewat static-file serving bawaan Next walau filenya ada di
  // disk. Makanya foto di-serve lewat route handler
  // src/app/uploads/[...path]/route.ts yang baca disk langsung tiap request,
  // bukan mengandalkan public/ folder sama sekali.
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
