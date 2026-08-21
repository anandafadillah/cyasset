import Link from "next/link";
import { CaretDown, CaretUp, CaretUpDown } from "@phosphor-icons/react/dist/ssr";

export type SortState = { sort: string; dir: "asc" | "desc" };

/**
 * Bangun href untuk toggle sort: klik kolom yang sama membalik arah, klik
 * kolom lain pindah ke kolom itu mulai dari ascending. Query param selain
 * sort/dir/page dipertahankan apa adanya.
 */
export function buildSortHref(
  pathname: string,
  searchParams: Record<string, string | string[] | undefined>,
  current: SortState,
  column: string,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "sort" || key === "dir" || key === "page" || typeof value !== "string") continue;
    params.set(key, value);
  }
  const nextDir = current.sort === column && current.dir === "asc" ? "desc" : "asc";
  params.set("sort", column);
  params.set("dir", nextDir);
  return `?${params.toString()}`;
}

export function SortableTh({
  href,
  active,
  direction,
  children,
  className,
}: {
  href: string;
  active: boolean;
  direction: "asc" | "desc";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`py-3 font-medium ${className ?? ""}`}>
      <Link href={href} className="inline-flex items-center gap-1 hover:text-text">
        {children}
        {active ? (
          direction === "asc" ? (
            <CaretUp size={11} weight="bold" />
          ) : (
            <CaretDown size={11} weight="bold" />
          )
        ) : (
          <CaretUpDown size={11} className="opacity-40" />
        )}
      </Link>
    </th>
  );
}
