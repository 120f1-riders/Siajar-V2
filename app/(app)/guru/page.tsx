import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listPaket } from "@/lib/queries";
import { kurikulumShort, tanggalJamId } from "@/lib/format";
import { BuatPaketButton } from "@/components/buat-paket-button";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function GuruPaketPage() {
  const user = await requireUser(["guru"]);
  const paket = listPaket({ guruId: user.id });

  return (
    <div>
      <PageHeader
        title="Paket Soal"
        description="Setiap paket menghasilkan naskah soal, kisi-kisi, dan kartu soal sekaligus."
      >
        <BuatPaketButton label="Buat Paket Baru" />
      </PageHeader>

      {paket.length === 0 ? (
        <EmptyState
          title="Belum ada paket soal"
          description="Mulai dengan membuat paket, tentukan mata pelajaran dan kurikulum, lalu tambahkan butir soal."
        >
          <BuatPaketButton label="Buat Paket Soal Pertama" />
        </EmptyState>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Paket</th>
                  <th className="px-4 py-3 font-semibold">Kelas</th>
                  <th className="px-4 py-3 font-semibold">Kurikulum</th>
                  <th className="px-4 py-3 font-semibold">Butir</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Diperbarui</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paket.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-stone-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-stone-800">
                        {item.mapel || "(tanpa mapel)"}
                      </p>
                      <p className="text-[11px] text-stone-400">{item.jenis_penilaian}</p>
                      {item.status === "dikembalikan" && item.catatan_kepala ? (
                        <p className="mt-1 max-w-xs text-[11px] text-red-600">
                          Catatan: {item.catatan_kepala}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {item.kelas || "-"}
                      <span className="block text-[11px] text-stone-400">
                        {item.semester} · {item.tahun_ajaran}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{kurikulumShort(item.kurikulum)}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {item.jumlah_butir}
                      <span className="block text-[11px] text-stone-400">{item.total_skor} skor</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {tanggalJamId(item.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/guru/paket/${item.id}`} className="btn btn-outline btn-sm">
                        Buka
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
