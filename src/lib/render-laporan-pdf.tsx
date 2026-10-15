import { renderToBuffer } from "@react-pdf/renderer";
import { LirPdf, type LirData } from "@/components/laporan/lir-pdf";
import { LaporanTabelPdf, type LaporanTabelData } from "@/components/laporan/laporan-tabel-pdf";
import { getPengaturanSekolah } from "@/lib/pengaturan-sekolah";

export async function renderLirPdf(data: LirData): Promise<Buffer> {
  const { namaSekolah } = await getPengaturanSekolah();
  return renderToBuffer(<LirPdf data={data} namaSekolah={namaSekolah} />);
}

export async function renderLaporanTabelPdf(data: LaporanTabelData): Promise<Buffer> {
  const { namaSekolah } = await getPengaturanSekolah();
  return renderToBuffer(<LaporanTabelPdf data={data} namaSekolah={namaSekolah} />);
}
