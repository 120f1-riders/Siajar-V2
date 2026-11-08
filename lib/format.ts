import { kurikulumInfo, STATUS_META } from "./konstanta";

export function tanggalId(iso?: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function tanggalJamId(iso?: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function statusInfo(status: string) {
  return STATUS_META[status] ?? STATUS_META.draft;
}

export function kurikulumShort(id: string): string {
  return kurikulumInfo(id).short;
}

export function totalSkor(butir: { skor: number }[]): number {
  return butir.reduce((sum, b) => sum + (Number(b.skor) || 0), 0);
}
