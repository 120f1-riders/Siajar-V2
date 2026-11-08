import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error" | "warning";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    success: "border-brand-200 bg-brand-50 text-brand-900",
    error: "border-red-200 bg-red-50 text-red-900",
    warning: "border-gold-300 bg-gold-100 text-gold-700",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "brand",
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: "brand" | "gold" | "stone" | "red";
}) {
  const accents: Record<string, string> = {
    brand: "text-brand-700",
    gold: "text-gold-700",
    stone: "text-stone-700",
    red: "text-red-700",
  };
  return (
    <div className="card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${accents[accent]}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-stone-400">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-stone-500">{description}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; className: string }> = {
    admin: {
      label: "Administrator",
      className: "border-stone-300 bg-stone-100 text-stone-700",
    },
    kepala: {
      label: "Kepala Madrasah",
      className: "border-gold-300 bg-gold-100 text-gold-700",
    },
    guru: {
      label: "Guru",
      className: "border-brand-200 bg-brand-50 text-brand-700",
    },
  };
  const meta = map[role] ?? map.guru;
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}
