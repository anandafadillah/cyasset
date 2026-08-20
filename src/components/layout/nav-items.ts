import {
  SquaresFour,
  Package,
  MapPin,
  HardHat,
  HandArrowDown,
  Wrench,
  FileText,
  Users,
  type Icon,
} from "@phosphor-icons/react";

export type NavItem = {
  href: string;
  label: string;
  icon: Icon;
};

export type NavGroup = {
  section?: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  { items: [{ href: "/dashboard", label: "Dashboard", icon: SquaresFour }] },
  {
    section: "Inventaris",
    items: [
      { href: "/barang", label: "Barang", icon: Package },
      { href: "/lokasi", label: "Lokasi", icon: MapPin },
      { href: "/prasarana", label: "Prasarana", icon: HardHat },
    ],
  },
  {
    section: "Transaksi",
    items: [
      { href: "/peminjaman", label: "Peminjaman", icon: HandArrowDown },
      { href: "/laporan-kerusakan", label: "Laporan Kerusakan", icon: Wrench },
    ],
  },
  {
    section: "Laporan",
    items: [
      { href: "/laporan", label: "Ekspor & LIR", icon: FileText },
      { href: "/akun", label: "Akun Staf", icon: Users },
    ],
  },
];
