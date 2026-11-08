"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createUserAction,
  deleteUserAction,
  resetUserPasswordAction,
  toggleUserActiveAction,
  updateUserAction,
} from "@/lib/actions/admin";

const ROLE_OPTIONS = [
  { value: "guru", label: "Guru — membuat soal, kisi-kisi, dan kartu soal" },
  { value: "kepala", label: "Kepala Madrasah — menandatangani dokumen" },
  { value: "admin", label: "Administrator — mengelola pengguna dan kop surat" },
];

function StateMessage({
  state,
}: {
  state: { error?: string; ok?: boolean; message?: string } | null;
}) {
  if (!state) return null;
  if (state.error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {state.error}
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
        {state.message}
      </p>
    );
  }
  return null;
}

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="nama">
            Nama lengkap &amp; gelar
          </label>
          <input id="nama" name="nama" className="input" required minLength={3} placeholder="Contoh: Siti Aminah, S.Pd." />
        </div>
        <div>
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            className="input"
            required
            pattern="[a-z0-9._-]{3,32}"
            placeholder="contoh: siti.aminah"
            autoCapitalize="none"
          />
          <p className="mt-1 text-[11px] text-stone-400">
            3–32 karakter: huruf kecil, angka, titik, garis bawah, atau strip.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="role">
            Peran
          </label>
          <select id="role" name="role" className="select" defaultValue="guru">
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="nip">
            NIP (opsional)
          </label>
          <input id="nip" name="nip" className="input" placeholder="19880417 201503 1 002" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="password">
            Password awal
          </label>
          <input
            id="password"
            name="password"
            type="text"
            className="input"
            required
            minLength={6}
            placeholder="Minimal 6 karakter"
          />
          <p className="mt-1 text-[11px] text-stone-400">
            Sampaikan password ini kepada pengguna; minta agar segera diubah.
          </p>
        </div>
      </div>

      <StateMessage state={state} />

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Menyimpan..." : "Tambah Pengguna"}
        </button>
        <Link href="/admin" className="btn btn-outline">
          Batal
        </Link>
      </div>
    </form>
  );
}

export function UpdateUserForm({
  user,
}: {
  user: { id: number; username: string; nama: string; role: string; nip: string };
}) {
  const [state, formAction, pending] = useActionState(updateUserAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={user.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="nama">
            Nama lengkap &amp; gelar
          </label>
          <input id="nama" name="nama" className="input" defaultValue={user.nama} required minLength={3} />
        </div>
        <div>
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            className="input"
            defaultValue={user.username}
            required
            pattern="[a-z0-9._-]{3,32}"
            autoCapitalize="none"
          />
        </div>
        <div>
          <label className="label" htmlFor="role">
            Peran
          </label>
          <select id="role" name="role" className="select" defaultValue={user.role}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="nip">
            NIP
          </label>
          <input id="nip" name="nip" className="input" defaultValue={user.nip} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="password">
            Password baru (opsional)
          </label>
          <input
            id="password"
            name="password"
            type="text"
            className="input"
            minLength={6}
            placeholder="Kosongkan bila tidak ingin mengubah password"
          />
        </div>
      </div>

      <StateMessage state={state} />

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        <Link href="/admin" className="btn btn-outline">
          Kembali
        </Link>
      </div>
    </form>
  );
}

export function UserAccountActions({
  userId,
  aktif,
}: {
  userId: number;
  aktif: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={toggleUserActiveAction}>
        <input type="hidden" name="id" value={userId} />
        <button type="submit" className="btn btn-outline btn-sm">
          {aktif ? "Nonaktifkan Akun" : "Aktifkan Akun"}
        </button>
      </form>
      <form
        action={deleteUserAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              "Hapus pengguna ini? Seluruh paket soal miliknya juga akan terhapus."
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={userId} />
        <button type="submit" className="btn btn-danger btn-sm">
          Hapus Pengguna
        </button>
      </form>
    </div>
  );
}

export function ResetPasswordForm({ userId }: { userId: number }) {
  const [state, formAction, pending] = useActionState(resetUserPasswordAction, null);

  return (
    <div className="space-y-3">
      {state?.ok && state.temp ? (
        <div className="rounded-xl border border-gold-300 bg-gold-100 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
            Password sementara untuk {state.username}
          </p>
          <p className="mt-1 font-mono text-xl font-bold tracking-wider text-stone-900">
            {state.temp}
          </p>
          <p className="mt-1 text-[11px] text-gold-700">
            Salin sekarang. Password ini tidak ditampilkan lagi dan wajib diubah pengguna
            saat masuk.
          </p>
        </div>
      ) : null}

      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <form action={formAction}>
        <input type="hidden" name="id" value={userId} />
        <button type="submit" disabled={pending} className="btn btn-outline">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3" />
          </svg>
          {pending ? "Membuat..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
