import "server-only";
import ExcelJS from "exceljs";
import { BENTUK_LIST, HURUF_OPSI, LEVEL_KOGNITIF, HOTS_LEVELS, bentukInfo } from "./konstanta";

export type ExcelButir = {
  baris: number;
  bentuk: string;
  level: string;
  hots: number;
  skor: number;
  materi: string;
  acuan: string;
  indikator: string;
  soal: string;
  opsi: string[];
  kunci: string;
  catatan: string[];
};

const KOLOM = [
  { key: "no", header: "No", width: 5 },
  { key: "bentuk", header: "Bentuk Soal", width: 22 },
  { key: "level", header: "Level Kognitif", width: 18 },
  { key: "skor", header: "Skor", width: 7 },
  { key: "materi", header: "Materi", width: 28 },
  { key: "acuan", header: "Nilai Cinta & Capaian Pembelajaran", width: 40 },
  { key: "indikator", header: "Indikator Soal", width: 40 },
  { key: "soal", header: "Butir Soal", width: 60 },
  ...HURUF_OPSI.map((h) => ({ key: `opsi${h}`, header: `Pilihan ${h}`, width: 22 })),
  { key: "kunci", header: "Kunci Jawaban", width: 24 },
];

const ALIAS: Record<string, string> = {
  no: "no", nomor: "no",
  bentuksoal: "bentuk", bentuk: "bentuk",
  levelkognitif: "level", level: "level",
  skor: "skor", bobot: "skor", skorbobot: "skor",
  materi: "materi",
  nilaicintacapaianpembelajaran: "acuan", nilaicintadancapaianpembelajaran: "acuan",
  capaianpembelajaran: "acuan", nilaicinta: "acuan", acuan: "acuan",
  indikatorsoal: "indikator", indikator: "indikator",
  butirsoal: "soal", soal: "soal", pertanyaan: "soal",
  kuncijawaban: "kunci", kunci: "kunci",
  ...Object.fromEntries(HURUF_OPSI.flatMap((h) => [[`pilihan${h.toLowerCase()}`, `opsi${h}`], [`opsi${h.toLowerCase()}`, `opsi${h}`], [h.toLowerCase(), `opsi${h}`]])),
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function bentukDari(teks: string): string {
  const t = norm(teks);
  if (!t) return "";
  if (t.includes("kompleks") || t === "pgk") return "pgk";
  if (t.includes("pilihanganda") || t === "pg") return "pg";
  if (t.includes("benar") || t === "bs") return "bs";
  if (t.includes("jodoh")) return "menjodohkan";
  if (t.includes("isian")) return "isian";
  if (t.includes("uraian") || t.includes("esai") || t.includes("essay")) return "uraian";
  return "";
}

export async function buatTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Soal");
  ws.columns = KOLOM;
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF166534" } };
  ws.getRow(1).alignment = { vertical: "middle", wrapText: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.addRow({ no: 1, bentuk: "Pilihan Ganda", level: "C2 — Memahami", skor: 1, materi: "Thaharah", acuan: "Cinta Allah dan Rasul-Nya — peserta didik memahami tata cara bersuci", indikator: "Peserta didik dapat menentukan benda yang dapat dipakai untuk bersuci.", soal: "Air yang suci dan dapat menyucikan disebut air ....", opsiA: "mutlak", opsiB: "musta'mal", opsiC: "mutanajis", opsiD: "musyammas", kunci: "A" });
  ws.addRow({ no: 2, bentuk: "Pilihan Ganda Kompleks", level: "C4 — Menganalisis", skor: 2, materi: "Thaharah", acuan: "Cinta Ilmu", indikator: "", soal: "Manakah yang termasuk hal yang membatalkan wudu? (jawaban lebih dari satu)", opsiA: "Buang angin", opsiB: "Makan", opsiC: "Tidur nyenyak", opsiD: "Berbicara", opsiE: "Menyentuh kemaluan", kunci: "A, C, E" });
  ws.addRow({ no: 3, bentuk: "Uraian", level: "C3 — Menerapkan", skor: 5, materi: "Thaharah", acuan: "Cinta Lingkungan", indikator: "", soal: "Jelaskan urutan tata cara tayamum!", kunci: "Niat, mengusap wajah, mengusap kedua tangan sampai siku, tertib." });
  const bentukList = `"${BENTUK_LIST.map((b) => b.label).join(",")}"`;
  const levelList = `"${LEVEL_KOGNITIF.map((l) => l.label).join(",")}"`;
  for (let r = 2; r <= 300; r++) {
    ws.getCell(r, 2).dataValidation = { type: "list", allowBlank: true, formulae: [bentukList] };
    ws.getCell(r, 3).dataValidation = { type: "list", allowBlank: true, formulae: [levelList] };
    ws.getRow(r).alignment = { vertical: "top", wrapText: true };
  }
  const p = wb.addWorksheet("Petunjuk");
  p.getColumn(1).width = 110;
  [
    "PETUNJUK PENGISIAN TEMPLATE SOAL SIAJAR",
    "1. Satu baris = satu butir soal. Jangan mengubah judul kolom di baris pertama sheet \"Soal\".",
    "2. Bentuk Soal: pilih dari daftar (Pilihan Ganda, Pilihan Ganda Kompleks, Benar / Salah, Menjodohkan, Isian Singkat, Uraian).",
    "3. Level Kognitif: pilih C1–C6. C4–C6 otomatis ditandai sebagai soal HOTS.",
    "4. Pilihan A–E hanya untuk Pilihan Ganda / Pilihan Ganda Kompleks. Kunci ditulis hurufnya, misalnya B atau A, C.",
    "5. Benar / Salah: kunci diisi Benar atau Salah. Isian & Uraian: kunci berisi jawaban singkat atau rubrik.",
    "6. Indikator dan Level boleh dikosongkan; AI dapat melengkapinya saat diunggah (bisa dimatikan).",
    "7. Isi soal sebagai teks di sel. Gambar/foto yang ditempel di Excel tidak ikut dibaca.",
    "8. Hapus baris contoh sebelum mengunggah.",
  ].forEach((t, i) => (p.getCell(i + 1, 1).value = t));
  p.getRow(1).font = { bold: true };
  return Buffer.from(await wb.xlsx.writeBuffer());
}

function teksSel(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v == null) return "";
  if (typeof v === "object" && "richText" in v) return v.richText.map((r) => r.text).join("").trim();
  if (typeof v === "object" && "result" in v) return String(v.result ?? "").trim();
  if (typeof v === "object" && "text" in v) return String(v.text ?? "").trim();
  return String(cell.text ?? v).trim();
}

