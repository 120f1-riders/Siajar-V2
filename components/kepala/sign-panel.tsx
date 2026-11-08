"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignPanel({
  paketId,
  hasSignature,
}: {
  paketId: number;
  hasSignature: boolean;
}) {
  const router = useRouter();
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"sahkan" | "kembalikan">("sahkan");

  async function jalankan(action: "sahkan" | "kembalikan") {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/paket/${paketId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, catatan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal memproses paket.");
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Gagal menghubungi server.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {!hasSignature ? (
        <div className="rounded-xl border border-gold-300 bg-gold-100 px-4 py-3 text-sm text-gold-700">
          Anda belum mengunggah gambar tanda tangan. Dokumen tetap dapat disahkan, tetapi
          kolom tanda tangan akan tercetak kosong.{" "}
          <Link href="/akun" className="font-semibold underline">
            Unggah tanda tangan
          </Link>
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("sahkan")}
          className={`btn ${mode === "sahkan" ? "btn-primary" : "btn-outline"} btn-sm`}
        >
          Sahkan
        </button>
        <button
          type="button"
          onClick={() => setMode("kembalikan")}
          className={`btn ${mode === "kembalikan" ? "btn-danger" : "btn-outline"} btn-sm`}
        >
          Kembalikan untuk diperbaiki
        </button>
      </div>

      {mode === "kembalikan" ? (
        <div>
          <label className="label" htmlFor="catatan">
            Catatan perbaikan
          </label>
          <textarea
            id="catatan"
            className="textarea"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Contoh: Perbaiki indikator soal nomor 3 agar sesuai capaian pembelajaran."
            maxLength={500}
          />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {mode === "sahkan" ? (
          <button
            type="button"
            onClick={() => jalankan("sahkan")}
            disabled={busy !== null}
            className="btn btn-gold"
          >
            {busy === "sahkan" ? "Memproses..." : "Sahkan & Tandatangani"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => jalankan("kembalikan")}
            disabled={busy !== null}
            className="btn btn-danger"
          >
            {busy === "kembalikan" ? "Memproses..." : "Kembalikan Paket"}
          </button>
        )}
        <p className="text-xs text-stone-500">
          Setelah disahkan, dokumen terkunci dan siap dicetak dengan tanda tangan Anda.
        </p>
      </div>
    </div>
  );
}
