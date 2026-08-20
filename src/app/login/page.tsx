import { Package, HandArrowDown, Wrench, FileText } from "@phosphor-icons/react/dist/ssr";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

const highlights = [
  {
    icon: Package,
    text: "Inventaris 4-tingkat: Gedung → Lantai → Ruang → Sub-lokasi",
  },
  {
    icon: HandArrowDown,
    text: "Peminjaman internal & eksternal bersurat resmi",
  },
  {
    icon: Wrench,
    text: "Tiket kerusakan dengan mutasi stok otomatis",
  },
  {
    icon: FileText,
    text: "LIR & rekap siap cetak untuk pimpinan",
  },
];

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl border border-border shadow-2xl md:grid-cols-2">
        <div className="flex flex-col bg-bg px-10 py-12 sm:px-13">
          <LoginForm />
        </div>
        <div className="hidden flex-col justify-center gap-5 border-l border-border bg-gradient-to-br from-surface-2 to-surface p-12 md:flex">
          <div className="text-xs font-semibold tracking-[0.1em] text-accent uppercase">
            Satu tempat, seluruh aset
          </div>
          <div className="flex flex-col gap-3.5">
            {highlights.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-text">
                <Icon size={20} className="text-[#9184d9]" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
