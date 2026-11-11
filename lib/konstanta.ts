export const MAPEL_LAINNYA = "__lainnya__";

export const MAPEL_UMUM = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Ilmu Pengetahuan Alam (IPA)",
  "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
  "Ilmu Pengetahuan Sosial (IPS)",
  "Pendidikan Pancasila",
  "Pendidikan Kewarganegaraan (PPKn)",
  "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",
  "Seni Budaya",
  "Seni Musik",
  "Seni Rupa",
  "Seni Tari",
  "Seni Teater",
  "Prakarya",
  "Informatika",
  "Koding dan Kecerdasan Artifisial",
  "Projek Ilmiah",
  "Bimbingan dan Konseling",
  "Muatan Lokal",
  "Sejarah",
  "Sejarah Indonesia",
  "Geografi",
  "Ekonomi",
  "Sosiologi",
  "Antropologi",
  "Fisika",
  "Kimia",
  "Biologi",
  "Matematika Peminatan",
  "Bahasa Indonesia Peminatan",
  "Bahasa Inggris Peminatan",
];

export const MAPEL_MADRASAH = [
  "Al-Qur'an Hadis",
  "Akidah Akhlak",
  "Fikih",
  "Sejarah Kebudayaan Islam (SKI)",
  "Bahasa Arab",
  "Ilmu Tafsir",
  "Ilmu Hadis",
  "Ushul Fikih",
  "Ilmu Kalam",
  "Tasawuf",
  "Tafsir",
  "Hadis",
  "Nahwu",
  "Sharaf",
  "Balaghah",
  "Faraid",
  "Ilmu Falak",
  "Tahfiz Al-Qur'an",
  "Pendidikan Agama Islam (PAI)",
  "Pendidikan Agama Islam dan Budi Pekerti (PABP)",
  "Bahasa Arab Peminatan",
];

export const MAPEL_SEMUA = [...MAPEL_UMUM, ...MAPEL_MADRASAH];

export const KELAS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

export const JENIS_PENILAIAN = [
  "Asesmen Sumatif Akhir Semester",
  "Asesmen Sumatif Tengah Semester",
  "Asesmen Sumatif Akhir Tahun",
  "Ujian Madrasah",
  "Penilaian Akhir Semester",
  "Penilaian Tengah Semester",
  "Ulangan Harian",
  "Asesmen Formatif",
];

export type KurikulumInfo = {
  id: string;
  label: string;
  short: string;
  acuanLabel: string;
  acuanPlaceholder: string;
  kisiKolom: string;
  deskripsi: string;
};

export const KURIKULUM: Record<string, KurikulumInfo> = {
  merdeka: {
    id: "merdeka",
    label: "Kurikulum Merdeka",
    short: "Merdeka",
    acuanLabel: "Capaian Pembelajaran / Tujuan Pembelajaran",
    acuanPlaceholder:
      "Contoh: Peserta didik mampu menganalisis bentuk aljabar dan menyelesaikan masalah kontekstual.",
    kisiKolom: "Capaian Pembelajaran / Tujuan Pembelajaran",
    deskripsi:
      "Kisi-kisi mengacu pada capaian pembelajaran (CP) dan tujuan pembelajaran (TP) serta level kognitif C1–C6.",
  },
  kbc: {
    id: "kbc",
    label: "Kurikulum Berbasis Cinta",
    short: "KBC",
    acuanLabel: "Nilai Cinta & Capaian Pembelajaran",
    acuanPlaceholder:
      "Contoh: Cinta Ilmu — peserta didik mampu menjelaskan kedudukan ilmu dalam Islam dan mengamalkannya.",
    kisiKolom: "Nilai Cinta & Capaian Pembelajaran",
    deskripsi:
      "Kisi-kisi mengacu pada nilai-nilai cinta (cinta Allah dan Rasul, cinta ilmu, cinta diri dan sesama, cinta lingkungan, cinta tanah air).",
  },
};

export function kurikulumInfo(id: string): KurikulumInfo {
  return KURIKULUM[id] ?? KURIKULUM.merdeka;
}

export const NILAI_CINTA = [
  "Cinta Allah dan Rasul-Nya",
  "Cinta Ilmu",
  "Cinta Diri dan Sesama",
  "Cinta Lingkungan",
  "Cinta Tanah Air",
];

export type BentukInfo = {
  id: string;
  label: string;
  singkat: string;
  pakaiOpsi: boolean;
  keterangan?: string;
};

export const BENTUK_SOAL: Record<string, BentukInfo> = {
  pg: {
    id: "pg",
    label: "Pilihan Ganda",
    singkat: "PG",
    pakaiOpsi: true,
    keterangan: "Satu jawaban benar.",
  },
  pgk: {
    id: "pgk",
    label: "Pilihan Ganda Kompleks",
    singkat: "PGK",
    pakaiOpsi: true,
    keterangan: "Jawaban benar lebih dari satu.",
  },
  bs: {
    id: "bs",
    label: "Benar / Salah",
    singkat: "B/S",
    pakaiOpsi: false,
  },
  menjodohkan: {
    id: "menjodohkan",
    label: "Menjodohkan",
    singkat: "Jodoh",
    pakaiOpsi: false,
  },
  isian: {
    id: "isian",
    label: "Isian Singkat",
    singkat: "Isian",
    pakaiOpsi: false,
  },
  uraian: {
    id: "uraian",
    label: "Uraian",
    singkat: "Uraian",
    pakaiOpsi: false,
  },
};

export const BENTUK_LIST = [
  BENTUK_SOAL.pg,
  BENTUK_SOAL.pgk,
  BENTUK_SOAL.bs,
  BENTUK_SOAL.menjodohkan,
  BENTUK_SOAL.isian,
  BENTUK_SOAL.uraian,
];

export function bentukInfo(id: string): BentukInfo {
  return BENTUK_SOAL[id] ?? BENTUK_SOAL.pg;
}

export const LEVEL_KOGNITIF = [
  { id: "C1", label: "C1 — Mengingat" },
  { id: "C2", label: "C2 — Memahami" },
  { id: "C3", label: "C3 — Menerapkan" },
  { id: "C4", label: "C4 — Menganalisis" },
  { id: "C5", label: "C5 — Mengevaluasi" },
  { id: "C6", label: "C6 — Mencipta" },
];

export const HOTS_LEVELS = ["C4", "C5", "C6"];

export function isHotsLevel(level: string): boolean {
  return HOTS_LEVELS.includes(level);
}

export function levelLabel(id: string): string {
  const found = LEVEL_KOGNITIF.find((l) => l.id === id);
  return found ? found.label : id || "-";
}

export const STATUS_META: Record<
  string,
  { label: string; badge: string; hint: string }
> = {
  draft: {
    label: "Draf",
    badge: "badge-draft",
    hint: "Masih dapat diubah dan belum diajukan kepada kepala madrasah.",
  },
  diajukan: {
    label: "Menunggu Tanda Tangan",
    badge: "badge-diajukan",
    hint: "Sudah diajukan dan sedang menunggu pengesahan kepala madrasah.",
  },
  disahkan: {
    label: "Disahkan",
    badge: "badge-disahkan",
    hint: "Telah ditandatangani kepala madrasah. Dokumen siap dicetak.",
  },
  dikembalikan: {
    label: "Dikembalikan",
    badge: "badge-dikembalikan",
    hint: "Dikembalikan kepala madrasah untuk diperbaiki.",
  },
};

export const HURUF_OPSI = ["A", "B", "C", "D", "E"];
