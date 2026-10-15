"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Buildings, Eye, FilePdf, MagnifyingGlass, QrCode } from "@phosphor-icons/react";
import { ConditionBar } from "@/components/barang/condition-bar";

export type KirRuangRingkas = {
  id: string;
  nama: string;
  kode: string | null;
  penanggungJawabNama: string | null;
  lantaiId: string;
  lantaiNama: string;
  gedungId: string;
  gedungNama: string;
  jenisBarang: number;
  totalUnit: number;
  baik: number;
  kurangBaik: number;
  rusakBerat: number;
};

type GrupGedung = {
  id: string;
  nama: string;
  lantai: { id: string; nama: string; ruang: KirRuangRingkas[] }[];
};

function kelompokkan(list: KirRuangRingkas[]): GrupGedung[] {
  const gedungMap = new Map<string, GrupGedung>();
  for (const r of list) {
    const g = gedungMap.get(r.gedungId) ?? { id: r.gedungId, nama: r.gedungNama, lantai: [] };
    gedungMap.set(r.gedungId, g);
    let l = g.lantai.find((item) => item.id === r.lantaiId);
    if (!l) {
      l = { id: r.lantaiId, nama: r.lantaiNama, ruang: [] };
      g.lantai.push(l);
    }
    l.ruang.push(r);
  }
  return [...gedungMap.values()];
}

export function KirRuangList({ ruangList }: { ruangList: KirRuangRingkas[] }) {
  const [q, setQ] = useState("");

  const grup = useMemo(() => {
    const kata = q.trim().toLowerCase();
    const terfilter = kata
      ? ruangList.filter((r) => r.nama.toLowerCase().includes(kata) || r.kode?.toLowerCase().includes(kata))
      : ruangList;
    return kelompokkan(terfilter);
  }, [q, ruangList]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm md:w-75">
        <MagnifyingGlass size={16} className="text-dim" />
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Cari nama atau kode ruang…"
          aria-label="Cari nama atau kode ruang"
          className="w-full bg-transparent text-text outline-none placeholder:text-dim"
        />
      </div>

      {grup.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-dim">
          {ruangList.length === 0 ? "Belum ada ruang. Tambahkan dulu di menu Lokasi." : "Tidak ada ruang yang cocok."}
        </div>
      )}

      {grup.map((g) => (
        <section key={g.id} className="flex flex-col gap-2.5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
            <Buildings size={17} className="text-accent" />
            {g.nama}
          </h3>
          {g.lantai.map((l) => (
            <div key={l.id} className="responsive-table-panel overflow-hidden rounded-xl border border-border bg-surface">
              <div className="border-b border-border px-4.5 py-2.5 text-xs font-medium text-muted">{l.nama}</div>
              <table className="data-table w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-dim">
                    <th className="py-3 pl-4.5 font-medium">Ruang</th>
                    <th className="py-3 font-medium">Penanggung jawab</th>
                    <th className="py-3 font-medium">Jenis barang</th>
                    <th className="py-3 font-medium">Total unit</th>
                    <th className="py-3 font-medium">Kondisi (B · KB · RB)</th>
                    <th className="py-3 pr-4.5" />
                  </tr>
                </thead>
                <tbody>
                  {l.ruang.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td data-label="Ruang" className="py-3 pl-4.5">
                        <Link href={`/kir/${r.id}`} className="font-medium text-text hover:text-accent">
                          {r.nama}
                        </Link>
                        {r.kode && <div className="text-[11px] text-dim">{r.kode}</div>}
                      </td>
                      <td data-label="Penanggung jawab" className="py-3 text-muted">
                        <span>{r.penanggungJawabNama ?? "—"}</span>
                      </td>
                      <td data-label="Jenis barang" className="py-3 text-text">
                        <span>{r.jenisBarang}</span>
                      </td>
                      <td data-label="Total unit" className="py-3 text-text">
                        <span>{r.totalUnit}</span>
                      </td>
                      <td data-label="Kondisi" className="py-3">
                        {r.totalUnit > 0 ? (
                          <ConditionBar baik={r.baik} rusakRingan={r.kurangBaik} rusakBerat={r.rusakBerat} />
                        ) : (
                          <span className="text-dim">—</span>
                        )}
                      </td>
                      <td data-label="Tindakan" className="py-3 pr-4.5 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                          <Link
                            href={`/kir/${r.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-text"
                          >
                            <Eye size={13} />
                            Lihat
                          </Link>
                          <a
                            href={`/api/kir/${r.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-text"
                          >
                            <FilePdf size={13} />
                            Cetak KIR
                          </a>
                          <Link
                            href={`/kir/${r.id}/cetak-qr`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-text"
                          >
                            <QrCode size={13} />
                            Cetak QR
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
