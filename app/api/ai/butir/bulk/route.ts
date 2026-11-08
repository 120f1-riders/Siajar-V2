import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { aiConfigured, generateButirDraft } from "@/lib/ai";
import { BENTUK_SOAL, LEVEL_KOGNITIF } from "@/lib/konstanta";

export const runtime = "nodejs";
export const maxDuration = 180;

const COOLDOWN_MS = 4000;

const globalForAi = globalThis as unknown as {
  __aiButirLast?: Map<number, number>;
};
const lastUse = (globalForAi.__aiButirLast ??= new Map<number, number>());

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function text(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Belum masuk." }, 401);
  if (user.role !== "guru") {
    return json({ error: "Fitur bantuan AI hanya tersedia untuk akun guru." }, 403);
  }
  if (!isSameOrigin(req)) {
    return json({ error: "Origin tidak diizinkan." }, 403);
  }
  if (!await aiConfigured()) {
    return json(
      {
        error:
          "Fitur AI belum dikonfigurasi. Administrator dapat mengisi kunci API di Pengaturan → Integrasi.",
      },
      503
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Permintaan tidak valid." }, 400);
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return json({ error: "Tidak ada butir yang dipilih." }, 400);
  }
  if (items.length > 50) {
    return json({ error: "Maksimal 50 butir dalam satu permintaan." }, 400);
  }

  const mapel = text(body.mapel, 120);
  const kelas = text(body.kelas, 40);
  const kurikulum = text(body.kurikulum, 20);
  const jenisPenilaian = text(body.jenis_penilaian, 160);

  if (!mapel) return json({ error: "Mata pelajaran wajib diisi." }, 400);
  if (!kelas) return json({ error: "Kelas wajib diisi." }, 400);

  const now = Date.now();
  const last = lastUse.get(user.id) ?? 0;
  if (now - last < COOLDOWN_MS) {
    const sisa = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
    return json(
      { error: `Tunggu ${sisa} detik sebelum membuat draf berikutnya.` },
      429
    );
  }
  lastUse.set(user.id, now);

  const results: Array<{
    index: number;
    ok: boolean;
    level?: string;
    indikator?: string;
    soal?: string;
    opsi?: string[];
    kunci?: string;
    error?: string;
  }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown> | undefined;
    if (!item) {
      results.push({ index: i, ok: false, error: "Data butir tidak valid." });
      continue;
    }

    const bentuk = text(item.bentuk, 20) || "pg";
    const level = text(item.level, 10) || "C2";
    const materi = text(item.materi, 300);
    const acuan = text(item.acuan, 1200);
    const indikator = text(item.indikator, 1200);

    if (!BENTUK_SOAL[bentuk]) {
      results.push({ index: i, ok: false, error: "Bentuk soal tidak dikenal." });
      continue;
    }
    if (!LEVEL_KOGNITIF.some((l) => l.id === level)) {
      results.push({ index: i, ok: false, error: "Level kognitif tidak dikenal." });
      continue;
    }
    if (!materi && !acuan) {
      results.push({
        index: i,
        ok: false,
        error: "Isi materi atau capaian pembelajaran sebagai dasar pembuatan soal.",
      });
      continue;
    }

    try {
      const draft = await generateButirDraft({
        mapel,
        kelas,
        kurikulum,
        jenisPenilaian,
        bentuk,
        level,
        materi,
        acuan,
        indikator,
      });

      results.push({
        index: i,
        ok: true,
        level: draft.level,
        indikator: draft.indikator,
        soal: draft.soal,
        opsi: draft.opsi,
        kunci: draft.kunci,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Gagal membuat draf AI butir ${i + 1}:`, message);

      if (message === "MISSING_AI_KEY") {
        results.push({
          index: i,
          ok: false,
          error: "Kunci API AI belum diatur.",
        });
        break;
      }
      if (error instanceof Error && error.name === "AbortError") {
        results.push({ index: i, ok: false, error: "Layanan AI terlalu lama merespons." });
        break;
      }
      if (message === "AI_JSON_INVALID" || message === "AI_INCOMPLETE") {
        results.push({
          index: i,
          ok: false,
          error: "Draf AI tidak dapat dibaca dengan baik.",
        });
        continue;
      }
      results.push({ index: i, ok: false, error: "Layanan AI sedang tidak dapat digunakan." });
      break;
    }
  }

  const berhasil = results.filter((r) => r.ok).length;
  const gagal = results.filter((r) => !r.ok).length;

  return json(
    {
      results,
      summary: {
        total: items.length,
        berhasil,
        gagal,
      },
    },
    gagal > 0 && berhasil === 0 ? 422 : 200
  );
}
