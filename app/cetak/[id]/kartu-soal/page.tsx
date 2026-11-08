import { notFound } from "next/navigation";
import {
  dokumenBackHref,
  kepalaPenandaTangan,
  jumlahSkor,
  loadDokumen,
  tanggalTandaTangan,
} from "@/lib/documents";
import { KopSurat, TandaTangan } from "@/components/dokumen";
import { SoalTeks } from "@/components/soal-teks";
import { DocToolbar } from "@/components/print-toolbar";
import { bentukInfo, kurikulumInfo, levelLabel } from "@/lib/konstanta";

export const dynamic = "force-dynamic";

export default async function KartuSoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();

  const { user, paket, butir, settings } = await loadDokumen(id);
  const info = kurikulumInfo(paket.kurikulum);
  const kepala = kepalaPenandaTangan(paket, settings);
  const tanggal = tanggalTandaTangan(paket, settings);

  return (
    <>
      <DocToolbar
        backHref={dokumenBackHref(user.role, paket.id)}
        title="Kartu Soal"
        subtitle={`${paket.mapel} · Kelas ${paket.kelas} · ${paket.tahun_ajaran}`}
      />

      <div className="sheet-wrap">
        {butir.length === 0 ? (
          <article className="sheet">
            <KopSurat s={settings} />
            <div className="doc-title">Kartu Soal</div>
            <p className="mt-10 text-center italic text-stone-500">
              Belum ada butir soal pada paket ini.
            </p>
          </article>
        ) : (
          butir.map((item, index) => (
            <article
              key={item.id}
              className={`sheet ${index < butir.length - 1 ? "page-break" : ""}`}
            >
              <KopSurat s={settings} />

              <div className="doc-title" style={{ fontSize: "12pt", marginBottom: "2px" }}>
                Kartu Soal
              </div>
              <div className="doc-subtitle" style={{ marginBottom: "8px" }}>
                {paket.jenis_penilaian} · {paket.tahun_ajaran}
              </div>

              <table className="doc-identitas kartu-meta" style={{ marginBottom: "8px" }}>
                <colgroup>
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "2%" }} />
                  <col style={{ width: "32%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "2%" }} />
                  <col style={{ width: "32%" }} />
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
                    <td>Bentuk Soal</td>
                    <td className="sep">:</td>
                    <td>{bentukInfo(item.bentuk).label}</td>
                  </tr>
                  <tr>
                    <td>Nomor Soal</td>
                    <td className="sep">:</td>
                    <td>{item.nomor}</td>
                    <td>Skor</td>
                    <td className="sep">:</td>
                    <td>{item.skor}</td>
                  </tr>
                </tbody>
              </table>

              <table className="doc-table" style={{ marginBottom: "8px" }}>
                <colgroup>
                  <col style={{ width: "22%" }} />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>{info.kisiKolom}</th>
                    <td className="whitespace-pre-line">{item.acuan || "-"}</td>
                  </tr>
                  <tr>
                    <th>Materi</th>
                    <td>{item.materi || "-"}</td>
                  </tr>
                  <tr>
                    <th>Indikator Soal</th>
                    <td className="whitespace-pre-line">{item.indikator || "-"}</td>
                  </tr>
                  <tr>
                    <th>Level Kognitif</th>
                    <td>{levelLabel(item.level)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="kartu-soal-box" style={{ marginBottom: "8px" }}>
                <div className="kartu-label">
                  Butir Soal Nomor {item.nomor} — {bentukInfo(item.bentuk).label}
                </div>
                <SoalTeks butir={item} nomor={false} />
              </div>

              <div className="kartu-soal-box" style={{ marginBottom: "10px" }}>
                <div className="kartu-label">Kunci Jawaban dan Penskoran</div>
                <div className="whitespace-pre-line">{item.kunci || "—"}</div>
                <div style={{ fontSize: "9pt", marginTop: "4px" }}>
                  Skor butir: {item.skor} dari total {jumlahSkor(butir)} skor.
                </div>
              </div>

              <div className="sign-row">
                <TandaTangan
                  label="Kepala Madrasah"
                  nama={kepala.nama}
                  nip={kepala.nip}
                  ttd={kepala.ttd}
                />
                <TandaTangan
                  label="Guru Mata Pelajaran"
                  nama={paket.guru_nama}
                  nip={paket.guru_nip}
                  tanggal={tanggal}
                />
              </div>

              {paket.status !== "disahkan" ? (
                <p className="no-print mt-3 text-center" style={{ fontSize: "9pt", color: "#92400e" }}>
                  Kartu soal ini belum ditandatangani kepala madrasah.
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </>
  );
}
