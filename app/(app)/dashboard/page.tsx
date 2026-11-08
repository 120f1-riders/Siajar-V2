import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  countPaketByStatus,
  countPendingReset,
  countUsersByRole,
  getSettings,
  listPaket,
  listResetRequests,
} from "@/lib/queries";
import { kurikulumShort, tanggalJamId } from "@/lib/format";
import type { PaketRingkas, SessionUser } from "@/lib/types";
import { BuatPaketButton } from "@/components/buat-paket-button";
import { StatusBadge } from "@/components/status-badge";
import { Alert, EmptyState, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

function namaDepan(nama: string): string {
  return nama.split(",")[0].trim();
}

function DaftarPaket({
  paket,
  kosong,
}: {
  paket: PaketRingkas[];
  kosong: string;
}) {
  if (paket.length === 0) {
    return <EmptyState title={kosong} description="Paket yang selesai akan tampil di sini." />;
  }
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Mata Pelajaran</th>
              <th className="px-4 py-2.5 font-semibold">Kelas</th>
              <th className="px-4 py-2.5 font-semibold">Butir</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Diperbarui</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {paket.map((item) => (
              <tr key={item.id} className="hover:bg-stone-50/70">
                <td className="px-4 py-3">
                  <p className="font-semibold text-stone-800">{item.mapel || "(tanpa mapel)"}</p>
                  <p className="text-[11px] text-stone-400">
                    {kurikulumShort(item.kurikulum)} · {item.tahun_ajaran}
                  </p>
                </td>
                <td className="px-4 py-3 text-stone-600">{item.kelas || "-"}</td>
                <td className="px-4 py-3 text-stone-600">{item.jumlah_butir}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-xs text-stone-500">
                  {tanggalJamId(item.updated_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/guru/paket/${item.id}`}
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Buka
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function GuruDashboard({ user }: { user: SessionUser }) {
  const paket = await listPaket({ guruId: user.id });
  const milik = paket.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === "draft") acc.draft += 1;
      if (item.status === "diajukan") acc.diajukan += 1;
      if (item.status === "disahkan") acc.disahkan += 1;
      if (item.status === "dikembalikan") acc.dikembalikan += 1;
      return acc;
    },
    { total: 0, draft: 0, diajukan: 0, disahkan: 0, dikembalikan: 0 }
  );

  const dikembalikan = paket.filter((p) => p.status === "dikembalikan");

  return (
    <div>
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-brand-900 p-6 text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-700/50 blur-2xl" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-200">
            Dasbor Guru
          </p>
          <h1 className="mt-1 text-2xl font-bold">Assalamu&rsquo;alaikum, {namaDepan(user.nama)}</h1>
          <p className="mt-1 max-w-xl text-sm text-brand-100/80">
            Lengkapi satu paket data, lalu hasilkan naskah soal, kisi-kisi, dan kartu soal
            secara otomatis untuk diajukan kepada kepala madrasah.
          </p>
          <div className="mt-4">
            <BuatPaketButton label="Buat Paket Soal Baru" className="btn btn-gold" />
          </div>
        </div>
      </div>

      {dikembalikan.length > 0 ? (
        <div className="mb-5">
          <Alert tone="warning">
            <span className="font-semibold">{dikembalikan.length} paket dikembalikan</span>{" "}
            oleh kepala madrasah dan perlu diperbaiki.{" "}
            <Link href="/guru" className="font-semibold underline">
              Lihat paket
            </Link>
          </Alert>
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total paket" value={milik.total} hint="Semua paket Anda" />
        <StatCard label="Draf" value={milik.draft} accent="stone" hint="Belum diajukan" />
        <StatCard label="Menunggu tanda tangan" value={milik.diajukan} accent="gold" />
        <StatCard label="Disahkan" value={milik.disahkan} accent="brand" />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-stone-800">Paket Terbaru</h2>
        <Link href="/guru" className="text-xs font-semibold text-brand-700 hover:underline">
          Semua paket →
        </Link>
      </div>
      <DaftarPaket paket={paket.slice(0, 5)} kosong="Belum ada paket soal" />
    </div>
  );
}

async function KepalaDashboard({ user }: { user: SessionUser }) {
  const settings = await getSettings();
  const menunggu = await listPaket({ status: ["diajukan"] });
  const disahkan = await listPaket({ status: ["disahkan"], limit: 6 });
  const punyaTtd = Boolean(user.ttd_path || settings.kepala_ttd_path);

  return (
    <div>
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-brand-900 p-6 text-white">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gold-500/20 blur-2xl" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold-300">
            Dasbor Kepala Madrasah
          </p>
          <h1 className="mt-1 text-2xl font-bold">Assalamu&rsquo;alaikum, {namaDepan(user.nama)}</h1>
          <p className="mt-1 max-w-xl text-sm text-brand-100/80">
            Tinjau paket yang diajukan guru, lalu bubuhkan tanda tangan Anda pada kisi-kisi
            dan kartu soal.
          </p>
        </div>
      </div>

      {!punyaTtd ? (
        <div className="mb-5">
          <Alert tone="warning">
            <span className="font-semibold">Tanda tangan belum diunggah.</span> Dokumen dapat
            disahkan, tetapi tanda tangan pada kisi-kisi dan kartu soal akan kosong.{" "}
            <Link href="/akun" className="font-semibold underline">
              Unggah sekarang
            </Link>
          </Alert>
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Menunggu tanda tangan" value={menunggu.length} accent="gold" />
        <StatCard label="Sudah disahkan" value={disahkan.length} accent="brand" />
        <StatCard
          label="Tanda tangan"
          value={punyaTtd ? "Siap" : "Belum ada"}
          accent={punyaTtd ? "brand" : "red"}
          hint={punyaTtd ? "Siap dibubuhkan" : "Unggah di Akun Saya"}
        />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-stone-800">Menunggu Tanda Tangan</h2>
        <Link href="/kepala" className="text-xs font-semibold text-brand-700 hover:underline">
          Semua pengajuan →
        </Link>
      </div>

      {menunggu.length === 0 ? (
        <EmptyState
          title="Tidak ada paket yang menunggu"
          description="Paket yang diajukan guru akan muncul di sini untuk Anda tinjau."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Guru</th>
                  <th className="px-4 py-2.5 font-semibold">Paket</th>
                  <th className="px-4 py-2.5 font-semibold">Butir</th>
                  <th className="px-4 py-2.5 font-semibold">Diajukan</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {menunggu.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-stone-800">{item.guru_nama}</p>
                      <p className="text-[11px] text-stone-400">{item.tahun_ajaran}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-stone-700">{item.mapel || "(tanpa mapel)"}</p>
                      <p className="text-[11px] text-stone-400">
                        Kelas {item.kelas || "-"} · {kurikulumShort(item.kurikulum)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{item.jumlah_butir}</td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {tanggalJamId(item.submitted_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/kepala/${item.id}`} className="btn btn-primary btn-sm">
                        Tinjau
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

async function AdminDashboard({ user }: { user: SessionUser }) {
  const users = await countUsersByRole();
  const paket = await countPaketByStatus();
  const pendingReset = await countPendingReset();
  const requests = (await listResetRequests()).filter((r) => r.status === "pending").slice(0, 3);

  return (
    <div>
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-stone-900 p-6 text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-700/40 blur-2xl" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
            Dasbor Administrator
          </p>
          <h1 className="mt-1 text-2xl font-bold">Assalamu&rsquo;alaikum, {namaDepan(user.nama)}</h1>
          <p className="mt-1 max-w-xl text-sm text-stone-300">
            Kelola akun pengguna, password, serta kop surat dan identitas madrasah.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin" className="btn btn-gold btn-sm">
              Kelola Pengguna
            </Link>
            <Link
              href="/admin/pengaturan"
              className="btn btn-sm border border-white/25 text-white hover:bg-white/10"
            >
              Atur Kop Surat
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total pengguna" value={users.total} />
        <StatCard label="Guru" value={users.guru} accent="brand" />
        <StatCard label="Kepala madrasah" value={users.kepala} accent="gold" />
        <StatCard
          label="Permintaan reset"
          value={pendingReset}
          accent={pendingReset > 0 ? "red" : "stone"}
          hint={pendingReset > 0 ? "Perlu ditangani" : "Tidak ada"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-800">Permintaan Lupa Password</h2>
            <Link href="/admin" className="text-xs font-semibold text-brand-700 hover:underline">
              Tangani →
            </Link>
          </div>
          <div className="card">
            {requests.length === 0 ? (
              <p className="px-4 py-6 text-sm text-stone-500">
                Tidak ada permintaan reset password.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {requests.map((request) => (
                  <li key={request.id} className="px-4 py-3">
                    <p className="text-sm font-semibold text-stone-800">{request.nama}</p>
                    <p className="text-xs text-stone-500">
                      @{request.username} · {tanggalJamId(request.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-stone-800">Ringkasan Paket Soal</h2>
          <div className="card p-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Draf", value: paket.draft },
                { label: "Menunggu tanda tangan", value: paket.diajukan },
                { label: "Disahkan", value: paket.disahkan },
                { label: "Dikembalikan", value: paket.dikembalikan },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                    {item.label}
                  </p>
                  <p className="text-lg font-bold text-stone-800">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-stone-400">
              Paket dikelola oleh guru; administrator hanya mengelola akun dan identitas
              madrasah.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === "guru") return <GuruDashboard user={user} />;
  if (user.role === "kepala") return <KepalaDashboard user={user} />;
  return <AdminDashboard user={user} />;
}
