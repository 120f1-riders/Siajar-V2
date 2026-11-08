"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { saveSettings } from "@/lib/queries";
import {
  getIntegrations,
  saveIntegrations,
  type Integrations,
} from "@/lib/integrations";
import { resetGoogleTokenCache } from "@/lib/google";
import { saveImageUpload } from "@/lib/upload";
import type { ActionState, Role } from "@/lib/types";

const ROLES: Role[] = ["admin", "kepala", "guru"];

function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}

function revalidateSemua() {
  revalidatePath("/", "layout");
}

export async function createUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser(["admin"]);

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const nama = String(formData.get("nama") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "guru");
  const nip = String(formData.get("nip") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return {
      error:
        "Username 3–32 karakter, hanya huruf kecil, angka, titik, garis bawah, atau strip.",
    };
  }
  if (nama.length < 3) return { error: "Nama lengkap minimal 3 karakter." };
  if (!isRole(roleRaw)) return { error: "Peran tidak valid." };
  if (password.length < 6) return { error: "Password minimal 6 karakter." };

  const db = getDb();
  const exists = await db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username);
  if (exists) return { error: "Username sudah digunakan." };

  await db.prepare(
    `INSERT INTO users (username, nama, role, nip, password_hash, aktif, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`
  ).run(username, nama, roleRaw, nip, hashPassword(password), new Date().toISOString());

  revalidatePath("/admin");
  redirect("/admin?ok=tambah");
}

export async function updateUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireUser(["admin"]);
  const id = Number(formData.get("id"));
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const nama = String(formData.get("nama") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "guru");
  const nip = String(formData.get("nip") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!Number.isInteger(id)) return { error: "Pengguna tidak valid." };
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return { error: "Format username tidak valid." };
  }
  if (nama.length < 3) return { error: "Nama lengkap minimal 3 karakter." };
  if (!isRole(roleRaw)) return { error: "Peran tidak valid." };
  if (password && password.length < 6) {
    return { error: "Password baru minimal 6 karakter." };
  }

  const db = getDb();
  const target = await db
    .prepare("SELECT id, role FROM users WHERE id = ?")
    .get(id) as { id: number; role: Role } | undefined;
  if (!target) return { error: "Pengguna tidak ditemukan." };

  if (target.id === admin.id && roleRaw !== "admin") {
    return { error: "Anda tidak dapat mengubah peran akun sendiri." };
  }

  if (target.role === "admin" && roleRaw !== "admin") {
    const admins = await db
      .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND aktif = 1")
      .get() as { n: number };
    if (Number(admins.n) <= 1) {
      return { error: "Minimal harus ada satu akun administrator aktif." };
    }
  }

  const taken = await db
    .prepare("SELECT id FROM users WHERE username = ? AND id <> ?")
    .get(username, id);
  if (taken) return { error: "Username sudah digunakan pengguna lain." };

  if (password) {
    await db.prepare(
      `UPDATE users SET username = ?, nama = ?, role = ?, nip = ?, password_hash = ?,
              harus_ganti_password = 1 WHERE id = ?`
    ).run(username, nama, roleRaw, nip, hashPassword(password), id);
  } else {
    await db.prepare(
      "UPDATE users SET username = ?, nama = ?, role = ?, nip = ? WHERE id = ?"
    ).run(username, nama, roleRaw, nip, id);
  }

  revalidateSemua();
  redirect("/admin?ok=ubah");
}

export async function resetUserPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser(["admin"]);
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Pengguna tidak valid." };

  const db = getDb();
  const user = await db
    .prepare("SELECT username FROM users WHERE id = ?")
    .get(id) as { username: string } | undefined;
  if (!user) return { error: "Pengguna tidak ditemukan." };

  const temp = generateTempPassword();
  await db.prepare(
    "UPDATE users SET password_hash = ?, harus_ganti_password = 1 WHERE id = ?"
  ).run(hashPassword(temp), id);

  return {
    ok: true,
    temp,
    username: user.username,
    message: "Password sementara dibuat. Sampaikan kepada pengguna.",
  };
}

