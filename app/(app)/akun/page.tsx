import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";
import { PasswordForm } from "@/components/password-form";
import { Alert, PageHeader, RoleBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AkunPage() {
  const user = await requireUser();

  return (
    <div>
      <PageHeader
        title="Akun Saya"
        description="Perbarui profil, unggah tanda tangan, dan ganti password."
      />

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
          {user.nama.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-800">{user.nama}</p>
          <p className="font-mono text-[11px] text-stone-500">@{user.username}</p>
        </div>
        <RoleBadge role={user.role} />
      </div>

      {user.harus_ganti_password ? (
        <div className="mb-5">
          <Alert tone="warning">
            <span className="font-semibold">Password Anda baru saja direset administrator.</span>{" "}
            Segera ganti password agar akun tetap aman.
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="card p-5">
          <h2 className="text-sm font-bold text-stone-800">Profil &amp; Tanda Tangan</h2>
          <p className="mb-4 text-xs text-stone-500">
            Nama dan NIP tercetak pada kisi-kisi serta kartu soal.
          </p>
          <ProfileForm user={user} />
        </section>

        <section className="card h-fit p-5">
          <h2 className="text-sm font-bold text-stone-800">Ubah Password</h2>
          <p className="mb-4 text-xs text-stone-500">
            Gunakan password yang kuat dan tidak dipakai di akun lain.
          </p>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
