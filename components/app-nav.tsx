"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/lib/actions/auth";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  badge?: number;
};

const ICONS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6",
  users:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  pen: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  kepala: "Kepala Madrasah",
  guru: "Guru",
};

function Icon({ name, className = "h-[18px] w-[18px]" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICONS[name] ?? ICONS.home} />
    </svg>
  );
}

function initials(nama: string): string {
  const parts = nama.replace(/[^A-Za-z\s]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function AppNav({
  items,
  user,
}: {
  items: NavItem[];
  user: { nama: string; role: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-3 px-5 py-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-base font-black text-brand-950 shadow-inner">
        SJ
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-bold tracking-wide text-white">SIAJAR</span>
        <span className="block text-[11px] text-brand-200">Generator Soal Madrasah</span>
      </span>
    </Link>
  );

  const links = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-link ${isActive(item.href) ? "nav-link-active" : ""}`}
        >
          <Icon name={item.icon} />
          <span className="flex-1">{item.label}</span>
          {item.badge ? (
            <span className="rounded-full bg-gold-500 px-1.5 py-0.5 text-[10px] font-bold text-brand-950">
              {item.badge}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );

  const userCard = (
    <div className="border-t border-white/10 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
          {initials(user.nama)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user.nama}</p>
          <p className="text-[11px] text-brand-200">{ROLE_LABEL[user.role] ?? user.role}</p>
        </div>
      </div>
      <form action={logoutAction} className="mt-3">
        <button
          type="submit"
          className="w-full rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-brand-100 transition hover:bg-white/10 hover:text-white"
        >
          Keluar
        </button>
      </form>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-950 lg:flex">
        {brand}
        {links}
        {userCard}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-brand-950 px-4 py-2.5 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500 text-xs font-black text-brand-950">
            SJ
          </span>
          <span className="text-sm font-bold tracking-wide text-white">SIAJAR</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-white/20 p-2 text-white"
          aria-label="Buka menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-stone-950/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-brand-950 shadow-2xl">
            <div className="flex items-center justify-between pr-4">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-brand-200 hover:bg-white/10 hover:text-white"
                aria-label="Tutup menu"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {links}
            {userCard}
          </div>
        </div>
      ) : null}
    </>
  );
}
