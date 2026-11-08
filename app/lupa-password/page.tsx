import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ForgotForm } from "@/components/forgot-form";

export const dynamic = "force-dynamic";

export default async function LupaPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f6f3] px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/login" className="mb-6 flex items-center gap-2 text-sm font-semibold text-brand-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-[11px] font-black text-gold-300">
            SJ
          </span>
          SIAJAR
        </Link>

        <div className="card p-6 sm:p-7">
          <h1 className="text-xl font-bold text-stone-900">Lupa Password</h1>
          <p className="mt-1 text-sm text-stone-500">
            Masukkan username Anda. Permintaan akan diteruskan kepada administrator
            madrasah untuk dibuatkan password sementara.
          </p>
          <div className="mt-5">
            <ForgotForm />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          Administrator dapat membuat password sementara melalui menu Pengguna.
        </p>
      </div>
    </div>
  );
}
