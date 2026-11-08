"use client";

import Link from "next/link";

export function DocToolbar({
  backHref,
  title,
  subtitle,
}: {
  backHref: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="no-print sticky top-0 z-20 border-b border-stone-800 bg-stone-900 text-stone-100">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2.5">
        <Link
          href={backHref}
          className="rounded-md border border-white/20 px-2.5 py-1 text-xs font-semibold text-stone-200 transition hover:bg-white/10"
        >
          ← Kembali
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title}</p>
          {subtitle ? (
            <p className="truncate text-[11px] text-stone-400">{subtitle}</p>
          ) : null}
        </div>
        <span className="hidden text-[11px] text-stone-400 sm:block">
          Gunakan &ldquo;Save as PDF&rdquo; pada dialog cetak untuk menyimpan berkas.
        </span>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-gold btn-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className="h-4 w-4">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
          </svg>
          Cetak / Simpan PDF
        </button>
      </div>
    </div>
  );
}