export async function toggleUserActiveAction(formData: FormData): Promise<void> {
  const admin = await requireUser(["admin"]);
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id === admin.id) {
    redirect("/admin?err=self");
  }

  const db = getDb();
  const user = await db
    .prepare("SELECT role, aktif FROM users WHERE id = ?")
    .get(id) as { role: Role; aktif: number } | undefined;
  if (!user) redirect("/admin?err=notfound");

  if (user.role === "admin" && user.aktif) {
    const admins = await db
      .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND aktif = 1")
      .get() as { n: number };
    if (Number(admins.n) <= 1) redirect("/admin?err=lastadmin");
  }

  await db.prepare("UPDATE users SET aktif = ? WHERE id = ?").run(
    user.aktif ? 0 : 1,
    id
  );
  if (user.aktif) {
    await db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  }
  revalidatePath("/admin");
  redirect(`/admin/pengguna/${id}?ok=status`);
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const admin = await requireUser(["admin"]);
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id === admin.id) {
    redirect("/admin?err=self");
  }

  const db = getDb();
  const user = await db
    .prepare("SELECT role, aktif FROM users WHERE id = ?")
    .get(id) as { role: Role; aktif: number } | undefined;
  if (!user) redirect("/admin?err=notfound");

  if (user.role === "admin" && user.aktif) {
    const admins = await db
      .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND aktif = 1")
      .get() as { n: number };
    if (Number(admins.n) <= 1) redirect("/admin?err=lastadmin");
  }

  await db.batch([
    ["DELETE FROM sessions WHERE user_id = ?", id],
    ["DELETE FROM reset_requests WHERE user_id = ?", id],
    ["DELETE FROM butir WHERE paket_id IN (SELECT id FROM paket WHERE guru_id = ?)", id],
    ["DELETE FROM paket WHERE guru_id = ?", id],
    ["DELETE FROM users WHERE id = ?", id],
  ]);
  revalidatePath("/admin");
  redirect("/admin?ok=hapus");
}

export async function handleResetRequestAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireUser(["admin"]);
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Permintaan tidak valid." };

  const db = getDb();
  const request = await db
    .prepare(
      `SELECT r.id, r.status, u.id AS user_id, u.username
         FROM reset_requests r JOIN users u ON u.id = r.user_id
        WHERE r.id = ?`
    )
    .get(id) as
    | { id: number; status: string; user_id: number; username: string }
    | undefined;

  if (!request) return { error: "Permintaan tidak ditemukan." };
  if (request.status !== "pending") {
    return { error: "Permintaan ini sudah ditangani." };
  }

  const temp = generateTempPassword();
  await db.prepare(
    "UPDATE users SET password_hash = ?, harus_ganti_password = 1 WHERE id = ?"
  ).run(hashPassword(temp), request.user_id);
  await db.prepare(
    "UPDATE reset_requests SET status = 'done', handled_at = ?, handled_by = ? WHERE id = ?"
  ).run(new Date().toISOString(), admin.id, id);

  revalidatePath("/admin");
  return {
    ok: true,
    temp,
    username: request.username,
    message: "Password sementara dibuat.",
  };
}

