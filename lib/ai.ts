import "server-only";
import { getAiConfig, getGeminiConfig } from "./integrations";

export type AiButirInput = {
  mapel: string;
  kelas: string;
  kurikulum: string;
  jenisPenilaian: string;
  bentuk: string;
  level: string;
  materi: string;
  acuan: string;
  indikator: string;
};

export type AiButirDraft = {
  level: string;
  indikator: string;
  soal: string;
  opsi: string[];
  kunci: string;
};

export function aiConfigured(): boolean {
  return Boolean(getGeminiConfig().apiKey || getAiConfig().apiKey);
}

const SYSTEM_PROMPT = `Anda adalah guru mata pelajaran di madrasah di Indonesia yang biasa menyusun soal asesmen. Tugas Anda membuat draf satu butir soal dari data yang diberikan guru.

Gaya penulisan yang wajib diikuti:
- Tulis dalam bahasa Indonesia yang wajar, ringkas, dan mengalir seperti guru menulis naskah soal, bukan seperti chatbot.
- Jangan memakai pembuka seperti "Tentu", "Berikut adalah", "Sebagai AI", atau penutup seperti "Semoga membantu".
- Hindari kata yang berlebihan atau bergaya promosi, misalnya "komprehensif", "holistik", "signifikan", "mendalam", kecuali memang lazim dalam pelajaran tersebut.
- Jangan memakai emoji, markdown, penomoran tambahan, atau tanda pisah berlebihan.
- Gunakan konteks yang masuk akal untuk kehidupan madrasah dan sehari-hari bila relevan, tanpa mengarang nama orang atau lembaga.
- Variasikan panjang dan pola kalimat. Pertanyaan harus jelas, tidak ambigu, dan sesuai level kognitif yang diminta.
- Indikator soal harus terukur, lazim diawali "Peserta didik dapat ..." atau pola "Disajikan ..., peserta didik dapat ...", dan mencerminkan apa yang dinilai dalam soal termasuk jawaban/kemampuan yang diharapkan bila relevan.
- Pilih level kognitif C1 sampai C6 yang paling sesuai dengan tuntutan soal dan materi.
- Pilihan jawaban harus seimbang panjangnya, distraktor masuk akal, tidak ada "semua jawaban benar", dan hanya satu jawaban benar untuk pilihan ganda biasa.
- Sesuaikan bahasa dengan mata pelajaran. Untuk Bahasa Arab, tulis teks Arab yang benar sesuai kaidah, dengan harakat secukupnya.

Balas HANYA dengan satu objek JSON valid, tanpa penjelasan dan tanpa blok kode:
{"level":"C2","indikator":"...","soal":"...","opsi":["..."],"kunci":"..."}`;

// Gemini utama, Claude cadangan
export async function callAi(
  system: string,
  user: string,
  maxTokens: number,
  timeoutMs: number
): Promise<string> {
  const gemini = getGeminiConfig();
  const claude = getAiConfig();
  if (!gemini.apiKey && !claude.apiKey) throw new Error("MISSING_AI_KEY");
  if (gemini.apiKey) {
    try {
      return await callGemini(system, user, maxTokens, timeoutMs);
    } catch (err) {
      if (!claude.apiKey) throw err;
      console.error("Gemini gagal, beralih ke Claude:", (err as Error).message.slice(0, 200));
    }
  }
  return callClaude(system, user, maxTokens, timeoutMs);
}

