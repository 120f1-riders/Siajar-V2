import { statusInfo } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  const meta = statusInfo(status);
  return <span className={`badge ${meta.badge}`}>{meta.label}</span>;
}
