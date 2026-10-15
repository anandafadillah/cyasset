import { renderToBuffer } from "@react-pdf/renderer";
import { KirPdf } from "@/components/kir/kir-pdf";
import type { KirData } from "@/lib/kir-data";
import { getPengaturanSekolah } from "@/lib/pengaturan-sekolah";
import { generateQrDataUrl } from "@/lib/qr";

/** tanggalDokumen: "YYYY-MM-DD" — lihat tanggalDokumenDari() di src/lib/kir.ts. */
export async function renderKirPdf(halaman: KirData[], tanggalDokumen: string): Promise<Buffer> {
  const [sekolah, qrList] = await Promise.all([
    getPengaturanSekolah(),
    Promise.all(halaman.map((data) => generateQrDataUrl(`/s/ruang/${data.ruang.id}`))),
  ]);
  const halamanDenganQr = halaman.map((data, index) => ({ ...data, qrDataUrl: qrList[index] }));
  return renderToBuffer(<KirPdf halaman={halamanDenganQr} sekolah={sekolah} tanggalDokumen={tanggalDokumen} />);
}
