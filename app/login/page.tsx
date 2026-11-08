import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

const FITUR = [
  "Satu paket data menghasilkan naskah soal, kisi-kisi, dan kartu soal sekaligus.",
  "Pengesahan dan tanda tangan digital oleh kepala madrasah.",
  "Kop surat serta identitas madrasah dapat disesuaikan sendiri.",
];

const DEMO = [
  { label: "Administrator", value: "admin / admin123" },
  { label: "Kepala Madrasah", value: "kepala1 / kepala123" },
  { label: "Guru", value: "guru1 / guru123" },
];

export default async function LoginPage() {
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
            Susun soal, kisi-kisi, dan kartu soal dalam satu alur yang rapi.
          </h1>
          <p className="mt-3 max-w-md text-sm text-brand-100/80">
            Dirancang untuk guru madrasah: pilih mata pelajaran, tentukan kurikulum,
            lengkapi butir soal, lalu ajukan untuk ditandatangani kepala madrasah.
          </p>

          <ul className="mt-8 space-y-3">
            {FITUR.map((fitur) => (
              <li key={fitur} className="flex gap-3 text-sm text-brand-50/90">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-700 text-[10px] font-bold text-gold-300">
                  ✓
                </span>
                {fitur}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-10 flex flex-wrap gap-2 text-[11px] text-brand-200">
          <span className="rounded-full border border-white/15 px-3 py-1">Kurikulum Merdeka</span>
          <span className="rounded-full border border-white/15 px-3 py-1">Kurikulum Berbasis Cinta</span>
          <span className="rounded-full border border-white/15 px-3 py-1">Mapel umum &amp; bahasa Arab</span>
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

          <h2 className="text-2xl font-bold text-stone-900">Masuk ke akun Anda</h2>
          <p className="mt-1 text-sm text-stone-500">
            Gunakan akun yang diberikan administrator madrasah.
          </p>

          <div className="mt-6">
            <LoginForm />
          </div>

          <div className="mt-8 rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Akun demo
            </p>
            <div className="mt-2 space-y-1.5">
              {DEMO.map((akun) => (
                <div key={akun.value} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-stone-600">{akun.label}</span>
                  <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-700">
                    {akun.value}
                  </code>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-stone-400">
              Akun contoh dibuat otomatis saat aplikasi pertama dijalankan. Segera ganti
              password setelah masuk.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
