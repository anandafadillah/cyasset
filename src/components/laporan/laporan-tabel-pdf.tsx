import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export type LaporanTabelKolom = { label: string; width?: number; flex?: number };
export type LaporanTabelData = {
  judul: string;
  meta: string[];
  kolom: LaporanTabelKolom[];
  baris: string[][];
  pesanKosong: string;
};

const SEKOLAH = "SMK CYBER MEDIA";

const styles = StyleSheet.create({
  page: { fontFamily: "Times-Roman", fontSize: 10.5, color: "#1a1a1a", padding: 44 },
  kop: { textAlign: "center", borderBottomWidth: 3, borderBottomColor: "#1a1a1a", paddingBottom: 10, marginBottom: 16 },
  sekolah: { fontSize: 16, fontFamily: "Times-Bold" },
  judul: { fontSize: 13, fontFamily: "Times-Bold", textDecoration: "underline", marginTop: 14, textAlign: "center" },
  meta: { fontSize: 10.5, marginTop: 10, marginBottom: 14, lineHeight: 1.6 },
  table: { borderWidth: 1, borderColor: "#999" },
  headRow: { flexDirection: "row", backgroundColor: "#f0f0f4" },
  row: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#999" },
  cell: { padding: 5, borderRightWidth: 1, borderRightColor: "#999", fontSize: 9.5 },
  cellLast: { padding: 5, fontSize: 9.5 },
  head: { fontSize: 9, fontFamily: "Times-Bold" },
});

export function LaporanTabelPdf({ data }: { data: LaporanTabelData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.kop}>
          <Text style={styles.sekolah}>{SEKOLAH}</Text>
          <Text>Bagian Sarana &amp; Prasarana</Text>
        </View>
        <Text style={styles.judul}>{data.judul}</Text>
        <Text style={styles.meta}>{data.meta.join("\n")}</Text>

        <View style={styles.table}>
          <View style={styles.headRow}>
            {data.kolom.map((kolom, index) => (
              <Text
                key={kolom.label}
                style={[
                  index === data.kolom.length - 1 ? styles.cellLast : styles.cell,
                  styles.head,
                  kolom.width ? { width: kolom.width } : { flex: kolom.flex ?? 1 },
                ]}
              >
                {kolom.label}
              </Text>
            ))}
          </View>
          {data.baris.map((baris, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {baris.map((nilai, colIndex) => (
                <Text
                  key={colIndex}
                  style={[
                    colIndex === baris.length - 1 ? styles.cellLast : styles.cell,
                    data.kolom[colIndex]?.width
                      ? { width: data.kolom[colIndex].width }
                      : { flex: data.kolom[colIndex]?.flex ?? 1 },
                  ]}
                >
                  {nilai}
                </Text>
              ))}
            </View>
          ))}
          {data.baris.length === 0 && (
            <View style={styles.row}>
              <Text style={{ padding: 8, fontSize: 9.5, flex: 1, textAlign: "center" }}>{data.pesanKosong}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
