import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const base = String(body.base ?? "").trim();
    const model = String(body.model ?? "").trim();
    const db = getDb();
    if (base) {
      db.prepare("UPDATE integrations SET ai_api_base = ? WHERE id = 1").run(base);
    }
    if (model) {
      db.prepare("UPDATE integrations SET ai_model = ? WHERE id = 1").run(model);
    }
    return NextResponse.json({ ok: true, base, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
