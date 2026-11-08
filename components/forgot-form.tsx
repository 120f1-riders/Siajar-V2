"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotAction } from "@/lib/actions/auth";

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(forgotAction, null);

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-4 text-sm text-brand-900">
          <p className="font-semibold">Permintaan terkirim</p>
          <p className="mt-1 text-brand-800">{state.message}</p>
        </div>
        <Link href="/login" className="btn btn-outline w-full">
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

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
          placeholder="Username akun Anda"
          autoCapitalize="none"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="keterangan">
          Keterangan (opsional)
        </label>
        <textarea
          id="keterangan"
          name="keterangan"
          className="textarea"
          placeholder="Contoh: lupa password, mohon dibantu reset."
          maxLength={300}
        />
      </div>

      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5">
        {pending ? "Mengirim..." : "Kirim Permintaan Reset"}
      </button>

      <Link href="/login" className="block text-center text-xs font-semibold text-brand-700 hover:underline">
        Kembali ke halaman masuk
      </Link>
    </form>
  );
}
