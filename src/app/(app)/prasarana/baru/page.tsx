import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { PrasaranaForm } from "@/components/prasarana/prasarana-form";

export default function PrasaranaBaruPage() {
  return (
    <>
      <div className="sticky top-0 z-10 flex h-[66px] flex-none items-center gap-3 border-b border-border bg-surface px-6">
        <Link href="/prasarana" className="grid size-8 place-items-center rounded-lg text-muted hover:text-text">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-text">Tambah Pekerjaan Prasarana</h2>
          <div className="mt-0.5 text-xs text-dim">Prasarana / Baru</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <PrasaranaForm />
      </div>
    </>
  );
}
