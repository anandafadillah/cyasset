import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export type SuratPeminjamanData = {
  nomorSurat: string;
  peminjamNama: string;
  penanggungJawab: string;
  tujuan: string;
  lokasiPemanfaatan: string;
  tanggalPinjam: string;
  tanggalRencanaKembali: string;
  tanggalTerbit: string;
  petugasNama: string;
  items: { nama: string; jumlah: number }[];
};

const YAYASAN = "YAYASAN PENDIDIKAN CYBER MEDIA";
const SEKOLAH = "SMK CYBER MEDIA";
const ALAMAT = "Jl. Teknologi Informasi No. 45, Jakarta Selatan 12440";
const KONTAK = "Telp. (021) 7890-1234 · www.smkcybermedia.sch.id";
const KOTA = "Jakarta";
const KEPALA_SEKOLAH = "Drs. H. Bambang Wijaya, M.Pd.";

const styles = StyleSheet.create({
  page: { fontFamily: "Times-Roman", fontSize: 11, color: "#1a1a1a", padding: 48 },
  kop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 3,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 10,
    marginBottom: 16,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#5d5294",
  },
  kopText: { flex: 1, textAlign: "center" },
  yayasan: { fontSize: 10.5, letterSpacing: 0.5 },
  sekolah: { fontSize: 17, fontFamily: "Times-Bold", letterSpacing: 0.5, marginTop: 2 },
  alamat: { fontSize: 9, marginTop: 4, lineHeight: 1.4 },
  judulWrap: { textAlign: "center", marginBottom: 14 },
  judul: { fontSize: 13, fontFamily: "Times-Bold", textDecoration: "underline", letterSpacing: 0.5 },
  nomor: { fontSize: 11, marginTop: 2 },
  paragraf: { fontSize: 11, lineHeight: 1.6, marginBottom: 8 },
  table: { marginTop: 4, marginBottom: 6 },
  tr: { flexDirection: "row" },
  td1: { width: 130 },
  td2: { width: 10 },
  td3: { flex: 1 },
  rowGap: { marginBottom: 4 },
  itemTable: { borderWidth: 1, borderColor: "#999", marginBottom: 16 },
  itemHeadRow: { flexDirection: "row", backgroundColor: "#f0f0f4" },
  itemRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#999" },
  cellNo: { width: 32, padding: 5, borderRightWidth: 1, borderRightColor: "#999", textAlign: "center" },
  cellNama: { flex: 1, padding: 5, borderRightWidth: 1, borderRightColor: "#999" },
  cellJml: { width: 44, padding: 5, borderRightWidth: 1, borderRightColor: "#999", textAlign: "center" },
  cellKet: { flex: 1, padding: 5 },
  headCell: { fontSize: 10, fontFamily: "Times-Bold" },
  cellText: { fontSize: 10 },
  ttdWrap: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  ttdCol: { textAlign: "center", fontSize: 11 },
  ttdSpace: { height: 56 },
  ttdName: { textDecoration: "underline" },
  mengetahui: { textAlign: "center", fontSize: 10.5, marginTop: 26 },
});

function formatTanggalIndonesia(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SuratPeminjamanPdf({ data }: { data: SuratPeminjamanData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.kop}>
          <View style={styles.logo} />
          <View style={styles.kopText}>
            <Text style={styles.yayasan}>{YAYASAN}</Text>
            <Text style={styles.sekolah}>{SEKOLAH}</Text>
            <Text style={styles.alamat}>{ALAMAT}</Text>
            <Text style={styles.alamat}>{KONTAK}</Text>
          </View>
        </View>

        <View style={styles.judulWrap}>
          <Text style={styles.judul}>SURAT PEMINJAMAN BARANG</Text>
          <Text style={styles.nomor}>Nomor: {data.nomorSurat}</Text>
        </View>

        <Text style={styles.paragraf}>
          Yang bertanda tangan di bawah ini, selaku Petugas Sarana dan Prasarana {SEKOLAH}, menerangkan bahwa
          telah meminjamkan barang inventaris sekolah kepada:
        </Text>

        <View style={styles.table}>
          <View style={[styles.tr, styles.rowGap]}>
            <Text style={styles.td1}>Nama / Instansi</Text>
            <Text style={styles.td2}>:</Text>
            <Text style={styles.td3}>{data.peminjamNama}</Text>
          </View>
          <View style={[styles.tr, styles.rowGap]}>
            <Text style={styles.td1}>Penanggung Jawab</Text>
            <Text style={styles.td2}>:</Text>
            <Text style={styles.td3}>{data.penanggungJawab}</Text>
          </View>
          <View style={[styles.tr, styles.rowGap]}>
            <Text style={styles.td1}>Keperluan</Text>
            <Text style={styles.td2}>:</Text>
            <Text style={styles.td3}>{data.tujuan}</Text>
          </View>
          <View style={[styles.tr, styles.rowGap]}>
            <Text style={styles.td1}>Lokasi Pemanfaatan</Text>
            <Text style={styles.td2}>:</Text>
            <Text style={styles.td3}>{data.lokasiPemanfaatan}</Text>
          </View>
          <View style={styles.tr}>
            <Text style={styles.td1}>Jangka Waktu</Text>
            <Text style={styles.td2}>:</Text>
            <Text style={styles.td3}>
              {formatTanggalIndonesia(data.tanggalPinjam)} s/d {formatTanggalIndonesia(data.tanggalRencanaKembali)}
            </Text>
          </View>
        </View>

        <Text style={styles.paragraf}>Dengan rincian barang sebagai berikut:</Text>

        <View style={styles.itemTable}>
          <View style={styles.itemHeadRow}>
            <Text style={[styles.cellNo, styles.headCell]}>No</Text>
            <Text style={[styles.cellNama, styles.headCell]}>Nama Barang</Text>
            <Text style={[styles.cellJml, styles.headCell]}>Jml</Text>
            <Text style={[styles.cellKet, styles.headCell]}>Keterangan</Text>
          </View>
          {data.items.map((item, index) => (
            <View key={`${item.nama}-${index}`} style={styles.itemRow}>
              <Text style={[styles.cellNo, styles.cellText]}>{index + 1}</Text>
              <Text style={[styles.cellNama, styles.cellText]}>{item.nama}</Text>
              <Text style={[styles.cellJml, styles.cellText]}>{item.jumlah}</Text>
              <Text style={[styles.cellKet, styles.cellText]}>Kondisi baik</Text>
            </View>
          ))}
        </View>

        <Text style={styles.paragraf}>
          Peminjam bertanggung jawab penuh atas keutuhan dan pengembalian barang sesuai jangka waktu di atas.
          Demikian surat ini dibuat untuk dipergunakan sebagaimana mestinya.
        </Text>

        <View style={styles.ttdWrap}>
          <View style={styles.ttdCol}>
            <Text>Peminjam,</Text>
            <View style={styles.ttdSpace} />
            <Text style={styles.ttdName}>{data.penanggungJawab}</Text>
          </View>
          <View style={styles.ttdCol}>
            <Text>
              {KOTA}, {formatTanggalIndonesia(data.tanggalTerbit)}
            </Text>
            <Text>Petugas Sarpras,</Text>
            <View style={styles.ttdSpace} />
            <Text style={styles.ttdName}>{data.petugasNama}</Text>
          </View>
        </View>

        <View style={styles.mengetahui}>
          <Text>Mengetahui,</Text>
          <Text>Kepala {SEKOLAH}</Text>
          <View style={{ height: 50 }} />
          <Text style={styles.ttdName}>{KEPALA_SEKOLAH}</Text>
        </View>
      </Page>
    </Document>
  );
}
