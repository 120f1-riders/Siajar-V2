import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getButir, getPaket } from "@/lib/queries";
import { getIntegrations } from "@/lib/integrations";
import { PaketEditor } from "@/components/paket-editor";

export const dynamic = "force-dynamic";

export default async function PaketEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(["guru"]);
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();

  const paket = getPaket(id);
  if (!paket || paket.guru_id !== user.id) notFound();

  const butir = getButir(id);
  const integrations = getIntegrations();

  return (
    <PaketEditor
      paket={{
        id: paket.id,
        mapel: paket.mapel,
        kelas: paket.kelas,
        semester: paket.semester,
        tahun_ajaran: paket.tahun_ajaran,
        kurikulum: paket.kurikulum,
        jenis_penilaian: paket.jenis_penilaian,
        alokasi_waktu: paket.alokasi_waktu,
        petunjuk: paket.petunjuk,
        cetak_kunci: paket.cetak_kunci,
        status: paket.status,
        catatan_kepala: paket.catatan_kepala,
        butir: butir.map((item) => ({
          bentuk: item.bentuk,
          materi: item.materi,
          acuan: item.acuan,
          indikator: item.indikator,
          level: item.level,
          soal: item.soal,
          opsi: item.opsi,
          kunci: item.kunci,
          skor: item.skor,
        })),
      }}
      googleConnected={Boolean(integrations.google_refresh_token)}
      googleEmail={integrations.google_email}
    />
  );
}
