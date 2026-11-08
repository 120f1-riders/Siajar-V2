import { NextResponse } from "next/server";
import { callAi } from "@/lib/ai";

export async function GET() {
  try {
    const content = await callAi(
      "Anda guru mata pelajaran. Jawab sangat singkat.",
      "Sebutkan satu contoh soal matematika singkat untuk kelas 7.",
      256,
      20000
    );
    return NextResponse.json({ ok: true, content: content.slice(0, 500) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
