import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  if (!username || !password) {
    return NextResponse.json({ error: "Username dan password wajib diisi." }, { status: 400 });
  }
  const result = await authenticate(username, password);
  if (result.error || !result.user) {
    return NextResponse.json({ error: result.error ?? "Gagal masuk." }, { status: 401 });
  }
  await createSession(result.user.id);
  return NextResponse.json({ ok: true, username: result.user.username });
}

export async function DELETE() {
  const store = await import("next/headers").then((m) => m.cookies());
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
