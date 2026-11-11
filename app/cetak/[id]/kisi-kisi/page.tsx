import { notFound } from "next/navigation";
import {
  dokumenBackHref,
  kepalaPenandaTangan,
  jumlahSkor,
  loadDokumen,
  tanggalTandaTangan,
} from "@/lib/documents";
import { KopSurat, TandaTangan } from "@/components/dokumen";
import { DocToolbar } from "@/components/print-toolbar";
import { bentukInfo, kurikulumInfo } from "@/lib/konstanta";

export const dynamic = "force-dynamic";

export default async function KisiKisiPage({
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

  return (
    <>
      <style>{`@page { size: A4 landscape; margin: 10mm 10mm; }`}</style>

      <DocToolbar
        backHref={dokumenBackHref(user.role, paket.id)}
        title="Kisi-kisi Soal"
        subtitle={`${paket.mapel} · Kelas ${paket.kelas} · ${paket.tahun_ajaran}`}
      />

      <div className="sheet-wrap">
        <article className="sheet sheet-landscape">
          <KopSurat s={settings} />

          <div className="doc-title">Kisi-Kisi Soal</div>
          <div className="doc-subtitle">
            {paket.jenis_penilaian} · {paket.mapel} · Kelas {paket.kelas} ·{" "}
            {paket.tahun_ajaran}
          </div>

          <table className="doc-identitas" style={{ marginBottom: "8px" }}>
            <colgroup>
              <col style={{ width: "16%" }} />
              <col style={{ width: "2%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "2%" }} />
              <col style={{ width: "32%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td>Madrasah</td>
                <td className="sep">:</td>
                <td>{settings.nama_madrasah || "-"}</td>
                <td>Kurikulum</td>
                <td className="sep">:</td>
                <td>{info.label}</td>
              </tr>
              <tr>
                <td>Mata Pelajaran</td>
                <td className="sep">:</td>
                <td>{paket.mapel}</td>
                <td>Jumlah Butir</td>
                <td className="sep">:</td>
                <td>
                  {butir.length} butir ({jumlahSkor(butir)} skor)
                </td>
              </tr>
              <tr>
                <td>Kelas / Semester</td>
                <td className="sep">:</td>
                <td>
                  {paket.kelas} / {paket.semester}
                </td>
                <td>Guru Mata Pelajaran</td>
                <td className="sep">:</td>
                <td>{paket.guru_nama}</td>
              </tr>
              <tr>
                <td>Alokasi Waktu</td>
                <td className="sep">:</td>
                <td>{paket.alokasi_waktu || "-"}</td>
                <td>Tahun Pelajaran</td>
                <td className="sep">:</td>
                <td>{paket.tahun_ajaran}</td>
              </tr>
            </tbody>
          </table>

          <table className="doc-table">
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "27%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "5%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>No</th>
                <th>{info.kisiKolom}</th>
                <th>Materi</th>
                <th>Indikator Soal</th>
                <th>Level Kognitif</th>
                <th>Bentuk Soal</th>
                <th>No. Soal</th>
                <th>Skor</th>
              </tr>
            </thead>
            <tbody>
              {butir.length === 0 ? (
                <tr>
                  <td colSpan={8} className="center">
                    Belum ada butir soal.
                  </td>
                </tr>
              ) : (
                butir.map((item) => (
                  <tr key={item.id}>
                    <td className="center">{item.nomor}</td>
                    <td className="whitespace-pre-line">{item.acuan || "-"}</td>
                    <td>{item.materi || "-"}</td>
                    <td className="whitespace-pre-line">{item.indikator || "-"}</td>
                    <td className="center">
                      {item.level}
                      {item.hots ? (
                        <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-bold text-amber-700">
                          HOTS
                        </span>
                      ) : null}
                    </td>
                    <td className="center">
                      {bentukInfo(item.bentuk).label}
                    </td>
                    <td className="center">{item.nomor}</td>
                    <td className="center">{item.skor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <p style={{ fontSize: "9pt", marginTop: "6px" }}>
            Level kognitif: C1 mengingat, C2 memahami, C3 menerapkan, C4 menganalisis, C5
            mengevaluasi, C6 mencipta.
          </p>

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
              tanggal={tanggalTandaTangan(paket, settings)}
            />
          </div>

          {paket.status !== "disahkan" ? (
            <p className="no-print mt-3 text-center" style={{ fontSize: "9pt", color: "#92400e" }}>
              Dokumen ini belum ditandatangani kepala madrasah.
            </p>
          ) : null}
        </article>
      </div>
    </>
  );
}
