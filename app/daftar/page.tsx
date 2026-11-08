import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/register-form";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-700/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-500 text-lg font-black text-brand-950">
              SJ
            </span>
            <div>
              <p className="text-xl font-bold tracking-wide">SIAJAR</p>
              <p className="text-xs text-brand-200">Sistem Administrasi &amp; Jasa Soal Madrasah</p>
            </div>
          </div>

          <h1 className="mt-14 max-w-md text-3xl font-bold leading-tight">
            Buat akun baru untuk mulai menyusun soal.
          </h1>
          <p className="mt-3 max-w-md text-sm text-brand-100/80">
            Daftar dengan username dan nama lengkap. Password minimal enam karakter.
            Setelah berhasil, Anda dapat masuk dan mengajukan paket soal.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-sm font-black text-gold-300">
              SJ
            </span>
            <div>
              <p className="text-lg font-bold text-brand-950">SIAJAR</p>
              <p className="text-[11px] text-stone-500">Generator Soal Madrasah</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-stone-900">Daftar akun baru</h2>
          <p className="mt-1 text-sm text-stone-500">
            Gunakan username yang belum dipakai orang lain.
          </p>

          <div className="mt-6">
            <RegisterForm />
          </div>

          <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4 text-center text-xs text-stone-500">
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Sudah punya akun?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
