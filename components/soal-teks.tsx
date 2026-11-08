import { HURUF_OPSI, bentukInfo } from "@/lib/konstanta";
import type { Butir } from "@/lib/types";

export function SoalTeks({
  butir,
  nomor = true,
}: {
  butir: Butir;
  nomor?: boolean;
}) {
  const bentuk = bentukInfo(butir.bentuk);
  const opsi =
    butir.bentuk === "bs"
      ? ["Benar", "Salah"]
      : butir.bentuk === "pg" || butir.bentuk === "pgk"
        ? butir.opsi.filter((item) => item.trim() !== "")
        : [];
  const tampilOpsi = opsi.length > 0;

  return (
    <div className="soal-item">
      <div className="soal-nomor">{nomor ? `${butir.nomor}.` : ""}</div>
      <div className="soal-body">
        <div className="whitespace-pre-line">
          {butir.soal.trim() || "(butir soal belum diisi)"}
        </div>
        {tampilOpsi ? (
          <div className={opsi.length > 2 ? "opsi-grid" : ""}>
            {opsi.map((item, index) => (
              <div key={index} className="opsi-item">
                <span className="opsi-label">{HURUF_OPSI[index]}.</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        ) : null}
        {bentuk.id === "pgk" ? (
          <div className="mt-0.5 italic" style={{ fontSize: "9pt" }}>
            (Pilih lebih dari satu jawaban yang benar)
          </div>
        ) : null}
      </div>
    </div>
  );
}
