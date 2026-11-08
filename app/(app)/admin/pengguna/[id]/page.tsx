import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listUsers } from "@/lib/queries";
import { tanggalId } from "@/lib/format";
import {
  ResetPasswordForm,
  UpdateUserForm,
  UserAccountActions,
} from "@/components/admin/user-forms";
import { PageHeader, RoleBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PenggunaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireUser(["admin"]);
  const { id: rawId } = await params;
  await searchParams;
  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();

  const user = listUsers().find((item) => item.id === id);
  if (!user) notFound();

  const isSelf = user.id === admin.id;

  return (
    <div>
      <PageHeader title="Kelola Pengguna" description="Perbarui data akun dan keamanan.">
        <Link href="/admin" className="btn btn-outline">
          ← Daftar Pengguna
        </Link>
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-stone-900">{user.nama}</p>
          <p className="font-mono text-xs text-stone-500">@{user.username}</p>
        </div>
        <RoleBadge role={user.role} />
        <span className={`badge ${user.aktif ? "badge-disahkan" : "badge-dikembalikan"}`}>
          {user.aktif ? "Aktif" : "Nonaktif"}
        </span>
        <span className="text-[11px] text-stone-400">
          Dibuat {tanggalId(user.created_at)} · {user.jumlah_paket} paket soal
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-bold text-stone-800">Data Pengguna</h2>
          <UpdateUserForm
            user={{
              id: user.id,
              username: user.username,
              nama: user.nama,
              role: user.role,
              nip: user.nip,
            }}
          />
        </section>

        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="text-sm font-bold text-stone-800">Reset Password</h2>
            <p className="mb-3 mt-1 text-xs text-stone-500">
              Buat password sementara bila pengguna lupa password. Pengguna akan diminta
              menggantinya saat masuk.
            </p>
            <ResetPasswordForm userId={user.id} />
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-stone-800">Status &amp; Hapus Akun</h2>
            <p className="mb-3 mt-1 text-xs text-stone-500">
              Akun nonaktif tidak dapat masuk, tetapi datanya tetap tersimpan. Menghapus akun
              juga menghapus seluruh paket soalnya.
            </p>
            {isSelf ? (
              <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
                Ini akun Anda sendiri. Perubahan status dan penghapusan dinonaktifkan.
              </p>
            ) : (
              <UserAccountActions userId={user.id} aktif={Boolean(user.aktif)} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
