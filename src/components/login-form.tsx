"use client";

import Image from "next/image";
import { useActionState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { authenticate } from "@/app/login/actions";

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <div className="flex items-center gap-2.5 text-xl font-semibold text-text">
        <Image src="/logo.png" alt="CyAsset" width={36} height={36} className="size-9 rounded-[10px]" />
        CyAsset
      </div>

      <div className="mt-auto flex flex-col gap-1.5">
        <h1 className="text-[27px] font-semibold text-text">Masuk ke sistem</h1>
        <p className="text-sm text-muted">Manajemen Sarana Prasarana SMK Cyber Media.</p>
      </div>

      <div className="mt-6 flex flex-col gap-1.5">
        <label htmlFor="identifier" className="text-xs font-medium text-muted">
          Username atau Email
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          required
          autoComplete="username"
          className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </div>

      <div className="mt-3.5 flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-medium text-muted">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </div>

      <div aria-live="polite" className="mt-2 min-h-5 text-sm text-danger">
        {errorMessage}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-accent-strong py-2.75 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Memproses…" : "Masuk"}
        {!isPending && <ArrowRight size={16} />}
      </button>

      <p className="mt-5 text-xs text-faint">
        Akses dibatasi untuk staf Sarpras berwenang. Setiap aksi tercatat dengan jejak audit.
      </p>
    </form>
  );
}
