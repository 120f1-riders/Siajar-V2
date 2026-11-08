"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import {
  authenticate,
  createSession,
  destroySession,
  requireUser,
} from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { saveImageUpload } from "@/lib/upload";
import type { ActionState } from "@/lib/types";

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  const result = await authenticate(username, password);
  if (result.error || !result.user) {
    return { error: result.error ?? "Gagal masuk." };
  }

  await createSession(result.user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function forgotAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  if (!username) return { error: "Masukkan username Anda." };

  const keterangan = String(formData.get("keterangan") ?? "").trim().slice(0, 300);
  const db = getDb();
  const user = await db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username) as { id: number } | undefined;

  if (user) {
    const pending = await db
      .prepare(
        "SELECT COUNT(*) AS n FROM reset_requests WHERE user_id = ? AND status = 'pending'"
      )
      .get(user.id) as { n: number };
    if (Number(pending.n) === 0) {
      await db.prepare(
        "INSERT INTO reset_requests (user_id, keterangan, status, created_at) VALUES (?, ?, 'pending', ?)"
      ).run(user.id, keterangan, new Date().toISOString());
    }
  }

  return {
    ok: true,
    message:
      "Permintaan reset password telah dikirim. Silakan hubungi administrator madrasah untuk menerima password sementara.",
  };
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const lama = String(formData.get("lama") ?? "");
  const baru = String(formData.get("baru") ?? "");
  const ulangi = String(formData.get("ulangi") ?? "");

  if (!lama || !baru) return { error: "Semua kolom wajib diisi." };
  if (baru.length < 6) return { error: "Password baru minimal 6 karakter." };
  if (baru !== ulangi) return { error: "Konfirmasi password tidak sama." };

  const db = getDb();
  const row = await db
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .get(user.id) as { password_hash: string } | undefined;
  if (!row) return { error: "Akun tidak ditemukan." };
  if (!verifyPassword(lama, row.password_hash)) {
    return { error: "Password lama salah." };
  }

  await db.prepare(
    "UPDATE users SET password_hash = ?, harus_ganti_password = 0 WHERE id = ?"
  ).run(hashPassword(baru), user.id);

  revalidatePath("/akun");
  return { ok: true, message: "Password berhasil diperbarui." };
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const nama = String(formData.get("nama") ?? "").trim();
  const nip = String(formData.get("nip") ?? "").trim();

  if (nama.length < 3) return { error: "Nama minimal 3 karakter." };
  if (nip && !/^[0-9\s./-]{4,30}$/.test(nip)) {
    return { error: "Format NIP tidak valid." };
  }

  const file = formData.get("ttd");
  const upload = file instanceof File ? await saveImageUpload(file, "ttd") : {};
  if (upload.error) return { error: upload.error };

  const db = getDb();
  if (upload.path) {
    await db.prepare(
      "UPDATE users SET nama = ?, nip = ?, ttd_path = ? WHERE id = ?"
    ).run(nama, nip, upload.path, user.id);
  } else {
    await db.prepare("UPDATE users SET nama = ?, nip = ? WHERE id = ?").run(
      nama,
      nip,
      user.id
    );
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Profil berhasil disimpan." };
}

export async function removeSignatureAction(): Promise<void> {
  const user = await requireUser();
  await getDb().prepare("UPDATE users SET ttd_path = NULL WHERE id = ?").run(user.id);
  revalidatePath("/", "layout");
  redirect("/akun?ok=ttd");
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const nama = String(formData.get("nama") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!username || !nama || !password) {
    return { error: "Semua kolom wajib diisi." };
  }
  if (password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }
  if (password !== confirm) {
    return { error: "Password dan konfirmasi password tidak sama." };
  }

  const db = getDb();
  const existing = (await db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username)) as unknown as { id: number } | undefined;

  if (existing) {
    return { error: "Username sudah digunakan." };
  }

  const role = String(formData.get("role") ?? "guru").trim().toLowerCase();
  const allowedRoles = new Set(["guru", "kepala", "admin"]);
  const finalRole = allowedRoles.has(role) ? role : "guru";

  db.prepare(
    `INSERT INTO users (username, nama, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(username, nama, finalRole, hashPassword(password), new Date().toISOString());

  return {
    ok: true,
    message:
      "Akun berhasil dibuat. Silakan masuk menggunakan username dan password yang baru dibuat.",
  };
}
