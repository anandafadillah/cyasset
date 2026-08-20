import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { PeminjamanInternalForm } from "@/components/peminjaman/peminjaman-internal-form";
import { getBarangOptions } from "@/lib/stok";

export default async function PeminjamanInternalBaruPage() {
  const barangOptions = await getBarangOptions();

  return (
    <>
      <div className="sticky top-0 z-10 flex h-[66px] flex-none items-center gap-3 border-b border-border bg-surface px-6">
        <Link href="/peminjaman" className="grid size-8 place-items-center rounded-lg text-muted hover:text-text">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-text">Peminjaman Internal</h2>
          <div className="mt-0.5 text-xs text-dim">Peminjaman / Baru</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <PeminjamanInternalForm barangOptions={barangOptions} />
      </div>
    </>
  );
}
