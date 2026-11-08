"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/lib/actions/auth";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          className="input"
          placeholder="contoh: guru1"
          autoComplete="username"
          autoCapitalize="none"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="nama">
          Nama lengkap
        </label>
        <input
          id="nama"
          name="nama"
          className="input"
          placeholder="Nama depan dan belakang"
          autoComplete="name"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="role">
          Peran akun
        </label>
        <select
          id="role"
          name="role"
          className="input"
          defaultValue="guru"
          required
        >
          <option value="guru">Guru</option>
          <option value="kepala">Kepala Madrasah</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input pr-16"
          placeholder="Minimal 6 karakter"
          autoComplete="new-password"
          required
          minLength={6}
        />
      </div>

      <div>
        <label className="label" htmlFor="confirm">
          Ulangi password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          className="input pr-16"
          placeholder="Masukkan password yang sama"
          autoComplete="new-password"
          required
        />
      </div>

      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {state?.ok ? (
        <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full py-2.5"
      >
        {pending ? "Memproses..." : "Daftar"}
      </button>

      <div className="flex items-center justify-between text-xs">
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Sudah punya akun?
        </Link>
        <span className="text-stone-400">Hubungi admin untuk bantuan</span>
      </div>
    </form>
  );
}
