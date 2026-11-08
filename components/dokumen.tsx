import type { Settings } from "@/lib/types";

export function KopSurat({ s }: { s: Settings }) {
  return (
    <div className="kop">
      {s.logo_path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.logo_path} alt="Logo madrasah" className="kop-logo" />
      ) : (
        <div className="kop-logo kop-logo-placeholder">LOGO</div>
      )}
      <div className="kop-text">
        {s.baris1 ? <div className="kop-line1">{s.baris1}</div> : null}
        {s.baris2 ? <div className="kop-line2">{s.baris2}</div> : null}
        <div className="kop-nama">{s.nama_madrasah || "NAMA MADRASAH"}</div>
        {s.alamat ? <div className="kop-alamat">{s.alamat}</div> : null}
        {s.kontak || s.website ? (
          <div className="kop-kontak">
            {[s.kontak, s.website].filter(Boolean).join(" · ")}
          </div>
        ) : null}
      </div>
      <div className="kop-logo-spacer" aria-hidden="true" />
    </div>
  );
}

export function TandaTangan({
  label,
  nama,
  nip,
  ttd,
  tanggal,
}: {
  label: string;
  nama?: string | null;
  nip?: string | null;
  ttd?: string | null;
  tanggal?: string;
}) {
  return (
    <div className="sign-block">
      <div>{tanggal ?? "\u00A0"}</div>
      <div>{label}</div>
      {ttd ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ttd} alt={`Tanda tangan ${label}`} className="sign-img" />
      ) : (
        <div className="sign-space" />
      )}
      <div className="sign-name">{nama || ".............................."}</div>
      <div className="sign-nip">NIP. {nip || ".............................."}</div>
    </div>
  );
}
