import { getDb } from "./db";
import type {
  Butir,
  Paket,
  PaketRingkas,
  Role,
  Settings,
  StatusPaket,
} from "./types";

const PAKET_SELECT = `
  SELECT p.*, g.nama AS guru_nama, g.nip AS guru_nip, g.ttd_path AS guru_ttd_path,
         s.nama AS signed_nama, s.nip AS signed_nip, s.ttd_path AS signed_ttd_path
    FROM paket p
    JOIN users g ON g.id = p.guru_id
    LEFT JOIN users s ON s.id = p.signed_by
`;

export function getSettings(): Settings {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  const out: Settings = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

export function saveSettings(values: Record<string, string>) {
  const stmt = getDb().prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  for (const [key, value] of Object.entries(values)) {
    stmt.run(key, value ?? "");
  }
}

function mapPaket(row: Record<string, unknown>): Paket {
  return {
    ...(row as unknown as Paket),
    status: row.status as StatusPaket,
  };
}

export function getPaket(id: number): Paket | null {
  const row = getDb()
    .prepare(`${PAKET_SELECT} WHERE p.id = ?`)
    .get(id) as Record<string, unknown> | undefined;
  return row ? mapPaket(row) : null;
}

export function getButir(paketId: number): Butir[] {
  const rows = getDb()
    .prepare("SELECT * FROM butir WHERE paket_id = ? ORDER BY nomor ASC, id ASC")
    .all(paketId) as Record<string, unknown>[];
  return rows.map((row) => ({
    ...(row as unknown as Butir),
    opsi: safeParseOpsi(row.opsi),
    skor: Number(row.skor),
  }));
}

function safeParseOpsi(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

export function listPaket(opts: {
  guruId?: number;
  status?: StatusPaket[];
  limit?: number;
}): PaketRingkas[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.guruId) {
    where.push("p.guru_id = ?");
    params.push(opts.guruId);
  }
  if (opts.status && opts.status.length > 0) {
    where.push(`p.status IN (${opts.status.map(() => "?").join(",")})`);
    params.push(...opts.status);
  }
  const sql = `
    SELECT p.id, p.mapel, p.kelas, p.semester, p.tahun_ajaran, p.kurikulum,
           p.jenis_penilaian, p.status, p.catatan_kepala, p.updated_at,
           p.submitted_at, p.signed_at, p.guru_id, g.nama AS guru_nama,
           (SELECT COUNT(*) FROM butir b WHERE b.paket_id = p.id) AS jumlah_butir,
           (SELECT COALESCE(SUM(b.skor), 0) FROM butir b WHERE b.paket_id = p.id) AS total_skor
      FROM paket p
      JOIN users g ON g.id = p.guru_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY p.updated_at DESC
     ${opts.limit ? "LIMIT " + Number(opts.limit) : ""}
  `;
  const rows = getDb().prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map((row) => ({
    ...(row as unknown as PaketRingkas),
    jumlah_butir: Number(row.jumlah_butir),
    total_skor: Number(row.total_skor),
  }));
}

export function countUsersByRole(): Record<Role | "total", number> {
  const rows = getDb()
    .prepare("SELECT role, COUNT(*) AS n FROM users GROUP BY role")
    .all() as { role: Role; n: number }[];
  const out: Record<string, number> = { admin: 0, kepala: 0, guru: 0, total: 0 };
  for (const row of rows) {
    out[row.role] = Number(row.n);
    out.total += Number(row.n);
  }
  return out as Record<Role | "total", number>;
}

export function countPendingReset(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM reset_requests WHERE status = 'pending'")
    .get() as { n: number };
  return Number(row.n);
}

export function countPaketByStatus(): Record<string, number> {
  const rows = getDb()
    .prepare("SELECT status, COUNT(*) AS n FROM paket GROUP BY status")
    .all() as { status: string; n: number }[];
  const out: Record<string, number> = {
    draft: 0,
    diajukan: 0,
    disahkan: 0,
    dikembalikan: 0,
  };
  for (const row of rows) out[row.status] = Number(row.n);
  return out;
}

export type UserListItem = {
  id: number;
  username: string;
  nama: string;
  role: Role;
  nip: string;
  aktif: number;
  created_at: string;
  jumlah_paket: number;
};

export function listUsers(): UserListItem[] {
  return getDb()
    .prepare(
      `SELECT u.id, u.username, u.nama, u.role, u.nip, u.aktif, u.created_at,
              (SELECT COUNT(*) FROM paket p WHERE p.guru_id = u.id) AS jumlah_paket
         FROM users u
        ORDER BY CASE u.role WHEN 'admin' THEN 0 WHEN 'kepala' THEN 1 ELSE 2 END, u.nama`
    )
    .all() as unknown as UserListItem[];
}

export type ResetRequestItem = {
  id: number;
  user_id: number;
  keterangan: string;
  status: string;
  created_at: string;
  handled_at: string | null;
  username: string;
  nama: string;
};

export function listResetRequests(): ResetRequestItem[] {
  const rows = getDb()
    .prepare(
      `SELECT r.id, r.user_id, r.keterangan, r.status, r.created_at, r.handled_at,
              u.username, u.nama
         FROM reset_requests r
         JOIN users u ON u.id = r.user_id
        ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.created_at DESC
        LIMIT 50`
    )
    .all() as Record<string, unknown>[];

  // Baris node:sqlite memiliki prototype null; ubah menjadi objek biasa agar aman
  // dikirim sebagai props ke Client Component.
  return rows.map((row) => ({
    id: Number(row.id),
    user_id: Number(row.user_id),
    keterangan: String(row.keterangan ?? ""),
    status: String(row.status),
    created_at: String(row.created_at),
    handled_at: row.handled_at ? String(row.handled_at) : null,
    username: String(row.username),
    nama: String(row.nama),
  }));
}
