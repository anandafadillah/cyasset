import { renderToBuffer } from "@react-pdf/renderer";
import { LaporanTabelPdf, type LaporanTabelData } from "@/components/laporan/laporan-tabel-pdf";
import { getPengaturanSekolah } from "@/lib/pengaturan-sekolah";

export async function renderLaporanTabelPdf(data: LaporanTabelData): Promise<Buffer> {
  const { namaSekolah } = await getPengaturanSekolah();
  return renderToBuffer(<LaporanTabelPdf data={data} namaSekolah={namaSekolah} />);
}
