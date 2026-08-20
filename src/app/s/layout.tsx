import Image from "next/image";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Image src="/logo.png" alt="CyAsset" width={32} height={32} className="size-8 rounded-lg" />
        <span className="text-sm font-semibold text-text">CyAsset</span>
      </div>
      <div className="flex-1">{children}</div>
      <p className="mt-8 text-center text-[11px] text-faint">
        Data ini ditampilkan apa adanya oleh Sarpras SMK Cyber Media, dari hasil scan QR Code.
      </p>
    </div>
  );
}
