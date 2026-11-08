"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BuatPaketButton({
  label = "Buat Paket Soal",
  className = "btn btn-primary",
}: {
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/paket", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat paket.");
        setLoading(false);
        return;
      }
      router.push(`/guru/paket/${data.id}`);
    } catch {
      setError("Gagal membuat paket. Periksa koneksi.");
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={handleClick} disabled={loading} className={className}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {loading ? "Membuat..." : label}
      </button>
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </span>
  );
}
