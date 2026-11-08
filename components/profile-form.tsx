"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions/auth";
import type { SessionUser } from "@/lib/types";

export function ProfileForm({ user }: { user: SessionUser }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, null);
  const bolehTtd = user.role === "kepala" || user.role === "admin";

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="nama">
            Nama lengkap &amp; gelar
          </label>
          <input
            id="nama"
            name="nama"
            className="input"
            defaultValue={user.nama}
            required
            minLength={3}
          />
        </div>
        <div>
          <label className="label" htmlFor="nip">
            NIP
          </label>
          <input
            id="nip"
            name="nip"
            className="input"
            defaultValue={user.nip}
            placeholder="Contoh: 19880417 201503 1 002"
          />
        </div>
      </div>

      <div>
        <label className="label">Username</label>
        <input className="input" value={user.username} disabled readOnly />
        <p className="mt-1 text-[11px] text-stone-400">
          Username hanya dapat diubah oleh administrator.
        </p>
      </div>

      {bolehTtd ? (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-800">Tanda tangan</p>
          <p className="mt-0.5 text-xs text-stone-500">
            Unggah gambar tanda tangan (PNG transparan disarankan). Tanda tangan ini
            dibubuhkan otomatis pada kisi-kisi dan kartu soal yang Anda sahkan.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {user.ttd_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.ttd_path}
                alt="Tanda tangan"
                className="h-20 w-40 rounded-lg border border-stone-200 bg-white object-contain p-1"
              />
            ) : (
              <div className="flex h-20 w-40 items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white text-[11px] text-stone-400">
                Belum ada tanda tangan
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                name="ttd"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-800"
              />
              <p className="mt-1 text-[11px] text-stone-400">PNG/JPG/WEBP/SVG, maksimal 3 MB.</p>
            </div>
          </div>
        </div>
      ) : null}

      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Menyimpan..." : "Simpan Profil"}
      </button>
    </form>
  );
}
