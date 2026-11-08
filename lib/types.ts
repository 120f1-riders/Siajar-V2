export type Role = "admin" | "kepala" | "guru";

export type SessionUser = {
  id: number;
  username: string;
  nama: string;
  role: Role;
  nip: string;
  ttd_path: string | null;
  harus_ganti_password: number;
};

export type UserRow = SessionUser & {
  password_hash: string;
  aktif: number;
  created_at: string;
};

export type StatusPaket = "draft" | "diajukan" | "disahkan" | "dikembalikan";

export type BentukSoal = "pg" | "pgk" | "bs" | "menjodohkan" | "isian" | "uraian";

export type Butir = {
  id: number;
  paket_id: number;
  nomor: number;
  bentuk: BentukSoal;
  materi: string;
  acuan: string;
  indikator: string;
  level: string;
  soal: string;
  opsi: string[];
  kunci: string;
  skor: number;
};

export type Paket = {
  id: number;
  guru_id: number;
  mapel: string;
  kelas: string;
  semester: string;
  tahun_ajaran: string;
  kurikulum: string;
  jenis_penilaian: string;
  alokasi_waktu: string;
  petunjuk: string;
  cetak_kunci: number;
  status: StatusPaket;
  catatan_kepala: string | null;
  signed_by: number | null;
  signed_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  guru_nama: string;
  guru_nip: string | null;
  guru_ttd_path: string | null;
  signed_nama: string | null;
  signed_nip: string | null;
  signed_ttd_path: string | null;
};

export type PaketRingkas = {
  id: number;
  mapel: string;
  kelas: string;
  semester: string;
  tahun_ajaran: string;
  kurikulum: string;
  jenis_penilaian: string;
  status: StatusPaket;
  catatan_kepala: string | null;
  updated_at: string;
  submitted_at: string | null;
  signed_at: string | null;
  guru_id: number;
  guru_nama: string;
  jumlah_butir: number;
  total_skor: number;
};

export type Settings = Record<string, string>;

export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  temp?: string;
  username?: string;
} | null;
