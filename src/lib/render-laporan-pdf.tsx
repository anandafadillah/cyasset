import { renderToBuffer } from "@react-pdf/renderer";
import { LirPdf, type LirData } from "@/components/laporan/lir-pdf";
import { LaporanTabelPdf, type LaporanTabelData } from "@/components/laporan/laporan-tabel-pdf";

export async function renderLirPdf(data: LirData): Promise<Buffer> {
  return renderToBuffer(<LirPdf data={data} />);
}

export async function renderLaporanTabelPdf(data: LaporanTabelData): Promise<Buffer> {
  return renderToBuffer(<LaporanTabelPdf data={data} />);
}
