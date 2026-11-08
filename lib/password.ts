import crypto from "node:crypto";

/** Format simpanan: "scrypt$<salt hex>$<hash hex>". */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Password sementara yang mudah dibacakan ke pengguna. */
export function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[crypto.randomInt(alphabet.length)];
  }
  return out;
}

export function newToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
