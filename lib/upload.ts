import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

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
  const dir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const name = `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, name), buffer);
  return { path: `/uploads/${name}` };
}
