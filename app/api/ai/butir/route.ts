import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { aiConfigured, generateButirDraft } from "@/lib/ai";
import { BENTUK_SOAL, LEVEL_KOGNITIF } from "@/lib/konstanta";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  const mapel = text(body.mapel, 120);
  const kelas = text(body.kelas, 40);
  const materi = text(body.materi, 300);
  const acuan = text(body.acuan, 1200);
  const indikator = text(body.indikator, 1200);
  const bentuk = text(body.bentuk, 20) || "pg";
  const level = text(body.level, 10) || "C2";

  if (!mapel) return json({ error: "Mata pelajaran wajib diisi." }, 400);
  if (!materi && !acuan) {
    return json(
      { error: "Isi materi atau capaian pembelajaran sebagai dasar pembuatan soal." },
      400
    );
  }
  if (!BENTUK_SOAL[bentuk]) {
    return json({ error: "Bentuk soal tidak dikenal." }, 400);
  }
  if (!LEVEL_KOGNITIF.some((item) => item.id === level)) {
    return json({ error: "Level kognitif tidak dikenal." }, 400);
  }

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

  try {
    const draft = await generateButirDraft({
      mapel,
      kelas,
      kurikulum: text(body.kurikulum, 20),
      jenisPenilaian: text(body.jenis_penilaian, 160),
      bentuk,
      level,
      materi,
      acuan,
      indikator,
    });
    return json(draft);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Gagal membuat draf AI:", message);

    if (message === "MISSING_AI_KEY") {
      return json(
        {
          error:
            "Kunci API AI belum diatur. Buka Pengaturan → Integrasi untuk menambahkannya.",
        },
        503
      );
    }
    if (error instanceof Error && error.name === "AbortError") {
      return json(
        { error: "Layanan AI terlalu lama merespons. Coba lagi." },
        504
      );
    }
    if (message === "AI_JSON_INVALID" || message === "AI_INCOMPLETE") {
      return json(
        {
          error:
            "Draf AI tidak dapat dibaca dengan baik. Coba lagi, atau lengkapi materi dan indikator terlebih dahulu.",
        },
        502
      );
    }
    return json(
      {
        error:
          "Layanan AI sedang tidak dapat digunakan. Periksa kunci API dan nama model pada .env.local.",
      },
      502
    );
  }
}
