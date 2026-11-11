import { getCurrentUser } from "@/lib/auth";
import { callAi } from "@/lib/ai";
import { getAiConfig, getGeminiConfig, getOpenAiConfig } from "@/lib/integrations";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function hostOf(base: string): string {
  try {
    return new URL(base).host;
  } catch {
    return base;
  }
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Belum masuk." }, 401);
  if (user.role !== "admin") {
    return json({ error: "Hanya administrator yang dapat menguji koneksi AI." }, 403);
  }

  const gemini = getGeminiConfig();
  const openai = getOpenAiConfig();
  const claude = await getAiConfig();

  const providers = [
    {
      id: "gemini",
      aktif: Boolean(gemini.apiKey),
      model: gemini.apiKey ? gemini.model : "",
      host: gemini.apiKey ? "generativelanguage.googleapis.com" : "",
    },
    {
      id: "openai",
      aktif: Boolean(openai.apiKey),
      model: openai.apiKey ? openai.model : "",
      host: openai.apiKey ? hostOf(openai.base) : "",
    },
    {
      id: "claude",
      aktif: Boolean(claude.apiKey),
      model: claude.apiKey ? claude.model : "",
      host: claude.apiKey ? hostOf(claude.base) : "",
    },
  ];

  const mulai = Date.now();
  try {
    const jawaban = await callAi(
      "Anda asisten uji koneksi. Jawab sangat singkat tanpa pembuka.",
      "Balas satu kalimat pendek: koneksi AI berhasil.",
      128,
      25000
    );
    return json({
      ok: true,
      ms: Date.now() - mulai,
      providers,
      jawaban: jawaban.slice(0, 200),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Uji koneksi AI gagal:", message.slice(0, 300));
    return json(
      { ok: false, ms: Date.now() - mulai, providers, error: message.slice(0, 400) },
      502
    );
  }
}
