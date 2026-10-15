import { Topbar } from "@/components/layout/topbar";
import { PengaturanForm } from "@/components/pengaturan/pengaturan-form";
import { getPengaturanSekolah } from "@/lib/pengaturan-sekolah";

export default async function PengaturanSekolahPage() {
  const pengaturan = await getPengaturanSekolah();

  return (
    <>
      <Topbar title="Pengaturan Sekolah" breadcrumb="Identitas sekolah untuk kop & tanda tangan dokumen" />
      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <PengaturanForm initialData={pengaturan} />
      </div>
    </>
  );
}
