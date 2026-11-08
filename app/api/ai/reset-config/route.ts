import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST() {
  if (process.env.VERCEL) return new Response("Not found", { status: 404 });
  try {
    const db = getDb();
    await db.prepare("UPDATE integrations SET ai_api_base = NULL, ai_model = NULL WHERE id = 1").run();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
