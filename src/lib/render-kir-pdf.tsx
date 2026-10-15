import { renderToBuffer } from "@react-pdf/renderer";
import { KirPdf } from "@/components/kir/kir-pdf";
import type { KirData } from "@/lib/kir-data";
import { getPengaturanSekolah } from "@/lib/pengaturan-sekolah";

/** tanggalDokumen: "YYYY-MM-DD" — lihat tanggalDokumenDari() di src/lib/kir.ts. */
export async function renderKirPdf(halaman: KirData[], tanggalDokumen: string): Promise<Buffer> {
  const sekolah = await getPengaturanSekolah();
  return renderToBuffer(<KirPdf halaman={halaman} sekolah={sekolah} tanggalDokumen={tanggalDokumen} />);
}