export async function ignoreResetRequestAction(formData: FormData): Promise<void> {
  const admin = await requireUser(["admin"]);
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/admin");
  await getDb()
    .prepare(
      "UPDATE reset_requests SET status = 'ignored', handled_at = ?, handled_by = ? WHERE id = ?"
    )
    .run(new Date().toISOString(), admin.id, id);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser(["admin"]);

  const fields = [
    "baris1",
    "baris2",
    "nama_madrasah",
    "alamat",
    "kontak",
    "website",
    "kota",
    "kepala_nama",
    "kepala_nip",
    "tahun_ajaran",
    "semester",
  ];
  const values: Record<string, string> = {};
  for (const field of fields) {
    values[field] = String(formData.get(field) ?? "").trim().slice(0, 300);
  }

  if (!values.nama_madrasah) {
    return { error: "Nama madrasah wajib diisi." };
  }

  const logo = formData.get("logo");
  const ttd = formData.get("kepala_ttd");

  if (logo instanceof File) {
    const res = await saveImageUpload(logo, "logo");
    if (res.error) return { error: "Logo: " + res.error };
    if (res.path) values.logo_path = res.path;
  }
  if (ttd instanceof File) {
    const res = await saveImageUpload(ttd, "ttd-kepala");
    if (res.error) return { error: "Tanda tangan: " + res.error };
    if (res.path) values.kepala_ttd_path = res.path;
  }
  if (formData.get("hapus_logo") === "1") values.logo_path = "";
  if (formData.get("hapus_ttd") === "1") values.kepala_ttd_path = "";

  await saveSettings(values);
  revalidateSemua();
  return { ok: true, message: "Identitas madrasah dan kop surat berhasil disimpan." };
}

export async function saveIntegrationsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser(["admin"]);

  const aiKey = String(formData.get("ai_api_key") ?? "").trim();
  const aiBase = String(formData.get("ai_api_base") ?? "").trim();
  const aiModel = String(formData.get("ai_model") ?? "").trim();
  const googleClientId = String(formData.get("google_client_id") ?? "").trim();
  const googleClientSecret = String(
    formData.get("google_client_secret") ?? ""
  ).trim();

  if (aiKey.length > 500) return { error: "Kunci API AI terlalu panjang." };
  if (aiBase && !/^https?:\/\/\S+$/i.test(aiBase)) {
    return { error: "Alamat API AI harus diawali http:// atau https://." };
  }
  if (aiModel.length > 120) return { error: "Nama model maksimal 120 karakter." };
  if (googleClientId.length > 300 || googleClientSecret.length > 300) {
    return { error: "Kredensial Google terlalu panjang." };
  }
  if (formData.has("google_folder_id")) {
    const folderId = String(formData.get("google_folder_id") ?? "").trim();
    if (folderId.length > 128) return { error: "ID folder Google terlalu panjang." };
    if (folderId && !/^[-\w:]+$/.test(folderId)) return { error: "ID folder Google tidak valid." };
  }

  const before = await getIntegrations();
  const values: Partial<Integrations> = {
    ai_api_base: aiBase,
    ai_model: aiModel,
    google_client_id: googleClientId,
  };

  if (aiKey) values.ai_api_key = aiKey;
  if (formData.get("hapus_ai_key") === "1") values.ai_api_key = "";
  if (googleClientSecret) values.google_client_secret = googleClientSecret;
  if (formData.has("google_folder_id")) {
    const folderId = String(formData.get("google_folder_id") ?? "").trim();
    if (folderId) values.google_folder_id = folderId;
    else values.google_folder_id = "";
  }

  const googleChanged =
    (before.google_client_id && before.google_client_id !== googleClientId) ||
    (googleClientSecret && before.google_client_secret !== googleClientSecret) ||
    (formData.has("google_folder_id") &&
      before.google_folder_id !== String(formData.get("google_folder_id") ?? "").trim());

  if (googleChanged && before.google_refresh_token) {
    values.google_refresh_token = "";
    values.google_email = "";
    values.google_connected_at = null;
  }

  await saveIntegrations(values);
  resetGoogleTokenCache();
  revalidatePath("/admin/pengaturan");

  return {
    ok: true,
    message:
      googleChanged && before.google_refresh_token
        ? "Pengaturan disimpan. Kredensial Google berubah, hubungkan ulang akun Google."
        : "Pengaturan integrasi berhasil disimpan.",
  };
}

export async function disconnectGoogleAction(): Promise<void> {
  await requireUser(["admin"]);
  await saveIntegrations({
    google_refresh_token: "",
    google_email: "",
    google_connected_at: null,
  });
  resetGoogleTokenCache();
  revalidatePath("/admin/pengaturan");
  redirect("/admin/pengaturan?google=off");
}
