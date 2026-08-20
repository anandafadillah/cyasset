import { renderToBuffer } from "@react-pdf/renderer";
import { SuratPeminjamanPdf, type SuratPeminjamanData } from "@/components/surat/surat-peminjaman-pdf";

export async function renderSuratPeminjamanPdf(data: SuratPeminjamanData): Promise<Buffer> {
  return renderToBuffer(<SuratPeminjamanPdf data={data} />);
}
