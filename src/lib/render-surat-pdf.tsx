import { renderToBuffer } from "@react-pdf/renderer";
import { SuratPeminjamanPdf, type SuratPeminjamanData } from "@/components/surat/surat-peminjaman-pdf";
import { getPengaturanSekolah } from "@/lib/pengaturan-sekolah";

export async function renderSuratPeminjamanPdf(data: SuratPeminjamanData): Promise<Buffer> {
  const sekolah = await getPengaturanSekolah();
  return renderToBuffer(<SuratPeminjamanPdf data={data} sekolah={sekolah} />);
}
