import { notFound } from "next/navigation";
import { dokumenBackHref, jumlahSkor, loadDokumen } from "@/lib/documents";
import { KopSurat } from "@/components/dokumen";
import { SoalTeks } from "@/components/soal-teks";
import { DocToolbar } from "@/components/print-toolbar";
import { bentukInfo, kurikulumInfo } from "@/lib/konstanta";
import type { Butir } from "@/lib/types";

export const dynamic = "force-dynamic";

function kelompokkan(butir: Butir[]) {
  const urutan: string[] = [];
  const peta = new Map<string, Butir[]>();
  for (const item of butir) {
    if (!peta.has(item.bentuk)) {
      peta.set(item.bentuk, []);
      urutan.push(item.bentuk);
    }
    peta.get(item.bentuk)!.push(item);
  }
  return urutan.map((kunci, index) => ({
    kunci,
    label: `${String.fromCharCode(65 + index)}. ${bentukInfo(kunci).label}`,
    butir: peta.get(kunci)!,
  }));
}

export default async function NaskahSoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();

  const { user, paket, butir, settings } = await loadDokumen(id);
  const info = kurikulumInfo(paket.kurikulum);
  const kelompok = kelompokkan(butir);

  return (
    <>
      <DocToolbar
        backHref={dokumenBackHref(user.role, paket.id)}
        title="Naskah Soal"
        subtitle={`${paket.mapel} · Kelas ${paket.kelas} · ${paket.tahun_ajaran}`}
      />

      <div className="sheet-wrap">
        <article className="sheet">
          <KopSurat s={settings} />

          <div className="doc-title">{paket.jenis_penilaian || "Naskah Soal"}</div>
          <div className="doc-subtitle">Tahun Pelajaran {paket.tahun_ajaran}</div>

          <table className="doc-identitas">
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "2%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "2%" }} />
              <col style={{ width: "30%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td>Mata Pelajaran</td>
                <td className="sep">:</td>
                <td>{paket.mapel}</td>
                <td>Kelas / Semester</td>
                <td className="sep">:</td>
                <td>
                  {paket.kelas} / {paket.semester}
                </td>
              </tr>
              <tr>
                <td>Kurikulum</td>
                <td className="sep">:</td>
                <td>{info.label}</td>
                <td>Alokasi Waktu</td>
                <td className="sep">:</td>
                <td>{paket.alokasi_waktu || "-"}</td>
              </tr>
              <tr>
                <td>Tahun Pelajaran</td>
                <td className="sep">:</td>
                <td>{paket.tahun_ajaran}</td>
                <td>Jumlah Butir</td>
                <td className="sep">:</td>
                <td>{butir.length} butir</td>
              </tr>
            </tbody>
          </table>

          {paket.petunjuk ? (
            <div className="mb-4">
              <p className="font-bold uppercase tracking-wide" style={{ fontSize: "10pt" }}>
                Petunjuk Umum
              </p>
              <div className="whitespace-pre-line" style={{ fontSize: "10pt" }}>
                {paket.petunjuk}
              </div>
            </div>
          ) : null}

          {butir.length === 0 ? (
            <p className="text-center italic text-stone-500">
              Belum ada butir soal pada paket ini.
            </p>
          ) : (
            kelompok.map((grup) => (
              <section key={grup.kunci} className="mb-4">
                <h3 className="mb-2 font-bold" style={{ fontSize: "11pt" }}>
                  {grup.label}
                </h3>
                {grup.butir.map((item) => (
                  <SoalTeks key={item.id} butir={item} />
                ))}
              </section>
            ))
          )}

          {butir.length > 0 ? (
            <p className="mt-8 text-center italic" style={{ fontSize: "10pt" }}>
              — Selamat mengerjakan —
            </p>
          ) : null}
        </article>

        {paket.cetak_kunci ? (
          <article className="sheet page-break">
            <KopSurat s={settings} />
            <div className="doc-title">Kunci Jawaban dan Penskoran</div>
            <div className="doc-subtitle">
              {paket.mapel} · Kelas {paket.kelas} · {paket.tahun_ajaran}
            </div>

            <table className="doc-table">
              <colgroup>
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
                <col />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Bentuk</th>
                  <th>Kunci / Rubrik Jawaban</th>
                  <th>Skor</th>
                </tr>
              </thead>
              <tbody>
                {butir.map((item) => (
                  <tr key={item.id}>
                    <td className="center">{item.nomor}</td>
                    <td className="center">{bentukInfo(item.bentuk).singkat}</td>
                    <td className="whitespace-pre-line">{item.kunci || "-"}</td>
                    <td className="center">{item.skor}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="text-right font-bold">
                    Total Skor Maksimal
                  </td>
                  <td className="center font-bold">{jumlahSkor(butir)}</td>
                </tr>
              </tbody>
            </table>

            <p className="mt-4" style={{ fontSize: "9pt" }}>
              Catatan: Kunci jawaban untuk bentuk uraian dapat berupa rubrik penskoran.
              Sesuaikan bobot skor dengan tingkat kesulitan butir.
            </p>
          </article>
        ) : null}
      </div>
    </>
  );
}
