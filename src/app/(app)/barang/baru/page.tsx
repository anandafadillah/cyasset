import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { BarangForm } from "@/components/barang/barang-form";
import { getLocationTree } from "@/lib/locations";

export default async function TambahBarangPage() {
  const gedungList = await getLocationTree();

  return (
    <>
      <div className="flex h-[66px] flex-none items-center gap-3 border-b border-border px-6">
        <Link href="/barang" className="grid size-8 place-items-center rounded-lg text-muted hover:text-text">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-text">Tambah Barang</h2>
          <div className="mt-0.5 text-xs text-dim">Barang / Baru</div>
        </div>
      </div>
      <div className="flex-1 p-6">
        <BarangForm gedungList={gedungList} />
      </div>
    </>
  );
}
