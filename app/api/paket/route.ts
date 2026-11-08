import { getDb } from "@/lib/db";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { getSettings } from "@/lib/queries";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Belum masuk." }, { status: 401 });
  }
  if (user.role !== "guru") {
    return Response.json(
      { error: "Hanya akun guru yang dapat membuat paket soal." },
      { status: 403 }
    );
  }
  if (!isSameOrigin(req)) {
    return Response.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  }

  const settings = getSettings();
  const now = new Date().toISOString();
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO paket
        (guru_id, mapel, kelas, semester, tahun_ajaran, kurikulum, jenis_penilaian,
         alokasi_waktu, petunjuk, cetak_kunci, status, created_at, updated_at)
       VALUES (?, '', '', ?, ?, 'merdeka', ?, '90 menit', ?, 0, 'draft', ?, ?)`
    )
    .run(
      user.id,
      settings.semester || "Ganjil",
      settings.tahun_ajaran || "2026/2027",
      "Asesmen Sumatif Akhir Semester",
      "1. Tulislah nama, kelas, dan nomor peserta pada lembar jawaban.\n2. Bacalah setiap butir soal dengan teliti sebelum menjawab.\n3. Kerjakan soal yang dianggap mudah terlebih dahulu.\n4. Periksa kembali pekerjaanmu sebelum diserahkan kepada pengawas.",
      now,
      now
    );

  return Response.json({ id: Number(info.lastInsertRowid) });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Belum masuk." }, { status: 401 });
  return Response.json({ ok: true });
}
