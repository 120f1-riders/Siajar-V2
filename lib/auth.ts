import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { newToken, sha256, verifyPassword } from "./password";
import type { Role, SessionUser } from "./types";

export const SESSION_COOKIE = "siajar_session";
const SESSION_DAYS = 7;

export async function createSession(userId: number) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const db = getDb();
  db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)"
  ).run(sha256(token), userId, expires.toISOString());
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(
    new Date().toISOString()
  );

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  }
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, u.username, u.nama, u.role, u.nip, u.ttd_path, u.harus_ganti_password,
              s.expires_at, u.aktif
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?`
    )
    .get(sha256(token)) as
    | (SessionUser & { expires_at: string; aktif: number })
    | undefined;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
    return null;
  }
  if (!row.aktif) return null;

  return {
    id: row.id,
    username: row.username,
    nama: row.nama,
    role: row.role as Role,
    nip: row.nip,
    ttd_path: row.ttd_path,
    harus_ganti_password: row.harus_ganti_password,
  };
}

export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function authenticate(
  username: string,
  password: string
): Promise<{ user?: SessionUser; error?: string }> {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, username, nama, role, nip, ttd_path, harus_ganti_password, aktif, password_hash FROM users WHERE username = ?"
    )
    .get(username.trim().toLowerCase()) as
    | (SessionUser & { aktif: number; password_hash: string })
    | undefined;

  if (!row) return { error: "Username atau password salah." };
  if (!verifyPassword(password, row.password_hash)) {
    return { error: "Username atau password salah." };
  }
  if (!row.aktif) {
    return { error: "Akun ini sedang dinonaktifkan. Hubungi administrator." };
  }
  return {
    user: {
      id: row.id,
      username: row.username,
      nama: row.nama,
      role: row.role as Role,
      nip: row.nip,
      ttd_path: row.ttd_path,
      harus_ganti_password: row.harus_ganti_password,
    },
  };
}

/** Validasi request mutasi API berasal dari origin yang sama. */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // permintaan same-origin tanpa header (mis. non-browser)
  try {
    const host = new URL(origin).host;
    if (host === new URL(req.url).host) return true;
    if (host === req.headers.get("x-forwarded-host")) return true;
    return (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim().replace(/^\*+\./, "."))
      .some((o) => o && (o.startsWith(".") ? host.endsWith(o) : host === o));
  } catch {
    return false;
  }
}
