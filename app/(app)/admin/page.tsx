import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listResetRequests, listUsers } from "@/lib/queries";
import { tanggalId } from "@/lib/format";
import { ResetRequestList } from "@/components/admin/reset-request-list";
import { Alert, PageHeader, RoleBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

const OK_MESSAGES: Record<string, string> = {
  tambah: "Pengguna baru berhasil ditambahkan.",
  ubah: "Data pengguna berhasil diperbarui.",
  hapus: "Pengguna berhasil dihapus.",
  status: "Status akun berhasil diperbarui.",
};

const ERR_MESSAGES: Record<string, string> = {
  self: "Anda tidak dapat menonaktifkan atau menghapus akun sendiri.",
  lastadmin: "Minimal harus ada satu akun administrator yang aktif.",
  notfound: "Pengguna tidak ditemukan.",
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser(["admin"]);
  const params = await searchParams;
  const ok = OK_MESSAGES[first(params.ok)];
  const error = ERR_MESSAGES[first(params.err)];

  const users = await listUsers();
  const requests = await listResetRequests();
  const pending = requests.filter((request) => request.status === "pending").length;

  return (
    <div>
      <PageHeader
        title="Pengguna &amp; Reset Password"
        description="Tambah akun guru, kepala madrasah, dan administrator; tangani permintaan lupa password."
      >
        <Link href="/admin/pengguna/baru" className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Tambah Pengguna
        </Link>
      </PageHeader>

      {ok ? (
        <div className="mb-5">
          <Alert tone="success">{ok}</Alert>
        </div>
      ) : null}
      {error ? (
        <div className="mb-5">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <section className="card mb-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-stone-800">Permintaan Lupa Password</h2>
            <p className="text-[11px] text-stone-400">
              Permintaan dari halaman lupa password ditampilkan di sini.
            </p>
          </div>
          <span
            className={`badge ${pending > 0 ? "badge-diajukan" : "badge-draft"}`}
          >
            {pending} menunggu
          </span>
        </div>
        <ResetRequestList requests={requests} />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-stone-800">Daftar Pengguna</h2>
            <p className="text-[11px] text-stone-400">
              {users.length} akun terdaftar. Klik &ldquo;Kelola&rdquo; untuk mengubah peran,
              mereset password, atau menonaktifkan akun.
            </p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Username</th>
                  <th className="px-4 py-3 font-semibold">Peran</th>
                  <th className="px-4 py-3 font-semibold">NIP</th>
                  <th className="px-4 py-3 font-semibold">Paket</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Dibuat</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50/70">
                    <td className="px-4 py-3 font-semibold text-stone-800">{user.nama}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-600">
                      {user.username}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">{user.nip || "-"}</td>
                    <td className="px-4 py-3 text-stone-600">{user.jumlah_paket}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${user.aktif ? "badge-disahkan" : "badge-dikembalikan"}`}>
                        {user.aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {tanggalId(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/pengguna/${user.id}`} className="btn btn-outline btn-sm">
                        Kelola
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <p className="mt-6 rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-500">
        Kop surat, logo madrasah, nama kepala madrasah, dan tanda tangan bawaan diatur di{" "}
        <Link href="/admin/pengaturan" className="font-semibold text-brand-700 hover:underline">
          Pengaturan Kop Surat
        </Link>
        . Integrasi AI dan Google Drive dicek di <Link href="/admin/integrasi" className="font-semibold text-brand-700 hover:underline">Pengaturan Integrasi</Link>.
      </p>
    </div>
  );
}
