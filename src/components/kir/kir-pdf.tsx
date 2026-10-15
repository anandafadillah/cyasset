import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { KirData } from "@/lib/kir-data";
import type { PengaturanSekolah } from "@/lib/pengaturan-sekolah";
import { formatTanggalDokumen } from "@/lib/kir";

const GARIS = "( .................................... )";
const BORDER = "#555";

const styles = StyleSheet.create({
  page: { fontFamily: "Times-Roman", fontSize: 9.5, color: "#1a1a1a", paddingVertical: 32, paddingHorizontal: 34 },
  judul: { fontSize: 14, fontFamily: "Times-Bold", textAlign: "center", marginBottom: 12 },
  metaRow: { flexDirection: "row", fontSize: 10, lineHeight: 1.45 },
  metaLabel: { width: 100 },
  metaSep: { width: 10 },
  metaValue: { flex: 1 },
  // Border kiri/atas dipasang per baris (bukan di kontainer tabel) supaya
  // tidak "bocor" sampai bawah halaman saat tabel berlanjut ke halaman lain.
  table: { marginTop: 12 },
  row: { flexDirection: "row", borderLeftWidth: 1, borderColor: BORDER },
  headRow: { flexDirection: "row", borderLeftWidth: 1, borderTopWidth: 1, borderColor: BORDER, backgroundColor: "#ececf0" },
  subRow: { flexDirection: "row", flexGrow: 1 },
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  head: { fontFamily: "Times-Bold", fontSize: 8.5, textAlign: "center" },
  center: { textAlign: "center" },
  kosong: { flex: 1, padding: 8, textAlign: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: BORDER },
  ttdWrap: { flexDirection: "row", marginTop: 18 },
  ttdCol: { flex: 1, alignItems: "center", fontSize: 10 },
  ttdSpace: { height: 52 },
  ttdName: { fontFamily: "Times-Bold", textDecoration: "underline" },
});

// Lebar kolom (pt) — sisa lebar halaman landscape untuk Nama Barang.
const W = {
  no: 24,
  merk: 84,
  kode: 80,
  tahun: 48,
  anggaran: 74,
  jumlah: 40,
  kondisi: 38,
  ket: 122,
};

function Cell({
  width,
  flex,
  style,
  children,
}: {
  width?: number;
  flex?: number;
  style?: (typeof styles)[keyof typeof styles];
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.cell, width ? { width } : { flex: flex ?? 1 }]}>
      <Text style={style}>{children}</Text>
    </View>
  );
}

