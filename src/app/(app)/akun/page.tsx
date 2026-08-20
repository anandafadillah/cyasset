import { desc } from "drizzle-orm";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { Topbar } from "@/components/layout/topbar";
import { AddStaffDialog } from "@/components/akun/add-staff-dialog";
import { StaffActionsMenu } from "@/components/akun/staff-actions-menu";
import { formatLastActivity } from "@/lib/format";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { staff } from "@/db/schema";

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export default async function AkunStafPage() {
  const [session, staffList] = await Promise.all([auth(), db.select().from(staff).orderBy(desc(staff.createdAt))]);

  const currentUserId = session?.user.id;
  const activeCount = staffList.filter((row) => row.isActive).length;

  return (
    <>
      <Topbar
        title="Akun Staf"
        breadcrumb={`${staffList.length} akun · ${activeCount} aktif`}
        actions={<AddStaffDialog />}
      />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-border text-left text-xs text-dim">
                <th className="py-3 pl-4.5 font-medium">Staf</th>
                <th className="py-3 font-medium">Username</th>
                <th className="py-3 font-medium">Aktivitas terakhir</th>
                <th className="py-3 font-medium">Status</th>
                <th className="py-3 pr-4.5" />
              </tr>
            </thead>
            <tbody>
              {staffList.map((row) => {
                const isSelf = row.id === currentUserId;
                return (
                  <tr key={row.id} className={`border-b border-border last:border-0 ${row.isActive ? "" : "opacity-60"}`}>
                    <td className="py-3 pl-4.5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-8.5 flex-none place-items-center rounded-[9px] bg-surface-3 text-[13px] font-semibold text-text">
                          {initials(row.name)}
                        </span>
                        <div>
                          <div className="font-medium text-text">
                            {row.name}
                            {isSelf && (
                              <span className="ml-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                                Anda
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-dim">{row.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-muted">{row.username}</td>
                    <td className="py-3 text-muted">{formatLastActivity(row.lastLoginAt)}</td>
                    <td className="py-3">
                      {row.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-2.5 py-1 text-xs font-medium text-good">
                          <span className="size-1.5 rounded-full bg-good" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-dim">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4.5 text-right">
                      <StaffActionsMenu id={row.id} canDeactivate={row.isActive && !isSelf} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-dim">
          <ShieldCheck size={16} className="text-accent" />
          Setiap input barang, peminjaman, dan laporan tercatat dengan nama akun pelaku (createdBy / updatedBy)
          untuk jejak audit.
        </div>
      </div>
    </>
  );
}
