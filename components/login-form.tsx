"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

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
        <label className="label" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            className="input pr-16"
            placeholder="Masukkan password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-2 my-auto h-6 rounded px-2 text-[11px] font-semibold text-stone-500 hover:bg-stone-100"
          >
            {showPassword ? "Sembunyi" : "Lihat"}
          </button>
        </div>
      </div>

      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5">
        {pending ? "Memproses..." : "Masuk"}
      </button>

      <div className="flex items-center justify-between text-xs">
        <Link href="/lupa-password" className="font-semibold text-brand-700 hover:underline">
          Lupa password?
        </Link>
        <span className="text-stone-400">Hubungi admin jika akun belum ada</span>
      </div>
    </form>
  );
}