async function callGemini(
  system: string,
  user: string,
  maxTokens: number,
  timeoutMs: number
): Promise<string> {
  const config = getGeminiConfig();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": config.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: maxTokens * 4,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    }
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`GEMINI_HTTP_${res.status}${detail ? ": " + detail.slice(0, 300) : ""}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("");
  if (!text.trim()) throw new Error("AI_EMPTY");
  return text;
}

async function callClaude(
  system: string,
  user: string,
  maxTokens: number,
  timeoutMs: number
): Promise<string> {
  const config = getAiConfig();
  const base = config.base.replace(/\/$/, "");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: [{ type: "text", text: user }] }],
        temperature: 0.85,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`AI_HTTP_${res.status}${detail ? ": " + detail.slice(0, 300) : ""}`);
    }

    const data = (await res.json()) as {
      content?: { type?: string; text?: string }[];
    };
    const blocks = data.content ?? [];
    const textBlock = blocks.find((b) => b.type === "text");
    const content = textBlock?.text;
    if (typeof content !== "string" || !content.trim()) throw new Error("AI_EMPTY");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

const BENTUK_LABEL: Record<string, string> = {
  pg: "Pilihan Ganda",
  pgk: "Pilihan Ganda Kompleks",
  bs: "Benar / Salah",
  menjodohkan: "Menjodohkan",
  isian: "Isian Singkat",
  uraian: "Uraian",
};

function petunjukBentuk(bentuk: string): string {
  switch (bentuk) {
    case "pg":
      return "Buat 4 pilihan jawaban (A sampai D) dengan satu jawaban benar. Isi \"kunci\" dengan huruf jawaban benar, misalnya \"B\".";
    case "pgk":
      return "Buat 5 pilihan jawaban (A sampai E) dengan 2 sampai 3 jawaban benar. Isi \"kunci\" dengan huruf jawaban benar dipisah koma, misalnya \"A, C\".";
    case "bs":
      return "Buat satu pernyataan yang dapat dinilai Benar atau Salah. Isi \"opsi\" dengan array kosong dan \"kunci\" dengan \"Benar\" atau \"Salah\".";
    case "menjodohkan":
      return "Tulis soal berisi daftar pernyataan bernomor dan pilihan pasangan berhuruf di dalam teks soal. Isi \"opsi\" dengan array kosong dan \"kunci\" dengan pasangan yang benar.";
    case "isian":
      return "Buat soal isian singkat. Isi \"opsi\" dengan array kosong dan \"kunci\" dengan jawaban singkat.";
    case "uraian":
      return "Buat soal uraian. Isi \"opsi\" dengan array kosong dan \"kunci\" dengan rubrik penskoran singkat.";
    default:
      return "Buat soal pilihan ganda dengan 4 opsi dan satu kunci jawaban.";
  }
}

function buildUserPrompt(input: AiButirInput): string {
  const kurikulum =
    input.kurikulum === "kbc" ? "Kurikulum Berbasis Cinta" : "Kurikulum Merdeka";
  const lines = [
    `Mata pelajaran: ${input.mapel}`,
    `Kelas: ${input.kelas || "-"}`,
    `Kurikulum: ${kurikulum}`,
    `Jenis penilaian: ${input.jenisPenilaian || "Asesmen Sumatif"}`,
    `Bentuk soal: ${BENTUK_LABEL[input.bentuk] ?? "Pilihan Ganda"}`,
    `Level kognitif saat ini: ${input.level} (sesuaikan bila materi menuntut level lain)`,
    `Materi: ${input.materi || "-"}`,
    `Capaian pembelajaran / nilai cinta: ${input.acuan || "-"}`,
  ];
  if (input.indikator.trim()) {
    lines.push(`Indikator yang sudah ada (boleh disempurnakan): ${input.indikator}`);
  }
  lines.push("", petunjukBentuk(input.bentuk));
  return lines.join("\n");
}

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI_JSON_INVALID");
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  if (!parsed || typeof parsed !== "object") throw new Error("AI_JSON_INVALID");
  return parsed as Record<string, unknown>;
}

function bersihkanOpsi(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .map((item) => item.replace(/^\s*[A-Ea-e][.)]\s+/, "").replace(/^\s*[-•]\s+/, ""))
    .filter(Boolean)
    .slice(0, 5);
}

function normalizeDraft(
  raw: Record<string, unknown>,
  bentuk: string,
  levelAwal: string
): AiButirDraft {
  const indikator = String(raw.indikator ?? "").trim();
  const soal = String(raw.soal ?? "").trim();
  if (!indikator || !soal) throw new Error("AI_INCOMPLETE");

  let opsi = bersihkanOpsi(raw.opsi);
  let kunci = String(raw.kunci ?? "").trim();

  if (bentuk === "pg" || bentuk === "pgk") {
    if (opsi.length < 2) throw new Error("AI_INCOMPLETE");
    const cocok = opsi.findIndex(
      (item) => item.toLowerCase() === kunci.toLowerCase().replace(/[.;]+$/, "")
    );
    if (cocok >= 0) {
      kunci = "ABCDE"[cocok] ?? "";
    } else {
      const huruf = kunci.toUpperCase().match(/[A-E]/g);
      if (huruf) {
        kunci = Array.from(new Set(huruf)).join(", ");
      }
    }
    if (bentuk === "pg") {
      kunci = (kunci.split(",")[0] ?? "").trim().slice(0, 1);
    }
  } else {
    opsi = [];
    if (bentuk === "bs") {
      const teks = kunci.toLowerCase();
      if (teks.includes("salah")) kunci = "Salah";
      else if (teks.includes("benar")) kunci = "Benar";
    }
  }

  const levelDariAi = String(raw.level ?? "").toUpperCase().match(/C[1-6]/);
  const level = levelDariAi ? levelDariAi[0] : levelAwal;

  return { level, indikator, soal, opsi, kunci };
}

function mockDraft(input: { bentuk: string; level: string; materi: string; acuan: string }): AiButirDraft {
  const topik = input.materi || input.acuan || "materi";
  const pakaiOpsi = input.bentuk === "pg" || input.bentuk === "pgk";
  return {
    level: input.level,
    indikator: `Peserta didik dapat menjelaskan konsep ${topik}.`,
    soal: `Contoh soal tentang ${topik} (${Math.random().toString(36).slice(2, 7)}).`,
    opsi: pakaiOpsi ? ["Pilihan pertama", "Pilihan kedua", "Pilihan ketiga", "Pilihan keempat"] : [],
    kunci: pakaiOpsi ? "A" : input.bentuk === "bs" ? "Benar" : "Contoh kunci jawaban",
  };
}

export async function generateButirDraft(
  input: AiButirInput
): Promise<AiButirDraft> {
  if (process.env.AI_USE_MOCK === "true") return mockDraft(input);
  const content = await callAi(SYSTEM_PROMPT, buildUserPrompt(input), 1200, 55000);
  return normalizeDraft(extractJson(content), input.bentuk, input.level);
}

export type AiBatchInput = {
  mapel: string;
  kelas: string;
  kurikulum: string;
  jenisPenilaian: string;
  materi: string;
  acuan: string;
  items: { bentuk: string; level: string }[];
  hindari: string[];
};

export type AiBatchDraft = AiButirDraft & { bentuk: string };

const BATCH_SYSTEM_PROMPT = SYSTEM_PROMPT.replace(
  "membuat draf satu butir soal",
  "membuat beberapa butir soal sekaligus"
).replace(
  /Balas HANYA[\s\S]*$/,
  `- Setiap butir harus menguji aspek atau sub-materi yang berbeda. Jangan mengulang pertanyaan, konteks, atau jawaban yang sama.

Balas HANYA dengan satu objek JSON valid, tanpa penjelasan dan tanpa blok kode. Urutan butir harus sama dengan urutan permintaan:
{"butir":[{"level":"C2","indikator":"...","soal":"...","opsi":["..."],"kunci":"..."}]}`
);

function buildBatchPrompt(input: AiBatchInput): string {
  const kurikulum =
    input.kurikulum === "kbc" ? "Kurikulum Berbasis Cinta" : "Kurikulum Merdeka";
  const lines = [
    `Mata pelajaran: ${input.mapel}`,
    `Kelas: ${input.kelas || "-"}`,
    `Kurikulum: ${kurikulum}`,
    `Jenis penilaian: ${input.jenisPenilaian || "Asesmen Sumatif"}`,
    `Materi: ${input.materi || "-"}`,
    `Capaian pembelajaran / nilai cinta: ${input.acuan || "-"}`,
    "",
    `Buat tepat ${input.items.length} butir soal dengan urutan berikut:`,
  ];
  input.items.forEach((item, i) => {
    lines.push(
      `${i + 1}. ${BENTUK_LABEL[item.bentuk] ?? "Pilihan Ganda"}, level ${item.level}. ${petunjukBentuk(item.bentuk)}`
    );
  });
  if (input.hindari.length) {
    lines.push("", "Soal berikut sudah dibuat sebelumnya, jangan diulang atau dibuat mirip:");
    input.hindari.forEach((h) => lines.push(`- ${h}`));
  }
  return lines.join("\n");
}

export async function generateButirBatch(input: AiBatchInput): Promise<AiBatchDraft[]> {
  if (process.env.AI_USE_MOCK === "true") {
    return input.items.map((item) => ({
      ...mockDraft({ ...item, materi: input.materi, acuan: input.acuan }),
      bentuk: item.bentuk,
    }));
  }

  const content = await callAi(
    BATCH_SYSTEM_PROMPT,
    buildBatchPrompt(input),
    Math.min(8000, 1100 * input.items.length + 400),
    110000
  );
  const raw = extractJson(content);
  const list = Array.isArray(raw.butir) ? raw.butir : [];

  const hasil: AiBatchDraft[] = [];
  input.items.forEach((item, i) => {
    const entry = list[i];
    if (!entry || typeof entry !== "object") return;
    try {
      hasil.push({
        ...normalizeDraft(entry as Record<string, unknown>, item.bentuk, item.level),
        bentuk: item.bentuk,
      });
    } catch {
      // butir yang tidak lengkap dilewati
    }
  });
  if (hasil.length === 0) throw new Error("AI_INCOMPLETE");
  return hasil;
}
