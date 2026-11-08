import "server-only";
import { getAiConfig } from "./integrations";

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
  return Boolean(getAiConfig().apiKey);
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

export async function generateButirDraft(
  input: AiButirInput
): Promise<AiButirDraft> {
  if (process.env.AI_USE_MOCK === "true") {
    return mockDraft(input);
  }

  const config = getAiConfig();
  const apiKey = config.apiKey;
  if (!apiKey) throw new Error("MISSING_AI_KEY");

  const base = config.base.replace(/\/+$/, "");
  const model = config.model;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
        temperature: 0.85,
        top_p: 0.95,
        max_tokens: 1200,
        stream: false,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`AI_HTTP_${res.status}${detail ? ": " + detail.slice(0, 300) : ""}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("AI_EMPTY");
    }

    return normalizeDraft(extractJson(content), input.bentuk, input.level);
  } finally {
    clearTimeout(timer);
  }
}
