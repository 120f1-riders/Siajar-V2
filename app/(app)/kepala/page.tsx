import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getSettings, listPaket } from "@/lib/queries";
import { kurikulumShort, tanggalId, tanggalJamId } from "@/lib/format";
import { Alert, EmptyState, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function KepalaPage() {
  const user = await requireUser(["kepala"]);
  const settings = await getSettings();
  const menunggu = await listPaket({ status: ["diajukan"] });
  const riwayat = await listPaket({ status: ["disahkan"], limit: 20 });
  const punyaTtd = Boolean(user.ttd_path || settings.kepala_ttd_path);

  return (
    <div>
      <PageHeader
        title="Tanda Tangan Dokumen"
        description="Tinjau paket dari guru, lalu sahkan kisi-kisi dan kartu soal dengan tanda tangan Anda."
      />

      {!punyaTtd ? (
        <div className="mb-5">
          <Alert tone="warning">
            <span className="font-semibold">Tanda tangan belum tersedia.</span> Unggah gambar
            tanda tangan di{" "}
            <Link href="/akun" className="font-semibold underline">
              Akun Saya
            </Link>{" "}
            agar tercetak pada dokumen yang disahkan.
          </Alert>
        </div>
      ) : null}

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-bold text-stone-800">Menunggu Tanda Tangan</h2>
          <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-bold text-gold-700">
            {menunggu.length}
          </span>
        </div>

        {menunggu.length === 0 ? (
          <EmptyState
            title="Tidak ada paket yang menunggu"
            description="Paket yang diajukan guru akan muncul di sini."
          />
        ) : (
          <div className="space-y-3">
            {menunggu.map((item) => (
              <div
                key={item.id}
                className="card flex flex-wrap items-center gap-4 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-stone-800">
                      {item.mapel || "(tanpa mapel)"}
                    </p>
                    <span className="badge badge-draft">
                      Kelas {item.kelas || "-"}
                    </span>
                    <span className="badge badge-draft">
                      {kurikulumShort(item.kurikulum)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {item.guru_nama} · {item.jumlah_butir} butir · {item.total_skor} skor
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Diajukan {tanggalJamId(item.submitted_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/cetak/${item.id}/kisi-kisi`} target="_blank" className="btn btn-outline btn-sm">
                    Kisi-kisi
                  </Link>
                  <Link href={`/kepala/${item.id}`} className="btn btn-primary btn-sm">
                    Tinjau &amp; Sahkan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-stone-800">Riwayat Pengesahan</h2>
        {riwayat.length === 0 ? (
          <div className="card px-4 py-6 text-sm text-stone-500">
            Belum ada dokumen yang Anda sahkan.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Paket</th>
                    <th className="px-4 py-2.5 font-semibold">Guru</th>
                    <th className="px-4 py-2.5 font-semibold">Kurikulum</th>
                    <th className="px-4 py-2.5 font-semibold">Disahkan</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {riwayat.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/70">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-stone-800">{item.mapel}</p>
                        <p className="text-[11px] text-stone-400">
                          Kelas {item.kelas} · {item.tahun_ajaran}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{item.guru_nama}</td>
                      <td className="px-4 py-3 text-stone-600">{kurikulumShort(item.kurikulum)}</td>
                      <td className="px-4 py-3 text-xs text-stone-500">
                        {tanggalId(item.signed_at)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/kepala/${item.id}`} className="text-xs font-semibold text-brand-700 hover:underline">
                          Lihat
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
