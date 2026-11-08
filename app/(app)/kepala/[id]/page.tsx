import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getButir, getPaket, getSettings } from "@/lib/queries";
import { kurikulumInfo, bentukInfo, levelLabel, HURUF_OPSI } from "@/lib/konstanta";
import { tanggalId, tanggalJamId } from "@/lib/format";
import { SignPanel } from "@/components/kepala/sign-panel";
import { StatusBadge } from "@/components/status-badge";
import { Alert, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function KepalaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(["kepala"]);
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();

  const paket = await getPaket(id);
  if (!paket) notFound();

  const butir = await getButir(id);
  const settings = await getSettings();
  const info = kurikulumInfo(paket.kurikulum);
  const totalSkor = butir.reduce((sum, item) => sum + item.skor, 0);
  const punyaTtd = Boolean(user.ttd_path || settings.kepala_ttd_path);

  return (
    <div>
      <PageHeader
        title={paket.mapel || "Paket tanpa mata pelajaran"}
        description={`${paket.jenis_penilaian} · Kelas ${paket.kelas || "-"} · ${paket.tahun_ajaran}`}
      >
        <StatusBadge status={paket.status} />
        <Link href="/kepala" className="btn btn-outline btn-sm">
          ← Kembali
        </Link>
      </PageHeader>

      {paket.status === "diajukan" ? (
        <div className="card mb-5 p-5">
          <h2 className="text-sm font-bold text-stone-800">Pengesahan Dokumen</h2>
          <p className="mb-4 text-xs text-stone-500">
            Dengan menekan &ldquo;Sahkan &amp; Tandatangani&rdquo;, tanda tangan Anda akan
            dibubuhkan pada kisi-kisi dan kartu soal paket ini.
          </p>
          <SignPanel paketId={paket.id} hasSignature={punyaTtd} />
        </div>
      ) : null}

      {paket.status === "disahkan" ? (
        <div className="mb-5">
          <Alert tone="success">
            <span className="font-semibold">Dokumen telah disahkan</span> pada{" "}
            {tanggalId(paket.signed_at)} oleh {paket.signed_nama || settings.kepala_nama}.
            Kisi-kisi dan kartu soal sudah bertanda tangan dan siap dicetak.
          </Alert>
        </div>
      ) : null}

      {paket.status === "dikembalikan" && paket.catatan_kepala ? (
        <div className="mb-5">
          <Alert tone="error">
            <span className="font-semibold">Catatan Anda:</span> {paket.catatan_kepala}
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="mb-3 text-sm font-bold text-stone-800">Identitas Paket</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                { label: "Guru mata pelajaran", value: paket.guru_nama },
                { label: "NIP guru", value: paket.guru_nip || "-" },
                { label: "Kurikulum", value: info.label },
                { label: "Kelas / semester", value: `${paket.kelas || "-"} / ${paket.semester}` },
                { label: "Tahun pelajaran", value: paket.tahun_ajaran },
                { label: "Alokasi waktu", value: paket.alokasi_waktu || "-" },
                { label: "Jumlah butir", value: `${butir.length} butir` },
                { label: "Total skor", value: String(totalSkor) },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 text-stone-800">{item.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
              <span className="font-semibold">{info.label}:</span> {info.deskripsi}
            </p>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-800">Butir Soal</h2>
              <span className="text-xs text-stone-400">{butir.length} butir</span>
            </div>

            {butir.length === 0 ? (
              <div className="card px-4 py-6 text-sm text-stone-500">
                Belum ada butir soal pada paket ini.
              </div>
            ) : (
              <div className="space-y-3">
                {butir.map((item) => (
                  <div key={item.id} className="card p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-[11px] font-bold text-white">
                        {item.nomor}
                      </span>
                      <span className="badge badge-draft">{bentukInfo(item.bentuk).label}</span>
                      <span className="badge border-stone-200 bg-white text-stone-600">
                        {levelLabel(item.level)}
                      </span>
                      <span className="text-[11px] text-stone-400">Skor {item.skor}</span>
                    </div>

                    <p className="whitespace-pre-line text-sm text-stone-800">
                      {item.soal || "(soal belum diisi)"}
                    </p>

                    {(item.bentuk === "pg" || item.bentuk === "pgk") && item.opsi.some((o) => o.trim()) ? (
                      <div className="mt-2 grid gap-1 text-sm text-stone-700 sm:grid-cols-2">
                        {item.opsi.map((opsi, index) =>
                          opsi.trim() ? (
                            <div key={index} className="flex gap-2">
                              <span className="font-semibold text-stone-500">
                                {HURUF_OPSI[index]}.
                              </span>
                              <span>{opsi}</span>
                            </div>
                          ) : null
                        )}
                      </div>
                    ) : null}

                    <dl className="mt-3 grid gap-2 border-t border-stone-100 pt-3 text-xs sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold text-stone-400">Materi</dt>
                        <dd className="text-stone-700">{item.materi || "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-stone-400">Indikator soal</dt>
                        <dd className="text-stone-700">{item.indikator || "-"}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="font-semibold text-stone-400">{info.acuanLabel}</dt>
                        <dd className="text-stone-700">{item.acuan || "-"}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="font-semibold text-stone-400">Kunci jawaban</dt>
                        <dd className="text-stone-700">{item.kunci || "-"}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Pratinjau Dokumen
            </h3>
            <div className="mt-2 space-y-2">
              <Link
                href={`/cetak/${paket.id}/kisi-kisi`}
                target="_blank"
                className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-brand-300 hover:bg-brand-50"
              >
                Kisi-kisi <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href={`/cetak/${paket.id}/kartu-soal`}
                target="_blank"
                className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-brand-300 hover:bg-brand-50"
              >
                Kartu soal <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href={`/cetak/${paket.id}/soal`}
                target="_blank"
                className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-brand-300 hover:bg-brand-50"
              >
                Naskah soal <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="card p-4 text-xs text-stone-500">
            <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Riwayat
            </h3>
            <p className="mt-2">Diajukan: {tanggalJamId(paket.submitted_at)}</p>
            <p className="mt-1">Diperbarui: {tanggalJamId(paket.updated_at)}</p>
            {paket.signed_at ? (
              <p className="mt-1">Disahkan: {tanggalJamId(paket.signed_at)}</p>
            ) : null}
          </div>

          {punyaTtd ? (
            <div className="card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500">
                Tanda tangan Anda
              </h3>
              {user.ttd_path || settings.kepala_ttd_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.ttd_path || settings.kepala_ttd_path}
                  alt="Tanda tangan"
                  className="mt-2 h-20 w-full rounded-lg border border-stone-100 bg-white object-contain p-1"
                />
              ) : null}
              <p className="mt-2 text-xs text-stone-500">{user.nama}</p>
              <Link href="/akun" className="mt-1 inline-block text-[11px] font-semibold text-brand-700 hover:underline">
                Ganti tanda tangan
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
