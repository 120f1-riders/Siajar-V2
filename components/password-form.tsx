"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/actions/auth";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="lama">
          Password saat ini
        </label>
        <input id="lama" name="lama" type="password" className="input" required autoComplete="current-password" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="baru">
            Password baru
          </label>
          <input
            id="baru"
            name="baru"
            type="password"
            className="input"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <p className="mt-1 text-[11px] text-stone-400">Minimal 6 karakter.</p>
        </div>
        <div>
          <label className="label" htmlFor="ulangi">
            Ulangi password baru
          </label>
          <input
            id="ulangi"
            name="ulangi"
            type="password"
            className="input"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
      </div>

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
        {pending ? "Menyimpan..." : "Perbarui Password"}
      </button>
    </form>
  );
}
