import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { put } from "@vercel/blob";

const ALLOWED: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

const MAX_BYTES = 3 * 1024 * 1024;

export async function saveImageUpload(
  file: File | null,
  prefix: string
): Promise<{ path?: string; error?: string }> {
  if (!file || !(file instanceof File) || file.size === 0) return {};
  if (file.size > MAX_BYTES) {
    return { error: "Ukuran gambar melebihi 3 MB." };
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    return { error: "Format gambar harus PNG, JPG, WEBP, atau SVG." };
  }
  const name = `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${name}`, buffer, {
      access: "public",
      contentType: file.type,
    });
    return { path: blob.url };
  }
  if (process.env.VERCEL) {
    return { error: "Penyimpanan file belum aktif. Hubungkan Vercel Blob ke proyek ini." };
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), buffer);
  return { path: `/uploads/${name}` };
}
