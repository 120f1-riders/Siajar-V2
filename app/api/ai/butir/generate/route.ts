import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { aiConfigured, generateButirBatch } from "@/lib/ai";
import { BENTUK_SOAL, LEVEL_KOGNITIF } from "@/lib/konstanta";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_PER_REQUEST = 5;

const globalForAi = globalThis as unknown as { __aiBatchBusy?: Set<number> };
const busy = (globalForAi.__aiBatchBusy ??= new Set<number>());

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
  if (!isSameOrigin(req)) return json({ error: "Origin tidak diizinkan." }, 403);
  if (!await aiConfigured() && process.env.AI_USE_MOCK !== "true") {
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

  const mapel = text(body.mapel, 120);
  const kelas = text(body.kelas, 40);
  const materi = text(body.materi, 300);
  const acuan = text(body.acuan, 1200);
  if (!mapel) return json({ error: "Mata pelajaran wajib diisi." }, 400);
  if (!kelas) return json({ error: "Kelas wajib diisi." }, 400);
  if (!materi && !acuan) {
    return json({ error: "Isi materi atau capaian pembelajaran sebagai dasar pembuatan soal." }, 400);
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0 || rawItems.length > MAX_PER_REQUEST) {
    return json({ error: `Jumlah butir per permintaan 1–${MAX_PER_REQUEST}.` }, 400);
  }
  const items = rawItems.map((raw) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    return { bentuk: text(item.bentuk, 20), level: text(item.level, 4) };
  });
  if (items.some((i) => !BENTUK_SOAL[i.bentuk] || !LEVEL_KOGNITIF.some((l) => l.id === i.level))) {
    return json({ error: "Bentuk soal atau level kognitif tidak dikenal." }, 400);
  }

  const hindari = (Array.isArray(body.hindari) ? body.hindari : [])
    .slice(-30)
    .map((h) => text(h, 160))
    .filter(Boolean);

  if (busy.has(user.id)) {
    return json({ error: "Pembuatan soal sebelumnya masih berjalan. Tunggu sebentar." }, 429);
  }
  busy.add(user.id);

  try {
    const butir = await generateButirBatch({
      mapel,
      kelas,
      kurikulum: text(body.kurikulum, 20),
      jenisPenilaian: text(body.jenis_penilaian, 160),
      materi,
      acuan,
      items,
      hindari,
    });
    return json({ butir });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Gagal membuat soal sekaligus:", message);
    if (message === "MISSING_AI_KEY") {
      return json({ error: "Kunci API AI belum diatur. Buka Pengaturan → Integrasi." }, 503);
    }
    if (error instanceof Error && error.name === "AbortError") {
      return json({ error: "Layanan AI terlalu lama merespons." }, 504);
    }
    if (message === "AI_JSON_INVALID" || message === "AI_INCOMPLETE" || error instanceof SyntaxError) {
      return json({ error: "Hasil AI tidak dapat dibaca dengan baik." }, 502);
    }
    return json({ error: "Layanan AI sedang tidak dapat digunakan. Periksa kunci API dan model." }, 502);
  } finally {
    busy.delete(user.id);
  }
}