export async function bacaExcelSoal(data: ArrayBuffer, materiDefault: string): Promise<ExcelButir[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data);
  const ws = wb.getWorksheet("Soal") ?? wb.worksheets[0];
  if (!ws) throw new Error("SHEET_KOSONG");

  let headerRow = 0;
  let peta: Record<number, string> = {};
  for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
    const m: Record<number, string> = {};
    ws.getRow(r).eachCell((cell, col) => {
      const k = ALIAS[norm(teksSel(cell))];
      if (k) m[col] = k;
    });
    if (Object.values(m).includes("soal")) {
      headerRow = r;
      peta = m;
      break;
    }
  }
  if (!headerRow) throw new Error("HEADER_TIDAK_DITEMUKAN");

  const hasil: ExcelButir[] = [];
  for (let r = headerRow + 1; r <= ws.rowCount && hasil.length < 200; r++) {
    const row = ws.getRow(r);
    const v: Record<string, string> = {};
    for (const [col, key] of Object.entries(peta)) v[key] = teksSel(row.getCell(Number(col)));
    if (!v.soal) continue;

    const catatan: string[] = [];
    let bentuk = bentukDari(v.bentuk ?? "");
    const opsi = HURUF_OPSI.map((h) => v[`opsi${h}`] ?? "");
    if (!bentuk) {
      bentuk = opsi.filter(Boolean).length >= 2 ? "pg" : "uraian";
      catatan.push(`Bentuk soal tidak dikenali, dianggap ${bentukInfo(bentuk).label}.`);
    }
    const lv = (v.level ?? "").toUpperCase().match(/C[1-6]/);
    const level = lv ? lv[0] : "";
    let kunci = v.kunci ?? "";
    const pakaiOpsi = bentukInfo(bentuk).pakaiOpsi;
    if (pakaiOpsi) {
      if (opsi.filter(Boolean).length < 2) catatan.push("Pilihan jawaban kurang dari dua.");
      const huruf = kunci.toUpperCase().match(/\b[A-E]\b/g);
      if (huruf) kunci = bentuk === "pg" ? huruf[0] : Array.from(new Set(huruf)).join(", ");
      else if (kunci) catatan.push("Kunci sebaiknya berupa huruf pilihan (A–E).");
    }
    if (!kunci) catatan.push("Kunci jawaban kosong.");
    const skorAngka = Number(String(v.skor ?? "").replace(",", "."));

    hasil.push({
      baris: r,
      bentuk,
      level,
      hots: HOTS_LEVELS.includes(level) ? 1 : 0,
      skor: Number.isFinite(skorAngka) && skorAngka > 0 ? Math.min(100, skorAngka) : 1,
      materi: (v.materi || materiDefault).slice(0, 300),
      acuan: (v.acuan ?? "").slice(0, 1200),
      indikator: (v.indikator ?? "").slice(0, 1200),
      soal: v.soal.slice(0, 5000),
      opsi: pakaiOpsi ? opsi : ["", "", "", "", ""],
      kunci: kunci.slice(0, 2000),
      catatan,
    });
  }
  return hasil;
}
