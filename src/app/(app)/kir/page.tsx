import { Topbar } from "@/components/layout/topbar";
import { CetakSemuaKirForm } from "@/components/kir/cetak-semua-kir-form";
import { KirRuangList, type KirRuangRingkas } from "@/components/kir/kir-ruang-list";
import { getKirBanyakRuang } from "@/lib/kir-data";

export default async function KirPage() {
  const semua = await getKirBanyakRuang();

  const ruangList: KirRuangRingkas[] = semua.map(({ ruang, items }) => ({
    id: ruang.id,
    nama: ruang.nama,
    kode: ruang.kode,
    penanggungJawabNama: ruang.penanggungJawabNama,
    lantaiId: ruang.lantaiId,
    lantaiNama: ruang.lantaiNama,
    gedungId: ruang.gedungId,
    gedungNama: ruang.gedungNama,
    jenisBarang: items.length,
    totalUnit: items.reduce((sum, item) => sum + item.jumlah, 0),
    baik: items.reduce((sum, item) => sum + item.baik, 0),
    kurangBaik: items.reduce((sum, item) => sum + item.kurangBaik, 0),
    rusakBerat: items.reduce((sum, item) => sum + item.rusakBerat, 0),
  }));
  const totalUnit = ruangList.reduce((sum, r) => sum + r.totalUnit, 0);
  const gedungOptions = [...new Map(ruangList.map((r) => [r.gedungId, { id: r.gedungId, nama: r.gedungNama }])).values()];

  return (
    <>
      <Topbar title="Kartu Inventaris Ruangan" breadcrumb={`${ruangList.length} ruang · ${totalUnit} unit`} />
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        {ruangList.length > 0 && <CetakSemuaKirForm gedungOptions={gedungOptions} />}
        <KirRuangList ruangList={ruangList} />
      </div>
    </>
  );
}
