import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export type LirData = {
  ruangNama: string;
  lantaiNama: string;
  gedungNama: string;
  tanggalCetak: string;
  items: {
    nama: string;
    kode: string;
    kategori: string | null;
    jumlahUnit: number;
    jumlahBaik: number;
    jumlahRusakRingan: number;
    jumlahRusakBerat: number;
  }[];
};

const SEKOLAH = "SMK CYBER MEDIA";

const styles = StyleSheet.create({
  page: { fontFamily: "Times-Roman", fontSize: 10.5, color: "#1a1a1a", padding: 44 },
  kop: {
    textAlign: "center",
    borderBottomWidth: 3,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 10,
    marginBottom: 16,
  },
  sekolah: { fontSize: 16, fontFamily: "Times-Bold" },
  judul: { fontSize: 13, fontFamily: "Times-Bold", textDecoration: "underline", marginTop: 14, textAlign: "center" },
  meta: { fontSize: 10.5, marginTop: 10, marginBottom: 14, lineHeight: 1.6 },
  table: { borderWidth: 1, borderColor: "#999" },
  headRow: { flexDirection: "row", backgroundColor: "#f0f0f4" },
  row: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#999" },
  cNo: { width: 26, padding: 5, borderRightWidth: 1, borderRightColor: "#999", textAlign: "center" },
  cNama: { flex: 2, padding: 5, borderRightWidth: 1, borderRightColor: "#999" },
  cKode: { flex: 1, padding: 5, borderRightWidth: 1, borderRightColor: "#999" },
  cKategori: { flex: 1, padding: 5, borderRightWidth: 1, borderRightColor: "#999" },
  cNum: { width: 38, padding: 5, borderRightWidth: 1, borderRightColor: "#999", textAlign: "center" },
  cNumLast: { width: 38, padding: 5, textAlign: "center" },
  head: { fontSize: 9, fontFamily: "Times-Bold" },
  cell: { fontSize: 9.5 },
  ttdWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 40 },
  ttdCol: { textAlign: "center", fontSize: 10.5, width: 200 },
  ttdSpace: { height: 56 },
});

export function LirPdf({ data }: { data: LirData }) {
  const totalUnit = data.items.reduce((sum, item) => sum + item.jumlahUnit, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.kop}>
          <Text style={styles.sekolah}>{SEKOLAH}</Text>
          <Text>Laporan Inventaris Ruang</Text>
        </View>
        <Text style={styles.judul}>LAPORAN INVENTARIS RUANG</Text>
        <Text style={styles.meta}>
          Ruang: {data.gedungNama} · {data.lantaiNama} · {data.ruangNama}
          {"\n"}Total jenis barang: {data.items.length} · Total unit: {totalUnit}
          {"\n"}Dicetak: {data.tanggalCetak}
        </Text>

        <View style={styles.table}>
          <View style={styles.headRow}>
            <Text style={[styles.cNo, styles.head]}>No</Text>
            <Text style={[styles.cNama, styles.head]}>Nama Barang</Text>
            <Text style={[styles.cKode, styles.head]}>Kode</Text>
            <Text style={[styles.cKategori, styles.head]}>Kategori</Text>
            <Text style={[styles.cNum, styles.head]}>Jml</Text>
            <Text style={[styles.cNum, styles.head]}>Baik</Text>
            <Text style={[styles.cNum, styles.head]}>RR</Text>
            <Text style={[styles.cNumLast, styles.head]}>RB</Text>
          </View>
          {data.items.map((item, index) => (
            <View key={`${item.kode}-${index}`} style={styles.row}>
              <Text style={[styles.cNo, styles.cell]}>{index + 1}</Text>
              <Text style={[styles.cNama, styles.cell]}>{item.nama}</Text>
              <Text style={[styles.cKode, styles.cell]}>{item.kode}</Text>
              <Text style={[styles.cKategori, styles.cell]}>{item.kategori ?? "-"}</Text>
              <Text style={[styles.cNum, styles.cell]}>{item.jumlahUnit}</Text>
              <Text style={[styles.cNum, styles.cell]}>{item.jumlahBaik}</Text>
              <Text style={[styles.cNum, styles.cell]}>{item.jumlahRusakRingan}</Text>
              <Text style={[styles.cNumLast, styles.cell]}>{item.jumlahRusakBerat}</Text>
            </View>
          ))}
          {data.items.length === 0 && (
            <View style={styles.row}>
              <Text style={{ padding: 8, fontSize: 9.5, flex: 1, textAlign: "center" }}>
                Tidak ada barang tercatat di ruang ini.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.ttdWrap}>
          <View style={styles.ttdCol}>
            <Text>Petugas Sarpras,</Text>
            <View style={styles.ttdSpace} />
            <Text style={{ textDecoration: "underline" }}>{"( .................................... )"}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
