import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { bacaExcelSoal } from "@/lib/excel-soal";
import { lengkapiIndikator } from "@/lib/ai";
import { HOTS_LEVELS } from "@/lib/konstanta";

export const runtime = "nodejs";
export const maxDuration = 180;

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Belum masuk." }, 401);
  if (user.role !== "guru") return json({ error: "Hanya akun guru yang dapat mengunggah soal." }, 403);
  if (!isSameOrigin(req)) return json({ error: "Origin tidak diizinkan." }, 403);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json({ error: "Pilih file Excel terlebih dahulu." }, 400);
  if (!/\.xlsx$/i.test(file.name)) {
    return json({ error: "Format file harus .xlsx (Excel). Foto/gambar atau .xls lama tidak didukung." }, 400);
  }
  if (file.size > 5 * 1024 * 1024) return json({ error: "Ukuran file maksimal 5 MB." }, 400);

  let rows;
  try {
    rows = await bacaExcelSoal(await file.arrayBuffer(), String(form?.get("materi") ?? "").split("\n")[0].trim());
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "HEADER_TIDAK_DITEMUKAN") {
      return json({ error: "Kolom \"Butir Soal\" tidak ditemukan. Gunakan template SIAJAR." }, 400);
    }
    return json({ error: "File Excel tidak dapat dibaca. Pastikan file .xlsx tidak rusak." }, 400);
  }
  if (rows.length === 0) return json({ error: "Tidak ada soal di file. Isi kolom Butir Soal." }, 400);

  let aiInfo = "";
  const kosong = rows.filter((r) => !r.indikator || !r.level);
  if (form?.get("pakai_ai") === "1" && kosong.length) {
    const ctx = { mapel: String(form.get("mapel") ?? ""), kelas: String(form.get("kelas") ?? "") };
    let terisi = 0;
    try {
      for (let i = 0; i < kosong.length; i += 10) {
        const chunk = kosong.slice(i, i + 10);
        const hasil = await lengkapiIndikator(ctx, chunk);
        chunk.forEach((r, j) => {
          const h = hasil[j];
          if (!r.indikator && h.indikator) r.indikator = h.indikator;
          if (!r.level && h.level) r.level = h.level;
          if (h.indikator || h.level) terisi++;
        });
      }
      aiInfo = `AI melengkapi indikator/level untuk ${terisi} soal.`;
    } catch (err) {
      console.error("Lengkapi indikator gagal:", (err as Error).message.slice(0, 200));
      aiInfo = "AI tidak dapat melengkapi indikator saat ini; silakan isi manual.";
    }
  }
  rows.forEach((r) => {
    if (!r.level) r.level = "C2";
    r.hots = HOTS_LEVELS.includes(r.level) ? 1 : 0;
  });

  return json({ rows, aiInfo });
}
