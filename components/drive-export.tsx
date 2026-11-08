"use client";

import { useState } from "react";

type Jenis = "soal" | "kisi" | "kartu";

const TOMBOL: { jenis: Jenis; label: string; format: string }[] = [
  { jenis: "soal", label: "Naskah Soal", format: "Google Docs" },
  { jenis: "kisi", label: "Kisi-kisi", format: "Google Sheets" },
  { jenis: "kartu", label: "Kartu Soal", format: "Google Docs" },
];

export function DriveExport({
  paketId,
  connected,
  email,
  dirty,
}: {
  paketId: number;
  connected: boolean;
  email: string;
  dirty: boolean;
}) {
  const [busy, setBusy] = useState<Jenis | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(
    null
  );
  const [links, setLinks] = useState<Partial<Record<Jenis, string>>>({});

  async function ekspor(jenis: Jenis) {
    setBusy(jenis);
    setMessage(null);
    try {
      const res = await fetch("/api/export/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paketId, jenis }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          tone: "err",
          text: data.error ?? "Gagal mengekspor ke Google Drive.",
        });
        return;
      }
      setLinks((prev) => ({ ...prev, [jenis]: String(data.url ?? "") }));
      setMessage({
        tone: "ok",
        text: `${data.name ?? "File"} berhasil disimpan di Google Drive.`,
      });
    } catch {
      setMessage({
        tone: "err",
        text: "Gagal menghubungi server. Periksa koneksi lalu coba lagi.",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card mt-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-stone-800">Ekspor ke Google Drive</h2>
          <p className="mt-0.5 text-xs text-stone-500">
            File dibuat otomatis sebagai Google Docs atau Sheets di Drive akun yang
            terhubung.
          </p>
        </div>
        <span
          className={`badge ${
            connected
              ? "border-brand-200 bg-brand-50 text-brand-800"
              : "border-stone-200 bg-stone-100 text-stone-600"
          }`}
        >
          {connected ? email || "Google terhubung" : "Belum terhubung"}
        </span>
      </div>

      {!connected ? (
        <p className="mt-3 rounded-lg border border-gold-300 bg-gold-100 px-3 py-2 text-xs text-gold-700">
          Hubungkan akun Google terlebih dahulu di{" "}
          <a href="/admin/pengaturan" className="font-semibold underline">
            Pengaturan Admin
          </a>
          .
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {TOMBOL.map((item) => (
            <button
              key={item.jenis}
              type="button"
              onClick={() => ekspor(item.jenis)}
              disabled={busy !== null}
              className="btn btn-outline btn-sm"
            >
              {busy === item.jenis ? "Mengunggah..." : `${item.label} → ${item.format}`}
            </button>
          ))}
        </div>
      )}

      {dirty ? (
        <p className="mt-3 text-[11px] font-medium text-amber-600">
          Simpan paket terlebih dahulu agar hasil ekspor memuat perubahan terbaru.
        </p>
      ) : null}

      {message ? (
        <div
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            message.tone === "ok"
              ? "border-brand-200 bg-brand-50 text-brand-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {Object.keys(links).length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs">
          {TOMBOL.filter((item) => links[item.jenis]).map((item) => (
            <li key={item.jenis}>
              <a
                href={links[item.jenis]}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-brand-700 underline"
              >
                Buka {item.label} di Google Drive ↗
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
