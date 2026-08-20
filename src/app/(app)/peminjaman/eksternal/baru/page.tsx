import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { PeminjamanEksternalForm } from "@/components/peminjaman/peminjaman-eksternal-form";
import { getBarangOptions } from "@/lib/stok";

export default async function PeminjamanEksternalBaruPage() {
  const barangOptions = await getBarangOptions();

  return (
    <>
      <div className="flex h-[66px] flex-none items-center gap-3 border-b border-border px-6">
        <Link href="/peminjaman" className="grid size-8 place-items-center rounded-lg text-muted hover:text-text">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-text">Peminjaman Eksternal</h2>
          <div className="mt-0.5 text-xs text-dim">Peminjaman / Baru</div>
        </div>
      </div>
      <div className="flex-1 p-6">
        <PeminjamanEksternalForm barangOptions={barangOptions} />
      </div>
    </>
  );
}