function HeaderTabel() {
  return (
    // fixed → header kolom diulang di setiap halaman bila tabel berlanjut.
    <View style={styles.headRow} fixed>
      <Cell width={W.no} style={styles.head}>No.</Cell>
      <Cell flex={1} style={styles.head}>Nama Barang / Jenis Barang</Cell>
      <Cell width={W.merk} style={styles.head}>Merk / Model</Cell>
      <Cell width={W.kode} style={styles.head}>Kode Barang</Cell>
      <Cell width={W.tahun} style={styles.head}>Tahun Pembelian</Cell>
      <Cell width={W.anggaran} style={styles.head}>Jenis Anggaran</Cell>
      <Cell width={W.jumlah} style={styles.head}>Jumlah Barang</Cell>
      <View style={{ width: W.kondisi * 3 }}>
        <View style={styles.cell}>
          <Text style={styles.head}>Keadaan Barang</Text>
        </View>
        <View style={styles.subRow}>
          <Cell width={W.kondisi} style={styles.head}>Baik</Cell>
          <Cell width={W.kondisi} style={styles.head}>Kurang Baik</Cell>
          <Cell width={W.kondisi} style={styles.head}>Rusak Berat</Cell>
        </View>
      </View>
      <Cell width={W.ket} style={styles.head}>Keterangan</Cell>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaSep}>:</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function TandaTangan({ jabatan, nama, nip }: { jabatan: string[]; nama: string | null; nip: string | null }) {
  return (
    <View style={styles.ttdCol}>
      {jabatan.map((baris, index) => (
        <Text key={index}>{baris || " "}</Text>
      ))}
      <View style={styles.ttdSpace} />
      <Text style={nama ? styles.ttdName : undefined}>{nama ?? GARIS}</Text>
      <Text>NIP. {nip ?? "...................................."}</Text>
    </View>
  );
}

function angka(value: number) {
  return value > 0 ? String(value) : "";
}

function HalamanKir({
  data,
  sekolah,
  tanggalDokumen,
}: {
  data: KirData;
  sekolah: PengaturanSekolah;
  tanggalDokumen: string;
}) {
  const { ruang, items } = data;
  const tanggal = formatTanggalDokumen(tanggalDokumen);

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Text style={styles.judul}>KARTU INVENTARIS RUANGAN (KIR)</Text>

      <Meta label="Provinsi" value={sekolah.provinsi ?? "-"} />
      <Meta label="Kabupaten/Kota" value={sekolah.kabupatenKota ?? "-"} />
      <Meta label="Unit" value={sekolah.unit ?? "-"} />
      <Meta label="Satuan Kerja" value={sekolah.namaSekolah} />
      {ruang.kode && <Meta label="Kode Ruangan" value={ruang.kode} />}
      <Meta label="Ruangan" value={`${ruang.nama} (${ruang.gedungNama} · ${ruang.lantaiNama})`} />

      <View style={styles.table}>
        <HeaderTabel />
        {items.map((item, index) => (
          <View key={item.barangId} style={styles.row} wrap={false}>
            <Cell width={W.no} style={styles.center}>{index + 1}</Cell>
            <Cell flex={1}>{item.nama}</Cell>
            <Cell width={W.merk}>{item.merkTipe ?? "-"}</Cell>
            <Cell width={W.kode}>{item.kode}</Cell>
            <Cell width={W.tahun} style={styles.center}>{item.tahunPembelian}</Cell>
            <Cell width={W.anggaran} style={styles.center}>{item.jenisAnggaran}</Cell>
            <Cell width={W.jumlah} style={styles.center}>{item.jumlah}</Cell>
            <Cell width={W.kondisi} style={styles.center}>{angka(item.baik)}</Cell>
            <Cell width={W.kondisi} style={styles.center}>{angka(item.kurangBaik)}</Cell>
            <Cell width={W.kondisi} style={styles.center}>{angka(item.rusakBerat)}</Cell>
            <Cell width={W.ket}>{item.keterangan}</Cell>
          </View>
        ))}
        {items.length === 0 && (
          <View style={styles.row}>
            <Text style={styles.kosong}>Tidak ada barang tercatat di ruang ini.</Text>
          </View>
        )}
      </View>

      <View wrap={false}>
        <View style={styles.ttdWrap}>
          <TandaTangan
            jabatan={["", "Mengetahui,", "Kepala Sekolah"]}
            nama={sekolah.kepalaSekolahNama}
            nip={sekolah.kepalaSekolahNip}
          />
          <TandaTangan
            jabatan={["", "", "Pengurus Barang"]}
            nama={sekolah.pengurusBarangNama}
            nip={sekolah.pengurusBarangNip}
          />
          <TandaTangan
            jabatan={[
              sekolah.kotaTandaTangan ? `${sekolah.kotaTandaTangan}, ${tanggal}` : tanggal,
              "",
              "Penanggung Jawab Ruangan",
            ]}
            nama={ruang.penanggungJawabNama}
            nip={ruang.penanggungJawabNip}
          />
        </View>
      </View>
    </Page>
  );
}

/** Satu dokumen KIR; satu ruang per halaman (berlanjut bila tabelnya panjang). */
export function KirPdf({
  halaman,
  sekolah,
  tanggalDokumen,
}: {
  halaman: KirData[];
  sekolah: PengaturanSekolah;
  tanggalDokumen: string;
}) {
  return (
    <Document title="Kartu Inventaris Ruangan">
      {halaman.map((data) => (
        <HalamanKir key={data.ruang.id} data={data} sekolah={sekolah} tanggalDokumen={tanggalDokumen} />
      ))}
    </Document>
  );
}
